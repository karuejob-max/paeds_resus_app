import { describe, expect, it } from "vitest";
import { isLegalDocumentPath } from "./legal-routes";

describe("isLegalDocumentPath", () => {
  it("matches terms and privacy routes", () => {
    expect(isLegalDocumentPath("/terms")).toBe(true);
    expect(isLegalDocumentPath("/privacy")).toBe(true);
    expect(isLegalDocumentPath("/privacy#care-signal")).toBe(true);
  });

  it("matches legal sub-routes and appeals", () => {
    expect(isLegalDocumentPath("/legal/cookies")).toBe(true);
    expect(isLegalDocumentPath("/legal/care-signal")).toBe(true);
    expect(isLegalDocumentPath("/care-signal/appeal")).toBe(true);
  });

  it("does not match app workspaces", () => {
    expect(isLegalDocumentPath("/register")).toBe(false);
    expect(isLegalDocumentPath("/home")).toBe(false);
    expect(isLegalDocumentPath("/care-signal")).toBe(false);
  });
});
