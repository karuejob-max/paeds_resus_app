import { and, eq, gte, isNull, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { getDb } from "../db";
import {
  inAppNotifications,
  institutionAccountScopes,
  institutionDepartmentResponseCoordinators,
  institutionMembershipEvents,
  institutionMemberships,
  institutionProductRoles,
  institutionalAccountAdmins,
  institutionalAccounts,
  institutionalStaffMembers,
  monthlyUtlRotations,
  shiftUtlRosters,
} from "../../drizzle/schema";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
/** A database handle or an open transaction (same query surface). */
type Executor = Pick<Db, "select" | "insert" | "update">;

/**
 * Ends a person's access to an institution and everything hanging off it: the membership, product
 * roles, account scopes, response-coordinator seats, and future rotations/shifts. Shared by the
 * administrator "unlink" and the provider's own "leave" so both do exactly the same cleanup.
 *
 * The roster row is set to `rejected` (not `pending`): an ended relationship must not drop the
 * person back into the approval queue or be silently re-raised by background reconciliation.
 * Coming back is explicit — a new invitation or a new facility-link request that an
 * administrator approves.
 */
export async function endMembershipAccess(
  tx: Executor,
  input: {
    institutionId: number;
    membership: { id: number; userId: number | null; staffMemberId: number | null };
    now: Date;
  },
) {
  const { institutionId, membership, now } = input;
  await tx
    .update(institutionMemberships)
    .set({ membershipStatus: "ended", endedAt: now, updatedAt: now })
    .where(and(eq(institutionMemberships.id, membership.id), eq(institutionMemberships.institutionalAccountId, institutionId)));
  if (membership.staffMemberId) {
    await tx
      .update(institutionalStaffMembers)
      .set({ facilityLinkStatus: "rejected", updatedAt: now })
      .where(and(
        eq(institutionalStaffMembers.id, membership.staffMemberId),
        eq(institutionalStaffMembers.institutionalAccountId, institutionId),
        isNull(institutionalStaffMembers.removedAt),
      ));
  }
  if (membership.userId != null) {
    const userId = membership.userId;
    await tx.update(institutionProductRoles).set({ roleStatus: "ended", endedAt: now, updatedAt: now }).where(and(eq(institutionProductRoles.institutionalAccountId, institutionId), eq(institutionProductRoles.userId, userId), or(eq(institutionProductRoles.roleStatus, "active"), eq(institutionProductRoles.roleStatus, "suspended"))));
    await tx.update(institutionAccountScopes).set({ scopeStatus: "ended", endedAt: now, updatedAt: now }).where(and(eq(institutionAccountScopes.institutionalAccountId, institutionId), eq(institutionAccountScopes.userId, userId), or(eq(institutionAccountScopes.scopeStatus, "active"), eq(institutionAccountScopes.scopeStatus, "suspended"))));
    await tx.update(institutionDepartmentResponseCoordinators).set({ assignmentStatus: "ended", updatedAt: now }).where(and(eq(institutionDepartmentResponseCoordinators.institutionId, institutionId), or(eq(institutionDepartmentResponseCoordinators.coordinatorUserId, userId), eq(institutionDepartmentResponseCoordinators.backupUserId, userId)), or(eq(institutionDepartmentResponseCoordinators.assignmentStatus, "active"), eq(institutionDepartmentResponseCoordinators.assignmentStatus, "pending_acceptance"))));
    await tx.update(monthlyUtlRotations).set({ assignmentStatus: "ended", providerUserId: null, updatedAt: now }).where(and(eq(monthlyUtlRotations.institutionId, institutionId), eq(monthlyUtlRotations.providerUserId, userId), or(eq(monthlyUtlRotations.assignmentStatus, "unassigned"), eq(monthlyUtlRotations.assignmentStatus, "pending_acceptance"), eq(monthlyUtlRotations.assignmentStatus, "active"))));
    await tx.update(shiftUtlRosters).set({ assignmentStatus: "ended", status: "absent" }).where(and(eq(shiftUtlRosters.institutionId, institutionId), eq(shiftUtlRosters.utlUserId, userId), gte(shiftUtlRosters.shiftDate, now), or(eq(shiftUtlRosters.assignmentStatus, "unassigned"), eq(shiftUtlRosters.assignmentStatus, "pending_acceptance"), eq(shiftUtlRosters.assignmentStatus, "active"))));
  }
}

/**
 * A provider ends their own institution access. Their ability to leave must not depend on an
 * administrator: affiliations that were created without their consent (older admin adds,
 * profile facility selection, CPD attendance) are theirs to remove. Administrators must hand
 * over their administrator role first so an institution is never left without one.
 */
export async function leaveInstitutionMembership(
  db: Db,
  user: { id: number; name?: string | null; email?: string | null },
  input: { membershipId: number; reason: string },
): Promise<{ institutionalAccountId: number }> {
  const [membership] = await db
    .select({
      id: institutionMemberships.id,
      institutionalAccountId: institutionMemberships.institutionalAccountId,
      userId: institutionMemberships.userId,
      staffMemberId: institutionMemberships.staffMemberId,
      membershipStatus: institutionMemberships.membershipStatus,
    })
    .from(institutionMemberships)
    .where(and(
      eq(institutionMemberships.id, input.membershipId),
      eq(institutionMemberships.userId, user.id),
      eq(institutionMemberships.membershipStatus, "active"),
    ))
    .limit(1);
  if (!membership) {
    throw new TRPCError({ code: "NOT_FOUND", message: "No active institution membership found for your account." });
  }
  const institutionId = membership.institutionalAccountId;

  const [account] = await db
    .select({ ownerUserId: institutionalAccounts.userId, companyName: institutionalAccounts.companyName })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, institutionId))
    .limit(1);
  const [adminRow] = await db
    .select({ id: institutionalAccountAdmins.id })
    .from(institutionalAccountAdmins)
    .where(and(eq(institutionalAccountAdmins.institutionalAccountId, institutionId), eq(institutionalAccountAdmins.userId, user.id)))
    .limit(1);
  if (account?.ownerUserId === user.id || adminRow) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You administer this institution. Ask another administrator to remove your administrator role first, then leave.",
    });
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await endMembershipAccess(tx, { institutionId, membership, now });
    await tx.insert(institutionMembershipEvents).values({
      institutionalAccountId: institutionId,
      membershipId: membership.id,
      staffMemberId: membership.staffMemberId,
      userId: user.id,
      eventType: "removed",
      previousMembershipStatus: "active",
      currentMembershipStatus: "ended",
      actorUserId: user.id,
      reason: `Left by the provider: ${input.reason.trim()}`.slice(0, 1000),
      occurredAt: now,
    });
  });

  try {
    const admins = await db
      .select({ userId: institutionalAccountAdmins.userId })
      .from(institutionalAccountAdmins)
      .where(eq(institutionalAccountAdmins.institutionalAccountId, institutionId));
    const adminIds = Array.from(new Set(
      [account?.ownerUserId, ...admins.map((a) => a.userId)].filter((id): id is number => id != null && id > 0),
    ));
    if (adminIds.length > 0) {
      await db.insert(inAppNotifications).values(adminIds.map((userId) => ({
        userId,
        type: "facility_membership",
        title: "A provider left the institution",
        body: `${user.name?.trim() || user.email || "A provider"} ended their access to ${account?.companyName ?? "the institution"}. Any roles and future duties they held were ended.`,
        relatedId: membership.id,
        actionUrl: "/institution",
      })));
    }
  } catch (error) {
    // The exit is recorded; a failed notification must not undo it.
    console.error("[institution-membership-exit] notification failed", error);
  }
  return { institutionalAccountId: institutionId };
}
