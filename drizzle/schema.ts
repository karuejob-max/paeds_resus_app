import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date } from "drizzle-orm/mysql-core";

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


// Courses table
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  programType: mysqlEnum("programType", ["bls", "acls", "pals", "fellowship"]).notNull(),
  duration: int("duration"), // in minutes
  level: mysqlEnum("level", ["beginner", "intermediate", "advanced"]).default("beginner"),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

// Modules table
export const modules = mysqlTable("modules", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content"), // HTML content
  duration: int("duration"), // in minutes
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Module = typeof modules.$inferSelect;
export type InsertModule = typeof modules.$inferInsert;

// Quizzes table
export const quizzes = mysqlTable("quizzes", {
  id: int("id").autoincrement().primaryKey(),
  moduleId: int("moduleId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  passingScore: int("passingScore").default(70), // percentage
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

// Quiz Questions table
export const quizQuestions = mysqlTable("quizQuestions", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  question: text("question").notNull(),
  questionType: mysqlEnum("questionType", ["multiple_choice", "true_false", "short_answer"]).default("multiple_choice"),
  options: text("options"), // JSON array of options
  correctAnswer: text("correctAnswer"), // JSON
  explanation: text("explanation"),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;

// User Progress table
export const userProgress = mysqlTable("userProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  enrollmentId: int("enrollmentId").notNull(),
  moduleId: int("moduleId").notNull(),
  quizId: int("quizId"),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed"]).default("not_started"),
  score: int("score"), // percentage
  attempts: int("attempts").default(0),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;


// ============================================
// INSTITUTIONAL PORTAL TABLES
// ============================================

// Institutional Staff Members
export const institutionalStaffMembers = mysqlTable("institutionalStaffMembers", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  userId: int("userId"),
  staffName: varchar("staffName", { length: 255 }).notNull(),
  staffEmail: varchar("staffEmail", { length: 320 }).notNull(),
  staffPhone: varchar("staffPhone", { length: 20 }),
  staffRole: mysqlEnum("staffRole", ["doctor", "nurse", "paramedic", "midwife", "lab_tech", "respiratory_therapist", "support_staff", "other"]).notNull(),
  department: varchar("department", { length: 255 }),
  yearsOfExperience: int("yearsOfExperience").default(0),
  assignedCourses: text("assignedCourses"), // JSON array of course IDs
  enrollmentStatus: mysqlEnum("enrollmentStatus", ["pending", "enrolled", "in_progress", "completed", "dropped"]).default("pending"),
  enrollmentDate: timestamp("enrollmentDate"),
  completionDate: timestamp("completionDate"),
  certificationStatus: mysqlEnum("certificationStatus", ["not_started", "in_progress", "certified", "expired", "renewal_pending"]).default("not_started"),
  certificationDate: timestamp("certificationDate"),
  certificationExpiryDate: timestamp("certificationExpiryDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InstitutionalStaffMember = typeof institutionalStaffMembers.$inferSelect;
export type InsertInstitutionalStaffMember = typeof institutionalStaffMembers.$inferInsert;

// Quotations
export const quotations = mysqlTable("quotations", {
  id: int("id").autoincrement().primaryKey(),
  quotationNumber: varchar("quotationNumber", { length: 255 }).unique().notNull(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  userId: int("userId").notNull(),
  staffCount: int("staffCount").notNull(),
  courseSelections: text("courseSelections"), // JSON array of selected courses
  basePricePerStaff: int("basePricePerStaff").notNull(), // in cents (KES)
  discountPercentage: int("discountPercentage").default(0),
  totalPrice: int("totalPrice").notNull(), // in cents (KES)
  paymentTerms: mysqlEnum("paymentTerms", ["one_time", "monthly", "quarterly", "semi_annual", "annual"]).default("one_time"),
  installmentCount: int("installmentCount").default(1),
  installmentAmount: int("installmentAmount"), // in cents (KES)
  implementationTimeline: varchar("implementationTimeline", { length: 255 }), // e.g., "8 weeks"
  validityPeriod: int("validityPeriod").default(30), // days
  validUntil: timestamp("validUntil"),
  status: mysqlEnum("status", ["draft", "sent", "viewed", "accepted", "rejected", "expired"]).default("draft"),
  sentAt: timestamp("sentAt"),
  acceptedAt: timestamp("acceptedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = typeof quotations.$inferInsert;

// Contracts
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  contractNumber: varchar("contractNumber", { length: 255 }).unique().notNull(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  quotationId: int("quotationId").notNull(),
  userId: int("userId").notNull(),
  contractType: mysqlEnum("contractType", ["service_agreement", "training_agreement", "data_sharing_agreement"]).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  totalValue: int("totalValue").notNull(), // in cents (KES)
  paymentTerms: text("paymentTerms"), // JSON object with payment schedule
  termsAndConditions: text("termsAndConditions"),
  dataPrivacyTerms: text("dataPrivacyTerms"),
  supportTerms: text("supportTerms"),
  cancellationPolicy: text("cancellationPolicy"),
  status: mysqlEnum("status", ["draft", "pending_signature", "signed", "active", "completed", "terminated"]).default("draft"),
  signedAt: timestamp("signedAt"),
  signatureUrl: text("signatureUrl"),
  signedByName: varchar("signedByName", { length: 255 }),
  signedByEmail: varchar("signedByEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

// Training Schedules
export const trainingSchedules = mysqlTable("trainingSchedules", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  courseId: int("courseId").notNull(),
  trainingType: mysqlEnum("trainingType", ["online", "hands_on", "hybrid"]).notNull(),
  scheduledDate: timestamp("scheduledDate").notNull(),
  startTime: varchar("startTime", { length: 10 }), // HH:MM format
  endTime: varchar("endTime", { length: 10 }), // HH:MM format
  location: varchar("location", { length: 255 }),
  instructorId: int("instructorId"),
  instructorName: varchar("instructorName", { length: 255 }),
  maxCapacity: int("maxCapacity").notNull(),
  enrolledCount: int("enrolledCount").default(0),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrainingSchedule = typeof trainingSchedules.$inferSelect;
export type InsertTrainingSchedule = typeof trainingSchedules.$inferInsert;

// Training Attendance
export const trainingAttendance = mysqlTable("trainingAttendance", {
  id: int("id").autoincrement().primaryKey(),
  trainingScheduleId: int("trainingScheduleId").notNull(),
  staffMemberId: int("staffMemberId").notNull(),
  attendanceStatus: mysqlEnum("attendanceStatus", ["registered", "attended", "absent", "cancelled"]).default("registered"),
  skillsAssessmentScore: int("skillsAssessmentScore"), // 0-100
  feedback: text("feedback"),
  certificateIssued: boolean("certificateIssued").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrainingAttendance = typeof trainingAttendance.$inferSelect;
export type InsertTrainingAttendance = typeof trainingAttendance.$inferInsert;

// Certification Exams
export const certificationExams = mysqlTable("certificationExams", {
  id: int("id").autoincrement().primaryKey(),
  staffMemberId: int("staffMemberId").notNull(),
  courseId: int("courseId").notNull(),
  examType: mysqlEnum("examType", ["written", "practical", "combined"]).notNull(),
  examDate: timestamp("examDate").notNull(),
  score: int("score"), // 0-100
  passingScore: int("passingScore").default(80),
  status: mysqlEnum("status", ["scheduled", "completed", "passed", "failed", "retake_scheduled"]).default("scheduled"),
  certificateIssued: boolean("certificateIssued").default(false),
  certificateUrl: text("certificateUrl"),
  verificationCode: varchar("verificationCode", { length: 255 }).unique(),
  expiryDate: timestamp("expiryDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CertificationExam = typeof certificationExams.$inferSelect;
export type InsertCertificationExam = typeof certificationExams.$inferInsert;

// Incidents (Real-world emergency events)
export const incidents = mysqlTable("incidents", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  incidentDate: timestamp("incidentDate").notNull(),
  incidentType: mysqlEnum("incidentType", ["cardiac_arrest", "respiratory_failure", "severe_sepsis", "shock", "trauma", "other"]).notNull(),
  patientAge: int("patientAge"), // in months
  responseTime: int("responseTime"), // in seconds
  staffInvolved: text("staffInvolved"), // JSON array of staff IDs
  protocolsUsed: text("protocolsUsed"), // JSON array of protocol names
  outcome: mysqlEnum("outcome", ["pCOSCA", "ROSC", "mortality", "ongoing_resuscitation", "unknown"]).notNull(),
  neurologicalStatus: mysqlEnum("neurologicalStatus", ["intact", "mild_impairment", "moderate_impairment", "severe_impairment", "unknown"]),
  systemGapsIdentified: text("systemGapsIdentified"), // JSON array of gap descriptions
  improvementsImplemented: text("improvementsImplemented"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = typeof incidents.$inferInsert;

// Institutional Analytics (Aggregated metrics)
export const institutionalAnalytics = mysqlTable("institutionalAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull().unique(),
  totalStaffEnrolled: int("totalStaffEnrolled").default(0),
  totalStaffCertified: int("totalStaffCertified").default(0),
  averageCompletionTime: int("averageCompletionTime"), // in days
  certificationRate: int("certificationRate"), // percentage
  incidentsHandled: int("incidentsHandled").default(0),
  livesImprovedEstimate: int("livesImprovedEstimate").default(0),
  averageResponseTime: int("averageResponseTime"), // in seconds
  survivalRateImprovement: int("survivalRateImprovement"), // percentage
  systemGapsResolved: int("systemGapsResolved").default(0),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InstitutionalAnalytics = typeof institutionalAnalytics.$inferSelect;
export type InsertInstitutionalAnalytics = typeof institutionalAnalytics.$inferInsert;

// ============ WEEK 1 MVP: PATIENT DATA, INTERVENTIONS, IMPACT ============

// Patients table
export const patients = mysqlTable("patients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  hospitalId: int("hospitalId"),
  name: varchar("name", { length: 255 }).notNull(),
  age: int("age"),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  diagnosis: varchar("diagnosis", { length: 255 }),
  patientId: varchar("patientId", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

// Patient Vitals table
export const patientVitals = mysqlTable("patientVitals", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  heartRate: int("heartRate"),
  respiratoryRate: int("respiratoryRate"),
  systolicBP: int("systolicBP"),
  diastolicBP: int("diastolicBP"),
  oxygenSaturation: int("oxygenSaturation"),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  symptoms: text("symptoms"),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PatientVital = typeof patientVitals.$inferSelect;
export type InsertPatientVital = typeof patientVitals.$inferInsert;

// Interventions table
export const interventions = mysqlTable("interventions", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  userId: int("userId").notNull(),
  interventionType: varchar("interventionType", { length: 100 }).notNull(),
  description: text("description"),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Intervention = typeof interventions.$inferSelect;
export type InsertIntervention = typeof interventions.$inferInsert;

// Outcomes table
export const outcomes = mysqlTable("outcomes", {
  id: int("id").autoincrement().primaryKey(),
  interventionId: int("interventionId").notNull(),
  patientId: int("patientId").notNull(),
  outcome: mysqlEnum("outcome", ["improved", "stable", "deteriorated", "died"]).notNull(),
  timeToOutcome: int("timeToOutcome"), // hours
  notes: text("notes"),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Outcome = typeof outcomes.$inferSelect;
export type InsertOutcome = typeof outcomes.$inferInsert;

// Impact Metrics table
export const impactMetrics = mysqlTable("impactMetrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  period: mysqlEnum("period", ["daily", "weekly", "monthly"]).notNull(),
  interventionsLogged: int("interventionsLogged").default(0),
  outcomesLogged: int("outcomesLogged").default(0),
  livesSaved: int("livesSaved").default(0),
  coursesCompleted: int("coursesCompleted").default(0),
  certificationsEarned: int("certificationsEarned").default(0),
  referralsMade: int("referralsMade").default(0),
  viralCoefficient: decimal("viralCoefficient", { precision: 5, scale: 2 }).default("0"),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ImpactMetric = typeof impactMetrics.$inferSelect;
export type InsertImpactMetric = typeof impactMetrics.$inferInsert;

// ============ WEEK 2-3: LEARNING, COURSES, REFERRALS, LEADERBOARDS ============

// Assessments table
export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assessmentType: varchar("assessmentType", { length: 50 }).notNull(), // 'safe_truth', 'baseline'
  responses: text("responses"), // JSON
  score: int("score"),
  recommendedCourses: text("recommendedCourses"), // JSON
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;

// Note: courses, modules, quizzes tables already exist above
// Adding new tables for ML-driven learning system

// Note: referrals, achievements, leaderboardRankings tables already exist above
// Using existing tables for referral system and leaderboards


// ============ PROVIDER PROFILE SYSTEM ============
// Provider Profile table - Extended profile for healthcare providers
export const providerProfiles = mysqlTable("providerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // One profile per user
  licenseNumber: varchar("licenseNumber", { length: 255 }),
  licenseExpiry: timestamp("licenseExpiry"),
  specialization: varchar("specialization", { length: 255 }), // e.g., "Pediatrics", "Emergency Medicine"
  yearsOfExperience: int("yearsOfExperience"),
  facilityName: varchar("facilityName", { length: 255 }),
  facilityType: mysqlEnum("facilityType", ["primary_health_center", "health_post", "district_hospital", "private_clinic", "ngo_clinic", "other"]),
  facilityRegion: varchar("facilityRegion", { length: 255 }), // e.g., "Nairobi", "Kisumu"
  facilityCountry: varchar("facilityCountry", { length: 255 }).default("Kenya"),
  facilityPhone: varchar("facilityPhone", { length: 20 }),
  facilityEmail: varchar("facilityEmail", { length: 320 }),
  averagePatientLoad: int("averagePatientLoad"), // Patients per day
  profileCompleted: boolean("profileCompleted").default(false),
  profileCompletionPercentage: int("profileCompletionPercentage").default(0),
  bio: text("bio"),
  certifications: text("certifications"), // JSON array of certifications
  languages: text("languages"), // JSON array of languages
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProviderProfile = typeof providerProfiles.$inferSelect;
export type InsertProviderProfile = typeof providerProfiles.$inferInsert;

// Provider Performance Metrics table
export const providerPerformanceMetrics = mysqlTable("providerPerformanceMetrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  period: mysqlEnum("period", ["daily", "weekly", "monthly", "yearly"]).notNull(),
  decisionsLogged: int("decisionsLogged").default(0),
  diagnosticAccuracy: decimal("diagnosticAccuracy", { precision: 5, scale: 2 }).default("0"), // 0-100%
  avgDecisionTime: int("avgDecisionTime"), // seconds
  protocolAdherence: decimal("protocolAdherence", { precision: 5, scale: 2 }).default("0"), // 0-100%
  patientSurvivalRate: decimal("patientSurvivalRate", { precision: 5, scale: 2 }).default("0"), // 0-100%
  livesSavedCount: int("livesSavedCount").default(0),
  patientsMonitoredCount: int("patientsMonitoredCount").default(0),
  coursesCompleted: int("coursesCompleted").default(0),
  certificationsEarned: int("certificationsEarned").default(0),
  referralsMade: int("referralsMade").default(0),
  earnings: int("earnings").default(0), // in cents (KES)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProviderPerformanceMetric = typeof providerPerformanceMetrics.$inferSelect;
export type InsertProviderPerformanceMetric = typeof providerPerformanceMetrics.$inferInsert;


// ============ PHASE A: VITAL SIGNS & INTERVENTION TRACKING ============

// Vital Signs History table - Track all vital sign measurements with timestamps
export const vitalSignsHistory = mysqlTable("vitalSignsHistory", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  userId: int("userId").notNull(), // Provider who recorded
  heartRate: int("heartRate"), // beats per minute
  respiratoryRate: int("respiratoryRate"), // breaths per minute
  systolicBP: int("systolicBP"), // mmHg
  diastolicBP: int("diastolicBP"), // mmHg
  oxygenSaturation: int("oxygenSaturation"), // percentage (0-100)
  temperature: decimal("temperature", { precision: 5, scale: 2 }), // Celsius
  weight: decimal("weight", { precision: 6, scale: 2 }), // kg
  height: decimal("height", { precision: 6, scale: 2 }), // cm
  age: int("age"), // years
  ageMonths: int("ageMonths"), // additional months for infants
  riskScore: int("riskScore"), // 0-100 calculated risk score
  riskLevel: mysqlEnum("riskLevel", ["CRITICAL", "HIGH", "MEDIUM", "LOW"]).notNull(),
  symptoms: text("symptoms"), // JSON array of symptoms
  notes: text("notes"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VitalSignsHistory = typeof vitalSignsHistory.$inferSelect;
export type InsertVitalSignsHistory = typeof vitalSignsHistory.$inferInsert;

// Reference Ranges table - Age-weight-based normal ranges for vital signs
export const referenceRanges = mysqlTable("referenceRanges", {
  id: int("id").autoincrement().primaryKey(),
  ageMin: int("ageMin"), // years
  ageMax: int("ageMax"), // years
  weightMin: decimal("weightMin", { precision: 6, scale: 2 }), // kg
  weightMax: decimal("weightMax", { precision: 6, scale: 2 }), // kg
  heartRateMin: int("heartRateMin"),
  heartRateMax: int("heartRateMax"),
  respiratoryRateMin: int("respiratoryRateMin"),
  respiratoryRateMax: int("respiratoryRateMax"),
  systolicBPMin: int("systolicBPMin"),
  systolicBPMax: int("systolicBPMax"),
  diastolicBPMin: int("diastolicBPMin"),
  diastolicBPMax: int("diastolicBPMax"),
  oxygenSaturationMin: int("oxygenSaturationMin"),
  temperatureMin: decimal("temperatureMin", { precision: 5, scale: 2 }),
  temperatureMax: decimal("temperatureMax", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReferenceRange = typeof referenceRanges.$inferSelect;
export type InsertReferenceRange = typeof referenceRanges.$inferInsert;

// Intervention Log table - Track all interventions (medications, procedures, monitoring)
export const interventionLog = mysqlTable("interventionLog", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  userId: int("userId").notNull(), // Provider who performed intervention
  interventionType: mysqlEnum("interventionType", ["medication", "procedure", "monitoring", "referral", "other"]).notNull(),
  interventionName: varchar("interventionName", { length: 255 }).notNull(), // e.g., "Epinephrine", "IV insertion"
  dosage: varchar("dosage", { length: 100 }), // e.g., "0.01 mg/kg"
  route: varchar("route", { length: 100 }), // e.g., "IV", "IM", "PO"
  indication: text("indication"), // Why this intervention was given
  outcome: varchar("outcome", { length: 255 }), // e.g., "successful", "failed", "pending"
  notes: text("notes"),
  performedAt: timestamp("performedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InterventionLog = typeof interventionLog.$inferSelect;
export type InsertInterventionLog = typeof interventionLog.$inferInsert;

// Risk Score History table - Track risk score changes over time
export const riskScoreHistory = mysqlTable("riskScoreHistory", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  vitalSignsHistoryId: int("vitalSignsHistoryId").notNull(),
  riskScore: int("riskScore"), // 0-100
  riskLevel: mysqlEnum("riskLevel", ["CRITICAL", "HIGH", "MEDIUM", "LOW"]).notNull(),
  riskFactors: text("riskFactors"), // JSON array of factors contributing to risk
  deteriorationPattern: varchar("deteriorationPattern", { length: 100 }), // e.g., "stable", "improving", "deteriorating"
  timeToDeterioration: int("timeToDeterioration"), // hours until predicted deterioration
  recommendations: text("recommendations"), // JSON array of recommended actions
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RiskScoreHistory = typeof riskScoreHistory.$inferSelect;
export type InsertRiskScoreHistory = typeof riskScoreHistory.$inferInsert;


// CPR Clock Sessions table - Track CPR sessions for each patient
export const cprSessions = mysqlTable("cprSessions", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  providerId: int("providerId").notNull(),
  startTime: timestamp("startTime").defaultNow().notNull(),
  endTime: timestamp("endTime"),
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).default("active").notNull(),
  outcome: mysqlEnum("outcome", ["ROSC", "pCOSCA", "mortality", "ongoing"]).default("ongoing"),
  totalDuration: int("totalDuration"), // seconds
  cprQuality: mysqlEnum("cprQuality", ["excellent", "good", "adequate", "poor"]),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CprSession = typeof cprSessions.$inferSelect;
export type InsertCprSession = typeof cprSessions.$inferInsert;

// CPR Clock Events table - Track individual events during CPR (compressions, medications, etc.)
export const cprEvents = mysqlTable("cprEvents", {
  id: int("id").autoincrement().primaryKey(),
  cprSessionId: int("cprSessionId").notNull(),
  eventType: mysqlEnum("eventType", ["compression_cycle", "medication", "defibrillation", "airway", "note", "outcome"]).notNull(),
  eventTime: int("eventTime"), // seconds from start of CPR
  description: text("description"),
  value: varchar("value", { length: 255 }), // e.g., compression rate, medication name
  metadata: text("metadata"), // JSON object for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CprEvent = typeof cprEvents.$inferSelect;
export type InsertCprEvent = typeof cprEvents.$inferInsert;

// Medications table - Pediatric emergency medications with weight-based dosing
export const emergencyMedications = mysqlTable("emergencyMedications", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Epinephrine"
  category: mysqlEnum("category", ["vasopressor", "antiarrhythmic", "sedative", "paralytic", "reversal", "other"]).notNull(),
  dosagePerKg: decimal("dosagePerKg", { precision: 10, scale: 3 }), // mg/kg
  maxDose: decimal("maxDose", { precision: 10, scale: 3 }), // maximum dose in mg
  route: mysqlEnum("route", ["IV", "IO", "IM", "ET", "IN"]).notNull(),
  concentration: varchar("concentration", { length: 100 }), // e.g., "1:10000"
  interval: int("interval"), // seconds between doses (e.g., 300 for q5min)
  indication: text("indication"), // when to use this medication
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmergencyMedication = typeof emergencyMedications.$inferSelect;
export type InsertEmergencyMedication = typeof emergencyMedications.$inferInsert;

// Medication Administration Log table - Track medications given during CPR
export const medicationLog = mysqlTable("medicationLog", {
  id: int("id").autoincrement().primaryKey(),
  cprSessionId: int("cprSessionId").notNull(),
  medicationId: int("medicationId").notNull(),
  administeredAt: int("administeredAt"), // seconds from start of CPR
  dose: decimal("dose", { precision: 10, scale: 3 }), // actual dose given in mg
  dosePerKg: decimal("dosePerKg", { precision: 10, scale: 3 }), // calculated dose per kg
  route: mysqlEnum("route", ["IV", "IO", "IM", "ET", "IN"]).notNull(),
  administeredBy: int("administeredBy"), // provider ID
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MedicationLog = typeof medicationLog.$inferSelect;
export type InsertMedicationLog = typeof medicationLog.$inferInsert;

// Defibrillator Events table - Track defibrillation attempts
export const defibrillatorEvents = mysqlTable("defibrillatorEvents", {
  id: int("id").autoincrement().primaryKey(),
  cprSessionId: int("cprSessionId").notNull(),
  eventTime: int("eventTime"), // seconds from start of CPR
  rhythm: mysqlEnum("rhythm", ["VF", "pulseless_VT", "asystole", "PEA", "sinus", "unknown"]).notNull(),
  shockDelivered: boolean("shockDelivered").default(false),
  energyLevel: int("energyLevel"), // joules (e.g., 2, 4, 8 J/kg)
  energyPerKg: decimal("energyPerKg", { precision: 10, scale: 3 }), // J/kg
  outcome: mysqlEnum("outcome", ["ROSC", "no_change", "deterioration"]),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DefibrillatorEvent = typeof defibrillatorEvents.$inferSelect;
export type InsertDefibrillatorEvent = typeof defibrillatorEvents.$inferInsert;

// CPR Protocols table - Store standard CPR protocols by age group
export const cprProtocols = mysqlTable("cprProtocols", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Infant CPR", "Pediatric CPR"
  ageMin: int("ageMin"), // months
  ageMax: int("ageMax"), // months
  weightMin: decimal("weightMin", { precision: 10, scale: 3 }), // kg
  weightMax: decimal("weightMax", { precision: 10, scale: 3 }), // kg
  compressionRate: varchar("compressionRate", { length: 100 }), // e.g., "100-120 bpm"
  compressionDepth: varchar("compressionDepth", { length: 100 }), // e.g., "4-5 cm"
  ventilationRate: varchar("ventilationRate", { length: 100 }), // e.g., "12-20 breaths/min"
  handPosition: text("handPosition"), // description of hand position
  paddleSize: varchar("paddleSize", { length: 100 }), // e.g., "Pediatric pads"
  initialEnergy: int("initialEnergy"), // joules
  subsequentEnergy: int("subsequentEnergy"), // joules
  medications: text("medications"), // JSON array of recommended medications
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CprProtocol = typeof cprProtocols.$inferSelect;
export type InsertCprProtocol = typeof cprProtocols.$inferInsert;


// Emergency Protocols table - Store clinical protocols for common pediatric emergencies
export const emergencyProtocols = mysqlTable("emergencyProtocols", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Severe Diarrhea", "Pneumonia", "Malaria", "Meningitis", "Shock"
  category: mysqlEnum("category", ["diarrhea", "pneumonia", "malaria", "meningitis", "shock"]).notNull(),
  description: text("description"),
  ageMin: int("ageMin"), // months
  ageMax: int("ageMax"), // months
  severity: mysqlEnum("severity", ["mild", "moderate", "severe", "critical"]),
  estimatedMortality: decimal("estimatedMortality", { precision: 5, scale: 2 }), // percentage
  keySymptoms: text("keySymptoms"), // JSON array of symptoms
  redFlags: text("redFlags"), // JSON array of danger signs
  diagnosticCriteria: text("diagnosticCriteria"), // JSON object with criteria
  initialAssessment: text("initialAssessment"), // Initial steps to take
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmergencyProtocol = typeof emergencyProtocols.$inferSelect;
export type InsertEmergencyProtocol = typeof emergencyProtocols.$inferInsert;

// Protocol Steps table - Store individual steps within each protocol
export const protocolSteps = mysqlTable("protocolSteps", {
  id: int("id").autoincrement().primaryKey(),
  protocolId: int("protocolId").notNull(),
  stepNumber: int("stepNumber").notNull(), // 1, 2, 3, etc.
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  action: text("action"), // What the provider should do
  expectedOutcome: text("expectedOutcome"), // What should happen after this step
  timeframe: varchar("timeframe", { length: 100 }), // e.g., "Immediately", "Within 5 minutes"
  vitalSignThreshold: text("vitalSignThreshold"), // JSON object with vital sign criteria
  nextStepIfYes: int("nextStepIfYes"), // Protocol step ID if condition met
  nextStepIfNo: int("nextStepIfNo"), // Protocol step ID if condition not met
  medications: text("medications"), // JSON array of medications for this step
  investigations: text("investigations"), // JSON array of tests/investigations
  warnings: text("warnings"), // JSON array of warnings/contraindications
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProtocolStep = typeof protocolSteps.$inferSelect;
export type InsertProtocolStep = typeof protocolSteps.$inferInsert;

// Protocol Adherence Log table - Track provider adherence to protocols
export const protocolAdherenceLog = mysqlTable("protocolAdherenceLog", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  providerId: int("providerId").notNull(),
  protocolId: int("protocolId").notNull(),
  startTime: timestamp("startTime").defaultNow().notNull(),
  endTime: timestamp("endTime"),
  status: mysqlEnum("status", ["started", "in_progress", "completed", "abandoned"]).default("started"),
  stepsCompleted: int("stepsCompleted").default(0),
  totalSteps: int("totalSteps"),
  adherenceScore: decimal("adherenceScore", { precision: 5, scale: 2 }), // 0-100%
  deviations: text("deviations"), // JSON array of protocol deviations
  outcome: mysqlEnum("outcome", ["improved", "stable", "deteriorated", "transferred", "unknown"]),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProtocolAdherenceLog = typeof protocolAdherenceLog.$inferSelect;
export type InsertProtocolAdherenceLog = typeof protocolAdherenceLog.$inferInsert;

// Protocol Decision Points table - Store decision trees within protocols
export const protocolDecisionPoints = mysqlTable("protocolDecisionPoints", {
  id: int("id").autoincrement().primaryKey(),
  protocolId: int("protocolId").notNull(),
  stepId: int("stepId").notNull(),
  question: text("question").notNull(), // e.g., "Is child having seizures?"
  yesAction: text("yesAction"), // What to do if yes
  noAction: text("noAction"), // What to do if no
  yesNextStep: int("yesNextStep"), // Next step ID if yes
  noNextStep: int("noNextStep"), // Next step ID if no
  vitalSignCriteria: text("vitalSignCriteria"), // JSON object with vital sign thresholds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProtocolDecisionPoint = typeof protocolDecisionPoints.$inferSelect;
export type InsertProtocolDecisionPoint = typeof protocolDecisionPoints.$inferInsert;

// Protocol Recommendations table - AI-generated protocol recommendations based on patient data
export const protocolRecommendations = mysqlTable("protocolRecommendations", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  providerId: int("providerId").notNull(),
  protocolId: int("protocolId").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // 0-100%
  matchingSymptoms: text("matchingSymptoms"), // JSON array of matching symptoms
  matchingVitalSigns: text("matchingVitalSigns"), // JSON array of matching vital signs
  reasoning: text("reasoning"), // Why this protocol is recommended
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("medium"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProtocolRecommendation = typeof protocolRecommendations.$inferSelect;
export type InsertProtocolRecommendation = typeof protocolRecommendations.$inferInsert;


// ============================================================================
// REAL-TIME ALERTS & NOTIFICATIONS
// ============================================================================

export const alertConfigurations = mysqlTable("alertConfigurations", {
  id: int("id").primaryKey().autoincrement(),
  providerId: varchar("providerId", { length: 255 }).notNull(),
  alertType: mysqlEnum("alertType", [
    "critical_risk_score",
    "vital_sign_change",
    "patient_deterioration",
    "intervention_reminder",
    "protocol_recommendation",
    "peer_comparison",
    "learning_milestone",
  ]).notNull(),
  riskScoreThreshold: int("riskScoreThreshold").default(70), // Alert when risk score > threshold
  vitalSignThresholds: text("vitalSignThresholds"), // JSON: {heartRate: {min, max}, temp: {min, max}, ...}
  enabled: boolean("enabled").default(true),
  soundEnabled: boolean("soundEnabled").default(true),
  vibrationEnabled: boolean("vibrationEnabled").default(true),
  pushNotificationEnabled: boolean("pushNotificationEnabled").default(true),
  emailNotificationEnabled: boolean("emailNotificationEnabled").default(false),
  quietHoursStart: varchar("quietHoursStart", { length: 5 }), // HH:MM format
  quietHoursEnd: varchar("quietHoursEnd", { length: 5 }), // HH:MM format
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type AlertConfiguration = typeof alertConfigurations.$inferSelect;
export type InsertAlertConfiguration = typeof alertConfigurations.$inferInsert;

export const alerts = mysqlTable("alerts", {
  id: int("id").primaryKey().autoincrement(),
  patientId: int("patientId").notNull(),
  providerId: varchar("providerId", { length: 255 }).notNull(),
  alertType: mysqlEnum("alertType", [
    "critical_risk_score",
    "vital_sign_change",
    "patient_deterioration",
    "intervention_reminder",
    "protocol_recommendation",
    "peer_comparison",
    "learning_milestone",
  ]).notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  data: text("data"), // JSON: additional context (vital signs, risk score, etc.)
  isRead: boolean("isRead").default(false),
  isAcknowledged: boolean("isAcknowledged").default(false),
  acknowledgedAt: timestamp("acknowledgedAt"),
  actionTaken: varchar("actionTaken", { length: 255 }), // What action provider took
  actionTakenAt: timestamp("actionTakenAt"),
  status: mysqlEnum("status", ["pending", "delivered", "read", "acknowledged", "dismissed"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // Alert expires after this time
});
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

export const alertDeliveryLog = mysqlTable("alertDeliveryLog", {
  id: int("id").primaryKey().autoincrement(),
  alertId: int("alertId").notNull(),
  deliveryMethod: mysqlEnum("deliveryMethod", [
    "push_notification",
    "email",
    "sms",
    "in_app",
    "websocket",
  ]).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "delivered", "failed"]).default("pending"),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AlertDeliveryLog = typeof alertDeliveryLog.$inferSelect;
export type InsertAlertDeliveryLog = typeof alertDeliveryLog.$inferInsert;

export const alertSubscriptions = mysqlTable("alertSubscriptions", {
  id: int("id").primaryKey().autoincrement(),
  providerId: varchar("providerId", { length: 255 }).notNull(),
  patientId: int("patientId").notNull(),
  subscriptionType: mysqlEnum("subscriptionType", [
    "all_alerts",
    "critical_only",
    "vital_signs_only",
    "protocol_only",
  ]).default("all_alerts"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type AlertSubscription = typeof alertSubscriptions.$inferSelect;
export type InsertAlertSubscription = typeof alertSubscriptions.$inferInsert;

export const alertHistory = mysqlTable("alertHistory", {
  id: int("id").primaryKey().autoincrement(),
  providerId: varchar("providerId", { length: 255 }).notNull(),
  alertsReceivedToday: int("alertsReceivedToday").default(0),
  alertsAcknowledgedToday: int("alertsAcknowledgedToday").default(0),
  criticalAlertsToday: int("criticalAlertsToday").default(0),
  averageResponseTime: int("averageResponseTime"), // milliseconds
  lastAlertTime: timestamp("lastAlertTime"),
  dateField: date("date").notNull(),
});
export type AlertHistory = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = typeof alertHistory.$inferInsert;

export const alertStatistics = mysqlTable("alertStatistics", {
  id: int("id").primaryKey().autoincrement(),
  providerId: varchar("providerId", { length: 255 }).notNull(),
  alertType: varchar("alertType", { length: 100 }).notNull(),
  totalAlerts: int("totalAlerts").default(0),
  acknowledgedAlerts: int("acknowledgedAlerts").default(0),
  dismissedAlerts: int("dismissedAlerts").default(0),
  actionTakenAlerts: int("actionTakenAlerts").default(0),
  averageTimeToAcknowledge: int("averageTimeToAcknowledge"), // milliseconds
  period: mysqlEnum("period", ["daily", "weekly", "monthly"]).notNull(),
  dateField: date("date").notNull(),
});
export type AlertStatistics = typeof alertStatistics.$inferSelect;
export type InsertAlertStatistics = typeof alertStatistics.$inferInsert;


// ============================================================================
// DIFFERENTIAL DIAGNOSIS ENGINE
// ============================================================================

export const medicalConditions = mysqlTable("medicalConditions", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icdCode: varchar("icdCode", { length: 20 }), // ICD-10 code
  category: mysqlEnum("category", [
    "infectious",
    "nutritional",
    "metabolic",
    "cardiovascular",
    "respiratory",
    "gastrointestinal",
    "neurological",
    "endocrine",
    "hematologic",
    "other",
  ]).notNull(),
  severity: mysqlEnum("severity", ["mild", "moderate", "severe", "critical"]).default("moderate"),
  prevalence: varchar("prevalence", { length: 50 }), // e.g., "common", "rare"
  ageGroupsAffected: text("ageGroupsAffected"), // JSON array: ["0-1", "1-3", "3-6", "6-12", "12-18"]
  commonSymptoms: text("commonSymptoms"), // JSON array of symptom IDs
  criticalVitalSigns: text("criticalVitalSigns"), // JSON: {heartRate: {min, max}, temp: {min, max}, ...}
  treatmentApproach: text("treatmentApproach"),
  emergencyActions: text("emergencyActions"), // JSON array of emergency steps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type MedicalCondition = typeof medicalConditions.$inferSelect;
export type InsertMedicalCondition = typeof medicalConditions.$inferInsert;

export const symptoms = mysqlTable("symptoms", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "fever",
    "cough",
    "diarrhea",
    "vomiting",
    "rash",
    "lethargy",
    "seizure",
    "difficulty_breathing",
    "abdominal_pain",
    "other",
  ]).notNull(),
  severity: mysqlEnum("severity", ["mild", "moderate", "severe"]).default("mild"),
  duration: varchar("duration", { length: 100 }), // e.g., "acute", "chronic"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Symptom = typeof symptoms.$inferSelect;
export type InsertSymptom = typeof symptoms.$inferInsert;

export const conditionSymptomMapping = mysqlTable("conditionSymptomMapping", {
  id: int("id").primaryKey().autoincrement(),
  conditionId: int("conditionId").notNull(),
  symptomId: int("symptomId").notNull(),
  frequency: mysqlEnum("frequency", ["always", "often", "sometimes", "rare"]).default("often"),
  importance: int("importance").default(50), // 0-100 weight for diagnosis scoring
});
export type ConditionSymptomMapping = typeof conditionSymptomMapping.$inferSelect;
export type InsertConditionSymptomMapping = typeof conditionSymptomMapping.$inferInsert;

export const diagnosisHistory = mysqlTable("diagnosisHistory", {
  id: int("id").primaryKey().autoincrement(),
  patientId: int("patientId").notNull(),
  providerId: varchar("providerId", { length: 255 }).notNull(),
  symptoms: text("symptoms"), // JSON array of symptom IDs
  vitalSigns: text("vitalSigns"), // JSON of vital signs at time of diagnosis
  suggestedConditions: text("suggestedConditions"), // JSON array of suggested conditions with scores
  selectedCondition: int("selectedCondition"), // Condition ID provider selected
  selectedConditionName: varchar("selectedConditionName", { length: 255 }),
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // 0-100
  aiExplanation: text("aiExplanation"), // LLM explanation of diagnosis
  providerNotes: text("providerNotes"),
  outcome: mysqlEnum("outcome", ["confirmed", "ruled_out", "pending", "unknown"]).default("pending"),
  outcomeCondition: int("outcomeCondition"), // Actual condition if confirmed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type DiagnosisHistory = typeof diagnosisHistory.$inferSelect;
export type InsertDiagnosisHistory = typeof diagnosisHistory.$inferInsert;

export const diagnosisAccuracy = mysqlTable("diagnosisAccuracy", {
  id: int("id").primaryKey().autoincrement(),
  providerId: varchar("providerId", { length: 255 }).notNull(),
  conditionId: int("conditionId").notNull(),
  totalDiagnoses: int("totalDiagnoses").default(0),
  correctDiagnoses: int("correctDiagnoses").default(0),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }).default("0"), // 0-100%
  averageConfidence: decimal("averageConfidence", { precision: 5, scale: 2 }).default("0"),
  period: mysqlEnum("period", ["all_time", "monthly", "quarterly"]).default("all_time"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type DiagnosisAccuracy = typeof diagnosisAccuracy.$inferSelect;
export type InsertDiagnosisAccuracy = typeof diagnosisAccuracy.$inferInsert;

export const differentialDiagnosisScores = mysqlTable("differentialDiagnosisScores", {
  id: int("id").primaryKey().autoincrement(),
  diagnosisHistoryId: int("diagnosisHistoryId").notNull(),
  conditionId: int("conditionId").notNull(),
  conditionName: varchar("conditionName", { length: 255 }),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(), // 0-100
  matchedSymptoms: int("matchedSymptoms").default(0),
  totalSymptoms: int("totalSymptoms").default(0),
  vitalSignMatch: decimal("vitalSignMatch", { precision: 5, scale: 2 }).default("0"), // 0-100
  reasoning: text("reasoning"),
  rank: int("rank"), // 1 = most likely, 2 = second, etc.
});
export type DifferentialDiagnosisScore = typeof differentialDiagnosisScores.$inferSelect;
export type InsertDifferentialDiagnosisScore = typeof differentialDiagnosisScores.$inferInsert;




// Investigation Analysis tables
export const investigations = mysqlTable("investigations", {
  id: int("id").primaryKey().autoincrement(),
  patientId: int("patientId").notNull(),
  providerId: int("providerId").notNull(),
  investigationType: mysqlEnum("investigationType", ["lab", "imaging", "other"]).notNull(),
  testName: varchar("testName", { length: 255 }).notNull(),
  description: text("description"),
  uploadedAt: timestamp("uploadedAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Investigation = typeof investigations.$inferSelect;
export type InsertInvestigation = typeof investigations.$inferInsert;

export const investigationResults = mysqlTable("investigationResults", {
  id: int("id").primaryKey().autoincrement(),
  investigationId: int("investigationId").notNull(),
  resultType: mysqlEnum("resultType", ["numeric", "text", "image", "other"]).notNull(),
  resultName: varchar("resultName", { length: 255 }).notNull(),
  resultValue: text("resultValue"),
  unit: varchar("unit", { length: 100 }),
  normalRange: varchar("normalRange", { length: 255 }),
  isAbnormal: boolean("isAbnormal").default(false),
  severity: mysqlEnum("severity", ["normal", "mild", "moderate", "severe"]).default("normal"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InvestigationResult = typeof investigationResults.$inferSelect;
export type InsertInvestigationResult = typeof investigationResults.$inferInsert;

export const investigationAnalysis = mysqlTable("investigationAnalysis", {
  id: int("id").primaryKey().autoincrement(),
  investigationId: int("investigationId").notNull(),
  aiInterpretation: text("aiInterpretation"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).default("0"), // 0-100
  differentialDiagnoses: text("differentialDiagnoses"), // JSON array
  recommendations: text("recommendations"), // JSON array
  clinicalSignificance: text("clinicalSignificance"),
  followUpSuggestions: text("followUpSuggestions"),
  analyzedAt: timestamp("analyzedAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InvestigationAnalysis = typeof investigationAnalysis.$inferSelect;
export type InsertInvestigationAnalysis = typeof investigationAnalysis.$inferInsert;

export const investigationHistory = mysqlTable("investigationHistory", {
  id: int("id").primaryKey().autoincrement(),
  patientId: int("patientId").notNull(),
  providerId: int("providerId").notNull(),
  testName: varchar("testName", { length: 255 }).notNull(),
  result: text("result"),
  interpretation: text("interpretation"),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InvestigationHistory = typeof investigationHistory.$inferSelect;
export type InsertInvestigationHistory = typeof investigationHistory.$inferInsert;

export const investigationTrends = mysqlTable("investigationTrends", {
  id: int("id").primaryKey().autoincrement(),
  patientId: int("patientId").notNull(),
  testName: varchar("testName", { length: 255 }).notNull(),
  trend: mysqlEnum("trend", ["improving", "stable", "deteriorating"]).notNull(),
  changePercent: decimal("changePercent", { precision: 8, scale: 2 }),
  daysAnalyzed: int("daysAnalyzed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InvestigationTrend = typeof investigationTrends.$inferSelect;
export type InsertInvestigationTrend = typeof investigationTrends.$inferInsert;


// ============================================
// PERFORMANCE DASHBOARD TABLES
// ============================================

// Provider Statistics Table
export const providerStats = mysqlTable("providerStats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalPatientsServed: int("totalPatientsServed").default(0),
  totalInterventions: int("totalInterventions").default(0),
  averageResponseTime: decimal("averageResponseTime", { precision: 10, scale: 2 }).default("0"), // in minutes
  successRate: decimal("successRate", { precision: 5, scale: 2 }).default("0"), // percentage 0-100
  patientsImproved: int("patientsImproved").default(0),
  certificationsCompleted: int("certificationsCompleted").default(0),
  trainingHoursCompleted: int("trainingHoursCompleted").default(0),
  performanceScore: decimal("performanceScore", { precision: 5, scale: 2 }).default("0"), // 0-100
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ProviderStat = typeof providerStats.$inferSelect;
export type InsertProviderStat = typeof providerStats.$inferInsert;

// Leaderboard Rankings Table
export const leaderboardRankings = mysqlTable("leaderboardRankings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: varchar("category", { length: 255 }).notNull(), // 'performance', 'interventions', 'patients_served', 'training'
  rank: int("rank").notNull(),
  score: decimal("score", { precision: 10, scale: 2 }).notNull(),
  percentile: decimal("percentile", { precision: 5, scale: 2 }).default("0"), // 0-100
  previousRank: int("previousRank"),
  rankChange: int("rankChange").default(0), // positive = improvement
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LeaderboardRanking = typeof leaderboardRankings.$inferSelect;
export type InsertLeaderboardRanking = typeof leaderboardRankings.$inferInsert;

// Performance Achievements Table
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementType: varchar("achievementType", { length: 255 }).notNull(), // 'milestone', 'badge', 'certification', 'record'
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 255 }), // emoji or icon reference
  earnedAt: timestamp("earnedAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

// Performance History Table (for trend analysis)
export const performanceHistory = mysqlTable("performanceHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  metricType: varchar("metricType", { length: 255 }).notNull(), // 'success_rate', 'response_time', 'patients_served', etc.
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  recordedAt: timestamp("recordedAt").defaultNow(),
});
export type PerformanceHistoryRecord = typeof performanceHistory.$inferSelect;
export type InsertPerformanceHistoryRecord = typeof performanceHistory.$inferInsert;

// Team Performance Table (for institutional comparisons)
export const teamPerformance = mysqlTable("teamPerformance", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull().unique(),
  teamName: varchar("teamName", { length: 255 }),
  totalStaffCount: int("totalStaffCount").default(0),
  averagePerformanceScore: decimal("averagePerformanceScore", { precision: 5, scale: 2 }).default("0"),
  totalPatientsServed: int("totalPatientsServed").default(0),
  totalInterventions: int("totalInterventions").default(0),
  teamRank: int("teamRank"),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TeamPerformance = typeof teamPerformance.$inferSelect;
export type InsertTeamPerformance = typeof teamPerformance.$inferInsert;

// Real-time Performance Events Table
export const performanceEvents = mysqlTable("performanceEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventType: varchar("eventType", { length: 255 }).notNull(), // 'intervention_completed', 'patient_improved', 'training_completed', etc.
  eventData: text("eventData"), // JSON stringified
  severity: varchar("severity", { length: 50 }), // 'info', 'warning', 'critical'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PerformanceEvent = typeof performanceEvents.$inferSelect;
export type InsertPerformanceEvent = typeof performanceEvents.$inferInsert;


// ============================================================================
// PARENT SAFE-TRUTH REPORTING SYSTEM
// ============================================================================

// Parent Safe-Truth Events Table
export const parentSafeTruthEvents = mysqlTable("parentSafeTruthEvents", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull(),
  eventType: mysqlEnum("eventType", [
    "arrival",
    "symptoms",
    "doctor-seen",
    "intervention",
    "oxygen",
    "communication",
    "fluids",
    "concern-raised",
    "monitoring",
    "medication",
    "referral-decision",
    "referral-organized",
    "transferred",
    "update",
  ]).notNull(),
  eventTime: timestamp("eventTime").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ParentSafeTruthEvent = typeof parentSafeTruthEvents.$inferSelect;
export type InsertParentSafeTruthEvent = typeof parentSafeTruthEvents.$inferInsert;

// Parent Safe-Truth Submissions Table
export const parentSafeTruthSubmissions = mysqlTable("parentSafeTruthSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  hospitalId: int("hospitalId"),
  childName: varchar("childName", { length: 255 }),
  childAge: int("childAge"),
  childOutcome: mysqlEnum("childOutcome", ["discharged", "referred", "passed-away"]).notNull(),
  arrivalTime: timestamp("arrivalTime").notNull(),
  dischargeOrReferralTime: timestamp("dischargeOrReferralTime"),
  totalDurationMinutes: int("totalDurationMinutes"),
  communicationGaps: int("communicationGaps").default(0),
  interventionDelays: int("interventionDelays").default(0),
  monitoringGaps: int("monitoringGaps").default(0),
  delayAnalysis: text("delayAnalysis"), // JSON string
  improvements: text("improvements"), // JSON string
  isAnonymous: boolean("isAnonymous").default(true),
  parentName: varchar("parentName", { length: 255 }),
  parentEmail: varchar("parentEmail", { length: 255 }),
  status: mysqlEnum("status", ["draft", "submitted", "reviewed", "archived"]).default("submitted"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ParentSafeTruthSubmission = typeof parentSafeTruthSubmissions.$inferSelect;
export type InsertParentSafeTruthSubmission = typeof parentSafeTruthSubmissions.$inferInsert;

// System Delay Analysis Results Table
export const systemDelayAnalysis = mysqlTable("systemDelayAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull(),
  hospitalId: int("hospitalId").notNull(),
  arrivalToDoctorDelay: int("arrivalToDoctorDelay"),
  doctorToInterventionDelay: int("doctorToInterventionDelay"),
  interventionToMonitoringDelay: int("interventionToMonitoringDelay"),
  communicationDelay: int("communicationDelay"),
  hasMonitoringGap: boolean("hasMonitoringGap").default(false),
  hasCommunicationGap: boolean("hasCommunicationGap").default(false),
  hasInterventionDelay: boolean("hasInterventionDelay").default(false),
  recommendations: text("recommendations"), // JSON array
  improvementAreas: text("improvementAreas"), // JSON array
  severityScore: decimal("severityScore", { precision: 3, scale: 1 }), // 0-10 scale
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SystemDelayAnalysis = typeof systemDelayAnalysis.$inferSelect;
export type InsertSystemDelayAnalysis = typeof systemDelayAnalysis.$inferInsert;

// Hospital Improvement Metrics (aggregated from parent feedback)
export const hospitalImprovementMetrics = mysqlTable("hospitalImprovementMetrics", {
  id: int("id").autoincrement().primaryKey(),
  hospitalId: int("hospitalId").notNull().unique(),
  totalSubmissions: int("totalSubmissions").default(0),
  avgArrivalToDoctorDelay: decimal("avgArrivalToDoctorDelay", { precision: 5, scale: 1 }),
  avgDoctorToInterventionDelay: decimal("avgDoctorToInterventionDelay", { precision: 5, scale: 1 }),
  communicationGapPercentage: decimal("communicationGapPercentage", { precision: 5, scale: 1 }),
  monitoringGapPercentage: decimal("monitoringGapPercentage", { precision: 5, scale: 1 }),
  improvementTrend: mysqlEnum("improvementTrend", ["improving", "stable", "declining"]),
  lastAnalyzedAt: timestamp("lastAnalyzedAt"),
  topImprovementAreas: text("topImprovementAreas"), // JSON array
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HospitalImprovementMetrics = typeof hospitalImprovementMetrics.$inferSelect;
export type InsertHospitalImprovementMetrics = typeof hospitalImprovementMetrics.$inferInsert;


// ============================================================================
// CHAT SUPPORT SYSTEM
// ============================================================================

// Chat Conversations Table
export const chatConversations = mysqlTable("chatConversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentId: int("agentId"),
  topic: mysqlEnum("topic", ["activation_help", "password_reset", "course_enrollment", "payment_issue", "technical_support", "other"]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
  status: mysqlEnum("status", ["open", "assigned", "in_progress", "resolved", "closed"]).default("open"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;

// Chat Messages Table
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId").notNull(),
  senderType: mysqlEnum("senderType", ["user", "agent", "system"]).notNull(),
  content: text("content").notNull(),
  messageType: mysqlEnum("messageType", ["text", "file", "system"]).default("text"),
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// Support Agents Table
export const supportAgents = mysqlTable("supportAgents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentName: varchar("agentName", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["available", "busy", "offline"]).default("offline"),
  activeConversations: int("activeConversations").default(0),
  totalResolved: int("totalResolved").default(0),
  avgResolutionTime: int("avgResolutionTime"), // in minutes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportAgent = typeof supportAgents.$inferSelect;
export type InsertSupportAgent = typeof supportAgents.$inferInsert;

// Canned Responses Table
export const cannedResponses = mysqlTable("cannedResponses", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId"),
  title: varchar("title", { length: 255 }).notNull(),
  shortcut: varchar("shortcut", { length: 50 }).unique(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CannedResponse = typeof cannedResponses.$inferSelect;
export type InsertCannedResponse = typeof cannedResponses.$inferInsert;

// Chat Analytics Table
export const chatAnalytics = mysqlTable("chatAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  totalConversations: int("totalConversations").default(0),
  resolvedConversations: int("resolvedConversations").default(0),
  avgResolutionTime: int("avgResolutionTime"), // in minutes
  avgCustomerSatisfaction: decimal("avgCustomerSatisfaction", { precision: 3, scale: 2 }), // 0-5 scale
  totalMessagesHandled: int("totalMessagesHandled").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatAnalytics = typeof chatAnalytics.$inferSelect;
export type InsertChatAnalytics = typeof chatAnalytics.$inferInsert;
