# Best Way Forward Execution Plan

Purpose: Execute `docs/FINAL_BEST_WAY_FORWARD_PLAN.md` as a tracked multi-phase initiative.

Source spec:
- `docs/FINAL_BEST_WAY_FORWARD_PLAN.md`

Execution tracking:
- Update this file as tasks move from `Not started` -> `In progress` -> `Done`
- Record commit hashes in `Notes` when a slice lands

---

## How to use

1. Work in order unless a dependency requires adjustment.
2. When starting a task, set `Status` to `In progress`.
3. When finishing a task, update `Status`, `Done by`, `Date`, and `Notes`.
4. Add final evidence and critique to `docs/WORK_STATUS.md`.

---

## Task table

| # | Task ID | Title | Where | Status | Done by | Date | Notes |
|---|---------|-------|-------|--------|---------|------|-------|
| 1 | BWF-1 | Tighten `ResusGPS` role boundary and lane-appropriate navigation | `client/src/App.tsx`, `client/src/pages/ResusGated.tsx`, `client/src/components/Header.tsx`, `client/src/components/BottomNav.tsx`, `client/src/pages/Start.tsx` | Done | Cursor | 2026-04-16 | `/resus` now provider-only via `RoleGate`, with parent/institution steered to their own hubs and role switching preserved. |
| 2 | BWF-2 | Eliminate unsafe auth redirect handling | `client/src/const.ts`, `client/src/lib/*auth*`, `client/src/pages/Login.tsx`, `client/src/pages/Register.tsx`, `client/src/App.tsx`, `client/src/main.tsx` | Done | Cursor | 2026-04-16 | `sanitizeNextPath` + `buildLoginUrl` used for all auth-entry redirects and locked by `client/src/lib/authRedirect.test.ts`. |
| 3 | BWF-3 | Enrich provider home with explanatory context | `client/src/pages/ProviderDashboard.tsx`, `server/lib/provider-home-summary.ts` | Done | Cursor | 2026-04-16 | Provider home shows summary badges, a single recommended action, and an explicit “why this is your next step” explanation derived from provider state. |
| 4 | BWF-4 | Strengthen institutional credibility and truthfulness | `client/src/pages/Institutional.tsx`, `client/src/components/InstitutionalLeadForm.tsx`, `client/src/pages/About.tsx`, `client/src/pages/Help.tsx` | Done | Cursor | 2026-04-16 | Replaced unsupported outcomes/fake testimonial-style content with truthful trust-scope messaging, realistic institutional pathway copy, and clearer support contacts. |
| 5 | BWF-5 | Parent follow-up clarity | `client/src/components/SubmissionConfirmationModal.tsx`, parent-facing copy surfaces | Done | Cursor | 2026-04-16 | Added explicit post-submission expectations in parent lane and role-specific confirmation modal guidance/actions for parent vs provider follow-up. |
| 6 | BWF-6 | Credentialed full-role smoke pass | Browser verification across provider, parent, institution, instructor | Done | Cursor | 2026-04-16 | Local credentialed smoke on `http://localhost:3000` passed across provider/parent/institution/instructor/help/about using `smoketest.provider.20260416173000@test.local`. |
| 7 | BWF-7 | Verification, work log, commit, and push | checks, docs, git | Done | Cursor | 2026-04-16 | Acceptance checks run (`pnpm run check`, `pnpm build`), execution commits pushed to `main`, and post-deploy production smoke (`www.paedsresus.com`) confirmed `/start`, `/institutional`, auth entry, provider/parent/institution/instructor lanes, `/help`, and `/about` on latest copy. |

---

## Status key

- `Not started`: task has not begun
- `In progress`: currently being executed
- `Done`: implemented and verified for this initiative
- `Blocked`: cannot continue without an external dependency or decision
