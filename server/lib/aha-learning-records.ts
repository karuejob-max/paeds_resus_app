import { and, eq, inArray } from "drizzle-orm";
import { enrollments } from "../../drizzle/schema";
import {
  selectBestCurrentEnrollments,
  type LifeSupportEnrollmentLike,
} from "./professional-progress-calculation";

export const CANONICAL_AHA_PROGRAM_TYPES = [
  "bls",
  "acls",
  "pals",
  "heartsaver",
  "nrp",
  "instructor",
] as const;

export type CanonicalAhaProgramType =
  (typeof CANONICAL_AHA_PROGRAM_TYPES)[number];

/**
 * AHA learning is user-owned, not pathway-owned. IERP, NERP, ILSP and
 * independent/self-pay pathways may all point at the same course record.
 * Select the strongest current record so a later pathway draft cannot hide a
 * completed course from an earlier pathway.
 */
export async function getCanonicalAhaEnrollments(
  db: any,
  userId: number,
  programTypes: readonly string[] = CANONICAL_AHA_PROGRAM_TYPES
): Promise<any[]> {
  const rows = await db
    .select()
    .from(enrollments)
    .where(
      and(
        eq(enrollments.userId, userId),
        inArray(enrollments.programType, [...programTypes] as any)
      )
    );

  return selectBestCurrentEnrollments(
    rows as LifeSupportEnrollmentLike[]
  ) as any[];
}

export async function getCanonicalAhaEnrollment(
  db: any,
  userId: number,
  programType: CanonicalAhaProgramType
): Promise<any | null> {
  const rows = await getCanonicalAhaEnrollments(db, userId, [programType]);
  return rows[0] ?? null;
}

export function canonicalAhaEnrollmentMap(rows: any[]) {
  return new Map(rows.map(row => [row.programType, row]));
}
