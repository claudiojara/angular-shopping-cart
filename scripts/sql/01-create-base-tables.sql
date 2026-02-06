-- =====================================================
-- Script 01: Crear Tablas Base
-- Descripción: Tablas de referencia (materials, categories, tags)
-- Orden de ejecución: PRIMERO
-- =====================================================

-- TABLA: materials
CREATE TABLE IF NOT EXISTS materials (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7),
  properties JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE materials IS 'Materiales de impresión 3D (PLA, ABS, etc.)';
COMMENT ON COLUMN materials.properties IS 'Propiedades adicionales: durabilidad, peso, temperatura, etc.';
COMMENT ON COLUMN materials.code IS 'Código único del material (PLA, ABS, PETG, etc.)';
COMMENT ON COLUMN materials.color IS 'Color representativo en hex (#E8E8E8 para PLA blanco)';

-- TABLA: categories (con soporte jerárquico)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'Categorías de productos (jerárquicas con parent_id)';
COMMENT ON COLUMN categories.parent_id IS 'ID de categoría padre para subcategorías';

-- TABLA: tags
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) UNIQUE NOT NULL,
  color VARCHAR(7),
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE tags IS 'Etiquetas de estilo/características (geométrico, minimalista, etc.)';
COMMENT ON COLUMN tags.color IS 'Color hex para UI (#FF5733)';
