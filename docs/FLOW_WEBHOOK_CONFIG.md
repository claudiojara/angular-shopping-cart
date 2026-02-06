# Configurar Webhook en Flow.cl - Guía Visual

## 🔍 Dónde encontrar la configuración del Webhook

### Opción 1: En el Dashboard de Flow (Más común)

1. **Login en Flow Sandbox:**
   https://sandbox.flow.cl

2. **Buscar en el menú lateral izquierdo:**
   - "Configuración" o "Settings"
   - "Notificaciones" o "Notifications"
   - "API"
   - "Integraciones"
   - "Webhooks"

3. **Opciones posibles según versión:**

   **Si ves "Configuración":**

   ```
   Configuración → Notificaciones → URL de Confirmación
   ```

   **Si ves "API":**

   ```
   API → Configuración → URL de Confirmación / Webhook URL
   ```

   **Si ves "Integraciones":**

   ```
   Integraciones → Webhooks → Agregar Webhook
   ```

### Opción 2: Configuración por Comercio

Algunos dashboards de Flow organizan la configuración así:

```
Mi Comercio → Datos del Comercio → Configuración de API → URL de Notificación
```

### Opción 3: En la página de API Keys

A veces la configuración del webhook está junto con las API Keys:

```
Configuración → API Keys → URL de Confirmación (debajo de las keys)
```

---

## ⚠️ Si NO encuentras la opción de Webhook

### En Flow Sandbox (Pruebas)

**Es posible que en sandbox no esté disponible** o requiera un paso adicional:

1. **Contactar a Flow:**
   - Email: soporte@flow.cl
   - Asunto: "Configurar Webhook en Sandbox"
   - Mensaje: "Necesito configurar el webhook URL para mi comercio en sandbox. Mi URL es: https://owewtzddyykyraxkkorx.supabase.co/functions/v1/flow-webhook"

2. **O solicitar habilitación:**
   Algunos comercios sandbox necesitan que Flow habilite manualmente los webhooks.

---

## 🎯 ALTERNATIVA: El pago funciona SIN webhook

**Importante:** Tu integración funcionará incluso sin configurar el webhook por ahora.

### Cómo funciona sin webhook:

1. Usuario completa el pago en Flow
2. Flow redirige al usuario de vuelta a tu app:
   ```
   https://witty-bush-0d65a3d0f.2.azurestaticapps.net/payment/callback?token=XXX
   ```
3. Tu app (PaymentCallbackPage) consulta el estado del pago directamente
4. Actualiza el estado de la orden según lo que Flow responda

**Con webhook:**

- Flow notifica automáticamente cuando el pago se completa (más confiable)
- Útil si el usuario cierra el navegador antes de volver

**Sin webhook:**

- El sistema verifica el estado cuando el usuario vuelve a tu sitio
- Funciona perfectamente para la mayoría de los casos

---

## ✅ Qué hacer AHORA

### 1. Ejecutar la migración SQL primero

Eso es lo más importante:

1. Ve a: https://supabase.com/dashboard/project/owewtzddyykyraxkkorx/sql
2. Click "New Query"
3. Copia TODO el contenido de: `scripts/sql/14-create-orders-tables.sql`
4. Pega y ejecuta

### 2. Probar el pago SIN webhook

Tu integración funcionará así:

- Usuario paga en Flow ✅
- Flow redirige de vuelta a tu app ✅
- Tu app consulta el estado ✅
- Orden se marca como pagada ✅

### 3. Configurar webhook DESPUÉS (opcional)

Una vez que tengas Flow en producción, o cuando encuentres dónde configurarlo, puedes agregarlo. No es bloqueante para probar.

---

## 📸 Screenshots de referencia

Estos son los nombres típicos que debes buscar en Flow dashboard:

```
✓ "URL de Confirmación"
✓ "URL de Notificación"
✓ "Webhook URL"
✓ "URL Confirmación Pago"
✓ "Notification URL"
✓ "IPN URL" (Instant Payment Notification)
```

---

## 🔧 Si tienes acceso a Flow API directamente

Puedes configurar el webhook por API:

```bash
curl -X POST https://sandbox.flow.cl/api/merchant/setWebhook \
  -d "apiKey=52873FFF-FB8B-4B13-819B-9E7E836D6LA5" \
  -d "url=https://owewtzddyykyraxkkorx.supabase.co/functions/v1/flow-webhook" \
  -d "s=<signature>"
```

(Requiere calcular la firma HMAC)

---

## 📞 Contacto Flow

Si después de revisar todo el dashboard no lo encuentras:

**Email:** soporte@flow.cl  
**Teléfono:** +56 2 2570 8000  
**Chat:** Disponible en el dashboard (esquina inferior derecha)

**Mensaje sugerido:**

```
Hola, estoy integrando Flow en sandbox y necesito configurar
mi webhook URL. No encuentro dónde configurarlo en el dashboard.

Mi URL de webhook es:
https://owewtzddyykyraxkkorx.supabase.co/functions/v1/flow-webhook

¿Pueden ayudarme a configurarlo o indicarme dónde está la opción?

Gracias!
```

---

## 🎯 Resumen

**Por ahora:**

1. ✅ Ejecuta la migración SQL (PRIORITARIO)
2. ✅ Prueba el pago (funcionará sin webhook)
3. ⏳ Configura webhook cuando lo encuentres o Flow te ayude

**El webhook es opcional para testing inicial.**

¿Te ayudo con la migración SQL mientras tanto?
