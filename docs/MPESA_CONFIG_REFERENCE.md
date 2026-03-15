# M-Pesa Configuration Reference

**Last Updated:** 2026-03-15  
**Status:** Active  
**Audience:** All developers

---

## Current M-Pesa Configuration

### Production Details

| Item | Value |
|------|-------|
| **Paybill Number** | 4034223 |
| **Account Number** | Clients 3 names |
| **Account Name** | Paeds Resus Limited |
| **Payment Type** | Lipa na M-Pesa (STK Push) |
| **Environment** | production |
| **Callback URL** | https://paedsresus.com/api/mpesa/callback |

### Previous Configuration (Deprecated)

| Item | Value | Reason |
|------|-------|--------|
| **Paybill Number** | 247247 | Could not load into M-Pesa business portal |
| **Account Number** | 606854 | Replaced with new paybill |

---

## Environment Variables

All M-Pesa credentials are stored as **Manus secrets** and automatically injected into the environment. Do NOT hardcode these values.

### Required Secrets

```
MPESA_CONSUMER_KEY          # From Daraja dashboard
MPESA_CONSUMER_SECRET       # From Daraja dashboard
MPESA_PASSKEY              # Requested from Safaricom
MPESA_PAYBILL              # 4034223
MPESA_ACCOUNT              # Clients 3 names
MPESA_ACCOUNT_NAME         # Paeds Resus Limited
MPESA_ENVIRONMENT          # production or sandbox
MPESA_CALLBACK_URL         # https://paedsresus.com/api/mpesa/callback
```

### Local Development

For local testing, create `.env.local`:

```env
MPESA_CONSUMER_KEY=your_sandbox_key
MPESA_CONSUMER_SECRET=your_sandbox_secret
MPESA_PASSKEY=your_sandbox_passkey
MPESA_PAYBILL=4034223
MPESA_ACCOUNT=Clients 3 names
MPESA_ACCOUNT_NAME=Paeds Resus Limited
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=http://localhost:3000/api/mpesa/callback
```

---

## How to Access Credentials

### For Developers

1. **Local Development:** Use sandbox credentials in `.env.local`
2. **Staging/Production:** Credentials are automatically injected from Manus secrets
3. **Never commit credentials** to git — they're stored in Manus secrets management

### For DevOps/Admins

1. Go to **Manus Dashboard** → **Project Settings** → **Secrets**
2. View/update M-Pesa credentials there
3. Changes are automatically deployed to production

---

## Integration Points

### Server Code

All M-Pesa operations use the centralized service in `server/_core/mpesa.ts`:

```typescript
import { initiateSTKPush, queryTransactionStatus } from '../_core/mpesa';

// Initiate payment
const response = await initiateSTKPush({
  phoneNumber: '254712345678',
  amount: 1000,
  accountReference: 'ENROLL-123',
  transactionDesc: 'BLS Course',
  enrollmentId: 123,
});

// Query status
const status = await queryTransactionStatus(checkoutRequestId);
```

### tRPC Procedures

Payment operations are exposed via tRPC in `server/routers/payments.ts`:

```typescript
// Initiate payment
trpc.payments.initiatePayment.useMutation({
  phoneNumber: '254712345678',
  amount: 1000,
  courseId: 'bls',
  userId: 123,
});

// Get payment stats
trpc.payments.getPaymentStats.useQuery();
```

### Webhook

M-Pesa callbacks are received at `/api/mpesa/callback` and processed in `server/_core/index.ts`.

---

## Common Tasks

### Check Payment Status

```bash
curl -X POST http://localhost:3000/api/trpc/payments.getPaymentStats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Payment (Sandbox)

```bash
curl -X POST http://localhost:3000/api/trpc/payments.initiatePayment \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "254708374149",
    "amount": 100,
    "courseId": "bls",
    "userId": 1
  }'
```

### Update Credentials

1. Go to Manus Dashboard → Secrets
2. Update `MPESA_PAYBILL`, `MPESA_ACCOUNT`, etc.
3. Changes deploy automatically (no restart needed)

---

## Troubleshooting

### Payment Not Processing

1. **Check webhook logs:** `tail -f .manus-logs/networkRequests.log`
2. **Verify callback URL:** Must be HTTPS and publicly accessible
3. **Check M-Pesa logs:** Log in to Daraja dashboard

### Invalid Consumer Key

1. Verify credentials in Manus secrets
2. Check Daraja dashboard for expired keys
3. Generate new credentials if needed

### Passkey Issues

1. Contact Safaricom support: support@safaricom.co.ke
2. Provide: Paybill 4034223, Account "Clients 3 names"
3. Request: "Passkey for Lipa na M-Pesa Online"

---

## Related Documentation

- **Setup Guide:** `docs/DARAJA_MPESA_SETUP_GUIDE.md`
- **Platform Audit:** `docs/UNIFIED_PLATFORM_AUDIT_MANUS_AND_CURSOR.md` (Section: M-Pesa Webhook Issue)
- **Daraja Docs:** https://developer.safaricom.co.ke/docs

---

## Change Log

| Date | Change | Details |
|------|--------|---------|
| 2026-03-15 | Updated Paybill | Changed from 247247 to 4034223 due to portal access issue |
| 2026-03-15 | Updated Account | Changed from 606854 to "Clients 3 names" |
| 2026-03-15 | Created Reference | Initial M-Pesa configuration reference document |

---

**For questions or updates, contact:** Job Karue (job@paedsresus.com)
