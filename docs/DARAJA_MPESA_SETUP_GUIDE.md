# Daraja M-Pesa API Setup Guide for Paeds Resus

**Purpose:** Complete guide to integrate M-Pesa payments via Daraja API  
**Target:** Seamless STK Push, B2C transfers, and webhook handling  
**Your Details:** Paybill 4034223, Account Clients 3 names, Account Name: Paeds Resus Limited

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Register for Daraja](#step-1-register-for-daraja)
4. [Step 2: Obtain API Credentials](#step-2-obtain-api-credentials)
5. [Step 3: Configure Environment](#step-3-configure-environment)
6. [Step 4: Implement STK Push](#step-4-implement-stk-push)
7. [Step 5: Implement Webhook](#step-5-implement-webhook)
8. [Step 6: Test Transactions](#step-6-test-transactions)
9. [Step 7: Production Deployment](#step-7-production-deployment)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Daraja?

Daraja is Safaricom's API platform that allows developers to integrate M-Pesa payments into applications. It provides:

- **STK Push:** Prompt user to enter M-Pesa PIN on their phone (most common for e-commerce)
- **B2C:** Send money from business account to customer
- **C2B:** Receive payments from customers (your use case)
- **Account Balance:** Check business account balance
- **Transaction Status:** Query transaction status

### M-Pesa Payment Flow (STK Push)

```
User selects course
    ↓
App initiates STK Push via Daraja API
    ↓
M-Pesa prompt appears on user's phone
    ↓
User enters PIN
    ↓
M-Pesa processes payment
    ↓
Daraja sends callback to your webhook
    ↓
Your app verifies payment and issues certificate
```

###**Your Setup**

- **Paybill:** 4034223
- **Account:** Clients 3 names
- **Account Name:** Paeds Resus Limited
- **Payment Type:** Lipa na M-Pesa (STK Push)--

## Prerequisites

Before starting, you need:

1. ✅ **Safaricom Business Account** — Already have (Paybill 4034223)
2. ✅ **Daraja Account** — Will create
3. ✅ **Consumer Key & Secret** — Will get from Daraja
4. ⏳ **Passkey** — Safaricom will provide (needed for STK Push)
5. ✅ **Public HTTPS Domain** — paedsresus.com (for webhooks)
6. ✅ **Backend Server** — Already have (Express.js)

---

## Step 1: Register for Daraja

### 1.1 Create Daraja Account

1. Go to **https://developer.safaricom.co.ke**
2. Click **"Sign Up"** (or **"Create Account"**)
3. Fill in:
   - **Full Name:** Your name
   - **Email:** Your business email
   - **Phone:** Your phone number
   - **Company:** Paeds Resus Limited
   - **Password:** Strong password (save it)
4. Verify email (check inbox)
5. Log in to Daraja dashboard

### 1.2 Create an Application

1. In Daraja dashboard, go to **"My Applications"**
2. Click **"Create New Application"**
3. Fill in:
   - **Application Name:** "Paeds Resus Payments"
   - **Description:** "M-Pesa payment integration for courses and training"
   - **Select APIs:** Check "Lipa Na M-Pesa Online" (STK Push)
4. Click **"Create"**
5. **Save the Consumer Key and Consumer Secret** (you'll need these)

---

## Step 2: Obtain API Credentials

### 2.1 Get Consumer Key & Secret

After creating the application:

1. Go to **"My Applications"** → **"Paeds Resus Payments"**
2. You'll see:
   - **Consumer Key:** (32-character string)
   - **Consumer Secret:** (32-character string)
3. **Copy both** and save securely

### 2.2 Request Passkey from Safaricom

The **Passkey** is required for STK Push. It's different from Consumer Secret.

**To get Passkey:**

1. Email **support@safaricom.co.ke** or contact your Safaricom account manager
2. Provide:
   - Your Paybill number: **4034223**
   - Your Account number: **Clients 3 names**
   - Your Daraja Consumer Key
   - Request: "Passkey for Lipa na M-Pesa Online (STK Push)"
3. Safaricom will send Passkey via email (usually within 24-48 hours)
4. **Save the Passkey securely** (you'll need it for every STK Push request)

### 2.3 Test Credentials (Optional)

Daraja provides test credentials for sandbox testing:

- **Test Consumer Key:** (provided in Daraja sandbox docs)
- **Test Consumer Secret:** (provided in Daraja sandbox docs)
- **Test Passkey:** (provided in Daraja sandbox docs)

Use these to test before going live.

---

## Step 3: Configure Environment

### 3.1 Add Secrets to Manus

Use `webdev_request_secrets` to store M-Pesa credentials:

```bash
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_PASSKEY=your_passkey_here
MPESA_PAYBILL=4034223
MPESA_ACCOUNT=Clients 3 names
MPESA_ACCOUNT_NAME=Paeds Resus Limited
MPESA_ENVIRONMENT=production  # or 'sandbox' for testing
MPESA_CALLBACK_URL=https://paedsresus.com/api/payment/callback
```

### 3.2 Create .env.local (for local development)

Create `/home/ubuntu/paeds_resus_app/.env.local`:

```env
# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey
MPESA_PAYBILL=4034223
MPESA_ACCOUNT=Clients 3 names
MPESA_ACCOUNT_NAME=Paeds Resus Limited
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=http://localhost:3000/api/payment/callback
```

### 3.3 Load Secrets in Server Code

In `server/_core/index.ts`:

```typescript
const mpesaConfig = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  passkey: process.env.MPESA_PASSKEY,
  paybill: process.env.MPESA_PAYBILL,
  account: process.env.MPESA_ACCOUNT,
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
  callbackUrl: process.env.MPESA_CALLBACK_URL,
};
```

---

## Step 4: Implement STK Push

### 4.1 Create M-Pesa Service Module

Create `/home/ubuntu/paeds_resus_app/server/_core/mpesa.ts`:

```typescript
import axios from 'axios';

interface STKPushRequest {
  phoneNumber: string;        // e.g. "254712345678"
  amount: number;             // in KES
  accountReference: string;   // e.g. "ENROLL-123"
  transactionDesc: string;    // e.g. "BLS Course Enrollment"
  enrollmentId: number;       // to track which enrollment this is for
}

interface STKPushResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
}

const mpesaConfig = {
  consumerKey: process.env.MPESA_CONSUMER_KEY!,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
  passkey: process.env.MPESA_PASSKEY!,
  paybill: process.env.MPESA_PAYBILL!,
  account: process.env.MPESA_ACCOUNT!,
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
  callbackUrl: process.env.MPESA_CALLBACK_URL!,
};

// Get OAuth token
async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`
  ).toString('base64');

  const baseUrl = mpesaConfig.environment === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

  try {
    const response = await axios.get(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw error;
  }
}

// Initiate STK Push
export async function initiateSTKPush(
  request: STKPushRequest
): Promise<STKPushResponse> {
  const token = await getAccessToken();
  const baseUrl = mpesaConfig.environment === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

  // Generate timestamp (YYYYMMDDHHmmss)
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 14);

  // Generate password: Base64(Paybill + Passkey + Timestamp)
  const password = Buffer.from(
    `${mpesaConfig.paybill}${mpesaConfig.passkey}${timestamp}`
  ).toString('base64');

  // Normalize phone number (remove + or 0, add 254)
  const normalizedPhone = request.phoneNumber
    .replace(/^\+/, '')
    .replace(/^0/, '254');

  try {
    const response = await axios.post(
      `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: mpesaConfig.paybill,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: request.amount,
        PartyA: normalizedPhone,
        PartyB: mpesaConfig.paybill,
        PhoneNumber: normalizedPhone,
        CallBackURL: mpesaConfig.callbackUrl,
        AccountReference: request.accountReference,
        TransactionDesc: request.transactionDesc,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('STK Push initiated:', response.data);
    return response.data;
  } catch (error) {
    console.error('STK Push failed:', error);
    throw error;
  }
}

// Query transaction status
export async function queryTransactionStatus(
  checkoutRequestId: string
): Promise<any> {
  const token = await getAccessToken();
  const baseUrl = mpesaConfig.environment === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 14);

  const password = Buffer.from(
    `${mpesaConfig.paybill}${mpesaConfig.passkey}${timestamp}`
  ).toString('base64');

  try {
    const response = await axios.post(
      `${baseUrl}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: mpesaConfig.paybill,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Transaction query failed:', error);
    throw error;
  }
}

export default {
  initiateSTKPush,
  queryTransactionStatus,
  getAccessToken,
};
```

### 4.2 Add tRPC Procedure

In `server/routers/payments.ts`:

```typescript
import { router, publicProcedure } from '../_core/router';
import { z } from 'zod';
import { initiateSTKPush } from '../_core/mpesa';
import { db } from '../db';
import { payments, enrollments } from '../../drizzle/schema';

export const paymentsRouter = router({
  initiatePayment: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string().regex(/^254\d{9}$/, 'Invalid phone number'),
        amount: z.number().positive('Amount must be positive'),
        courseId: z.string(),
        userId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Create enrollment if not exists
        const [enrollment] = await db
          .insert(enrollments)
          .values({
            userId: input.userId,
            courseId: input.courseId,
            enrollmentDate: new Date(),
            paymentStatus: 'pending',
          })
          .returning();

        // Initiate STK Push
        const stkResponse = await initiateSTKPush({
          phoneNumber: input.phoneNumber,
          amount: input.amount,
          accountReference: `ENROLL-${enrollment.id}`,
          transactionDesc: `Paeds Resus Course: ${input.courseId}`,
          enrollmentId: enrollment.id,
        });

        // Store payment record
        await db.insert(payments).values({
          enrollmentId: enrollment.id,
          amount: input.amount,
          transactionId: stkResponse.CheckoutRequestID, // ✅ Store CheckoutRequestID
          merchantRequestId: stkResponse.MerchantRequestID,
          status: 'pending',
          paymentMethod: 'mpesa',
          phoneNumber: input.phoneNumber,
          createdAt: new Date(),
        });

        return {
          success: true,
          checkoutRequestId: stkResponse.CheckoutRequestID,
          message: 'STK Push sent. Check your phone for M-Pesa prompt.',
        };
      } catch (error) {
        console.error('Payment initiation failed:', error);
        throw new Error('Failed to initiate payment');
      }
    }),
});
```

---

## Step 5: Implement Webhook

### 5.1 Create Webhook Endpoint

In `server/_core/index.ts`, add webhook handler:

```typescript
// M-Pesa Callback Webhook
app.post('/api/payment/callback', express.json(), async (req, res) => {
  try {
    console.log('M-Pesa Callback received:', JSON.stringify(req.body, null, 2));

    const { Body } = req.body;
    const {
      stkCallback: {
        MerchantRequestID,
        CheckoutRequestID,
        ResultCode,
        ResultDesc,
        CallbackMetadata,
      },
    } = Body;

    // ResultCode: 0 = Success, non-zero = Failed
    if (ResultCode === 0) {
      // Extract amount and receipt number from metadata
      const metadata = CallbackMetadata?.Item || [];
      let amount = 0;
      let receiptNumber = '';
      let phoneNumber = '';

      metadata.forEach((item: any) => {
        if (item.Name === 'Amount') amount = item.Value;
        if (item.Name === 'MpesaReceiptNumber') receiptNumber = item.Value;
        if (item.Name === 'PhoneNumber') phoneNumber = item.Value;
      });

      // Find payment by CheckoutRequestID
      const payment = await db.query.payments.findFirst({
        where: (payments, { eq }) => eq(payments.transactionId, CheckoutRequestID),
      });

      if (!payment) {
        console.error('Payment not found for CheckoutRequestID:', CheckoutRequestID);
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Update payment status
      await db
        .update(payments)
        .set({
          status: 'completed',
          receiptNumber,
          updatedAt: new Date(),
        })
        .where((payments) => payments.id === payment.id);

      // Update enrollment status
      await db
        .update(enrollments)
        .set({
          paymentStatus: 'completed',
          updatedAt: new Date(),
        })
        .where((enrollments) => enrollments.id === payment.enrollmentId);

      // Issue certificate
      await db.insert(certificates).values({
        enrollmentId: payment.enrollmentId,
        certificateNumber: `CERT-${Date.now()}`,
        issuedDate: new Date(),
        certificateUrl: '', // Will be generated later
      });

      console.log('Payment processed successfully:', receiptNumber);
    } else {
      // Payment failed
      const payment = await db.query.payments.findFirst({
        where: (payments, { eq }) => eq(payments.transactionId, CheckoutRequestID),
      });

      if (payment) {
        await db
          .update(payments)
          .set({
            status: 'failed',
            updatedAt: new Date(),
          })
          .where((payments) => payments.id === payment.id);
      }

      console.log('Payment failed:', ResultDesc);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
```

### 5.2 Update Payment Schema

Ensure `payments` table has these columns:

```typescript
export const payments = mysqlTable('payments', {
  id: int('id').primaryKey().autoIncrement(),
  enrollmentId: int('enrollment_id').notNull().references(() => enrollments.id),
  amount: int('amount').notNull(), // in KES
  transactionId: varchar('transaction_id', 255).notNull().unique(), // CheckoutRequestID
  merchantRequestId: varchar('merchant_request_id', 255),
  receiptNumber: varchar('receipt_number', 255), // MpesaReceiptNumber
  status: varchar('status', 50).notNull().default('pending'), // pending, completed, failed
  paymentMethod: varchar('payment_method', 50).notNull(), // mpesa, bank, card
  phoneNumber: varchar('phone_number', 20),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});
```

---

## Step 6: Test Transactions

### 6.1 Test in Sandbox

12. Use sandbox credentials from Daraja
3. Use test phone number: **254708374149** (Safaricom test number)
4. Initiate payment:

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

5. Check webhook logs to see callback
6. Verify payment status in database
### 6.2 Test Error Scenarios

- **Invalid phone number:** Should return error
- **Insufficient funds:** M-Pesa will reject
- **Timeout:** Webhook may not arrive; implement polling
- **Duplicate request:** Should handle gracefully

### 6.3 Webhook Testing Tools

Use **ngrok** to test webhooks locally:

```bash
# Install ngrok
brew install ngrok

# Expose local server
ngrok http 3000

# Use ngrok URL as callback
MPESA_CALLBACK_URL=https://abc123.ngrok.io/api/payment/callback
```

---

## Step 7: Production Deployment

### 7.1 Switch to Production

1. Change `MPESA_ENVIRONMENT=production`
2. Use production credentials (not sandbox)
3. Update `MPESA_CALLBACK_URL` to `https://paedsresus.com/api/payment/callback`

### 7.2 Verify Webhook URL

Ensure:
- ✅ URL is HTTPS (not HTTP)
- ✅ URL is publicly accessible
- ✅ Firewall allows POST requests to `/api/payment/callback`
- ✅ Server responds with 200 OK

### 7.3 Test with Real Transaction

1. Use real phone number
2. Initiate payment with small amount (e.g., 10 KES)
3. Complete M-Pesa transaction on phone
4. Verify webhook received callback
5. Verify payment status updated
6. Verify certificate issued

### 7.4 Monitor Transactions

Create monitoring dashboard:

```typescript
export const paymentsRouter = router({
  getPaymentStats: adminProcedure.query(async () => {
    const stats = await db
      .select({
        status: payments.status,
        count: sql`COUNT(*) as count`,
        totalAmount: sql`SUM(${payments.amount}) as total`,
      })
      .from(payments)
      .groupBy(payments.status);

    return stats;
  }),
});
```

---

## Step 8: Error Handling & Retry Logic

### 8.1 Handle Webhook Failures

```typescript
// Retry webhook if it fails
async function retryWebhook(paymentId: number, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Query transaction status from M-Pesa
      const status = await queryTransactionStatus(checkoutRequestId);
      
      if (status.ResultCode === 0) {
        // Update payment
        await db.update(payments).set({ status: 'completed' });
        return;
      }
    } catch (error) {
      console.error(`Retry ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 5000 * (i + 1)));
    }
  }
}
```

### 8.2 Handle Timeout

```typescript
// If webhook doesn't arrive within 5 minutes, query status
setTimeout(async () => {
  const payment = await db.query.payments.findFirst({
    where: (payments, { eq }) => eq(payments.id, paymentId),
  });

  if (payment?.status === 'pending') {
    const status = await queryTransactionStatus(payment.transactionId);
    if (status.ResultCode === 0) {
      // Update to completed
      await db.update(payments).set({ status: 'completed' });
    }
  }
}, 5 * 60 * 1000); // 5 minutes
```

---

## Troubleshooting

### Issue: "Invalid Consumer Key"

**Solution:** Verify Consumer Key is correct and not expired. Get new one from Daraja dashboard.

### Issue: "Passkey not provided"

**Solution:** Contact Safaricom support to request Passkey. Provide Paybill 4034223.

### Issue: "Webhook not received"

**Solution:**
- Verify callback URL is HTTPS
- Check firewall allows POST requests
- Use ngrok to test locally
- Check M-Pesa logs in Daraja dashboard

### Issue: "Payment not found for CheckoutRequestID"

**Solution:** Ensure you're storing `CheckoutRequestID` (not `MerchantRequestID`) in `payments.transactionId`.

### Issue: "Certificate not issued after payment"

**Solution:**
- Verify webhook is being called (check logs)
- Verify `ResultCode === 0` (success)
- Verify certificate creation logic is correct

### Issue: "Test transaction works but production fails"

**Solution:**
- Verify production credentials are correct
- Verify callback URL is production URL
- Check M-Pesa logs for errors
- Contact Safaricom support

---

## Quick Reference

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/oauth/v1/generate` | GET | Get access token |
| `/mpesa/stkpush/v1/processrequest` | POST | Initiate STK Push |
| `/mpesa/stkpushquery/v1/query` | POST | Query transaction status |
| `/api/payment/callback` | POST | Receive payment callback |

### Important Values

| Item | Value |
|------|-------|
| **Paybill** | 4034223 |
| **Account** | Clients 3 names |
| **Account Name** | Paeds Resus Limited |
| **Environment** | production (after testing) |
| **Callback URL** | https://paedsresus.com/api/payment/callback |

### Test Credentials (Sandbox)

Ask Daraja support for sandbox credentials. They provide:
- Consumer Key
- Consumer Secret
- Passkey
- Test phone number

---

## Next Steps

1. ✅ Register for Daraja → Get Consumer Key & Secret
2. ✅ Request Passkey from Safaricom
3. ✅ Add credentials to Manus secrets
4. ✅ Implement M-Pesa service module
5. ✅ Add tRPC payment procedure
6. ✅ Implement webhook handler
7. ✅ Test in sandbox with test phone
8. ✅ Deploy to production
9. ✅ Monitor transactions

---

## Support

- **Daraja Docs:** https://developer.safaricom.co.ke/docs
- **Safaricom Support:** support@safaricom.co.ke
- **Daraja Community:** https://developer.safaricom.co.ke/community

---

**Created:** 2026-03-15  
**For:** Paeds Resus Limited  
**Status:** Ready to implement
