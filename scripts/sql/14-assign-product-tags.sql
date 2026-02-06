-- ============================================================================
-- 14-assign-product-tags.sql
-- Assign style tags to existing products
-- ============================================================================
-- Execute after: 13-add-product-gallery-images.sql
-- ============================================================================

-- ============================================================================
-- Assign tags to products based on their design characteristics
-- ============================================================================

-- Product 1: Velora (Modern desk lamp)
-- Tags: geométrico, minimalista, moderno
INSERT INTO product_tags (product_id, tag_id)
SELECT 1, id FROM tags WHERE slug IN ('geometrico', 'minimalista', 'moderno')
ON CONFLICT DO NOTHING;

-- Product 2: Lunora (Bedside lamp with mesh texture)
-- Tags: minimalista, moderno, texturizado, compacto
INSERT INTO product_tags (product_id, tag_id)
SELECT 2, id FROM tags WHERE slug IN ('minimalista', 'moderno', 'texturizado', 'compacto')
ON CONFLICT DO NOTHING;

-- Product 3: Aurora (Geometric floor lamp)
-- Tags: geométrico, elegante, iluminación-ambiental
INSERT INTO product_tags (product_id, tag_id)
SELECT 3, id FROM tags WHERE slug IN ('geometrico', 'elegante', 'iluminacion-ambiental')
ON CONFLICT DO NOTHING;

-- Product 4: Nexia (Futuristic desk lamp)
-- Tags: futurista, industrial, moderno
INSERT INTO product_tags (product_id, tag_id)
SELECT 4, id FROM tags WHERE slug IN ('futurista', 'industrial', 'moderno')
ON CONFLICT DO NOTHING;

-- Product 5: Línea Esencial (Line pattern lamp)
-- Tags: geométrico, minimalista, escandinavo
INSERT INTO product_tags (product_id, tag_id)
SELECT 5, id FROM tags WHERE slug IN ('geometrico', 'minimalista', 'escandinavo')
ON CONFLICT DO NOTHING;

-- Product 6: Malla Luna (Mesh texture lamp)
-- Tags: orgánico, texturizado, artesanal, compacto
INSERT INTO product_tags (product_id, tag_id)
SELECT 6, id FROM tags WHERE slug IN ('organico', 'texturizado', 'artesanal', 'compacto')
ON CONFLICT DO NOTHING;

-- Product 7: Helix Velador (Spiral design)
-- Tags: geométrico, elegante, compacto
INSERT INTO product_tags (product_id, tag_id)
SELECT 7, id FROM tags WHERE slug IN ('geometrico', 'elegante', 'compacto')
ON CONFLICT DO NOTHING;

-- Product 8: Cubo Minimal (Cubic minimal lamp)
-- Tags: geométrico, minimalista, escandinavo, compacto
INSERT INTO product_tags (product_id, tag_id)
SELECT 8, id FROM tags WHERE slug IN ('geometrico', 'minimalista', 'escandinavo', 'compacto')
ON CONFLICT DO NOTHING;

-- Product 9: Ondas (Wave pattern)
-- Tags: orgánico, elegante, iluminación-ambiental
INSERT INTO product_tags (product_id, tag_id)
SELECT 9, id FROM tags WHERE slug IN ('organico', 'elegante', 'iluminacion-ambiental')
ON CONFLICT DO NOTHING;

-- Product 10: Zenith (Modern design)
-- Tags: moderno, elegante, minimalista
INSERT INTO product_tags (product_id, tag_id)
SELECT 10, id FROM tags WHERE slug IN ('moderno', 'elegante', 'minimalista')
ON CONFLICT DO NOTHING;

-- Product 11: Prisma (Geometric prism)
-- Tags: geométrico, futurista, iluminación-ambiental
INSERT INTO product_tags (product_id, tag_id)
SELECT 11, id FROM tags WHERE slug IN ('geometrico', 'futurista', 'iluminacion-ambiental')
ON CONFLICT DO NOTHING;

-- Product 12: Neo Classic (Classic reimagined)
-- Tags: elegante, artesanal, iluminación-ambiental
INSERT INTO product_tags (product_id, tag_id)
SELECT 12, id FROM tags WHERE slug IN ('elegante', 'artesanal', 'iluminacion-ambiental')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check tags assigned per product
SELECT 
  p.id,
  p.name,
  COUNT(pt.tag_id) AS tag_count,
  STRING_AGG(t.name, ', ' ORDER BY t.name) AS tags
FROM products p
LEFT JOIN product_tags pt ON p.id = pt.product_id
LEFT JOIN tags t ON pt.tag_id = t.id
GROUP BY p.id, p.name
ORDER BY p.id;

-- Check which products have tags in products_full_public view
SELECT 
  id,
  name,
  jsonb_array_length(tags::jsonb) AS tag_count,
  tags
FROM products_full_public
ORDER BY id;

-- Count total tag assignments
SELECT COUNT(*) AS total_tag_assignments FROM product_tags;

-- ============================================================================
-- NOTES
-- ============================================================================
-- Tags Applied:
-- - All 12 products now have 3-4 style tags each
-- - Tags reflect design characteristics (geometric, modern, minimalist, etc.)
-- - Uses INSERT ... ON CONFLICT DO NOTHING to prevent duplicates
-- - Total ~40 tag assignments across all products
-- ============================================================================
