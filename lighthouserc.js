module.exports = {
  ci: {
    collect: {
      // Configuración de recolección
      numberOfRuns: 3, // Ejecutar 3 veces y promediar resultados
      // En CI: analizar la URL de staging desplegada
      // En local: usar servidor de desarrollo
      url: process.env.CI
        ? ['https://agreeable-sand-011792d0f.6.azurestaticapps.net']
        : ['http://localhost:4200'],
      // Solo usar servidor local si NO estamos en CI
      ...(process.env.CI
        ? {}
        : {
            startServerCommand: 'npm start',
            startServerReadyPattern: 'Application bundle generation complete',
            startServerReadyTimeout: 60000, // 60 segundos
          }),
      settings: {
        // Configuración de Chrome
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        // Throttling para simular conexión 4G
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          requestLatencyMs: 150,
          downloadThroughputKbps: 1638.4,
          uploadThroughputKbps: 675,
          cpuSlowdownMultiplier: 4,
        },
      },
    },
    assert: {
      // Assertions - score mínimo requerido
      assertions: {
        // Performance
        'categories:performance': ['error', { minScore: 0.8 }], // 80%

        // Accessibility
        'categories:accessibility': ['error', { minScore: 0.9 }], // 90%

        // Best Practices
        'categories:best-practices': ['error', { minScore: 0.9 }], // 90%

        // SEO
        'categories:seo': ['warn', { minScore: 0.8 }], // 80% (warning)

        // PWA (solo warning, no requerido)
        'categories:pwa': 'off',

        // Métricas específicas
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }], // 2s
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }], // 2.5s
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // 0.1
        'total-blocking-time': ['warn', { maxNumericValue: 300 }], // 300ms

        // Audits específicos
        'uses-responsive-images': 'warn',
        'uses-optimized-images': 'warn',
        'modern-image-formats': 'warn',
        'uses-text-compression': 'error',
        'unused-css-rules': 'warn',
        'unused-javascript': 'warn',
        'render-blocking-resources': 'warn',
      },
    },
    upload: {
      // Subir resultados a Lighthouse CI server temporal
      target: 'temporary-public-storage',
      // Para production, configurar un servidor LHCI propio
      // o usar GitHub Actions artifacts
    },
  },
};
