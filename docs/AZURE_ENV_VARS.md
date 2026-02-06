# Azure Static Web App - Environment Variables Setup

## Variables Requeridas para Azure Function

Estas variables deben agregarse en Azure Portal o via CLI:

### SUPABASE_URL

```
https://owewtzddyykyraxkkorx.supabase.co
```

### SUPABASE_SERVICE_ROLE_KEY

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93ZXd0emRkeXlreXJheGtrb3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI0MTcxNywiZXhwIjoyMDg1ODE3NzE3fQ.e3vt0qoJe_PYgYnYz6eKo6iOnazSyJNYErNe8Sn1KHo
```

### FLOW_SECRET_KEY

```
f7a9d57a82f11c393ab3310e2d833f182c2b7d52
```

---

## Opción A: Configurar via Azure Portal

1. Ir a: https://portal.azure.com
2. Buscar tu Static Web App: `witty-bush-0d65a3d0f`
3. En el menú izquierdo: **Settings → Configuration**
4. Click en **+ Add**
5. Agregar cada variable (nombre y valor de arriba)
6. Click **Save**

---

## Opción B: Configurar via Azure CLI

Ejecutar este comando (reemplaza `<APP-NAME>` con el nombre de tu app):

```bash
az staticwebapp appsettings set \
  --name witty-bush-0d65a3d0f \
  --setting-names \
    SUPABASE_URL="https://owewtzddyykyraxkkorx.supabase.co" \
    SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93ZXd0emRkeXlreXJheGtrb3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI0MTcxNywiZXhwIjoyMDg1ODE3NzE3fQ.e3vt0qoJe_PYgYnYz6eKo6iOnazSyJNYErNe8Sn1KHo" \
    FLOW_SECRET_KEY="f7a9d57a82f11c393ab3310e2d833f182c2b7d52"
```

**Nota:** Si no tienes Azure CLI instalado:

```bash
brew install azure-cli
az login
```

---

## Verificar Configuración

Listar variables configuradas:

```bash
az staticwebapp appsettings list --name witty-bush-0d65a3d0f
```

O verificar en Azure Portal → Configuration → Application settings
