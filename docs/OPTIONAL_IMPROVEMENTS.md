# Mejoras Opcionales del Proyecto

Este documento explica mejoras adicionales que se pueden implementar en el proyecto para mejorar la experiencia de desarrollo y mantenimiento.

## 📋 Índice

1. ✅ [Branch Protection Rules](#1-branch-protection-rules) - **CONFIGURADO**
2. [CODEOWNERS](#2-codeowners) - **CONFIGURADO**
3. [Issue Templates](#3-issue-templates)
4. [Pull Request Template](#4-pull-request-template)
5. [Dependabot](#5-dependabot)
6. ✅ [Lighthouse CI](#6-lighthouse-ci) - **CONFIGURADO**
7. [Sentry - Error Tracking](#7-sentry---error-tracking)

---

## 1. Branch Protection Rules ✅

**Status: CONFIGURADO**

Ya está implementado con:
- Script de configuración: `scripts/setup-branch-protection.sh`
- CODEOWNERS: `.github/CODEOWNERS`
- Documentación: `docs/BRANCH_PROTECTION.md`

**Siguiente paso:** Ejecutar `bash scripts/setup-branch-protection.sh` y seguir las instrucciones para configurar en GitHub UI.

---

## 2. CODEOWNERS ✅

**Status: CONFIGURADO**

Archivo creado en `.github/CODEOWNERS`.

**Qué hace:**
- Define propietarios de código para diferentes partes del proyecto
- Requiere review automático de los owners cuando se modifican sus archivos
- Integrado con branch protection rules

**Owners actuales:**
- **Global:** @claudiojara (todos los archivos)
- **Services:** @claudiojara (cart, product, supabase)
- **Core:** @claudiojara (config system)
- **CI/CD:** @claudiojara (workflows, scripts, Azure config)
- **Docs:** @claudiojara (markdown files)

**Cómo funciona:**
1. Developer abre PR modificando `src/app/services/cart.service.ts`
2. GitHub automáticamente pide review de @claudiojara
3. PR no puede mergearse sin approval del owner

**Para agregar más owners:**
```bash
# .github/CODEOWNERS
# Frontend components
/src/app/components/  @frontend-team

# Backend integration
/src/app/services/    @backend-team @claudiojara
```

---

## 3. Issue Templates

**Status: NO CONFIGURADO (Pendiente)**

### Qué son los Issue Templates

Templates predefinidos que facilitan la creación de issues consistentes y con toda la información necesaria.

### Beneficios

- ✅ Issues mejor documentados desde el inicio
- ✅ Información estructurada y completa
- ✅ Facilita triaging y priorización
- ✅ Reduce idas y vueltas pidiendo información

### Templates Recomendados

#### 1. Bug Report
**Archivo:** `.github/ISSUE_TEMPLATE/bug_report.md`

Contiene:
- Descripción del bug
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots
- Información del entorno (OS, browser, versión)
- Logs relevantes

#### 2. Feature Request
**Archivo:** `.github/ISSUE_TEMPLATE/feature_request.md`

Contiene:
- Problema que resuelve
- Solución propuesta
- Alternativas consideradas
- Contexto adicional
- Mockups (si aplica)

#### 3. Documentation
**Archivo:** `.github/ISSUE_TEMPLATE/documentation.md`

Contiene:
- Qué documentación falta o está incorrecta
- Ubicación sugerida
- Audiencia (developers, users, etc)

#### 4. Performance Issue
**Archivo:** `.github/ISSUE_TEMPLATE/performance.md`

Contiene:
- Métrica afectada (LCP, FCP, etc)
- Valor actual vs esperado
- Lighthouse report
- Impacto en usuarios

### Cómo Implementar

```bash
# Crear directorio
mkdir -p .github/ISSUE_TEMPLATE

# Crear templates (ver ejemplos abajo)
# Luego commit y push
```

**Ejemplo Bug Report:**
```yaml
---
name: Bug Report
about: Reportar un bug o error en la aplicación
title: '[BUG] '
labels: bug
assignees: claudiojara
---

**Descripción del Bug**
Descripción clara y concisa del bug.

**Pasos para Reproducir**
1. Ir a '...'
2. Hacer click en '....'
3. Scroll hasta '....'
4. Ver error

**Comportamiento Esperado**
Qué esperabas que pasara.

**Screenshots**
Si aplica, agrega screenshots.

**Entorno:**
- OS: [e.g. macOS 13.0]
- Browser: [e.g. Chrome 120]
- Versión: [e.g. v1.2.3]

**Logs**
```
Pegar logs aquí
```

**Información Adicional**
Contexto adicional.
```

**Resultado:** Cuando alguien crea un issue, GitHub muestra los templates disponibles como opciones.

---

## 4. Pull Request Template

**Status: NO CONFIGURADO (Pendiente)**

### Qué es el PR Template

Template automático que aparece cuando alguien abre un Pull Request.

### Beneficios

- ✅ PRs consistentes y bien documentados
- ✅ Checklist asegura que no se olviden pasos
- ✅ Facilita code review
- ✅ Mejor historial del proyecto

### Template Recomendado

**Archivo:** `.github/pull_request_template.md`

```markdown
## Descripción

Descripción clara de los cambios realizados.

Fixes #(issue number)
Relates to #(issue number)

## Tipo de Cambio

- [ ] 🐛 Bug fix (cambio que corrige un issue)
- [ ] ✨ Nueva feature (cambio que añade funcionalidad)
- [ ] 💥 Breaking change (fix o feature que rompe compatibilidad)
- [ ] 📝 Cambio en documentación
- [ ] ♻️ Refactoring (sin cambios de funcionalidad)
- [ ] ⚡ Performance improvement
- [ ] ✅ Test (añadir o actualizar tests)

## ¿Cómo ha sido testeado?

Describe los tests realizados.

- [ ] Unit tests
- [ ] E2E tests
- [ ] Tests manuales
- [ ] Lighthouse audit

**Escenarios testeados:**
- Escenario 1: ...
- Escenario 2: ...

## Screenshots (si aplica)

Antes:
[screenshot]

Después:
[screenshot]

## Checklist

- [ ] Mi código sigue las guías de estilo del proyecto (AGENTS.md)
- [ ] He realizado self-review de mi código
- [ ] He comentado código complejo o no obvio
- [ ] He actualizado la documentación correspondiente
- [ ] Mis cambios no generan nuevos warnings
- [ ] He añadido tests que prueban mis cambios
- [ ] Tests nuevos y existentes pasan localmente
- [ ] Cambios dependientes han sido merged y publicados
- [ ] He ejecutado `npm run lint:fix` y `npm run format`
- [ ] He verificado que no hay regresiones de performance

## Performance Impact

- Bundle size: [antes] → [después]
- Lighthouse score: [antes] → [después]
- Load time impact: [estimado]

## Breaking Changes

Si aplica, describe breaking changes y migration path:

```typescript
// Antes
cartService.addItem(item);

// Después
cartService.addItem$(item).subscribe();
```
```

### Cómo Implementar

```bash
# Crear archivo
cat > .github/pull_request_template.md << 'EOF'
[contenido del template]
EOF

# Commit y push
git add .github/pull_request_template.md
git commit -m "docs: add PR template"
```

**Resultado:** Cada vez que alguien abre un PR, el template aparece automáticamente en la descripción.

---

## 5. Dependabot

**Status: NO CONFIGURADO (Pendiente)**

### Qué es Dependabot

Bot de GitHub que automáticamente:
- Detecta dependencias desactualizadas
- Crea PRs para actualizarlas
- Agrupa updates relacionados
- Detecta vulnerabilidades de seguridad

### Beneficios

- ✅ Mantiene dependencias actualizadas automáticamente
- ✅ Detecta y corrige vulnerabilidades de seguridad
- ✅ Reduce trabajo manual
- ✅ Cada update viene con release notes
- ✅ CI corre automáticamente para verificar compatibilidad

### Configuración Recomendada

**Archivo:** `.github/dependabot.yml`

```yaml
version: 2
updates:
  # NPM dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "America/Santiago"
    open-pull-requests-limit: 5
    reviewers:
      - "claudiojara"
    assignees:
      - "claudiojara"
    labels:
      - "dependencies"
      - "automated"
    commit-message:
      prefix: "chore"
      include: "scope"
    # Agrupar updates relacionados
    groups:
      angular:
        patterns:
          - "@angular/*"
      angular-material:
        patterns:
          - "@angular/material"
          - "@angular/cdk"
      testing:
        patterns:
          - "karma*"
          - "jasmine*"
          - "@playwright/*"
      linting:
        patterns:
          - "eslint*"
          - "@typescript-eslint/*"
          - "prettier"
    # Ignorar major updates de ciertas dependencias
    ignore:
      - dependency-name: "typescript"
        update-types: ["version-update:semver-major"]

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    reviewers:
      - "claudiojara"
    labels:
      - "github-actions"
      - "automated"
```

### Qué hace esta configuración

**NPM Updates:**
- Revisa dependencias cada **lunes a las 9am**
- Máximo **5 PRs abiertos** simultáneos
- **Agrupa updates relacionados** (Angular, Material, Testing, etc)
- Ignora major updates de TypeScript (requieren cambios manuales)
- Auto-asigna PRs a @claudiojara
- Labels automáticos: `dependencies`, `automated`

**GitHub Actions Updates:**
- Mantiene actions actualizadas semanalmente
- Ejemplo: `actions/checkout@v3` → `actions/checkout@v4`

### Ejemplo de PR Automático

Dependabot crea PRs como:
```
chore(deps): bump @angular/core from 20.3.0 to 20.3.5

Bumps [@angular/core](https://github.com/angular/angular) from 20.3.0 to 20.3.5.

Release notes:
- Fix: SSR hydration issue
- Performance: Faster change detection
- Security: Update dependencies

Compatibility: ✅ Passes CI
```

### Cómo Implementar

```bash
# Crear archivo
cat > .github/dependabot.yml << 'EOF'
[contenido de arriba]
EOF

# Commit y push
git add .github/dependabot.yml
git commit -m "chore: configure Dependabot for automated dependency updates"
git push
```

**Resultado:** A partir del próximo lunes, Dependabot empezará a crear PRs automáticamente.

### Best Practices con Dependabot

1. **Review automático pero merge manual:**
   - CI corre automáticamente
   - Si pasa, review rápido y merge
   - Si falla, investigar por qué

2. **Agrupar updates relacionados:**
   - Angular updates juntos (core, common, forms, etc)
   - Evita tener 10 PRs de @angular/xxx

3. **Límite de PRs abiertos:**
   - Max 5 PRs evita overwhelm
   - Mergea los existentes antes de que abra más

4. **Schedule semanal (no diario):**
   - Diario es muy agresivo
   - Semanal es manejable

5. **Auto-merge para patches (opcional):**
   ```yaml
   # .github/workflows/auto-merge-dependabot.yml
   # Auto-merge patch updates (x.y.Z)
   # Requiere configuración adicional
   ```

---

## 6. Lighthouse CI ✅

**Status: CONFIGURADO**

Ya está implementado con:
- Configuración: `lighthouserc.js`
- Workflow: `.github/workflows/lighthouse.yml`
- Scripts npm: `lighthouse`, `lighthouse:mobile`, `lighthouse:desktop`
- Documentación: `docs/LIGHTHOUSE_CI.md`

**Siguiente paso:** Ejecutar `npm run lighthouse` localmente para ver performance baseline.

---

## 7. Sentry - Error Tracking

**Status: NO CONFIGURADO (Pendiente)**

### Qué es Sentry

Plataforma de monitoreo de errores que:
- Captura excepciones en producción
- Agrupa errores similares
- Muestra stack traces
- Trackea releases
- Alerta cuando hay errores nuevos
- Performance monitoring (APM)

### Beneficios

- ✅ Detectar bugs en producción antes que los usuarios reporten
- ✅ Stack traces completos con source maps
- ✅ Contexto: usuario, navegador, versión, breadcrumbs
- ✅ Alertas en Slack/Email cuando hay errores críticos
- ✅ Performance monitoring (transaction tracking)
- ✅ Gratuito hasta 5K eventos/mes

### Cómo Funciona

```
Usuario experimenta error
    ↓
Sentry SDK captura excepción
    ↓
Envía a Sentry.io con contexto
    ↓
Sentry agrupa error con similares
    ↓
Notifica al equipo (Slack/Email)
    ↓
Developer ve error en dashboard
    ↓
Fix y deploy
```

### Setup Básico

#### 1. Crear Cuenta en Sentry

```bash
# 1. Ir a https://sentry.io
# 2. Crear cuenta gratuita
# 3. Crear nuevo proyecto: "angular-shopping-cart"
# 4. Copiar DSN (Data Source Name)
```

#### 2. Instalar SDK

```bash
npm install --save @sentry/angular @sentry/tracing
```

#### 3. Configurar en Angular

**app.config.ts:**
```typescript
import * as Sentry from "@sentry/angular";
import { Router } from '@angular/router';

// Inicializar Sentry
Sentry.init({
  dsn: "https://xxx@xxx.ingest.sentry.io/xxx", // Tu DSN
  environment: config.environment, // "production" | "staging" | "development"
  release: "shopping-cart@1.0.0", // Versión de la app
  
  // Integrations
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ["localhost", "https://witty-bush-0d65a3d0f.2.azurestaticapps.net"],
      routingInstrumentation: Sentry.routingInstrumentation,
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Performance Monitoring
  tracesSampleRate: 1.0, // 100% de transacciones (ajustar en producción)
  
  // Session Replay (beta)
  replaysSessionSampleRate: 0.1, // 10% de sesiones
  replaysOnErrorSampleRate: 1.0, // 100% cuando hay error
  
  // Filtering
  beforeSend(event, hint) {
    // No enviar errors de desarrollo
    if (config.environment === 'development') return null;
    
    // Filtrar errores conocidos
    if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
      return null; // Error benigno de Chrome
    }
    
    return event;
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    // Error handler de Sentry
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: false, // No mostrar dialog de Sentry
      }),
    },
    
    // Trace service
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    
    // Inicializar tracing
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [Sentry.TraceService],
      multi: true,
    },
    
    // ... otros providers
  ],
};
```

#### 4. Configurar Source Maps

**angular.json:**
```json
{
  "projects": {
    "shopping-cart": {
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "sourceMap": {
                "scripts": true,
                "styles": true,
                "hidden": true
              }
            }
          }
        }
      }
    }
  }
}
```

**Subir source maps a Sentry (CI):**
```yaml
# .github/workflows/deploy-production.yml
- name: Upload source maps to Sentry
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: tu-org
    SENTRY_PROJECT: angular-shopping-cart
  run: |
    npm install -g @sentry/cli
    sentry-cli releases new shopping-cart@${{ github.run_number }}
    sentry-cli releases files shopping-cart@${{ github.run_number }} upload-sourcemaps dist/shopping-cart/browser --rewrite
    sentry-cli releases finalize shopping-cart@${{ github.run_number }}
```

#### 5. Capturar Errores Manualmente

```typescript
import * as Sentry from '@sentry/angular';

// Capturar excepción
try {
  throw new Error('Algo salió mal');
} catch (error) {
  Sentry.captureException(error);
}

// Capturar mensaje
Sentry.captureMessage('Usuario intentó acceder sin permiso', 'warning');

// Agregar contexto
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

Sentry.setContext('shopping_cart', {
  item_count: cart.items().length,
  total: cart.total(),
});

// Breadcrumbs (automático con integration)
Sentry.addBreadcrumb({
  category: 'cart',
  message: 'Added product to cart',
  level: 'info',
  data: {
    product_id: product.id,
    quantity: 1,
  },
});
```

### Ejemplo de Error en Sentry Dashboard

```
TypeError: Cannot read property 'id' of undefined
  at ProductList.addToCart (product-list.ts:45:23)
  at HTMLButtonElement.click (zone.js:1234)

User: claudio@example.com (ID: 123)
Browser: Chrome 120.0.0 on macOS 13.0
Release: shopping-cart@v42
Environment: production

Breadcrumbs:
  [10:30:42] navigation → /products
  [10:30:45] click → Add to Cart button
  [10:30:45] error → Cannot read property 'id'

Context:
  shopping_cart: { item_count: 3, total: 45.99 }
  
This error has occurred 12 times in the last 24 hours
Affecting 8 users
```

### Performance Monitoring

```typescript
// Track custom transaction
const transaction = Sentry.startTransaction({
  op: "checkout",
  name: "Process Checkout",
});

// Track operation
const span = transaction.startChild({
  op: "http",
  description: "POST /api/orders",
});

try {
  await this.http.post('/api/orders', order).toPromise();
  span.setStatus('ok');
} catch (error) {
  span.setStatus('internal_error');
  throw error;
} finally {
  span.finish();
  transaction.finish();
}
```

### Alertas y Notificaciones

**Configurar en Sentry Dashboard:**

1. **Alerts** → **Create Alert Rule**
2. Condiciones:
   - When: "An event is seen"
   - Environment: "production"
   - Level: "error" or "fatal"
3. Actions:
   - Send notification to: Slack #alerts
   - Send email to: team@example.com
4. Filtros:
   - First seen (nuevos errores)
   - Regression (errores que vuelven)
   - Spike (aumento súbito)

### Releases y Deploy Tracking

```bash
# En CI/CD después de deploy exitoso
sentry-cli releases new shopping-cart@v42
sentry-cli releases set-commits shopping-cart@v42 --auto
sentry-cli releases deploys shopping-cart@v42 new -e production
sentry-cli releases finalize shopping-cart@v42
```

**Resultado:**
- Sentry muestra "Introduced in release v42"
- Puede hacer rollback comparando con release anterior
- Correlaciona errores con commits específicos

### Costo

**Plan Gratuito:**
- 5,000 errores/mes
- 10,000 performance transactions/mes
- 1 proyecto
- Source maps
- 30 días de retención

**Suficiente para:**
- Proyectos personales
- Startups pequeñas
- MVP

**Si excedes límite:**
- Developer plan: $26/mes (50K errores)
- Team plan: $80/mes (100K errores)

### Privacy y GDPR

```typescript
Sentry.init({
  // Scrub PII (Personally Identifiable Information)
  beforeSend(event) {
    // Remover emails de error messages
    if (event.message) {
      event.message = event.message.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]');
    }
    
    // No enviar datos sensibles
    delete event.request?.cookies;
    delete event.request?.headers?.['Authorization'];
    
    return event;
  },
  
  // No capturar IPs
  sendDefaultPii: false,
});
```

### Alternativas a Sentry

- **Bugsnag** - Similar a Sentry, más caro
- **Rollbar** - Más enfocado en web apps
- **LogRocket** - Session replay + error tracking
- **TrackJS** - Especializado en JavaScript
- **Self-hosted:** Sentry open source (gratis, requiere infraestructura)

---

## 🎯 Priorización de Implementación

### Inmediato (Hacer Ahora)
1. ✅ Branch Protection Rules - **YA HECHO**
2. ✅ CODEOWNERS - **YA HECHO**
3. ✅ Lighthouse CI - **YA HECHO**

### Corto Plazo (Esta Semana)
4. **Issue Templates** - 30 minutos
5. **PR Template** - 15 minutos
6. **Dependabot** - 10 minutos

### Mediano Plazo (Antes de Producción)
7. **Sentry** - 2 horas (setup + testing)

### Orden Sugerido

```bash
# Día 1: Templates
1. Crear issue templates
2. Crear PR template
3. Commit y push

# Día 2: Dependabot
4. Configurar dependabot.yml
5. Commit y push
6. Esperar primer PR automático

# Día 3: Sentry
7. Crear cuenta en Sentry
8. Instalar SDK
9. Configurar en Angular
10. Test en staging
11. Deploy a producción
```

## 📚 Recursos

- [GitHub Issue Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates)
- [Dependabot Configuration](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
- [Sentry Angular Docs](https://docs.sentry.io/platforms/javascript/guides/angular/)
- [Sentry Best Practices](https://docs.sentry.io/product/best-practices/)

---

**Última actualización:** 2026-02-05  
**Mantenedor:** @claudiojara
