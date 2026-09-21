# People & Access Deep Audit

**Status:** Audit only; no redesign implementation included in this report.

## Executive finding

The current People & Access experience is not one coherent role-assignment workspace. It combines a full staff roster, mismatch alerts, historical removal controls, an authority-map explanation, IERS duty visibility, product-role assignment, shared-scope assignment, and several destructive actions in one long component. The result is a page that makes the administrator scroll away from the task they selected and still does not provide one reliable place to assign the operational roles the institution actually uses.

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

## Required role model

The operational role families to expose in the redesigned People & Access workspace are:

| Role family | Scope | Assignment owner | Existing implementation state |
|---|---|---|---|
| Institutional administrator | Whole institution | Institutional/platform administration | Implemented separately through `AccountAdminsWidget` and `institution-admins` router |
| Institutional Emergency Response / Readiness Coordinator | Whole institution | Institutional administrator | Represented through IERS product-role definitions and assignment procedures |
| Institutional CPD Coordinator | Whole institution | Institutional administrator | Represented through CPD product-role definitions and assignment procedures |
| Departmental Head | Assigned department | Institutional administrator | Legacy staff-role field exists; dedicated department appointment model is not fully surfaced in People & Access |
| ERCo | Assigned department | IERS Chair/governance or Departmental Head | Implemented through `institution.assignDepartmentResponseCoordinator` and the IERS roster surface |
| Departmental CPD Coordinator | Assigned department | Institutional CPD Coordinator or Departmental Head | Implemented through `institutionLearning.assignEducationCoordinator` and Learning Governance |

The following current governance-role options are not appropriate as the primary assignment model for this screen and should be removed from the default People & Access role selector: General staff, Hospital executive, ERC member, Unit Team Leader, ERT Team Leader, and ERT responder. They represent roster/governance or dated-duty concepts, not the six access responsibilities the institution needs to assign from this workspace. Dated duties and operational acceptance must remain in IERS operations.

## Why the current assignment model feels broken

The current UI asks the administrator to navigate by technical storage concepts: product roles, shared scopes, duties, and a general roster role. The administrator’s actual question is person-first: **“Find this staff member and assign the responsibility they hold.”** The UI should therefore begin with a person search, then show only the relevant role families and scope controls for that person.

Institutional administrator assignment is also separated into the Access & links tab, while ERCo and Departmental CPD Coordinator assignment are separated into IERS and Learning Governance. Those back-end separations are valid for authorization, but the People & Access workspace must provide a single directory and route the administrator to the correct scoped assignment action without making them understand the database model.

## Department mismatch findings

The mismatch workflow has a genuine stale-state failure. `getDepartmentMismatchReports` returns every open action log whose `systemChange` starts with `DEPARTMENT_MISMATCH_REVIEW:`. It does not re-evaluate whether the report is still actionable against the staff member’s current department before showing it.

`reallocateInstitutionStaffDepartment` correctly rejects a destination equal to `staff.facilityDepartmentId` with **“This staff member is already assigned to the selected department.”** That is correct for a fresh reallocation, but it fails for an old mismatch report that remains open after the staff member was already corrected elsewhere. The UI then offers the administrator an action that the server must reject, with no **Close stale alert / Mark already resolved** path.

The report stores the original target department and staff identifiers in JSON notes. The list view uses the current staff row to render the alert, but it does not compare the current canonical department with the report’s stored target before presenting the Reallocate action.

The selected department is restricted to active `facilityDepartments` rows for the institution. The current code does not show a canonical parent/child resolver in the mismatch UI. Therefore, if Theatre exists both as a standalone department and as a child under Surgery, the interface can show duplicate or ambiguous choices, and a user may select a row that does not match the staff record’s canonical department identity.

## Target information architecture

The redesigned People & Access experience should use a short vertical task navigation with five destinations:

1. **Role assignments** — default landing page. A searchable person picker and six role cards. No full roster table.
2. **Department mismatch inbox** — only open, actionable mismatch reports, with stale-report resolution and canonical department selection.
3. **Departments & scope** — department catalogue, parent/child structure, staff membership, and canonical department repair.
4. **Access history** — institutional admins, invitations, product-role history, scope history, and audit events.
5. **Retired and unresolved records** — historical roster records, removed links, and unresolved exceptions.

The vertical navigation must not merely switch tabs that expose more unrelated content. Each child label must open the exact task it names. For example, **Role assignments** must not open a roster list first; **Department mismatch inbox** must not open the general administration dashboard; and **Departments & scope** must open the canonical department management surface.

## Proposed role-assignment workflow

The default page should contain:

- One search field: **Search by name or email**.
- A short result list showing name, email, current department, and current assigned responsibilities.
- After selecting a person, six role cards: Institutional administrator, Institutional Emergency Response Coordinator, Institutional CPD Coordinator, Departmental Head, ERCo, and Departmental CPD Coordinator.
- Each card shows the current assignment, its scope, the assignment owner, and one action: **Assign**, **Change**, or **End**.
- Department-scoped roles require a department selector filtered to canonical active departments and display the parent department where relevant, e.g. `Surgery → Theatre`.
- Product roles and shared scopes are derived from the selected operational role where possible. Advanced scope overrides should be hidden behind an explicit **Advanced access** control.

The full staff table should not be rendered on this page. If an administrator needs the roster, it belongs in **Retired and unresolved records** or a separate **Directory** destination with pagination/virtualization.

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

Replace the current default roster-first layout with the five task destinations above. Keep existing backend routes and place direct links to the existing AccountAdminsWidget, product-role assignment, ERCo assignment, and Learning Governance assignment behind the person-first role cards.

### Phase 2: Unified assignment shell

Create a person search and selected-person summary. Render only the six operational role families. Reuse the existing protected mutations instead of creating a parallel authorization system.

### Phase 3: Department canonicalization

Add parent/child department display and a canonical resolver for assignment choices. Confirm that Theatre is represented as a child of Surgery where that is the institution’s active configuration, and prevent ambiguous duplicate rows from being selected.

### Phase 4: Mismatch repair

Add stale-report detection, a resolve-as-already-corrected path, and explicit handling for inactive or missing departments. Add regression tests for the exact “already assigned to that department” failure.

### Phase 5: Validation

Test with an institutional administrator, a product coordinator, a Departmental Head, an ERCo, and a Departmental CPD Coordinator. Verify that each sees only the roles and departments within their permitted scope, while an institutional administrator sees all six role families automatically.

## Definition of done for the redesign

The redesign is complete only when an institutional administrator can search for a person from one page, see all six operational role families automatically, assign or change each role with the correct whole-institution or department scope, and reach the exact underlying workflow from the same vertical navigation. A stale department mismatch must be closable without attempting an invalid reallocation, and Theatre/Surgery must be represented as an unambiguous canonical hierarchy.

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
