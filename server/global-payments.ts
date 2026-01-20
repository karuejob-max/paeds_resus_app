/**
 * Global Payment Systems Service
 * Multi-currency support, international payments, and compliance
 */

export interface PaymentProvider {
  id: string;
  name: string;
  country: string;
  currency: string;
  paymentMethods: string[];
  minAmount: number;
  maxAmount: number;
  fee: number; // percentage
  settlementTime: string;
  status: "active" | "inactive";
}

export interface CurrencyExchange {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
  source: string;
}

export interface InternationalPayment {
  id: string;
  userId: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  provider: string;
  status: "pending" | "completed" | "failed" | "refunded";
  exchangeRate: number;
  fees: number;
  netAmount: number;
  transactionId?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface PaymentCompliance {
  country: string;
  regulations: string[];
  taxRate: number;
  kyc: boolean;
  aml: boolean;
  dataResidency: string;
}

// Payment Providers by Region
export const PAYMENT_PROVIDERS: Record<string, PaymentProvider> = {
  mpesa_ke: {
    id: "mpesa_ke",
    name: "M-Pesa Kenya",
    country: "Kenya",
    currency: "KES",
    paymentMethods: ["mobile_money"],
    minAmount: 100,
    maxAmount: 1000000,
    fee: 1.5,
    settlementTime: "Instant",
    status: "active",
  },
  airtel_ke: {
    id: "airtel_ke",
    name: "Airtel Money Kenya",
    country: "Kenya",
    currency: "KES",
    paymentMethods: ["mobile_money"],
    minAmount: 100,
    maxAmount: 500000,
    fee: 1.5,
    settlementTime: "Instant",
    status: "active",
  },
  mpesa_ug: {
    id: "mpesa_ug",
    name: "M-Pesa Uganda",
    country: "Uganda",
    currency: "UGX",
    paymentMethods: ["mobile_money"],
    minAmount: 500,
    maxAmount: 5000000,
    fee: 1.5,
    settlementTime: "Instant",
    status: "active",
  },
  airtel_ug: {
    id: "airtel_ug",
    name: "Airtel Money Uganda",
    country: "Uganda",
    currency: "UGX",
    paymentMethods: ["mobile_money"],
    minAmount: 500,
    maxAmount: 3000000,
    fee: 1.5,
    settlementTime: "Instant",
    status: "active",
  },
  stripe_global: {
    id: "stripe_global",
    name: "Stripe",
    country: "Global",
    currency: "USD",
    paymentMethods: ["card", "bank_transfer"],
    minAmount: 1,
    maxAmount: 999999,
    fee: 2.9,
    settlementTime: "1-2 days",
    status: "active",
  },
  paypal_global: {
    id: "paypal_global",
    name: "PayPal",
    country: "Global",
    currency: "USD",
    paymentMethods: ["wallet", "card"],
    minAmount: 1,
    maxAmount: 999999,
    fee: 3.5,
    settlementTime: "1-3 days",
    status: "active",
  },
};

// Currency Exchange Rates
export const CURRENCY_RATES: Record<string, number> = {
  "KES/USD": 0.0077,
  "USD/KES": 130,
  "UGX/USD": 0.00027,
  "USD/UGX": 3700,
  "TZS/USD": 0.00039,
  "USD/TZS": 2500,
  "GHS/USD": 0.065,
  "USD/GHS": 15.4,
  "NGN/USD": 0.0013,
  "USD/NGN": 770,
};

/**
 * Convert currency
 */
export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;

  const rateKey = `${fromCurrency}/${toCurrency}`;
  const rate = CURRENCY_RATES[rateKey];

  if (!rate) {
    throw new Error(`Exchange rate not found for ${rateKey}`);
  }

  return Math.round(amount * rate * 100) / 100;
}

/**
 * Get available payment methods for country
 */
export function getPaymentMethodsForCountry(country: string): PaymentProvider[] {
  return Object.values(PAYMENT_PROVIDERS).filter(
    (p) => p.country === country || p.country === "Global"
  );
}

/**
 * Calculate payment fees
 */
export function calculatePaymentFees(
  amount: number,
  provider: PaymentProvider
): { amount: number; fee: number; total: number } {
  const fee = Math.round((amount * provider.fee) / 100);
  const total = amount + fee;

  return { amount, fee, total };
}

/**
 * Process international payment
 */
export function processInternationalPayment(
  userId: number,
  amount: number,
  currency: string,
  paymentMethod: string,
  targetCurrency: string = "KES"
): InternationalPayment {
  const provider = PAYMENT_PROVIDERS[`${paymentMethod}_${currency.toLowerCase()}`] ||
    PAYMENT_PROVIDERS["stripe_global"];

  const exchangeRate = convertCurrency(1, currency, targetCurrency);
  const convertedAmount = Math.round(amount * exchangeRate);
  const { fee } = calculatePaymentFees(convertedAmount, provider);
  const netAmount = convertedAmount - fee;

  return {
    id: `intl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    amount,
    currency,
    paymentMethod,
    provider: provider.name,
    status: "pending",
    exchangeRate,
    fees: fee,
    netAmount,
    createdAt: new Date(),
  };
}

/**
 * Get payment compliance for country
 */
export function getPaymentCompliance(country: string): PaymentCompliance {
  const complianceMap: Record<string, PaymentCompliance> = {
    Kenya: {
      country: "Kenya",
      regulations: ["CBK", "CMA", "ICTA"],
      taxRate: 0.16,
      kyc: true,
      aml: true,
      dataResidency: "Kenya",
    },
    Uganda: {
      country: "Uganda",
      regulations: ["BOU", "UCC"],
      taxRate: 0.18,
      kyc: true,
      aml: true,
      dataResidency: "Uganda",
    },
    Tanzania: {
      country: "Tanzania",
      regulations: ["BOT", "TCRA"],
      taxRate: 0.18,
      kyc: true,
      aml: true,
      dataResidency: "Tanzania",
    },
    Ghana: {
      country: "Ghana",
      regulations: ["BOG", "SEC"],
      taxRate: 0.125,
      kyc: true,
      aml: true,
      dataResidency: "Ghana",
    },
    Nigeria: {
      country: "Nigeria",
      regulations: ["CBN", "SEC", "FIRS"],
      taxRate: 0.075,
      kyc: true,
      aml: true,
      dataResidency: "Nigeria",
    },
  };

  return (
    complianceMap[country] || {
      country,
      regulations: [],
      taxRate: 0.15,
      kyc: true,
      aml: true,
      dataResidency: country,
    }
  );
}

/**
 * Get payment analytics
 */
export function getPaymentAnalytics() {
  return {
    totalTransactions: Math.floor(Math.random() * 100000) + 10000,
    totalVolume: Math.floor(Math.random() * 1000000000) + 100000000,
    averageTransactionValue: Math.floor(Math.random() * 50000) + 10000,
    successRate: Math.floor(Math.random() * 5) + 95,
    failureRate: Math.floor(Math.random() * 3) + 1,
    refundRate: Math.floor(Math.random() * 2) + 0.5,
    topProviders: [
      { name: "M-Pesa", volume: 400000000, transactions: 40000 },
      { name: "Stripe", volume: 300000000, transactions: 30000 },
      { name: "Airtel Money", volume: 150000000, transactions: 15000 },
    ],
    topCountries: [
      { country: "Kenya", volume: 500000000, transactions: 50000 },
      { country: "Uganda", volume: 200000000, transactions: 20000 },
      { country: "Tanzania", volume: 150000000, transactions: 15000 },
    ],
  };
}

/**
 * Handle payment webhook
 */
export function handlePaymentWebhook(
  provider: string,
  event: string,
  data: any
): { success: boolean; message: string } {
  // In production, would:
  // 1. Verify webhook signature
  // 2. Update payment status
  // 3. Trigger enrollment/certificate
  // 4. Send confirmation email

  console.log(`Webhook from ${provider}: ${event}`);
  return { success: true, message: "Webhook processed" };
}

/**
 * Reconcile payments
 */
export function reconcilePayments(provider: string, date: Date) {
  return {
    provider,
    date,
    totalTransactions: Math.floor(Math.random() * 1000) + 100,
    totalVolume: Math.floor(Math.random() * 50000000) + 5000000,
    discrepancies: Math.floor(Math.random() * 5),
    status: "reconciled",
    reconciliationTime: "2 hours",
  };
}

/**
 * Get settlement schedule
 */
export function getSettlementSchedule() {
  return {
    nextSettlement: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    pendingAmount: Math.floor(Math.random() * 100000000),
    settlements: [
      {
        date: new Date().toISOString(),
        amount: Math.floor(Math.random() * 50000000),
        provider: "M-Pesa",
        status: "completed",
      },
      {
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        amount: Math.floor(Math.random() * 30000000),
        provider: "Stripe",
        status: "completed",
      },
    ],
  };
}
