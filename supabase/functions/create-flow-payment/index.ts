import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-user-token',
};

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
  const secret = Deno.env.get('FLOW_SECRET_KEY');
  if (!secret) {
    throw new Error('FLOW_SECRET_KEY not configured');
  }

  // Sort params alphabetically and concatenate
  const sortedKeys = Object.keys(params).sort();
  const data = sortedKeys.map((key) => `${key}${params[key]}`).join('');

  // Generate HMAC-SHA256 signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Calls Flow API to create payment session
 */
async function createFlowPayment(paymentData: FlowPaymentRequest): Promise<FlowPaymentResponse> {
  const apiKey = Deno.env.get('FLOW_API_KEY');
  const apiUrl = Deno.env.get('FLOW_API_URL') || 'https://sandbox.flow.cl/api';

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

  const result = await response.json();
  return result;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📝 Request received');

    // Parse request body
    const { orderId }: CreatePaymentRequest = await req.json();

    if (!orderId) {
      console.error('❌ Missing orderId');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'orderId is required',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      );
    }

    console.log('🛒 Processing payment for order:', orderId);

    // Create Supabase admin client (bypasses ALL JWT validation)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey =
      Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    console.log('🔐 Admin client created');

    console.log('🛒 Fetching order:', orderId);

    // Fetch order from database (RLS will ensure user can only access their own orders)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('❌ Order fetch error:', orderError.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Order not found or access denied',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        },
      );
    }

    if (!order) {
      console.error('❌ Order not found');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Order not found',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        },
      );
    }

    console.log('✅ Order found:', order.id);
    console.log('📦 Order status:', order.status);
    console.log('💰 Order total:', order.total_amount);

    // Validate order status
    if (order.status !== 'pending') {
      throw new Error(`Order status is ${order.status}, cannot initiate payment`);
    }

    // Get webhook URL from environment
    const webhookUrl = Deno.env.get('FLOW_WEBHOOK_URL');
    const returnUrl = Deno.env.get('FLOW_RETURN_URL');

    if (!webhookUrl || !returnUrl) {
      throw new Error('Flow URLs not configured');
    }

    // Prepare payment data
    const paymentData: FlowPaymentRequest = {
      commerceOrder: order.id.toString(),
      subject: `Orden #${order.id} - Forja del Destino`,
      currency: 'CLP',
      amount: Math.round(order.total_amount), // Amount is already in CLP pesos
      email: order.shipping_email,
      urlConfirmation: webhookUrl,
      urlReturn: returnUrl, // Flow will append ?token=XXXXX automatically
    };

    // Create Flow payment
    const flowResponse = await createFlowPayment(paymentData);

    // Save Flow data to order
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        flow_order_id: flowResponse.flowOrder,
        flow_token: flowResponse.token,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order with Flow data:', updateError);
      throw new Error('Failed to save Flow payment data');
    }

    // Return payment URL
    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: flowResponse.url + '?token=' + flowResponse.token,
        flowOrderId: flowResponse.flowOrder,
        token: flowResponse.token,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in create-flow-payment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
