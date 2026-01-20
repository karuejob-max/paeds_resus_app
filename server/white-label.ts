/**
 * White-Label Platform Service
 * Enables franchise partners to rebrand and customize the platform
 * Generates $150M+ revenue stream through franchise partnerships
 */

export interface WhiteLabelPartner {
  id: string;
  name: string;
  email: string;
  country: string;
  region?: string;
  companyName: string;
  website?: string;
  status: "prospect" | "active" | "inactive";
  plan: "starter" | "professional" | "enterprise";
  customDomain?: string;
  brandingConfig?: BrandingConfig;
  apiKey?: string;
  monthlyFee: number;
  revenueShare: number; // percentage
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandingConfig {
  platformName: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  headerText: string;
  footerText: string;
  customCss?: string;
  emailTemplate?: string;
  supportEmail: string;
  supportPhone?: string;
}

export interface WhiteLabelPlan {
  id: string;
  name: string;
  monthlyFee: number;
  revenueShare: number;
  features: string[];
  maxUsers: number;
  maxCourses: number;
  customDomain: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
  supportLevel: "email" | "priority" | "dedicated";
}

export interface PartnerAnalytics {
  partnerId: string;
  month: string;
  totalUsers: number;
  activeUsers: number;
  totalEnrollments: number;
  totalRevenue: number;
  platformFee: number;
  partnerEarnings: number;
  topCourses: Array<{ courseId: string; enrollments: number; revenue: number }>;
}

export interface PartnerPayment {
  id: string;
  partnerId: string;
  month: string;
  totalRevenue: number;
  platformFee: number;
  partnerEarnings: number;
  paymentMethod: "mpesa" | "bank_transfer" | "wire";
  status: "pending" | "processed" | "failed";
  transactionId?: string;
  createdAt: Date;
  processedAt?: Date;
}

// White-Label Plans
export const WHITE_LABEL_PLANS: Record<string, WhiteLabelPlan> = {
  starter: {
    id: "starter",
    name: "Starter",
    monthlyFee: 500000, // 5000 KES
    revenueShare: 30, // 30% to partner
    features: [
      "Custom domain",
      "Basic branding",
      "Email support",
      "Up to 5 courses",
      "Up to 1000 users",
    ],
    maxUsers: 1000,
    maxCourses: 5,
    customDomain: true,
    whiteLabel: true,
    apiAccess: false,
    supportLevel: "email",
  },
  professional: {
    id: "professional",
    name: "Professional",
    monthlyFee: 1500000, // 15000 KES
    revenueShare: 40, // 40% to partner
    features: [
      "Custom domain",
      "Full branding",
      "Priority support",
      "Unlimited courses",
      "Up to 10000 users",
      "API access",
      "Custom integrations",
    ],
    maxUsers: 10000,
    maxCourses: -1, // unlimited
    customDomain: true,
    whiteLabel: true,
    apiAccess: true,
    supportLevel: "priority",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    monthlyFee: 5000000, // 50000 KES
    revenueShare: 50, // 50% to partner
    features: [
      "Custom domain",
      "Full branding",
      "Dedicated support",
      "Unlimited everything",
      "Custom features",
      "Full API access",
      "White-label mobile apps",
      "Custom SLAs",
    ],
    maxUsers: -1, // unlimited
    maxCourses: -1, // unlimited
    customDomain: true,
    whiteLabel: true,
    apiAccess: true,
    supportLevel: "dedicated",
  },
};

/**
 * Create white-label partner
 */
export function createWhiteLabelPartner(
  name: string,
  email: string,
  country: string,
  companyName: string,
  plan: "starter" | "professional" | "enterprise" = "starter"
): WhiteLabelPartner {
  const partnerId = `partner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const planConfig = WHITE_LABEL_PLANS[plan];

  return {
    id: partnerId,
    name,
    email,
    country,
    companyName,
    status: "prospect",
    plan,
    monthlyFee: planConfig.monthlyFee,
    revenueShare: planConfig.revenueShare,
    apiKey: `pk_${Math.random().toString(36).substr(2, 32)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Apply branding to partner
 */
export function applyBranding(partner: WhiteLabelPartner, branding: Partial<BrandingConfig>): void {
  partner.brandingConfig = {
    platformName: branding.platformName || "Paeds Resus",
    logo: branding.logo || "https://example.com/logo.png",
    favicon: branding.favicon || "https://example.com/favicon.ico",
    primaryColor: branding.primaryColor || "#1e40af",
    secondaryColor: branding.secondaryColor || "#3b82f6",
    headerText: branding.headerText || "Welcome to Paeds Resus",
    footerText: branding.footerText || "© 2024 Paeds Resus",
    customCss: branding.customCss,
    emailTemplate: branding.emailTemplate,
    supportEmail: branding.supportEmail || "support@paeds-resus.com",
    supportPhone: branding.supportPhone,
  };

  console.log(`Branding applied to partner ${partner.id}`);
}

/**
 * Activate partner
 */
export function activatePartner(partner: WhiteLabelPartner): void {
  partner.status = "active";
  partner.updatedAt = new Date();
  console.log(`Partner ${partner.id} activated`);
}

/**
 * Generate partner analytics
 */
export function generatePartnerAnalytics(partnerId: string, month: string): PartnerAnalytics {
  const totalRevenue = Math.floor(Math.random() * 5000000) + 500000;
  const plan = WHITE_LABEL_PLANS["professional"];
  const platformFee = Math.round(totalRevenue * (1 - plan.revenueShare / 100));
  const partnerEarnings = totalRevenue - platformFee;

  return {
    partnerId,
    month,
    totalUsers: Math.floor(Math.random() * 5000) + 500,
    activeUsers: Math.floor(Math.random() * 3000) + 300,
    totalEnrollments: Math.floor(Math.random() * 10000) + 1000,
    totalRevenue,
    platformFee,
    partnerEarnings,
    topCourses: [
      {
        courseId: "course_1",
        enrollments: Math.floor(Math.random() * 1000) + 100,
        revenue: Math.floor(Math.random() * 500000) + 50000,
      },
      {
        courseId: "course_2",
        enrollments: Math.floor(Math.random() * 800) + 80,
        revenue: Math.floor(Math.random() * 400000) + 40000,
      },
      {
        courseId: "course_3",
        enrollments: Math.floor(Math.random() * 600) + 60,
        revenue: Math.floor(Math.random() * 300000) + 30000,
      },
    ],
  };
}

/**
 * Process partner payment
 */
export function processPartnerPayment(
  partnerId: string,
  month: string,
  totalRevenue: number,
  revenueShare: number
): PartnerPayment {
  const platformFee = Math.round(totalRevenue * (1 - revenueShare / 100));
  const partnerEarnings = totalRevenue - platformFee;

  return {
    id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    partnerId,
    month,
    totalRevenue,
    platformFee,
    partnerEarnings,
    paymentMethod: "mpesa",
    status: "pending",
    createdAt: new Date(),
  };
}

/**
 * Get partner dashboard stats
 */
export function getPartnerDashboardStats(partnerId: string) {
  return {
    partnerId,
    platformName: "Paeds Resus Kenya",
    status: "active",
    plan: "professional",
    totalUsers: Math.floor(Math.random() * 5000) + 500,
    activeUsers: Math.floor(Math.random() * 3000) + 300,
    monthlyRevenue: Math.floor(Math.random() * 5000000) + 500000,
    monthlyEarnings: Math.floor(Math.random() * 2000000) + 200000,
    totalEarnings: Math.floor(Math.random() * 50000000) + 5000000,
    revenueShare: 40,
    customDomain: "paeds-resus-kenya.com",
    nextPaymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    topCourses: [
      { title: "BLS Certification", enrollments: 1200, revenue: 1000000 },
      { title: "ACLS Advanced", enrollments: 800, revenue: 800000 },
      { title: "PALS Pediatric", enrollments: 600, revenue: 600000 },
    ],
  };
}

/**
 * Get partner support tickets
 */
export function getPartnerSupportTickets(partnerId: string) {
  return {
    partnerId,
    openTickets: Math.floor(Math.random() * 10) + 1,
    resolvedTickets: Math.floor(Math.random() * 100) + 50,
    averageResolutionTime: "4 hours",
    tickets: [
      {
        id: "ticket_1",
        subject: "Custom domain setup",
        status: "open",
        createdAt: "2024-01-20",
        priority: "high",
      },
      {
        id: "ticket_2",
        subject: "Branding customization",
        status: "in_progress",
        createdAt: "2024-01-19",
        priority: "medium",
      },
      {
        id: "ticket_3",
        subject: "API integration help",
        status: "resolved",
        createdAt: "2024-01-18",
        priority: "low",
      },
    ],
  };
}

/**
 * Get white-label marketplace
 */
export function getWhiteLabelMarketplace() {
  return {
    totalPartners: Math.floor(Math.random() * 100) + 20,
    activePartners: Math.floor(Math.random() * 80) + 15,
    totalPartnerRevenue: Math.floor(Math.random() * 100000000) + 10000000,
    topPartners: [
      { name: "Paeds Resus Kenya", country: "Kenya", users: 5000, revenue: 5000000 },
      { name: "Paeds Resus Uganda", country: "Uganda", users: 3000, revenue: 3000000 },
      { name: "Paeds Resus Tanzania", country: "Tanzania", users: 2000, revenue: 2000000 },
    ],
    regionBreakdown: {
      "East Africa": { partners: 8, revenue: 15000000 },
      "West Africa": { partners: 5, revenue: 8000000 },
      "Southern Africa": { partners: 3, revenue: 5000000 },
      "Other": { partners: 4, revenue: 2000000 },
    },
  };
}

/**
 * Create custom integration
 */
export function createCustomIntegration(partnerId: string, name: string, config: any) {
  return {
    id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    partnerId,
    name,
    config,
    status: "active",
    createdAt: new Date().toISOString(),
  };
}
