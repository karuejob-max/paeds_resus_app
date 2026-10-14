# Department conflict workflow

## Purpose

Departmental leaders can flag a suspected staff-directory conflict without changing the roster themselves. Examples include a provider who has resigned, moved to another department, or whose CPD/profile evidence no longer matches the active institutional roster.

## Who can report

- Institutional administrators, for any active department in their institution.
- Active Departmental Heads and Deputy Departmental Heads, for their assigned department only.
- Active Departmental CPD Coordinators and their active deputies, for their assigned department only.
- Existing IERS governance roles and Departmental ERCos, subject to their existing department scope.

Every report requires a reason of at least 10 characters and is idempotent for the same provider, department, and open report.

## Who can resolve

Only an institutional administrator can resolve the report or apply the consequential roster action. The administrator must record a reason. Reallocation and retirement keep the audit history and do not silently restore or create IERS duties.

## Staging smoke test prerequisites

Run only against a disposable or staging database:

```bash
export DATABASE_URL='...staging connection...'
export QA_TEST_PASSWORD='a-local-test-password-with-letters-and-numbers'
pnpm run db:apply-0179
pnpm run seed:qa-institution
```

The seed creates clearly labelled non-clinical QA accounts and a secondary QA institution for switching tests. Never use these commands against production.
