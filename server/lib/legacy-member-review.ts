import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { getDb } from "../db";
import {
  facilityDepartments,
  inAppNotifications,
  institutionDepartmentHeads,
  institutionDepartmentResponseCoordinators,
  institutionEducationCoordinators,
  institutionMembershipEvents,
  institutionMembershipReviews,
  institutionMemberships,
  institutionProductRoles,
  institutionalStaffMembers,
} from "../../drizzle/schema";
import { isInstitutionAdmin } from "./institution-access";
import { endMembershipAccess } from "./institution-membership-exit";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type ReviewDecision = "legacy_pending" | "confirmed" | "not_in_my_department" | "department_assigned" | "removed";

/** Product roles that review a whole institution's legacy members (alongside administrators). */
const INSTITUTION_LEVEL_ROLE_KEYS = ["cpd_coordinator", "iers_coordinator", "iers_chair"] as const;

export type ReviewScope =
  | { tier: "institution"; role: string; departmentIds: null }
  | { tier: "department"; role: string; departmentIds: number[] };

type DeptRow = { departmentId: number };

/**
 * Who may review legacy members, and for which part of the institution.
 *  - institution tier: administrators, and institution-level CPD or emergency-response
 *    coordinators (cpd_coordinator, iers_coordinator, iers_chair). Sees every member.
 *  - department tier: department heads, department CPD (education) coordinators and department
 *    emergency-response coordinators, and their deputies/backups. Sees only their departments.
 * Returns null when the user has no review responsibility here.
 */
export async function resolveReviewScope(
  db: Db,
  user: { id: number; email?: string | null; role?: string | null },
  institutionId: number,
): Promise<ReviewScope | null> {
  if (user.role === "admin" || (await isInstitutionAdmin(db, user.id, institutionId))) {
    return { tier: "institution", role: "institution_admin", departmentIds: null };
  }
  const email = user.email?.trim().toLowerCase();
  const productRoles = await db
    .select({ roleKey: institutionProductRoles.roleKey, userId: institutionProductRoles.userId, invitedEmail: institutionProductRoles.invitedEmail })
    .from(institutionProductRoles)
    .where(and(
      eq(institutionProductRoles.institutionalAccountId, institutionId),
      eq(institutionProductRoles.roleStatus, "active"),
      inArray(institutionProductRoles.roleKey, [...INSTITUTION_LEVEL_ROLE_KEYS]),
    ));
  const own = productRoles.find((row) => row.userId === user.id || (email != null && row.invitedEmail.toLowerCase() === email));
  if (own) return { tier: "institution", role: own.roleKey, departmentIds: null };

  const heads: DeptRow[] = await db
    .select({ departmentId: institutionDepartmentHeads.departmentId })
    .from(institutionDepartmentHeads)
    .where(and(
      eq(institutionDepartmentHeads.institutionalAccountId, institutionId),
      or(
        and(eq(institutionDepartmentHeads.userId, user.id), eq(institutionDepartmentHeads.assignmentStatus, "active")),
        and(eq(institutionDepartmentHeads.deputyUserId, user.id), eq(institutionDepartmentHeads.deputyAssignmentStatus, "active")),
      ),
    ));
  const education: DeptRow[] = await db
    .select({ departmentId: institutionEducationCoordinators.departmentId })
    .from(institutionEducationCoordinators)
    .where(and(
      eq(institutionEducationCoordinators.institutionalAccountId, institutionId),
      or(
        and(eq(institutionEducationCoordinators.userId, user.id), eq(institutionEducationCoordinators.assignmentStatus, "active")),
        and(eq(institutionEducationCoordinators.deputyUserId, user.id), eq(institutionEducationCoordinators.deputyAssignmentStatus, "active")),
      ),
    ));
  const response: DeptRow[] = await db
    .select({ departmentId: institutionDepartmentResponseCoordinators.departmentId })
    .from(institutionDepartmentResponseCoordinators)
    .where(and(
      eq(institutionDepartmentResponseCoordinators.institutionId, institutionId),
      or(
        and(eq(institutionDepartmentResponseCoordinators.coordinatorUserId, user.id), eq(institutionDepartmentResponseCoordinators.assignmentStatus, "active")),
        and(eq(institutionDepartmentResponseCoordinators.backupUserId, user.id), eq(institutionDepartmentResponseCoordinators.assignmentStatus, "active")),
        and(eq(institutionDepartmentResponseCoordinators.deputyUserId, user.id), eq(institutionDepartmentResponseCoordinators.deputyAssignmentStatus, "active")),
      ),
    ));
  const departmentIds = Array.from(new Set([...heads, ...education, ...response].map((row) => row.departmentId)));
  if (departmentIds.length === 0) return null;
  const role = heads.length ? "department_head" : education.length ? "department_cpd_coordinator" : "department_response_coordinator";
  return { tier: "department", role, departmentIds };
}

export type ReviewRow = { id: number; decision: ReviewDecision; departmentId: number | null; reviewerUserId: number | null; note: string | null };

/**
 * Review state of one membership from its review rows (oldest first). The review is open while
 * the last opening/closing row is `legacy_pending`. Department flags only count if they were
 * raised after the last department assignment (assigning a department starts a fresh look).
 */
export function summariseReview(rows: ReviewRow[]): {
  open: boolean;
  closedAs: "confirmed" | "removed" | null;
  flags: { departmentId: number | null; note: string | null; reviewerUserId: number | null }[];
} {
  let open = false;
  let closedAs: "confirmed" | "removed" | null = null;
  let flags: { departmentId: number | null; note: string | null; reviewerUserId: number | null }[] = [];
  for (const row of rows) {
    if (row.decision === "legacy_pending") {
      open = true;
      closedAs = null;
      flags = [];
    } else if (row.decision === "confirmed" || row.decision === "removed") {
      open = false;
      closedAs = row.decision;
    } else if (row.decision === "department_assigned") {
      flags = [];
    } else if (row.decision === "not_in_my_department" && open) {
      flags.push({ departmentId: row.departmentId, note: row.note, reviewerUserId: row.reviewerUserId });
    }
  }
  return { open, closedAs, flags };
}

export async function loadReviewRows(db: Db, membershipIds: number[]): Promise<Map<number, ReviewRow[]>> {
  const map = new Map<number, ReviewRow[]>();
  if (membershipIds.length === 0) return map;
  const rows = await db
    .select({
      id: institutionMembershipReviews.id,
      membershipId: institutionMembershipReviews.membershipId,
      decision: institutionMembershipReviews.decision,
      departmentId: institutionMembershipReviews.departmentId,
      reviewerUserId: institutionMembershipReviews.reviewerUserId,
      note: institutionMembershipReviews.note,
    })
    .from(institutionMembershipReviews)
    .where(inArray(institutionMembershipReviews.membershipId, membershipIds))
    .orderBy(institutionMembershipReviews.id);
  for (const row of rows) {
    const list = map.get(row.membershipId) ?? [];
    list.push(row as ReviewRow);
    map.set(row.membershipId, list);
  }
  return map;
}

/** A member is visible to a reviewer if the reviewer is institution-level, or the member is in one of their departments. */
export function canSeeMember(scope: ReviewScope, member: { facilityDepartmentId: number | null }): boolean {
  if (scope.tier === "institution") return true;
  return member.facilityDepartmentId != null && scope.departmentIds.includes(member.facilityDepartmentId);
}

export function requireInstitutionTier(scope: ReviewScope | null): asserts scope is Extract<ReviewScope, { tier: "institution" }> {
  if (!scope || scope.tier !== "institution") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only institution-level reviewers can do this. Use \"Not in my department\" to pass the person on." });
  }
}

type Member = {
  membershipId: number;
  userId: number | null;
  staffMemberId: number | null;
  name: string;
  email: string;
  department: string | null;
  facilityDepartmentId: number | null;
};

async function loadMembers(db: Db, institutionId: number, membershipId?: number): Promise<Member[]> {
  const memberships = await db
    .select({
      id: institutionMemberships.id,
      userId: institutionMemberships.userId,
      staffMemberId: institutionMemberships.staffMemberId,
      invitedEmail: institutionMemberships.invitedEmail,
    })
    .from(institutionMemberships)
    .where(and(
      eq(institutionMemberships.institutionalAccountId, institutionId),
      eq(institutionMemberships.membershipStatus, "active"),
      ...(membershipId != null ? [eq(institutionMemberships.id, membershipId)] : []),
    ))
    .limit(membershipId != null ? 1 : 2000);
  const staffIds = memberships.map((m) => m.staffMemberId).filter((id): id is number => id != null);
  const staffRows = staffIds.length
    ? await db
        .select({
          id: institutionalStaffMembers.id,
          staffName: institutionalStaffMembers.staffName,
          department: institutionalStaffMembers.department,
          facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId,
        })
        .from(institutionalStaffMembers)
        .where(and(inArray(institutionalStaffMembers.id, staffIds), isNull(institutionalStaffMembers.removedAt)))
    : [];
  const staffById = new Map(staffRows.map((row) => [row.id, row]));
  return memberships.map((m) => {
    const staff = m.staffMemberId != null ? staffById.get(m.staffMemberId) : undefined;
    return {
      membershipId: m.id,
      userId: m.userId,
      staffMemberId: m.staffMemberId,
      name: staff?.staffName ?? m.invitedEmail,
      email: m.invitedEmail,
      department: staff?.department ?? null,
      facilityDepartmentId: staff?.facilityDepartmentId ?? null,
    };
  });
}

/** The institution's legacy members still waiting for a decision, filtered to what the reviewer may see. */
export async function listLegacyMembers(db: Db, scope: ReviewScope, institutionId: number) {
  const members = await loadMembers(db, institutionId);
  const reviews = await loadReviewRows(db, members.map((m) => m.membershipId));
  const rows = [];
  for (const member of members) {
    const state = summariseReview(reviews.get(member.membershipId) ?? []);
    if (!state.open || !canSeeMember(scope, member)) continue;
    rows.push({
      membershipId: member.membershipId,
      name: member.name,
      email: member.email,
      department: member.department,
      facilityDepartmentId: member.facilityDepartmentId,
      unassigned: member.facilityDepartmentId == null,
      flagCount: state.flags.length,
      // Flag notes are for the institution-level reviewer; department reviewers see only that a flag exists.
      flags: scope.tier === "institution" ? state.flags : [],
    });
  }
  rows.sort((a, b) => b.flagCount - a.flagCount || a.name.localeCompare(b.name));
  return rows;
}

async function requireOpenMember(db: Db, scope: ReviewScope, institutionId: number, membershipId: number): Promise<Member> {
  const [member] = await loadMembers(db, institutionId, membershipId);
  if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No active member found." });
  if (!canSeeMember(scope, member)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "This person is not in your department." });
  }
  const state = summariseReview((await loadReviewRows(db, [membershipId])).get(membershipId) ?? []);
  if (!state.open) throw new TRPCError({ code: "BAD_REQUEST", message: "This member is not waiting for review." });
  return member;
}

async function addReview(
  db: Db,
  input: { institutionId: number; membershipId: number; decision: ReviewDecision; reviewerUserId: number; reviewerRole: string; departmentId?: number | null; note?: string | null },
) {
  await db.insert(institutionMembershipReviews).values({
    institutionalAccountId: input.institutionId,
    membershipId: input.membershipId,
    decision: input.decision,
    reviewerUserId: input.reviewerUserId,
    reviewerRole: input.reviewerRole,
    departmentId: input.departmentId ?? null,
    note: input.note ? input.note.slice(0, 500) : null,
  });
}

/** "Yes, this person works here." Closes the review. One person at a time. */
export async function confirmLegacyMember(db: Db, scope: ReviewScope, user: { id: number }, input: { institutionId: number; membershipId: number; note?: string | null }) {
  await requireOpenMember(db, scope, input.institutionId, input.membershipId);
  await addReview(db, { ...input, decision: "confirmed", reviewerUserId: user.id, reviewerRole: scope.role });
}

/** Department reviewers pass a person on to the institution-level queue. Ends nothing. */
export async function flagNotInMyDepartment(db: Db, scope: ReviewScope, user: { id: number }, input: { institutionId: number; membershipId: number; note: string }) {
  if (scope.tier !== "department") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Institution-level reviewers decide directly: confirm, remove or assign a department." });
  }
  const member = await requireOpenMember(db, scope, input.institutionId, input.membershipId);
  await addReview(db, { ...input, decision: "not_in_my_department", reviewerUserId: user.id, reviewerRole: scope.role, departmentId: member.facilityDepartmentId });
}

/** Institution-level only: end the person's access (same cleanup as an administrator unlink or a provider leaving). */
export async function removeLegacyMember(db: Db, scope: ReviewScope, user: { id: number }, input: { institutionId: number; membershipId: number; reason: string }) {
  requireInstitutionTier(scope);
  const member = await requireOpenMember(db, scope, input.institutionId, input.membershipId);
  const now = new Date();
  await db.transaction(async (tx) => {
    await endMembershipAccess(tx, { institutionId: input.institutionId, membership: { id: member.membershipId, userId: member.userId, staffMemberId: member.staffMemberId }, now });
    await tx.insert(institutionMembershipEvents).values({
      institutionalAccountId: input.institutionId,
      membershipId: member.membershipId,
      staffMemberId: member.staffMemberId,
      userId: member.userId,
      eventType: "removed",
      previousMembershipStatus: "active",
      currentMembershipStatus: "ended",
      actorUserId: user.id,
      reason: `Removed in legacy member review: ${input.reason.trim()}`.slice(0, 1000),
      occurredAt: now,
    });
    await tx.insert(institutionMembershipReviews).values({
      institutionalAccountId: input.institutionId,
      membershipId: member.membershipId,
      decision: "removed",
      reviewerUserId: user.id,
      reviewerRole: scope.role,
      note: input.reason.trim().slice(0, 500),
    });
  });
  if (member.userId != null) {
    try {
      await db.insert(inAppNotifications).values({
        userId: member.userId,
        type: "facility_membership",
        title: "Your institution access was ended",
        body: "The institution reviewed its members and ended your access. If you work there, ask them to invite you again.",
        relatedId: member.membershipId,
        actionUrl: "/workplaces-and-access",
      });
    } catch (error) {
      console.error("[legacy-member-review] notification failed", error);
    }
  }
}

/** Institution-level only: put an unassigned (or mis-assigned) member in a department; they then reach that department's reviewers. */
export async function assignLegacyMemberDepartment(db: Db, scope: ReviewScope, user: { id: number }, input: { institutionId: number; membershipId: number; departmentId: number }) {
  requireInstitutionTier(scope);
  const member = await requireOpenMember(db, scope, input.institutionId, input.membershipId);
  const [department] = await db
    .select({ id: facilityDepartments.id, departmentName: facilityDepartments.departmentName })
    .from(facilityDepartments)
    .where(and(
      eq(facilityDepartments.id, input.departmentId),
      eq(facilityDepartments.institutionId, input.institutionId),
      eq(facilityDepartments.isActive, true),
    ))
    .limit(1);
  if (!department) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a current department of this institution." });
  if (member.staffMemberId == null) throw new TRPCError({ code: "BAD_REQUEST", message: "This member has no roster record to assign." });
  await db
    .update(institutionalStaffMembers)
    .set({ facilityDepartmentId: department.id, department: department.departmentName, updatedAt: new Date() })
    .where(and(eq(institutionalStaffMembers.id, member.staffMemberId), eq(institutionalStaffMembers.institutionalAccountId, input.institutionId)));
  await addReview(db, { institutionId: input.institutionId, membershipId: member.membershipId, decision: "department_assigned", reviewerUserId: user.id, reviewerRole: scope.role, departmentId: department.id, note: department.departmentName });
}

export async function listAssignableDepartments(db: Db, institutionId: number) {
  return db
    .select({ id: facilityDepartments.id, name: facilityDepartments.departmentName })
    .from(facilityDepartments)
    .where(and(eq(facilityDepartments.institutionId, institutionId), eq(facilityDepartments.isActive, true)))
    .orderBy(facilityDepartments.departmentName);
}
