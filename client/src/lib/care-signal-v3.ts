/**
 * Care Signal v3 — types, constants, form state, validation, and payload builder.
 * Spec: docs/EVENT_MODELS_V1.md §1
 */
import type { FacilitySelection } from "@/components/FacilityPicker";

export const CARE_SIGNAL_FORM_VERSION = "v3" as const;
export const CARE_SIGNAL_SCHEMA_VERSION = "1.0" as const;

export type ConditionCategory =
  | "RESPIRATORY" | "CARDIOVASCULAR" | "NEUROLOGICAL"
  | "INFECTIOUS_BACTERIAL" | "INFECTIOUS_VIRAL" | "METABOLIC"
  | "TRAUMA" | "NEONATAL" | "POISONING" | "OTHER";

export type ChildAgeBand =
  | "NEONATAL" | "INFANT" | "TODDLER" | "PRESCHOOL" | "SCHOOL" | "ADOLESCENT";

export type OutcomeCategory =
  | "SURVIVED_WELL" | "SURVIVED_MORBIDITY" | "DIED_IN_FACILITY"
  | "DIED_IN_TRANSIT" | "NEAR_MISS" | "TRANSFERRED_UNKNOWN" | "UNKNOWN";

export type FailureDomain =
  | "RECOGNITION" | "ESCALATION" | "VASCULAR_ACCESS" | "TREATMENT"
  | "REFERRAL" | "MONITORING" | "COMMUNICATION" | "RESOURCE_AVAILABILITY";

export type ReportTrack = "FAILURE" | "SUCCESS";

export type RoleAtTimeOfEvent =
  | "TEAM_LEADER" | "PRIMARY_CLINICIAN" | "SUPPORT_CLINICIAN"
  | "OBSERVING_TRAINEE" | "LOCUM";

export type HoursSinceEvent =
  | "UNDER_1H" | "1_6H" | "6_24H" | "1_3_DAYS" | "OVER_3_DAYS";

export type FailureModeCode =
  | "RECOG_SHOCK_DELAYED" | "RECOG_FEEDING_DIFFICULTY" | "RECOG_DANGER_SIGNS_MISSED"
  | "RECOG_RESP_SEVERITY" | "RECOG_DECOMPENSATION"
  | "ESCL_SENIOR_DELAY" | "ESCL_NO_PROTOCOL" | "ESCL_INOTROPE_DELAY"
  | "ACCESS_IO_NOT_ATTEMPTED" | "ACCESS_PERIPHERAL_DELAY"
  | "TREAT_ANTIBIOTIC_DELAY" | "TREAT_DOSE_ERROR" | "TREAT_BOLUS_NOT_REASSESSED"
  | "TREAT_ORS_OMITTED" | "TREAT_ZINC_OMITTED" | "TREAT_OXYGEN_NOT_GIVEN"
  | "REFER_DECISION_DELAY" | "REFER_UNSTABILISED" | "REFER_NO_NOTIFICATION"
  | "MON_NO_REPEAT_VITALS" | "MON_DETERIORATION_MISSED"
  | "COMM_CLOSED_LOOP_FAILURE" | "COMM_HANDOVER_LOSS" | "COMM_FAMILY_NOT_INFORMED"
  | "RES_OXYGEN_UNAVAILABLE" | "RES_WRONG_SIZE_EQUIPMENT"
  | "RES_DRUG_STOCKOUT" | "RES_IO_KIT_UNAVAILABLE";

export type SuccessFactorCode =
  | "RECOG_NURSE_SEPSIS_CHECKLIST" | "RECOG_STRUCTURED_TRIAGE"
  | "ACCESS_IO_KIT_AT_TRIAGE" | "ACCESS_IO_DRILL_MONTHLY"
  | "TREAT_WEIGHT_CHART_BEDSIDE" | "TREAT_ANTIBIOTIC_BUNDLE"
  | "REFER_NOTIFICATION_PROTOCOL" | "MON_OBSERVATION_CHART_REDESIGN"
  | "COMM_SBAR_HANDOVER" | "ESCL_STRUCTURED_ESCALATION";

export const FAILURE_MODES_BY_DOMAIN: Record<
  FailureDomain,
  Array<{ code: FailureModeCode; label: string }>
> = {
  RECOGNITION: [
    { code: "RECOG_SHOCK_DELAYED", label: "Shock not recognised despite tachycardia / prolonged CRT" },
    { code: "RECOG_FEEDING_DIFFICULTY", label: "Feeding difficulty not recognised as emergency indicator" },
    { code: "RECOG_DANGER_SIGNS_MISSED", label: "WHO danger signs present but not acted upon" },
    { code: "RECOG_RESP_SEVERITY", label: "Respiratory distress severity not graded correctly" },
    { code: "RECOG_DECOMPENSATION", label: "Decompensation from compensated state not recognised in time" },
  ],
  ESCALATION: [
    { code: "ESCL_SENIOR_DELAY", label: "Delay calling for senior review despite threshold criteria" },
    { code: "ESCL_NO_PROTOCOL", label: "Escalation pathway not known or not followed" },
    { code: "ESCL_INOTROPE_DELAY", label: "Inotropic support escalation delayed beyond clinical threshold" },
  ],
  VASCULAR_ACCESS: [
    { code: "ACCESS_IO_NOT_ATTEMPTED", label: "IO access not attempted despite failed peripheral access" },
    { code: "ACCESS_PERIPHERAL_DELAY", label: "Delay in establishing peripheral IV in deteriorating child" },
  ],
  TREATMENT: [
    { code: "TREAT_ANTIBIOTIC_DELAY", label: "Antibiotic not administered within target time" },
    { code: "TREAT_DOSE_ERROR", label: "Wrong weight-based dose calculated or administered" },
    { code: "TREAT_BOLUS_NOT_REASSESSED", label: "Fluid bolus not reassessed after administration" },
    { code: "TREAT_ORS_OMITTED", label: "ORS not administered in dehydration management" },
    { code: "TREAT_ZINC_OMITTED", label: "Zinc not administered in diarrhoea management" },
    { code: "TREAT_OXYGEN_NOT_GIVEN", label: "Oxygen not given despite availability and clinical indication" },
  ],
  REFERRAL: [
    { code: "REFER_DECISION_DELAY", label: "Transfer decision delayed beyond clinical threshold" },
    { code: "REFER_UNSTABILISED", label: "Transfer initiated without adequate stabilisation" },
    { code: "REFER_NO_NOTIFICATION", label: "Receiving facility not notified before transfer" },
  ],
  MONITORING: [
    { code: "MON_NO_REPEAT_VITALS", label: "Vital signs not repeated after intervention" },
    { code: "MON_DETERIORATION_MISSED", label: "Deterioration not detected between observations" },
  ],
  COMMUNICATION: [
    { code: "COMM_CLOSED_LOOP_FAILURE", label: "Closed-loop communication failure during resuscitation" },
    { code: "COMM_HANDOVER_LOSS", label: "Handover information lost or incomplete" },
    { code: "COMM_FAMILY_NOT_INFORMED", label: "Family not informed of deterioration" },
  ],
  RESOURCE_AVAILABILITY: [
    { code: "RES_OXYGEN_UNAVAILABLE", label: "Oxygen not available or not functioning" },
    { code: "RES_WRONG_SIZE_EQUIPMENT", label: "Equipment wrong size for paediatric patient" },
    { code: "RES_DRUG_STOCKOUT", label: "Essential drug out of stock" },
    { code: "RES_IO_KIT_UNAVAILABLE", label: "IO needle or kit not available when needed" },
  ],
};

export const SUCCESS_FACTORS: Array<{ code: SuccessFactorCode; domain: FailureDomain; label: string }> = [
  { code: "RECOG_NURSE_SEPSIS_CHECKLIST", domain: "RECOGNITION", label: "Nurse-led sepsis checklist at triage for all febrile children under 5" },
  { code: "RECOG_STRUCTURED_TRIAGE", domain: "RECOGNITION", label: "Structured paediatric triage tool used at point of first contact" },
  { code: "ACCESS_IO_KIT_AT_TRIAGE", domain: "VASCULAR_ACCESS", label: "IO kit stored at triage enabling access without delay" },
  { code: "ACCESS_IO_DRILL_MONTHLY", domain: "VASCULAR_ACCESS", label: "Monthly IO drill reduced mean access time in resuscitation scenarios" },
  { code: "TREAT_WEIGHT_CHART_BEDSIDE", domain: "TREATMENT", label: "Weight-based dosing chart at bedside eliminated calculation errors" },
  { code: "TREAT_ANTIBIOTIC_BUNDLE", domain: "TREATMENT", label: "Antibiotic bundle protocol reduced time-to-antibiotic in sepsis" },
  { code: "REFER_NOTIFICATION_PROTOCOL", domain: "REFERRAL", label: "Structured receiving facility notification reduced handover gaps" },
  { code: "MON_OBSERVATION_CHART_REDESIGN", domain: "MONITORING", label: "Observation chart redesign prompted reassessment at 15-minute intervals" },
  { code: "COMM_SBAR_HANDOVER", domain: "COMMUNICATION", label: "SBAR handover structure reduced information loss at shift change" },
  { code: "ESCL_STRUCTURED_ESCALATION", domain: "ESCALATION", label: "Nurse-initiated structured escalation reduced time-to-senior from 45 to 8 minutes" },
];

export const CONDITION_CATEGORY_LABELS: Record<ConditionCategory, string> = {
  RESPIRATORY: "Breathing problem (respiratory)",
  CARDIOVASCULAR: "Heart / circulation problem",
  NEUROLOGICAL: "Fit, seizure, or brain problem",
  INFECTIOUS_BACTERIAL: "Bacterial infection / sepsis",
  INFECTIOUS_VIRAL: "Viral infection",
  METABOLIC: "Metabolic emergency (DKA, hypoglycaemia)",
  TRAUMA: "Injury or accident",
  NEONATAL: "Newborn emergency (first 28 days)",
  POISONING: "Poisoning or toxic ingestion",
  OTHER: "Other or not sure",
};

export const CHILD_AGE_BAND_LABELS: Record<ChildAgeBand, string> = {
  NEONATAL: "Newborn (0–28 days)",
  INFANT: "Infant (1–12 months)",
  TODDLER: "Toddler (1–3 years)",
  PRESCHOOL: "Young child (3–5 years)",
  SCHOOL: "Older child (5–12 years)",
  ADOLESCENT: "Teenager (12–18 years)",
};

export const OUTCOME_CATEGORY_LABELS: Record<OutcomeCategory, string> = {
  SURVIVED_WELL: "Survived — recovered well",
  SURVIVED_MORBIDITY: "Survived — with ongoing problems",
  DIED_IN_FACILITY: "Died at the facility",
  DIED_IN_TRANSIT: "Died in transit",
  NEAR_MISS: "Near miss — serious risk averted",
  TRANSFERRED_UNKNOWN: "Transferred — outcome unknown",
  UNKNOWN: "Outcome not yet known",
};

export const FAILURE_DOMAIN_LABELS: Record<FailureDomain, string> = {
  RECOGNITION: "Recognition failure",
  ESCALATION: "Escalation failure",
  VASCULAR_ACCESS: "Vascular access failure",
  TREATMENT: "Treatment failure",
  REFERRAL: "Referral / transfer failure",
  MONITORING: "Monitoring failure",
  COMMUNICATION: "Communication failure",
  RESOURCE_AVAILABILITY: "Resource unavailability",
};

export const ROLE_AT_EVENT_LABELS: Record<RoleAtTimeOfEvent, string> = {
  TEAM_LEADER: "Team leader",
  PRIMARY_CLINICIAN: "Primary clinician or nurse (directly managing patient)",
  SUPPORT_CLINICIAN: "Team member / supporting clinician or nurse",
  OBSERVING_TRAINEE: "Observing trainee",
  LOCUM: "Locum (covering another facility or role)",
};

export const HOURS_SINCE_EVENT_LABELS: Record<HoursSinceEvent, string> = {
  UNDER_1H: "Less than 1 hour ago",
  "1_6H": "1–6 hours ago",
  "6_24H": "6–24 hours ago",
  "1_3_DAYS": "1–3 days ago",
  OVER_3_DAYS: "More than 3 days ago",
};

export type CareSignalV3FormState = {
  country: string;
  admin_level_1: string;
  conditionCategory: ConditionCategory | "";
  childAgeBand: ChildAgeBand | "";
  outcomeCategory: OutcomeCategory | "";
  eventDate: string;
  isAnonymous: boolean;
  reportTrack: ReportTrack;
  roleAtTimeOfEvent: RoleAtTimeOfEvent | "";
  facilityConfirmed: boolean;
  failureDomains: FailureDomain[];
  failureModeCodes: FailureModeCode[];
  rawNarrative: string;
  successDomains: FailureDomain[];
  successFactorCodes: SuccessFactorCode[];
  successNarrative: string;
  timeToRecognitionMins: string;
  timeToFirstInterventionMins: string;
  timeToVascularAccessMins: string;
  timeToEscalationMins: string;
  hoursSinceEvent: HoursSinceEvent | "";
  eventId: string;
  systemGaps: string[];
  proposedSystemFix: string;
  chainOfSurvivalSteps: string[];
};

export function initialCareSignalV3State(): CareSignalV3FormState {
  return {
    country: "",
    admin_level_1: "",
    conditionCategory: "",
    childAgeBand: "",
    outcomeCategory: "",
    eventDate: new Date().toISOString().slice(0, 16),
    isAnonymous: false,
    reportTrack: "FAILURE",
    roleAtTimeOfEvent: "",
    facilityConfirmed: false,
    failureDomains: [],
    failureModeCodes: [],
    rawNarrative: "",
    successDomains: [],
    successFactorCodes: [],
    successNarrative: "",
    timeToRecognitionMins: "",
    timeToFirstInterventionMins: "",
    timeToVascularAccessMins: "",
    timeToEscalationMins: "",
    hoursSinceEvent: "",
    eventId: "",
    systemGaps: [],
    proposedSystemFix: "",
    chainOfSurvivalSteps: [],
  };
}

export function validateCareSignalV3(form: CareSignalV3FormState): string | null {
  if (!form.eventDate) return "Enter when the event occurred.";
  if (!form.roleAtTimeOfEvent) return "Select your role during this event.";
  if (!form.conditionCategory) return "Select the primary condition category.";
  if (!form.childAgeBand) return "Select the child's age band.";
  if (!form.outcomeCategory) return "Select the outcome.";
  if (!form.facilityConfirmed) return "Confirm the facility where this event occurred.";
  if (form.reportTrack === "FAILURE") {
    if (form.failureDomains.length === 0) return "Select at least one failure domain.";
    if (form.rawNarrative.trim().length < 20)
      return "Describe what happened in your own words (at least 20 characters).";
  }
  if (form.reportTrack === "SUCCESS") {
    if (form.successDomains.length === 0) return "Select at least one success domain.";
    if (form.successNarrative.trim().length < 20)
      return "Describe what went well (at least 20 characters).";
  }
  return null;
}

export function buildCareSignalV3SubmitPayload(
  form: CareSignalV3FormState,
  facility: FacilitySelection,
  providerCadre?: string
) {
  const temporalIntervals = {
    timeToRecognitionMins: form.timeToRecognitionMins ? Number(form.timeToRecognitionMins) : null,
    timeToFirstInterventionMins: form.timeToFirstInterventionMins ? Number(form.timeToFirstInterventionMins) : null,
    timeToVascularAccessMins: form.timeToVascularAccessMins ? Number(form.timeToVascularAccessMins) : null,
    timeToEscalationMins: form.timeToEscalationMins ? Number(form.timeToEscalationMins) : null,
    hoursSinceEvent: form.hoursSinceEvent || null,
  };

  // Facility records store full country names (e.g. "Kenya"); the shared classifier
  // needs ISO 3166-1 alpha-2. Map the known COMMON_FACILITY_COUNTRIES set explicitly.
  const COUNTRY_NAME_TO_ISO2: Record<string, string> = {
    Kenya: "KE",
    Uganda: "UG",
    Tanzania: "TZ",
    Rwanda: "RW",
    "South Sudan": "SS",
    Ethiopia: "ET",
  };
  const rawCountry = form.country || facility.country || "Kenya";
  const resolvedCountry = COUNTRY_NAME_TO_ISO2[rawCountry] ?? (rawCountry.length <= 2 ? rawCountry : "KE");

  return {
    country: resolvedCountry,
    admin_level_1: form.admin_level_1 || facility.county || "",
    facility_ownership: (facility as any).facilityOwnership ?? undefined,
    schema_version: CARE_SIGNAL_SCHEMA_VERSION,
    condition_category: form.conditionCategory,
    child_age_band: form.childAgeBand,
    outcome_category: form.outcomeCategory,
    eventDate: form.eventDate || new Date().toISOString(),
    isAnonymous: form.isAnonymous,
    report_track: form.reportTrack,
    role_at_time_of_event: form.roleAtTimeOfEvent || undefined,
    provider_cadre: providerCadre || undefined,
    event_id: form.eventId.trim() || undefined,
    failure_domains: form.reportTrack === "FAILURE" ? form.failureDomains : [],
    failure_mode_codes: form.reportTrack === "FAILURE" ? form.failureModeCodes : [],
    success_domains: form.reportTrack === "SUCCESS" ? form.successDomains : [],
    success_factor_codes: form.reportTrack === "SUCCESS" ? form.successFactorCodes : [],
    raw_narrative: form.reportTrack === "FAILURE" ? form.rawNarrative.trim() : form.successNarrative.trim(),
    temporal_intervals: temporalIntervals,
    facilityId: facility.facilityId,
    systemGaps: form.systemGaps,
    gapDetails: {
      formVersion: CARE_SIGNAL_FORM_VERSION,
      schemaVersion: CARE_SIGNAL_SCHEMA_VERSION,
      reportTrack: form.reportTrack,
      failureDomains: form.failureDomains,
      failureModeCodes: form.failureModeCodes,
      successDomains: form.successDomains,
      successFactorCodes: form.successFactorCodes,
      temporalIntervals,
      proposedSystemFix: form.proposedSystemFix.trim(),
    },
    outcome: form.outcomeCategory,
    neurologicalStatus: "unknown",
    presentation: JSON.stringify({
      conditionCategory: form.conditionCategory,
      childAgeBand: form.childAgeBand,
      reportTrack: form.reportTrack,
      failureDomains: form.failureDomains,
      rawNarrative: form.rawNarrative.trim().slice(0, 200),
    }),
    chainOfSurvival: {
      recognition: form.chainOfSurvivalSteps.includes("recognition"),
      activation: form.chainOfSurvivalSteps.includes("activation"),
      cpr: form.chainOfSurvivalSteps.includes("cpr"),
      defibrillation: form.chainOfSurvivalSteps.includes("defibrillation"),
      advancedCare: form.chainOfSurvivalSteps.includes("advancedCare"),
      postResuscitation: form.chainOfSurvivalSteps.includes("postResuscitation"),
    },
    eventType: form.reportTrack === "SUCCESS"
      ? "success_pattern"
      : form.conditionCategory
        ? form.conditionCategory.toLowerCase()
        : "clinical_event",
    childAge: 0,
  };
}
