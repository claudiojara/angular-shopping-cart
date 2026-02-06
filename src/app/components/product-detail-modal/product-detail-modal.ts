import { Component, inject, signal, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';

export interface ProductDetailData {
  product: Product;
}

/**
 * Product detail modal component
 * Shows full product information in a dialog
 */
@Component({
  selector: 'app-product-detail-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
  ],
  templateUrl: './product-detail-modal.html',
  styleUrl: './product-detail-modal.scss',
})
export class ProductDetailModal {
  private dialogRef = inject(MatDialogRef<ProductDetailModal>);
  private cartService = inject(CartService);
  private router = inject(Router);

  // Inject dialog data
  data = inject<ProductDetailData>(MAT_DIALOG_DATA);

  product = this.data.product;
  selectedImage = signal<string>(this.product.image);

  // Cart state
  cartItems = this.cartService.items;

  // Check if product is in cart
  isInCart = () => {
    const items = this.cartItems();
    return items.some((item) => item.product.id === this.product.id);
  };

  // Get quantity in cart
  getCartQuantity(): number {
    const items = this.cartItems();
    const cartItem = items.find((item) => item.product.id === this.product.id);
    return cartItem?.quantity ?? 0;
  }

  getStarsArray(rating: number): number[] {
    return Array(5)
      .fill(0)
      .map((_, i) => i + 1);
  }

  formatPrice(price: number): string {
    const formatted = Math.round(price)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `$${formatted}`;
  }

  calculateDiscount(originalPrice: number, currentPrice: number): number {
    return Math.round((1 - currentPrice / originalPrice) * 100);
  }

  addToCart(): void {
    this.cartService.addToCart(this.product);
  }

  goToCart(): void {
    this.dialogRef.close();
    this.router.navigate(['/cart']);
  }

  close(): void {
    this.dialogRef.close();
  }
}
