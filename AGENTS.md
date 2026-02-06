# Agent Guidelines for Angular Shopping Cart

Guidelines for AI agents working on this Angular 20.3 + Supabase project.

**Reference Skills:** `angular-best-practices`, `angular-signals`, `angular-material`

## Tech Stack

- Angular 20.3 (standalone components, OnPush, Signals)
- Angular Material 20.2.14
- Supabase (PostgreSQL + Auth)
- TypeScript 5.9.2 (strict mode)
- SCSS styling
- Jasmine/Karma + TestSprite

## Commands

### Development

```bash
npm start                                    # Dev server (localhost:4200)
ng serve --port 4201                         # Custom port
npm run build                                # Production build
ng build --configuration development         # Dev build with sourcemaps
```

### Testing

#### Unit Tests (Jasmine/Karma)

```bash
npm test                                     # All unit tests
ng test --include='**/cart.service.spec.ts' # Single test file
ng test --browsers=ChromeHeadless            # Headless (CI)
```

#### E2E Tests (Playwright)

```bash
npm run test:e2e                             # Run all E2E tests (headless)
npm run test:e2e:smoke                       # Run smoke tests only (CI/CD)
npm run test:e2e:ui                          # Interactive UI mode
npm run test:e2e:headed                      # Watch tests run in browser
npm run test:e2e:report                      # View test results
```

**Current Test Status:**

- **Unit Tests (Jasmine/Karma):** 77/155 passing (50% pass rate)
  - ✅ Service tests fixed (CartService, SupabaseService, ProductService) - 33/33 passing
  - ⚠️ Component/DOM tests need fixing (44/122 failing) - template selector issues
  - Temporarily disabled in CI workflows until DOM tests are fixed
  - See `src/app/testing/test-helpers.ts` for MockConfigService usage

- **E2E Smoke Tests (Playwright):** 2/2 passing (100%)
  - Used in CI/CD for fast feedback (~9 seconds)
  - Tests: Login + Products page load

- **E2E Full Suite (Playwright):** 14/14 passing (100%)
  - Run locally or scheduled (not in CI/CD due to 20min runtime)
  - Tests: Authentication (5) + Shopping cart (9)

**Pre-requisitos para E2E:**

Antes de ejecutar tests E2E, crear usuario de testing en Supabase:

1. **Crear usuario estático:**
   - Email: `playwright-test@example.com`
   - Password: `PlaywrightTest123!`
   - Método: Dashboard → Authentication → Users → Add User

2. **Deshabilitar confirmación de email (solo testing):**
   - Ruta: Dashboard → Authentication → Email Auth
   - Acción: Disable "Enable email confirmations"

3. **Verificar RLS policies:**
   - Asegurar que el usuario puede leer/escribir en tablas necesarias
   - Usuario debe poder acceder a productos y carrito

**Estructura de tests:**

- `e2e/smoke.spec.ts` - **Smoke tests (CI/CD)** - 2 tests críticos para validación rápida
- `e2e/authentication.spec.ts` - TC001-TC005 (Login/Register/Logout) - 5 tests
- `e2e/shopping-cart.spec.ts` - TC006-TC015 (Productos/Carrito/Navegación) - 10 tests
- `e2e/pages/*.page.ts` - Page Object Models con selectores `data-testid`
- `e2e/config/test-users.ts` - Credenciales centralizadas
- `playwright.config.ts` - Configuración principal (todos los tests)
- `playwright.ci.config.ts` - Configuración CI/CD (solo smoke tests)

## File Naming

- Components: `product-list.ts` (NO `.component` suffix)
- Services: `cart.service.ts`
- Models: `product.model.ts`
- Templates/Styles: Match TS filename

## Import Order

```typescript
// 1. Angular core
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

// 2. Angular modules
import { RouterModule } from '@angular/router';

// 3. Material (alphabetically)
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

// 4. Third-party
import { SupabaseClient } from '@supabase/supabase-js';

// 5. Local services
import { CartService } from '../../services/cart.service';

// 6. Local models
import { Product } from '../../models/product.model';
```

## Component Structure

```typescript
@Component({
  selector: 'app-product-list',
  changeDetection: ChangeDetectionStrategy.OnPush, // ALWAYS required
  imports: [CommonModule, MatCardModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss', // styleUrl (singular)
})
export class ProductList {
  // 1. Inject services (NO constructor injection)
  private cartService = inject(CartService);
  private http = inject(HttpClient);

  // 2. Inputs/Outputs (modern API - NO @Input/@Output)
  productId = input.required<string>();
  onSelect = output<Product>();

  // 3. Local state (signals)
  products = signal<Product[]>([]);
  loading = signal(false);

  // 4. Derived state (computed)
  productCount = computed(() => this.products().length);
  isEmpty = computed(() => this.productCount() === 0);

  // 5. Effects (side effects only)
  constructor() {
    effect(() => console.log('Products:', this.productCount()));
  }

  // 6. Methods
  async loadProducts(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(this.http.get<Product[]>('/api/products'));
      this.products.set(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      this.loading.set(false);
    }
  }
}
```

## TypeScript Rules

- Strict mode enabled (avoid `any`, use `unknown`)
- Always specify return types for public methods
- Use `interface` over `type` for objects
- Use `private` for internal methods/services

## Signals Best Practices

### Service Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class CartService {
  // Private writable
  private _items = signal<CartItem[]>([]);

  // Public readonly
  readonly items = this._items.asReadonly();

  // Computed
  readonly total = computed(() => this._items().reduce((sum, i) => sum + i.price * i.quantity, 0));

  // Methods
  addItem(item: CartItem): void {
    this._items.update((items) => [...items, item]);
  }
}
```

### Signal Operations

- **DO:** `signal.set(newValue)` or `signal.update(fn)`
- **DON'T:** Use `mutate()` - not recommended

### RxJS Interop (when needed)

```typescript
import { toSignal, toObservable } from '@angular/core/rxjs-interop';

// Observable → Signal
user = toSignal(this.auth.user$, { initialValue: null });

// Signal → Observable
results = toSignal(
  toObservable(this.query).pipe(
    debounceTime(300),
    switchMap((q) => this.http.get(`/api/search?q=${q}`)),
  ),
);
```

## Templates (Angular 21 Syntax)

```html
<!-- Use @if/@for, NOT *ngIf/*ngFor -->
@if (loading()) {
<mat-spinner></mat-spinner>
} @else if (items().length === 0) {
<p>No hay productos</p>
} @else { @for (item of items(); track item.id) {
<mat-card [class.selected]="isSelected(item.id)">
  {{ item.name }} - {{ item.price | currency:'USD' }}
</mat-card>
} }

<!-- Signals: call as function -->
<p>Total: {{ total() }}</p>

<!-- Observables: async pipe -->
<p>User: {{ user$ | async }}</p>

<!-- Class/Style bindings (NO ngClass/ngStyle) -->
<div [class.active]="isActive()" [style.color]="color()"></div>
```

**Template Rules:**

- Always use `track` in `@for` loops
- NO arrow functions in templates
- NO globals like `new Date()` - pass from component

## Async Operations

```typescript
async addToCart(product: Product): Promise<void> {
  // Optimistic update
  this.items.update(items => [...items, { product, quantity: 1 }]);

  try {
    const { error } = await this.supabase.client
      .from('cart_items')
      .insert({ product_id: product.id, quantity: 1 });

    if (error) throw error;
  } catch (error) {
    // Rollback on error
    this.items.update(items =>
      items.filter(i => i.product.id !== product.id)
    );
    console.error('Error:', error);
  }
}
```

## Routing

```typescript
// Lazy loading
export const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.page').then((m) => m.AdminPage),
  },
];

// Functional guard
export const authGuard: CanActivateFn = () => {
  const supabase = inject(SupabaseService);
  return supabase.isAuthenticated() || inject(Router).createUrlTree(['/login']);
};
```

## Supabase Integration

- Use `SupabaseService` for all auth operations
- Implement optimistic updates with rollback
- Always check for `error` in Supabase responses
- RLS policies handle security (users only see own data)

### Critical: User Isolation in Database Operations

**ALWAYS filter by `user_id` when querying user-specific data.**

This project previously had a critical bug where cart operations didn't filter by `user_id`, causing users to see and modify other users' carts. This was fixed in commit `239f6ce`.

**Required Pattern for All User-Specific Queries:**

```typescript
// ❌ BAD: Queries ALL users' data
const { data } = await this.supabase.client.from('cart_items').select('*');

// ✅ GOOD: Filters by current user
const user = this.supabase.getCurrentUser();
if (!user) return;

const { data } = await this.supabase.client.from('cart_items').select('*').eq('user_id', user.id); // Always add this filter
```

**All operations requiring user isolation:**

- `.select()` - Add `.eq('user_id', user.id)`
- `.update()` - Add `.eq('user_id', user.id)`
- `.delete()` - Add `.eq('user_id', user.id)`
- `.insert()` - Include `user_id: user.id` in payload

**CartService Fixed Methods:**

- `loadCartFromDb()` - cart.service.ts:65
- `removeFromCart()` - cart.service.ts:162
- `updateQuantity()` - cart.service.ts:203

**Note:** RLS policies provide database-level security, but client-side filtering prevents bugs and improves UX by avoiding unnecessary network calls and permission errors.

## Testing

```typescript
describe('CartService', () => {
  let service: CartService;
  let supabaseMock: jasmine.SpyObj<SupabaseService>;

  beforeEach(() => {
    supabaseMock = jasmine.createSpyObj('SupabaseService', ['client']);
    TestBed.configureTestingModule({
      providers: [CartService, { provide: SupabaseService, useValue: supabaseMock }],
    });
    service = TestBed.inject(CartService);
  });

  it('should add item to cart', () => {
    const product: Product = { id: 1, name: 'Test', price: 10 };
    service.addItem(product);
    expect(service.items().length).toBe(1);
  });
});
```

Add `data-testid` attributes for E2E tests.

## E2E Testing Setup & Troubleshooting

### Test User Configuration

The E2E tests require two test users in Supabase:

**User 1 (Primary):**

- Email: `playwright-test@example.com`
- Password: `PlaywrightTest123!`
- User ID: `80765d0c-7c28-4bcc-9bc7-9e92f3d3aa41`

**User 2 (Multi-user tests):**

- Email: `playwright-test2@example.com`
- Password: `PlaywrightTest123!`
- User ID: `200336e2-7d86-442d-b7b8-88c933540f23`

### Creating Test Users

1. **Via Supabase Dashboard:**

   ```
   Dashboard → Authentication → Users → Add User
   - Enter email and password
   - ✅ Auto Confirm User (important!)
   - Click "Create User"
   ```

2. **Disable Email Confirmation (required for testing):**

   ```
   Dashboard → Authentication → Email Auth
   - Toggle OFF: "Enable email confirmations"
   ```

3. **Verify RLS Policies:**

   ```sql
   -- Check that users can access their own cart_items
   -- RLS policy should include: user_id = auth.uid()
   ```

4. **Verify Test Users:**
   ```bash
   npx ts-node e2e/setup-test-users.ts
   ```

### Common E2E Test Issues

#### Issue: Tests fail with "User not found" or login errors

**Solution:**

```bash
# Verify users exist
npx ts-node e2e/setup-test-users.ts

# Check Supabase configuration
# Ensure .env or environment variables match:
SUPABASE_URL=https://owewtzddyykyraxkkorx.supabase.co
SUPABASE_KEY=<YOUR_SUPABASE_PUBLISHABLE_KEY>
```

#### Issue: Cart items from previous test appear

**Cause:** Database not cleared between tests

**Solution:**

- Tests use `clearAllCartItems()` helper in `beforeEach`
- Helper is in `e2e/helpers/database.helper.ts`
- Directly deletes from `cart_items` table via Supabase

```typescript
// Pattern used in tests
beforeEach(async ({ page }) => {
  await clearAllCartItems(TEST_USER.email, TEST_USER.password);
  await page.evaluate(() => {
    localStorage.clear();
  });
  await loginPage.login(TEST_USER.email, TEST_USER.password);
  await page.waitForTimeout(2000); // Wait for cart load
});
```

#### Issue: Cart count is wrong (e.g., 6 items instead of 1)

**Cause:** Selector matching too many elements

**Solution:** Use specific selectors in Page Objects

```typescript
// ❌ BAD: Matches all child elements too
this.cartItems = page.locator('[data-testid^="cart-item-"]');

// ✅ GOOD: Only matches the list item container
this.cartItems = page.locator('mat-list-item[data-testid^="cart-item-"]');
```

#### Issue: Tests timeout waiting for cart operations

**Cause:** CartService uses optimistic updates + async DB sync

**Solution:** Add wait times after cart operations

```typescript
await productList.addProductToCart(1);
await page.waitForTimeout(2000); // Wait for Supabase sync

// Better approach (use when possible):
await page.waitForResponse(
  (resp) => resp.url().includes('/rest/v1/cart_items') && resp.status() === 201,
);
```

#### Issue: NavigatorLockAcquireTimeoutError warnings

**Cause:** Browser storage locking during rapid operations

**Impact:** Warning only, tests still pass

**Solution:** If tests fail:

```typescript
// Add delays between rapid operations
await page.waitForTimeout(500);

// Clear storage before critical operations
await page.evaluate(() => {
  localStorage.clear();
});
```

#### Issue: Multi-user tests show wrong user's cart

**Cause:** Cart isolation bug (should be fixed in v239f6ce)

**Verify Fix:**

```typescript
// Check cart.service.ts has user_id filters:
// Line 65: .eq('user_id', user.id)  // loadCartFromDb
// Line 162: .eq('user_id', user.id) // removeFromCart
// Line 203: .eq('user_id', user.id) // updateQuantity
```

#### Issue: RLS policy errors in console

**Cause:** Database policies don't allow user access

**Solution:**

```sql
-- cart_items table should have policy like:
CREATE POLICY "Users can manage own cart"
ON cart_items
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### E2E Test Timing Guidelines

- **After login:** `await page.waitForTimeout(2000)` - Wait for cart load from DB
- **After add to cart:** `await page.waitForTimeout(2000)` - Wait for Supabase insert
- **After update quantity:** `await page.waitForTimeout(1500)` - Wait for Supabase update
- **After remove item:** `await page.waitForTimeout(1500)` - Wait for Supabase delete
- **After navigation:** `await page.waitForTimeout(500)` - Wait for route change

### Running Tests Strategically

```bash
# Run all tests (headless)
npm run test:e2e

# Debug single test file
npm run test:e2e:ui -- authentication.spec.ts

# Watch specific test
npm run test:e2e:headed -- --grep "TC008"

# See last test results with screenshots
npm run test:e2e:report
```

### Test Files Overview

- `authentication.spec.ts` - TC001-TC005 (Login/Register/Logout) - Independent tests
- `shopping-cart.spec.ts` - TC006-TC015 (Cart operations) - ⚠️ Must run in serial mode
- `cart-isolation.spec.ts` - Multi-user cart isolation - ⚠️ Requires both test users
- `pages/*.page.ts` - Page Object Models with `data-testid` selectors
- `helpers/database.helper.ts` - Direct Supabase manipulation for test setup/cleanup

## Project-Specific Rules

1. **No `Component` suffix** - Use `ProductList`, not `ProductListComponent`
2. **Always OnPush** - `changeDetection: ChangeDetectionStrategy.OnPush`
3. **Spanish UI** - All user-facing text in Spanish
4. **Material Design only** - No custom UI without Material equivalent
5. **Modern APIs:**
   - `input()`/`output()` instead of `@Input()`/`@Output()`
   - `inject()` instead of constructor injection
   - `@if`/`@for` instead of `*ngIf`/`*ngFor`
6. **Signals > Observables** - Use Signals for state, Observables for streams
7. **Accessibility** - Must pass AXE checks and meet WCAG AA

## Git Workflow

### Local Development

```bash
# Before commit
npm run lint:fix                # Auto-fix linting issues
npm run format                  # Format code
npm test                        # Run unit tests
npm run build:prod              # Test production build
```

### Commit Strategy

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: add product filters"
git commit -m "fix: cart not persisting after logout"
git commit -m "docs: update README with CI/CD info"
git commit -m "test: add E2E test for checkout flow"
```

### Branching Strategy

```
main         Production (protected)
  │
develop      Staging (protected)
  │
feature/*    Feature branches
fix/*        Bug fixes
```

**Workflow:**

1. Create feature branch from `develop`
2. Make changes and commit
3. Open PR to `develop` → CI runs
4. Merge to `develop` → Deploy to staging
5. Create PR from `develop` to `main`
6. Merge to `main` → Deploy to production

**Repository:** https://github.com/claudiojara/angular-shopping-cart

## CI/CD Architecture

### Overview

This project uses **GitHub Actions** for CI/CD with automatic deployment to **Azure Static Web Apps**.

### Environments

⚠️ **IMPORTANTE:** Staging requiere un segundo recurso de Azure Static Web Apps. Ver `docs/AZURE_SETUP.md` para configuración.

| Environment    | Branch    | URL                                                    | Deployment              | Token Secret                              |
| -------------- | --------- | ------------------------------------------------------ | ----------------------- | ----------------------------------------- |
| **Production** | `main`    | https://witty-bush-0d65a3d0f.2.azurestaticapps.net     | Auto on push to main    | `AZURE_STATIC_WEB_APPS_API_TOKEN`         |
| **Staging**    | `develop` | https://agreeable-sand-011792d0f.6.azurestaticapps.net | Auto on push to develop | `AZURE_STATIC_WEB_APPS_API_TOKEN_STAGING` |

**Notas:**

- Azure Static Web Apps **NO crea automáticamente** URLs con sufijo `-develop` o `-staging`
- Necesitas crear dos recursos separados en Azure (ver documentación en `docs/AZURE_SETUP.md`)
- Cada recurso tiene su propio deployment token que debe agregarse como GitHub Secret

### Workflows

#### 1. CI Workflow (`ci.yml`)

**Trigger:** Pull requests to `develop` or `main`, push to `develop`

**Steps:**

1. Setup Node.js 22 (from `.nvmrc`)
2. Install dependencies (`npm ci`)
3. Prettier check (`npm run format:check`)
4. ESLint (`npm run lint` - warnings allowed)
5. Unit tests with coverage (`npm run test:ci`)
6. Upload coverage to Codecov
7. Production build (`npm run build:prod`)
8. Bundle size analysis (`npm run analyze:size`)

**Duration:** ~3-5 minutes

#### 2. Deploy to Staging (`deploy-staging.yml`)

**Trigger:** Push to `develop`

**Steps:**

1. All CI checks (lint, tests, build)
2. Generate runtime config (`scripts/generate-config.sh`)
   - Replaces `__SUPABASE_URL__` → `${{ secrets.SUPABASE_URL }}`
   - Replaces `__SUPABASE_KEY__` → `${{ secrets.SUPABASE_KEY }}`
3. Deploy to Azure Static Web Apps (preview environment)
4. Wait for deployment (`npx wait-on`)
5. Install Playwright browsers
6. Run E2E tests against staging URL
7. Upload Playwright report as artifact

**Duration:** ~5-8 minutes

#### 3. Deploy to Production (`deploy-production.yml`)

**Trigger:** Push to `main`

**Steps:**

1. Prettier check
2. ESLint in **strict mode** (`--max-warnings=0`)
3. Unit tests with coverage (fail if coverage drops)
4. Build production
5. Bundle size analysis
6. Generate runtime config
7. Deploy to Azure Static Web Apps (production)
8. Wait for deployment
9. Run E2E tests against production URL
10. Create GitHub Release (tag: `v{run_number}`)
11. Upload Playwright report

**Duration:** ~6-10 minutes

### Quality Gates

| Quality Gate      | Staging                 | Production              | Threshold                      |
| ----------------- | ----------------------- | ----------------------- | ------------------------------ |
| **Prettier**      | ✅ Required             | ✅ Required             | All files formatted            |
| **ESLint**        | ⚠️ Warnings OK          | ❌ Strict               | 0 errors (staging: 0 warnings) |
| **Unit Tests**    | ✅ Required             | ✅ Required             | All passing                    |
| **Code Coverage** | ⚠️ Target 60%           | ✅ Required 60%         | Global: 60%, Patch: 50%        |
| **Build**         | ✅ Required             | ✅ Required             | No errors                      |
| **Bundle Size**   | ⚠️ Warn >500KB, ❌ >1MB | ⚠️ Warn >500KB, ❌ >1MB | Per file                       |
| **E2E Tests**     | ✅ 14/14                | ✅ 14/14                | All passing                    |

### Configuration System

#### Runtime Configuration Strategy

The project uses **runtime configuration** instead of build-time environment variables.

**Why?**

- ✅ Single build works for multiple environments
- ✅ Can change config without rebuild
- ✅ More secure (secrets not in bundle)
- ✅ Compatible with Azure Static Web Apps

**How it works:**

1. **Development (Local):**
   - File: `src/assets/config.local.json` (gitignored)
   - Contains real Supabase credentials
   - Loaded first by ConfigService

2. **CI/CD (Staging & Production):**
   - File: `src/assets/config.json` (committed with placeholders)
   - Placeholders: `__SUPABASE_URL__`, `__SUPABASE_KEY__`
   - Script `generate-config.sh` replaces placeholders during deployment

**ConfigService loading priority:**

```typescript
// 1. Try to load config.local.json (development)
// 2. If fails, load config.json (production/staging)
```

**Example config.json:**

```json
{
  "production": false,
  "supabase": {
    "url": "__SUPABASE_URL__",
    "anonKey": "__SUPABASE_KEY__"
  },
  "environment": "development"
}
```

#### GitHub Secrets

Required secrets configured in repository settings:

```bash
# Azure Deployment Tokens
AZURE_STATIC_WEB_APPS_API_TOKEN          # Producción (recurso ya existente)
AZURE_STATIC_WEB_APPS_API_TOKEN_STAGING  # Staging (debe crearse - ver docs/AZURE_SETUP.md)

# Supabase Configuration
SUPABASE_URL                              # https://xxxxx.supabase.co
SUPABASE_KEY                              # eyJhbGciOiJIUzI1NiI...

# Playwright Test Users
PLAYWRIGHT_TEST_EMAIL                     # playwright-test@example.com
PLAYWRIGHT_TEST_PASSWORD                  # PlaywrightTest123!
PLAYWRIGHT_TEST2_EMAIL                    # playwright-test2@example.com
PLAYWRIGHT_TEST2_PASSWORD                 # PlaywrightTest123!

# Code Coverage
CODECOV_TOKEN                             # Codecov upload token
```

### Deployment Process

#### When PR is opened to `develop`:

```
Developer pushes to feature branch
    ↓
Opens PR to develop
    ↓
CI Workflow runs (lint, tests, build)
    ↓
Review & approval
    ↓
Merge to develop
```

#### When merged to `develop`:

```
Merge to develop
    ↓
Deploy to Staging Workflow runs
    ↓
Build & deploy to Azure (preview environment)
    ↓
E2E tests run against staging URL
    ↓
Playwright report uploaded
    ↓
Staging live: https://...develop.2.azurestaticapps.net
```

#### When merged to `main`:

```
Merge to main (from develop PR)
    ↓
Deploy to Production Workflow runs
    ↓
Strict quality gates (ESLint --max-warnings=0)
    ↓
Build & deploy to Azure (production)
    ↓
E2E tests run against production URL
    ↓
GitHub Release created (v{run_number})
    ↓
Production live: https://witty-bush-0d65a3d0f.2.azurestaticapps.net
```

### Scripts

#### `scripts/generate-config.sh`

Replaces placeholders in `dist/shopping-cart/browser/assets/config.json` with environment variables.

**Usage in CI:**

```bash
SUPABASE_URL=${{ secrets.SUPABASE_URL }} \
SUPABASE_KEY=${{ secrets.SUPABASE_KEY }} \
bash scripts/generate-config.sh
```

#### `scripts/setup-local.sh`

Sets up local development environment:

- Installs dependencies
- Creates `config.local.json` from template
- Installs Playwright browsers

**Usage:**

```bash
npm run setup
```

#### `scripts/check-bundle-size.js`

Analyzes bundle sizes and fails if thresholds exceeded.

**Thresholds:**

- Warning: >500KB per file
- Error: >1MB per file

**Usage:**

```bash
npm run analyze:size
```

### Monitoring & Debugging

#### GitHub Actions

- **View runs:** https://github.com/claudiojara/angular-shopping-cart/actions
- **Logs:** Available for each workflow step
- **Artifacts:** Playwright reports, coverage reports

#### Codecov

- **Dashboard:** https://codecov.io/gh/claudiojara/angular-shopping-cart
- **PR Comments:** Coverage diff on each PR
- **Graphs:** Coverage trends over time

#### Azure Static Web Apps

- **Portal:** https://portal.azure.com
- **Logs:** Available in Azure portal
- **Preview environments:** Auto-created for `develop` branch

#### Bundle Analysis

```bash
# Local analysis
npm run build:prod
npm run analyze:size

# View detailed stats
npx webpack-bundle-analyzer dist/shopping-cart/browser/stats.json
```

### Troubleshooting CI/CD

#### CI fails with "ChromeHeadlessCI not found"

**Solution:** Already configured in `karma.conf.js`. Ensure `npm run test:ci` uses `--browsers=ChromeHeadlessCI`.

#### E2E fails in CI but passes locally

**Causes:**

- Test users not in Supabase
- Email confirmation enabled (should be disabled)
- Network timeout (increase wait times)

**Solution:** Verify test users exist and email confirmation is disabled.

#### Deployment succeeds but app doesn't load config

**Causes:**

- `generate-config.sh` didn't run
- GitHub Secrets not set
- Config file not in build output

**Debug:**

```bash
# Check if config.json exists in build
ls -la dist/shopping-cart/browser/assets/config.json

# Check config content
cat dist/shopping-cart/browser/assets/config.json
```

#### Bundle size exceeds limit

**Solution:**

1. Review dependencies: `npm run analyze:size`
2. Remove unused Material modules
3. Implement lazy loading for routes
4. Consider code splitting

### Best Practices for Agents

When working on this project:

1. **Always run quality checks before committing:**

   ```bash
   npm run lint:fix
   npm run format
   npm test
   npm run build:prod
   ```

2. **Test E2E locally before opening PR** (if changes affect UI):

   ```bash
   npm run test:e2e:headed
   ```

3. **Check bundle size impact** for new dependencies:

   ```bash
   npm run build:prod
   npm run analyze:size
   ```

4. **Follow conventional commits** for automatic release notes

5. **Update documentation** if adding new features or changing architecture

6. **Verify CI passes** before requesting review on PR

7. **Test in staging** before merging to main:
   - Merge to develop first
   - Wait for staging deployment
   - Manually test critical flows
   - Then create PR to main
