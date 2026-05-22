import { describe, expect, it } from "vitest";
import { buildTrainingEnrollmentLedgerView, resolveTrainingOfferingLabel } from "../../shared/training-product-taxonomy";

describe("training-product-taxonomy", () => {
  it("labels AHA PALS when catalog is full PALS course", () => {
    const view = buildTrainingEnrollmentLedgerView({
      programType: "pals",
      courseTitle: "Pediatric Advanced Life Support",
      courseId: 47,
    });
    expect(view.productLineLabel).toBe("AHA");
    expect(view.offeringLabel).toContain("PALS");
    expect(view.nomenclatureNote).toBeNull();
  });

  it("labels ADF seriously ill when catalog title matches legacy row", () => {
    const view = buildTrainingEnrollmentLedgerView({
      programType: "pals",
      courseTitle: "The systematic approach to a seriously ill child",
      courseId: 3,
      pricingSku: "pals",
    });
    expect(view.offeringLabel).toContain("ADF");
    expect(view.nomenclatureNote).toContain("ADF");
  });

  it("maps fellowship program type", () => {
    expect(resolveTrainingOfferingLabel({ programType: "fellowship" })).toBe(
      "Fellowship (program)"
    );
  });
});
