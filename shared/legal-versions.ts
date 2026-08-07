/**
 * Canonical legal document versions — keep in sync with docs/legal/ and counsel sign-off.
 */
export const LEGAL_DOCUMENT_VERSIONS = {
  privacyPolicy: "1.1.0",
  termsOfUse: "1.2.0",
  careSignalNotice: "1.1.0",
  codeSignalNotice: "1.0.0",
  cookieNotice: "1.0.0",
  clinicalIntendedUse: "1.0.0",
  institutionalB2bAddendum: "1.0.0",
  resusGpsDisclaimer: "1.0.0",
  safeTruthGuardian: "1.0.0",
} as const;

export const LEGAL_LAST_UPDATED = "2026-07-21";

/**
 * What changed in each `termsOfUse` version, for `LegalReconsentGate.tsx`.
 * Add one entry here on every future bump — the gate reads
 * `LEGAL_CHANGE_SUMMARY[LEGAL_DOCUMENT_VERSIONS.termsOfUse]` automatically,
 * so this is the only place that needs updating, instead of a hardcoded
 * sentence living in a different file that's easy to forget (see the
 * 2026-07-21 lesson: the 1.1.0 explanation was hardcoded directly into the
 * gate component and needed a manual fix the very next time this bumped).
 */
export const LEGAL_CHANGE_SUMMARY: Record<string, string> = {
  "1.1.0":
    "Our Terms of Use were updated to add payment terms for the Subsidised ACLS/BLS Cohort Program — cohort payments (including instalments) are non-refundable, and Phase 3 (hands-on assessment) requires payment in full.",
  "1.2.0":
    "Our Terms of Use were updated to clarify the Subsidised ACLS/BLS Cohort Program's payment rules by track: IERP (interns) and the Nurse Cohort Program now each have their own clearly labeled section, and the Nurse Cohort Program's KES 2,500/month payment requirement is now explicitly documented.",
};

export const LEGAL_CONTACT = {
  controllerName: "Paeds Resus Limited",
  dpoEmail: "privacy@paeds-resus.com",
  supportEmail: "support@paeds-resus.com",
  legalEmail: "legal@paeds-resus.com",
  dataRequestsEmail: "privacy@paeds-resus.com",
  registeredAddress: "Nairobi, Kenya",
  /** ODPC registration — counsel to confirm before publication */
  odpcRegistrationPlaceholder: "[ODPC registration number — counsel to insert]",
} as const;

export type LegalDocumentKey = keyof typeof LEGAL_DOCUMENT_VERSIONS;

/** Returns true when user must re-accept terms/privacy before protected mutations. */
export function isTermsConsentStale(user: {
  termsAcceptedAt?: Date | string | null;
  termsVersion?: string | null;
  privacyAcceptedAt?: Date | string | null;
  privacyVersion?: string | null;
}): boolean {
  if (!user.termsAcceptedAt || !user.privacyAcceptedAt) return true;
  if (user.termsVersion !== LEGAL_DOCUMENT_VERSIONS.termsOfUse) return true;
  if (user.privacyVersion !== LEGAL_DOCUMENT_VERSIONS.privacyPolicy) return true;
  return false;
}

export function isResusGpsAckStale(user: { resusGpsAckVersion?: string | null }): boolean {
  return user.resusGpsAckVersion !== LEGAL_DOCUMENT_VERSIONS.resusGpsDisclaimer;
}
