/**
 * M-Pesa Integration Service
 * Handles STK Push, payment confirmation, and transaction tracking
 */

import { invokeLLM } from "../_core/llm";

interface STKPushRequest {
  phoneNumber: string;
  amount: number;
  courseId: string;
  userId: string;
  enrollmentId: string;
}

interface STKPushResponse {
  success: boolean;
  checkoutRequestId?: string;
  responseCode?: string;
  responseDescription?: string;
  customerMessage?: string;
  error?: string;
}

interface PaymentConfirmation {
  transactionId: string;
  amount: number;
  phoneNumber: string;
  status: "success" | "failed" | "pending";
  timestamp: Date;
}

/**
 * Initiate M-Pesa STK Push for course enrollment payment
 */
export async function initiateMpesaSTKPush(
  request: STKPushRequest
): Promise<STKPushResponse> {
  try {
    const {
      phoneNumber,
      amount,
      courseId,
      userId,
      enrollmentId,
    } = request;

    // Validate phone number format (Kenya: 254XXXXXXXXX or 07XXXXXXXXX)
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      return {
        success: false,
        error: "Invalid phone number format. Use format: 254XXXXXXXXX or 07XXXXXXXXX",
      };
    }

    // Validate amount
    if (amount < 1 || amount > 150000) {
      return {
        success: false,
        error: "Amount must be between 1 KES and 150,000 KES",
      };
    }

    // Call M-Pesa API via Manus built-in service
    // This would typically call the Daraja API (M-Pesa's developer API)
    // For now, we'll use a placeholder that would be replaced with actual API call

    const mpesaResponse = await callMpesaAPI({
      phoneNumber: normalizedPhone,
      amount,
      accountReference: `ENROLL-${courseId}`,
      transactionDesc: `Paeds Resus Course Enrollment: ${courseId}`,
      enrollmentId,
      userId,
    });

    if (mpesaResponse.success) {
      return {
        success: true,
        checkoutRequestId: mpesaResponse.checkoutRequestId,
        responseCode: mpesaResponse.responseCode,
        responseDescription: mpesaResponse.responseDescription,
        customerMessage: `STK Push sent to ${normalizedPhone}. Please enter your M-Pesa PIN to complete payment of ${amount} KES.`,
      };
    } else {
      return {
        success: false,
        error: mpesaResponse.error || "Failed to initiate M-Pesa payment",
      };
    }
  } catch (error) {
    console.error("[M-Pesa] STK Push Error:", error);
    return {
      success: false,
      error: "Failed to initiate M-Pesa payment. Please try again.",
    };
  }
}

/**
 * Normalize phone number to 254XXXXXXXXX format
 */
function normalizePhoneNumber(phone: string): string | null {
  // Remove spaces and dashes
  let cleaned = phone.replace(/[\s\-]/g, "");

  // Handle 07XXXXXXXXX format -> 254XXXXXXXXX
  if (cleaned.startsWith("07")) {
    cleaned = "254" + cleaned.substring(1);
  }

  // Handle +254XXXXXXXXX format -> 254XXXXXXXXX
  if (cleaned.startsWith("+254")) {
    cleaned = cleaned.substring(1);
  }

  // Validate format: should be 254 followed by 9 digits
  if (!/^254\d{9}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Call M-Pesa Daraja API (placeholder - replace with actual implementation)
 */
async function callMpesaAPI(params: {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
  enrollmentId: string;
  userId: string;
}): Promise<{
  success: boolean;
  checkoutRequestId?: string;
  responseCode?: string;
  responseDescription?: string;
  error?: string;
}> {
  try {
    // In production, this would call the actual M-Pesa Daraja API
    // For now, we'll simulate a successful response
    
    // TODO: Replace with actual Daraja API call using:
    // - DARAJA_CONSUMER_KEY (from env)
    // - DARAJA_CONSUMER_SECRET (from env)
    // - MPESA_PAYBILL (from env)
    // - MPESA_PASSKEY (from env)

    // Simulated response for development
    const checkoutRequestId = `${Date.now()}-${params.enrollmentId}`;

    return {
      success: true,
      checkoutRequestId,
      responseCode: "0",
      responseDescription: "Success. Request accepted for processing",
    };
  } catch (error) {
    console.error("[M-Pesa] API Call Error:", error);
    return {
      success: false,
      error: "Failed to call M-Pesa API",
    };
  }
}

/**
 * Handle M-Pesa payment callback/confirmation
 * This would be called by M-Pesa webhook when payment is completed
 */
export async function handleMpesaCallback(
  callbackData: any
): Promise<PaymentConfirmation | null> {
  try {
    // Parse M-Pesa callback response
    const {
      Body: {
        stkCallback: {
          MerchantRequestID,
          CheckoutRequestID,
          ResultCode,
          ResultDesc,
          CallbackMetadata,
        },
      },
    } = callbackData;

    if (ResultCode === 0) {
      // Payment successful
      const metadata = CallbackMetadata?.Item || [];
      const amount = metadata.find((item: any) => item.Name === "Amount")?.Value;
      const phoneNumber = metadata.find(
        (item: any) => item.Name === "PhoneNumber"
      )?.Value;
      const mpesaReceiptNumber = metadata.find(
        (item: any) => item.Name === "MpesaReceiptNumber"
      )?.Value;

      return {
        transactionId: mpesaReceiptNumber,
        amount,
        phoneNumber,
        status: "success",
        timestamp: new Date(),
      };
    } else {
      // Payment failed or cancelled
      console.log("[M-Pesa] Payment failed:", ResultDesc);
      return {
        transactionId: CheckoutRequestID,
        amount: 0,
        phoneNumber: "",
        status: "failed",
        timestamp: new Date(),
      };
    }
  } catch (error) {
    console.error("[M-Pesa] Callback Processing Error:", error);
    return null;
  }
}

/**
 * Query M-Pesa transaction status
 */
export async function queryTransactionStatus(
  checkoutRequestId: string
): Promise<{
  status: "pending" | "success" | "failed";
  message: string;
}> {
  try {
    // TODO: Implement actual transaction status query using Daraja API
    // This would call M-Pesa's QueryPaymentStatus endpoint

    return {
      status: "pending",
      message: "Transaction status query not yet implemented",
    };
  } catch (error) {
    console.error("[M-Pesa] Status Query Error:", error);
    return {
      status: "failed",
      message: "Failed to query transaction status",
    };
  }
}
