# M-Pesa STK Push Diagnostic Report

**Date:** April 23, 2026
**Target:** Paeds Resus Platform (`paedsresus.com`)
**Focus:** End-to-end failure of the M-Pesa STK Push payment flow

This report details the root causes, the timeline of fixes applied, the confirmed working components, and the remaining unknown variables regarding the M-Pesa STK Push integration on the Paeds Resus Platform.

## 1. The Core Problem

The M-Pesa STK Push feature was completely non-functional in the production environment. Users attempting to enroll in micro-courses or the fellowship program were unable to complete payments. The failure was not a single point of failure but a chain of misconfigurations and code bugs across three different payment code paths, culminating in a critical webhook parsing error that caused even successful payments to fail silently.

## 2. What We Know (Confirmed and Fixed)

Through direct API testing and log analysis, the following issues were definitively identified and resolved.

### A. Production Credentials and Safaricom Connectivity
The credentials currently set in the Render production environment are **correct and fully functional**. 
- A direct diagnostic script using the live `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, and `MPESA_SHORTCODE` successfully generated an OAuth token and initiated an STK Push to a test phone number.
- The phone prompt arrived, and the Safaricom STK Query endpoint confirmed the transaction status.
- **Conclusion:** The issue is not with Safaricom's network, the Daraja portal configuration, or the validity of the production credentials.

### B. The Three Broken Code Paths
The platform had three separate code paths for initiating payments, and all three had critical flaws preventing production use:

1. **`server/_core/mpesa.ts` (Micro-Course Path):** This file had hardcoded URLs pointing to `sandbox.safaricom.co.ke`. Regardless of the `MPESA_ENVIRONMENT` variable, all micro-course enrollments were being sent to the Safaricom sandbox, meaning users never received a prompt on their phones. **Fixed:** Rewritten to read `MPESA_ENVIRONMENT` and route to `api.safaricom.co.ke` in production.
2. **`server/services/mpesa.ts` (Payment Page Path):** This file was hardcoded to read only `DARAJA_CONSUMER_KEY` and `DARAJA_CONSUMER_SECRET`. If the Render environment used `MPESA_CONSUMER_KEY` (which it did at one point), this path failed to authenticate. **Fixed:** Updated to support both `MPESA_*` and `DARAJA_*` naming conventions.
3. **`server/mpesa-real.ts` (Fellowship Path):** This path was correctly configured for production but was affected by the webhook parsing bug described below.

### C. The Critical Webhook Parsing Bug (The Silent Failure)
Even when an STK Push was successfully sent (e.g., the KES 100 test payment), the payment was never confirmed in the database. 
- Safaricom sends callbacks with the structure: `{ "Body": { "stkCallback": { "CheckoutRequestID": "ws_CO_..." } } }`.
- The timeout webhook handler (`handleMpesaTimeoutWebhook` in `server/webhooks/mpesa-webhook.ts`) was incorrectly attempting to read `Body.CheckoutRequestID`, which is `undefined`.
- Because the ID was undefined, the server could not match the callback to any pending payment in the database. The callback was acknowledged with a 200 OK to Safaricom, but the enrollment remained in a "pending" state indefinitely.
- **Fixed:** The handler was corrected to extract `CheckoutRequestID` from `Body.stkCallback.CheckoutRequestID`.

### D. The HTTP 500 Polling Loop
The Render logs showed dozens of `Error querying M-Pesa payment status: Request failed with status code 500`. 
- This occurred because the client was aggressively polling the Safaricom STK Query endpoint every 5 seconds for 2 full minutes.
- Safaricom returns an HTTP 500 error when queried with an expired `CheckoutRequestID` (older than ~2 minutes) or a cross-environment ID (sandbox ID queried on production).
- The client code did not handle the 500 error gracefully; it simply logged it and continued polling, causing the UI to appear "stuck" on the loading screen.
- **Fixed:** The polling logic in `MpesaReconciliationStatus.tsx` was updated to stop polling after 3 consecutive 500 errors or after a 2-minute expiry, presenting the user with an "I Have Paid" manual reconciliation button instead.

### E. UI Fragmentation and Latency
The user experience for micro-course enrollment was heavily fragmented, requiring 4 steps (initial → payment → reconciliation → success) and multiple page loads. Furthermore, the `courses.listAll` query was performing 29 sequential database queries on every page load to seed the catalog, severely degrading performance.
- **Fixed:** The `EnrollmentModal.tsx` was streamlined into a 3-step flow, and the Daraja OAuth token is now pre-warmed when the modal opens, eliminating the 3-8 second latency before the STK Push is initiated. The catalog seeding was moved to an in-memory cache, reducing the DB queries to once per server process.

## 3. What We Don't Know (Remaining Unknowns)

While the code has been corrected and the credentials verified, one critical unknown remains regarding the live behavior.

### A. The "No Response" on Fresh Attempts
Despite the fixes being deployed, recent attempts to trigger an STK Push from the live application resulted in "No response" (the phone prompt did not arrive). 
- Since the direct diagnostic script successfully triggered a prompt, the failure must be occurring between the client clicking "Pay" and the server executing `initiateStkPush`.
- The exact point of failure is currently obscured because the production logs do not capture the specific error message if the failure occurs *before* the STK Push is dispatched to Safaricom (e.g., if the enrollment record fails to create, or if a database connection timeout occurs).

## 4. Next Steps for Isolation

To definitively resolve the "No response" issue, we must isolate the exact point of failure in the live application flow.

1. **Verify Deployment State:** Confirm that the Render server is currently running the latest commit (`5a58881` or later) and is not stuck in a failed build or redeploy loop.
2. **Execute a Monitored Test:**
   - Open the browser network console (F12 -> Network).
   - Attempt a fresh micro-course enrollment.
   - Observe the specific HTTP response from the `enrollWithPayment` or `initiatePayment` tRPC call. If it returns a 500 error or a `success: false` payload, the exact error message within that payload will pinpoint the failure.
3. **Check Database Connectivity:** Given the intermittent loading issues observed earlier (e.g., the page stuck on "Loading your payment details"), verify that the Aiven MySQL database connection pool is stable and not exhausting its limits during the payment initiation sequence.
4. **Reconcile Pending Payments:** The KES 100 payment made during testing is valid on Safaricom's end but unrecorded in the app due to the now-fixed webhook bug. This must be manually reconciled via the Admin -> M-Pesa Reconciliation dashboard.
