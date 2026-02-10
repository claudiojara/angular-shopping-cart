import { Injectable, signal, computed, inject } from '@angular/core';
import {
  Order,
  OrderFromDB,
  OrderStatus,
  CreateOrderRequest,
  FlowPaymentResponse,
  mapOrderFromDB,
} from '../models/order.model';
import { SupabaseService } from './supabase.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '../core/config.service';

/**
 * Order service for managing purchase orders and Flow.cl payment integration
 * Handles order creation, payment initiation, and order history
 */
@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private supabase = inject(SupabaseService);
  private http = inject(HttpClient);
  private config = inject(ConfigService);

  // Local state signals
  private _orders = signal<Order[]>([]);
  private _currentOrder = signal<Order | null>(null);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  readonly orders = this._orders.asReadonly();
  readonly currentOrder = this._currentOrder.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed values
  readonly ordersCount = computed(() => this._orders().length);
  readonly hasOrders = computed(() => this.ordersCount() > 0);
  readonly paidOrders = computed(() => this._orders().filter((o) => o.status === 'paid'));
  readonly pendingOrders = computed(() => this._orders().filter((o) => o.status === 'pending'));

  /**
   * Create a new order in the database
   * @param request Order creation request with items and shipping info
   * @returns Created order or null if error
   */
  async createOrder(request: CreateOrderRequest): Promise<Order | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const user = this.supabase.getCurrentUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // 1. Create order record
      const { data: orderData, error: orderError } = await this.supabase.client
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'pending',
          subtotal_amount: request.subtotalAmount,
          shipping_amount: request.shippingAmount,
          total_amount: request.totalAmount,
          shipping_name: request.shippingName,
          shipping_email: request.shippingEmail,
          shipping_phone: request.shippingPhone,
          shipping_address: request.shippingAddress,
          shipping_city: request.shippingCity,
          shipping_region: request.shippingRegion,
          shipping_comuna: request.shippingComuna,
          shipping_notes: request.shippingNotes,
        })
        .select()
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error('No se pudo crear la orden');

      // 2. Create order items
      const orderItems = request.items.map((item) => ({
        order_id: orderData.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        product_name: '', // Will be filled by database trigger or separate query
      }));

      const { error: itemsError } = await this.supabase.client
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        // Rollback: delete order if items insertion fails
        await this.supabase.client.from('orders').delete().eq('id', orderData.id);
        throw itemsError;
      }

      // 3. Fetch complete order with items
      const order = await this.getOrderById(orderData.id);

      if (order) {
        this._currentOrder.set(order);
        this._orders.update((orders) => [order, ...orders]);
      }

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      this._error.set(error instanceof Error ? error.message : 'Error al crear la orden');
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Initiate Flow payment for an order
   * Calls backend Edge Function to create Flow payment and get payment URL
   * @param orderId Order ID to create payment for
   * @returns Payment response with URL to redirect user
   */
  async initiateFlowPayment(orderId: number): Promise<FlowPaymentResponse | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      // Use Azure Function instead of Supabase Edge Function (authentication issues)
      // Use relative URL to work in both staging and production environments
      const functionUrl = '/api/create-flow-payment';

      console.log('🔐 [OrderService] Initiating Flow payment for order:', orderId);
      console.log('📡 [OrderService] Calling Azure Function:', functionUrl);

      // Use fetch directly - Azure Function has anonymous auth
      const fetchResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json().catch(() => ({}));
        console.error('❌ [OrderService] HTTP error:', fetchResponse.status, errorData);
        throw new Error(errorData.message || `Error HTTP ${fetchResponse.status}`);
      }

      const response: FlowPaymentResponse = await fetchResponse.json();

      if (!response.success) {
        throw new Error(response.error || 'Error al iniciar pago Flow');
      }

      // Store flow token in localStorage for callback page
      if (response.token) {
        localStorage.setItem('pending_flow_token', response.token);
        localStorage.setItem('pending_order_id', orderId.toString());
        console.log('💾 Saved flow token to localStorage:', response.token);
      }

      return response;
    } catch (error) {
      console.error('❌ [OrderService] Error initiating Flow payment:', error);
      this._error.set(error instanceof Error ? error.message : 'Error al iniciar pago con Flow');
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Get order by ID
   * @param orderId Order ID
   * @returns Order or null if not found
   */
  async getOrderById(orderId: number): Promise<Order | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('orders_with_items')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return mapOrderFromDB(data as OrderFromDB);
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }

  /**
   * Get order by Flow order ID
   * Used in payment callback to find order after payment
   * @param flowOrderId Flow order ID
   * @returns Order or null if not found
   */
  async getOrderByFlowId(flowOrderId: string): Promise<Order | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('orders_with_items')
        .select('*')
        .eq('flow_order_id', flowOrderId)
        .single();

      if (error) throw error;
      if (!data) return null;

      const order = mapOrderFromDB(data as OrderFromDB);
      this._currentOrder.set(order);
      return order;
    } catch (error) {
      console.error('Error fetching order by Flow ID:', error);
      return null;
    }
  }

  /**
   * Load user's order history with pagination
   * @param page Page number (0-indexed)
   * @param pageSize Number of orders per page
   */
  async loadUserOrders(page: number = 0, pageSize: number = 10): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const user = this.supabase.getCurrentUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const offset = page * pageSize;

      const { data, error } = await this.supabase.client.rpc('get_user_orders', {
        p_user_id: user.id,
        p_limit: pageSize,
        p_offset: offset,
      });

      if (error) throw error;

      if (data) {
        // Map each order from DB format
        const orders = data.map((orderDB: OrderFromDB) => mapOrderFromDB(orderDB));
        this._orders.set(orders);
      }
    } catch (error) {
      console.error('Error loading user orders:', error);
      this._error.set(error instanceof Error ? error.message : 'Error al cargar órdenes');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Update order status (typically called by webhook after payment confirmation)
   * @param orderId Order ID
   * @param status New status
   * @param paymentMethod Payment method used (optional)
   * @returns Success boolean
   */
  async updateOrderStatus(
    orderId: number,
    status: OrderStatus,
    paymentMethod?: string,
  ): Promise<boolean> {
    try {
      const updateData: Record<string, unknown> = {
        status,
      };

      if (status === 'paid') {
        updateData['payment_date'] = new Date().toISOString();
        if (paymentMethod) {
          updateData['payment_method'] = paymentMethod;
        }
      }

      const { error } = await this.supabase.client
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      // Update local state if order is in current orders
      this._orders.update((orders) =>
        orders.map((order) => {
          if (order.id === orderId) {
            const updatedOrder: Order = {
              ...order,
              status,
            };
            if (paymentMethod) {
              updatedOrder.paymentMethod = paymentMethod as Order['paymentMethod'];
            }
            return updatedOrder;
          }
          return order;
        }),
      );

      // Update current order if it matches
      const current = this._currentOrder();
      if (current && current.id === orderId) {
        const updatedOrder: Order = {
          ...current,
          status,
        };
        if (paymentMethod) {
          updatedOrder.paymentMethod = paymentMethod as Order['paymentMethod'];
        }
        this._currentOrder.set(updatedOrder);
      }

      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  /**
   * Cancel a pending order
   * @param orderId Order ID
   * @returns Success boolean
   */
  async cancelOrder(orderId: number): Promise<boolean> {
    return this.updateOrderStatus(orderId, 'cancelled');
  }

  /**
   * Clear current order (used after successful payment)
   */
  clearCurrentOrder(): void {
    this._currentOrder.set(null);
  }

  /**
   * Clear all local state
   */
  clear(): void {
    this._orders.set([]);
    this._currentOrder.set(null);
    this._error.set(null);
  }
}
