# Staging go-live checklist

**Purpose:** Operator checklist to provision live staging before Phase 2+ clinical merges. Aligns with [MATURITY_ROADMAP.md](./MATURITY_ROADMAP.md) Phase 1 (Issue #4) and PSOT §10.

**Audience:** CEO / platform operator (Job Karue)

---

## Prerequisites

- [ ] GitHub access to `develop` and `main`
- [ ] Render dashboard access
- [ ] Aiven (or equivalent) MySQL access for a **separate** staging database

---

## 1. Staging database

- [ ] Create staging MySQL instance (not production `DATABASE_URL`)
- [ ] Copy connection string to Render staging env only (never commit)
- [ ] Local smoke: `pnpm run db:test-connection` with staging URL in `.env.staging` (gitignored)
- [ ] Apply migrations per [RENDER_PREDEPLOY_LOCKED.md](./RENDER_PREDEPLOY_LOCKED.md)
- [ ] Run `pnpm run verify:analytics` against staging DB (optional but recommended)

---

## 2. Render staging web service

| Setting | Value |
|---------|--------|
| Service name | Paeds Resus Staging |
| Branch | `develop` |
| Build | `pnpm install --frozen-lockfile && pnpm run build` |
| Start | Same as production (`pnpm start`) |
| Auto-deploy | On |

**Environment (staging-specific overrides):**

| Variable | Staging value |
|----------|----------------|
| `DATABASE_URL` | Staging DB only |
| `APP_BASE_URL` | Staging URL (e.g. `https://staging.paedsresus.com`) |
| `JWT_SECRET` | Unique vs production |
| `SESSION_MAX_AGE_MS` | `1800000` (30 min) recommended |
| M-Pesa | Sandbox (`MPESA_ENVIRONMENT=sandbox`) or unset for non-payment QA |
| `OWNER_OPEN_ID` | Operator test admin account |

See `.env.example` **Staging environment** section for full key list.

---

## 3. DNS (optional)

- [ ] CNAME `staging.paedsresus.com` → Render staging hostname
- [ ] SSL active on staging domain

---

## 4. Smoke verification (staging URL)

Run [STAGING_VERIFICATION_CHECKLIST.md](./STAGING_VERIFICATION_CHECKLIST.md):

- [ ] Login / register (email/password)
- [ ] ResusGPS workspace entry (provider test account)
- [ ] M-Pesa sandbox payment OR manual payment path (if configured)
- [ ] Care Signal form submit (v2)
- [ ] Admin reports load (`/admin/reports`)
- [ ] `GET /api/health` returns 200

---

## 5. Release discipline (ongoing)

- [ ] PR template: auth / payment / migration changes require staging smoke note
- [ ] Two consecutive releases follow `feature → develop → staging → main` with sign-off ([MATURITY_ROADMAP.md](./MATURITY_ROADMAP.md) Phase 1 exit)
- [ ] Update PSOT §10 with live staging URL when provisioned

---

## Exit criteria (Phase 1 Issue #4 — partial until URL live)

| Criterion | Status |
|-----------|--------|
| Staging docs + `.env.example` complete | Done (this checklist + existing STAGING_* docs) |
| Live staging URL in PSOT §10 | **CEO action — pending provisioning** |
| Two consecutive staged releases | Pending live staging |

---

## References

- [RENDER_STAGING_SETUP.md](./RENDER_STAGING_SETUP.md)
- [STAGING_DEPLOYMENT.md](./STAGING_DEPLOYMENT.md)
- [STAGING_BRANCH_SETUP.md](./STAGING_BRANCH_SETUP.md)
- [DEPLOYMENT_SESSION_AND_STAGING.md](./DEPLOYMENT_SESSION_AND_STAGING.md)
