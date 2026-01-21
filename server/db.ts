import { eq, desc, and, gte, lte, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, enrollments, payments, certificates, institutionalInquiries, smsReminders, learnerProgress, userFeedback, analyticsEvents, experiments, experimentAssignments, performanceMetrics, errorTracking, supportTickets, supportTicketMessages, featureFlags, userCohorts, userCohortMembers, conversionFunnelEvents, npsSurveyResponses } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

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

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Enrollment queries
export async function createEnrollment(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(enrollments).values(data);
  return result;
}

export async function getEnrollmentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(enrollments).where(eq(enrollments.userId, userId));
}

// Payment queries
export async function createPayment(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(payments).values(data);
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
