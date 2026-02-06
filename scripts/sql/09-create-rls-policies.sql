-- ============================================================================
-- 09-create-rls-policies.sql
-- Row Level Security policies for all tables
-- ============================================================================
-- Execute after: 08-create-indexes.sql
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MATERIALS TABLE POLICIES
-- ============================================================================

-- Public read access to active materials
CREATE POLICY "materials_select_public" ON materials
  FOR SELECT
  USING (is_active = true);

-- Admins can do everything (for future admin panel)
CREATE POLICY "materials_all_admin" ON materials
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- CATEGORIES TABLE POLICIES
-- ============================================================================

-- Public read access to active categories
CREATE POLICY "categories_select_public" ON categories
  FOR SELECT
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY "categories_all_admin" ON categories
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- TAGS TABLE POLICIES
-- ============================================================================

-- Public read access to active tags
CREATE POLICY "tags_select_public" ON tags
  FOR SELECT
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY "tags_all_admin" ON tags
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- PRODUCTS TABLE POLICIES
-- ============================================================================

-- Public read access to available products
CREATE POLICY "products_select_public" ON products
  FOR SELECT
  USING (is_available = true);

-- Admins can see all products (including unavailable)
CREATE POLICY "products_select_admin" ON products
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Admins can insert, update, delete products
CREATE POLICY "products_all_admin" ON products
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- PRODUCT_CATEGORIES TABLE POLICIES
-- ============================================================================

-- Public read access (linked to products policy)
CREATE POLICY "product_categories_select_public" ON product_categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_categories.product_id 
        AND products.is_available = true
    )
  );

-- Admins can do everything
CREATE POLICY "product_categories_all_admin" ON product_categories
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- PRODUCT_TAGS TABLE POLICIES
-- ============================================================================

-- Public read access (linked to products policy)
CREATE POLICY "product_tags_select_public" ON product_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_tags.product_id 
        AND products.is_available = true
    )
  );

-- Admins can do everything
CREATE POLICY "product_tags_all_admin" ON product_tags
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- PRODUCT_IMAGES TABLE POLICIES
-- ============================================================================

-- Public read access (linked to products policy)
CREATE POLICY "product_images_select_public" ON product_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_images.product_id 
        AND products.is_available = true
    )
  );

-- Admins can do everything
CREATE POLICY "product_images_all_admin" ON product_images
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- PRODUCT_VARIANTS TABLE POLICIES
-- ============================================================================

-- Public read access to available variants of available products
CREATE POLICY "product_variants_select_public" ON product_variants
  FOR SELECT
  USING (
    is_available = true
    AND EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_variants.product_id 
        AND products.is_available = true
    )
  );

-- Admins can see all variants
CREATE POLICY "product_variants_select_admin" ON product_variants
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Admins can insert, update, delete variants
CREATE POLICY "product_variants_all_admin" ON product_variants
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- REVIEWS TABLE POLICIES
-- ============================================================================

-- Public read access to approved reviews only
CREATE POLICY "reviews_select_public" ON reviews
  FOR SELECT
  USING (is_approved = true);

-- Users can see their own reviews (even if not approved)
CREATE POLICY "reviews_select_own" ON reviews
  FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can insert reviews (only their own)
CREATE POLICY "reviews_insert_authenticated" ON reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() IS NOT NULL
  );

-- Users can update their own reviews (before approval)
CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND is_approved = false  -- Can only edit before approval
  )
  WITH CHECK (
    auth.uid() = user_id
    AND is_approved = false
  );

-- Users can delete their own reviews
CREATE POLICY "reviews_delete_own" ON reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can do everything (for moderation)
CREATE POLICY "reviews_all_admin" ON reviews
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- CART_ITEMS TABLE POLICIES
-- ============================================================================

-- Users can only see their own cart items
CREATE POLICY "cart_items_select_own" ON cart_items
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own cart items
CREATE POLICY "cart_items_insert_own" ON cart_items
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() IS NOT NULL
  );

-- Users can only update their own cart items
CREATE POLICY "cart_items_update_own" ON cart_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own cart items
CREATE POLICY "cart_items_delete_own" ON cart_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can see all carts (for support)
CREATE POLICY "cart_items_select_admin" ON cart_items
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Query to verify all policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'materials', 'categories', 'tags', 'products',
    'product_categories', 'product_tags', 'product_images',
    'product_variants', 'reviews', 'cart_items'
  )
ORDER BY tablename, policyname;

-- ============================================================================
-- NOTES
-- ============================================================================
-- RLS Policy Summary:
-- 
-- PUBLIC ACCESS (unauthenticated + authenticated):
-- - materials: Read active materials
-- - categories: Read active categories
-- - tags: Read active tags
-- - products: Read available products
-- - product_categories: Read for available products
-- - product_tags: Read for available products
-- - product_images: Read for available products
-- - product_variants: Read available variants of available products
-- - reviews: Read approved reviews only
-- 
-- AUTHENTICATED USERS:
-- - reviews: Insert own reviews, update own unapproved reviews, delete own reviews
-- - cart_items: Full CRUD on own cart items only
-- 
-- ADMIN ROLE (future):
-- - All tables: Full CRUD access
-- - reviews: Approve/reject reviews (moderation)
-- - products: Manage unavailable products
-- - variants: Manage unavailable variants
-- 
-- SECURITY NOTES:
-- - User isolation: cart_items and reviews filtered by auth.uid()
-- - Product availability: Only available products visible to public
-- - Review moderation: Only approved reviews visible to public
-- - Admin role: Checked via JWT claim 'role' = 'admin'
-- 
-- TESTING RLS:
-- -- Test as anonymous user
-- SET ROLE anon;
-- SELECT * FROM products;  -- Should see only available products
-- 
-- -- Test as authenticated user
-- SET ROLE authenticated;
-- SET request.jwt.claims TO '{"sub": "user-uuid-here"}';
-- SELECT * FROM cart_items;  -- Should see only own cart
-- ============================================================================
