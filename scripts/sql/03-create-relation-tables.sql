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
