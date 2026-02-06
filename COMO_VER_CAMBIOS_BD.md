# 🔄 Cómo Ver Cambios de la Base de Datos en la App

## Problema

Actualizaste el precio de Velora en Supabase pero no se ve reflejado en la app.

## ¿Por Qué Pasa Esto?

El **ProductService** de Angular es un **singleton** (una sola instancia). Carga los productos **UNA sola vez** cuando se inicializa la aplicación:

```typescript
constructor() {
  // Esto se ejecuta UNA vez cuando Angular crea el servicio
  this.loadProducts();
}
```

Después de eso, los datos se quedan en memoria (en un signal) y **NO se actualizan automáticamente** cuando cambias algo en Supabase.

---

## Soluciones

### ✅ Solución 1: Refrescar la Página (RECOMENDADO)

**Forma más simple y efectiva:**

1. En el navegador, presiona:
   - **Mac:** `Cmd + R` (o `Cmd + Shift + R` para hard refresh)
   - **Windows/Linux:** `Ctrl + R` (o `Ctrl + F5` para hard refresh)

2. O haz click en el botón de refresh del navegador 🔄

**¿Por qué funciona?**

- Al refrescar, Angular se reinicia desde cero
- El ProductService se crea nuevamente
- El constructor llama a `loadProducts()`
- Se obtienen los datos actualizados desde Supabase

---

### ✅ Solución 2: Recargar Datos con DevTools Console

**Sin necesidad de refrescar toda la página:**

1. **Abre DevTools:** `F12` o `Cmd + Option + I`

2. **Ve a la pestaña Console**

3. **Pega este código:**

```javascript
// Opción A: Usando el componente
const comp = ng.getComponent(document.querySelector('app-product-list'));
await comp.productService.loadProducts();
console.log('✅ Productos recargados desde BD');

// Opción B: Más corta
await ng.getComponent(document.querySelector('app-product-list')).refreshProducts();
console.log('✅ Productos recargados');
```

4. **Presiona Enter**

Los productos se recargarán desde la base de datos sin refrescar la página completa.

---

### ✅ Solución 3: Botón de Refresh (Para Desarrollo)

Si estás desarrollando y necesitas recargar datos frecuentemente, puedes agregar un botón temporal:

**1. Edita el template** (`product-list.html`):

```html
<!-- En la toolbar, después del sort-select -->
<div class="products-toolbar">
  <span class="results-count"> {{ productCount() }} productos </span>

  <!-- BOTÓN DE DESARROLLO -->
  <button
    mat-icon-button
    (click)="refreshProducts()"
    matTooltip="Recargar productos desde BD"
    color="accent"
    class="refresh-btn"
  >
    <mat-icon>refresh</mat-icon>
  </button>

  <mat-form-field appearance="outline" class="sort-select">
    <!-- ... -->
  </mat-form-field>
</div>
```

**2. El método ya existe** en el componente (lo acabamos de agregar):

```typescript
async refreshProducts(): Promise<void> {
  await this.productService.loadProducts();
}
```

**3. Usa el botón** cuando cambies datos en Supabase.

---

## Verificar Precio Actual en la BD

**Desde la terminal:**

```bash
node -e "
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./src/assets/config.local.json', 'utf-8'));
const supabase = createClient(config.supabase.url, config.supabase.anonKey);

const { data } = await supabase
  .from('products')
  .select('id, name, price, original_price')
  .eq('name', 'Velora')
  .single();

const formatPrice = (p) => '$' + Math.round(p).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const discount = Math.round(((data.original_price - data.price) / data.original_price) * 100);

console.log('📦 Velora en la BD:');
console.log('   Precio:', formatPrice(data.price));
console.log('   Original:', formatPrice(data.original_price));
console.log('   Descuento:', discount + '%');
"
```

**Resultado actual:**

```
📦 Velora en la BD:
   Precio: $22.000
   Original: $29.990
   Descuento: 27%
```

Después de refrescar la app, deberías ver estos valores.

---

## Flujo de Datos (Diagrama)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario abre la app (http://localhost:4200/products)    │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Angular crea ProductService (singleton)                  │
│    constructor() → this.loadProducts()                      │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. loadProducts() hace query a Supabase                     │
│    supabase.from('products_full_public').select('*')        │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Productos guardados en signal _products                  │
│    this._products.set(products)                             │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Componentes leen el signal y muestran los productos      │
│    this.products = this.productService.products             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 6. Usuario cambia precio en Supabase                        │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ ❌ El signal NO se actualiza automáticamente                │
│    (sigue mostrando el precio viejo)                        │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. SOLUCIÓN: Refrescar página o llamar loadProducts()       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Se vuelve a hacer query → productos actualizados ✅      │
└─────────────────────────────────────────────────────────────┘
```

---

## Opciones Avanzadas (Futuro)

### Opción 1: Polling (Actualización Periódica)

Recargar productos cada X minutos:

```typescript
constructor() {
  this.loadProducts();

  // Recargar cada 5 minutos
  setInterval(() => {
    this.loadProducts();
  }, 5 * 60 * 1000);
}
```

**Pros:** Simple, funciona sin configuración adicional
**Contras:** No es en tiempo real, puede desperdiciar recursos

### Opción 2: Supabase Realtime (Recomendado para Producción)

Escuchar cambios en tiempo real:

```typescript
constructor() {
  this.loadProducts();
  this.subscribeToRealtimeUpdates();
}

private subscribeToRealtimeUpdates(): void {
  this.supabase.client
    .channel('products_changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      (payload) => {
        console.log('🔄 Producto actualizado:', payload);
        this.loadProducts(); // Recargar todos los productos
      }
    )
    .subscribe();
}
```

**Pros:** Tiempo real, eficiente
**Contras:** Requiere habilitar Realtime en Supabase, más complejo

### Opción 3: Service Worker + Background Sync

Para apps PWA con sincronización en segundo plano.

---

## Resumen

| Método                | Cuándo Usar                     | Dificultad        |
| --------------------- | ------------------------------- | ----------------- |
| **Refrescar página**  | Desarrollo, usuarios finales    | ⭐ Fácil          |
| **DevTools Console**  | Desarrollo/debugging            | ⭐⭐ Media        |
| **Botón Refresh**     | Desarrollo frecuente            | ⭐⭐ Media        |
| **Polling**           | Producción (si no hay Realtime) | ⭐⭐⭐ Media      |
| **Supabase Realtime** | Producción (recomendado)        | ⭐⭐⭐⭐ Avanzado |

---

## Para Tu Caso (Velora)

**1. Verifica el precio en la BD:**

```bash
node -e "..." # (comando de arriba)
```

**2. Refresca la página:**

```
Cmd + R  (Mac)
Ctrl + R (Windows/Linux)
```

**3. Verifica en la app:**

- Busca "Velora" en la lista de productos
- Precio debería ser: **$22.000** (antes: $25.491)
- Badge debería decir: **"-27%"** (antes: "-15%")

---

## Preguntas Frecuentes

### ¿Por qué no se actualiza automáticamente?

Angular no sabe que cambiaste datos en Supabase. Los datos están en memoria (signal) y solo se actualizan cuando llamas explícitamente a `loadProducts()`.

### ¿Es esto un bug?

No, es el comportamiento estándar de Angular. Los servicios singleton cargan datos una vez y los mantienen en cache. Esto es eficiente y reduce queries innecesarias.

### ¿Cómo lo hacen las apps reales?

Las apps en producción usan **Supabase Realtime** o **WebSockets** para recibir actualizaciones en tiempo real. Para desarrollo, refrescar la página es suficiente.

### ¿Debo agregar el botón de refresh?

Solo si estás desarrollando y cambias datos en Supabase frecuentemente. Para usuarios finales, NO es necesario (ellos no modifican la BD directamente).

---

**Documentado:** 2026-02-06  
**Proyecto:** Angular Shopping Cart - Forja del Destino
