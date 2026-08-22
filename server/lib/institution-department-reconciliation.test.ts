import { describe, expect, it } from "vitest";
import { normalizeDepartmentKey, suggestCatalogDepartment } from "./institution-department-reconciliation";

describe("institution department reconciliation helpers", () => {
  it("normalizes label keys without changing the historical label", () => {
    expect(normalizeDepartmentKey("  Paediatric   Ward ")).toBe("paediatric ward");
  });

  it("returns an exact catalog suggestion for a canonical label", () => {
    expect(suggestCatalogDepartment("Critical Care: PICU")).toEqual({
      confidence: "exact",
      suggestedLabel: "Critical Care: PICU",
      candidateLabels: ["Critical Care: PICU"],
    });
  });

  it("returns one high-confidence suggestion for an unambiguous exact alias", () => {
    expect(suggestCatalogDepartment("A&E")).toEqual({
      confidence: "alias",
      suggestedLabel: "Out Patient Department: Accident and Emergency / Casualty",
      candidateLabels: ["Out Patient Department: Accident and Emergency / Casualty"],
    });
  });

  it("does not auto-suggest when an alias can refer to more than one catalog department", () => {
    const result = suggestCatalogDepartment("medical ward");
    expect(result.confidence).toBe("ambiguous");
    expect(result.suggestedLabel).toBeNull();
    expect(result.candidateLabels.length).toBeGreaterThan(1);
  });

  it("does not promote a genuine custom label merely because it contains a catalog keyword", () => {
    const result = suggestCatalogDepartment("Emergency Transport Team");
    expect(result.suggestedLabel).toBeNull();
    expect(result.confidence).not.toBe("alias");
  });
});
