/**
 * Fellowship Phase 2 grandfathering (North Star v2.1 addendum §6, CEO
 * decision 2026-07-29): a lead_instructor can mark a course as fully
 * meeting its Fellowship requirement for a learner who completed physical,
 * in-person training before the online Phase 2 simulation model existed.
 *
 * Deliberately mirrors server/certificates.ts's signOffPracticalSkills in
 * shape and auth pattern (per-enrollment sign-off, per-course instructor
 * qualification check) rather than inventing a new convention. The one
 * difference: this requires the caller to actually hold the lead_instructor
 * tier, not just be an approved instructor — grandfathering waives real
 * verification steps entirely, so the bar for who can invoke it is
 * deliberately higher than a normal sign-off.
 */
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { enrollments, users } from "../../drizzle/schema";
import { isInstructorQualifiedForCourse } from "./instructor-qualifications";

const FELLOWSHIP_GRANDFATHERABLE_PROGRAM_TYPES = new Set(["bls", "acls", "pals", "nrp"]);

export async function grandfatherFellowshipCourseCompletion(
  enrollmentId: number,
  leadInstructorUserId: number,
  leadInstructorName: string
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };

  const instructorRows = await db
    .select({ instructorTier: users.instructorTier, role: users.role, name: users.name })
    .from(users)
    .where(eq(users.id, leadInstructorUserId))
    .limit(1);
  const instructor = instructorRows[0];

  if (!instructor) {
    return { success: false, error: "Instructor not found." };
  }
  if (instructor.instructorTier !== "lead_instructor" && instructor.role !== "admin") {
    return {
      success: false,
      error: "Only a Lead Instructor (or a platform admin) can grandfather a Fellowship course completion.",
    };
  }

  const enrollmentRows = await db.select().from(enrollments).where(eq(enrollments.id, enrollmentId)).limit(1);
  const enrollment = enrollmentRows[0];
  if (!enrollment) {
    return { success: false, error: "Enrollment not found." };
  }
  if (!FELLOWSHIP_GRANDFATHERABLE_PROGRAM_TYPES.has(enrollment.programType)) {
    return {
      success: false,
      error: "Fellowship grandfathering only applies to BLS, ACLS, PALS, or NRP enrollments.",
    };
  }

  // Same per-course competency bar as a normal practical sign-off (CEO
  // decision, 2026-07-21) — a lead_instructor's seniority doesn't waive
  // needing to have completed this specific course themselves.
  const qualified = await isInstructorQualifiedForCourse(db, leadInstructorUserId, enrollment.programType);
  if (!qualified) {
    return {
      success: false,
      error: `This Lead Instructor is not qualified to grandfather ${enrollment.programType.toUpperCase()} — they must have completed ${enrollment.programType.toUpperCase()} themselves first.`,
    };
  }

  await db
    .update(enrollments)
    .set({
      fellowshipGrandfathered: true,
      fellowshipGrandfatheredAt: new Date(),
      fellowshipGrandfatheredByUserId: leadInstructorUserId,
      fellowshipGrandfatheredByName: leadInstructorName || instructor.name || "Lead Instructor",
    })
    .where(eq(enrollments.id, enrollmentId));

  console.log(
    `[Fellowship] Course ${enrollment.programType} grandfathered for enrollment ${enrollmentId} by Lead Instructor ${leadInstructorUserId} (${leadInstructorName})`
  );

  return { success: true };
}
