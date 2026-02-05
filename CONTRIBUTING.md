# Guía de Contribución

¡Gracias por tu interés en contribuir al proyecto Shopping Cart! Esta guía te ayudará a empezar.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Cómo Puedo Contribuir?](#cómo-puedo-contribuir)
- [Configuración del Entorno](#configuración-del-entorno)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Estándares de Código](#estándares-de-código)
- [Convenciones de Commits](#convenciones-de-commits)
- [Pull Requests](#pull-requests)
- [Reportar Bugs](#reportar-bugs)
- [Solicitar Features](#solicitar-features)

## 📜 Código de Conducta

Este proyecto se adhiere a un código de conducta. Al participar, se espera que mantengas este código. Por favor reporta comportamientos inaceptables.

### Nuestros Estándares

**Comportamientos que contribuyen a un ambiente positivo:**
- ✅ Usar lenguaje acogedor e inclusivo
- ✅ Ser respetuoso con diferentes puntos de vista
- ✅ Aceptar críticas constructivas con gracia
- ✅ Enfocarse en lo mejor para la comunidad
- ✅ Mostrar empatía hacia otros miembros

**Comportamientos inaceptables:**
- ❌ Lenguaje o imágenes sexualizadas
- ❌ Trolling, comentarios insultantes/despectivos
- ❌ Acoso público o privado
- ❌ Publicar información privada de otros
- ❌ Conducta no profesional

## 🤝 Cómo Puedo Contribuir?

### Reportar Bugs

Antes de crear un bug report:
1. **Verifica** que no sea un problema de configuración local
2. **Busca** en los issues existentes
3. **Recoge** información sobre el bug

**Template de Bug Report:**
```markdown
**Descripción del Bug**
Descripción clara y concisa del bug.

**Pasos para Reproducir**
1. Ir a '...'
2. Hacer click en '....'
3. Scroll hasta '....'
4. Ver error

**Comportamiento Esperado**
Descripción de lo que esperabas que pasara.

**Screenshots**
Si aplica, agrega screenshots.

**Entorno:**
- OS: [e.g. macOS 13.0]
- Browser: [e.g. Chrome 120]
- Node version: [e.g. 22.0.0]
- Angular version: [e.g. 20.3.0]

**Información Adicional**
Contexto adicional sobre el problema.
```

### Solicitar Features

**Template de Feature Request:**
```markdown
**¿Tu feature request está relacionado a un problema?**
Descripción clara del problema. Ej: Siempre me frustra cuando [...]

**Describe la solución que te gustaría**
Descripción clara de lo que quieres que pase.

**Describe alternativas que has considerado**
Descripción de soluciones o features alternativas.

**Contexto adicional**
Cualquier contexto o screenshots sobre el feature request.
```

### Contribuir Código

Las contribuciones de código son bienvenidas! Áreas donde puedes ayudar:
- 🐛 Corregir bugs reportados
- ✨ Implementar features solicitados
- 📝 Mejorar documentación
- ✅ Escribir tests
- 🎨 Mejorar UI/UX
- ⚡ Optimizar performance

## 🔧 Configuración del Entorno

### Requisitos

- **Node.js** 22+ (ver `.nvmrc`)
- **npm** 9+
- **Git** 2.30+
- **Angular CLI** 20.3+

### Setup Inicial

```bash
# 1. Fork el repositorio en GitHub

# 2. Clonar tu fork
git clone https://github.com/TU-USUARIO/angular-shopping-cart.git
cd angular-shopping-cart

# 3. Agregar remote upstream
git remote add upstream https://github.com/claudiojara/angular-shopping-cart.git

# 4. Usar Node 22 (con nvm)
nvm use

# 5. Instalar dependencias
npm install

# 6. Configurar Supabase local
cp src/assets/config.local.json.template src/assets/config.local.json
# Editar config.local.json con tus credenciales

# 7. Instalar Playwright (para E2E)
npx playwright install chromium

# 8. Verificar que todo funciona
npm start
npm test
npm run lint
```

### Credenciales de Supabase

Para desarrollo local, necesitas una cuenta de Supabase:

1. Crear cuenta en [supabase.com](https://supabase.com)
2. Crear un nuevo proyecto
3. Obtener URL y anon key del proyecto
4. Agregar al `config.local.json`

**Estructura de la base de datos:**

```sql
-- Tabla products
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT
);

-- Tabla cart_items
CREATE TABLE cart_items (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  product_id BIGINT REFERENCES products NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
CREATE POLICY "Users can manage own cart"
ON cart_items
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
```

## 🔄 Flujo de Trabajo

### Estrategia de Branching

```
main         ────●────────●────────●──────> (producción)
                 │        │        │
develop      ●───┴────●───┴────●───┴──────> (staging)
                      │        │
feature/xxx           └────●───┘
```

**Ramas principales:**
- `main` - Código en producción (protegida)
- `develop` - Código en desarrollo (protegida)

**Ramas de trabajo:**
- `feature/nombre-feature` - Nuevas funcionalidades
- `fix/nombre-bug` - Correcciones de bugs
- `docs/descripcion` - Cambios en documentación
- `refactor/descripcion` - Refactorizaciones
- `test/descripcion` - Añadir o modificar tests

### Proceso de Contribución

#### 1. Crear una Rama

```bash
# Asegurarte de estar en develop actualizado
git checkout develop
git pull upstream develop

# Crear rama de trabajo
git checkout -b feature/nombre-descriptivo

# O para un bug fix
git checkout -b fix/descripcion-del-bug
```

#### 2. Desarrollar

```bash
# Hacer cambios en el código
# ...

# Verificar cambios
npm run lint
npm run format:check
npm test

# Si hay errores de formato, auto-fix
npm run format
npm run lint:fix
```

#### 3. Commits

Seguir [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: add product filters by category"

# O
git commit -m "fix: cart not persisting after logout"
```

**Tipos de commits:**
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Formateo, espacios, etc (sin cambios de lógica)
- `refactor:` Refactorización (sin cambios de funcionalidad)
- `perf:` Mejoras de performance
- `test:` Añadir o modificar tests
- `chore:` Mantenimiento (deps, config, etc)

**Breaking changes:**
```bash
git commit -m "feat!: change cart API to use signals"
```

#### 4. Sincronizar con Upstream

```bash
# Antes de push, sincronizar con develop
git pull upstream develop --rebase

# Resolver conflictos si los hay
# ...

# Continuar rebase
git rebase --continue
```

#### 5. Push y Pull Request

```bash
# Push a tu fork
git push origin feature/nombre-descriptivo

# Ir a GitHub y crear Pull Request a develop
```

## 📏 Estándares de Código

### Guías de Angular

Este proyecto sigue las convenciones de `AGENTS.md`. **Lectura obligatoria** antes de contribuir.

**Puntos clave:**
- ✅ Standalone components
- ✅ OnPush change detection (siempre)
- ✅ Signals para state management
- ✅ `input()` / `output()` (NO `@Input` / `@Output`)
- ✅ `inject()` (NO constructor injection)
- ✅ `@if` / `@for` (NO `*ngIf` / `*ngFor`)
- ✅ Templates sin lógica compleja
- ✅ Spanish para UI, English para código

### File Naming

```
product-list.ts          ✅ Component (NO .component suffix)
cart.service.ts          ✅ Service
product.model.ts         ✅ Model
auth.guard.ts            ✅ Guard
cart.service.spec.ts     ✅ Test
product-list.html        ✅ Template
product-list.scss        ✅ Styles
```

### Import Order

```typescript
// 1. Angular core
import { Component, signal, computed } from '@angular/core';

// 2. Angular modules
import { RouterModule } from '@angular/router';

// 3. Material (alfabético)
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

// 4. Third-party
import { SupabaseClient } from '@supabase/supabase-js';

// 5. Local services
import { CartService } from '../../services/cart.service';

// 6. Local models
import { Product } from '../../models/product.model';
```

### Component Structure

```typescript
@Component({
  selector: 'app-product-list',
  changeDetection: ChangeDetectionStrategy.OnPush,  // ✅ SIEMPRE
  imports: [CommonModule, MatCardModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss'  // styleUrl (singular)
})
export class ProductList {
  // 1. Inject services (NO constructor)
  private cartService = inject(CartService);
  
  // 2. Inputs/Outputs
  productId = input.required<string>();
  onSelect = output<Product>();
  
  // 3. Local state (signals)
  products = signal<Product[]>([]);
  loading = signal(false);
  
  // 4. Derived state (computed)
  total = computed(() => this.products().length);
  
  // 5. Effects
  constructor() {
    effect(() => console.log('Count:', this.total()));
  }
  
  // 6. Methods
  async loadProducts(): Promise<void> {
    // ...
  }
}
```

### Template Best Practices

```html
<!-- ✅ CORRECTO: Usar @if/@for -->
@if (loading()) {
  <mat-spinner />
} @else {
  @for (item of items(); track item.id) {
    <mat-card>{{ item.name }}</mat-card>
  }
}

<!-- ❌ INCORRECTO: Usar *ngIf/*ngFor -->
<div *ngIf="loading">...</div>

<!-- ✅ CORRECTO: Signals como función -->
<p>Total: {{ total() }}</p>

<!-- ❌ INCORRECTO: Sin () -->
<p>Total: {{ total }}</p>

<!-- ✅ CORRECTO: Track en @for -->
@for (item of items(); track item.id) { }

<!-- ❌ INCORRECTO: Sin track -->
@for (item of items()) { }
```

### Service Patterns

```typescript
@Injectable({ providedIn: 'root' })
export class CartService {
  // ✅ Private writable signal
  private _items = signal<CartItem[]>([]);
  
  // ✅ Public readonly accessor
  readonly items = this._items.asReadonly();
  
  // ✅ Computed values
  readonly total = computed(() => 
    this._items().reduce((sum, i) => sum + i.price, 0)
  );
  
  // ✅ Methods modify private signals
  addItem(item: CartItem): void {
    this._items.update(items => [...items, item]);
  }
}
```

### Testing Requirements

#### Unit Tests

**Obligatorios para:**
- ✅ Services (100% de métodos públicos)
- ✅ Componentes con lógica compleja
- ✅ Guards, interceptors, pipes

**Template:**
```typescript
describe('CartService', () => {
  let service: CartService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CartService]
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

#### E2E Tests

Necesarios para **flujos críticos**:
- ✅ Autenticación (login/register/logout)
- ✅ Carrito (add/update/remove)
- ✅ Checkout completo

**Usar data-testid:**
```html
<!-- ✅ Agregar para elementos interactivos -->
<button data-testid="add-to-cart-btn">Agregar</button>
<mat-list-item data-testid="cart-item-{{ item.id }}">
```

### Code Coverage

**Requisitos mínimos:**
- Global: **60%**
- Por archivo crítico: **80%**
- Services: **90%**

```bash
# Verificar coverage
npm run test:ci
open coverage/shopping-cart/index.html
```

### ESLint & Prettier

**Antes de commit:**
```bash
# Auto-fix
npm run format
npm run lint:fix

# Verificar
npm run format:check
npm run lint
```

**Reglas importantes:**
- ⚠️ `no-console` - Solo `console.warn` y `console.error` permitidos
- ⚠️ `@typescript-eslint/no-explicit-any` - Evitar `any`, usar `unknown`
- ✅ `@typescript-eslint/no-unused-vars` - Variables con `_` prefix si no se usan
- ✅ `prefer-const` - Usar `const` siempre que sea posible

## 🔍 Pull Request Process

### Checklist del PR

Antes de abrir un PR, asegúrate de:

- [ ] ✅ Código sigue las convenciones de `AGENTS.md`
- [ ] ✅ Todos los tests pasan (`npm test`)
- [ ] ✅ E2E tests pasan si aplica (`npm run test:e2e`)
- [ ] ✅ ESLint sin errores (`npm run lint`)
- [ ] ✅ Código formateado (`npm run format`)
- [ ] ✅ Build exitoso (`npm run build:prod`)
- [ ] ✅ Bundle size aceptable (`npm run analyze:size`)
- [ ] ✅ Commits siguen conventional commits
- [ ] ✅ Branch actualizado con `develop`
- [ ] ✅ Tests añadidos para nueva funcionalidad
- [ ] ✅ Documentación actualizada si aplica

### Template del PR

```markdown
## Descripción
Descripción clara de los cambios realizados.

## Tipo de Cambio
- [ ] 🐛 Bug fix (cambio que corrige un issue)
- [ ] ✨ Nueva feature (cambio que añade funcionalidad)
- [ ] 💥 Breaking change (fix o feature que rompe compatibilidad)
- [ ] 📝 Cambio en documentación

## ¿Cómo ha sido testeado?
Describe los tests realizados.

- [ ] Unit tests
- [ ] E2E tests
- [ ] Tests manuales

**Escenarios testeados:**
- Escenario 1
- Escenario 2

## Screenshots (si aplica)
Agregar screenshots del antes/después.

## Checklist
- [ ] Mi código sigue las guías de estilo
- [ ] He realizado self-review
- [ ] He comentado código complejo
- [ ] He actualizado la documentación
- [ ] Mis cambios no generan warnings
- [ ] He añadido tests que prueban mis cambios
- [ ] Tests nuevos y existentes pasan localmente
- [ ] Cambios dependientes han sido merged

## Issues Relacionados
Fixes #123
Relates to #456
```

### Proceso de Review

1. **Autor abre PR** a `develop`
2. **CI corre automáticamente** (lint, tests, build)
3. **Reviewer revisa código**
   - Verifica que siga convenciones
   - Prueba funcionalidad localmente
   - Revisa tests
4. **Feedback y cambios**
   - Autor hace cambios solicitados
   - Push updates al mismo PR
5. **Approval**
   - Al menos 1 approval requerido
   - CI debe estar verde ✅
6. **Merge**
   - Squash and merge (preferido)
   - Mensaje de merge sigue conventional commits

### Merge Strategies

**Squash and merge** (preferido):
- Todos los commits se combinan en uno
- Mantiene historia limpia
- Mensaje final sigue conventional commits

**Rebase and merge**:
- Mantiene commits individuales
- Solo si commits son atómicos y bien escritos

**Merge commit** (evitar):
- Crea commit de merge adicional
- Hace historia más compleja

## 🎨 UI/UX Guidelines

### Material Design

- ✅ Usar componentes de Angular Material
- ✅ Seguir Material Design guidelines
- ✅ Mantener consistencia visual

### Accesibilidad

- ✅ ARIA labels en elementos interactivos
- ✅ data-testid para testing
- ✅ Keyboard navigation
- ✅ Color contrast ratio WCAG AA
- ✅ Focus indicators visibles

### Responsive Design

- ✅ Mobile-first approach
- ✅ Breakpoints: 600px, 960px, 1280px
- ✅ Probar en móvil, tablet, desktop

### Spanish UI

- ✅ Todo texto visible al usuario en español
- ✅ Mensajes de error descriptivos
- ✅ Tooltips informativos
- ✅ Código y variables en inglés

## 🚀 Deployment

### Staging (develop)

```bash
git checkout develop
git pull upstream develop
git merge feature/mi-feature
git push upstream develop
```

**Resultado:**
- ✅ CI corre (lint, tests, build)
- ✅ Deploy automático a staging
- ✅ E2E tests contra staging
- 🌐 https://witty-bush-0d65a3d0f-develop.2.azurestaticapps.net

### Production (main)

**Solo mantainers pueden hacer merge a main.**

```bash
# Crear PR de develop -> main
# Esperar approval y CI verde
# Merge con "Squash and merge"
```

**Resultado:**
- ✅ CI corre en modo strict
- ✅ Deploy automático a producción
- ✅ E2E tests contra producción
- ✅ GitHub Release creado
- 🌐 https://witty-bush-0d65a3d0f.2.azurestaticapps.net

## ❓ Preguntas Frecuentes

### ¿Cómo empiezo a contribuir?

1. Lee esta guía completa
2. Lee `AGENTS.md` para convenciones
3. Busca issues con label `good first issue`
4. Comenta en el issue que quieres trabajarlo
5. Sigue el flujo de trabajo descrito arriba

### ¿Puedo trabajar en un issue sin asignación?

Sí, pero primero comenta en el issue indicando que trabajarás en él para evitar duplicación de esfuerzo.

### ¿Qué hago si mi PR tiene conflictos?

```bash
# Actualizar con develop
git checkout feature/mi-feature
git pull upstream develop --rebase

# Resolver conflictos
# Editar archivos en conflicto
git add .
git rebase --continue

# Force push (solo en tu branch)
git push origin feature/mi-feature --force
```

### ¿Cómo ejecuto solo algunos tests?

```bash
# Test específico
ng test --include='**/cart.service.spec.ts'

# E2E específico
npx playwright test authentication.spec.ts

# Single test case
npx playwright test --grep "TC008"
```

### ¿Mi PR será aceptado?

Los PRs tienen más probabilidad de ser aceptados si:
- ✅ Siguen todas las convenciones
- ✅ Incluyen tests
- ✅ Tienen descripción clara
- ✅ Resuelven un issue existente
- ✅ CI está verde
- ✅ Code review positivo

## 📞 Contacto

- **Issues:** https://github.com/claudiojara/angular-shopping-cart/issues
- **Discussions:** https://github.com/claudiojara/angular-shopping-cart/discussions
- **Email:** contacto@claudiojara.dev

## 🙏 Agradecimientos

Gracias por contribuir al proyecto! Cada contribución, grande o pequeña, es valiosa.

---

**Happy coding! 🚀**
