import { Injectable, signal, computed, inject } from '@angular/core';
import { Product, ProductFromDB } from '../models/product.model';
import { SupabaseService } from './supabase.service';
import { SupabaseMonitorService } from './supabase-monitor.service';

/**
 * Filter options for product queries
 */
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
  isFeatured?: boolean;
  inStock?: boolean;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number; // 0-indexed
  pageSize: number;
}

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
  private monitor = inject(SupabaseMonitorService);

  // Local state
  private _products = signal<Product[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _totalCount = signal(0);
  private _currentPage = signal(0);
  private _pageSize = signal(12);

  // Public readonly signals
  readonly products = this._products.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();

  // Computed values
  readonly categories = computed(() => {
    const cats = new Set(this._products().map((p) => p.category));
    return Array.from(cats);
  });

  readonly productCount = computed(() => this._products().length);

  readonly totalPages = computed(() => Math.ceil(this._totalCount() / this._pageSize()));

  readonly hasNextPage = computed(() => this._currentPage() < this.totalPages() - 1);

  readonly hasPreviousPage = computed(() => this._currentPage() > 0);

  constructor() {
    // Auto-load products on service initialization
    this.loadProducts();
  }

  /**
   * Load products with optional filters and pagination
   *
   * @param filters - Optional filters (category, price range, search query, etc.)
   * @param pagination - Optional pagination (page, pageSize)
   *
   * NOTA: Este método se llama automáticamente en el constructor sin filtros.
   * Para aplicar filtros o paginación, llama al método manualmente.
   *
   * Ejemplo con búsqueda:
   *   await productService.loadProducts({ searchQuery: 'Velora' });
   *
   * Ejemplo con filtros:
   *   await productService.loadProducts({
   *     category: 'Lámpara de Mesa',
   *     minPrice: 20000,
   *     maxPrice: 50000
   *   });
   *
   * Ejemplo con paginación:
   *   await productService.loadProducts({}, { page: 0, pageSize: 6 });
   */
  async loadProducts(filters: ProductFilters = {}, pagination?: PaginationOptions): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    const startTime = performance.now();
    let queryDescription = 'Load products';
    let success = false;
    let resultCount = 0;
    let errorMessage: string | undefined;

    try {
      // Build query
      let query = this.supabase.client
        .from('products_full_public')
        .select('*', { count: 'exact' })
        .eq('is_available', true);

      // Build query description for monitoring
      const filterParts: string[] = [];

      // Apply filters
      if (filters.category) {
        query = query.contains('categories', [{ name: filters.category }]);
        filterParts.push(`category=${filters.category}`);
      }

      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
        filterParts.push(`minPrice=${filters.minPrice}`);
      }

      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
        filterParts.push(`maxPrice=${filters.maxPrice}`);
      }

      if (filters.searchQuery) {
        query = query.or(
          `name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`,
        );
        filterParts.push(`search="${filters.searchQuery}"`);
      }

      if (filters.isFeatured !== undefined) {
        query = query.eq('is_featured', filters.isFeatured);
        filterParts.push(`featured=${filters.isFeatured}`);
      }

      if (filters.inStock) {
        query = query.gt('stock_quantity', 0);
        filterParts.push('inStock=true');
      }

      // Apply pagination
      if (pagination) {
        const { page, pageSize } = pagination;
        const from = page * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
        this._currentPage.set(page);
        this._pageSize.set(pageSize);
        filterParts.push(`page=${page}, pageSize=${pageSize}`);
      }

      // Update query description
      if (filterParts.length > 0) {
        queryDescription += ` (${filterParts.join(', ')})`;
      }

      // Execute query with default ordering
      const { data, error, count } = await query.order('id');

      if (error) throw error;

      const products = (data as ProductFromDB[]).map((dbProduct) =>
        this.mapDbProductToProduct(dbProduct),
      );

      this._products.set(products);
      this._totalCount.set(count ?? products.length);
      resultCount = products.length;
      success = true;
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Failed to load products';
      this._error.set(errorMessage);
      console.error('Error loading products:', err);
    } finally {
      const duration = performance.now() - startTime;
      this._loading.set(false);

      // Record metrics
      this.monitor.recordQuery(
        'products_full_public',
        queryDescription,
        duration,
        success,
        resultCount,
        errorMessage,
      );
    }
  }

  /**
   * Load next page of products
   */
  async loadNextPage(filters: ProductFilters = {}): Promise<void> {
    if (this.hasNextPage()) {
      const nextPage = this._currentPage() + 1;
      await this.loadProducts(filters, { page: nextPage, pageSize: this._pageSize() });
    }
  }

  /**
   * Load previous page of products
   */
  async loadPreviousPage(filters: ProductFilters = {}): Promise<void> {
    if (this.hasPreviousPage()) {
      const prevPage = this._currentPage() - 1;
      await this.loadProducts(filters, { page: prevPage, pageSize: this._pageSize() });
    }
  }

  /**
   * Set page size and reload first page
   */
  async setPageSize(pageSize: number, filters: ProductFilters = {}): Promise<void> {
    this._pageSize.set(pageSize);
    await this.loadProducts(filters, { page: 0, pageSize });
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
   * Get all available categories from database
   */
  async getAllCategories(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('categories')
        .select('name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return data?.map((cat) => cat.name) ?? [];
    } catch (err) {
      console.error('Error loading categories:', err);
      return [];
    }
  }

  /**
   * Get all available categories (from currently loaded products)
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
