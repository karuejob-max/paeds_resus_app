export const INSTITUTION_TYPE_VALUES = [
  "public_hospital",
  "private_hospital",
  "faith_based_hospital",
  "clinic",
  "medical_college",
  "nursing_school",
  "training_provider",
  "ambulance_service",
  "government_health_program",
  "professional_association_ngo",
  "healthcare_network",
  "other_organization",
] as const;

export const INSTITUTION_TYPE_OPTIONS = [
  { value: "public_hospital", label: "Public hospital" },
  { value: "private_hospital", label: "Private hospital" },
  { value: "faith_based_hospital", label: "Faith-based or mission hospital" },
  { value: "clinic", label: "Clinic or outpatient facility" },
  { value: "medical_college", label: "University or medical college" },
  { value: "nursing_school", label: "Nursing or health training school" },
  {
    value: "training_provider",
    label: "Training provider or education organization",
  },
  { value: "ambulance_service", label: "Ambulance or pre-hospital service" },
  {
    value: "government_health_program",
    label: "Government, county, or public-health program",
  },
  {
    value: "professional_association_ngo",
    label: "Professional association, NGO, or non-profit",
  },
  {
    value: "healthcare_network",
    label: "Healthcare network or referral system",
  },
  {
    value: "other_organization",
    label: "Other healthcare, education, or public-health organization",
  },
] as const;

export type InstitutionType = (typeof INSTITUTION_TYPE_VALUES)[number];

export const INSTITUTION_PLATFORM_NEED_OPTIONS = [
  {
    value: "cpd_portal",
    label: "CPD Portal",
    description:
      "Track sessions, attendance, CPD points, certificates, staff development, and reports.",
  },
  {
    value: "iers_readiness",
    label: "Institutional readiness and response",
    description:
      "Coordinate institutional readiness, emergency response operations, evidence, drills, and improvement.",
  },
  {
    value: "institution_administration",
    label: "Institution administration",
    description:
      "Manage the organization, people, roles, access, exports, support, and recovery.",
  },
  {
    value: "paeds_resus_training",
    label: "Training partnership with Paeds Resus",
    description:
      "Discuss cohort learning, facilitated training, assessment, and certificates outside the portal while the institutional training program is being integrated.",
  },
  {
    value: "other_support",
    label: "Something else or a guided conversation",
    description:
      "Tell the Paeds Resus team what your organization needs so we can route the request correctly.",
  },
] as const;

export const INSTITUTION_PLATFORM_NEED_VALUES = [
  "cpd_portal",
  "iers_readiness",
  "institution_administration",
  "paeds_resus_training",
  "other_support",
] as const;

export type InstitutionPlatformNeed =
  (typeof INSTITUTION_PLATFORM_NEED_VALUES)[number];
