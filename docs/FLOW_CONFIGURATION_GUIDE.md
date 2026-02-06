# Guía de Configuración de Flow Payment

## 🎯 Resumen

Esta guía te ayudará a completar la configuración de pagos con Flow.cl en tu aplicación Angular.

---

## 📋 Información de Configuración

### Credenciales de Flow (Sandbox)

```
API Key: 52873FFF-FB8B-4B13-819B-9E7E836D6LA5
Secret Key: f7a9d57a82f11c393ab3310e2d833f182c2b7d52
API URL: https://sandbox.flow.cl/api
```

### Supabase

```
URL: https://owewtzddyykyraxkkorx.supabase.co
Project Ref: owewtzddyykyraxkkorx
```

### URLs de Integración

```
Webhook URL: https://owewtzddyykyraxkkorx.supabase.co/functions/v1/flow-webhook
Return URL: https://witty-bush-0d65a3d0f.2.azurestaticapps.net/payment/callback
```

---

## 🚀 Opción 1: Configuración Automática (Recomendada)

### Paso 1: Crear Access Token

1. Ve a: https://supabase.com/dashboard/account/tokens
2. Click en **"Generate new token"**
3. Nombre: `Flow Payment Setup`
4. Copia el token generado

### Paso 2: Configurar con el Token

Ejecuta estos comandos reemplazando `<YOUR_TOKEN>` con tu token:

```bash
# Exportar el token
export SUPABASE_ACCESS_TOKEN="<YOUR_TOKEN>"

# Linkear el proyecto
supabase link --project-ref owewtzddyykyraxkkorx

# Configurar secretos
supabase secrets set FLOW_API_KEY='52873FFF-FB8B-4B13-819B-9E7E836D6LA5'
supabase secrets set FLOW_SECRET_KEY='f7a9d57a82f11c393ab3310e2d833f182c2b7d52'
supabase secrets set FLOW_API_URL='https://sandbox.flow.cl/api'
supabase secrets set FLOW_WEBHOOK_URL='https://owewtzddyykyraxkkorx.supabase.co/functions/v1/flow-webhook'
supabase secrets set FLOW_RETURN_URL='https://witty-bush-0d65a3d0f.2.azurestaticapps.net/payment/callback'

# Desplegar Edge Functions
supabase functions deploy create-flow-payment
supabase functions deploy flow-webhook

# Verificar secretos
supabase secrets list
```

---

## 🔧 Opción 2: Configuración Manual

Si prefieres configurar todo desde el Dashboard de Supabase:

### 1. Ejecutar Migración SQL

1. Ve a: https://supabase.com/dashboard/project/owewtzddyykyraxkkorx/sql
2. Click en **"New Query"**
3. Copia y pega el contenido completo de: `scripts/sql/14-create-orders-tables.sql`
4. Click en **"Run"** (o presiona Ctrl+Enter)
5. Verifica que aparezca: "Success. No rows returned"

### 2. Crear Edge Functions Manualmente

#### Función 1: create-flow-payment

1. Ve a: https://supabase.com/dashboard/project/owewtzddyykyraxkkorx/functions
2. Click en **"Create a new function"**
3. Nombre: `create-flow-payment`
4. Copia el código de: `supabase/functions/create-flow-payment/index.ts`
5. Click en **"Deploy function"**

#### Función 2: flow-webhook

1. Click en **"Create a new function"**
2. Nombre: `flow-webhook`
3. Copia el código de: `supabase/functions/flow-webhook/index.ts`
4. Click en **"Deploy function"**

### 3. Configurar Secrets

1. Ve a: https://supabase.com/dashboard/project/owewtzddyykyraxkkorx/settings/functions
2. En la sección **"Secrets"**, agrega:

```
FLOW_API_KEY = 52873FFF-FB8B-4B13-819B-9E7E836D6LA5
FLOW_SECRET_KEY = f7a9d57a82f11c393ab3310e2d833f182c2b7d52
FLOW_API_URL = https://sandbox.flow.cl/api
FLOW_WEBHOOK_URL = https://owewtzddyykyraxkkorx.supabase.co/functions/v1/flow-webhook
FLOW_RETURN_URL = https://witty-bush-0d65a3d0f.2.azurestaticapps.net/payment/callback
```

3. Click en **"Save"** después de cada secret

---

## 🧪 Verificación

### 1. Verificar Tablas Creadas

Ejecuta en SQL Editor:

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'order%'
ORDER BY tablename;
```

**Resultado esperado:**

```
order_items
orders
```

### 2. Verificar Edge Functions

Ve a: https://supabase.com/dashboard/project/owewtzddyykyraxkkorx/functions

Deberías ver:

- ✅ `create-flow-payment` (deployed)
- ✅ `flow-webhook` (deployed)

### 3. Verificar Secrets

```bash
supabase secrets list
```

Deberías ver:

```
FLOW_API_KEY
FLOW_SECRET_KEY
FLOW_API_URL
FLOW_WEBHOOK_URL
FLOW_RETURN_URL
SUPABASE_URL (auto-configured)
SUPABASE_ANON_KEY (auto-configured)
SUPABASE_SERVICE_ROLE_KEY (auto-configured)
```

---

## 🎮 Configuración en Flow.cl

### Paso 1: Configurar Webhook en Flow

1. Login en: https://sandbox.flow.cl
2. Ve a: **Configuración** → **Notificaciones**
3. En **URL de Confirmación**, ingresa:
   ```
   https://owewtzddyykyraxkkorx.supabase.co/functions/v1/flow-webhook
   ```
4. Click en **"Guardar"**

### Paso 2: Verificar API Keys

1. Ve a: **Configuración** → **Datos del Comercio** → **API Keys**
2. Verifica que tu API Key coincida:
   ```
   52873FFF-FB8B-4B13-819B-9E7E836D6LA5
   ```

---

## 🧪 Testing

### 1. Test Básico de Función

Prueba la función create-flow-payment:

```bash
curl -X POST https://owewtzddyykyraxkkorx.supabase.co/functions/v1/create-flow-payment \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"orderId": 1}'
```

### 2. Test End-to-End

1. Ve a: https://witty-bush-0d65a3d0f.2.azurestaticapps.net
2. Login con tu usuario de prueba
3. Agrega productos al carrito
4. Click en **"Proceder al Pago"**
5. Completa el formulario de envío
6. Click en **"Pagar"**

**Tarjeta de prueba (aprobada):**

```
Número: 4051885600446623
CVV: 123
Fecha: Cualquier fecha futura
```

**Tarjeta de prueba (rechazada):**

```
Número: 5186059559590568
CVV: 123
Fecha: Cualquier fecha futura
```

---

## 🐛 Troubleshooting

### Error: "Flow signature verification failed"

**Solución:** Verifica que el Secret Key esté correcto en Supabase Secrets.

### Error: "Order not found"

**Solución:**

1. Verifica que la migración SQL se ejecutó correctamente
2. Verifica que el usuario tenga permisos (RLS policies)

### Error: "Webhook not receiving calls"

**Solución:**

1. Verifica la URL del webhook en Flow dashboard
2. Verifica que la función `flow-webhook` esté deployed
3. Revisa los logs: `supabase functions logs flow-webhook`

### Edge Function no despliega

**Solución:**

```bash
# Ver logs de error
supabase functions deploy create-flow-payment --debug

# Verificar que Deno esté configurado correctamente
cd supabase/functions/create-flow-payment
deno run --allow-net index.ts
```

---

## 📊 Checklist de Configuración

- [ ] Migración SQL ejecutada (tablas `orders` y `order_items` creadas)
- [ ] Edge Function `create-flow-payment` deployed
- [ ] Edge Function `flow-webhook` deployed
- [ ] Secrets configurados en Supabase:
  - [ ] FLOW_API_KEY
  - [ ] FLOW_SECRET_KEY
  - [ ] FLOW_API_URL
  - [ ] FLOW_WEBHOOK_URL
  - [ ] FLOW_RETURN_URL
- [ ] Webhook configurado en Flow.cl dashboard
- [ ] Test con tarjeta de prueba exitoso

---

## 📞 Soporte

- **Flow API Docs:** https://www.flow.cl/docs/api.html
- **Flow Sandbox:** https://sandbox.flow.cl
- **Flow Soporte:** soporte@flow.cl
- **Guía detallada:** Ver `docs/FLOW_SETUP.md`

---

## 🎉 ¡Listo!

Una vez completados todos los pasos del checklist, tu integración de pagos estará funcionando.

Para probar, simplemente:

1. Agrega productos al carrito
2. Procede al checkout
3. Completa el pago con la tarjeta de prueba
4. Verifica que el orden aparezca como "paid" en la base de datos

**¡Felicitaciones! Tu tienda ya puede procesar pagos con Flow.cl** 🎊
