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
        "cancelInstitutionOrder",
        "cancelPendingEnrollment",
        "createDeliverySession",
        "confirmDeliverySession",
        "replaceInstitutionProvider",
        "recordPracticalAssessment",
        "listOperationalCases",
        "createOperationalCase",
        "listPilotCohorts",
        "recordPilotMetrics",
        "getInstitutionIlsMetrics",
        "listAssignableInstructors",
        "listPilotMetrics",
      ])
    );
  });

  it("requires a clinical owner and start date for pilot governance", () => {
    const inputParser = (
      institutionalLifeSupportRouter._def.procedures.createPilotCohort as any
    )._def.inputs[0];
    const result = inputParser.safeParse({
      institutionId: 1,
      segment: "training_provider",
      name: "Pilot",
      targetProviderCount: 10,
      minimumProviderCount: 5,
    });

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.map((issue: { path: (string | number)[] }) =>
        issue.path.join(".")
      )
    ).toEqual(
      expect.arrayContaining(["targetStartDate", "clinicalOwnerUserId"])
    );
  });

  it("does not expose personal base-course purchase procedures", () => {
    expect(procedures).not.toContain("enroll");
    expect(procedures).not.toContain("initiateEnrollmentPayment");
  });

  it("requires final roster confirmation before an institution order can start payment", () => {
    const inputParser = (
      institutionalLifeSupportRouter._def.procedures
        .createInstitutionOrder as any
    )._def.inputs[0];
    const result = inputParser.safeParse({
      institutionId: 1,
      staffMemberIds: [10],
      trainingDate: new Date("2026-12-01T00:00:00Z"),
      deliverySessionId: 20,
      claimsAcknowledged: true,
      phoneNumber: "0712345678",
    });

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some(
        (issue: { path: (string | number)[] }) =>
          issue.path.join(".") === "rosterConfirmed"
      )
    ).toBe(true);
  });
});
