# Platform Reliability Plan — Paeds Resus

**Purpose:** Reduce “why can’t I log in?” (and similar) incidents by making the platform layer predictable and debuggable. This doc is the single place for reliability practices for Render + Aiven and the app.

**Stack:** Render (app), Aiven (MySQL), www.paedsresus.com. See [CEO_Platform_Update_And_Reply_To_AI_Team.md](./CEO_Platform_Update_And_Reply_To_AI_Team.md) for full context.

---

## 1. What we learned (sign-in incident)

| Cause | What happened | Fix |
|-------|----------------|-----|
| **Aiven MySQL off** | Service was powered off; hostname didn’t resolve / connection failed. | Power on the MySQL service in Aiven Console. |
| **Schema drift** | `users` table was missing columns the app expects (`phone`, `providerType`, `userType`, `passwordHash`). | Run `pnpm db:fix-users` or the SQL in `drizzle/fix-users-columns-manual.sql` when DB is reachable. |
| **DNS / connectivity** | From some networks the Aiven hostname didn’t resolve; Render also saw `ENOTFOUND`. | Use **Public** hostname in Connection info; keep Aiven service on; if needed, use Aiven static IP or support. |

Details and differential are in [SIGNIN_ERROR_DIFFERENTIAL.md](./SIGNIN_ERROR_DIFFERENTIAL.md).

---

## 2. Three layers to keep healthy

| Layer | What it is | How we keep it reliable |
|-------|------------|-------------------------|
| **Product / UX** | Flows, copy, features. | Normal product process. |
| **Application** | Code, auth, API, frontend. | Tests, code review, deploy from main. |
| **Platform** | DB, DNS, env, deploy, secrets. | This plan: migrations, env docs, connectivity checks, monitoring. |

When something breaks, ask: **Product, app, or platform?** Sign-in was platform (DB reachable + schema).

---

## 3. Database and migrations

### 3.1 Single source of truth for schema

- **Drizzle** defines the schema (`drizzle/schema.ts` and migrations).
- **Production DB** must match that schema. Drift (e.g. missing columns) causes runtime errors (e.g. “Failed query” on login).

### 3.2 When you change the schema

1. **Update Drizzle schema** and add/generate migrations (`drizzle-kit`).
2. **Apply in order:** local/staging first, then production.
3. **Production:** Prefer running migrations from a place that can reach the DB (e.g. Render pre-deploy, or one-off from a machine that can connect). If Pre-Deploy is locked on Render, see [RENDER_PREDEPLOY_LOCKED.md](./RENDER_PREDEPLOY_LOCKED.md) (build-command workaround or one-off worker).
4. **One-off fix for `users`:** If only `users` is missing columns and you can’t run Drizzle, use `drizzle/fix-users-columns-manual.sql` in MySQL Workbench or any MySQL client connected to the same DB.

### 3.3 Connection details

- **Public hostname (Aiven):** Use the **Public** access route hostname and port from Aiven Console → Connection information (e.g. `public-...aivencloud.com`, port `10359`).
- **DATABASE_URL:** Must use that hostname and port in `.env` (local) and in Render environment variables. Format: `mysql://USER:PASSWORD@HOST:PORT/DB?ssl-mode=REQUIRED`.

---

## 4. Environment and configuration

### 4.1 Documented variables

- **Required:** `DATABASE_URL`, `JWT_SECRET`, `APP_BASE_URL`. `AUTH_MODE=email` for email/password.
- **Optional:** `OWNER_OPEN_ID`, `VITE_APP_ID`, etc. (see `.env.example` and CEO doc).
- **Rule:** Any new env var that affects runtime must be in `.env.example` and, if relevant, in this doc or the CEO doc.

### 4.2 Where they live

- **Local:** `.env` (gitignored). Copy from `.env.example` and fill in.
- **Render:** Dashboard → Service → Environment. Keep in sync with what the app expects (same names, correct `DATABASE_URL` with Public hostname).

### 4.3 Secrets

- No secrets in repo or in logs. Use env vars; rotate if exposed.

---

## 5. Connectivity and Aiven

### 5.1 Before blaming the app

If login or any DB-dependent feature fails:

1. **Aiven Console:** Is the MySQL service **powered on**? If not, turn it on.
2. **Connection info:** Use the **Public** hostname and port in `DATABASE_URL` (and in MySQL Workbench for manual runs).
3. **Quick test:** From a machine that should reach the DB, run `pnpm db:fix-users` or connect with MySQL Workbench. If that fails with `ENOTFOUND` or connection refused, the issue is connectivity/Aiven, not app logic.

### 5.2 If hostname doesn’t resolve

- Try from another network (e.g. mobile hotspot) and from Render (check deploy/runtime logs).
- If it never resolves, contact Aiven support (DNS or public IP). See SIGNIN_ERROR_DIFFERENTIAL for the wording we used.

---

## 6. Deploy and logs

### 6.1 Render

- **Build command:** Should only build the app (e.g. `pnpm install --no-frozen-lockfile && pnpm build`). Don’t leave one-off fix scripts in the build command.
- **Pre-deploy:** If you use it for migrations, set it in Blueprint or via Dashboard if not locked. Otherwise use the workarounds in RENDER_PREDEPLOY_LOCKED.md.
- **Logs:** For “can’t log in” or DB errors, check **Runtime** logs (not just Build). Look for `ENOTFOUND`, `ECONNREFUSED`, or “Unknown column”.

### 6.2 Staging (when you add it)

- Same practices: env parity with prod (different DB), migrations applied, Public hostname for Aiven if used. See [STAGING_DEPLOYMENT.md](./STAGING_DEPLOYMENT.md) when relevant.

---

## 7. Monitoring and next steps (minimal)

- **Uptime:** Consider a simple HTTP check on www.paedsresus.com (e.g. Render health or external ping). Alerts if the site is down.
- **Errors:** If you add error reporting (e.g. Sentry or similar), tag DB/connectivity errors so they’re easy to filter.
- **Runbook:** For “Sign-in broken”, use: Aiven power → Public hostname in DATABASE_URL → schema (fix-users or migrations) → Render runtime logs. This doc and SIGNIN_ERROR_DIFFERENTIAL are the runbook.

---

## 8. Summary checklist (quick reference)

| Check | Action |
|-------|--------|
| Can’t log in / DB errors | 1) Aiven MySQL on? 2) DATABASE_URL uses Public hostname? 3) Schema in sync? (fix-users or migrations) 4) Render runtime logs. |
| Changed schema | Drizzle + migrations; apply to prod via pre-deploy or one-off; or manual SQL if only users fix. |
| New env var | Add to .env.example and doc; set in Render. |
| Pre-deploy locked on Render | Use build-command workaround once or one-off worker; see RENDER_PREDEPLOY_LOCKED. |

---

*Last updated from the post–sign-in resolution. Adjust as you add staging, monitoring, or new infra.*
