# Shopping Cart Database Migration

Complete guide for migrating from hardcoded products to Supabase PostgreSQL database.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Migration Steps](#migration-steps)
4. [Database Schema](#database-schema)
5. [Verification](#verification)
6. [Angular Code Updates](#angular-code-updates)
7. [Rollback](#rollback)
8. [Troubleshooting](#troubleshooting)

## 🎯 Overview

This migration transforms the shopping cart application from hardcoded product data to a complete database-backed system with:

- ✅ **12 products** migrated from ProductService
- ✅ **10 tables** (materials, categories, tags, products, images, variants, reviews, etc.)
- ✅ **~28 performance indexes**
- ✅ **25+ RLS policies** for security
- ✅ **6 database functions + 15 triggers** for automation
- ✅ **5 views** for complex queries
- ✅ **Pagination support** (20 products per page)
- ✅ **Review system** with moderation
- ✅ **Product variants** (sizes, colors)
- ✅ **Multiple images** per product

## 🔧 Prerequisites

### 1. Supabase Configuration

Ensure you have Supabase credentials configured:

**Option A: Local development (`src/assets/config.local.json`):**

```json
{
  "supabase": {
    "url": "https://owewtzddyykyraxkkorx.supabase.co",
    "anonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "serviceRoleKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Option B: Environment variables:**

```bash
export SUPABASE_URL="https://owewtzddyykyraxkkorx.supabase.co"
export SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. Node.js Dependencies

```bash
npm install @supabase/supabase-js
```

### 3. Backup Current Data

```bash
# Backup current cart_items table (if has important data)
# In Supabase SQL Editor:
SELECT * FROM cart_items;
# Export results manually
```

## 📝 Migration Steps

### Step 1: Execute SQL Scripts (Database Schema)

Execute all 12 SQL scripts in order using Supabase SQL Editor:

```
scripts/sql/
├── 01-create-base-tables.sql        ✅ Materials, categories, tags
├── 02-create-products-table.sql     ✅ Main products table
├── 03-create-relation-tables.sql    ✅ N:N relationships
├── 04-create-image-tables.sql       ✅ Product images
├── 05-create-variants-table.sql     ✅ Size/color variants
├── 06-create-reviews-table.sql      ✅ Review system
├── 07-improve-cart-items.sql        ✅ Cart improvements
├── 08-create-indexes.sql            ✅ Performance indexes
├── 09-create-rls-policies.sql       ✅ Security policies
├── 10-create-functions.sql          ✅ Triggers & functions
├── 11-create-views.sql              ✅ Complex query views
└── 12-insert-seed-data.sql          ✅ Initial data
```

**How to execute:**

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/owewtzddyykyraxkkorx
2. Navigate to: **SQL Editor** → **New Query**
3. Copy-paste script 01 content
4. Click **Run** (Cmd/Ctrl + Enter)
5. Verify success (no errors in output)
6. Repeat for scripts 02-12

See `scripts/sql/README.md` for detailed instructions.

### Step 2: Migrate Products to Database

Run the migration script to insert the 12 hardcoded products:

```bash
node scripts/migrate-products-to-db.mjs
```

**What it does:**

- Inserts 12 products from ProductService into `products` table
- Links products to materials (PLA/ABS)
- Creates product-category relationships (N:N)
- Creates product-tag relationships (N:N)
- Inserts primary images for all products
- Creates product variants (size options)
- Generates SKUs automatically

**Expected output:**

```
============================================================================
PRODUCT MIGRATION TO SUPABASE
============================================================================
Products to migrate: 12

📦 Migrating product #1: Lunora
  ✓ Material: PLA (ID: 1)
  ✓ Product inserted (SKU: LUN-0001)
  ✓ Primary image added
  ✓ Category linked: Lámparas de Mesa (ID: 1)
  ✓ Tags linked: geométrico, moderno, iluminación-ambiental
  ✓ Variants created: +4, +6
✅ Product Lunora migrated successfully

[... repeat for all 12 products ...]

============================================================================
MIGRATION SUMMARY
============================================================================
✅ Successful: 12/12
❌ Failed: 0/12

🎉 All products migrated successfully!
```

### Step 3: Verify Migration

Run the verification script to ensure everything is correct:

```bash
node scripts/verify-migration.mjs
```

**What it checks:**

- ✅ All 12 products exist with valid data
- ✅ All products have primary images
- ✅ All products have categories
- ✅ Products have tags (optional)
- ✅ Variants are created correctly
- ✅ Materials (PLA, ABS) are present
- ✅ Database views work correctly
- ✅ No orphaned records (data integrity)

**Expected output:**

```
============================================================================
MIGRATION VERIFICATION
============================================================================

🧱 Verifying materials...
  ✓ All 2 materials present: PLA, ABS

📦 Verifying products...
  ✓ Found 12 products
  ✓ All products have valid data

🖼️  Verifying product images...
  ✓ All 12 products have primary images
  ✓ Total images: 12

[... more checks ...]

============================================================================
VERIFICATION SUMMARY
============================================================================
✅ All verification checks passed!

📊 Migration Statistics:
   - Products: 12
   - Images: 12
   - Category links: 12
   - Tag links: 30+
   - Variants: 20+

✨ Database is ready for use!
```

## 🗄️ Database Schema

### Tables Overview

```
materials (2 records)
  └─ products (12 records)
       ├─ product_images (12+ records, 1 primary per product)
       ├─ product_categories (N:N with categories)
       ├─ product_tags (N:N with tags)
       ├─ product_variants (optional sizes/colors)
       ├─ reviews (user reviews with moderation)
       └─ cart_items (existing, now with variant support)

categories (5 records)
  └─ hierarchical support (parent_id for subcategories)

tags (12 records)
```

### Key Features

#### 1. Materials Table

- **PLA**: Biodegradable, smooth finish (10 products)
- **ABS**: Strong, durable (2 products)

#### 2. Products Table

- SKU generation (e.g., `LUN-0001`)
- Price in centavos (Chilean pesos)
- Average rating (auto-calculated from reviews)
- Review count (auto-updated)
- Stock quantity
- Featured flag (auto-calculated: rating ≥ 4.9 AND reviews ≥ 5)

#### 3. Product Images

- Multiple images per product (gallery)
- One primary image (enforced by trigger)
- Unsplash URLs (external hosting)
- Alt text for accessibility

#### 4. Product Variants

- Size options (e.g., "+4", "+6")
- Color options (future support)
- Price adjustments (e.g., +500 for larger size)
- Individual SKUs (e.g., `LUN-0001-V4`)
- Stock per variant

#### 5. Reviews System

- User reviews with ratings (1-5 stars)
- Moderation flag (`is_approved`)
- Helpful count (community votes)
- Auto-updates product rating/count via trigger

#### 6. Cart Items

- User isolation (`user_id`)
- Variant support (`variant_id`)
- Price snapshot (prevents manipulation)
- Quantity tracking

### Database Functions & Triggers

| Function                         | Trigger                               | Purpose                                 |
| -------------------------------- | ------------------------------------- | --------------------------------------- |
| `update_updated_at_column()`     | BEFORE UPDATE (all tables)            | Auto-update `updated_at` timestamp      |
| `update_product_rating()`        | AFTER INSERT/UPDATE/DELETE (reviews)  | Recalculate product rating & count      |
| `ensure_single_primary_image()`  | BEFORE INSERT/UPDATE (product_images) | Only one primary image per product      |
| `validate_cart_item()`           | BEFORE INSERT/UPDATE (cart_items)     | Validate product/variant availability   |
| `snapshot_cart_item_price()`     | BEFORE INSERT (cart_items)            | Capture price at time of adding to cart |
| `prevent_duplicate_cart_items()` | BEFORE INSERT/UPDATE (cart_items)     | Prevent duplicate cart entries          |

### Database Views

| View                   | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `products_full`        | Complete product data with all relations in one query |
| `products_full_public` | Same as above but filtered for available products     |
| `cart_summary`         | User cart with product details and totals             |
| `review_summary`       | Product reviews with anonymized user info             |
| `category_hierarchy`   | Recursive category tree with levels                   |

## ✅ Verification

After migration, verify the database state:

### Manual Verification Queries

```sql
-- Count all records
SELECT 'materials' AS table_name, COUNT(*) FROM materials
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'tags', COUNT(*) FROM tags
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'product_images', COUNT(*) FROM product_images
UNION ALL SELECT 'product_categories', COUNT(*) FROM product_categories
UNION ALL SELECT 'product_tags', COUNT(*) FROM product_tags
UNION ALL SELECT 'product_variants', COUNT(*) FROM product_variants;

-- Expected results:
-- materials: 2
-- categories: 5
-- tags: 12
-- products: 12
-- product_images: 12
-- product_categories: 12
-- product_tags: 30+
-- product_variants: 20+

-- Test products_full view
SELECT
  id,
  name,
  material_name,
  price,
  jsonb_array_length(images::jsonb) AS image_count,
  jsonb_array_length(categories::jsonb) AS category_count,
  jsonb_array_length(tags::jsonb) AS tag_count,
  jsonb_array_length(variants::jsonb) AS variant_count
FROM products_full_public
ORDER BY id;

-- Test pagination (20 per page)
SELECT id, name, price, average_rating
FROM products_full_public
WHERE is_available = true
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;  -- Page 1
```

## 🔄 Angular Code Updates

After successful migration, update Angular code:

### 1. Update Product Model

**File:** `src/app/models/product.model.ts`

```typescript
export interface Product {
  // Existing fields
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;

  // New fields from database
  sku: string;
  materialId: number;
  materialName?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  averageRating: number;
  reviewCount: number;
  stockQuantity: number;

  // Relations (from views)
  images?: ProductImage[];
  categories?: Category[];
  tags?: Tag[];
  variants?: ProductVariant[];

  // Computed
  badge?: string;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductImage {
  id: number;
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductVariant {
  id: number;
  size?: string;
  color?: string;
  priceAdjustment: number;
  stockQuantity: number;
  sku: string;
  isAvailable: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId?: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### 2. Update ProductService

**File:** `src/app/services/product.service.ts`

```typescript
import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private supabase = inject(SupabaseService);

  private _products = signal<Product[]>([]);
  private _loading = signal(false);
  private _currentPage = signal(1);
  private _totalProducts = signal(0);

  readonly products = this._products.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly totalProducts = this._totalProducts.asReadonly();

  readonly PAGE_SIZE = 20;

  readonly totalPages = computed(() => Math.ceil(this._totalProducts() / this.PAGE_SIZE));

  async loadProducts(page: number = 1): Promise<void> {
    this._loading.set(true);
    try {
      const offset = (page - 1) * this.PAGE_SIZE;

      // Use products_full_public view for complete data
      const { data, error, count } = await this.supabase.client
        .from('products_full_public')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + this.PAGE_SIZE - 1);

      if (error) throw error;

      this._products.set(data || []);
      this._totalProducts.set(count || 0);
      this._currentPage.set(page);
    } catch (error) {
      console.error('Error loading products:', error);
      this._products.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  async getProductById(id: number): Promise<Product | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('products_full_public')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting product:', error);
      return null;
    }
  }

  async getProductsByCategory(categorySlug: string, page: number = 1): Promise<PaginatedProducts> {
    const offset = (page - 1) * this.PAGE_SIZE;

    try {
      const { data, error, count } = await this.supabase.client
        .from('products_full_public')
        .select('*', { count: 'exact' })
        .contains('categories', [{ slug: categorySlug }])
        .order('created_at', { ascending: false })
        .range(offset, offset + this.PAGE_SIZE - 1);

      if (error) throw error;

      return {
        products: data || [],
        total: count || 0,
        page,
        pageSize: this.PAGE_SIZE,
        totalPages: Math.ceil((count || 0) / this.PAGE_SIZE),
      };
    } catch (error) {
      console.error('Error getting products by category:', error);
      return { products: [], total: 0, page, pageSize: this.PAGE_SIZE, totalPages: 0 };
    }
  }
}
```

### 3. Update CartService (Variant Support)

**File:** `src/app/services/cart.service.ts`

Add variant support to cart operations:

```typescript
async addItem(product: Product, variantId?: number): Promise<void> {
  const user = this.supabase.getCurrentUser();
  if (!user) return;

  // Optimistic update
  this._items.update(items => [...items, {
    product,
    quantity: 1,
    variantId
  }]);

  try {
    const { error } = await this.supabase.client
      .from('cart_items')
      .insert({
        user_id: user.id,
        product_id: product.id,
        variant_id: variantId || null,
        quantity: 1
        // price_snapshot is auto-set by trigger
      });

    if (error) throw error;
  } catch (error) {
    // Rollback on error
    this._items.update(items =>
      items.filter(i => i.product.id !== product.id || i.variantId !== variantId)
    );
    console.error('Error adding to cart:', error);
  }
}
```

### 4. Create ReviewService (New)

**File:** `src/app/services/review.service.ts`

```typescript
import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Review {
  id: number;
  productId: number;
  userId: string;
  rating: number;
  comment?: string;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private supabase = inject(SupabaseService);

  private _reviews = signal<Review[]>([]);
  readonly reviews = this._reviews.asReadonly();

  async getReviewsForProduct(productId: number): Promise<Review[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this._reviews.set(data || []);
      return data || [];
    } catch (error) {
      console.error('Error loading reviews:', error);
      return [];
    }
  }

  async submitReview(productId: number, rating: number, comment: string): Promise<boolean> {
    const user = this.supabase.getCurrentUser();
    if (!user) return false;

    try {
      const { error } = await this.supabase.client.from('reviews').insert({
        product_id: productId,
        user_id: user.id,
        rating,
        comment,
        is_approved: false, // Needs moderation
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error submitting review:', error);
      return false;
    }
  }
}
```

## 🔙 Rollback

If you need to undo the migration:

```sql
-- Drop all tables in reverse order
DROP VIEW IF EXISTS category_hierarchy CASCADE;
DROP VIEW IF EXISTS review_summary CASCADE;
DROP VIEW IF EXISTS cart_summary CASCADE;
DROP VIEW IF EXISTS products_full_public CASCADE;
DROP VIEW IF EXISTS products_full CASCADE;

DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS product_tags CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS materials CASCADE;

-- cart_items existed before - only drop if needed
-- DROP TABLE IF EXISTS cart_items CASCADE;

DROP FUNCTION IF EXISTS prevent_duplicate_cart_items() CASCADE;
DROP FUNCTION IF EXISTS snapshot_cart_item_price() CASCADE;
DROP FUNCTION IF EXISTS validate_cart_item() CASCADE;
DROP FUNCTION IF EXISTS ensure_single_primary_image() CASCADE;
DROP FUNCTION IF EXISTS update_product_rating() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

Then revert Angular code changes.

## 🐛 Troubleshooting

### Issue: Migration script fails with "serviceRoleKey not found"

**Solution:** Add service role key to `config.local.json`:

```json
{
  "supabase": {
    "url": "...",
    "anonKey": "...",
    "serviceRoleKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

Or set environment variable:

```bash
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

### Issue: SQL script fails with "relation already exists"

**Solution:** Table already exists. Either:

1. Skip that script if expected
2. Drop existing table first: `DROP TABLE IF EXISTS <table_name> CASCADE;`
3. Or run full rollback

### Issue: Verification shows "missing products"

**Causes:**

- Migration script didn't complete
- RLS policies preventing read access
- Products not marked as `is_available`

**Solution:**

```sql
-- Check products exist (bypass RLS with service_role key)
SELECT id, name, is_available FROM products;

-- If products exist but not visible, check RLS
SELECT * FROM pg_policies WHERE tablename = 'products';

-- Temporarily disable RLS for debugging
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
SELECT * FROM products;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

### Issue: products_full view returns empty arrays

**Cause:** JSON aggregation returns `[]` when no records

**Solution:** This is expected for products without tags/variants. Check:

```sql
SELECT
  id,
  name,
  jsonb_array_length(images::jsonb) AS images,
  jsonb_array_length(categories::jsonb) AS categories
FROM products_full
WHERE id = 1;
```

All products should have at least 1 image and 1 category.

### Issue: Orphaned records in verification

**Cause:** Foreign key violations or incomplete migration

**Solution:**

```sql
-- Find orphaned product_images
SELECT pi.id, pi.product_id
FROM product_images pi
LEFT JOIN products p ON pi.product_id = p.id
WHERE p.id IS NULL;

-- Delete orphans
DELETE FROM product_images
WHERE product_id NOT IN (SELECT id FROM products);
```

## 📚 Additional Resources

- **Supabase Dashboard:** https://supabase.com/dashboard/project/owewtzddyykyraxkkorx
- **SQL Scripts:** `scripts/sql/README.md`
- **Agent Guidelines:** `AGENTS.md` (see Database Integration section)
- **Supabase Docs:** https://supabase.com/docs/guides/database

## 🎉 Success Criteria

Migration is complete when:

- ✅ All 12 SQL scripts executed without errors
- ✅ Migration script shows `12/12 successful`
- ✅ Verification script shows `All checks passed`
- ✅ Query `SELECT COUNT(*) FROM products` returns `12`
- ✅ `products_full_public` view returns 12 products with all relations
- ✅ Angular app can fetch products from database
- ✅ Pagination works (20 products per page)
- ✅ Product details page shows all information
- ✅ Cart operations work with variants

## ⏭️ Next Steps After Migration

1. **Remove hardcoded data** from ProductService (keep as backup comment)
2. **Test all features:**
   - Product listing with pagination
   - Product filtering by category
   - Product details page
   - Add to cart with variants
   - Search functionality
3. **Create admin panel** (future) for:
   - Product management (CRUD)
   - Review moderation
   - Inventory management
4. **Add product search** with full-text search:
   ```sql
   SELECT * FROM products
   WHERE to_tsvector('spanish', name || ' ' || description)
   @@ plainto_tsquery('spanish', 'geométrico lámpara');
   ```
5. **Monitor performance** with slow query log
6. **Set up backups** in Supabase (auto-enabled)

---

**Questions or issues?** Check troubleshooting section or review `scripts/sql/README.md` for detailed SQL execution instructions.
