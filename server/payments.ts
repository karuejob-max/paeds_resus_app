/**
 * Global Payment Systems Integration
 * Supports M-Pesa, Stripe, PayPal, and bank transfers
 */

export type PaymentMethod = "mpesa" | "stripe" | "paypal" | "bank_transfer";
export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded";
export type Currency = "KES" | "USD" | "EUR" | "GBP" | "ZAR" | "NGN";

export interface Payment {
  id: string;
  userId: number;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  status: PaymentStatus;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  transactionId?: string;
  errorMessage?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  clientSecret?: string;
  status: "created" | "confirmed" | "failed";
}

export interface CurrencyConversion {
  from: Currency;
  to: Currency;
  rate: number;
  timestamp: Date;
}

class PaymentService {
  private payments: Map<string, Payment> = new Map();
  private paymentIntents: Map<string, PaymentIntent> = new Map();
  private exchangeRates: Map<string, number> = new Map();
  private webhookLogs: Array<{ event: string; data: unknown; timestamp: Date }> = [];

  constructor() {
    // Initialize exchange rates (in production, these would be fetched from an API)
    this.initializeExchangeRates();
  }

  /**
   * Initialize exchange rates
   */
  private initializeExchangeRates(): void {
    // Rates relative to USD
    this.exchangeRates.set("USD_KES", 130); // 1 USD = 130 KES
    this.exchangeRates.set("USD_EUR", 0.92); // 1 USD = 0.92 EUR
    this.exchangeRates.set("USD_GBP", 0.79); // 1 USD = 0.79 GBP
    this.exchangeRates.set("USD_ZAR", 18.5); // 1 USD = 18.5 ZAR
    this.exchangeRates.set("USD_NGN", 1550); // 1 USD = 1550 NGN
  }

  /**
   * Convert currency
   */
  convertCurrency(amount: number, from: Currency, to: Currency): CurrencyConversion {
    if (from === to) {
      return {
        from,
        to,
        rate: 1,
        timestamp: new Date(),
      };
    }

    // Convert to USD first, then to target currency
    let rateToUSD = 1;
    let rateFromUSD = 1;

    if (from !== "USD") {
      const key = `USD_${from}`;
      rateToUSD = 1 / (this.exchangeRates.get(key) || 1);
    }

    if (to !== "USD") {
      const key = `USD_${to}`;
      rateFromUSD = this.exchangeRates.get(key) || 1;
    }

    const rate = rateToUSD * rateFromUSD;

    return {
      from,
      to,
      rate,
      timestamp: new Date(),
    };
  }

  /**
   * Create payment intent
   */
  createPaymentIntent(
    userId: number,
    amount: number,
    currency: Currency,
    method: PaymentMethod,
    description: string,
    metadata: Record<string, unknown> = {}
  ): Payment {
    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const payment: Payment = {
      id: paymentId,
      userId,
      amount,
      currency,
      method,
      status: "pending",
      description,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.payments.set(paymentId, payment);

    // Log webhook event
    this.webhookLogs.push({
      event: "payment.created",
      data: payment,
      timestamp: new Date(),
    });

    return payment;
  }

  /**
   * Process M-Pesa payment
   */
  async processMPesaPayment(
    paymentId: string,
    phoneNumber: string,
    mpesaTransactionId: string
  ): Promise<{ success: boolean; payment?: Payment; error?: string }> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    if (payment.method !== "mpesa") {
      return { success: false, error: "Payment method mismatch" };
    }

    try {
      // In production, verify with M-Pesa API
      payment.status = "completed";
      payment.transactionId = mpesaTransactionId;
      payment.completedAt = new Date();
      payment.updatedAt = new Date();
      payment.metadata.phoneNumber = phoneNumber;

      this.payments.set(paymentId, payment);

      // Log webhook event
      this.webhookLogs.push({
        event: "payment.completed",
        data: payment,
        timestamp: new Date(),
      });

      return { success: true, payment };
    } catch (error) {
      payment.status = "failed";
      payment.errorMessage = error instanceof Error ? error.message : "Unknown error";
      payment.updatedAt = new Date();

      this.payments.set(paymentId, payment);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment processing failed",
      };
    }
  }

  /**
   * Process Stripe payment
   */
  async processStripePayment(
    paymentId: string,
    stripePaymentIntentId: string
  ): Promise<{ success: boolean; payment?: Payment; error?: string }> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    if (payment.method !== "stripe") {
      return { success: false, error: "Payment method mismatch" };
    }

    try {
      // In production, verify with Stripe API
      payment.status = "completed";
      payment.transactionId = stripePaymentIntentId;
      payment.completedAt = new Date();
      payment.updatedAt = new Date();

      this.payments.set(paymentId, payment);

      this.webhookLogs.push({
        event: "payment.completed",
        data: payment,
        timestamp: new Date(),
      });

      return { success: true, payment };
    } catch (error) {
      payment.status = "failed";
      payment.errorMessage = error instanceof Error ? error.message : "Unknown error";
      payment.updatedAt = new Date();

      this.payments.set(paymentId, payment);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment processing failed",
      };
    }
  }

  /**
   * Process PayPal payment
   */
  async processPayPalPayment(
    paymentId: string,
    paypalOrderId: string
  ): Promise<{ success: boolean; payment?: Payment; error?: string }> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    if (payment.method !== "paypal") {
      return { success: false, error: "Payment method mismatch" };
    }

    try {
      // In production, verify with PayPal API
      payment.status = "completed";
      payment.transactionId = paypalOrderId;
      payment.completedAt = new Date();
      payment.updatedAt = new Date();

      this.payments.set(paymentId, payment);

      this.webhookLogs.push({
        event: "payment.completed",
        data: payment,
        timestamp: new Date(),
      });

      return { success: true, payment };
    } catch (error) {
      payment.status = "failed";
      payment.errorMessage = error instanceof Error ? error.message : "Unknown error";
      payment.updatedAt = new Date();

      this.payments.set(paymentId, payment);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment processing failed",
      };
    }
  }

  /**
   * Record bank transfer
   */
  recordBankTransfer(
    paymentId: string,
    bankName: string,
    accountNumber: string,
    referenceNumber: string
  ): { success: boolean; payment?: Payment; error?: string } {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    if (payment.method !== "bank_transfer") {
      return { success: false, error: "Payment method mismatch" };
    }

    try {
      payment.status = "processing";
      payment.transactionId = referenceNumber;
      payment.updatedAt = new Date();
      payment.metadata.bankName = bankName;
      payment.metadata.accountNumber = accountNumber;

      this.payments.set(paymentId, payment);

      this.webhookLogs.push({
        event: "payment.processing",
        data: payment,
        timestamp: new Date(),
      });

      return { success: true, payment };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to record bank transfer",
      };
    }
  }

  /**
   * Confirm bank transfer
   */
  confirmBankTransfer(paymentId: string): { success: boolean; payment?: Payment; error?: string } {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    if (payment.status !== "processing") {
      return { success: false, error: "Payment is not in processing status" };
    }

    try {
      payment.status = "completed";
      payment.completedAt = new Date();
      payment.updatedAt = new Date();

      this.payments.set(paymentId, payment);

      this.webhookLogs.push({
        event: "payment.completed",
        data: payment,
        timestamp: new Date(),
      });

      return { success: true, payment };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to confirm bank transfer",
      };
    }
  }

  /**
   * Refund payment
   */
  refundPayment(paymentId: string, reason: string): { success: boolean; payment?: Payment; error?: string } {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    if (payment.status !== "completed") {
      return { success: false, error: "Only completed payments can be refunded" };
    }

    try {
      payment.status = "refunded";
      payment.updatedAt = new Date();
      payment.metadata.refundReason = reason;
      payment.metadata.refundedAt = new Date();

      this.payments.set(paymentId, payment);

      this.webhookLogs.push({
        event: "payment.refunded",
        data: payment,
        timestamp: new Date(),
      });

      return { success: true, payment };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to refund payment",
      };
    }
  }

  /**
   * Get payment by ID
   */
  getPayment(paymentId: string): Payment | null {
    return this.payments.get(paymentId) || null;
  }

  /**
   * Get user payments
   */
  getUserPayments(userId: number, limit: number = 50): Payment[] {
    const userPayments = Array.from(this.payments.values()).filter((p) => p.userId === userId);
    return userPayments.slice(-limit);
  }

  /**
   * Get payment statistics
   */
  getPaymentStatistics(): {
    totalPayments: number;
    completedAmount: number;
    pendingAmount: number;
    failedCount: number;
    refundedCount: number;
  } {
    const payments = Array.from(this.payments.values());

    let completedAmount = 0;
    let pendingAmount = 0;
    let failedCount = 0;
    let refundedCount = 0;

    payments.forEach((p) => {
      if (p.status === "completed") {
        completedAmount += p.amount;
      } else if (p.status === "pending" || p.status === "processing") {
        pendingAmount += p.amount;
      } else if (p.status === "failed") {
        failedCount++;
      } else if (p.status === "refunded") {
        refundedCount++;
      }
    });

    return {
      totalPayments: payments.length,
      completedAmount,
      pendingAmount,
      failedCount,
      refundedCount,
    };
  }

  /**
   * Get webhook logs
   */
  getWebhookLogs(limit: number = 100): Array<{ event: string; data: unknown; timestamp: Date }> {
    return this.webhookLogs.slice(-limit);
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
