/**
 * Sprint 1 Measurement Truth — event types that must remain stable.
 * Used by verify:sprint1 and unit tests; see docs/EVENT_TAXONOMY.md.
 */
export const SPRINT1_SERVER_EVENT_TYPES = [
  "course_enrollment",
  "payment_initiation",
  "payment_completion",
  "safetruth_submission",
  "institution_training_schedule_created",
  "care_signal_submission_created",
] as const;

export const SPRINT1_RESUS_EVENT_PREFIX = "resus_";

export const SPRINT1_RESUS_EVENT_TYPES = [
  "resus_session",
  "resus_assessment",
  "resus_letter",
  "resus_threat",
  "resus_intervention",
  "resus_resource_gap",
  "resus_reassessment",
  "resus_diagnosis",
  "resus_emergency",
  "resus_question",
] as const;

export type Sprint1ServerEventType = (typeof SPRINT1_SERVER_EVENT_TYPES)[number];
