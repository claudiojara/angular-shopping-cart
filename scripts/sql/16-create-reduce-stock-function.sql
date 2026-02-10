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
