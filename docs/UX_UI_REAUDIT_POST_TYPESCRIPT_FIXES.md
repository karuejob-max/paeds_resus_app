# UX/UI Re-audit After TypeScript Cleanup

Date: 2026-04-13
Reviewer: Cursor
Scope: Post-TypeScript-fix UX/UI re-audit across login, provider dashboard, ResusGPS access flow, role isolation, navigation clarity, and key anonymous/protected routes.

---

## Executive summary

The platform is materially healthier than before the TypeScript cleanup, and the original login error-handling issue is confirmed improved: invalid credentials now surface as user-friendly inline messaging instead of leaking raw backend failure text. Route protection and role-aware default routing are also working across the public and protected flows that were tested.

The main unresolved UX issue is not a crash or type regression. It is provider-home correctness and perceived performance. The current provider dashboard still builds its "next action" from three parallel client queries (`courses.getMyAhaEnrollments`, `courses.getUserEnrollments`, `fellowship.getResusGpsAccessStatus`) and does not wait for them before rendering a primary CTA. In practice this can briefly show the wrong recommendation, then swap after data arrives. There is also no consolidated `dashboard.getNextAction` / `dashboard.getSummary` router in active use today, so the requested dashboard-router performance improvement has not actually landed.

No P0 production blocker was found in the anonymous and protected-entry flows that were exercised live. The highest-priority follow-up for Phase 1.2+ is to consolidate provider-home state into a single summary endpoint or an explicit loading/error state machine before further UX polish work.

---

## Audit method

1. Code review of UX-critical client and server paths:
   - `client/src/pages/Login.tsx`
   - `client/src/pages/ProviderDashboard.tsx`
   - `client/src/pages/ResusGated.tsx`
   - `client/src/App.tsx`
   - `client/src/pages/Home.tsx`
   - `client/src/pages/Start.tsx`
   - `server/routers/courses.ts`
   - `server/routers/fellowship.ts`
   - `server/lib/resusgps-access.ts`
   - `server/routers.ts`
2. Live browser audit against `https://www.paedsresus.com`
3. Route-protection checks for provider, parent, institutional, and instructor surfaces
4. Practical timing observations for loading and redirect behavior

Coverage limit: a brief authenticated provider session was available initially from existing browser state, but it was lost after logout. No reusable credentials were available for full signed-in provider, parent, institutional, or instructor journey completion after that point.

---

## What is working well

- Login error handling is materially improved. Invalid credentials show an inline, user-readable message, and network failures are normalized to "Could not reach the server. Refresh and try again."
- Protected routes preserve return intent using `next=...`, including `/home`, `/fellowship`, `/resus`, `/instructor-portal`, and `/hospital-admin-dashboard`.
- Role-aware fallback routing is working. Parent and institutional users are redirected to their own home surfaces instead of provider-only pages.
- Parent Safe-Truth remains publicly reachable and aligned with the intended audience split.
- Live route protection behaved correctly in browser testing:
  - `/fellowship` redirected to `/login?next=%2Ffellowship`
  - `/resus` redirected to `/login?next=%2Fresus`
  - `/instructor-portal` redirected to `/login?next=%2Finstructor-portal`
  - `/hospital-admin-dashboard` redirected to `/login?next=%2Fhospital-admin-dashboard`
- A real authenticated provider session briefly showed the intended state-machine behavior on `/home`: the primary CTA changed from a default ResusGPS state to a payment-recovery state ("Resume payment" for BLS), confirming the dashboard is reading real enrollment data.
- No live TypeScript-cleanup regression was observed in the tested public and protected-entry flows: no crash loops, blank screens, or broken route renders.

---

## Critical blockers

None confirmed in the tested production flows.

---

## Medium-priority issues

### 1. Provider home can show the wrong next action while data is still loading

Severity: Medium

`ProviderDashboard` renders a primary CTA as soon as auth resolves, but it does not wait for the three data sources that determine priority. Until those queries settle, the UI falls through to `Open ResusGPS`, then may switch to `Resume payment`, `Start course`, or `Continue course`.

Impact:
- Misleads providers at exactly the decision point meant to reduce friction
- Creates CTA flicker
- Risks inaccurate conversion analytics on the primary action

Recommendation:
- Replace the three-query client-side state machine with a single provider-home summary endpoint
- Or explicitly block primary CTA rendering until all required queries resolve or fail

### 2. The requested dashboard router improvement is not present in active use

Severity: Medium

There is no active `dashboard.getNextAction` or `dashboard.getSummary` router backing provider home. The provider dashboard still uses three separate tRPC queries and local `useMemo` prioritization. Server-side `getSummary` exists under `personalization` and `gamification`, but the current provider home does not consume those procedures.

Impact:
- The intended performance and consistency win from consolidation has not been realized
- Business logic remains split between client render timing and multiple backend calls

Recommendation:
- Create and ship a dedicated provider-home summary router that returns:
  - primary next action
  - secondary shortcuts
  - ResusGPS access status
  - any payment-recovery flags

### 3. Protected-route redirects feel slow and clinically uncertain

Severity: Medium

In live testing, protected routes typically showed a static `Loading page...` state for about 3-4 seconds before redirecting to login. This was observed on `/fellowship`, `/resus`, `/instructor-portal`, `/hospital-admin-dashboard`, and `/institutional-portal`.

Impact:
- Users experience uncertainty before redirect
- The delay is especially problematic for ResusGPS, where urgency matters

Recommendation:
- Resolve auth state faster if possible
- Replace plain text with clearer progress UI and context-specific copy
- Consider a dedicated fast auth gate for emergency-sensitive routes

### 4. Enrollment query failures are collapsed into empty-state data

Severity: Medium

`courses.getMyAhaEnrollments`, `getEnrollments`, and `getUserEnrollments` catch errors and return `[]`. The client cannot distinguish "user has no enrollments" from "backend lookup failed."

Impact:
- Wrong provider next action
- Missing error affordance
- Hidden operational failures

Recommendation:
- Return explicit structured error states
- Surface provider-home recovery UI when summary data cannot be trusted

### 5. ResusGPS gate copy is provider-centric even though the route is broader

Severity: Medium

`/resus` is guarded by auth, but the access messaging in `ResusGated` pushes users toward Fellowship micro-courses. That is coherent for providers, but confusing if parent or institutional users hit the route.

Impact:
- Role-copy mismatch
- Cross-lane confusion

Recommendation:
- Make the fallback copy role-aware
- Or tighten route access if only provider users are meant to encounter this gate

---

## Low-priority UX polish

- Replace repeated static `Loading page...` text with branded skeletons or spinner-plus-copy across route gates.
- Clarify the `/start` to `/resus` expectation so anonymous users understand that ResusGPS requires sign-in before they tap into it.
- The institutional landing page feels heavy on first paint; consider trimming above-the-fold content or deferring lower-priority sections.

---

## Route and timing evidence

Observed routes during live audit:

- `/`
- `/home`
- `/login?next=%2Fhome`
- `/fellowship`
- `/login?next=%2Ffellowship`
- `/start`
- `/resus`
- `/login?next=%2Fresus`
- `/parent-safe-truth`
- `/institutional`
- `/instructor-portal`
- `/login?next=%2Finstructor-portal`
- `/hospital-admin-dashboard`
- `/login?next=%2Fhospital-admin-dashboard`
- `/institutional-portal`
- `/login?next=%2Finstitutional-portal`

Observed wait ranges:

- `/` to authenticated `/home`: about <=3s
- Invalid login response: about <=3s
- `/start`: about 4s
- `/parent-safe-truth`: about 3s
- `/institutional`: about 4s
- Protected-route redirects: about 3-4s

Observed console/runtime behavior:

- Valid inline auth error handling for invalid credentials
- No uncaught runtime exceptions
- No obvious post-TypeScript-fix render regressions in tested flows

---

## Recommended execution order for Phase 1.2+

1. Ship a consolidated provider-home summary router and remove the current three-query CTA race.
2. Distinguish provider-home empty states from provider-home error states.
3. Tighten protected-route loading UX, especially around `/resus`.
4. Make ResusGPS gate messaging role-aware or narrow the route's expected audience.
5. Re-run authenticated smoke journeys for provider payment, ResusGPS, institutional dashboard internals, and instructor portal using stable test credentials.

---

## Final assessment

- Hits: login messaging, role-aware routing, route protection, parent/public separation, no observed TS-induced public-flow regression
- Misses: dashboard consolidation, provider-home load correctness, slow/weak loading states, enrollment error masking
- Critical blockers: none confirmed
- Release confidence: acceptable for continued Phase 1.2 work, but provider-home summary consolidation should be treated as the next high-leverage UX fix
