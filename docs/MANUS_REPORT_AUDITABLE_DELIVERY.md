# Auditable frontend delivery — enrollment integration tests

**Purpose:** Ground Manus’s enrollment UI work in **verifiable** repo facts: exact file paths, test counts, and how to re-run checks.

**Last verified:** 2026-04-12 (Cursor on `main`)

---

## 1. What is auditable in git

| Item | Location |
|------|----------|
| Vitest includes `.tsx` / integration tests | `vitest.config.ts` (`include`, `environmentMatchGlobs` for `client/src/components/**` → `jsdom`) |
| RTL + jsdom devDependencies | `package.json` → `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom` |
| 17 integration tests | `client/src/components/EnrollmentModal.integration.test.tsx` |
| M-Pesa reconciliation UI in flows | `MpesaReconciliationStatus` **mocked** in tests so STK success maps to reconciliation step without live tRPC `mpesa` router |

---

## 2. Test counts (verified)

| Suite | Count | Command |
|-------|------|---------|
| EnrollmentModal integration | **17** | `pnpm run test:enrollment-integration` or `pnpm exec vitest run client/src/components/EnrollmentModal.integration.test.tsx` |
| Backend enrollment flows | **13** | `pnpm exec vitest run server/routers/enrollment-payment-flows.test.ts` |

Integration breakdown (describe blocks): Admin-free (4), Promo (5), M-Pesa (5), Navigation / edge cases (3).

---

## 3. File manifest (enrollment UI + tests)

| Path | Role |
|------|------|
| `client/src/components/EnrollmentModal.tsx` | Enrollment modal (admin / promo / M-Pesa → reconciliation → success) |
| `client/src/components/MpesaReconciliationStatus.tsx` | Polling / reconciliation UI (real app) |
| `client/src/components/EnrollmentModal.integration.test.tsx` | RTL tests; mocks `trpc`, `useAuth`, and `MpesaReconciliationStatus` |
| `server/routers/enrollment-payment-flows.test.ts` | Vitest coverage for `enrollWithPayment` |

---

## 4. Notes

- **`pnpm test`** runs the **full** Vitest project; some **other** client/server suites may already fail on this branch (unrelated to enrollment). For **enrollment UI**, use `pnpm run test:enrollment-integration` and the backend file above.
- **E2E (Playwright):** `e2e/enrollment-flow.spec.ts` is **authored**; wire into GitHub Actions separately (not part of this doc).

---

## 5. Next steps (ops)

1. Run `pnpm run test:enrollment-integration` in CI on every PR touching `client/src/components/EnrollmentModal*`.
2. Optional: add a Playwright job for `e2e/enrollment-flow.spec.ts` with seeded auth.
3. `pnpm run verify:analytics` against staging when exercising real enrollments.
