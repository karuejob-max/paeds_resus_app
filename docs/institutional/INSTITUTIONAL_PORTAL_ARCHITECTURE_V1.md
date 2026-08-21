# Institutional Portal Architecture Contract V1

**Status:** Build contract  
**Scope:** Institutional Platform, IERS, CPD Portal, Administration, and Connected Services  
**Effective from:** 21 August 2026

## 1. Product model

The institutional platform has one institution account with independently entitled products:

| Product key | Product | Institutional job |
|---|---|---|
| `iers` | Institutional Emergency Readiness System | Practical competency, team response, emergency operations, institutional learning, evidence, and improvement. |
| `cpd_portal` | CPD Portal | Staff professional-development activity, performance, certificates, points, and decision intelligence. |
| `admin` | Administration | Institution identity, people, roles, billing, subscriptions, exports, notifications, support, and recovery. |
| `connected_services` | Connected Services | Managed home for adjacent or transitional products that do not yet fit IERS or CPD Portal. |

Do not create separate institution accounts for IERS and CPD Portal. Product access is granted to the same institution account through product subscriptions and entitlements.

## 2. Product ownership rules

### IERS owns

Activations, responder acknowledgement and arrival, ERT and shift readiness, BLS/ACLS/PALS/NRP institutional competency operations, equipment and crash-cart audits, drills and debriefs, criterion-level evidence, owned actions, Care Signal, Code Signal, clinical incidents, ResusGPS adoption, guideline audit, AI pattern review, implementation milestones, and IERS reports.

### CPD Portal owns

CPD sessions, attendance, QR registration, presenters, cadres, departments, approving councils, CPD points, CPD certificates, staff development records, professional-development performance, CPD analytics, exports, and CPD coordinator settings.

### Administration owns

Institution profile, departments and people directory, provider memberships, account admins, invites, recovery, billing, quotations, contracts, product subscriptions, renewal, exports, notifications, support, and the shared audit log.

### Connected Services owns temporarily

Safe Truth, legacy ROI tools, generic resources, unfinished notification surfaces, unowned analytics, and other useful capabilities that are not yet safe to classify as IERS or CPD. Every Connected Service must have an owner, privacy class, lifecycle status, entitlement key, route, and next decision date.

## 3. Navigation contract

The target institutional navigation is:

```text
Institution Workspace
├── Home
├── IERS
│   ├── Command Centre
│   ├── Team & Shift Readiness
│   ├── Competency & Training
│   ├── Equipment & Physical Readiness
│   ├── Drills & Improvement
│   ├── Evidence & Certification
│   └── IERS Reports
├── CPD Portal
│   ├── CPD Overview
│   ├── Sessions & Attendance
│   ├── Staff Development
│   ├── CPD Certificates
│   └── CPD Reports
├── Administration
│   ├── Institution Profile
│   ├── People & Roles
│   ├── Billing & Subscription
│   ├── Data & Exports
│   └── Notifications, Support & Recovery
└── Connected Services
```

Legacy routes must redirect rather than disappear. The existing large dashboard remains a compatibility shell until the product routes are extracted.

## 4. Entitlement contract

Product access is evaluated server-side in this order:

```text
authenticated user
  → institution relationship / provider membership
  → product subscription and entitlement
  → product-specific role and capability
  → operation
```

The frontend may hide or explain unavailable areas, but it is never the security boundary.

Every product operation must identify its capability class:

- `read` — view product data;
- `operate` — perform an operational task;
- `review` — review evidence, QI, attendance, or development records;
- `govern` — change institutional configuration or make certification decisions;
- `commercial` — manage subscriptions, billing, quotes, or contracts.

## 5. Renewal-state contract

| State | IERS | CPD Portal | Administration |
|---|---|---|---|
| `active` | Full access | Full access | Full access |
| `trial` | Full access with end date | Full access with end date | Renewal/activation controls |
| `grace` | Full access with visible renewal warning | Full access with visible renewal warning | Billing and renewal controls |
| `past_due` | Active emergency operations, timeline, debrief, and export remain available | History and export remain available; new sessions may be restricted by policy | Renewal, support, and export remain available |
| `expired` | Preserve historical read/export and active-event continuity; block only new product setup after policy threshold | Preserve history, certificates, and export; block new paid setup after policy threshold | Renewal, recovery, export, and support remain available |
| `suspended` | Explicit reason, preserved data, governed read/export, and emergency continuity policy | Explicit reason, preserved data, and export | Appeal, support, and audit trail |
| `cancelled` | Retain according to policy and provide export | Retain according to policy and provide export | Close-out and reactivation path |
| `legacy_unclassified` | Preserve current continuity during a time-limited review | Preserve current continuity during a time-limited review | Require product mapping and review owner |
| `not_subscribed` | Explain product and show activation/quote path | Explain product and show activation/quote path | Account, recovery, and commercial access remain available |

Payment or renewal state must never silently stop recording or closing an active IERS event.

## 6. Administrative role contract

Shared account administration and product-specific roles are separate concerns.

| Role | Shared admin | IERS | CPD Portal |
|---|---|---|---|
| Institution owner/admin | Full | Full institutional governance | Full CPD administration |
| Executive sponsor | Commercial and strategic approval | View/approve readiness decisions | View/approve development priorities |
| Finance officer | Billing, contracts, renewal, exports | No clinical write access | No CPD write access |
| Institution coordinator | Organisation setup and milestones | Coordinate IERS rollout | Optional CPD coordination if assigned |
| Clinical governance/QI lead | Relevant configuration | Evidence, incidents, drills, actions, guidelines, AI review | No default write access |
| ERT/UTL/ERTL | People/structure as allowed | Roster, shift, activation, drill, and response operations | No default write access |
| CPD coordinator | People access as allowed | No default IERS governance | Sessions, attendance, points, certificates, reports |
| Report viewer | Approved exports | IERS reports | CPD reports |
| Provider/member | Own identity and assigned tasks | Provider responsibility and evidence operations | Own CPD record or assigned CPD operations |

The system must preserve the minimum-two-admin continuity rule.

## 7. Data separation and cross-links

A staff member has one shared institutional identity, but product records retain product meaning. An IERS competency completion is not automatically a CPD attendance record. A CPD certificate is not an IERS readiness certificate. A drill can be linked to a CPD recommendation only through an explicit governed mapping; it must not silently create CPD points.

Cross-product recommendations are allowed. Cross-product data mutation is not allowed without an explicit product rule and audit record.

## 8. Legacy transition rules

The restructuring must preserve:

- existing institution IDs and staff identities;
- IERS activation, evidence, action, drill, and milestone records;
- CPD events, attendees, points, certificates, and coordinator settings;
- account admins, invitations, recovery, quotes, contracts, and payment history;
- legacy deep links for one documented deprecation period.

No current capability may be deleted merely because it lacks a final product home. It must be registered in Connected Services with a decision owner and review date.

Existing institutions must not be silently granted or denied a paid product. They should be migrated to `legacy_unclassified` or an explicitly verified product state with an owner and review date.

## 9. Release gates

The portal restructuring is not ready for release until:

1. Every route, component, router procedure, and relevant table has a product owner and transition state.
2. Server-side tests prove IERS-only, CPD-only, both, neither, grace, expired, suspended, and legacy-unclassified behaviour.
3. Tenant isolation is proven for admins, providers, reviewers, and exports.
4. Active IERS events remain operable through billing failure or expiry.
5. Provider tasks remain available in the provider platform.
6. CPD records remain separate from IERS competency and evidence.
7. Finance, CPD, IERS, QI, accreditation, and account-admin permissions are independently testable.
8. IERS and CPD exports are product-filtered and portable.
9. No placeholder report, ROI, billing, upgrade, or accreditation control is presented as operational.
10. Legacy routes redirect safely and rollback/read-only behaviour is documented.

## 10. Canonical implementation sequence

Implement in this order:

1. Product registry and capability map.
2. Product plans, subscriptions, entitlements, and audit events.
3. Server-side entitlement and permission enforcement.
4. Shared Institution Workspace and Administration shell.
5. IERS route extraction and terminology cleanup.
6. CPD Portal route extraction and staff-development relocation.
7. Billing, renewal, exports, recovery, and administrative controls.
8. Connected Services registry and transitional routes.
9. Legacy migration and redirects.
10. Entitlement, tenant-isolation, renewal, emergency-continuity, and pilot validation.

This contract is the source of truth for the implementation. Future agents must read it before changing institutional navigation, subscriptions, product permissions, or cross-product data behaviour.
