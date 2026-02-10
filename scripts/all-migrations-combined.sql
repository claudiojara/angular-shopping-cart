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
-- =====================================================
-- Script 01: Crear Tablas Base
-- Descripción: Tablas de referencia (materials, categories, tags)
-- Orden de ejecución: PRIMERO
-- =====================================================

-- TABLA: materials
CREATE TABLE IF NOT EXISTS materials (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7),
  properties JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE materials IS 'Materiales de impresión 3D (PLA, ABS, etc.)';
COMMENT ON COLUMN materials.properties IS 'Propiedades adicionales: durabilidad, peso, temperatura, etc.';
COMMENT ON COLUMN materials.code IS 'Código único del material (PLA, ABS, PETG, etc.)';
COMMENT ON COLUMN materials.color IS 'Color representativo en hex (#E8E8E8 para PLA blanco)';

-- TABLA: categories (con soporte jerárquico)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'Categorías de productos (jerárquicas con parent_id)';
COMMENT ON COLUMN categories.parent_id IS 'ID de categoría padre para subcategorías';

-- TABLA: tags
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) UNIQUE NOT NULL,
  color VARCHAR(7),
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE tags IS 'Etiquetas de estilo/características (geométrico, minimalista, etc.)';
COMMENT ON COLUMN tags.color IS 'Color hex para UI (#FF5733)';
-- =====================================================
-- Script 02: Crear Tabla Products
-- Descripción: Tabla principal de productos
-- Orden de ejecución: SEGUNDO (después de 01)
-- =====================================================

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description VARCHAR(500),
  
  -- Precios (en centavos CLP)
  price INTEGER NOT NULL CHECK (price > 0),
  original_price INTEGER CHECK (original_price > 0),
  
  -- Referencias
  material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
  
  -- Inventario
  sku VARCHAR(100) UNIQUE,
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 5,
  
  -- Ratings
  average_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5),
  review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
  
  -- Estados
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Atributos físicos
  weight_grams INTEGER CHECK (weight_grams > 0),
  dimensions_cm VARCHAR(50),
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE products IS 'Tabla principal de productos (lámparas 3D)';
COMMENT ON COLUMN products.price IS 'Precio en centavos CLP (ej: 30166 = $30.166)';
COMMENT ON COLUMN products.slug IS 'URL-friendly name para SEO';
COMMENT ON COLUMN products.is_featured IS 'Productos destacados en home';
-- =====================================================
-- Script 03: Crear Tablas de Relaciones N:N
-- Descripción: product_categories y product_tags
-- Orden de ejecución: TERCERO
-- =====================================================

-- TABLA: product_categories (N:N)
CREATE TABLE IF NOT EXISTS product_categories (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (product_id, category_id)
);

COMMENT ON TABLE product_categories IS 'Relación N:N entre productos y categorías';
COMMENT ON COLUMN product_categories.is_primary IS 'Solo una categoría primaria por producto';

-- TABLA: product_tags (N:N)
CREATE TABLE IF NOT EXISTS product_tags (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (product_id, tag_id)
);

COMMENT ON TABLE product_tags IS 'Relación N:N entre productos y tags';
-- =====================================================
-- Script 04: Crear Tabla de Imágenes
-- Descripción: Soporte para múltiples imágenes por producto
-- Orden de ejecución: CUARTO
-- =====================================================

CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  width INTEGER,
  height INTEGER,
  file_size_kb INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE product_images IS 'Galería de imágenes de productos (Unsplash por ahora)';
COMMENT ON COLUMN product_images.is_primary IS 'Imagen principal que se muestra en listados';
COMMENT ON COLUMN product_images.display_order IS 'Orden de visualización en galería';
-- =====================================================
-- Script 05: Crear Tabla de Variantes
-- Descripción: Soporte para tallas, colores, opciones
-- Orden de ejecución: QUINTO
-- =====================================================

CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR(50),
  color VARCHAR(50),
  price_adjustment INTEGER DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  sku VARCHAR(100) UNIQUE,
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE product_variants IS 'Variantes de productos (talla, color, etc.)';
COMMENT ON COLUMN product_variants.price_adjustment IS 'Ajuste de precio respecto al producto base (+/-)';
COMMENT ON COLUMN product_variants.size IS 'Ej: "+4", "+6", "Pequeño", "Grande"';
COMMENT ON COLUMN product_variants.color IS 'Ej: "Blanco", "Negro", "Natural"';
-- =====================================================
-- Script 06: Crear Tabla de Reviews
-- Descripción: Sistema de reseñas con moderación
-- Orden de ejecución: SEXTO
-- =====================================================

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

COMMENT ON TABLE reviews IS 'Reseñas de productos con sistema de moderación';
COMMENT ON COLUMN reviews.is_verified_purchase IS 'Compra verificada (implementar después con sistema de órdenes)';
COMMENT ON COLUMN reviews.is_approved IS 'Requiere aprobación manual por admin';
COMMENT ON COLUMN reviews.helpful_count IS 'Contador de "útil" para ordenar reviews';
-- =====================================================
-- Script 07: Mejorar Tabla cart_items Existente
-- Descripción: Agregar FKs, variantes, constraints
-- Orden de ejecución: SÉPTIMO
-- =====================================================

-- Verificar si la FK ya existe antes de agregarla
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_cart_items_product'
  ) THEN
    ALTER TABLE cart_items 
      ADD CONSTRAINT fk_cart_items_product 
      FOREIGN KEY (product_id) 
      REFERENCES products(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- Agregar columna para variantes (si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cart_items' AND column_name = 'variant_id'
  ) THEN
    ALTER TABLE cart_items 
      ADD COLUMN variant_id INTEGER 
      REFERENCES product_variants(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- Agregar columna para snapshot de precio (si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cart_items' AND column_name = 'price_snapshot'
  ) THEN
    ALTER TABLE cart_items 
      ADD COLUMN price_snapshot INTEGER;
  END IF;
END $$;

-- Agregar constraint de cantidad positiva (si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_cart_items_quantity'
  ) THEN
    ALTER TABLE cart_items 
      ADD CONSTRAINT chk_cart_items_quantity 
      CHECK (quantity > 0);
  END IF;
END $$;

-- Eliminar índice único anterior si existe (para recrearlo)
DROP INDEX IF EXISTS idx_cart_items_unique;

-- Agregar índice único para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_unique 
  ON cart_items(user_id, product_id, COALESCE(variant_id, 0));

COMMENT ON COLUMN cart_items.variant_id IS 'ID de variante seleccionada (opcional)';
COMMENT ON COLUMN cart_items.price_snapshot IS 'Precio al momento de agregar al carrito (histórico)';
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
-- ============================================================================
-- 10-create-functions.sql
-- Database functions and triggers for automation
-- ============================================================================
-- Execute after: 09-create-rls-policies.sql
-- ============================================================================

-- ============================================================================
-- FUNCTION 1: Update updated_at timestamp automatically
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
DROP TRIGGER IF EXISTS update_materials_updated_at ON materials;
CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tags_updated_at ON tags;
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_images_updated_at ON product_images;
CREATE TRIGGER update_product_images_updated_at
  BEFORE UPDATE ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION 2: Update product average rating and review count
-- ============================================================================

CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  product_id_to_update INTEGER;
BEGIN
  -- Determine which product to update
  IF TG_OP = 'DELETE' THEN
    product_id_to_update := OLD.product_id;
  ELSE
    product_id_to_update := NEW.product_id;
  END IF;

  -- Update the product's average_rating and review_count
  UPDATE products
  SET 
    average_rating = (
      SELECT AVG(rating)::NUMERIC(3,2)
      FROM reviews
      WHERE product_id = product_id_to_update
        AND is_approved = true
    ),
    review_count = (
      SELECT COUNT(*)::INTEGER
      FROM reviews
      WHERE product_id = product_id_to_update
        AND is_approved = true
    )
  WHERE id = product_id_to_update;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger after insert, update, or delete of reviews
DROP TRIGGER IF EXISTS update_product_rating_after_review_change ON reviews;
CREATE TRIGGER update_product_rating_after_review_change
  AFTER INSERT OR UPDATE OF rating, is_approved OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

-- ============================================================================
-- FUNCTION 3: Ensure only one primary image per product
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting an image as primary, unset all other primary images for this product
  IF NEW.is_primary = true THEN
    UPDATE product_images
    SET is_primary = false
    WHERE product_id = NEW.product_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger before insert or update of product_images
DROP TRIGGER IF EXISTS ensure_single_primary_image_trigger ON product_images;
CREATE TRIGGER ensure_single_primary_image_trigger
  BEFORE INSERT OR UPDATE OF is_primary ON product_images
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION ensure_single_primary_image();

-- ============================================================================
-- FUNCTION 4: Validate cart item constraints
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_cart_item()
RETURNS TRIGGER AS $$
DECLARE
  product_available BOOLEAN;
  variant_available BOOLEAN;
  variant_belongs_to_product BOOLEAN;
BEGIN
  -- Check if product is available
  SELECT is_available INTO product_available
  FROM products
  WHERE id = NEW.product_id;

  IF NOT product_available THEN
    RAISE EXCEPTION 'Cannot add unavailable product to cart (product_id: %)', NEW.product_id;
  END IF;

  -- If variant is specified, validate it
  IF NEW.variant_id IS NOT NULL THEN
    -- Check if variant exists and is available
    SELECT is_available INTO variant_available
    FROM product_variants
    WHERE id = NEW.variant_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variant does not exist (variant_id: %)', NEW.variant_id;
    END IF;

    IF NOT variant_available THEN
      RAISE EXCEPTION 'Cannot add unavailable variant to cart (variant_id: %)', NEW.variant_id;
    END IF;

    -- Check if variant belongs to the product
    SELECT EXISTS (
      SELECT 1 FROM product_variants
      WHERE id = NEW.variant_id AND product_id = NEW.product_id
    ) INTO variant_belongs_to_product;

    IF NOT variant_belongs_to_product THEN
      RAISE EXCEPTION 'Variant % does not belong to product %', NEW.variant_id, NEW.product_id;
    END IF;
  END IF;

  -- Quantity must be positive
  IF NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Cart item quantity must be positive (quantity: %)', NEW.quantity;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger before insert or update of cart_items
DROP TRIGGER IF EXISTS validate_cart_item_trigger ON cart_items;
CREATE TRIGGER validate_cart_item_trigger
  BEFORE INSERT OR UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_cart_item();

-- ============================================================================
-- FUNCTION 5: Snapshot product price when adding to cart
-- ============================================================================

CREATE OR REPLACE FUNCTION snapshot_cart_item_price()
RETURNS TRIGGER AS $$
DECLARE
  product_price INTEGER;
  variant_price_adjustment INTEGER;
BEGIN
  -- Get the product's current price
  SELECT price INTO product_price
  FROM products
  WHERE id = NEW.product_id;

  -- If variant is specified, get its price adjustment
  IF NEW.variant_id IS NOT NULL THEN
    SELECT COALESCE(price_adjustment, 0) INTO variant_price_adjustment
    FROM product_variants
    WHERE id = NEW.variant_id;
  ELSE
    variant_price_adjustment := 0;
  END IF;

  -- Calculate and store the snapshot price (only on INSERT, not UPDATE)
  IF TG_OP = 'INSERT' THEN
    NEW.price_snapshot := product_price + variant_price_adjustment;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger before insert of cart_items
DROP TRIGGER IF EXISTS snapshot_cart_item_price_trigger ON cart_items;
CREATE TRIGGER snapshot_cart_item_price_trigger
  BEFORE INSERT ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION snapshot_cart_item_price();

-- ============================================================================
-- FUNCTION 6: Prevent duplicate cart items (user + product + variant)
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_duplicate_cart_items()
RETURNS TRIGGER AS $$
DECLARE
  existing_item_id INTEGER;
BEGIN
  -- Check if cart item already exists (same user, product, and variant)
  SELECT id INTO existing_item_id
  FROM cart_items
  WHERE user_id = NEW.user_id
    AND product_id = NEW.product_id
    AND (
      (variant_id IS NULL AND NEW.variant_id IS NULL)
      OR variant_id = NEW.variant_id
    )
    AND id != COALESCE(NEW.id, 0);  -- Exclude current item on UPDATE

  IF FOUND THEN
    RAISE EXCEPTION 'Cart item already exists. Use UPDATE to change quantity. (existing_id: %)', existing_item_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger before insert or update of cart_items
DROP TRIGGER IF EXISTS prevent_duplicate_cart_items_trigger ON cart_items;
CREATE TRIGGER prevent_duplicate_cart_items_trigger
  BEFORE INSERT OR UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_cart_items();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Query to verify all functions were created
SELECT 
  routine_schema,
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_updated_at_column',
    'update_product_rating',
    'ensure_single_primary_image',
    'validate_cart_item',
    'snapshot_cart_item_price',
    'prevent_duplicate_cart_items'
  )
ORDER BY routine_name;

-- Query to verify all triggers were created
SELECT 
  trigger_schema,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN (
    'materials', 'categories', 'tags', 'products',
    'product_images', 'product_variants', 'reviews', 'cart_items'
  )
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- NOTES
-- ============================================================================
-- Functions Summary:
-- 
-- 1. update_updated_at_column()
--    - Automatically updates updated_at timestamp on any UPDATE
--    - Applied to: materials, categories, tags, products, product_images,
--                  product_variants, reviews, cart_items
-- 
-- 2. update_product_rating()
--    - Recalculates average_rating and review_count for products
--    - Triggered by: INSERT, UPDATE (rating/is_approved), DELETE on reviews
--    - Only counts approved reviews
-- 
-- 3. ensure_single_primary_image()
--    - Ensures only one image is primary per product
--    - When setting an image as primary, unsets all others
--    - Triggered by: INSERT, UPDATE (is_primary) on product_images
-- 
-- 4. validate_cart_item()
--    - Validates product availability
--    - Validates variant availability and ownership
--    - Ensures quantity > 0
--    - Triggered by: INSERT, UPDATE on cart_items
-- 
-- 5. snapshot_cart_item_price()
--    - Captures product price + variant adjustment when adding to cart
--    - Prevents price changes from affecting existing cart items
--    - Triggered by: INSERT on cart_items (not UPDATE)
-- 
-- 6. prevent_duplicate_cart_items()
--    - Prevents duplicate (user + product + variant) combinations
--    - Forces using UPDATE to change quantity instead of INSERT
--    - Triggered by: INSERT, UPDATE on cart_items
-- 
-- Benefits:
-- - Data integrity: Automatic validation and consistency
-- - Performance: Denormalized rating/count updated automatically
-- - User experience: Price snapshots preserve cart accuracy
-- - Developer experience: Less manual validation code in application
-- 
-- Testing:
-- -- Test rating update
-- INSERT INTO reviews (product_id, user_id, rating, comment, is_approved) 
-- VALUES (1, 'user-uuid', 5, 'Great product!', true);
-- SELECT average_rating, review_count FROM products WHERE id = 1;
-- 
-- -- Test duplicate prevention
-- INSERT INTO cart_items (user_id, product_id, quantity) VALUES ('user-uuid', 1, 1);
-- INSERT INTO cart_items (user_id, product_id, quantity) VALUES ('user-uuid', 1, 1);  -- Should fail
-- ============================================================================
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
-- ============================================================================
-- 12-insert-seed-data.sql
-- Initial seed data for materials, categories, and tags
-- ============================================================================
-- Execute after: 11-create-views.sql
-- ============================================================================

-- ============================================================================
-- MATERIALS (2 materials for 3D printing)
-- ============================================================================

INSERT INTO materials (code, name, description, color, display_order, is_active)
VALUES
  ('PLA', 'PLA (Ácido Poliláctico)', 'Material biodegradable, ideal para objetos decorativos. Fácil de imprimir y acabado suave.', '#E8E8E8', 1, true),
  ('ABS', 'ABS (Acrilonitrilo Butadieno Estireno)', 'Material resistente y duradero. Ideal para piezas funcionales que requieren mayor resistencia.', '#404040', 2, true);

-- ============================================================================
-- CATEGORIES (5 main categories - hierarchical structure ready)
-- ============================================================================

INSERT INTO categories (name, slug, description, parent_id, display_order, is_active)
VALUES
  -- Main categories (no parent)
  ('Lámparas de Mesa', 'lamparas-mesa', 'Lámparas diseñadas para escritorio o mesa de noche', NULL, 1, true),
  ('Lámparas de Velador', 'lamparas-velador', 'Lámparas compactas ideales para mesita de noche', NULL, 2, true),
  ('Colección Líneas', 'coleccion-lineas', 'Diseños con patrones lineales y geométricos', NULL, 3, true),
  ('Colección Malla', 'coleccion-malla', 'Diseños con texturas de malla y entramados', NULL, 4, true),
  ('Edición Limitada', 'edicion-limitada', 'Productos exclusivos en cantidades limitadas', NULL, 5, true);

-- Examples of subcategories (commented out - ready for future use)
-- INSERT INTO categories (name, slug, description, parent_id, display_order, is_active)
-- VALUES
--   ('Mesa Modernas', 'mesa-modernas', 'Lámparas de mesa con diseño moderno', 1, 1, true),
--   ('Mesa Clásicas', 'mesa-clasicas', 'Lámparas de mesa con diseño clásico', 1, 2, true);

-- ============================================================================
-- TAGS (12 style tags)
-- ============================================================================

INSERT INTO tags (name, slug, display_order, is_active)
VALUES
  ('geométrico', 'geometrico', 1, true),
  ('minimalista', 'minimalista', 2, true),
  ('moderno', 'moderno', 3, true),
  ('escandinavo', 'escandinavo', 4, true),
  ('industrial', 'industrial', 5, true),
  ('orgánico', 'organico', 6, true),
  ('futurista', 'futurista', 7, true),
  ('elegante', 'elegante', 8, true),
  ('artesanal', 'artesanal', 9, true),
  ('compacto', 'compacto', 10, true),
  ('texturizado', 'texturizado', 11, true),
  ('iluminación-ambiental', 'iluminacion-ambiental', 12, true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify materials
SELECT 
  code,
  name,
  display_order,
  is_active
FROM materials
ORDER BY display_order;

-- Verify categories
SELECT 
  id,
  name,
  slug,
  parent_id,
  display_order,
  is_active
FROM categories
ORDER BY display_order;

-- Verify tags
SELECT 
  id,
  name,
  slug,
  display_order,
  is_active
FROM tags
ORDER BY display_order;

-- Count records
SELECT 
  'materials' AS table_name, COUNT(*) AS record_count FROM materials
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'tags', COUNT(*) FROM tags;

-- ============================================================================
-- NOTES
-- ============================================================================
-- Seed Data Summary:
-- 
-- MATERIALS (2 records):
-- - PLA: Most common 3D printing material (10/12 products use this)
-- - ABS: Stronger material (2/12 products use this)
-- 
-- CATEGORIES (5 records):
-- - Lámparas de Mesa (4 products)
-- - Lámparas de Velador (3 products)
-- - Colección Líneas (2 products)
-- - Colección Malla (2 products)
-- - Edición Limitada (1 product)
-- 
-- Note: Products can belong to multiple categories via product_categories table
-- Example: "Lámpara Geométrica Mesh" is in both "Lámparas de Mesa" AND "Colección Malla"
-- 
-- TAGS (12 records):
-- - geométrico, minimalista, moderno, escandinavo, industrial
-- - orgánico, futurista, elegante, artesanal, compacto
-- - texturizado, iluminación-ambiental
-- 
-- Tag usage examples:
-- - "Lámpara Espiral Elegante" → tags: elegante, moderno
-- - "Velador Líneas Minimalista" → tags: minimalista, geométrico, compacto
-- - "Lámpara Ondas Orgánicas" → tags: orgánico, elegante
-- 
-- HIERARCHICAL CATEGORIES (Ready for future):
-- - Currently all categories are root level (parent_id = NULL)
-- - Schema supports subcategories via parent_id
-- - Example subcategory SQL provided (commented out)
-- - Use category_hierarchy view to query nested categories
-- 
-- NEXT STEPS:
-- 1. Execute this seed data script
-- 2. Run migrate-products-to-db.mjs to insert 12 products
-- 3. The migration script will:
--    - Insert products with material_id references
--    - Create product_categories relationships (N:N)
--    - Create product_tags relationships (N:N)
--    - Insert product_images records
--    - Create product_variants for size/color options
-- 
-- DATA INTEGRITY:
-- - All slugs are URL-safe (lowercase, hyphenated)
-- - Display orders allow for logical sorting
-- - All records marked as active (is_active = true)
-- - Descriptions provided for better UX
-- ============================================================================

-- ============================================================================
-- 15-create-payment-audit-log.sql
-- ============================================================================
-- =====================================================
-- Script 15: Crear Tabla de Auditoría de Pagos
-- Descripción: Registro completo de pagos procesados desde Flow.cl
-- Orden de ejecución: DECIMOQUINTO
-- =====================================================

-- TABLA: payment_audit_log
-- Almacena registro de auditoría para cada pago procesado
CREATE TABLE IF NOT EXISTS payment_audit_log (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Información de Flow
  flow_order_id VARCHAR(255),
  
  -- Estado del pago
  status VARCHAR(50) NOT NULL,
  
  -- Monto del pago (para validación)
  amount DECIMAL(12,2) NOT NULL,
  
  -- Método de pago utilizado
  payment_method VARCHAR(100),
  
  -- Resultado del procesamiento de stock
  stock_processed INTEGER DEFAULT 0,
  stock_success BOOLEAN DEFAULT false,
  stock_errors JSONB DEFAULT '[]',
  
  -- Timestamps
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE payment_audit_log IS 'Registro de auditoría para pagos procesados desde Flow.cl';
COMMENT ON COLUMN payment_audit_log.order_id IS 'Referencia a la orden pagada';
COMMENT ON COLUMN payment_audit_log.flow_order_id IS 'ID de Flow para trazabilidad';
COMMENT ON COLUMN payment_audit_log.status IS 'Estado final del pago (paid, failed, cancelled)';
COMMENT ON COLUMN payment_audit_log.amount IS 'Monto procesado (para detección de fraude)';
COMMENT ON COLUMN payment_audit_log.payment_method IS 'Método de pago (Webpay, Servipag, etc.)';
COMMENT ON COLUMN payment_audit_log.stock_processed IS 'Cantidad de productos con stock reducido';
COMMENT ON COLUMN payment_audit_log.stock_success IS 'Indica si la reducción de stock fue exitosa';
COMMENT ON COLUMN payment_audit_log.stock_errors IS 'Array de errores si falló la reducción de stock';
COMMENT ON COLUMN payment_audit_log.processed_at IS 'Fecha/hora de procesamiento del webhook';

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Índice para búsqueda por orden
CREATE INDEX IF NOT EXISTS idx_payment_audit_order_id 
  ON payment_audit_log(order_id);

-- Índice para búsqueda por Flow order ID
CREATE INDEX IF NOT EXISTS idx_payment_audit_flow_order_id 
  ON payment_audit_log(flow_order_id);

-- Índice para búsqueda por fecha (útil para reportes)
CREATE INDEX IF NOT EXISTS idx_payment_audit_processed_at 
  ON payment_audit_log(processed_at DESC);

-- Índice para filtrar por estado
CREATE INDEX IF NOT EXISTS idx_payment_audit_status 
  ON payment_audit_log(status);

-- Índice para encontrar pagos con errores de stock
CREATE INDEX IF NOT EXISTS idx_payment_audit_stock_success 
  ON payment_audit_log(stock_success) 
  WHERE stock_success = false;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE payment_audit_log ENABLE ROW LEVEL SECURITY;

-- POLICY: Permitir insert desde service role (webhook)
CREATE POLICY "Allow insert from service role" 
  ON payment_audit_log 
  FOR INSERT 
  WITH CHECK (true);

-- POLICY: Los usuarios pueden ver sus propios registros de auditoría
CREATE POLICY "Users can view own payment audit logs"
  ON payment_audit_log 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payment_audit_log.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- POLICY: Solo admins pueden actualizar registros de auditoría
CREATE POLICY "Only admins can update audit logs"
  ON payment_audit_log 
  FOR UPDATE
  USING (false);

-- POLICY: No permitir deletes (auditoría inmutable)
CREATE POLICY "No deletes allowed on audit logs"
  ON payment_audit_log 
  FOR DELETE
  USING (false);

-- =====================================================
-- VISTA: Resumen de pagos por día
-- =====================================================

CREATE OR REPLACE VIEW payment_daily_summary AS
SELECT 
  DATE(processed_at) as date,
  COUNT(*) as total_payments,
  SUM(amount) as total_amount,
  COUNT(CASE WHEN status = 'paid' THEN 1 END) as successful_payments,
  SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as successful_amount,
  SUM(CASE WHEN stock_success THEN 1 ELSE 0 END) as stock_updates_successful,
  SUM(CASE WHEN NOT stock_success THEN 1 ELSE 0 END) as stock_updates_failed
FROM payment_audit_log
GROUP BY DATE(processed_at)
ORDER BY date DESC;

COMMENT ON VIEW payment_daily_summary IS 'Resumen diario de pagos procesados con estadísticas de stock';

-- =====================================================
-- VISTA: Pagos con errores de stock
-- =====================================================

CREATE OR REPLACE VIEW payment_stock_errors AS
SELECT 
  pal.id,
  pal.order_id,
  pal.flow_order_id,
  pal.status,
  pal.amount,
  pal.payment_method,
  pal.stock_processed,
  pal.stock_errors,
  pal.processed_at,
  o.user_id,
  o.shipping_email
FROM payment_audit_log pal
JOIN orders o ON o.id = pal.order_id
WHERE pal.stock_success = false
ORDER BY pal.processed_at DESC;

COMMENT ON VIEW payment_stock_errors IS 'Lista de pagos donde falló la reducción de stock (requiere atención)';

-- =====================================================
-- FUNCIÓN: Obtener auditoría de pago por orden
-- =====================================================

CREATE OR REPLACE FUNCTION get_payment_audit_by_order(
  p_order_id BIGINT
)
RETURNS TABLE (
  id BIGINT,
  flow_order_id VARCHAR(255),
  status VARCHAR(50),
  amount DECIMAL(12,2),
  payment_method VARCHAR(100),
  stock_processed INTEGER,
  stock_success BOOLEAN,
  stock_errors JSONB,
  processed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pal.id,
    pal.flow_order_id,
    pal.status,
    pal.amount,
    pal.payment_method,
    pal.stock_processed,
    pal.stock_success,
    pal.stock_errors,
    pal.processed_at
  FROM payment_audit_log pal
  WHERE pal.order_id = p_order_id
  ORDER BY pal.processed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_payment_audit_by_order IS 'Obtiene el historial de auditoría de pagos para una orden específica';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_audit_log') THEN
    RAISE NOTICE '✓ Tabla payment_audit_log creada correctamente';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'payment_daily_summary') THEN
    RAISE NOTICE '✓ Vista payment_daily_summary creada correctamente';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'payment_stock_errors') THEN
    RAISE NOTICE '✓ Vista payment_stock_errors creada correctamente';
  END IF;
END $$;

-- ============================================================================
-- 16-create-reduce-stock-function.sql
-- ============================================================================
-- =====================================================
-- Script 16: Crear Función de Reducción de Stock
-- Descripción: Función segura para reducir stock de productos
-- Orden de ejecución: DECIMOSEXTO
-- =====================================================

-- =====================================================
-- FUNCIÓN: Reducir stock de producto
-- =====================================================

CREATE OR REPLACE FUNCTION reduce_product_stock(
  p_product_id BIGINT,
  p_quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_stock INTEGER;
  v_product_name VARCHAR(255);
  v_new_stock INTEGER;
BEGIN
  -- Obtener información actual del producto
  SELECT 
    stock_quantity, 
    name 
  INTO 
    v_current_stock, 
    v_product_name
  FROM products
  WHERE id = p_product_id;
  
  -- Verificar que el producto existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado: %', p_product_id;
  END IF;
  
  -- Verificar stock suficiente
  IF v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Stock insuficiente para producto "%": solicitado %, disponible %', 
      v_product_name, p_quantity, v_current_stock;
  END IF;
  
  -- Calcular nuevo stock
  v_new_stock := v_current_stock - p_quantity;
  
  -- Actualizar stock
  UPDATE products
  SET 
    stock_quantity = v_new_stock,
    updated_at = NOW()
  WHERE id = p_product_id;
  
  -- Verificar que se actualizó
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Error al actualizar stock para producto: %', p_product_id;
  END IF;
  
  -- Log de éxito (opcional, para debugging)
  RAISE NOTICE 'Stock reducido para "%": % → % (-% unidades)', 
    v_product_name, v_current_stock, v_new_stock, p_quantity;
    
END;
$$;

COMMENT ON FUNCTION reduce_product_stock IS 'Reduce el stock de un producto de forma segura. Verifica stock suficiente y actualiza automáticamente. Usada por el webhook de Flow.';

-- =====================================================
-- FUNCIÓN: Incrementar stock (para devoluciones/cancelaciones)
-- =====================================================

CREATE OR REPLACE FUNCTION increment_product_stock(
  p_product_id BIGINT,
  p_quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_stock INTEGER;
  v_product_name VARCHAR(255);
  v_new_stock INTEGER;
BEGIN
  -- Obtener información actual del producto
  SELECT 
    stock_quantity, 
    name 
  INTO 
    v_current_stock, 
    v_product_name
  FROM products
  WHERE id = p_product_id;
  
  -- Verificar que el producto existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado: %', p_product_id;
  END IF;
  
  -- Calcular nuevo stock
  v_new_stock := v_current_stock + p_quantity;
  
  -- Actualizar stock
  UPDATE products
  SET 
    stock_quantity = v_new_stock,
    updated_at = NOW()
  WHERE id = p_product_id;
  
  -- Verificar que se actualizó
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Error al incrementar stock para producto: %', p_product_id;
  END IF;
  
  -- Log de éxito
  RAISE NOTICE 'Stock incrementado para "%": % → % (+% unidades)', 
    v_product_name, v_current_stock, v_new_stock, p_quantity;
    
END;
$$;

COMMENT ON FUNCTION increment_product_stock IS 'Incrementa el stock de un producto (útil para devoluciones o cancelaciones). Usada para revertir reducciones de stock.';

-- =====================================================
-- FUNCIÓN: Verificar disponibilidad de stock
-- =====================================================

CREATE OR REPLACE FUNCTION check_product_stock(
  p_product_id BIGINT,
  p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_stock INTEGER;
BEGIN
  SELECT stock_quantity 
  INTO v_current_stock
  FROM products
  WHERE id = p_product_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  RETURN v_current_stock >= p_quantity;
END;
$$;

COMMENT ON FUNCTION check_product_stock IS 'Verifica si hay stock suficiente para un producto sin modificarlo. Retorna true si hay stock suficiente.';

-- =====================================================
-- FUNCIÓN: Obtener stock actual
-- =====================================================

CREATE OR REPLACE FUNCTION get_product_stock(
  p_product_id BIGINT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock INTEGER;
BEGIN
  SELECT stock_quantity 
  INTO v_stock
  FROM products
  WHERE id = p_product_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  RETURN v_stock;
END;
$$;

COMMENT ON FUNCTION get_product_stock IS 'Obtiene el stock actual de un producto. Retorna NULL si el producto no existe.';

-- =====================================================
-- TRIGGER: Prevenir stock negativo
-- =====================================================

CREATE OR REPLACE FUNCTION prevent_negative_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock_quantity < 0 THEN
    RAISE EXCEPTION 'El stock no puede ser negativo. Producto: %, Stock intentado: %', 
      NEW.name, NEW.stock_quantity;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tabla products si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_prevent_negative_stock'
  ) THEN
    CREATE TRIGGER trigger_prevent_negative_stock
      BEFORE INSERT OR UPDATE ON products
      FOR EACH ROW
      EXECUTE FUNCTION prevent_negative_stock();
    
    RAISE NOTICE '✓ Trigger prevent_negative_stock creado';
  END IF;
END $$;

COMMENT ON FUNCTION prevent_negative_stock() IS 'Trigger que previene que el stock de un producto sea negativo';

-- =====================================================
-- VISTA: Productos con bajo stock
-- =====================================================

CREATE OR REPLACE VIEW products_low_stock AS
SELECT 
  id,
  name,
  slug,
  stock_quantity,
  price,
  is_available,
  CASE 
    WHEN stock_quantity = 0 THEN 'out_of_stock'
    WHEN stock_quantity <= 5 THEN 'critical'
    WHEN stock_quantity <= 10 THEN 'low'
    ELSE 'normal'
  END as stock_status
FROM products
WHERE stock_quantity <= 10
  AND is_available = true
ORDER BY stock_quantity ASC;

COMMENT ON VIEW products_low_stock IS 'Lista de productos con stock bajo (<= 10 unidades) que requieren atención';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'reduce_product_stock') THEN
    RAISE NOTICE '✓ Función reduce_product_stock creada correctamente';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_product_stock') THEN
    RAISE NOTICE '✓ Función increment_product_stock creada correctamente';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_product_stock') THEN
    RAISE NOTICE '✓ Función check_product_stock creada correctamente';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_product_stock') THEN
    RAISE NOTICE '✓ Función get_product_stock creada correctamente';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'products_low_stock') THEN
    RAISE NOTICE '✓ Vista products_low_stock creada correctamente';
  END IF;
END $$;
