/** Static planning fixtures when DATABASE_URL is unset (unit tests, local CI). */

export function kaizenDailyMetricsFallback() {
  const today = new Date();
  return {
    date: today.toISOString().split("T")[0],
    metrics: {
      registrations: { current: 0, target: 100, status: "below_target" as const },
      enrollments: { current: 0, target: 150, status: "below_target" as const },
      revenue: { current: 0, target: 5000, status: "below_target" as const },
      certificates: { current: 0, target: 50, status: "below_target" as const },
    },
    timestamp: today,
  };
}

export function kaizenWeeklyMetricsFallback() {
  return {
    week: "Current week",
    metrics: {
      weeklyRegistrations: 0,
      weeklyEnrollments: 0,
      weeklyRevenue: 0,
      totalUsers: 0,
      totalEnrollments: 0,
    },
    trends: { registrationTrend: "stable", revenueTrend: "stable" },
    timestamp: new Date(),
  };
}

export function kaizenMonthlyMetricsFallback() {
  return {
    month: "Current month",
    metrics: {
      monthlyRegistrations: 0,
      monthlyEnrollments: 0,
      monthlyRevenue: 0,
      averageDailyRegistrations: 0,
      averageDailyRevenue: 0,
    },
    improvements: [
      {
        area: "Registration Optimization",
        currentRate: 0,
        targetRate: 100,
        gap: 100,
        recommendation: "Simplify form",
        expectedImpact: "15-20% improvement",
      },
    ],
    timestamp: new Date(),
  };
}

export function kaizenQuarterlyMetricsFallback() {
  const today = new Date();
  const quarter = Math.floor(today.getMonth() / 3) + 1;
  return {
    quarter: `Q${quarter} ${today.getFullYear()}`,
    metrics: {
      quarterlyRegistrations: 0,
      quarterlyEnrollments: 0,
      quarterlyRevenue: 0,
      averageMonthlyRegistrations: 0,
      averageMonthlyRevenue: 0,
    },
    goals: {
      facilities: { target: 50, current: 25, progress: 50 },
      workers: { target: 10000, current: 5000, progress: 50 },
      livesSaved: { target: 500, current: 250, progress: 50 },
      revenue: { target: 500000, current: 0, progress: 0 },
    },
    timestamp: today,
  };
}

export function kaizenAnnualMetricsFallback() {
  const year = new Date().getFullYear();
  return {
    year,
    annualGoals: {
      facilities: 100,
      workers: 20000,
      livesSaved: 2000,
      revenue: 2000000,
    },
    progress: { overall: 50 },
    timestamp: new Date(),
  };
}

export function kaizenDashboardFallback() {
  return {
    dashboard: "Kaizen Continuous Improvement",
    philosophy: "Every day is better than yesterday. Never satisfied. Always improving.",
    currentCycle: "Daily Optimization (24/7)",
    keyMetrics: {
      weeklyRegistrations: 0,
      weeklyRevenue: 0,
      improvementsImplemented: 12,
      improvementsInProgress: 5,
      improvementsPlanned: 8,
    },
    topOpportunities: [
      { area: "Referral Acceleration", impact: "+25-30% growth", priority: "critical" },
      { area: "Revenue Optimization", impact: "+40-50% revenue", priority: "critical" },
      { area: "Registration Optimization", impact: "+20-30% registrations", priority: "high" },
    ],
    nextReview: "Monday (Weekly Kaizen Review)",
    commitment: "Aluta Continua - The struggle continues. The improvement continues.",
    timestamp: new Date(),
  };
}
