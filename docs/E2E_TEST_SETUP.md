# E2E test setup — holistic loop

**Purpose:** Configure provider credentials for Playwright holistic-loop tests (`pnpm run test:e2e:holistic`).

---

## Required environment variables

Add to `.env` (local) or GitHub Actions secrets (CI):

| Variable | Description |
|----------|-------------|
| `E2E_PROVIDER_EMAIL` | Provider account email (must exist in DB) |
| `E2E_PROVIDER_PASSWORD` | Password for that account |
| `PLAYWRIGHT_BASE_URL` | Optional — defaults to `http://localhost:3000` |
| `PLAYWRIGHT_SKIP_WEBSERVER` | Set `1` if dev server already running |

See `.env.example` for placeholders.

---

## Option A — Create test user via script (recommended for staging/local)

Requires `DATABASE_URL` pointing at a **non-production** database unless you use a dedicated E2E account.

```bash
# Set in .env:
# E2E_PROVIDER_EMAIL=e2e-provider@paedsresus.test
# E2E_PROVIDER_PASSWORD=<strong-test-password>

pnpm run e2e:ensure-provider
```

The script (`scripts/ensure-e2e-test-user.mjs`):

- Creates or updates a provider user (`userType: individual`)
- Sets bcrypt password hash
- Ensures `resusGpsAccessExpiresAt` is null (unrestricted ResusGPS access for legacy-style E2E)
- Idempotent — safe to re-run

**Do not** commit real passwords. Use a dedicated test email on staging only.

---

## Option B — Manual account creation

1. Register at `/register` with a provider email (or use existing staging provider).
2. Complete provider profile + facility if Care Signal submit tests are added later.
3. Export creds to `.env`:

```env
E2E_PROVIDER_EMAIL=your-staging-provider@example.com
E2E_PROVIDER_PASSWORD=your-staging-password
```

---

## Running tests

```bash
# Terminal 1 (optional if PLAYWRIGHT_SKIP_WEBSERVER=1):
pnpm run dev

# Terminal 2:
pnpm run test:e2e:holistic
```

**Without creds:** 2 public tests pass; 2+ authenticated tests **skip** (CI default).

**With creds:** authenticated tests run — ResusGPS load, Care Signal prefill banner, consent gate check.

---

## CI (optional)

The `e2e-holistic` job in `.github/workflows/ci.yml` runs only when repository secrets are configured:

| Secret | Required |
|--------|----------|
| `E2E_PROVIDER_EMAIL` | Yes |
| `E2E_PROVIDER_PASSWORD` | Yes |
| `E2E_DATABASE_URL` | No — only if future tests need DB seed in CI |

If secrets are absent, the job is skipped (`if: secrets.E2E_PROVIDER_EMAIL != ''`).

---

## Full loop limitation

Completing ResusGPS ABCDE → Save for fellowship credit → Care Signal submit requires interactive clinical flow and DB writes. Automated full-loop save is **not** in CI yet; use staging manual smoke per [STAGING_GO_LIVE_CHECKLIST.md](./STAGING_GO_LIVE_CHECKLIST.md).

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-27 | Initial E2E setup doc |
