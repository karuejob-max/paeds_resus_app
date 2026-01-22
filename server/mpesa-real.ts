/**
 * Real M-Pesa Payment Integration Service
 * Implements actual M-Pesa Daraja API for production
 * Requires: MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY
 */

import axios from "axios";

const MPESA_API_URL = "https://api.safaricom.co.ke";
const MPESA_SANDBOX_URL = "https://sandbox.safaricom.co.ke";

// Use sandbox for development, production for live
const API_URL = process.env.MPESA_ENV === "production" ? MPESA_API_URL : MPESA_SANDBOX_URL;

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  shortCode: string;
  passKey: string;
  callbackUrl: string;
}

interface MpesaPaymentRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
  orderId: string;
}

interface MpesaPaymentResponse {
  success: boolean;
  checkoutRequestID?: string;
  responseCode?: string;
  responseDescription?: string;
  customerMessage?: string;
  error?: string;
}

interface PaymentStatus {
  resultCode: string;
  resultDesc: string;
  checkoutRequestID?: string;
  merchantRequestID?: string;
  amount?: number;
  mpesaReceiptNumber?: string;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/**
 * Get M-Pesa OAuth access token
 */
async function getMpesaAccessToken(): Promise<string> {
  try {
    // Return cached token if still valid
    if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
      return cachedAccessToken.token;
    }

    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret) {
      throw new Error("M-Pesa credentials not configured");
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    const response = await axios.get(`${API_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const token = response.data.access_token;
    const expiresIn = response.data.expires_in || 3600; // Default 1 hour

    // Cache token with 5-minute buffer before expiry
    cachedAccessToken = {
      token,
      expiresAt: Date.now() + (expiresIn - 300) * 1000,
    };

    return token;
  } catch (error: any) {
    console.error("Error getting M-Pesa access token:", error.message);
    throw new Error("Failed to authenticate with M-Pesa");
  }
}

/**
 * Initiate M-Pesa STK Push payment
 */
export async function initiateStkPush(request: MpesaPaymentRequest): Promise<MpesaPaymentResponse> {
  try {
    // Validate phone number
    let formattedPhone = request.phoneNumber;
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone;
    }

    if (!/^254\d{9}$/.test(formattedPhone)) {
      return {
        success: false,
        error: "Invalid phone number format. Use format: 254712345678",
      };
    }

    const shortCode = process.env.MPESA_SHORTCODE;
    const passKey = process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK_URL || "https://example.com/api/mpesa/callback";

    if (!shortCode || !passKey) {
      return {
        success: false,
        error: "M-Pesa configuration incomplete",
      };
    }

    // Get access token
    const accessToken = await getMpesaAccessToken();

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[:-]/g, "").split(".")[0];

    // Generate password: base64(shortCode + passKey + timestamp)
    const password = Buffer.from(`${shortCode}${passKey}${timestamp}`).toString("base64");

    // Prepare STK Push request
    const stkPushRequest = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(request.amount), // M-Pesa requires whole numbers
      PartyA: formattedPhone,
      PartyB: shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: request.accountReference,
      TransactionDesc: request.transactionDesc,
    };

    // Make STK Push request
    const response = await axios.post(
      `${API_URL}/mpesa/stkpush/v1/processrequest`,
      stkPushRequest,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.ResponseCode === "0") {
      return {
        success: true,
        checkoutRequestID: response.data.CheckoutRequestID,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
        customerMessage: response.data.CustomerMessage,
      };
    } else {
      return {
        success: false,
        error: response.data.ResponseDescription || "STK Push failed",
      };
    }
  } catch (error: any) {
    console.error("Error initiating M-Pesa STK Push:", error.message);
    return {
      success: false,
      error: error.message || "Payment initiation failed",
    };
  }
}

/**
 * Query M-Pesa payment status
 */
export async function queryStk(checkoutRequestID: string): Promise<PaymentStatus> {
  try {
    const shortCode = process.env.MPESA_SHORTCODE;
    const passKey = process.env.MPESA_PASSKEY;

    if (!shortCode || !passKey) {
      return {
        resultCode: "1",
        resultDesc: "M-Pesa configuration incomplete",
      };
    }

    // Get access token
    const accessToken = await getMpesaAccessToken();

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[:-]/g, "").split(".")[0];

    // Generate password
    const password = Buffer.from(`${shortCode}${passKey}${timestamp}`).toString("base64");

    // Prepare query request
    const queryRequest = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID,
    };

    // Make query request
    const response = await axios.post(
      `${API_URL}/mpesa/stkpushquery/v1/query`,
      queryRequest,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const resultCode = response.data.ResultCode;

    if (resultCode === "0") {
      return {
        resultCode: "0",
        resultDesc: "The transaction has been completed successfully",
        checkoutRequestID: response.data.CheckoutRequestID,
        merchantRequestID: response.data.MerchantRequestID,
        amount: response.data.CallbackMetadata?.Item?.find(
          (item: any) => item.Name === "Amount"
        )?.Value,
        mpesaReceiptNumber: response.data.CallbackMetadata?.Item?.find(
          (item: any) => item.Name === "MpesaReceiptNumber"
        )?.Value,
      };
    } else if (resultCode === "1032") {
      return {
        resultCode: "1032",
        resultDesc: "Request timeout. Please try again",
        checkoutRequestID,
      };
    } else if (resultCode === "1") {
      return {
        resultCode: "1",
        resultDesc: "The transaction was cancelled by the user",
        checkoutRequestID,
      };
    } else {
      return {
        resultCode: resultCode,
        resultDesc: response.data.ResultDesc || "Query failed",
        checkoutRequestID,
      };
    }
  } catch (error: any) {
    console.error("Error querying M-Pesa payment status:", error.message);
    return {
      resultCode: "1",
      resultDesc: error.message || "Query failed",
    };
  }
}

/**
 * Handle M-Pesa callback notification
 */
export async function handleMpesaCallback(body: any): Promise<{ ResultCode: number }> {
  try {
    const { Body } = body;
    const { stkCallback } = Body;

    if (!stkCallback) {
      console.warn("Invalid M-Pesa callback structure");
      return { ResultCode: 1 };
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    console.log(`M-Pesa Callback: ${CheckoutRequestID} - ${ResultDesc}`);

    // Process callback based on result code
    if (ResultCode === 0) {
      // Payment successful
      const amount = CallbackMetadata?.Item?.find((item: any) => item.Name === "Amount")?.Value;
      const mpesaReceiptNumber = CallbackMetadata?.Item?.find(
        (item: any) => item.Name === "MpesaReceiptNumber"
      )?.Value;
      const phoneNumber = CallbackMetadata?.Item?.find(
        (item: any) => item.Name === "PhoneNumber"
      )?.Value;

      console.log(`Payment successful: ${mpesaReceiptNumber} for ${amount} KES from ${phoneNumber}`);

      // TODO: Update payment status in database
      // TODO: Send confirmation email/SMS
      // TODO: Trigger enrollment completion
    } else {
      // Payment failed or cancelled
      console.log(`Payment failed: ${ResultDesc}`);

      // TODO: Update payment status as failed
      // TODO: Send failure notification
    }

    return { ResultCode: 0 };
  } catch (error: any) {
    console.error("Error handling M-Pesa callback:", error.message);
    return { ResultCode: 1 };
  }
}

/**
 * Validate M-Pesa phone number
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  let formatted = phoneNumber;
  if (formatted.startsWith("0")) {
    formatted = "254" + formatted.substring(1);
  } else if (!formatted.startsWith("254")) {
    formatted = "254" + formatted;
  }

  return /^254\d{9}$/.test(formatted);
}
