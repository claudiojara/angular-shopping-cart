# 🧪 Guía de Testing Local - Flow Payment

## ✅ Configuración Completada

- ✅ FLOW_RETURN_URL actualizado a: `http://localhost:4200/payment/callback`
- ✅ Servidor Angular corriendo en: `http://localhost:4200`
- ✅ Edge Functions desplegadas en Supabase
- ✅ Webhook apunta a Supabase (funcionará desde cualquier lugar)

---

## 🎯 Pasos para Probar el Pago

### 1. Abrir la aplicación local

```
http://localhost:4200
```

### 2. Login o Registro

- Si no tienes usuario, créate uno
- O usa un usuario existente

### 3. Agregar productos al carrito

- Ve a la página de productos
- Agrega 2-3 productos
- Verifica que aparezcan en el carrito (esquina superior derecha)

### 4. Ir al carrito

- Click en el icono del carrito
- Verifica que los productos estén correctos
- Click en **"Proceder al Pago"**

### 5. Completar formulario de checkout

Datos de prueba sugeridos:

```
Nombre: Juan Pérez Test
Email: test@example.com
Teléfono: +56912345678
Dirección: Av. Libertador Bernardo O'Higgins 1234, Piso 5
Región: Región Metropolitana
Ciudad: Santiago
Comuna: Santiago Centro
Notas: Dejar en conserjería
```

### 6. Click en "Pagar {monto}"

**Qué sucede:**

- Se crea la orden en la base de datos
- Se llama a la Edge Function `create-flow-payment`
- Se genera el pago en Flow
- Eres redirigido a Flow sandbox

### 7. Completar pago en Flow

**Tarjeta de ÉXITO:**

```
Número: 4051885600446623
CVV: 123
Fecha: 12/25
Nombre: TEST USER
RUT: 11.111.111-1 (si lo pide)
```

**Tarjeta de RECHAZO (para probar):**

```
Número: 5186059559590568
CVV: 123
Fecha: 12/25
```

### 8. Confirmar pago en Flow

Flow procesará el pago y te redirigirá a:

```
http://localhost:4200/payment/callback?token=XXXX
```

### 9. Verificar resultado

**Si el pago fue exitoso:**

- ✅ Verás un mensaje verde de éxito
- ✅ Número de orden
- ✅ Monto pagado
- ✅ Datos de envío
- ✅ Botón "Ver mis órdenes" (cuando lo implementemos)
- ✅ Tu carrito estará vacío

**Si el pago falló:**

- ❌ Mensaje rojo de error
- ❌ Razón del fallo
- ❌ Opción de reintentar

---

## 🔍 Verificar en la Base de Datos

### Ver las órdenes creadas

1. Ve a Supabase SQL Editor:
   https://supabase.com/dashboard/project/owewtzddyykyraxkkorx/sql

2. Ejecuta:

```sql
-- Ver últimas órdenes
SELECT
  id,
  user_id,
  status,
  total_amount / 100 as total_clp,
  shipping_name,
  shipping_email,
  payment_method,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;
```

3. Ver items de una orden:

```sql
-- Reemplaza 1 con el ID de tu orden
SELECT
  oi.order_id,
  oi.product_name,
  oi.quantity,
  oi.unit_price / 100 as price_clp,
  oi.subtotal / 100 as subtotal_clp
FROM order_items oi
WHERE oi.order_id = 1;
```

---

## 🐛 Debugging

### Ver logs de Edge Functions

**Terminal 1 - Logs de create-flow-payment:**

```bash
export SUPABASE_ACCESS_TOKEN="sbp_737db4b830facf7b75085b1bd3acfce2966cad98"
supabase functions logs create-flow-payment --tail
```

**Terminal 2 - Logs de webhook:**

```bash
export SUPABASE_ACCESS_TOKEN="sbp_737db4b830facf7b75085b1bd3acfce2966cad98"
supabase functions logs flow-webhook --tail
```

### Ver console del navegador

Abre las DevTools (F12) y revisa:

- **Console:** Errores de JavaScript
- **Network:** Llamadas a las APIs
- **Application → Local Storage:** Datos de sesión

### Errores comunes

**1. "User not authenticated"**

- Asegúrate de estar logueado
- Verifica que Supabase esté conectado

**2. "Order not found"**

- La orden no se creó correctamente
- Revisa la consola del navegador

**3. "Error iniciating payment"**

- Revisa logs de `create-flow-payment`
- Verifica que los secretos de Flow estén configurados

**4. Flow no redirige de vuelta**

- Verifica que FLOW_RETURN_URL sea `http://localhost:4200/payment/callback`
- Ejecuta: `supabase secrets list` para confirmarlo

**5. Webhook no se ejecuta**

- Esto es normal en testing local
- El webhook solo se ejecuta cuando Flow llama al servidor
- Tu app igual funciona al consultar el estado al volver

---

## 📊 Flujo Completo

```
1. Usuario agrega productos al carrito
   ↓
2. Click "Proceder al Pago"
   ↓
3. Completa formulario checkout
   ↓
4. Click "Pagar"
   ↓
5. OrderService.createOrder() → Crea orden en DB (status: pending)
   ↓
6. OrderService.initiateFlowPayment() → Llama Edge Function
   ↓
7. Edge Function → Llama Flow API
   ↓
8. Flow API → Devuelve payment URL
   ↓
9. Usuario redirigido a Flow
   ↓
10. Usuario paga con tarjeta de prueba
   ↓
11. Flow procesa pago
   ↓
12. Flow llama webhook (actualiza status en DB)
   ↓
13. Flow redirige a localhost:4200/payment/callback
   ↓
14. PaymentCallbackPage verifica status
   ↓
15. Muestra resultado + limpia carrito si exitoso
```

---

## ⚠️ IMPORTANTE: Después del Testing

Una vez que compruebes que funciona, **DEBES cambiar el FLOW_RETURN_URL** de vuelta a producción:

```bash
export SUPABASE_ACCESS_TOKEN="sbp_737db4b830facf7b75085b1bd3acfce2966cad98"
supabase secrets set FLOW_RETURN_URL='https://witty-bush-0d65a3d0f.2.azurestaticapps.net/payment/callback'
```

O mejor aún, configura dos proyectos en Supabase:

- Uno para desarrollo (apunta a localhost)
- Uno para producción (apunta a Azure)

---

## 🎯 Checklist de Testing

- [ ] Servidor local corriendo (localhost:4200)
- [ ] Usuario logueado
- [ ] Productos en el carrito
- [ ] Formulario de checkout completado
- [ ] Orden creada en DB (ver SQL)
- [ ] Redirigido a Flow
- [ ] Pago completado con tarjeta de prueba
- [ ] Redirigido de vuelta a localhost
- [ ] Resultado mostrado correctamente
- [ ] Carrito vacío después del pago exitoso
- [ ] Orden actualizada con status "paid" en DB

---

## 🚀 Una vez que funcione

1. **Commit y push a `develop`:**

   ```bash
   git add .
   git commit -m "feat: add Flow payment integration"
   git push origin develop
   ```

2. **Cambiar FLOW_RETURN_URL a producción**

3. **Crear PR a `main` cuando esté listo**

4. **Opcionalmente:** Crear página de historial de órdenes

---

¡Listo para probar! Abre http://localhost:4200 y sigue los pasos 🚀
