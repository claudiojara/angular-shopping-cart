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
```bash
npm test                                     # All tests
ng test --include='**/cart.service.spec.ts' # Single test file
ng test --browsers=ChromeHeadless            # Headless (CI)
```

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
