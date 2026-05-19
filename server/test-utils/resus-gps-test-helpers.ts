import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { users, resusGPSSessions } from "../../drizzle/schema";
import type { getDb } from "../db";

export type TestDb = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export async function createTestUser(db: TestDb): Promise<number> {
  const openId = `test-user-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const result = await db.insert(users).values({
    openId,
    email: `${openId}@test.com`,
    name: "Test User",
    role: "user",
  });
  return Number((result as { insertId: number }[])[0]?.insertId ?? 0);
}

export async function createCompletedResusSession(
  db: TestDb,
  opts: {
    userId: number;
    primaryDiagnosis: string;
    secondaryDiagnoses?: string[];
    durationSeconds?: number;
    interventionCount?: number;
    depthScore?: number;
    createdAt?: Date;
  }
): Promise<string> {
  const sessionId = randomUUID();
  await db.insert(resusGPSSessions).values({
    userId: opts.userId,
    sessionId,
    primaryDiagnosis: opts.primaryDiagnosis,
    secondaryDiagnoses: opts.secondaryDiagnoses
      ? JSON.stringify(opts.secondaryDiagnoses)
      : null,
    patientAgeMonths: 60,
    patientWeightKg: "18",
    status: "completed",
    durationSeconds: opts.durationSeconds ?? 300,
    interventionCount: opts.interventionCount ?? 5,
    depthScore: opts.depthScore ?? 85,
    ...(opts.createdAt ? { createdAt: opts.createdAt } : {}),
  });
  return sessionId;
}

export function conditionsFromSession(session: {
  primaryDiagnosis: string;
  secondaryDiagnoses: string | null;
}): string[] {
  const conditions = [session.primaryDiagnosis];
  if (session.secondaryDiagnoses) {
    try {
      const parsed = JSON.parse(session.secondaryDiagnoses) as unknown;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === "string") conditions.push(item);
        }
      }
    } catch {
      // ignore invalid JSON in tests
    }
  }
  return conditions;
}

export async function deleteUserResusSessions(db: TestDb, userId: number) {
  const sessions = await db
    .select({ sessionId: resusGPSSessions.sessionId })
    .from(resusGPSSessions)
    .where(eq(resusGPSSessions.userId, userId));

  for (const row of sessions) {
    await db.delete(resusGPSSessions).where(eq(resusGPSSessions.sessionId, row.sessionId));
  }
}
