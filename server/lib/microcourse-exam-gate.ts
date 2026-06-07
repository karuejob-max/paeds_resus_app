import { and, asc, desc, eq, inArray, like, or } from "drizzle-orm";
import {
  courses,
  enrollments,
  microCourseEnrollments,
  microCourses,
  modules,
  quizQuestions,
  quizzes,
  userProgress,
} from "../../drizzle/schema";
import {
  MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE,
  MICROCOURSE_SUMMATIVE_MAX_ATTEMPTS,
  MICROCOURSE_SUMMATIVE_QUIZ_TITLE,
  canAttemptSummative,
  dedupeQuizRowsByStem,
  examKindFromQuizTitle,
  summativePassed,
  type SummativeBlockKind,
} from "../../shared/microcourse-exam-policy";
import { gradeQuizAnswerAgainstStored, parseStoredQuizCorrectAnswer } from "../../shared/quiz-answer-contract";

export type SummativeQuestionResult = {
  questionId: number;
  correct: boolean;
  correctOption: string;
  userAnswer: string;
};

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
  summativeMaxAttempts: number;
  summativeBlockKind: SummativeBlockKind;
  canRetrySummative: boolean;
  retryAvailableAt: string | null;
  summativePassPercent: number;
  capstoneRequired: boolean;
  capstonePassed: boolean;
};

export function isDiagnosticProgressComplete(progress: {
  completedAt?: Date | null;
  status?: string | null;
} | null | undefined): boolean {
  return !!progress?.completedAt || progress?.status === "completed";
}

/** Resolve fellowship `courses.id` from catalog micro-course row (title + order fallback). */
export async function resolveFellowshipCourseId(
  db: Db,
  microCourse: { title: string; order?: number | null; courseId?: string | null }
): Promise<number | null> {
  const exact = await db.query.courses.findFirst({
    where: and(eq(courses.title, microCourse.title), eq(courses.programType, "fellowship")),
    columns: { id: true },
  } as never);
  if (exact?.id) return exact.id;

  const titlePrefix = microCourse.title.split(":")[0]?.trim();
  if (!titlePrefix) return null;

  const fallback = await db.query.courses.findFirst({
    where: and(
      eq(courses.programType, "fellowship"),
      or(
        like(courses.title, `%${titlePrefix}%`),
        microCourse.order != null ? eq(courses.order, microCourse.order) : undefined
      )
    ),
    columns: { id: true },
  } as never);
  return fallback?.id ?? null;
}

export function resolveDiagnosticCompleted(params: {
  firstModuleId: number;
  diagnosticQuizId: number | null;
  quizRows: { id: number; moduleId: number; title: string }[];
  progressRows: {
    moduleId: number;
    quizId: number | null;
    status: string | null;
    completedAt: Date | null;
  }[];
}): boolean {
  const { firstModuleId, diagnosticQuizId, quizRows, progressRows } = params;
  const diagnosticQuizIds = new Set(
    quizRows
      .filter(
        (q) => q.moduleId === firstModuleId && examKindFromQuizTitle(q.title) === "diagnostic"
      )
      .map((q) => q.id)
  );
  if (diagnosticQuizId != null) diagnosticQuizIds.add(diagnosticQuizId);

  if (diagnosticQuizIds.size === 0) {
    return progressRows.some(
      (p) => p.moduleId === firstModuleId && isDiagnosticProgressComplete(p)
    );
  }

  return progressRows.some(
    (p) =>
      p.moduleId === firstModuleId &&
      p.quizId != null &&
      diagnosticQuizIds.has(p.quizId) &&
      isDiagnosticProgressComplete(p)
  );
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

  const microCourse = (await db.query.microCourses.findFirst({
    where: eq(microCourses.id, enrollment.microCourseId),
  } as never)) as { title: string; order?: number | null; courseId?: string | null } | undefined;
  if (!microCourse?.title) return null;

  const fellowshipCourseId = await resolveFellowshipCourseId(db, {
    title: microCourse.title,
    order: microCourse.order,
    courseId: microCourse.courseId,
  });
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
      summativeMaxAttempts: MICROCOURSE_SUMMATIVE_MAX_ATTEMPTS,
      summativeBlockKind: "none",
      canRetrySummative: true,
      retryAvailableAt: null,
      summativePassPercent: 80,
      capstoneRequired: false,
      capstonePassed: true,
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

  const summativeProgress = summativeQuiz
    ? progressRows.find((p) => p.quizId === summativeQuiz.id)
    : undefined;

  const diagnosticCompleted = resolveDiagnosticCompleted({
    firstModuleId,
    diagnosticQuizId: diagnosticQuiz?.id ?? null,
    quizRows,
    progressRows,
  });
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
    summativeMaxAttempts: MICROCOURSE_SUMMATIVE_MAX_ATTEMPTS,
    summativeBlockKind: retryCheck.blockKind,
    canRetrySummative: retryCheck.allowed,
    retryAvailableAt: retryCheck.retryAvailableAt?.toISOString() ?? null,
    summativePassPercent: 80,
    capstoneRequired: false,
    capstonePassed: true,
  };
}

export async function assertMicrocourseCompletionAllowed(
  db: Db,
  userId: number,
  microCourseEnrollmentId: number
): Promise<{ ok: true } | { ok: false; message: string }> {
  const state = await getMicrocourseExamState(db, userId, microCourseEnrollmentId);
  if (!state) {
    return {
      ok: false,
      message:
        "Could not verify exam completion for this course. Refresh the page and try again, or contact support if this persists.",
    };
  }
  if (state.diagnosticRequired && !state.diagnosticCompleted) {
    return { ok: false, message: "Complete the diagnostic baseline before claiming your certificate." };
  }
  if (state.summativeRequired && !state.summativePassed) {
    return {
      ok: false,
      message: "Pass the summative knowledge check (80%) before completing this course.",
    };
  }
  if (state.capstoneRequired && !state.capstonePassed) {
    return {
      ok: false,
      message: "Complete and pass the PALS Capstone Simulation (80%) to unlock your certificate.",
    };
  }
  return { ok: true };
}

/** Last-module summative quiz for a course (e.g. PALS 2025 final exam). */
export async function resolveCourseSummativeQuizId(
  db: Db,
  courseId: number
): Promise<number | null> {
  const moduleRows = (await (db as any)
    .select({ id: modules.id })
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(asc(modules.order))) as { id: number }[];

  if (moduleRows.length === 0) return null;
  const lastModuleId = moduleRows[moduleRows.length - 1]!.id;
  const moduleQuizRows = (await (db as any)
    .select({ id: quizzes.id, title: quizzes.title })
    .from(quizzes)
    .where(eq(quizzes.moduleId, lastModuleId))) as { id: number; title: string }[];

  const summative = moduleQuizRows.find((q) => examKindFromQuizTitle(q.title) === "summative");
  return summative?.id ?? null;
}

export async function resolveCourseDiagnosticQuizId(
  db: Db,
  courseId: number
): Promise<number | null> {
  const moduleRows = (await (db as any)
    .select({ id: modules.id })
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(asc(modules.order))) as { id: number }[];

  if (moduleRows.length === 0) return null;
  const firstModuleId = moduleRows[0]!.id;
  const moduleQuizRows = (await (db as any)
    .select({ id: quizzes.id, title: quizzes.title })
    .from(quizzes)
    .where(eq(quizzes.moduleId, firstModuleId))) as { id: number; title: string }[];

  const diagnostic = moduleQuizRows.find((q) => examKindFromQuizTitle(q.title) === "diagnostic");
  return diagnostic?.id ?? null;
}

export async function getAhaCourseExamState(
  db: Db,
  userId: number,
  ahaEnrollmentId: number
): Promise<MicrocourseExamState | null> {
  const enrollmentRows = (await (db as any)
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.id, ahaEnrollmentId), eq(enrollments.userId, userId)))
    .limit(1)) as { id: number; courseId: number | null; programType: string | null }[];

  const enrollment = enrollmentRows[0];
  if (!enrollment) return null;

  let courseId = enrollment.courseId;
  if (courseId == null && enrollment.programType) {
    const courseRow = await db.query.courses.findFirst({
      where: eq(courses.programType, enrollment.programType as never),
      columns: { id: true },
    } as never);
    courseId = courseRow?.id ?? null;
  }
  if (courseId == null) return null;

  const moduleRows = (await (db as any)
    .select({ id: modules.id, order: modules.order })
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(asc(modules.order))) as { id: number; order: number }[];

  const firstModuleId = moduleRows[0]?.id;
  const lastModuleId = moduleRows[moduleRows.length - 1]?.id;

  const moduleIds = moduleRows.map((m) => m.id);
  const quizRows =
    moduleIds.length > 0
      ? ((await (db as any)
          .select({ id: quizzes.id, moduleId: quizzes.moduleId, title: quizzes.title })
          .from(quizzes)
          .where(inArray(quizzes.moduleId, moduleIds))) as {
          id: number;
          moduleId: number;
          title: string;
        }[])
      : [];

  const diagnosticQuiz = firstModuleId
    ? quizRows.find(
        (q) => q.moduleId === firstModuleId && examKindFromQuizTitle(q.title) === "diagnostic"
      )
    : undefined;
  const summativeQuiz = lastModuleId
    ? quizRows.find(
        (q) => q.moduleId === lastModuleId && examKindFromQuizTitle(q.title) === "summative"
      )
    : undefined;

  const summativeQuizId = summativeQuiz?.id ?? (await resolveCourseSummativeQuizId(db, courseId));
  const diagnosticQuizId = diagnosticQuiz?.id ?? (await resolveCourseDiagnosticQuizId(db, courseId));

  const progressRows = (await (db as any)
    .select()
    .from(userProgress)
    .where(
      and(eq(userProgress.userId, userId), eq(userProgress.enrollmentId, ahaEnrollmentId))
    )) as {
    moduleId: number;
    quizId: number | null;
    score: number | null;
    attempts: number | null;
    status: string | null;
    updatedAt: Date | null;
    completedAt: Date | null;
  }[];

  const diagnosticProgress = diagnosticQuizId
    ? progressRows.find((p) => p.quizId === diagnosticQuizId)
    : undefined;

  const summativeProgress = summativeQuizId
    ? progressRows.find((p) => p.quizId === summativeQuizId)
    : undefined;

  const diagnosticCompleted = firstModuleId
    ? resolveDiagnosticCompleted({
        firstModuleId,
        diagnosticQuizId: diagnosticQuizId ?? null,
        quizRows,
        progressRows,
      })
    : isDiagnosticProgressComplete(diagnosticProgress);
  const summativeAttempts = summativeProgress?.attempts ?? 0;
  const lastAttemptAt = summativeProgress?.updatedAt ?? summativeProgress?.completedAt ?? null;
  const retryCheck = canAttemptSummative({
    attempts: summativeAttempts,
    lastAttemptAt,
  });
  const passed = summativePassed(summativeProgress?.score ?? null);

  return {
    diagnosticRequired: !!diagnosticQuizId,
    diagnosticCompleted: diagnosticQuizId ? diagnosticCompleted : true,
    summativeRequired: !!summativeQuizId,
    summativePassed: passed,
    summativeQuizId,
    diagnosticQuizId,
    summativeAttempts,
    summativeMaxAttempts: MICROCOURSE_SUMMATIVE_MAX_ATTEMPTS,
    summativeBlockKind: retryCheck.blockKind,
    canRetrySummative: retryCheck.allowed,
    retryAvailableAt: retryCheck.retryAvailableAt?.toISOString() ?? null,
    summativePassPercent: 80,
    capstoneRequired: enrollment.programType === "pals",
    capstonePassed: enrollment.programType === "pals"
      ? progressRows.some((p) => p.status === "completed" && p.score !== null && p.score >= 80 && p.moduleId === -1)
      : true,
  };
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

  return dedupeQuizRowsByStem(
    rows.map((r) => {
      let options: string[] = [];
      if (r.options) {
        try {
          const parsed = JSON.parse(r.options);
          options = Array.isArray(parsed) ? parsed : [];
        } catch {
          options = [];
        }
      }
      return {
        id: r.id,
        question: r.question,
        options,
        explanation: r.explanation,
      };
    })
  );
}

function resolveCorrectOptionText(
  correctRaw: string | null,
  options: string[]
): string {
  const parsed = parseStoredQuizCorrectAnswer(correctRaw);
  if (!parsed) return "";
  if (options.includes(parsed)) return parsed;
  const idx = Number.parseInt(parsed, 10);
  if (!Number.isNaN(idx) && options[idx] != null) return options[idx]!;
  return parsed;
}

/** Server-side score — never trust client-reported summative scores. */
export async function computeQuizScoreFromDb(
  db: Db,
  quizId: number,
  answers: Record<string | number, string> | null | undefined
): Promise<{
  score: number;
  correctCount: number;
  totalQuestions: number;
  questionResults: SummativeQuestionResult[];
}> {
  const rows = (await (db as any)
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(asc(quizQuestions.order))) as {
    id: number;
    question: string;
    correctAnswer: string | null;
    options: string | null;
  }[];

  const dedupedRows = dedupeQuizRowsByStem(
    rows.map((r) => ({ id: r.id, question: r.question, correctAnswer: r.correctAnswer, options: r.options }))
  );

  if (dedupedRows.length === 0) {
    return { score: 0, correctCount: 0, totalQuestions: 0, questionResults: [] };
  }

  const answerMap = answers ?? {};
  let correctCount = 0;
  const questionResults: SummativeQuestionResult[] = [];

  for (const q of dedupedRows) {
    const fullRow = rows.find((r) => r.id === q.id)!;
    const userAnswer =
      answerMap[q.id] ??
      answerMap[String(q.id)] ??
      (typeof (answerMap as Record<string, string>)[String(q.id)] === "string"
        ? (answerMap as Record<string, string>)[String(q.id)]
        : undefined);
    let options: string[] = [];
    if (fullRow.options) {
      try {
        const parsed = JSON.parse(fullRow.options);
        options = Array.isArray(parsed) ? parsed : [];
      } catch {
        options = [];
      }
    }
    const correctOption = resolveCorrectOptionText(fullRow.correctAnswer, options);
    const correct = userAnswer
      ? gradeQuizAnswerAgainstStored(userAnswer, fullRow.correctAnswer, options)
      : false;
    if (correct) correctCount++;
    questionResults.push({
      questionId: q.id,
      correct,
      correctOption,
      userAnswer: userAnswer ?? "",
    });
  }

  const score = Math.round((correctCount / dedupedRows.length) * 100);
  return { score, correctCount, totalQuestions: dedupedRows.length, questionResults };
}

export { MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE, MICROCOURSE_SUMMATIVE_QUIZ_TITLE };
