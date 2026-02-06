import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../services/order.service';
import { CartService } from '../../services/cart.service';
import { ConfigService } from '../../core/config.service';
import { Order } from '../../models/order.model';

/**
 * PaymentCallbackPage - Handles return from Flow payment
 * Shows payment status and clears cart on success
 */
@Component({
  selector: 'app-payment-callback',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './payment-callback.page.html',
  styleUrl: './payment-callback.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentCallbackPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private cartService = inject(CartService);
  private config = inject(ConfigService);

  // Local state
  readonly loading = signal(true);
  readonly status = signal<'success' | 'failed' | 'pending' | 'unknown'>('pending');
  readonly order = signal<Order | null>(null);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    // Get Flow token from query params
    this.route.queryParams.subscribe(async (params) => {
      const token = params['token'];
      const error = params['error'];

      console.log('📝 Payment callback - token:', token, 'error:', error);

      if (token) {
        // Token provided - verify payment with it
        this.checkPaymentStatus(token);
      } else {
        // No token - try to verify using last pending order
        console.log('⚠️ No token provided, checking last pending order...');
        await this.checkLastPendingOrder();
      }
    });
  }

  /**
   * Check last pending order (fallback when Flow doesn't send token)
   */
  private async checkLastPendingOrder(): Promise<void> {
    try {
      // Try to get flow token from localStorage (saved before redirect)
      const flowToken = localStorage.getItem('pending_flow_token');
      const orderId = localStorage.getItem('pending_order_id');

      if (!flowToken) {
        throw new Error('No se encontró información del pago pendiente');
      }

      console.log('🔍 Using saved flow token from localStorage');
      console.log('Order ID:', orderId);

      // Verify payment using saved flow_token
      await this.checkPaymentStatus(flowToken);

      // Clean up localStorage after successful verification
      localStorage.removeItem('pending_flow_token');
      localStorage.removeItem('pending_order_id');
    } catch (error) {
      console.error('❌ Error checking last pending order:', error);
      this.status.set('unknown');
      this.loading.set(false);
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No se pudo verificar el estado del pago',
      );
    }
  }

  /**
   * Check payment status from Flow
   * Calls Flow API to verify payment and update order
   */
  private async checkPaymentStatus(flowToken: string): Promise<void> {
    try {
      console.log('🔍 Verifying payment with Flow token:', flowToken);

      const appConfig = this.config.getConfig();
      const serviceRoleKey = appConfig.supabase.serviceRoleKey || appConfig.supabase.anonKey;

      // Call Edge Function to verify payment with Flow API
      const response = await fetch(
        'https://owewtzddyykyraxkkorx.supabase.co/functions/v1/verify-flow-payment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ token: flowToken }),
        },
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al verificar el pago');
      }

      console.log('✅ Payment verified:', result);

      // Get updated order from database
      const order = await this.orderService.getOrderById(result.orderId);

      if (!order) {
        throw new Error('No se pudo recuperar la información de la orden');
      }

      this.order.set(order);

      // Update UI based on payment status
      if (result.status === 'paid') {
        this.status.set('success');
        // Clear cart on successful payment
        await this.cartService.clearCart();
        this.orderService.clearCurrentOrder();
      } else if (result.status === 'failed') {
        this.status.set('failed');
        this.errorMessage.set('El pago fue rechazado');
      } else {
        this.status.set('pending');
        this.errorMessage.set('El pago está siendo procesado');
      }
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      this.status.set('unknown');
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Error al verificar el estado del pago',
      );
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Format price for display
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  }

  /**
   * Navigate to products page
   */
  goToProducts(): void {
    this.router.navigate(['/products']);
  }

  /**
   * Navigate to orders page (to be implemented)
   */
  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  /**
   * Try payment again
   */
  tryAgain(): void {
    this.router.navigate(['/cart']);
  }
}
