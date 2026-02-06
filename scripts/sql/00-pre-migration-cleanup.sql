-- ============================================================================
-- 00-pre-migration-cleanup.sql
-- Clean up orphaned cart_items before migration
-- ============================================================================
-- Execute BEFORE running the main migration scripts
-- ============================================================================

-- Backup existing cart_items (optional - for safety)
-- CREATE TABLE cart_items_backup AS SELECT * FROM cart_items;

-- Check for orphaned cart_items (will show which product_ids don't exist)
SELECT DISTINCT product_id, COUNT(*) as count
FROM cart_items
GROUP BY product_id
ORDER BY product_id;

-- Option 1: Delete all cart_items (RECOMMENDED - cleanest start)
-- This is safe because users can re-add items after migration
DELETE FROM cart_items;

-- Option 2: Keep cart_items but remove foreign key constraints temporarily
-- (Only use if you want to preserve cart data during migration)
-- ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS fk_cart_items_product;
-- ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;
-- ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_variant_id_fkey;

-- Verify cart_items is empty
SELECT COUNT(*) as remaining_cart_items FROM cart_items;

-- ============================================================================
-- NOTES
-- ============================================================================
-- This script removes orphaned cart_items that reference non-existent products.
-- 
-- Why this is necessary:
-- - cart_items table already exists with data
-- - We're creating a new products table from scratch
-- - Old product_ids (1-12) will be replaced with new product records
-- - Foreign key constraints will fail if orphaned data exists
-- 
-- After migration completes:
-- - Users will have empty carts (they can re-add items)
-- - All new cart_items will properly reference migrated products
-- 
-- If you need to preserve cart data:
-- - Use Option 2 (drop constraints temporarily)
-- - After migration, update cart_items.product_id to match new IDs
-- - Re-add foreign key constraints in script 07
-- ============================================================================
