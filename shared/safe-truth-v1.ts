/**
 * Safe-Truth v1 — shared option lists and zod schemas.
 * Spec: docs/EVENT_MODELS_V1.md §2.3–2.7 (gap-analysis queue item #11, Phase A).
 *
 * Single source of truth so the (future, Phase B) form UI and the tRPC
 * input validation can never drift apart on what a valid answer looks
 * like. All option text is verbatim from the doc's plain-language columns
 * — these are caregiver-facing strings, not internal codes; the doc itself
 * notes they get mapped to internal taxonomy by the analytics layer
 * separately (out of scope for Phase A).
 */
import { z } from "zod";
import { COMMON_FACILITY_COUNTRIES } from "./kenya-counties";

function optionsOf<T extends readonly [string, ...string[]]>(options: T) {
  return options;
}

export const SAFE_TRUTH_COUNTRIES = optionsOf(COMMON_FACILITY_COUNTRIES as unknown as [string, ...string[]]);

export const FACILITY_LEVEL_OPTIONS = optionsOf([
  "Community clinic / dispensary",
  "Health centre",
  "Sub-county hospital",
  "County hospital",
  "National hospital",
  "Private clinic",
  "Not sure",
] as const);

export const CHILD_AGE_BAND_OPTIONS = optionsOf([
  "Newborn (under 1 month)",
  "Baby (1–12 months)",
  "Toddler (1–3 years)",
  "Young child (3–5 years)",
  "Older child (5–12 years)",
  "Teenager (12–18 years)",
] as const);

export const CONDITION_CATEGORY_OPTIONS = optionsOf([
  "Breathing problem",
  "Heart problem",
  "Fit or seizure",
  "Infection / fever",
  "Diarrhoea and dehydration",
  "Injury or accident",
  "Newborn emergency",
  "Other or not sure",
] as const);

export const OUTCOME_CATEGORY_OPTIONS = optionsOf([
  "Child recovered and went home",
  "Child recovered but has ongoing problems",
  "Child passed away at the facility",
  "Child passed away on the way to the facility",
  "Child was close to danger but recovered (near miss)",
  "Child was transferred to another facility",
  "Other",
] as const);

export const SYMPTOM_ONSET_OPTIONS = optionsOf([
  "Today",
  "1–2 days ago",
  "3–7 days ago",
  "More than a week ago",
  "Not sure",
] as const);

export const DANGER_SIGN_OPTIONS = optionsOf([
  "Could not feed or drink",
  "Unusually sleepy or hard to wake",
  "Fast or difficult breathing",
  "Very hot or very cold",
  "Fit or shaking",
  "Pale or blue lips/tongue",
  "Swollen belly",
  "Not sure",
] as const);

export const ADVICE_RECEIVED_OPTIONS = optionsOf([
  "No, I did not speak to anyone",
  "Yes, a community health worker",
  "Yes, a pharmacist or chemist",
  "Yes, a family member or friend with medical knowledge",
  "Yes, a traditional healer",
  "Yes, other (please describe)",
] as const);

export const TRANSPORT_USED_OPTIONS = optionsOf([
  "We walked",
  "Private car or matatu",
  "Ambulance",
  "Boda-boda / motorcycle",
  "Other",
] as const);

export const TRAVEL_TIME_OPTIONS = optionsOf([
  "Less than 30 minutes",
  "30 minutes to 1 hour",
  "1–2 hours",
  "More than 2 hours",
  "Not sure",
] as const);

export const FACILITIES_VISITED_COUNT_OPTIONS = optionsOf([
  "This was the first place we went",
  "We went to one other place first",
  "We went to two other places first",
  "We went to three or more other places first",
] as const);

export const WAS_SEEN_PROMPTLY_OPTIONS = optionsOf([
  "Yes, within minutes",
  "Within 1 hour",
  "1–3 hours wait",
  "More than 3 hours wait",
  "We were turned away",
  "Not sure",
] as const);

export const INFORMATION_RECEIVED_OPTIONS = optionsOf([
  "We were told clearly what was wrong",
  "We were given some information but not clearly",
  "We were told very little",
  "Nobody explained anything",
  "Not sure",
] as const);

export const FAMILY_INVOLVEMENT_OPTIONS = optionsOf([
  "We were kept informed and involved in decisions",
  "We were informed but not involved",
  "We were not informed",
  "Not sure",
] as const);

export const OVERALL_EXPERIENCE_RATING_OPTIONS = optionsOf([
  "The care was very good",
  "The care was mostly good",
  "The care was mixed",
  "The care was mostly poor",
  "The care was very poor",
] as const);

/** §2.6 — one row per facility visited. */
export const safeTruthFacilityVisitInputSchema = z.object({
  visitFacilityNameRaw: z.string().min(1).max(2000),
  visitFacilityIsFinal: z.boolean(),
  wasSeenPromptly: z.enum(WAS_SEEN_PROMPTLY_OPTIONS),
  turnedAwayReason: z.string().max(2000).optional(),
  informationReceived: z.enum(INFORMATION_RECEIVED_OPTIONS).optional(),
  familyInvolvement: z.enum(FAMILY_INVOLVEMENT_OPTIONS).optional(),
  visitExperienceRaw: z.string().max(4000).optional(),
  dangerSignAdviceAtDischarge: z.boolean().optional(),
});

/** §2.3–2.7 — the full Safe-Truth v1 submission. */
export const safeTruthSubmissionInputSchema = z.object({
  // §2.3 shared classifiers
  country: z.enum(SAFE_TRUTH_COUNTRIES),
  adminLevel1: z.string().min(1).max(128),
  /** Locality — added per CEO instruction, 2026-07-16 ("global from day 1"), beyond §2.3's literal field list. */
  adminLevel2: z.string().max(128).optional(),
  facilityNameRaw: z.string().min(1).max(2000),
  facilityLevel: z.enum(FACILITY_LEVEL_OPTIONS).optional(),
  childAgeBand: z.enum(CHILD_AGE_BAND_OPTIONS),
  conditionCategory: z.enum(CONDITION_CATEGORY_OPTIONS),
  outcomeCategory: z.enum(OUTCOME_CATEGORY_OPTIONS),
  /** A Care Signal event's short code, for consent-based case linkage. Setting this implies consent. */
  eventCodeEntered: z.string().max(36).optional(),

  // §2.4 Journey Stage 1
  symptomOnsetDaysAgo: z.enum(SYMPTOM_ONSET_OPTIONS),
  firstSymptomNoticed: z.string().max(2000).optional(),
  dangerSignsPresent: z.array(z.enum(DANGER_SIGN_OPTIONS)).optional(),
  /** Multi-select per §2.4's own note. */
  adviceReceivedBeforeFacility: z.array(z.enum(ADVICE_RECEIVED_OPTIONS)).min(1),
  adviceContentRaw: z.string().max(2000).optional(),
  reassuredDespiteDanger: z.boolean().optional(),
  decisionToSeekCareTrigger: z.string().max(2000).optional(),

  // §2.5 Journey Stage 2
  transportUsed: z.array(z.enum(TRANSPORT_USED_OPTIONS)).min(1),
  transportDelayOccurred: z.boolean(),
  transportDelayReason: z.string().max(2000).optional(),
  travelTimeToFirstFacility: z.enum(TRAVEL_TIME_OPTIONS),
  costBarrierOccurred: z.boolean(),
  costBarrierDetails: z.string().max(2000).optional(),
  facilitiesVisitedCount: z.enum(FACILITIES_VISITED_COUNT_OPTIONS),

  // §2.6 Journey Stage 3 — repeatable
  facilityVisits: z.array(safeTruthFacilityVisitInputSchema).max(10),

  // §2.7 Journey Stage 4
  followUpInstructionsReceived: z.boolean().optional(),
  ableToFollowInstructions: z.boolean().optional(),
  unableToFollowReason: z.string().max(2000).optional(),
  overallExperienceRating: z.enum(OVERALL_EXPERIENCE_RATING_OPTIONS).optional(),
  whatCouldHaveBeenBetter: z.string().max(2000).optional(),
  rawNarrative: z.string().min(1).max(8000),

  // Anti-abuse (gap-analysis #11 Phase A design decision, 2026-07-16)
  /**
   * Honeypot — a real caregiver never sees or fills this field. Deliberately
   * NOT constrained to empty here (e.g. no .max(0)): a schema-level
   * rejection would throw a validation error back to the bot, revealing
   * the trap. The router checks this value with isHoneypotTripped() and
   * responds as if submission succeeded either way — see
   * server/lib/safe-truth-rate-limit.ts.
   */
  website: z.string().max(500).optional(),
});

export type SafeTruthSubmissionInput = z.infer<typeof safeTruthSubmissionInputSchema>;
export type SafeTruthFacilityVisitInput = z.infer<typeof safeTruthFacilityVisitInputSchema>;
