import { addYears } from "date-fns";

/** Full AHA provider and cognitive gatepass program types. */
export const AHA_CERTIFICATION_PROGRAM_TYPES = new Set([
  "bls",
  "acls",
  "pals",
  "heartsaver",
  "nrp",
  "instructor",
  "bls_cognitive",
  "acls_cognitive",
  "pals_cognitive",
  "heartsaver_cognitive",
  "nrp_cognitive",
  "instructor_cognitive",
]);

/** Fellowship micro-course certificates (programType fellowship). */
export const MICRO_COURSE_CERT_PROGRAM_TYPES = new Set(["fellowship"]);

/** Certificates with a printed 2-year validity period. */
export const PAEDS_RESUS_PROVIDER_CERTIFICATE_PROGRAM_TYPES = new Set([
  "paeds_resus_ils",
  "paeds_resus_bls_provider",
  "paeds_resus_acls_provider",
  "paeds_resus_pals_provider",
  "paeds_resus_nrp_provider",
]);

export const TWO_YEAR_CERTIFICATE_PROGRAM_TYPES = new Set(
  Array.from(AHA_CERTIFICATION_PROGRAM_TYPES)
    .concat(Array.from(MICRO_COURSE_CERT_PROGRAM_TYPES))
    .concat(Array.from(PAEDS_RESUS_PROVIDER_CERTIFICATE_PROGRAM_TYPES))
    .filter((pt) => pt !== "instructor" && pt !== "instructor_cognitive")
);

export type CertificateExpiryStatus = "valid" | "expired" | "unknown";

/** Calendar-year validity: 2 years for AHA + micro-course; 1 year for instructor / diploma. */
export function getCertificateValidityYears(programType: string): number {
  return TWO_YEAR_CERTIFICATE_PROGRAM_TYPES.has(programType) ? 2 : 1;
}

/** Expiry = issue date + validity years (date-fns handles leap years). */
export function computeCertificateExpiryDate(issueDate: Date, programType: string): Date {
  return addYears(issueDate, getCertificateValidityYears(programType));
}

export function certificateShowsExpiryOnPdf(programType: string): boolean {
  return TWO_YEAR_CERTIFICATE_PROGRAM_TYPES.has(programType);
}

export function getCertificateExpiryStatus(
  expiryDate: Date | null | undefined,
  now: Date = new Date()
): CertificateExpiryStatus {
  if (!expiryDate) return "unknown";
  return expiryDate.getTime() < now.getTime() ? "expired" : "valid";
}

/** en-GB long date — matches certificate PDF footer formatting. */
export function formatCertificateExpiryDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
