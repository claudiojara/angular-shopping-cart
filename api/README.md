# 🧪 Testing Azure Functions Webhook

## Quick Start

### 1. Start Azure Function Locally

```bash
cd api
npm start
```

You should see:

```
Functions:
  flow-webhook: [POST] http://localhost:7071/api/flow-webhook
```

### 2. Run Tests

#### Option A: Quick Tests with Curl

```bash
bash scripts/test-azure-webhook.sh
```

#### Option B: Test with Real Order

```bash
node scripts/test-webhook-flow.js
```

This will:

1. Find the latest order with a `flow_token` in Supabase
2. Calculate a valid HMAC-SHA256 signature
3. POST to the local webhook
4. Verify the order was updated to "paid" status

## Expected Results

### Successful Test Output

```
1. Looking for an order with flow_token...
Found order: 15, status: pending, flow_token: 6b1c11d9...
2. String to sign: commerceOrder15status2token6b1c11d9...
3. Calculated signature: abc123...
4. Calling webhook: http://localhost:7071/api/flow-webhook
5. Response status: 200
6. Response body: OK
7. Checking updated order...
8. Updated order status: paid ✅
9. Payment date: 2026-02-06T20:55:00.000Z
10. Payment method: Desconocido
```

### Azure Function Logs

```
[2026-02-06T20:55:00.123Z] 🔔 Flow webhook received
[2026-02-06T20:55:00.234Z] Webhook data: { token: '6b1c11d9...', commerceOrder: '15', status: '2', s: 'abc123...' }
[2026-02-06T20:55:00.345Z] ✅ Signature verified
[2026-02-06T20:55:00.456Z] ✅ Order 15 marked as paid, stock reduced
```

## What Gets Tested

1. **Signature Verification** - HMAC-SHA256 with Flow secret key
2. **Order Lookup** - Finds order by commerceOrder (order.id)
3. **Token Validation** - Verifies flow_token matches
4. **Order Update** - Changes status to "paid", adds payment_date
5. **Stock Reduction** - Calls reduce_product_stock for each item

## Troubleshooting

### Function won't start

```bash
# Clean and rebuild
cd api
npm run clean
npm run build
npm start
```

### Test script can't find order

```bash
# Check if orders exist with flow_token
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://owewtzddyykyraxkkorx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY'
);
supabase.from('orders').select('*').not('flow_token', 'is', null).then(console.log);
"
```

### Signature verification fails

Check that `FLOW_SECRET_KEY` in `api/local.settings.json` matches Flow dashboard:

```
f7a9d57a82f11c393ab3310e2d833f182c2b7d52
```

## Next Steps

Once local tests pass:

1. Commit changes
2. Push to GitHub
3. Azure will auto-deploy the function
4. Update Supabase `FLOW_WEBHOOK_URL` secret
5. Redeploy `create-flow-payment` edge function
6. Test with real Flow payment

See `docs/AZURE_WEBHOOK_SETUP.md` for full deployment guide.
