# New User Walkthrough & UX Challenges Report

**Date**: 2026-04-11  
**Scope**: End-to-end enrollment flow for new healthcare provider user  
**Focus**: Friction points, missing guidance, and UX gaps

---

## Executive Summary

A new healthcare provider user encounters **8 critical UX challenges** across the enrollment journey, ranging from confusing role selection to unclear payment status. The platform successfully guides users through the core flow (login → role selection → course discovery → enrollment → payment), but lacks clarity, feedback, and error handling in key moments.

**Severity Breakdown**:
- 🔴 **Critical** (blocks progress): 2
- 🟠 **High** (causes confusion): 4
- 🟡 **Medium** (friction/clarity): 2

---

## User Journey Map

```
1. Landing (unauthenticated)
   ↓
2. Login / Register
   ↓
3. Role Selection ("Who are you?")
   ↓
4. Provider Dashboard (Home)
   ↓
5. Course Discovery (Catalog)
   ↓
6. Course Selection (Click "Enroll")
   ↓
7. Enrollment Modal (4-step flow)
   ├─ Step 1: Initial (promo? payment?)
   ├─ Step 2: Promo Code (optional)
   ├─ Step 3: Payment (M-Pesa)
   └─ Step 4: Success
   ↓
8. M-Pesa Reconciliation (polling for status)
   ↓
9. Certificate Issuance (auto)
```

---

## Challenge 1: 🔴 CRITICAL — Unclear Role Selection on First Login

**What happens**: New user logs in and sees "Welcome — Choose how you'll use the platform" with three options:
- Healthcare provider
- Parent / Caregiver
- Institution

**The problem**:
1. **No guidance on what each role unlocks** — User doesn't know if they should pick "provider" or "institution" if they work at a hospital
2. **Role is permanent-ish** — Once selected, it's not obvious how to change it; the header role dropdown exists but isn't visible until after selection
3. **Conflicting terminology** — "Individual" vs. "Healthcare provider" is unclear; some users might think "individual" means solo practitioner
4. **No context about course access** — User doesn't know if role affects course availability or pricing

**Impact**: New users may select wrong role, leading to frustration when they don't see expected content.

**Recommendation**:
- Add descriptions under each role:
  - **Healthcare Provider**: "Access ResusGPS, micro-courses, and clinical tools for individual learning"
  - **Parent / Caregiver**: "Learn pediatric emergency response and safety tips"
  - **Institution**: "Manage staff training, analytics, and institutional subscriptions"
- Add a "Change role anytime" note below the selection
- Show a small preview of what they'll see after selection (e.g., "You'll see: Dashboard, Courses, Protocols, Care Signal")

---

## Challenge 2: 🟠 HIGH — Course Catalog Lacks Clear Call-to-Action

**What happens**: User lands on `/courses` and sees:
- Large header: "Paediatric Resuscitation Courses"
- Filter buttons (Emergency Type, Difficulty Level, Enrollment Status)
- Course cards in a grid

**The problem**:
1. **No "Start Here" guidance** — New users don't know which course to take first; no recommended learning path
2. **Emergency type categories are emoji-heavy** — 🫁, ⚡, 🧠, etc. are cute but not immediately clear to non-native English speakers or on small screens
3. **No prerequisite visibility** — Some courses may require foundational knowledge, but this isn't obvious until you click
4. **Price is hidden until enrollment modal opens** — User has to click "Enroll" to see cost, then go back if it's too expensive
5. **No "Free" or "Promo" badge** — User doesn't know which courses are free or have active promotions

**Impact**: Users waste time browsing without direction; may abandon if price is unexpected.

**Recommendation**:
- Add a "Recommended for You" section at the top (e.g., "Start with Foundational Courses")
- Show price on course card (e.g., "KES 200" or "Free with promo")
- Add a "Prerequisite" badge if course requires prior knowledge
- Replace emoji with text labels or use emoji + label (e.g., "🫁 Respiratory")
- Add a "Learning Path" sidebar showing progression (Foundational → Advanced)

---

## Challenge 3: 🟠 HIGH — Enrollment Modal Step 1 is Ambiguous

**What happens**: User clicks "Enroll" and sees:
- Course cost display
- "Enroll (Admin - Free)" button (only for admins)
- "Have a Promo Code?" button
- "Continue to Payment" button

**The problem**:
1. **Three buttons, unclear priority** — User doesn't know which button to click; "Have a Promo Code?" suggests they should have one
2. **"Admin - Free" button confuses non-admins** — Regular users see this button disabled/hidden but don't know why
3. **No explanation of what happens next** — Clicking "Continue to Payment" doesn't explain M-Pesa flow or time commitment
4. **No "Skip" or "Cancel" option visible** — User has to close the modal via X button (not obvious on mobile)

**Impact**: Users hesitate; some may close modal thinking they're missing a promo code.

**Recommendation**:
- Reorder buttons: "Continue to Payment" (primary), "Have a Promo Code?" (secondary), "Cancel" (tertiary)
- Add a small info icon next to "Have a Promo Code?" with tooltip: "Already have a discount code? Click here"
- Add a one-liner: "You'll pay KES {price} via M-Pesa" or "Proceed to M-Pesa payment"
- Make "Cancel" button visible (currently only X icon)

---

## Challenge 4: 🟠 HIGH — Promo Code Validation Lacks Feedback

**What happens**: User clicks "Have a Promo Code?", enters code, clicks "Validate Code"

**The problem**:
1. **No loading state clarity** — Button says "Validating..." but no spinner or progress indicator
2. **Error messages are generic** — "Invalid promo code: {message}" doesn't explain why (expired? max uses? wrong code?)
3. **No success feedback before moving to payment** — After validation, user is immediately moved to payment step with no confirmation
4. **Back button resets state** — User has to re-enter promo code if they go back (minor, but annoying)
5. **No discount preview before payment** — User doesn't see final price until payment step

**Impact**: Users don't trust the validation; may try multiple times or abandon.

**Recommendation**:
- Add spinner icon during validation
- Show discount amount before moving to payment: "✓ Promo code applied! Discount: 50% (KES 100 off)"
- Show specific error reasons:
  - "Code expired on {date}"
  - "Code has reached max uses ({current}/{max})"
  - "Code not found"
- Remember promo code if user goes back (use state)
- Show final price in promo step: "Final price: KES 100 (was KES 200)"

---

## Challenge 5: 🔴 CRITICAL — M-Pesa Payment Flow Lacks Status Clarity

**What happens**: User enters phone number and clicks "Pay with M-Pesa"

**The problem**:
1. **No clear next steps** — User sees "STK Push sent! Check your phone for M-Pesa prompt" but doesn't know:
   - How long to wait
   - What to do if they don't see the prompt
   - Whether they should stay on this page or navigate away
2. **Modal closes too quickly** — After 2 seconds, enrollment is marked as "success" even if M-Pesa payment hasn't completed
3. **No reconciliation UI** — User doesn't see real-time payment status (pending → completed/failed)
4. **No error recovery** — If M-Pesa fails, user doesn't know how to retry or check status
5. **Phone number validation is weak** — No format checking (e.g., must start with 07 or 254)

**Impact**: Users think they're enrolled when payment is still pending; may navigate away and lose track of enrollment status.

**Recommendation**:
- Show a "Payment Status" screen after STK push:
  - "Waiting for M-Pesa confirmation..."
  - "Checking payment every 5 seconds"
  - Poll count: "Attempt 1/24"
  - "Don't close this window"
- Add phone number format validation: "Phone must be 07XXXXXXXX or 254XXXXXXXXX"
- Show real-time status updates (MpesaReconciliationStatus component is ready; integrate it)
- Add "Manual Check" button: "Haven't received prompt? Click here to check status"
- Keep modal open until payment is confirmed (don't close after 2 seconds)

---

## Challenge 6: 🟡 MEDIUM — No Enrollment Confirmation or Receipt

**What happens**: User completes enrollment and sees "Enrollment Successful!" modal

**The problem**:
1. **No receipt or confirmation email** — User doesn't have proof of enrollment or payment
2. **No next steps** — "You can now access the course" is vague; where do they go?
3. **No certificate preview** — User doesn't know when/how to access certificate
4. **No course access link** — Modal doesn't show a direct link to the course

**Impact**: Users feel uncertain if enrollment actually worked; may try to enroll again.

**Recommendation**:
- Show enrollment confirmation with:
  - Course title
  - Enrollment date
  - Payment method (M-Pesa / Admin-Free / Promo Code)
  - Amount paid
  - Enrollment ID (for support reference)
- Add "Go to Course" button (direct link)
- Add "Download Receipt" button (PDF)
- Send confirmation email
- Show "Certificate will be issued after course completion"

---

## Challenge 7: 🟡 MEDIUM — No Guidance on Course Access Duration

**What happens**: User enrolls in course and wonders how long they have access

**The problem**:
1. **No access duration displayed** — User doesn't know if they have 1 month, 1 year, or lifetime access
2. **No progress tracking** — User doesn't know how long the course takes or what percentage is complete
3. **No "Start Course" button** — After enrollment, user has to navigate back to course catalog or dashboard to start

**Impact**: Users don't know when to start or if they're running out of time.

**Recommendation**:
- Show access duration in enrollment confirmation: "You have 1 month access (until {date})"
- Add course duration estimate: "Estimated time: 2 hours"
- Add "Start Course Now" button in confirmation modal
- Show progress on course card: "0% complete"

---

## Challenge 8: 🟠 HIGH — Header Navigation is Role-Dependent but Not Obvious

**What happens**: User logs in as provider and sees header with:
- ResusGPS
- Dashboard
- Instructor
- Patients
- Protocols
- Performance
- Care Signal
- Referral
- Personal Impact

**The problem**:
1. **Too many options** — 9 items in header is overwhelming for new user; unclear which are essential
2. **No visual hierarchy** — All items are equally prominent; no "primary" vs. "secondary" distinction
3. **Role dropdown is hidden** — User doesn't see the role selector in header (it's in the account dropdown)
4. **No "Courses" link in provider nav** — User has to remember to go to `/courses` manually; it's not in the header

**Impact**: New users don't know where to go; may miss important features like courses.

**Recommendation**:
- Add "Courses" to provider navigation (after Dashboard)
- Reorganize header into sections:
  - **Primary**: ResusGPS, Dashboard, Courses
  - **Secondary**: Instructor, Protocols, Care Signal
  - **Tertiary**: Performance, Personal Impact, Referral (in dropdown menu)
- Add visual separator between sections
- Make role selector more prominent (currently in account dropdown)

---

## Challenge 9: 🟡 MEDIUM — Login / Registration Flow Lacks Clarity

**What happens**: User lands on `/login` or `/register`

**The problem**:
1. **No "Sign Up" link on login page** — User has to manually navigate to `/register`
2. **No social login** — Only email/password (or OAuth if configured)
3. **No "Forgot Password" link visible** — User has to remember `/forgot-password` URL
4. **No email verification** — User doesn't know if account is active after signup
5. **No onboarding after first login** — User is immediately asked to pick role; no welcome tour

**Impact**: Users may struggle to create account or recover password.

**Recommendation**:
- Add "Don't have an account? Sign up" link on login page
- Add "Forgot password?" link on login page
- Add email verification step (send confirmation email)
- Add onboarding tour after first login (optional, can skip)
- Show "Welcome, {name}!" after login before role selection

---

## Summary Table

| Challenge | Severity | Component | Impact | Fix Effort |
|-----------|----------|-----------|--------|-----------|
| Role selection confusion | 🔴 Critical | Home.tsx | Users pick wrong role | Medium |
| Course catalog lacks guidance | 🟠 High | CourseCatalog.tsx | Users don't know where to start | Medium |
| Enrollment modal ambiguous | 🟠 High | EnrollmentModal.tsx | Users hesitate to proceed | Low |
| Promo code validation feedback | 🟠 High | EnrollmentModal.tsx | Users don't trust validation | Low |
| M-Pesa payment status unclear | 🔴 Critical | EnrollmentModal.tsx + MpesaReconciliationStatus | Users think they're enrolled when payment pending | High |
| No enrollment confirmation | 🟡 Medium | EnrollmentModal.tsx | Users unsure if enrollment worked | Low |
| No course access guidance | 🟡 Medium | EnrollmentModal.tsx | Users don't know how long they have | Low |
| Header navigation overwhelming | 🟠 High | Header.tsx | New users lost; miss courses | Medium |
| Login/registration unclear | 🟡 Medium | Login.tsx, Register.tsx | Users struggle to create account | Low |

---

## Priority Fixes (Next Sprint)

### Phase 1: Critical (Blocks Enrollment)
1. **M-Pesa payment status clarity** — Integrate MpesaReconciliationStatus component into EnrollmentModal; keep modal open until payment confirmed
2. **Role selection guidance** — Add descriptions and "Change role anytime" note

### Phase 2: High (Improves UX)
3. **Enrollment modal reordering** — Reorder buttons, add info icon, show payment method
4. **Course catalog guidance** — Add "Recommended for You", show prices on cards, add learning path
5. **Header navigation** — Add "Courses" link, reorganize into sections

### Phase 3: Medium (Polish)
6. **Enrollment confirmation** — Show receipt, next steps, access duration
7. **Promo code feedback** — Add spinner, show discount preview, specific error messages
8. **Login/registration** — Add links, email verification, onboarding tour

---

## Recommendations for Immediate Implementation

### 1. Integrate MpesaReconciliationStatus into EnrollmentModal
**File**: `client/src/components/EnrollmentModal.tsx`

Replace the current 2-second timeout with the MpesaReconciliationStatus component:

```tsx
// After STK push, show reconciliation status instead of immediate success
if (result.success) {
  setEnrollmentStep("reconciliation");
  // MpesaReconciliationStatus will handle polling and status updates
}

// In the JSX:
{enrollmentStep === "reconciliation" && (
  <MpesaReconciliationStatus
    enrollmentId={enrollmentId}
    checkoutRequestId={result.checkoutRequestId}
    phoneNumber={phoneNumber}
    amount={finalPrice}
    onPaymentComplete={(success) => {
      if (success) {
        setEnrollmentStep("success");
      } else {
        setEnrollmentStep("payment"); // Go back to retry
      }
    }}
  />
)}
```

### 2. Add Phone Number Validation
**File**: `client/src/components/EnrollmentModal.tsx`

```tsx
const validatePhoneNumber = (phone: string): boolean => {
  // Accept 07XXXXXXXX or 254XXXXXXXXX format
  const pattern = /^(07\d{8}|254\d{9})$/;
  return pattern.test(phone.replace(/\s/g, ""));
};

// In payment step:
<Button
  onClick={handleMpesaPayment}
  disabled={isLoading || !validatePhoneNumber(phoneNumber)}
  className="w-full"
>
  {isLoading ? "Processing..." : "Pay with M-Pesa"}
</Button>
```

### 3. Add Course Price to Card
**File**: `client/src/pages/CourseCatalog.tsx`

Show price on course card instead of hiding until modal:

```tsx
<div className="flex justify-between items-center">
  <h3 className="font-semibold">{course.title}</h3>
  <Badge>{course.price === 0 ? "Free" : `KES ${(course.price / 100).toFixed(2)}`}</Badge>
</div>
```

### 4. Add "Courses" to Provider Header
**File**: `client/src/components/Header.tsx`

```tsx
if (r === "provider") {
  return [
    RESUS_GPS_NAV,
    { label: "Dashboard", href: "/home", icon: "🏠" },
    { label: "Courses", href: "/courses", icon: "📚" },  // Add this
    { label: "Instructor", href: "/instructor-portal", icon: "🎓" },
    // ... rest
  ];
}
```

### 5. Improve Role Selection Copy
**File**: `client/src/pages/Home.tsx`

```tsx
<Label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer">
  <RadioGroupItem value="individual" id="onb-individual" />
  <Stethoscope className="h-5 w-5" />
  <div>
    <p className="font-medium">Healthcare Provider</p>
    <p className="text-sm text-muted-foreground">
      Access ResusGPS, micro-courses, and clinical tools for individual learning
    </p>
  </div>
</Label>

// Add note at bottom:
<p className="text-xs text-muted-foreground text-center">
  You can change your role anytime from the account menu
</p>
```

---

## Testing Checklist

- [ ] New user can complete enrollment without confusion
- [ ] M-Pesa payment status is visible and updates in real-time
- [ ] Promo code validation shows clear feedback
- [ ] Course prices are visible before enrollment modal
- [ ] Role selection includes helpful descriptions
- [ ] Header navigation includes "Courses" link
- [ ] Enrollment confirmation shows receipt and next steps
- [ ] Phone number validation prevents invalid formats
- [ ] Modal stays open until payment is confirmed

---

## Conclusion

The enrollment system has a solid foundation but lacks clarity and guidance at critical moments. The most urgent fix is integrating the M-Pesa reconciliation UX to prevent users from navigating away during payment. Secondary fixes should focus on course discovery guidance and header navigation to help new users find what they need.

**Estimated effort**: 2-3 days for all fixes (Phase 1 + 2)
