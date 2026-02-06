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
