import { getDb } from "../db";
import { desc, eq } from "drizzle-orm";
import { payments, enrollments, users } from "../../drizzle/schema";

/**
 * Predictive Analytics and ML Models Service
 * Forecasts revenue, churn, and user behavior
 */

export interface RevenueForecast {
  period: string;
  forecastedRevenue: number;
  confidence: number;
  trend: "increasing" | "decreasing" | "stable";
  seasonality: string;
}

export interface ChurnPrediction {
  userId: number;
  churnRisk: number; // 0-100
  riskLevel: "low" | "medium" | "high" | "critical";
  reasons: string[];
  recommendedActions: string[];
}

export interface UserLifetimeValue {
  userId: number;
  predictedLTV: number;
  confidence: number;
  segments: {
    highValue: boolean;
    atRisk: boolean;
    dormant: boolean;
  };
}

/**
 * Forecast revenue for next period
 */
export async function forecastRevenue(periodDays: number = 30): Promise<RevenueForecast> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get historical payment data
    const payments_ = await db.select().from(payments).where(eq(payments.status, "completed"));
    
    if (payments_.length < 10) {
      return {
        period: `Next ${periodDays} days`,
        forecastedRevenue: 0,
        confidence: 0,
        trend: "stable",
        seasonality: "insufficient_data"
      };
    }

    // Calculate daily revenue
    const dailyRevenue: Record<string, number> = {};
    payments_.forEach((p: any) => {
      const date = new Date(p.createdAt).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + (p.amount || 0);
    });

    // Calculate statistics
    const revenues = Object.values(dailyRevenue);
    const avgDailyRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    const stdDev = Math.sqrt(revenues.reduce((sq: number, n: number) => sq + Math.pow(n - avgDailyRevenue, 2), 0) / revenues.length);

    // Forecast using simple linear regression
    const recentRevenues = revenues.slice(-14); // Last 14 days
    const trend = recentRevenues[recentRevenues.length - 1] > recentRevenues[0] ? "increasing" : recentRevenues[recentRevenues.length - 1] < recentRevenues[0] ? "decreasing" : "stable";

    const forecastedDailyRevenue = avgDailyRevenue * (trend === "increasing" ? 1.05 : trend === "decreasing" ? 0.95 : 1);
    const forecastedRevenue = Math.round(forecastedDailyRevenue * periodDays / 100); // Convert from cents

    // Calculate confidence (higher with more data)
    const confidence = Math.min(95, 50 + (payments_.length / 100) * 45);

    return {
      period: `Next ${periodDays} days`,
      forecastedRevenue,
      confidence: Math.round(confidence),
      trend,
      seasonality: "weekly" // Mock seasonality
    };
  } catch (error) {
    console.error("[Predictive Analytics] Error forecasting revenue:", error);
    throw error;
  }
}

/**
 * Predict user churn risk
 */
export async function predictChurnRisk(userId: number): Promise<ChurnPrediction> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get user data
    const userList = await db.select().from(users);
    const user = userList.find((u: any) => u.id === userId);
    
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Calculate churn risk factors
    let churnScore = 0;
    const reasons: string[] = [];
    const recommendedActions: string[] = [];

    // Factor 1: Days since last activity
    const daysSinceLastSignIn = Math.floor((Date.now() - new Date(user.lastSignedIn).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastSignIn > 30) {
      churnScore += 30;
      reasons.push("No activity for 30+ days");
      recommendedActions.push("Send re-engagement email");
    } else if (daysSinceLastSignIn > 14) {
      churnScore += 15;
      reasons.push("Low activity in past 14 days");
      recommendedActions.push("Send reminder about upcoming courses");
    }

    // Factor 2: Enrollment completion
    const userEnrollments = await db.select().from(enrollments);
    const userEnrollmentList = userEnrollments.filter((e: any) => e.userId === userId);
    const completedEnrollments = userEnrollmentList.filter((e: any) => e.paymentStatus === "completed").length;
    
    if (userEnrollmentList.length > 0 && completedEnrollments === 0) {
      churnScore += 25;
      reasons.push("No completed enrollments");
      recommendedActions.push("Offer first course at discount");
    } else if (completedEnrollments > 0 && daysSinceLastSignIn > 60) {
      churnScore += 20;
      reasons.push("Inactive after completing courses");
      recommendedActions.push("Recommend advanced courses");
    }

    // Factor 3: Payment history
    const userPayments = await db.select().from(payments);
    const userPaymentList = userPayments.filter((p: any) => p.userId === userId);
    const failedPayments = userPaymentList.filter((p: any) => p.status === "failed").length;
    
    if (failedPayments > userPaymentList.length * 0.3) {
      churnScore += 20;
      reasons.push("High payment failure rate");
      recommendedActions.push("Offer payment plan options");
    }

    // Factor 4: Account age
    const daysSinceCreation = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreation < 7 && userEnrollmentList.length === 0) {
      churnScore += 15;
      reasons.push("New user with no enrollments");
      recommendedActions.push("Send onboarding email with course recommendations");
    }

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" | "critical" = "low";
    if (churnScore >= 75) riskLevel = "critical";
    else if (churnScore >= 50) riskLevel = "high";
    else if (churnScore >= 25) riskLevel = "medium";

    return {
      userId,
      churnRisk: Math.min(100, churnScore),
      riskLevel,
      reasons,
      recommendedActions
    };
  } catch (error) {
    console.error("[Predictive Analytics] Error predicting churn:", error);
    throw error;
  }
}

/**
 * Calculate predicted lifetime value
 */
export async function calculatePredictedLTV(userId: number): Promise<UserLifetimeValue> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get user payment history
    const userPayments = await db.select().from(payments);
    const userPaymentList = userPayments.filter((p: any) => p.userId === userId && p.status === "completed");
    
    if (userPaymentList.length === 0) {
      return {
        userId,
        predictedLTV: 0,
        confidence: 20,
        segments: {
          highValue: false,
          atRisk: true,
          dormant: false
        }
      };
    }

    // Calculate average order value
    const totalSpent = userPaymentList.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const avgOrderValue = totalSpent / userPaymentList.length;

    // Calculate purchase frequency (orders per month)
    const firstPurchaseDate = new Date(userPaymentList[0].createdAt);
    const lastPurchaseDate = new Date(userPaymentList[userPaymentList.length - 1].createdAt);
    const monthsBetween = (lastPurchaseDate.getTime() - firstPurchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const purchaseFrequency = monthsBetween > 0 ? userPaymentList.length / monthsBetween : userPaymentList.length;

    // Estimate customer lifespan (assume 3 years average)
    const estimatedLifespan = 36; // months

    // Calculate LTV = Average Order Value × Purchase Frequency × Customer Lifespan
    const predictedLTV = Math.round((avgOrderValue / 100) * purchaseFrequency * estimatedLifespan);

    // Determine segments
    const highValue = predictedLTV > 50000; // 50K KES
    const atRisk = userPaymentList.length < 2; // Only 1 purchase
    const dormant = false; // Determined by churn prediction

    // Calculate confidence based on data points
    const confidence = Math.min(95, 40 + (userPaymentList.length * 10));

    return {
      userId,
      predictedLTV,
      confidence: Math.round(confidence),
      segments: {
        highValue,
        atRisk,
        dormant
      }
    };
  } catch (error) {
    console.error("[Predictive Analytics] Error calculating LTV:", error);
    throw error;
  }
}

/**
 * Identify high-value users at risk of churn
 */
export async function identifyHighValueAtRiskUsers(): Promise<Array<{ userId: number; ltv: number; churnRisk: number; recommendedAction: string }>> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userList = await db.select().from(users);
    const atRiskUsers = [];

    for (const user of userList.slice(0, 100)) { // Analyze first 100 users
      const ltv = await calculatePredictedLTV(user.id);
      const churn = await predictChurnRisk(user.id);

      // Identify high-value users at risk
      if (ltv.segments.highValue && churn.riskLevel !== "low") {
        atRiskUsers.push({
          userId: user.id,
          ltv: ltv.predictedLTV,
          churnRisk: churn.churnRisk,
          recommendedAction: churn.recommendedActions[0] || "Send personalized offer"
        });
      }
    }

    return atRiskUsers.sort((a, b) => (b.ltv * b.churnRisk) - (a.ltv * a.churnRisk)).slice(0, 10);
  } catch (error) {
    console.error("[Predictive Analytics] Error identifying at-risk users:", error);
    return [];
  }
}

/**
 * Predict next best action for user
 */
export async function predictNextBestAction(userId: number): Promise<{ action: string; probability: number; expectedImpact: string }> {
  try {
    const ltv = await calculatePredictedLTV(userId);
    const churn = await predictChurnRisk(userId);

    // Determine best action based on user segment
    let action = "Send promotional email";
    let probability = 0.6;
    let expectedImpact = "Increase engagement";

    if (churn.riskLevel === "critical") {
      action = "Offer exclusive discount on premium course";
      probability = 0.75;
      expectedImpact = "Prevent churn, increase LTV by 30%";
    } else if (ltv.segments.highValue && churn.riskLevel === "high") {
      action = "Schedule personalized consultation";
      probability = 0.8;
      expectedImpact = "Retain high-value customer, increase LTV by 50%";
    } else if (ltv.segments.highValue) {
      action = "Recommend advanced courses";
      probability = 0.7;
      expectedImpact = "Increase LTV by 40%";
    } else if (churn.riskLevel === "high") {
      action = "Send re-engagement email with discount";
      probability = 0.65;
      expectedImpact = "Reduce churn by 20%";
    }

    return {
      action,
      probability,
      expectedImpact
    };
  } catch (error) {
    console.error("[Predictive Analytics] Error predicting next best action:", error);
    throw error;
  }
}

/**
 * Generate predictive analytics report
 */
export async function generatePredictiveReport(): Promise<any> {
  try {
    const revenueForecast = await forecastRevenue(30);
    const atRiskUsers = await identifyHighValueAtRiskUsers();

    return {
      timestamp: new Date().toISOString(),
      revenueForecast,
      atRiskUsers,
      recommendations: generatePredictiveRecommendations(revenueForecast, atRiskUsers)
    };
  } catch (error) {
    console.error("[Predictive Analytics] Error generating report:", error);
    throw error;
  }
}

/**
 * Generate recommendations based on predictions
 */
function generatePredictiveRecommendations(forecast: RevenueForecast, atRiskUsers: any[]): string[] {
  const recommendations: string[] = [];

  if (forecast.trend === "decreasing") {
    recommendations.push("Revenue is trending downward. Implement promotional campaigns to boost enrollments.");
  } else if (forecast.trend === "increasing") {
    recommendations.push("Revenue is trending upward. Scale marketing efforts to capitalize on momentum.");
  }

  if (forecast.confidence < 60) {
    recommendations.push("Revenue forecast confidence is low. Collect more data for better predictions.");
  }

  if (atRiskUsers.length > 5) {
    recommendations.push(`${atRiskUsers.length} high-value users are at risk of churn. Implement retention campaigns immediately.`);
  }

  if (atRiskUsers.length > 0) {
    const topAtRisk = atRiskUsers[0];
    recommendations.push(`Priority: User ${topAtRisk.userId} has LTV of ${topAtRisk.ltv} KES with ${topAtRisk.churnRisk}% churn risk. ${topAtRisk.recommendedAction}`);
  }

  return recommendations;
}
