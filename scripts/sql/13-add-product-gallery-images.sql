-- ============================================================================
-- 13-add-product-gallery-images.sql
-- Add multiple images to products for gallery feature
-- ============================================================================
-- Execute after: 12-insert-seed-data.sql
-- ============================================================================

-- ============================================================================
-- Fix: Add updated_at column if missing (required by trigger)
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_images' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE product_images ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    COMMENT ON COLUMN product_images.updated_at IS 'Timestamp of last update';
  END IF;
END $$;

-- ============================================================================
-- Add gallery images to VELORA (product_id = 1)
-- Modern desk lamp with clean lines
-- ============================================================================

INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
VALUES
  -- Primary image (already shown in product list)
  (1, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800', 'Velora - Vista frontal principal', 1, true),
  -- Additional gallery images
  (1, 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800', 'Velora - Vista lateral con iluminación', 2, false),
  (1, 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800', 'Velora - Detalle de acabado minimalista', 3, false),
  (1, 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800', 'Velora - En ambiente de escritorio', 4, false);

-- ============================================================================
-- Add gallery images to LUNORA (product_id = 2)
-- Bedside lamp with mesh texture
-- ============================================================================

INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
VALUES
  (2, 'https://images.unsplash.com/photo-1550985543-49bee3167284?w=800', 'Lunora - Vista principal de mesa', 1, true),
  (2, 'https://images.unsplash.com/photo-1573007974656-b958089e9f7b?w=800', 'Lunora - Vista superior con luz encendida', 2, false),
  (2, 'https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=800', 'Lunora - Detalle de textura malla', 3, false),
  (2, 'https://images.unsplash.com/photo-1523755231516-e43fd2e8dca5?w=800', 'Lunora - En ambiente nocturno', 4, false);

-- ============================================================================
-- Add gallery images to AURORA (product_id = 3)
-- Geometric floor lamp
-- ============================================================================

INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
VALUES
  (3, 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800', 'Aurora - Vista completa de pie', 1, true),
  (3, 'https://images.unsplash.com/photo-1536566482680-fca31930a0bd?w=800', 'Aurora - Detalle de patrón geométrico', 2, false),
  (3, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'Aurora - Vista angular con iluminación', 3, false),
  (3, 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800', 'Aurora - En sala de estar moderna', 4, false);

-- ============================================================================
-- Add gallery images to NEXIA (product_id = 4)
-- Futuristic desk lamp
-- ============================================================================

INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
VALUES
  (4, 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800', 'Nexia - Vista frontal futurista', 1, true),
  (4, 'https://images.unsplash.com/photo-1541480551145-2370a440d585?w=800', 'Nexia - Detalle de diseño angular', 2, false),
  (4, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800', 'Nexia - Vista lateral con luz LED', 3, false),
  (4, 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800', 'Nexia - En escritorio minimalista', 4, false);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check images added per product
SELECT 
  p.id AS product_id,
  p.name AS product_name,
  COUNT(pi.id) AS image_count,
  SUM(CASE WHEN pi.is_primary THEN 1 ELSE 0 END) AS primary_count
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.id IN (1, 2, 3, 4)
GROUP BY p.id, p.name
ORDER BY p.id;

-- View all images for a specific product (example: Velora)
SELECT 
  pi.id,
  pi.product_id,
  p.name AS product_name,
  pi.image_url,
  pi.alt_text,
  pi.display_order,
  pi.is_primary
FROM product_images pi
JOIN products p ON pi.product_id = p.id
WHERE p.id = 1
ORDER BY pi.display_order;

-- Check products_full_public view includes images array
SELECT 
  id,
  name,
  jsonb_array_length(images::jsonb) AS image_count,
  images
FROM products_full_public
WHERE id IN (1, 2, 3, 4)
ORDER BY id;

-- ============================================================================
-- NOTES
-- ============================================================================
-- Images Added:
-- - Velora (ID 1):  4 images (desk lamp)
-- - Lunora (ID 2):  4 images (bedside lamp)  
-- - Aurora (ID 3):  4 images (floor lamp)
-- - Nexia (ID 4):   4 images (futuristic desk lamp)
--
-- Total: 16 new gallery images using Unsplash URLs (all verified working)
--
-- All images use ?w=800 parameter for consistent 800px width
-- Primary images are marked with is_primary=true
-- Display order controls gallery sequence (1, 2, 3, 4, 5...)
-- ============================================================================
