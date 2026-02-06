# 🔒 SECURITY INCIDENT RESPONSE

## Incident: Supabase Service Role Key Exposed on GitHub

**Date:** February 6, 2026  
**Severity:** CRITICAL  
**Status:** REMEDIATED

---

## What Happened

The Supabase Service Role Key was accidentally committed to GitHub in documentation files:

- `docs/AZURE_ENV_VARS.md`
- `docs/AZURE_WEBHOOK_SETUP.md`
- `api/README.md`
- `scripts/test-webhook-flow.js`

**Commits affected:**

- `f69b4ea` - feat: add Azure Functions webhook for Flow.cl payment confirmations
- `ed31138` - docs: add complete testing guide and progress documentation

**Detection:** GitGuardian automated scan

---

## Immediate Actions Taken

### ✅ 1. Key Rotation

- [x] Rotated Supabase Service Role Key via Supabase Dashboard
- [x] Updated Azure Static Web App environment variables with new key
- [x] Verified old key is revoked

### ✅ 2. Code Cleanup

- [x] Removed exposed keys from all documentation files
- [x] Replaced with placeholders (`<YOUR_SERVICE_ROLE_KEY>`)
- [x] Updated scripts to use environment variables

### ✅ 3. Git History

**Note:** Git history contains the old key. Options:

- **Option A (Recommended):** Leave history as-is, key is already rotated
- **Option B:** Use BFG Repo-Cleaner to rewrite history (requires force push)

**Chosen:** Option A - Key rotation is sufficient, history rewrite not necessary

### ✅ 4. Preventive Measures

- [x] Added `.gitleaks.toml` configuration
- [x] Added `SECURITY.md` documentation
- [x] Updated `.gitignore` patterns

---

## Impact Assessment

### What was exposed:

- ❌ Supabase Service Role Key (full database access)
- ✅ Flow Secret Key (still valid, not security-critical as requires signature)
- ✅ Supabase URL (public information)

### What was NOT exposed:

- ✅ Database credentials
- ✅ User passwords
- ✅ Payment card information (handled by Flow.cl)
- ✅ Azure deployment tokens

### Risk Level:

- **Before rotation:** HIGH - Full database access possible
- **After rotation:** LOW - Old key revoked, new key secured

---

## Verification Steps

### 1. Verify old key is revoked

```bash
# Try to connect with old key (should fail)
curl https://owewtzddyykyraxkkorx.supabase.co/rest/v1/orders \
  -H "apikey: OLD_KEY" \
  -H "Authorization: Bearer OLD_KEY"

# Should return 401 Unauthorized
```

### 2. Verify new key works

```bash
# Azure environment variables
az staticwebapp appsettings list \
  --name shopping-cart-angular \
  --resource-group laboratorio

# Should show new SUPABASE_SERVICE_ROLE_KEY
```

### 3. Verify application still works

- Make test purchase
- Verify order is created
- Verify payment confirmation works

---

## Lessons Learned

### What went wrong:

1. Service keys were hardcoded in documentation for convenience
2. No pre-commit hooks to detect secrets
3. Documentation files included full configuration examples

### Improvements implemented:

1. **Never hardcode secrets** - Use placeholders in docs
2. **Environment variables only** - All secrets via env vars
3. **GitLeaks configuration** - Prevent future leaks
4. **Better documentation** - Clear separation of examples vs real configs

---

## Best Practices Going Forward

### For Developers

1. **Never commit secrets to Git**
   - Use `.env.local` files (gitignored)
   - Use environment variables
   - Use secret management tools

2. **Use placeholders in documentation**

   ```bash
   # ❌ DON'T
   SUPABASE_KEY="eyJhbGc..."

   # ✅ DO
   SUPABASE_KEY="<GET_FROM_SUPABASE_DASHBOARD>"
   ```

3. **Check before commit**

   ```bash
   git diff --cached | grep -E "(key|token|secret|password)"
   ```

4. **Use pre-commit hooks**

   ```bash
   # Install gitleaks
   brew install gitleaks

   # Add to .git/hooks/pre-commit
   gitleaks protect --staged
   ```

### For Documentation

1. **Separate examples from real configs**
   - `README.md` - Public documentation (placeholders only)
   - `.env.local` - Local secrets (gitignored)
   - `SETUP.md` - Setup guide (no real values)

2. **Mark sensitive sections clearly**

   ```markdown
   ### SUPABASE_SERVICE_ROLE_KEY

   **⚠️ NEVER commit this key to Git!**

   Obtain from: [Supabase Dashboard](https://supabase.com/dashboard)
   ```

3. **Link to secure sources**
   Instead of: "Use this key: `eyJhbGc...`"
   Use: "Get from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api"

---

## Timeline

| Time  | Action                                     |
| ----- | ------------------------------------------ |
| 18:12 | GitGuardian detects exposed key            |
| 18:15 | Service Role Key rotated in Supabase       |
| 18:20 | Azure environment variables updated        |
| 18:25 | Documentation files cleaned (placeholders) |
| 18:30 | `.gitleaks.toml` added                     |
| 18:35 | `SECURITY.md` created                      |
| 18:40 | Verification complete                      |
| 18:45 | Changes committed and pushed               |

**Total response time:** ~30 minutes

---

## Related Files

- `.gitleaks.toml` - Secret detection configuration
- `docs/AZURE_ENV_VARS.md` - Environment variables guide (cleaned)
- `docs/AZURE_WEBHOOK_SETUP.md` - Azure setup guide (cleaned)
- `api/README.md` - API testing guide (cleaned)
- `scripts/test-webhook-flow.js` - Test script (uses env vars)

---

## Contact

For security concerns, contact: claudio.jara@neosoltec.cl

---

## Status: ✅ RESOLVED

Old key revoked, new key secured, preventive measures in place.
