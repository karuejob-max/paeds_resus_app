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
