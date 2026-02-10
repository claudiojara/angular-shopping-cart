import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createClient } from '@supabase/supabase-js';

/**
 * Azure Function to create Flow payment
 * Replaces Supabase Edge Function that has authentication issues
 */

interface CreatePaymentRequest {
  orderId: number;
}

interface FlowPaymentRequest {
  commerceOrder: string;
  subject: string;
  currency: string;
  amount: number;
  email: string;
  urlConfirmation: string;
  urlReturn: string;
}

interface FlowPaymentResponse {
  url: string;
  token: string;
  flowOrder: number;
}

/**
 * Generates Flow API signature using HMAC-SHA256
 */
async function generateFlowSignature(params: Record<string, string | number>): Promise<string> {
  const secret = process.env.FLOW_SECRET_KEY;
  if (!secret) {
    throw new Error('FLOW_SECRET_KEY not configured');
  }

  // Sort params alphabetically and concatenate
  const sortedKeys = Object.keys(params).sort();
  const data = sortedKeys.map((key) => `${key}${params[key]}`).join('');

  // Generate HMAC-SHA256 signature
  const crypto = await import('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  return hmac.digest('hex');
}

/**
 * Calls Flow API to create payment session
 */
async function createFlowPayment(paymentData: FlowPaymentRequest): Promise<FlowPaymentResponse> {
  const apiKey = process.env.FLOW_API_KEY;
  const apiUrl = process.env.FLOW_API_URL || 'https://sandbox.flow.cl/api';

  if (!apiKey) {
    throw new Error('FLOW_API_KEY not configured');
  }

  // Prepare params for signature
  const params = {
    apiKey,
    commerceOrder: paymentData.commerceOrder,
    subject: paymentData.subject,
    currency: paymentData.currency,
    amount: paymentData.amount,
    email: paymentData.email,
    urlConfirmation: paymentData.urlConfirmation,
    urlReturn: paymentData.urlReturn,
  };

  // Generate signature
  const signature = await generateFlowSignature(params);

  // Build form data
  const formData = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    formData.append(key, value.toString());
  });
  formData.append('s', signature);

  // Call Flow API
  const response = await fetch(`${apiUrl}/payment/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Flow API error:', errorText);
    throw new Error(`Flow API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

export async function createFlowPaymentHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log('🔔 Create Flow Payment request received');

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return {
      status: 200,
      headers: corsHeaders,
      body: 'OK',
    };
  }

  try {
    // Parse request body
    const body = (await request.json()) as CreatePaymentRequest;
    const { orderId } = body;

    if (!orderId) {
      return {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'orderId is required',
        }),
      };
    }

    context.log('🛒 Processing payment for order:', orderId);

    // Create Supabase admin client
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch order from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      context.error('Order not found:', orderId, orderError);
      return {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Order not found',
        }),
      };
    }

    context.log('✅ Order found:', order.id, 'Total:', order.total_amount);

    // Validate order status
    if (order.status !== 'pending') {
      return {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: `Order status is ${order.status}, cannot initiate payment`,
        }),
      };
    }

    // Get webhook URL from environment
    const webhookUrl = process.env.FLOW_WEBHOOK_URL;
    const returnUrl = process.env.FLOW_RETURN_URL;

    if (!webhookUrl || !returnUrl) {
      throw new Error('Flow URLs not configured');
    }

    // Validate amount is positive
    if (order.total_amount <= 0) {
      return {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Order amount must be greater than 0',
        }),
      };
    }

    // Prepare payment data
    const paymentData: FlowPaymentRequest = {
      commerceOrder: order.id.toString(),
      subject: `Orden #${order.id} - Forja del Destino`,
      currency: 'CLP',
      amount: Math.round(order.total_amount),
      email: order.shipping_email,
      urlConfirmation: webhookUrl,
      urlReturn: returnUrl,
    };

    context.log('💳 Creating Flow payment...');

    // Create Flow payment
    const flowResponse = await createFlowPayment(paymentData);

    context.log('✅ Flow payment created:', flowResponse.flowOrder);

    // Save Flow data to order
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        flow_order_id: flowResponse.flowOrder,
        flow_token: flowResponse.token,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      context.error('Error updating order with Flow data:', updateError);
      throw new Error('Failed to save Flow payment data');
    }

    // Return payment URL
    return {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        paymentUrl: flowResponse.url + '?token=' + flowResponse.token,
        flowOrderId: flowResponse.flowOrder,
        token: flowResponse.token,
      }),
    };
  } catch (error) {
    context.error('❌ Error in create-flow-payment:', error);
    return {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
    };
  }
}

app.http('create-flow-payment', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: createFlowPaymentHandler,
  route: 'create-flow-payment',
});
