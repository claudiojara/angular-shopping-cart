import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createClient } from '@supabase/supabase-js';

/**
 * Flow Webhook Handler for Azure Functions
 * Receives payment confirmations from Flow.cl and updates orders in Supabase
 *
 * SECURITY FEATURES:
 * - HMAC-SHA256 signature verification
 * - Token matching validation
 * - Amount validation (prevents tampering)
 * - Idempotency check (prevents duplicate processing)
 * - Stock availability verification
 * - Audit logging
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
 * Validates payment amount matches order total
 */
function validatePaymentAmount(flowAmount: string, orderAmount: number): boolean {
  const flowAmountNum = parseFloat(flowAmount);
  // Allow small floating point differences (1 CLP tolerance)
  const tolerance = 1;
  return Math.abs(flowAmountNum - orderAmount) <= tolerance;
}

/**
 * Checks if sufficient stock exists for all order items
 */
async function checkStockAvailability(
  supabase: any,
  orderId: number,
  context: InvocationContext,
): Promise<{ available: boolean; details: any[] }> {
  try {
    // Get order items with product stock info
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(
        `
        product_id, 
        quantity,
        products:product_id (stock_quantity, name)
      `,
      )
      .eq('order_id', orderId);

    if (itemsError || !orderItems) {
      context.error('Error fetching order items for stock check:', itemsError);
      return { available: false, details: [] };
    }

    const stockDetails = orderItems.map((item: any) => ({
      productId: item.product_id,
      productName: item.products?.name || 'Unknown',
      requested: item.quantity,
      available: item.products?.stock_quantity || 0,
      sufficient: (item.products?.stock_quantity || 0) >= item.quantity,
    }));

    const allSufficient = stockDetails.every((detail: any) => detail.sufficient);

    if (!allSufficient) {
      const insufficient = stockDetails.filter((detail: any) => !detail.sufficient);
      context.warn(`⚠️ Insufficient stock for order ${orderId}:`, insufficient);
    }

    return { available: allSufficient, details: stockDetails };
  } catch (error) {
    context.error('Error checking stock availability:', error);
    return { available: false, details: [] };
  }
}

/**
 * Reduces product stock after successful payment
 */
async function reduceProductStock(
  supabase: any,
  orderId: number,
  context: InvocationContext,
): Promise<{ success: boolean; processed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;

  try {
    // Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity, products:product_id (name)')
      .eq('order_id', orderId);

    if (itemsError || !orderItems) {
      throw new Error(`Error fetching order items: ${itemsError?.message}`);
    }

    // Reduce stock for each product
    for (const item of orderItems) {
      try {
        const { error: stockError } = await supabase.rpc('reduce_product_stock', {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        });

        if (stockError) {
          const errorMsg = `Failed to reduce stock for product ${item.product_id} (${item.products?.name}): ${stockError.message}`;
          context.error(errorMsg);
          errors.push(errorMsg);
        } else {
          processed++;
          context.log(
            `✅ Stock reduced for product ${item.product_id} (${item.products?.name}): -${item.quantity} units`,
          );
        }
      } catch (err: any) {
        const errorMsg = `Exception reducing stock for product ${item.product_id}: ${err.message}`;
        context.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return { success: errors.length === 0, processed, errors };
  } catch (error: any) {
    const errorMsg = `Error in reduceProductStock: ${error.message}`;
    context.error(errorMsg);
    return { success: false, processed, errors: [errorMsg] };
  }
}

/**
 * Logs audit entry for payment processing
 */
async function logPaymentAudit(
  supabase: any,
  orderId: number,
  flowOrderId: string,
  status: string,
  amount: string,
  paymentMethod: string,
  stockResult: { success: boolean; processed: number; errors: string[] },
  context: InvocationContext,
): Promise<void> {
  try {
    const auditEntry = {
      order_id: orderId,
      flow_order_id: flowOrderId,
      status: status,
      amount: parseFloat(amount),
      payment_method: paymentMethod,
      stock_processed: stockResult.processed,
      stock_success: stockResult.success,
      stock_errors: stockResult.errors,
      processed_at: new Date().toISOString(),
    };

    // Try to insert into payment_audit_log table (create if not exists)
    const { error } = await supabase.from('payment_audit_log').insert(auditEntry);

    if (error) {
      // Table might not exist, log to console instead
      context.log('📋 Payment Audit (table may not exist):', auditEntry);
    } else {
      context.log('📋 Payment audit logged:', auditEntry);
    }
  } catch (err) {
    context.error('Error logging payment audit:', err);
    // Non-critical, don't throw
  }
}

export async function flowWebhook(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log('🔔 Flow webhook received');

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return { status: 200, headers: corsHeaders, body: 'OK' };
  }

  try {
    // Parse form data from Flow
    const formData = await request.formData();
    const params: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    context.log('📦 Webhook data received:', {
      flowOrder: params['flowOrder'],
      commerceOrder: params['commerceOrder'],
      status: params['status'],
      amount: params['amount'],
      paymentMethod: params['paymentMethod'],
    });

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
    const amount = params['amount'];

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
      context.error('❌ Order not found:', orderId);
      throw new Error('Order not found');
    }

    context.log('📋 Order found:', {
      orderId: order.id,
      status: order.status,
      total: order.total_amount,
      flowToken: order.flow_token ? '✓' : '✗',
    });

    // Verify flow_token matches
    if (order.flow_token !== token) {
      context.error('❌ Token mismatch');
      throw new Error('Token mismatch');
    }

    context.log('✅ Token verified');

    // Validate payment amount (security check)
    if (amount && !validatePaymentAmount(amount, order.total_amount)) {
      context.error('❌ Amount mismatch:', {
        flowAmount: amount,
        orderAmount: order.total_amount,
      });
      throw new Error('Payment amount does not match order total');
    }

    if (amount) {
      context.log('✅ Amount validated:', amount);
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

    context.log('🔄 Processing status:', { flowStatus: status, orderStatus });

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
      context.error('❌ Error updating order:', updateError);
      throw new Error('Failed to update order');
    }

    context.log('✅ Order status updated to:', orderStatus);

    // Process stock reduction if payment successful
    let stockResult = { success: true, processed: 0, errors: [] as string[] };

    if (orderStatus === 'paid') {
      // Check if already processed (idempotency)
      if (order.status === 'paid') {
        context.log(`ℹ️ Order ${orderId} already paid, skipping stock reduction`);
      } else {
        context.log(`🔄 Processing stock reduction for order ${orderId}...`);

        // Verify stock availability before reducing
        const stockCheck = await checkStockAvailability(supabase, orderId, context);

        if (!stockCheck.available) {
          const errorMsg = `Insufficient stock for order ${orderId}`;
          context.error('❌', errorMsg, stockCheck.details);
          // Don't throw - order is paid, but log the issue
          stockResult = { success: false, processed: 0, errors: [errorMsg] };
        } else {
          context.log('✅ Stock availability confirmed:', stockCheck.details);

          // Reduce stock
          stockResult = await reduceProductStock(supabase, orderId, context);

          if (stockResult.success) {
            context.log(`✅ Stock reduced successfully: ${stockResult.processed} products`);
          } else {
            context.error(`❌ Stock reduction partially failed:`, stockResult.errors);
          }
        }
      }
    }

    // Log audit entry
    await logPaymentAudit(
      supabase,
      orderId,
      flowOrder || 'unknown',
      orderStatus,
      amount || '0',
      mapPaymentMethod(paymentMethod),
      stockResult,
      context,
    );

    // Return 200 OK to Flow (required)
    context.log('✅ Webhook processed successfully');
    return {
      status: 200,
      headers: corsHeaders,
      body: 'OK',
    };
  } catch (error: any) {
    context.error('❌ Error in flow-webhook:', error);

    // Still return 200 to Flow to avoid retries
    // But log the error for monitoring
    return {
      status: 200,
      headers: corsHeaders,
      body: 'OK',
    };
  }
}

app.http('flow-webhook', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: flowWebhook,
  route: 'flow-webhook',
});
