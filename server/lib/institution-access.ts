import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { institutionalAccounts, institutionalAccountAdmins } from "../../drizzle/schema";
import type { User } from "../../drizzle/schema";
import { getDb } from "../db";

const INSTITUTION_FORBIDDEN = "You do not have access to this institution";
/** North Star §6.1: "A minimum of two named admin contacts must always be registered." */
export const MINIMUM_INSTITUTION_ADMINS = 2;

export type AppDb = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/**
 * True if the user is either a row in institutionalAccountAdmins for this
 * institution, or the legacy institutionalAccounts.userId owner (kept for
 * backward compat — migration 0071 backfills every existing account's owner
 * into institutionalAccountAdmins too, so this OR is a defensive belt-and-
 * suspenders check, not the primary path).
 */
export async function isInstitutionAdmin(
  db: AppDb,
  userId: number,
  institutionId: number
): Promise<boolean> {
  const rows = await db
    .select({ id: institutionalAccounts.id })
    .from(institutionalAccounts)
    .where(
      and(
        eq(institutionalAccounts.id, institutionId),
        eq(institutionalAccounts.userId, userId)
      )
    )
    .limit(1);
  if (rows.length) return true;

  const adminRows = await db
    .select({ id: institutionalAccountAdmins.id })
    .from(institutionalAccountAdmins)
    .where(
      and(
        eq(institutionalAccountAdmins.institutionalAccountId, institutionId),
        eq(institutionalAccountAdmins.userId, userId)
      )
    )
    .limit(1);
  return adminRows.length > 0;
}

/**
 * Every institutionalAccountId this user administers, via either the
 * multi-admin table or the legacy owner column. Used to replace the several
 * call sites that used to filter institutionalAccounts by
 * `eq(institutionalAccounts.userId, ctx.user.id)` directly — that pattern
 * misses admins added via institutionalAccountAdmins (invite or recovery
 * grant) who are not the original registering user.
 */
export async function getAdministeredInstitutionIds(db: AppDb, userId: number): Promise<number[]> {
  const owned = await db
    .select({ id: institutionalAccounts.id })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.userId, userId));

  const granted = await db
    .select({ id: institutionalAccountAdmins.institutionalAccountId })
    .from(institutionalAccountAdmins)
    .where(eq(institutionalAccountAdmins.userId, userId));

  return Array.from(new Set([...owned.map((r) => r.id), ...granted.map((r) => r.id)]));
}

/**
 * Admin (role="admin") may access any institution. Other users only
 * institutions they administer — either as the legacy institutionalAccounts
 * owner or a granted row in institutionalAccountAdmins (North Star §6.1 —
 * "Products are permissions, not account types"; an institution's admin
 * seat is a permission on the account, not tied to the one user who
 * registered it).
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

  const exists = await db
    .select({ id: institutionalAccounts.id })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, institutionId))
    .limit(1);
  if (!exists.length) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Institution not found" });
  }

  const ok = await isInstitutionAdmin(db, user.id, institutionId);
  if (!ok) {
    throw new TRPCError({ code: "FORBIDDEN", message: INSTITUTION_FORBIDDEN });
  }
}

/** Current count of distinct admins (owner + institutionalAccountAdmins rows) for an institution. */
export async function countInstitutionAdmins(db: AppDb, institutionId: number): Promise<number> {
  const owner = await db
    .select({ userId: institutionalAccounts.userId })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, institutionId))
    .limit(1);

  const grantedRows = await db
    .select({ userId: institutionalAccountAdmins.userId })
    .from(institutionalAccountAdmins)
    .where(eq(institutionalAccountAdmins.institutionalAccountId, institutionId));

  const ids = new Set<number>(grantedRows.map((r) => r.userId));
  if (owner.length) ids.add(owner[0].userId);
  return ids.size;
}

/**
 * North Star §6.1: "A minimum of two named admin contacts must always be
 * registered." Blocks removing an admin if it would drop the institution
 * below MINIMUM_INSTITUTION_ADMINS.
 */
export async function assertRemovalKeepsMinimumAdmins(
  db: AppDb,
  institutionId: number
): Promise<void> {
  const count = await countInstitutionAdmins(db, institutionId);
  if (count <= MINIMUM_INSTITUTION_ADMINS) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `An institution must always have at least ${MINIMUM_INSTITUTION_ADMINS} admin contacts. Invite a replacement before removing this one.`,
    });
  }
}
