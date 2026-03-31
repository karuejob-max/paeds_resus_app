# M-Pesa production checklist (P0-PAY-1)

Use this before and after go-live. **Admin → M-Pesa reconciliation** shows non-secret readiness flags (`mpesa.getOperationalReadiness`).

## Environment

- [ ] **`MPESA_ENVIRONMENT=production`** when using live Daraja (preferred). **`MPESA_ENV`** is a legacy alias; if both are set, **`MPESA_ENVIRONMENT` wins**. Admin readiness shows which source was used.
- [ ] `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY` set (no placeholders).
- [ ] `MPESA_ENVIRONMENT=production` when using **production** Daraja consumer key/secret (otherwise the app calls **sandbox** hosts and requests fail).
- [ ] `MPESA_CALLBACK_URL` is either the full URL ending in `/api/payment/callback`, or **only** `https://your-domain.com` — the server appends the path if missing. Must match what is registered in Daraja.
- [ ] Optional: `MPESA_CALLBACK_IP_ALLOWLIST` for extra callback hardening; `TRUST_PROXY` if behind a reverse proxy.

## Application

- [ ] Webhook route mounted (`POST /api/payment/callback`; legacy `POST /api/mpesa/callback` optional).
- [ ] Database reachable from app (payments + enrollments updating).

## Live test (small amount)

1. From the app, run a real STK push for a minimal amount.
2. Confirm phone receives prompt and completes payment.
3. Confirm payment row moves from **pending** to **completed** (or use **Reconcile (STK query)** on admin page for stuck rows).
4. Match **CheckoutRequestID** / receipt in logs with DB `payments.transactionId` where applicable.

## Ongoing

- Monitor logs for webhook errors and Daraja rate limits.
- Use **Export CSV** on stale pending list for finance follow-up.
