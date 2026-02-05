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
npm run test:e2e                             # Run E2E tests (headless)
npm run test:e2e:ui                          # Interactive UI mode
npm run test:e2e:headed                      # Watch tests run in browser
npm run test:e2e:report                      # View test results
```

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
- `e2e/authentication.spec.ts` - TC001-TC005 (Login/Register/Logout)
- `e2e/shopping-cart.spec.ts` - TC006-TC015 (Productos/Carrito/Navegación)
- `e2e/pages/*.page.ts` - Page Object Models con selectores `data-testid`
- `e2e/config/test-credentials.ts` - Credenciales centralizadas

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
  changeDetection: ChangeDetectionStrategy.OnPush,  // ALWAYS required
  imports: [CommonModule, MatCardModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss'  // styleUrl (singular)
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
  readonly total = computed(() => 
    this._items().reduce((sum, i) => sum + i.price * i.quantity, 0)
  );
  
  // Methods
  addItem(item: CartItem): void {
    this._items.update(items => [...items, item]);
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
    switchMap(q => this.http.get(`/api/search?q=${q}`))
  )
);
```

## Templates (Angular 21 Syntax)

```html
<!-- Use @if/@for, NOT *ngIf/*ngFor -->
@if (loading()) {
  <mat-spinner></mat-spinner>
} @else if (items().length === 0) {
  <p>No hay productos</p>
} @else {
  @for (item of items(); track item.id) {
    <mat-card [class.selected]="isSelected(item.id)">
      {{ item.name }} - {{ item.price | currency:'USD' }}
    </mat-card>
  }
}

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
    loadComponent: () => import('./admin/admin.page').then(m => m.AdminPage)
  }
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
const { data } = await this.supabase.client
  .from('cart_items')
  .select('*');

// ✅ GOOD: Filters by current user
const user = this.supabase.getCurrentUser();
if (!user) return;

const { data } = await this.supabase.client
  .from('cart_items')
  .select('*')
  .eq('user_id', user.id);  // Always add this filter
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
      providers: [
        CartService,
        { provide: SupabaseService, useValue: supabaseMock }
      ]
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
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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
  await page.evaluate(() => { localStorage.clear(); });
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
await page.waitForResponse(resp => 
  resp.url().includes('/rest/v1/cart_items') && resp.status() === 201
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
await page.evaluate(() => { localStorage.clear(); });
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

```bash
npm run build           # Test build before commit
git add .
git commit -m "feat: description"
git push origin main
```

**Repository:** https://github.com/claudiojara/angular-shopping-cart
