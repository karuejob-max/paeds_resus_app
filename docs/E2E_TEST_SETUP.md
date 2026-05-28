# E2E test setup — holistic loop



**Purpose:** Configure provider credentials for Playwright holistic-loop tests (`pnpm run test:e2e:holistic`).



---



## Required environment variables



Add to `.env` (local) or GitHub Actions secrets (CI):



| Variable | Description |

|----------|-------------|

| `DATABASE_URL` | Required for `pnpm run e2e:ensure-provider` (staging/local DB) |

| `E2E_PROVIDER_EMAIL` | Provider account email (created/updated by ensure script) |

| `E2E_PROVIDER_PASSWORD` | Password for that account (min 8 characters) |

| `PLAYWRIGHT_BASE_URL` | Optional — defaults to `http://localhost:3000` |

| `PLAYWRIGHT_SKIP_WEBSERVER` | Set `1` if dev server already running |



See `.env.example` for placeholders.



---



## Option A — Create test user via script (recommended for staging/local)



Requires `DATABASE_URL` pointing at a **non-production** database unless you use a dedicated E2E account.



```bash

# Set in .env:

# DATABASE_URL=mysql://...   # Aiven: use ssl-mode=REQUIRED in URL

# E2E_PROVIDER_EMAIL=e2e-provider@paedsresus.test

# E2E_PROVIDER_PASSWORD=<strong-test-password>



pnpm run db:test-connection   # verify IPv4 + SSL reachability first

pnpm run e2e:ensure-provider

```



The script (`scripts/ensure-e2e-test-user.mjs`):



- Uses **`scripts/db-connection-config.mjs`** (IPv4 DNS + Aiven SSL) — same pattern as `db:apply-0043` / `db:apply-0044`

- Creates or updates a provider user (`userType: individual`)

- Sets bcrypt password hash

- Ensures `resusGpsAccessExpiresAt` is null (unrestricted ResusGPS access for legacy-style E2E)

- Idempotent — safe to re-run



**If DB unreachable:** Script exits with hint to run `pnpm run db:test-connection`. Authenticated E2E tests skip when creds unset; public tests still run.



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



**Without creds:** 5 public tests pass; 6+ authenticated tests **skip** (CI default).



**With creds:** authenticated tests run — ResusGPS load, Care Signal prefill banner, consent gate, legal/clinical-use, provider home.



---



## CI (optional)



Set repository **variable** `E2E_HOLISTIC_ENABLED=true` and **secrets** `E2E_PROVIDER_EMAIL`, `E2E_PROVIDER_PASSWORD` to run the optional `e2e-holistic` job in `.github/workflows/ci.yml`. (GitHub does not allow `secrets` in job `if` conditions.)



Recommended staging setup:



1. Provision E2E provider via `pnpm run e2e:ensure-provider` against staging DB (ops)

2. Store creds in GitHub secrets

3. Enable `E2E_HOLISTIC_ENABLED=true`



If not configured, the main CI gate runs without E2E; holistic tests skip authenticated cases locally when creds are unset.



---



## Full loop limitation



Completing ResusGPS ABCDE → Save for fellowship credit → Care Signal submit requires interactive clinical flow and DB writes. Automated full-loop save is **not** in CI yet; use staging manual smoke per [STAGING_GO_LIVE_CHECKLIST.md](./STAGING_GO_LIVE_CHECKLIST.md).



---



## Changelog



| Date | Change |

|------|--------|

| 2026-05-27 | ensure-provider uses db-connection-config.mjs; expanded public + auth E2E coverage |

| 2026-05-27 | Initial E2E setup doc |

