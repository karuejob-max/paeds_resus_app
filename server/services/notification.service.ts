import { getDb } from "../db";
import { notifyOwner } from "../_core/notification";

export interface NotificationInput {
  userId: number;
  type: "recommendation" | "achievement" | "alert" | "update";
  title: string;
  content: string;
  actionUrl?: string;
  priority: "low" | "medium" | "high";
}

export interface UserNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  content: string;
  actionUrl?: string;
  priority: string;
  read: boolean;
  createdAt: Date;
}

/**
 * Send notification to user
 */
export async function sendNotification(input: NotificationInput): Promise<boolean> {
  try {
    const { userId, type, title, content, actionUrl, priority } = input;

    // Log notification in database
    console.log(`[Notification] Sending ${type} to user ${userId}: ${title}`);

    // In production, integrate with email/SMS service
    // For now, we'll use the owner notification for critical alerts
    if (priority === "high") {
      await notifyOwner({
        title: `User Notification: ${title}`,
        content: `User ${userId} received: ${content}`,
      });
    }

    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
}

/**
 * Send recommendation notification to user
 */
export async function sendRecommendationNotification(
  userId: number,
  recommendations: Array<{
    title: string;
    content: string;
    priority: "low" | "medium" | "high";
  }>
): Promise<boolean> {
  try {
    const highPriorityRecs = recommendations.filter((r) => r.priority === "high");

    if (highPriorityRecs.length === 0) {
      return true; // No high-priority recommendations to notify about
    }

    const title = `${highPriorityRecs.length} New Recommendation${highPriorityRecs.length > 1 ? "s" : ""} for You`;
    const content = highPriorityRecs.map((r) => `• ${r.title}`).join("\n");

    return await sendNotification({
      userId,
      type: "recommendation",
      title,
      content,
      priority: "high",
      actionUrl: `/dashboard?tab=recommendations`,
    });
  } catch (error) {
    console.error("Error sending recommendation notification:", error);
    return false;
  }
}

/**
 * Send achievement notification to user
 */
export async function sendAchievementNotification(
  userId: number,
  achievementTitle: string,
  achievementDescription: string
): Promise<boolean> {
  try {
    return await sendNotification({
      userId,
      type: "achievement",
      title: `🎉 Achievement Unlocked: ${achievementTitle}`,
      content: achievementDescription,
      priority: "medium",
      actionUrl: `/achievements`,
    });
  } catch (error) {
    console.error("Error sending achievement notification:", error);
    return false;
  }
}

/**
 * Send alert notification to user
 */
export async function sendAlertNotification(
  userId: number,
  alertTitle: string,
  alertContent: string
): Promise<boolean> {
  try {
    return await sendNotification({
      userId,
      type: "alert",
      title: alertTitle,
      content: alertContent,
      priority: "high",
    });
  } catch (error) {
    console.error("Error sending alert notification:", error);
    return false;
  }
}

/**
 * Send update notification to user
 */
export async function sendUpdateNotification(
  userId: number,
  updateTitle: string,
  updateContent: string
): Promise<boolean> {
  try {
    return await sendNotification({
      userId,
      type: "update",
      title: updateTitle,
      content: updateContent,
      priority: "low",
    });
  } catch (error) {
    console.error("Error sending update notification:", error);
    return false;
  }
}

/**
 * Send batch notifications to multiple users
 */
export async function sendBatchNotifications(
  userIds: number[],
  notification: Omit<NotificationInput, "userId">
): Promise<number> {
  try {
    let successCount = 0;

    for (const userId of userIds) {
      const success = await sendNotification({
        ...notification,
        userId,
      });

      if (success) {
        successCount++;
      }
    }

    console.log(`[Notification] Sent batch notifications to ${successCount}/${userIds.length} users`);
    return successCount;
  } catch (error) {
    console.error("Error sending batch notifications:", error);
    return 0;
  }
}

/**
 * Send facility milestone notification
 */
export async function sendFacilityMilestoneNotification(
  facilityName: string,
  milestone: string,
  adminUserIds: number[]
): Promise<boolean> {
  try {
    const title = `🏥 Facility Milestone: ${facilityName}`;
    const content = `${facilityName} has achieved: ${milestone}`;

    const successCount = await sendBatchNotifications(adminUserIds, {
      type: "update",
      title,
      content,
      priority: "medium",
      actionUrl: `/accreditation`,
    });

    return successCount > 0;
  } catch (error) {
    console.error("Error sending facility milestone notification:", error);
    return false;
  }
}

/**
 * Send churn risk alert to facility managers
 */
export async function sendChurnRiskAlert(
  userId: number,
  riskLevel: "low" | "medium" | "high",
  recommendations: string[]
): Promise<boolean> {
  try {
    const riskEmoji = {
      low: "🟢",
      medium: "🟡",
      high: "🔴",
    };

    const title = `${riskEmoji[riskLevel]} Churn Risk Alert`;
    const content = `Based on recent activity, we've identified potential churn risk. Recommendations:\n${recommendations.map((r) => `• ${r}`).join("\n")}`;

    return await sendNotification({
      userId,
      type: "alert",
      title,
      content,
      priority: riskLevel === "high" ? "high" : "medium",
      actionUrl: `/dashboard?tab=analytics`,
    });
  } catch (error) {
    console.error("Error sending churn risk alert:", error);
    return false;
  }
}

/**
 * Send system gap alert to facility
 */
export async function sendSystemGapAlert(
  facilityManagerId: number,
  gaps: string[],
  actionItems: string[]
): Promise<boolean> {
  try {
    const title = "System Gaps Identified from Recent Events";
    const content = `Gaps identified:\n${gaps.map((g) => `• ${g}`).join("\n")}\n\nSuggested actions:\n${actionItems.map((a) => `• ${a}`).join("\n")}`;

    return await sendNotification({
      userId: facilityManagerId,
      type: "recommendation",
      title,
      content,
      priority: "high",
      actionUrl: `/safe-truth`,
    });
  } catch (error) {
    console.error("Error sending system gap alert:", error);
    return false;
  }
}
