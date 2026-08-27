/**
 * Program identity, derived from `institutionalStaffMembers.designation` —
 * not a separate stored field (CEO decision, 2026-07-21: avoid a second
 * field that could drift out of sync with the designation that actually
 * drives eligibility/rules).
 *
 * Purpose: a nurse and an intern go through visually identical screens
 * today with completely different payment rules operating invisibly in
 * the background. This gives every part of the app (dashboard badge,
 * designation-declaration live preview, future consent copy) one place to
 * read "which program is this person on, and what actually applies to
 * them" from — so if it's ever wrong, it's wrong everywhere consistently
 * and is easy to fix in one place, not five.
 */

export type Designation =
  | "noi"
  | "coi_bsc"
  | "coi_diploma"
  | "moi"
  | "permanent_nurse"
  | "permanent_doctor"
  | "other";

export interface ProgramIdentity {
  /** Short label for a badge/header. Null = not on a subsidised cohort program. */
  programName: string | null;
  /** Full name for first-mention/explanatory contexts. */
  programFullName: string | null;
  /** Plain-language bullet points of the rules that actually apply to this designation. */
  rules: string[];
}

const INTERN_DESIGNATIONS: readonly Designation[] = ["noi", "coi_bsc", "coi_diploma", "moi"];

export function getProgramIdentity(designation: Designation | string | null | undefined): ProgramIdentity {
  if (designation === "permanent_nurse") {
    return {
      programName: "NERP",
      programFullName: "Nurses Emergency Readiness Program",
      rules: [
        "KES 15,000 total, subsidised — requires a licence number on file",
        "KES 2,500/month required from the start, no deferral period",
        "Falling behind pace blocks booking further online simulation sessions until you catch up",
        "Phase 3 (hands-on assessment) requires the full balance paid",
        "All payments, including instalments, are non-refundable",
      ],
    };
  }

  if (designation && (INTERN_DESIGNATIONS as readonly string[]).includes(designation)) {
    return {
      programName: "IERP",
      programFullName: "Intern Emergency Readiness Program",
      rules: [
        "KES 15,000 total, subsidised — no licence number required",
        "No payment required to start — begin Phase 1 and Phase 2 for free",
        "You must make at least one payment within 4 months of joining to keep booking online simulation sessions",
        "Phase 3 (hands-on assessment) requires the full balance paid",
        "All payments, including instalments, are non-refundable",
      ],
    };
  }

  // Permanent doctors, other cadres, or undeclared learners use the standard
  // individual route. This is intentionally a pathway name, not a fourth
  // subsidised programme: it is open enrolment, self-funded, and non-cohort.
  return {
    programName: "Open Enrolment",
    programFullName: "Paeds Resus Open Enrolment Pathway",
    rules: [
      "Standard individual pricing applies (not part of a subsidised cohort)",
      "You may join independently and complete the same Paeds Resus training and certification requirements",
      "All payments are non-refundable",
    ],
  };
}
