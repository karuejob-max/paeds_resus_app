/** Platform feedback ticket categories (migration 0048). */
export const FEEDBACK_CATEGORIES = [
  "course_content",
  "resus_gps",
  "care_signal",
  "payment_technical",
  "safety_concern",
  "other",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_STATUSES = ["open", "in_progress", "resolved", "wont_fix"] as const;
export type FeedbackTicketStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_PRIORITIES = ["normal", "safety"] as const;
export type FeedbackPriority = (typeof FEEDBACK_PRIORITIES)[number];

export type FeedbackContextJson = {
  pageUrl?: string;
  courseSlug?: string;
  courseId?: string;
  moduleId?: number;
  resusSessionId?: string;
  surface?: string;
};

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  course_content: "Course content",
  resus_gps: "ResusGPS",
  care_signal: "Care Signal",
  payment_technical: "Payment / technical",
  safety_concern: "Safety concern (urgent)",
  other: "Other",
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackTicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  wont_fix: "Won't fix",
};
