# Unified Platform Audit — Manus + Cursor Perspectives

**Date:** 2026-03-15  
**Auditors:** Manus (technical depth) + Cursor (user flow focus)  
**Goal:** Identify what's missing so the platform makes sense end-to-end to users

---

## Executive Summary

Both audits converge on the same core issue: **the platform has solid technical foundations but fragmented user experience**. 

**Manus found:** 31 orphaned pages, weak auth, poor accessibility, inconsistent empty states  
**Cursor found:** Broken enrollment→payment flow, unreachable features (Referral, Personal Impact), hardcoded dashboard numbers, course/pricing mismatches

**Combined impact:** Users can't complete critical workflows, can't find features, and see fake data.

---

## Critical Issues (Block core workflows)

### 1. Enrollment → Payment → Certificate Flow is Broken

**Manus finding:** Payment flow works, but enrollment flow doesn't connect to it  
**Cursor finding:** Two separate flows that don't connect; M-Pesa webhook may not match payment; enrollmentId is placeholder

**Details:**
- **Enroll page** (`/enroll`): User picks course → submits → gets success → redirected to `/learner-dashboard`
  - **Problem:** No "Pay now" button; no enrollment passed to payment flow
  - **Result:** User never pays, never gets certificate
  
- **Payment page** (`/payment`): User picks course → pays via M-Pesa → new enrollment created → certificate issued
  - **Problem:** Creates a **second** enrollment, not the one from Enroll page
  - **Result:** Two enrollments for same user; Enroll page is a dead end

- **M-Pesa webhook issue:** 
  - Stores `transactionId = checkoutRequestID`
  - Callback sends `MpesaReceiptNumber` (different value)
  - Webhook looks up by receipt number → payment not found → certificate never issued

- **Enrollment ID issue:**
  - `enrollment.create` returns hardcoded `enrollmentId: 1` instead of real ID
  - SMS reminder created with `enrollmentId: 1`
  - If payment tried to use this, it would be wrong

**Impact:** Users who enroll don't get certificates. Payment flow is the only way to get certified.

**Fix priority:** 🔴 **CRITICAL** — Blocks revenue and user success

**Recommended fix:**
- Option A: Enroll → Payment with `?enrollmentId=…` (single enrollment for both steps)
- Option B: Make Enroll a "course selection + payment" single flow
- Option C: Clearly separate "Apply" (Enroll, no cert) vs "Buy" (Payment, cert after payment)
- Fix M-Pesa webhook to match transactionId correctly
- Return real enrollment ID from `enrollment.create`

---

### 2. Referral and Personal Impact Are Unreachable

**Manus finding:** 31 orphaned pages; Referral page is routed but not linked  
**Cursor finding:** BottomNav (Refer, Impact) is never rendered; Header doesn't show Referral

**Details:**
- **Referral page** exists at `/referral` and is routed in App.tsx
- **BottomNav component** has "Refer" and "Impact" buttons but is **never imported or rendered**
- **Header navigation** for providers shows: Dashboard, Patients, Protocols, Performance, Safe-Truth
  - **Missing:** Referral, Personal Impact
- **Result:** Users can't find Referral unless they know the URL or guess

**Impact:** Referral feature (critical for patient handoff) is invisible. Users don't know it exists.

**Fix priority:** 🔴 **CRITICAL** — Core clinical workflow is hidden

**Recommended fix:**
- Render BottomNav on provider dashboard or ResusGPS
- Add "Referral" to provider Header navigation
- Add "Personal Impact" to provider Header or Home hub
- Make these features discoverable from main navigation

---

### 3. Password Reset is Missing

**Manus finding:** No password reset flow  
**Cursor finding:** (Confirmed by Manus)

**Details:**
- Users who forget passwords are **locked out permanently**
- No "Forgot password?" link on Login page
- No email recovery flow

**Impact:** Users lose access to accounts. No way to recover.

**Fix priority:** 🔴 **CRITICAL** — Blocks account recovery

**Recommended fix:**
- Add "Forgot password?" link on Login page
- Implement email-based password reset flow
- Send reset link via email with 24-hour expiry

---

### 4. Safe-Truth Notifications Are Missing

**Manus finding:** Parents submit Safe-Truth but don't know when response is ready  
**Cursor finding:** (Confirmed by Manus)

**Details:**
- Parents submit Safe-Truth form
- Admin reviews and responds
- Parent has **no way to know** response is ready
- No email, SMS, or in-app notification

**Impact:** Parents miss responses. No feedback loop.

**Fix priority:** 🔴 **CRITICAL** — Breaks parent engagement

**Recommended fix:**
- Add email notification when Safe-Truth response is ready
- Add in-app notification badge on ParentSafeTruth page
- Show response date/time in Safe-Truth history

---

### 5. Role-Based Access Control is Weak

**Manus finding:** Role checks only on frontend; users can switch roles without re-auth  
**Cursor finding:** Institutional page is gated but "For Institutions" nav is shown to everyone

**Details:**
- Admin pages check `user.role === "admin"` on frontend only
- Determined users can bypass by modifying localStorage or network requests
- No backend verification of role
- Users can change roles in Header without re-authentication

**Impact:** Security risk. Users can access pages they shouldn't.

**Fix priority:** 🔴 **CRITICAL** — Security vulnerability

**Recommended fix:**
- Move all role checks to backend (use `protectedProcedure` with role validation)
- Require re-authentication when changing roles
- Add audit logging for admin actions
- Implement proper RBAC middleware on server

---

## Important Issues (Degrade UX)

### 6. 31 Orphaned Pages Are Inaccessible

**Manus finding:** 31 pages exist but have no routes  
**Cursor finding:** (Confirmed by Manus)

**Details:**
- **Clinical Protocols (13):** Anaphylaxis, Asthma, Bronchiolitis, Croup, DKA, Eclampsia, Maternal Cardiac Arrest, Postpartum Hemorrhage, Septic Shock, Severe Pneumonia, Status Epilepticus, Trauma
- **Assessment Pages (6):** Breathing, Clinical, ClinicalAssessmentGPS, ClinicalGPSv2, Disability, Exposure, Trauma
- **Dashboards (5):** GuidelineManagement, SafeTruthAnalytics, HealthcareWorkerApp, GPSDemo, NRPAssessment
- **Collaboration (4):** CollaborativeSession, JoinSession, SessionDetails, PatientDetail
- **Other (3):** ClinicalReasoningResults, Investigations, NotFound

**Impact:** Providers can't access clinical protocols. Assessments are hidden. Analytics is invisible.

**Fix priority:** ⚠️ **IMPORTANT** — Features exist but aren't discoverable

**Recommended fix:**
- Route clinical protocols with proper categorization (respiratory, cardiac, metabolic, obstetric, trauma)
- Wire assessment pages into ResusGPS flow
- Add SafeTruthAnalytics to admin dashboard
- Hide demo pages (GPSDemo, HealthcareWorkerApp) or move to `/dev`
- Create a protocol library with search and filter

---

### 7. Empty States Are Inconsistent or Missing

**Manus finding:** Only 2 empty state messages across 62 pages  
**Cursor finding:** Dashboards show "0" or "No data" without guidance

**Details:**
- PerformanceDashboard: "No data available" (D1 added CTA, but others still missing)
- InstitutionalPortal: Shows "Staff Enrolled: 0", "Certified: 0", "Incidents Logged: 0", "Lives Improved: 0" with no guidance
- LearnerDashboard: Shows empty lists without "Get started" CTAs
- Most data-dependent pages assume data exists

**Impact:** Users see blank screens and don't know what to do next.

**Fix priority:** ⚠️ **IMPORTANT** — Confuses users

**Recommended fix:**
- Add empty state CTA to every data-dependent page
- Example: "Complete an assessment to see your metrics" → link to ResusGPS
- Example: "No certificates yet. Enroll in a course to get started" → link to Enroll
- Use consistent empty state component with icon + message + CTA

---

### 8. Hardcoded Dashboard Numbers Are Fake

**Manus finding:** LearnerDashboard shows hardcoded "3" and "5"  
**Cursor finding:** Parent shows "0" for healthcare journey events, "3" for system improvements; Provider shows "5" for gaps

**Details:**
- Parent dashboard: "Healthcare journey events shared: 0" (hardcoded)
- Parent dashboard: "System improvements identified: 3" (hardcoded, looks real)
- Provider dashboard: "Gaps identified from events: 5" (hardcoded, no backend)

**Impact:** Fake metrics look real and confuse users about what data is available.

**Fix priority:** ⚠️ **IMPORTANT** — Undermines trust

**Recommended fix:**
- Replace with real data from backend (Safe-Truth submissions count, events, etc.)
- Or use neutral copy: "Share your first story" instead of "0 events"
- Remove fake numbers entirely

---

### 9. Course and Pricing Mismatch Between Enroll and Payment

**Manus finding:** Course lists differ between pages  
**Cursor finding:** Enroll shows BLS 500, First Aid 300, ACLS 2000; Payment shows BLS 10000, ACLS 20000, PALS 20000, Bronze/Silver/Gold

**Details:**
- **Enroll page:** BLS (500), First Aid (300), ACLS (2000), PALS (2000)
- **Payment page:** BLS (10000), ACLS (20000), PALS (20000), Bronze (70000), Silver (100000), Gold (150000)
- Durations also differ: Enroll shows "2 days", Payment shows "2 days" for BLS but "6-16 weeks" for fellowships
- Program types differ: Enroll has "first-aid", Payment doesn't

**Impact:** Users see different prices and options depending on where they look. Confusing.

**Fix priority:** ⚠️ **IMPORTANT** — Confuses users about pricing

**Recommended fix:**
- Unify course list and pricing between Enroll and Payment
- Use single source of truth (database) for courses, not hardcoded lists
- Or clearly separate: "Apply for course" (Enroll) vs "Buy course" (Payment) with explanation
- Ensure both use same program types

---

### 10. Certificate Download Doesn't Work

**Manus finding:** Certificate download button only shows if URL is set  
**Cursor finding:** Certificates saved with empty `certificateUrl`, so download button never shows

**Details:**
- LearnerDashboard "My Certificates" shows Download button only when `certificateUrl` is set
- Certificates issued with `certificateUrl: ""`
- Result: Download button never appears

**Impact:** Users can't share certificates with employers.

**Fix priority:** ⚠️ **IMPORTANT** — Blocks credential sharing

**Recommended fix:**
- Implement certificate PDF generation on demand (via `certificates.download` endpoint)
- Or generate PDF when issuing certificate and store URL in S3
- Ensure Download button is always functional

---

### 11. Inconsistent Terminology

**Manus finding:** "Safe-Truth" vs "SafeTruth", "Provider" vs "Healthcare Worker"  
**Cursor finding:** "Safe-Truth", "Parent Safe-Truth", "ResusGPS", "Paeds Resus", "Learner Dashboard", "My learning"

**Details:**
- "Safe-Truth" (with hyphen) vs "SafeTruth" (no hyphen) used interchangeably
- "Provider" vs "Healthcare Worker" used for same role
- "Paeds Resus" (platform) vs "ResusGPS" (product) vs "Safe-Truth" (feature) — relationship unclear
- "Learner Dashboard" vs "My Learning" vs "Dashboard" for same page

**Impact:** Users don't understand what each term means or how they relate.

**Fix priority:** ⚠️ **IMPORTANT** — Confuses users

**Recommended fix:**
- Standardize: "ResusGPS" (point-of-care tool), "Safe-Truth" (provider event tool), "Parent Safe-Truth" (parent experience), "Paeds Resus" (platform)
- Use "Provider" consistently (not "Healthcare Worker")
- Add one place (e.g. footer or "About") that explains the relationship
- Update all navigation and copy to use consistent terms

---

### 12. "For Institutions" Navigation is Confusing

**Manus finding:** "For Institutions" shown to everyone but page is gated  
**Cursor finding:** Header shows "For Institutions" for all users; InstitutionalPortal requires `role === "institution"`

**Details:**
- Header shows "For Institutions" link for everyone (authenticated and unauthenticated)
- Institutional page is wrapped in `ProtectedPageWrapper` with `allowedRoles={["institution"]}`
- Non-institutional users who click "For Institutions" see "Access Restricted"

**Impact:** Looks like public info but behaves like gated product. Confusing.

**Fix priority:** ⚠️ **IMPORTANT** — UX confusion

**Recommended fix:**
- Option A: Make institutional **content** public (marketing + contact) and only gate "Institutional Portal" and "Onboarding"
- Option B: Rename nav to "Institutional Portal" and create separate public "For institutions" info page
- Option C: Only show "For Institutions" to institutional users

---

### 13. Breadcrumb Points to Non-Route

**Manus finding:** (Not found by Manus)  
**Cursor finding:** `breadcrumbMap` includes `/safe-truth-analytics` but no route exists

**Details:**
- `breadcrumbMap` in navigation.ts includes `/safe-truth-analytics`
- No route for this in App.tsx
- Breadcrumb could point to dead path

**Impact:** Broken navigation if breadcrumb is clicked.

**Fix priority:** ⚠️ **IMPORTANT** — Broken navigation

**Recommended fix:**
- Remove `/safe-truth-analytics` from breadcrumbMap or add route/redirect
- Test all breadcrumb links to ensure they work

---

### 14. Anonymous Users Land Straight in ResusGPS

**Manus finding:** (Not found by Manus)  
**Cursor finding:** Default route `/` renders ResusGPS; no landing page for anonymous users

**Details:**
- Unauthenticated users who visit `/` see ResusGPS directly
- No marketing landing, no product overview, no role chooser
- Users don't understand what the platform is

**Impact:** New visitors may be confused about what they're looking at.

**Fix priority:** ⚠️ **IMPORTANT** — Poor onboarding

**Recommended fix:**
- Decide: Should `/` be ResusGPS (for providers) or a short landing?
- If ResusGPS: ensure "Home"/"Dashboard" is obvious for logged-in users
- If landing: add short intro (e.g. "Paeds Resus – Point-of-care + Training + Safe-Truth") with CTAs ("Start ResusGPS", "For parents", "For institutions", "Sign in")

---

### 15. Support and Legal Navigation Are Empty

**Manus finding:** (Not found by Manus)  
**Cursor finding:** `supportNavItems` and `legalNavItems` are empty; footer links redirect to other pages

**Details:**
- `navigation.ts` has empty support and legal nav items
- Footer links for Contact, Privacy, Terms, FAQ redirect to `/institutional`, `/learner-dashboard`, etc.
- No dedicated support or legal pages

**Impact:** Users can't find support or legal info easily.

**Fix priority:** ⚠️ **IMPORTANT** — Poor UX

**Recommended fix:**
- Either add real support/legal routes and wire them
- Or document in one place (e.g. footer) where each link goes
- Ensure Contact, Privacy, Terms, FAQ are easy to find

---

## Minor Issues (Polish)

### 16. Accessibility is Minimal

**Manus finding:** Only 3 ARIA attributes across 62 pages  
**Cursor finding:** (Not audited by Cursor)

**Details:**
- No alt text for images
- No ARIA labels on buttons/forms
- No keyboard navigation hints
- No focus indicators
- No screen reader support

**Impact:** Excludes disabled users. Non-compliant with WCAG.

**Fix priority:** ⚠️ **IMPORTANT** — Accessibility compliance

**Recommended fix:**
- Add ARIA labels to all interactive elements
- Add alt text to all images
- Ensure keyboard navigation works
- Test with screen readers

---

### 17. M-Pesa Webhook May Not Match Payment

**Manus finding:** (Not found by Manus)  
**Cursor finding:** transactionId mismatch between initiate and callback

**Details:**
- When initiating: `transactionId = checkoutRequestID`
- Callback sends: `MpesaReceiptNumber` (different)
- Webhook looks up by receipt number → payment not found

**Impact:** Webhook fails to find payment; certificate never issued.

**Fix priority:** 🔴 **CRITICAL** — Blocks payment completion

**Recommended fix:**
- Confirm M-Pesa integration: does callback include checkoutRequestID or only receipt number?
- Store both checkoutRequestID and receipt number
- Have webhook look up by receipt number (or whichever the callback sends)
- Test webhook with real M-Pesa transaction

---

## Summary: Priority Matrix

| Priority | Category | Issue | Effort | Impact |
|----------|----------|-------|--------|--------|
| 🔴 CRITICAL | Flows | Enrollment → Payment → Certificate broken | 2-3 days | Blocks revenue, user success |
| 🔴 CRITICAL | Navigation | Referral/Personal Impact unreachable | 1 day | Core workflow hidden |
| 🔴 CRITICAL | Auth | Password reset missing | 1 day | Users locked out |
| 🔴 CRITICAL | Flows | Safe-Truth notifications missing | 1 day | Breaks engagement |
| 🔴 CRITICAL | Security | Role checks only on frontend | 2 days | Security vulnerability |
| 🔴 CRITICAL | Payments | M-Pesa webhook may not match | 1 day | Blocks payment completion |
| ⚠️ IMPORTANT | Navigation | 31 orphaned pages | 3-5 days | Features undiscoverable |
| ⚠️ IMPORTANT | UX | Empty states missing/inconsistent | 2 days | Confuses users |
| ⚠️ IMPORTANT | Data | Hardcoded dashboard numbers | 1 day | Undermines trust |
| ⚠️ IMPORTANT | Flows | Course/pricing mismatch | 1 day | Confuses users |
| ⚠️ IMPORTANT | Features | Certificate download broken | 1 day | Blocks credential sharing |
| ⚠️ IMPORTANT | UX | Inconsistent terminology | 1 day | Confuses users |
| ⚠️ IMPORTANT | UX | "For Institutions" navigation confusing | 1 day | UX confusion |
| ⚠️ IMPORTANT | Navigation | Breadcrumb points to non-route | 30 min | Broken navigation |
| ⚠️ IMPORTANT | Onboarding | Anonymous users land in ResusGPS | 1 day | Poor onboarding |
| ⚠️ IMPORTANT | Navigation | Support/legal nav empty | 1 day | Hard to find help |
| ⚠️ IMPORTANT | Accessibility | Minimal ARIA/alt text | 2-3 days | Accessibility gap |

---

## Recommended Implementation Order

### Week 1: Critical Fixes (6-7 days)

1. **Fix M-Pesa webhook** (1 day) — Ensure payment is found and certificate issued
2. **Add password reset** (1 day) — Email-based recovery flow
3. **Fix enrollment→payment flow** (2-3 days) — Connect Enroll to Payment with same enrollment
4. **Move role checks to backend** (2 days) — Implement proper RBAC on server
5. **Add Safe-Truth notifications** (1 day) — Email when response is ready

### Week 2: Important Fixes (5-6 days)

6. **Make Referral/Personal Impact discoverable** (1 day) — Add to Header or render BottomNav
7. **Fix hardcoded dashboard numbers** (1 day) — Replace with real data or neutral copy
8. **Unify course/pricing** (1 day) — Single source of truth for courses
9. **Add empty state CTAs** (2 days) — Every data-dependent page
10. **Fix certificate download** (1 day) — PDF generation or S3 storage

### Week 3: Polish & Accessibility (4-5 days)

11. **Route orphaned pages** (3-5 days) — Organize protocols, wire assessments, hide demos
12. **Fix terminology** (1 day) — Standardize across nav and copy
13. **Add accessibility** (2-3 days) — ARIA labels, alt text, keyboard nav
14. **Fix navigation issues** (1 day) — Breadcrumbs, support/legal, "For Institutions"

---

## Conclusion

The platform is **technically solid** but **fragmented for users**. Both audits agree on the core issues:

1. **Critical workflows are broken** (enrollment→payment, referrals unreachable, password reset missing)
2. **Security is weak** (role checks on frontend only)
3. **UX is inconsistent** (empty states, hardcoded data, confusing terminology)
4. **Features are hidden** (31 orphaned pages, unreachable navigation)

**Implementing these fixes will:**
- Unblock revenue (fix payment flow)
- Improve engagement (notifications, discoverable features)
- Build trust (real data, consistent UX)
- Ensure security (backend role checks)
- Include all users (accessibility)

**Estimated total effort:** 2-3 weeks for all critical + important fixes
