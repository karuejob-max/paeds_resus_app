/**
 * NOTE (2026-07-29): this module checks Phase 3 (full physical AHA
 * certification) — the `certificates` table row only exists once someone
 * completes hands-on training. That's the correct check for someone
 * pursuing full AHA certification, but per CEO clarification, it is NOT
 * the right check for Fellowship eligibility — Fellowship requires Phase 2
 * completion (instructor-signed-off online team simulations), not the full
 * physical certification. Use server/lib/fellowship-phase2-completion.ts
 * for Fellowship purposes. This module was never wired into
 * calculateCoursesPillar, so nothing live was ever incorrect — it's kept
 * as-is because it's still the right tool for "does this person hold full
 * AHA certification," just not for Fellowship.
 *
 * Fellowship Pillar A certification floor (North Star v2.1 addendum §1):
 * BLS + ACLS + PALS + NRP, uniform across cadres, all four required and
 * currently valid (not expired) — not gated by cadre, and not satisfied by
 * a cognitive-exam-only credential (bls_cognitive etc. are a lesser, distinct
 * programType — see server/lib/certificate-expiry.ts).
 *
 * This module is deliberately standalone: it does not yet wire into
 * calculateCoursesPillar or isQualified. coursesPillar.percentage is read by
 * six client + server files today, so reshaping what it means (does 100% now
 * require the cert floor too, or does the UI show two separate progress
 * indicators?) is a real product decision, not an implementation detail —
 * see the PR description for the open question this defers.
 */
import { computeCertificateExpiryDate, getCertificateExpiryStatus } from "./certificate-expiry";

/** The four full AHA provider certifications required for the Fellow title. */
export const FELLOWSHIP_REQUIRED_CERTIFICATIONS = ["bls", "acls", "pals", "nrp"] as const;
export type FellowshipRequiredCertification = (typeof FELLOWSHIP_REQUIRED_CERTIFICATIONS)[number];

export interface FellowshipCertificationFloorInput {
  programType: string;
  issueDate: Date;
  expiryDate: Date | null;
}

export interface FellowshipCertificationFloorStatus {
  required: readonly FellowshipRequiredCertification[];
  held: FellowshipRequiredCertification[];
  missing: FellowshipRequiredCertification[];
  met: boolean;
}

/**
 * Pure function — given a user's certificate rows, determines which of the
 * four required certifications are currently held and valid. A certification
 * "counts" only if: its programType is one of the four required (full
 * provider cert, not a _cognitive variant), and its resolved expiry (stored
 * expiryDate, or computed from issueDate + programType if not stored — same
 * fallback pattern used in server/routers/certificates.ts) is in the future.
 * If a user holds more than one certificate of the same type, the one with
 * the latest resolved expiry wins (most recent renewal).
 */
export function getFellowshipCertificationFloorStatus(
  certificates: FellowshipCertificationFloorInput[],
  now: Date = new Date()
): FellowshipCertificationFloorStatus {
  const latestValidExpiryByType = new Map<FellowshipRequiredCertification, number>();

  for (const cert of certificates) {
    if (!(FELLOWSHIP_REQUIRED_CERTIFICATIONS as readonly string[]).includes(cert.programType)) {
      continue;
    }
    const type = cert.programType as FellowshipRequiredCertification;
    const resolvedExpiry = cert.expiryDate ?? computeCertificateExpiryDate(cert.issueDate, cert.programType);
    if (getCertificateExpiryStatus(resolvedExpiry, now) !== "valid") continue;
    const existing = latestValidExpiryByType.get(type);
    if (existing === undefined || resolvedExpiry.getTime() > existing) {
      latestValidExpiryByType.set(type, resolvedExpiry.getTime());
    }
  }

  const held = FELLOWSHIP_REQUIRED_CERTIFICATIONS.filter((t) => latestValidExpiryByType.has(t));
  const missing = FELLOWSHIP_REQUIRED_CERTIFICATIONS.filter((t) => !latestValidExpiryByType.has(t));

  return {
    required: FELLOWSHIP_REQUIRED_CERTIFICATIONS,
    held,
    missing,
    met: missing.length === 0,
  };
}
