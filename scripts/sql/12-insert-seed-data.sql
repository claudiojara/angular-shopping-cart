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
