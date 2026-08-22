# IERS staging, mobile roster, cleanup, and department release

**Date:** 2026-08-22
**Status:** Protected PR #507 and department/rota PR #509 merged; Render deployment and production migrations 0111–0114 verified.

## Real-router staging matrix

A disposable local MariaDB database was created with a generated staging database name and a separate local runner account. The current Drizzle schema and migration 0113 were applied to that database only. The test used the real `appRouter.createCaller` tRPC entry point and real SQL queries; it did not use the production database or production credentials.

The named provider in the fixture is `paedsresus254@gmail.com`, the agreed testing identity for future labelled IERS tests. The fixture seeds two isolated institutions, an administrator, the assigned provider, an unrelated provider, a second-tenant provider, active provider membership, IERS product-role state, one ERCo assignment, weekly ERTL duties, a shift UTL duty, reassignment, acceptance, and readiness records.

`IERS_STAGING_ENABLE=1 IERS_STAGING_DATABASE_URL=<local-staging-url> DATABASE_URL=<local-staging-url> pnpm run test:iers-provider-auth:staging` passed: one test and one test file. The matrix exercised cross-tenant denial, non-assignee denial, required decline reason, readiness-before-acceptance denial, ERCo/UTL acceptance, ERTL decline, acceptance reset after reassignment, ended-duty denial, membership revocation hiding duty reads, and IERS-role revocation hiding provider readiness. The explicit local flag prevents normal CI from consuming stale or unintended database settings.

The test teardown removed every seeded row. The disposable database, local runner account, and local MariaDB service were then destroyed or stopped. No staging residue remains by design.

## Smoke-test cleanup

The repository includes `scripts/cleanup-iers-smoke-test.mjs`, registered as `pnpm run cleanup:iers-smoke-test`. It is dry-run by default and targets only departments whose names begin with the exact prefix `SMOKE TEST - ` within one institution confirmed by exact name. An optional numeric institution ID provides a second identity check.

Preview from a phone-friendly operator workflow:

```text
pnpm run cleanup:iers-smoke-test -- --institution-name "Consolata Hospital Mathari"
```

Apply is deliberately guarded and requires both exact targeting and an explicit confirmation token:

```text
pnpm run cleanup:iers-smoke-test -- --institution-id <id> --institution-name "Consolata Hospital Mathari" --apply --confirm DELETE_SMOKE_TEST_RECORDS
```

The command removes only labelled facility departments and their related ERCo assignments/events, ERTL rotations, UTL rosters, and shift-readiness evidence. It never removes the institution, users, memberships, roles, subscriptions, entitlements, CPD data, or non-prefixed departments. No production cleanup deletion was executed in this release slice. The current authenticated production institution was read-only confirmed as Consolata Hospital Mathari; no patient identifiers, activation, drill, or real-emergency data were entered.

## Mobile roster audit

The long-scroll `24/7 ERT Roster Matrix & Shift UTL Allocation` surface now uses a mobile card view below the small-screen breakpoint and keeps the dense table only for larger screens. Pole/date/shift controls, weekly ERTL controls, department creation, UTL assignment, status updates, readiness status, and long labels now wrap or stack within the viewport. Staff records without a linked provider identity are filtered from provider-assignment controls.

The audit also tightened wrapping in the IERS activation timeline, drill panel, and evidence/action panels, including long card titles, scorecard criteria, and queue headings. Existing desktop layout and IERS deep links are preserved.

## CPD/IERS department unification

IERS `facility_departments` is now the institution-scoped canonical department registry. The CPD registration route exposes the institution’s configured IERS departments, requires a selected canonical department when the registry is configured, and retains the existing standard selector only for institutions that have not configured departments. CPD attendance rows and institutional staff rows store nullable `facilityDepartmentId` values while retaining historical department text.

Migration 0113 adds the two nullable identity columns and indexes, then backfills only exact case-insensitive institution-scoped department-name matches. It does not guess or silently remap unmatched legacy text. New CPD registrations persist the canonical department name and ID, and CPD tests cover invalid free-text rejection and canonical persistence.

## Department setup and automatic rota release

The new onboarding/setup flow is deliberately ordered: the institutional admin confirms or updates the canonical `facility_departments` list; the IERS Lead assigns confirmed departments to response poles; linked providers’ preset department values resolve to canonical department IDs; and an accepted ERCo can prepare the monthly UTL source for the ERCo’s own department. Monthly generation creates morning, evening, and night shift rows with monthly provenance; each provider still accepts each dated duty in the individual portal. Weekly ERTL selection uses the same canonical department and refreshes monthly-derived shift flags for both the previous and new department when a weekly assignment changes.

The same setup panel remains available after onboarding for renames, additions, safe deactivation of omitted departments, pole remapping, and monthly regeneration. An explicit `IERS_STAGING_ENABLE=1` flag is required for the real-router staging command so normal CI cannot consume stale database configuration.

Local final staging validation passed after these changes: the real `appRouter.createCaller` matrix covered canonical department options, linked-provider autofill, ERCo-authorized monthly UTL generation, provider-linked shift rows, automatic ERTL shift behavior, and all prior denial/revocation cases. Migration 0114 was applied once through the guarded Render runner and passed the strict IERS verifier in the same run. No duplicate migration run was performed.

## Production delivery and verification

Protected PR #507 merged into `main` as `6521740`. Render built and deployed the commit successfully; the production service started normally and reported the primary URL available.

The single confirmed Render Shell command was:

```text
pnpm run db:apply-iers
```

It was entered once. Migrations 0111, 0112, and 0113 rechecked/passed; migration 0114 completed; and the terminal returned to a prompt. The strict `db:verify-iers` then passed, including canonical department confirmation, staff and CPD department columns, facility departments/poles, monthly UTL rota and shift provenance, ERCo assignment/history, ERTL/UTL assignments and acceptance fields, and existing IERS product, evidence, action, lifecycle, and Safe Truth contracts.

No duplicate migration run, production cleanup deletion, pilot drill, real emergency, or patient-identifier operation was performed. A read-only post-migration CPD route check reached the application shell but reset to a transient blank browser state before the department field could be visually confirmed; the server/schema contract and tests passed, so a later phone-browser check should confirm the rendered selector.

## Local validation

The following checks passed before protected merge:

- `git diff --check`
- `node --check scripts/apply-0113-canonical-department-links.mjs`
- `node --check scripts/apply-0114-department-rota-automation.mjs`
- `node --check scripts/cleanup-iers-smoke-test.mjs`
- `pnpm run test:iers-verifier`
- Focused Vitest suites for CPD registration, provider-duty fixture, readiness, and ERCo governance
- `pnpm run lint:clinical`
- `NODE_OPTIONS=--max-old-space-size=2048 pnpm exec tsc --noEmit`
- `pnpm run build`
- Protected CI gate on PR #507 and PR #509
- Production migration runner through 0114 and strict `db:verify-iers`

The labelled pilot drill remains blocked until safe cleanup of prior labelled smoke-test records, final phone-width visual verification, and the remaining operational release gates are independently satisfied. The cleanup preview remains dry-run only; no production records were deleted.

## Production smoke-test cleanup preview

The fail-closed preview was run in the Render Web Shell with exact institution name `Consolata Hospital Mathari` and no deletion flags. It resolved institution ID 3 and found exactly two labelled departments: `SMOKE TEST - Department Alpha` (ID 1) and `SMOKE TEST - Department Bravo` (ID 2). The preview reported 1 ERCo assignment, 3 ERCo events, 1 weekly ERTL rotation, 1 shift UTL roster, and 1 readiness evidence record. The command returned to a prompt and confirmed dry-run only; no records changed.
