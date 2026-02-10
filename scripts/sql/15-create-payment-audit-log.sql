-- =====================================================
-- Script 15: Crear Tabla de Auditoría de Pagos
-- Descripción: Registro completo de pagos procesados desde Flow.cl
-- Orden de ejecución: DECIMOQUINTO
-- =====================================================

-- TABLA: payment_audit_log
-- Almacena registro de auditoría para cada pago procesado
CREATE TABLE IF NOT EXISTS payment_audit_log (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Información de Flow
  flow_order_id VARCHAR(255),
  
  -- Estado del pago
  status VARCHAR(50) NOT NULL,
  
  -- Monto del pago (para validación)
  amount DECIMAL(12,2) NOT NULL,
  
  -- Método de pago utilizado
  payment_method VARCHAR(100),
  
  -- Resultado del procesamiento de stock
  stock_processed INTEGER DEFAULT 0,
  stock_success BOOLEAN DEFAULT false,
  stock_errors JSONB DEFAULT '[]',
  
  -- Timestamps
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE payment_audit_log IS 'Registro de auditoría para pagos procesados desde Flow.cl';
COMMENT ON COLUMN payment_audit_log.order_id IS 'Referencia a la orden pagada';
COMMENT ON COLUMN payment_audit_log.flow_order_id IS 'ID de Flow para trazabilidad';
COMMENT ON COLUMN payment_audit_log.status IS 'Estado final del pago (paid, failed, cancelled)';
COMMENT ON COLUMN payment_audit_log.amount IS 'Monto procesado (para detección de fraude)';
COMMENT ON COLUMN payment_audit_log.payment_method IS 'Método de pago (Webpay, Servipag, etc.)';
COMMENT ON COLUMN payment_audit_log.stock_processed IS 'Cantidad de productos con stock reducido';
COMMENT ON COLUMN payment_audit_log.stock_success IS 'Indica si la reducción de stock fue exitosa';
COMMENT ON COLUMN payment_audit_log.stock_errors IS 'Array de errores si falló la reducción de stock';
COMMENT ON COLUMN payment_audit_log.processed_at IS 'Fecha/hora de procesamiento del webhook';

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Índice para búsqueda por orden
CREATE INDEX IF NOT EXISTS idx_payment_audit_order_id 
  ON payment_audit_log(order_id);

-- Índice para búsqueda por Flow order ID
CREATE INDEX IF NOT EXISTS idx_payment_audit_flow_order_id 
  ON payment_audit_log(flow_order_id);

-- Índice para búsqueda por fecha (útil para reportes)
CREATE INDEX IF NOT EXISTS idx_payment_audit_processed_at 
  ON payment_audit_log(processed_at DESC);

-- Índice para filtrar por estado
CREATE INDEX IF NOT EXISTS idx_payment_audit_status 
  ON payment_audit_log(status);

-- Índice para encontrar pagos con errores de stock
CREATE INDEX IF NOT EXISTS idx_payment_audit_stock_success 
  ON payment_audit_log(stock_success) 
  WHERE stock_success = false;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE payment_audit_log ENABLE ROW LEVEL SECURITY;

-- POLICY: Permitir insert desde service role (webhook)
CREATE POLICY "Allow insert from service role" 
  ON payment_audit_log 
  FOR INSERT 
  WITH CHECK (true);

-- POLICY: Los usuarios pueden ver sus propios registros de auditoría
CREATE POLICY "Users can view own payment audit logs"
  ON payment_audit_log 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payment_audit_log.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- POLICY: Solo admins pueden actualizar registros de auditoría
CREATE POLICY "Only admins can update audit logs"
  ON payment_audit_log 
  FOR UPDATE
  USING (false);

-- POLICY: No permitir deletes (auditoría inmutable)
CREATE POLICY "No deletes allowed on audit logs"
  ON payment_audit_log 
  FOR DELETE
  USING (false);

-- =====================================================
-- VISTA: Resumen de pagos por día
-- =====================================================

CREATE OR REPLACE VIEW payment_daily_summary AS
SELECT 
  DATE(processed_at) as date,
  COUNT(*) as total_payments,
  SUM(amount) as total_amount,
  COUNT(CASE WHEN status = 'paid' THEN 1 END) as successful_payments,
  SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as successful_amount,
  SUM(CASE WHEN stock_success THEN 1 ELSE 0 END) as stock_updates_successful,
  SUM(CASE WHEN NOT stock_success THEN 1 ELSE 0 END) as stock_updates_failed
FROM payment_audit_log
GROUP BY DATE(processed_at)
ORDER BY date DESC;

COMMENT ON VIEW payment_daily_summary IS 'Resumen diario de pagos procesados con estadísticas de stock';

-- =====================================================
-- VISTA: Pagos con errores de stock
-- =====================================================

CREATE OR REPLACE VIEW payment_stock_errors AS
SELECT 
  pal.id,
  pal.order_id,
  pal.flow_order_id,
  pal.status,
  pal.amount,
  pal.payment_method,
  pal.stock_processed,
  pal.stock_errors,
  pal.processed_at,
  o.user_id,
  o.shipping_email
FROM payment_audit_log pal
JOIN orders o ON o.id = pal.order_id
WHERE pal.stock_success = false
ORDER BY pal.processed_at DESC;

COMMENT ON VIEW payment_stock_errors IS 'Lista de pagos donde falló la reducción de stock (requiere atención)';

-- =====================================================
-- FUNCIÓN: Obtener auditoría de pago por orden
-- =====================================================

CREATE OR REPLACE FUNCTION get_payment_audit_by_order(
  p_order_id BIGINT
)
RETURNS TABLE (
  id BIGINT,
  flow_order_id VARCHAR(255),
  status VARCHAR(50),
  amount DECIMAL(12,2),
  payment_method VARCHAR(100),
  stock_processed INTEGER,
  stock_success BOOLEAN,
  stock_errors JSONB,
  processed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pal.id,
    pal.flow_order_id,
    pal.status,
    pal.amount,
    pal.payment_method,
    pal.stock_processed,
    pal.stock_success,
    pal.stock_errors,
    pal.processed_at
  FROM payment_audit_log pal
  WHERE pal.order_id = p_order_id
  ORDER BY pal.processed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_payment_audit_by_order IS 'Obtiene el historial de auditoría de pagos para una orden específica';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_audit_log') THEN
    RAISE NOTICE '✓ Tabla payment_audit_log creada correctamente';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'payment_daily_summary') THEN
    RAISE NOTICE '✓ Vista payment_daily_summary creada correctamente';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'payment_stock_errors') THEN
    RAISE NOTICE '✓ Vista payment_stock_errors creada correctamente';
  END IF;
END $$;
