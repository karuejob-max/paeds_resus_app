# Staging branch setup (PSOT §10)

**PSOT:** [PLATFORM_SOURCE_OF_TRUTH.md §10](./PLATFORM_SOURCE_OF_TRUTH.md) — **production** on `main`; **staging Render** is operator setup ([RENDER_STAGING_SETUP.md](./RENDER_STAGING_SETUP.md)). Git branch **`develop`** is the integration branch for staging deploys.

This document is an **operational checklist**. Update PSOT §10 only when staging URL is confirmed live.

---

## 1. Repository (status 2026-05-18)

| Item | Status |
|------|--------|
| Branch **`develop`** | Synced with `main` — re-sync after each production release: `scripts/sync-develop-from-main.sh` |
| **`main` protection** | PR required (0 approvals), check **`gate`**, strict, no force-push — `scripts/github-branch-protection-main.json` |
| **`develop` protection** | Ruleset **`develop-ci-gate`** — required check **`gate`**, no PR required (re-apply: `scripts/github-ruleset-develop.json`) |
| Legacy ruleset “Ruleset 1” | **Removed** |
| Pre-merge | [PRE_MERGE_CHECKLIST.md](./PRE_MERGE_CHECKLIST.md) |

---

## 2. Hosting (Render)

1. **Production:** deploy from **`main`** (www.paedsresus.com).
2. **Staging:** [RENDER_STAGING_SETUP.md](./RENDER_STAGING_SETUP.md) — branch `develop`, separate `DATABASE_URL`, sandbox M-Pesa.

---

## 3. Release flow

1. Feature branches merge → **`develop`** → verify on **staging URL**.
2. When ready for production: PR **`develop` → `main`**, verify `ci:gate` + smoke on staging, then merge and deploy production.
3. Use the repository **pull request template** (`.github/pull_request_template.md`) so risky areas (auth, payments, migrations) are explicitly checked.

---

## 4. Database

1. Run Drizzle migrations against **staging DB** before or with first staging deploy.
2. Never run experimental migrations only against production.

---

## 5. When complete

Update **PSOT §10** with the staging URL when Render staging is live.

## 6. Operator links

- [GITHUB_NOTIFICATIONS.md](./GITHUB_NOTIFICATIONS.md)
- [RENDER_STAGING_SETUP.md](./RENDER_STAGING_SETUP.md)
- [STAGING_DEPLOYMENT.md](./STAGING_DEPLOYMENT.md)
