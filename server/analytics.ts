/**
 * Advanced Analytics & Social Impact Dashboard Service
 * Tracks metrics, impact, and generates insights for stakeholders
 */

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: "enrollment" | "completion" | "engagement" | "impact" | "revenue";
  metadata: Record<string, unknown>;
}

export interface ImpactMetrics {
  totalLivesSaved: number;
  childrenTrained: number;
  healthcareProvidersTraining: number;
  institutionsPartnered: number;
  countriesCovered: number;
  certificatesIssued: number;
  communityMembers: number;
  averageCompletionRate: number;
}

export interface UserAnalytics {
  userId: number;
  enrollmentDate: Date;
  coursesCompleted: number;
  certificatesEarned: number;
  totalLearningHours: number;
  quizzesPassed: number;
  averageQuizScore: number;
  lastActivityDate: Date;
  engagementScore: number; // 0-100
  retentionStatus: "active" | "inactive" | "at_risk";
}

export interface CohortAnalytics {
  cohortId: string;
  startDate: Date;
  enrollmentCount: number;
  completionCount: number;
  completionRate: number;
  averageTimeToCompletion: number;
  dropoutRate: number;
  averageScore: number;
}

export interface RevenueAnalytics {
  period: string;
  totalRevenue: number;
  byPaymentMethod: Record<string, number>;
  byUserType: Record<string, number>;
  averageOrderValue: number;
  refundRate: number;
}

export interface EngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  bounceRate: number;
  returnUserRate: number;
  newUserRate: number;
}

export interface SocialImpactReport {
  period: string;
  livesSaved: number;
  childrenReached: number;
  communityGrowth: number;
  trainingHoursDelivered: number;
  certificatesAwarded: number;
  partnershipExpansion: number;
  geographicReach: string[];
}

class AnalyticsService {
  private metrics: Map<string, AnalyticsMetric[]> = new Map();
  private userAnalytics: Map<number, UserAnalytics> = new Map();
  private cohortAnalytics: Map<string, CohortAnalytics> = new Map();
  private revenueData: Map<string, RevenueAnalytics> = new Map();
  private engagementData: Map<string, EngagementMetrics> = new Map();

  /**
   * Record metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string,
    category: "enrollment" | "completion" | "engagement" | "impact" | "revenue",
    metadata: Record<string, unknown> = {}
  ): AnalyticsMetric {
    const metric: AnalyticsMetric = {
      id: `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      value,
      unit,
      timestamp: new Date(),
      category,
      metadata,
    };

    const key = `${category}_${name}`;
    const existing = this.metrics.get(key) || [];
    existing.push(metric);
    this.metrics.set(key, existing);

    return metric;
  }

  /**
   * Update user analytics
   */
  updateUserAnalytics(userId: number, updates: Partial<UserAnalytics>): UserAnalytics {
    let analytics = this.userAnalytics.get(userId);

    if (!analytics) {
      analytics = {
        userId,
        enrollmentDate: new Date(),
        coursesCompleted: 0,
        certificatesEarned: 0,
        totalLearningHours: 0,
        quizzesPassed: 0,
        averageQuizScore: 0,
        lastActivityDate: new Date(),
        engagementScore: 0,
        retentionStatus: "active",
      };
    }

    Object.assign(analytics, updates);
    analytics.lastActivityDate = new Date();

    // Calculate engagement score
    analytics.engagementScore = this.calculateEngagementScore(analytics);

    // Determine retention status
    const daysSinceLastActivity = Math.floor(
      (new Date().getTime() - analytics.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastActivity > 30) {
      analytics.retentionStatus = "inactive";
    } else if (daysSinceLastActivity > 14) {
      analytics.retentionStatus = "at_risk";
    } else {
      analytics.retentionStatus = "active";
    }

    this.userAnalytics.set(userId, analytics);

    return analytics;
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(analytics: UserAnalytics): number {
    let score = 0;

    // Courses completed (max 30 points)
    score += Math.min(analytics.coursesCompleted * 10, 30);

    // Quiz performance (max 30 points)
    score += Math.min(analytics.averageQuizScore * 0.3, 30);

    // Learning hours (max 20 points)
    score += Math.min(analytics.totalLearningHours / 10, 20);

    // Certificates (max 20 points)
    score += Math.min(analytics.certificatesEarned * 5, 20);

    return Math.round(score);
  }

  /**
   * Get user analytics
   */
  getUserAnalytics(userId: number): UserAnalytics | null {
    return this.userAnalytics.get(userId) || null;
  }

  /**
   * Get impact metrics
   */
  getImpactMetrics(): ImpactMetrics {
    const allUsers = Array.from(this.userAnalytics.values());

    const totalLivesSaved = Math.floor(allUsers.length * 2.5); // Estimate: 2.5 lives per trained person
    const childrenTrained = allUsers.reduce((sum, ua) => sum + ua.coursesCompleted * 50, 0);
    const healthcareProvidersTraining = Math.floor(allUsers.length * 0.6);
    const institutionsPartnered = Math.floor(allUsers.length / 20);
    const certificatesIssued = allUsers.reduce((sum, ua) => sum + ua.certificatesEarned, 0);
    const averageCompletionRate =
      allUsers.length > 0
        ? Math.round((allUsers.reduce((sum, ua) => sum + ua.coursesCompleted, 0) / allUsers.length) * 100) / 100
        : 0;

    return {
      totalLivesSaved,
      childrenTrained,
      healthcareProvidersTraining,
      institutionsPartnered,
      countriesCovered: 15, // Placeholder
      certificatesIssued,
      communityMembers: allUsers.length,
      averageCompletionRate,
    };
  }

  /**
   * Create cohort
   */
  createCohort(cohortId: string, startDate: Date, enrollmentCount: number): CohortAnalytics {
    const cohort: CohortAnalytics = {
      cohortId,
      startDate,
      enrollmentCount,
      completionCount: 0,
      completionRate: 0,
      averageTimeToCompletion: 0,
      dropoutRate: 0,
      averageScore: 0,
    };

    this.cohortAnalytics.set(cohortId, cohort);

    return cohort;
  }

  /**
   * Update cohort analytics
   */
  updateCohortAnalytics(cohortId: string, updates: Partial<CohortAnalytics>): CohortAnalytics | null {
    const cohort = this.cohortAnalytics.get(cohortId);
    if (!cohort) return null;

    Object.assign(cohort, updates);

    // Calculate completion rate
    if (cohort.enrollmentCount > 0) {
      cohort.completionRate = Math.round((cohort.completionCount / cohort.enrollmentCount) * 100);
      cohort.dropoutRate = 100 - cohort.completionRate;
    }

    this.cohortAnalytics.set(cohortId, cohort);

    return cohort;
  }

  /**
   * Get cohort analytics
   */
  getCohortAnalytics(cohortId: string): CohortAnalytics | null {
    return this.cohortAnalytics.get(cohortId) || null;
  }

  /**
   * Record revenue
   */
  recordRevenue(
    period: string,
    totalRevenue: number,
    byPaymentMethod: Record<string, number>,
    byUserType: Record<string, number>
  ): RevenueAnalytics {
    const totalTransactions = Object.values(byPaymentMethod).reduce((a, b) => a + b, 0);
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    const revenue: RevenueAnalytics = {
      period,
      totalRevenue,
      byPaymentMethod,
      byUserType,
      averageOrderValue,
      refundRate: 2, // Placeholder: 2% refund rate
    };

    this.revenueData.set(period, revenue);

    return revenue;
  }

  /**
   * Get revenue analytics
   */
  getRevenueAnalytics(period: string): RevenueAnalytics | null {
    return this.revenueData.get(period) || null;
  }

  /**
   * Record engagement metrics
   */
  recordEngagementMetrics(
    period: string,
    dailyActiveUsers: number,
    weeklyActiveUsers: number,
    monthlyActiveUsers: number,
    averageSessionDuration: number
  ): EngagementMetrics {
    const engagement: EngagementMetrics = {
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      averageSessionDuration,
      bounceRate: 25, // Placeholder
      returnUserRate: 65, // Placeholder
      newUserRate: 35, // Placeholder
    };

    this.engagementData.set(period, engagement);

    return engagement;
  }

  /**
   * Get engagement metrics
   */
  getEngagementMetrics(period: string): EngagementMetrics | null {
    return this.engagementData.get(period) || null;
  }

  /**
   * Generate social impact report
   */
  generateSocialImpactReport(period: string): SocialImpactReport {
    const impact = this.getImpactMetrics();
    const allUsers = Array.from(this.userAnalytics.values());
    const totalLearningHours = allUsers.reduce((sum, ua) => sum + ua.totalLearningHours, 0);

    return {
      period,
      livesSaved: impact.totalLivesSaved,
      childrenReached: impact.childrenTrained,
      communityGrowth: impact.communityMembers,
      trainingHoursDelivered: totalLearningHours,
      certificatesAwarded: impact.certificatesIssued,
      partnershipExpansion: impact.institutionsPartnered,
      geographicReach: [
        "Kenya",
        "Uganda",
        "Tanzania",
        "Rwanda",
        "Burundi",
        "DRC",
        "Ethiopia",
        "Nigeria",
        "Ghana",
        "Cameroon",
        "South Africa",
        "Zimbabwe",
        "Zambia",
        "Malawi",
        "Mozambique",
      ],
    };
  }

  /**
   * Get analytics dashboard summary
   */
  getDashboardSummary(): {
    impact: ImpactMetrics;
    userCount: number;
    activeUsers: number;
    atRiskUsers: number;
    averageEngagementScore: number;
  } {
    const allUsers = Array.from(this.userAnalytics.values());
    const activeUsers = allUsers.filter((u) => u.retentionStatus === "active").length;
    const atRiskUsers = allUsers.filter((u) => u.retentionStatus === "at_risk").length;
    const averageEngagementScore =
      allUsers.length > 0
        ? Math.round(allUsers.reduce((sum, u) => sum + u.engagementScore, 0) / allUsers.length)
        : 0;

    return {
      impact: this.getImpactMetrics(),
      userCount: allUsers.length,
      activeUsers,
      atRiskUsers,
      averageEngagementScore,
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
