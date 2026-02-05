# Resumen de Correcciones de CI/CD

## 🔴 Problemas Identificados

### 1. **Azure Static Web Apps - URL de Staging Incorrecta** (CRÍTICO)

**Problema:** Los workflows asumían que Azure crearía automáticamente una URL con sufijo `-develop`:

```
https://witty-bush-0d65a3d0f-develop.2.azurestaticapps.net
```

**Realidad:** Azure Static Web Apps NO crea automáticamente subdominios para branches. Necesitas crear dos recursos separados.

### 2. **Token de Deployment Incorrecto**

**Problema:** El workflow de staging usaba el mismo token que producción (`AZURE_STATIC_WEB_APPS_API_TOKEN`)

### 3. **GitHub Action Deprecada**

**Problema:** `actions/create-release@v1` está deprecada y ya no recibe mantenimiento

## ✅ Soluciones Implementadas

### 1. Documentación Creada

#### `docs/AZURE_SETUP.md`

- Guía paso a paso para crear segundo recurso de Azure Static Web Apps
- Instrucciones para obtener deployment token
- Configuración de GitHub Secrets
- Troubleshooting común

#### `docs/CICD_SETUP_CHECKLIST.md`

- Checklist completo de pre-requisitos
- Tests de verificación para cada etapa
- Troubleshooting detallado
- Métricas de éxito esperadas

### 2. Workflows Actualizados

#### `.github/workflows/deploy-staging.yml`

**Cambios:**

- ✅ Usa `AZURE_STATIC_WEB_APPS_API_TOKEN_STAGING` (token separado)
- ✅ URL actualizada a `https://YOUR-STAGING-URL.azurestaticapps.net` (placeholder)
- ✅ Comentarios TODO para reemplazar con URL real después de crear el recurso

#### `.github/workflows/deploy-production.yml`

**Cambios:**

- ✅ Reemplazada `actions/create-release@v1` por `ncipollo/release-action@v1`
- ✅ Configuración mejorada con token explícito

### 3. Documentación Actualizada

#### `AGENTS.md`

**Cambios:**

- ✅ Sección "Environments" actualizada con nota de advertencia
- ✅ Tabla con información de ambos recursos (producción y staging)
- ✅ Sección "GitHub Secrets" expandida con explicaciones
- ✅ Referencias a `docs/AZURE_SETUP.md`

## 📋 Próximos Pasos (REQUERIDOS)

### Paso 1: Crear Recurso de Staging en Azure

Sigue las instrucciones en `docs/AZURE_SETUP.md`:

1. Ir al portal de Azure: https://portal.azure.com
2. Crear nuevo recurso "Static Web App"
3. Configurar:
   - Name: `shopping-cart-staging`
   - Branch: `develop` ⚠️ IMPORTANTE
   - Repository: `claudiojara/angular-shopping-cart`
4. Copiar deployment token
5. Copiar URL del recurso

### Paso 2: Configurar GitHub Secret

1. Ir a: https://github.com/claudiojara/angular-shopping-cart/settings/secrets/actions
2. Crear nuevo secret:
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN_STAGING`
   - Value: [token copiado del paso 1]

### Paso 3: Actualizar URLs en Workflow

Editar `.github/workflows/deploy-staging.yml` y reemplazar en 3 lugares:

```yaml
# Línea ~16:
url: https://NUEVA-URL-STAGING.azurestaticapps.net

# Línea ~72:
run: npx wait-on https://NUEVA-URL-STAGING.azurestaticapps.net --timeout 120000

# Línea ~77:
PLAYWRIGHT_BASE_URL: https://NUEVA-URL-STAGING.azurestaticapps.net
```

### Paso 4: Verificar Configuración

Ejecutar checklist en `docs/CICD_SETUP_CHECKLIST.md`

### Paso 5: Probar Deploy

```bash
# 1. Crear commit de prueba
git checkout develop
echo "test: verify staging deployment" > test.txt
git add .
git commit -m "test: verify staging deployment"
git push origin develop

# 2. Monitorear workflow
# https://github.com/claudiojara/angular-shopping-cart/actions

# 3. Verificar deployment exitoso
# Abrir URL de staging en navegador
```

## 📊 Archivos Modificados

```
✅ NUEVOS:
   docs/AZURE_SETUP.md
   docs/CICD_SETUP_CHECKLIST.md
   docs/CICD_FIXES_SUMMARY.md (este archivo)

✅ MODIFICADOS:
   .github/workflows/deploy-staging.yml
   .github/workflows/deploy-production.yml
   AGENTS.md
```

## 🎯 Estado Actual

### ✅ Completado

- [x] Identificación de problemas
- [x] Documentación completa creada
- [x] Workflows actualizados con configuración correcta
- [x] AGENTS.md actualizado con información correcta
- [x] Checklist de configuración creado

### ⏳ Pendiente (requiere acceso a Azure Portal)

- [ ] Crear recurso de staging en Azure
- [ ] Obtener deployment token de staging
- [ ] Configurar GitHub Secret `AZURE_STATIC_WEB_APPS_API_TOKEN_STAGING`
- [ ] Reemplazar URLs placeholder en `deploy-staging.yml`
- [ ] Probar deployment a staging
- [ ] Verificar E2E tests en staging

## 🔗 Referencias

- **Azure Setup:** `docs/AZURE_SETUP.md`
- **Checklist Completo:** `docs/CICD_SETUP_CHECKLIST.md`
- **Repositorio:** https://github.com/claudiojara/angular-shopping-cart
- **Portal Azure:** https://portal.azure.com

## 📞 Soporte

Si encuentras problemas:

1. Revisa `docs/CICD_SETUP_CHECKLIST.md` sección "Troubleshooting"
2. Verifica que todos los secrets estén configurados correctamente
3. Revisa logs de workflow en GitHub Actions
4. Descarga Playwright report artifacts para ver screenshots de fallos

---

**Fecha:** Feb 5, 2026  
**Versión:** 1.0  
**Estado:** Pendiente de configuración en Azure Portal
