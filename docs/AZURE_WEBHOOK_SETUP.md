# Azure Functions Webhook Setup - Flow.cl Integration

## 🎯 Objetivo

Eliminar los emails de error de Flow.cl causados por el webhook de Supabase Edge Functions (401 Unauthorized) implementando un webhook en Azure Functions que no requiere autenticación JWT.

## ✅ Estado Actual: LISTO PARA PROBAR

### Archivos Creados

1. **`/api/`** - Proyecto Azure Functions (TypeScript)
   - `src/functions/flowWebhook.ts` - Handler del webhook
   - `package.json` - Dependencias (@azure/functions, @supabase/supabase-js)
   - `local.settings.json` - Variables de entorno para desarrollo local
   - `tsconfig.json` - Configuración TypeScript

2. **`staticwebapp.config.json`** - Actualizado con ruta API
   - Agregada ruta `/api/flow-webhook` con acceso anónimo

3. **Scripts de Testing**
   - `scripts/test-azure-webhook.sh` - Tests con curl
   - `scripts/test-webhook-flow.js` - Test con orden real de la BD

## 🚀 Cómo Probar Localmente

### Paso 1: Iniciar Azure Functions

```bash
# Terminal 1: Iniciar función local
cd api
npm start

# Deberías ver:
# Functions:
#   flow-webhook: [POST] http://localhost:7071/api/flow-webhook
```

### Paso 2: Opción A - Test Rápido con Curl

```bash
# Terminal 2: Ejecutar tests
bash scripts/test-azure-webhook.sh
```

**Tests incluidos:**

- ❌ Firma inválida → Debe retornar 200 (pero logear error)
- ❌ Parámetros faltantes → Debe retornar 200 (pero logear error)
- ✅ Firma válida con pago exitoso → Debe actualizar orden a "paid"

### Paso 3: Opción B - Test con Orden Real

```bash
# Terminal 2: Test con orden de la base de datos
node scripts/test-webhook-flow.js
```

**Qué hace:**

1. Busca última orden con `flow_token` en Supabase
2. Calcula firma HMAC-SHA256 válida
3. Hace POST al webhook local
4. Verifica que la orden se actualizó correctamente

**Salida esperada:**

```
1. Looking for an order with flow_token...
Found order: 15, status: pending, flow_token: 6b1c11d9...
2. String to sign: commerceOrder15status2token6b1c11d9...
3. Calculated signature: abc123...
4. Calling webhook: http://localhost:7071/api/flow-webhook
5. Response status: 200
6. Response body: OK
7. Checking updated order...
8. Updated order status: paid
9. Payment date: 2026-02-06T20:55:00.000Z
10. Payment method: Desconocido
```

## 📝 Cómo Funciona el Webhook

### Flujo de Datos

```
Flow.cl → POST /api/flow-webhook
  ↓
Azure Function recibe:
  - token (flow_token de la orden)
  - commerceOrder (nuestro order.id)
  - status (2=approved, 3=rejected, 4=cancelled)
  - s (firma HMAC-SHA256)
  ↓
Verifica firma (evita requests maliciosos)
  ↓
Busca orden en Supabase por commerceOrder
  ↓
Verifica que flow_token coincida
  ↓
Actualiza orden:
  - status → "paid", "failed", "cancelled", "pending"
  - payment_date (si exitoso)
  - payment_method
  ↓
Si status=paid → Reduce stock de productos
  ↓
Retorna 200 OK a Flow (evita reintentos)
```

### Formato de Firma Flow

Flow calcula firma HMAC-SHA256 de esta forma:

```
1. Ordena parámetros alfabéticamente
2. Concatena key+value SIN separadores
   Ejemplo: "commerceOrder15status2token6b1c11d9..."
3. HMAC-SHA256 con FLOW_SECRET_KEY
4. Envía como parámetro "s"
```

**Código de verificación:**

```typescript
const sortedKeys = Object.keys(params).sort();
const data = sortedKeys.map((key) => `${key}${params[key]}`).join('');
const hmac = crypto.createHmac('sha256', secret);
hmac.update(data);
const calculatedSignature = hmac.digest('hex');
return calculatedSignature === receivedSignature;
```

## 🔧 Variables de Entorno

### Local (`api/local.settings.json`)

```json
{
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "SUPABASE_URL": "https://owewtzddyykyraxkkorx.supabase.co",
    "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGc...",
    "FLOW_SECRET_KEY": "f7a9d57a82f11c393ab3310e2d833f182c2b7d52"
  }
}
```

### Azure (GitHub Secrets)

Agregar estos secrets al repositorio:

```
SUPABASE_URL (ya existe)
SUPABASE_SERVICE_ROLE_KEY (agregar)
FLOW_SECRET_KEY (agregar)
```

**Cómo agregar:**

1. GitHub → Settings → Secrets and variables → Actions
2. New repository secret
3. Nombre: `SUPABASE_SERVICE_ROLE_KEY`
4. Valor: `<GET_FROM_SUPABASE_DASHBOARD>` (obtener de https://supabase.com/dashboard/project/owewtzddyykyraxkkorx/settings/api)

## 🌐 Despliegue a Azure

### Paso 1: Commit y Push

```bash
git add api/ staticwebapp.config.json scripts/ docs/
git commit -m "feat: add Azure Functions webhook for Flow payments"
git push origin main
```

### Paso 2: Azure Deploy Automático

Azure Static Web Apps detectará automáticamente la carpeta `/api/` y desplegará las funciones.

**URL del webhook en producción:**

```
https://witty-bush-0d65a3d0f.2.azurestaticapps.net/api/flow-webhook
```

### Paso 3: Configurar Variables en Azure

**Opción A: Azure Portal**

1. Azure Portal → Static Web Apps → tu-app
2. Configuration → Application settings
3. Agregar:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FLOW_SECRET_KEY`

**Opción B: Azure CLI**

```bash
az staticwebapp appsettings set \
  --name <tu-app> \
  --setting-names \
    SUPABASE_URL="https://owewtzddyykyraxkkorx.supabase.co" \
    SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..." \
    FLOW_SECRET_KEY="f7a9d57a82f11c393ab3310e2d833f182c2b7d52"
```

### Paso 4: Actualizar Supabase Secret

Cambiar `FLOW_WEBHOOK_URL` para que apunte a Azure:

```bash
supabase secrets set \
  FLOW_WEBHOOK_URL="https://witty-bush-0d65a3d0f.2.azurestaticapps.net/api/flow-webhook" \
  --project-ref owewtzddyykyraxkkorx
```

### Paso 5: Redeploy Edge Function

Redeplegar `create-flow-payment` para usar nueva URL:

```bash
cd supabase/functions
supabase functions deploy create-flow-payment --project-ref owewtzddyykyraxkkorx
```

## ✅ Verificar Despliegue

### 1. Verificar que Azure Function está activa

```bash
curl -X POST https://witty-bush-0d65a3d0f.2.azurestaticapps.net/api/flow-webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "test=1"

# Debería retornar 200 OK
```

### 2. Hacer compra de prueba

1. Angular App → Checkout
2. Pagar con tarjeta de prueba Flow
3. Verificar que NO llega email de error de Flow
4. Verificar orden actualizada en Supabase

### 3. Revisar logs en Azure

```bash
# Azure Portal → Static Web Apps → Monitor → Application Insights
# O con Azure CLI:
az monitor app-insights query \
  --app <app-insights-name> \
  --analytics-query "traces | where message contains 'flow-webhook' | order by timestamp desc"
```

## 🐛 Troubleshooting

### Problema: Azure Function no se despliega

**Causa:** Carpeta `/api` no detectada

**Solución:**

- Verificar que `api/host.json` existe
- Verificar que `staticwebapp.config.json` tiene configuración de API
- Revisar logs de GitHub Actions

### Problema: Webhook retorna 500

**Causa:** Variables de entorno no configuradas

**Solución:**

```bash
# Verificar variables en Azure Portal
# O con CLI:
az staticwebapp appsettings list --name <tu-app>
```

### Problema: Firma inválida

**Causa:** Orden incorrecta de parámetros o codificación

**Solución:**

- Flow ordena alfabéticamente: `commerceOrder`, `status`, `token`
- Concatena sin separadores: `commerceOrder15status2token6b1c11d9...`
- Usar mismo secret que en dashboard Flow

### Problema: Orden no se actualiza

**Causa:** RLS policies o token mismatch

**Solución:**

- Usar `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS)
- Verificar que `flow_token` en BD coincide con `token` de webhook

## 📊 Diferencias: Supabase Edge Functions vs Azure Functions

| Característica        | Supabase Edge Function | Azure Function             |
| --------------------- | ---------------------- | -------------------------- |
| **Autenticación**     | ❌ Requiere JWT        | ✅ Anónimo                 |
| **Runtime**           | Deno                   | Node.js                    |
| **Ubicación**         | Global (Fly.io)        | Mismo Azure Static Web     |
| **Logs**              | Supabase Dashboard     | Azure Application Insights |
| **Costo**             | Incluido con Supabase  | Incluido con Static Web    |
| **Límites Free Tier** | 500K requests/mes      | 1M requests/mes            |
| **Webhooks externos** | ❌ 401 sin JWT         | ✅ Funciona sin auth       |

## 🎯 Resultado Esperado

Después del despliegue:

✅ Flow.cl puede hacer POST sin autenticación
✅ Webhook verifica firma y actualiza orden
✅ No más emails de error de Flow
✅ Órdenes se actualizan automáticamente
✅ Stock se reduce al confirmar pago
✅ Todo centralizado en Azure (frontend + backend)

## 📚 Referencias

- [Azure Functions TypeScript](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-node)
- [Flow.cl API Docs](https://www.flow.cl/docs/api.html)
- [Supabase Service Role](https://supabase.com/docs/guides/api/rest/authentication#service-role-key)
- [HMAC-SHA256 Verification](https://nodejs.org/api/crypto.html#crypto_crypto_createhmac_algorithm_key_options)
