/**
 * Code Signal — types, taxonomy, form state for adult/whole-hospital
 * resuscitation incident & near-miss reporting.
 *
 * Deliberately a sibling module to care-signal-v3.ts, not an extension of
 * it — Code Signal has its own condition/failure/success taxonomy (adult
 * resuscitation presentations, not paediatric ones) and its own table
 * (`codeSignalEvents`). See docs/NORTH_STAR_V2_3_ADDENDUM_WHOLE_HOSPITAL_READINESS.md.
 */
import { countryNameToIso2 } from "@shared/geo-taxonomy";

export const CODE_SIGNAL_FORM_VERSION = "v1" as const;
export const CODE_SIGNAL_SCHEMA_VERSION = "1.0" as const;

export type PatientCategory = "ADULT_PATIENT" | "MOTHER_OF_PATIENT" | "STAFF_MEMBER" | "OTHER";

export const PATIENT_CATEGORY_LABELS: Record<PatientCategory, string> = {
  ADULT_PATIENT: "Adult patient",
  MOTHER_OF_PATIENT: "Mother of a paediatric patient (e.g. collapsed on the ward)",
  STAFF_MEMBER: "Hospital staff member",
  OTHER: "Other adult on the premises",
};

export type ConditionCategory =
  | "CARDIAC_ARREST" | "ACUTE_CORONARY_SYNDROME" | "STROKE"
  | "RESPIRATORY_FAILURE" | "SEPSIS_SHOCK" | "TRAUMA"
  | "OBSTETRIC_EMERGENCY" | "METABOLIC" | "POISONING" | "OTHER";

export const CONDITION_CATEGORY_LABELS: Record<ConditionCategory, string> = {
  CARDIAC_ARREST: "Cardiac arrest",
  ACUTE_CORONARY_SYNDROME: "Chest pain / suspected heart attack (ACS)",
  STROKE: "Stroke / sudden neurological deficit",
  RESPIRATORY_FAILURE: "Respiratory failure",
  SEPSIS_SHOCK: "Sepsis / shock",
  TRAUMA: "Injury or accident",
  OBSTETRIC_EMERGENCY: "Obstetric emergency (e.g. postpartum haemorrhage, eclampsia)",
  METABOLIC: "Metabolic emergency (e.g. DKA, severe hypoglycaemia)",
  POISONING: "Poisoning or toxic ingestion",
  OTHER: "Other or not sure",
};

export type OutcomeCategory =
  | "SURVIVED_WELL" | "SURVIVED_MORBIDITY" | "DIED_IN_FACILITY"
  | "DIED_IN_TRANSIT" | "NEAR_MISS" | "TRANSFERRED_UNKNOWN" | "UNKNOWN";

export const OUTCOME_CATEGORY_LABELS: Record<OutcomeCategory, string> = {
  SURVIVED_WELL: "Survived — recovered well",
  SURVIVED_MORBIDITY: "Survived — with ongoing problems",
  DIED_IN_FACILITY: "Died at the facility",
  DIED_IN_TRANSIT: "Died in transit",
  NEAR_MISS: "Near miss — serious risk averted",
  TRANSFERRED_UNKNOWN: "Transferred — outcome unknown",
  UNKNOWN: "Outcome not yet known",
};

export type RoleAtTimeOfEvent =
  | "TEAM_LEADER" | "PRIMARY_CLINICIAN" | "SUPPORT_CLINICIAN"
  | "OBSERVING_TRAINEE" | "LOCUM";

export const ROLE_AT_EVENT_LABELS: Record<RoleAtTimeOfEvent, string> = {
  TEAM_LEADER: "Team leader",
  PRIMARY_CLINICIAN: "Primary clinician or nurse (directly managing patient)",
  SUPPORT_CLINICIAN: "Team member / supporting clinician or nurse",
  OBSERVING_TRAINEE: "Observing trainee",
  LOCUM: "Locum (covering another facility or role)",
};

/**
 * Same eight structural domains Care Signal uses (RECOGNITION, ESCALATION,
 * etc.) — these are genuinely population-neutral concepts (a recognition
 * delay is a recognition delay whether the patient is 3 or 63). Only the
 * specific failure-mode and success-factor codes below are adult-specific.
 */
export type Domain =
  | "RECOGNITION" | "ESCALATION" | "VASCULAR_ACCESS" | "TREATMENT"
  | "REFERRAL" | "MONITORING" | "COMMUNICATION" | "RESOURCE_AVAILABILITY";

/**
 * Neutral domain labels, used for BOTH tracks — this is the fix carried
 * over from the Care Signal audit: a track-blind label ("Recognition")
 * rather than a failure-flavoured one ("Recognition failure") shown
 * regardless of whether the provider is filing a success or a failure.
 */
export const DOMAIN_LABELS: Record<Domain, string> = {
  RECOGNITION: "Recognition",
  ESCALATION: "Escalation",
  VASCULAR_ACCESS: "Vascular access",
  TREATMENT: "Treatment",
  REFERRAL: "Referral / transfer",
  MONITORING: "Monitoring",
  COMMUNICATION: "Communication",
  RESOURCE_AVAILABILITY: "Resource availability",
};

export type FailureModeCode =
  | "RECOG_ARREST_DELAYED" | "RECOG_ACS_ATYPICAL_MISSED" | "RECOG_STROKE_WINDOW_MISSED"
  | "ESCL_SENIOR_DELAY" | "ESCL_NO_PROTOCOL"
  | "ACCESS_IV_DELAY" | "ACCESS_IO_NOT_ATTEMPTED"
  | "TREAT_DEFIB_DELAY" | "TREAT_DOSE_ERROR" | "TREAT_THROMBOLYSIS_DELAY" | "TREAT_OXYGEN_NOT_GIVEN"
  | "REFER_DECISION_DELAY" | "REFER_UNSTABILISED"
  | "MON_NO_REPEAT_VITALS" | "MON_DETERIORATION_MISSED"
  | "COMM_CLOSED_LOOP_FAILURE" | "COMM_HANDOVER_LOSS"
  | "RES_DEFIB_UNAVAILABLE" | "RES_DRUG_STOCKOUT" | "RES_ADULT_SIZED_EQUIPMENT_ONLY";

export const FAILURE_MODES_BY_DOMAIN: Record<Domain, Array<{ code: FailureModeCode; label: string }>> = {
  RECOGNITION: [
    { code: "RECOG_ARREST_DELAYED", label: "Cardiac arrest not recognised promptly" },
    { code: "RECOG_ACS_ATYPICAL_MISSED", label: "Atypical ACS presentation not recognised" },
    { code: "RECOG_STROKE_WINDOW_MISSED", label: "Stroke symptoms not recognised within treatment window" },
  ],
  ESCALATION: [
    { code: "ESCL_SENIOR_DELAY", label: "Delay calling for senior review" },
    { code: "ESCL_NO_PROTOCOL", label: "Escalation pathway not known or not followed" },
  ],
  VASCULAR_ACCESS: [
    { code: "ACCESS_IV_DELAY", label: "Delay establishing IV access" },
    { code: "ACCESS_IO_NOT_ATTEMPTED", label: "IO access not attempted despite failed peripheral access" },
  ],
  TREATMENT: [
    { code: "TREAT_DEFIB_DELAY", label: "Defibrillation delayed beyond target time" },
    { code: "TREAT_DOSE_ERROR", label: "Wrong dose calculated or administered" },
    { code: "TREAT_THROMBOLYSIS_DELAY", label: "Thrombolysis / reperfusion therapy delayed" },
    { code: "TREAT_OXYGEN_NOT_GIVEN", label: "Oxygen not given despite availability and clinical indication" },
  ],
  REFERRAL: [
    { code: "REFER_DECISION_DELAY", label: "Transfer decision delayed beyond clinical threshold" },
    { code: "REFER_UNSTABILISED", label: "Transfer initiated without adequate stabilisation" },
  ],
  MONITORING: [
    { code: "MON_NO_REPEAT_VITALS", label: "Vital signs not repeated after intervention" },
    { code: "MON_DETERIORATION_MISSED", label: "Deterioration not detected between observations" },
  ],
  COMMUNICATION: [
    { code: "COMM_CLOSED_LOOP_FAILURE", label: "Closed-loop communication failure during resuscitation" },
    { code: "COMM_HANDOVER_LOSS", label: "Handover information lost or incomplete" },
  ],
  RESOURCE_AVAILABILITY: [
    { code: "RES_DEFIB_UNAVAILABLE", label: "Defibrillator not available or not functioning" },
    { code: "RES_DRUG_STOCKOUT", label: "Essential drug out of stock" },
    { code: "RES_ADULT_SIZED_EQUIPMENT_ONLY", label: "Only paediatric-sized equipment available for an adult patient" },
  ],
};

export type SuccessFactorCode =
  | "RECOG_EWS_TRIGGERED" | "ESCL_STRUCTURED_ESCALATION"
  | "ACCESS_IO_KIT_AT_BEDSIDE" | "TREAT_CODE_CART_CHECKLIST" | "TREAT_DOOR_TO_BALLOON_PROTOCOL"
  | "COMM_SBAR_HANDOVER" | "MON_EWS_REASSESSMENT";

export const SUCCESS_FACTORS: Array<{ code: SuccessFactorCode; domain: Domain; label: string }> = [
  { code: "RECOG_EWS_TRIGGERED", domain: "RECOGNITION", label: "Early Warning Score correctly triggered timely response" },
  { code: "ESCL_STRUCTURED_ESCALATION", domain: "ESCALATION", label: "Structured escalation reduced time-to-senior review" },
  { code: "ACCESS_IO_KIT_AT_BEDSIDE", domain: "VASCULAR_ACCESS", label: "IO kit at bedside enabled access without delay" },
  { code: "TREAT_CODE_CART_CHECKLIST", domain: "TREATMENT", label: "Code cart checklist ensured all equipment functioning and available" },
  { code: "TREAT_DOOR_TO_BALLOON_PROTOCOL", domain: "TREATMENT", label: "Structured protocol reduced door-to-treatment time" },
  { code: "COMM_SBAR_HANDOVER", domain: "COMMUNICATION", label: "SBAR handover reduced information loss at shift change" },
  { code: "MON_EWS_REASSESSMENT", domain: "MONITORING", label: "Scheduled reassessment intervals caught deterioration early" },
];

export type ReportTrack = "FAILURE" | "SUCCESS";
export type SubmissionMode = "named" | "anonymous";

export type CodeSignalFormState = {
  country: string;
  admin_level_1: string;
  admin_level_2: string;
  patientCategory: PatientCategory | "";
  conditionCategory: ConditionCategory | "";
  outcomeCategory: OutcomeCategory | "";
  roleAtTimeOfEvent: RoleAtTimeOfEvent | "";
  eventDate: string;
  submissionMode: SubmissionMode;
  reportTrack: ReportTrack;
  facilityConfirmed: boolean;
  failureDomains: Domain[];
  failureModeCodes: FailureModeCode[];
  rawNarrative: string;
  successDomains: Domain[];
  successFactorCodes: SuccessFactorCode[];
  successNarrative: string;
  eventId: string;
};

export function initialCodeSignalState(): CodeSignalFormState {
  return {
    country: "",
    admin_level_1: "",
    admin_level_2: "",
    patientCategory: "",
    conditionCategory: "",
    outcomeCategory: "",
    roleAtTimeOfEvent: "",
    eventDate: new Date().toISOString().slice(0, 16),
    submissionMode: "named",
    reportTrack: "FAILURE",
    facilityConfirmed: false,
    failureDomains: [],
    failureModeCodes: [],
    rawNarrative: "",
    successDomains: [],
    successFactorCodes: [],
    successNarrative: "",
    eventId: "",
  };
}

export { countryNameToIso2 };
