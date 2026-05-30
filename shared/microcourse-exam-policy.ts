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

export type MicrocourseExamKind = "diagnostic" | "summative" | "formative";

export type FormativeQuestion = {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};

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

/** Pad bank to minimum size by cycling existing items (same content, shuffled order at runtime). */
export function expandQuestionBank<T>(questions: T[], minSize = MICROCOURSE_MIN_QUESTION_BANK_SIZE): T[] {
  if (questions.length === 0) return [];
  if (questions.length >= minSize) return questions;
  const expanded = [...questions];
  while (expanded.length < minSize) {
    expanded.push(questions[expanded.length % questions.length]!);
  }
  return expanded;
}

export function examKindFromQuizTitle(title: string | null | undefined): MicrocourseExamKind {
  const t = (title ?? "").trim().toLowerCase();
  if (t.startsWith("diagnostic")) return "diagnostic";
  if (t.startsWith("summative")) return "summative";
  return "formative";
}

export function shuffleQuestionIndices(count: number, seed?: number): number[] {
  const indices = Array.from({ length: count }, (_, i) => i);
  let s = seed ?? Date.now();
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

export function canAttemptSummative(params: {
  attempts: number;
  lastAttemptAt: Date | null;
  now?: Date;
}): { allowed: boolean; reason?: string; retryAvailableAt?: Date } {
  const now = params.now ?? new Date();
  if (params.attempts >= MICROCOURSE_SUMMATIVE_MAX_ATTEMPTS) {
    return { allowed: false, reason: "Maximum summative attempts reached." };
  }
  if (params.attempts > 0 && params.lastAttemptAt) {
    const elapsed = now.getTime() - params.lastAttemptAt.getTime();
    if (elapsed < MICROCOURSE_SUMMATIVE_RETRY_COOLDOWN_MS) {
      const retryAvailableAt = new Date(
        params.lastAttemptAt.getTime() + MICROCOURSE_SUMMATIVE_RETRY_COOLDOWN_MS
      );
      return {
        allowed: false,
        reason: "Summative retry available after 24 hours.",
        retryAvailableAt,
      };
    }
  }
  return { allowed: true };
}

export function summativePassed(score: number | null | undefined): boolean {
  return (score ?? 0) >= MICROCOURSE_SUMMATIVE_PASS_PERCENT;
}
