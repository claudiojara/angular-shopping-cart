# Advanced Product Features - Search, Filtering & Pagination

This document describes the new advanced features added to the ProductService for database-driven search, filtering, and pagination.

## 📋 Table of Contents

- [Features Overview](#features-overview)
- [Search Functionality](#search-functionality)
- [Filtering Options](#filtering-options)
- [Pagination](#pagination)
- [Performance Monitoring](#performance-monitoring)
- [API Reference](#api-reference)
- [Examples](#examples)

## 🎯 Features Overview

### ✅ What's New

1. **Database-Level Search** - Full-text search using Supabase `ilike` operator
2. **Advanced Filtering** - Filter by category, price range, stock status, featured products
3. **Pagination** - Server-side pagination with configurable page sizes
4. **Performance Monitoring** - Track query performance and identify slow queries

### 🔧 Architecture

All features are implemented at the **database level** using Supabase queries, ensuring:

- **Scalability:** Only requested data is transferred
- **Performance:** Database indexes optimize filtering
- **Flexibility:** Filters can be combined for complex queries

---

## 🔍 Search Functionality

### Overview

The search feature performs case-insensitive full-text search across product names and descriptions.

### Usage

```typescript
// Search for products containing "Velora"
await productService.loadProducts({ searchQuery: 'Velora' });

// Search for "lamp"
await productService.loadProducts({ searchQuery: 'lamp' });
```

### Implementation Details

- Uses Supabase `ilike` operator for case-insensitive matching
- Searches both `name` and `description` fields
- Supports partial matches (e.g., "Vel" matches "Velora")
- Uses `OR` logic between name and description

### Database Query

```sql
SELECT * FROM products_full_public
WHERE (name ILIKE '%Velora%' OR description ILIKE '%Velora%')
AND is_available = true;
```

---

## 🎛️ Filtering Options

### Available Filters

| Filter        | Type      | Description                                       |
| ------------- | --------- | ------------------------------------------------- |
| `category`    | `string`  | Filter by category name (e.g., "Lámpara de Mesa") |
| `minPrice`    | `number`  | Minimum price in CLP                              |
| `maxPrice`    | `number`  | Maximum price in CLP                              |
| `searchQuery` | `string`  | Search term for name/description                  |
| `isFeatured`  | `boolean` | Show only featured products                       |
| `inStock`     | `boolean` | Show only products with stock > 0                 |

### Usage Examples

#### Filter by Category

```typescript
await productService.loadProducts({
  category: 'Lámpara de Mesa',
});
```

#### Filter by Price Range

```typescript
await productService.loadProducts({
  minPrice: 20000,
  maxPrice: 50000,
});
```

#### Multiple Filters

```typescript
await productService.loadProducts({
  category: 'Lámpara de Mesa',
  minPrice: 20000,
  maxPrice: 50000,
  inStock: true,
});
```

#### Search + Filter

```typescript
await productService.loadProducts({
  searchQuery: 'minimalista',
  category: 'Lámpara de Mesa',
  inStock: true,
});
```

---

## 📄 Pagination

### Overview

Server-side pagination loads products in pages, reducing initial load time and improving performance for large catalogs.

### Configuration

```typescript
interface PaginationOptions {
  page: number; // 0-indexed (0 = first page)
  pageSize: number; // Number of products per page
}
```

### Usage Examples

#### Load First Page (6 products)

```typescript
await productService.loadProducts({}, { page: 0, pageSize: 6 });
```

#### Navigate Pages

```typescript
// Next page
await productService.loadNextPage();

// Previous page
await productService.loadPreviousPage();

// Specific page
await productService.loadProducts({}, { page: 2, pageSize: 6 });
```

#### Change Page Size

```typescript
// Show 12 products per page
await productService.setPageSize(12);
```

### Pagination Signals

```typescript
// Access pagination state
const currentPage = productService.currentPage(); // Current page (0-indexed)
const pageSize = productService.pageSize(); // Products per page
const totalCount = productService.totalCount(); // Total products in DB
const totalPages = productService.totalPages(); // Total pages
const hasNext = productService.hasNextPage(); // Can go forward
const hasPrev = productService.hasPreviousPage(); // Can go back
```

### Template Example

```html
<div class="pagination">
  <button
    [disabled]="!productService.hasPreviousPage()"
    (click)="productService.loadPreviousPage()"
  >
    Anterior
  </button>

  <span> Página {{ productService.currentPage() + 1 }} de {{ productService.totalPages() }} </span>

  <button [disabled]="!productService.hasNextPage()" (click)="productService.loadNextPage()">
    Siguiente
  </button>
</div>
```

---

## 📊 Performance Monitoring

### Overview

The `SupabaseMonitorService` tracks query performance metrics to identify slow queries and optimization opportunities.

### Setup

#### Enable Monitoring

```typescript
import { SupabaseMonitorService } from './services/supabase-monitor.service';

constructor(private monitor: SupabaseMonitorService) {
  // Enable monitoring in development
  if (!environment.production) {
    this.monitor.enable();
  }
}
```

### View Performance Report

```typescript
// Print report to console
this.monitor.printReport();
```

**Example Output:**

```
📊 Supabase Performance Report
================================
Total Queries: 15
Successful: 14
Failed: 1
Average Duration: 125.50ms

🐌 Slowest Query (450ms):
   Table: products_full_public
   Query: Load products (category=Lámpara de Mesa, minPrice=20000, maxPrice=50000)

⚡ Fastest Query (45ms):
   Table: products_full_public
   Query: Load products

📋 Queries by Table:
   products_full_public: 12 queries, avg 130.25ms
   categories: 3 queries, avg 85.33ms
```

### Access Metrics Programmatically

```typescript
// Get performance stats
const stats = this.monitor.getStats();
console.log(`Average query time: ${stats.averageDuration}ms`);

// Get all metrics
const metrics = this.monitor.metrics();

// Get metrics for specific table
const productMetrics = this.monitor.getMetricsByTable('products_full_public');

// Clear metrics
this.monitor.clear();
```

### Automatic Slow Query Detection

Queries taking longer than **1000ms** are automatically logged:

```
🐌 Slow query detected (1250ms) on table "products_full_public": Load products (searchQuery="lamp", category="Lámpara de Mesa")
```

---

## 📚 API Reference

### ProductService Methods

#### `loadProducts(filters?, pagination?)`

Load products with optional filters and pagination.

```typescript
async loadProducts(
  filters: ProductFilters = {},
  pagination?: PaginationOptions
): Promise<void>
```

**Parameters:**

- `filters` - Optional filter criteria
- `pagination` - Optional pagination config

**Example:**

```typescript
await productService.loadProducts(
  { category: 'Lámpara de Mesa', inStock: true },
  { page: 0, pageSize: 6 },
);
```

#### `loadNextPage(filters?)`

Load next page of products.

```typescript
async loadNextPage(filters: ProductFilters = {}): Promise<void>
```

#### `loadPreviousPage(filters?)`

Load previous page of products.

```typescript
async loadPreviousPage(filters: ProductFilters = {}): Promise<void>
```

#### `setPageSize(pageSize, filters?)`

Change page size and reload first page.

```typescript
async setPageSize(pageSize: number, filters: ProductFilters = {}): Promise<void>
```

#### `getAllCategories()`

Get all available categories from database (not just loaded products).

```typescript
async getAllCategories(): Promise<string[]>
```

### SupabaseMonitorService Methods

#### `enable()`

Enable performance monitoring.

```typescript
enable(): void
```

#### `disable()`

Disable performance monitoring.

```typescript
disable(): void
```

#### `getStats()`

Get performance statistics.

```typescript
getStats(): PerformanceStats
```

Returns:

```typescript
interface PerformanceStats {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageDuration: number;
  slowestQuery: QueryMetrics | null;
  fastestQuery: QueryMetrics | null;
}
```

#### `printReport()`

Print formatted performance report to console.

```typescript
printReport(): void
```

#### `clear()`

Clear all recorded metrics.

```typescript
clear(): void
```

---

## 💡 Examples

### Example 1: Search with Pagination

```typescript
export class ProductListComponent {
  productService = inject(ProductService);

  async searchProducts(query: string): Promise<void> {
    await this.productService.loadProducts({ searchQuery: query }, { page: 0, pageSize: 12 });
  }
}
```

### Example 2: Filter UI Component

```typescript
export class ProductFiltersComponent {
  productService = inject(ProductService);

  async applyFilters(category: string, minPrice: number, maxPrice: number): Promise<void> {
    await this.productService.loadProducts({
      category,
      minPrice,
      maxPrice,
      inStock: true,
    });
  }
}
```

### Example 3: Monitoring in Development

```typescript
// app.config.ts
import { SupabaseMonitorService } from './services/supabase-monitor.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    {
      provide: APP_INITIALIZER,
      useFactory: (monitor: SupabaseMonitorService) => () => {
        if (!environment.production) {
          monitor.enable();
          console.log('📊 Performance monitoring enabled');
        }
      },
      deps: [SupabaseMonitorService],
      multi: true,
    },
  ],
};
```

### Example 4: Console Commands

Open DevTools console (F12) and run:

```javascript
// Enable monitoring
$localize.inject(SupabaseMonitorService).enable();

// Load products with filters
await ng
  .getComponent(document.querySelector('app-product-list'))
  .productService.loadProducts({ searchQuery: 'Velora', minPrice: 20000 });

// View performance report
$localize.inject(SupabaseMonitorService).printReport();
```

---

## 🎯 Performance Best Practices

1. **Use Pagination** - Load products in pages (6-12 per page) instead of all at once
2. **Combine Filters** - Apply multiple filters in a single query instead of sequential filtering
3. **Monitor Performance** - Enable monitoring in development to identify slow queries
4. **Database Indexes** - Ensure indexes exist on filtered columns (price, category, etc.)
5. **Cache Categories** - Use `getAllCategories()` to load categories once, not on every product query

---

## 🔄 Migration from Old API

### Before (Hardcoded Products)

```typescript
// Old synchronous API
const products = this.productService.getProducts();
const filtered = products.filter((p) => p.category === 'Lámpara de Mesa');
```

### After (Database-Driven)

```typescript
// New async API with database filtering
await this.productService.loadProducts({ category: 'Lámpara de Mesa' });
const products = this.productService.products(); // Signal
```

### Key Differences

1. **Async Operations** - All load methods are now `async`
2. **Signals** - State is exposed via readonly signals
3. **Database Filtering** - Filters applied at database level
4. **Pagination Support** - Built-in pagination for large datasets

---

## 📝 Testing

### Unit Tests

```typescript
describe('ProductService with Filters', () => {
  it('should load products with filters', async () => {
    await service.loadProducts({
      category: 'Lámpara de Mesa',
      minPrice: 20000,
    });

    expect(service.products().length).toBeGreaterThan(0);
    expect(service.products().every((p) => p.price >= 20000)).toBe(true);
  });

  it('should paginate products', async () => {
    await service.loadProducts({}, { page: 0, pageSize: 6 });

    expect(service.products().length).toBeLessThanOrEqual(6);
    expect(service.currentPage()).toBe(0);
  });
});
```

---

## 🚀 Future Enhancements

- [ ] Sort options (price, name, rating)
- [ ] Advanced search with multiple terms
- [ ] Filter by multiple categories
- [ ] Price range slider UI component
- [ ] Infinite scroll pagination
- [ ] Query result caching
- [ ] Full-text search with PostgreSQL `tsvector`

---

**Created:** 2026-02-06  
**Version:** 1.0.0  
**Author:** Database Migration Team
