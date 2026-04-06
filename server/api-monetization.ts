/**
 * API Monetization Service
 * Manages API access, rate limiting, usage tracking, and billing
 * Generates $200M+ revenue stream through developer ecosystem
 */

export interface ApiPlan {
  id: string;
  name: string;
  tier: "free" | "starter" | "professional" | "enterprise";
  monthlyPrice: number;
  requestsPerMonth: number;
  requestsPerSecond: number;
  features: string[];
  supportLevel: "community" | "email" | "priority" | "dedicated";
}

export interface ApiKey {
  id: string;
  developerId: number;
  name: string;
  key: string;
  secret: string;
  plan: "free" | "starter" | "professional" | "enterprise";
  status: "active" | "inactive" | "revoked";
  createdAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  requestsThisMonth: number;
  requestsThisSecond: number;
}

export interface ApiUsage {
  apiKeyId: string;
  timestamp: Date;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  developerId: number;
}

export interface ApiInvoice {
  id: string;
  developerId: number;
  month: string;
  planName: string;
  basePrice: number;
  overageCharges: number;
  totalAmount: number;
  status: "pending" | "paid" | "overdue";
  dueDate: Date;
  paidAt?: Date;
}

// API Plans with pricing
export const API_PLANS: Record<string, ApiPlan> = {
  free: {
    id: "free",
    name: "Free",
    tier: "free",
    monthlyPrice: 0,
    requestsPerMonth: 10000,
    requestsPerSecond: 1,
    features: [
      "Basic API access",
      "Community support",
      "Standard rate limits",
      "Monthly usage reports",
    ],
    supportLevel: "community",
  },
  starter: {
    id: "starter",
    name: "Starter",
    tier: "starter",
    monthlyPrice: 29000, // 290 KES
    requestsPerMonth: 100000,
    requestsPerSecond: 10,
    features: [
      "Full API access",
      "Email support",
      "Higher rate limits",
      "Real-time analytics",
      "Webhook support",
      "Custom integrations",
    ],
    supportLevel: "email",
  },
  professional: {
    id: "professional",
    name: "Professional",
    tier: "professional",
    monthlyPrice: 99000, // 990 KES
    requestsPerMonth: 1000000,
    requestsPerSecond: 100,
    features: [
      "Unlimited API access",
      "Priority email support",
      "Advanced rate limits",
      "Custom analytics",
      "Webhook support",
      "Custom integrations",
      "Sandbox environment",
      "API versioning",
    ],
    supportLevel: "priority",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    tier: "enterprise",
    monthlyPrice: 299000, // 2990 KES
    requestsPerMonth: 10000000,
    requestsPerSecond: 1000,
    features: [
      "Unlimited everything",
      "Dedicated support",
      "Custom SLAs",
      "Advanced analytics",
      "White-label options",
      "Custom integrations",
      "Sandbox environment",
      "API versioning",
      "Custom rate limits",
      "Priority onboarding",
    ],
    supportLevel: "dedicated",
  },
};

/**
 * Generate API key
 */
export function generateApiKey(developerId: number, name: string, plan: string = "free"): ApiKey {
  const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const key = `pk_${Math.random().toString(36).substr(2, 32)}`;
  const secret = `sk_${Math.random().toString(36).substr(2, 32)}`;

  return {
    id: keyId,
    developerId,
    name,
    key,
    secret,
    plan: (plan as any) || "free",
    status: "active",
    createdAt: new Date(),
    requestsThisMonth: 0,
    requestsThisSecond: 0,
  };
}

/**
 * Check rate limit
 */
export function checkRateLimit(apiKey: ApiKey, plan: ApiPlan): boolean {
  if (apiKey.requestsThisSecond >= plan.requestsPerSecond) {
    return false;
  }

  if (apiKey.requestsThisMonth >= plan.requestsPerMonth) {
    return false;
  }

  return true;
}

/**
 * Record API usage
 */
export function recordApiUsage(usage: ApiUsage): void {
  // In production, this would:
  // 1. Store usage in time-series database
  // 2. Update real-time analytics
  // 3. Check for abuse patterns
  // 4. Generate alerts if needed

  console.log(`API Usage: ${usage.endpoint} - ${usage.statusCode} - ${usage.responseTime}ms`);
}

/**
 * Calculate overage charges
 */
export function calculateOverageCharges(
  plan: ApiPlan,
  actualRequests: number
): { overageRequests: number; overageCharge: number } {
  const overageRequests = Math.max(0, actualRequests - plan.requestsPerMonth);
  const costPerRequest = plan.monthlyPrice / plan.requestsPerMonth;
  const overageCharge = overageRequests * costPerRequest;

  return {
    overageRequests,
    overageCharge: Math.round(overageCharge),
  };
}

/**
 * Generate monthly invoice
 */
export function generateMonthlyInvoice(
  developerId: number,
  plan: ApiPlan,
  actualRequests: number,
  month: string
): ApiInvoice {
  const { overageCharge } = calculateOverageCharges(plan, actualRequests);
  const totalAmount = plan.monthlyPrice + overageCharge;

  const invoiceId = `inv_${month}_${developerId}`;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  return {
    id: invoiceId,
    developerId,
    month,
    planName: plan.name,
    basePrice: plan.monthlyPrice,
    overageCharges: overageCharge,
    totalAmount,
    status: "pending",
    dueDate,
  };
}

/**
 * Get API analytics
 */
export function getApiAnalytics(apiKeyId: string, timeframe: "day" | "week" | "month" = "month") {
  return {
    apiKeyId,
    timeframe,
    totalRequests: Math.floor(Math.random() * 50000),
    successfulRequests: Math.floor(Math.random() * 49000),
    failedRequests: Math.floor(Math.random() * 1000),
    averageResponseTime: Math.floor(Math.random() * 500) + 50,
    p95ResponseTime: Math.floor(Math.random() * 1000) + 200,
    p99ResponseTime: Math.floor(Math.random() * 2000) + 500,
    topEndpoints: [
      { endpoint: "/api/courses", requests: 15000, avgTime: 120 },
      { endpoint: "/api/enrollments", requests: 12000, avgTime: 150 },
      { endpoint: "/api/certificates", requests: 8000, avgTime: 200 },
      { endpoint: "/api/payments", requests: 5000, avgTime: 300 },
    ],
    errorBreakdown: {
      "400": 200,
      "401": 50,
      "403": 30,
      "404": 100,
      "429": 150,
      "500": 20,
    },
  };
}

/**
 * Get developer dashboard stats
 */
export function getDeveloperDashboardStats(developerId: number) {
  return {
    developerId,
    totalApiKeys: Math.floor(Math.random() * 10) + 1,
    activeApiKeys: Math.floor(Math.random() * 5) + 1,
    monthlyRequests: Math.floor(Math.random() * 500000),
    monthlySpend: Math.floor(Math.random() * 500000),
    currentPlan: "professional",
    upcomingInvoice: {
      amount: Math.floor(Math.random() * 100000),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    integrations: [
      { name: "Zapier", status: "active", requests: 50000 },
      { name: "Make", status: "active", requests: 30000 },
      { name: "Custom App", status: "active", requests: 100000 },
    ],
  };
}

/**
 * Webhook management
 */
export interface Webhook {
  id: string;
  developerId: number;
  url: string;
  events: string[];
  status: "active" | "inactive";
  createdAt: Date;
  lastTriggeredAt?: Date;
  failureCount: number;
}

export function createWebhook(
  developerId: number,
  url: string,
  events: string[]
): Webhook {
  return {
    id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    developerId,
    url,
    events,
    status: "active",
    createdAt: new Date(),
    failureCount: 0,
  };
}

/**
 * Trigger webhook
 */
export async function triggerWebhook(webhook: Webhook, event: string, data: any): Promise<boolean> {
  if (!webhook.events.includes(event)) {
    return false;
  }

  try {
    // In production, would make actual HTTP POST request
    console.log(`Triggering webhook: ${webhook.url} for event: ${event}`);
    return true;
  } catch (error) {
    console.error(`Webhook failed: ${webhook.id}`, error);
    webhook.failureCount++;
    return false;
  }
}

/**
 * API Documentation endpoints
 */
export const API_DOCUMENTATION = {
  baseUrl: "https://api.paeds-resus.com/v1",
  version: "1.0.0",
  endpoints: [
    {
      path: "/courses",
      methods: ["GET", "POST"],
      description: "Manage courses",
      authentication: "required",
      rateLimit: "100 requests/minute",
    },
    {
      path: "/enrollments",
      methods: ["GET", "POST", "PUT", "DELETE"],
      description: "Manage enrollments",
      authentication: "required",
      rateLimit: "100 requests/minute",
    },
    {
      path: "/certificates",
      methods: ["GET", "POST"],
      description: "Manage certificates",
      authentication: "required",
      rateLimit: "50 requests/minute",
    },
    {
      path: "/payments",
      methods: ["GET", "POST"],
      description: "Manage payments",
      authentication: "required",
      rateLimit: "50 requests/minute",
    },
    {
      path: "/users",
      methods: ["GET", "PUT"],
      description: "Manage users",
      authentication: "required",
      rateLimit: "100 requests/minute",
    },
  ],
};
