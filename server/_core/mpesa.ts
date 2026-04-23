/**
 * M-Pesa Daraja Integration
 * Handles STK Push, payment callbacks, and enrollment activation
 *
 * Environment Variables Required:
 * - DARAJA_CONSUMER_KEY: OAuth consumer key
 * - DARAJA_CONSUMER_SECRET: OAuth consumer secret
 * - MPESA_PAYBILL: Business/Paybill number
 * - MPESA_PASSKEY: Passkey for STK Push
 * - MPESA_ACCOUNT: Account reference (e.g., "PAEDS_RESUS")
 * - MPESA_CALLBACK_URL or CALLBACK_URL: Webhook URL for payment confirmation
 * - MPESA_ENVIRONMENT: "production" or "sandbox" (default: sandbox)
 */

import axios from 'axios';
import { Buffer } from 'buffer';
import { isMpesaProduction } from '../lib/mpesa-env';
import { resolveStkCallbackUrlFromEnv } from '../lib/mpesa-callback-path';

// Environment variables — support both MPESA_* and DARAJA_* naming conventions
const DARAJA_CONSUMER_KEY =
  process.env.MPESA_CONSUMER_KEY?.trim() || process.env.DARAJA_CONSUMER_KEY?.trim() || '';
const DARAJA_CONSUMER_SECRET =
  process.env.MPESA_CONSUMER_SECRET?.trim() || process.env.DARAJA_CONSUMER_SECRET?.trim() || '';
const MPESA_PAYBILL =
  process.env.MPESA_SHORTCODE?.trim() || process.env.MPESA_PAYBILL?.trim() || process.env.DARAJA_SHORTCODE?.trim() || '';
const MPESA_PASSKEY =
  process.env.MPESA_PASSKEY?.trim() || process.env.DARAJA_PASSKEY?.trim() || '';
const MPESA_ACCOUNT = process.env.MPESA_ACCOUNT?.trim() || 'PAEDS_RESUS';

// Daraja API base URL — production vs sandbox
const DARAJA_BASE_URL = isMpesaProduction()
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

const AUTH_URL = `${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;
const STK_PUSH_URL = `${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`;
const TRANSACTION_STATUS_URL = `${DARAJA_BASE_URL}/mpesa/stkpushquery/v1/query`;

// Cache for access token
let accessToken: { token: string; expiresAt: number } | null = null;

/**
 * Get OAuth access token from Daraja API
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (5-minute buffer before expiry)
  if (accessToken && accessToken.expiresAt > Date.now()) {
    return accessToken.token;
  }

  try {
    const auth = Buffer.from(`${DARAJA_CONSUMER_KEY}:${DARAJA_CONSUMER_SECRET}`).toString('base64');

    const response = await axios.get(AUTH_URL, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      timeout: 30_000,
    });

    const token = response.data.access_token;
    const expiresIn = response.data.expires_in || 3600;

    // Cache token with 5-minute buffer before expiry
    accessToken = {
      token,
      expiresAt: Date.now() + (expiresIn - 300) * 1000,
    };

    console.log('[M-Pesa] Access token obtained');
    return token;
  } catch (error) {
    console.error('[M-Pesa] Failed to get access token:', error);
    throw new Error('Failed to authenticate with M-Pesa Daraja API');
  }
}

/**
 * Validate Kenyan phone number
 */
export function validatePhoneNumber(phone: string): boolean {
  // Accept formats: 254712345678, +254712345678, 0712345678
  const cleaned = phone.replace(/\D/g, '');

  // Must be 12 digits (254 + 9 digits) or 10 digits (07 + 8 digits)
  if (cleaned.length === 12 && cleaned.startsWith('254')) {
    return true;
  }
  if (cleaned.length === 10 && cleaned.startsWith('07')) {
    return true;
  }

  return false;
}

/**
 * Format phone number to 254 format
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');

  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }

  // If doesn't start with 254, prepend it
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }

  return cleaned;
}

/**
 * Generate timestamp in Nairobi time (EAT, UTC+3) — Daraja requires local Kenya time.
 * Using UTC offset directly to avoid timezone library dependency.
 */
function getTimestamp(): string {
  // EAT = UTC + 3 hours
  const nowUtcMs = Date.now();
  const eatOffsetMs = 3 * 60 * 60 * 1000;
  const eat = new Date(nowUtcMs + eatOffsetMs);

  const year = eat.getUTCFullYear();
  const month = String(eat.getUTCMonth() + 1).padStart(2, '0');
  const day = String(eat.getUTCDate()).padStart(2, '0');
  const hours = String(eat.getUTCHours()).padStart(2, '0');
  const minutes = String(eat.getUTCMinutes()).padStart(2, '0');
  const seconds = String(eat.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Generate password for STK Push
 * Password = base64(Paybill + Passkey + Timestamp)
 */
function generatePassword(timestamp: string): string {
  const data = `${MPESA_PAYBILL}${MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(data).toString('base64');
}

/**
 * Initiate STK Push (M-Pesa prompt on user's phone)
 */
export async function initiateSTKPush(
  phoneNumber: string,
  amount: number, // Amount in KES
  courseId: string,
  courseTitle: string,
  enrollmentId: number
): Promise<{
  success: boolean;
  checkoutRequestId?: string;
  message: string;
  error?: string;
}> {
  try {
    // Validate inputs
    if (!validatePhoneNumber(phoneNumber)) {
      return {
        success: false,
        message: 'Invalid phone number. Use format: 254712345678, +254712345678, or 0712345678',
        error: 'INVALID_PHONE',
      };
    }

    if (amount < 1 || amount > 150000) {
      return {
        success: false,
        message: 'Amount must be between 1 KES and 150,000 KES',
        error: 'INVALID_AMOUNT',
      };
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Resolve callback URL — uses MPESA_CALLBACK_URL, falls back to APP_BASE_URL
    const appBase = process.env.APP_BASE_URL?.trim().replace(/\/$/, '') || 'https://www.paedsresus.com';
    const callbackUrl = resolveStkCallbackUrlFromEnv(appBase);

    // Get access token
    const token = await getAccessToken();

    // Generate timestamp and password
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);

    // Prepare STK Push request
    const stkPushRequest = {
      BusinessShortCode: MPESA_PAYBILL,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount), // Ensure integer
      PartyA: formattedPhone,
      PartyB: MPESA_PAYBILL,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: MPESA_ACCOUNT,
      TransactionDesc: `${courseTitle} (Enrollment #${enrollmentId})`,
    };

    console.log('[M-Pesa] Initiating STK Push:', {
      phone: formattedPhone,
      amount,
      courseId,
      enrollmentId,
      env: isMpesaProduction() ? 'production' : 'sandbox',
      callbackUrl,
    });

    // Call Daraja API
    const response = await axios.post(STK_PUSH_URL, stkPushRequest, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 45_000,
    });

    const { CheckoutRequestID, ResponseCode, ResponseDescription } = response.data;

    if (ResponseCode === '0') {
      console.log('[M-Pesa] STK Push initiated successfully:', CheckoutRequestID);
      return {
        success: true,
        checkoutRequestId: CheckoutRequestID,
        message: `M-Pesa prompt sent to ${formattedPhone}. Please enter your PIN to complete payment.`,
      };
    } else {
      console.error('[M-Pesa] STK Push failed:', ResponseDescription);
      return {
        success: false,
        message: ResponseDescription || 'Failed to initiate M-Pesa payment',
        error: ResponseCode,
      };
    }
  } catch (error: any) {
    const status = error?.response?.status;
    const darajaBody = error?.response?.data;
    console.error('[M-Pesa] STK Push error:', error.message, status ? `httpStatus=${status}` : '', darajaBody ? JSON.stringify(darajaBody).slice(0, 300) : '');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Failed to initiate M-Pesa payment: ${errorMessage}`,
      error: 'SYSTEM_ERROR',
    };
  }
}

/**
 * Query transaction status
 * Used to verify payment completion
 */
export async function queryTransactionStatus(
  checkoutRequestId: string
): Promise<{
  success: boolean;
  status?: string;
  message: string;
  resultCode?: string;
}> {
  try {
    const token = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);

    const queryRequest = {
      BusinessShortCode: MPESA_PAYBILL,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    const response = await axios.post(TRANSACTION_STATUS_URL, queryRequest, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30_000,
    });

    const { ResultCode, ResultDesc } = response.data;

    const status = ResultCode === '0' ? 'completed' : 'pending';

    return {
      success: ResultCode === '0',
      status,
      resultCode: ResultCode,
      message: ResultDesc || 'Transaction status retrieved',
    };
  } catch (error) {
    console.error('[M-Pesa] Query transaction status error:', error);
    return {
      success: false,
      status: 'error',
      message: 'Failed to query transaction status',
    };
  }
}

/**
 * Verify M-Pesa callback signature
 * Daraja sends callbacks with a signature for verification
 */
export function verifyCallbackSignature(
  callbackData: any,
  signature: string
): boolean {
  try {
    // In production, verify the signature using Daraja's public key
    // For now, we'll accept all callbacks (should be secured in production)
    console.log('[M-Pesa] Callback signature verification skipped (implement in production)');
    return true;
  } catch (error) {
    console.error('[M-Pesa] Signature verification failed:', error);
    return false;
  }
}

/**
 * Parse M-Pesa callback response
 */
export function parseCallbackResponse(data: any): {
  checkoutRequestId: string;
  resultCode: string;
  resultDescription: string;
  merchantRequestId: string;
  amount?: number;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  phoneNumber?: string;
} {
  const result = data.Body?.stkCallback?.CallbackMetadata?.Item || [];

  const itemMap = result.reduce((acc: any, item: any) => {
    acc[item.Name] = item.Value;
    return acc;
  }, {});

  return {
    checkoutRequestId: data.Body?.stkCallback?.CheckoutRequestID || '',
    resultCode: String(data.Body?.stkCallback?.ResultCode || ''),
    resultDescription: data.Body?.stkCallback?.ResultDesc || '',
    merchantRequestId: data.Body?.stkCallback?.MerchantRequestID || '',
    amount: itemMap['Amount'],
    mpesaReceiptNumber: itemMap['MpesaReceiptNumber'],
    transactionDate: itemMap['TransactionDate'],
    phoneNumber: itemMap['PhoneNumber'],
  };
}

/**
 * Format amount in KES to readable string
 */
export function formatAmount(amountInCents: number): string {
  const amountInKES = Math.round(amountInCents / 100);
  return `KES ${amountInKES.toLocaleString('en-KE')}`;
}

/**
 * Check if M-Pesa credentials are configured
 */
export function isMpesaConfigured(): boolean {
  return !!(
    DARAJA_CONSUMER_KEY &&
    DARAJA_CONSUMER_SECRET &&
    MPESA_PAYBILL &&
    MPESA_PASSKEY
  );
}
