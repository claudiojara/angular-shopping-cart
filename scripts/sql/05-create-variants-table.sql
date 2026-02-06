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
