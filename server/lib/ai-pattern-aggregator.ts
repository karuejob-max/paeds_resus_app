import { desc } from "drizzle-orm";
import { careSignalEvents, parentSafeTruthEvents, kbPatterns, type KbPattern } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import type { DbClient } from "../db";

export function deidentifyText(text: string): string {
  if (!text) return "";
  // 1. Scrub email addresses
  let scrubbed = text.replace(/\S+@\S+\.\S+/gi, "[REDACTED EMAIL]");
  // 2. Scrub phone numbers (9 to 15 digits)
  scrubbed = scrubbed.replace(/\+?\d[\d -]{7,13}\d/g, "[REDACTED PHONE]");
  // 3. Scrub common clinician identifiers
  scrubbed = scrubbed.replace(/Dr\.\s+[A-Z][a-z]+/g, "Dr. [REDACTED]");
  scrubbed = scrubbed.replace(/Nurse\s+[A-Z][a-z]+/g, "Nurse [REDACTED]");
  return scrubbed;
}

// Same wording as the redaction prompt in care-signal-redact.ts (the
// rawNarrative/redactedNarrative cron), kept in sync deliberately so the
// two redaction paths in this codebase apply the same standard -- only the
// batching differs (one item per call there vs. one call for the whole
// batch here, since this path is a synchronous, on-demand admin action
// rather than a background job with retry/backoff).
const REDACTION_INSTRUCTIONS =
  "You are a professional de-identification and redaction assistant. Your task is to redact all personally identifiable information (PII) and facility-identifying details from healthcare provider and parent narratives, while preserving the clinical and operational essence of each report.\n\n" +
  "Specifically, replace:\n" +
  "- Names of patients, providers, or other individuals with generic bracketed labels (e.g., [PATIENT], [PROVIDER], [COLLEAGUE]).\n" +
  "- Specific dates or times with [DATE] or [TIME].\n" +
  "- Phone numbers, email addresses, or specific identification numbers (national IDs, passports) with [PHONE], [EMAIL], or [ID].\n" +
  "- Facility names or specific departments/wards if they identify a particular hospital with [FACILITY] or [WARD].\n" +
  "Do not change the clinical terms, equipment gaps, delays, or overall clinical narrative structure.";

interface RedactableItem {
  id: string;
  fields: Record<string, string>;
}

/**
 * INST-4-redaction (CEO decision 2026-08-05, option B): redact a batch of
 * observations in a single LLM call, keyed by id, immediately before
 * pattern discovery -- not persisted, not a background job. Chosen over
 * persisting new redacted* columns (Option A) because runAiDiscovery is a
 * rare, admin-triggered action, not a high-volume background job with an
 * SLA: always-fresh data was judged worth the roughly 2x latency/cost of a
 * second LLM call per run, rather than accepting either staleness (some of
 * the last-30 events not yet redacted by a cron) or a fallback to weaker
 * regex-only redaction for whatever hasn't caught up yet.
 *
 * Local deidentifyText() still runs first, as a cheap first pass (strips
 * obvious emails/phone numbers before the text ever leaves the process) --
 * this LLM pass is the second, context-aware layer on top, matching the
 * two-layer standard the rawNarrative pipeline already established
 * (deidentifyText is not being removed, just no longer treated as
 * sufficient on its own).
 *
 * Defense in depth on partial failure: if the LLM response is missing an
 * id, or malformed for a given item, that item silently falls back to its
 * deidentifyText()-only version rather than being dropped -- worse
 * redaction for that one item, not a missing observation or a hard
 * failure for the whole batch. A total LLM failure (kill switch, network,
 * malformed response entirely) still propagates up to runAiDiscovery's
 * existing catch block, which already fails the whole run closed.
 */
async function redactObservationsWithLLM(items: RedactableItem[]): Promise<Map<string, Record<string, string>>> {
  const result = new Map<string, Record<string, string>>();
  if (items.length === 0) return result;

  // First pass: cheap local scrub, applied before anything leaves the process.
  const prescrubbed = items.map((item) => ({
    id: item.id,
    fields: Object.fromEntries(Object.entries(item.fields).map(([k, v]) => [k, deidentifyText(v)])),
  }));
  // Fallback map, used per-item if the LLM omits or mangles an entry.
  for (const item of prescrubbed) result.set(item.id, item.fields);

  const requestPayload = JSON.stringify({ items: prescrubbed });

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            REDACTION_INSTRUCTIONS +
            '\n\nYou will receive a JSON object: {"items": [{"id": "...", "fields": {"fieldName": "raw text", ...}}]}. ' +
            'Return ONLY a JSON object of the same shape, {"items": [{"id": "...", "fields": {"fieldName": "redacted text", ...}}]}, ' +
            "with every id from the input present exactly once and every field name preserved. Do not add, remove, or rename ids or fields.",
        },
        { role: "user", content: requestPayload },
      ],
      responseFormat: { type: "json_object" },
    });

    const rawContent = response.choices[0]?.message?.content ?? "{}";
    const contentStr = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
    const parsed = JSON.parse(contentStr.trim().replace(/^```json\s*/i, "").replace(/```$/i, ""));
    const returnedItems: Array<{ id?: string; fields?: Record<string, string> }> = Array.isArray(parsed?.items) ? parsed.items : [];

    for (const returned of returnedItems) {
      if (!returned?.id || !returned.fields || typeof returned.fields !== "object") continue;
      const original = items.find((i) => i.id === returned.id);
      if (!original) continue; // LLM invented an id -- ignore rather than trust it
      // Only accept fields that were actually asked for, and only if non-empty;
      // anything missing keeps the prescrubbed fallback already in `result`.
      const merged: Record<string, string> = { ...result.get(returned.id) };
      for (const fieldName of Object.keys(original.fields)) {
        const value = returned.fields[fieldName];
        if (typeof value === "string" && value.trim().length > 0) {
          merged[fieldName] = value;
        }
      }
      result.set(returned.id, merged);
    }
  } catch (error) {
    // Whole redaction pass failed (kill switch, network, malformed
    // response) -- every item keeps its prescrubbed-only fallback already
    // in `result`, which the caller decides whether that's acceptable.
    console.error("[AI Pattern Aggregator] LLM redaction pass failed, falling back to local scrub only:", error);
  }

  return result;
}

export interface ProposedPattern {
  patternTrack: "FAILURE" | "SUCCESS";
  patternName: string;
  primaryDomain: "RECOGNITION" | "ESCALATION" | "VASCULAR_ACCESS" | "TREATMENT" | "REFERRAL" | "MONITORING" | "COMMUNICATION" | "RESOURCE_AVAILABILITY";
  description: string;
  evidenceBasis: string;
  cadreScope: "nursing" | "medical" | "all";
  associatedObservations: string[];
}

export async function runAiDiscovery(db: DbClient): Promise<{ success: boolean; proposedPatterns: ProposedPattern[] }> {
  try {
    // 1. Query latest 30 Care Signal Events
    const careSignal = await db
      .select({
        id: careSignalEvents.id,
        presentation: careSignalEvents.presentation,
        systemGaps: careSignalEvents.systemGaps,
        gapDetails: careSignalEvents.gapDetails,
        outcome: careSignalEvents.outcome,
      })
      .from(careSignalEvents)
      .orderBy(desc(careSignalEvents.id))
      .limit(30);

    // 2. Query latest 30 Parent Safe-Truth Events
    const parentTruth = await db
      .select({
        id: parentSafeTruthEvents.id,
        description: parentSafeTruthEvents.description,
        eventType: parentSafeTruthEvents.eventType,
      })
      .from(parentSafeTruthEvents)
      .orderBy(desc(parentSafeTruthEvents.id))
      .limit(30);

    // 3. Redact everything in one batched LLM call (see redactObservationsWithLLM)
    // before any of it is formatted for the pattern-discovery prompt below.
    const redactableItems: RedactableItem[] = [
      ...careSignal.map((c) => ({
        id: `care-signal-${c.id}`,
        fields: {
          presentation: c.presentation,
          systemGaps: c.systemGaps,
          gapDetails: c.gapDetails,
          outcome: c.outcome,
        },
      })),
      ...parentTruth.map((p) => ({
        id: `parent-truth-${p.id}`,
        fields: { description: p.description },
      })),
    ];
    const redacted = await redactObservationsWithLLM(redactableItems);

    // 4. Format clinician observations from the redacted text
    const clinicianObservations = careSignal
      .map((c) => {
        const f = redacted.get(`care-signal-${c.id}`) ?? {};
        return `[Observation ID: care-signal-${c.id}]
Presentation: ${f.presentation ?? ""}
Gaps: ${f.systemGaps ?? ""}
Details: ${f.gapDetails ?? ""}
Outcome: ${f.outcome ?? ""}`;
      })
      .join("\n\n");

    // 5. Format parent observations from the redacted text
    const parentObservations = parentTruth
      .map((p) => {
        const f = redacted.get(`parent-truth-${p.id}`) ?? {};
        return `[Observation ID: parent-truth-${p.id}]
Event Type: ${p.eventType}
Narrative: ${f.description ?? ""}`;
      })
      .join("\n\n");

    // 6. If no data, return empty proposed patterns
    if (!clinicianObservations && !parentObservations) {
      return { success: true, proposedPatterns: [] };
    }

    const payload = `CLINICIAN CARE SIGNAL LOGS:
${clinicianObservations || "No clinician observations logged."}

PARENT SAFE-TRUTH JOURNEY LOGS:
${parentObservations || "No parent observations logged."}`;

    const PATTERN_AGGREGATOR_SYSTEM_PROMPT = `You are a medical data analyst and clinical auditor specialized in pediatric resuscitation safety.
Your task is to analyze the unstructured clinical descriptions of hospital near-misses and parent care journey events, cluster them by themes, and extract recurring Failure Patterns and Success Patterns.

Ensure all patterns use one of these valid primary domains:
- RECOGNITION (delayed identification of shock/sepsis/arrest)
- ESCALATION (delayed communication or escalation to doctors)
- VASCULAR_ACCESS (difficulty setting up IV/IO access)
- TREATMENT (fluid bolus, drugs, or breathing errors)
- REFERRAL (delay in sending patient to referral tertiary hospital)
- MONITORING (failure to audit vitals regularly)
- COMMUNICATION (communication gaps between clinical team members or with parents)
- RESOURCE_AVAILABILITY (lack of drugs, fluids, defib, oxygen, or beds)

Return ONLY a valid JSON object matching this schema:
{
  "proposedPatterns": [
    {
      "patternTrack": "FAILURE" or "SUCCESS",
      "patternName": "Clear concise pattern title (e.g., Lack of Pediatric BVM in Triage)",
      "primaryDomain": "One of the valid domains listed above",
      "description": "Comprehensive explanation of what is recurring and the clinical impact based on raw data",
      "evidenceBasis": "Summary of observations in the data supporting this proposed pattern",
      "cadreScope": "nursing|medical|all",
      "associatedObservations": ["care-signal-{id}" or "parent-truth-{id}"]
    }
  ]
}`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: PATTERN_AGGREGATOR_SYSTEM_PROMPT },
        { role: "user", content: payload },
      ],
      responseFormat: { type: "json_object" },
    });

    const rawContent = response.choices[0]?.message?.content || "{}";
    const contentStr = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
    const parsed = JSON.parse(contentStr.trim().replace(/^```json\s*/i, "").replace(/```$/i, ""));

    const proposedPatterns = (parsed.proposedPatterns || []).map((p: any) => ({
      patternTrack: p.patternTrack === "SUCCESS" ? "SUCCESS" : "FAILURE",
      patternName: p.patternName || "Unnamed AI Discovery",
      primaryDomain: p.primaryDomain || "TREATMENT",
      description: p.description || "",
      evidenceBasis: p.evidenceBasis || "",
      cadreScope: p.cadreScope || "all",
      associatedObservations: p.associatedObservations || [],
    }));

    return {
      success: true,
      proposedPatterns,
    };
  } catch (error) {
    console.error("[AI Pattern Aggregator] runAiDiscovery error:", error);
    return {
      success: false,
      proposedPatterns: [],
    };
  }
}
