import { and, eq } from "drizzle-orm";
import { enrollments, quizzes, userProgress } from "../../drizzle/schema";
import { examKindFromQuizTitle } from "../../shared/microcourse-exam-policy";
import {
  getMicrocourseExamState,
  resolveCourseDiagnosticQuizId,
} from "./microcourse-exam-gate";
import { isMicroCourseEnrollmentId } from "./sync-micro-course-enrollment-progress";
import { resolveAhaCourseAnchor, type AhaAnchorProgramType } from "./resolve-aha-course-anchor";

export type ResetDiagnosticResult =
  | { ok: true; progressId: number; quizId: number; previousScore: number | null }
  | { ok: false; message: string };

async function resolveDiagnosticQuizIdForEnrollment(
  db: any,
  userId: number,
  enrollmentId: number,
  isMicro: boolean
): Promise<number | null> {
  if (isMicro) {
    const state = await getMicrocourseExamState(db, userId, enrollmentId);
    return state?.diagnosticQuizId ?? null;
  }

  const enrolRows = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);
  const enrol = enrolRows[0] as { courseId: number | null; programType: string | null } | undefined;
  if (!enrol) return null;

  let courseId = enrol.courseId;
  if (courseId == null && enrol.programType) {
    const anchor = await resolveAhaCourseAnchor(db, enrol.programType as AhaAnchorProgramType);
    courseId = anchor?.id ?? null;
  }
  if (courseId == null) return null;
  return resolveCourseDiagnosticQuizId(db, courseId);
}

export async function resetDiagnosticAttemptsForEnrollment(
  db: any,
  params: { userId: number; enrollmentId: number; quizId?: number; adminUserId: number }
): Promise<ResetDiagnosticResult> {
  void params.adminUserId;
  const isMicro = await isMicroCourseEnrollmentId(db, params.enrollmentId);
  const diagnosticQuizId =
    params.quizId ??
    (await resolveDiagnosticQuizIdForEnrollment(db, params.userId, params.enrollmentId, isMicro));

  if (!diagnosticQuizId) {
    return { ok: false, message: "No diagnostic quiz found for this enrollment." };
  }

  const quizMeta = await db
    .select({ title: quizzes.title, moduleId: quizzes.moduleId })
    .from(quizzes)
    .where(eq(quizzes.id, diagnosticQuizId))
    .limit(1);
  const quizTitle = quizMeta[0]?.title as string | undefined;
  if (examKindFromQuizTitle(quizTitle) !== "diagnostic") {
    return { ok: false, message: "Target quiz is not a diagnostic baseline." };
  }

  const moduleId = quizMeta[0]?.moduleId as number | undefined;
  if (!moduleId) {
    return { ok: false, message: "Diagnostic quiz module not found." };
  }

  const existing = await db
    .select()
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, params.userId),
        eq(userProgress.enrollmentId, params.enrollmentId),
        eq(userProgress.quizId, diagnosticQuizId)
      )
    )
    .limit(1);

  const row = existing[0] as { id: number; score: number | null } | undefined;
  const previousScore = row?.score ?? null;
  const now = new Date();

  if (row) {
    await db
      .update(userProgress)
      .set({
        attempts: 0,
        score: null,
        status: "in_progress",
        completedAt: null,
        updatedAt: now,
      })
      .where(eq(userProgress.id, row.id));
    return { ok: true, progressId: row.id, quizId: diagnosticQuizId, previousScore };
  }

  return { ok: false, message: "No diagnostic progress row to reset for this enrollment." };
}
