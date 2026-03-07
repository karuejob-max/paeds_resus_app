# Verification: Codex & Manus Deliverables vs Repo

**Date:** Feb 2025  
**Purpose:** Confirm what was agreed, what exists in the repo, and what is still pending.  
**Checked by:** Cursor (per CEO brief §13 — repo review and alignment).

---

## 1. What was agreed (from CEO brief)

| Item | Agreement |
|------|-----------|
| **Phase 1** | Analytics instrumentation: ResusGPS (and other products) send events → `events.trackEvent` → `analyticsEvents`; Admin reports show real activity. |
| **Phase 2** | Staging: `develop` → staging, `main` → production; PRs verified on staging first. |
| **Phase 3** | Security baseline: password complexity, session max age (e.g. 30 min), audit logging for admin. |
| **Phase 4** | ResusGPS v4: undo, medication dedup, multi-diagnosis, structured age, countdown timers, dose rationale. |
| **Reports “this month”** | Calendar month in **EAT (East Africa Time, UTC+3)**. |
| **Codex** | Add `docs/PLATFORM_SOURCE_OF_TRUTH.md` and `docs/ENGINEERING_ACCEPTANCE_CHECKLIST.md`; link from README collaboration section. |

---

## 2. Repo findings

### Codex — claimed vs repo

| Claimed | In repo? | Notes |
|---------|---------|------|
| Added `docs/PLATFORM_SOURCE_OF_TRUTH.md` | **No** | File not present in `docs/`. |
| Added `docs/ENGINEERING_ACCEPTANCE_CHECKLIST.md` | **No** | File not present in `docs/`. |
| Updated README collaboration section to link both docs | **No** | README has no references to PLATFORM_SOURCE_OF_TRUTH, ENGINEERING_ACCEPTANCE_CHECKLIST, or a “collaboration” section linking these. |

**Conclusion:** Codex’s described deliverables are **not present** in this repo. They may exist in another branch or environment; if so, they need to be merged and the README updated.

---

### Manus — claimed vs repo

| Claimed | In repo? | Notes |
|---------|---------|------|
| “Phase 1 Complete: Analytics Instrumentation for ResusGPS” | **Partially** | See below. |
| `useResusAnalytics` hook (assessment start, questions answered, interventions, cardiac arrest, ROSC) | **No** | Repo has `client/src/hooks/useAnalytics.ts` only — generic events (page_view, button_click, course_view, etc.). No `useResusAnalytics` and no ResusGPS-specific event types. |
| Events flow to `/api/trpc/events.trackEvent` and `analyticsEvents` | **Yes** | `server/routers/events.ts`, `server/services/analytics.service.ts`, and `server/db.ts` implement trackEvent → `analyticsEvents`. Pipeline exists. |
| ResusGPS page sends clinical events | **No** | `client/src/pages/ResusGPS.tsx` does **not** import or use `useAnalytics` or any analytics hook. No “assessment start”, “intervention”, “ROSC” etc. sent from ResusGPS. |
| Admin reports show “real ResusGPS activity” | **Only for generic events** | `server/routers/admin-stats.ts` reads `analyticsEvents` for “last 7 days” and returns count + event types. It will show activity only from pages that actually call `trackEvent` (e.g. Institutional uses `useAnalytics`). ResusGPS does not send events, so ResusGPS-specific activity will not appear. |

**Conclusion:** Phase 1 is **not complete** in this repo. The **infrastructure** (trackEvent, analyticsEvents, admin-stats) exists. The **ResusGPS-specific instrumentation** (useResusAnalytics or equivalent, and wiring inside ResusGPS to send assessment start, questions answered, interventions, cardiac arrest, ROSC) is **missing**. Either it was done elsewhere and not merged, or it still needs to be implemented.

---

### Admin reports — EAT for “this month”

| Agreed | In code? | Notes |
|--------|----------|------|
| “This month” = calendar month in **EAT (UTC+3)** | **No** | `server/routers/admin-stats.ts` uses `startOfMonth` / `endOfMonth` with **UTC** (`setUTCHours(0,0,0,0)` and end-of-month 23:59:59). No EAT conversion. |

**Conclusion:** Report month boundaries are still UTC. They need to be converted to EAT per CEO brief (e.g. use EAT for period start/end when querying enrollments, certificates, Safe-Truth, or document the current UTC behaviour and get explicit sign-off if UTC is acceptable).

---

### Phases 2–4

- **Staging (Phase 2):** No staging Render/Aiven config or branch-deploy docs found in repo. Treated as not yet done.
- **Security baseline (Phase 3):** No new password complexity, session max age, or admin audit logging found. Treated as not yet done.
- **ResusGPS v4 (Phase 4):** No undo, medication dedup, multi-diagnosis, structured age, countdown timers, or dose rationale changes verified; treated as not yet done.

---

## 3. Pending concerns and issues

1. **Codex:** Deliver the two docs into this repo and link them from README so the team has one source of truth and a sprint checklist. If already created elsewhere, merge and link.
2. **Manus:** ResusGPS analytics Phase 1 is incomplete in this repo. Either:
   - Merge the branch that adds `useResusAnalytics` (or equivalent) and wires ResusGPS to send the agreed clinical events, or
   - Implement here: a ResusGPS-focused analytics hook and calls from ResusGPS (assessment start, questions answered, interventions, cardiac arrest, ROSC) to the existing `events.trackEvent` pipeline.
3. **Admin reports timezone:** Implement EAT for “this month” in `admin-stats.ts` (or document and agree that UTC is intentional).
4. **Pre-existing issues:** Manus noted “Pre-existing bcryptjs/Drizzle TS errors remain unrelated.” Those are out of scope for this verification but should be tracked separately.

---

## 4. Recommended next steps

| Priority | Action | Owner |
|----------|--------|--------|
| 1 | Add `docs/PLATFORM_SOURCE_OF_TRUTH.md` and `docs/ENGINEERING_ACCEPTANCE_CHECKLIST.md` (or merge from other branch) and link from README. | Codex |
| 2 | Implement ResusGPS analytics in this repo: hook + events (assessment start, questions answered, interventions, cardiac arrest, ROSC) and wire ResusGPS page to `events.trackEvent`. | Manus |
| 3 | Change “this month” report boundaries in `admin-stats.ts` to EAT (UTC+3), or document UTC and get CEO sign-off. | Any (small change) |
| 4 | Proceed with Phase 2 (staging) and Phase 3 (security baseline) per agreed order. | Codex / Manus |

---

This verification was done by reviewing the repo against the CEO platform update and Part 3 (definitive answers). If Codex or Manus have branches/PRs that already contain these deliverables, merging them and re-running this check will close the gaps.
