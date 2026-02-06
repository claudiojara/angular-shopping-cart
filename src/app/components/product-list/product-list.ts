import {
  Component,
  inject,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSliderModule } from '@angular/material/slider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { SeoService } from '../../services/seo.service';
import { OptimizedImagePipe } from '../../pipes/optimized-image.pipe';
import { SrcSetPipe } from '../../pipes/srcset.pipe';
import { Product } from '../../models/product.model';
import { ProductDetailModal } from '../product-detail-modal/product-detail-modal';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating';

/**
 * Product list page component
 * Displays lamp catalog with filtering, sorting, and SEO optimization
 */
@Component({
  selector: 'app-product-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatExpansionModule,
    MatSliderModule,
    MatBadgeModule,
    MatDialogModule,
    OptimizedImagePipe,
    SrcSetPipe,
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {
  productService = inject(ProductService);
  private cartService = inject(CartService);
  private seoService = inject(SeoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  // State signals
  selectedCategory = signal<string>('');
  sortBy = signal<SortOption>('featured');
  priceRange = signal<{ min: number; max: number }>({ min: 0, max: 50000 });
  searchQuery = signal<string>('');
  showInStockOnly = signal<boolean>(false);

  // Data from service (using database filtering)
  products = this.productService.products;
  categories = this.productService.categories;
  loading = this.productService.loading;
  error = this.productService.error;

  // Pagination signals from service
  totalCount = this.productService.totalCount;
  currentPage = this.productService.currentPage;
  pageSize = this.productService.pageSize;
  totalPages = this.productService.totalPages;
  hasNextPage = this.productService.hasNextPage;
  hasPreviousPage = this.productService.hasPreviousPage;

  constructor() {
    // Set SEO for products page
    this.seoService.updateSeo({
      title: 'Lámparas de Diseño Minimalista | Catálogo Forja del Destino',
      description:
        'Descubre nuestra colección de lámparas de diseño minimalista impresas en 3D. Veladores, lámparas de mesa y más. Envío gratis en compras sobre $45.000.',
      type: 'website',
    });
  }

  async ngOnInit(): Promise<void> {
    // Read query params and apply category filter
    this.route.queryParams.subscribe(async (params) => {
      const category = params['category'];
      if (category) {
        this.selectedCategory.set(category);
      } else {
        // Clear category filter when no category in query params
        this.selectedCategory.set('');
      }
      // Apply filters with database query
      await this.applyFilters();
    });
  }

  /**
   * Apply filters using database-level filtering (server-side)
   * This replaces the old client-side computed filtering
   */
  async applyFilters(): Promise<void> {
    const filters = {
      category: this.selectedCategory() || undefined,
      minPrice: this.priceRange().min,
      maxPrice: this.priceRange().max,
      searchQuery: this.searchQuery() || undefined,
      inStock: this.showInStockOnly() || undefined,
    };

    const pagination = {
      page: 0, // Reset to first page when filters change
      pageSize: 12,
    };

    await this.productService.loadProducts(filters, pagination);
  }

  // Computed values (now using totalCount from database)
  productCount = computed(() => this.totalCount());

  // Cart items for checking if product is in cart
  cartItems = this.cartService.items;

  getStarsArray(rating: number): number[] {
    return Array(5)
      .fill(0)
      .map((_, i) => i + 1);
  }

  /**
   * Check if a product is in the cart
   */
  isInCart(productId: number): boolean {
    return this.cartItems().some((item) => item.product.id === productId);
  }

  /**
   * Get quantity of product in cart
   */
  getCartQuantity(productId: number): number {
    const item = this.cartItems().find((item) => item.product.id === productId);
    return item?.quantity ?? 0;
  }

  /**
   * Open product detail modal
   */
  openProductDetail(product: Product): void {
    this.dialog.open(ProductDetailModal, {
      data: { product },
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'product-detail-dialog',
    });
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  formatPrice(price: number): string {
    const formatted = Math.round(price)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `$${formatted}`;
  }

  async setCategory(category: string): Promise<void> {
    this.selectedCategory.set(category);
    // Update URL to reflect selected category
    if (category) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { category },
        queryParamsHandling: 'merge',
      });
    } else {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { category: null },
        queryParamsHandling: 'merge',
      });
    }
    await this.applyFilters();
  }

  async updatePriceMin(value: number): Promise<void> {
    this.priceRange.update((range) => ({ ...range, min: value }));
    await this.applyFilters();
  }

  async updatePriceMax(value: number): Promise<void> {
    this.priceRange.update((range) => ({ ...range, max: value }));
    await this.applyFilters();
  }

  async onSearchChange(): Promise<void> {
    await this.applyFilters();
  }

  async toggleInStockOnly(): Promise<void> {
    this.showInStockOnly.update((value) => !value);
    await this.applyFilters();
  }

  async clearFilters(): Promise<void> {
    this.selectedCategory.set('');
    this.priceRange.set({ min: 0, max: 50000 });
    this.sortBy.set('featured');
    this.searchQuery.set('');
    this.showInStockOnly.set(false);
    // Clear URL query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
    await this.applyFilters();
  }

  // Pagination methods
  async loadNextPage(): Promise<void> {
    await this.productService.loadNextPage();
  }

  async loadPreviousPage(): Promise<void> {
    await this.productService.loadPreviousPage();
  }

  async changePageSize(size: number): Promise<void> {
    await this.productService.setPageSize(size);
  }

  /**
   * Reload products from database
   * Útil para desarrollo/debugging cuando cambias datos en Supabase
   */
  async refreshProducts(): Promise<void> {
    await this.applyFilters();
  }
}
