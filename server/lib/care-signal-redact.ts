import { eq, and, isNull, isNotNull, lt } from "drizzle-orm";
import { careSignalEvents } from "../../drizzle/schema";
import type { DbClient } from "../db";
import { invokeLLM } from "../_core/llm";
import { ENV } from "../_core/env";

/**
 * After this many failed attempts, a narrative stops being retried
 * automatically and needs manual attention -- see redactionLastError on
 * the row for why. At this value, the exponential curve below reaches
 * roughly 21 hours between the final two attempts (10 * 2^6 = 640min,
 * capped well under MAX_BACKOFF_MINUTES) -- comfortably long enough to
 * ride out a transient outage without giving up prematurely, while still
 * eventually flagging a genuinely broken narrative for a human to look at.
 */
export const MAX_REDACTION_ATTEMPTS = 8;

/** Matches the cron's own 10-minute interval, so a first retry isn't held back further than "the next tick" would already do. */
export const BASE_BACKOFF_MINUTES = 10;

/** Cap so a repeatedly-failing row still gets attempted once a day, rather than the exponential curve pushing it out indefinitely. */
export const MAX_BACKOFF_MINUTES = 24 * 60;

/**
 * Real exponential backoff (added 2026-07-29, closing a gap found in code
 * review): before this, a permanently-failing narrative retried every
 * single 10-minute cron tick forever, with no increasing delay and no
 * upper bound on attempts. `attempts` is the count BEFORE this retry
 * would be the (attempts+1)th try, so attempts=1 (one prior failure)
 * backs off 10 minutes, attempts=2 backs off 20, attempts=3 backs off 40,
 * doubling each time up to MAX_BACKOFF_MINUTES.
 */
export function isEligibleForRetry(attempts: number | null | undefined, lastAttemptAt: Date | null | undefined, now: Date): boolean {
  if (!attempts || attempts <= 0 || !lastAttemptAt) return true; // never attempted yet, or the data shape is unexpectedly incomplete -- fail open rather than silently never retrying
  const backoffMinutes = Math.min(BASE_BACKOFF_MINUTES * Math.pow(2, attempts - 1), MAX_BACKOFF_MINUTES);
  const eligibleAt = new Date(lastAttemptAt.getTime() + backoffMinutes * 60_000);
  return now >= eligibleAt;
}

/** Truncated so a very long error message can't bloat the row indefinitely. */
function truncateError(message: string, maxLength = 2000): string {
  return message.length > maxLength ? message.slice(0, maxLength) + "... [truncated]" : message;
}

/**
 * Background task to redact raw narratives using Gemini (paid tier).
 * Finds up to `limit` events where rawNarrative is populated but redactedNarrative is null,
 * calls the LLM to redact any PII / facility names, and saves the result.
 *
 * Retry-state tracking (redactionAttempts / redactionLastAttemptAt /
 * redactionLastError, migration 0079): closes the gap where a
 * permanently-failing narrative would otherwise retry every 10 minutes
 * forever with zero visibility. See isEligibleForRetry above for the
 * backoff curve and MAX_REDACTION_ATTEMPTS for when a row stops being
 * retried automatically.
 */
export async function redactPendingNarratives(db: DbClient, limit = 10): Promise<{ processed: number; succeeded: number; failed: number; skippedBackoff: number }> {
  // Deliberate platform-wide pause (2026-07-29) -- see ENV.llmFeaturesEnabled's
  // doc comment. Checked BEFORE querying for pending rows, not per-item,
  // so a paused platform logs one clear line every 10 minutes instead of
  // one confusing "failure" per pending narrative.
  if (!ENV.llmFeaturesEnabled) {
    console.log(
      "[Redaction Job] Skipped -- LLM_FEATURES_ENABLED is not \"true\". This is a deliberate pause, not an error. Narratives stay queued (redactedNarrative remains NULL) until this is turned back on."
    );
    return { processed: 0, succeeded: 0, failed: 0, skippedBackoff: 0 };
  }

  // Fetch a larger candidate pool than `limit` -- some candidates will be
  // filtered out below for still being inside their backoff window, and
  // rows that have already permanently failed (attempts >= MAX) are
  // excluded at the SQL level so they never even become candidates.
  const candidates = await db
    .select({
      id: careSignalEvents.id,
      rawNarrative: careSignalEvents.rawNarrative,
      redactionAttempts: careSignalEvents.redactionAttempts,
      redactionLastAttemptAt: careSignalEvents.redactionLastAttemptAt,
    })
    .from(careSignalEvents)
    .where(
      and(
        isNotNull(careSignalEvents.rawNarrative),
        isNull(careSignalEvents.redactedNarrative),
        lt(careSignalEvents.redactionAttempts, MAX_REDACTION_ATTEMPTS)
      )
    )
    .limit(limit * 5);

  const now = new Date();
  let skippedBackoff = 0;
  const pending = candidates
    .filter((c) => {
      const eligible = isEligibleForRetry(c.redactionAttempts, c.redactionLastAttemptAt, now);
      if (!eligible) skippedBackoff++;
      return eligible;
    })
    .slice(0, limit);

  let succeeded = 0;
  let failed = 0;

  if (pending.length === 0) {
    if (skippedBackoff > 0) {
      console.log(`[Redaction Job] ${skippedBackoff} pending narrative(s) still inside their backoff window -- nothing eligible this run.`);
    }
    return { processed: 0, succeeded: 0, failed: 0, skippedBackoff };
  }

  console.log(`[Redaction Job] Found ${pending.length} pending Care Signal narrative(s) to redact (${skippedBackoff} more still backing off).`);

  for (const event of pending) {
    const rawNarrative = event.rawNarrative?.trim();
    if (!rawNarrative) {
      // Empty narrative: deterministically resolved, not a failure --
      // doesn't touch attempts/backoff at all.
      await db
        .update(careSignalEvents)
        .set({ redactedNarrative: "" })
        .where(eq(careSignalEvents.id, event.id));
      succeeded++;
      continue;
    }

    const attemptNumber = (event.redactionAttempts || 0) + 1;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a professional de-identification and redaction assistant. Your task is to redact all personally identifiable information (PII) and facility-identifying details from the following healthcare provider narrative, while preserving the clinical and operational essence of the report.\n\nSpecifically, replace:\n- Names of patients, providers, or other individuals with generic bracketed labels (e.g., [PATIENT], [PROVIDER], [COLLEAGUE]).\n- Specific dates or times with [DATE] or [TIME].\n- Phone numbers, email addresses, or specific identification numbers (national IDs, passports) with [PHONE], [EMAIL], or [ID].\n- Facility names or specific departments/wards if they identify a particular hospital with [FACILITY] or [WARD].\nDo not change the clinical terms, equipment gaps, delays, or overall clinical narrative structure.\nReturn only the redacted narrative, without any introduction, explanations, or markdown formatting."
          },
          {
            role: "user",
            content: rawNarrative
          }
        ]
      });

      const messageContent = response.choices[0]?.message?.content;
      let redactedText = "";

      if (typeof messageContent === "string") {
        redactedText = messageContent.trim();
      } else if (Array.isArray(messageContent)) {
        // Handle array format if returned
        redactedText = messageContent
          .filter(part => part.type === "text")
          .map(part => (part as { text: string }).text)
          .join("")
          .trim();
      }

      await db
        .update(careSignalEvents)
        .set({
          redactedNarrative: redactedText,
          redactionAttempts: attemptNumber,
          redactionLastAttemptAt: now,
          redactionLastError: null,
        })
        .where(eq(careSignalEvents.id, event.id));

      succeeded++;
    } catch (error) {
      failed++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[Redaction Job] Failed to redact event ID ${event.id} (attempt ${attemptNumber}/${MAX_REDACTION_ATTEMPTS}):`, errorMsg);

      await db
        .update(careSignalEvents)
        .set({
          redactionAttempts: attemptNumber,
          redactionLastAttemptAt: now,
          redactionLastError: truncateError(errorMsg),
        })
        .where(eq(careSignalEvents.id, event.id));

      if (attemptNumber >= MAX_REDACTION_ATTEMPTS) {
        console.warn(`[Redaction Job] Event ID ${event.id} has now failed ${attemptNumber} times -- stopping automatic retries. Needs manual review (see redactionLastError on the row).`);
      }

      // Check if this looks like a rate limit (HTTP 429) or connection error
      if (errorMsg.includes("429") || errorMsg.includes("Too Many Requests") || errorMsg.includes("ResourceExhausted")) {
        console.warn("[Redaction Job] Rate limit or resource exhaustion hit. Stopping the rest of this batch -- remaining items keep their existing backoff state and will be reconsidered next run.");
        break; // Stop processing further narratives in this batch to respect limits
      }
    }
  }

  return {
    processed: pending.length,
    succeeded,
    failed,
    skippedBackoff,
  };
}
