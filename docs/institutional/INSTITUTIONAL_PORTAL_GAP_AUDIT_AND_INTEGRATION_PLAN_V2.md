# Institutional Portal Gap Audit and Integration Plan V2

**Product:** Paeds Resus Institutional Platform  
**Audit date:** 22 August 2026 (EAT)  
**Audited production/application baseline:** `main` at `47cfc63`  
**Purpose:** Verify the remaining gaps against the original Institutional Portal Architecture Audit and define the safest integration order before the first IERS pilot drill.

## Executive decision

The new institutional workspace is a valid product shell, not yet the complete institutional platform described in the original architecture contract. The high-value product split is present: one institutional account now exposes **IERS**, **CPD Portal**, shared **Administration**, and **Connected Services**, with independent product subscriptions and server-side product capability checks. Production migration `0100` is applied, the 22-check verifier passes, and the live IERS-only, CPD-only, and dual-product scenarios were verified for the approved test institution.

The remaining work is not a reason to rebuild the portal. It is a reason to complete a controlled extraction of mature legacy workflows, add the missing product-role layer, and replace transitional commercial and Connected Services behaviour with authoritative, testable systems. The correct implementation strategy is **wrap, classify, gate, test, then retire compatibility surfaces**.

> The first pilot drill should not be delayed for every planned commercial or portfolio feature. It should be treated as a bounded clinical-operational acceptance test, not as proof that the entire institutional product is complete. It must proceed only after the pre-drill safety gates in this document are confirmed.

## 1. Audit method and governing rules

This review compared the original audit and restructuring plan with the current architecture contract, the production handoff, the current `/institution` workspace, the legacy compatibility dashboard, the institutional routers, and the product-entitlement migration. The governing rule is that frontend navigation is not a security boundary: every institutional operation must pass tenant access, product entitlement, product-specific permission, and operation checks in that order [1] [2].

The audit also preserves the platform’s clinical guardrails. IERS operational continuity must survive renewal failure; CPD attendance must not silently become IERS competency evidence; Safe Truth must remain privacy-bounded and accountless for parent submissions; AI findings must remain advisory and human-reviewed; and no internal score may be marketed as an official AHA credential or external accreditation [2] [3].

## 2. Current state at a glance

| Area | Current state | Assessment | Decision |
|---|---|---|---|
| Institution Workspace | `/institution` shell with Overview, IERS, CPD Portal, Administration, and Connected Services | **Complete foundation** | Keep as the canonical shell. Add deeper route/deep-link behaviour later. |
| IERS command and readiness core | Activation, evidence/actions, drills/debriefs, competency widgets, ERT/equipment, implementation plan, executive snapshot | **Substantially present** | Use for the pilot. Complete provider and action-closure acceptance evidence. |
| IERS competency operations | Cohort progress and proof review are present, but institutional schedule/attendance remains in the legacy dashboard | **Partial** | Move the existing schedule and attendance workflow into IERS Competency & Training without rewriting its data model first. |
| IERS QI and governance | Core IERS actions exist; the richer legacy action log, facility gap analysis, incidents, guideline audit, AI pattern inbox, and ResusGPS adoption audit are not all surfaced in the new workspace | **Partial** | Consolidate under IERS QI and Clinical Governance in controlled slices. |
| CPD Portal | Mature `CpdPanel` with sessions, attendance/check-in, staff development, certificates/exports, analytics, and coordinator settings | **Mostly present** | Add product-role enforcement and provider/self-service boundaries; do not rewrite the mature workflows. |
| Administration | Profile, people/roles, memberships, account admins, link requests, staff import, product access, contracts, support, notifications, and recovery widgets are composed | **Partial** | Add real export, organisation setup, role scopes, renewal state detail, retention, and audit visibility. |
| Product entitlement control plane | Product, plan, subscription, entitlement, role, subscription-event, and audit tables exist; product capability checks are enforced in IERS and CPD routers | **Partial but operational** | Add product-role permission enforcement, negative tests, richer state policies, and a payment/contract source-of-truth workflow. |
| Connected Services | Visible in the new workspace, but the server returns a hard-coded service list | **Transitional** | Persist the registry with owner, privacy class, lifecycle, entitlement, and next decision date. |
| Legacy transition | `/institutional-portal` redirects to `/institution`; `/hospital-admin-dashboard` remains a live compatibility route | **Partial** | Preserve legacy access temporarily, but add explicit tab/deep-link mapping and a deprecation schedule. |
| Commercial operations | Manual platform-admin subscription override with audit events; contracts and quotations remain separate reads; renewal is a mailto flow | **Partial** | Do not treat the current override as a billing system. Link quotes/contracts/payments to product subscriptions before automating renewal. |
| Pilot readiness | Production schema and subscription scenarios verified | **Not yet clinically accepted** | Complete the labelled provider-driven drill and document evidence, action closure, and executive snapshot. |

## 3. What the original audit required and what remains

### 3.1 Product registry and capability map

The product catalog and capability tables are now real and seeded for IERS, CPD Portal, and Connected Services. The migration includes capability classes such as `read`, `operate`, `review`, and `govern`, plus renewal policies such as `operational_continuity` and `read_only` [4]. This is an important foundation.

What is still missing is the **complete capability-to-procedure and capability-to-route inventory** promised by the audit. Many mature procedures still live in the shared `institution` router and use only `assertInstitutionAccess`, particularly training schedules, attendance, quotations, contracts, performance, and parts of the institutional action-log workflow. Without a maintained procedure registry, new work can continue to bypass the product boundary.

**Integration decision:** Create a versioned capability registry that maps each institutional route, component, tRPC procedure, table family, capability class, product owner, renewal policy, and required product role. Treat it as a release artifact and test fixture, not merely documentation.

### 3.2 Entitlements and renewal states

The server-side entitlement evaluator supports the required subscription states and can resolve full, read-only, operational-continuity, or blocked modes. IERS and CPD procedures now call the evaluator for their registered capabilities [5] [6]. Production migration `0100` created the product control-plane tables and seeded temporary `legacy_unclassified` continuity for existing institutions [4].

The gap is that entitlement is not yet the same as **permission**. The schema contains `institutionProductRoles`, but there is no operational product-role assignment router or `assertProductPermission` layer in the current implementation. An institution administrator check is therefore still doing more work than the architecture contract intended. The system also needs explicit negative tests for every important product operation in IERS-only, CPD-only, neither, grace, past_due, expired, suspended, cancelled, and legacy-unclassified states.

**Integration decision:** Add product-role enforcement after tenant access and entitlement checks. Keep institution owner/admin as the continuity authority, but assign narrower IERS and CPD roles to operational users. Do not remove the current admin path until the replacement role matrix has passed tenant-isolation and emergency-continuity tests.

### 3.3 IERS competency and training

The new workspace has an IERS Competency & Training tab, but it currently renders cohort progress and phase-one proof review. The mature institutional schedule and attendance workflow remains in `HospitalAdminDashboard.tsx`: create, edit, cancel, and delete sessions; select BLS/ACLS/PALS/Fellowship; assign an approved instructor; set capacity; register staff; and mark attendance [7]. The current interface explicitly acknowledges that multi-day course dates and cross-midnight sessions are not modelled yet.

This is a **real workflow**, not a missing concept. Rebuilding it would create unnecessary migration and data risk. The problem is product placement, gating, and semantic clarity. Institutional BLS/ACLS/PALS/NRP operations belong to IERS Competency & Training. They must not be labelled CPD activity, and an IERS competency completion must not silently create CPD attendance or points [2].

**Integration decision:** First wrap the existing schedule/attendance procedures in an IERS Competency & Training panel and gate them with `iers.competency_training.operate`. Preserve the existing `trainingSchedules` and `trainingAttendance` rows. Add multi-day `endsAt` only as a separate, validated follow-up migration; do not overload the current location field indefinitely once the workflow is moved.

### 3.4 IERS QI, evidence, and governance

The new IERS Evidence & actions panel covers the newer evidence and action model. The legacy dashboard still contains a richer institutional action-log workflow that links Care Signal and Code Signal events, requires a documented system change before completion, mirrors action data into `iersActionItems`, and provides facility gap analysis with an anonymisation threshold of five [8]. This means the platform has valuable QI logic, but it currently has two representations that can drift.

The new workspace also does not yet expose every IERS governance surface named in the architecture contract. Guideline audit, AI pattern review, clinical incidents, ResusGPS adoption audit, and the richer Care/Code Signal institutional feeds remain legacy or transitional surfaces rather than a clearly labelled IERS Clinical Governance/QI area.

**Integration decision:** Make `iersActionItems` the long-term canonical action record, preserve the older institutional action log as a compatibility read/write adapter during migration, and retain explicit Care Signal/Code Signal source references. Add owner, due date, closure evidence, reviewer, and dual-control checks before declaring action closure complete. Then extract the remaining governance views into IERS QI and Clinical Governance with explicit labels that AI is advisory and evidence review is human-led.

### 3.5 CPD Portal

CPD is the most mature part of the new product split. The current `CpdPanel` contains the primary CPD overview, sessions/check-in, staff development, certificates/exports, session creation, and coordinator/settings surfaces [9]. This meets most of the audit’s functional CPD target without a destructive rewrite.

The remaining gap is **role depth and data-boundary precision**. Current procedures are product-entitlement gated but are not yet consistently restricted to CPD coordinator, CPD reviewer, report viewer, or staff self-service scopes. The product also needs explicit tests proving that IERS competency records, drills, and evidence do not become CPD points or attendance unless a governed mapping is created.

**Integration decision:** Keep the CPD UI and data model stable. Add product-role checks, staff self-service rules where appropriate, disputed-attendance review, export permissions, and cross-product link records that preserve separate source meanings.

### 3.6 Administration and billing

The new Administration panel correctly groups people/profile, billing/renewal, and data/support/recovery. It composes real widgets for institution details, people and IERS responsibility assignments, account admins, pending link requests, staff import, product access, contracts, support, and notifications [10].

It does not yet provide the full administrative control plane described by the audit. The data/export area mainly links back to product surfaces rather than providing a central product-filtered export centre. Organisation setup and department management are not a dedicated control. Finance, CPD, IERS, QI, accreditation, and account-admin scopes are not independently assignable through the new product-role table. Subscription changes are still manual platform-admin overrides; quotations, contracts, payments, and product entitlements are not an authoritative linked commercial ledger. Notifications and recovery surfaces require a clear distinction between functional controls and transitional or coming-soon controls.

**Integration decision:** Implement exports and role scopes before payment automation. Then connect quotation, contract, purchase order, payment confirmation, renewal, grace, suspension, and cancellation events to the subscription ledger. Maintain the IERS emergency continuity carve-out throughout.

### 3.7 Connected Services and Safe Truth

Connected Services now prevents adjacent products from disappearing, but the registry is currently a hard-coded server constant containing Safe Truth, Care/Code Signal, Training & certification, and the legacy dashboard [11]. It does not yet satisfy the contract’s requirement for persisted owner, privacy class, lifecycle status, entitlement key, route, review date, and next decision date.

Safe Truth requires particular caution. The institutional Safe Truth panel is already a substantive analytics surface, but the global platform source of truth states that parent/guardian Safe Truth submissions must become accountless and privacy-bounded [3]. Institutional analytics should therefore consume an anonymised, governed aggregation rather than expose raw family submissions or imply that Safe Truth is an IERS or CPD feature.

**Integration decision:** Add a persisted Connected Services registry and retain Safe Truth as a governed service until its privacy, data-use, and commercial contract are approved. Keep Care Signal and Code Signal linked to IERS QI through explicit references, not duplicated patient-identifying evidence.

### 3.8 Legacy routes and honest UI

The old `/hospital-admin-dashboard` remains live and is still the only place for some mature workflows. `/institutional-portal` redirects to `/institution`, but old dashboard tabs are not yet separate product routes with preserved, explicit deep-link mappings [12]. This is acceptable as a compatibility stage, but it is not the final navigation contract.

The old dashboard also retains mixed labels such as **CPD & Training**, **Institutional Reports**, and **Quotations & Billing**. Any visible legacy control that is not operational must be labelled as compatibility, transitional, or coming soon. ROI and pricing tools must support sales/quotation work and must never grant access or present assumptions as measured impact.

**Integration decision:** Maintain the compatibility route until the extracted workflows pass their own smoke tests. Add a mapping table and deprecation date for each old tab. Do not delete old data or routes before exports and rollback/read-only behaviour are tested.

## 4. Prioritised integration roadmap

The roadmap is deliberately staged so the team does not delay the clinical pilot while attempting to finish every commercial and portfolio feature at once.

| Priority | Work package | Main integration target | Why now | Exit evidence |
|---|---|---|---|---|
| **P0 — before or during pilot** | Provider responsibility and emergency loop | Provider platform ↔ IERS activation, membership, acknowledgement, response, arrival, timeline, debrief | This is the core clinical value and the definition of true IERS completion | One labelled drill with linked provider, persisted timeline, institution monitoring, debrief, evidence, and verified action closure. |
| **P0 — before claiming production readiness** | Renewal continuity and action integrity | IERS capability policies, active-event continuity, action/evidence dual control | Billing or single-user closure must never erase emergency evidence | Automated tests for past_due/expired continuity; reviewer different from submitter; executive snapshot reflects real data. |
| **P1** | IERS competency extraction | Legacy training schedule/attendance → IERS Competency & Training | A real workflow is still hidden in the old mixed dashboard | Create/edit/attendance smoke tests; no CPD mutation; approved instructor check; old tab remains compatible. |
| **P1** | IERS QI/governance extraction | Legacy action log, facility gap analysis, incidents, guideline audit, AI review, ResusGPS adoption → IERS QI and Clinical Governance | Prevent duplicate action records and keep system learning visible | One canonical action record; source links preserved; anonymisation threshold retained; human review and closure audit. |
| **P1** | Product-role authorization | `institutionProductRoles` + `assertProductPermission` | Entitlement alone does not answer who may operate, review, govern, or export | Negative tests for finance, CPD, IERS, QI, accreditation, report viewer, provider, and cross-tenant access. |
| **P1** | Export and recovery centre | Product-filtered IERS/CPD exports, retention, deletion/legal hold, recovery | Portability and safe offboarding are lock-in protections and operational necessities | Separate IERS and CPD exports; no cross-tenant data; documented retention and cancellation behaviour. |
| **P1** | Commercial subscription ledger | Quotes/contracts/payments → product subscriptions and renewal events | Manual override is not a defensible recurring billing system | Every entitlement change has a source reference, effective dates, actor/system, and event history; M-Pesa integration is tested separately. |
| **P1** | Notification and renewal workflow | Grace/past_due/expiry notices; emergency channel limitation disclosure | Users need actionable renewal and delivery expectations | Persistent preferences/delivery history; no claim of guaranteed telecom dispatch; IERS emergency fallback remains local phone/radio/WhatsApp. |
| **P1/P2** | Connected Services registry | Hard-coded array → persisted managed portfolio | Prevent future orphaning and make transitional products accountable | Owner, privacy class, lifecycle, route, entitlement, last review, next decision, and retirement/export path are queryable. |
| **P2** | Route and reporting completion | Deep-link routes, product-specific reports, cross-product summary | Improves adoption and reduces mixed-dashboard confusion after safety foundations are stable | Legacy links redirect correctly; reports show source, period, denominator, freshness, and limitation. |
| **Separate platform P0** | Safe Truth accountless migration | Parent/guardian accountless submission and governed institutional aggregation | This is a platform source-of-truth requirement, not an excuse to expose raw family data in IERS | Direct URL/QR submission without login, consent/privacy tests, anonymised institutional rollup, and documented data contract. |

## 5. Exact integration design by code area

### 5.1 Capability and role registry

Add a typed registry near the existing entitlement helper, or in a dedicated `server/lib/institution-capabilities.ts`, with one row per capability. Each row should identify `productKey`, `capabilityKey`, `capabilityClass`, `renewalPolicy`, `requiredRoleKeys`, `routeKeys`, `procedureNames`, and whether the capability is allowed during active-event operational continuity.

The registry should be checked in CI against the router procedure inventory. A missing mapping should fail the check rather than silently defaulting to institution-admin access. The database capability table remains the runtime commercial source; the typed registry remains the code ownership and authorization source.

### 5.2 Product-specific permissions

Implement `assertProductPermission` after `assertInstitutionProductCapability`. The evaluator should first confirm tenant relationship, then entitlement, then an active product role. Institution owner/admin remains a safe continuity fallback for institutional governance, but not for every operational function by default. Provider/member access must continue to be driven by `institutionMemberships` and assigned responsibility roles for IERS response operations.

The first role matrix should be small and clinically useful: IERS coordinator, ERT/UTL/ERTL, equipment lead, QI reviewer, evidence/accreditation reviewer, IERS report viewer, CPD coordinator, CPD reviewer, CPD report viewer, finance officer, and institution owner/admin. Avoid creating a role for every button.

### 5.3 IERS Competency & Training extraction

Create an IERS competency component that wraps the current training schedule and attendance queries/mutations. Add the component to the existing `competency` tab before removing or redirecting the legacy schedule tab. Gate schedule creation, editing, cancellation, instructor assignment, and attendance with `iers.competency_training.operate`; gate read-only roster views with the corresponding read capability.

Preserve `trainingSchedules` and `trainingAttendance` as the initial source of truth. Add an explicit `competencyTrack` or equivalent metadata only if needed to distinguish institutional emergency competency from CPD. Do not infer CPD points from attendance. After the first stable extraction, add proper multi-day support with a migration and validation instead of continuing to encode day-two information in the location field.

### 5.4 IERS QI and action consolidation

Treat `iersActionItems` as the target canonical action table because it already supports evidence-derived actions and closure evidence. Add a compatibility adapter for `institutionalActionLogs` so old records remain readable and old deep links remain safe. During the transition, every create/update should either write to one canonical record with a legacy projection or create an explicitly linked pair; it must not create two independently editable actions.

Preserve Care Signal/Code Signal source IDs and the facility-level anonymisation threshold. Require an owner, target date, closure evidence, reviewer, and a distinct verifier before an action is marked verified. The pilot drill should use this exact closure path.

### 5.5 Administration, exports, and commercial controls

Build the export centre before building cancellation or suspension automation. It should list IERS and CPD export packages separately, state the date range and data classes included, and record the requesting actor. It should not export raw Safe Truth submissions by default.

Then add authoritative references from quotations and contracts into `institutionProductSubscriptions`. Payment confirmation should create subscription events; it should not directly mutate UI state without a ledger event. Renewal, grace, past_due, suspended, and expired transitions should be idempotent and independently testable. The current platform-admin override should remain as an emergency support tool with a clear manual-override audit trail, not the normal renewal path.

### 5.6 Connected Services registry

Replace the hard-coded `CONNECTED_SERVICES` constant with a persisted registry. The minimum fields are `serviceKey`, `displayName`, `description`, `ownerTeam`, `privacyClass`, `lifecycleStatus`, `routeKey`, `entitlementKey`, `lastReviewedAt`, `nextDecisionAt`, `reviewLabel`, and `migrationOrExportPath`. The UI should show the lifecycle status and the next decision date. A service cannot be marked active merely because its route exists.

## 6. Pre-drill safety gates

The following gates must be checked before running the first labelled drill. They are intentionally narrower than the complete roadmap.

| Gate | Pass condition | Failure response |
|---|---|---|
| Institution and provider link | Institution ID 3 has at least one linked provider with an explicit IERS responsibility role and active membership | Link or assign the provider before starting the drill. |
| Test identity | Drill is labelled **Not a Real Emergency** and uses no patient identifiers | Stop and relabel before proceeding. |
| Activation continuity | Trigger, acknowledge, respond, record arrival, monitor timeline, and close/debrief without leaving the IERS workflow | Treat as a release blocker; do not claim pilot success. |
| Human review | Evidence submitter is not the sole evidence/action verifier | Assign a separate reviewer or document the limitation and do not certify readiness. |
| Action closure | At least one action has owner, system change, closure evidence, and verified closure | Keep the drill open until closure is independently reviewed. |
| Executive truthfulness | Snapshot shows real drill/evidence/action data and does not claim accreditation or outcome improvement | Correct the data or wording before publication. |
| Billing safety | The test does not change the approved institution away from both active after completion; active event continuity remains available | Restore both products and inspect the audit event history. |

The following are **not** pre-drill blockers if the core gates pass: automated M-Pesa renewal, the complete Connected Services database registry, all legacy route extraction, and the full CPD role matrix. They remain important integration work and must not be silently marked complete.

## 7. Recommended delivery sequence

**Slice 1 — Pilot safety and evidence.** Confirm the linked provider, run the labelled drill, complete the provider response loop, submit criterion evidence, create or link one action, verify it with a separate reviewer, and confirm the executive snapshot. This validates the clinical spine without waiting for commercial automation.

**Slice 2 — IERS competency extraction.** Move schedule and attendance into the IERS competency tab, preserve the existing rows, add entitlement and role checks, and verify that no CPD record is created by the move.

**Slice 3 — QI consolidation.** Re-home action logs, facility gap analysis, incidents, guideline audit, AI review, and ResusGPS adoption into IERS QI/Clinical Governance. Make `iersActionItems` canonical and retain legacy projections until deep links are retired.

**Slice 4 — Permission and isolation hardening.** Add the product-role assignment UI and server helper, then write negative tests for tenant isolation and role separation. Do not broaden permissions by suppressing failures.

**Slice 5 — Portability and commercial truth.** Build product-filtered exports, retention/deletion policy, quote/contract/payment linkage, renewal events, notification history, and state-specific renewal UI.

**Slice 6 — Managed transitional portfolio.** Persist Connected Services metadata, define the Safe Truth data boundary, and mark every adjacent service active, pilot, preview, coming soon, deprecated, or retired with an owner and next decision date.

**Slice 7 — Legacy retirement and reporting.** Add deep-link redirects, retire mixed labels, separate IERS and CPD reporting, and only then reduce the compatibility dashboard.

## 8. Risks and mitigations

| Risk | Clinical or operational impact | Mitigation |
|---|---|---|
| Moving schedule/attendance by rewriting tables | Lost training history or broken institutional records | Wrap existing procedures first; preserve tables and IDs. |
| Entitlement without role permissions | Finance or general admins may gain clinical write access; providers may be blocked from assigned tasks | Add product-role checks and negative tests; retain safe admin continuity. |
| Two action systems remain independently editable | QI closure drift and misleading executive reports | Make `iersActionItems` canonical and use a linked legacy adapter. |
| Manual subscription overrides become normal billing | Commercial disputes and unverifiable access decisions | Link contract/quote/payment events and retain manual override as support-only. |
| Safe Truth analytics leak family data | Privacy and trust failure | Keep accountless submission separate from institution rollups; export anonymised aggregates only. |
| Legacy compatibility route becomes permanent | New institutions continue to learn the old mixed mental model | Add route mapping, owner, deprecation date, and migration smoke tests. |
| AI pattern inbox is treated as a decision | Unsafe clinical or accreditation claims | Human reviewer, source evidence, advisory label, and audit decision record. |
| Product reports blend denominators | Executives act on misleading numbers | Display source product, period, denominator, freshness, and limitations. |

## 9. Final recommendation before the pilot drill

Do **not** start by implementing the entire remaining roadmap. First confirm the pre-drill gates and run the bounded, labelled IERS drill because it tests the core value that the platform already claims to provide. At the same time, do not call the institutional platform fully complete: the schedule/attendance extraction, product-role layer, QI consolidation, export centre, commercial ledger, and persisted Connected Services registry remain open work.

The single highest-impact next engineering slice after the drill is **IERS Competency & Training extraction**, because it moves a real operational workflow out of the mixed legacy dashboard without introducing a new data model. The single highest-impact safety slice after that is **product-role and tenant-isolation enforcement**, because subscription status alone cannot prove that the correct person may perform the correct operation.

## References

[1]: https://github.com/karuejob-max/paeds_resus_app/blob/main/docs/institutional/INSTITUTIONAL_PORTAL_ARCHITECTURE_V1.md "Institutional Portal Architecture Contract V1"

[2]: https://github.com/karuejob-max/paeds_resus_app/blob/main/AGENTS.md "Repository governance, IERS completion definition, and production safeguards"

[3]: https://github.com/karuejob-max/paeds_resus_app/blob/main/docs/PLATFORM_SOURCE_OF_TRUTH.md "Platform Source of Truth"

[4]: https://github.com/karuejob-max/paeds_resus_app/blob/main/scripts/apply-0100-institution-product-entitlements.mjs "Migration 0100 product catalog, plans, subscriptions, entitlements, roles, and audit tables"

[5]: https://github.com/karuejob-max/paeds_resus_app/blob/main/server/lib/institution-entitlements.ts "Server-side institutional entitlement evaluator"

[6]: https://github.com/karuejob-max/paeds_resus_app/blob/main/server/routers/iers.ts "IERS router and provider/institution operations"

[7]: https://github.com/karuejob-max/paeds_resus_app/blob/main/client/src/pages/HospitalAdminDashboard.tsx "Legacy institutional dashboard and training schedule/attendance workflow"

[8]: https://github.com/karuejob-max/paeds_resus_app/blob/main/server/routers/institution.ts "Shared institutional router, training, quotations, contracts, and QI action-log procedures"

[9]: https://github.com/karuejob-max/paeds_resus_app/blob/main/client/src/components/CpdPanel.tsx "CPD Portal surface"

[10]: https://github.com/karuejob-max/paeds_resus_app/blob/main/client/src/components/InstitutionAdministrationPanel.tsx "Institution Administration panel"

[11]: https://github.com/karuejob-max/paeds_resus_app/blob/main/server/routers/institution-products.ts "Institutional product and Connected Services router"

[12]: https://github.com/karuejob-max/paeds_resus_app/blob/main/client/src/App.tsx "Institutional routes and legacy compatibility routes"

[13]: https://github.com/karuejob-max/paeds_resus_app/blob/main/docs/institutional/IERS_OPERATING_GUIDE_V1.md "IERS operating guide and pilot acceptance tests"
