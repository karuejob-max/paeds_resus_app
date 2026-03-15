# Hidden Opportunities Audit Report
**Paeds Resus Platform**  
**Date:** March 2026  
**Scope:** Routes, navigation, tRPC procedures, pages, components, admin reports, copy/empty states, and analytics instrumentation

---

## Executive Summary

The Paeds Resus platform has a **rich but fragmented** codebase with significant untapped potential. The audit reveals:

- **105 database tables** exist, but only ~50% are actively used in tRPC procedures; many tables (e.g., `referrals`, `safetruthEvents`, `supportTickets`, `institutionalInquiries`) are defined but never queried.
- **92 tRPC procedures** are called from the client, but only **10 routes** are wired in `App.tsx`, creating a massive gap between backend capability and frontend exposure.
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
1. In `server/routers/admin-stats.ts`, add a query to count referrals this month:
   ```ts
   const referralsThisMonth = await db
     .select({ count: sql`COUNT(*)` })
     .from(referrals)
     .where(between(referrals.createdAt, monthStart, monthEnd));
   ```
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
**What's there today:**  
Navigation config (`client/src/const/navigation.ts`) references routes that don't exist in `App.tsx`:
- `/safe-truth`, `/course/bls`, `/kaizen-dashboard`, `/learner-dashboard`, `/payment`, `/institutional`, `/institutional-onboarding`, `/personalized-learning`, `/predictive-intervention`

**What to do:**  
1. **Audit each orphaned route**: Does the page exist? Is it ready?
   - `/safe-truth` → `SafeTruth.tsx` exists; route it to `/safe-truth`
   - `/course/bls` → `CourseBLS.tsx` exists; route it to `/course/bls`
   - `/kaizen-dashboard` → `KaizenDashboard.tsx` exists; route it
   - `/learner-dashboard` → `LearnerDashboard.tsx` exists; route it
   - `/payment` → `Payment.tsx` exists; route it
   - `/institutional` → `Institutional.tsx` exists; route it
   - `/institutional-onboarding` → `InstitutionalOnboarding.tsx` exists; route it
   - `/personalized-learning` → `PersonalizedLearningDashboard.tsx` exists; route it
   - `/predictive-intervention` → `PredictiveInterventionDashboard.tsx` exists; route it

2. Add `<Route path="/safe-truth" component={SafeTruth} />` etc. to `App.tsx`

**Where:**  
`client/src/App.tsx` — add ~10 Route imports and ~10 Route definitions

**Impact:**  
All navigation links now work. Users can access courses, learning dashboards, payment, and institutional features from the header. Huge UX improvement.

**Effort:**  
Low — ~30 minutes. Just add imports and Route components.

---

### A5. Surface Safe-Truth Usage in Parent Dashboard
**What's there today:**  
The `parentSafeTruthSubmissions` table exists and is queried in `server/routers/parent-safetruth.ts`, but the parent dashboard (`ParentSafeTruth.tsx`) doesn't show how many times the parent has used Safe-Truth or any usage stats.

**What to do:**  
1. Create a tRPC query `parent.getSafeTruthStats()` that returns:
   - Total submissions this month
   - Last submission date
   - Trends (e.g., "used 3 times this week")
2. Call it in `ParentSafeTruth.tsx` and display a small card: "You've used Safe-Truth X times this month"

**Where:**  
- `server/routers/parent-safetruth.ts` — add ~15 lines
- `client/src/pages/ParentSafeTruth.tsx` — add ~20 lines

**Impact:**  
Parents see their own engagement. Encourages repeat use. Provides feedback loop.

**Effort:**  
Low — ~45 minutes. Simple query + UI card.

---

## Section B: Fix Broken or Incomplete Flows

### B1. Complete the Enrollment → Payment → Certificate Flow
**What's there today:**  
- `Enroll.tsx` exists and calls `trpc.enrollment.create.useMutation()`
- `Payment.tsx` exists and calls `trpc.mpesa.initiatePayment.useMutation()`
- `certificates` table exists
- But the flow is not wired: after payment, does the user get a certificate? Is there a "My Certificates" page?

**What to do:**  
1. After payment succeeds, create a certificate record in the DB
2. Add a "My Certificates" section to `LearnerDashboard.tsx` that lists certificates
3. Ensure the flow is: Enroll → Pay → Certificate issued → View in dashboard

**Where:**  
- `server/routers/payments.ts` or `mpesa.ts` — add certificate creation logic
- `client/src/pages/LearnerDashboard.tsx` — add certificates section

**Impact:**  
Enrollment becomes a complete, rewarding journey. Users see proof of completion.

**Effort:**  
Medium — ~1.5 hours. Requires coordinating payment → certificate logic.

---

### B2. Institutional Onboarding → First Login to Portal
**What's there today:**  
`InstitutionalOnboarding.tsx` exists, but after onboarding, where does the user go? Is there a clear next step to access `/institutional-portal`?

**What to do:**  
1. After institutional onboarding completes, redirect to `/institutional-portal`
2. Add a "Get Started" CTA on the onboarding page that says "Go to your hospital dashboard"
3. Ensure the institutional portal is ready to receive a first-time user (show a welcome card, not an empty dashboard)

**Where:**  
- `client/src/pages/InstitutionalOnboarding.tsx` — add redirect logic
- `client/src/pages/InstitutionalPortal.tsx` — add welcome state

**Impact:**  
Institutional users complete onboarding and immediately see value.

**Effort:**  
Low — ~30 minutes. Mostly UX/redirect logic.

---

## Section C: Data and Reporting

### C1. Add "Active Users This Week" to Admin Reports
**What's there today:**  
Admin reports show total registered users, but not **active** users (users who logged in or used the platform this week).

**What to do:**  
1. Query `analyticsEvents` for unique users in the last 7 days
2. Add a card to `/admin/reports`: "Active users (last 7 days)" with the count

**Where:**  
- `server/routers/admin-stats.ts` — add ~10 lines
- `client/src/pages/AdminReports.tsx` — add ~15 lines

**Impact:**  
Admin can see platform engagement, not just registration. Helps identify if users are actually using the product.

**Effort:**  
Low — ~30 minutes.

---

### C2. Add "Top Protocols Viewed" to Admin Reports
**What's there today:**  
ResusGPS has protocols, but admin doesn't know which ones are most used.

**What to do:**  
1. Once ResusGPS is instrumented (A1), query `analyticsEvents` for "View Protocol" events
2. Group by protocol name and show top 5 in admin reports

**Where:**  
- `server/routers/admin-stats.ts` — add ~15 lines (depends on A1)
- `client/src/pages/AdminReports.tsx` — add ~20 lines

**Impact:**  
Admin sees which protocols are most valuable. Informs content strategy.

**Effort:**  
Low — ~45 minutes (depends on A1 being done first).

---

### C3. Add "Conversion Funnel" to Admin Reports
**What's there today:**  
Admin sees enrollments and certificates, but not the **funnel**: how many enrolled vs. how many completed?

**What to do:**  
1. Query enrollments and certificates for the month
2. Calculate conversion rate: (certificates / enrollments) × 100
3. Add a card showing the funnel: "Enrolled: 50 → Completed: 35 (70%)"

**Where:**  
- `server/routers/admin-stats.ts` — add ~10 lines
- `client/src/pages/AdminReports.tsx` — add ~15 lines

**Impact:**  
Admin can see course completion rates and identify drop-off points.

**Effort:**  
Low — ~30 minutes.

---

## Section D: Copy and Empty States

### D1. Replace "No data available" with Actionable CTAs
**What's there today:**  
`PerformanceDashboard.tsx` shows "No data available" when there's no data.

**What to do:**  
Replace with context-specific messages:
- "No performance data yet. Complete an assessment to see your metrics."
- Add a link to start an assessment

**Where:**  
- `client/src/pages/PerformanceDashboard.tsx` — update ~5 lines

**Impact:**  
Users understand why there's no data and know what to do next.

**Effort:**  
Low — ~10 minutes.

---

### D2. Complete TODO Items
**What's there today:**  
8 TODOs scattered across the codebase:
- `InterventionSidebar.tsx:244` — "Add export to file functionality"
- `SupportAgentDashboard.tsx:86` — "Send message via tRPC"
- `ClinicalAssessmentGPS.tsx:610, 640` — "Build DKAManagement module", "Build TraumaProtocol module"
- `Referral.tsx:33, 66` — "Implement getReferrals query", "Implement referral submission"

**What to do:**  
Prioritize by impact:
1. **High:** Referral queries (B1 covers this)
2. **Medium:** Support agent messaging (if support is a priority)
3. **Low:** Export functionality, module builds (nice-to-have)

**Where:**  
Various files (see above)

**Impact:**  
Reduces technical debt and completes partial features.

**Effort:**  
Varies; see individual opportunities.

---

## Section E: Clean-up or Deprecate

### E1. Audit Orphaned Pages and Decide: Wire or Remove
**What's there today:**  
70+ pages exist, but only 10 are routed. Many are never imported:
- `BreathingAssessment.tsx` — 0 references
- `CPRMonitoring.tsx` — 0 references
- `CirculationAssessment.tsx` — 0 references
- `ClinicalGPSv2.tsx` — 0 references (backup?)
- `ClinicalAssessmentGPS_backup.tsx` — 0 references (backup)
- `CollaborativeSession.tsx` — 0 references
- `EmergencyProtocols.tsx` — 0 references
- `ExposureAssessment.tsx` — 0 references
- `GPSDemo.tsx` — 0 references
- `GuidelineManagement.tsx` — 0 references
- `HealthcareWorkerApp.tsx` — 0 references
- `InvestigationsPage.tsx` — 0 references
- `JoinSession.tsx` — 0 references
- `NRPAssessment.tsx` — 0 references
- `NotFound.tsx` — 0 references (but should be used as 404 fallback)
- `PatientDetail.tsx`, `PatientsList.tsx` — 0 references
- `PersonalImpactDashboard.tsx` — 0 references
- `PersonalizedLearningDashboard.tsx` — 0 references
- `PredictiveInterventionDashboard.tsx` — 0 references
- `ProviderProfile.tsx` — 0 references
- `Reassessment.tsx` — 0 references
- `SessionDetails.tsx` — 0 references
- `TargetedSolutions.tsx` — 0 references

**What to do:**  
1. **Categorize:**
   - **Assessment/Protocol pages** (BreathingAssessment, CirculationAssessment, etc.): Are these sub-flows of ResusGPS? If so, they should be components, not pages. Wire them or remove.
   - **Backup files** (ClinicalGPSv2, ClinicalAssessmentGPS_backup): Delete (version control handles history).
   - **Dashboard pages** (PersonalizedLearningDashboard, PredictiveInterventionDashboard, KaizenDashboard): Wire them to routes (A4 covers this).
   - **Utility pages** (NotFound, PatientDetail): Wire NotFound as 404 fallback; decide if PatientDetail is needed.

2. **Action:** Create a cleanup PR that either routes orphaned pages or removes unused backups.

**Where:**  
`client/src/pages/` — various files

**Impact:**  
Cleaner codebase. Reduced confusion about what's active.

**Effort:**  
Medium — ~2 hours (audit + cleanup).

---

### E2. Audit Unused Database Tables and Decide: Populate or Remove
**What's there today:**  
20+ tables are defined but never queried:
- `institutionalInquiries` — never used
- `smsReminders` — never used
- `learnerProgress` — never used (but `userProgress` is used)
- `platformSettings` — never used
- `experimentAssignments` — never used
- `errorTracking` — never used
- `supportTickets`, `supportTicketMessages` — never used
- `featureFlags` — never used
- `userCohorts`, `userCohortMembers` — never used
- `conversionFunnelEvents` — never used
- `npsSurveyResponses` — never used
- `userProfiles` — never used (but `users` is used)
- `safetruthEvents` — never used (but `parentSafeTruthSubmissions` is used)
- `chainOfSurvivalCheckpoints` — never used
- `eventOutcomes` — never used (but `outcomes` is used)
- `userInsights` — never used
- `facilityScores` — never used
- `accreditationApplications`, `accreditedFacilities` — never used

**What to do:**  
1. **Audit:** For each unused table, ask: "Is this needed for a future feature?" If yes, keep. If no, remove.
2. **Examples:**
   - `supportTickets` — if support is planned, keep. If not, remove.
   - `featureFlags` — if feature flagging is planned, keep. If not, remove.
   - `experimentAssignments` — if A/B testing is planned, keep. If not, remove.
3. **Action:** Create a cleanup migration that removes unused tables (or at least documents which ones are "reserved for future use").

**Where:**  
`drizzle/schema.ts` — remove table definitions

**Impact:**  
Cleaner schema. Reduced confusion about what's active.

**Effort:**  
Medium — ~1 hour (audit + migration).

---

## Top 5 Quick Wins (Low Effort, High Impact)

1. **Instrument ResusGPS with Analytics (A1)**
   - **Effort:** 15 minutes
   - **Impact:** Admin gets real visibility into product usage. Unlocks the "App activity" metric.
   - **Why first:** Unblocks all other analytics opportunities.

2. **Wire Orphaned Routes to App.tsx (A4)**
   - **Effort:** 30 minutes
   - **Impact:** Users can access courses, learning, payment, and institutional features. Huge UX improvement.
   - **Why second:** Immediately makes the platform feel more complete.

3. **Add "Active Users This Week" to Admin Reports (C1)**
   - **Effort:** 30 minutes
   - **Impact:** Admin sees engagement, not just registration.
   - **Why third:** Complements A1; gives admin a clear health metric.

4. **Replace "No data available" with CTAs (D1)**
   - **Effort:** 10 minutes
   - **Impact:** Users know what to do when they see empty states.
   - **Why fourth:** Quick win that improves UX across the board.

5. **Wire Referral Page to Backend (A2)**
   - **Effort:** 1 hour
   - **Impact:** Unlocks a growth/revenue channel.
   - **Why fifth:** Medium effort but high business value.

---

## Summary of Opportunities by Category

| Category | Count | Key Opportunities |
|----------|-------|-------------------|
| **Wire Existing Assets** | 5 | ResusGPS analytics, referrals, Safe-Truth stats, admin reports depth, orphaned routes |
| **Fix Incomplete Flows** | 2 | Enrollment → Certificate, Institutional onboarding → Portal |
| **Data & Reporting** | 3 | Active users, top protocols, conversion funnel |
| **Copy & Empty States** | 2 | Actionable CTAs, complete TODOs |
| **Clean-up** | 2 | Orphaned pages, unused DB tables |

**Total opportunities: 14**  
**Estimated effort to implement all: 8–10 hours**  
**Estimated effort for top 5 quick wins: 1.5 hours**

---

## Recommendations

1. **Start with the top 5 quick wins** — they're low-effort and unlock visibility and UX.
2. **Instrument analytics first** — it's the foundation for all reporting improvements.
3. **Wire orphaned routes next** — it makes the platform feel complete.
4. **Then tackle incomplete flows** — enrollment, institutional onboarding, referrals.
5. **Finally, clean up** — remove unused pages and tables to reduce confusion.

---

## Notes for Implementation

- **No code changes are included in this report** — this is discovery and prioritisation only.
- **All opportunities are scoped and actionable** — each can be implemented in 15 minutes to 2 hours.
- **Preserve existing multi-role and auth** — all suggestions respect the current user model.
- **Prefer linking existing pieces** — no new pages or features are proposed; only wiring and instrumentation.
