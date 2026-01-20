import { EventEmitter } from "events";

export type NotificationType =
  | "enrollment"
  | "payment"
  | "certificate"
  | "course_update"
  | "quiz_result"
  | "achievement"
  | "message"
  | "system";

export interface Notification {
  id: string;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  actionLabel?: string;
}

export interface NotificationPreferences {
  userId: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  enrollmentAlerts: boolean;
  paymentAlerts: boolean;
  certificateAlerts: boolean;
  courseUpdates: boolean;
  quizReminders: boolean;
  achievementNotifications: boolean;
}

class NotificationService extends EventEmitter {
  private notifications: Map<number, Notification[]> = new Map();
  private preferences: Map<number, NotificationPreferences> = new Map();
  private unreadCounts: Map<number, number> = new Map();

  /**
   * Create a new notification
   */
  createNotification(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, unknown>,
    actionUrl?: string,
    actionLabel?: string
  ): Notification {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date(),
      actionUrl,
      actionLabel,
    };

    // Store notification
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    this.notifications.get(userId)!.push(notification);

    // Update unread count
    this.unreadCounts.set(userId, (this.unreadCounts.get(userId) || 0) + 1);

    // Emit event for real-time updates
    this.emit("notification", notification);

    return notification;
  }

  /**
   * Get all notifications for a user
   */
  getNotifications(userId: number, limit: number = 50): Notification[] {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.slice(-limit).reverse();
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(userId: number): number {
    return this.unreadCounts.get(userId) || 0;
  }

  /**
   * Mark notification as read
   */
  markAsRead(userId: number, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userId) || [];
    const notification = userNotifications.find((n) => n.id === notificationId);

    if (notification && !notification.read) {
      notification.read = true;
      this.unreadCounts.set(userId, Math.max(0, (this.unreadCounts.get(userId) || 0) - 1));
      this.emit("notification-read", { userId, notificationId });
      return true;
    }

    return false;
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userId: number): number {
    const userNotifications = this.notifications.get(userId) || [];
    let count = 0;

    userNotifications.forEach((n) => {
      if (!n.read) {
        n.read = true;
        count++;
      }
    });

    this.unreadCounts.set(userId, 0);
    this.emit("all-notifications-read", { userId });
    return count;
  }

  /**
   * Delete a notification
   */
  deleteNotification(userId: number, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userId) || [];
    const index = userNotifications.findIndex((n) => n.id === notificationId);

    if (index > -1) {
      const notification = userNotifications[index];
      userNotifications.splice(index, 1);
      if (!notification.read) {
        this.unreadCounts.set(userId, Math.max(0, (this.unreadCounts.get(userId) || 0) - 1));
      }
      this.emit("notification-deleted", { userId, notificationId });
      return true;
    }

    return false;
  }

  /**
   * Clear all notifications for a user
   */
  clearNotifications(userId: number): number {
    const userNotifications = this.notifications.get(userId) || [];
    const count = userNotifications.length;
    this.notifications.set(userId, []);
    this.unreadCounts.set(userId, 0);
    this.emit("notifications-cleared", { userId });
    return count;
  }

  /**
   * Set notification preferences
   */
  setPreferences(userId: number, preferences: Partial<NotificationPreferences>): void {
    const existing = this.preferences.get(userId) || {
      userId,
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      enrollmentAlerts: true,
      paymentAlerts: true,
      certificateAlerts: true,
      courseUpdates: true,
      quizReminders: true,
      achievementNotifications: true,
    };

    const updated = { ...existing, ...preferences, userId };
    this.preferences.set(userId, updated);
    this.emit("preferences-updated", { userId, preferences: updated });
  }

  /**
   * Get notification preferences
   */
  getPreferences(userId: number): NotificationPreferences {
    return (
      this.preferences.get(userId) || {
        userId,
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        enrollmentAlerts: true,
        paymentAlerts: true,
        certificateAlerts: true,
        courseUpdates: true,
        quizReminders: true,
        achievementNotifications: true,
      }
    );
  }

  /**
   * Check if user should receive notification
   */
  shouldNotify(userId: number, type: NotificationType): boolean {
    const prefs = this.getPreferences(userId);

    switch (type) {
      case "enrollment":
        return prefs.enrollmentAlerts;
      case "payment":
        return prefs.paymentAlerts;
      case "certificate":
        return prefs.certificateAlerts;
      case "course_update":
        return prefs.courseUpdates;
      case "quiz_result":
        return prefs.quizReminders;
      case "achievement":
        return prefs.achievementNotifications;
      case "message":
        return prefs.pushNotifications;
      case "system":
        return true; // Always show system notifications
      default:
        return true;
    }
  }

  /**
   * Send enrollment notification
   */
  notifyEnrollment(
    userId: number,
    enrollmentId: number,
    programName: string
  ): Notification | null {
    if (!this.shouldNotify(userId, "enrollment")) return null;

    return this.createNotification(
      userId,
      "enrollment",
      "Enrollment Confirmed",
      `You have successfully enrolled in ${programName}`,
      { enrollmentId, programName },
      `/dashboard`,
      "View Details"
    );
  }

  /**
   * Send payment notification
   */
  notifyPayment(
    userId: number,
    amount: number,
    status: "pending" | "completed" | "failed",
    reference: string
  ): Notification | null {
    if (!this.shouldNotify(userId, "payment")) return null;

    const titles = {
      pending: "Payment Pending",
      completed: "Payment Received",
      failed: "Payment Failed",
    };

    const messages = {
      pending: `Payment of KES ${amount} is pending. Reference: ${reference}`,
      completed: `Payment of KES ${amount} has been received. Thank you!`,
      failed: `Payment of KES ${amount} failed. Please try again.`,
    };

    return this.createNotification(
      userId,
      "payment",
      titles[status],
      messages[status],
      { amount, status, reference },
      `/payments`,
      "View Payments"
    );
  }

  /**
   * Send certificate notification
   */
  notifyCertificate(
    userId: number,
    certificateId: string,
    programName: string
  ): Notification | null {
    if (!this.shouldNotify(userId, "certificate")) return null;

    return this.createNotification(
      userId,
      "certificate",
      "Certificate Issued",
      `Your certificate for ${programName} is ready to download`,
      { certificateId, programName },
      `/verify-certificate`,
      "Download Certificate"
    );
  }

  /**
   * Send course update notification
   */
  notifyCourseUpdate(
    userId: number,
    courseName: string,
    updateMessage: string
  ): Notification | null {
    if (!this.shouldNotify(userId, "course_update")) return null;

    return this.createNotification(
      userId,
      "course_update",
      `${courseName} Updated`,
      updateMessage,
      { courseName },
      `/dashboard`,
      "View Course"
    );
  }

  /**
   * Send quiz result notification
   */
  notifyQuizResult(
    userId: number,
    quizName: string,
    score: number,
    passed: boolean
  ): Notification | null {
    if (!this.shouldNotify(userId, "quiz_result")) return null;

    const title = passed ? "Quiz Passed" : "Quiz Needs Review";
    const message = `You scored ${score}% on ${quizName}`;

    return this.createNotification(
      userId,
      "quiz_result",
      title,
      message,
      { quizName, score, passed },
      `/progress`,
      "View Results"
    );
  }

  /**
   * Send achievement notification
   */
  notifyAchievement(
    userId: number,
    achievementName: string,
    description: string
  ): Notification | null {
    if (!this.shouldNotify(userId, "achievement")) return null;

    return this.createNotification(
      userId,
      "achievement",
      "Achievement Unlocked",
      `${achievementName}: ${description}`,
      { achievementName },
      `/progress`,
      "View Achievements"
    );
  }

  /**
   * Send system notification
   */
  notifySystem(userId: number, title: string, message: string): Notification {
    return this.createNotification(userId, "system", title, message);
  }

  /**
   * Broadcast notification to all users
   */
  broadcastNotification(
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, unknown>
  ): void {
    this.emit("broadcast", { type, title, message, data });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
