-- ============================================================================
-- 08-create-indexes.sql
-- Performance indexes for all tables
-- ============================================================================
-- Execute after: 07-improve-cart-items.sql
-- ============================================================================

-- ============================================================================
-- PRODUCTS TABLE INDEXES
-- ============================================================================

-- Index for filtering by availability and price sorting
CREATE INDEX idx_products_available_price ON products (is_available, price) 
WHERE is_available = true;

-- Index for filtering by material
CREATE INDEX idx_products_material ON products (material_id) 
WHERE material_id IS NOT NULL;

-- Index for filtering featured products
CREATE INDEX idx_products_featured ON products (is_featured, created_at DESC) 
WHERE is_featured = true;

-- Index for full-text search on name and description
CREATE INDEX idx_products_search ON products USING gin(
  to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(description, ''))
);

-- Index for sorting by rating
CREATE INDEX idx_products_rating ON products (average_rating DESC NULLS LAST) 
WHERE average_rating IS NOT NULL;

-- Index for sorting by created date (newest first)
CREATE INDEX idx_products_created_desc ON products (created_at DESC);

-- Index for sorting by review count (most reviewed first)
CREATE INDEX idx_products_review_count ON products (review_count DESC) 
WHERE review_count > 0;

-- ============================================================================
-- PRODUCT_CATEGORIES TABLE INDEXES
-- ============================================================================

-- Index for finding all products in a category
CREATE INDEX idx_product_categories_category ON product_categories (category_id);

-- Index for finding all categories of a product
CREATE INDEX idx_product_categories_product ON product_categories (product_id);

-- Composite index for category filtering with ordering
CREATE INDEX idx_product_categories_composite ON product_categories (category_id, product_id);

-- ============================================================================
-- PRODUCT_TAGS TABLE INDEXES
-- ============================================================================

-- Index for finding all products with a tag
CREATE INDEX idx_product_tags_tag ON product_tags (tag_id);

-- Index for finding all tags of a product
CREATE INDEX idx_product_tags_product ON product_tags (product_id);

-- Composite index for tag filtering
CREATE INDEX idx_product_tags_composite ON product_tags (tag_id, product_id);

-- ============================================================================
-- PRODUCT_IMAGES TABLE INDEXES
-- ============================================================================

-- Index for getting all images of a product, ordered by display order
CREATE INDEX idx_product_images_product_order ON product_images (product_id, display_order);

-- Index for finding primary images
CREATE INDEX idx_product_images_primary ON product_images (product_id) 
WHERE is_primary = true;

-- ============================================================================
-- PRODUCT_VARIANTS TABLE INDEXES
-- ============================================================================

-- Index for getting all variants of a product
CREATE INDEX idx_product_variants_product ON product_variants (product_id);

-- Index for finding available variants
CREATE INDEX idx_product_variants_available ON product_variants (product_id, is_available) 
WHERE is_available = true;

-- Index for variant lookup by size and color
CREATE INDEX idx_product_variants_size_color ON product_variants (product_id, size, color);

-- ============================================================================
-- REVIEWS TABLE INDEXES
-- ============================================================================

-- Index for getting all approved reviews of a product, ordered by date
CREATE INDEX idx_reviews_product_approved ON reviews (product_id, created_at DESC) 
WHERE is_approved = true;

-- Index for finding reviews by user
CREATE INDEX idx_reviews_user ON reviews (user_id, created_at DESC);

-- Index for finding pending reviews (for moderation)
CREATE INDEX idx_reviews_pending ON reviews (created_at ASC) 
WHERE is_approved = false;

-- Index for finding helpful reviews (most helpful first)
CREATE INDEX idx_reviews_helpful ON reviews (product_id, helpful_count DESC) 
WHERE is_approved = true AND helpful_count > 0;

-- Index for filtering by rating
CREATE INDEX idx_reviews_rating ON reviews (product_id, rating DESC) 
WHERE is_approved = true;

-- ============================================================================
-- CART_ITEMS TABLE INDEXES
-- ============================================================================

-- Index for getting all cart items of a user
CREATE INDEX idx_cart_items_user ON cart_items (user_id, created_at DESC);

-- Index for finding cart items by product
CREATE INDEX idx_cart_items_product ON cart_items (product_id);

-- Index for finding cart items by variant
CREATE INDEX idx_cart_items_variant ON cart_items (variant_id) 
WHERE variant_id IS NOT NULL;

-- Composite index for user + product lookup (prevent duplicates)
CREATE INDEX idx_cart_items_user_product ON cart_items (user_id, product_id, variant_id);

-- ============================================================================
-- CATEGORIES TABLE INDEXES
-- ============================================================================

-- Index for hierarchical queries (finding children of a parent)
CREATE INDEX idx_categories_parent ON categories (parent_id) 
WHERE parent_id IS NOT NULL;

-- Index for active categories ordering
CREATE INDEX idx_categories_active_order ON categories (display_order) 
WHERE is_active = true;

-- ============================================================================
-- TAGS TABLE INDEXES
-- ============================================================================

-- Index for active tags ordering
CREATE INDEX idx_tags_active_order ON tags (display_order) 
WHERE is_active = true;

-- Index for tag name lookup (case-insensitive)
CREATE INDEX idx_tags_name ON tags (LOWER(name));

-- ============================================================================
-- MATERIALS TABLE INDEXES
-- ============================================================================

-- Index for active materials ordering
CREATE INDEX idx_materials_active_order ON materials (display_order) 
WHERE is_active = true;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Query to verify all indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'products', 'product_categories', 'product_tags', 
    'product_images', 'product_variants', 'reviews', 
    'cart_items', 'categories', 'tags', 'materials'
  )
ORDER BY tablename, indexname;

-- ============================================================================
-- NOTES
-- ============================================================================
-- Total indexes created: ~28 indexes
-- 
-- Performance considerations:
-- - Partial indexes (WHERE clause) for filtered queries (smaller index size)
-- - GIN index for full-text search in Spanish
-- - Composite indexes for common query patterns
-- - DESC ordering for sorting queries
-- - NULLS LAST for rating sorting
-- 
-- Maintenance:
-- - PostgreSQL auto-maintains indexes
-- - Monitor slow queries with pg_stat_statements
-- - Consider VACUUM ANALYZE after bulk inserts
-- - Review index usage with pg_stat_user_indexes
-- ============================================================================
