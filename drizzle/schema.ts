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
