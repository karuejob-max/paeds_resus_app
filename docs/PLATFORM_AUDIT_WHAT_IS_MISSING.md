# Platform Audit: What’s Missing for the User

**Purpose:** Identify gaps so the platform makes sense to users end-to-end.  
**Scope:** User journeys, navigation, flows, empty states, and consistency.  
**Date:** 2026-02-25.

---

## 1. Navigation and discoverability

### 1.1 BottomNav is never rendered

- **Finding:** `BottomNav` (Refer, Impact, etc.) is **not imported or rendered** anywhere. The only references are in its own file.
- **Impact:** Users have no in-app way to reach **Referral** (`/referral`) or **Personal Impact** (`/personal-impact`) unless they know the URL or use Dashboard sidebar (which does list other items but not Referral).
- **Recommendation:** Either render `BottomNav` on relevant layouts (e.g. provider dashboard, ResusGPS, or learner views) or add **Referral** and **Personal Impact** to the Header / Dashboard sidebar / Home hub so they are discoverable.

### 1.2 Referral and Personal Impact visibility for providers

- **Finding:** Header (provider) shows Dashboard, Patients, Protocols, Performance, Safe-Truth. **Referral** is not in the main nav; it exists at `/referral` and is linked from BottomNav (which is unused).
- **Recommendation:** Add “Referral” (or “Refer”) to provider Header or to the Home hub cards so clinicians can find “Manage patient referrals” without guessing.

### 1.3 Support and legal nav empty

- **Finding:** `supportNavItems` and `legalNavItems` in `navigation.ts` are empty (“No support pages implemented yet” / “No legal pages implemented yet”). Footer and other links point to `/institutional`, `/learner-dashboard`, etc., for Contact, Privacy, Terms.
- **Impact:** No dedicated Support or Legal entry in nav; users rely on redirects. Acceptable short term if Contact/Privacy/Terms/FAQ destinations are correct and communicated (e.g. in footer).
- **Recommendation:** Either add real support/legal routes and wire them here, or document in one place (e.g. footer or help centre) where “Support” and “Legal” go (e.g. institutional, learner-dashboard).

### 1.4 Breadcrumb points to non-route

- **Finding:** `breadcrumbMap` includes `/safe-truth-analytics` but there is no route for it in `App.tsx` (only redirects and main routes).
- **Recommendation:** Remove `/safe-truth-analytics` from breadcrumbMap or add a route/redirect for it so breadcrumbs never point to a dead path.

---

## 2. Enroll → Payment → Certificate flow

### 2.1 Two separate flows that don’t connect

- **Enroll page (`/enroll`):** User picks a course and submits; `enrollment.create` runs; on success, user is sent to “success” then to `/learner-dashboard` after 3s. There is **no “Pay now”** or “Proceed to payment” that passes the created enrollment to the payment flow.
- **Payment page (`/payment`):** User picks a course and pays via M-Pesa. **M-Pesa `initiatePayment`** creates **its own** enrollment and payment in the DB, then STK push is sent. So payment is tied to a **new** enrollment, not the one created on the Enroll page.
- **Impact:**  
  - Someone who “Enrolls” on `/enroll` never pays in-app and never gets a certificate from that enrollment.  
  - Someone who pays on `/payment` gets a new enrollment + payment; when the webhook completes, certificate is issued for **that** enrollment. So the **certificate flow is correct for the Payment page**, but the **Enroll page is a dead end** for payment and certificate.
- **Recommendation:**  
  - **Option A:** After successful enrollment on Enroll, redirect to Payment with `?enrollmentId=…` (or equivalent) and have Payment use that enrollment (and create only a payment record), not a second enrollment.  
  - **Option B:** Make Enroll a “course selection + payment” single flow (e.g. Enroll shows courses, then “Pay with M-Pesa” and reuses the same enrollment for the payment and webhook).  
  - **Option C:** Clearly separate: “Apply for a course” (Enroll, no payment) vs “Buy a course” (Payment only), and in UI/copy explain that certificates come only after payment (and remove or soften “Get certified immediately” on Enroll if payment is required).

### 2.2 Enroll API returns placeholder enrollmentId

- **Finding:** In `server/routers/enrollment.ts`, after `createEnrollment(...)`, the code sets `const enrollmentId = 1; // Placeholder` and returns that. The real insert result from the DB is not used.
- **Impact:** Even if the client later sent “pay for this enrollment”, it would send `1` instead of the real id. SMS reminder is also created with `enrollmentId: 1`.
- **Recommendation:** Return the actual enrollment id from the insert (e.g. from `createEnrollment` result) and use it for the response and for SMS reminder.

### 2.3 M-Pesa webhook may not find the payment

- **Finding:** When creating a payment in `mpesa.initiatePayment`, `transactionId` is set to `mpesaResponse.checkoutRequestID`. The M-Pesa callback (webhook) sends **MpesaReceiptNumber** (a different value). The webhook looks up payment by `payments.transactionId = transactionId` (from the callback), which is the receipt number, not the checkout request id.
- **Impact:** Webhook might never find the payment record, so status stays “pending”, enrollment never gets `paymentStatus: "completed"`, and no certificate is issued.
- **Recommendation:** Confirm how your M-Pesa integration maps callbacks to payments. Either: (a) store both checkoutRequestID and (when received) MpesaReceiptNumber and have the webhook find by receipt number (or by checkout request id if the callback includes it), or (b) ensure the callback sends the same identifier you store when initiating the STK push, and the webhook uses that.

---

## 3. Role and landing experience

### 3.1 First-time / unauthenticated landing on “/”

- **Finding:** The default route `/` renders **ResusGPS** (the clinical tool). There is no separate “marketing” or “product choice” landing for anonymous users.
- **Impact:** A new visitor may land straight in the clinical app with no context. Whether that’s desired depends on product: if the main goal is “providers start here,” it can be fine; if you want to explain “Paeds Resus = ResusGPS + Safe-Truth + courses + institutions,” a short landing or role chooser may help.
- **Recommendation:** Decide if `/` should stay as ResusGPS or become a short landing (e.g. “Paeds Resus – Point-of-care + Training + Safe-Truth”) with clear CTAs (e.g. “Start ResusGPS”, “For parents”, “For institutions”, “Sign in”). If you keep ResusGPS at `/`, ensure the Header and one clear link (e.g. “Dashboard” or “Home”) take logged-in users to `/home` so they can choose Paeds Resus, Enroll, My learning, etc.

### 3.2 “For Institutions” and access

- **Finding:** Header shows “For Institutions” for everyone. The Institutional page is wrapped in `ProtectedPageWrapper` with `allowedRoles={["institution"]}`. So providers/parents or unauthenticated users who click “For Institutions” may see “Access Restricted.”
- **Impact:** “For Institutions” can feel like general info but behaves like a gated product area. That may be confusing.
- **Recommendation:** Either: (a) make the Institutional **content** public (e.g. marketing + “Contact us”) and only gate “Institutional Portal” and “Onboarding,” or (b) keep the gate but change the label (e.g. “Institutional Portal”) and provide a separate public “For institutions” info/contact page.

### 3.3 Parent dashboard hardcoded numbers

- **Finding:** LearnerDashboard for **parent** role shows “0” for “Healthcare journey events shared” and “3” for “System improvements identified” (hardcoded).
- **Impact:** Numbers don’t reflect real data; “3” looks like a real metric.
- **Recommendation:** Replace with real data (e.g. Safe-Truth submissions count, or “improvements” from backend) or use neutral copy (e.g. “Share your first story” / “Your feedback helps improve care”) and remove fake counts.

### 3.4 Provider dashboard hardcoded “System Gaps: 5”

- **Finding:** LearnerDashboard for **provider** shows “5” for “Gaps identified from events” with no backend.
- **Recommendation:** Either wire to real metrics (e.g. from Safe-Truth or events) or replace with “View gaps” CTA or generic copy and remove the fake number.

---

## 4. Consistency and clarity

### 4.1 “Safe-Truth” vs “Paeds Resus” and “ResusGPS”

- **Finding:** Navigation and copy use “Safe-Truth” (provider tool), “Parent Safe-Truth,” “ResusGPS,” “Paeds Resus,” “Learner Dashboard,” “My learning.” Per PLATFORM_SOURCE_OF_TRUTH, Paeds Resus is the org/platform; ResusGPS is one product.
- **Recommendation:** Keep terminology consistent in nav and key screens: e.g. “ResusGPS” for the point-of-care app, “Safe-Truth” for the provider event tool, “Parent Safe-Truth” or “For parents” for the parent experience, and “Paeds Resus” as the overall brand. Ensure at least one place (e.g. footer or “About”) explains the relationship so the platform “makes sense” to the user.

### 4.2 Enroll vs Payment course lists and pricing

- **Finding:** Enroll page lists courses (e.g. BLS 500, First Aid 300, ACLS 2000) with one set of prices/durations. Payment page lists different courses (BLS 10000, ACLS 20000, PALS 20000, Bronze/Silver/Gold fellowship 70k–150k) and different durations. Program types also differ (e.g. “first-aid” on Enroll vs not on Payment).
- **Impact:** User could see different prices and options on “Enroll” vs “Payment,” which is confusing.
- **Recommendation:** Align course list and pricing (and programType values) between Enroll and Payment, or make it explicit (e.g. “Enroll = apply; Payment = pay for a selected course”) and ensure both use the same program types where they refer to the same product.

### 4.3 Certificate “Download” when no URL

- **Finding:** In LearnerDashboard “My Certificates,” a Download button is shown only when `certificateUrl` is set. Certificates are currently saved with `certificateUrl: ""`, so most users will never see a download button.
- **Recommendation:** Either: (a) implement certificate PDF generation and storage (e.g. S3) and set `certificateUrl` when issuing, or (b) add a “Download” action that generates the PDF on demand (e.g. via existing `certificates.download` or a new endpoint) so the button is useful even without a stored URL.

---

## 5. Empty and placeholder states

### 5.1 Performance dashboard and other dashboards

- **Finding:** PerformanceDashboard (and similar) depend on `trpc.performance.*` and other backends. When there is no data, we added an empty-state CTA in PerformanceDashboard (D1); other dashboards may still show “0” or “No data” without guidance.
- **Recommendation:** For each main dashboard (Performance, Kaizen, Personalized Learning, Predictive Intervention, etc.), ensure empty state has one clear CTA (e.g. “Complete an assessment to see your metrics” with link to ResusGPS or Safe-Truth) so the user knows what to do next.

### 5.2 Institutional portal KPIs

- **Finding:** InstitutionalPortal shows “Staff Enrolled: 0”, “Certified: 0”, “Incidents Logged: 0”, “Lives Improved: 0” with no wiring to real data mentioned in the audit.
- **Recommendation:** Wire these to real data (enrollments, certificates, incidents, impact) or replace with “Get started” / “Onboard your institution” and links to onboarding or contact, so the portal doesn’t feel like a dead dashboard.

---

## 6. Summary: priority fixes for “making sense” to the user

| Priority | Item | Action |
|----------|------|--------|
| **High** | Referral and Personal Impact not reachable | Render BottomNav where appropriate, or add Referral (and Personal Impact) to Header / Home / Dashboard sidebar. |
| **High** | Enroll and Payment are disconnected | Connect flows: either Enroll → Payment with same enrollment, or one combined flow; fix enrollmentId return and payment–enrollment link. |
| **High** | M-Pesa webhook may not match payment | Align transactionId / checkoutRequestID / MpesaReceiptNumber so webhook finds the payment and certificate is issued after success. |
| **Medium** | Enroll returns placeholder enrollmentId | Return real enrollment id from DB and use it for SMS and any “pay for this enrollment” step. |
| **Medium** | Hardcoded dashboard numbers (parent “3”, provider “5”) | Replace with real data or neutral copy. |
| **Medium** | Course/pricing mismatch Enroll vs Payment | Unify course list and pricing (and programType) or clearly separate “apply” vs “pay” and document. |
| **Medium** | Certificate download not useful | Add on-demand PDF or store certificateUrl when generating so “Download” works. |
| **Low** | Support/legal nav empty | Add routes or document where Support/Legal go; fix or remove safe-truth-analytics breadcrumb. |
| **Low** | “/” = ResusGPS for everyone | Decide if anonymous users should see a short landing first; ensure “Home”/“Dashboard” is obvious for logged-in users. |
| **Low** | “For Institutions” access | Make institutional info public or rename nav and add a public info page. |

---

## 7. Combined perspective (Cursor + Manus)

Manus ran a full platform audit (2026-03-15) covering navigation, flows, data, auth, error handling, content, performance, and UX. Below merges Manus’s findings with this audit so we have one perspective.

### 7.1 Where we agree

- **Enroll vs Payment disconnected** — Both audits flag this; certificate only makes sense when paying via Payment (M-Pesa), not when “enrolling” on Enroll.
- **Referral / Personal Impact not discoverable** — Cursor: BottomNav never rendered; Manus: navigation incomplete so users can’t find features.
- **Certificate download** — Both: no useful download (no URL / no share or verification link).
- **Empty states** — Cursor: add CTAs on dashboards; Manus: only ~2 empty-state messages across 62 pages, need ~20.
- **Institutional portal** — Both: KPIs are placeholders (0s), need wiring or “Get started” CTAs.
- **Terminology** — Both: inconsistent (Safe-Truth vs SafeTruth, Provider vs Healthcare Worker, Referral vs Clinical Referral).
- **Orphaned / unreachable content** — Cursor: categorized non-routed pages (protocols as subcomponents, one backup removed); Manus: 31 pages “orphaned” with no route. Difference: Manus counts protocol pages (AnaphylaxisProtocol, etc.) as orphaned; Cursor treated them as subcomponents of ClinicalAssessmentGPS (which itself has no route). **Unified view:** Either route protocol pages (e.g. `/protocols/:id` or by category) so “Protocols” in nav leads to a usable library, or keep them as subcomponents and ensure the main “Protocols” page (EmergencyProtocols) surfaces them clearly.

### 7.2 What Manus adds (beyond this audit)

**Auth & security**

- **Password reset** — Missing; users who forget passwords are locked out. (Cursor did not cover.)
- **Role switching** — Users can change role in UI without re-auth; Manus flags security risk. Backend should enforce role; admin actions should be audited.
- **OAuth / SSO** — Not implemented; limits institutional adoption.

**Flows**

- **Referral status** — clinicalReferrals has a `status` field (pending, accepted, rejected, completed); Manus says “track status” and “notification to recipient” are missing (no email/SMS to receiving facility, no feedback loop).
- **Safe-Truth** — No dedicated admin review page, no parent notification when response is ready, no export of Safe-Truth history.
- **ResusGPS** — No “save for later,” no collaboration mode, undo not visible (ResusGPS v4 in backlog).

**Data & backend**

- **107 DB tables** — Manus: ~15% “dead” (no queries); Cursor/E2: preferred “document reserved” over delete. Aligned: don’t drop without product call; document which are unused.
- **Protocol library** — Backend exists, frontend not fully wired; collaboration/undo not implemented.

**Error handling & resilience**

- **Network / timeout / offline** — No retry, no offline mode; rate limiting and concurrent-request behaviour not addressed. (Cursor did not cover.)
- **Validation** — Manus: 2,455 Zod validators, 946 error-related lines; strength to preserve.

**Content & help**

- **Explanations** — What is Safe-Truth? How do referrals work? No onboarding or help text.
- **Placeholder copy** — “Card Payment (Coming soon)”; courses hardcoded not from DB.
- **No FAQ / tooltips / video** — Reduces clarity for new users.

**Performance & UX**

- **Bundle size** — ~1.4MB; no lazy loading (all pages loaded upfront).
- **Accessibility** — Manus: only 3 aria attributes across 62 pages; no alt text, ARIA labels, keyboard hints, or screen reader support. Cursor did not audit a11y.
- **Loading states** — Inconsistent across pages.

**Missing features (Manus list, condensed)**

- **Critical:** Password reset, referral status tracking + notifications, Safe-Truth notifications, certificate download/share/verification, undo in ResusGPS.
- **Important:** Search/filter (protocols, assessments), bulk operations, export/reports, real-time notifications, collaboration.
- **Nice-to-have:** Mobile app, offline mode, analytics export, custom branding, API for EHR.

### 7.3 Unified priority list (Cursor + Manus)

| Priority | Item | Source | Action |
|----------|------|--------|--------|
| **P0** | Enroll ↔ Payment flow + enrollmentId + M-Pesa webhook | Cursor | Connect flows; return real enrollmentId; ensure webhook finds payment (receipt vs checkout id). |
| **P0** | Referral & Personal Impact discoverable | Cursor | Add to Header / Home / sidebar or render BottomNav. |
| **P0** | Password reset | Manus | Forgot-password flow so users aren’t locked out. |
| **P0** | Role checks on backend + audit | Manus | Enforce role in protectedProcedure; log admin actions. |
| **P1** | Certificate download / share / verify | Both | On-demand PDF or stored URL; optional verification link. |
| **P1** | Empty states with CTAs | Both | Every data-dependent page: one clear CTA (e.g. “Complete an assessment…”). |
| **P1** | Referral status + notifications | Manus | Use status field; notify recipient facility; optional provider follow-up. |
| **P1** | Safe-Truth: admin review + parent notification | Manus | Dedicated review path; notify parent when response ready. |
| **P1** | Fix hardcoded numbers (parent “3”, provider “5”) | Cursor | Real data or neutral copy. |
| **P1** | Course/pricing alignment Enroll vs Payment | Cursor | Single source (DB or config); consistent programType. |
| **P2** | Protocol library / route protocol pages | Manus + Cursor | Searchable protocols; route or clearly surface from EmergencyProtocols. |
| **P2** | Terminology + one-place explanation | Both | Consistent Safe-Truth, ResusGPS, Paeds Resus; one “About” or help. |
| **P2** | “For Institutions” + landing “/” | Cursor | Public institutional info or rename; optional landing for anonymous. |
| **P2** | Breadcrumb + support/legal nav | Cursor | Remove or fix safe-truth-analytics; document Support/Legal. |
| **P2** | Accessibility (ARIA, keyboard, focus) | Manus | Incremental: labels, alt text, focus indicators. |
| **P3** | ResusGPS undo / save for later / collaboration | Manus / backlog | Per ResusGPS v4 and product roadmap. |
| **P3** | Performance (lazy load, bundle) | Manus | Code-split routes; measure first paint. |
| **P3** | Offline, mobile, API, branding | Manus | Nice-to-have; product decision. |

### 7.4 How to use this combined audit

- **Product/CEO:** Use §6 and §7.3 for roadmap (what to fix first so the platform “makes sense” and is secure).
- **Dev (Cursor/Manus):** Use §1–5 for implementation detail; §7.2 for gaps only Manus had called out; §7.3 for a single ordered backlog.
- **Re-audit:** After P0/P1 items are done, re-check Enroll → Payment → Certificate, M-Pesa webhook, and navigation from a fresh user’s perspective.

---

*Cursor audit 2026-02-25. Manus audit 2026-03-15. Combined perspective added 2026-02-25.*
