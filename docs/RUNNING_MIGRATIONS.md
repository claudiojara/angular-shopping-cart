# Running Database Migrations

## Quick Start

To apply the orders tables migration to your Supabase database:

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to: **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open the file: `scripts/sql/14-create-orders-tables.sql`
5. Copy the entire contents
6. Paste into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for confirmation message: "Success. No rows returned"

### Option 2: Supabase CLI

```bash
# Make sure you're logged in
supabase login

# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

### Option 3: Direct SQL Execution

```bash
# Using psql
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f scripts/sql/14-create-orders-tables.sql
```

---

## Verify Migration Success

After running the migration, verify tables were created:

```sql
-- Check tables exist
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'order%'
ORDER BY tablename;
```

**Expected output:**

```
 tablename
-----------
 order_items
 orders
```

### Check View

```sql
-- Verify view was created
SELECT viewname
FROM pg_views
WHERE schemaname = 'public'
AND viewname = 'orders_with_items';
```

### Check Function

```sql
-- Verify function was created
SELECT proname, pronargs
FROM pg_proc
WHERE proname = 'get_user_orders';
```

### Check RLS Policies

```sql
-- Verify Row Level Security policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;
```

**Expected policies:**

- `orders`: Users can manage own orders
- `order_items`: Users can view own order items

---

## Test the Migration

### 1. Test Creating an Order

```sql
-- Get your user ID (replace email with your test user)
SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Insert test order (replace [user-id] with actual ID)
INSERT INTO orders (
  user_id,
  status,
  total_amount,
  shipping_amount,
  shipping_name,
  shipping_email,
  shipping_phone,
  shipping_address,
  shipping_region,
  shipping_city
) VALUES (
  '[user-id]',
  'pending',
  5000000, -- $50,000 CLP in cents
  500000,  -- $5,000 CLP in cents
  'Juan Pérez',
  'juan@example.com',
  '+56912345678',
  'Av. Principal 123',
  'Región Metropolitana',
  'Santiago'
) RETURNING *;
```

### 2. Test Creating Order Items

```sql
-- Get the order ID from previous query, then:
INSERT INTO order_items (
  order_id,
  product_id,
  product_name,
  product_slug,
  product_image_url,
  quantity,
  unit_price
) VALUES (
  1, -- Replace with actual order_id
  1, -- Replace with actual product_id
  'Lámpara Minimalista',
  'lampara-minimalista',
  'https://example.com/image.jpg',
  2,
  2000000 -- $20,000 CLP in cents
) RETURNING *;
```

### 3. Test the View

```sql
-- Test orders_with_items view
SELECT * FROM orders_with_items
WHERE user_id = '[your-user-id]'
LIMIT 1;
```

### 4. Test the Function

```sql
-- Test get_user_orders function
SELECT * FROM get_user_orders(
  p_user_id := '[your-user-id]',
  p_page := 1,
  p_page_size := 10
);
```

---

## Rollback (if needed)

If something goes wrong, you can drop the tables:

```sql
-- ⚠️ WARNING: This will delete all orders data
DROP VIEW IF EXISTS orders_with_items CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP FUNCTION IF EXISTS get_user_orders(UUID, INT, INT);
```

---

## Common Issues

### Issue: "permission denied for table orders"

**Solution:** RLS policies might not be set correctly. Re-run the migration.

### Issue: "column user_id does not exist"

**Solution:** Migration didn't complete. Check for SQL errors in the output.

### Issue: "function reduce_product_stock does not exist"

**Note:** This function is optional and will be created in a future migration for stock management.

---

## Next Steps

After successful migration:

1. ✅ Test creating orders via API
2. ✅ Deploy Edge Functions
3. ✅ Configure Flow credentials
4. ✅ Test complete checkout flow

See `docs/FLOW_SETUP.md` for complete integration guide.
