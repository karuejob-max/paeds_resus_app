import { createUserFeedback, getUserFeedback, getNewFeedback, recordNpsSurveyResponse, getNpsSurveyResponses, calculateNPS } from "../db";
import { invokeLLM } from "../_core/llm";

/**
 * Comprehensive feedback collection service
 * Handles user feedback, NPS surveys, and sentiment analysis
 */

export interface FeedbackInput {
  userId: number;
  feedbackType: "course" | "instructor" | "payment" | "platform" | "general";
  rating: number; // 1-5 stars
  comment?: string;
}

export interface NPSSurveyInput {
  userId: number;
  score: number; // 0-10
  feedback?: string;
  followUpEmail?: string;
}

export interface FeedbackAnalytics {
  totalFeedback: number;
  averageRating: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topIssues: string[];
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
}

/**
 * Submit user feedback with automatic sentiment analysis
 */
export async function submitFeedback(input: FeedbackInput): Promise<any> {
  try {
    // Analyze sentiment using LLM
    let sentiment: "positive" | "neutral" | "negative" = "neutral";
    
    if (input.comment) {
      const sentimentAnalysis = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a sentiment analysis expert. Analyze the sentiment of the following text and respond with only one word: positive, neutral, or negative."
          },
          {
            role: "user",
            content: input.comment
          }
        ]
      });
      
      const content = sentimentAnalysis.choices[0]?.message?.content;
      const responseText = typeof content === 'string' ? content.toLowerCase() : "neutral";
      
      if (responseText.includes("positive")) sentiment = "positive";
      else if (responseText.includes("negative")) sentiment = "negative";
      else sentiment = "neutral";
    }

    // Determine if follow-up is required (low ratings or negative sentiment)
    const followUpRequired = input.rating <= 2 || sentiment === "negative";

    // Create feedback record
    await createUserFeedback({
      userId: input.userId,
      feedbackType: input.feedbackType,
      rating: input.rating,
      comment: input.comment || null,
      sentiment,
      status: "new",
      followUpRequired,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return {
      success: true,
      sentiment,
      followUpRequired,
      message: "Feedback submitted successfully"
    };
  } catch (error) {
    console.error("[Feedback Service] Error submitting feedback:", error);
    throw error;
  }
}

/**
 * Submit NPS survey response
 */
export async function submitNpsSurvey(input: NPSSurveyInput): Promise<any> {
  try {
    // Determine category based on score
    let category: "promoter" | "passive" | "detractor";
    if (input.score >= 9) category = "promoter";
    else if (input.score >= 7) category = "passive";
    else category = "detractor";

    await recordNpsSurveyResponse({
      userId: input.userId,
      score: input.score,
      category,
      feedback: input.feedback || null,
      followUpEmail: input.followUpEmail || null,
      followUpSent: false,
      createdAt: new Date()
    });

    return {
      success: true,
      category,
      message: "NPS survey submitted successfully"
    };
  } catch (error) {
    console.error("[Feedback Service] Error submitting NPS survey:", error);
    throw error;
  }
}

/**
 * Get user's feedback history
 */
export async function getUserFeedbackHistory(userId: number): Promise<any[]> {
  try {
    return await getUserFeedback(userId);
  } catch (error) {
    console.error("[Feedback Service] Error getting user feedback:", error);
    throw error;
  }
}

/**
 * Get new feedback requiring review
 */
export async function getNewFeedbackForReview(limit = 50): Promise<any[]> {
  try {
    return await getNewFeedback(limit);
  } catch (error) {
    console.error("[Feedback Service] Error getting new feedback:", error);
    throw error;
  }
}

/**
 * Calculate comprehensive feedback analytics
 */
export async function calculateFeedbackAnalytics(): Promise<FeedbackAnalytics> {
  try {
    const feedback = await getNewFeedback(1000);
    const npsResponses = await getNpsSurveyResponses(1000);
    const npsScore = await calculateNPS();

    // Calculate rating statistics
    const totalFeedback = feedback.length;
    const averageRating = totalFeedback > 0 
      ? feedback.reduce((sum: number, f: any) => sum + f.rating, 0) / totalFeedback 
      : 0;

    // Sentiment breakdown
    const sentimentBreakdown = {
      positive: feedback.filter((f: any) => f.sentiment === "positive").length,
      neutral: feedback.filter((f: any) => f.sentiment === "neutral").length,
      negative: feedback.filter((f: any) => f.sentiment === "negative").length
    };

    // Extract top issues from negative feedback
    const topIssues: string[] = [];
    const negativeComments = feedback
      .filter((f: any) => f.sentiment === "negative" && f.comment)
      .map((f: any) => f.comment);
    
    if (negativeComments.length > 0) {
      try {
        const issueAnalysis = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Extract the top 5 most common issues from the following user feedback. Return only a JSON array of strings, nothing else."
            },
            {
              role: "user",
              content: negativeComments.join("\n")
            }
          ]
        });

        const content = issueAnalysis.choices[0]?.message?.content;
        const contentStr = typeof content === 'string' ? content : '[]';
        
        try {
          const parsed = JSON.parse(contentStr);
          if (Array.isArray(parsed)) {
            topIssues.push(...parsed);
          } else if (parsed.issues && Array.isArray(parsed.issues)) {
            topIssues.push(...parsed.issues);
          }
        } catch (parseError) {
          console.warn("[Feedback Service] Failed to parse issues:", parseError);
        }
      } catch (llmError) {
        console.warn("[Feedback Service] LLM issue extraction failed:", llmError);
      }
    }

    // NPS breakdown
    const promoters = npsResponses.filter((r: any) => r.category === "promoter").length;
    const passives = npsResponses.filter((r: any) => r.category === "passive").length;
    const detractors = npsResponses.filter((r: any) => r.category === "detractor").length;

    return {
      totalFeedback,
      averageRating: Math.round(averageRating * 100) / 100,
      sentimentBreakdown,
      topIssues: topIssues.slice(0, 5),
      npsScore,
      promoters,
      passives,
      detractors
    };
  } catch (error) {
    console.error("[Feedback Service] Error calculating analytics:", error);
    throw error;
  }
}

/**
 * Generate feedback report for a specific time period
 */
export async function generateFeedbackReport(startDate: Date, endDate: Date): Promise<any> {
  try {
    const analytics = await calculateFeedbackAnalytics();
    
    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      analytics,
      recommendations: generateRecommendations(analytics),
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("[Feedback Service] Error generating report:", error);
    throw error;
  }
}

/**
 * Generate actionable recommendations based on feedback analytics
 */
function generateRecommendations(analytics: FeedbackAnalytics): string[] {
  const recommendations: string[] = [];

  if (analytics.averageRating < 3) {
    recommendations.push("URGENT: Average rating is below 3. Immediate action required to address user satisfaction.");
  }

  if (analytics.sentimentBreakdown.negative > analytics.sentimentBreakdown.positive) {
    recommendations.push("Negative sentiment exceeds positive. Prioritize addressing top issues.");
  }

  if (analytics.npsScore < 0) {
    recommendations.push("NPS score is negative. Focus on converting detractors to passives.");
  } else if (analytics.npsScore < 30) {
    recommendations.push("NPS score is below 30. Implement targeted improvements for detractors.");
  }

  if (analytics.topIssues.length > 0) {
    recommendations.push(`Top issues identified: ${analytics.topIssues.join(", ")}. Create action plans to address these.`);
  }

  if (analytics.sentimentBreakdown.positive > analytics.sentimentBreakdown.negative) {
    recommendations.push("Positive sentiment is strong. Leverage satisfied users for testimonials and referrals.");
  }

  return recommendations;
}
