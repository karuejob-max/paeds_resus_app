/** Platform feedback ticket categories — product surface / source (migration 0048). */
export const FEEDBACK_CATEGORIES = [
  "course_content",
  "resus_gps",
  "care_signal",
  "payment_technical",
  "safety_concern",
  "other",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

/** Issue type for triage (migration 0051). Distinct from product-surface category. */
export const FEEDBACK_ISSUE_TYPES = ["bug", "content", "ux", "billing", "clinical", "other"] as const;
export type FeedbackIssueType = (typeof FEEDBACK_ISSUE_TYPES)[number];

export const FEEDBACK_STATUSES = ["open", "in_progress", "resolved", "wont_fix", "duplicate"] as const;
export type FeedbackTicketStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_PRIORITIES = ["normal", "safety"] as const;
export type FeedbackPriority = (typeof FEEDBACK_PRIORITIES)[number];

export const FEEDBACK_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type FeedbackSeverity = (typeof FEEDBACK_SEVERITIES)[number];

export const FEEDBACK_AGENT_ASSIGNEES = ["unassigned", "cursor", "manus", "ceo", "clinical"] as const;
export type FeedbackAgentAssignee = (typeof FEEDBACK_AGENT_ASSIGNEES)[number];

export type FeedbackContextJson = {
  pageUrl?: string;
  courseSlug?: string;
  courseId?: string;
  courseTitle?: string;
  moduleId?: number;
  moduleIndex?: number;
  moduleTitle?: string;
  quizType?: string;
  simulationSlug?: string;
  ahaCourseId?: string;
  resusSessionId?: string;
  /** Which widget or page submitted the ticket (e.g. fellowship_player, header_menu). */
  surface?: string;
  userAgent?: string;
  screenshotUrl?: string;
};

export type FeedbackStatusHistoryEntry = {
  from: FeedbackTicketStatus | null;
  to: FeedbackTicketStatus;
  note?: string;
  at: string;
  byUserId?: number;
};

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  course_content: "Course content",
  resus_gps: "ResusGPS",
  care_signal: "Care Signal",
  payment_technical: "Payment / technical",
  safety_concern: "Safety concern (urgent)",
  other: "Other",
};

export const FEEDBACK_ISSUE_TYPE_LABELS: Record<FeedbackIssueType, string> = {
  bug: "Bug",
  content: "Content",
  ux: "UX",
  billing: "Billing",
  clinical: "Clinical",
  other: "Other",
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackTicketStatus, string> = {
  open: "Pending",
  in_progress: "In progress",
  resolved: "Fixed",
  wont_fix: "Won't fix",
  duplicate: "Duplicate",
};

export const FEEDBACK_SEVERITY_LABELS: Record<FeedbackSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const FEEDBACK_AGENT_ASSIGNEE_LABELS: Record<FeedbackAgentAssignee, string> = {
  unassigned: "Unassigned",
  cursor: "Cursor",
  manus: "Manus",
  ceo: "CEO",
  clinical: "Clinical team",
};

/** Map product category → default issue type when user does not pick one. */
export function defaultIssueTypeForCategory(category: FeedbackCategory): FeedbackIssueType {
  switch (category) {
    case "course_content":
      return "content";
    case "payment_technical":
      return "billing";
    case "safety_concern":
      return "clinical";
    case "resus_gps":
    case "care_signal":
      return "ux";
    default:
      return "other";
  }
}

/** Safety-priority tickets default to high severity unless user selects critical. */
export function defaultSeverityForCategory(
  category: FeedbackCategory,
  priority?: FeedbackPriority
): FeedbackSeverity {
  if (priority === "safety" || category === "safety_concern") return "high";
  return "medium";
}
