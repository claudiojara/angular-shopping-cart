#!/bin/bash

# Execute SQL migration via Supabase API

ACCESS_TOKEN="sbp_737db4b830facf7b75085b1bd3acfce2966cad98"
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
