# Lighthouse CI - Performance Monitoring

Lighthouse CI está configurado para medir automáticamente el rendimiento, accesibilidad, y best practices de la aplicación.

## 🎯 Objetivos de Performance

### Scores Mínimos Requeridos

| Categoría | Mínimo | Objetivo |
|-----------|--------|----------|
| **Performance** | 80% | 90%+ |
| **Accessibility** | 90% | 95%+ |
| **Best Practices** | 90% | 95%+ |
| **SEO** | 80% | 90%+ |

### Métricas Core Web Vitals

| Métrica | Límite | Ideal |
|---------|--------|-------|
| **First Contentful Paint (FCP)** | <2s | <1.8s |
| **Largest Contentful Paint (LCP)** | <2.5s | <2s |
| **Cumulative Layout Shift (CLS)** | <0.1 | <0.05 |
| **Total Blocking Time (TBT)** | <300ms | <200ms |

## 🚀 Uso Local

### Ejecutar Lighthouse CI Localmente

```bash
# Performance audit completo (mobile + desktop)
npm run lighthouse

# Solo mobile (default)
npm run lighthouse:mobile

# Solo desktop
npm run lighthouse:desktop
```

**Requisitos:**
- App debe estar en modo producción
- Puerto 4200 disponible
- Chrome instalado

### Interpretar Resultados

Después de ejecutar, verás:
```
┌─────────────────────────────────────────────────────────┐
│ Lighthouse CI Results                                   │
├─────────────────────────────────────────────────────────┤
│ ✅ Performance:     85 / 100                            │
│ ✅ Accessibility:   95 / 100                            │
│ ✅ Best Practices:  92 / 100                            │
│ ⚠️  SEO:            78 / 100                            │
└─────────────────────────────────────────────────────────┘
```

**Colores:**
- ✅ Verde: 90-100 (Excelente)
- ⚠️ Amarillo: 50-89 (Mejorable)
- ❌ Rojo: 0-49 (Crítico)

### Ver Reporte Detallado

```bash
# Lighthouse genera HTML con detalles
open .lighthouseci/lhr-*.html
```

## 🔄 Integración CI/CD

### Cuándo se Ejecuta

Lighthouse CI corre automáticamente en:
- ✅ Pull Requests a `develop` o `main`
- ✅ Push a `develop` o `main`

**No corre en:**
- ❌ Feature branches sin PR
- ❌ Commits a otras ramas

### Workflow de GitHub Actions

**Archivo:** `.github/workflows/lighthouse.yml`

**Pasos:**
1. Build de producción
2. Generate runtime config
3. Start dev server
4. Run Lighthouse (3 runs, averaged)
5. Upload artifacts
6. Comment on PR con resultados

**Duración:** ~4-6 minutos

### Ver Resultados en GitHub

#### En Pull Requests

Lighthouse CI comenta automáticamente en el PR:

```
🟢 Lighthouse CI Results

Performance: 85 (+2 desde base)
Accessibility: 95 (sin cambios)
Best Practices: 92 (-1 desde base)
SEO: 78 (sin cambios)

📊 Ver reporte completo: [link]
```

#### En GitHub Actions

1. Ir a **Actions** tab
2. Click en workflow "Lighthouse CI"
3. Ver job "Lighthouse Performance Audit"
4. Download artifacts "lighthouse-results"
5. Extraer y abrir HTML reports

## 📊 Configuración

### Archivo de Configuración

**lighthouserc.js:**

```javascript
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,  // Promedio de 3 ejecuciones
      startServerCommand: 'npm start',
      url: ['http://localhost:4200']
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        // ... más assertions
      }
    }
  }
};
```

### Modificar Thresholds

Para cambiar los límites de performance:

```javascript
// lighthouserc.js
assertions: {
  // Hacer más estricto (de 80 a 85)
  'categories:performance': ['error', { minScore: 0.85 }],
  
  // Cambiar de error a warning
  'categories:seo': ['warn', { minScore: 0.8 }],
  
  // Deshabilitar check
  'categories:pwa': 'off',
}
```

### Agregar Métricas Personalizadas

```javascript
assertions: {
  // Time to Interactive
  'interactive': ['warn', { maxNumericValue: 3500 }],
  
  // Speed Index
  'speed-index': ['warn', { maxNumericValue: 3000 }],
  
  // Specific audits
  'uses-http2': 'error',
  'uses-passive-event-listeners': 'warn',
}
```

## 🐛 Troubleshooting

### Lighthouse falla con "Server timeout"

**Causa:** App no inicia en 60 segundos

**Solución:**
```javascript
// lighthouserc.js
collect: {
  startServerReadyTimeout: 120000, // Aumentar a 2 minutos
}
```

### Scores varían entre ejecuciones

**Causa:** Normal, depende de recursos del sistema

**Solución:** Lighthouse ya promedia 3 ejecuciones. Para más estabilidad:
```javascript
collect: {
  numberOfRuns: 5, // Aumentar a 5 runs
}
```

### "Performance budget exceeded"

**Causa:** Bundle size o recursos muy grandes

**Solución:**
1. Revisar bundle size: `npm run analyze:size`
2. Optimizar imágenes
3. Lazy load de rutas
4. Code splitting

### CI falla pero local pasa

**Causa:** CI usa throttling de red simulado

**Solución:** Ejecutar local con throttling:
```bash
lhci autorun --collect.settings.throttlingMethod=simulate
```

## 📈 Mejoras Comunes

### Performance

**Problema: Performance <80%**

Soluciones comunes:
```bash
# 1. Code splitting
ng build --configuration production --named-chunks

# 2. Lazy loading routes
// app.routes.ts
{
  path: 'admin',
  loadComponent: () => import('./admin/admin.page')
}

# 3. Optimize images
# Usar WebP, comprimir imágenes, lazy load
```

**Problema: LCP alto (>2.5s)**

Soluciones:
- Preload critical resources
- Optimize hero image
- Remove render-blocking resources

```html
<!-- index.html -->
<link rel="preload" href="hero.webp" as="image">
```

### Accessibility

**Problema: Accessibility <90%**

Revisar:
- ✅ ARIA labels en todos los botones
- ✅ Alt text en imágenes
- ✅ Color contrast ratio (WCAG AA)
- ✅ Keyboard navigation
- ✅ Focus indicators visibles

```html
<!-- ❌ Mal -->
<button mat-icon-button>
  <mat-icon>delete</mat-icon>
</button>

<!-- ✅ Bien -->
<button mat-icon-button aria-label="Eliminar producto">
  <mat-icon>delete</mat-icon>
</button>
```

### Best Practices

**Problema: Best Practices <90%**

Revisar:
- ✅ HTTPS (en producción)
- ✅ Console errors eliminados
- ✅ Deprecated APIs removidas
- ✅ No usar `document.write()`
- ✅ Passive event listeners

### SEO

**Problema: SEO <80%**

Agregar meta tags:
```html
<!-- index.html -->
<head>
  <meta name="description" content="Shopping cart con Angular y Material">
  <meta name="keywords" content="angular, shopping cart, ecommerce">
  <meta name="author" content="Claudio Jara">
  
  <!-- Open Graph -->
  <meta property="og:title" content="Shopping Cart">
  <meta property="og:description" content="...">
  <meta property="og:image" content="preview.png">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
</head>
```

## 📚 Recursos

### Documentación Oficial
- [Lighthouse CI Docs](https://github.com/GoogleChrome/lighthouse-ci)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring](https://web.dev/performance-scoring/)

### Herramientas
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [Chrome DevTools Lighthouse](chrome://lighthouse)

### Guías de Optimización
- [Web.dev Performance](https://web.dev/performance/)
- [Angular Performance Guide](https://angular.dev/best-practices/runtime-performance)

## 🎯 Checklist de Performance

Antes de hacer merge a producción:

- [ ] Performance score ≥ 80%
- [ ] Accessibility score ≥ 90%
- [ ] Best Practices score ≥ 90%
- [ ] SEO score ≥ 80%
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] FCP < 2s
- [ ] Sin console errors
- [ ] Bundle size < 1MB
- [ ] Images optimizadas (WebP)
- [ ] Critical CSS inline
- [ ] Lazy loading implementado

---

**Última actualización:** 2026-02-05  
**Mantenedor:** @claudiojara
