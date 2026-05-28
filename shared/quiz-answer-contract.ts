/**
 * Quiz correctAnswer contract for quizQuestions.correctAnswer (TEXT / JSON).
 *
 * Runtime grading (learning.submitQuiz, MicroCoursePlayerDB) compares:
 *   userAnswer (option text string) === JSON.parse(correctAnswer)
 *
 * Therefore correctAnswer MUST store the full option label, NOT a numeric index.
 */

export type QuizAnswerEncoding = "value" | "index" | "letter" | "unknown";

const LETTER_PATTERN = /^[A-D]$/i;

/**
 * Parse a stored correctAnswer column value to the string used for comparison.
 */
export function parseStoredQuizCorrectAnswer(raw: string | null | undefined): string {
  if (raw == null || raw === "") return "";
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "string") return parsed;
    if (typeof parsed === "number") return String(parsed);
    return String(parsed);
  } catch {
    return trimmed;
  }
}

/**
 * Classify how a stored answer was encoded (for diagnostics / hotfix scripts).
 */
export function classifyQuizAnswerEncoding(
  raw: string | null | undefined,
  options: string[]
): QuizAnswerEncoding {
  const resolved = parseStoredQuizCorrectAnswer(raw);
  if (!resolved) return "unknown";
  if (options.includes(resolved)) return "value";
  if (LETTER_PATTERN.test(resolved)) return "letter";
  const asIndex = Number.parseInt(resolved, 10);
  if (
    !Number.isNaN(asIndex) &&
    String(asIndex) === resolved &&
    asIndex >= 0 &&
    asIndex < options.length
  ) {
    return "index";
  }
  return "unknown";
}

/**
 * Resolve seed-author input (index or value) to the canonical option text.
 */
export function resolveQuizCorrectOptionText(
  correct: number | string,
  options: string[]
): string {
  if (typeof correct === "number") {
    const opt = options[correct];
    if (opt == null) {
      throw new Error(
        `Quiz correct index ${correct} out of range (options length ${options.length})`
      );
    }
    return opt;
  }
  if (options.includes(correct)) return correct;
  throw new Error(
    `Quiz correct value "${correct}" not found in options: ${options.join(" | ")}`
  );
}

/**
 * Normalize any author input to the value stored in quizQuestions.correctAnswer.
 */
export function normalizeQuizCorrectAnswer(
  correct: number | string,
  options: string[]
): string {
  return resolveQuizCorrectOptionText(correct, options);
}

/**
 * Encode for DB insert/update (JSON string of option text).
 */
export function encodeQuizCorrectAnswerForStorage(
  correct: number | string,
  options: string[]
): string {
  return JSON.stringify(normalizeQuizCorrectAnswer(correct, options));
}

/**
 * Whether stored value will grade correctly against options (value-based contract).
 */
export function isStoredQuizCorrectAnswerValid(
  raw: string | null | undefined,
  options: string[]
): boolean {
  const resolved = parseStoredQuizCorrectAnswer(raw);
  return options.includes(resolved);
}

/**
 * Assert before write; throws if encoding would break grading.
 */
export function assertQuizCorrectAnswerValid(
  correct: number | string,
  options: string[]
): void {
  const text = normalizeQuizCorrectAnswer(correct, options);
  if (!options.includes(text)) {
    throw new Error(`Invalid quiz correct answer "${text}" for options`);
  }
}
