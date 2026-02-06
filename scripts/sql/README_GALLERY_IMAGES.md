# Cómo Ejecutar el Script de Imágenes de Galería

## Script Creado

`scripts/sql/13-add-product-gallery-images.sql`

## URLs Verificadas

✅ Todas las 13 URLs de Unsplash verificadas y funcionando (código 200)

## Productos con Galerías

- **Velora (ID 1):** 4 imágenes
- **Lunora (ID 2):** 4 imágenes
- **Aurora (ID 3):** 4 imágenes
- **Nexia (ID 4):** 4 imágenes

**Total:** 16 imágenes de galería

## Cómo Ejecutar en Supabase

### Opción 1: Dashboard de Supabase (Recomendado)

1. Ir a: https://supabase.com/dashboard/project/owewtzddyykyraxkkorx/sql/new
2. Copiar el contenido de `scripts/sql/13-add-product-gallery-images.sql`
3. Pegar en el editor SQL
4. Click en **"Run"**
5. Verificar resultados en las queries de verificación al final

### Opción 2: CLI de Supabase (Si está instalado)

```bash
supabase db push scripts/sql/13-add-product-gallery-images.sql
```

### Opción 3: psql (Si tienes acceso directo)

```bash
psql $DATABASE_URL -f scripts/sql/13-add-product-gallery-images.sql
```

## Verificación Post-Ejecución

El script incluye queries de verificación automáticas que mostrarán:

1. **Conteo de imágenes por producto:**

   ```
   product_id | product_name | image_count | primary_count
   -----------+--------------+-------------+--------------
   1          | Velora       | 4           | 1
   2          | Lunora       | 4           | 1
   3          | Aurora       | 4           | 1
   4          | Nexia        | 4           | 1
   ```

2. **Imágenes de Velora (ejemplo):**
   - Lista de URLs, alt_text, display_order, is_primary

3. **Vista `products_full_public`:**
   - Verifica que el array `images` se poblé correctamente

## Siguiente Paso

Después de ejecutar el script:

1. ✅ Verificar que las imágenes se insertaron
2. ✅ Actualizar el modelo Product en Angular para incluir array de imágenes
3. ✅ Habilitar la galería de thumbnails en ProductDetailModal
4. ✅ Hacer commit de cambios
