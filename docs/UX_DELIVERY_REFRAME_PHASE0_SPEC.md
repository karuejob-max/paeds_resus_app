# UX Delivery Reframe - Phase 0 Spec

**Date:** 2026-04-14  
**Owners:** Cursor (architecture + backend), Manus (frontend + UX), Job (product + clinical validation)  
**Purpose:** Define and lock pre-execution deliverables required before Week 1 implementation of the platform UX delivery reframe.

---

## 1) Scope and intent

This is **not** a clean-slate rebuild. It is a **UX delivery reframe**:

- Keep existing working components, APIs, and tests where possible.
- Refactor orchestration: entry routing, role boundaries, loading behavior, and journey continuity.
- Optimize performance at the most visible bottlenecks (login, provider dashboard, ResusGPS load path).

---

## 2) Phase 0 outcomes (must be complete before Week 1)

1. Performance baseline and bottleneck profile for:
   - Sign-in flow
   - Fellowship/provider dashboard load
   - ResusGPS initial route load
2. Provider "next best action" state machine and tie-break rules.
3. Role and permission access matrix (`provider`, `parent`, `institutional`, `instructor`, `admin`) covering:
   - Navigation visibility
   - Route access
   - API access
4. Dependency DAG for Weeks 1-4 with parallelization and blockers.
5. Test strategy and acceptance gates, including role-leak verification and perf target instrumentation.
6. Rollback and canary release protocol for critical auth/routing changes.

**Execution window (locked):**

- Start: 2026-04-14 (today)
- Deliverable completion target: 2026-04-16 EOD
- Team sign-off (P0-7): 2026-04-17 09:00 UTC
- Week 1 start gate: 2026-04-18

---

## 3) Non-negotiable definitions

### 3.1 Performance SLOs (target user perception)

- **Login shell ready:** <= 2.0s perceived from submit to authenticated shell render.
- **Provider dashboard FMC:** <= 3.0s to first meaningful content.
- **ResusGPS readiness:** 95% successful route load to usable interaction under normal network conditions.

### 3.2 First meaningful content (FMC)

- **Login:** signed-in shell + role-appropriate landing route visible.
- **Provider dashboard:** hero state + primary next-action card rendered (not full analytics payload).
- **ResusGPS:** first actionable pathway controls rendered and interactive.

### 3.3 Role leak definition

A role leak is any case where a user can:

- See disallowed role navigation/actions in UI, or
- Access disallowed route/page content, or
- Execute disallowed API procedure.

All three dimensions must pass for "zero cross-role leaks."

---

## 4) Provider "next best action" state machine (v1)

Priority order:

1. **Unpaid enrollment exists** -> primary CTA: Resume payment.
2. **Paid but not started course exists** -> primary CTA: Start course.
3. **Started but incomplete course exists** -> primary CTA: Continue learning.
4. **No urgent training action** -> primary CTA: Open ResusGPS.
5. **Secondary card only (non-primary):** Care Signal reminder when due.

Tie-break rules:

- If multiple courses match a state, pick most recent active enrollment.
- If due dates exist later, sort by nearest deadline first.
- If payment is pending + in-progress course both exist, payment resume remains primary.
- "Most recent" means latest `createdAt` enrollment timestamp.

Edge-case decisions:

- Multiple unpaid enrollments: primary CTA points to the unpaid enrollment with latest `createdAt`.
- Expired ResusGPS access: replace "Open ResusGPS" with "Renew ResusGPS access" CTA.
- Overdue Care Signal item: remains secondary CTA in Phase 0/Week 1 baseline (does not override payment/learning primary action).

---

## 5) Phase 0 deliverables

### 5.1 Performance profiling deliverable

- Endpoint timing and client-side route timing for login/dashboard/ResusGPS.
- Query-level bottleneck notes (N+1, fan-out calls, heavy payloads, retry storms).
- Recommended remediation per hotspot with expected gain.
- Method and evidence file: `docs/UX_DELIVERY_REFRAME_PHASE0_P0-1_PROFILING_METHOD.md`.

### 5.2 Access matrix deliverable

One table with rows per route/API family and columns per role:

- `Allow` / `Deny`
- Notes for conditional allow (e.g., instructor-only when approved)
- Inventory and matrix file: `docs/UX_DELIVERY_REFRAME_PHASE0_P0-3_ACCESS_MATRIX.md`.

### 5.3 Dependency DAG deliverable

- Nodes: Week 1-4 task groups
- Edges: explicit blockers
- Parallel tracks: identified and owner-assigned
- DAG artifact: `docs/UX_DELIVERY_REFRAME_PHASE0_P0-4_DEPENDENCY_DAG.md`.

### 5.4 Test strategy deliverable

- Role E2E matrix (UI + route + API)
- Perf telemetry events and thresholds
- Weekly smoke checklist
- Definition of done for each week
- Test strategy file: `docs/UX_DELIVERY_REFRAME_PHASE0_P0-5_TEST_STRATEGY.md`.

### 5.5 Rollback deliverable

- Canary sequence
- Revert triggers
- Recovery runbook for login/auth regressions
- Rollback runbook: `docs/UX_DELIVERY_REFRAME_PHASE0_P0-6_ROLLBACK_RUNBOOK.md`.

### 5.6 Active owner activation (required)

- P0-1 and P0-5: Manus starts 2026-04-14
- P0-2, P0-4, P0-6: Cursor starts 2026-04-14
- P0-3 and P0-7 scheduling/validation: Job starts 2026-04-14

No task may remain ownerless after 2026-04-14.

---

## 6) Week 1 entry criteria

Week 1 can start only if all are true:

1. Profiling report merged and reviewed.
2. Access matrix approved by Cursor + Manus + Job.
3. State machine approved and mapped to implementation surfaces.
4. Dependency DAG and owners locked.
5. Tests and telemetry plan committed.
6. Rollback protocol documented in release checklist.

---

## 7) Week 1-4 overview (post-Phase 0)

- **Week 1:** Critical UX stabilization (login, dashboard FMC, ResusGPS load reliability).
- **Week 2:** Role boundary and navigation integrity.
- **Week 3:** Provider conversion continuity (enrollment -> payment -> learning).
- **Week 4:** IA packaging and release hardening.

---

## 8) Out of scope for Phase 0

- Rewriting core component library.
- Replacing established API architecture.
- Full UI redesign of all pages.
- New product lines beyond current platform scope.

---

## 9) Execution tracking

Use `docs/UX_DELIVERY_REFRAME_PHASE0_EXECUTION_PLAN.md` as the single source of task status, owners, and completion dates.

---

## 10) Direct answers to critical execution questions

1. **P0-1 tools:** Chrome DevTools (performance + network), browser route timing instrumentation, server timing logs, and query-level timing from backend logs.
2. **P0-2 tie-break rules:** locked in this spec under Section 4; payment pending supersedes all other provider actions.
3. **P0-3 inventory-first approach:** route and API inventory must precede allow/deny mapping.
4. **P0-4 blocker modeling:** explicit blockers and parallel tracks are required in DAG artifact.
5. **P0-5 role E2E cases:** must cover UI visibility + route denial + API denial for all role pairs.
6. **P0-6 rollback:** canary, revert triggers, and recovery checks must be documented before Week 1.
7. **P0-7 sign-off schedule:** locked at 2026-04-17 09:00 UTC.
