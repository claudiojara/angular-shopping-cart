# Azure Static Web Apps - Configuración de Staging y Producción

Este documento explica cómo configurar dos recursos separados de Azure Static Web Apps para entornos de **Staging** y **Producción**.

## ⚠️ Problema Actual

Los workflows de CI/CD asumen que existe un segundo recurso de Azure para staging, pero actualmente solo existe:

- **Producción**: `https://witty-bush-0d65a3d0f.2.azurestaticapps.net`

Azure Static Web Apps **NO crea automáticamente** URLs con sufijo `-develop` o `-staging`. Necesitas crear un segundo recurso manualmente.

## 🎯 Objetivo

Crear dos recursos independientes:

| Entorno        | Branch    | URL Ejemplo                                             | Token Secret                              |
| -------------- | --------- | ------------------------------------------------------- | ----------------------------------------- |
| **Staging**    | `develop` | `https://staging-shopping-cart-xxx.azurestaticapps.net` | `AZURE_STATIC_WEB_APPS_API_TOKEN_STAGING` |
| **Production** | `main`    | `https://witty-bush-0d65a3d0f.2.azurestaticapps.net`    | `AZURE_STATIC_WEB_APPS_API_TOKEN`         |

## 📝 Pasos para Crear Recurso de Staging

### 1. Acceder al Portal de Azure

1. Ve a https://portal.azure.com
2. Inicia sesión con tu cuenta

### 2. Crear Nuevo Recurso de Static Web App

1. **Buscar recurso:**
   - En la barra de búsqueda superior, escribe "Static Web Apps"
   - Selecciona "Static Web Apps"

2. **Crear recurso:**
   - Click en "+ Create" / "+ Crear"

3. **Configuración básica (Basics):**

   | Campo              | Valor                                                                 |
   | ------------------ | --------------------------------------------------------------------- |
   | **Subscription**   | Usa la misma que tu recurso de producción                             |
   | **Resource Group** | Usa el mismo que producción o crea uno nuevo (ej: `shopping-cart-rg`) |
   | **Name**           | `shopping-cart-staging` (o el nombre que prefieras)                   |
   | **Plan type**      | Free (para desarrollo)                                                |
   | **Region**         | Elige la más cercana a tus usuarios                                   |

4. **Configuración de Deployment (GitHub):**

   | Campo            | Valor                           |
   | ---------------- | ------------------------------- |
   | **Source**       | GitHub                          |
   | **Organization** | `claudiojara` (tu usuario)      |
   | **Repository**   | `angular-shopping-cart`         |
   | **Branch**       | `develop` ⚠️ **MUY IMPORTANTE** |

5. **Build Details:**

   | Campo               | Valor                         |
   | ------------------- | ----------------------------- |
   | **Build Presets**   | Angular                       |
   | **App location**    | `/dist/shopping-cart/browser` |
   | **Api location**    | (dejar vacío)                 |
   | **Output location** | (dejar vacío)                 |

6. **Review + Create:**
   - Verifica todos los datos
   - Click en "Create"

### 3. Obtener el Deployment Token

Después de crear el recurso:

1. **Ir al recurso:**
   - Una vez creado, click en "Go to resource"

2. **Obtener token:**
   - En el menú lateral izquierdo, click en "Deployment tokens" o "Manage deployment token"
   - Click en "Copy" para copiar el token
   - **GUARDA ESTE TOKEN** - lo necesitarás para GitHub Secrets

3. **Copiar la URL:**
   - En la página "Overview" del recurso
   - Busca "URL" (debería ser algo como `https://xxx.azurestaticapps.net`)
   - Copia la URL completa

### 4. Configurar GitHub Secrets

1. Ve a tu repositorio: https://github.com/claudiojara/angular-shopping-cart

2. **Settings → Secrets and variables → Actions → New repository secret**

3. **Crear el secret:**
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN_STAGING`
   - Value: Pega el token que copiaste en el paso 3
   - Click "Add secret"

### 5. Actualizar Workflows (Ya está hecho)

Los workflows ya están actualizados para usar dos tokens diferentes:

- `deploy-staging.yml` usa `AZURE_STATIC_WEB_APPS_API_TOKEN_STAGING`
- `deploy-production.yml` usa `AZURE_STATIC_WEB_APPS_API_TOKEN`

### 6. Actualizar URL en Workflow

Después de crear el recurso, necesitas actualizar la URL en `.github/workflows/deploy-staging.yml`:

```yaml
# Buscar estas líneas (13, 69, 74):
url: https://NUEVA-URL-STAGING.azurestaticapps.net
PLAYWRIGHT_BASE_URL: https://NUEVA-URL-STAGING.azurestaticapps.net
npx wait-on https://NUEVA-URL-STAGING.azurestaticapps.net --timeout 120000
```

Reemplaza con la URL real que obtuviste en el paso 3.

## 🔧 Verificación

### 1. Verificar Secrets

```bash
# Desde tu repositorio en GitHub:
Settings → Secrets and variables → Actions

# Deberías ver:
✅ AZURE_STATIC_WEB_APPS_API_TOKEN           (Producción)
✅ AZURE_STATIC_WEB_APPS_API_TOKEN_STAGING   (Staging)
✅ SUPABASE_URL
✅ SUPABASE_KEY
✅ PLAYWRIGHT_TEST_EMAIL
✅ PLAYWRIGHT_TEST_PASSWORD
✅ PLAYWRIGHT_TEST2_EMAIL
✅ PLAYWRIGHT_TEST2_PASSWORD
✅ CODECOV_TOKEN
```

### 2. Probar Deploy a Staging

```bash
# 1. Crear un commit en develop
git checkout develop
echo "test" >> test.txt
git add test.txt
git commit -m "test: verify staging deployment"
git push origin develop

# 2. Ver el workflow en acción
# https://github.com/claudiojara/angular-shopping-cart/actions

# 3. Verificar que se desplegó correctamente
# Abre la URL de staging en tu navegador
```

### 3. Probar Deploy a Producción

```bash
# 1. Merge develop a main
git checkout main
git merge develop
git push origin main

# 2. Ver el workflow en acción
# https://github.com/claudiojara/angular-shopping-cart/actions

# 3. Verificar que se desplegó correctamente
# https://witty-bush-0d65a3d0f.2.azurestaticapps.net
```

## 🐛 Troubleshooting

### Error: "Deployment token is invalid"

**Causa:** El token de GitHub Secret no coincide con el recurso de Azure.

**Solución:**

1. Ve al portal de Azure
2. Abre el recurso de Static Web App
3. "Deployment tokens" → Regenerate token
4. Copia el nuevo token
5. Actualiza el secret en GitHub

### Error: "Branch 'develop' not found"

**Causa:** El recurso de Azure está configurado para un branch diferente.

**Solución:**

1. Ve al portal de Azure
2. Abre el recurso de Static Web App
3. "Configuration" → "Source"
4. Cambia el branch a `develop`
5. Save

### URL de staging muestra "404 Not Found"

**Causa:** El deployment falló o está en progreso.

**Solución:**

1. Verifica el workflow en GitHub Actions
2. Revisa los logs del workflow
3. Espera unos minutos (el deploy puede tardar 2-3 minutos)
4. Si persiste, revisa la configuración de "Build Details" en Azure

### E2E tests fallan en CI pero pasan localmente

**Causa:** Los test users no existen en Supabase o la URL es incorrecta.

**Solución:**

1. Verifica que los usuarios de testing existan en Supabase
2. Verifica que `PLAYWRIGHT_BASE_URL` en el workflow coincida con la URL real
3. Verifica que los secrets `PLAYWRIGHT_TEST_EMAIL` y `PLAYWRIGHT_TEST_PASSWORD` estén configurados

## 📚 Referencias

- [Azure Static Web Apps Documentation](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [GitHub Actions for Azure Static Web Apps](https://github.com/Azure/static-web-apps-deploy)
- [Managing Deployment Tokens](https://learn.microsoft.com/en-us/azure/static-web-apps/deployment-token-management)

## 🎯 Próximos Pasos

Una vez configurado:

1. ✅ Crear recurso de staging en Azure
2. ✅ Copiar deployment token
3. ✅ Agregar secret `AZURE_STATIC_WEB_APPS_API_TOKEN_STAGING` a GitHub
4. ✅ Actualizar URL en `deploy-staging.yml`
5. ✅ Push a `develop` para probar
6. ✅ Verificar que E2E tests pasen
7. ✅ Merge a `main` para desplegar a producción

---

**Nota:** Este documento asume que ya tienes configurado el recurso de producción. Si necesitas ayuda con eso, consulta la documentación oficial de Azure Static Web Apps.
