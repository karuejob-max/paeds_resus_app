import { describe, expect, it } from "vitest";
import {
  findCampaignSuppression,
  normalizedEmail,
  normalizedName,
  normalizedSuppressionValue,
  validEmail,
} from "./nerp-campaign-controls";

describe("NERP campaign suppression controls", () => {
  const suppressions = [
    { id: 1, matchType: "email" as const, matchValue: "thrsmwaniki@yahoo.co.uk", reasonCode: "admin_nurse", note: null },
    { id: 2, matchType: "exact_name" as const, matchValue: "esther wairimu mwangi", reasonCode: "identity_correction", note: "Do not match Esther Mwangi." },
    { id: 3, matchType: "exact_name" as const, matchValue: "annet muthoni kingori", reasonCode: "admin_nurse", note: null },
    { id: 4, matchType: "exact_name" as const, matchValue: "emma githaka", reasonCode: "not_registered", note: "No account yet." },
  ];

  it("normalizes emails and exact names", () => {
    expect(normalizedEmail("  THRSMWANIKI@YAHOO.CO.UK ")).toBe("thrsmwaniki@yahoo.co.uk");
    expect(normalizedName("Esther   Wairimu Mwangi")).toBe("esther wairimu mwangi");
    expect(normalizedSuppressionValue("exact_name", "Annet   Muthoni Kingori")).toBe("annet muthoni kingori");
  });

  it("matches the requested admin-nurse email and exact names", () => {
    expect(findCampaignSuppression(suppressions, "thrsmwaniki@yahoo.co.uk", "Other Person")?.id).toBe(1);
    expect(findCampaignSuppression(suppressions, null, "Esther Wairimu Mwangi")?.id).toBe(2);
    expect(findCampaignSuppression(suppressions, null, "Annet Muthoni Kingori")?.id).toBe(3);
    expect(findCampaignSuppression(suppressions, null, "Emma Githaka")?.id).toBe(4);
  });

  it("does not over-suppress Esther Mwangi or a name variant", () => {
    expect(findCampaignSuppression(suppressions, null, "Esther Mwangi")).toBeNull();
    expect(findCampaignSuppression(suppressions, null, "Esther Wairimu Mwangi Nurse")).toBeNull();
  });

  it("validates email-keyed suppressions", () => {
    expect(validEmail("thrsmwaniki@yahoo.co.uk")).toBe(true);
    expect(validEmail("not-an-email")).toBe(false);
  });
});
