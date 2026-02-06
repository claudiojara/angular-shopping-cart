import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FlowWebhookPayload {
  token: string;
  flowOrder?: number;
  status?: number;
  commerceOrder?: string;
  requestDate?: string;
  amount?: number;
  payer?: string;
  paymentMethod?: number;
  [key: string]: string | number | undefined;
}

/**
 * Verifies Flow webhook signature
 */
async function verifyFlowSignature(
  params: Record<string, string | number>,
  receivedSignature: string,
): Promise<boolean> {
  const secret = Deno.env.get('FLOW_SECRET_KEY');
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
  const calculatedSignature = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return calculatedSignature === receivedSignature;
}

/**
 * Maps Flow payment method codes to readable strings
 */
function mapPaymentMethod(code?: number): string {
  const methods: Record<number, string> = {
    1: 'Webpay',
    2: 'Servipag',
    3: 'Multicaja',
    4: 'Khipu',
    9: 'Todos los Medios',
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse form data from Flow
    const formData = await req.formData();
    const params: Record<string, string | number> = {};

    for (const [key, value] of formData.entries()) {
      // Convert numeric strings to numbers
      if (!isNaN(Number(value))) {
        params[key] = Number(value);
      } else {
        params[key] = value.toString();
      }
    }

    console.log('Flow webhook received:', params);

    // Verify signature
    const receivedSignature = params['s'] as string;
    if (!receivedSignature) {
      throw new Error('Missing signature in webhook');
    }

    const isValid = await verifyFlowSignature(params, receivedSignature);
    if (!isValid) {
      console.error('Invalid Flow signature');
      throw new Error('Invalid signature');
    }

    // Extract webhook data
    const token = params['token'] as string;
    const flowOrder = params['flowOrder'] as number;
    const status = params['status'] as number; // 1=pending, 2=approved, 3=rejected, 4=cancelled
    const commerceOrder = params['commerceOrder'] as string;
    const paymentMethod = params['paymentMethod'] as number;

    if (!token || !commerceOrder) {
      throw new Error('Missing required webhook data');
    }

    // Create Supabase admin client (no user context needed)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find order by commerce order ID (our order.id)
    const orderId = parseInt(commerceOrder);
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderId);
      throw new Error('Order not found');
    }

    // Verify flow_token matches
    if (order.flow_token !== token) {
      console.error('Token mismatch');
      throw new Error('Token mismatch');
    }

    // Map Flow status to our order status
    let orderStatus: string;
    switch (status) {
      case 2: // Approved
        orderStatus = 'paid';
        break;
      case 3: // Rejected
        orderStatus = 'failed';
        break;
      case 4: // Cancelled
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw new Error('Failed to update order');
    }

    // If payment successful, reduce product stock
    if (orderStatus === 'paid') {
      await reduceProductStock(supabase, orderId);
      console.log(`Order ${orderId} marked as paid, stock reduced`);
    }

    // Return 200 OK to Flow (required)
    return new Response('OK', {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in flow-webhook:', error);

    // Still return 200 to Flow to avoid retries
    // Log error for manual review
    return new Response('OK', {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      status: 200,
    });
  }
});
