/**
 * Instructor per-course competency (CEO decision, 2026-07-21): an
 * instructor's global `instructorApprovedAt`/`instructorCertifiedAt` flags
 * are necessary but not sufficient to teach a specific course — they must
 * also have personally completed that provider course (BLS/ACLS/PALS/etc.)
 * themselves. Qualification is auto-granted the moment BOTH conditions are
 * true, from whichever direction completes second:
 *   - they become instructor-certified while already having completed
 *     some provider course(s) themselves, or
 *   - they complete a new provider course while already instructor-certified.
 */
import { and, eq } from "drizzle-orm";
import { enrollments, instructorQualifications, users } from "../../drizzle/schema";

type ProgramType = "bls" | "acls" | "pals" | "fellowship" | "instructor" | "fellowship_diploma" | "heartsaver" | "nrp";

const QUALIFIABLE_PROGRAM_TYPES: ProgramType[] = ["bls", "acls", "pals", "heartsaver", "nrp"];

/**
 * Call this after (a) a user becomes instructor-certified, or (b) any of a
 * user's own enrollments gets practicalSkillsSignedOff. Grants qualification
 * for every provider course they've personally completed, if they're
 * instructor-certified — idempotent, safe to call redundantly.
 */
export async function syncInstructorQualificationsForUser(db: any, userId: number): Promise<void> {
  const [user] = await db
    .select({ instructorCertifiedAt: users.instructorCertifiedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.instructorCertifiedAt) {
    // Not instructor-certified yet — nothing to qualify them for.
    return;
  }

  const completedOwnEnrollments = await db
    .select({ programType: enrollments.programType })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.practicalSkillsSignedOff, true)));

  const completedTypes = new Set(
    completedOwnEnrollments
      .map((e: { programType: string }) => e.programType)
      .filter((pt: string) => (QUALIFIABLE_PROGRAM_TYPES as string[]).includes(pt))
  );

  for (const programType of completedTypes) {
    const existing = await db
      .select({ id: instructorQualifications.id })
      .from(instructorQualifications)
      .where(and(eq(instructorQualifications.userId, userId), eq(instructorQualifications.programType, programType as ProgramType)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(instructorQualifications).values({ userId, programType: programType as ProgramType });
    }
  }
}

/**
 * Server-side enforcement: is this user actually qualified to instruct
 * this specific programType? Used at session-assignment and sign-off time
 * — not just as a dropdown filter, so it can't be bypassed via direct API calls.
 */
export async function isInstructorQualifiedForCourse(db: any, userId: number, programType: string): Promise<boolean> {
  const rows = await db
    .select({ id: instructorQualifications.id })
    .from(instructorQualifications)
    .where(and(eq(instructorQualifications.userId, userId), eq(instructorQualifications.programType, programType as ProgramType)))
    .limit(1);
  return rows.length > 0;
}
