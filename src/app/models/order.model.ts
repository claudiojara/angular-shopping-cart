/**
 * Order status types
 */
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

/**
 * Payment methods supported by Flow.cl
 */
export type PaymentMethod = 'webpay' | 'redcompra' | 'servipag' | 'mach' | 'klap' | 'other';

/**
 * Order model - Represents a purchase order
 */
export interface Order {
  id: number;
  userId: string; // UUID from Supabase auth
  flowOrderId?: string; // Flow unique order ID
  flowToken?: string; // Flow payment token
  status: OrderStatus;

  // Amounts (in CLP cents)
  subtotalAmount: number;
  shippingAmount: number;
  totalAmount: number;

  // Shipping information
  shippingName: string;
  shippingEmail: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity?: string;
  shippingRegion?: string;
  shippingComuna?: string;
  shippingNotes?: string;

  // Payment information
  paymentMethod?: PaymentMethod;
  paymentDate?: string; // ISO timestamp

  // Timestamps
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp

  // Related data (populated when using orders_with_items view)
  items?: OrderItem[];
  itemCount?: number;
}

/**
 * Order item model - Represents individual items in an order
 * Captures product snapshot at time of purchase
 */
export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;

  // Quantity and prices (captured at purchase time)
  quantity: number;
  unitPrice: number; // in CLP cents
  subtotal: number; // quantity * unitPrice

  // Product snapshot (preserves info if product is deleted)
  productName: string;
  productSlug?: string;
  productImageUrl?: string;

  // Timestamps
  createdAt: string; // ISO timestamp
}

/**
 * Create order request payload
 */
export interface CreateOrderRequest {
  // Cart items
  items: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
  }>;

  // Shipping information
  shippingName: string;
  shippingEmail: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity?: string;
  shippingRegion?: string;
  shippingComuna?: string;
  shippingNotes?: string;

  // Amounts
  subtotalAmount: number;
  shippingAmount: number;
  totalAmount: number;
}

/**
 * Flow payment response from backend
 */
export interface FlowPaymentResponse {
  success: boolean;
  paymentUrl?: string; // URL to redirect user for payment
  flowOrderId?: string;
  token?: string; // Flow payment token (renamed from flowToken to match backend)
  error?: string;
}

/**
 * Flow webhook payload (received from Flow after payment)
 */
export interface FlowWebhookPayload {
  flowOrder: string; // Flow order ID
  token: string; // Payment token
  status: string; // Payment status from Flow
  paymentData: {
    amount: number;
    currency: string;
    paymentType: string;
    date: string;
  };
}

/**
 * Order from database (snake_case from Supabase)
 */
export interface OrderFromDB {
  id: number;
  user_id: string;
  flow_order_id?: string;
  flow_token?: string;
  status: OrderStatus;
  subtotal_amount: number;
  shipping_amount: number;
  total_amount: number;
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city?: string;
  shipping_region?: string;
  shipping_comuna?: string;
  shipping_notes?: string;
  payment_method?: PaymentMethod;
  payment_date?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItemFromDB[];
  item_count?: number;
}

/**
 * Order item from database (snake_case from Supabase)
 */
export interface OrderItemFromDB {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_name: string;
  product_slug?: string;
  product_image_url?: string;
  created_at: string;
}

/**
 * Convert order from DB format to frontend format
 */
export function mapOrderFromDB(orderDB: OrderFromDB): Order {
  return {
    id: orderDB.id,
    userId: orderDB.user_id,
    flowOrderId: orderDB.flow_order_id,
    flowToken: orderDB.flow_token,
    status: orderDB.status,
    subtotalAmount: orderDB.subtotal_amount,
    shippingAmount: orderDB.shipping_amount,
    totalAmount: orderDB.total_amount,
    shippingName: orderDB.shipping_name,
    shippingEmail: orderDB.shipping_email,
    shippingPhone: orderDB.shipping_phone,
    shippingAddress: orderDB.shipping_address,
    shippingCity: orderDB.shipping_city,
    shippingRegion: orderDB.shipping_region,
    shippingComuna: orderDB.shipping_comuna,
    shippingNotes: orderDB.shipping_notes,
    paymentMethod: orderDB.payment_method,
    paymentDate: orderDB.payment_date,
    createdAt: orderDB.created_at,
    updatedAt: orderDB.updated_at,
    items: orderDB.items?.map(mapOrderItemFromDB),
    itemCount: orderDB.item_count,
  };
}

/**
 * Convert order item from DB format to frontend format
 */
export function mapOrderItemFromDB(itemDB: OrderItemFromDB): OrderItem {
  return {
    id: itemDB.id,
    orderId: itemDB.order_id,
    productId: itemDB.product_id,
    quantity: itemDB.quantity,
    unitPrice: itemDB.unit_price,
    subtotal: itemDB.subtotal,
    productName: itemDB.product_name,
    productSlug: itemDB.product_slug,
    productImageUrl: itemDB.product_image_url,
    createdAt: itemDB.created_at,
  };
}
