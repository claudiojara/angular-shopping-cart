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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSliderModule } from '@angular/material/slider';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { SeoService } from '../../services/seo.service';
import { Product } from '../../models/product.model';

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
    MatExpansionModule,
    MatSliderModule,
    MatBadgeModule,
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private seoService = inject(SeoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // State signals
  selectedCategory = signal<string>('');
  sortBy = signal<SortOption>('featured');
  priceRange = signal<{ min: number; max: number }>({ min: 0, max: 50000 });

  // Data
  products = this.productService.getProducts;
  categories = this.productService.getCategories();

  constructor() {
    // Set SEO for products page
    this.seoService.updateSeo({
      title: 'Lámparas de Diseño Minimalista | Catálogo Forja del Destino',
      description:
        'Descubre nuestra colección de lámparas de diseño minimalista impresas en 3D. Veladores, lámparas de mesa y más. Envío gratis en compras sobre $45.000.',
      type: 'website',
    });
  }

  ngOnInit(): void {
    // Read query params and apply category filter
    this.route.queryParams.subscribe((params) => {
      const category = params['category'];
      if (category) {
        this.selectedCategory.set(category);
      }
    });
  }

  // Computed filtered products
  filteredProducts = computed(() => {
    let result = this.products();

    // Filter by category
    const category = this.selectedCategory();
    if (category) {
      result = result.filter((p) => p.category === category);
    }

    // Filter by price range
    const { min, max } = this.priceRange();
    result = result.filter((p) => p.price >= min && p.price <= max);

    // Sort
    const sort = this.sortBy();
    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        default:
          return a.id - b.id;
      }
    });

    return result;
  });

  // Computed values
  productCount = computed(() => this.filteredProducts().length);

  getStarsArray(rating: number): number[] {
    return Array(5)
      .fill(0)
      .map((_, i) => i + 1);
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  setCategory(category: string): void {
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
  }

  updatePriceMin(value: number): void {
    this.priceRange.update((range) => ({ ...range, min: value }));
  }

  updatePriceMax(value: number): void {
    this.priceRange.update((range) => ({ ...range, max: value }));
  }

  clearFilters(): void {
    this.selectedCategory.set('');
    this.priceRange.set({ min: 0, max: 50000 });
    this.sortBy.set('featured');
    // Clear URL query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
  }
}
