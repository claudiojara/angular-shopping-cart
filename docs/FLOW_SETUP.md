# Flow.cl Payment Integration Setup Guide

This guide walks you through setting up Flow.cl payment integration for the Angular Shopping Cart application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Flow Account Setup](#flow-account-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Local Development](#local-development)
5. [Production Deployment](#production-deployment)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Active Supabase project
- Supabase CLI installed (`npm install -g supabase`)
- Flow.cl account (sandbox or production)
- Chilean RUT (for production account)

---

## Flow Account Setup

### 1. Create Flow Account

#### Sandbox (Testing)

1. Go to https://sandbox.flow.cl
2. Click "Crear Cuenta"
3. Fill in basic information:
   - Email
   - Password
   - RUT (can use test RUT: 11.111.111-1 for sandbox)
4. Verify email address

#### Production

1. Go to https://www.flow.cl
2. Click "Crear Cuenta"
3. Complete registration with real Chilean RUT
4. Complete identity verification (KYC)
5. Wait for approval (1-3 business days)

### 2. Get API Credentials

1. Login to Flow dashboard
2. Navigate to: **Configuración** → **Datos del Comercio** → **API Keys**
3. Copy:
   - **API Key** (public key)
   - **Secret Key** (private key, keep secure!)

### 3. Configure Webhook URL

1. In Flow dashboard, go to: **Configuración** → **Notificaciones**
2. Set **URL de Confirmación** to:
   ```
   https://[your-project-ref].supabase.co/functions/v1/flow-webhook
   ```
3. Save configuration

### 4. Configure Return URL

The return URL is configured per-payment in the Edge Function. Your checkout will redirect users to:

```
https://[your-app-domain]/payment/callback?token={flow_token}
```

---

## Supabase Configuration

### 1. Run Database Migration

Execute the SQL migration to create orders tables:

```bash
# Via Supabase CLI
supabase db push

# Or manually in Supabase Dashboard SQL Editor
# Copy and paste contents of: scripts/sql/14-create-orders-tables.sql
```

Verify tables were created:

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'order%';
```

Expected output:

- `orders`
- `order_items`

### 2. Deploy Edge Functions

Deploy both payment-related Edge Functions:

```bash
# Deploy create-flow-payment function
supabase functions deploy create-flow-payment

# Deploy flow-webhook function
supabase functions deploy flow-webhook
```

### 3. Set Environment Secrets

Set Flow credentials as Supabase secrets:

```bash
# Flow API credentials
supabase secrets set FLOW_API_KEY="your_api_key_here"
supabase secrets set FLOW_SECRET_KEY="your_secret_key_here"

# Flow API URL (sandbox or production)
supabase secrets set FLOW_API_URL="https://sandbox.flow.cl/api"  # Sandbox
# OR
supabase secrets set FLOW_API_URL="https://www.flow.cl/api"      # Production

# Webhook URL (auto-called by Flow)
supabase secrets set FLOW_WEBHOOK_URL="https://[your-project-ref].supabase.co/functions/v1/flow-webhook"

# Return URL (where users are redirected after payment)
supabase secrets set FLOW_RETURN_URL="https://[your-app-domain]/payment/callback"

# Service role key (for webhook to update orders)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
```

### 4. Verify Secrets

List all secrets to verify:

```bash
supabase secrets list
```

Expected output:

```
FLOW_API_KEY
FLOW_SECRET_KEY
FLOW_API_URL
FLOW_WEBHOOK_URL
FLOW_RETURN_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_URL (auto-set)
SUPABASE_ANON_KEY (auto-set)
```

---

## Local Development

### 1. Start Supabase Locally

```bash
supabase start
```

### 2. Set Local Secrets

Create `.env.local` file in supabase directory:

```bash
# supabase/.env.local
FLOW_API_KEY=your_sandbox_api_key
FLOW_SECRET_KEY=your_sandbox_secret_key
FLOW_API_URL=https://sandbox.flow.cl/api
FLOW_WEBHOOK_URL=http://localhost:54321/functions/v1/flow-webhook
FLOW_RETURN_URL=http://localhost:4200/payment/callback
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
```

### 3. Serve Edge Functions Locally

```bash
# In one terminal
supabase functions serve create-flow-payment --env-file supabase/.env.local

# In another terminal
supabase functions serve flow-webhook --env-file supabase/.env.local
```

### 4. Test Locally

Use Flow sandbox test cards:

**Success Card:**

- Number: `4051885600446623`
- CVV: `123`
- Expiry: Any future date

**Rejection Card:**

- Number: `5186059559590568`
- CVV: `123`
- Expiry: Any future date

---

## Production Deployment

### 1. Update Flow Configuration

In Flow production dashboard:

1. Set webhook URL to production Supabase URL
2. Verify SSL certificate (required for production)
3. Enable production mode

### 2. Update Supabase Secrets

```bash
# Switch to production API
supabase secrets set FLOW_API_URL="https://www.flow.cl/api"

# Update webhook and return URLs to production domains
supabase secrets set FLOW_WEBHOOK_URL="https://[production-project].supabase.co/functions/v1/flow-webhook"
supabase secrets set FLOW_RETURN_URL="https://[production-domain]/payment/callback"
```

### 3. Deploy Functions

```bash
supabase functions deploy create-flow-payment
supabase functions deploy flow-webhook
```

### 4. Test Production

Use real credit cards in small amounts ($100-500 CLP) to verify:

- Payment creation
- Webpay redirect
- Payment confirmation
- Order status update
- Stock reduction

---

## Testing

### Test Payment Flow End-to-End

1. **Create Test User:**

   ```sql
   -- In Supabase SQL Editor
   INSERT INTO auth.users (email, encrypted_password)
   VALUES ('test@example.com', crypt('password123', gen_salt('bf')));
   ```

2. **Add Products to Cart:**
   - Login as test user
   - Add 2-3 products to cart
   - Proceed to checkout

3. **Fill Shipping Information:**
   - Complete all required fields
   - Click "Pagar"

4. **Test Payment:**
   - You'll be redirected to Flow sandbox
   - Use test card: `4051885600446623`
   - Complete payment

5. **Verify Results:**
   - Check you're redirected to `/payment/callback`
   - Verify order status is "paid"
   - Verify cart is empty
   - Check order in database:
     ```sql
     SELECT * FROM orders WHERE user_id = '[test-user-id]' ORDER BY created_at DESC LIMIT 1;
     ```

### Test Webhook Manually

You can simulate a webhook call:

```bash
curl -X POST https://[your-project].supabase.co/functions/v1/flow-webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=test-token&flowOrder=12345&status=2&commerceOrder=1&paymentMethod=1&s=calculated-signature"
```

**Note:** Signature must be valid or webhook will reject the call.

---

## Troubleshooting

### Issue: "Flow signature verification failed"

**Cause:** Secret key mismatch or incorrect signature calculation

**Solution:**

1. Verify `FLOW_SECRET_KEY` matches exactly what's in Flow dashboard
2. Check webhook logs in Supabase:
   ```bash
   supabase functions logs flow-webhook
   ```
3. Ensure no extra whitespace in secret key

### Issue: "Order not found after payment"

**Cause:** Order not created in database before redirect

**Solution:**

1. Check browser console for errors
2. Verify `OrderService.createOrder()` completes successfully
3. Check network tab for failed API calls
4. Verify RLS policies allow user to insert orders

### Issue: "Payment URL returns 404"

**Cause:** Edge Function not deployed or wrong URL

**Solution:**

1. Verify function is deployed:
   ```bash
   supabase functions list
   ```
2. Check function logs:
   ```bash
   supabase functions logs create-flow-payment
   ```
3. Test function directly:
   ```bash
   curl -X POST https://[project].supabase.co/functions/v1/create-flow-payment \
     -H "Authorization: Bearer [anon-key]" \
     -H "Content-Type: application/json" \
     -d '{"orderId": 1}'
   ```

### Issue: "Webhook not updating order status"

**Cause:** Webhook URL not configured in Flow or webhook failing

**Solution:**

1. Verify webhook URL in Flow dashboard
2. Check webhook logs:
   ```bash
   supabase functions logs flow-webhook --tail
   ```
3. Manually trigger webhook (see Testing section)
4. Verify `SUPABASE_SERVICE_ROLE_KEY` is set

### Issue: "Stock not reducing after payment"

**Cause:** `reduce_product_stock` function not created or RPC call failing

**Solution:**

1. Verify function exists:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'reduce_product_stock';
   ```
2. If missing, run migration again
3. Check webhook logs for RPC errors

### Issue: "Users can see other users' orders"

**Cause:** RLS policy issue

**Solution:**

1. Verify RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'orders';
   ```
2. Check policies exist:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'orders';
   ```
3. Re-run migration if policies are missing

---

## Flow API Reference

### Payment Statuses

| Code | Status    | Description                         |
| ---- | --------- | ----------------------------------- |
| 1    | Pending   | Payment initiated but not completed |
| 2    | Approved  | Payment successful                  |
| 3    | Rejected  | Payment rejected by bank            |
| 4    | Cancelled | Payment cancelled by user           |

### Payment Methods

| Code | Method    | Description                  |
| ---- | --------- | ---------------------------- |
| 1    | Webpay    | Transbank credit/debit cards |
| 2    | Servipag  | Cash payment at Servipag     |
| 3    | Multicaja | Multicaja wallet             |
| 4    | Khipu     | Bank transfer via Khipu      |
| 9    | All       | All methods enabled          |

### Official Documentation

- **API Docs:** https://www.flow.cl/docs/api.html
- **Sandbox:** https://sandbox.flow.cl
- **Support:** soporte@flow.cl

---

## Security Best Practices

1. **Never expose Secret Key:**
   - Store only in Supabase secrets
   - Never commit to git
   - Never send to frontend

2. **Always verify signatures:**
   - Webhook function verifies all incoming calls
   - Reject unsigned requests

3. **Use HTTPS in production:**
   - Flow requires SSL for webhooks
   - Use production Supabase URL

4. **Validate order ownership:**
   - Edge Function checks `user_id` matches
   - RLS policies enforce user isolation

5. **Log everything:**
   - Edge Functions log all payment events
   - Monitor logs regularly for anomalies

---

## Support

For issues with:

- **Flow Integration:** soporte@flow.cl
- **Supabase:** support@supabase.io
- **This Application:** Open GitHub issue

---

## Next Steps

After completing setup:

1. Test full payment flow in sandbox
2. Verify order emails are sent (if implemented)
3. Test order history page
4. Configure stock alerts
5. Set up monitoring/alerts for failed payments
6. Go live with production credentials

---

**Last Updated:** {{ current_date }}
**Version:** 1.0
