# P0-3 Role Access Matrix

**Task:** P0-3  
**Owner:** Job (product/clinical validation), Cursor (technical mapping support)  
**Start:** 2026-04-14  
**Target complete:** 2026-04-16

---

## 1) Scope

This matrix controls three dimensions:

- UI visibility
- Route/page access
- API/procedure access

Roles in scope:

- `provider`
- `parent`
- `institutional`
- `instructor`
- `admin`

---

## 2) Conditional access rules (locked)

- `instructor` privileges require platform-approved instructor state.
- `admin` actions require backend authorization (`role === 'admin'`).
- Context switch in UI does not bypass backend authorization.
- Combined identity scenarios (e.g. provider + instructor) must be represented with explicit conditional notes.

---

## 3) Route inventory and decisions

| Surface/Route family | Provider | Parent | Institutional | Instructor | Admin | Notes |
|---|---|---|---|---|---|---|
| `/home` provider dashboard | Allow | Deny | Deny | Allow (as provider) | Allow | Parent/institutional must not land here by default |
| `/fellowship` + micro-course surfaces | Allow | Deny | Deny | Allow | Allow | Instructor access only in provider context |
| `/resus` | Allow | Scoped allow (parent-safe mode only if defined) | Allow | Allow | Allow | Must not expose disallowed clinical/professional controls to parent |
| `/parent-safe-truth` | Deny | Allow | Deny | Deny | Allow | Parent-first surface |
| `/hospital-admin-dashboard` (legacy `/institutional-portal` redirect) | Deny | Deny | Allow | Conditional | Allow | Instructor conditional if assigned by institution |
| `/instructor-portal` | Conditional | Deny | Deny | Allow | Allow | Strict guard: approved instructor only |
| `/admin` and admin reports | Deny | Deny | Deny | Deny | Allow | Backend deny must hold even if route guessed |

---

## 4) API family decisions

| API family | Provider | Parent | Institutional | Instructor | Admin | Notes |
|---|---|---|---|---|---|---|
| `auth.*` | Allow | Allow | Allow | Allow | Allow | Role-neutral auth procedures |
| `learning.*` | Allow | Deny (unless explicitly parent-safe) | Conditional | Allow | Allow | Scope by enrolled/authorized user |
| `enrollment.*` | Allow | Deny | Conditional | Allow | Allow | Parent should not access provider enrollments |
| `mpesa.*` learner operations | Allow | Deny | Conditional | Allow | Allow | Admin reconciliation remains admin-only |
| `instructor.*` | Deny | Deny | Deny | Allow | Allow | Instructor guard + admin override |
| `institution.*` | Deny | Deny | Allow | Conditional | Allow | Institutional tenancy constraints required |
| `adminStats.*`, admin ops | Deny | Deny | Deny | Deny | Allow | Security-critical |

---

## 5) Required inventory counts (to fill during execution)

- Baseline route count from `client/src/App.tsx`: **66** route declarations (to be normalized into auditable unique route patterns).
- Baseline API surface count from `server/routers.ts`: **87** top-level router keys + **8** auth sub-procedures.
- Total conditional rules documented: `TBD` (must include all cross-role and tenancy conditions).

Cross-role scenario policy:

- Provider + Instructor: allowed when instructor approval criteria are met; provider capabilities remain available.
- Provider + Admin: allowed for owner/admin accounts; admin endpoints still require backend admin authorization.
- Institutional + Instructor: only where explicit assignment/tenancy rule allows and is documented in notes column.

Tenancy rule (institutional):

- Institutional users can only access institution-scoped staff, schedules, and reporting data belonging to their own institution context.

---

## 6) Exit criteria

- Full route and API inventory completed
- Every route/API has explicit allow/deny by role
- Conditional rules documented and testable
- Job clinical/product validation recorded
