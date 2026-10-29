# People & Access Phase 5 Role-Matrix Validation Harness

This harness defines the minimum authenticated verification required before the People & Access redesign is treated as production-ready. It is a validation contract, not evidence that the checks have already run.

## Safety boundary

The harness must run only against a disposable QA or staging institution. It must never point at production for account creation, role mutation, or fixture cleanup. Read-only production smoke checks may verify route fail-closed behavior, but they do not satisfy this matrix.

Use the repository's existing real-router staging pattern with an explicit opt-in flag and a disposable database URL. Do not infer authorization from UI labels; each case must call the protected server procedure and record the result.

## Required personas

| Persona | Expected scope |
|---|---|
| Institutional administrator | Institution-wide People & Access, department registry, role appointments, reports, and permitted role changes |
| IERS / institutional response coordinator | IERS-scoped actions only; no unrestricted CPD or account administration unless separately granted |
| Institutional CPD coordinator | CPD-scoped actions and department-scoped learner/report access only |
| Departmental Head | Own department and descendants only; may not view or modify another department |
| Deputy Departmental Head | Same department scope as the appointed head, subject to active appointment |
| ERCo / Assistant ERCo | IERS governance and duty scope only; appointment does not prove emergency acceptance or competency |
| Ordinary staff member | Own profile and permitted self-service only; no People & Access administration |
| Cross-tenant user | No access to the selected institution |

## Required assertions

1. An institutional administrator can open the People & Roles directory, select a person, see current responsibilities, and reach the relevant management action.
2. A Departmental Head can view only the assigned department and its configured descendants.
3. A deputy inherits the intended department scope but cannot administer institution-wide roles.
4. An ERCo can see the IERS governance surface but is not treated as a general institutional administrator.
5. An institutional CPD coordinator can see CPD responsibility data but cannot mutate unrelated IERS or account-admin state.
6. An ordinary staff member cannot open the People & Roles administration surface by changing URL parameters.
7. A user from another institution receives a fail-closed denial and no cross-tenant rows.
8. Removed membership, revoked product role, ended duty, declined duty, and inactive department cases all fail closed.
9. A selected person with no current assignments displays an explicit empty state rather than inferred authority.
10. A stale mismatch report where the current department already equals the target cannot trigger a duplicate reallocation.

## Evidence to record

For each case record: persona type, institution fixture ID, route or tRPC procedure, selected department ID, expected outcome, observed outcome, and timestamp. Never record passwords, access tokens, or unnecessary personal data.

A green UI smoke test without a protected-procedure result is insufficient. A successful protected-procedure result without checking tenant and role boundaries is also insufficient.

## Completion gate

Phase 5 is complete only when every positive and negative case passes on the same disposable fixture, the result is recorded in `docs/WORK_STATUS.md`, and the final requirement-to-implementation audit is repeated after any fix. Production deployment remains a separate step and requires protected merge plus live route verification.
