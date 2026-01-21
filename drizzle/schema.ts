import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  providerType: mysqlEnum("providerType", ["nurse", "doctor", "pharmacist", "paramedic", "lab_tech", "respiratory_therapist", "midwife", "other"]),
  userType: mysqlEnum("userType", ["individual", "institutional", "parent"]).default("individual"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Enrollments table
export const enrollments = mysqlTable("enrollments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  programType: mysqlEnum("programType", ["bls", "acls", "pals", "fellowship"]).notNull(),
  trainingDate: timestamp("trainingDate").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "partial", "completed"]).default("pending"),
  amountPaid: int("amountPaid").default(0), // in cents (KES)
  ahaPrecourseCompleted: boolean("ahaPrecourseCompleted").default(false),
  ahaCertificateUrl: text("ahaCertificateUrl"),
  certificateVerified: boolean("certificateVerified").default(false),
  reminderSent: boolean("reminderSent").default(false),
  reminderSentAt: timestamp("reminderSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = typeof enrollments.$inferInsert;

// Payments table
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  enrollmentId: int("enrollmentId").notNull(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(), // in cents (KES)
  paymentMethod: mysqlEnum("paymentMethod", ["mpesa", "bank_transfer", "card"]).notNull(),
  transactionId: varchar("transactionId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending"),
  smsConfirmationSent: boolean("smsConfirmationSent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// Certificates table
export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  enrollmentId: int("enrollmentId").notNull(),
  userId: int("userId").notNull(),
  certificateNumber: varchar("certificateNumber", { length: 255 }).unique(),
  programType: mysqlEnum("programType", ["bls", "acls", "pals", "fellowship"]).notNull(),
  issueDate: timestamp("issueDate").notNull(),
  expiryDate: timestamp("expiryDate"),
  certificateUrl: text("certificateUrl"),
  verificationCode: varchar("verificationCode", { length: 255 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

// Institutional Accounts table
export const institutionalAccounts = mysqlTable("institutionalAccounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 255 }),
  staffCount: int("staffCount"),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }),
  status: mysqlEnum("status", ["prospect", "active", "inactive"]).default("prospect"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InstitutionalAccount = typeof institutionalAccounts.$inferSelect;
export type InsertInstitutionalAccount = typeof institutionalAccounts.$inferInsert;

// Institutional Inquiries table
export const institutionalInquiries = mysqlTable("institutionalInquiries", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  staffCount: int("staffCount").notNull(),
  specificNeeds: text("specificNeeds"),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "converted", "rejected"]).default("new"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InstitutionalInquiry = typeof institutionalInquiries.$inferSelect;
export type InsertInstitutionalInquiry = typeof institutionalInquiries.$inferInsert;

// SMS Reminders table
export const smsReminders = mysqlTable("smsReminders", {
  id: int("id").autoincrement().primaryKey(),
  enrollmentId: int("enrollmentId").notNull(),
  userId: int("userId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  reminderType: mysqlEnum("reminderType", ["enrollment_confirmation", "payment_reminder", "training_reminder", "post_training"]).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SmsReminder = typeof smsReminders.$inferSelect;
export type InsertSmsReminder = typeof smsReminders.$inferInsert;

// Learner Progress table
export const learnerProgress = mysqlTable("learnerProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  enrollmentId: int("enrollmentId").notNull(),
  progressPercentage: int("progressPercentage").default(0),
  modulesCompleted: int("modulesCompleted").default(0),
  totalModules: int("totalModules").default(0),
  badges: text("badges"), // JSON array of badge names
  leaderboardRank: int("leaderboardRank"),
  lastActivityAt: timestamp("lastActivityAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearnerProgress = typeof learnerProgress.$inferSelect;
export type InsertLearnerProgress = typeof learnerProgress.$inferInsert;

// Platform Settings table
export const platformSettings = mysqlTable("platformSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 255 }).unique().notNull(),
  settingValue: text("settingValue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type InsertPlatformSetting = typeof platformSettings.$inferInsert;

// Referrals table
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredUserId: int("referredUserId").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending"),
  rewardAmount: int("rewardAmount"), // in KES
  rewardProcessedAt: timestamp("rewardProcessedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

// User Feedback table
export const userFeedback = mysqlTable("userFeedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  feedbackType: mysqlEnum("feedbackType", ["course", "instructor", "payment", "platform", "general"]).notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
  status: mysqlEnum("status", ["new", "reviewed", "addressed", "archived"]).default("new"),
  followUpRequired: boolean("followUpRequired").default(false),
  followUpSentAt: timestamp("followUpSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserFeedback = typeof userFeedback.$inferSelect;
export type InsertUserFeedback = typeof userFeedback.$inferInsert;

// Analytics Events table
export const analyticsEvents = mysqlTable("analyticsEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  eventType: varchar("eventType", { length: 255 }).notNull(), // page_view, button_click, form_submit, etc.
  eventName: varchar("eventName", { length: 255 }).notNull(),
  pageUrl: text("pageUrl"),
  eventData: text("eventData"), // JSON object with event details
  sessionId: varchar("sessionId", { length: 255 }),
  duration: int("duration"), // milliseconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

// A/B Experiments table
export const experiments = mysqlTable("experiments", {
  id: int("id").autoincrement().primaryKey(),
  experimentName: varchar("experimentName", { length: 255 }).unique().notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "running", "paused", "completed", "archived"]).default("draft"),
  variant: mysqlEnum("variant", ["control", "treatment_a", "treatment_b", "treatment_c"]).notNull(),
  trafficPercentage: int("trafficPercentage").default(50), // percentage of users to include
  metric: varchar("metric", { length: 255 }), // conversion_rate, avg_time, engagement, etc.
  targetValue: decimal("targetValue", { precision: 10, scale: 2 }),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  winner: varchar("winner", { length: 255 }), // winning variant
  statisticalSignificance: decimal("statisticalSignificance", { precision: 5, scale: 2 }), // p-value
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Experiment = typeof experiments.$inferSelect;
export type InsertExperiment = typeof experiments.$inferInsert;

// Experiment Assignments table (tracks which users are in which variant)
export const experimentAssignments = mysqlTable("experimentAssignments", {
  id: int("id").autoincrement().primaryKey(),
  experimentId: int("experimentId").notNull(),
  userId: int("userId").notNull(),
  variant: varchar("variant", { length: 255 }).notNull(),
  conversionValue: decimal("conversionValue", { precision: 10, scale: 2 }),
  convertedAt: timestamp("convertedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExperimentAssignment = typeof experimentAssignments.$inferSelect;
export type InsertExperimentAssignment = typeof experimentAssignments.$inferInsert;

// Performance Metrics table
export const performanceMetrics = mysqlTable("performanceMetrics", {
  id: int("id").autoincrement().primaryKey(),
  metricType: varchar("metricType", { length: 255 }).notNull(), // api_response_time, page_load_time, error_rate, etc.
  metricName: varchar("metricName", { length: 255 }).notNull(),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }), // ms, %, count, etc.
  endpoint: varchar("endpoint", { length: 255 }), // for API metrics
  statusCode: int("statusCode"), // HTTP status code
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;

// Error Tracking table
export const errorTracking = mysqlTable("errorTracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  errorType: varchar("errorType", { length: 255 }).notNull(),
  errorMessage: text("errorMessage"),
  stackTrace: text("stackTrace"),
  endpoint: varchar("endpoint", { length: 255 }),
  statusCode: int("statusCode"),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium"),
  status: mysqlEnum("status", ["new", "acknowledged", "investigating", "resolved"]).default("new"),
  occurrenceCount: int("occurrenceCount").default(1),
  lastOccurredAt: timestamp("lastOccurredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ErrorTracking = typeof errorTracking.$inferSelect;
export type InsertErrorTracking = typeof errorTracking.$inferInsert;

// Support Tickets table
export const supportTickets = mysqlTable("supportTickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ticketNumber: varchar("ticketNumber", { length: 255 }).unique().notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["technical", "billing", "enrollment", "certificate", "payment", "other"]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
  status: mysqlEnum("status", ["open", "in_progress", "waiting_user", "resolved", "closed"]).default("open"),
  assignedTo: int("assignedTo"), // admin user id
  resolution: text("resolution"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

// Support Ticket Messages table
export const supportTicketMessages = mysqlTable("supportTicketMessages", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  userId: int("userId").notNull(),
  message: text("message"),
  isInternal: boolean("isInternal").default(false), // internal notes only visible to admins
  attachmentUrl: text("attachmentUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupportTicketMessage = typeof supportTicketMessages.$inferSelect;
export type InsertSupportTicketMessage = typeof supportTicketMessages.$inferInsert;

// Feature Flags table
export const featureFlags = mysqlTable("featureFlags", {
  id: int("id").autoincrement().primaryKey(),
  flagName: varchar("flagName", { length: 255 }).unique().notNull(),
  description: text("description"),
  isEnabled: boolean("isEnabled").default(false),
  rolloutPercentage: int("rolloutPercentage").default(0), // 0-100%
  targetUserType: mysqlEnum("targetUserType", ["all", "admin", "individual", "institutional", "parent"]).default("all"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = typeof featureFlags.$inferInsert;

// User Cohorts table
export const userCohorts = mysqlTable("userCohorts", {
  id: int("id").autoincrement().primaryKey(),
  cohortName: varchar("cohortName", { length: 255 }).notNull(),
  description: text("description"),
  criteria: text("criteria"), // JSON object with cohort criteria
  userCount: int("userCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserCohort = typeof userCohorts.$inferSelect;
export type InsertUserCohort = typeof userCohorts.$inferInsert;

// User Cohort Members table
export const userCohortMembers = mysqlTable("userCohortMembers", {
  id: int("id").autoincrement().primaryKey(),
  cohortId: int("cohortId").notNull(),
  userId: int("userId").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type UserCohortMember = typeof userCohortMembers.$inferSelect;
export type InsertUserCohortMember = typeof userCohortMembers.$inferInsert;

// Conversion Funnel Events table
export const conversionFunnelEvents = mysqlTable("conversionFunnelEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 255 }).notNull(),
  funnelName: varchar("funnelName", { length: 255 }).notNull(), // enrollment_funnel, payment_funnel, etc.
  step: int("step").notNull(), // 1, 2, 3, etc.
  stepName: varchar("stepName", { length: 255 }).notNull(), // course_selection, payment_info, confirmation, etc.
  completedAt: timestamp("completedAt"),
  droppedAt: timestamp("droppedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConversionFunnelEvent = typeof conversionFunnelEvents.$inferSelect;
export type InsertConversionFunnelEvent = typeof conversionFunnelEvents.$inferInsert;

// NPS Survey Responses table
export const npsSurveyResponses = mysqlTable("npsSurveyResponses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  score: int("score").notNull(), // 0-10
  category: mysqlEnum("category", ["promoter", "passive", "detractor"]), // calculated from score
  feedback: text("feedback"),
  followUpEmail: varchar("followUpEmail", { length: 320 }),
  followUpSent: boolean("followUpSent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NpsSurveyResponse = typeof npsSurveyResponses.$inferSelect;
export type InsertNpsSurveyResponse = typeof npsSurveyResponses.$inferInsert;


// ============================================
// SAFE-TRUTH PLATFORM TABLES
// ============================================

// User Roles and Workstation Information
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  primaryRole: mysqlEnum("primaryRole", [
    "clinician",
    "nurse",
    "paramedic",
    "facility_manager",
    "parent_caregiver",
    "government",
    "insurance",
    "other",
  ]),
  workstation: mysqlEnum("workstation", [
    "emergency_department",
    "icu",
    "ward",
    "clinic",
    "home",
    "other",
  ]),
  facilityId: int("facilityId"), // for institutional users
  facilityName: varchar("facilityName", { length: 255 }),
  yearsOfExperience: int("yearsOfExperience").default(0),
  specialization: varchar("specialization", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

// Safe-Truth Events (pediatric emergency cases)
export const safetruthEvents = mysqlTable("safetruthEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  facilityId: int("facilityId"),
  facilityName: varchar("facilityName", { length: 255 }),
  eventDate: timestamp("eventDate").notNull(),
  childAge: int("childAge").default(0), // in months
  childAgeGroup: mysqlEnum("childAgeGroup", [
    "newborn_0_3m",
    "infant_3_12m",
    "toddler_1_3y",
    "preschool_3_5y",
    "school_5_12y",
    "adolescent_12_18y",
  ]),
  eventType: mysqlEnum("eventType", [
    "cardiac_arrest",
    "respiratory_failure",
    "severe_sepsis",
    "trauma",
    "drowning",
    "choking",
    "other",
  ]).notNull(),
  initialPresentation: text("initialPresentation"), // detailed description
  isAnonymous: boolean("isAnonymous").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SafetruthEvent = typeof safetruthEvents.$inferSelect;
export type InsertSafetruthEvent = typeof safetruthEvents.$inferInsert;

// Chain of Survival Checkpoints
export const chainOfSurvivalCheckpoints = mysqlTable("chainOfSurvivalCheckpoints", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  recognitionCompleted: boolean("recognitionCompleted").default(false),
  recognitionNotes: text("recognitionNotes"),
  activationCompleted: boolean("activationCompleted").default(false),
  activationNotes: text("activationNotes"),
  cprCompleted: boolean("cprCompleted").default(false),
  cprQuality: mysqlEnum("cprQuality", ["excellent", "good", "adequate", "poor", "not_performed"]),
  cprNotes: text("cprNotes"),
  defibrillationCompleted: boolean("defibrillationCompleted").default(false),
  defibrillationNotes: text("defibrillationNotes"),
  advancedCareCompleted: boolean("advancedCareCompleted").default(false),
  advancedCareDetails: text("advancedCareDetails"),
  postResuscitationCompleted: boolean("postResuscitationCompleted").default(false),
  postResuscitationNotes: text("postResuscitationNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChainOfSurvivalCheckpoint = typeof chainOfSurvivalCheckpoints.$inferSelect;
export type InsertChainOfSurvivalCheckpoint = typeof chainOfSurvivalCheckpoints.$inferInsert;

// Event Outcomes
export const eventOutcomes = mysqlTable("eventOutcomes", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull().unique(),
  outcome: mysqlEnum("outcome", [
    "pCOSCA",
    "ROSC_with_disability",
    "ROSC_unknown",
    "mortality",
    "ongoing_resuscitation",
  ]).notNull(),
  neurologicalStatus: mysqlEnum("neurologicalStatus", [
    "intact",
    "mild_impairment",
    "moderate_impairment",
    "severe_impairment",
    "unknown",
  ]),
  timeToROSC: int("timeToROSC"), // in seconds
  hospitalStayDays: int("hospitalStayDays"),
  dischargeDiagnosis: text("dischargeDiagnosis"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EventOutcome = typeof eventOutcomes.$inferSelect;
export type InsertEventOutcome = typeof eventOutcomes.$inferInsert;

// System Gaps Identified
export const systemGaps = mysqlTable("systemGaps", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  gapCategory: mysqlEnum("gapCategory", [
    "knowledge_gap",
    "resources_gap",
    "leadership_gap",
    "communication_gap",
    "protocol_gap",
    "equipment_gap",
    "training_gap",
    "staffing_gap",
    "infrastructure_gap",
    "other",
  ]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium"),
  description: text("description").notNull(),
  impact: text("impact"), // how this gap affected the outcome
  remediationStatus: mysqlEnum("remediationStatus", [
    "identified",
    "in_progress",
    "resolved",
    "not_applicable",
  ]).default("identified"),
  remediationDate: timestamp("remediationDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemGap = typeof systemGaps.$inferSelect;
export type InsertSystemGap = typeof systemGaps.$inferInsert;

// User Insights and Recommendations
export const userInsights = mysqlTable("userInsights", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  insightType: mysqlEnum("insightType", [
    "performance_metric",
    "peer_comparison",
    "gap_recommendation",
    "improvement_suggestion",
    "milestone_achievement",
    "alert",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  actionable: boolean("actionable").default(true),
  actionUrl: text("actionUrl"), // link to take action
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserInsight = typeof userInsights.$inferSelect;
export type InsertUserInsight = typeof userInsights.$inferInsert;

// Facility Scores (hidden scoring system)
export const facilityScores = mysqlTable("facilityScores", {
  id: int("id").autoincrement().primaryKey(),
  facilityId: int("facilityId").notNull().unique(),
  facilityName: varchar("facilityName", { length: 255 }).notNull(),
  pCOSCARate: decimal("pCOSCARate", { precision: 5, scale: 2 }).default("0"), // percentage
  totalEventsReported: int("totalEventsReported").default(0),
  systemGapRemediationSpeed: int("systemGapRemediationSpeed").default(0), // average days to remediate
  staffEngagementScore: decimal("staffEngagementScore", { precision: 5, scale: 2 }).default("0"), // 0-100
  eventReportingFrequency: int("eventReportingFrequency").default(0), // events per month
  insightAdoptionRate: decimal("insightAdoptionRate", { precision: 5, scale: 2 }).default("0"), // percentage
  overallScore: decimal("overallScore", { precision: 5, scale: 2 }).default("0"), // 0-100 composite score
  scoreVisibility: mysqlEnum("scoreVisibility", ["hidden", "visible_to_facility", "public"]).default("hidden"),
  lastUpdatedAt: timestamp("lastUpdatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FacilityScore = typeof facilityScores.$inferSelect;
export type InsertFacilityScore = typeof facilityScores.$inferInsert;

// Accreditation Applications
export const accreditationApplications = mysqlTable("accreditationApplications", {
  id: int("id").autoincrement().primaryKey(),
  facilityId: int("facilityId").notNull(),
  facilityName: varchar("facilityName", { length: 255 }).notNull(),
  contactPerson: varchar("contactPerson", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }).notNull(),
  applicationDate: timestamp("applicationDate").defaultNow().notNull(),
  status: mysqlEnum("status", [
    "submitted",
    "under_review",
    "approved",
    "rejected",
    "accredited",
    "revoked",
  ]).default("submitted"),
  reviewerNotes: text("reviewerNotes"),
  facilityScore: decimal("facilityScore", { precision: 5, scale: 2 }),
  badgeAwarded: boolean("badgeAwarded").default(false),
  badgeAwardedDate: timestamp("badgeAwardedDate"),
  accreditationExpiryDate: timestamp("accreditationExpiryDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccreditationApplication = typeof accreditationApplications.$inferSelect;
export type InsertAccreditationApplication = typeof accreditationApplications.$inferInsert;

// Accredited Facilities Directory
export const accreditedFacilities = mysqlTable("accreditedFacilities", {
  id: int("id").autoincrement().primaryKey(),
  facilityId: int("facilityId").notNull().unique(),
  facilityName: varchar("facilityName", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  county: varchar("county", { length: 255 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  pCOSCARate: decimal("pCOSCARate", { precision: 5, scale: 2 }),
  accreditationDate: timestamp("accreditationDate").notNull(),
  expiryDate: timestamp("expiryDate"),
  badgeUrl: text("badgeUrl"),
  publicProfile: boolean("publicProfile").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccreditedFacility = typeof accreditedFacilities.$inferSelect;
export type InsertAccreditedFacility = typeof accreditedFacilities.$inferInsert;
