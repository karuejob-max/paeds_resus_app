# IERS staging, mobile roster, cleanup, and department release

**Date:** 2026-08-22
**Status:** Implementation complete locally; protected PR and production rollout pending.

## Real-router staging matrix

A disposable local MariaDB database was created with a generated staging database name and a separate local runner account. The current Drizzle schema and migration 0113 were applied to that database only. The test used the real `appRouter.createCaller` tRPC entry point and real SQL queries; it did not use the production database or production credentials.

The named provider in the fixture is `paedsresus254@gmail.com`, the agreed testing identity for future labelled IERS tests. The fixture seeds two isolated institutions, an administrator, the assigned provider, an unrelated provider, a second tenant provider, active provider membership, IERS product role state, one ERCo assignment, weekly ERTL duties, a shift UTL duty, reassignment, acceptance, and readiness records.

`pnpm exec vitest run server/routers/iers-provider-duty-staging.test.ts` passed: 1 test and 1 test file. The matrix exercised cross-tenant denial, non-assignee denial, required decline reason, readiness-before-acceptance denial, ERCo/UTL acceptance, ERTL decline, acceptance reset after reassignment, ended-duty denial, membership revocation hiding duty reads, and IERS-role revocation hiding provider readiness.

The test teardown removed all seeded rows. The disposable database and local runner account were then destroyed, and the local MariaDB service was stopped. No staging residue remains by design.

## Smoke-test cleanup

The repository now includes `scripts/cleanup-iers-smoke-test.mjs`, registered as `pnpm run cleanup:iers-smoke-test`. It is dry-run by default and only targets departments whose names begin with the exact prefix `SMOKE TEST - ` within one institution confirmed by exact name. An optional numeric institution ID provides a second identity check.

Preview from a phone-friendly operator workflow:

```text
pnpm run cleanup:iers-smoke-test -- --institution-name "Consolata Hospital Mathari"
```

Apply is deliberately guarded and requires both flags:

```text
pnpm run cleanup:iers-smoke-test -- --institution-id <id> --institution-name "Consolata Hospital Mathari" --apply --confirm DELETE_SMOKE_TEST_RECORDS
```

The cleanup script removes only labelled facility departments and their related ERCo assignments/events, ERTL rotations, UTL rosters, and shift-readiness evidence. It never removes the institution, users, memberships, roles, subscriptions, entitlements, CPD data, or non-prefixed departments. No production cleanup write was executed in this release slice because the user requested a safe method, not a destructive cleanup confirmation.

The current authenticated production institution was read-only confirmed as **Consolata Hospital Mathari**. No patient identifiers, activation, drill, or real-emergency data were entered during the cleanup investigation.

## Mobile roster audit

The long-scroll `24/7 ERT Roster Matrix & Shift UTL Allocation` surface now uses a mobile card view below the small-screen breakpoint and keeps the dense table only for larger screens. Pole/date/shift controls, weekly ERTL controls, department creation, UTL assignment, status updates, readiness status, and long labels now wrap or stack within the viewport. Staff records without a linked provider identity are filtered from provider assignment controls.

The audit also tightened wrapping in the IERS activation timeline, drill panel, and evidence/action panels, including long card titles, scorecard criteria, and queue headings. Existing desktop layout and IERS deep links are preserved.

## CPD/IERS department unification

IERS `facility_departments` is now the institution-scoped canonical department registry. The CPD registration route exposes the institution’s configured IERS departments, requires a selected canonical department when the registry is configured, and retains the existing standard selector only for institutions that have not configured departments. CPD attendance rows and institutional staff rows store nullable `facilityDepartmentId` values while retaining historical department text.

Migration 0113 adds the two nullable identity columns and indexes, then backfills only exact case-insensitive institution-scoped department-name matches. It does not guess or silently remap unmatched legacy text. New CPD registrations persist the canonical department name and ID, and the CPD tests cover both invalid free-text rejection and canonical persistence.

## Local validation

The following checks passed after the final edits:

- `git diff --check`
- `node --check scripts/apply-0113-canonical-department-links.mjs`
- `node --check scripts/cleanup-iers-smoke-test.mjs`
- `pnpm run test:iers-verifier`
- Focused Vitest suites for CPD registration, provider-duty fixture, readiness, and ERCo governance
- `pnpm run lint:clinical`
- `NODE_OPTIONS=--max-old-space-size=2048 pnpm exec tsc --noEmit`
- `pnpm run build`

Production migration 0113 has not been applied. It requires the normal protected-PR, Render deployment, explicit production-write confirmation, guarded runner, and strict verifier sequence. The labelled pilot drill remains blocked until the real-router authorization result is published through CI/deployment and the remaining operational gates are independently satisfied.
