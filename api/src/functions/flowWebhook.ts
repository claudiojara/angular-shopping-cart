import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createClient } from '@supabase/supabase-js';

/**
 * Flow Webhook Handler for Azure Functions
 * Receives payment confirmations from Flow.cl and updates orders in Supabase
 */

interface FlowWebhookPayload {
  token: string;
  flowOrder?: string;
  status?: string;
  commerceOrder?: string;
  requestDate?: string;
  amount?: string;
  payer?: string;
  paymentMethod?: string;
  s: string; // Signature
}

/**
 * Verifies Flow webhook signature using HMAC-SHA256
 */
async function verifyFlowSignature(
  params: Record<string, string>,
  receivedSignature: string,
): Promise<boolean> {
  const secret = process.env.FLOW_SECRET_KEY;
  if (!secret) {
    throw new Error('FLOW_SECRET_KEY not configured');
  }

  // Remove signature from params
  const paramsWithoutSignature = { ...params };
  delete paramsWithoutSignature['s'];

  // Sort params alphabetically and concatenate
  const sortedKeys = Object.keys(paramsWithoutSignature).sort();
  const data = sortedKeys.map((key) => `${key}${paramsWithoutSignature[key]}`).join('');

  // Generate HMAC-SHA256 signature
  const crypto = await import('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  const calculatedSignature = hmac.digest('hex');

  return calculatedSignature === receivedSignature;
}

/**
 * Maps Flow payment method codes to readable strings
 */
function mapPaymentMethod(code?: string): string {
  const methods: Record<string, string> = {
    '1': 'Webpay',
    '2': 'Servipag',
    '3': 'Multicaja',
    '4': 'Khipu',
    '9': 'Todos los Medios',
  };
  return code ? methods[code] || 'Desconocido' : 'Desconocido';
}

/**
 * Reduces product stock after successful payment
 */
async function reduceProductStock(supabase: any, orderId: number): Promise<void> {
  try {
    // Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (itemsError || !orderItems) {
      console.error('Error fetching order items:', itemsError);
      return;
    }

    // Reduce stock for each product
    for (const item of orderItems) {
      const { error: stockError } = await supabase.rpc('reduce_product_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      });

      if (stockError) {
        console.error(`Error reducing stock for product ${item.product_id}:`, stockError);
      }
    }
  } catch (error) {
    console.error('Error in reduceProductStock:', error);
  }
}

export async function flowWebhook(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log('🔔 Flow webhook received');

  try {
    // Parse form data from Flow
    const formData = await request.formData();
    const params: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    context.log('Webhook data:', params);

    // Verify signature
    const receivedSignature = params['s'];
    if (!receivedSignature) {
      throw new Error('Missing signature in webhook');
    }

    const isValid = await verifyFlowSignature(params, receivedSignature);
    if (!isValid) {
      context.error('❌ Invalid Flow signature');
      throw new Error('Invalid signature');
    }

    context.log('✅ Signature verified');

    // Extract webhook data
    const token = params['token'];
    const flowOrder = params['flowOrder'];
    const status = params['status']; // 1=pending, 2=approved, 3=rejected, 4=cancelled
    const commerceOrder = params['commerceOrder'];
    const paymentMethod = params['paymentMethod'];

    if (!token || !commerceOrder) {
      throw new Error('Missing required webhook data');
    }

    // Create Supabase admin client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find order by commerce order ID (our order.id)
    const orderId = parseInt(commerceOrder);
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      context.error('Order not found:', orderId);
      throw new Error('Order not found');
    }

    // Verify flow_token matches
    if (order.flow_token !== token) {
      context.error('Token mismatch');
      throw new Error('Token mismatch');
    }

    // Map Flow status to our order status
    let orderStatus: string;
    switch (status) {
      case '2': // Approved
        orderStatus = 'paid';
        break;
      case '3': // Rejected
        orderStatus = 'failed';
        break;
      case '4': // Cancelled
        orderStatus = 'cancelled';
        break;
      default:
        orderStatus = 'pending';
    }

    // Update order in database
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: orderStatus,
        payment_method: mapPaymentMethod(paymentMethod),
        payment_date: orderStatus === 'paid' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      context.error('Error updating order:', updateError);
      throw new Error('Failed to update order');
    }

    // If payment successful, reduce product stock
    // Only reduce if order wasn't already paid (idempotency)
    if (orderStatus === 'paid' && order.status !== 'paid') {
      await reduceProductStock(supabase, orderId);
      context.log(`✅ Order ${orderId} marked as paid, stock reduced`);
    } else if (orderStatus === 'paid' && order.status === 'paid') {
      context.log(`ℹ️ Order ${orderId} already paid, skipping stock reduction`);
    }

    // Return 200 OK to Flow (required)
    return {
      status: 200,
      body: 'OK',
    };
  } catch (error) {
    context.error('❌ Error in flow-webhook:', error);

    // Still return 200 to Flow to avoid retries
    return {
      status: 200,
      body: 'OK',
    };
  }
}

app.http('flow-webhook', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: flowWebhook,
  route: 'flow-webhook',
});
