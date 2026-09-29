import { describe, expect, it } from "vitest";
import { privacyPolicyDocument } from "./privacy-policy";

function allPrivacyText(): string {
  return privacyPolicyDocument.sections
    .flatMap(section => [
      ...(section.paragraphs ?? []),
      ...(section.bullets ?? []),
    ])
    .join(" ");
}

describe("privacy policy publication safeguards", () => {
  it("does not publish legal placeholders or the retired domain", () => {
    const text = allPrivacyText();
    expect(text).not.toContain("counsel to insert");
    expect(text).not.toContain("paeds-resus.com");
    expect(text).toContain("paedsresus.com");
  });
});
