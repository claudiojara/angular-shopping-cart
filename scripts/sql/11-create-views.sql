-- ============================================================================
-- 11-create-views.sql
-- Database views for complex queries
-- ============================================================================
-- Execute after: 10-create-functions.sql
-- ============================================================================

-- ============================================================================
-- VIEW: products_full
-- Complete product information with all relations in a single query
-- ============================================================================

CREATE OR REPLACE VIEW products_full AS
SELECT 
  -- Product core fields
  p.id,
  p.name,
  p.description,
  p.price,
  p.original_price,
  p.is_available,
  p.is_featured,
  p.average_rating,
  p.review_count,
  p.stock_quantity,
  p.sku,
  p.created_at,
  p.updated_at,
  
  -- Material information
  p.material_id,
  m.name AS material_name,
  m.code AS material_code,
  m.color AS material_color,
  
  -- Primary image
  (
    SELECT pi.image_url
    FROM product_images pi
    WHERE pi.product_id = p.id
      AND pi.is_primary = true
    LIMIT 1
  ) AS primary_image_url,
  
  -- All images as JSON array
  (
    SELECT COALESCE(json_agg(
      json_build_object(
        'id', pi.id,
        'image_url', pi.image_url,
        'alt_text', pi.alt_text,
        'display_order', pi.display_order,
        'is_primary', pi.is_primary
      ) ORDER BY pi.display_order
    ), '[]'::json)
    FROM product_images pi
    WHERE pi.product_id = p.id
  ) AS images,
  
  -- Categories as JSON array
  (
    SELECT COALESCE(json_agg(
      json_build_object(
        'id', c.id,
        'name', c.name,
        'slug', c.slug,
        'parent_id', c.parent_id
      )
    ), '[]'::json)
    FROM categories c
    INNER JOIN product_categories pc ON c.id = pc.category_id
    WHERE pc.product_id = p.id
      AND c.is_active = true
  ) AS categories,
  
  -- Tags as JSON array
  (
    SELECT COALESCE(json_agg(
      json_build_object(
        'id', t.id,
        'name', t.name,
        'slug', t.slug
      )
    ), '[]'::json)
    FROM tags t
    INNER JOIN product_tags pt ON t.id = pt.tag_id
    WHERE pt.product_id = p.id
      AND t.is_active = true
  ) AS tags,
  
  -- Variants as JSON array
  (
    SELECT COALESCE(json_agg(
      json_build_object(
        'id', pv.id,
        'size', pv.size,
        'color', pv.color,
        'price_adjustment', pv.price_adjustment,
        'stock_quantity', pv.stock_quantity,
        'sku', pv.sku,
        'is_available', pv.is_available
      )
    ), '[]'::json)
    FROM product_variants pv
    WHERE pv.product_id = p.id
      AND pv.is_available = true
  ) AS variants,
  
  -- Badge calculation (featured or discount)
  CASE
    WHEN p.is_featured THEN 'Destacado'
    WHEN p.original_price IS NOT NULL AND p.original_price > p.price THEN 
      CONCAT('-', ROUND(((p.original_price - p.price)::NUMERIC / p.original_price * 100), 0), '%')
    ELSE NULL
  END AS badge

FROM products p
LEFT JOIN materials m ON p.material_id = m.id;

-- Add comment to view
COMMENT ON VIEW products_full IS 'Complete product information with all relations (material, images, categories, tags, variants) in a single query';

-- ============================================================================
-- VIEW: products_full_public
-- Same as products_full but filtered for public access (available products only)
-- ============================================================================

CREATE OR REPLACE VIEW products_full_public AS
SELECT *
FROM products_full
WHERE is_available = true;

COMMENT ON VIEW products_full_public IS 'Public-facing complete product information (available products only)';

-- ============================================================================
-- VIEW: cart_summary
-- User cart with product details and total calculation
-- ============================================================================

CREATE OR REPLACE VIEW cart_summary AS
SELECT 
  ci.id AS cart_item_id,
  ci.user_id,
  ci.product_id,
  ci.variant_id,
  ci.quantity,
  ci.price_snapshot,
  ci.created_at AS added_at,
  
  -- Product information
  p.name AS product_name,
  p.price AS current_price,
  
  -- Primary image
  (
    SELECT pi.image_url
    FROM product_images pi
    WHERE pi.product_id = p.id
      AND pi.is_primary = true
    LIMIT 1
  ) AS product_image,
  
  -- Variant information (if applicable)
  pv.size AS variant_size,
  pv.color AS variant_color,
  pv.price_adjustment AS variant_price_adjustment,
  
  -- Calculated fields
  ci.price_snapshot * ci.quantity AS subtotal,
  
  -- Availability check
  p.is_available AS product_available,
  COALESCE(pv.is_available, true) AS variant_available,
  
  -- Stock check
  CASE
    WHEN ci.variant_id IS NOT NULL THEN 
      ci.quantity <= COALESCE(pv.stock_quantity, 0)
    ELSE 
      ci.quantity <= COALESCE(p.stock_quantity, 0)
  END AS in_stock

FROM cart_items ci
INNER JOIN products p ON ci.product_id = p.id
LEFT JOIN product_variants pv ON ci.variant_id = pv.id;

COMMENT ON VIEW cart_summary IS 'User cart items with product details, pricing, and availability information';

-- ============================================================================
-- VIEW: review_summary
-- Product reviews with user information (respecting RLS)
-- ============================================================================

CREATE OR REPLACE VIEW review_summary AS
SELECT 
  r.id,
  r.product_id,
  r.user_id,
  r.rating,
  r.comment,
  r.is_approved,
  r.helpful_count,
  r.created_at,
  r.updated_at,
  
  -- Product information
  p.name AS product_name,
  
  -- Anonymized user info (for privacy)
  CONCAT('Usuario ', SUBSTRING(r.user_id::TEXT FROM 1 FOR 8)) AS user_display_name

FROM reviews r
INNER JOIN products p ON r.product_id = p.id;

COMMENT ON VIEW review_summary IS 'Product reviews with product names and anonymized user info';

-- ============================================================================
-- VIEW: category_hierarchy
-- Recursive category tree with parent/child relationships
-- ============================================================================

CREATE OR REPLACE VIEW category_hierarchy AS
WITH RECURSIVE category_tree AS (
  -- Base case: root categories (no parent)
  SELECT 
    id,
    name,
    slug,
    parent_id,
    display_order,
    is_active,
    1 AS level,
    ARRAY[id] AS path,
    name::TEXT AS full_path
  FROM categories
  WHERE parent_id IS NULL
  
  UNION ALL
  
  -- Recursive case: child categories
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.parent_id,
    c.display_order,
    c.is_active,
    ct.level + 1,
    ct.path || c.id,
    ct.full_path || ' > ' || c.name
  FROM categories c
  INNER JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree
ORDER BY path;

COMMENT ON VIEW category_hierarchy IS 'Hierarchical category tree with levels and full paths';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Query to verify all views were created
SELECT 
  table_schema,
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'products_full',
    'products_full_public',
    'cart_summary',
    'review_summary',
    'category_hierarchy'
  )
ORDER BY table_name;

-- Test queries for each view
-- ============================================================================

-- Test products_full view
SELECT 
  id, 
  name, 
  material_name,
  jsonb_array_length(images::jsonb) AS image_count,
  jsonb_array_length(categories::jsonb) AS category_count,
  jsonb_array_length(tags::jsonb) AS tag_count,
  jsonb_array_length(variants::jsonb) AS variant_count,
  badge
FROM products_full
LIMIT 5;

-- Test cart_summary view
SELECT 
  cart_item_id,
  product_name,
  variant_size,
  variant_color,
  quantity,
  price_snapshot,
  subtotal,
  product_available,
  in_stock
FROM cart_summary
LIMIT 5;

-- Test category_hierarchy view
SELECT 
  REPEAT('  ', level - 1) || name AS indented_name,
  level,
  full_path
FROM category_hierarchy
WHERE is_active = true;

-- ============================================================================
-- NOTES
-- ============================================================================
-- Views Summary:
-- 
-- 1. products_full
--    - Complete product data with all relations in one query
--    - Includes: material, primary image, all images, categories, tags, variants
--    - Badge calculation (featured or discount percentage)
--    - Use for: Product detail pages, admin panels
--    - Performance: May be slow for large datasets (use pagination)
-- 
-- 2. products_full_public
--    - Same as products_full but filtered for available products only
--    - Use for: Public-facing product lists and detail pages
--    - Respects product availability
-- 
-- 3. cart_summary
--    - User cart with product details and calculations
--    - Includes: pricing, subtotal, availability, stock status
--    - Use for: Shopping cart display, checkout validation
--    - RLS applies: Users only see their own carts
-- 
-- 4. review_summary
--    - Product reviews with product info and anonymized users
--    - Use for: Review lists, moderation panels
--    - Privacy: User IDs shortened to 8 characters
-- 
-- 5. category_hierarchy
--    - Recursive category tree with levels and paths
--    - Use for: Navigation menus, breadcrumbs, category management
--    - Shows full category paths (e.g., "Lámparas > Mesa > Modernas")
-- 
-- Performance Considerations:
-- - Views are not materialized (calculated on each query)
-- - products_full uses subqueries - consider indexes on foreign keys
-- - For high-traffic sites, consider materialized views with refresh
-- - Use LIMIT and OFFSET for pagination with products_full
-- 
-- Usage Examples:
-- 
-- -- Get product with all details
-- SELECT * FROM products_full_public WHERE id = 1;
-- 
-- -- Get user's cart total
-- SELECT 
--   user_id, 
--   SUM(subtotal) AS cart_total
-- FROM cart_summary
-- WHERE user_id = 'user-uuid'
-- GROUP BY user_id;
-- 
-- -- Get category breadcrumb
-- SELECT full_path 
-- FROM category_hierarchy 
-- WHERE id = 5;
-- ============================================================================
