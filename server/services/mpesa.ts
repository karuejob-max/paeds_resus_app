/**
 * M-Pesa STK Push Service
 * Handles authentication with Daraja API and STK Push payment initiation
 */

interface TokenResponse {
  access_token: string;
  expires_in: string | number;
}

interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface STKPushError {
  requestId: string;
  errorCode: string;
  errorMessage: string;
}

class MpesaService {
  private consumerKey: string;
  private consumerSecret: string;
  private paybill: string;
  private accountNumber: string;
  private baseUrl: string = "https://sandbox.safaricom.co.ke";
  private environment: "sandbox" | "production" = "sandbox";
  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor() {
    this.consumerKey = process.env.DARAJA_CONSUMER_KEY || "";
    this.consumerSecret = process.env.DARAJA_CONSUMER_SECRET || "";
    this.paybill = process.env.MPESA_PAYBILL || "";
    this.accountNumber = process.env.MPESA_ACCOUNT || "";
    this.environment = (process.env.MPESA_ENVIRONMENT as "sandbox" | "production") || "sandbox";

    // Set baseUrl based on environment
    if (this.environment === "production") {
      this.baseUrl = "https://api.safaricom.co.ke";
    } else {
      this.baseUrl = "https://sandbox.safaricom.co.ke";
    }

    if (!this.consumerKey || !this.consumerSecret) {
      throw new Error("Missing Daraja credentials in environment");
    }

    if (!this.paybill || !this.accountNumber) {
      throw new Error("Missing M-Pesa paybill/account in environment");
    }

    console.log(`[M-Pesa] Initialized in ${this.environment} mode with baseUrl: ${this.baseUrl}`);
  }

  /**
   * Get Bearer token from Daraja API
   * Caches token until expiration to avoid unnecessary API calls
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token;
    }

    const credentials = Buffer.from(
      `${this.consumerKey}:${this.consumerSecret}`
    ).toString("base64");

    try {
      const response = await fetch(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Token generation failed: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as TokenResponse;

      // Cache token with 5 minute buffer before expiration
      const expiresIn =
        typeof data.expires_in === "string"
          ? parseInt(data.expires_in)
          : data.expires_in;
      this.tokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + (expiresIn - 300) * 1000,
      };

      return data.access_token;
    } catch (error) {
      throw new Error(
        `Failed to get access token: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Initiate STK Push payment
   * Prompts user to enter M-Pesa PIN on their phone
   */
  async initiateSTKPush(
    phoneNumber: string,
    amount: number,
    reference: string,
    description: string
  ): Promise<STKPushResponse> {
    // Validate inputs
    if (!phoneNumber || !phoneNumber.match(/^254\d{9}$/)) {
      throw new Error(
        "Invalid phone number. Must be in format 254XXXXXXXXX"
      );
    }

    if (amount < 1 || amount > 150000) {
      throw new Error("Amount must be between 1 and 150,000");
    }

    if (!reference || reference.length > 40) {
      throw new Error("Reference must be provided and max 40 characters");
    }

    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const password = this.generatePassword(timestamp);

    const payload = {
      BusinessShortCode: this.paybill,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.floor(amount),
      PartyA: phoneNumber,
      PartyB: this.paybill,
      PhoneNumber: phoneNumber,
      CallBackURL: `${process.env.CALLBACK_URL || "https://paedsresus.com"}/api/mpesa/callback`,
      AccountReference: this.accountNumber,
      TransactionDesc: description,
    };

    try {
      const response = await fetch(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = (await response.json()) as STKPushError;
        throw new Error(
          `STK Push failed: ${error.errorMessage || response.statusText}`
        );
      }

      const data = (await response.json()) as STKPushResponse;

      if (data.ResponseCode !== "0") {
        throw new Error(
          `STK Push rejected: ${data.ResponseDescription || data.CustomerMessage}`
        );
      }

      return data;
    } catch (error) {
      throw new Error(
        `Failed to initiate STK Push: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate timestamp in format YYYYMMDDHHmmss
   */
  private getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Generate password for STK Push
   * Base64(BusinessShortCode + Passkey + Timestamp)
   */
  private generatePassword(timestamp: string): string {
    const passkey = process.env.MPESA_PASSKEY || "";
    if (!passkey) {
      throw new Error("MPESA_PASSKEY not configured");
    }

    const data = `${this.paybill}${passkey}${timestamp}`;
    return Buffer.from(data).toString("base64");
  }
}

// Export singleton instance
export const mpesaService = new MpesaService();

export type { STKPushResponse, STKPushError };
