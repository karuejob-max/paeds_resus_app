import { eq, and, isNull, isNotNull } from "drizzle-orm";
import { careSignalEvents } from "../../drizzle/schema";
import type { DbClient } from "../db";
import { invokeLLM } from "../_core/llm";

/**
 * Background task to redact raw narratives using Gemini (paid tier).
 * Finds up to `limit` events where rawNarrative is populated but redactedNarrative is null,
 * calls the LLM to redact any PII / facility names, and saves the result.
 */
export async function redactPendingNarratives(db: DbClient, limit = 10): Promise<{ processed: number; succeeded: number; failed: number }> {
  const pending = await db
    .select({
      id: careSignalEvents.id,
      rawNarrative: careSignalEvents.rawNarrative,
    })
    .from(careSignalEvents)
    .where(
      and(
        isNotNull(careSignalEvents.rawNarrative),
        isNull(careSignalEvents.redactedNarrative)
      )
    )
    .limit(limit);

  let succeeded = 0;
  let failed = 0;

  if (pending.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  console.log(`[Redaction Job] Found ${pending.length} pending Care Signal narrative(s) to redact.`);

  for (const event of pending) {
    const rawNarrative = event.rawNarrative?.trim();
    if (!rawNarrative) {
      // Empty narrative: mark as empty redacted narrative
      await db
        .update(careSignalEvents)
        .set({ redactedNarrative: "" })
        .where(eq(careSignalEvents.id, event.id));
      succeeded++;
      continue;
    }

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
        .set({ redactedNarrative: redactedText })
        .where(eq(careSignalEvents.id, event.id));

      succeeded++;
    } catch (error) {
      failed++;
      console.warn(
        `[Redaction Job] Failed to redact event ID ${event.id}:`,
        error instanceof Error ? error.message : error
      );

      // Check if this looks like a rate limit (HTTP 429) or connection error
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes("429") || errorMsg.includes("Too Many Requests") || errorMsg.includes("ResourceExhausted")) {
        console.warn("[Redaction Job] Rate limit or resource exhaustion hit. Pausing processing for this run.");
        break; // Stop processing further narratives in this batch to respect limits
      }
    }
  }

  return {
    processed: pending.length,
    succeeded,
    failed,
  };
}
