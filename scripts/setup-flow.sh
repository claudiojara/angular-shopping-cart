#!/bin/bash

# Flow Payment Integration - Setup Script
# This script configures Supabase secrets for Flow.cl integration

set -e

echo "🚀 Configurando integración de pagos con Flow.cl..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Supabase Configuration
SUPABASE_URL="https://owewtzddyykyraxkkorx.supabase.co"
SUPABASE_PROJECT_REF="owewtzddyykyraxkkorx"

# Flow Configuration
FLOW_API_KEY="52873FFF-FB8B-4B13-819B-9E7E836D6LA5"
FLOW_SECRET_KEY="f7a9d57a82f11c393ab3310e2d833f182c2b7d52"
FLOW_API_URL="https://sandbox.flow.cl/api"

# URLs
FLOW_WEBHOOK_URL="${SUPABASE_URL}/functions/v1/flow-webhook"
FLOW_RETURN_URL="https://witty-bush-0d65a3d0f.2.azurestaticapps.net/payment/callback"

echo -e "${YELLOW}📝 Credenciales de Flow:${NC}"
echo "   API Key: ${FLOW_API_KEY}"
echo "   Secret Key: ${FLOW_SECRET_KEY:0:20}..."
echo "   API URL: ${FLOW_API_URL}"
echo ""

echo -e "${YELLOW}🔗 URLs configuradas:${NC}"
echo "   Webhook: ${FLOW_WEBHOOK_URL}"
echo "   Return URL: ${FLOW_RETURN_URL}"
echo ""

echo -e "${YELLOW}⚠️  PASOS MANUALES REQUERIDOS:${NC}"
echo ""
echo "1. Hacer login en Supabase CLI:"
echo "   ${GREEN}supabase login${NC}"
echo ""
echo "2. Linkear el proyecto:"
echo "   ${GREEN}supabase link --project-ref ${SUPABASE_PROJECT_REF}${NC}"
echo ""
echo "3. Configurar secretos de Flow:"
echo "   ${GREEN}supabase secrets set FLOW_API_KEY='${FLOW_API_KEY}'${NC}"
echo "   ${GREEN}supabase secrets set FLOW_SECRET_KEY='${FLOW_SECRET_KEY}'${NC}"
echo "   ${GREEN}supabase secrets set FLOW_API_URL='${FLOW_API_URL}'${NC}"
echo "   ${GREEN}supabase secrets set FLOW_WEBHOOK_URL='${FLOW_WEBHOOK_URL}'${NC}"
echo "   ${GREEN}supabase secrets set FLOW_RETURN_URL='${FLOW_RETURN_URL}'${NC}"
echo ""
echo "4. Desplegar Edge Functions:"
echo "   ${GREEN}supabase functions deploy create-flow-payment${NC}"
echo "   ${GREEN}supabase functions deploy flow-webhook${NC}"
echo ""
echo "5. Ejecutar migración SQL:"
echo "   ${GREEN}supabase db push${NC}"
echo "   O manualmente en Supabase Dashboard > SQL Editor:"
echo "   Copiar contenido de: scripts/sql/14-create-orders-tables.sql"
echo ""

echo -e "${YELLOW}📋 Verificar configuración:${NC}"
echo "   ${GREEN}supabase secrets list${NC}"
echo ""

echo -e "${GREEN}✅ Script completado. Ejecuta los comandos anteriores para finalizar la configuración.${NC}"
