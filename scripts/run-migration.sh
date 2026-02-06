#!/bin/bash

# Execute SQL migration via Supabase API

# Get token from environment variable or user input
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ Error: SUPABASE_ACCESS_TOKEN environment variable not set"
  echo ""
  echo "Get your token from: https://supabase.com/dashboard/account/tokens"
  echo "Then run: export SUPABASE_ACCESS_TOKEN=your_token"
  exit 1
fi

ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN"
PROJECT_REF="owewtzddyykyraxkkorx"
SQL_FILE="scripts/sql/14-create-orders-tables.sql"

echo "🚀 Ejecutando migración SQL en Supabase..."
echo ""

# Read SQL file
SQL_CONTENT=$(cat "$SQL_FILE")

# Execute via Supabase Management API
curl -X POST \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(jq -Rs . <<< "$SQL_CONTENT")}" \
  2>&1

echo ""
echo "✅ Migración completada"
