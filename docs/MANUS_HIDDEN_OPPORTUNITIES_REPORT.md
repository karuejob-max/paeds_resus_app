# Hidden Opportunities Audit Report
**Paeds Resus Platform**  
**Date:** March 2026  
**Author:** Manus  
**Scope:** Routes, navigation, tRPC procedures, pages, components, admin reports, copy/empty states, and analytics instrumentation

---

## Status note (post-audit)

- **A4 (Wire orphaned routes)** was **already implemented** before this report: `App.tsx` now includes routes for `/safe-truth`, `/course/bls`, `/kaizen-dashboard`, `/learner-dashboard`, `/payment`, `/institutional`, `/institutional-onboarding`, `/personalized-learning`, `/predictive-intervention`, `/referral`, `/personal-impact`, `/targeted-solutions`, `/problem-identification`, `/reassessment`, `/circulation-assessment`, plus redirects for `/dashboard`, `/case-analysis`, etc. See `docs/UNLINKED_PAGES_INTEGRATION.md`.
- The rest of the report remains valid. Recommended next focus: **A1 (ResusGPS analytics)**, then **C1**, **D1**, **A2**.

---

## Executive Summary

The Paeds Resus platform has a **rich but fragmented** codebase with significant untapped potential. The audit reveals:

- **105 database tables** exist, but only ~50% are actively used in tRPC procedures; many tables (e.g., `referrals`, `safetruthEvents`, `supportTickets`, `institutionalInquiries`) are defined but never queried.
- **92 tRPC procedures** are called from the client, but only **10 routes** are wired in `App.tsx**, creating a massive gap between backend capability and frontend exposure.
- **70+ pages** exist in `client/src/pages/`, but only **10 are routed and linked**. Pages like `BreathingAssessment`, `CPRMonitoring`, `KaizenDashboard`, `PersonalizedLearningDashboard`, `PredictiveInterventionDashboard`, and `Referral` are orphaned—never imported or linked from anywhere.
- **Analytics infrastructure is built but dormant**: `useAnalytics` hook exists with 10 event types, but only **1 page** (`Institutional.tsx`) actually uses it. ResusGPS, the core product, sends **zero analytics events**.
- **Admin reports exist but lack depth**: The `/admin/reports` surface shows user counts and enrollments, but **zero product activity** is captured because ResusGPS and other products don't emit events.
- **Navigation is incomplete**: 13 routes referenced in `navigation.ts` don't exist in `App.tsx` (e.g., `/safe-truth`, `/course/bls`, `/kaizen-dashboard`, `/learner-dashboard`, `/payment`, `/institutional`, `/institutional-onboarding`, `/personalized-learning`, `/predictive-intervention`).
- **Minimal placeholder text**: Only 8 instances of "TODO," "Coming soon," or "No data" found—the codebase is mostly complete, not half-baked.

**Key themes:**
1. **Disconnection between backend and frontend**: Procedures exist but aren't called; pages exist but aren't routed.
2. **Analytics blindness**: No visibility into what providers and parents actually do in ResusGPS and other products.
3. **Orphaned features**: Many pages and DB tables represent work that was built but never wired into the user journey.
4. **Navigation mismatch**: The navigation config references routes that don't exist, creating confusion.

---

## Section A: Wire Existing Assets

### A1. Add ResusGPS Analytics Instrumentation
**What's there today:**  
ResusGPS is the core product—the entry point for providers—but it sends **zero analytics events**. The `useAnalytics` hook is ready; the infrastructure is in place. Admin reports show "App / product activity (last 7 days)" but it stays at zero because nothing is instrumented.

**What to do:**  
Wrap key ResusGPS flows with analytics tracking:
- `trackPageView("ResusGPS")` on component mount
- `trackButtonClick("Start Assessment")` when user clicks START ASSESSMENT
- `trackButtonClick("Complete Assessment")` when assessment completes
- `trackButtonClick("View Protocol")` when user views a protocol
- `trackButtonClick("Log Intervention")` when user logs an intervention

This is a **one-file change** (`client/src/pages/ResusGPS.tsx`): add 5–10 lines of tracking calls.

**Where:**  
`client/src/pages/ResusGPS.tsx` — wrap existing button handlers and lifecycle events

**Impact:**  
Admin gets real visibility into ResusGPS usage (how many assessments started, completed, protocols viewed). Unlocks the "App / product activity" metric in `/admin/reports`.

**Effort:**  
Low — ~15 minutes. No new code, just hook calls in existing event handlers.

---

### A2. Wire Referral Page to Backend
**What's there today:**  
`client/src/pages/Referral.tsx` exists but has **two TODOs**: `getReferrals` query and referral submission are not implemented. The `referrals` table exists in the DB but is never queried.

**What to do:**  
1. Create tRPC procedures in `server/routers/referrals.ts`:
   - `getReferrals()` — fetch user's referrals from DB
   - `submitReferral(email, name)` — insert referral and send email
2. Call `trpc.referrals.getReferrals.useQuery()` and `trpc.referrals.submitReferral.useMutation()` in the Referral page

**Where:**  
- `server/routers/referrals.ts` (new file, ~50 lines)
- `client/src/pages/Referral.tsx` (update ~20 lines)

**Impact:**  
Referral feature becomes functional. Users can see their referrals and submit new ones. Unlocks a revenue/growth channel.

**Effort:**  
Medium — ~1 hour. Requires DB query logic and email integration (if not already set up).

---

### A3. Add Referral Count to Admin Reports
**What's there today:**  
Admin reports show user counts, enrollments, and certificates, but **no referral data**. The `referrals` table exists.

**What to do:**  
1. In `server/routers/admin-stats.ts`, add a query to count referrals this month
2. Add a card to `/admin/reports` showing "Referrals this month" with the count

**Where:**  
- `server/routers/admin-stats.ts` — add ~10 lines
- `client/src/pages/AdminReports.tsx` — add ~15 lines (new Card)

**Impact:**  
Admin can track referral growth and conversion. Provides one more KPI for platform health.

**Effort:**  
Low — ~30 minutes. Straightforward SQL + UI card.

---

### A4. Link Orphaned Pages to Navigation
**Status:** ✅ **Already done** (see `docs/UNLINKED_PAGES_INTEGRATION.md`). Routes for `/safe-truth`, `/course/bls`, `/kaizen-dashboard`, `/learner-dashboard`, `/payment`, `/institutional`, `/institutional-onboarding`, `/personalized-learning`, `/predictive-intervention`, `/referral`, `/personal-impact`, `/targeted-solutions`, `/problem-identification`, `/reassessment`, `/circulation-assessment` are in `App.tsx`. Redirects added for `/dashboard`, `/case-analysis`, etc.

---

### A5. Surface Safe-Truth Usage in Parent Dashboard
**What's there today:**  
The `parentSafeTruthSubmissions` table exists and is queried in `server/routers/parent-safetruth.ts`, but the parent dashboard (`ParentSafeTruth.tsx`) doesn't show how many times the parent has used Safe-Truth or any usage stats.

**What to do:**  
1. Create a tRPC query `parent.getSafeTruthStats()` that returns total submissions this month, last submission date, trends
2. Call it in `ParentSafeTruth.tsx` and display a small card: "You've used Safe-Truth X times this month"

**Where:**  
- `server/routers/parent-safetruth.ts` — add ~15 lines
- `client/src/pages/ParentSafeTruth.tsx` — add ~20 lines

**Impact:**  
Parents see their own engagement. Encourages repeat use.

**Effort:**  
Low — ~45 minutes.

---

## Section B: Fix Broken or Incomplete Flows

### B1. Complete the Enrollment → Payment → Certificate Flow
**What to do:** Wire payment success → certificate creation; add "My Certificates" section to LearnerDashboard.  
**Effort:** Medium — ~1.5 hours.

### B2. Institutional Onboarding → First Login to Portal
**What to do:** Redirect after onboarding to `/institutional-portal`; add welcome state in InstitutionalPortal.  
**Effort:** Low — ~30 minutes.

---

## Section C: Data and Reporting

### C1. Add "Active Users This Week" to Admin Reports
**What to do:** Query `analyticsEvents` for unique users in last 7 days; add card to `/admin/reports`.  
**Effort:** Low — ~30 minutes.

### C2. Add "Top Protocols Viewed" to Admin Reports
**What to do:** After A1, query analytics for "View Protocol" events; show top 5 in admin.  
**Effort:** Low — ~45 minutes (depends on A1).

### C3. Add "Conversion Funnel" to Admin Reports
**What to do:** Enrolled vs completed this month; show conversion rate card.  
**Effort:** Low — ~30 minutes.

---

## Section D: Copy and Empty States

### D1. Replace "No data available" with Actionable CTAs
**What to do:** In PerformanceDashboard (and similar), replace "No data available" with "Complete an assessment to see your metrics" + link.  
**Effort:** Low — ~10 minutes.

### D2. Complete TODO Items
**What to do:** Prioritise Referral (A2), then support messaging, export, module builds.  
**Effort:** Varies.

---

## Section E: Clean-up or Deprecate

### E1. Audit Orphaned Pages — Wire or Remove
**What to do:** Categorise assessment vs dashboard vs backup pages; wire or remove.  
**Effort:** Medium — ~2 hours.

### E2. Audit Unused Database Tables — Populate or Remove
**What to do:** Document or remove unused tables.  
**Effort:** Medium — ~1 hour.

---

## Top 5 Quick Wins (updated order)

1. **Instrument ResusGPS with Analytics (A1)** — 15 min — Unlocks app activity in admin.
2. ~~**Wire orphaned routes (A4)**~~ — ✅ Done.
3. **Add "Active Users This Week" (C1)** — 30 min — Engagement metric for admin.
4. **Replace "No data available" with CTAs (D1)** — 10 min — Better empty states.
5. **Wire Referral page to backend (A2)** — 1 hour — Growth channel.

---

## Recommendations

1. **Do A1 next** — ResusGPS analytics is the foundation for C1, C2, and admin visibility.
2. **Then C1 and D1** — Fast and high impact.
3. **Then A2, A3, A5** — Referrals and Safe-Truth stats.
4. **Then B1, B2** — Complete enrollment and onboarding flows.
5. **Finally E1, E2** — Clean-up when priorities allow.
