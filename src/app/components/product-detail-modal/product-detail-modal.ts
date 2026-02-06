import { Component, inject, signal, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
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
    MatSnackBarModule,
    MatMenuModule,
  ],
  templateUrl: './product-detail-modal.html',
  styleUrl: './product-detail-modal.scss',
})
export class ProductDetailModal {
  private dialogRef = inject(MatDialogRef<ProductDetailModal>);
  private cartService = inject(CartService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Inject dialog data
  data = inject<ProductDetailData>(MAT_DIALOG_DATA);

  product = this.data.product;
  selectedImage = signal<string>(this.product.image);
  currentImageIndex = signal<number>(0);

  // Gallery images (including primary)
  galleryImages = this.product.images || [];
  hasGallery = this.galleryImages.length > 1;

  // Cart state
  cartItems = this.cartService.items;
  quantity = signal<number>(1); // Quantity selector

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

  selectImage(imageUrl: string): void {
    this.selectedImage.set(imageUrl);
    const index = this.galleryImages.findIndex((img) => img.image_url === imageUrl);
    if (index !== -1) {
      this.currentImageIndex.set(index);
    }
  }

  nextImage(): void {
    if (!this.hasGallery) return;
    const nextIndex = (this.currentImageIndex() + 1) % this.galleryImages.length;
    this.currentImageIndex.set(nextIndex);
    this.selectedImage.set(this.galleryImages[nextIndex].image_url);
  }

  previousImage(): void {
    if (!this.hasGallery) return;
    const prevIndex =
      (this.currentImageIndex() - 1 + this.galleryImages.length) % this.galleryImages.length;
    this.currentImageIndex.set(prevIndex);
    this.selectedImage.set(this.galleryImages[prevIndex].image_url);
  }

  canNavigate(): boolean {
    return this.hasGallery;
  }

  // Keyboard navigation
  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if (!this.canNavigate()) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.previousImage();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextImage();
        break;
      case 'Escape':
        this.close();
        break;
    }
  }

  // Quantity controls
  increaseQuantity(): void {
    const maxStock = this.product.stockQuantity ?? 99;
    if (this.quantity() < maxStock) {
      this.quantity.update((q) => q + 1);
    }
  }

  decreaseQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update((q) => q - 1);
    }
  }

  canIncrease(): boolean {
    const maxStock = this.product.stockQuantity ?? 99;
    return this.quantity() < maxStock;
  }

  canDecrease(): boolean {
    return this.quantity() > 1;
  }

  addToCart(): void {
    const qty = this.quantity();
    for (let i = 0; i < qty; i++) {
      this.cartService.addToCart(this.product);
    }
    // Reset quantity after adding
    this.quantity.set(1);
  }

  goToCart(): void {
    this.dialogRef.close();
    this.router.navigate(['/cart']);
  }

  // Share functionality
  shareProduct(): void {
    // Share button clicked - open menu handled in template
  }

  async copyProductLink(): Promise<void> {
    const productUrl = `${window.location.origin}/products/${this.product.id}`;

    try {
      await navigator.clipboard.writeText(productUrl);
      this.snackBar.open('Enlace copiado al portapapeles', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    } catch {
      // Fallback for older browsers
      this.fallbackCopyToClipboard(productUrl);
    }
  }

  private fallbackCopyToClipboard(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      this.snackBar.open('Enlace copiado al portapapeles', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    } catch {
      this.snackBar.open('No se pudo copiar el enlace', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    }
    document.body.removeChild(textarea);
  }

  shareOnWhatsApp(): void {
    const text = encodeURIComponent(
      `¡Mira este producto increíble! ${this.product.name} - ${this.formatPrice(this.product.price)}`,
    );
    const url = encodeURIComponent(`${window.location.origin}/products/${this.product.id}`);
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  }

  shareOnFacebook(): void {
    const url = encodeURIComponent(`${window.location.origin}/products/${this.product.id}`);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      '_blank',
      'width=600,height=400',
    );
  }

  shareOnTwitter(): void {
    const text = encodeURIComponent(
      `¡Mira este producto increíble! ${this.product.name} - ${this.formatPrice(this.product.price)}`,
    );
    const url = encodeURIComponent(`${window.location.origin}/products/${this.product.id}`);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank',
      'width=600,height=400',
    );
  }

  close(): void {
    this.dialogRef.close();
  }
}
