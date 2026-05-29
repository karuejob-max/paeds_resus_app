import { and, asc, eq, inArray } from "drizzle-orm";
import {
  courses,
  microCourseEnrollments,
  microCourses,
  modules,
  quizQuestions,
  quizzes,
  userProgress,
} from "../../drizzle/schema";
import {
  MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE,
  MICROCOURSE_SUMMATIVE_QUIZ_TITLE,
  canAttemptSummative,
  examKindFromQuizTitle,
  summativePassed,
} from "../../shared/microcourse-exam-policy";

type Db = {
  select: (...args: unknown[]) => { from: (...args: unknown[]) => { where: (...args: unknown[]) => Promise<unknown[]> } };
  query: {
    microCourseEnrollments: { findFirst: (args: unknown) => Promise<{ id: number; userId: number; microCourseId: number } | undefined> };
    microCourses: { findFirst: (args: unknown) => Promise<{ id: number; title: string } | undefined> };
    courses: { findFirst: (args: unknown) => Promise<{ id: number } | undefined> };
  };
};

export type MicrocourseExamState = {
  diagnosticRequired: boolean;
  diagnosticCompleted: boolean;
  summativeRequired: boolean;
  summativePassed: boolean;
  summativeQuizId: number | null;
  diagnosticQuizId: number | null;
  summativeAttempts: number;
  canRetrySummative: boolean;
  retryAvailableAt: string | null;
  summativePassPercent: number;
};

export async function resolveFellowshipCourseId(
  db: Db,
  microCourseTitle: string
): Promise<number | null> {
  const row = await db.query.courses.findFirst({
    where: and(eq(courses.title, microCourseTitle), eq(courses.programType, "fellowship")),
    columns: { id: true },
  } as never);
  return row?.id ?? null;
}

export async function getMicrocourseExamState(
  db: Db,
  userId: number,
  microCourseEnrollmentId: number
): Promise<MicrocourseExamState | null> {
  const enrollment = await db.query.microCourseEnrollments.findFirst({
    where: eq(microCourseEnrollments.id, microCourseEnrollmentId),
  } as never);
  if (!enrollment || enrollment.userId !== userId) return null;

  const microCourse = await db.query.microCourses.findFirst({
    where: eq(microCourses.id, enrollment.microCourseId),
  } as never);
  if (!microCourse?.title) return null;

  const fellowshipCourseId = await resolveFellowshipCourseId(db, microCourse.title);
  if (!fellowshipCourseId) return null;

  const moduleRows = (await (db as any)
    .select({ id: modules.id, order: modules.order })
    .from(modules)
    .where(eq(modules.courseId, fellowshipCourseId))
    .orderBy(asc(modules.order))) as { id: number; order: number }[];

  if (moduleRows.length === 0) {
    return {
      diagnosticRequired: false,
      diagnosticCompleted: true,
      summativeRequired: false,
      summativePassed: true,
      summativeQuizId: null,
      diagnosticQuizId: null,
      summativeAttempts: 0,
      canRetrySummative: true,
      retryAvailableAt: null,
      summativePassPercent: 80,
    };
  }

  const moduleIds = moduleRows.map((m) => m.id);
  const firstModuleId = moduleRows[0]!.id;
  const lastModuleId = moduleRows[moduleRows.length - 1]!.id;

  const quizRows = (await (db as any)
    .select({ id: quizzes.id, moduleId: quizzes.moduleId, title: quizzes.title })
    .from(quizzes)
    .where(inArray(quizzes.moduleId, moduleIds))) as { id: number; moduleId: number; title: string }[];

  const diagnosticQuiz = quizRows.find(
    (q) => q.moduleId === firstModuleId && examKindFromQuizTitle(q.title) === "diagnostic"
  );
  const summativeQuiz = quizRows.find(
    (q) => q.moduleId === lastModuleId && examKindFromQuizTitle(q.title) === "summative"
  );

  const progressRows = (await (db as any)
    .select()
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.enrollmentId, microCourseEnrollmentId),
        inArray(userProgress.moduleId, moduleIds)
      )
    )) as {
    moduleId: number;
    quizId: number | null;
    score: number | null;
    attempts: number | null;
    status: string | null;
    updatedAt: Date | null;
    completedAt: Date | null;
  }[];

  const diagnosticProgress = diagnosticQuiz
    ? progressRows.find((p) => p.quizId === diagnosticQuiz.id)
    : progressRows.find((p) => p.moduleId === firstModuleId && p.status === "completed");

  const summativeProgress = summativeQuiz
    ? progressRows.find((p) => p.quizId === summativeQuiz.id)
    : undefined;

  const diagnosticCompleted = !!diagnosticProgress?.completedAt || diagnosticProgress?.status === "completed";
  const summativeAttempts = summativeProgress?.attempts ?? 0;
  const lastAttemptAt = summativeProgress?.updatedAt ?? summativeProgress?.completedAt ?? null;
  const retryCheck = canAttemptSummative({
    attempts: summativeAttempts,
    lastAttemptAt,
  });
  const passed = summativePassed(summativeProgress?.score ?? null);

  return {
    diagnosticRequired: !!diagnosticQuiz,
    diagnosticCompleted: diagnosticQuiz ? diagnosticCompleted : true,
    summativeRequired: !!summativeQuiz,
    summativePassed: passed,
    summativeQuizId: summativeQuiz?.id ?? null,
    diagnosticQuizId: diagnosticQuiz?.id ?? null,
    summativeAttempts,
    canRetrySummative: retryCheck.allowed,
    retryAvailableAt: retryCheck.retryAvailableAt?.toISOString() ?? null,
    summativePassPercent: 80,
  };
}

export async function assertMicrocourseCompletionAllowed(
  db: Db,
  userId: number,
  microCourseEnrollmentId: number
): Promise<{ ok: true } | { ok: false; message: string }> {
  const state = await getMicrocourseExamState(db, userId, microCourseEnrollmentId);
  if (!state) return { ok: true };
  if (state.diagnosticRequired && !state.diagnosticCompleted) {
    return { ok: false, message: "Complete the diagnostic baseline before claiming your certificate." };
  }
  if (state.summativeRequired && !state.summativePassed) {
    return {
      ok: false,
      message: "Pass the summative knowledge check (80%) before completing this course.",
    };
  }
  return { ok: true };
}

export async function loadSummativeQuestionBank(
  db: Db,
  summativeQuizId: number
): Promise<{ id: number; question: string; options: string[]; explanation: string | null }[]> {
  const rows = (await (db as any)
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, summativeQuizId))
    .orderBy(asc(quizQuestions.order))) as {
    id: number;
    question: string;
    options: string | null;
    explanation: string | null;
  }[];

  return rows.map((r) => ({
    id: r.id,
    question: r.question,
    options: r.options ? (JSON.parse(r.options) as string[]) : [],
    explanation: r.explanation,
  }));
}

export { MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE, MICROCOURSE_SUMMATIVE_QUIZ_TITLE };
