import { and, eq, isNull, sql } from "drizzle-orm";
import { institutionalStaffMembers } from "../../drizzle/schema";

/**
 * One definition of "an active member of an institution".
 *
 * Two records describe membership: the roster row (`institutionalStaffMembers.facilityLinkStatus`)
 * and the membership row (`institutionMemberships.membershipStatus`). They used to be checked
 * separately, so a person whose membership was suspended or ended could still count as a member
 * (ILS, audits, course access, payments) while another screen excluded them.
 *
 * A person is an active member when the roster row is `linked` and not removed, and the
 * membership has not been suspended, ended or declined. A roster row with no membership row at
 * all (older data) still counts, so this tightening never hides people who were never migrated.
 */
export type MemberRecord = {
  facilityLinkStatus: string | null | undefined;
  removedAt?: Date | string | null;
  /** Null/undefined when no membership row exists. */
  membershipStatus?: string | null;
};

const BLOCKING_MEMBERSHIP_STATUSES = ["suspended", "ended", "declined"] as const;

export function isActiveMember(row: MemberRecord): boolean {
  if (row.facilityLinkStatus !== "linked") return false;
  if (row.removedAt) return false;
  if (row.membershipStatus == null) return true;
  return !(BLOCKING_MEMBERSHIP_STATUSES as readonly string[]).includes(row.membershipStatus);
}

/**
 * SQL form of {@link isActiveMember} for queries on `institutionalStaffMembers`.
 * Excludes a roster row only when it has a blocking membership and no active one.
 */
export function activeStaffCondition() {
  return and(
    eq(institutionalStaffMembers.facilityLinkStatus, "linked"),
    isNull(institutionalStaffMembers.removedAt),
    sql`NOT (
      EXISTS (SELECT 1 FROM institutionMemberships m_block
        WHERE m_block.staffMemberId = ${institutionalStaffMembers.id}
          AND m_block.membershipStatus IN ('suspended','ended','declined'))
      AND NOT EXISTS (SELECT 1 FROM institutionMemberships m_act
        WHERE m_act.staffMemberId = ${institutionalStaffMembers.id}
          AND m_act.membershipStatus = 'active')
    )`,
  );
}
