# Database Migration Scripts - Execution Guide

## Overview

This directory contains 12 SQL scripts to migrate the shopping cart from hardcoded products to a complete Supabase PostgreSQL database.

## Execution Order

**CRITICAL:** Execute scripts in numerical order (01 → 12). Each script depends on previous ones.

### Scripts List

1. **01-create-base-tables.sql** - Materials, categories, tags tables
2. **02-create-products-table.sql** - Main products table
3. **03-create-relation-tables.sql** - Product-category and product-tag N:N relationships
4. **04-create-image-tables.sql** - Product images (gallery support)
5. **05-create-variants-table.sql** - Product variants (sizes/colors)
6. **06-create-reviews-table.sql** - Review system with moderation
7. **07-improve-cart-items.sql** - Improve existing cart_items table
8. **08-create-indexes.sql** - Performance indexes (~28 indexes)
9. **09-create-rls-policies.sql** - Row Level Security policies
10. **10-create-functions.sql** - Database functions and triggers (6 functions, 15+ triggers)
11. **11-create-views.sql** - Complex query views (5 views)
12. **12-insert-seed-data.sql** - Initial data (materials, categories, tags)

## How to Execute

### Option 1: Supabase SQL Editor (Recommended)

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/owewtzddyykyraxkkorx
2. Navigate to: **SQL Editor** → **New Query**
3. Copy script content (01-create-base-tables.sql)
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. Verify success (check output for errors)
6. Repeat for scripts 02-12 in order

### Option 2: Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to project
supabase link --project-ref owewtzddyykyraxkkorx

# Execute scripts in order
supabase db execute --file scripts/sql/01-create-base-tables.sql
supabase db execute --file scripts/sql/02-create-products-table.sql
supabase db execute --file scripts/sql/03-create-relation-tables.sql
supabase db execute --file scripts/sql/04-create-image-tables.sql
supabase db execute --file scripts/sql/05-create-variants-table.sql
supabase db execute --file scripts/sql/06-create-reviews-table.sql
supabase db execute --file scripts/sql/07-improve-cart-items.sql
supabase db execute --file scripts/sql/08-create-indexes.sql
supabase db execute --file scripts/sql/09-create-rls-policies.sql
supabase db execute --file scripts/sql/10-create-functions.sql
supabase db execute --file scripts/sql/11-create-views.sql
supabase db execute --file scripts/sql/12-insert-seed-data.sql
```

### Option 3: psql (Direct Connection)

```bash
# Get connection string from Supabase Dashboard
# Settings → Database → Connection String (Postgres)

psql "postgresql://postgres:[password]@db.owewtzddyykyraxkkorx.supabase.co:5432/postgres" \
  -f scripts/sql/01-create-base-tables.sql

# Repeat for all 12 scripts
```

## Verification

After executing all scripts, run these queries to verify:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected tables:
-- - materials
-- - categories
-- - tags
-- - products
-- - product_categories
-- - product_tags
-- - product_images
-- - product_variants
-- - reviews
-- - cart_items (existing, now improved)

-- Check indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
-- Expected: ~28 indexes

-- Check RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
-- Expected: ~25 policies

-- Check functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
-- Expected: 6 functions

-- Check triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
-- Expected: 15+ triggers

-- Check views
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;
-- Expected: 5 views (products_full, products_full_public, cart_summary, review_summary, category_hierarchy)

-- Check seed data
SELECT 'materials' AS table_name, COUNT(*) AS record_count FROM materials
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'tags', COUNT(*) FROM tags;
-- Expected: materials=2, categories=5, tags=12
```

## Next Steps

After executing all 12 SQL scripts:

1. **Run product migration:**

   ```bash
   node scripts/migrate-products-to-db.mjs
   ```

   This will insert the 12 hardcoded products into the database.

2. **Verify migration:**

   ```bash
   node scripts/verify-migration.mjs
   ```

   This will check that all products, images, categories, tags, and variants were created correctly.

3. **Update Angular code:**
   - Update `ProductService` to fetch from database (with pagination)
   - Update `CartService` to support variants
   - Create `ReviewService` for review management
   - Update product models with new interfaces

## Rollback Strategy

If you need to undo the migration:

```sql
-- Drop views first (depend on tables)
DROP VIEW IF EXISTS products_full CASCADE;
DROP VIEW IF EXISTS products_full_public CASCADE;
DROP VIEW IF EXISTS cart_summary CASCADE;
DROP VIEW IF EXISTS review_summary CASCADE;
DROP VIEW IF EXISTS category_hierarchy CASCADE;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS product_tags CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS materials CASCADE;

-- cart_items table existed before - only drop if you want to remove improvements
-- DROP TABLE IF EXISTS cart_items CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_product_rating() CASCADE;
DROP FUNCTION IF EXISTS ensure_single_primary_image() CASCADE;
DROP FUNCTION IF EXISTS validate_cart_item() CASCADE;
DROP FUNCTION IF EXISTS snapshot_cart_item_price() CASCADE;
DROP FUNCTION IF EXISTS prevent_duplicate_cart_items() CASCADE;
```

## Troubleshooting

### Error: "relation already exists"

**Solution:** Table or view already exists. Either:

- Skip that script if it's expected
- Drop the existing object first (see Rollback Strategy)
- Or run `DROP TABLE IF EXISTS <table_name> CASCADE;` before the script

### Error: "permission denied"

**Solution:** Use service_role key or database owner credentials.

### Error: "column does not exist" in triggers

**Solution:** Execute scripts in order. Earlier scripts create columns needed by later triggers.

### Error: RLS policy prevents operation

**Solution:** Use service_role key for admin operations or disable RLS temporarily:

```sql
ALTER TABLE <table_name> DISABLE ROW LEVEL SECURITY;
-- Do operation
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
```

## Schema Overview

```
materials (2 records)
  └─ products (12 records after migration)
       ├─ product_images (12+ records, 1 primary per product)
       ├─ product_categories (N:N with categories)
       ├─ product_tags (N:N with tags)
       ├─ product_variants (optional, for sizes/colors)
       ├─ reviews (user reviews with moderation)
       └─ cart_items (existing, now with variant support)

categories (5 records)
  └─ hierarchical (parent_id support for subcategories)

tags (12 records)
```

## Database Size Estimate

After full migration (12 products with all relations):

- **Tables:** 10 tables
- **Indexes:** ~28 indexes
- **Views:** 5 views
- **Functions:** 6 functions
- **Triggers:** 15+ triggers
- **RLS Policies:** ~25 policies
- **Records:** ~50-70 initial records
- **Estimated Size:** < 1 MB (before product images, which are external URLs)

## Performance Notes

- All foreign keys have indexes
- Full-text search enabled on products (Spanish language)
- Partial indexes for filtered queries (e.g., `WHERE is_available = true`)
- Views are NOT materialized (calculated on query) - consider materialized views for high traffic
- RLS policies add minimal overhead (~1-2ms per query)

## Security Notes

- RLS enabled on ALL tables
- Anonymous users: Read-only access to available products
- Authenticated users: Full CRUD on own cart and reviews
- Admin role: Full access (via JWT claim `role = 'admin'`)
- Price snapshots prevent cart manipulation
- Review moderation prevents spam

## Contact

For issues or questions:

- GitHub: https://github.com/claudiojara/angular-shopping-cart
- Supabase Project: owewtzddyykyraxkkorx
