import { describe, expect, it } from "vitest";
import { getInstitutionAdministrationAttention } from "./institution-administration";

describe("institution administration attention", () => {
  it("returns no blockers for a clean institution", () => {
    expect(
      getInstitutionAdministrationAttention({
        pendingLinkRequests: 0,
        departmentMismatches: 0,
        missingDepartments: 0,
        productIssues: 0,
        ilsOrdersNeedingAttention: 0,
      })
    ).toEqual([]);
  });

  it("orders people, billing, and programme actions predictably", () => {
    expect(
      getInstitutionAdministrationAttention({
        pendingLinkRequests: 2,
        departmentMismatches: 1,
        missingDepartments: 3,
        productIssues: 1,
        ilsOrdersNeedingAttention: 2,
      })
    ).toEqual([
      {
        label: "2 staff link requests pending",
        detail:
          "Review identity and institution-link requests before assigning work.",
        lane: "institution",
      },
      {
        label: "1 department reconciliation item open",
        detail:
          "Resolve department mismatches before relying on department-level CPD or readiness reporting.",
        lane: "institution",
      },
      {
        label: "3 roster members missing a department",
        detail:
          "Complete the shared roster so Learning and Readiness records remain attributable.",
        lane: "institution",
      },
      {
        label: "1 product access item needs review",
        detail:
          "Review renewal, past-due, expiry, or suspended access without deleting historical evidence.",
        lane: "billing",
      },
      {
        label: "2 ILS orders need attention",
        detail:
          "Review roster, readiness, payment, or delivery state in the separate ILS operating lane.",
        lane: "program_operations",
      },
    ]);
  });

  it("uses singular labels for one item", () => {
    const [item] = getInstitutionAdministrationAttention({
      pendingLinkRequests: 1,
      departmentMismatches: 0,
      missingDepartments: 0,
      productIssues: 0,
      ilsOrdersNeedingAttention: 0,
    });
    expect(item?.label).toBe("1 staff link request pending");
    expect(item?.lane).toBe("institution");
  });
});
