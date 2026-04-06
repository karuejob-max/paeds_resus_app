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
 * - CALLBACK_URL: Webhook URL for payment confirmation
 */

import axios from 'axios';
import { Buffer } from 'buffer';

// Environment variables
const DARAJA_CONSUMER_KEY = process.env.DARAJA_CONSUMER_KEY || '';
const DARAJA_CONSUMER_SECRET = process.env.DARAJA_CONSUMER_SECRET || '';
const MPESA_PAYBILL = process.env.MPESA_PAYBILL || '';
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || '';
const MPESA_ACCOUNT = process.env.MPESA_ACCOUNT || 'PAEDS_RESUS';
const CALLBACK_URL = process.env.CALLBACK_URL || '';

// Daraja API endpoints
const AUTH_URL = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
const STK_PUSH_URL = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
const TRANSACTION_STATUS_URL = 'https://sandbox.safaricom.co.ke/mpesa/transactionstatus/v1/query';

// Cache for access token
let accessToken: { token: string; expiresAt: number } | null = null;

/**
 * Get OAuth access token from Daraja API
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (accessToken && accessToken.expiresAt > Date.now()) {
    return accessToken.token;
  }

  try {
    const auth = Buffer.from(`${DARAJA_CONSUMER_KEY}:${DARAJA_CONSUMER_SECRET}`).toString('base64');

    const response = await axios.get(AUTH_URL, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const token = response.data.access_token;
    const expiresIn = response.data.expires_in * 1000; // Convert to milliseconds

    // Cache token with 1 minute buffer before expiry
    accessToken = {
      token,
      expiresAt: Date.now() + expiresIn - 60000,
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
 * Generate timestamp in format: YYYYMMDDHHmmss
 */
function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

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
      CallBackURL: `${CALLBACK_URL}/api/mpesa/callback`,
      AccountReference: MPESA_ACCOUNT,
      TransactionDesc: `${courseTitle} (Enrollment #${enrollmentId})`,
    };

    console.log('[M-Pesa] Initiating STK Push:', {
      phone: formattedPhone,
      amount,
      courseId,
      enrollmentId,
    });

    // Call Daraja API
    const response = await axios.post(STK_PUSH_URL, stkPushRequest, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
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
  } catch (error) {
    console.error('[M-Pesa] STK Push error:', error);
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
    });

    const { ResultCode, ResultDesc } = response.data;

    // Result codes:
    // 0 = Success
    // 1 = Insufficient Funds
    // 2 = Less Amount
    // 3 = More Amount
    // 4 = Rejected
    // 5 = On Queue
    // 6 = Not Responded
    // 7 = System Malfunction

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
    MPESA_PASSKEY &&
    CALLBACK_URL
  );
}


