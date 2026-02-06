import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CartService } from '../../services/cart.service';
import { SupabaseService } from '../../services/supabase.service';
import { OptimizedImagePipe } from '../../pipes/optimized-image.pipe';
import { ClpCurrencyPipe } from '../../pipes/clp-currency.pipe';

@Component({
  selector: 'app-cart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatBadgeModule,
    MatTooltipModule,
    OptimizedImagePipe,
    ClpCurrencyPipe,
  ],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart {
  private cartService = inject(CartService);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  items = this.cartService.items;
  total = this.cartService.total;
  itemCount = this.cartService.itemCount;

  updateQuantity(productId: number, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity);
  }

  removeItem(productId: number): void {
    // Prevenir múltiples clicks
    if (!this.items().find((item) => item.product.id === productId)) {
      return;
    }
    this.cartService.removeFromCart(productId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  /**
   * Navigate to checkout page
   * Requires user to be authenticated
   */
  proceedToCheckout(): void {
    // Check if user is authenticated
    if (!this.supabase.isAuthenticated()) {
      // Store current URL for redirect after login
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/checkout' },
      });
      return;
    }

    // Check if cart has items
    if (this.items().length === 0) {
      return;
    }

    // Navigate to checkout
    this.router.navigate(['/checkout']);
  }
}
