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
