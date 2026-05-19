/**
 * Care Signal form v2 — structured QI data for facility / county / national improvement.
 * Stored in gapDetails.formVersion === "v2"; maps to legacy columns for fellowship + analytics.
 */
import { childAgeMonthsForSafeTruth, type SafeTruthAgeBand } from "@/lib/safetruth-age";
import type { FacilitySelection } from "@/components/FacilityPicker";

export const CARE_SIGNAL_FORM_VERSION = "v2" as const;

/** Shared step titles + copy for the v2 form and the Care Signal landing page. */
export const CARE_SIGNAL_V2_STEP_GUIDE: Array<{ title: string; description: string }> = [
  {
    title: "Facility & context",
    description:
      "Select your hospital or clinic (county and country for roll-ups), when the event occurred, and whether to submit anonymously.",
  },
  {
    title: "Event type",
    description:
      "Choose resuscitation or arrest, serious deterioration, near miss, or a recurring systems concern affecting children.",
  },
  {
    title: "Child & presentation",
    description:
      "Record age band, primary emergency type, and a brief clinical summary so reviewers understand what happened.",
  },
  {
    title: "Timeline & delays",
    description:
      "Estimate delays to recognition, first assessment, code-team activation, definitive care, and transfer — data counties and MOH use for QI.",
  },
  {
    title: "Response & resources",
    description:
      "Document chain-of-survival steps, CPR quality, equipment that was unavailable, staffing, and whether protocols were followed.",
  },
  {
    title: "Outcome",
    description:
      "Record survival, neurological status, ROSC when relevant, and whether the harm was likely preventable.",
  },
  {
    title: "Systems & action",
    description:
      "Tag contributing factors and system gaps, then describe one concrete change that could save the next child.",
  },
];

export type CareSignalReportType =
  | "resuscitation_event"
  | "clinical_deterioration"
  | "near_miss"
  | "systems_concern";

export type CareSignalCareLocation =
  | "emergency_department"
  | "ward"
  | "neonatal_unit"
  | "theatre_recovery"
  | "outpatient_clinic"
  | "community_prehospital"
  | "other_hospital_area";

export type CareSignalEmergencyType =
  | "cardiac_arrest"
  | "respiratory_failure"
  | "shock_sepsis"
  | "status_epilepticus"
  | "severe_trauma"
  | "drowning_choking"
  | "neonatal_emergency"
  | "metabolic_other";

export type DelayBucket = "immediate" | "under_15min" | "15_60min" | "over_60min" | "unknown";

export type PreventableAssessment = "likely_preventable" | "possibly_preventable" | "unlikely_preventable" | "unknown";

export type CareSignalV2FormState = {
  eventDate: string;
  isAnonymous: boolean;
  reportType: CareSignalReportType | "";
  careLocation: CareSignalCareLocation | "";
  careLocationOther: string;
  ageBand: SafeTruthAgeBand;
  neonateDays: string;
  infantMonths: string;
  childYears: string;
  weightKg: string;
  primaryEmergencyType: CareSignalEmergencyType | "";
  presentationSummary: string;
  /** Timeline — delays governments track */
  recognitionDelay: DelayBucket;
  firstProviderAssessmentDelay: DelayBucket;
  codeTeamActivationDelay: DelayBucket;
  definitiveCareDelay: DelayBucket;
  transferRequired: boolean;
  transferDelay: DelayBucket;
  /** Chain of survival */
  recognition: boolean;
  activation: boolean;
  cpr: boolean;
  cprQualityAdequate: boolean | null;
  defibrillation: boolean;
  advancedAirway: boolean;
  ivAccessEstablished: boolean;
  criticalMedsGiven: boolean;
  postResuscitationCare: boolean;
  /** Equipment at event */
  equipmentUnavailable: string[];
  staffingAdequate: "yes" | "no" | "unknown";
  protocolFollowed: "yes" | "partial" | "no" | "unknown";
  /** Outcome */
  outcome: string;
  neurologicalStatus: string;
  roscAchieved: boolean | null;
  preventableAssessment: PreventableAssessment | "";
  contributingFactors: string[];
  systemGaps: string[];
  proposedSystemFix: string;
  lessonsLearned: string;
  debriefConducted: "yes" | "no" | "planned" | "";
};

export const REPORT_TYPE_OPTIONS: Array<{ value: CareSignalReportType; label: string; hint: string }> = [
  {
    value: "resuscitation_event",
    label: "Resuscitation or arrest event",
    hint: "CPR, defibrillation, or full emergency response",
  },
  {
    value: "clinical_deterioration",
    label: "Serious deterioration (no arrest)",
    hint: "Rapid response, escalation, or ICU transfer",
  },
  {
    value: "near_miss",
    label: "Near miss",
    hint: "Serious risk but no harm to child",
  },
  {
    value: "systems_concern",
    label: "Systems concern",
    hint: "Recurring gap affecting children (no single patient required)",
  },
];

export const CARE_LOCATION_OPTIONS: Array<{ value: CareSignalCareLocation; label: string }> = [
  { value: "emergency_department", label: "Emergency department" },
  { value: "ward", label: "Inpatient ward" },
  { value: "neonatal_unit", label: "Neonatal / special care baby unit" },
  { value: "theatre_recovery", label: "Theatre / recovery" },
  { value: "outpatient_clinic", label: "Outpatient / clinic" },
  { value: "community_prehospital", label: "Community / ambulance / pre-hospital" },
  { value: "other_hospital_area", label: "Other hospital area" },
];

export const EMERGENCY_TYPE_OPTIONS: Array<{ value: CareSignalEmergencyType; label: string }> = [
  { value: "cardiac_arrest", label: "Cardiac arrest" },
  { value: "respiratory_failure", label: "Respiratory failure / severe breathing problem" },
  { value: "shock_sepsis", label: "Shock / sepsis / severe infection" },
  { value: "status_epilepticus", label: "Prolonged seizure / status epilepticus" },
  { value: "severe_trauma", label: "Severe trauma" },
  { value: "drowning_choking", label: "Drowning / choking / foreign body" },
  { value: "neonatal_emergency", label: "Neonatal emergency" },
  { value: "metabolic_other", label: "Metabolic / other acute emergency" },
];

export const DELAY_OPTIONS: Array<{ value: DelayBucket; label: string }> = [
  { value: "immediate", label: "Immediate (< 5 min)" },
  { value: "under_15min", label: "5–15 minutes" },
  { value: "15_60min", label: "15–60 minutes" },
  { value: "over_60min", label: "More than 60 minutes" },
  { value: "unknown", label: "Unknown / not documented" },
];

export const EQUIPMENT_CHECKLIST = [
  "Bag-mask suitable for child size",
  "Oxygen / functioning flow meter",
  "Suction working",
  "Defibrillator with paediatric pads",
  "IV / IO access equipment",
  "Emergency drugs (adrenaline, fluids, dextrose)",
  "Monitoring (pulse oximeter, ECG)",
  "Broselow / weight-based dosing guide",
  "Emergency trolley stocked",
  "Trained resuscitation team available",
] as const;

export const CONTRIBUTING_FACTORS = [
  "Delayed recognition of deterioration",
  "Delayed escalation / no rapid response",
  "Insufficient staffing",
  "Staff not trained in paediatric emergency care",
  "Equipment missing or not working",
  "Medication unavailable or wrong dose",
  "Poor handover / communication",
  "No paediatric protocol or not followed",
  "Infrastructure (power, space, transport)",
  "Referral / transfer delay",
  "Family delay seeking care",
  "Other system factor",
] as const;

export const SYSTEM_GAP_CATEGORIES = [
  "Knowledge Gap",
  "Resources Gap",
  "Leadership Gap",
  "Communication Gap",
  "Protocol Gap",
  "Equipment Gap",
  "Training Gap",
  "Staffing Gap",
  "Infrastructure Gap",
] as const;

export const PREVENTABLE_OPTIONS: Array<{ value: PreventableAssessment; label: string }> = [
  { value: "likely_preventable", label: "Likely preventable with better systems" },
  { value: "possibly_preventable", label: "Possibly preventable — needs review" },
  { value: "unlikely_preventable", label: "Unlikely preventable (disease severity)" },
  { value: "unknown", label: "Unknown — recommend M&M review" },
];

export const OUTCOME_OPTIONS = [
  { value: "survived_neurologically_intact", label: "Survived — neurologically intact", apiOutcome: "survived_intact" },
  { value: "survived_with_deficit", label: "Survived — neurological deficit", apiOutcome: "survived_deficit" },
  { value: "survived_ongoing_critical", label: "Survived — still critically ill", apiOutcome: "ongoing_critical" },
  { value: "died", label: "Death", apiOutcome: "died" },
  { value: "unknown", label: "Outcome not yet known", apiOutcome: "unknown" },
] as const;

export const NEURO_OPTIONS = [
  { value: "intact", label: "Alert / normal for age" },
  { value: "mild_impairment", label: "Mild impairment" },
  { value: "moderate_impairment", label: "Moderate impairment" },
  { value: "severe_impairment", label: "Severe impairment" },
  { value: "unknown", label: "Unknown" },
] as const;

export function initialCareSignalV2State(): CareSignalV2FormState {
  return {
    eventDate: new Date().toISOString().slice(0, 16),
    isAnonymous: false,
    reportType: "",
    careLocation: "",
    careLocationOther: "",
    ageBand: "child",
    neonateDays: "",
    infantMonths: "6",
    childYears: "",
    weightKg: "",
    primaryEmergencyType: "",
    presentationSummary: "",
    recognitionDelay: "unknown",
    firstProviderAssessmentDelay: "unknown",
    codeTeamActivationDelay: "unknown",
    definitiveCareDelay: "unknown",
    transferRequired: false,
    transferDelay: "unknown",
    recognition: false,
    activation: false,
    cpr: false,
    cprQualityAdequate: null,
    defibrillation: false,
    advancedAirway: false,
    ivAccessEstablished: false,
    criticalMedsGiven: false,
    postResuscitationCare: false,
    equipmentUnavailable: [],
    staffingAdequate: "unknown",
    protocolFollowed: "unknown",
    outcome: "",
    neurologicalStatus: "",
    roscAchieved: null,
    preventableAssessment: "",
    contributingFactors: [],
    systemGaps: [],
    proposedSystemFix: "",
    lessonsLearned: "",
    debriefConducted: "",
  };
}

export function mapEmergencyTypeToEventType(t: CareSignalEmergencyType): string {
  const map: Record<CareSignalEmergencyType, string> = {
    cardiac_arrest: "cardiac_arrest",
    respiratory_failure: "respiratory_failure",
    shock_sepsis: "shock_sepsis",
    status_epilepticus: "status_epilepticus",
    severe_trauma: "trauma",
    drowning_choking: "drowning_choking",
    neonatal_emergency: "neonatal_emergency",
    metabolic_other: "other_emergency",
  };
  return map[t] ?? "other_emergency";
}

export function buildCareSignalV2SubmitPayload(
  form: CareSignalV2FormState,
  facility: FacilitySelection
) {
  const outcomeRow = OUTCOME_OPTIONS.find((o) => o.value === form.outcome);
  const apiOutcome = outcomeRow?.apiOutcome ?? "unknown";

  const childAge = childAgeMonthsForSafeTruth({
    ageBand: form.ageBand,
    neonateDays: form.neonateDays,
    infantMonths: form.infantMonths,
    childYears: form.childYears,
  });

  const gapDetailsV2 = {
    formVersion: CARE_SIGNAL_FORM_VERSION,
    reportType: form.reportType,
    careLocation: form.careLocation,
    careLocationOther: form.careLocationOther || null,
    weightKg: form.weightKg ? Number(form.weightKg) : null,
    primaryEmergencyType: form.primaryEmergencyType,
    presentationSummary: form.presentationSummary.trim(),
    timeline: {
      recognitionDelay: form.recognitionDelay,
      firstProviderAssessmentDelay: form.firstProviderAssessmentDelay,
      codeTeamActivationDelay: form.codeTeamActivationDelay,
      definitiveCareDelay: form.definitiveCareDelay,
      transferRequired: form.transferRequired,
      transferDelay: form.transferDelay,
    },
    response: {
      cprQualityAdequate: form.cprQualityAdequate,
      advancedAirway: form.advancedAirway,
      ivAccessEstablished: form.ivAccessEstablished,
      criticalMedsGiven: form.criticalMedsGiven,
      equipmentUnavailable: form.equipmentUnavailable,
      staffingAdequate: form.staffingAdequate,
      protocolFollowed: form.protocolFollowed,
    },
    preventableAssessment: form.preventableAssessment,
    contributingFactors: form.contributingFactors,
    proposedSystemFix: form.proposedSystemFix.trim(),
    lessonsLearned: form.lessonsLearned.trim() || null,
    debriefConducted: form.debriefConducted || null,
    roscAchieved: form.roscAchieved,
  };

  const presentation = JSON.stringify({
    reportType: form.reportType,
    careLocation: form.careLocation,
    summary: form.presentationSummary.trim(),
    primaryEmergencyType: form.primaryEmergencyType,
    timeline: gapDetailsV2.timeline,
    preventableAssessment: form.preventableAssessment,
  });

  return {
    eventDate: form.eventDate || new Date().toISOString(),
    childAge,
    eventType:
      form.reportType === "near_miss"
        ? "near_miss"
        : form.reportType === "systems_concern"
          ? "systems_concern"
          : form.primaryEmergencyType
            ? mapEmergencyTypeToEventType(form.primaryEmergencyType)
            : "clinical_event",
    presentation,
    isAnonymous: form.isAnonymous,
    chainOfSurvival: {
      recognition: form.recognition,
      recognitionNotes: form.recognitionDelay,
      activation: form.activation,
      activationNotes: form.codeTeamActivationDelay,
      cpr: form.cpr,
      cprQuality: form.cprQualityAdequate === true ? "adequate" : form.cprQualityAdequate === false ? "inadequate" : undefined,
      cprNotes: form.cpr ? `Staffing adequate: ${form.staffingAdequate}` : undefined,
      defibrillation: form.defibrillation,
      advancedCare: form.advancedAirway || form.ivAccessEstablished || form.criticalMedsGiven,
      advancedCareDetails: [
        form.advancedAirway && "advanced_airway",
        form.ivAccessEstablished && "iv_io",
        form.criticalMedsGiven && "critical_meds",
      ]
        .filter(Boolean)
        .join(","),
      postResuscitation: form.postResuscitationCare,
      postResuscitationNotes: form.roscAchieved === true ? "ROSC" : form.roscAchieved === false ? "no_ROSC" : undefined,
    },
    systemGaps: form.systemGaps,
    gapDetails: gapDetailsV2,
    outcome: apiOutcome,
    neurologicalStatus: form.neurologicalStatus || "unknown",
    facilityId: facility.facilityId,
  };
}

export function validateCareSignalV2Step(step: number, form: CareSignalV2FormState): string | null {
  if (step === 1) {
    if (!form.reportType) return "Select what type of report this is.";
    if (!form.careLocation) return "Select where care took place.";
    if (form.careLocation === "other_hospital_area" && !form.careLocationOther.trim()) {
      return "Describe the care location.";
    }
    if (!form.eventDate) return "Enter when the event occurred.";
  }
  if (step === 2) {
    if (form.reportType === "near_miss") {
      if (form.presentationSummary.trim().length < 10) {
        return "Briefly describe the near miss (at least 10 characters).";
      }
      return null;
    }
    if (form.reportType === "systems_concern") {
      if (form.presentationSummary.trim().length < 15) {
        return "Describe the systems concern affecting children's care.";
      }
      return null;
    }
    if (!form.primaryEmergencyType) return "Select the primary emergency type.";
    if (form.presentationSummary.trim().length < 10) {
      return "Briefly describe what happened (at least 10 characters).";
    }
  }
  if (step === 3) {
    if (form.reportType === "resuscitation_event" || form.reportType === "clinical_deterioration") {
      if (form.recognitionDelay === "unknown" && form.codeTeamActivationDelay === "unknown") {
        return "Estimate at least one delay (recognition or code team) — governments use this for QI.";
      }
    }
  }
  if (step === 4) {
    if (form.reportType === "resuscitation_event" && form.cpr && form.cprQualityAdequate === null) {
      return "Indicate whether CPR quality was adequate.";
    }
  }
  if (step === 5) {
    if (form.reportType !== "systems_concern" && form.reportType !== "near_miss") {
      if (!form.outcome) return "Select the outcome for the child.";
      if (!form.preventableAssessment) return "Assess whether this death or harm was preventable.";
    }
    if (form.reportType === "near_miss" && !form.preventableAssessment) {
      form.preventableAssessment = "likely_preventable";
    }
  }
  if (step === 6) {
    if (form.systemGaps.length === 0) return "Select at least one system gap category.";
    if (form.proposedSystemFix.trim().length < 20) {
      return "Describe one system change that could save the next child (at least 20 characters).";
    }
  }
  return null;
}

function labelFor<T extends string>(
  options: Array<{ value: T; label: string }>,
  value: string | undefined | null
): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? String(value).replace(/_/g, " ");
}

/** Human-readable rows for admin / facility review of stored v2 gapDetails. */
export function careSignalV2ReviewRows(gapDetails: Record<string, unknown>): Array<{ label: string; value: string }> {
  if (gapDetails.formVersion !== "v2") return [];

  const timeline = (gapDetails.timeline ?? {}) as Record<string, unknown>;
  const response = (gapDetails.response ?? {}) as Record<string, unknown>;
  const rows: Array<{ label: string; value: string }> = [
    {
      label: "Report type",
      value: labelFor(REPORT_TYPE_OPTIONS, String(gapDetails.reportType ?? "")),
    },
    {
      label: "Care location",
      value: labelFor(CARE_LOCATION_OPTIONS, String(gapDetails.careLocation ?? "")),
    },
    {
      label: "Presentation",
      value: String(gapDetails.presentationSummary ?? "—"),
    },
    {
      label: "Recognition delay",
      value: labelFor(DELAY_OPTIONS, String(timeline.recognitionDelay ?? "")),
    },
    {
      label: "First provider assessment",
      value: labelFor(DELAY_OPTIONS, String(timeline.firstProviderAssessmentDelay ?? "")),
    },
    {
      label: "Code team activation",
      value: labelFor(DELAY_OPTIONS, String(timeline.codeTeamActivationDelay ?? "")),
    },
    {
      label: "Definitive care delay",
      value: labelFor(DELAY_OPTIONS, String(timeline.definitiveCareDelay ?? "")),
    },
    {
      label: "Preventability",
      value: labelFor(PREVENTABLE_OPTIONS, String(gapDetails.preventableAssessment ?? "")),
    },
  ];

  const equipment = response.equipmentUnavailable as string[] | undefined;
  if (equipment?.length) {
    rows.push({ label: "Equipment gaps", value: equipment.join("; ") });
  }

  const factors = gapDetails.contributingFactors as string[] | undefined;
  if (factors?.length) {
    rows.push({ label: "Contributing factors", value: factors.join("; ") });
  }

  const fix = String(gapDetails.proposedSystemFix ?? "").trim();
  if (fix) rows.push({ label: "Proposed system fix", value: fix });

  const lessons = String(gapDetails.lessonsLearned ?? "").trim();
  if (lessons) rows.push({ label: "Lessons learned", value: lessons });

  return rows;
}
