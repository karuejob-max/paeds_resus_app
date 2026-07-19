/**
 * Canonical legal document versions — keep in sync with docs/legal/ and counsel sign-off.
 */
export const LEGAL_DOCUMENT_VERSIONS = {
  privacyPolicy: "1.0.0",
  termsOfUse: "1.1.0",
  careSignalNotice: "1.0.0",
  cookieNotice: "1.0.0",
  clinicalIntendedUse: "1.0.0",
  institutionalB2bAddendum: "1.0.0",
  resusGpsDisclaimer: "1.0.0",
  safeTruthGuardian: "1.0.0",
} as const;

export const LEGAL_LAST_UPDATED = "2026-07-19";

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
