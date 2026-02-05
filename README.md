# Shopping Cart - Angular Application

[![CI](https://github.com/claudiojara/angular-shopping-cart/actions/workflows/ci.yml/badge.svg)](https://github.com/claudiojara/angular-shopping-cart/actions/workflows/ci.yml)
[![Deploy to Staging](https://github.com/claudiojara/angular-shopping-cart/actions/workflows/deploy-staging.yml/badge.svg)](https://github.com/claudiojara/angular-shopping-cart/actions/workflows/deploy-staging.yml)
[![Deploy to Production](https://github.com/claudiojara/angular-shopping-cart/actions/workflows/deploy-production.yml/badge.svg)](https://github.com/claudiojara/angular-shopping-cart/actions/workflows/deploy-production.yml)
[![codecov](https://codecov.io/gh/claudiojara/angular-shopping-cart/branch/main/graph/badge.svg)](https://codecov.io/gh/claudiojara/angular-shopping-cart)

Una aplicación moderna de carrito de compras construida con Angular 20.3, Angular Material y Supabase.

**🌐 Producción:** [https://witty-bush-0d65a3d0f.2.azurestaticapps.net](https://witty-bush-0d65a3d0f.2.azurestaticapps.net)  
**🧪 Staging:** [https://witty-bush-0d65a3d0f-develop.2.azurestaticapps.net](https://witty-bush-0d65a3d0f-develop.2.azurestaticapps.net)

## 🚀 Características

### Funcionalidades
- ✅ Autenticación de usuarios (Supabase Auth)
- ✅ Catálogo de productos con imágenes y detalles
- ✅ Gestión de carrito de compras persistente
- ✅ Control de cantidades (+/-)
- ✅ Cálculo automático de totales
- ✅ Aislamiento de datos por usuario (RLS)
- ✅ Diseño responsive con Material Design

### Calidad y DevOps
- ✅ CI/CD con GitHub Actions
- ✅ Despliegue automático a Azure Static Web Apps
- ✅ Tests E2E con Playwright (14/14 ✅)
- ✅ Code coverage >60% (Codecov)
- ✅ Linting con ESLint
- ✅ Formateo con Prettier
- ✅ Bundle size monitoring

### Tecnología
- ✅ State management con Angular Signals
- ✅ OnPush change detection
- ✅ Standalone components
- ✅ Modern Angular APIs (input/output, @if/@for)
- ✅ TypeScript strict mode
- ✅ Accesibilidad (ARIA labels, data-testid)

## 🛠️ Stack Tecnológico

### Frontend
- **Angular** 20.3 (Standalone, Signals, OnPush)
- **Angular Material** 20.2.14
- **TypeScript** 5.9.2 (strict mode)
- **RxJS** 7.8.0
- **SCSS** para estilos

### Backend & Infraestructura
- **Supabase** (PostgreSQL + Auth + RLS)
- **Azure Static Web Apps** (hosting)
- **GitHub Actions** (CI/CD)

### Testing & Calidad
- **Jasmine/Karma** para unit tests
- **Playwright** para E2E tests
- **ESLint** + **Prettier** para linting
- **Codecov** para code coverage
- **Webpack Bundle Analyzer** para bundle size

## 📋 Requisitos Previos

- **Node.js** 22+ (ver `.nvmrc`)
- **npm** 9+
- **Angular CLI** 20.3+
- **Git**

Si usas nvm:
```bash
nvm use
```

## 🔧 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/claudiojara/angular-shopping-cart.git
cd angular-shopping-cart
```

### 2. Configuración automática (recomendado)

```bash
npm run setup
```

Este script:
- Instala todas las dependencias (npm install)
- Crea `config.local.json` desde el template
- Instala navegadores de Playwright para E2E tests
- Configura el entorno de desarrollo local

### 3. Configuración manual

Si prefieres configurar manualmente:

```bash
# Instalar dependencias
npm install

# Crear configuración local para Supabase
cp src/assets/config.local.json.template src/assets/config.local.json

# Editar config.local.json con tus credenciales de Supabase
# {
#   "supabase": {
#     "url": "https://tu-proyecto.supabase.co",
#     "key": "tu-anon-key"
#   }
# }

# Instalar navegadores de Playwright (opcional, solo para E2E)
npx playwright install chromium
```

### 4. Iniciar el servidor de desarrollo

```bash
npm start
```

La aplicación estará disponible en **http://localhost:4200**

## 🏗️ Scripts Disponibles

### Desarrollo
```bash
npm start                    # Servidor de desarrollo (puerto 4200)
npm run watch                # Build en modo watch
ng serve --port 4201         # Servidor en puerto personalizado
```

### Build
```bash
npm run build                # Build de desarrollo
npm run build:prod           # Build de producción optimizado
```

### Testing

#### Tests Unitarios (Jasmine/Karma)
```bash
npm test                     # Tests en modo watch
npm run test:ci              # Tests headless para CI (con coverage)
ng test --include='**/cart.service.spec.ts'  # Test específico
```

#### Tests E2E (Playwright)
```bash
npm run test:e2e             # E2E headless
npm run test:e2e:ci          # E2E para CI (1 worker)
npm run test:e2e:ui          # Modo UI interactivo
npm run test:e2e:headed      # Ver tests en el navegador
npm run test:e2e:report      # Ver último reporte
```

**Nota:** Los tests E2E requieren usuarios de prueba en Supabase (ver `e2e/config/test-credentials.ts`)

### Calidad de Código
```bash
npm run lint                 # ESLint (permite warnings)
npm run lint:fix             # Auto-fix de problemas de lint
npm run lint:strict          # ESLint estricto (falla con warnings)
npm run format               # Formatear código con Prettier
npm run format:check         # Verificar formato sin cambios
```

### Análisis
```bash
npm run analyze:size         # Analizar tamaño de bundles
```

## 📁 Estructura del Proyecto

```
shopping-cart/
├── .github/
│   └── workflows/              # GitHub Actions (CI/CD)
│       ├── ci.yml              # Pipeline de integración continua
│       ├── deploy-staging.yml  # Despliegue a staging
│       └── deploy-production.yml
│
├── .azure/
│   └── staticwebapp.config.json # Configuración Azure SWA
│
├── e2e/                        # Tests E2E con Playwright
│   ├── pages/                  # Page Object Models
│   ├── helpers/                # Helpers de testing
│   ├── config/                 # Credenciales de test
│   ├── authentication.spec.ts  # TC001-TC005
│   ├── shopping-cart.spec.ts   # TC006-TC015
│   └── cart-isolation.spec.ts  # Multi-user tests
│
├── scripts/
│   ├── generate-config.sh      # Genera config.json para CI/CD
│   ├── setup-local.sh          # Setup de entorno local
│   └── check-bundle-size.js    # Análisis de bundle size
│
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── cart/           # Componente del carrito
│   │   │   ├── product-list/   # Lista de productos
│   │   │   ├── login/          # Login
│   │   │   └── register/       # Registro
│   │   ├── core/
│   │   │   ├── config.model.ts     # Modelo de configuración
│   │   │   └── config.service.ts   # Servicio de config runtime
│   │   ├── services/
│   │   │   ├── cart.service.ts     # Gestión del carrito
│   │   │   ├── product.service.ts  # Gestión de productos
│   │   │   └── supabase.service.ts # Cliente Supabase
│   │   ├── models/
│   │   │   ├── product.model.ts
│   │   │   └── cart-item.model.ts
│   │   ├── app.ts              # Componente raíz
│   │   ├── app.routes.ts       # Rutas
│   │   └── app.config.ts       # Config de Angular
│   │
│   └── assets/
│       ├── config.json              # Config con placeholders (CI/CD)
│       ├── config.local.json        # Config local (gitignored)
│       └── config.local.json.template
│
├── angular.json                # Configuración Angular CLI
├── karma.conf.js               # Configuración Karma
├── eslint.config.js            # Configuración ESLint v9
├── .prettierrc.json            # Configuración Prettier
├── codecov.yml                 # Configuración Codecov
├── playwright.config.ts        # Configuración Playwright
└── package.json
```

## 🔄 CI/CD Pipeline

### Arquitectura de Despliegue

```
┌─────────────┐
│   develop   │ ──push──> CI + Deploy Staging + E2E
└─────────────┘           ↓
                          Azure SWA (Preview Environment)
                          https://...develop.2.azurestaticapps.net

┌─────────────┐
│    main     │ ──push──> CI + Deploy Production + E2E + Release
└─────────────┘           ↓
                          Azure SWA (Production)
                          https://witty-bush-0d65a3d0f.2.azurestaticapps.net
```

### Workflows

#### 1. **CI (Integración Continua)**
**Trigger:** Pull requests y push a `develop`

**Pasos:**
1. ✅ Setup Node.js 22
2. ✅ Install dependencies
3. ✅ Prettier check
4. ✅ ESLint (permite warnings)
5. ✅ Unit tests con coverage
6. ✅ Upload coverage a Codecov
7. ✅ Build producción
8. ✅ Análisis de bundle size

**Duración:** ~3-5 minutos

#### 2. **Deploy to Staging**
**Trigger:** Push a `develop`

**Pasos:**
1. ✅ Todos los checks de CI
2. ✅ Generate runtime config (reemplaza placeholders)
3. ✅ Deploy a Azure Static Web Apps (preview)
4. ✅ Wait for deployment
5. ✅ Run E2E tests contra staging
6. ✅ Upload Playwright report

**Duración:** ~5-8 minutos  
**URL:** https://witty-bush-0d65a3d0f-develop.2.azurestaticapps.net

#### 3. **Deploy to Production**
**Trigger:** Push a `main`

**Pasos:**
1. ✅ Prettier check
2. ✅ ESLint **strict** (falla con warnings)
3. ✅ Unit tests con coverage
4. ✅ Codecov (fail_ci_if_error: true)
5. ✅ Build producción
6. ✅ Análisis de bundle size
7. ✅ Generate runtime config
8. ✅ Deploy a Azure Static Web Apps
9. ✅ Wait for deployment
10. ✅ Run E2E tests contra producción
11. ✅ Create GitHub Release

**Duración:** ~6-10 minutos  
**URL:** https://witty-bush-0d65a3d0f.2.azurestaticapps.net

### Quality Gates

| Gate | Staging | Production |
|------|---------|------------|
| Prettier | ✅ Check | ✅ Check |
| ESLint | ⚠️ Warnings OK | ❌ Strict (max-warnings=0) |
| Unit Tests | ✅ Required | ✅ Required |
| Code Coverage | ⚠️ 60% target | ✅ 60% required |
| Bundle Size | ⚠️ 500KB warn, ❌ 1MB error | ⚠️ 500KB warn, ❌ 1MB error |
| E2E Tests | ✅ 14 tests | ✅ 14 tests |

### Secrets Configurados en GitHub

```bash
AZURE_STATIC_WEB_APPS_API_TOKEN  # Token de despliegue Azure
SUPABASE_URL                      # URL de Supabase
SUPABASE_KEY                      # Anon key de Supabase
PLAYWRIGHT_TEST_EMAIL             # Usuario test 1
PLAYWRIGHT_TEST_PASSWORD          # Password test 1
PLAYWRIGHT_TEST2_EMAIL            # Usuario test 2
PLAYWRIGHT_TEST2_PASSWORD         # Password test 2
CODECOV_TOKEN                     # Token de Codecov
```

### Estrategia de Branching

```
feature/xxx ──PR──> develop ──PR──> main
                       ↓              ↓
                   Staging      Production
```

**Workflow recomendado:**
1. Crea feature branch desde `develop`
2. Desarrolla y haz commits
3. Abre PR a `develop` → CI corre automáticamente
4. Merge a `develop` → Deploy a staging + E2E
5. Verifica en staging
6. Abre PR de `develop` a `main`
7. Merge a `main` → Deploy a producción + Release

## 🔐 Configuración de Entornos

### Desarrollo Local

El proyecto usa un sistema de **configuración runtime** que carga la config cuando la app inicia, no en tiempo de build.

**Archivo:** `src/assets/config.local.json` (gitignored)

```json
{
  "supabase": {
    "url": "https://tu-proyecto.supabase.co",
    "key": "tu-anon-key-aqui"
  }
}
```

**Prioridad de carga:**
1. Intenta cargar `/assets/config.local.json` (desarrollo)
2. Si falla, carga `/assets/config.json` (producción/CI)

### CI/CD (Staging & Production)

**Archivo:** `src/assets/config.json` (commiteado con placeholders)

```json
{
  "production": false,
  "supabase": {
    "url": "__SUPABASE_URL__",
    "anonKey": "__SUPABASE_KEY__"
  }
}
```

El script `scripts/generate-config.sh` reemplaza los placeholders con valores de GitHub Secrets durante el despliegue.

### Variables de Entorno

El proyecto **NO** usa variables de entorno en tiempo de build (`environment.ts`). Todo se carga en runtime desde `config.json`.

**Ventajas:**
- ✅ Un solo build sirve para múltiples entornos
- ✅ Cambios de config sin rebuild
- ✅ Más seguro (no expone secrets en el bundle)
- ✅ Compatible con Azure Static Web Apps

## 🧪 Testing

### Estrategia de Testing

El proyecto implementa una estrategia completa de testing en 3 niveles:

#### 1. Unit Tests (Jasmine/Karma)
- **Cobertura:** Servicios, componentes, modelos
- **Runner:** Karma con ChromeHeadlessCI
- **Objetivo:** >60% code coverage
- **Ejecutar:** `npm test` (watch) o `npm run test:ci` (CI)

**Archivos:**
- `*.spec.ts` junto a cada componente/servicio
- `karma.conf.js` para configuración

#### 2. E2E Tests (Playwright)
- **Cobertura:** Flujos completos de usuario
- **Total:** 14 test cases (14/14 ✅)
- **Runner:** Playwright con Chromium
- **Ejecutar:** `npm run test:e2e` o `npm run test:e2e:ui`

**Test Cases:**

**Autenticación (TC001-TC005):**
- TC001: Login exitoso
- TC002: Login con credenciales inválidas
- TC003: Registro de nuevo usuario
- TC004: Registro con email duplicado
- TC005: Logout

**Carrito de Compras (TC006-TC015):**
- TC006: Visualizar lista de productos
- TC007: Ver detalles de un producto
- TC008: Agregar producto al carrito
- TC009: Agregar múltiples productos
- TC010: Incrementar cantidad de producto
- TC011: Decrementar cantidad de producto
- TC012: Eliminar producto del carrito
- TC013: Visualizar total del carrito
- TC014: Persistencia del carrito tras logout
- TC015: Aislamiento de carrito entre usuarios

**Requisitos para E2E:**
- Usuario de prueba en Supabase: `playwright-test@example.com`
- Email confirmation deshabilitado en Auth settings
- RLS policies configuradas en `cart_items` table

#### 3. Visual & Accessibility Tests
- **Manual:** Verificación en diferentes navegadores
- **Automático:** AXE accessibility checks (futuro)

### Code Coverage

El proyecto usa **Codecov** para tracking de cobertura:
- **Objetivo global:** 60%
- **Objetivo por patch:** 50%
- **Archivos ignorados:** `*.spec.ts`, `*.mock.ts`

**Ver reporte:**
- Local: `coverage/shopping-cart/index.html` (después de `npm run test:ci`)
- Online: https://codecov.io/gh/claudiojara/angular-shopping-cart

### Bundle Size Monitoring

El script `check-bundle-size.js` analiza el tamaño de los bundles:
- **Warning:** >500KB por archivo
- **Error:** >1MB por archivo
- **Ejecutar:** `npm run analyze:size`

**Resultado actual:**
```
✅ chunk-BJV3C5AP.js: 155.76 KB
✅ chunk-SXDPAB6K.js: 66.18 KB
⚠️  main-PVRZ4T4W.js: 686.65 KB
✅ polyfills-5CFQRCPP.js: 33.77 KB
Total: 942.37 KB (0.92 MB)
```

## 🎨 Características de UX

- **Botones principales**: Texto + icono para claridad
- **Botones secundarios**: Solo iconos con tooltips
- **Actualizaciones en tiempo real**: Badge del carrito se actualiza automáticamente
- **Feedback visual**: Efectos hover y transiciones suaves
- **Responsive**: Funciona en desktop, tablet y móvil
- **Optimistic updates**: Cambios instantáneos con rollback en caso de error

## 🔒 Seguridad y Aislamiento de Datos

### Row Level Security (RLS)

Todos los datos de carrito están protegidos por RLS policies en Supabase:

```sql
CREATE POLICY "Users can manage own cart"
ON cart_items
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**Garantías:**
- ✅ Usuarios solo ven su propio carrito
- ✅ No pueden modificar carritos de otros usuarios
- ✅ Aislamiento entre staging y producción (mismo DB)
- ✅ Tests E2E verifican el aislamiento (TC015)

### Filtrado en Cliente

Además de RLS (database-level), el código cliente también filtra por `user_id`:

**Ejemplo en cart.service.ts:**
```typescript
const user = this.supabase.getCurrentUser();
if (!user) return;

const { data } = await this.supabase.client
  .from('cart_items')
  .select('*')
  .eq('user_id', user.id);  // ✅ Siempre filtrar por user_id
```

**Ubicaciones críticas:**
- `cart.service.ts:65` - loadCartFromDb()
- `cart.service.ts:162` - removeFromCart()
- `cart.service.ts:203` - updateQuantity()

## 🐛 Troubleshooting

### Problemas Comunes

#### 1. Error: "Supabase client not initialized"
**Causa:** config.local.json no existe o es inválido  
**Solución:**
```bash
cp src/assets/config.local.json.template src/assets/config.local.json
# Editar con tus credenciales reales
```

#### 2. E2E tests fallan con "User not found"
**Causa:** Usuario de prueba no existe en Supabase  
**Solución:**
```bash
# Crear usuario en Supabase Dashboard:
# Email: playwright-test@example.com
# Password: PlaywrightTest123!
# ✅ Auto Confirm User
```

#### 3. ESLint falla con "config not found"
**Causa:** Cache de ESLint corrupto  
**Solución:**
```bash
rm -rf node_modules/.cache
npm run lint
```

#### 4. Tests unitarios fallan en CI
**Causa:** ChromeHeadlessCI no configurado  
**Solución:** Ya configurado en `karma.conf.js` - verificar que se use `--browsers=ChromeHeadlessCI`

#### 5. Bundle size error en CI
**Causa:** Bundle excede 1MB  
**Solución:**
- Revisar dependencias con `npm run analyze:size`
- Considerar lazy loading de módulos
- Revisar imports de Material (importar módulos específicos)

### Logs y Debugging

**Local:**
```bash
# Ver logs de Angular
ng serve --verbose

# Ver logs de tests
npm test -- --log-level=debug

# Ver logs de E2E
npm run test:e2e:headed  # Ver en navegador
```

**CI/CD:**
- GitHub Actions: https://github.com/claudiojara/angular-shopping-cart/actions
- Playwright Reports: Artifacts en cada workflow run
- Codecov: https://codecov.io/gh/claudiojara/angular-shopping-cart

## 🚀 Roadmap

### v1.0 (Actual) ✅
- [x] Autenticación de usuarios (Supabase)
- [x] Catálogo de productos
- [x] Carrito persistente
- [x] CI/CD completo
- [x] Tests E2E (14/14)
- [x] Despliegue en Azure

### v1.1 (Próximo)
- [ ] Filtros de productos (categoría, precio, nombre)
- [ ] Búsqueda de productos
- [ ] Paginación en lista de productos
- [ ] Ordenamiento (precio, nombre, fecha)

### v1.2 (Futuro)
- [ ] Wishlist / Favoritos
- [ ] Histórico de pedidos
- [ ] Proceso de checkout completo
- [ ] Integración con pasarela de pago
- [ ] Notificaciones por email
- [ ] Panel de administración

### v2.0 (Visión)
- [ ] PWA (Progressive Web App)
- [ ] Modo offline
- [ ] Notificaciones push
- [ ] Recomendaciones de productos (ML)
- [ ] Chat de soporte en vivo

## 🤝 Contribuir

### Flujo de Contribución

1. **Fork** el proyecto
2. **Crea** una rama feature (`git checkout -b feature/amazing-feature`)
3. **Haz** commits siguiendo conventional commits
4. **Push** a tu fork (`git push origin feature/amazing-feature`)
5. **Abre** un Pull Request a `develop`

### Conventional Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: formateo, falta de punto y coma, etc
refactor: refactorización de código
test: añadir o modificar tests
chore: actualizar dependencias, config, etc
```

**Ejemplos:**
```bash
git commit -m "feat: add product filters by category"
git commit -m "fix: cart not persisting after logout"
git commit -m "docs: update README with deployment info"
git commit -m "test: add E2E test for checkout flow"
```

### Código de Conducta

- **Code Style:** Seguir las reglas de ESLint y Prettier
- **Angular Guidelines:** Ver `AGENTS.md` para convenciones específicas
- **Testing:** Incluir tests para nuevas funcionalidades
- **Commits:** Usar conventional commits
- **PRs:** Describir cambios y linkear issues relacionados

### Setup para Contribuidores

```bash
# Fork y clonar
git clone https://github.com/TU-USUARIO/angular-shopping-cart.git
cd angular-shopping-cart

# Configurar upstream
git remote add upstream https://github.com/claudiojara/angular-shopping-cart.git

# Crear rama desde develop
git checkout develop
git pull upstream develop
git checkout -b feature/mi-feature

# Desarrollar, testear, commitear
npm run lint:fix
npm test
npm run test:e2e
git add .
git commit -m "feat: mi nueva funcionalidad"

# Sincronizar con upstream antes de push
git pull upstream develop --rebase
git push origin feature/mi-feature

# Abrir PR en GitHub
```

## 📚 Documentación Adicional

- **[AGENTS.md](AGENTS.md)** - Guías para agentes AI que trabajan en el proyecto
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guía detallada de contribución
- **[e2e/README.md](e2e/README.md)** - Documentación de tests E2E
- **[Playwright Report](playwright-report/index.html)** - Último reporte de E2E (local)

### Referencias Externas

- [Angular Documentation](https://angular.dev/)
- [Angular Material](https://material.angular.io/)
- [Supabase Documentation](https://supabase.com/docs)
- [Playwright Documentation](https://playwright.dev/)
- [Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/)

## 👤 Autor

**Claudio Jara**
- GitHub: [@claudiojara](https://github.com/claudiojara)
- Email: contacto@claudiojara.dev

## 📊 Métricas del Proyecto

- **Líneas de código:** ~3,500 (src/)
- **Tests unitarios:** 30+
- **Tests E2E:** 14
- **Code coverage:** >60%
- **Bundle size:** 993KB (producción)
- **Lighthouse Score:** 90+ (Performance, Accessibility, Best Practices)

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la **MIT License**.

```
MIT License

Copyright (c) 2026 Claudio Jara

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Agradecimientos

- **Angular Team** por el framework
- **Angular Material Team** por los componentes
- **Supabase Team** por el backend-as-a-service
- **Microsoft Azure** por el hosting
- **Playwright Team** por las herramientas de testing

---

**⭐ Si te gusta este proyecto, dale una estrella en GitHub!**
