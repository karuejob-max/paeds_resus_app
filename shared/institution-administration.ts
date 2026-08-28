export type InstitutionAdministrationLane =
  | "institution"
  | "billing"
  | "program_operations";

export type InstitutionAdministrationCounts = {
  pendingLinkRequests: number;
  departmentMismatches: number;
  missingDepartments: number;
  productIssues: number;
  ilsOrdersNeedingAttention: number;
};

export type InstitutionAdministrationAttention = {
  label: string;
  detail: string;
  lane: InstitutionAdministrationLane;
};

export function getInstitutionAdministrationAttention(
  counts: InstitutionAdministrationCounts
): InstitutionAdministrationAttention[] {
  return [
    counts.pendingLinkRequests > 0
      ? {
          label: `${counts.pendingLinkRequests} staff link request${counts.pendingLinkRequests === 1 ? "" : "s"} pending`,
          detail:
            "Review identity and institution-link requests before assigning work.",
          lane: "institution",
        }
      : null,
    counts.departmentMismatches > 0
      ? {
          label: `${counts.departmentMismatches} department reconciliation item${counts.departmentMismatches === 1 ? "" : "s"} open`,
          detail:
            "Resolve department mismatches before relying on department-level CPD or readiness reporting.",
          lane: "institution",
        }
      : null,
    counts.missingDepartments > 0
      ? {
          label: `${counts.missingDepartments} roster member${counts.missingDepartments === 1 ? "" : "s"} missing a department`,
          detail:
            "Complete the shared roster so Learning and Readiness records remain attributable.",
          lane: "institution",
        }
      : null,
    counts.productIssues > 0
      ? {
          label: `${counts.productIssues} product access item${counts.productIssues === 1 ? "" : "s"} ${counts.productIssues === 1 ? "needs" : "need"} review`,
          detail:
            "Review renewal, past-due, expiry, or suspended access without deleting historical evidence.",
          lane: "billing",
        }
      : null,
    counts.ilsOrdersNeedingAttention > 0
      ? {
          label: `${counts.ilsOrdersNeedingAttention} ILS order${counts.ilsOrdersNeedingAttention === 1 ? "" : "s"} ${counts.ilsOrdersNeedingAttention === 1 ? "needs" : "need"} attention`,
          detail:
            "Review roster, readiness, payment, or delivery state in the separate ILS operating lane.",
          lane: "program_operations",
        }
      : null,
  ].filter((item): item is InstitutionAdministrationAttention => item !== null);
}
