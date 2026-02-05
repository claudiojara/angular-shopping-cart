# Branch Protection Rules Configuration

Este documento describe cómo configurar las reglas de protección de ramas en GitHub para este proyecto.

## Objetivo

Garantizar la calidad del código y prevenir merges accidentales a ramas principales mediante:
- Revisiones obligatorias de código
- CI checks obligatorios
- Prevención de force pushes
- Historial lineal y limpio

## Configuración Recomendada

### 1. Protección para `main` (Producción)

**Settings → Branches → Add branch protection rule**

**Branch name pattern:** `main`

#### Configuración:

**Require a pull request before merging**
- ✅ Enable
- Required approvals: **1**
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require review from Code Owners (opcional, si se crea CODEOWNERS)
- ❌ Restrict who can dismiss pull request reviews (solo si hay equipo)

**Require status checks to pass before merging**
- ✅ Enable
- ✅ Require branches to be up to date before merging
- **Required checks:**
  - ✅ `quality-checks` (from CI workflow)
  - ✅ `deploy-production` (from Deploy to Production workflow)

**Require conversation resolution before merging**
- ✅ Enable

**Require signed commits** (opcional)
- ⚠️ Enable solo si todos los contribuidores pueden usar GPG

**Require linear history**
- ✅ Enable (fuerza squash merge o rebase)

**Require deployments to succeed before merging** (opcional)
- ❌ Disable (ya verificamos con status checks)

**Lock branch**
- ❌ Disable

**Do not allow bypassing the above settings**
- ✅ Enable

**Restrict who can push to matching branches**
- ✅ Enable (opcional)
- Limit to: Maintainers only

**Allow force pushes**
- ❌ Disable

**Allow deletions**
- ❌ Disable

### 2. Protección para `develop` (Staging)

**Branch name pattern:** `develop`

#### Configuración:

**Require a pull request before merging**
- ✅ Enable
- Required approvals: **1**
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ❌ Require review from Code Owners

**Require status checks to pass before merging**
- ✅ Enable
- ✅ Require branches to be up to date before merging
- **Required checks:**
  - ✅ `quality-checks` (from CI workflow)
  - ✅ `deploy-staging` (from Deploy to Staging workflow)

**Require conversation resolution before merging**
- ✅ Enable

**Require linear history**
- ✅ Enable

**Do not allow bypassing the above settings**
- ⚠️ Enable (opcional, permite bypassing para hotfixes si es necesario)

**Restrict who can push to matching branches**
- ❌ Disable (permitir pushes directos en emergencias)

**Allow force pushes**
- ❌ Disable

**Allow deletions**
- ❌ Disable

### 3. Protección para ramas de feature (opcional)

**Branch name pattern:** `feature/*`

#### Configuración:

**Require a pull request before merging**
- ❌ Disable (son ramas temporales)

**Require status checks to pass before merging**
- ❌ Disable

**Allow force pushes**
- ✅ Enable (permitir rebases durante desarrollo)

**Allow deletions**
- ✅ Enable (borrar después de merge)

## Status Checks Disponibles

Los workflows de GitHub Actions crean los siguientes status checks:

### CI Workflow (`ci.yml`)
- **Job name:** `quality-checks`
- **Checks incluidos:**
  - Prettier formatting
  - ESLint
  - Unit tests
  - Code coverage
  - Production build
  - Bundle size analysis

### Deploy to Staging (`deploy-staging.yml`)
- **Job name:** `deploy-staging`
- **Checks incluidos:**
  - Todos los checks de CI
  - Runtime config generation
  - Azure deployment
  - E2E tests (staging)

### Deploy to Production (`deploy-production.yml`)
- **Job name:** `deploy-production`
- **Checks incluidos:**
  - Prettier (strict)
  - ESLint strict mode
  - Unit tests + coverage
  - Production build
  - Bundle size
  - Azure deployment
  - E2E tests (production)
  - GitHub release

## Cómo Aplicar la Configuración

### Vía GitHub Web UI

1. Ir a **Settings** del repositorio
2. Click en **Branches** (sidebar izquierdo)
3. En "Branch protection rules", click **Add rule**
4. Configurar según las especificaciones arriba
5. Click **Create** o **Save changes**

### Verificar Configuración

1. Crear una feature branch
2. Hacer un cambio y commit
3. Abrir PR a `develop`
4. Verificar que:
   - ❌ Merge button está disabled hasta que CI pase
   - ✅ Status checks aparecen en el PR
   - ✅ Se requiere al menos 1 approval
   - ❌ No se puede hacer force push a `develop` o `main`

## CODEOWNERS (Opcional)

Para requerir review de código owners específicos, crear `.github/CODEOWNERS`:

```
# Global owners
*       @claudiojara

# Specific paths
/src/app/services/          @claudiojara
/src/app/core/              @claudiojara
/.github/workflows/         @claudiojara
/scripts/                   @claudiojara

# Documentation
*.md                        @claudiojara
```

Luego habilitar "Require review from Code Owners" en branch protection.

## Merge Strategies Permitidas

Con linear history habilitado, solo estas estrategias están disponibles:

### Squash and Merge (Recomendado)
- ✅ Combina todos los commits del PR en uno
- ✅ Mensaje de commit limpio siguiendo conventional commits
- ✅ Historia lineal y fácil de entender
- **Configurar como default** en Settings → General → Pull Requests

### Rebase and Merge
- ✅ Mantiene commits individuales
- ✅ Historia lineal
- ⚠️ Solo si commits son atómicos y bien escritos

### Merge Commit (Bloqueado)
- ❌ No disponible con linear history
- ❌ Crea commits de merge innecesarios

## Configurar Default Merge Strategy

**Settings → General → Pull Requests:**

- ✅ Allow squash merging
  - Default to pull request title
  - ✅ Default commit message: Pull request title and description
- ✅ Allow rebase merging
- ❌ Allow merge commits (disabled por linear history)
- ✅ Automatically delete head branches

## Roles y Permisos

### Admin
- Puede bypassing branch protection (si está habilitado)
- Puede modificar branch protection rules
- Puede forzar merges en emergencias

### Maintainer
- Puede aprobar y merge PRs
- Puede push directos a `develop` (si está habilitado)
- No puede push a `main`

### Write
- Puede crear PRs
- Puede aprobar PRs
- No puede merge sin approval adicional

### Read
- Puede ver código
- Puede abrir issues
- No puede crear PRs

## Excepciones y Hotfixes

### Hotfix a Producción

Si se necesita un hotfix urgente:

1. **Crear hotfix branch desde main:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-bug
   ```

2. **Hacer el fix y commit:**
   ```bash
   git commit -m "fix: critical security vulnerability"
   ```

3. **Abrir PR a main:**
   - Etiquetar como `hotfix` o `urgent`
   - Pedir review expedito
   - CI debe pasar (no se puede saltear)

4. **Merge y deploy:**
   - Merge a `main` (despliegue automático)
   - Backport a `develop`:
     ```bash
     git checkout develop
     git cherry-pick <hotfix-commit-sha>
     git push origin develop
     ```

### Bypass Branch Protection (Emergencias)

Solo admins pueden bypass si está habilitado en settings.

**Cuándo es aceptable:**
- ❌ Nunca para saltear tests
- ❌ Nunca para saltear reviews de PRs normales
- ⚠️ Solo para emergencias críticas (seguridad, downtime total)
- ✅ Documentar el bypass en un issue

## Métricas y Monitoreo

### Pull Request Insights

**Insights → Pulse** muestra:
- PRs abiertos/cerrados/merged
- Promedio de tiempo hasta merge
- Promedio de reviews por PR

### Code Review Metrics

Monitorear:
- **Time to review:** <24 horas objetivo
- **Time to merge:** <48 horas objetivo
- **Review thoroughness:** Al menos 1 comment por PR

## Troubleshooting

### "Required status check is expected" pero no aparece

**Causa:** El workflow no ha corrido nunca en esa rama

**Solución:**
1. Temporalmente deshabilitar "Require status checks"
2. Merge el primer PR
3. Re-habilitar status checks

### No puedo hacer merge aunque CI está verde

**Causas posibles:**
- Branch no está actualizado con base
- Falta approval
- Conversaciones sin resolver

**Solución:**
```bash
# Actualizar branch
git pull origin develop --rebase
git push origin feature/xxx --force

# Solicitar review si falta
# Resolver conversaciones en GitHub
```

### Force push bloqueado en mi feature branch

**Causa:** Branch protection aplica a `feature/*` pattern

**Solución:**
- Remover protección de `feature/*`
- O usar rebase sin force push:
  ```bash
  git pull origin develop --rebase
  git push origin feature/xxx
  ```

## Checklist de Configuración

- [ ] Branch protection en `main` configurada
- [ ] Branch protection en `develop` configurada
- [ ] Status checks requeridos agregados
- [ ] Linear history habilitado
- [ ] Squash merge como default
- [ ] Auto-delete head branches habilitado
- [ ] CODEOWNERS creado (opcional)
- [ ] Tested con PR de prueba
- [ ] Documentación actualizada

## Referencias

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Required Status Checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging)
- [CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)

---

**Última actualización:** 2026-02-05  
**Mantenedor:** @claudiojara
