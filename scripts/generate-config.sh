#!/bin/bash
set -e

ENVIRONMENT=${1:-production}
CONFIG_FILE="dist/shopping-cart/browser/assets/config.json"

echo "🔧 Generating config.json for ${ENVIRONMENT}..."

if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ Error: $CONFIG_FILE not found. Did the build succeed?"
  exit 1
fi

# Validate required environment variables
if [ -z "$SUPABASE_URL" ]; then
  echo "❌ Error: SUPABASE_URL environment variable is not set"
  exit 1
fi

if [ -z "$SUPABASE_KEY" ]; then
  echo "❌ Error: SUPABASE_KEY environment variable is not set"
  exit 1
fi

# Replace placeholders with actual values
sed -i.bak "s|__SUPABASE_URL__|${SUPABASE_URL}|g" "$CONFIG_FILE"
sed -i.bak "s|__SUPABASE_KEY__|${SUPABASE_KEY}|g" "$CONFIG_FILE"

# Set production flag based on environment
if [ "$ENVIRONMENT" = "production" ]; then
  sed -i.bak 's|"production": false|"production": true|g' "$CONFIG_FILE"
  sed -i.bak 's|"enableDebugMode": true|"enableDebugMode": false|g' "$CONFIG_FILE"
fi

# Set environment name
sed -i.bak "s|\"environment\": \"development\"|\"environment\": \"${ENVIRONMENT}\"|g" "$CONFIG_FILE"

# Remove backup file
rm "${CONFIG_FILE}.bak"

echo "✅ Config generated successfully for ${ENVIRONMENT}"
echo ""
echo "📄 Generated configuration:"
cat "$CONFIG_FILE" | grep -v "anonKey" || true
echo "   anonKey: [REDACTED]"
