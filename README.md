# Shopping Cart - Angular Application

Una aplicación moderna de carrito de compras construida con Angular 20.3 y Angular Material.

## 🚀 Características

- ✅ Catálogo de productos con imágenes y detalles
- ✅ Gestión de carrito de compras en tiempo real
- ✅ Control de cantidades (+/-)
- ✅ Cálculo automático de totales
- ✅ Proceso de checkout
- ✅ Diseño responsive con Material Design
- ✅ State management con Angular Signals
- ✅ Tooltips para mejor UX
- ✅ Accesibilidad (ARIA labels, data-testid)

## 🛠️ Tecnologías

- **Angular** 20.3
- **Angular Material** 20.2.14
- **TypeScript** 5.9.2
- **RxJS** 7.8.0
- **SCSS** para estilos
- **Jasmine/Karma** para testing

## 📋 Requisitos Previos

- Node.js 18+ 
- npm 9+
- Angular CLI

## 🔧 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# La aplicación estará disponible en http://localhost:4200
```

## 🏗️ Scripts Disponibles

```bash
# Desarrollo
npm start                 # Inicia el servidor de desarrollo
npm run watch            # Build en modo watch

# Producción
npm run build            # Build de producción

# Testing
npm test                 # Ejecuta tests con Karma
```

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── cart/              # Componente del carrito
│   │   └── product-list/      # Lista de productos
│   ├── services/
│   │   ├── cart.service.ts    # Servicio de gestión del carrito
│   │   └── product.service.ts # Servicio de productos
│   ├── models/
│   │   ├── product.model.ts   # Modelo de producto
│   │   └── cart-item.model.ts # Modelo de item del carrito
│   ├── app.ts                 # Componente raíz
│   ├── app.routes.ts          # Configuración de rutas
│   └── app.config.ts          # Configuración de la app
└── styles.scss                # Estilos globales
```

## 🎨 Características de UX

- **Botones principales**: Texto + icono para claridad
- **Botones secundarios**: Solo iconos con tooltips
- **Actualizaciones en tiempo real**: Badge del carrito se actualiza automáticamente
- **Feedback visual**: Efectos hover y transiciones suaves
- **Responsive**: Funciona en desktop, tablet y móvil

## 🧪 Tests

El proyecto incluye tests automatizados con TestSprite:
- 14 casos de prueba
- 85.71% de tests pasando
- Cobertura de funcionalidad principal

Ver reporte completo: `testsprite_tests/testsprite-mcp-test-report.md`

## 📝 Próximos Pasos

- [ ] Integración con Supabase para persistencia
- [ ] Autenticación de usuarios
- [ ] Histórico de pedidos
- [ ] Filtros y búsqueda de productos
- [ ] Wishlist / Favoritos

## 👤 Autor

**Claudio Jara**
- GitHub: [@claudiojara](https://github.com/claudiojara)

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

## Additional Angular CLI Resources

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.4.

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
