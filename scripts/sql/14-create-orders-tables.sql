-- =====================================================
-- Script 14: Crear Tablas de Orders y Order Items
-- Descripción: Sistema de órdenes de compra con integración Flow.cl
-- Orden de ejecución: DECIMOCUARTO
-- =====================================================

-- TABLA: orders
-- Almacena las órdenes de compra con información de pago Flow
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Información de Flow
  flow_order_id VARCHAR(50) UNIQUE, -- ID único de Flow
  flow_token VARCHAR(255), -- Token de pago de Flow
  
  -- Estado de la orden
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  
  -- Montos (en centavos CLP)
  subtotal_amount INTEGER NOT NULL CHECK (subtotal_amount > 0),
  shipping_amount INTEGER NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
  total_amount INTEGER NOT NULL CHECK (total_amount > 0),
  
  -- Datos de envío
  shipping_name VARCHAR(255) NOT NULL,
  shipping_email VARCHAR(255) NOT NULL,
  shipping_phone VARCHAR(50) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100),
  shipping_region VARCHAR(100),
  shipping_comuna VARCHAR(100),
  shipping_notes TEXT,
  
  -- Información del pago
  payment_method VARCHAR(50), -- webpay, redcompra, servipag, etc.
  payment_date TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE orders IS 'Órdenes de compra con integración Flow.cl';
COMMENT ON COLUMN orders.status IS 'pending: creada, paid: pagada, failed: pago fallido, cancelled: cancelada, refunded: reembolsada';
COMMENT ON COLUMN orders.subtotal_amount IS 'Subtotal en centavos CLP (sin envío)';
COMMENT ON COLUMN orders.total_amount IS 'Total en centavos CLP (subtotal + envío)';
COMMENT ON COLUMN orders.flow_order_id IS 'ID único de Flow para tracking';
COMMENT ON COLUMN orders.flow_token IS 'Token de pago de Flow para validación';

-- TABLA: order_items
-- Items individuales de cada orden
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  
  -- Cantidad y precios (capturados al momento de compra)
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price > 0), -- Precio unitario en centavos CLP
  subtotal INTEGER NOT NULL CHECK (subtotal > 0), -- quantity * unit_price
  
  -- Información del producto (snapshot)
  product_name VARCHAR(255) NOT NULL,
  product_slug VARCHAR(255),
  product_image_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE order_items IS 'Items individuales de cada orden (snapshot al momento de compra)';
COMMENT ON COLUMN order_items.unit_price IS 'Precio unitario en centavos CLP al momento de compra';
COMMENT ON COLUMN order_items.product_name IS 'Snapshot del nombre del producto (preserva información si producto se borra)';

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Índice para búsqueda de órdenes por usuario
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Índice para búsqueda por Flow order ID
CREATE INDEX IF NOT EXISTS idx_orders_flow_order_id ON orders(flow_order_id);

-- Índice para búsqueda por estado
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Índice para búsqueda por fecha
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Índice para order_items por orden
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Índice para order_items por producto
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- =====================================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

COMMENT ON FUNCTION update_orders_updated_at() IS 'Actualiza el campo updated_at automáticamente en tabla orders';

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS en ambas tablas
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- POLICY: Los usuarios pueden ver sus propias órdenes
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

-- POLICY: Los usuarios pueden crear órdenes
CREATE POLICY "Users can create own orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- POLICY: Los usuarios pueden actualizar sus órdenes (solo si están pending)
CREATE POLICY "Users can update own pending orders"
ON orders FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

-- POLICY: Los usuarios pueden ver items de sus órdenes
CREATE POLICY "Users can view own order items"
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- POLICY: Los usuarios pueden insertar items en sus órdenes
CREATE POLICY "Users can insert order items for own orders"
ON order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- =====================================================
-- FUNCIÓN: Calcular subtotal de order_item
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_order_item_subtotal()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subtotal = NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_order_item_subtotal
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_item_subtotal();

COMMENT ON FUNCTION calculate_order_item_subtotal() IS 'Calcula automáticamente el subtotal de cada item (quantity * unit_price)';

-- =====================================================
-- VISTA: orders_with_items
-- =====================================================

CREATE OR REPLACE VIEW orders_with_items AS
SELECT 
  o.id,
  o.user_id,
  o.flow_order_id,
  o.status,
  o.subtotal_amount,
  o.shipping_amount,
  o.total_amount,
  o.shipping_name,
  o.shipping_email,
  o.shipping_phone,
  o.shipping_address,
  o.shipping_city,
  o.shipping_region,
  o.shipping_comuna,
  o.payment_method,
  o.payment_date,
  o.created_at,
  o.updated_at,
  -- Agregar conteo de items
  COUNT(oi.id) as item_count,
  -- Agregar items como JSON array
  COALESCE(
    json_agg(
      json_build_object(
        'id', oi.id,
        'product_id', oi.product_id,
        'product_name', oi.product_name,
        'product_slug', oi.product_slug,
        'product_image_url', oi.product_image_url,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'subtotal', oi.subtotal
      ) ORDER BY oi.id
    ) FILTER (WHERE oi.id IS NOT NULL),
    '[]'::json
  ) as items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

COMMENT ON VIEW orders_with_items IS 'Vista optimizada de órdenes con sus items incluidos como JSON';

-- =====================================================
-- FUNCIÓN: Obtener órdenes del usuario con paginación
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_orders(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id INTEGER,
  flow_order_id VARCHAR(50),
  status VARCHAR(20),
  total_amount INTEGER,
  item_count BIGINT,
  created_at TIMESTAMPTZ,
  items JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.flow_order_id,
    o.status,
    o.total_amount,
    o.item_count,
    o.created_at,
    o.items
  FROM orders_with_items o
  WHERE o.user_id = p_user_id
  ORDER BY o.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_orders IS 'Obtiene órdenes del usuario con paginación';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que las tablas existen
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    RAISE NOTICE '✓ Tabla orders creada correctamente';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
    RAISE NOTICE '✓ Tabla order_items creada correctamente';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'orders_with_items') THEN
    RAISE NOTICE '✓ Vista orders_with_items creada correctamente';
  END IF;
END $$;
