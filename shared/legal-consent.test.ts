import { describe, expect, it } from "vitest";
import {
  LEGAL_DOCUMENT_VERSIONS,
  isResusGpsAckStale,
  isTermsConsentStale,
} from "./legal-versions";

describe("isTermsConsentStale", () => {
  it("returns true when terms or privacy never accepted", () => {
    expect(isTermsConsentStale({})).toBe(true);
    expect(
      isTermsConsentStale({
        termsAcceptedAt: new Date(),
        termsVersion: LEGAL_DOCUMENT_VERSIONS.termsOfUse,
      })
    ).toBe(true);
  });

  it("returns true when version mismatch", () => {
    expect(
      isTermsConsentStale({
        termsAcceptedAt: new Date(),
        termsVersion: "0.9.0",
        privacyAcceptedAt: new Date(),
        privacyVersion: LEGAL_DOCUMENT_VERSIONS.privacyPolicy,
      })
    ).toBe(true);
  });

  it("returns false when current versions accepted", () => {
    expect(
      isTermsConsentStale({
        termsAcceptedAt: new Date(),
        termsVersion: LEGAL_DOCUMENT_VERSIONS.termsOfUse,
        privacyAcceptedAt: new Date(),
        privacyVersion: LEGAL_DOCUMENT_VERSIONS.privacyPolicy,
      })
    ).toBe(false);
  });
});

describe("isResusGpsAckStale", () => {
  it("detects stale ResusGPS acknowledgment", () => {
    expect(isResusGpsAckStale({})).toBe(true);
    expect(
      isResusGpsAckStale({ resusGpsAckVersion: LEGAL_DOCUMENT_VERSIONS.resusGpsDisclaimer })
    ).toBe(false);
  });
});
