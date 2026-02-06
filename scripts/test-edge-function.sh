#!/bin/bash

# Test Edge Function authentication
# This script helps debug the 401 error

echo "🧪 Testing Edge Function Authentication"
echo ""

# Configuration
SUPABASE_URL="https://owewtzddyykyraxkkorx.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93ZXd0emRkeXlreXJheGtrb3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNDE3MTcsImV4cCI6MjA4NTgxNzcxN30.E5M6cIwnJTt1Y04pApmvLNqpV5yQSOcNJHlCM_JDBRE"

echo "📋 Please provide your access token from the browser:"
echo "   1. Open DevTools (F12)"
echo "   2. Go to Application > Local Storage"
echo "   3. Find key starting with 'supabase.auth.token'"
echo "   4. Copy the 'access_token' value"
echo ""
read -p "Paste access token here: " ACCESS_TOKEN

echo ""
echo "🚀 Testing Edge Function call..."
echo ""

curl -v -X POST "${SUPABASE_URL}/functions/v1/create-flow-payment" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"orderId": 1}' \
  2>&1 | grep -E "< HTTP|< content-type|{.*}"

echo ""
echo ""
echo "✅ If you see a JSON response (not 401), the Edge Function is working."
echo "❌ If you see 401, there's an authentication issue."
