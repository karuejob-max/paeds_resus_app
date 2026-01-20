import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, enrollments, payments, certificates, institutionalInquiries, smsReminders, learnerProgress } from "../drizzle/schema";
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
