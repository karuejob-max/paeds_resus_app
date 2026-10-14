# Paeds Resus QA institution

This is a **non-clinical test fixture** for validating institution workspaces, multi-institution access, people and roles, IERS departments, invitations, and rota workflows. It is not evidence of clinical competency, emergency coverage, or dispatch readiness.

## Fixture identity

- Institution: `Paeds Resus QA Test Institution`
- Primary admin: `karuejob@gmail.com` (existing account; configurable with `QA_PRIMARY_ADMIN_EMAIL`)
- Second admin: `paedsresus254@gmail.com` (existing account; configurable with `QA_SECOND_ADMIN_EMAIL`)
- Sample provider accounts:
  - `qa.iers.coordinator@paedsresus.test` — active IERS coordinator
  - `qa.duty.nurse@paedsresus.test` — active IERS responder and pending-acceptance rota duty
  - `qa.doctor@paedsresus.test` — general institution staff
  - `qa.reviewer@paedsresus.test` — active IERS reviewer
  - `qa.no.workplace@paedsresus.test` — provider without an institutional workplace
  - `qa.multi.institution@paedsresus.test` — provider fixture for institution switching
  - `qa.department.head@paedsresus.test` — active Departmental Head, department-scoped
  - `qa.deputy.department.head@paedsresus.test` — active Deputy Departmental Head, department-scoped
  - `qa.institutional.erco@paedsresus.test` — institutional ERCo
  - `qa.institutional.cpdco@paedsresus.test` — institutional CPD Coordinator
  - `qa.finance@paedsresus.test` — finance officer
  - `qa.general.staff@paedsresus.test` — general institutional staff

The fixture is idempotent. Re-running it updates the sample account passwords and restores the intended membership, role, department, and rota state. It does not store passwords in Git.

## Seed locally or in a disposable/staging database

Set a password only in the shell or local ignored environment. The password must be at least eight characters and contain a letter and number:

```powershell
$env:QA_TEST_PASSWORD = "use-a-local-disposable-password"
pnpm run db:test-connection
pnpm run seed:qa-institution
```

Optional overrides:

```powershell
$env:QA_PRIMARY_ADMIN_EMAIL = "another-existing-admin@example.com"
$env:QA_SECOND_ADMIN_EMAIL = "another-existing-account@example.com"
```

Do **not** run this against production. The script refuses to create the fixture unless both named existing administrator accounts are present, and it does not create or modify those two administrator passwords.

## Suggested smoke-test sequence

1. Sign in as the primary admin and open `/institution`; confirm the QA institution is listed.
2. Create or retain a second institution through `/institutional-onboarding`; confirm the new institution opens with its returned `institutionId` and the switcher can return to the QA institution.
3. As the primary admin, open QA **Administration → People & roles** and confirm the four sample staff rows and IERS role assignments.
4. As `qa.duty.nurse@paedsresus.test`, confirm the pending dated duty is visible and that accepting/declining it changes only that duty state.
5. As `qa.iers.coordinator@paedsresus.test`, confirm the institution is visible but institution-wide administration remains unavailable; verify only the assigned IERS operations are writable.
6. Create a rota change as the admin or IERS coordinator, then confirm the assigned provider sees the new dated duty and acceptance state.
7. Exercise cross-tenant protection by opening another institution ID while signed in as a non-member; the server must return `FORBIDDEN` or `NOT_FOUND`, never another institution's data.

## Orientation smoke-test matrix

| Account | Should see | Must not see |
|---|---|---|
| No workplace | Provider profile, learning and personal actions | Institutional administration |
| Departmental Head / Deputy | Department-scoped workforce, credential and learning queues | Other departments' records |
| Institutional ERCo | IERS operational actions and ERCo duties | Finance and unrelated CPD administration |
| Institutional CPD Coordinator | Learning/accountability actions | Finance and rota administration |
| Finance officer | Billing, subscription and finance actions | UTL/ERCo staffing and credential decisions |
| General staff | Personal provider actions and assigned duties | Institutional leadership queues |

The multi-institution account is a stable named fixture. Attach it to a second **disposable QA institution** before running a switcher smoke test; never attach it to a real facility.

## Cleanup

The fixture is intentionally named and reversible. Use the repository's institution/member cleanup tooling or remove only rows associated with the exact fixture institution after the test. Never delete real administrator accounts or use broad table truncation.
