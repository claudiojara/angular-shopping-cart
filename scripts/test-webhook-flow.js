const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://owewtzddyykyraxkkorx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  console.error(
    'Get it from: https://supabase.com/dashboard/project/owewtzddyykyraxkkorx/settings/api',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWebhook() {
  // 1. Find an order with a flow_token
  console.log('1. Looking for an order with flow_token...');
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .not('flow_token', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !orders || orders.length === 0) {
    console.error('No orders found with flow_token');
    return;
  }

  const order = orders[0];
  console.log(`Found order: ${order.id}, status: ${order.status}, flow_token: ${order.flow_token}`);

  // 2. Calculate signature for webhook
  const flowSecret = 'f7a9d57a82f11c393ab3310e2d833f182c2b7d52';
  const params = {
    commerceOrder: order.id.toString(),
    status: '2', // Approved
    token: order.flow_token,
  };

  // Sort keys alphabetically and concatenate key+value
  const sortedKeys = Object.keys(params).sort();
  const data = sortedKeys.map((key) => `${key}${params[key]}`).join('');
  console.log(`2. String to sign: ${data}`);

  const hmac = crypto.createHmac('sha256', flowSecret);
  hmac.update(data);
  const signature = hmac.digest('hex');
  console.log(`3. Calculated signature: ${signature}`);

  // 3. Make POST request to Azure Function
  const webhookUrl = 'http://localhost:7071/api/flow-webhook';
  console.log(`4. Calling webhook: ${webhookUrl}`);

  const formData = new URLSearchParams({
    token: params.token,
    commerceOrder: params.commerceOrder,
    status: params.status,
    s: signature,
  });

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  console.log(`5. Response status: ${response.status}`);
  const body = await response.text();
  console.log(`6. Response body: ${body}`);

  // 4. Check if order was updated
  console.log('7. Checking updated order...');
  const { data: updatedOrder } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order.id)
    .single();

  console.log(`8. Updated order status: ${updatedOrder.status}`);
  console.log(`9. Payment date: ${updatedOrder.payment_date}`);
  console.log(`10. Payment method: ${updatedOrder.payment_method}`);
}

testWebhook().catch(console.error);
