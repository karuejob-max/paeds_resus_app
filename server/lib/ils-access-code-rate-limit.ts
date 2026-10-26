import { createHash } from "node:crypto";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { ilsAccessCodeAttemptWindows } from "../../drizzle/schema";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const BLOCK_MS = 15 * 60 * 1000;

export type IlsAccessCodeProgram = "bls" | "acls" | "pals" | "nrp";

function fingerprintHash(ipAddress: string) {
  return createHash("sha256")
    .update(`ils-access-code:${ipAddress.trim() || "unknown"}`, "utf8")
    .digest("hex");
}

/**
 * Enforce a shared, authenticated code-attempt window. The raw IP is never
 * persisted. The transaction lock prevents separate application instances
 * from bypassing the window concurrently.
 */
export async function enforceIlsAccessCodeRateLimit(
  db: any,
  input: { userId: number; ipAddress?: string | null; programType: IlsAccessCodeProgram },
  now = new Date()
) {
  const fingerprint = fingerprintHash(input.ipAddress || "unknown");
  return db.transaction(async (tx: any) => {
    const rows = await tx
      .select()
      .from(ilsAccessCodeAttemptWindows)
      .where(
        and(
          eq(ilsAccessCodeAttemptWindows.userId, input.userId),
          eq(ilsAccessCodeAttemptWindows.fingerprintHash, fingerprint),
          eq(ilsAccessCodeAttemptWindows.programType, input.programType)
        )
      )
      .limit(1)
      .for("update");
    const row = rows[0];
    const windowExpired = !row || row.windowStartedAt.getTime() <= now.getTime() - WINDOW_MS;
    if (row?.blockedUntil && row.blockedUntil.getTime() > now.getTime()) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many course-code attempts. Try again later.",
      });
    }
    if (windowExpired) {
      if (row) {
        await tx.update(ilsAccessCodeAttemptWindows).set({
          windowStartedAt: now,
          attemptCount: 1,
          blockedUntil: null,
          lastAttemptAt: now,
          updatedAt: now,
        }).where(eq(ilsAccessCodeAttemptWindows.id, row.id));
      } else {
        await tx.insert(ilsAccessCodeAttemptWindows).values({
          userId: input.userId,
          fingerprintHash: fingerprint,
          programType: input.programType,
          windowStartedAt: now,
          attemptCount: 1,
          lastAttemptAt: now,
          createdAt: now,
          updatedAt: now,
        });
      }
      return { allowed: true as const, remaining: MAX_ATTEMPTS - 1 };
    }
    const nextCount = row.attemptCount + 1;
    if (nextCount > MAX_ATTEMPTS) {
      const blockedUntil = new Date(now.getTime() + BLOCK_MS);
      await tx.update(ilsAccessCodeAttemptWindows).set({
        attemptCount: nextCount,
        blockedUntil,
        lastAttemptAt: now,
        updatedAt: now,
      }).where(eq(ilsAccessCodeAttemptWindows.id, row.id));
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many course-code attempts. Try again later.",
      });
    }
    await tx.update(ilsAccessCodeAttemptWindows).set({
      attemptCount: sql`${ilsAccessCodeAttemptWindows.attemptCount} + 1`,
      lastAttemptAt: now,
      updatedAt: now,
    }).where(and(
      eq(ilsAccessCodeAttemptWindows.id, row.id),
      lt(ilsAccessCodeAttemptWindows.attemptCount, MAX_ATTEMPTS)
    ));
    return { allowed: true as const, remaining: MAX_ATTEMPTS - nextCount };
  });
}

export const ilsAccessCodeRateLimitPolicy = {
  windowMinutes: WINDOW_MS / 60000,
  maxAttempts: MAX_ATTEMPTS,
  blockMinutes: BLOCK_MS / 60000,
} as const;
