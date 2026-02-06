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
