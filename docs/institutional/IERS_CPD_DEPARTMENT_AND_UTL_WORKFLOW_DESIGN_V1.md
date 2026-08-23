# IERS and CPD Department, Navigation, and ERCo-UTL Workflow Design V1

**Status:** Approved for implementation on a protected feature branch

**Scope:** Institutional department governance, CPD `Other` traceability, compact portal navigation, and explicit ERCo-owned UTL staffing.

## 1. Core decisions

The institutional administrator may add one genuine local department from Administration. The new row becomes an institution-scoped canonical `facility_departments` identity and is available to future CPD registration, linked staff records, provider department matching, and IERS setup. It defaults to CPD/reporting-only (`requiresPole=false`); no department is made IERS operational by catalog membership or attendance frequency.

Existing preset labels remain the preferred source. The custom `Other` path remains available only when the local department is genuinely absent from the shared catalog. The add action must not deactivate or rename unrelated departments and must use the existing active-and-confirmed department contract.

Historical CPD rows are never rewritten. The application may attach `facilityDepartmentId` through the existing reviewed backfill workflow and may display the canonical name beside the recorded text, but the original `cpdAttendees.department` value remains immutable for audit and reporting compatibility.

## 2. `Other` registration traceability

Administration receives an institution-scoped report of CPD attendance rows whose recorded department is custom/unmatched or whose canonical identity is still missing. Each row includes the attendee name, email, phone, cadre, cadre detail, recorded department label, event name/date, submitted time, attendance type, and current canonical identity status. The report is paginated or bounded to protect the mobile UI and query cost.

The report is a review surface, not an automatic mapper. Administrators can use it to identify whether a person belongs to a department that should be added, whether the label was entered incorrectly, or whether the attendee was external/locum. The report must not expose attendees from another institution and must retain the institution product-access and account-scope checks already used by Administration and CPD.

## 3. Future CPD selection behavior

The public CPD registration payload already returns the active institution department registry. Newly added departments therefore appear in the registration dropdown after the institution refreshes the registration page. When a selected department ID is supplied, the server revalidates that the ID belongs to the institution and resolves the canonical label server-side. The public form must not require users to type a custom label when an institution department list exists.

If no active institution department list exists, the shared catalog selector remains available. A custom registration in that fallback path is retained as historical text and enters reconciliation review; it is never silently promoted to a canonical department.

## 4. Compact navigation

The top-level Institution Workspace remains divided into Overview, IERS, CPD Portal, Administration, and Connected Services. Within CPD, the existing sub-tabs become a persistent compact navigation strip with URL state (`cpdTab`) so a direct link opens Overview & Analytics, Sessions & Check-In, Staff Development, Certificates & Exports, Open New Session, or Coordinator & Settings without a long scroll.

Within IERS workforce, the currently stacked Department and pole setup, ERCo governance, ERT roster/UTL staffing, and equipment audit cards become nested tabs. The selected workforce tab is URL-addressable (`iersTab=workforce&workforceTab=...`) and the tab strip remains visible while scrolling. This preserves the existing product-level IERS tabs while making the frequently used workforce objects directly reachable on mobile.

No gesture or automatic navigation is required for this slice. Navigation state must remain accessible by buttons and direct links, and changing tabs must not discard unsaved mutation state without an explicit save.

## 5. ERCo-owned UTL workflow

Step 2 remains pole allocation. Step 3 must list every active, confirmed, `requiresPole=true` department assigned to the selected pole. It must not infer a department from a provider’s profile and must not silently omit a pole department because no provider is currently linked.

The misleading `Autopopulate monthly UTL` action is replaced by explicit wording: **Prepare monthly UTL roster**. It creates or updates monthly source rows only from administrator/ERCo-selected assignments. It must not choose the first linked provider automatically.

An accepted active ERCo for a department may prepare that department’s monthly UTL roster. IERS governance roles may manage the full institution setup. A non-governance provider without accepted ERCo duty cannot write another department’s rota. The existing provider-owned acceptance requirement remains: a saved monthly or dated shift assignment is pending until the named provider accepts it in the provider portal.

The ERCo workflow has two levels:

1. **Monthly source selection:** The ERCo selects a nurse/provider for the department and month, or deliberately leaves the department unassigned. The system then creates or refreshes dated shift rows with monthly provenance. It does not claim that the person will actually be on every shift.
2. **Specific shift confirmation:** For each selected date and shift, the ERCo chooses the nurse who will actually be on duty. Saving the shift creates or updates the dated provider-owned UTL assignment and resets acceptance/readiness when the named provider changes.

The candidate list is populated from active institutional staff with `staffRole=nurse` and the department’s canonical identity. It also includes linked active provider members whose current profile department matches the canonical department. Duplicate users are deduplicated by user identity.

A manually added nurse with no platform user account can be stored as an institutional staff candidate and shown with **Needs account/link before assignment**. The application must not place a null or unverified person into `shift_utl_rosters`, because that table is provider-owned and requires a real active institution member who can accept the duty. The UI should direct the administrator to invite or link the nurse, then refresh the candidate list.

## 6. Safety and rollout boundaries

No patient identifiers, emergency activation, pilot drill, or production smoke data are involved. No production database migration is expected for this slice if existing department, staff, monthly rota, and shift roster tables are reused. If implementation reveals that an append-only UTL change history or explicit staff-link status cannot be represented safely with existing columns, stop and reserve a new migration before schema changes.

The release is code-only unless that decision changes. It still requires a protected branch, focused tests, TypeScript, clinical lint, production build, CI, Render deployment, and a phone-width walkthrough. Production department additions, staff additions, roster assignments, and backfills remain administrator-initiated actions and must not be executed as deployment smoke tests.
