import { describe, expect, it } from "vitest";
import {
  INSTITUTION_ACCOUNT_SCOPE_DEFINITIONS,
  isKnownInstitutionAccountScope,
  selectMatchingInstitutionScope,
} from "./institution-account-scopes";

describe("institution account scopes", () => {
  it("keeps a small explicit shared-scope catalog", () => {
    expect(INSTITUTION_ACCOUNT_SCOPE_DEFINITIONS.map((definition) => definition.scopeKey)).toEqual([
      "account_admin",
      "finance_officer",
      "qi_reviewer",
      "accreditation_reviewer",
      "report_viewer",
    ]);
  });

  it("matches an active scope by user identity or normalized invited email", () => {
    expect(selectMatchingInstitutionScope(
      [{ scopeKey: "finance_officer", scopeStatus: "active", userId: 42, invitedEmail: "finance@example.com" }],
      { userId: 42, email: "other@example.com" },
      ["finance_officer"],
    )).toBe("finance_officer");
    expect(selectMatchingInstitutionScope(
      [{ scopeKey: "report_viewer", scopeStatus: "active", userId: null, invitedEmail: "REPORTS@example.com" }],
      { userId: 43, email: " reports@example.com " },
      ["report_viewer"],
    )).toBe("report_viewer");
  });

  it("rejects inactive and cross-scope assignments", () => {
    const rows = [{ scopeKey: "finance_officer", scopeStatus: "suspended", userId: 42, invitedEmail: "finance@example.com" }];
    expect(selectMatchingInstitutionScope(rows, { userId: 42, email: "finance@example.com" }, ["finance_officer"])).toBeUndefined();
    expect(selectMatchingInstitutionScope(rows, { userId: 42, email: "finance@example.com" }, ["qi_reviewer"])).toBeUndefined();
  });

  it("recognizes only declared scope keys", () => {
    expect(isKnownInstitutionAccountScope("finance_officer")).toBe(true);
    expect(isKnownInstitutionAccountScope("iers_coordinator")).toBe(false);
  });
});
