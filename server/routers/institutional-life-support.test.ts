import { describe, expect, it } from "vitest";
import { institutionalLifeSupportRouter } from "./institutional-life-support";

describe("Institutional Life Support institutional delivery contract", () => {
  const procedures = Object.keys(
    institutionalLifeSupportRouter._def.procedures
  );

  it("exposes institution-paid cohort ordering", () => {
    expect(procedures).toEqual(
      expect.arrayContaining([
        "getInstitutionRoster",
        "getInstitutionOrders",
        "createInstitutionOrder",
        "cancelPendingEnrollment",
      ])
    );
  });

  it("does not expose personal base-course purchase procedures", () => {
    expect(procedures).not.toContain("enroll");
    expect(procedures).not.toContain("initiateEnrollmentPayment");
  });
});
