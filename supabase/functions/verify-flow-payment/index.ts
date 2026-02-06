import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyPaymentRequest {
  token: string;
}

interface FlowPaymentStatus {
  flowOrder: number;
  commerceOrder: string;
  requestDate: string;
  status: number; // 1=pending, 2=approved, 3=rejected, 4=cancelled
  subject: string;
  currency: string;
  amount: number;
  payer: string;
  paymentMethod: number;
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
 * Gets payment status from Flow API
 */
async function getFlowPaymentStatus(token: string): Promise<FlowPaymentStatus> {
  const apiKey = Deno.env.get('FLOW_API_KEY');
  const apiUrl = Deno.env.get('FLOW_API_URL');

  if (!apiKey || !apiUrl) {
    throw new Error('Flow API credentials not configured');
  }

  // Prepare parameters
  const params = {
    apiKey,
    token,
  };

  // Generate signature
  const signature = await generateFlowSignature(params);

  // Build URL with query parameters
  const url = new URL(`${apiUrl}/payment/getStatus`);
  url.searchParams.append('apiKey', apiKey);
  url.searchParams.append('token', token);
  url.searchParams.append('s', signature);

  console.log('Calling Flow API:', url.toString().replace(apiKey, 'REDACTED'));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Flow API error:', errorText);
    throw new Error(`Flow API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result;
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📝 Verify payment request received');

    // Parse request body
    const { token }: VerifyPaymentRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'token is required',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      );
    }

    console.log('🔍 Verifying payment with Flow token:', token);

    // Get payment status from Flow
    const flowStatus = await getFlowPaymentStatus(token);

    console.log('✅ Flow response:', flowStatus);

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find order by commerce order ID
    const orderId = parseInt(flowStatus.commerceOrder);
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderId);
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

    // Map Flow status to our order status
    let orderStatus: string;
    switch (flowStatus.status) {
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
        payment_method: mapPaymentMethod(flowStatus.paymentMethod),
        payment_date: orderStatus === 'paid' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw new Error('Failed to update order');
    }

    // If payment successful, reduce product stock
    if (orderStatus === 'paid') {
      // Get order items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);

      if (orderItems) {
        // Reduce stock for each product
        for (const item of orderItems) {
          await supabase.rpc('reduce_product_stock', {
            p_product_id: item.product_id,
            p_quantity: item.quantity,
          });
        }
      }

      console.log(`✅ Order ${orderId} marked as ${orderStatus}, stock reduced`);
    }

    // Return updated order status
    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        status: orderStatus,
        flowStatus: flowStatus.status,
        paymentMethod: mapPaymentMethod(flowStatus.paymentMethod),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in verify-payment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
