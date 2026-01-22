/**
 * Mock M-Pesa Payment Service for MVP Testing
 * Simulates M-Pesa STK Push flow for development/testing
 * Replace with real implementation when credentials are available
 */

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
}

// Mock payment store (in real implementation, this would be a database)
const mockPayments = new Map<string, { status: string; amount: number; timestamp: number }>();

/**
 * Mock M-Pesa OAuth token generation
 */
export async function getMpesaAccessToken(): Promise<string> {
  // Simulate token generation
  return `mock_token_${Date.now()}`;
}

/**
 * Mock STK Push initiation
 * Simulates sending M-Pesa prompt to user's phone
 */
export async function initiateStkPush(
  request: MpesaPaymentRequest
): Promise<MpesaPaymentResponse> {
  try {
    // Validate phone number format
    let formattedPhone = request.phoneNumber;
    if (!formattedPhone.startsWith("254")) {
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "254" + formattedPhone.substring(1);
      } else {
        formattedPhone = "254" + formattedPhone;
      }
    }

    // Generate mock checkout request ID
    const checkoutRequestID = `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store payment in mock store
    mockPayments.set(checkoutRequestID, {
      status: "pending",
      amount: request.amount,
      timestamp: Date.now(),
    });

    // Simulate successful STK Push
    return {
      success: true,
      checkoutRequestID,
      responseCode: "0",
      responseDescription: "Success. Request accepted for processing",
      customerMessage: "Please enter your M-Pesa PIN to complete this transaction",
    };
  } catch (error: any) {
    console.error("Error initiating mock M-Pesa payment:", error);
    return {
      success: false,
      error: error.message || "Payment initiation failed",
    };
  }
}

/**
 * Mock STK Push query
 * Simulates checking payment status
 */
export async function queryStk(checkoutRequestID: string): Promise<PaymentStatus> {
  try {
    const payment = mockPayments.get(checkoutRequestID);

    if (!payment) {
      return {
        resultCode: "1",
        resultDesc: "Request not found",
      };
    }

    // Simulate payment completion after 2 seconds
    const timeSinceCreation = Date.now() - payment.timestamp;
    const isCompleted = timeSinceCreation > 2000;

    if (isCompleted && payment.status === "pending") {
      // Randomly succeed or fail (90% success rate for testing)
      const shouldSucceed = Math.random() < 0.9;
      payment.status = shouldSucceed ? "completed" : "failed";
    }

    if (payment.status === "completed") {
      return {
        resultCode: "0",
        resultDesc: "The transaction has been completed successfully",
        checkoutRequestID,
        merchantRequestID: `MOCK_MERCHANT_${Date.now()}`,
      };
    } else if (payment.status === "failed") {
      return {
        resultCode: "1",
        resultDesc: "The transaction was cancelled by the user",
        checkoutRequestID,
      };
    } else {
      return {
        resultCode: "2031",
        resultDesc: "Request still processing",
        checkoutRequestID,
      };
    }
  } catch (error: any) {
    console.error("Error querying mock M-Pesa payment status:", error);
    return {
      resultCode: "1",
      resultDesc: error.message || "Query failed",
    };
  }
}

/**
 * Mock payment callback handler
 * Simulates M-Pesa callback notification
 */
export async function handleMpesaCallback(body: any): Promise<{ ResultCode: number }> {
  try {
    const { Body } = body;
    const { stkCallback } = Body;

    if (!stkCallback) {
      return { ResultCode: 1 };
    }

    const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

    // Update payment status in mock store
    const payment = mockPayments.get(CheckoutRequestID);
    if (payment) {
      payment.status = ResultCode === 0 ? "completed" : "failed";
    }

    console.log(`Mock M-Pesa callback: ${CheckoutRequestID} - ${ResultDesc}`);

    return { ResultCode: 0 };
  } catch (error: any) {
    console.error("Error handling mock M-Pesa callback:", error);
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

  // Must be 12 digits (254 + 9 digits)
  return /^254\d{9}$/.test(formatted);
}
