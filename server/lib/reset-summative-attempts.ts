import { and, eq } from "drizzle-orm";
import { enrollments, quizzes, userProgress } from "../../drizzle/schema";
import { examKindFromQuizTitle } from "../../shared/microcourse-exam-policy";
import { getMicrocourseExamState, resolveCourseSummativeQuizId } from "./microcourse-exam-gate";
import { isMicroCourseEnrollmentId } from "./sync-micro-course-enrollment-progress";
import { resolveAhaCourseAnchor, type AhaAnchorProgramType } from "./resolve-aha-course-anchor";

export type ResetSummativeResult =
  | { ok: true; progressId: number; quizId: number; previousAttempts: number; previousScore: number | null }
  | { ok: false; message: string };

async function resolveSummativeQuizIdForEnrollment(
  db: any,
  userId: number,
  enrollmentId: number,
  isMicro: boolean
): Promise<number | null> {
  if (isMicro) {
    const state = await getMicrocourseExamState(db, userId, enrollmentId);
    return state?.summativeQuizId ?? null;
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
  return resolveCourseSummativeQuizId(db, courseId);
}

export async function resetSummativeAttemptsForEnrollment(
  db: any,
  params: { userId: number; enrollmentId: number; quizId?: number; adminUserId: number }
): Promise<ResetSummativeResult> {
  void params.adminUserId;
  const isMicro = await isMicroCourseEnrollmentId(db, params.enrollmentId, params.userId);
  const summativeQuizId =
    params.quizId ??
    (await resolveSummativeQuizIdForEnrollment(db, params.userId, params.enrollmentId, isMicro));

  if (!summativeQuizId) {
    return { ok: false, message: "No summative quiz found for this enrollment." };
  }

  const quizMeta = await db
    .select({ title: quizzes.title, moduleId: quizzes.moduleId })
    .from(quizzes)
    .where(eq(quizzes.id, summativeQuizId))
    .limit(1);
  const quizTitle = quizMeta[0]?.title as string | undefined;
  if (examKindFromQuizTitle(quizTitle) !== "summative") {
    return { ok: false, message: "Target quiz is not a summative exam." };
  }

  const moduleId = quizMeta[0]?.moduleId as number | undefined;
  if (!moduleId) {
    return { ok: false, message: "Summative quiz module not found." };
  }

  const existing = await db
    .select()
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, params.userId),
        eq(userProgress.enrollmentId, params.enrollmentId),
        eq(userProgress.quizId, summativeQuizId)
      )
    )
    .limit(1);

  const row = existing[0] as
    | {
        id: number;
        attempts: number | null;
        score: number | null;
      }
    | undefined;

  const previousAttempts = row?.attempts ?? 0;
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
    return {
      ok: true,
      progressId: row.id,
      quizId: summativeQuizId,
      previousAttempts,
      previousScore,
    };
  }

  await db.insert(userProgress).values({
    userId: params.userId,
    enrollmentId: params.enrollmentId,
    moduleId,
    quizId: summativeQuizId,
    attempts: 0,
    score: null,
    status: "in_progress",
    createdAt: now,
    updatedAt: now,
  });

  const inserted = await db
    .select({ id: userProgress.id })
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, params.userId),
        eq(userProgress.enrollmentId, params.enrollmentId),
        eq(userProgress.quizId, summativeQuizId)
      )
    )
    .limit(1);

  const progressId = inserted[0]?.id;
  if (!progressId) {
    return { ok: false, message: "Could not create reset progress row." };
  }

  return {
    ok: true,
    progressId: Number(progressId),
    quizId: summativeQuizId,
    previousAttempts: 0,
    previousScore: null,
  };
}
