/**
 * Product-line vs offering vs LMS catalog row — for admin ledgers and audits.
 *
 * - **Product line** (program family): AHA, Fellowship, Instructor, Paeds Resus ADF
 * - **Offering** (what the customer bought): BLS, ACLS, PALS, Heartsaver, or ADF SKUs
 * - **Catalog row** (`courses.id` + title): internal LMS content; may differ from offering label
 */

export type TrainingProductLine = "aha" | "fellowship" | "instructor" | "paeds_resus_adf" | "other";

export type AhaOfferingCode = "bls" | "acls" | "pals" | "heartsaver" | "nrp";

export const AHA_OFFERING_LABELS: Record<AhaOfferingCode, string> = {
  bls: "BLS (Basic Life Support)",
  acls: "ACLS (Advanced Cardiovascular Life Support)",
  pals: "PALS (Pediatric Advanced Life Support)",
  heartsaver: "Heartsaver CPR AED",
  nrp: "NRP (Neonatal Resuscitation Program)",
};

const AHA_PROGRAM_TYPES = new Set<string>(["bls", "acls", "pals", "heartsaver", "nrp"]);

/** Legacy ADF / E2E PALS micro-courses stored under enrollments.programType = pals */
export const PALS_ADF_CATALOG_TITLE_MARKERS = [
  "seriously ill",
  "septic shock",
  "paediatric septic",
] as const;

export function isAhaProgramType(programType: string): programType is AhaOfferingCode {
  return AHA_PROGRAM_TYPES.has(programType);
}

export function inferProductLine(programType: string): TrainingProductLine {
  if (isAhaProgramType(programType)) return "aha";
  if (programType === "fellowship" || programType === "fellowship_diploma") return "fellowship";
  if (programType === "instructor") return "instructor";
  return "other";
}

export function productLineLabel(line: TrainingProductLine): string {
  switch (line) {
    case "aha":
      return "AHA";
    case "fellowship":
      return "Fellowship";
    case "instructor":
      return "Instructor";
    case "paeds_resus_adf":
      return "Paeds Resus ADF";
    default:
      return "Other";
  }
}

export function inferPalsAdfSku(
  courseTitle: string | null | undefined,
  pricingSku?: string | null
): "pals_seriously_ill" | "pals_septic" | null {
  if (pricingSku === "pals_septic") return "pals_septic";
  const t = (courseTitle ?? "").toLowerCase();
  if (t.includes("septic")) return "pals_septic";
  if (pricingSku === "pals" || t.includes("seriously ill")) return "pals_seriously_ill";
  return null;
}

/** Human-facing offering label for training ledger / CSV. */
export function resolveTrainingOfferingLabel(args: {
  programType: string;
  courseTitle?: string | null;
  pricingSku?: string | null;
}): string {
  const { programType, courseTitle, pricingSku } = args;

  if (programType === "fellowship") return "Fellowship (program)";
  if (programType === "fellowship_diploma") return "Fellowship diploma";
  if (programType === "instructor") return "Paeds Resus Instructor";

  if (isAhaProgramType(programType)) {
    const adf = programType === "pals" ? inferPalsAdfSku(courseTitle, pricingSku) : null;
    if (adf === "pals_seriously_ill") {
      return "ADF: Systematic approach (seriously ill child)";
    }
    if (adf === "pals_septic") {
      return "ADF: Paediatric septic shock";
    }
    return AHA_OFFERING_LABELS[programType];
  }

  return programType.replace(/_/g, " ");
}

export type TrainingEnrollmentLedgerView = {
  productLine: TrainingProductLine;
  productLineLabel: string;
  offeringLabel: string;
  catalogTitle: string | null;
  catalogId: number | null;
  nomenclatureNote: string | null;
};

export function buildTrainingEnrollmentLedgerView(args: {
  programType: string;
  courseTitle?: string | null;
  courseId?: number | null;
  pricingSku?: string | null;
}): TrainingEnrollmentLedgerView {
  const productLine = inferProductLine(args.programType);
  const offeringLabel = resolveTrainingOfferingLabel({
    programType: args.programType,
    courseTitle: args.courseTitle,
    pricingSku: args.pricingSku,
  });
  const catalogTitle = args.courseTitle?.trim() || null;
  const catalogId = args.courseId ?? null;

  let nomenclatureNote: string | null = null;
  const adfSku =
    args.programType === "pals" ? inferPalsAdfSku(catalogTitle, args.pricingSku) : null;
  if (adfSku) {
    nomenclatureNote =
      "ADF micro-course catalog row (programType=pals). AHA PALS certification uses a separate full-course catalog row.";
  } else if (isAhaProgramType(args.programType) && catalogTitle && catalogId) {
    nomenclatureNote = null;
  }

  return {
    productLine,
    productLineLabel: productLineLabel(productLine),
    offeringLabel,
    catalogTitle,
    catalogId,
    nomenclatureNote,
  };
}
