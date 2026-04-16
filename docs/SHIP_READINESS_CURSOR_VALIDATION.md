# Ship readiness — Cursor final validation (backend / verification)

**Date:** 2026-04-12  
**Audience:** Manus, Job, CEO — single place for **what was verified**, **what differs from the handoff memo**, and **remaining risks**.

---

## Executive verdict

| Area | Status |
|------|--------|
| **Analytics CLI ↔ Admin Reports** | **Aligned** — shared `server/lib/admin-analytics-rollup.ts`; `pnpm run verify:analytics` uses the same buckets as `adminStats.getReport`. |
| **Automated DB spot-check** | **Added** — `pnpm run db:ship-readiness` (read-only). Run before ship on the **same** DB as production/staging. |
| **Handoff SQL / schema** | **Several queries in the memo were wrong or misleading** — corrected below; use this doc or the script. |
| **“Analytics proves adoption”** | **Not automatic** — CLI reports **0 events** if no traffic in the rolling window; that is **pipeline health**, not “enrollment events confirmed in prod.” |
| **GitHub Actions E2E on every push** | **Not found** in this repo (no `.github/workflows` at time of writing) — treat as **planned** unless added elsewhere. |
| **docs/E2E_TESTS_SHIP_READINESS.md** | **Not present** — add or link the real path. |

**Recommendation:** Proceed to **Job’s smoke test** on staging/production-like env, but treat **empty `microCourses` / `promoCodes`** on the checked DB as **data seeding gaps**, not “green for all environments.”

---

## 1. Corrections to the handoff SQL (use these)

| Memo | Issue |
|------|--------|
| `promoCodes`: `discountPercentage`, `usedCount` | Schema uses **`discountPercent`**, **`usesCount`** (`drizzle/schema.ts`). |
| `microCourseEnrollments`: `status`, `created_at` | Use **`enrollmentStatus`**, **`createdAt`** (camelCase in MySQL). |
| `courses.price` for BLS/ACLS/PALS | **`courses` table has no `price` column** — pricing for many SKUs is in **`client/src/const/pricing.ts`** and server enrollment/pricing logic, not a single SQL column per AHA course. |
| `certificates`: `issuedAt`, `courseId`, `pdfUrl`, `status` | Actual: **`issueDate`**, **`certificateUrl`**, no `courseId` on row (link via **`enrollmentId`**); no `status` field in current schema. |
| “All micro-courses price = 200” | **`microCourses.price` is in KES cents** — **200 KES = 20000** cents. |

**Canonical check:** `pnpm run db:ship-readiness` (loads `DATABASE_URL` from `.env`).

---

## 2. Sample results (this run: local `.env` → Aiven)

Outputs will differ per environment. On the run that validated this doc:

- **`microCourses`** with `price > 0`: **0 rows** → **cannot** confirm DB-backed 200 KES from data alone until catalog is seeded.
- **`courses`** matching BLS/ACLS/PALS titles: **0 rows** (catalog may use other titles or be empty).
- **`promoCodes`**: **empty** — QA promo codes must be **created** (admin) or **seeded** before promo-path testing.
- **`microCourseEnrollments`**: schema includes `paymentMethod`, `amountPaid`, `transactionId`, `promoCodeId`, `enrollmentStatus`, `paymentStatus` — **matches** intent of the handoff.
- **Stale `pending` >1h**: **0**.
- **`__drizzle_migrations`**: latest rows present — **no** duplicate `id` issue visible from this query.

Re-run `pnpm run db:ship-readiness` against **Render production** before final cut.

---

## 3. Analytics — honest status

- **`pnpm run verify:analytics`** confirms: DB reachable, rollup runs, **counts match Admin Reports** for the same window.
- It does **not** prove “enrollment events are flowing” unless rows exist in `analyticsEvents` in that window. Earlier validation showed **0 events in 7×24h** on one DB — **expected** for idle/staging with no journeys.

**Action:** After Job’s smoke test, re-run `verify:analytics` (optionally `VERIFY_LAST_DAYS=30`).

---

## 4. Blindspots (10 areas) — Cursor review

### 1. Database consistency

- **FKs:** `microCourseEnrollments` references `userId`, `microCourseId`; enforce referential integrity in app — confirm DB-level FKs if migrations added them.
- **Cascade deletes:** Not fully audited here; deleting `users` / `microCourses` without policy could orphan rows — **ops policy**: soft-delete or restrict.
- **`__drizzle_migrations`:** Appears normal; **production** should match **repo** journal — compare count to `drizzle/meta/_journal.json`.
- **Stale test data:** `MOCK_` payments / test users — see WORK_STATUS critique: **do not bulk-delete production payments**.

### 2. M-Pesa

- **Callback URL:** Must match Daraja app + `MPESA_CALLBACK_URL` / `server/lib/mpesa-callback-path.ts` — **Job verified** STK; re-check after any domain change.
- **Retries:** `server/lib/async-retry.ts` used for webhook path; Daraja may retry on 5xx — ensure **idempotency** (`payments.idempotencyKey`, MPESA-4).
- **Timeout / stuck pending:** Client polling + `reconcilePaymentRowByStkQuery` paths exist; **stuck** state mitigated but not impossible on network edge cases.
- **Passkey / signature:** `mpesa-webhook.ts` — if **`MPESA_PASSKEY` unset**, signature check **warns and allows** (dev mode). **Production:** set passkey and treat missing as **misconfiguration risk**.
- **IP allowlist:** `MPESA_CALLBACK_IP_ALLOWLIST` optional — if unset, **all IPs** allowed (`server/lib/mpesa-callback-ip.ts`). Harden for prod if desired.

### 3. Certificates

- PDF generation: `issueCertificateForEnrollmentIfEligible` + certificate pipeline — **exercise in smoke test**; failures often env (S3, paths).
- **S3 / URLs:** Verify `certificateUrl` and bucket policy in staging.
- **Timing:** May be **async** or immediate depending on path — smoke test should confirm **download** works.

### 4. Promo codes

- **Empty table** on checked DB — **blocker for promo QA** until rows exist.
- **Admin-free vs promo:** Enrollment router enforces **priority** in tests; confirm product rule matches (see `enrollment-payment-flows.test.ts`).

### 5. Analytics

- **Role on event:** Depends on `trackEvent` payloads — confirm `eventData` / `userId` where needed for slicing.
- **Failed vs success:** Failed flows should not emit **success** events — verify per path (webhook failure vs enrollment error).
- **Slicing:** Admin report gives **top event types**; deeper slices may need **SQL / future dashboard** — not all dimensions in UI today.

### 6. Error handling

- **Duplicate callback / idempotency:** Handled in webhook path — **tests** in `mpesa-critical-flow.test.ts`.
- **Browser closed during M-Pesa:** Polling + reconciliation UX; user may need to **return** to app — document for support.
- **Logging:** Structured logs on key paths; **PII redaction** — confirm log policy for production.

### 7. Render

- **`DATABASE_URL`:** Must match Aiven — **Job** updated; re-verify after password rotation.
- **Migrations:** Run from build/shell or ensure **Pre-Deploy** — see `docs/RENDER_PREDEPLOY_LOCKED.md`.
- **Build warnings:** esbuild may warn on `createAuditLog` / `getUserById` imports — **tech debt**, not necessarily ship-blocking.

### 8. Security

- **Signature:** See §2; **amount tampering:** Amounts for STK should be **server-derived** from course/enrollment — confirm `enrollment` / `mpesa` routers do not trust client-only price.
- **Logs:** Avoid logging full phone numbers in production if policy requires redaction.

### 9. Performance

- **Enrollment <2s:** Not benchmarked here; **measure** under load on staging.
- **Polling:** Mpesa reconciliation polls — **bounded** (e.g. max duration); watch DB load if many concurrent users.

### 10. Data integrity

- **Double enrollment:** `enrollment.ts` returns **“Already enrolled in this course”** for duplicate — **good**.
- **Promo max uses:** Enforced in enrollment logic — covered by tests; **re-verify** with live DB rows.

---

## 5. Pricing truth (PSoT vs code)

Handoff table lists **PALS = 20,000 KES**. In **`client/src/const/pricing.ts`**, SKU **`pals`** is **100 KES** (seriously ill child path). **Resolve** with Job/CEO: either update marketing table or code — **do not ship** with silent mismatch.

Micro-course **200 KES** aligns with **20000 cents** in DB when rows exist.

---

## 6. Commands (copy-paste)

```bash
pnpm run db:ship-readiness
pnpm run verify:analytics
VERIFY_LAST_DAYS=30 pnpm run verify:analytics
pnpm exec vitest run server/routers/enrollment-payment-flows.test.ts
pnpm run test:enrollment-integration
```

---

## 7. Answers to the memo’s questions

1. **DB queries:** Run `pnpm run db:ship-readiness`; memo SQL needed corrections — see §1–2.
2. **Blindspots:** §4 — highest concern: **empty catalog/promo on DB**, **PALS price mismatch**, **MPESA_PASSKEY off in prod**, **no CI workflow in repo** for claimed E2E.
3. **Render predeploy:** Locked/uneditable per `RENDER_PREDEPLOY_LOCKED.md` — use **shell** or **one-off** migrate, not assumed predeploy success.
4. **M-Pesa production:** **Confident** only if callback URL, passkey, idempotency, and **same** DB as certificates are verified end-to-end — **Job’s smoke test** is the real proof.
5. **Ready to ship:** **Conditional yes** after: production `db:ship-readiness` shows expected **seeded** data, pricing decision on PALS, Job smoke **green**, and `verify:analytics` shows events **after** smoke (or documented empty env).

---

*Next owner: Job (smoke + deploy); Manus (E2E/CI doc path if workflows are added).*
