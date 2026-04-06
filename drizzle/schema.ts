import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date, json, unique } from "drizzle-orm/mysql-core";

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
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  institutionalRole: mysqlEnum("institutionalRole", ["director", "coordinator", "finance_officer", "department_head", "staff_member"]),
  providerType: mysqlEnum("providerType", ["nurse", "doctor", "pharmacist", "paramedic", "lab_tech", "respiratory_therapist", "midwife", "other"]),
  userType: mysqlEnum("userType", ["individual", "institutional", "parent"]).default("individual"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  /** Set by platform admin; user may be assigned as `trainingSchedules.instructorId` for B2B sessions. */
  instructorApprovedAt: timestamp("instructorApprovedAt"),
  /** Unique Paeds Resus instructor ID after completing the Instructor Course (certificate issued). */
  instructorNumber: varchar("instructorNumber", { length: 32 }).unique(),
  instructorCertifiedAt: timestamp("instructorCertifiedAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Password reset tokens (for "forgot password" flow; expire after 24h)
export const passwordResetTokens = mysqlTable("passwordResetTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// Enrollments table
export const enrollments = mysqlTable("enrollments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** When set, PALS learning path is limited to this catalog course (micro-course SKU). */
  courseId: int("courseId"),
  programType: mysqlEnum("programType", ["bls", "acls", "pals", "fellowship", "instructor"]).notNull(),
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
  // MPESA-4: Idempotency key to prevent duplicate webhook processing
  idempotencyKey: varchar("idempotencyKey", { length: 255 }).unique(),
  // MPESA-4: Webhook processing status
  webhookProcessed: boolean("webhookProcessed").default(false),
  webhookProcessedAt: timestamp("webhookProcessedAt"),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending"),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// Care Signal Events table
export const careSignalEvents = mysqlTable("careSignalEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  eventDate: timestamp("eventDate").notNull(),
  childAge: int("childAge").notNull(),
  eventType: varchar("eventType", { length: 255 }).notNull(),
  presentation: text("presentation").notNull(),
  isAnonymous: boolean("isAnonymous").default(false).notNull(),
  chainOfSurvival: text("chainOfSurvival").notNull(),
  systemGaps: text("systemGaps").notNull(),
  gapDetails: text("gapDetails").notNull(),
  outcome: varchar("outcome", { length: 512 }).notNull(),
  neurologicalStatus: varchar("neurologicalStatus", { length: 512 }).notNull(),
  status: varchar("status", { length: 32 }).default("submitted").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CareSignalEventRow = typeof careSignalEvents.$inferSelect;
export type InsertCareSignalEvent = typeof careSignalEvents.$inferInsert;

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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearnerProgress = typeof learnerProgress.$inferSelect;
export type InsertLearnerProgress = typeof learnerProgress.$inferInsert;

// Certificates table
export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  enrollmentId: int("enrollmentId").notNull(),
  programType: mysqlEnum("programType", ["bls", "acls", "pals", "fellowship", "instructor"]).notNull(),
  certificateNumber: varchar("certificateNumber", { length: 64 }).notNull().unique(),
  verificationCode: varchar("verificationCode", { length: 64 }).notNull().unique(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  certificateUrl: text("certificateUrl"),
  renewalReminderSentAt: timestamp("renewalReminderSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

// Training Schedules table
export const trainingSchedules = mysqlTable("trainingSchedules", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  instructorId: int("instructorId").notNull(),
  programType: mysqlEnum("programType", ["bls", "acls", "pals", "fellowship", "instructor"]).notNull(),
  trainingDate: timestamp("trainingDate").notNull(),
  location: varchar("location", { length: 255 }),
  maxParticipants: int("maxParticipants").default(30),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrainingSchedule = typeof trainingSchedules.$inferSelect;
export type InsertTrainingSchedule = typeof trainingSchedules.$inferInsert;

// Training Participants table
export const trainingParticipants = mysqlTable("trainingParticipants", {
  id: int("id").autoincrement().primaryKey(),
  trainingScheduleId: int("trainingScheduleId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["registered", "attended", "absent", "completed"]).default("registered"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrainingParticipant = typeof trainingParticipants.$inferSelect;
export type InsertTrainingParticipant = typeof trainingParticipants.$inferInsert;

// Courses table (legacy BLS/ACLS/PALS)
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  programType: mysqlEnum("programType", ["bls", "acls", "pals", "fellowship", "instructor"]).notNull(),
  duration: int("duration"), // in minutes
  price: int("price"), // in cents (KES)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

// Course Modules table
export const courseModules = mysqlTable("courseModules", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content"),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = typeof courseModules.$inferInsert;

// Course Quizzes table
export const courseQuizzes = mysqlTable("courseQuizzes", {
  id: int("id").autoincrement().primaryKey(),
  courseModuleId: int("courseModuleId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  passingScore: int("passingScore").default(80),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourseQuiz = typeof courseQuizzes.$inferSelect;
export type InsertCourseQuiz = typeof courseQuizzes.$inferInsert;

// Quiz Questions table
export const quizQuestions = mysqlTable("quizQuestions", {
  id: int("id").autoincrement().primaryKey(),
  courseQuizId: int("courseQuizId").notNull(),
  questionText: text("questionText").notNull(),
  questionType: mysqlEnum("questionType", ["multiple_choice", "true_false", "short_answer"]).notNull(),
  correctAnswer: text("correctAnswer").notNull(),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;

// Quiz Answers table
export const quizAnswers = mysqlTable("quizAnswers", {
  id: int("id").autoincrement().primaryKey(),
  quizQuestionId: int("quizQuestionId").notNull(),
  userId: int("userId").notNull(),
  enrollmentId: int("enrollmentId").notNull(),
  userAnswer: text("userAnswer").notNull(),
  isCorrect: boolean("isCorrect").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type InsertQuizAnswer = typeof quizAnswers.$inferInsert;

// ResusGPS Sessions table
export const resusSessionRecords = mysqlTable("resusSessionRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  pathwayId: varchar("pathwayId", { length: 64 }).notNull(),
  sessionStartTime: timestamp("sessionStartTime").notNull(),
  sessionEndTime: timestamp("sessionEndTime"),
  durationSeconds: int("durationSeconds"),
  data: json("data"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResusSessionRecord = typeof resusSessionRecords.$inferSelect;
export type InsertResusSessionRecord = typeof resusSessionRecords.$inferInsert;

// Streak Records table
export const streakRecords = mysqlTable("streakRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  streakType: varchar("streakType", { length: 50 }).notNull(),
  currentStreak: int("currentStreak").default(0),
  longestStreak: int("longestStreak").default(0),
  lastActivityDate: timestamp("lastActivityDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StreakRecord = typeof streakRecords.$inferSelect;
export type InsertStreakRecord = typeof streakRecords.$inferInsert;

// Clinical Referrals table
export const clinicalReferrals = mysqlTable("clinicalReferrals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  resusSessionId: int("resusSessionId"),
  reason: text("reason").notNull(),
  referralType: mysqlEnum("referralType", ["hospital", "specialist", "imaging", "lab"]).notNull(),
  facilityName: varchar("facilityName", { length: 255 }).notNull(),
  /** Optional: receiving facility contact for referral notifications (REF-1). */
  facilityContactEmail: varchar("facilityContactEmail", { length: 320 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "completed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClinicalReferral = typeof clinicalReferrals.$inferSelect;
export type InsertClinicalReferral = typeof clinicalReferrals.$inferInsert;

// Webhook retry queue (for MPESA-6: resilience)
export const webhookRetryQueue = mysqlTable("webhookRetryQueue", {
  id: int("id").autoincrement().primaryKey(),
  webhookType: varchar("webhookType", { length: 50 }).notNull(), // "mpesa_callback", "mpesa_query", etc.
  payload: json("payload").notNull(), // Original webhook payload
  checkoutRequestID: varchar("checkoutRequestID", { length: 255 }), // For M-Pesa
  retryCount: int("retryCount").default(0),
  maxRetries: int("maxRetries").default(5),
  nextRetryAt: timestamp("nextRetryAt"),
  lastError: text("lastError"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "dead_letter"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WebhookRetryQueue = typeof webhookRetryQueue.$inferSelect;
export type InsertWebhookRetryQueue = typeof webhookRetryQueue.$inferInsert;

// Audit Logs - immutable log of all admin actions, auth events, and sensitive data access
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // User who performed the action (nullable for system events)
  action: varchar("action", { length: 50 }).notNull(), // LOGIN, LOGOUT, PASSWORD_CHANGE, USER_CREATE, etc.
  resource: varchar("resource", { length: 50 }).notNull(), // user, course, care_signal, safe_truth, etc.
  resourceId: int("resourceId"), // ID of the resource affected (nullable for system events)
  changes: json("changes"), // JSON object of what changed (for UPDATE operations)
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
  userAgent: text("userAgent"), // Browser/client user agent
  status: mysqlEnum("status", ["success", "failure", "denied"]).notNull(), // Outcome of the action
  errorMessage: text("errorMessage"), // Error details if status is failure/denied
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  archivedAt: timestamp("archivedAt"), // When log was archived (for retention policy)
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ============================================================================
// Micro-Courses System
// ============================================================================

export const microCourses = mysqlTable("microCourses", {
  id: int("id").autoincrement().primaryKey(),
  courseId: varchar("courseId", { length: 64 }).notNull().unique(), // e.g., 'asthma-i', 'septic-shock-ii'
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  level: mysqlEnum("level", ["foundational", "advanced"]).notNull(),
  emergencyType: mysqlEnum("emergencyType", ["respiratory", "shock", "seizure", "toxicology", "metabolic", "infectious", "burns", "trauma", "cardiac", "airway"]).notNull(),
  duration: int("duration").notNull(), // in minutes
  price: int("price").notNull(), // in KES cents (800 KES = 80000 cents)
  prerequisiteId: varchar("prerequisiteId", { length: 64 }), // e.g., 'asthma-i' is prerequisite for 'asthma-ii'
  isRequired: boolean("isRequired").default(true), // true for 26 required courses, false for electives
  courseOrder: int("courseOrder").default(0), // Sort order (1-26 for required, 27+ for electives)
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MicroCourse = typeof microCourses.$inferSelect;
export type InsertMicroCourse = typeof microCourses.$inferInsert;

// Micro-Course Enrollments table
export const microCourseEnrollments = mysqlTable("microCourseEnrollments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  microCourseId: int("microCourseId").notNull(),
  enrollmentStatus: mysqlEnum("enrollmentStatus", ["pending", "active", "completed", "expired"]).default("pending"),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "completed", "free"]).default("pending"),
  paymentId: int("paymentId"), // links to payments table if paid
  progressPercentage: int("progressPercentage").default(0),
  quizScore: int("quizScore"), // percentage (80+ = pass)
  certificateUrl: text("certificateUrl"),
  certificateIssuedAt: timestamp("certificateIssuedAt"),
  completedAt: timestamp("completedAt"),
  startedAt: timestamp("startedAt"), // When learner first accessed the course
  prerequisiteValidated: boolean("prerequisiteValidated").default(false), // true after prerequisite check passes
  prerequisiteCourseId: int("prerequisiteCourseId"), // FK to prerequisite microCourse
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MicroCourseEnrollment = typeof microCourseEnrollments.$inferSelect;
export type InsertMicroCourseEnrollment = typeof microCourseEnrollments.$inferInsert;

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
export const quizQuestionItems = mysqlTable("quizQuestionItems", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  questionText: text("questionText").notNull(),
  questionType: mysqlEnum("questionType", ["multiple_choice", "true_false", "short_answer"]).notNull(),
  correctAnswer: text("correctAnswer").notNull(),
  options: json("options"), // For multiple choice: array of options
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuizQuestionItem = typeof quizQuestionItems.$inferSelect;
export type InsertQuizQuestionItem = typeof quizQuestionItems.$inferInsert;

// Quiz Responses table
export const quizResponses = mysqlTable("quizResponses", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  userId: int("userId").notNull(),
  enrollmentId: int("enrollmentId").notNull(),
  score: int("score"), // percentage (0-100)
  responses: json("responses"), // JSON array of user answers
  passed: boolean("passed").default(false), // true if score >= passingScore
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuizResponse = typeof quizResponses.$inferSelect;
export type InsertQuizResponse = typeof quizResponses.$inferInsert;

// ============================================================================
// Fellowship Qualification System (Phase 1)
// ============================================================================

/**
 * Fellowship Progress Tracking
 * Aggregated status of all 3 pillars (courses, ResusGPS, Care Signal)
 * Updated by background jobs or on-demand queries
 */
export const fellowshipProgress = mysqlTable("fellowshipProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // One row per user
  
  // Pillar A: Course Completion
  pillarA_requiredCourses: int("pillarA_requiredCourses").default(26), // Total required (26 for full fellowship)
  pillarA_completedCourses: int("pillarA_completedCourses").default(0),
  pillarA_percentComplete: int("pillarA_percentComplete").default(0),
  pillarA_status: mysqlEnum("pillarA_status", ["not_started", "in_progress", "complete"]).default("not_started"),
  
  // Pillar B: ResusGPS Cases
  pillarB_requiredConditions: int("pillarB_requiredConditions").default(0), // Calculated from condition mapping
  pillarB_completedConditions: int("pillarB_completedConditions").default(0),
  pillarB_percentComplete: int("pillarB_percentComplete").default(0),
  pillarB_status: mysqlEnum("pillarB_status", ["not_started", "in_progress", "complete"]).default("not_started"),
  
  // Pillar C: Care Signal Monthly Reporting
  pillarC_monthsRequired: int("pillarC_monthsRequired").default(24),
  pillarC_monthsCompleted: int("pillarC_monthsCompleted").default(0),
  pillarC_currentStreak: int("pillarC_currentStreak").default(0),
  pillarC_graceUsedThisYear: int("pillarC_graceUsedThisYear").default(0),
  pillarC_graceRemaining: int("pillarC_graceRemaining").default(2),
  pillarC_nextCatchUpRequired: boolean("pillarC_nextCatchUpRequired").default(false),
  pillarC_status: mysqlEnum("pillarC_status", ["not_started", "in_progress", "complete"]).default("not_started"),
  
  // Overall Fellowship Status
  isFellow: boolean("isFellow").default(false), // true when all 3 pillars complete
  overallStatus: mysqlEnum("overallStatus", ["not_started", "in_progress", "complete"]).default("not_started"),
  estimatedCompletionDate: timestamp("estimatedCompletionDate"),
  
  // Audit
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FellowshipProgress = typeof fellowshipProgress.$inferSelect;
export type InsertFellowshipProgress = typeof fellowshipProgress.$inferInsert;

/**
 * Grace Usage Tracking (Pillar C)
 * Track grace budget per user per calendar year (EAT: Jan-Dec)
 */
export const fellowshipGraceUsage = mysqlTable(
  "fellowshipGraceUsage",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    calendarYear: int("calendarYear").notNull(), // e.g., 2026
    graceUsedCount: int("graceUsedCount").default(0), // 0, 1, or 2
    graceRemaining: int("graceRemaining").default(2), // 2 - graceUsedCount
    
    // Track which months used grace
    graceMonth1: varchar("graceMonth1", { length: 7 }), // 'YYYY-MM' format
    graceMonth2: varchar("graceMonth2", { length: 7 }), // 'YYYY-MM' format
    
    // Catch-up tracking
    catchUpMonthRequired: varchar("catchUpMonthRequired", { length: 7 }), // Month after grace month
    catchUpEventsNeeded: int("catchUpEventsNeeded").default(3), // Must have ≥3 events
    catchUpEventsSubmitted: int("catchUpEventsSubmitted").default(0),
    catchUpStatus: mysqlEnum("catchUpStatus", ["not_required", "in_progress", "passed", "failed"]).default("not_required"),
    
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    uniqueUserYear: unique("unique_user_year").on(table.userId, table.calendarYear),
  })
);

export type FellowshipGraceUsage = typeof fellowshipGraceUsage.$inferSelect;
export type InsertFellowshipGraceUsage = typeof fellowshipGraceUsage.$inferInsert;

/**
 * Streak Reset Audit Trail (Pillar C)
 * Immutable log of when/why a user's Care Signal streak resets
 */
export const fellowshipStreakResets = mysqlTable("fellowshipStreakResets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  resetDate: timestamp("resetDate").defaultNow().notNull(),
  
  // What was lost
  previousStreak: int("previousStreak").notNull(),
  monthsLost: int("monthsLost").notNull(), // How many months of progress lost
  
  // Why reset happened
  reason: mysqlEnum("reason", ["third_missed_month", "failed_catch_up", "manual_correction"]).notNull(),
  
  // Context
  missedMonth: varchar("missedMonth", { length: 7 }), // 'YYYY-MM' of the missed month
  graceUsedThisYear: int("graceUsedThisYear"), // Grace budget status at time of reset
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FellowshipStreakReset = typeof fellowshipStreakResets.$inferSelect;
export type InsertFellowshipStreakReset = typeof fellowshipStreakResets.$inferInsert;

/**
 * Extensions to careSignalEvents table (via migration)
 * - eatCalendarMonth: varchar (YYYY-MM) — EAT calendar month for bucketing
 * - graceApplied: boolean (default false) — true if this month counted as grace
 * - catchUpRequired: boolean (default false) — true if catch-up month
 * - catchUpEventsInMonth: int (default 0) — count of events in catch-up month
 * - streakResetDate: timestamp — when streak was reset (if applicable)
 * - monthlyEventCount: int (default 0) — count of valid events in eatCalendarMonth
 */
