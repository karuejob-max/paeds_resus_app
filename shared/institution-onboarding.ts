export const INSTITUTION_CATEGORY_VALUES = [
  "healthcare_facility",
  "teaching_and_referral_facility",
  "health_professional_training_institution",
  "continuing_professional_development_provider",
  "pre_hospital_emergency_service",
  "public_health_programme",
  "professional_association_or_ngo",
  "healthcare_network_or_system",
  "research_or_academic_health_organization",
  "other_healthcare_organization",
] as const;

export const INSTITUTION_CATEGORY_OPTIONS = [
  {
    value: "healthcare_facility",
    label: "Healthcare facility",
    description: "A hospital, clinic, health centre, dispensary, or other service-delivery facility.",
  },
  {
    value: "teaching_and_referral_facility",
    label: "Teaching or referral healthcare facility",
    description: "A facility that provides advanced referral care, teaching, residency, or specialist services.",
  },
  {
    value: "health_professional_training_institution",
    label: "Health-professional education institution",
    description: "A university, medical college, nursing school, or other institution that educates health professionals.",
  },
  {
    value: "continuing_professional_development_provider",
    label: "Continuing professional development provider",
    description: "An organization that delivers professional learning, CPD activities, or competency-based training.",
  },
  {
    value: "pre_hospital_emergency_service",
    label: "Pre-hospital or emergency service",
    description: "An ambulance service, emergency medical service, rescue organization, or similar response team.",
  },
  {
    value: "public_health_programme",
    label: "Public-health programme or government health service",
    description: "A national, regional, county, district, or other public-health programme or service.",
  },
  {
    value: "professional_association_or_ngo",
    label: "Professional association, NGO, or non-profit",
    description: "An association, non-governmental organization, charity, or not-for-profit health initiative.",
  },
  {
    value: "healthcare_network_or_system",
    label: "Healthcare network or health system",
    description: "A group of facilities or services coordinated under one network, system, or referral structure.",
  },
  {
    value: "research_or_academic_health_organization",
    label: "Research or academic health organization",
    description: "A research centre, academic health programme, or organization supporting health-system learning.",
  },
  {
    value: "other_healthcare_organization",
    label: "Other healthcare or public-health organization",
    description: "A related organization that does not fit the categories above.",
  },
] as const;

export type InstitutionCategory = (typeof INSTITUTION_CATEGORY_VALUES)[number];

/**
 * Ownership is separate from service-delivery category so faith-based and
 * mission hospitals are not hidden inside a Kenya-only institution list.
 */
export const FACILITY_OWNERSHIP_VALUES = [
  "government",
  "private_for_profit",
  "private_not_for_profit",
  "faith_based_or_mission",
  "military_or_uniformed_service",
  "other_or_not_sure",
] as const;

export const FACILITY_OWNERSHIP_OPTIONS = [
  { value: "government", label: "Government or public" },
  { value: "private_for_profit", label: "Private, for-profit" },
  { value: "private_not_for_profit", label: "Private, not-for-profit" },
  { value: "faith_based_or_mission", label: "Faith-based or mission" },
  { value: "military_or_uniformed_service", label: "Military or uniformed service" },
  { value: "other_or_not_sure", label: "Other or not sure" },
] as const;

export type FacilityOwnership = (typeof FACILITY_OWNERSHIP_VALUES)[number];

/**
 * Country-neutral care-level mapping. Kenya's Level 1–6 language is retained,
 * while the parent care tier and plain-language equivalent make the same data
 * useful where another country uses a different national classification.
 */
export const CARE_FACILITY_LEVEL_VALUES = [
  "primary_level_1",
  "primary_level_2",
  "primary_level_3",
  "primary_level_4",
  "secondary_level_5",
  "tertiary_level_6",
  "quaternary",
  "other_or_not_sure",
] as const;

export const CARE_FACILITY_LEVEL_OPTIONS = [
  { value: "primary_level_1", label: "Primary care — Level 1", description: "Community-based or first-contact care; use the closest local equivalent." },
  { value: "primary_level_2", label: "Primary care — Level 2", description: "Basic primary care or dispensary-level service; use the closest local equivalent." },
  { value: "primary_level_3", label: "Primary care — Level 3", description: "Health-centre or enhanced primary-care service; use the closest local equivalent." },
  { value: "primary_level_4", label: "Primary care — Level 4", description: "Basic hospital or first-referral care; use the closest local equivalent." },
  { value: "secondary_level_5", label: "Secondary care — Level 5", description: "Specialist referral care; use the closest local equivalent." },
  { value: "tertiary_level_6", label: "Tertiary care — Level 6", description: "Advanced referral, teaching, or specialist care; use the closest local equivalent." },
  { value: "quaternary", label: "Quaternary care", description: "Highly specialized or national-level referral care." },
  { value: "other_or_not_sure", label: "Another national classification / not sure", description: "Use this if your country uses a different system; add the local designation below." },
] as const;

export type CareFacilityLevel = (typeof CARE_FACILITY_LEVEL_VALUES)[number];

export function requiresCareFacilityClassification(category: string | null | undefined): boolean {
  return category === "healthcare_facility" || category === "teaching_and_referral_facility";
}

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
    label: "Institutional Life Support Training Program",
    description:
      "Enroll providers in Paeds Resus competency-based training at KES 10,000 per provider. This creates Paeds Resus certification, not an AHA certificate.",
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

/** Compatibility aliases for non-onboarding legacy imports. */
export const INSTITUTION_TYPE_VALUES = INSTITUTION_CATEGORY_VALUES;
export const INSTITUTION_TYPE_OPTIONS = INSTITUTION_CATEGORY_OPTIONS;
export type InstitutionType = InstitutionCategory;
