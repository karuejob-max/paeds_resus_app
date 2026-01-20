import axios from "axios";
import crypto from "crypto";

/**
 * M-Pesa Payment Integration Service
 * Handles Lipa na M-Pesa Online (STK Push) payments
 * Paybill: 247247, Account: 606854
 */

const MPESA_CONFIG = {
  // Your M-Pesa credentials (from environment variables)
  consumerKey: process.env.MPESA_CONSUMER_KEY || "",
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || "",
  businessShortCode: "247247", // Paybill number
  accountReference: "606854", // Account number
  passkey: process.env.MPESA_PASSKEY || "",
  
  // API endpoints
  authUrl: "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
  stkPushUrl: "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
  queryUrl: "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
  callbackUrl: process.env.MPESA_CALLBACK_URL || "https://your-domain.com/api/mpesa/callback",
};

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

/**
 * Generate M-Pesa OAuth token
 */
export async function getMpesaAccessToken(): Promise<string> {
  try {
    const auth = Buffer.from(
      `${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`
    ).toString("base64");

    const response = await axios.get(MPESA_CONFIG.authUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    return response.data.access_token;
  } catch (error) {
    console.error("Error getting M-Pesa access token:", error);
    throw new Error("Failed to authenticate with M-Pesa");
  }
}

/**
 * Generate password for M-Pesa STK Push
 */
function generatePassword(): { password: string; timestamp: string } {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:-]/g, "")
    .split(".")[0];

  const dataToEncrypt =
    MPESA_CONFIG.businessShortCode +
    MPESA_CONFIG.passkey +
    timestamp;

  const password = Buffer.from(dataToEncrypt).toString("base64");

  return { password, timestamp };
}

/**
 * Initiate M-Pesa STK Push payment
 */
export async function initiateStkPush(
  request: MpesaPaymentRequest
): Promise<MpesaPaymentResponse> {
  try {
    const accessToken = await getMpesaAccessToken();
    const { password, timestamp } = generatePassword();

    // Format phone number (remove leading 0, add country code)
    const formattedPhone = request.phoneNumber.startsWith("0")
      ? `254${request.phoneNumber.slice(1)}`
      : request.phoneNumber.startsWith("254")
      ? request.phoneNumber
      : `254${request.phoneNumber}`;

    const payload = {
      BusinessShortCode: MPESA_CONFIG.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(request.amount),
      PartyA: formattedPhone,
      PartyB: MPESA_CONFIG.businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CONFIG.callbackUrl,
      AccountReference: request.accountReference,
      TransactionDesc: request.transactionDesc,
    };

    const response = await axios.post(MPESA_CONFIG.stkPushUrl, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return {
      success: response.data.ResponseCode === "0",
      checkoutRequestID: response.data.CheckoutRequestID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription,
      customerMessage: response.data.CustomerMessage,
    };
  } catch (error: any) {
    console.error("Error initiating M-Pesa STK Push:", error);
    return {
      success: false,
      error: error.response?.data?.errorMessage || "Payment initiation failed",
    };
  }
}

/**
 * Query M-Pesa STK Push status
 */
export async function queryStk(checkoutRequestID: string): Promise<any> {
  try {
    const accessToken = await getMpesaAccessToken();
    const { password, timestamp } = generatePassword();

    const payload = {
      BusinessShortCode: MPESA_CONFIG.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID,
    };

    const response = await axios.post(MPESA_CONFIG.queryUrl, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error querying STK status:", error);
    throw error;
  }
}

/**
 * Verify M-Pesa callback signature
 */
export function verifyCallbackSignature(
  signature: string,
  payload: string
): boolean {
  try {
    const hmac = crypto.createHmac("sha256", MPESA_CONFIG.passkey);
    const hash = hmac.update(payload).digest("base64");
    return hash === signature;
  } catch (error) {
    console.error("Error verifying callback signature:", error);
    return false;
  }
}

/**
 * Parse M-Pesa callback response
 */
export function parseCallbackResponse(body: any): {
  success: boolean;
  transactionId?: string;
  amount?: number;
  phoneNumber?: string;
  resultCode?: string;
  resultDesc?: string;
} {
  try {
    const result = body.Body?.stkCallback?.CallbackMetadata?.Item || [];
    const resultCode = body.Body?.stkCallback?.ResultCode;
    const resultDesc = body.Body?.stkCallback?.ResultDesc;

    if (resultCode === 0) {
      const metadataMap: any = {};
      result.forEach((item: any) => {
        metadataMap[item.Name] = item.Value;
      });

      return {
        success: true,
        transactionId: metadataMap.MpesaReceiptNumber,
        amount: metadataMap.Amount,
        phoneNumber: metadataMap.PhoneNumber,
        resultCode: resultCode,
        resultDesc: resultDesc,
      };
    } else {
      return {
        success: false,
        resultCode: resultCode,
        resultDesc: resultDesc,
      };
    }
  } catch (error) {
    console.error("Error parsing callback response:", error);
    return { success: false };
  }
}

/**
 * Handle M-Pesa webhook callback
 */
export async function handleMpesaCallback(
  body: any,
  onPaymentSuccess: (data: any) => Promise<void>
): Promise<void> {
  try {
    const callbackData = parseCallbackResponse(body);

    if (callbackData.success) {
      console.log("Payment successful:", callbackData);
      await onPaymentSuccess(callbackData);
    } else {
      console.log("Payment failed:", callbackData);
    }
  } catch (error) {
    console.error("Error handling M-Pesa callback:", error);
    throw error;
  }
}
