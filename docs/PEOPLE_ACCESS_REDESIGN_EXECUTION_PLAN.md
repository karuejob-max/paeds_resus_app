# People & Access Redesign: End-to-End Execution Plan

*Institution Administration, People & access lane. Prepared 28 Oct 2026 for Job Karue and whichever agent executes it. Baseline: origin/main at commit 104acd6 (after PR 1159).*

## 1. How to use this plan

This document is self-contained. An agent that has read AGENTS.md and docs/WORK\_STATUS.md can execute it without further context. Rules of engagement:

- Do the phases in order. Each phase is its own branch and its own protected PR. Never mix phases, or unrelated work, in one PR.
- Every phase lists goal, exact steps, files, tests, acceptance, authenticated verification and rollback. A phase is not done until the AGENTS.md Definition of Done is met: merge hash on origin/main, WORK\_STATUS entry, post-implementation audit, authenticated pre-merge verification, and a re-audit.
- Line numbers are from 104acd6 and will drift. Locate things by symbol name (grep commands are in Appendix F).
- **VERIFY** marks a fact the author did not confirm. Confirm it in code before relying on it and record the answer in the PR description.
- **STOP** marks a point that needs the CEO's decision before you continue.
- No database schema change is planned anywhere in this work. If you believe one is needed, STOP and ask.

## 2. Outcome and success criteria

**Problem.** People & access mixes one-time setup with recurring administration, hides the state of role appointments, and its notification links do not land where they claim. **Target.** An institutional administrator can answer three questions quickly: (1) What needs my attention? (2) Who holds what? (3) How do I change it?

All of these must be demonstrable in the final authenticated walkthrough:

- **S1** Both notification deep links (new facility link request; department mismatch report) land on the exact item with the correct institution selected, including for an admin of more than one institution.
- **S2** No role or department action can be applied to a person the administrator has not explicitly selected (visible selected-person chip).
- **S3** The role-scope department and the move-person department are separate controls with separate state.
- **S4** One screen shows every standing appointment for the institution with its state: vacant, pending acceptance, active, declined. A failed data query shows 'unavailable', never 'vacant'.
- **S5** All nine appointment types can be assigned, changed and ended from the register (Appendix C).
- **S6** Every capability reachable in the portal at 104acd6 is still reachable (Appendix B is complete and checked).
- **S7** One name per concept across the lane, views, headings and docs.
- **S8** Works at 360 px width; the mobile People shortcut still opens the lane.
- **S9** `pnpm run check`, `pnpm run test:unit` and `pnpm run build` pass with no new failures versus the Phase 0 baseline.

## 3. Verified baseline (main 104acd6)

| Area | Where | Facts |
| --- | --- | --- |
| Workspace URL parsing | `client/src/pages/InstitutionWorkspace.tsx` | `getInitialWorkspaceState` reads `section`, `adminTab`; `institutionId` is read near line 107. Valid `adminTab`: institution, billing, program\_operations, data\_support. Anything else becomes overview. `institution` is the lane id for People & access. |
| Lane shell | `client/src/components/InstitutionAdministrationPanel.tsx` (218 lines) | Five lane tabs. The People lane renders a 'Workforce setup checklist' (`PEOPLE_JOURNEY_STEPS`, order: institution, staff\_import, people\_access, departments, access\_links) and a second tab bar over the same destinations (order: institution, people\_access, departments, access\_links, staff\_import). `PeopleTab` = institution, people\_access, departments, access\_links, staff\_import; default people\_access. Writes `adminTab`/`peopleTab` with replaceState. |
| Roles panel | `client/src/components/InstitutionPeopleRolesPanel.tsx` (735 lines) | `activeSection` = assignments (default), roster, role\_map, duties, product\_roles, scopes; button labels Role assignments, Directory, Role guide, IERS duties, Advanced product roles, Advanced scopes. Holds roster, mismatch alerts, unlink/retire/restore dialogs, saved-assignment strip, nine `RoleAssignmentCard`s, authority map, IERS duty list, product-role and scope forms. |
| Other People components | `AccountAdminsWidget` (institutionAdmins.list/invite/remove), `PendingLinkRequestsWidget` (facilityLinking.getPendingRequests/reviewRequest/repairApprovedStaffLink; institution.getPendingLinkRequests), `StaffBulkImport` (institution.bulkImportStaff), `InstitutionDetailsCard`, `InstitutionDepartmentReconciliationPanel` (institutionDepartmentReconciliation.\*) | All rendered only inside the People lane. |
| Attention | `InstitutionAdministrationOverview.tsx` (410 lines), `shared/institution-administration.ts` | Counts: pendingLinkRequests, departmentMismatches, missingDepartments, productIssues, ilsOrdersNeedingAttention. Each item routes to a lane only; all People items route to `institution`. |
| Entry points | `BottomNav.tsx` (\~lines 47-55), `InstitutionHomePanel.tsx` ('Open people & access'), `App.tsx` (redirect from /institution/administration) | BottomNav builds `adminTab=institution&peopleTab=people_access`. |
| Notification producers | `server/routers/facility-linking.ts` (\~734), `server/routers/institution.ts` (\~5115) | See F1. |
| Role authority | `server/lib/institution-role-authority.ts` | `assertCanManageProductRoles`, `assertCanManageArea`, `assertCanManageDepartmentHead`, `assertCanManageExistingDepartmentAssignment`. Authorities: institution\_admin, iers\_chair, iers\_governance, iers\_coordinator, cpd\_coordinator, department\_head. |
| Appointment tables | `drizzle/schema.ts`: `institutionDepartmentHeads`, `institutionEducationCoordinators`, `institutionDepartmentResponseCoordinators` | Lifecycle pending\_acceptance -> active or declined -> ended, with a separate deputy lifecycle on the same row. |
| Docs | `docs/PEOPLE_ACCESS_DEEP_AUDIT.md` (says default section is roster: now stale), `docs/institutional/INSTITUTION_ADMINISTRATION_OPERATING_MODEL.md`, `docs/PLATFORM_SOURCE_OF_TRUTH.md` (\~line 983), `docs/PLATFORM_CURRENT_STATE.md`, `docs/INSTITUTIONAL_PORTAL_NAVIGATION_IMPLEMENTATION.md`, WORK\_STATUS entries for PRs 688, 741, 864, 1153 | PR 1153 (merged 28 Oct) has authenticated post-deploy verification and CEO sign-off still pending. |
| Tests to extend | `shared/institution-administration.test.ts`, `server/lib/institution-role-authority.test.ts`, `server/routers/institution.test.ts`, `client/src/components/ErtRosterPanel.test.tsx` | ErtRosterPanel.test.tsx is the pattern for jsdom component tests with mocked trpc. `vitest.unit.config.ts` already includes `client/src/components/**/*.test.tsx` in jsdom. |

## 4. Findings (re-verify each in Phase 0)

**F1 (High, defect): two notification deep links do not resolve.** `facility-linking.ts` sends admins to `/institution?section=administration&adminTab=access_links`. `institution.ts` sends mismatch reports to `adminTab=people_roles` plus `departmentId`, `providerUserId`, `mismatchReportId`. Neither `adminTab` value is accepted by `InstitutionWorkspace.tsx` or `InstitutionAdministrationPanel.tsx` (`access_links` is a `peopleTab` value; `people_roles` exists nowhere), so both land on Overview. Neither URL carries `institutionId`, so a multi-institution admin may land in the wrong institution. The three extra parameters are read by no code. Notifications already stored in the database carry these URLs, so the old values must keep resolving. Fix: Phase 1.

**F2 (High, hazard): one state variable drives two different controls.** `assignmentDepartmentId` backs the 'Department scope for a departmental role' selector and the 'Move to canonical department' selector, and the 'Update department' button reads it. Choosing a department to scope an ERCo appointment pre-fills a control that relocates the person. A 10-character reason is the only guard. Fix: Phase 2, finished in Phase 5.

**F3 (High, hazard): the selected person is implicit.** `selectedAssignmentStaff` is derived from search text: exactly one match, or an exact email, selects the person and reveals nine assign buttons. There is no selected-person indicator and no clear action. Fix: Phase 2.

**F4 (Medium-high): appointment state is invisible.** Appointments are two-step (assign, then the appointee accepts or declines). `institutionAccountability.listDepartmentHeads` returns active rows only and no deputy fields. The saved-assignments strip shows only administrators, heads and departmental CPD coordinators. ERCo/Deputy ERCo live in another section; institution-wide IERS and CPD coordinators are product roles shown elsewhere. After clicking Assign nothing durable confirms it, and a declined nomination is never shown. Fix: Phases 3 and 5.

**F5 (Medium): role cards cannot show or change state.** One 'Assign' button, no current holder, no Change or End, although end procedures exist for every appointment type (Appendix C). Fix: Phase 5.

**F6 (Medium): navigation is layered and inconsistently named.** Three stacked layers (lane tabs; a five-tab People bar plus a duplicate checklist; a six-button section bar) and three names for one thing (People & access, People & roles, Role assignments). Checklist order differs from tab order, it has no completion state, and the default landing is step 3. Fix: Phase 4.

**F7 (Medium): attention items route to a lane, not to the item.** Link requests live under Access & links; mismatches under Directory; every People attention item opens the default sub-tab. Fix: Phases 1 and 4.

**F8 (Medium): 'Access & links' joins two unrelated jobs** (who administers the portal; approving staff link requests), and mismatch alerts are buried in the Directory (roster) section. Fix: Phase 4.

**F9 (Low-medium, docs versus code).** `PEOPLE_ACCESS_DEEP_AUDIT.md` specifies six role families and says the default section is roster. Code has nine slot types (three deputy roles were added) and defaults to assignments. The audit's target IA (task-based) also differs from what PR 1153 shipped (journey-based). This plan supersedes both; Phase 7 reconciles the docs.

**F10 (Low): dead-code candidates** with zero importers found by grep: `BulkStaffImport.tsx`, `StaffList.tsx`, `AddStaffForm.tsx`, `RoleManagement.tsx`. VERIFY (including dynamic imports and tests) before deleting. Phase 6.

**F11 (Info): name collision.** The platform-admin nav (`client/src/const/admin-navigation.ts`) and `AdminUser360.tsx` also use the label 'People & access'. That is a different surface (Paeds Resus staff). Do not rename it and never link the two in copy.

**F12 (Caution).** F1 to F5 were found by reading code, not by using the portal. Phase 0 reproduces each with an authenticated account before any fix is written. If one does not reproduce, record that and adjust the phase.

## 5. Invariants (do not violate)

- No new authorization model. Reuse the existing protected procedures; all writes stay server-authorized by the existing checks. The UI never grants anything on its own.
- Importing or linking staff does not grant any authority. Any copy that says so must stay true.
- Retire, unlink and end are state transitions, never deletes. History is preserved.
- Dated IERS duties (ERTL/UTL) stay in IERS operations; the register shows standing appointments only.
- Never infer state from a failed query. A failed query renders 'unavailable' or 'could not load', never zero, vacant or done.
- ILS stays a separate, order-based lane. Products and billing is untouched.
- No UI copy may claim a guarantee the code does not enforce (AGENTS.md lesson on privacy copy).
- The emergency bedside flow is untouched.
- Backward-compatible URLs: every old link keeps resolving (section 6.2).
- Nothing becomes unreachable at any merge point. Each PR ships with its reachability table.
- Mobile first: 360 px, bottom-navigation clearance, 44 px touch targets.

## 6. Target design

### 6.1 Information architecture

The lane stays 'People & access' with lane id `institution`. Do not rename the id: BottomNav, bookmarks, stored notification URLs and tests depend on it. Inside it, one vertical nav (desktop) or horizontal segmented control (mobile) with exactly five views, each opening the thing it names:

| View id | Label | Contains | Replaces |
| --- | --- | --- | --- |
| `inbox` | Needs attention | pending staff link requests, department mismatches, staff with no department, declined appointments, count of pending acceptances | link-request half of Access & links; mismatch alerts inside Directory |
| `roles` | Roles | role register, assign/change/end drawer, collapsed 'Dated duties (ERTL/UTL)' | Role assignments, Role guide, IERS duties |
| `directory` | Directory | paginated roster, search, per-person actions (Staff 360, change department, unlink, retire, restore), retired toggle, Import staff | Directory, Import staff |
| `departments` | Departments | existing `InstitutionDepartmentReconciliationPanel`, unchanged | Departments & CPD |
| `admins` | Admins & access | `AccountAdminsWidget` plus a collapsed 'Advanced access' holding the product-role and shared-scope forms, unchanged | admin half of Access & links, Advanced product roles, Advanced scopes |

Default view comes from the pure function `resolveDefaultPeopleView`: `inbox` when it has any item, otherwise `roles`. An explicit `peopleView` in the URL always wins. The Institution profile (`InstitutionDetailsCard`) leaves this lane and appears on the Administration Overview lane as an 'Institution profile' card (D2). The setup checklist (6.6) sits above the nav.

### 6.2 URL contract

Canonical: `/institution?institutionId=<id>&section=administration&adminTab=institution&peopleView=<inbox|roles|directory|departments|admins>[&focus=<token>]`.

Focus tokens: `link-request:<requestId>`, `mismatch:<reportId>`, `role:<slotKey>` where slotKey is `<roleKind>:<departmentId|all>`.

Legacy values that must keep resolving forever (stored notification URLs, bookmarks):

| Legacy | Resolves to |
| --- | --- |
| `adminTab=access_links` | institution lane, view `inbox` (it was meant for link requests) |
| `adminTab=people_roles` | institution lane; view `inbox` with focus `mismatch:<id>` when `mismatchReportId` is present, else `roles` |
| `adminTab=people` or `people_access` | institution lane |
| `peopleTab=people_access` | `roles` |
| `peopleTab=departments` | `departments` |
| `peopleTab=access_links` | `admins`, or `inbox` when a link-request focus is present |
| `peopleTab=staff_import` | `directory` with import open |
| `peopleTab=institution` | Overview lane, profile card |
| `peopleSection=roster\|duties\|product_roles\|scopes\|role_map` | nearest new view |

**Implementation rule:** ONE pure resolver and ONE builder in `shared/institution-administration-location.ts`, imported by the client (InstitutionWorkspace, Panel, BottomNav) and by the server (every notification URL). Nothing else may hand-write these query strings.

### 6.3 Role register

- Institution-wide table, three rows: Institutional administrator(s), Institutional Emergency Response Coordinator, Institutional CPD Coordinator.
- Departmental matrix: one row per active canonical department (show hierarchy, for example 'Surgery -> Theatre'), six columns: Head, Deputy Head, ERCo, Deputy ERCo, CPD Coordinator, Deputy CPD Coordinator. That makes nine slot types in total.
- Cell states: Vacant, Pending acceptance (holder), Active (holder), Declined (holder, reason if present), Unavailable (source query failed or viewer lacks visibility). Colour is never the only signal: use icon plus text.
- A cell click opens the drawer for that exact slot. The department comes from the cell, so no department dropdown exists for departmental roles.
- At 360 px, render one card per department with six stacked slots instead of a matrix.
- Data is composed client-side by the pure function `buildRoleRegister` (`shared/institution-role-register.ts`) from existing queries, tracking each query's error state separately. No new aggregator procedure. One new read-only procedure is added in Phase 3 because `listDepartmentHeads` returns active rows only.

### 6.4 Assign, change, end drawer

Opened from a register cell or an 'Assign a role' button. Flow: slot fixed (or choose role, then department) -> search staff by name or email -> click a result to select (selected-person chip with Clear) -> eligibility lines shown before submit (disable with a visible reason, never silently) -> one summary sentence ('Assign Jane Doe as ERCo for Paeds Ward. She must accept before it takes effect.') -> submit -> toast, and the register cell flips to Pending acceptance.

- Change: re-assign through the same assign procedure if it replaces the holder (VERIFY per procedure); otherwise end then assign inside one drawer with both steps explicit.
- End: ask for a reason wherever the procedure accepts one.
- Server error messages are shown verbatim.
- 'Move person to another department' leaves this flow and becomes a Directory row action with its own dialog and state.

### 6.5 Needs-attention inbox

Each item has one primary action and a focus token: pending link requests (existing `PendingLinkRequestsWidget` behaviour), department mismatch reports (existing reallocate / mark resolved / retire behaviour, extracted unchanged), roster members with no department, declined appointments (reassign), pending acceptances (count only; do not invent an SLA). A failed source query renders 'Could not load X', not zero.

### 6.6 Setup checklist

Replaces the journey buttons. Five steps: institution profile complete; staff imported or linked; departments confirmed; key institution-wide roles named (IERS coordinator and CPD coordinator slots not vacant); link requests cleared. Done state is derived from queries by a pure function and is 'unknown' when a query failed (never shown as done). Hidden when all five are done. No new persistence.

### 6.7 Vocabulary (use exactly)

Lane: **People & access**. Views: **Needs attention, Roles, Directory, Departments, Admins & access**. Verbs: Assign, End. Noun for the two-step role: appointment. State label: 'Pending acceptance'. 'Retire' removes a roster record; 'Unlink' removes the account link. 'Advanced access' holds product roles and shared scopes. Retire these labels everywhere: People & roles, Role guide, Advanced product roles, Advanced scopes, Access & links, Workforce setup checklist.

## 7. Decisions (defaults apply unless the CEO overrides in writing)

- **D1** Lane id stays `institution`.
- **D2** Institution profile moves to the Overview lane.
- **D3** Default landing is inbox if non-empty, else roles.
- **D4** Keep nine slot types; documents change from six to nine.
- **D5** Dated duties (ERTL/UTL) stay as a read-only collapsed section under Roles, unless VERIFY shows IERS Readiness already shows the same data, in which case link out.
- **D6** Access history (audit destination 4) is deferred and not built.
- **D7** Server-side pagination is deferred; client-side pagination of 50 rows. Design for at least 500 roster rows.
- **D8** Dead-code deletion happens only after re-verification, in a standalone PR.
- **Q1 (STOP if unclear):** `getInstitutionIersDutyAssignments` emits both `assistant_erco` and `deputy_erco` as `assignmentRole` values. VERIFY what each means in code and docs. If they are one concept under two names, reconcile in the register and docs. If they differ, STOP and ask which the register shows.

## Phase 0: Preparation and baseline (no product code)

**0.1 Sync and read.** `git checkout main && git fetch origin main && git merge origin/main --ff-only`. Read in order: AGENTS.md; docs/AGENT\_OPERATIONS\_PLAYBOOK.md; docs/WORK\_STATUS.md (top section and the full dated entries for PRs 688, 741, 864, 1153, not only the table); docs/PLATFORM\_CURRENT\_STATE.md; docs/PLATFORM\_SOURCE\_OF\_TRUTH.md around the Institution Administration section; docs/PEOPLE\_ACCESS\_DEEP\_AUDIT.md; docs/institutional/INSTITUTION\_ADMINISTRATION\_OPERATING\_MODEL.md; this plan.

**0.2 Re-verify the baseline.** Run the Appendix F greps. If any fact in section 3 or any finding F1 to F11 no longer matches main (other agents move fast), write the difference in the Phase 0 report and adjust the affected phase before continuing. Do not silently work around contradictions.

**0.3 Numeric baseline.** `pnpm install --frozen-lockfile` if needed, then `pnpm run check`, `pnpm run test:unit`, `pnpm run build`. Record exact pass/fail counts (the last logged unit baseline was 219 files / 1,168 tests at PR 1153; yours will differ). For any failure, verify against a clean origin/main checkout before calling it pre-existing.

**0.4 Authenticated walkthrough of current behaviour.** Use the authenticated test account (or a documented equivalent), plus an admin of two institutions for the multi-institution case. Record route, role, state and result for: (a) Overview attention click-through; (b) People lane default landing; (c) typing a unique name and watching the role cards appear (F3); (d) choosing a 'Department scope' and observing the 'Move to' selector (F2); (e) assigning an ERCo and seeing what the page shows afterwards (F4); (f) triggering a new facility link request and a department mismatch report, then clicking each notification (F1); (g) BottomNav People shortcut at 360 px. Also complete the PR 1153 post-deploy checks still pending in WORK\_STATUS (institution details persist for the selected institution; mobile shortcut; each guided step) and log the outcome. With sandbox-only access, hand these to the CEO as a numbered checklist and mark them pending. Never claim them done.

**0.5 VERIFY list (answer each in the Phase 0 report).**

1. Who can see the Administration lane (`client/src/lib/institution-workspace-access.ts`) and what a department-scoped viewer sees.
2. Replacement semantics of each assign procedure: does assigning a new head or ERCo replace the incumbent?
3. Input schemas of the five end procedures, and whether they end deputies.
4. Whether IERS Readiness already shows ERTL/UTL dated duties.
5. Whether `getStaffMembers` is paginated, and its row cap.
6. Which UI primitives exist under `client/src/components/ui` (Sheet, Dialog, Tabs, Badge) for the drawer.
7. Existing tests that assert notification URLs (grep `actionUrl` and `adminTab=` under server tests).
8. Q1 above.

**0.6 Land the plan.** Export this document as Markdown to `docs/institutional/PEOPLE_ACCESS_REDESIGN_EXECUTION_PLAN.md` on branch `docs/people-access-redesign-plan` (docs-only PR). Add a one-line 'Superseded in part by' pointer at the top of `docs/PEOPLE_ACCESS_DEEP_AUDIT.md`. Add backlog rows to `docs/INSTITUTIONAL_BACKLOG_BOARD.md` using the next free INST numbers (read the board first; do not guess). Add a dated WORK\_STATUS entry as the first entry after the header, re-fetching first because WORK\_STATUS is a high-collision file.

**Exit criteria:** baseline numbers recorded; F1 to F5 each marked reproduced or not reproduced; VERIFY answers recorded; plan merged. STOP for CEO confirmation of D1 to D8 and Q1 before Phase 1 only if what you found contradicts a default; otherwise proceed.

## Phase 1: Fix the broken deep links and introduce the single URL resolver

**Branch:** `fix/people-access-deep-links` (from freshly fetched main). **Goal:** resolve F1 and F7 (link half) without changing the visible UI structure, and create the one place that owns these URLs so later phases only change one file. **Migration:** none.

**1.1 Create `shared/institution-administration-location.ts`.** Exports:

- types `AdministrationLane` (overview, institution, billing, program\_operations, data\_support), `PeopleView` (inbox, roles, directory, departments, admins), `PeopleFocus` (`{kind:'link-request', id}`, `{kind:'mismatch', id}`, `{kind:'role', slotKey}`), `AdministrationLocation` (lane, optional peopleView, focus, importOpen, institutionId);
- `resolveAdministrationLocation(search: string | URLSearchParams): AdministrationLocation`. Pure, never throws, ignores unknown values, accepts only positive integers for ids, and applies the full legacy table in section 6.2;
- `buildAdministrationUrl(location): string`. Always emits `/institution?` with parameters in a fixed order: `institutionId`, `section=administration`, `adminTab`, `peopleView`, `focus`.

**1.2 Temporary adapter.** The new views do not exist until Phase 4, so `InstitutionAdministrationPanel.tsx` gets a small adapter `PHASE1_VIEW_TO_CURRENT` that maps the resolved `peopleView` onto today's controls: inbox with link-request focus -> `access_links`; inbox with mismatch focus -> `people_access` with `initialSection='roster'`; roles -> `people_access` (assignments); directory -> `people_access` (roster); departments -> `departments`; admins -> `access_links`. Mark the adapter with a comment 'DELETE IN PHASE 4'. URLs generated now are therefore already in final form.

**1.3 Wire every consumer.**

- `InstitutionWorkspace.tsx`, `getInitialWorkspaceState`: replace the hand-written `adminTab` parsing with the resolver (`adminTab = location.lane`). Leave `section` parsing and the `institutionId` read untouched.
- `InstitutionAdministrationPanel.tsx`: `getInitialAdministrationTab` and `getInitialPeopleTab` call the resolver and the adapter. The existing URL writers can keep writing legacy parameters for now because the resolver reads them.
- `InstitutionPeopleRolesPanel.tsx`: add optional props `initialSection` (the existing `activeSection` union) and `focusMismatchReportId`. When set, open that section and scroll to an element with id `mismatch-report-<id>` with a 2-second highlight ring.
- `PendingLinkRequestsWidget.tsx`: add optional `focusRequestId`; scroll to and highlight the row with id `link-request-<id>`. VERIFY rows can carry a stable id; if the request is already reviewed, show nothing special.
- `BottomNav.tsx`: build the People shortcut with `buildAdministrationUrl`, keeping the current `institutionId`, no `peopleView` (so the default logic applies later).
- Server: `facility-linking.ts` notification URL -> `buildAdministrationUrl({institutionId, lane:'institution', peopleView:'inbox', focus:{kind:'link-request', id:requestId}})`. `institution.ts` mismatch `actionUrl` -> the same builder with `focus:{kind:'mismatch', id:reportId}`. VERIFY nothing parses `actionUrl`. Grep the server for any other hand-written `/institution?` strings and route them through the builder (the renewal notification link, `section=administration` only, may stay).

**1.4 Tests.**

- `shared/institution-administration-location.test.ts`, table-driven: every row of the legacy table; unknown `adminTab` -> overview; negative, zero and NaN ids ignored; `adminTab=people_roles&mismatchReportId=7&departmentId=3` -> inbox plus mismatch 7; `adminTab=access_links` -> inbox; build -> resolve round trip for every lane, view and focus; `institutionId` preserved; parameter order stable.
- Server tests: update any existing assertion on the old URLs (VERIFY item 7). Add tests that both notification URLs equal the builder output and contain `institutionId` and the item id.
- Drift guard: a small vitest that reads `server/**` and `client/src/**` (excluding the shared file and tests) and fails on a hand-written `adminTab=` or `peopleTab=` literal. It stops this class of bug returning.

**1.5 Acceptance.** Each notification type, clicked in the browser, lands on the intended place with the item highlighted and the correct institution selected for a two-institution admin. Legacy URLs (Appendix D list) all resolve. Overview is unchanged. `check`, `test:unit` and `build` pass against the Phase 0 baseline.

**1.6 Authenticated verification (record each).** Open the legacy URLs by hand: `/institution?section=administration&adminTab=access_links` and `/institution?section=administration&adminTab=people_roles&departmentId=1&providerUserId=2&mismatchReportId=3`. Then trigger a fresh link request and a fresh mismatch report and click both notifications.

**1.7 Release.** WORK\_STATUS entry (what was built; deferred: temporary adapter and minimal highlight; known gaps). Run `scripts/pre-merge-check.ps1`. After merge, confirm survival: `git show origin/main:shared/institution-administration-location.ts | grep -n resolveAdministrationLocation` and the same for `buildAdministrationUrl` in both server files. **Rollback:** revert the PR. Stored notifications were already broken, so nothing regresses.

## Phase 2: Selection safety in the current panel

**Branch:** `fix/people-roles-selection-safety`. **Goal:** resolve F2 and F3 in the existing UI before it is rebuilt. **Server changes:** none. **Migration:** none.

**2.1 Explicit selected person** in `InstitutionPeopleRolesPanel.tsx`. Replace the derived `selectedAssignmentStaff` with `selectedAssignmentStaffId` state; `selectedAssignmentStaff = staff.find(member => member.id === selectedAssignmentStaffId) ?? null`. A result click sets the id and clears the search text. Remove the `setSearch(member.staffEmail)` trick. Render a selected-person chip (name, email, current department) with a 'Change person' button that clears the id. Search results show only while nothing is selected.

**2.2 Split the department state.** Replace `assignmentDepartmentId` (about 12 references) with `roleScopeDepartmentId` (departmental role cards and their 'Department scope' selector) and `moveDepartmentId` (the 'Correct this person's roster department' box and the 'Update department' button, together with `directDepartmentReason`). Both reset to empty when the selected person changes or is cleared. Do not touch the mismatch alert state (`reallocationDepartmentId`).

**2.3 Make the move explicit.** Above the 'Update department' button show 'Move {name} from {current department or Not assigned} to {target label}'. Disable the button when the target equals the current department (this avoids the known server rejection 'already assigned to the selected department').

**2.4 Disabled reasons.** Where a role card is disabled, show a one-line reason under the button (for example 'Choose a department first', 'This person has no linked account'). Derive the text from the existing disabled conditions; change no logic.

**2.5 Tests.** New `client/src/components/InstitutionPeopleRolesPanel.test.tsx` (jsdom, mocked trpc, following `ErtRosterPanel.test.tsx`): (a) typing a unique name shows the result but no role cards; (b) clicking the result selects, shows the chip and the nine cards; (c) 'Change person' clears; (d) setting the role-scope department leaves the move department empty, and the reverse; (e) changing person resets both; (f) 'Update department' is disabled when the target equals the current department; (g) two role cards call the right mutation with the selected person's ids. If mocking the whole panel proves too heavy, extract the selection state into a small hook (`client/src/lib/usePeopleSelection.ts`), unit-test the hook, and keep a thin component test.

**2.6 Acceptance and verification.** Repeat Phase 0 walkthrough items (c) and (d): both now behave as specified. Exercise all nine role cards with the authenticated account to prove no regression. **Release:** WORK\_STATUS, pre-merge check, post-merge grep (`git show origin/main:client/src/components/InstitutionPeopleRolesPanel.tsx | grep -n selectedAssignmentStaffId`). **Rollback:** revert.

## Phase 3: Data layer for the role register (additive only)

**Branch:** `feat/role-register-data`. **Goal:** everything the register and the inbox need, fully tested, with no visible UI change. **Migration:** none. **Hard rule:** do not change the output of any existing procedure.

**3.1 New read-only procedure** `institutionAccountability.listDepartmentHeadAppointments`. Input: `{ institutionId, includeEnded?: boolean }` (default false). Same access gating as `listDepartmentHeads` (`getCredentialAccess`; `canViewIndividuals` false -> `[]`; `access.departmentIds` restricts rows). Returns per row: `id`, `departmentId`, `department`, `userId`, `fullName`, `email`, `assignmentStatus`, `assignedAt`, `acceptedAt`, `declinedAt`, decline reason (VERIFY the column name on `institutionDepartmentHeads`), `deputyUserId`, `deputyFullName` (second join on `users` with a Drizzle alias), `deputyAssignmentStatus`, `deputyAssignedAt`, `deputyDeclinedAt`, `deputyDeclineReason`. Statuses: pending\_acceptance, active, declined (plus ended only when `includeEnded`). Leave `listDepartmentHeads` untouched.

**3.2 Choose and document the ERCo source.** Compare `institution.getDepartmentResponseCoordinators` and `institution.getInstitutionIersDutyAssignments` (it emits `assignmentRole` erco, assistant\_erco, deputy\_erco; it has an `includeEnded` flag). Use whichever returns status, holder and `departmentId` for both primary and deputy without extra joins. Record the choice and your Q1 resolution (assistant versus deputy) in the PR. If neither returns a decline reason, the register shows 'Declined' without one.

**3.3 Education coordinators.** `listEducationCoordinators` already returns `assignmentStatus` and deputy fields. VERIFY it includes pending and declined rows. If it filters them out, add a new procedure with an optional flag exactly as in 3.1 rather than changing the existing one.

**3.4 Institution-wide holders.** `institutionAdmins.list` (admins with userId, name, email) and `institutionProducts.listProductRoles` filtered to `iers_coordinator` (productKey iers) and `cpd_coordinator` (productKey cpd\_portal), with `roleStatus` active, suspended or ended (VERIFY the shape).

**3.5 `shared/institution-role-register.ts`** (pure, no I/O). Core shapes:

```
SlotKind = institution_admin | iers_coordinator | cpd_coordinator | dept_head | dept_head_deputy | erco | erco_deputy | cpd_dept_coordinator | cpd_dept_coordinator_deputy
SlotStatus = vacant | pending_acceptance | active | declined | unavailable
RoleSlot = { kind, departmentId: number|null, status, holders: [{userId, name, email?}], assignmentId?, assignedAt?, declineReason? }
Unavailable = { unavailable: true }
buildRoleRegister({ departments, admins, productRoles, heads, ercos, cpdCoordinators }) -> { institutionWide: RoleSlot[], departments: [{ departmentId, label, slots }] }
```

Each input may be `Unavailable`; every slot that depends on it becomes `unavailable`, never `vacant`. Ended rows are ignored. If a slot has both an active and a pending row, the active row wins and the other is kept in `others`. Department labels show hierarchy ('Surgery -> Theatre'); reuse the existing `formatDepartmentLabel` logic (VERIFY where it lives; move or replicate it into `shared/` if it is client-only). Unit tests cover every status, every kind, unavailable propagation, multiple rows, dept-scoped partial visibility, and ended rows.

**3.6 Attention counts.** In `shared/institution-administration.ts` add OPTIONAL counts `declinedAppointments` and `pendingAcceptances` (default 0) so the current Overview call and existing tests stay valid. Add a declined-appointments attention item routed to the institution lane. Extend `InstitutionAdministrationAttention` with optional `peopleView` and `focus` for Phase 4. Update `shared/institution-administration.test.ts`.

**3.7 Pure helpers for Phase 4** in `shared/institution-people-view.ts`: `resolveDefaultPeopleView(counts)` (inbox if any People attention count is above zero, else roles; an unavailable count is 'unknown': default roles and flag 'could not load') and `deriveSetupChecklist(inputs)` (five steps, tri-state done / not done / unknown). Full unit tests.

**3.8 Server tests** for the new procedure: (i) an institution admin sees all departments including pending and declined and the deputy fields; (ii) a department head sees only their own department; (iii) an unrelated user gets the same result as `listDepartmentHeads` does today (`[]` or FORBIDDEN, match it); (iv) `includeEnded=false` hides ended rows; (v) institution isolation: rows of another institution are never returned. Follow the patterns in `institution-role-authority.test.ts` and `institution.test.ts`. If the real-router authorization suite covers accountability routers, also run `IERS_STAGING_ENABLE=1 IERS_STAGING_DATABASE_URL=<disposable-local-url> DATABASE_URL=<disposable-local-url> pnpm run test:iers-provider-auth:staging` (VERIFY applicability).

**3.9 Acceptance.** No user-visible change. New tests pass on top of the Phase 0 baseline. `git diff` proves `listDepartmentHeads` and every other existing procedure are unchanged. **Rollback:** revert; nothing depends on it yet.

## Phase 4: New People & access shell, Needs-attention inbox, setup checklist

**Branch:** `feat/people-access-shell-inbox`. **Goal:** resolve F6, F7 and F8 and complete S1, S6 and most of S7. The old role-assignment UI is still used inside the Roles view, so nothing disappears at this merge. **Migration:** none.

**4.1 New components** under `client/src/components/people-access/`:

- `PeopleAccessShell.tsx`: vertical nav (md and up) or horizontally scrollable segmented control (mobile) with the five views of 6.1, built on the existing Tabs primitive for keyboard and ARIA behaviour (`aria-label` 'People and access views'). It reads the location with `resolveAdministrationLocation`, writes with `buildAdministrationUrl` plus `replaceState`, and clears `focus` after it has been consumed once. The default view comes from `resolveDefaultPeopleView`. Do not redirect after first paint if the user has already clicked a view; show a skeleton until counts settle (one render at most).
- `PeopleNeedsAttention.tsx`: the inbox (6.5).
- `SetupChecklist.tsx`: driven by `deriveSetupChecklist` (6.6).
- `MismatchInbox.tsx`: extract, unchanged, the department-mismatch alert block from the roster section of `InstitutionPeopleRolesPanel.tsx` (reallocate / mark resolved / retire, plus `focusMismatchReportId`).
- `RosterActionDialogs.tsx`: extract the unlink, restore and retire dialogs (with their 10-character reason rules) so Directory and MismatchInbox share them. VERIFY the state coupling before extracting; the extraction must be behaviour-preserving and covered by tests.
- Hook `usePeopleAttentionCounts(institutionId)` reusing the exact queries and input shapes the Overview already uses (`getPendingLinkRequests`, `getDepartmentMismatchReports`, `getStaffMembers`, plus the Phase 3 appointment queries) so React Query dedupes them with the Overview. Each count is a number or `'unavailable'`.
- Reuse `PendingLinkRequestsWidget` as it is inside the inbox.

**4.2 Panel changes** in `InstitutionAdministrationPanel.tsx`: replace the People `TabsContent` card with `<PeopleAccessShell/>`; delete `PEOPLE_JOURNEY_STEPS`, the second tab bar and the Phase 1 adapter. Show `InstitutionDetailsCard` on the Overview lane as an 'Institution profile' card below the attention list (D2). The legacy `peopleTab=institution` already resolves to Overview.

**4.3 View content (so nothing becomes unreachable at merge).** Add two props to `InstitutionPeopleRolesPanel`: `section` (which of its existing sections to render) and `hideSectionNav`.

| View | Renders |
| --- | --- |
| inbox | `PeopleNeedsAttention` (contains `MismatchInbox`, `PendingLinkRequestsWidget`, missing-department list, declined and pending appointment counts) |
| roles | panel with `section='assignments'`, plus collapsed cards, each mounted lazily on expand: 'Who can assign what' (panel `section='role_map'`) and 'Dated duties (ERTL/UTL)' (panel `section='duties'`) |
| directory | panel with `section='roster'` (alerts no longer shown there) plus an 'Import staff' button that toggles `StaffBulkImport` (also opens when `importOpen` is in the URL) |
| departments | `InstitutionDepartmentReconciliationPanel` |
| admins | `AccountAdminsWidget` plus a collapsed 'Advanced access' holding panel `section='product_roles'` and `section='scopes'` under two sub-headings, lazily mounted |

**4.4 Overview attention links.** Change `onNavigate(lane)` to `onNavigate(lane, peopleView?)`. Link requests, mismatches, missing departments and declined appointments target `inbox`; the rest are unchanged. Update `shared/institution-administration.ts` and its tests accordingly, and have the workspace set both lane and view through the builder.

**4.5 Mobile.** BottomNav keeps its People shortcut URL (no `peopleView`, so the default logic applies). Verify bottom-navigation clearance with the new nav at 360 px, touch targets of at least 44 px, and no horizontal page scroll.

**4.6 Tests.**

- `PeopleAccessShell.test.tsx`: five labelled views; default is inbox when counts are above zero, else roles; an explicit `peopleView` wins; a legacy URL (`?adminTab=access_links`) mounts the inbox; selecting a view writes a builder-format URL; unavailable counts show 'Could not load' and never zero; focus is consumed once.
- `PeopleNeedsAttention.test.tsx`: items from counts; error states.
- Extraction tests: `MismatchInbox` calls the right mutation for reallocate, mark resolved and retire; `RosterActionDialogs` still require a reason of at least 10 characters for unlink, restore and retire.
- Reachability test: parameterised, asserting each view renders its expected widgets (use stable test ids or visible headings; VERIFY the copy).

**4.7 Acceptance.** Fill Appendix B (old location -> new location, with evidence) and paste it into the PR and the WORK\_STATUS entry. All S6 items reachable; legacy URLs land on the right views; Overview items deep-link; mobile passes. **Authenticated verification:** walk every view as an institution admin and as a non-admin role per VERIFY 1; approve and reject a link request; run reallocate, mark resolved and retire on TEST records only. Never run destructive actions against real roster records without CEO approval.

**4.8 Release and risk.** `InstitutionPeopleRolesPanel.tsx` is a hot file in a multi-agent repo. Fetch and merge `origin/main` before every edit to it, and keep this phase's diff in that file to the two props and the alert extraction. **Rollback:** revert the whole PR (the adapter was removed, so a partial revert is not supported).

## Phase 5: Role register and assign / change / end drawer

**Branch:** `feat/role-register-assign`. **Goal:** resolve F2 (finish), F4, F5 and S3 to S5. **Migration:** none.

**5.1 `RoleRegister.tsx`.** Queries are enabled only while the Roles view is active (`staleTime` of about 30 s): departments (`institution.getFacilityDepartments`), `institutionAdmins.list`, `institutionProducts.listProductRoles`, `institutionAccountability.listDepartmentHeadAppointments`, the ERCo source chosen in 3.2, and `institutionLearning.listEducationCoordinators`. Compose with `buildRoleRegister`, passing `Unavailable` for any query in an error state. Render the institution-wide table and the departmental matrix (desktop) or department cards (360 px). Each cell is a button with an explicit label, for example 'ERCo, Paeds Ward: Pending acceptance, Jane Doe. Open'. Add filter chips (All, Vacant, Pending, Declined) and a department search. Sort departments alphabetically with parents before children.

**5.2 `RoleAssignDrawer.tsx`** (Sheet or Dialog, whichever VERIFY item 6 finds). Props: slot (kind, departmentId or null) and mode (assign, change, end). Internal state: `selectedStaffId` (explicit, never derived from search text) and reason. Staff search uses the same roster query key as Directory. Put eligibility in a pure function `getSlotEligibility(slot, person, context)` in `shared/` with tests:

- every role needs a linked account (`userId`); the institutional administrator invite requires it explicitly;
- ERCo requires an active, linked, eligible nurse in the department (VERIFY the exact server rule and mirror it; the server stays the authority);
- Departmental CPD Coordinator requires active linked staff in the department;
- Deputy ERCo requires an existing primary ERCo; Deputy Head and Deputy CPD Coordinator rules: VERIFY;
- block assigning a person who already holds this exact slot.

UI shows each unmet condition as text before submit. Server errors are displayed verbatim. Use the procedures in Appendix C. After every success, invalidate all register source queries, `getInstitutionIersDutyAssignments`, and the attention-count queries, so Overview and the inbox update.

End flows ask for a reason where the procedure accepts one and show a confirmation sentence. If any end procedure cannot end only the deputy of a slot, STOP: that needs a backend change that is out of scope without CEO approval.

**5.3 Parity gate (before deleting anything).** Fill Appendix C with evidence (test name or screenshot) showing that assign, change and end work through the drawer for all nine slot kinds with the authenticated account on test staff. Only then delete the `assignments` section, the saved-assignments strip, `RoleAssignmentCard` and the old department state from `InstitutionPeopleRolesPanel.tsx`. The Roles view then renders `RoleRegister`, the drawer, and the two collapsed cards from Phase 4.

**5.4 Directory 'Change department' row action.** A dialog with its own state: `moveDepartmentId`, a reason of at least 10 characters, a confirmation sentence ('Move {name} from {current} to {target}'), and disabled when the target equals the current department. It calls `reallocateInstitutionStaffDepartment`. This removes the last use of the old 'Correct this person's roster department' box.

**5.5 Focus support.** `focus=role:<slotKey>` scrolls to and highlights the register cell. It never auto-opens a write action.

**5.6 Inbox additions.** Declined appointments get a 'Reassign' action that navigates (through the builder) to `peopleView=roles&focus=role:<slotKey>`. Pending acceptances show a count linking to Roles with the 'Pending' filter set.

**5.7 Tests.**

- `RoleRegister.test.tsx`: every status including unavailable; filters; both layouts; keyboard operability.
- `RoleAssignDrawer.test.tsx`: explicit selection; eligibility reasons; table-driven submit calling the right mutation with the right arguments for each of the nine slot kinds; verbatim server error; end requires reason; invalidations called.
- `shared/` eligibility tests; Directory 'Change department' tests.
- Run the full `pnpm run test:unit` and `check`.

**5.8 Authenticated verification (record each step).** Test accounts: A (institution admin), B (nurse in department X), C (head of X).

1. A assigns B as ERCo for X: the cell shows Pending acceptance.
2. B accepts through their provider surface: the register shows Active after refetch.
3. In a second trial B declines: Declined appears in the register and in the inbox; Reassign works.
4. A ends the ERCo: the cell returns to Vacant.
5. Assign, change and end for every one of the nine slot kinds.
6. C sees only what VERIFY 1 says, and an assignment outside X fails with the server message shown verbatim.
7. 360 px layout.
8. Make one source query fail (block that request in devtools): its cells show Unavailable, never Vacant.

**5.9 Release and rollback.** Standard release steps. Rollback is a revert of the PR, which restores the nine-card UI; it still works because no procedure changed.

## Phase 6: Directory hardening, cleanup, copy and accessibility

Three separate PRs, in this order. **Migration:** none.

**6a. Directory** (branch `feat/people-directory-hardening`). Client-side pagination at 50 rows. Search by name, email or department. Filter chips: All, No department, No linked account, Retired and unresolved (the existing retired toggle becomes this). Row actions: Staff 360, Change department (5.4), Unlink, Retire, Restore. No per-row queries. VERIFY the `getStaffMembers` row cap (VERIFY 5) and note it in the PR; design for at least 500 rows. Tests: with 600 synthetic rows only 50 are in the DOM, filters combine correctly, retired and unresolved rows keep their restore-or-account-link-required messaging.

**6b. Dead-code removal** (branch `chore/people-access-dead-code`, standalone PR per D8). Candidates: `BulkStaffImport.tsx`, `StaffList.tsx`, `AddStaffForm.tsx`, `RoleManagement.tsx`, plus any state or sections inside `InstitutionPeopleRolesPanel.tsx` made unreachable by Phase 5. For each, prove zero references: grep `client`, `server`, `shared`, `e2e` and `docs` for the name, including `import(`, `lazy(` and string paths; run `pnpm exec tsc --noEmit`. Delete a file only when nothing but its own tests refers to it, and delete those tests with it. Keep `ProviderInstitutionRoleAssignmentsCard` and `InstitutionDepartmentContextCard` (one importer each). Log every deletion and its evidence in WORK\_STATUS.

**6c. Copy and accessibility** (branch `chore/people-access-copy-a11y`).

- Apply the vocabulary of 6.7 across the lane and fix any remaining use of the retired labels. Add a guard test asserting those labels do not appear in the rendered People lane text.
- Replace the `role_map` panel content with a typed constant `AUTHORITY_MAP` ('Who can assign what'). Derive it from `server/lib/institution-role-authority.ts` and cite the function names in a code comment. Add a unit test that every `InstitutionalRoleAuthority` value is represented.
- Accessibility: nav landmarks; focus returns to the originating register cell when the drawer closes; toasts announced through an aria-live region; status never conveyed by colour alone; 44 px touch targets; no horizontal page scroll at 360 px; the highlight ring respects `prefers-reduced-motion`.

## Phase 7: Documentation, end-to-end validation, closure

**Branch:** `docs/people-access-redesign-closeout`. **Migration:** none (record 'No migration required' in WORK\_STATUS).

**7.1 Update the docs.**

- `docs/PEOPLE_ACCESS_DEEP_AUDIT.md`: status 'Implemented, see execution plan'; correct the stale statements (default section, six roles versus nine slot kinds, IA table).
- `docs/institutional/INSTITUTION_ADMINISTRATION_OPERATING_MODEL.md`: the People & access row and the information architecture.
- `docs/PLATFORM_SOURCE_OF_TRUTH.md` (Institution Administration paragraph, about line 983): the five People & access views; add this plan to the document registry if the PSOT rules require it.
- `docs/PLATFORM_CURRENT_STATE.md`: rename the 'People & roles' row to 'People & access' and refresh the file references.
- `docs/INSTITUTIONAL_PORTAL_NAVIGATION_IMPLEMENTATION.md` and `docs/institutional/IERS_NEW_USER_ORIENTATION_GUIDE.md` (step 2 wording).
- `AGENTS.md`: the IERS bullet that still says 'Administration -> People & roles'. AGENTS.md is a high-collision file: follow the shared-file protocol, keep the change minimal and update the 'Last updated' line.

**7.2 Final authenticated validation.** Execute Appendix D on production (or production-equivalent with the CEO) and record routes, roles, states and results in WORK\_STATUS, with an evidence entry for each of S1 to S9.

**7.3 Re-audit.** Compare S1 to S9 and F1 to F12 with what is merged. List residual gaps. Record each deferred item (D6 access history, D7 server pagination, anything found later) as a backlog row.

**7.4 Survival checks** for each phase's key symbols on `origin/main` (Appendix F). **7.5** Log 'CEO sign-off: pending'; per AGENTS.md this does not block merge.

## Working agreements (apply to every PR)

- **One task, one branch, one PR.** Before each task run `git checkout main && git fetch origin main && git merge origin/main --ff-only`, then branch fresh. Never build on another feature branch (see the PR 407 pollution lesson in AGENTS.md). `scripts/verify-branch-base.mjs` and `scripts/pre-merge-check.ps1` are the backstops.
- **Definition of Done** per AGENTS.md: merged on `origin/main` with the merge hash; WORK\_STATUS entry (inserted as the first entry after the header, re-checked immediately before merge); post-implementation audit and a re-audit in the PR body; authenticated pre-merge verification recorded (routes, roles, states, result). 'Sandbox passed' is not Done.
- **Every WORK\_STATUS entry** states what was built, what was deliberately deferred or simplified, known gaps and the exact validation counts. Put the same simplifications in code comments.
- **Contradictions are surfaced plainly** (between code, docs and earlier statements). Do not quietly work around them. Do not declare something missing from 'the docs' after checking only one document.
- **Validation commands:** `pnpm run check` (includes TypeScript, PWA TypeScript, clinical lint and strict audits), `pnpm run test:unit`, `pnpm run build`, and `pnpm exec prettier --check` on new files. Report exact counts. If something fails, test it on a clean `origin/main` before calling it pre-existing.
- **Shared-file collisions:** `drizzle/schema.ts` (not touched by this plan), `docs/WORK_STATUS.md`, `package.json`, `AGENTS.md`. Fetch and diff immediately before editing and again immediately before merging.
- **If you cannot push to origin** (sandbox agent): package only the changed files as a zip. Immediately before zipping, re-fetch `origin/main` and diff your copies of the four high-collision files, because `Expand-Archive -Force` overwrites wholesale. Give the CEO exact PowerShell commands to expand, branch, commit, push and open the PR with `gh pr create`. Keep `.ps1` content ASCII-only (no em dashes). Never assume a manual step succeeded; wait for the CEO to paste the output.
- **After each merge** confirm your change survived: `git show origin/main:<file> | Select-String '<short ASCII string>'` (PowerShell) or `| grep -n` elsewhere.
- **Never write to real production data during verification.** Use a test institution and test staff.
- **Performance:** the Roles view mounts its six queries only while active; the inbox shares cached queries with Overview; no per-row queries anywhere.

## Appendix A: Test matrix

| Phase | Test file | Covers |
| --- | --- | --- |
| 1 | `shared/institution-administration-location.test.ts` | resolver, legacy table, builder, round trip |
| 1 | server notification tests (existing files, updated) | both URLs equal builder output with institutionId and item id |
| 1 | drift guard test | no hand-written `adminTab=` or `peopleTab=` outside the shared file |
| 2 | `InstitutionPeopleRolesPanel.test.tsx` (or hook test) | explicit selection, split department state |
| 3 | `shared/institution-role-register.test.ts` | every status and kind, unavailable propagation |
| 3 | `shared/institution-people-view.test.ts` | default view, checklist tri-state |
| 3 | `shared/institution-administration.test.ts` (updated) | new optional counts |
| 3 | server test for `listDepartmentHeadAppointments` | admin, department head, unrelated user, ended rows, isolation |
| 4 | `PeopleAccessShell.test.tsx`, `PeopleNeedsAttention.test.tsx`, extraction tests, reachability test | views, defaults, legacy URLs, dialogs |
| 5 | `RoleRegister.test.tsx`, `RoleAssignDrawer.test.tsx`, eligibility tests | nine slot kinds assign and end, errors, invalidation |
| 6 | Directory tests, retired-label guard, `AUTHORITY_MAP` test | pagination, vocabulary, authority coverage |

## Appendix B: Reachability (fill in with evidence in each PR)

| # | Capability at 104acd6 | New location | Phase |
| --- | --- | --- | --- |
| 1 | Edit institution details | Overview lane, 'Institution profile' card | 4 |
| 2 | Staff bulk import | Directory, 'Import staff' | 4 |
| 3 | Roster list and search | Directory | 4, 6 |
| 4 | Staff 360 link | Directory row | 4 |
| 5 | Unlink, retire, restore | Directory row via `RosterActionDialogs` | 4 |
| 6 | Mismatch reallocate, mark resolved, retire | Needs attention (`MismatchInbox`) | 4 |
| 7 | Nine role cards | Roles register and drawer | 5 |
| 8 | Saved-assignments strip | Roles register | 5 |
| 9 | Role guide | Roles, 'Who can assign what' | 4, 6 |
| 10 | IERS duties list | Roles, 'Dated duties (ERTL/UTL)' | 4 |
| 11 | Product roles: grant, suspend, reactivate, end | Admins & access, 'Advanced access' | 4 |
| 12 | Shared scopes: grant, suspend, reactivate, end | Admins & access, 'Advanced access' | 4 |
| 13 | Departments & CPD (map labels, add department, pole eligibility) | Departments | 4 |
| 14 | Account admins invite and remove | Admins & access; drawer for the institutional administrator slot | 4, 5 |
| 15 | Pending link requests review and repair | Needs attention | 4 |
| 16 | Change a person's roster department (old box) | Directory row 'Change department' | 5 |
| 17 | Overview attention items | Deep links to views | 4 |
| 18 | BottomNav People shortcut | Default view of the lane | 4 |
| 19 | Notification links (link request, mismatch) | Inbox with focus | 1 |

## Appendix C: The nine slot kinds and their procedures

Procedure names are verified at 104acd6. Entries marked VERIFY need their input schema and behaviour confirmed in the router before coding. Appointee-side acceptance procedures: `respondToDepartmentHeadAssignment`, `respondToEducationCoordinatorAssignment`, `respondToDepartmentResponseCoordinatorAssignment`.

| # | Slot | Scope | Assign | End | Notes and VERIFY |
| --- | --- | --- | --- | --- | --- |
| 1 | Institutional administrator | institution | `institutionAdmins.invite` | `institutionAdmins.remove` | needs `userId`; no in-place change (remove then invite) |
| 2 | Institutional Emergency Response Coordinator | institution | `institutionProducts.grantProductRole` (productKey iers, roleKey iers\_coordinator) | `institutionProducts.setProductRoleStatus` (ended) | VERIFY role list shape |
| 3 | Institutional CPD Coordinator | institution | `grantProductRole` (cpd\_portal, cpd\_coordinator) | `setProductRoleStatus` (ended) | VERIFY |
| 4 | Departmental Head | department | `institutionAccountability.assignDepartmentHead` | `institutionAccountability.endDepartmentHead` | does assign replace the incumbent? |
| 5 | Deputy Departmental Head | department | `assignDepartmentHead` (deputy variant) | `endDepartmentHead` | VERIFY deputy input and whether end handles the deputy alone |
| 6 | ERCo | department | `institution.assignDepartmentResponseCoordinator` | `institution.endDepartmentResponseCoordinatorAssignment` | VERIFY replacement semantics |
| 7 | Deputy ERCo | department | `assignDepartmentResponseCoordinator` (deputy variant; the current UI needs the primary ERCo's `providerUserId`) | `endDepartmentResponseCoordinatorAssignment` | VERIFY, and resolve Q1 (assistant versus deputy) |
| 8 | Departmental CPD Coordinator | department | `institutionLearning.assignEducationCoordinator` | `institutionLearning.endEducationCoordinator` | VERIFY |
| 9 | Deputy Departmental CPD Coordinator | department | `assignEducationCoordinator` (deputy variant) | `endEducationCoordinator` | VERIFY deputy handling |

Add two columns in the PR: 'Change works (evidence)' and 'Assign and End verified (evidence)'.

## Appendix D: Authenticated validation

**Legacy URLs that must resolve.** (1) `/institution?section=administration` (2) `/institution/administration` (redirect) (3) `/institution?section=administration&adminTab=access_links` (4) `/institution?section=administration&adminTab=people_roles&departmentId=1&providerUserId=2&mismatchReportId=3` (5) `...&adminTab=institution&peopleTab=people_access` (6) `...&peopleTab=departments` (7) `...&peopleTab=access_links` (8) `...&peopleTab=staff_import` (9) `...&peopleTab=institution`.

**Role matrix.** Run the scenarios of Phases 4 and 5 for each of: platform admin (if relevant), institution admin, admin of two institutions, department head, ERCo, institutional CPD coordinator, ordinary linked staff, unlinked user.

| Check | Expected |
| --- | --- |
| Ordinary linked staff open the Administration lane | per VERIFY 1; record what they see and that no write is offered or that the server refuses it |
| Department head opens Roles | sees only their department; an assignment outside it fails with the server message, shown verbatim |
| Two-institution admin clicks each notification | lands in the institution named in the URL |
| One source query fails | affected cells show Unavailable, counts show 'Could not load', nothing shows as vacant or zero |
| 360 px | no horizontal page scroll; People shortcut clears the bottom nav |

## Appendix E: Risks and scope

| Risk | Mitigation |
| --- | --- |
| R1 Parallel agents edit `InstitutionPeopleRolesPanel.tsx` | fetch and merge before every edit; keep per-phase diffs small; coordinate in WORK\_STATUS |
| R2 Stored notification URLs use old parameters | resolver keeps the legacy table forever; no data migration |
| R3 Failed query rendered as vacant or zero | `Unavailable` type and tests in Phase 3 and 4 |
| R4 Department-scoped viewers see partial data | VERIFY 1; register tolerates partial rows; server stays the authority |
| R5 Deputy semantics differ per procedure | Appendix C VERIFY column; STOP if a deputy cannot be ended alone |
| R6 Mobile regressions | 360 px checks in Phases 4, 5, 6 |
| R7 Something becomes unreachable | Appendix B per PR; Phase 5 parity gate before deletions |
| R8 Query fan-out slows the lane | lazy mounting, shared query keys, `staleTime` |

**Out of scope:** any schema change; new roles or changed authority rules; IERS dated-duty UX; Products & billing; ILS; the platform-admin navigation; access history (D6); server-side pagination (D7). If one of these appears necessary, STOP and ask.

## Appendix F: Commands

- Sync and branch: `git checkout main && git fetch origin main && git merge origin/main --ff-only && git checkout -b <branch>`
- Re-verify findings:
  - `grep -rnE "adminTab=|peopleTab=" server client/src shared --include=*.ts --include=*.tsx`
  - `grep -n "assignmentDepartmentId\|selectedAssignmentStaff" client/src/components/InstitutionPeopleRolesPanel.tsx`
  - `grep -rn "PEOPLE_JOURNEY_STEPS" client/src`
  - `grep -rn "listDepartmentHeads" server client/src`
  - `grep -rnE "BulkStaffImport|StaffList|AddStaffForm|RoleManagement" client server shared e2e`
- Validate: `pnpm run check`, `pnpm run test:unit`, `pnpm run build`, then `.\scripts\pre-merge-check.ps1`.
- Authorization suite (when server routers change): `IERS_STAGING_ENABLE=1 IERS_STAGING_DATABASE_URL=<disposable-local-url> DATABASE_URL=<disposable-local-url> pnpm run test:iers-provider-auth:staging`.
- Survival after merge (PowerShell): `git show origin/main:shared/institution-administration-location.ts | Select-String 'resolveAdministrationLocation'`, and the same for `buildRoleRegister`, `listDepartmentHeadAppointments`, `PeopleAccessShell`, `RoleAssignDrawer`.
