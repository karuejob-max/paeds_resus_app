# UX Re-audit Execution Plan

Purpose: Execute the confirmed post-TypeScript-fix UX/UI follow-up work from `docs/UX_UI_REAUDIT_POST_TYPESCRIPT_FIXES.md`.

Execution tracking: Update this file as tasks move from `Not started` -> `In progress` -> `Done`.

Primary outcome:
- Remove provider-home CTA race conditions
- Improve loading and gate UX on protected routes
- Align auth-entry behavior to the platform's email/password policy
- Re-verify the highest-risk user journeys after implementation

---

## How to use

1. Read `docs/UX_UI_REAUDIT_POST_TYPESCRIPT_FIXES.md` for the audited findings and acceptance direction.
2. Execute tasks in order unless dependencies require adjustment.
3. When a task is completed, update `Status`, `Done by`, `Date`, and `Notes`.
4. Record final evidence in `docs/WORK_STATUS.md`.

---

## Task table

| # | Task ID | Title | Where | Status | Done by | Date | Notes |
|---|---------|-------|-------|--------|---------|------|-------|
| 1 | UXR-1 | Create execution plan + tracking artifact | `docs/UX_REAUDIT_EXECUTION_PLAN.md` | Done | Cursor | 2026-04-16 | Created and completed as the execution tracker for this slice |
| 2 | UXR-2 | Consolidate provider-home summary into one router | `server/routers/dashboards.ts`, `server/lib/provider-home-summary.ts` | Done | Cursor | 2026-04-16 | Added `dashboards.getSummary` / `getNextAction` backed by a shared provider-home summary helper |
| 3 | UXR-3 | Refactor provider home to consume summary endpoint | `client/src/pages/ProviderDashboard.tsx` | Done | Cursor | 2026-04-16 | Provider home now waits on one summary query and has explicit loading/error states |
| 4 | UXR-4 | Improve protected-route loading and login redirect UX | `client/src/App.tsx`, shared route loading UI | Done | Cursor | 2026-04-16 | Replaced weak generic gate loading with route-aware loading and redirect messaging |
| 5 | UXR-5 | Make ResusGPS gating copy role-aware | `client/src/pages/ResusGated.tsx` | Done | Cursor | 2026-04-16 | Parent and institution users now get lane-appropriate guidance and fallback CTAs |
| 6 | UXR-6 | Lock auth entry to local email/password flow | `client/src/const.ts`, `client/src/pages/Start.tsx`, related callers | Done | Cursor | 2026-04-16 | Local login is now the canonical auth-entry URL generator with `next` preservation |
| 7 | UXR-7 | Verify typecheck and smoke-test key journeys | key client/server routes, browser smoke | Done | Cursor | 2026-04-16 | `pnpm run check`, `pnpm build`, provider-home summary Vitest, and browser smoke all passed; authenticated provider-home smoke remains limited by missing credentials |
| 8 | UXR-8 | Update work log and push final implementation | `docs/WORK_STATUS.md` | Done | Cursor | 2026-04-16 | Implementation committed in `536f31f`; final hash bookkeeping and push completed in follow-up commit |

---

## Status key

- `Not started`: task has not begun
- `In progress`: currently being executed
- `Done`: implemented and verified enough for this initiative
- `Blocked`: cannot progress without an external decision or dependency
