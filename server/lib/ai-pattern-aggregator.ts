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

    // 3. De-identify and format clinician observations
    const clinicianObservations = careSignal
      .map((c) => {
        const presentation = deidentifyText(c.presentation);
        const gaps = deidentifyText(c.systemGaps);
        const details = deidentifyText(c.gapDetails);
        const outcome = deidentifyText(c.outcome);
        return `[Observation ID: care-signal-${c.id}]
Presentation: ${presentation}
Gaps: ${gaps}
Details: ${details}
Outcome: ${outcome}`;
      })
      .join("\n\n");

    // 4. De-identify and format parent observations
    const parentObservations = parentTruth
      .map((p) => {
        const descText = deidentifyText(p.description);
        return `[Observation ID: parent-truth-${p.id}]
Event Type: ${p.eventType}
Narrative: ${descText}`;
      })
      .join("\n\n");

    // 5. If no data, return empty proposed patterns
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
