# CI/CD Setup Checklist

Use este checklist para verificar que tu configuración de CI/CD esté completa antes de hacer deploy.

## ✅ Pre-requisitos

### 1. Azure Static Web Apps

- [ ] **Recurso de Producción creado**
  - URL: `https://witty-bush-0d65a3d0f.2.azurestaticapps.net`
  - Branch: `main`
  - Token copiado

- [ ] **Recurso de Staging creado** (ver `docs/AZURE_SETUP.md`)
  - URL: `https://YOUR-STAGING-URL.azurestaticapps.net`
  - Branch: `develop`
  - Token copiado

### 2. GitHub Secrets Configurados

Ve a: `https://github.com/claudiojara/angular-shopping-cart/settings/secrets/actions`

- [ ] `AZURE_STATIC_WEB_APPS_API_TOKEN` (Producción)
- [ ] `AZURE_STATIC_WEB_APPS_API_TOKEN_STAGING` (Staging)
- [ ] `SUPABASE_URL` (ej: `https://owewtzddyykyraxkkorx.supabase.co`)
- [ ] `SUPABASE_KEY` (ej: `eyJhbGciOiJIUzI1NiIs...`)
- [ ] `PLAYWRIGHT_TEST_EMAIL` (ej: `playwright-test@example.com`)
- [ ] `PLAYWRIGHT_TEST_PASSWORD` (ej: `PlaywrightTest123!`)
- [ ] `PLAYWRIGHT_TEST2_EMAIL` (ej: `playwright-test2@example.com`)
- [ ] `PLAYWRIGHT_TEST2_PASSWORD` (ej: `PlaywrightTest123!`)
- [ ] `CODECOV_TOKEN` (opcional, para cobertura de código)

### 3. Supabase Test Users

- [ ] **Usuario 1 creado en Supabase:**
  - Email: `playwright-test@example.com`
  - Password: `PlaywrightTest123!`
  - Auto-confirmed: ✅

- [ ] **Usuario 2 creado en Supabase:**
  - Email: `playwright-test2@example.com`
  - Password: `PlaywrightTest123!`
  - Auto-confirmed: ✅

- [ ] **Email confirmation deshabilitado** (solo para testing):
  - Supabase Dashboard → Authentication → Email Auth
  - "Enable email confirmations": OFF

### 4. Workflows Actualizados

- [ ] `.github/workflows/deploy-staging.yml` actualizado con URL real de staging (líneas 16, 72, 77)
- [ ] `.github/workflows/deploy-production.yml` usa `ncipollo/release-action@v1`
- [ ] `.github/workflows/ci.yml` sin cambios necesarios

### 5. Configuración Local

- [ ] Archivo `src/assets/config.local.json` existe (gitignored)
- [ ] Archivo `src/assets/config.json` tiene placeholders (`__SUPABASE_URL__`, `__SUPABASE_KEY__`)
- [ ] Script `scripts/generate-config.sh` es ejecutable
- [ ] Script `scripts/check-bundle-size.js` existe

## 🧪 Tests de Verificación

### Test 1: Verificar Local

```bash
# 1. Instalar dependencias
npm ci

# 2. Verificar linting
npm run lint:fix
npm run format

# 3. Ejecutar tests unitarios
npm test

# 4. Build de producción
npm run build:prod

# 5. Verificar bundle size
npm run analyze:size

# ✅ Si todos pasan, estás listo para CI
```

### Test 2: Verificar CI Workflow

```bash
# 1. Crear branch de prueba
git checkout -b test/ci-verification
echo "test" > test.txt
git add test.txt
git commit -m "test: verify CI workflow"
git push origin test/ci-verification

# 2. Abrir PR a develop
# Ve a: https://github.com/claudiojara/angular-shopping-cart/pulls

# 3. Verificar que el workflow "CI" se ejecute
# Debe pasar todos los checks (lint, tests, build)

# ✅ Si el workflow pasa, el CI está funcionando
```

### Test 3: Verificar Deploy a Staging

```bash
# 1. Merge el PR de prueba a develop
# El workflow "Deploy to Staging" debe ejecutarse automáticamente

# 2. Verificar el deployment
# Ve a: https://github.com/claudiojara/angular-shopping-cart/actions

# 3. Esperar a que termine el deployment

# 4. Abrir la URL de staging en el navegador
# Debe mostrar la aplicación funcionando

# 5. Verificar que E2E tests pasaron
# En el workflow, buscar el step "Run E2E tests"

# ✅ Si la app se desplegó y los E2E pasaron, staging está funcionando
```

### Test 4: Verificar Deploy a Producción

```bash
# 1. Crear PR de develop a main
git checkout main
git pull origin main
git merge develop
git push origin main

# 2. Verificar el workflow "Deploy to Production"
# Debe pasar strict ESLint (--max-warnings=0)

# 3. Verificar el deployment
# URL: https://witty-bush-0d65a3d0f.2.azurestaticapps.net

# 4. Verificar que se creó un Release
# Ve a: https://github.com/claudiojara/angular-shopping-cart/releases

# ✅ Si todo está funcionando, producción está lista
```

## 🐛 Troubleshooting

### Error: "secret not found"

**Síntoma:** El workflow falla con `Error: secret AZURE_STATIC_WEB_APPS_API_TOKEN_STAGING not found`

**Solución:**

1. Verifica que el secret existe en GitHub
2. Asegúrate de que el nombre es exacto (case-sensitive)
3. Re-ejecuta el workflow después de agregar el secret

### Error: "Deployment token is invalid"

**Síntoma:** Azure rechaza el token durante el deploy

**Solución:**

1. Ve al portal de Azure
2. Abre el recurso de Static Web App
3. "Deployment tokens" → Regenerate token
4. Copia el nuevo token
5. Actualiza el secret en GitHub
6. Re-ejecuta el workflow

### Error: "wait-on timeout"

**Síntoma:** El workflow falla esperando que la URL esté disponible

**Solución:**

1. Verifica que la URL en el workflow es correcta
2. Abre la URL manualmente para verificar que existe
3. Aumenta el timeout en el workflow (actualmente 120000ms = 2 minutos)

### E2E tests fallan en CI

**Síntoma:** Los E2E tests pasan localmente pero fallan en CI

**Soluciones posibles:**

1. Verifica que los test users existen en Supabase
2. Verifica que email confirmation está deshabilitado
3. Verifica que los secrets `PLAYWRIGHT_TEST_EMAIL` y `PLAYWRIGHT_TEST_PASSWORD` están configurados
4. Revisa los logs del workflow para ver el error específico
5. Descarga el Playwright report artifact para ver screenshots

### Bundle size too large

**Síntoma:** El workflow falla en el step "Analyze bundle size"

**Solución:**

1. Ejecuta `npm run analyze:size` localmente
2. Identifica archivos grandes (>500KB)
3. Considera:
   - Lazy loading para módulos grandes
   - Eliminar dependencias no usadas
   - Code splitting
4. Ajusta los thresholds en `scripts/check-bundle-size.js` si es necesario

## 📊 Métricas de Éxito

Una vez configurado correctamente, deberías ver:

- ✅ **CI Workflow**: ~3-5 minutos
- ✅ **Deploy to Staging**: ~5-8 minutos
- ✅ **Deploy to Production**: ~6-10 minutos
- ✅ **Code Coverage**: >60% global, >50% patch
- ✅ **Bundle Size**: <500KB por archivo
- ✅ **E2E Tests**: 14/14 passing

## 📚 Recursos Adicionales

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure Static Web Apps Documentation](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [Playwright Documentation](https://playwright.dev/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Última actualización:** Feb 5, 2026

Si encuentras problemas no listados aquí, abre un issue en el repositorio.
