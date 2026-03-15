# Shared Execution Plan — Hidden Opportunities (Cursor & Manus)

**Purpose:** Single playbook for Cursor and Manus to execute the opportunities from the Hidden Opportunities Audit. Work in order; mark tasks done when complete so the other agent doesn’t duplicate.

**Source:** `docs/MANUS_HIDDEN_OPPORTUNITIES_REPORT.md`  
**Context:** `docs/CEO_Platform_Update_And_Reply_To_AI_Team.md` (brand: Paeds Resus; multi-role; extend don’t replace)

---

## How to use this plan

1. **Work in order** — Complete tasks in the sequence below. If a task is already marked **Done**, skip to the next.
2. **When you finish a task** — Update this file: set status to **Done** and add `(by Cursor)` or `(by Manus)` and the date (e.g. `2026-03-XX`).
3. **One task at a time** — Finish the task you start before moving on. If you only do part of it, note "In progress" and what’s left.
4. **Preserve** — Multi-role auth, existing routes, and CEO doc structure. No new pages unless the task explicitly adds one.
5. **Reference** — For "what to do" and "where," use the full report: `docs/MANUS_HIDDEN_OPPORTUNITIES_REPORT.md`.

---

## Task list (in execution order)

### Phase 1 — Analytics & visibility (unblock admin reports)

| # | Task ID | Title | Spec summary | Where | Status |
|---|---------|--------|----------------|-------|--------|
| 1 | **A1** | ResusGPS analytics | Add `useAnalytics("ResusGPS")` in ResusGPS.tsx. On mount: `trackPageView("ResusGPS")`. On key actions: `trackButtonClick("Start Assessment")`, `trackButtonClick("Complete Assessment")`, `trackButtonClick("View Protocol")`, `trackButtonClick("Log Intervention")`. Use existing `client/src/hooks/useAnalytics.ts`. | `client/src/pages/ResusGPS.tsx` | ✅ Done (by Manus) 2026-03-15 |
| 2 | **C1** | Active users this week | Query analytics events for unique users in last 7 days. Add card to admin reports: "Active users (last 7 days)". | `server/routers/admin-stats.ts` (or equivalent), `client/src/pages/AdminReports.tsx` | ✅ Done (by Manus) 2026-03-15 |
| 3 | **D1** | Empty-state CTAs | Replace generic "No data available" with actionable copy + link (e.g. "Complete an assessment to see your metrics" + link to start). Start with PerformanceDashboard.tsx. | `client/src/pages/PerformanceDashboard.tsx` (and similar if time) | ✅ Done (by Manus) 2026-03-15 |

### Phase 2 — Referrals & Safe-Truth

| # | Task ID | Title | Spec summary | Where | Status |
|---|---------|--------|----------------|-------|--------|
| 4 | **A2** | Wire Referral page to backend | Create `server/routers/referrals.ts`: `getReferrals`, `submitReferral`. In Referral.tsx replace TODOs with `trpc.referrals.getReferrals.useQuery()` and `trpc.referrals.submitReferral.useMutation()`. Register router in server. | `server/routers/referrals.ts` (new), `client/src/pages/Referral.tsx`, server router index | ✅ Done (by Manus) 2026-03-15 |
| 5 | **A3** | Referral count in admin reports | Add query for referrals this month; add "Referrals this month" card to AdminReports. | `server/routers/admin-stats.ts`, `client/src/pages/AdminReports.tsx` | ✅ Done (by Cursor) 2026-02-25 |
| 6 | **A5** | Safe-Truth usage in parent dashboard | Add tRPC `getSafeTruthStats()` (submissions this month, last submission); show small card in ParentSafeTruth.tsx: "You've used Safe-Truth X times this month". | `server/routers/parent-safetruth.ts`, `client/src/pages/ParentSafeTruth.tsx` | ✅ Done (by Cursor) 2026-02-25 |

### Phase 3 — Flows & reporting

| # | Task ID | Title | Spec summary | Where | Status |
|---|---------|--------|----------------|-------|--------|
| 7 | **B2** | Institutional onboarding → portal | After onboarding success, redirect to `/institutional-portal`. Optionally add welcome/first-time state in InstitutionalPortal. | `client/src/pages/InstitutionalOnboarding.tsx`, `client/src/pages/InstitutionalPortal.tsx` | ✅ Done (by Cursor) 2026-02-25 |
| 8 | **C3** | Conversion funnel in admin | Enrolled vs completed this month; show card e.g. "Enrolled: N → Completed: M (X%)". | `server/routers/admin-stats.ts`, `client/src/pages/AdminReports.tsx` | ✅ Done (by Cursor) 2026-02-25 |
| 9 | **C2** | Top protocols viewed | After A1 is done: query analytics for "View Protocol" (or equivalent); show top 5 in admin reports. | `server/routers/admin-stats.ts`, `client/src/pages/AdminReports.tsx` | ✅ Done (by Cursor) 2026-02-25 |

### Phase 4 — Larger items (optional / when ready)

| # | Task ID | Title | Spec summary | Where | Status |
|---|---------|--------|----------------|-------|--------|
| 10 | **B1** | Enrollment → Payment → Certificate | Wire payment success to certificate creation; add "My Certificates" section to LearnerDashboard. | Payment/certificate router, `client/src/pages/LearnerDashboard.tsx` | ✅ Done (by Cursor) 2026-02-25 |
| 11 | **E1** | Orphaned pages audit | Categorise unused pages (assessment vs dashboard vs backup); wire or remove. Prefer wiring; remove only obvious backups. | `client/src/pages/` | ✅ Done (by Cursor) 2026-02-25 |
| 12 | **E2** | Unused DB tables audit | Document or remove unused tables. Prefer document "reserved" vs delete unless clearly obsolete. | `drizzle/schema.ts`, optional migration | ✅ Done (by Cursor) 2026-02-25 |

---

## Status key

- ⬜ **Not started**
- 🔄 **In progress** (add "by Cursor" or "by Manus" + date)
- ✅ **Done** (add "by Cursor" or "by Manus" + date)

---

## Notes

- **A4 (orphaned routes)** is already done — see `docs/UNLINKED_PAGES_INTEGRATION.md`. Do not re-do.
- If a task depends on another (e.g. C2 depends on A1), complete the dependency first.
- Keep changes minimal: only what the spec says. No extra refactors unless agreed.
