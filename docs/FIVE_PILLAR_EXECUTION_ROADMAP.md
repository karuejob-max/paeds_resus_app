# Five-pillar execution roadmap

**Authority:** This plan implements the **locked priority order** in [PLATFORM_SOURCE_OF_TRUTH.md §12](./PLATFORM_SOURCE_OF_TRUTH.md) (same order as [WORK_STATUS.md](./WORK_STATUS.md) CEO priorities). Tactical detail belongs here; **canonical product/auth/metrics definitions remain in PSOT.**

---

## Contradictions & decisions (read first)

| Topic | PSOT / repo state | Notes |
|--------|-------------------|--------|
| **Priority order** | PSOT §12 = Analytics → Staging → Security baseline → ResusGPS v4 | **No conflict** with WORK_STATUS. |
| **Staging** | PSOT §10: single production today; **when staging exists**, `develop` → staging, `main` → production | Infra is **not** fully specified in code—follow [STAGING_BRANCH_SETUP.md](./STAGING_BRANCH_SETUP.md). |
| **Session length** | PSOT §11: long-lived default; **SESSION_MAX_AGE_MS** optional; sliding expiry **TBD** | **Tension:** security baseline pushes shorter sessions; PSOT allows long cookie until leadership locks policy. **Recommendation:** set `SESSION_MAX_AGE_MS` in production via env (e.g. institutional policy) and record the chosen value in WORK_STATUS when agreed—**do not change PSOT unilaterally**; CEO can amend §11 if needed. |
| **Compliance / PHI** | PSOT §11: retention/PHI **not fully defined** | Use [ENGINEERING_GOVERNANCE_CHECKLIST.md](./ENGINEERING_GOVERNANCE_CHECKLIST.md) as **working** discipline until legal/clinical locks definitions. |

If anything in this roadmap conflicts with **PSOT**, **PSOT wins**—update this file and WORK_STATUS after alignment.

---

## Pillar 1 — Analytics instrumentation (PSOT §8, §12 #1)

**Definition of done:** Meaningful product usage appears in **`analyticsEvents`**; admin **“last 7 days” / ResusGPS rollups** reflect real activity ([PSOT §8](./PLATFORM_SOURCE_OF_TRUTH.md)).

| Phase | Scope | Exit criteria |
|-------|--------|----------------|
| **A — Core paths** | ResusGPS: gate entry event + existing `useResusAnalytics` / `events.trackEvent` | At least one **`resus_*`** row when a provider enters the workspace after access allow; clinical events continue to flow from `useResusAnalytics`. |
| **B — Coverage audit** | Map major surfaces (Care Signal submit, course player milestones, enrollment) to the **standard** `events.trackEvent` path | Gaps listed in WORK_STATUS; no parallel ad-hoc KPI tables for the same metrics. |
| **C — Verification** | `pnpm run verify:analytics` (or equivalent) matches admin rollup logic | Shared rollup helpers stay aligned with [admin-stats](../server/routers/admin-stats.ts). |

**Dependencies:** DB migrations unchanged for basic event inserts.

---

## Pillar 2 — Staging (PSOT §10, §12 #2)

**Definition of done:** Second Render (or equivalent) deploy from **`develop`**, production from **`main`**; PRs verified on staging before production.

| Phase | Scope | Exit criteria |
|-------|--------|----------------|
| **A — Branch & deploy** | `develop` branch, staging service, env parity (see checklist doc) | Staging URL + secrets documented outside git. |
| **B — Process** | PR template: “tested on staging” for risky changes | Used for releases touching auth, payments, migrations. |

---

## Pillar 3 — Security baseline (PSOT §11, §12 #3)

**Definition of done:** Password rule **locked** (min 8 ✓), **session max age** explicitly chosen for production where required, **admin audit** scope expanded as agreed.

| Phase | Scope | Exit criteria |
|-------|--------|----------------|
| **A — Password** | Server Zod + client hints aligned to PSOT | No weaker path than `min(8)`. |
| **B — Session** | Document and apply `SESSION_MAX_AGE_MS` for production | Value recorded in deployment docs / WORK_STATUS. |
| **C — Audit** | Admin-sensitive actions logged (`adminAuditLog` or successor) | List of covered actions in WORK_STATUS. |

---

## Pillar 4 — ResusGPS v4 (PSOT §12 #4)

**Scope (from PSOT):** Undo, medication dedup, multi-diagnosis, structured age, countdown timers, dose rationale.

| Phase | Scope | Exit criteria |
|-------|--------|----------------|
| **A — Foundations** | Structured age + timers (cross-cutting) | Spec in WORK_STATUS / clinical checklist; incremental PRs. |
| **B — Safety** | Medication dedup + undo polish | Tests + UX review against HYBRID checklist where relevant. |
| **C — Depth** | Multi-diagnosis + dose rationale display | Behind feature flags if needed. |

---

## Pillar 5 — Governance & engineering discipline

**Definition of done:** Engineers know **trusted HTML**, **PHI/localStorage**, and **pathway ownership** expectations until compliance is fully locked.

| Artifact | Role |
|----------|------|
| [ENGINEERING_GOVERNANCE_CHECKLIST.md](./ENGINEERING_GOVERNANCE_CHECKLIST.md) | Day-to-day guardrails |
| PSOT §8 | Report definitions (EAT month, last 7 days, analyticsEvents) |

---

## Execution status

Updates belong in [WORK_STATUS.md](./WORK_STATUS.md) (date, who, commit). This file tracks **how** we execute the five pillars; PSOT remains **what** we decided.
