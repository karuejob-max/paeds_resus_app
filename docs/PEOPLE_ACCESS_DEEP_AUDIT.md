# People & Access Deep Audit

**Status:** Substantially implemented; see `docs/institutional/PEOPLE_ACCESS_REDESIGN_EXECUTION_PLAN.md` for the authoritative sequence, the fourth closure audit for remaining gates, and `docs/WORK_STATUS.md` for merge and validation evidence. Authenticated production-equivalent validation remains pending where recorded in `WORK_STATUS.md`; this document does not claim that gate complete.

## Executive finding

The historical screen was not one coherent role-assignment workspace. It combined a full staff roster, mismatch alerts, historical removal controls, an authority-map explanation, IERS duty visibility, product-role assignment, shared-scope assignment, and several destructive actions in one long component. The implemented People & access workspace now separates those jobs into five named views and a focused role register, while preserving the underlying authorization and audit safeguards.

The platform already contains most of the underlying assignment capabilities, but they are split across different screens and data models. The UX therefore fails primarily through information architecture and discoverability, with a second problem in the department mismatch state machine.

## What the current screen contains

| Current area | Current function | Audit result |
|---|---|---|
| People roster | Lists every active or retired staff member, search, unlink, retire, restore, and legacy governance-role editing | Too much for the default role-assignment screen; roster should be searchable and opened only when needed |
| Department mismatch alerts | Shows open mismatch reports and offers reallocation or retirement | Correct intent, but stale reports can become non-actionable |
| Authority map | Explains six intended authority families | Useful reference, but it is informational rather than an assignment tool |
| IERS duties | Displays ERCo, ERTL, and UTL duty records | Oversight only; should not be mixed with role assignment |
| Product permissions | Assigns IERS/CPD product roles | Relevant, but currently shows more product roles than the institution’s primary operating model needs |
| Shared scopes | Assigns account scopes | Relevant, but should be shown as a consequence of the selected role, not as a separate mystery list |

The current component is `client/src/components/InstitutionPeopleRolesPanel.tsx`. Its default section is `roster`, so a user enters the screen and immediately sees the long staff list. The role-assignment controls are separate internal sections and do not provide a person-first workflow.

## Implemented standing appointment model

The implemented Roles view exposes nine standing slot kinds: Institutional administrator, Institutional Emergency Response Coordinator, Institutional CPD Coordinator, Departmental Head, Deputy Departmental Head, ERCo, Deputy ERCo, Departmental CPD Coordinator, and Deputy Departmental CPD Coordinator. The first three are institution-wide; the remaining six are department-scoped. Dated ERTL/UTL duties remain operational IERS responsibilities and appear only as a collapsed, read-only section under Roles. Legacy Assistant ERCo records remain readable, but new Assistant ERCo appointments are not a new assignment path.

Product roles and shared scopes remain available under Admins & access → Advanced access. Membership, role assignment, scope, standing appointment, and dated-duty acceptance remain separate concepts; none proves competency, readiness, or emergency dispatch authority.

## Why the current assignment model feels broken

The current UI asks the administrator to navigate by technical storage concepts: product roles, shared scopes, duties, and a general roster role. The administrator’s actual question is person-first: **“Find this staff member and assign the responsibility they hold.”** The UI should therefore begin with a person search, then show only the relevant role families and scope controls for that person.

Institutional administrator assignment is also separated into the Access & links tab, while ERCo and Departmental CPD Coordinator assignment are separated into IERS and Learning Governance. Those back-end separations are valid for authorization, but the People & Access workspace must provide a single directory and route the administrator to the correct scoped assignment action without making them understand the database model.

## Department mismatch findings

The mismatch workflow has a genuine stale-state failure. `getDepartmentMismatchReports` returns every open action log whose `systemChange` starts with `DEPARTMENT_MISMATCH_REVIEW:`. It does not re-evaluate whether the report is still actionable against the staff member’s current department before showing it.

`reallocateInstitutionStaffDepartment` correctly rejects a destination equal to `staff.facilityDepartmentId` with **“This staff member is already assigned to the selected department.”** That is correct for a fresh reallocation, but it fails for an old mismatch report that remains open after the staff member was already corrected elsewhere. The UI then offers the administrator an action that the server must reject, with no **Close stale alert / Mark already resolved** path.

The report stores the original target department and staff identifiers in JSON notes. The list view uses the current staff row to render the alert, but it does not compare the current canonical department with the report’s stored target before presenting the Reallocate action.

The selected department is restricted to active `facilityDepartments` rows for the institution. The current code does not show a canonical parent/child resolver in the mismatch UI. Therefore, if Theatre exists both as a standalone department and as a child under Surgery, the interface can show duplicate or ambiguous choices, and a user may select a row that does not match the staff record’s canonical department identity.

## Implemented information architecture

The People & access lane uses exactly five views:

| View | Purpose |
|---|---|
| **Needs attention** | Pending staff-link requests, department mismatches, missing departments, declined appointments, and pending-acceptance counts; failed queries remain visibly unavailable rather than appearing clean. |
| **Roles** | The nine-slot standing appointment register, assign/change/end drawer, assignment guidance, and collapsed dated-duty visibility. |
| **Directory** | Searchable/paginated roster, Staff 360 and per-person actions, retired/unresolved records, and staff import. |
| **Departments** | Canonical institution-owned department hierarchy and reconciliation surface. |
| **Admins & access** | Account administrators plus collapsed Advanced access for product roles and shared scopes. |

The default view is Needs attention when it contains items, otherwise Roles. The explicit `peopleView` URL value wins. The institution profile is an Overview-lane card, not a People & access view. Legacy URLs and stored notification links remain supported through the shared resolver; no URL or data migration is required. The former dead-code candidates identified during the redesign were removed only after reachability checks. Authenticated production validation of the complete matrix and mobile/deployed behavior remains a pending gate, not a claim in this audit.

## Implemented role-assignment workflow

The Roles view contains the person-safe role register and drawer. It exposes the nine standing slot kinds listed above, shows scope and lifecycle state, and supports Assign, Change, and End through the existing server-authorized procedures. The Directory view owns searchable/paginated staff records and per-person actions; it is not the default landing view. Product roles and shared scopes remain under Admins & access → Advanced access. Department-scoped choices use the canonical active department hierarchy, including labels such as `Surgery → Theatre`.

## Proposed mismatch workflow

The mismatch inbox should calculate an action state for each report:

| State | UI action |
|---|---|
| Current staff department differs from report target | Reallocate to canonical target or choose another canonical department |
| Staff already equals report target | Mark report resolved as already corrected |
| Staff row retired or missing | Restore link, retire report, or inspect history |
| Target department inactive | Show historical target and require a new active canonical department |
| Duplicate parent/child department labels | Show hierarchy and canonical IDs, never flat names alone |

The server should add a safe `resolveDepartmentMismatch` procedure that closes an open report with an explicit resolution reason. Reallocation should remain a separate mutation. This avoids using a destructive or semantically incorrect reallocation to close a stale alert.

## Implementation sequence

### Phase 1: Information architecture

The historical roster-first layout was replaced by the five implemented views. Existing backend routes remain in use, with AccountAdminsWidget, product-role assignment, ERCo assignment, and Learning Governance reached from the relevant view and selected-person workflow.

### Phase 2: Unified assignment shell

The implemented Directory and Roles views provide person search, selected-person safety, and the nine standing slot kinds. They reuse the existing protected mutations rather than creating a parallel authorization system.

### Phase 3: Department canonicalization

Add parent/child department display and a canonical resolver for assignment choices. Confirm that Theatre is represented as a child of Surgery where that is the institution’s active configuration, and prevent ambiguous duplicate rows from being selected.

### Phase 4: Mismatch repair

Add stale-report detection, a resolve-as-already-corrected path, and explicit handling for inactive or missing departments. Add regression tests for the exact “already assigned to that department” failure.

### Phase 5: Validation

Test with an institutional administrator, a product coordinator, a Departmental Head, an ERCo, and a Departmental CPD Coordinator. Verify that each sees only the roles and departments within their permitted scope, while an institutional administrator sees all six role families automatically.

## Historical definition of done and current boundary

The historical redesign target is now represented by the implemented five-view workspace: an institutional administrator can review attention items, inspect the nine standing slot kinds, search the Directory, manage canonical Departments, and manage Admins & access without confusing dated-duty acceptance with standing authority. Legacy URLs remain supported, and the profile remains on Overview. Authenticated production-equivalent walkthrough evidence, including the full role matrix and deployed/mobile checks, remains pending where recorded in `WORK_STATUS.md`.

## Files audited

- `client/src/components/InstitutionPeopleRolesPanel.tsx`
- `client/src/components/InstitutionAdministrationPanel.tsx`
- `client/src/pages/InstitutionWorkspace.tsx`
- `server/lib/institution-product-roles.ts`
- `server/lib/institution-role-authority.ts`
- `server/routers/institution-products.ts`
- `server/routers/institution.ts`
- `server/routers/institution-learning.ts`
- `client/src/components/AccountAdminsWidget.tsx`
- `client/src/components/ErtRosterPanel.tsx`
- `client/src/components/InstitutionLearningOperationsPanel.tsx`
