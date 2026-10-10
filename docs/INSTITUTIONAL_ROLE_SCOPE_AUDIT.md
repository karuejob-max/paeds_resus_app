# Institutional Role Scope Audit

**Date:** 2026-10-11  
**Scope:** Departmental Head, ERCo, Deputy ERCo, additional-cover legacy records, UTL staffing, and institutional navigation.

## Executive finding

The platform already had the correct high-level permission concept for Departmental Heads, but the user journey exposed two weaknesses:

1. ERCo governance used three overlapping labels/fields: ERCo, Assistant ERCo, and Deputy ERCo.
2. Individual role actions could send a user to a broad institutional workspace instead of the exact task they had selected.

The clinical safety rule remains correct: **accepting ERCo or Deputy ERCo is gated by a current verified regulatory licence**. Appointment creation is an institutional governance action and is not blocked by the appointer's licence.

## Official role model

| Role | Scope | Primary responsibility | Licence gate |
|---|---|---|---|
| Institutional Admin | Whole institution | All institutional administration and role management | No |
| Institutional Emergency Readiness Chair / IERS governance role | Institution-wide readiness governance according to assigned product role | Readiness governance and oversight | No for appointment administration |
| Departmental Head | Appointed department only | Appoint or replace that department's ERCo and Deputy ERCo; manage department-scoped CPD responsibilities where authorized | No for appointment; own clinical duties still follow clinical policy |
| ERCo | Appointed department only | Manage department UTL staffing and readiness governance | Current verified regulatory licence required before accepting |
| Deputy ERCo | Appointed department only | Same department-scoped governance cover as ERCo when accepted | Current verified regulatory licence required before accepting |
| Additional ERCo cover (legacy) | Existing records only | Backward-compatible acceptance of old backup records | Existing clinical gate remains |

New governance appointments no longer create the legacy Assistant ERCo/backup role. Existing backup records remain readable and actionable so no accepted duty silently disappears.

## Implemented controls

- Departmental Head recognition is evaluated explicitly against the requested department before broader product-role resolution.
- A Departmental Head cannot use a different department's appointment to obtain authority for another department.
- The governance form now presents only ERCo and Deputy ERCo for new appointments.
- Role acceptance guidance links directly to **My Records → Professional Credentials**.
- Active Departmental Heads are sent directly to ERCo appointment configuration for their institution and department workflow.
- Active ERCos are sent directly to department UTL staffing.
- The workspace's existing query-scoped access remains in place for departments, candidates, assignments, and assignment events.

## Known intentional boundaries

- Departmental Heads do not manage UTL staffing directly; accepted ERCos do.
- A Deputy ERCo is not automatically an ERCo and must accept their own appointment.
- Licence submission and licence verification remain separate. An uploaded or self-declared licence is not enough to activate a clinical emergency-responsibility role.
- Institutional Admin remains the broad administrative authority. Other institutional roles must use their assigned product and department scope.

## Validation completed

- `pnpm exec vitest run server/lib/institution-role-authority.test.ts` — passed.
- `pnpm exec tsc --noEmit` — passed.
- `git diff --check` — passed.

## Required production smoke test

Use a test Departmental Head in a non-production test institution and verify:

1. Departmental Head opens **Appoint department ERCo** and lands on ERCo governance.
2. Only that head's department is returned in the department selector.
3. The head can appoint an active linked nurse as ERCo or Deputy ERCo.
4. The selected provider receives the correct acceptance role.
5. Acceptance without a current verified licence fails with the actionable credential message.
6. Acceptance with a verified current licence succeeds.
7. The accepted ERCo can open **Manage department UTL staffing** and sees only their department.
8. The accepted ERCo cannot access another department's roster by changing URL parameters.
9. An ordinary staff member cannot appoint ERCo, manage UTL staffing, or see institution-wide administration.
10. An Institutional Admin retains institution-wide access.

This smoke test is required before claiming the role system is globally ready; the code-level scope and terminology changes alone are not evidence of production authorization correctness.
