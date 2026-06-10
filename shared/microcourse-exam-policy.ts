/**
 * Fellowship micro-course exam policy (CLINICAL_CONTENT_GOVERNANCE §3.4, §8 item 9).
 */

export const MICROCOURSE_SUMMATIVE_PASS_PERCENT = 80;
export const MICROCOURSE_SUMMATIVE_MAX_ATTEMPTS = 3; // initial + 2 retries
export const MICROCOURSE_SUMMATIVE_RETRY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export const MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE = "Diagnostic baseline";
export const MICROCOURSE_SUMMATIVE_QUIZ_TITLE = "Summative knowledge check";
export const MICROCOURSE_FORMATIVE_QUIZ_TITLE = "Knowledge check";

/** Minimum bank size so summative shuffle remains meaningful (governance §3.4). */
export const MICROCOURSE_MIN_QUESTION_BANK_SIZE = 15;

/** Diagnostic baseline size — disjoint from summative when bank is large enough. */
export const MICROCOURSE_DIAGNOSTIC_BANK_SIZE = 10;

/** Minimum total unique stems for fully disjoint diagnostic (10) + summative (15). */
export const MICROCOURSE_FULL_QUESTION_BANK_SIZE =
  MICROCOURSE_MIN_QUESTION_BANK_SIZE + MICROCOURSE_DIAGNOSTIC_BANK_SIZE;

export type MicrocourseExamKind = "diagnostic" | "summative" | "formative";

export type FormativeQuestion = {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};

/** Minimum module-native formative items (governance §3.3 — taught-before-tested). */
export const MIN_FORMATIVE_QUESTIONS_PER_MODULE = 3;

export type ModuleWithFormativeQuestions = {
  questions?: FormativeQuestion[];
};

/** Normalize question stem for dedupe comparisons. */
export function normalizeQuestionStem(question: string | null | undefined): string {
  return (question ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

/** Stable dedupe by stem — keeps first occurrence (never cycle-pad duplicates). */
export function padModuleFormativeQuestions(
  questions: FormativeQuestion[],
  _minSize = MIN_FORMATIVE_QUESTIONS_PER_MODULE
): FormativeQuestion[] {
  return uniqueFormativeQuestions(questions);
}

/** Distribute course quiz questions across modules (1+ per module, round-robin if needed). */
export function distributeFormativeQuestions(
  questions: FormativeQuestion[],
  moduleCount: number
): FormativeQuestion[][] {
  if (moduleCount <= 0) return [];
  if (questions.length === 0) {
    return Array.from({ length: moduleCount }, () => []);
  }
  const perModule: FormativeQuestion[][] = Array.from({ length: moduleCount }, () => []);
  for (let i = 0; i < moduleCount; i++) {
    perModule[i]!.push(questions[i % questions.length]!);
  }
  let qIdx = moduleCount;
  while (qIdx < questions.length) {
    perModule[qIdx % moduleCount]!.push(questions[qIdx]!);
    qIdx++;
  }
  return perModule;
}

/** Contiguous chunks from summative bank — fallback when modules lack native questions. */
export function assignFormativeByModuleChunks(
  questions: FormativeQuestion[],
  moduleCount: number,
  minPerModule = MIN_FORMATIVE_QUESTIONS_PER_MODULE
): FormativeQuestion[][] {
  if (moduleCount <= 0) return [];
  if (questions.length === 0) {
    return Array.from({ length: moduleCount }, () => []);
  }
  const perModule: FormativeQuestion[][] = Array.from({ length: moduleCount }, () => []);
  for (let i = 0; i < questions.length; i++) {
    perModule[i % moduleCount]!.push(questions[i]!);
  }
  for (let m = 0; m < moduleCount; m++) {
    if (perModule[m]!.length === 0) {
      perModule[m]!.push(questions[m % questions.length]!);
    }
    perModule[m] = padModuleFormativeQuestions(perModule[m]!, minPerModule);
  }
  return perModule;
}

/**
 * Prefer module-native formative banks; fall back to contiguous summative chunks (not rotation).
 */
export function resolveModuleFormativeQuestions(
  modules: ModuleWithFormativeQuestions[],
  summativeBank: FormativeQuestion[]
): FormativeQuestion[][] {
  const hasNative = modules.some((m) => (m.questions?.length ?? 0) > 0);
  if (hasNative) {
    return modules.map((m) => padModuleFormativeQuestions(m.questions ?? []));
  }
  return assignFormativeByModuleChunks(summativeBank, modules.length);
}

/** Dedupe formative items by question stem (stable order). */
export function uniqueFormativeQuestions(questions: FormativeQuestion[]): FormativeQuestion[] {
  const seen = new Set<string>();
  const out: FormativeQuestion[] = [];
  for (const q of questions) {
    const key = normalizeQuestionStem(q.question);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}

export type QuizRowWithStem = { id?: number; question: string };

/** Dedupe quiz rows by stem for player/exam delivery (stable order, first wins). */
export function dedupeQuizRowsByStem<T extends QuizRowWithStem>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const key = normalizeQuestionStem(row.question);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

/**
 * Split a course bank into diagnostic + summative with minimal overlap.
 * When the bank is large enough, summative excludes diagnostic stems entirely.
 */
export function resolveExamQuestionBanks(questions: FormativeQuestion[]): {
  diagnostic: FormativeQuestion[];
  summative: FormativeQuestion[];
} {
  const unique = uniqueFormativeQuestions(questions);
  if (unique.length === 0) {
    return { diagnostic: [], summative: [] };
  }

  let diagnosticCount = 0;
  if (unique.length >= MICROCOURSE_FULL_QUESTION_BANK_SIZE) {
    diagnosticCount = MICROCOURSE_DIAGNOSTIC_BANK_SIZE;
  } else if (unique.length >= 20) {
    diagnosticCount = 5;
  } else if (unique.length >= MICROCOURSE_MIN_QUESTION_BANK_SIZE) {
    diagnosticCount = 5;
  } else if (unique.length > 1) {
    diagnosticCount = Math.min(3, unique.length - 1);
  }

  const diagnostic = unique.slice(0, diagnosticCount);
  const diagnosticStems = new Set(diagnostic.map((q) => normalizeQuestionStem(q.question)));
  const disjointSummative = unique.filter(
    (q) => !diagnosticStems.has(normalizeQuestionStem(q.question))
  );

  const summative =
    disjointSummative.length >= MICROCOURSE_MIN_QUESTION_BANK_SIZE
      ? disjointSummative
      : unique;

  return { diagnostic, summative };
}

export type CourseWithModuleFormatives = {
  modules: ModuleWithFormativeQuestions[];
  quiz?: { questions: FormativeQuestion[] };
};

/**
 * Pad module-native formatives only — never pull from summative bank (governance §3.3).
 */
export function materializeModuleNativeFormatives<T extends CourseWithModuleFormatives>(course: T): T {
  if (course.modules.length === 0) return course;

  const modules = course.modules.map((mod) => ({
    ...mod,
    questions: padModuleFormativeQuestions(uniqueFormativeQuestions(mod.questions ?? [])),
  }));

  return { ...course, modules };
}

/** Return unique stems; cycle only when allowDuplicates — prefer authoring ≥minSize unique items. */
export function expandQuestionBank<T extends { question?: string }>(
  questions: T[],
  minSize = MICROCOURSE_MIN_QUESTION_BANK_SIZE,
  allowDuplicates = false
): T[] {
  if (questions.length === 0) return [];
  const unique =
    questions[0] && "question" in questions[0]
      ? (uniqueFormativeQuestions(questions as unknown as FormativeQuestion[]) as unknown as T[])
      : questions;
  if (unique.length >= minSize) return unique;
  if (!allowDuplicates) return unique;
  const expanded = [...unique];
  while (expanded.length < minSize) {
    expanded.push(unique[expanded.length % unique.length]!);
  }
  return expanded;
}

/** Summative/diagnostic bank: unique stems only; throws if below governance minimum. */
export function resolveSummativeQuestionBank(
  questions: FormativeQuestion[],
  minSize = MICROCOURSE_MIN_QUESTION_BANK_SIZE
): FormativeQuestion[] {
  const unique = uniqueFormativeQuestions(questions);
  if (unique.length < minSize) {
    throw new Error(
      `Summative bank has ${unique.length} unique stem(s); need ≥${minSize} (CLINICAL_CONTENT_GOVERNANCE §3.4).`
    );
  }
  return unique;
}

export function examKindFromQuizTitle(title: string | null | undefined): MicrocourseExamKind {
  const t = (title ?? "").trim().toLowerCase();
  if (t.startsWith("diagnostic")) return "diagnostic";
  if (t.includes("summative")) return "summative";
  return "formative";
}

/** LCG PRNG — same algorithm used for question-order shuffle. */
export function createSeededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/** Fisher–Yates shuffle with deterministic seed (stable across client/server). */
export function shuffleWithSeed<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  const rand = createSeededRandom(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function shuffleQuestionIndices(count: number, seed?: number): number[] {
  return shuffleWithSeed(
    Array.from({ length: count }, (_, i) => i),
    seed ?? Date.now()
  );
}

/** Per-question seed so each stem gets an independent option order. */
export function deriveOptionShuffleSeed(
  sessionSeed: number,
  questionKey: number | string
): number {
  const keyPart =
    typeof questionKey === "number"
      ? questionKey >>> 0
      : [...questionKey].reduce((h, c) => ((h * 31 + c.charCodeAt(0)) >>> 0), 0);
  return (sessionSeed ^ (keyPart * 2654435761)) >>> 0;
}

/** Shuffle MCQ options for display. Grading uses option text, not index. */
export function shuffleQuizOptions(
  options: string[],
  questionKey: number | string,
  sessionSeed: number
): string[] {
  if (options.length <= 1) return options;
  return shuffleWithSeed(options, deriveOptionShuffleSeed(sessionSeed, questionKey));
}

export type QuizQuestionWithOptions = {
  id?: number;
  options?: string[];
};

/** Apply per-question option shuffle for an exam attempt. */
export function shuffleQuestionsDisplayOptions<T extends QuizQuestionWithOptions>(
  questions: T[],
  sessionSeed: number
): T[] {
  return questions.map((q, idx) => {
    const opts = q.options;
    if (!opts?.length) return q;
    const key = q.id ?? idx;
    return { ...q, options: shuffleQuizOptions(opts, key, sessionSeed) };
  });
}

/**
 * Rephrase a module-native formative stem for summative use — clinically equivalent,
 * textually disjoint, with no user-facing meta hints (e.g. "Course synthesis").
 */
export function rephraseFormativeStemForSummative(stem: string): string {
  const original = stem.trim();
  let t = original.replace(/\?$/, "").trim();
  const origNorm = normalizeQuestionStem(t);

  const transforms: Array<(s: string) => string | null> = [
    (s) => {
      const m = s.match(/^(.+?) includes (.+?):$/i);
      return m ? `What ${m[2].toLowerCase()} criteria apply under ${m[1]}?` : null;
    },
    (s) => {
      const m = s.match(/^The most common (.+?) is:$/i);
      return m ? `What is the most common ${m[1].toLowerCase()}?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) is typically defined as:$/i);
      return m ? `How is ${m[1].toLowerCase()} typically defined?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) is defined as (.+?):$/i);
      return m ? `What defines ${m[1].toLowerCase()}?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) may receive (?:a cautious )?(.+?) of:$/i);
      return m
        ? `What ${m[2].toLowerCase()} may be cautiously given for ${m[1].toLowerCase()}?`
        : null;
    },
    (s) => {
      const m = s.match(/^(.+?) should:$/i);
      return m ? `What should be done for ${m[1].toLowerCase()}?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) needs first:$/i);
      return m ? `What is the first priority for ${m[1].toLowerCase()}?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) is indicated in (.+?) when (.+?) is:$/i);
      return m
        ? `When ${m[3].toLowerCase()}, when is ${m[1].toLowerCase()} indicated in ${m[2].toLowerCase()}?`
        : null;
    },
    (s) => {
      const m = s.match(/^(.+?) is valuable because:$/i);
      return m ? `Why is ${m[1].toLowerCase()} valuable in clinical practice?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) is approximately:$/i);
      return m ? `What is the approximate figure for ${m[1].toLowerCase()}?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) causes include:$/i);
      return m ? `Which causes are associated with ${m[1].toLowerCase()}?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) include:$/i);
      return m ? `What is included under ${m[1].toLowerCase()}?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) includes all EXCEPT:$/i);
      return m ? `Which item is NOT part of ${m[1].toLowerCase()}?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) is especially concerning because it:$/i);
      return m ? `Why is ${m[1].toLowerCase()} clinically concerning?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) is usually managed by:$/i);
      return m ? `How is ${m[1].toLowerCase()} usually managed?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) is best described as:$/i);
      return m ? `Which description best applies to ${m[1].toLowerCase()}?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) is best based on:$/i);
      return m ? `What should ${m[1].toLowerCase()} be based on?` : null;
    },
    (s) => {
      const m = s.match(/^A child with (.+?) should receive:$/i);
      return m ? `What should a child with ${m[1].toLowerCase()} receive?` : null;
    },
    (s) => {
      const m = s.match(/^A child with (.+?) needs:$/i);
      return m ? `What does a child with ${m[1].toLowerCase()} need?` : null;
    },
    (s) => {
      const m = s.match(/^First intervention for (.+?):$/i);
      return m ? `What is the first intervention for ${m[1].toLowerCase()}?` : null;
    },
    (s) => {
      const m = s.match(/^Which drug should be held or dose-adjusted first in (.+)$/i);
      return m
        ? `In ${m[1].toLowerCase()}, which drug should be held or dose-adjusted first?`
        : null;
    },
    (s) => {
      const m = s.match(/^(.+?) presents with:$/i);
      return m ? `How does ${m[1].toLowerCase()} typically present?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) — first action:$/i);
      return m ? `What is the first action when ${m[1].toLowerCase()} is suspected?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) — priority order:$/i);
      return m ? `What is the correct management priority for ${m[1].toLowerCase()}?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) first-line includes:$/i);
      return m ? `What does first-line management of ${m[1].toLowerCase()} include?` : null;
    },
    (s) => {
      const m = s.match(/^Before (.+?) when (.+?), document:$/i);
      return m
        ? `Before ${m[1].toLowerCase()} when ${m[2].toLowerCase()}, what must be documented?`
        : null;
    },
    (s) => {
      const m = s.match(/^(.+?) concentration for (.+?) is:$/i);
      return m
        ? `What concentration of ${m[1].toLowerCase()} is used for ${m[2].toLowerCase()}?`
        : null;
    },
    (s) => {
      const m = s.match(/^(.+?) refers to:$/i);
      return m ? `What does the term "${m[1].toLowerCase()}" refer to?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) is a rapid-onset reaction involving:$/i);
      return m ? `A rapid-onset ${m[1].toLowerCase()} involves which feature?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) in (.+?) is:$/i);
      return m
        ? `Regarding ${m[1].toLowerCase()} in ${m[2].toLowerCase()}, which is correct?`
        : null;
    },
    (s) => {
      const m = s.match(/^(.+?) in (.+?):$/i);
      return m ? `In ${m[2].toLowerCase()}, what applies to ${m[1].toLowerCase()}?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) on discharge should include:$/i);
      return m ? `What should a discharge ${m[1].toLowerCase()} include?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) is indicated when:$/i);
      return m ? `When is ${m[1].toLowerCase()} indicated?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) dose for (.+?) is typically:$/i);
      return m ? `What is the typical ${m[1].toLowerCase()} dose for ${m[2].toLowerCase()}?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) during (.+?) is used to:$/i);
      return m ? `Why is ${m[1].toLowerCase()} used during ${m[2].toLowerCase()}?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) rather than (.+?) when:$/i);
      return m ? `When should you choose ${m[1].toLowerCase()} over ${m[2].toLowerCase()}?` : null;
    },
    (s) => {
      const m = s.match(/^If (.+?) and (.+?):$/i);
      return m ? `If ${m[1].toLowerCase()} and ${m[2].toLowerCase()}, what is the priority?` : null;
    },
    (s) => {
      const m = s.match(/^(.+?) with (.+?) should receive:$/i);
      return m
        ? `What should a patient with ${m[1].toLowerCase()} and ${m[2].toLowerCase()} receive?`
        : null;
    },
    (s) =>
      s.endsWith(":")
        ? `Which statement about ${s.slice(0, -1).toLowerCase()} is correct?`
        : null,
    (s) => (!s.endsWith("?") ? `${s}?` : null),
  ];

  for (const fn of transforms) {
    const out = fn(t);
    if (out && normalizeQuestionStem(out) !== origNorm) return out;
  }
  return t.endsWith("?") ? t : `${t}?`;
}

/** Strip user-facing exam meta hints from question stems. */
export function stripExamMetaHints(stem: string): string {
  return stem
    .replace(/Course synthesis \(Module \d+\):\s*/gi, "")
    .replace(/\s*—\s*select the answer taught in this course\.?/gi, "")
    .replace(/\s*\(-\s*select the answer taught in this course\)\.?/gi, "")
    .replace(/Module \d+ synthesis:\s*/gi, "")
    .replace(/Course synthesis:\s*/gi, "")
    .trim();
}

export type SummativeBlockKind = "none" | "max_attempts" | "cooldown";

export function canAttemptSummative(params: {
  attempts: number;
  lastAttemptAt: Date | null;
  now?: Date;
}): {
  allowed: boolean;
  blockKind: SummativeBlockKind;
  reason?: string;
  retryAvailableAt?: Date;
} {
  const now = params.now ?? new Date();
  if (params.attempts >= MICROCOURSE_SUMMATIVE_MAX_ATTEMPTS) {
    return {
      allowed: false,
      blockKind: "max_attempts",
      reason: "Maximum summative attempts reached.",
    };
  }
  if (params.attempts > 0 && params.lastAttemptAt) {
    const elapsed = now.getTime() - params.lastAttemptAt.getTime();
    if (elapsed < MICROCOURSE_SUMMATIVE_RETRY_COOLDOWN_MS) {
      const retryAvailableAt = new Date(
        params.lastAttemptAt.getTime() + MICROCOURSE_SUMMATIVE_RETRY_COOLDOWN_MS
      );
      return {
        allowed: false,
        blockKind: "cooldown",
        reason: "Summative retry available after 24 hours.",
        retryAvailableAt,
      };
    }
  }
  return { allowed: true, blockKind: "none" };
}

export function summativePassed(score: number | null | undefined): boolean {
  return (score ?? 0) >= MICROCOURSE_SUMMATIVE_PASS_PERCENT;
}
