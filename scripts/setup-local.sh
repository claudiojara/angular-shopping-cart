#!/bin/bash
set -e

echo "🚀 Setting up local development environment..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "   Please install Node.js 22 or higher from https://nodejs.org/"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "⚠️  Warning: Node.js version is $NODE_VERSION, recommended version is 22 or higher"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create config.local.json if it doesn't exist
CONFIG_LOCAL="src/assets/config.local.json"
CONFIG_TEMPLATE="src/assets/config.local.json.template"

if [ ! -f "$CONFIG_LOCAL" ]; then
  echo ""
  echo "📝 Creating local configuration file..."
  cp "$CONFIG_TEMPLATE" "$CONFIG_LOCAL"
  echo "✅ Created $CONFIG_LOCAL from template"
  echo ""
  echo "⚠️  IMPORTANT: Edit $CONFIG_LOCAL with your Supabase credentials"
  echo "   Get your keys from: https://supabase.com/dashboard/project/_/settings/api"
  echo ""
else
  echo "ℹ️  $CONFIG_LOCAL already exists (skipping)"
fi

# Install Playwright browsers
echo ""
echo "🎭 Installing Playwright browsers..."
npx playwright install chromium --with-deps

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit $CONFIG_LOCAL with your Supabase anon key"
echo "   2. Run 'npm start' to start the development server"
echo "   3. Run 'npm test' to run unit tests"
echo "   4. Run 'npm run test:e2e' to run E2E tests"
echo ""
