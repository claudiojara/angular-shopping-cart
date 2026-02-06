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
