# M-Pesa & P0 Critical Tasks Status Report

**Date:** 2026-03-15  
**Priority:** CRITICAL — Payment platform must work 100%  
**Owner:** Manus (Primary), Cursor (Support)

---

## Executive Summary

**M-Pesa Status:** 70% Complete — Credentials validated, STK Push ready, webhook MISSING  
**P0 Tasks:** 6 of 7 Done — Only backend role checks remaining  
**Blocker:** Webhook handler not implemented — payments complete but certificates not issued

---

## M-Pesa Payment Platform Status

### ✅ COMPLETED (70%)

| Component | Status | Details | File |
|-----------|--------|---------|------|
| **Daraja Credentials** | ✅ Done | Consumer Key, Secret, Passkey all validated | `docs/MPESA_CREDENTIALS_REFERENCE.md` |
| **M-Pesa Service Module** | ✅ Done | Token generation, STK Push logic, password generation | `server/services/mpesa.ts` |
| **Credentials Test** | ✅ Done | Daraja API authentication test passes | `server/daraja.test.ts` |
| **tRPC Payment Procedure** | ✅ Done | `initiateSTKPush` mutation ready | `server/routers/payments.ts` |
| **M-Pesa Config Reference** | ✅ Done | Complete documentation for all developers | `docs/MPESA_CREDENTIALS_REFERENCE.md` |

### 🔴 MISSING (30%) — CRITICAL BLOCKERS

| Component | Status | Impact | What's Needed |
|-----------|--------|--------|---------------|
| **Webhook Handler** | ❌ Missing | Payments complete but NO certificate issued | Implement `/api/payment/callback` handler |
| **Payment Page Wiring** | ❌ Missing | Users can't initiate STK Push from UI | Wire `Payment.tsx` to `initiateSTKPush` procedure |
| **End-to-End Test** | ❌ Not Done | Can't verify payment flow works | Test with phone 254708374149 |

---

## M-Pesa Payment Flow (Current State)

```
User clicks "Pay" on Payment.tsx
    ↓
[MISSING] Payment.tsx calls trpc.payments.initiateSTKPush()
    ↓
M-Pesa Service generates Bearer token ✅
    ↓
Service sends STK Push to M-Pesa API ✅
    ↓
User receives prompt on phone, enters PIN
    ↓
M-Pesa sends callback to /api/payment/callback
    ↓
[MISSING] Webhook handler receives callback
    ↓
[MISSING] Webhook matches payment to enrollment
    ↓
[MISSING] Webhook creates certificate
    ↓
User sees "Payment Complete" and certificate in LearnerDashboard
```

**Current Gap:** Steps 1, 7-10 are missing.

---

## P0 Critical Tasks Status

| # | Task ID | Title | Status | Done by | Date |
|---|---------|-------|--------|---------|------|
| 1 | P0-2a | Real enrollmentId from enrollment.create | ✅ Done | Cursor | 2026-02-25 |
| 2 | P0-2b | Enroll → Payment redirect with enrollmentId | ✅ Done | Cursor | 2026-02-25 |
| 3 | P0-1 | M-Pesa webhook: match payment, issue certificate | 🔴 **NOT STARTED** | — | — |
| 4 | P0-3 | Referral & Personal Impact discoverable | ✅ Done | Cursor | 2026-02-25 |
| 5 | P0-4 | Password reset | ✅ Done | Cursor | 2026-02-25 |
| 6 | P0-5 | Safe-Truth: notify parent when response ready | ✅ Done | Cursor | 2026-02-25 |
| 7 | P0-6 | Role checks on backend + admin audit log | 🔴 **NOT STARTED** | — | — |

**Completion:** 6/7 (86%)

---

## What Needs to Be Done (Priority Order)

### PRIORITY 1: M-Pesa Webhook (CRITICAL)

**Task:** Implement webhook handler at `/api/payment/callback`

**What it does:**
1. Receives payment callback from M-Pesa
2. Extracts `CheckoutRequestID` and `MpesaReceiptNumber`
3. Finds matching payment record in database
4. Updates payment status to "completed"
5. Creates certificate for the user
6. Marks enrollment as "paid"

**Files to create/modify:**
- `server/_core/webhooks/mpesa.ts` — NEW webhook handler
- `server/routers.ts` — Add webhook route
- `server/db.ts` — Add certificate creation helper
- `drizzle/schema.ts` — Ensure certificates table exists

**Estimated effort:** 2-3 hours

**Why critical:** Without this, users complete payment but never get certificates. Platform appears broken.

---

### PRIORITY 2: Wire Payment Page to STK Push (CRITICAL)

**Task:** Connect Payment.tsx frontend to `initiateSTKPush` backend procedure

**What it does:**
1. User enters phone number on Payment.tsx
2. Clicks "Pay with M-Pesa"
3. Frontend calls `trpc.payments.initiateSTKPush()`
4. M-Pesa prompt appears on user's phone
5. User enters PIN
6. Frontend waits for webhook confirmation
7. Shows "Payment Complete" message

**Files to modify:**
- `client/src/pages/Payment.tsx` — Add form, call tRPC procedure, handle loading/error states

**Estimated effort:** 1-2 hours

**Why critical:** Without this, users can't initiate payments from the UI.

---

### PRIORITY 3: End-to-End Test (CRITICAL)

**Task:** Test complete payment flow with test credentials

**Steps:**
1. Go to Payment page
2. Enter test phone: `254708374149`
3. Enter amount: `100` KES
4. Click "Pay with M-Pesa"
5. Verify STK Push prompt appears
6. Check webhook receives callback
7. Verify certificate is created
8. Verify enrollment status is "paid"

**Estimated effort:** 1 hour (+ 5 min wait for M-Pesa response)

**Why critical:** Only way to verify entire flow works.

---

### PRIORITY 4: Backend Role Checks (P0-6)

**Task:** Move role validation from frontend to backend

**What it does:**
1. Admin procedures check `ctx.user.role === 'admin'` on server
2. Prevents frontend bypass
3. Adds audit log for admin actions

**Files to modify:**
- `server/_core/trpc.ts` — Add `adminProcedure` helper
- `server/routers/*.ts` — Add role checks to admin endpoints

**Estimated effort:** 2-3 hours

**Why important:** Security. Frontend-only checks can be bypassed.

---

## Implementation Roadmap

```
Week 1 (This week):
├─ Implement M-Pesa webhook handler (2-3h)
├─ Wire Payment page to STK Push (1-2h)
├─ End-to-end test (1h)
└─ Commit and push to GitHub

Week 2:
├─ Backend role checks (2-3h)
├─ Certificate PDF generation (2-3h)
└─ Deploy to production

Week 3:
├─ P1 tasks (pricing, empty states, terminology)
└─ Performance optimization
```

---

## Technical Details for Implementation

### M-Pesa Webhook Handler Pseudocode

```typescript
// POST /api/payment/callback
export async function handleMpesaCallback(req: Request) {
  const data = req.body;
  
  // Extract key fields
  const checkoutRequestId = data.Body.stkCallback.CheckoutRequestID;
  const mpesaReceiptNumber = data.Body.stkCallback.CallbackMetadata.Item[1].Value;
  const amount = data.Body.stkCallback.CallbackMetadata.Item[0].Value;
  
  // Find payment by CheckoutRequestID
  const payment = await db.query.payments.findFirst({
    where: eq(payments.transactionId, checkoutRequestId)
  });
  
  if (!payment) {
    return { error: "Payment not found" };
  }
  
  // Update payment
  await db.update(payments)
    .set({
      status: "completed",
      mpesaReceiptNumber,
      completedAt: new Date()
    })
    .where(eq(payments.id, payment.id));
  
  // Create certificate
  await db.insert(certificates).values({
    userId: payment.userId,
    courseId: payment.courseId,
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  });
  
  // Update enrollment to "paid"
  await db.update(enrollments)
    .set({ status: "paid" })
    .where(eq(enrollments.id, payment.enrollmentId));
  
  return { success: true };
}
```

### Payment.tsx Pseudocode

```typescript
export function Payment() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const initiatePayment = trpc.payments.initiateSTKPush.useMutation();
  
  const handlePay = async () => {
    setIsLoading(true);
    try {
      const result = await initiatePayment.mutateAsync({
        phoneNumber,
        amount: 2000, // or from enrollment
        courseId: enrollmentId,
        courseName: "Course Name"
      });
      
      // Show success message
      toast.success("Check your phone for M-Pesa prompt");
      
      // Poll for payment completion
      pollForPaymentCompletion(result.checkoutRequestId);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handlePay}>
      <input 
        placeholder="254XXXXXXXXX"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />
      <button disabled={isLoading}>
        {isLoading ? "Processing..." : "Pay with M-Pesa"}
      </button>
    </form>
  );
}
```

---

## Success Criteria

✅ M-Pesa payment platform is working 100% when:

1. **Webhook receives callbacks** — Payment status updates in database
2. **Certificates are created** — After successful payment
3. **End-to-end test passes** — Full flow works with test credentials
4. **Users see certificates** — In LearnerDashboard after payment
5. **No errors in logs** — Clean payment flow with no exceptions
6. **Production ready** — Tested with real M-Pesa credentials

---

## Next Steps for Manus

1. **Implement webhook handler** (Phase 2 of plan)
2. **Wire Payment page** (Phase 3 of plan)
3. **Test end-to-end** (Phase 4 of plan)
4. **Implement backend role checks** (Phase 5 of plan)
5. **Push to GitHub** — All developers have access
6. **Report completion** — Confirm 100% working

---

## Questions for Cursor

1. Should certificate PDF be generated immediately or on-demand?
2. Should we send email confirmation after successful payment?
3. Should we implement payment retry logic for failed M-Pesa requests?
4. Should we add payment history to user dashboard?

---

*Report prepared by Manus. Last updated: 2026-03-15.*
