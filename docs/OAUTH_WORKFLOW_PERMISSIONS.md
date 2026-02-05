# Solución al Problema de OAuth con GitHub Workflows

## 🔴 Problema

Cuando un agente/bot intenta hacer `git push` con cambios en `.github/workflows/`, GitHub rechaza el push con este error:

```
refusing to allow an OAuth App to create or update workflow
`.github/workflows/deploy-production.yml` without `workflow` scope
```

## 🎯 Causa

GitHub tiene una restricción de seguridad especial para archivos en `.github/workflows/`:

- Los **OAuth tokens** necesitan el scope especial `workflow` para modificar workflows
- Esto previene que aplicaciones maliciosas modifiquen tus pipelines de CI/CD
- Es una medida de seguridad crítica

## ✅ Soluciones

### Opción 1: Configurar OAuth Scope en la Aplicación (Recomendado para uso continuo)

Si estás usando un agente AI/bot que necesita modificar workflows frecuentemente:

#### Para GitHub OAuth Apps

1. **Ve a la configuración de la OAuth App:**
   - Si eres el owner: https://github.com/settings/developers
   - Si es una app de terceros: https://github.com/settings/applications

2. **Agregar el scope `workflow`:**
   - Click en la aplicación que estás usando
   - En "OAuth scopes", asegúrate de que incluya `workflow`
   - Re-autoriza la aplicación

#### Para Personal Access Tokens (PAT)

Si el agente usa un PAT:

1. **Crear nuevo token con scope workflow:**

   ```
   GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   ```

2. **Seleccionar scopes necesarios:**
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `write:packages` (si usas GitHub Packages)

3. **Copiar el token y configurarlo en tu agente**

#### Para GitHub CLI (`gh`)

Si usas `gh` CLI para autenticación:

```bash
# Re-autenticar con scopes adicionales
gh auth refresh -h github.com -s workflow

# Verificar scopes actuales
gh auth status
```

### Opción 2: Usar Fine-grained Personal Access Tokens (Más Seguro)

Los **Fine-grained tokens** son más seguros porque puedes limitar el acceso a repositorios específicos:

1. **Crear Fine-grained token:**

   ```
   GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
   ```

2. **Configurar:**
   - **Repository access:** Solo el repositorio `angular-shopping-cart`
   - **Permissions:**
     - Contents: Read and write
     - Workflows: Read and write
     - Metadata: Read-only

3. **Copiar token y configurar en tu entorno**

### Opción 3: Usar GitHub App en lugar de OAuth (Más Profesional)

Para bots/agentes en producción:

1. **Crear GitHub App:**
   - https://github.com/settings/apps/new

2. **Configurar permisos:**
   - Repository permissions:
     - Contents: Read & Write
     - Workflows: Read & Write
     - Pull Requests: Read & Write

3. **Instalar la app en tu repositorio**

4. **Generar Private Key para autenticación**

### Opción 4: Workflow con Push Manual (Actual)

Esta es la opción que estamos usando actualmente:

**Ventajas:**

- ✅ Más seguro (humano revisa antes de push)
- ✅ No requiere configuración adicional
- ✅ Funciona inmediatamente

**Desventajas:**

- ❌ Requiere intervención manual
- ❌ No es automatizado

## 🔧 Configuración para OpenCode/Cursor Agent

Si estás usando **OpenCode** o **Cursor**:

### OpenCode

1. **Verificar autenticación actual:**

   ```bash
   gh auth status
   ```

2. **Renovar con scope workflow:**

   ```bash
   gh auth refresh -h github.com -s workflow
   ```

3. **Confirmar que funcionó:**
   ```bash
   gh auth status
   # Debería mostrar 'workflow' en los scopes
   ```

### Cursor

Cursor puede usar diferentes métodos de autenticación:

1. **Si usa GitHub CLI internamente:**
   - Seguir pasos de OpenCode arriba

2. **Si usa OAuth propio:**
   - Buscar en configuración de Cursor para agregar scope `workflow`
   - Puede requerir re-autorización

## 🔍 Verificar Scopes Actuales

### Usando GitHub CLI

```bash
gh auth status
```

Deberías ver algo como:

```
✓ Logged in to github.com as claudiojara
✓ Git operations protocol: https
✓ Token scopes: gist, read:org, repo, workflow
```

### Usando Git Credential Helper

```bash
# Ver qué credential helper está usando Git
git config --global credential.helper

# Ver token almacenado (cuidado, mostrará el token)
git credential fill <<EOF
protocol=https
host=github.com
EOF
```

## ⚠️ Seguridad

### Buenas Prácticas

1. **Limita los scopes al mínimo necesario**
   - Si solo necesitas modificar workflows ocasionalmente, considera usar push manual

2. **Usa Fine-grained tokens cuando sea posible**
   - Más control granular
   - Puedes limitar a repositorios específicos
   - Puedes establecer fecha de expiración

3. **Rota tokens regularmente**
   - Especialmente si son tokens con scope `workflow`
   - GitHub recomienda rotar cada 90 días

4. **Nunca commitas tokens en el código**
   - Usa variables de entorno
   - Usa GitHub Secrets para CI/CD
   - Usa credential managers

### Riesgos del Scope `workflow`

El scope `workflow` es poderoso porque permite:

- ✅ Modificar pipelines de CI/CD
- ✅ Crear nuevos workflows
- ✅ Modificar GitHub Actions

Un atacante con acceso a un token con `workflow` podría:

- 🔴 Inyectar código malicioso en tus workflows
- 🔴 Exponer secretos de GitHub
- 🔴 Modificar el proceso de deployment

**Por eso GitHub lo protege especialmente.**

## 📋 Checklist de Solución

Para solucionar tu problema específico:

- [ ] Decidir qué método usar:
  - [ ] Push manual (actual, más seguro)
  - [ ] Agregar scope `workflow` a token
  - [ ] Crear Fine-grained token
  - [ ] Crear GitHub App

- [ ] Si eliges agregar scope:
  - [ ] Verificar autenticación actual: `gh auth status`
  - [ ] Renovar con workflow: `gh auth refresh -s workflow`
  - [ ] Verificar que funcionó: `gh auth status`

- [ ] Si eliges Fine-grained token:
  - [ ] Crear token con permisos específicos
  - [ ] Configurar en tu agente/IDE
  - [ ] Probar con push de prueba

- [ ] Si eliges push manual:
  - [ ] Continuar como hasta ahora
  - [ ] Revisar cambios antes de push
  - [ ] Más seguro para workflows críticos

## 🚀 Recomendación

Para este proyecto:

**Para desarrollo/testing:**

- ✅ Usar `gh auth refresh -s workflow` para agregar scope
- ✅ Permite que el agente haga push automático
- ✅ Más conveniente para iteración rápida

**Para producción:**

- ✅ Mantener push manual para cambios en workflows
- ✅ Más seguro
- ✅ Permite revisión humana de cambios críticos

## 📚 Referencias

- [GitHub Token Scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)
- [Fine-grained Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token#creating-a-fine-grained-personal-access-token)
- [GitHub Apps vs OAuth Apps](https://docs.github.com/en/developers/apps/getting-started-with-apps/differences-between-github-apps-and-oauth-apps)
- [GitHub CLI Authentication](https://cli.github.com/manual/gh_auth_refresh)

---

**Última actualización:** Feb 5, 2026
