# M-Pesa Credentials Reference

**Last Updated:** 2026-03-15  
**Status:** ✅ Validated and Active

## Daraja API Credentials

| Credential | Value | Source | Status |
|------------|-------|--------|--------|
| **Consumer Key** | `fSx8sjd6FzEtBs2qsMrbFH3t8J8fD8NwaEkLWC4KA7mXsC08` | Daraja Developer Portal | ✅ Active |
| **Consumer Secret** | `DRwO8A9hko3qIbo5ghDEjIkjgAmyVMWitdAqrX75AAxSy0tpU1vjpCBXMhXUs9ze` | Daraja Developer Portal | ✅ Active |
| **Passkey** | `e2585f3b9f2179b7005d5922a5398ff8aa819da303c0114d1979322f9ee90576` | Safaricom Support | ✅ Active |

## M-Pesa Business Account

| Field | Value | Status |
|-------|-------|--------|
| **Paybill** | 4034223 | ✅ Active |
| **Account** | Clients 3 names | ✅ Active |
| **Account Name** | Paeds Resus Limited | ✅ Active |
| **Email** | karuejob@gmail.com | ✅ Active |

## Environment Variables

All credentials are stored as Manus secrets and injected automatically:

```bash
DARAJA_CONSUMER_KEY=fSx8sjd6FzEtBs2qsMrbFH3t8J8fD8NwaEkLWC4KA7mXsC08
DARAJA_CONSUMER_SECRET=DRwO8A9hko3qIbo5ghDEjIkjgAmyVMWitdAqrX75AAxSy0tpU1vjpCBXMhXUs9ze
MPESA_PASSKEY=e2585f3b9f2179b7005d5922a5398ff8aa819da303c0114d1979322f9ee90576
MPESA_PAYBILL=4034223
MPESA_ACCOUNT=Clients 3 names
MPESA_ACCOUNT_NAME=Paeds Resus Limited
```

## How STK Push Works

1. **Authentication:** M-Pesa service calls Daraja API with Consumer Key & Secret
2. **Token Generation:** Daraja returns Bearer token (valid for 1 hour)
3. **Password Generation:** Service creates Base64(Paybill + Passkey + Timestamp)
4. **STK Push Request:** Service sends STK Push request with password to M-Pesa
5. **User Prompt:** M-Pesa sends prompt to user's phone to enter PIN
6. **Callback:** M-Pesa sends payment result to webhook at `/api/payment/callback` (legacy `/api/mpesa/callback` still accepted)

## Testing

### Test Credentials (Sandbox)
- **Test Phone:** 254708374149
- **Test Amount:** 1-150,000 KES
- **Test PIN:** 1234

### Validation
Run the Daraja credentials test:
```bash
pnpm test server/daraja.test.ts
```

Expected output:
```
✓ Daraja API Credentials > should successfully authenticate with Daraja API and get Bearer token
✅ Daraja credentials are valid
   Access token expires in: 3599 seconds
```

## Implementation Files

- **M-Pesa Service:** `server/services/mpesa.ts`
- **Payment Router:** `server/routers/payments.ts` (contains `initiateSTKPush` procedure)
- **Webhook Handler:** `server/_core/webhooks/mpesa.ts` (to be implemented)
- **Payment Page:** `client/src/pages/Payment.tsx` (to be wired)

## Important Notes

⚠️ **Do NOT commit credentials to git** — All values are stored in Manus secrets and injected at runtime.

⚠️ **Passkey is sensitive** — Treat like a password. Only share through secure channels.

⚠️ **Test before production** — Always test STK Push with test credentials before going live.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid credentials" | Verify Consumer Key & Secret in Daraja portal |
| "MPESA_PASSKEY not configured" | Check Manus secrets are loaded |
| "Invalid phone number" | Use format 254XXXXXXXXX (11 digits) |
| "Amount out of range" | Use 1-150,000 KES |
| "Callback URL not reachable" | Ensure webhook endpoint is publicly accessible |

## Contact

- **Daraja Support:** developer@safaricom.co.ke
- **M-Pesa Support:** mpesabusiness@safaricom.co.ke
- **Account Owner:** karuejob@gmail.com
