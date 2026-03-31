import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { institutionalAccounts } from "../../drizzle/schema";
import type { User } from "../../drizzle/schema";
import { getDb } from "../db";

const INSTITUTION_FORBIDDEN = "You do not have access to this institution";

export type AppDb = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/**
 * Admin may access any institution. Other users only rows where institutionalAccounts.userId matches.
 * Throws NOT_FOUND if the institution id does not exist.
 */
export async function assertInstitutionAccess(
  db: AppDb,
  user: User,
  institutionId: number
): Promise<void> {
  if (user.role === "admin") {
    const exists = await db
      .select({ id: institutionalAccounts.id })
      .from(institutionalAccounts)
      .where(eq(institutionalAccounts.id, institutionId))
      .limit(1);
    if (!exists.length) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Institution not found" });
    }
    return;
  }

  const row = await db
    .select({ userId: institutionalAccounts.userId })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, institutionId))
    .limit(1);

  if (!row.length) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Institution not found" });
  }
  if (row[0].userId !== user.id) {
    throw new TRPCError({ code: "FORBIDDEN", message: INSTITUTION_FORBIDDEN });
  }
}
