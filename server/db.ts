import { eq, desc, and, gte, lte, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import { InsertUser, InsertAdminAuditLog, users, adminAuditLog, passwordResetTokens, enrollments, payments, certificates, institutionalInquiries, smsReminders, learnerProgress, userFeedback, analyticsEvents, experiments, experimentAssignments, performanceMetrics, errorTracking, supportTickets, supportTicketMessages, featureFlags, userCohorts, userCohortMembers, conversionFunnelEvents, npsSurveyResponses, institutionalAccounts, institutionalStaffMembers, quotations, contracts, trainingSchedules, trainingAttendance, certificationExams, incidents, institutionalAnalytics, resusGPSSessions, resusGPSCases, fellowshipProgress, fellowshipGraceUsage, fellowshipStreakResets, InsertResusGPSSession, InsertResusGPSCase, InsertFellowshipProgress, InsertFellowshipGraceUsage, InsertFellowshipStreakReset } from "../drizzle/schema";
import { ENV } from './_core/env';

function createDrizzle(pool: mysql.Pool) {
  return drizzle(pool, { schema, mode: "default" });
}

type Database = ReturnType<typeof createDrizzle>;

let _db: Database | null = null;

// mysql2 expects ssl to be an object (e.g. { rejectUnauthorized: true }), not a boolean.
// Build config from URL and set ssl object when Aiven/cloud SSL is required.
function getConnectionConfig(databaseUrl: string): mysql.PoolOptions {
  const url = new URL(databaseUrl);
  const needsSsl = /ssl-mode=REQUIRED|ssl=true/i.test(databaseUrl) || url.hostname.endsWith(".aivencloud.com");
  const database = url.pathname.replace(/^\//, "") || undefined;
  const config: mysql.PoolOptions = {
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: database || undefined,
  };
  if (needsSsl) {
    // Aiven/cloud often use certs Node doesn't trust by default; still use SSL but allow connection
    config.ssl = { rejectUnauthorized: false };
  }
  return config;
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      console.log('[Database] Attempting to connect...');
      const config = getConnectionConfig(process.env.DATABASE_URL);
      console.log('[Database] Connection config:', { host: config.host, user: config.user, database: config.database });
      const pool = mysql.createPool(config);
      console.log('[Database] Pool created');
      _db = createDrizzle(pool);
      console.log('[Database] Drizzle instance created successfully');
    } catch (error) {
      console.error("[Database] Failed to connect:", error instanceof Error ? error.message : String(error));
      _db = null;
    }
  } else if (!process.env.DATABASE_URL) {
    console.error('[Database] DATABASE_URL not set in environment');
  }
  return _db;
}

// Export a typed db facade for legacy synchronous imports.
export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    if (!_db) {
      throw new Error("Database client not initialized. Use getDb() in async flows before accessing db.");
    }
    return Reflect.get(_db, prop, receiver);
  },
}) as Database;

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  try {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/Unknown column|ER_BAD_FIELD_ERROR/i.test(msg)) throw err;
    console.warn("[DB] users schema drift detected on getUserByOpenId; using legacy-compatible projection.");
    const fallback = await db
      .select({
        id: users.id,
        openId: users.openId,
        name: users.name,
        email: users.email,
        loginMethod: users.loginMethod,
        passwordHash: users.passwordHash,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .where(eq(users.openId, openId))
      .limit(1);
    const row = fallback[0];
    if (!row) return undefined;
    return {
      ...row,
      phone: null,
      institutionalRole: null,
      providerType: null,
      userType: "individual" as const,
      instructorApprovedAt: null,
      instructorNumber: null,
      instructorCertifiedAt: null,
      resusGpsAccessExpiresAt: null,
    };
  }
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/Unknown column|ER_BAD_FIELD_ERROR/i.test(msg)) throw err;
    console.warn("[DB] users schema drift detected on getUserById; using legacy-compatible projection.");
    const fallback = await db
      .select({
        id: users.id,
        openId: users.openId,
        name: users.name,
        email: users.email,
        loginMethod: users.loginMethod,
        passwordHash: users.passwordHash,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const row = fallback[0];
    if (!row) return undefined;
    return {
      ...row,
      phone: null,
      institutionalRole: null,
      providerType: null,
      userType: "individual" as const,
      instructorApprovedAt: null,
      instructorNumber: null,
      instructorCertifiedAt: null,
      resusGpsAccessExpiresAt: null,
    };
  }
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/Unknown column|ER_BAD_FIELD_ERROR/i.test(msg)) {
      console.warn("[DB] users schema drift detected on getUserByEmail; using legacy-compatible projection.");
      const fallback = await db
        .select({
          id: users.id,
          openId: users.openId,
          name: users.name,
          email: users.email,
          loginMethod: users.loginMethod,
          passwordHash: users.passwordHash,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      const row = fallback[0];
      if (!row) return undefined;
      return {
        ...row,
        phone: null,
        institutionalRole: null,
        providerType: null,
        userType: "individual" as const,
        instructorApprovedAt: null,
        instructorNumber: null,
        instructorCertifiedAt: null,
        resusGpsAccessExpiresAt: null,
      };
    }
    throw err;
  }
}

export async function createUserWithPassword(data: {
  openId: string;
  email: string;
  name: string | null;
  passwordHash: string;
  userType?: "individual" | "institutional" | "parent";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(users).values({
    openId: data.openId,
    email: data.email,
    name: data.name,
    loginMethod: "email",
    passwordHash: data.passwordHash,
    userType: data.userType ?? "individual",
  });
}

export async function updateUserType(userId: number, userType: "individual" | "institutional" | "parent") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ userType, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function createPasswordResetToken(userId: number, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
}

export async function getPasswordResetTokenByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).limit(1);
  return rows[0];
}

export async function deletePasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
}

export async function updateUserPasswordById(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
}

// Enrollment queries
export async function createEnrollment(data: any): Promise<{ id: number } | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(enrollments).values(data);
  const list = await db.select().from(enrollments).where(eq(enrollments.userId, data.userId)).orderBy(desc(enrollments.id)).limit(1);
  return list[0] ?? null;
}

export async function getEnrollmentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(enrollments).where(eq(enrollments.userId, userId));
}

// Payment queries
/** Insert payment row and return its id (same pattern as createEnrollment). */
export async function createPayment(data: {
  enrollmentId: number;
  userId: number;
  amount: number;
  paymentMethod: string;
  transactionId?: string | null;
  status?: string;
  smsConfirmationSent?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
} & Record<string, unknown>): Promise<{ id: number } | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(payments).values(data as any);
  const list = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.enrollmentId, data.enrollmentId), eq(payments.userId, data.userId)))
    .orderBy(desc(payments.id))
    .limit(1);
  return list[0] ?? null;
}

export async function getPaymentsByEnrollmentId(enrollmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(payments).where(eq(payments.enrollmentId, enrollmentId));
}

// Certificate queries
export async function createCertificate(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(certificates).values(data);
}

export async function getCertificateByVerificationCode(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(certificates).where(eq(certificates.verificationCode, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Institutional Inquiry queries
export async function createInstitutionalInquiry(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(institutionalInquiries).values(data);
}

export async function getInstitutionalInquiries() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(institutionalInquiries);
}

// SMS Reminder queries
export async function createSmsReminder(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(smsReminders).values(data);
}

export async function getPendingSmsReminders() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(smsReminders).where(eq(smsReminders.status, "pending"));
}

// Learner Progress queries
export async function createLearnerProgress(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(learnerProgress).values(data);
}

export async function getLearnerProgressByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(learnerProgress).where(eq(learnerProgress.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// User Feedback queries
export async function createUserFeedback(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(userFeedback).values(data);
}

export async function getUserFeedback(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(userFeedback).where(eq(userFeedback.userId, userId));
}

export async function getNewFeedback(limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(userFeedback).where(eq(userFeedback.status, "new")).orderBy(desc(userFeedback.createdAt)).limit(limit);
}

// Analytics Events queries
export async function trackAnalyticsEvent(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(analyticsEvents).values(data);
}

export async function getAnalyticsEventsByUserId(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(analyticsEvents).where(eq(analyticsEvents.userId, userId)).orderBy(desc(analyticsEvents.createdAt)).limit(limit);
}

export async function getAnalyticsEventsBySessionId(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(analyticsEvents).where(eq(analyticsEvents.sessionId, sessionId)).orderBy(desc(analyticsEvents.createdAt));
}

// Admin audit log (Phase 3 security baseline)
export async function insertAdminAuditLog(data: InsertAdminAuditLog): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(adminAuditLog).values(data);
  } catch (e) {
    console.error("[DB] insertAdminAuditLog failed:", e);
  }
}

/**
 * Backward-compatible audit helper used by legacy router callsites.
 * Maps legacy payload shape to adminAuditLog schema fields.
 */
export async function createAuditLog(data: {
  userId: number;
  action: string;
  details?: unknown;
  timestamp?: Date;
}): Promise<void> {
  const inputSummary =
    data.details == null
      ? null
      : typeof data.details === "string"
        ? data.details
        : JSON.stringify(data.details);
  await insertAdminAuditLog({
    adminUserId: data.userId,
    procedurePath: data.action,
    inputSummary,
    createdAt: data.timestamp ?? new Date(),
  });
}

// Experiments queries
export async function createExperiment(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(experiments).values(data);
}

export async function getExperimentByName(name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(experiments).where(eq(experiments.experimentName, name)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getActiveExperiments() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(experiments).where(eq(experiments.status, "running"));
}

// Experiment Assignments queries
export async function assignUserToExperiment(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(experimentAssignments).values(data);
}

export async function getUserExperimentAssignment(experimentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(experimentAssignments).where(and(eq(experimentAssignments.experimentId, experimentId), eq(experimentAssignments.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Performance Metrics queries
export async function recordPerformanceMetric(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(performanceMetrics).values(data);
}

export async function getRecentPerformanceMetrics(limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(performanceMetrics).orderBy(desc(performanceMetrics.createdAt)).limit(limit);
}

export async function getPerformanceMetricsByEndpoint(endpoint: string, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(performanceMetrics).where(eq(performanceMetrics.endpoint, endpoint)).orderBy(desc(performanceMetrics.createdAt)).limit(limit);
}

// Error Tracking queries
export async function trackError(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(errorTracking).values(data);
}

export async function getRecentErrors(limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(errorTracking).where(eq(errorTracking.status, "new")).orderBy(desc(errorTracking.createdAt)).limit(limit);
}

export async function getCriticalErrors() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(errorTracking).where(eq(errorTracking.severity, "critical")).orderBy(desc(errorTracking.createdAt));
}

// Support Tickets queries
export async function createSupportTicket(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(supportTickets).values(data);
}

export async function getSupportTicketsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.createdAt));
}

export async function getOpenSupportTickets(limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(supportTickets).where(eq(supportTickets.status, "open")).orderBy(desc(supportTickets.createdAt)).limit(limit);
}

export async function getSupportTicketByNumber(ticketNumber: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(supportTickets).where(eq(supportTickets.ticketNumber, ticketNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Support Ticket Messages queries
export async function addSupportTicketMessage(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(supportTicketMessages).values(data);
}

export async function getSupportTicketMessages(ticketId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(supportTicketMessages).where(eq(supportTicketMessages.ticketId, ticketId)).orderBy(desc(supportTicketMessages.createdAt));
}

// Feature Flags queries
export async function createFeatureFlag(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(featureFlags).values(data);
}

export async function getFeatureFlagByName(flagName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(featureFlags).where(eq(featureFlags.flagName, flagName)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllFeatureFlags() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(featureFlags);
}

// User Cohorts queries
export async function createUserCohort(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(userCohorts).values(data);
}

export async function getUserCohortByName(cohortName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(userCohorts).where(eq(userCohorts.cohortName, cohortName)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function addUserToCohort(cohortId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(userCohortMembers).values({ cohortId, userId });
}

export async function getCohortMembers(cohortId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(userCohortMembers).where(eq(userCohortMembers.cohortId, cohortId));
}

// Conversion Funnel Events queries
export async function trackConversionFunnelEvent(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(conversionFunnelEvents).values(data);
}

export async function getFunnelEventsBySessionId(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(conversionFunnelEvents).where(eq(conversionFunnelEvents.sessionId, sessionId)).orderBy(desc(conversionFunnelEvents.createdAt));
}

// NPS Survey Responses queries
export async function recordNpsSurveyResponse(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(npsSurveyResponses).values(data);
}

export async function getNpsSurveyResponses(limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(npsSurveyResponses).orderBy(desc(npsSurveyResponses.createdAt)).limit(limit);
}

export async function calculateNPS() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const responses = await db.select().from(npsSurveyResponses);
  const promoters = responses.filter(r => r.score >= 9).length;
  const detractors = responses.filter(r => r.score <= 6).length;
  const total = responses.length;
  if (total === 0) return 0;
  return Math.round(((promoters - detractors) / total) * 100);
}


// ============================================================================
// FELLOWSHIP QUALIFICATION SYSTEM
// ============================================================================

/**
 * Create a ResusGPS session record
 */
export async function createResusGPSSession(data: InsertResusGPSSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(resusGPSSessions).values(data);
  return result;
}

/**
 * Create a ResusGPS case record
 */
export async function createResusGPSCase(data: InsertResusGPSCase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(resusGPSCases).values(data);
  return result;
}

/**
 * Create a fellowship progress record
 */
export async function createFellowshipProgress(data: InsertFellowshipProgress) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(fellowshipProgress).values(data);
  return result;
}

/**
 * Update a fellowship progress record
 */
export async function updateFellowshipProgress(
  userId: number,
  data: Partial<InsertFellowshipProgress>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(fellowshipProgress)
    .set(data)
    .where(eq(fellowshipProgress.userId, userId));
  return result;
}

/**
 * Record a grace period usage
 */
export async function recordGracePeriod(data: InsertFellowshipGraceUsage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(fellowshipGraceUsage).values(data);
  return result;
}

/**
 * Record a streak reset
 */
export async function recordStreakReset(data: InsertFellowshipStreakReset) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(fellowshipStreakResets).values(data);
  return result;
}

/**
 * Get fellowship progress for a user
 */
export async function getFellowshipProgress(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(fellowshipProgress)
    .where(eq(fellowshipProgress.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}
