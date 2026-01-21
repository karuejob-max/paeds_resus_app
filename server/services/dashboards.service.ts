import { getDb } from "../db";
import { eq, desc } from "drizzle-orm";
import { users, enrollments, payments, certificates, supportTickets } from "../../drizzle/schema";

/**
 * Executive Dashboards Service
 * Provides comprehensive KPI tracking and business intelligence
 */

export interface ExecutiveDashboard {
  timestamp: string;
  kpis: {
    totalUsers: number;
    totalEnrollments: number;
    totalRevenue: number;
    activeUsers: number;
    conversionRate: number;
    customerRetention: number;
    npsScore: number;
  };
  trends: {
    enrollmentTrend: Array<{ date: string; count: number }>;
    revenueTrend: Array<{ date: string; amount: number }>;
    userGrowth: Array<{ date: string; count: number }>;
  };
  topPerformers: {
    topCourses: Array<{ course: string; enrollments: number; revenue: number }>;
    topRegions: Array<{ region: string; users: number; revenue: number }>;
    topReferrers: Array<{ referrer: string; referrals: number; revenue: number }>;
  };
  alerts: Array<{ severity: string; message: string }>;
}

export interface AnalyticsMetrics {
  userMetrics: {
    totalUsers: number;
    newUsersThisMonth: number;
    activeUsersThisMonth: number;
    churnRate: number;
    ltv: number;
  };
  enrollmentMetrics: {
    totalEnrollments: number;
    enrollmentsThisMonth: number;
    completionRate: number;
    averageTimeToCompletion: number;
  };
  revenueMetrics: {
    totalRevenue: number;
    revenueThisMonth: number;
    averageOrderValue: number;
    monthlyRecurringRevenue: number;
  };
  engagementMetrics: {
    averageSessionDuration: number;
    pageViewsPerUser: number;
    bounceRate: number;
    conversionFunnel: Array<{ stage: string; users: number; conversionRate: number }>;
  };
}

export interface CohortAnalysis {
  cohortName: string;
  cohortSize: number;
  retentionByWeek: Array<{ week: number; retentionRate: number }>;
  ltv: number;
  engagementScore: number;
}

/**
 * Get executive dashboard data
 */
export async function getExecutiveDashboard(): Promise<ExecutiveDashboard> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get KPI data
    const totalUsers = await db.select().from(users);
    const totalEnrollments = await db.select().from(enrollments);
    const totalPayments = await db.select().from(payments).where(eq(payments.status, "completed"));
    const totalRevenue = totalPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    // Calculate active users (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = totalUsers.filter((u: any) => new Date(u.lastSignedIn) > thirtyDaysAgo).length;

    // Calculate conversion rate
    const conversionRate = totalUsers.length > 0 ? Math.round((totalEnrollments.length / totalUsers.length) * 100) : 0;

    // Calculate retention (mock - in production would track cohorts)
    const customerRetention = 85; // placeholder

    // Calculate NPS (mock)
    const npsScore = 72; // placeholder

    // Generate trends (mock data)
    const enrollmentTrend = generateTrend("enrollments", 30);
    const revenueTrend = generateTrendRevenue("revenue", 30);
    const userGrowth = generateTrend("users", 30);

    // Get top performers
    const topCourses = await getTopCourses();
    const topRegions = await getTopRegions();
    const topReferrers = await getTopReferrers();

    // Generate alerts
    const alerts = generateAlerts(conversionRate, customerRetention, npsScore);

    return {
      timestamp: new Date().toISOString(),
      kpis: {
        totalUsers: totalUsers.length,
        totalEnrollments: totalEnrollments.length,
        totalRevenue: Math.round(totalRevenue / 100), // Convert from cents to KES
        activeUsers,
        conversionRate,
        customerRetention,
        npsScore
      },
      trends: {
        enrollmentTrend,
        revenueTrend,
        userGrowth
      },
      topPerformers: {
        topCourses,
        topRegions,
        topReferrers
      },
      alerts
    };
  } catch (error) {
    console.error("[Dashboards Service] Error getting executive dashboard:", error);
    throw error;
  }
}

/**
 * Get detailed analytics metrics
 */
export async function getAnalyticsMetrics(): Promise<AnalyticsMetrics> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // User metrics
    const allUsers = await db.select().from(users);
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newUsersThisMonth = allUsers.filter((u: any) => new Date(u.createdAt) >= thisMonth).length;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsersThisMonth = allUsers.filter((u: any) => new Date(u.lastSignedIn) > thirtyDaysAgo).length;
    const churnRate = Math.round(((allUsers.length - activeUsersThisMonth) / allUsers.length) * 100);
    const ltv = 5000; // Mock LTV in KES

    // Enrollment metrics
    const allEnrollments = await db.select().from(enrollments);
    const enrollmentsThisMonth = allEnrollments.filter((e: any) => new Date(e.createdAt) >= thisMonth).length;
    const completedEnrollments = allEnrollments.filter((e: any) => e.paymentStatus === "completed").length;
    const completionRate = allEnrollments.length > 0 ? Math.round((completedEnrollments / allEnrollments.length) * 100) : 0;
    const averageTimeToCompletion = 14; // Mock days

    // Revenue metrics
    const allPayments = await db.select().from(payments);
    const completedPayments = allPayments.filter((p: any) => p.status === "completed");
    const totalRevenue = completedPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const revenueThisMonth = completedPayments
      .filter((p: any) => new Date(p.createdAt) >= thisMonth)
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const averageOrderValue = completedPayments.length > 0 ? Math.round(totalRevenue / completedPayments.length) : 0;
    const monthlyRecurringRevenue = Math.round(revenueThisMonth / 100); // Convert from cents

    // Engagement metrics (mock)
    const averageSessionDuration = 1200; // seconds
    const pageViewsPerUser = 8;
    const bounceRate = 35; // percent
    const conversionFunnel = [
      { stage: "Landing Page", users: 1000, conversionRate: 100 },
      { stage: "Course Selection", users: 750, conversionRate: 75 },
      { stage: "Enrollment", users: 450, conversionRate: 60 },
      { stage: "Payment", users: 300, conversionRate: 67 },
      { stage: "Completion", users: 180, conversionRate: 60 }
    ];

    return {
      userMetrics: {
        totalUsers: allUsers.length,
        newUsersThisMonth,
        activeUsersThisMonth,
        churnRate,
        ltv
      },
      enrollmentMetrics: {
        totalEnrollments: allEnrollments.length,
        enrollmentsThisMonth,
        completionRate,
        averageTimeToCompletion
      },
      revenueMetrics: {
        totalRevenue: Math.round(totalRevenue / 100),
        revenueThisMonth: monthlyRecurringRevenue,
        averageOrderValue: Math.round(averageOrderValue / 100),
        monthlyRecurringRevenue
      },
      engagementMetrics: {
        averageSessionDuration,
        pageViewsPerUser,
        bounceRate,
        conversionFunnel
      }
    };
  } catch (error) {
    console.error("[Dashboards Service] Error getting analytics metrics:", error);
    throw error;
  }
}

/**
 * Get cohort analysis
 */
export async function getCohortAnalysis(cohortName: string): Promise<CohortAnalysis> {
  try {
    // Mock cohort analysis
    return {
      cohortName,
      cohortSize: 150,
      retentionByWeek: [
        { week: 0, retentionRate: 100 },
        { week: 1, retentionRate: 85 },
        { week: 2, retentionRate: 72 },
        { week: 3, retentionRate: 65 },
        { week: 4, retentionRate: 58 }
      ],
      ltv: 4500,
      engagementScore: 7.8
    };
  } catch (error) {
    console.error("[Dashboards Service] Error getting cohort analysis:", error);
    throw error;
  }
}

/**
 * Get top courses
 */
async function getTopCourses(): Promise<Array<{ course: string; enrollments: number; revenue: number }>> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const enrollmentRecords = await db.select().from(enrollments);
    
    const courseStats: Record<string, { enrollments: number; revenue: number }> = {};
    enrollmentRecords.forEach((e: any) => {
      if (!courseStats[e.programType]) {
        courseStats[e.programType] = { enrollments: 0, revenue: 0 };
      }
      courseStats[e.programType].enrollments++;
      courseStats[e.programType].revenue += e.amountPaid || 0;
    });

    return Object.entries(courseStats)
      .map(([course, stats]) => ({
        course: course.toUpperCase(),
        enrollments: stats.enrollments,
        revenue: Math.round(stats.revenue / 100)
      }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5);
  } catch (error) {
    console.error("[Dashboards Service] Error getting top courses:", error);
    return [];
  }
}

/**
 * Get top regions (mock)
 */
async function getTopRegions(): Promise<Array<{ region: string; users: number; revenue: number }>> {
  return [
    { region: "Nairobi", users: 450, revenue: 2250000 },
    { region: "Mombasa", users: 280, revenue: 1400000 },
    { region: "Kisumu", users: 190, revenue: 950000 },
    { region: "Nakuru", users: 160, revenue: 800000 },
    { region: "Other", users: 220, revenue: 1100000 }
  ];
}

/**
 * Get top referrers (mock)
 */
async function getTopReferrers(): Promise<Array<{ referrer: string; referrals: number; revenue: number }>> {
  return [
    { referrer: "Dr. Sarah Kipchoge", referrals: 45, revenue: 450000 },
    { referrer: "Nairobi Hospital", referrals: 38, revenue: 380000 },
    { referrer: "Kenya Red Cross", referrals: 32, revenue: 320000 },
    { referrer: "Dr. James Mwangi", referrals: 28, revenue: 280000 },
    { referrer: "Aga Khan Hospital", referrals: 25, revenue: 250000 }
  ];
}

/**
 * Generate trend data for revenue
 */
function generateTrendRevenue(type: string, days: number): Array<{ date: string; amount: number }> {
  const trend: Array<{ date: string; amount: number }> = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const amount = Math.floor(Math.random() * 500000) + 100000;
    trend.push({ date: dateStr, amount });
  }
  return trend;
}

/**
 * Generate trend data
 */
function generateTrend(type: string, days: number): Array<{ date: string; count: number }> {
  const trend: Array<{ date: string; count: number }> = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    let count = 0;
    if (type === "enrollments") {
      count = Math.floor(Math.random() * 20) + 5;
    } else if (type === "revenue") {
      count = Math.floor(Math.random() * 500000) + 100000;
    } else if (type === "users") {
      count = Math.floor(Math.random() * 50) + 10;
    }
    
    trend.push({ date: dateStr, count });
  }
  return trend;
}

/**
 * Generate alerts based on metrics
 */
function generateAlerts(conversionRate: number, retention: number, nps: number): Array<{ severity: string; message: string }> {
  const alerts: Array<{ severity: string; message: string }> = [];

  if (conversionRate < 5) {
    alerts.push({
      severity: "high",
      message: `Conversion rate is low at ${conversionRate}%. Consider optimizing the enrollment flow.`
    });
  }

  if (retention < 70) {
    alerts.push({
      severity: "high",
      message: `Customer retention is ${retention}%. Implement retention strategies.`
    });
  }

  if (nps < 30) {
    alerts.push({
      severity: "medium",
      message: `NPS score is ${nps}. Focus on improving customer satisfaction.`
    });
  }

  if (nps > 70) {
    alerts.push({
      severity: "info",
      message: `Excellent NPS score of ${nps}. Leverage satisfied customers for referrals.`
    });
  }

  return alerts;
}
