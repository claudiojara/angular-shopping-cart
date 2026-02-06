# 🔍 Cómo Verificar que los Datos Vienen de la Base de Datos

## Método 1: Desde la Terminal ✅

```bash
# Ejecuta este script que acabamos de crear:
node -e "
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./src/assets/config.local.json', 'utf-8'));
const supabase = createClient(config.supabase.url, config.supabase.anonKey);

const { data } = await supabase
  .from('products')
  .select('id, name, slug, sku, created_at')
  .order('id')
  .limit(5);

console.log('📦 Productos desde Supabase:\n');
data.forEach(p => {
  console.log(\`ID: \${p.id} | Nombre: \${p.name} | Slug: \${p.slug} | SKU: \${p.sku}\`);
});
console.log('\n✅ Estos campos (slug, sku) NO existían en el código hardcoded!');
"
```

## Método 2: DevTools del Navegador 🌐

### Paso 1: Abre la aplicación

```
http://localhost:4200/products
```

### Paso 2: Abre DevTools (F12 o Cmd+Option+I)

### Paso 3: Ve a la pestaña "Network"

- Refresca la página (Cmd+R o Ctrl+R)
- Busca una request llamada `products_full_public` o que contenga `supabase`
- Haz click en ella
- Ve a la pestaña "Response"
- Deberías ver un JSON con los productos

### Paso 4: Ve a la pestaña "Console"

Pega y ejecuta este código:

```javascript
// Obtén el ProductService desde Angular
const productService = ng.getComponent(document.querySelector('app-product-list')).productService;

// Inspecciona los productos
const products = productService.products();
console.log('📦 Total productos:', products.length);
console.log('📦 Primer producto:', products[0]);

// Verifica campos que SOLO vienen de la BD
const firstProduct = products[0];
console.log('\n🔍 Campos que prueban que viene de la BD:');
console.log('  - slug:', firstProduct.slug); // ⬅️ NO existe en código hardcoded
console.log('  - sku:', firstProduct.sku); // ⬅️ NO existe en código hardcoded
console.log('  - stockQuantity:', firstProduct.stockQuantity); // ⬅️ NO existe en código hardcoded
console.log('  - isAvailable:', firstProduct.isAvailable); // ⬅️ NO existe en código hardcoded
console.log('  - isFeatured:', firstProduct.isFeatured); // ⬅️ NO existe en código hardcoded

console.log('\n✅ Si ves valores reales (no undefined), ¡vienen de la BD!');
```

## Método 3: Inspeccionar el Network Tab 📡

### Qué buscar:

1. **URL de la request:**

   ```
   https://owewtzddyykyraxkkorx.supabase.co/rest/v1/products_full_public
   ```

2. **Headers de la request:**

   ```
   apikey: <YOUR_SUPABASE_PUBLISHABLE_KEY>
   ```

3. **Response body (JSON):**
   ```json
   [
     {
       "id": 1,
       "name": "Lunora",
       "slug": "lunora",
       "sku": "LUN-0001",
       "stock_quantity": 9,
       "material_name": "PLA (Ácido Poliláctico)",
       "images": [...],
       "categories": [...],
       "tags": [...]
     },
     ...
   ]
   ```

## Método 4: Comparar con el Código Antiguo 📝

### Código ANTIGUO (hardcoded):

```typescript
// src/app/services/product.service.ts - ANTES
private products = signal<Product[]>([
  {
    id: 1,
    name: 'Lunora',
    description: '...',
    price: 30166,
    originalPrice: 35490,
    image: 'https://...',
    category: 'Lámparas de Mesa',
    rating: 5.0,
    reviewCount: 3,
    variants: ['+4', '+6'],
    badge: '-15%',
    material: 'PLA',
    // ❌ NO HAY: slug, sku, stockQuantity, isAvailable, isFeatured
  },
  // ... 11 más hardcoded
]);
```

### Código NUEVO (desde BD):

```typescript
// src/app/services/product.service.ts - AHORA
async loadProducts(): Promise<void> {
  const { data, error } = await this.supabase.client
    .from('products_full_public')
    .select('*')
    .eq('is_available', true)
    .order('id');

  const products = (data as ProductFromDB[]).map(dbProduct =>
    this.mapDbProductToProduct(dbProduct)
  );
  this._products.set(products);
}
```

## Método 5: Verificar el modelo de datos 📋

### Modelo ANTIGUO (Product):

```typescript
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  variants?: string[];
  badge?: string;
  material?: string;
  // ❌ NO HAY más campos
}
```

### Modelo NUEVO (Product):

```typescript
export interface Product {
  id: number;
  name: string;
  slug: string; // ✅ NUEVO - solo en BD
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  variants?: string[];
  badge?: string;
  material?: string;
  sku?: string; // ✅ NUEVO - solo en BD
  stockQuantity?: number; // ✅ NUEVO - solo en BD
  isAvailable?: boolean; // ✅ NUEVO - solo en BD
  isFeatured?: boolean; // ✅ NUEVO - solo en BD
}
```

## Método 6: Prueba Destructiva 💥

### Opción A: Elimina un producto de la BD

```sql
-- En Supabase SQL Editor:
DELETE FROM products WHERE id = 12;
```

Luego refresca la app en el navegador. Deberías ver **11 productos** en vez de 12.

### Opción B: Agrega un producto nuevo en la BD

```sql
-- En Supabase SQL Editor:
INSERT INTO products (
  name, slug, description, price, material_id,
  sku, stock_quantity, is_available
) VALUES (
  'Producto Test', 'producto-test', 'Descripción test',
  10000, 1, 'TEST-0013', 5, true
);
```

Luego refresca la app. Deberías ver un producto llamado **"Producto Test"**.

## Método 7: Modificar datos en Supabase Dashboard 🖱️

1. Ve a: https://supabase.com/dashboard/project/owewtzddyykyraxkkorx
2. Click en "Table Editor" → "products"
3. Modifica el nombre del producto ID=1 a "Lunora EDITADO"
4. Refresca la app en el navegador
5. Deberías ver "Lunora EDITADO" en la lista

## Pruebas Realizadas ✅

Ya ejecutamos la verificación y confirmamos:

```
✅ Campo slug existe: lunora, velora, swoola, etc.
✅ Campo sku existe: LUN-0001, VEL-0002, etc.
✅ Campo stock_quantity existe: 9, 18, 11, etc.
✅ Timestamps created_at: 2026-02-06
✅ Relaciones categories: Array con {category_id, name, slug}
✅ Relaciones tags: 34 links en product_tags
✅ Relaciones variants: 17 variantes con SKUs únicos
✅ Count queries muestran 12 productos, 12 imágenes
```

## Conclusión 🎉

**Evidencia irrefutable de que los datos vienen de Supabase:**

1. ✅ Campos nuevos (slug, sku, stock) que NO existían en código hardcoded
2. ✅ Timestamps de la BD (created_at, updated_at)
3. ✅ Relaciones N:N (categorías, tags, variantes) con IDs de BD
4. ✅ Queries ejecutables desde terminal contra Supabase
5. ✅ Network requests visibles en DevTools apuntando a Supabase
6. ✅ Código del servicio hace await this.supabase.client.from(...)

**No hay forma de que estos datos vengan del código hardcoded porque:**

- El código hardcoded fue reemplazado completamente
- Los campos nuevos (slug, sku) nunca existieron en el código antiguo
- Las relaciones (categories, tags) requieren queries a múltiples tablas
- Los timestamps son de PostgreSQL

---

**¿Necesitas más pruebas?** Ejecuta cualquiera de los métodos de arriba! 🚀
