# Institutional Revenue Readiness Runbook

## Launch boundary

The institutional QI and billing software is deployable after migration 0157. Live revenue collection remains disabled until one payment provider is configured, signed callbacks are verified, and finance completes a controlled reconciliation test.

## Required deployment configuration

| Variable | Purpose | Required before live collection |
|---|---|---|
| `INSTITUTIONAL_PAYMENT_WEBHOOK_SECRET` | HMAC-SHA256 secret for `/api/payments/institutional/webhook` | Yes |
| `PESAPAL_CONSUMER_KEY` / provider credentials | Pesapal checkout and status calls | If using Pesapal |
| `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY` | Direct Daraja STK flow | If using direct M-Pesa |
| `MPESA_CALLBACK_URL` | Daraja callback endpoint | If using direct M-Pesa |
| `TRUST_PROXY` and provider IP policy | Correct callback source handling behind Render/proxy | Review before production |

Never put any secret in source control, a browser payload, a QI report, or an invoice note.

## Database release

Run from the authenticated deployment shell:

```bash
pnpm run db:apply-0157
pnpm run db:verify-0157
```

The migration is idempotent. Verification must show:

- `institutionalPaymentAttempts` exists.
- Invoice provider, payment-method, settlement, reconciliation, refund, and void fields exist.
- Provider-event signature and processing fields exist.
- `institutionalQiExportRequests` and `institutionalQiRetentionPolicies` exist.

## Signed webhook contract

Endpoint:

```text
POST /api/payments/institutional/webhook
Content-Type: application/json
X-Institutional-Provider: pesapal | direct_mpesa | bank_transfer
X-Provider-Event-Id: provider-unique-event-id
X-Institutional-Signature: sha256=<hex HMAC-SHA256(raw-body, INSTITUTIONAL_PAYMENT_WEBHOOK_SECRET)>
```

The event must include an invoice reference and should include provider payment reference, status, amount, and currency. Duplicate provider events are acknowledged idempotently. A success event whose amount or currency does not match the immutable invoice is stored as disputed/mismatch and does not mark the invoice paid.

## Controlled smoke test

Use a disposable invoice and do not capture real funds.

1. Create or identify a test institution with an authorized billing administrator.
2. Set a test consent/pricing state and issue an invoice.
3. Create a payment intent twice with the same idempotency key; confirm only one payment attempt exists.
4. Send a signed successful webhook with the exact invoice amount and currency; confirm the invoice becomes `paid`, the attempt becomes `succeeded/matched`, and the event is `processed`.
5. Replay the same webhook; confirm the response is idempotent and no second attempt is created.
6. Send a signed success event with a mismatched amount; confirm the invoice does not become paid and finance review is required.
7. Record a reconciliation correction or refund as an administrator and confirm the audit result.
8. Export the QI report set in `institution_only` and `aggregate_only` scopes; confirm restricted narrative fields are absent from aggregate output.
9. Configure and read the retention policy; confirm the setting is audited and no automatic deletion runs without an approved retention job.
10. Delete or void only the disposable test records according to the finance and data-retention policy.

## Finance operating rhythm

Finance reviews the launch overview daily during the first month, then at least weekly. The review must cover issued/overdue invoices, unreconciled or mismatched attempts, provider references, settlement totals, refunds, and failed payments. A payment callback is not equivalent to bank settlement until the provider reference and amount are reconciled.

## Governance gate

Before external sale, obtain documented review of Kenya data-protection obligations, consent wording, retention/deletion policy, tax/eTIMS treatment, institutional renewal terms, refund rules, and the just-culture clause. The product must not claim legal immunity or absolute anonymity.
