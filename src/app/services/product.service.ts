import { Injectable, signal, computed, inject } from '@angular/core';
import { Product, ProductFromDB } from '../models/product.model';
import { SupabaseService } from './supabase.service';

/**
 * Product service providing lamp catalog from Supabase database
 * Uses products_full_public view for optimized queries
 * All products are design lamps inspired by minimalist aesthetics
 */
@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private supabase = inject(SupabaseService);

  // Local state
  private _products = signal<Product[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  readonly products = this._products.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed values
  readonly categories = computed(() => {
    const cats = new Set(this._products().map((p) => p.category));
    return Array.from(cats);
  });

  readonly productCount = computed(() => this._products().length);

  constructor() {
    // Auto-load products on service initialization
    this.loadProducts();
  }

  /**
   * Load all products from database
   *
   * NOTA: Este método se llama automáticamente en el constructor.
   * Si cambias datos en Supabase y quieres ver los cambios sin refrescar:
   * 1. Abre DevTools (F12) → Console
   * 2. Ejecuta: await ng.getComponent(document.querySelector('app-product-list')).productService.loadProducts()
   */
  async loadProducts(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const { data, error } = await this.supabase.client
        .from('products_full_public')
        .select('*')
        .eq('is_available', true)
        .order('id');

      if (error) throw error;

      const products = (data as ProductFromDB[]).map((dbProduct) =>
        this.mapDbProductToProduct(dbProduct),
      );
      this._products.set(products);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
      this._error.set(errorMessage);
      console.error('Error loading products:', err);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Get product by ID
   */
  getProductById(id: number): Product | undefined {
    return this._products().find((product) => product.id === id);
  }

  /**
   * Get product by slug (SEO-friendly)
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('products_full_public')
        .select('*')
        .eq('slug', slug)
        .eq('is_available', true)
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.mapDbProductToProduct(data as ProductFromDB);
    } catch (err) {
      console.error('Error loading product by slug:', err);
      return null;
    }
  }

  /**
   * Get all available categories
   */
  getCategories(): string[] {
    return this.categories();
  }

  /**
   * Get products filtered by category
   */
  getProductsByCategory(category: string): Product[] {
    return this._products().filter((p) => p.category === category);
  }

  /**
   * Get featured products
   */
  getFeaturedProducts(): Product[] {
    return this._products().filter((p) => p.isFeatured === true);
  }

  /**
   * Search products by name or description
   */
  searchProducts(query: string): Product[] {
    const lowerQuery = query.toLowerCase();
    return this._products().filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery),
    );
  }

  /**
   * Map database product to frontend Product interface
   */
  private mapDbProductToProduct(dbProduct: ProductFromDB): Product {
    // Get primary image or first available
    const primaryImage = dbProduct.images.find((img) => img.is_primary);
    const imageUrl = primaryImage?.image_url || dbProduct.images[0]?.image_url || '';

    // Get first category name
    const categoryName = dbProduct.categories[0]?.name || 'Sin categoría';

    // Extract variant sizes
    const variantSizes = dbProduct.variants
      .map((v) => v.size)
      .filter((s): s is string => s !== null);

    // Calculate badge (discount percentage)
    let badge: string | undefined;
    if (dbProduct.original_price && dbProduct.original_price > dbProduct.price) {
      const discount = Math.round(
        ((dbProduct.original_price - dbProduct.price) / dbProduct.original_price) * 100,
      );
      badge = `-${discount}%`;
    } else if (dbProduct.is_featured) {
      badge = 'Destacado';
    }

    return {
      id: dbProduct.id,
      name: dbProduct.name,
      slug: dbProduct.slug,
      description: dbProduct.description,
      price: dbProduct.price,
      originalPrice: dbProduct.original_price ?? undefined,
      image: imageUrl,
      category: categoryName,
      rating: dbProduct.average_rating,
      reviewCount: dbProduct.review_count,
      variants: variantSizes.length > 0 ? variantSizes : undefined,
      badge,
      material: dbProduct.material_code ?? undefined,
      sku: dbProduct.sku ?? undefined,
      stockQuantity: dbProduct.stock_quantity,
      isAvailable: dbProduct.is_available,
      isFeatured: dbProduct.is_featured,
    };
  }
}
