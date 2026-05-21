# Render staging service setup (operator checklist)

**Goal:** A second Render Web Service that deploys **`develop`** to a **staging database**, separate from production (`main` → www.paedsresus.com).

Complete these steps in the [Render dashboard](https://dashboard.render.com).

---

## 1. Staging database

1. Create a **new** MySQL instance (not production `DATABASE_URL`).
2. Test: `pnpm run db:test-connection` with staging URL in a local `.env.staging` (never commit).
3. Apply migrations per [RENDER_PREDEPLOY_LOCKED.md](./RENDER_PREDEPLOY_LOCKED.md).

---

## 2. Render Web Service — “Paeds Resus Staging”

| Setting | Value |
|---------|--------|
| Branch | `develop` |
| Build | `pnpm install --frozen-lockfile && pnpm run build` |
| Start | Match production service (`pnpm start`) |
| Auto-deploy | On |

**Environment (copy from production, then override):**

| Variable | Staging |
|----------|---------|
| `DATABASE_URL` | Staging DB only |
| `APP_BASE_URL` | Staging URL |
| `JWT_SECRET` | Unique vs production |
| M-Pesa | Sandbox or unset |

See `.env.example` for the full key list.

---

## 3. DNS (optional)

CNAME `staging.paedsresus.com` → Render staging hostname.

---

## 4. Verify

[STAGING_VERIFICATION_CHECKLIST.md](./STAGING_VERIFICATION_CHECKLIST.md) and [STAGING_DEPLOYMENT.md](./STAGING_DEPLOYMENT.md).

---

## 5. Production release

PR **`develop` → `main`** → green **`gate`** → merge → production deploy.

When staging URL is live, add one sentence to PSOT §10.
