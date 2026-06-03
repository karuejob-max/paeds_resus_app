import {
  MICROCOURSE_SUMMATIVE_MAX_ATTEMPTS,
  type SummativeBlockKind,
} from "./microcourse-exam-policy";

/** Public learner route for assessment rules (linked from players and blocked states). */
export const EXAM_POLICY_LEARNER_PATH = "/learning/exam-policy";

const EAT_TIMEZONE = "Africa/Nairobi";

/** Format a retry window for learners in East Africa Time (EAT). */
export function formatRetryAtEat(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: EAT_TIMEZONE,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(d);
}

export type SummativeRetryBlockedCopy = {
  title: string;
  lines: string[];
};

export function buildSummativeRetryBlockedCopy(params: {
  attempts: number;
  maxAttempts?: number;
  blockKind: SummativeBlockKind;
  retryAvailableAt: string | null;
}): SummativeRetryBlockedCopy | null {
  const max = params.maxAttempts ?? MICROCOURSE_SUMMATIVE_MAX_ATTEMPTS;
  if (params.blockKind === "none") return null;

  const used = Math.min(params.attempts, max);
  const attemptsLine = `Attempts used: ${used} of ${max}.`;

  if (params.blockKind === "max_attempts") {
    return {
      title: "Maximum summative attempts reached",
      lines: [
        attemptsLine,
        "You have used all allowed attempts for this summative exam. Contact support if you believe an attempt was recorded in error.",
      ],
    };
  }

  if (params.blockKind === "cooldown" && params.retryAvailableAt) {
    const when = formatRetryAtEat(params.retryAvailableAt);
    return {
      title: "Summative retry on cooldown",
      lines: [
        attemptsLine,
        `You can retry after ${when}.`,
        "There must be at least 24 hours between summative attempts.",
      ],
    };
  }

  return {
    title: "Summative retry not available yet",
    lines: [attemptsLine, "Check back later or review the assessment policy."],
  };
}

/** Server / toast message when recordQuizAttempt rejects a summative submit. */
export function formatSummativeForbiddenMessage(params: {
  attempts: number;
  maxAttempts?: number;
  blockKind: SummativeBlockKind;
  retryAvailableAt: Date | null;
}): string {
  const copy = buildSummativeRetryBlockedCopy({
    attempts: params.attempts,
    maxAttempts: params.maxAttempts,
    blockKind: params.blockKind,
    retryAvailableAt: params.retryAvailableAt?.toISOString() ?? null,
  });
  if (!copy) return "Summative retry not available yet.";
  return [copy.title, ...copy.lines].join(" ");
}
