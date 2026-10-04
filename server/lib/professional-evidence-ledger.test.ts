import { describe, expect, it } from "vitest";
import { evidenceRowsFromSnapshot, nextBestProfessionalAction } from "./professional-evidence-ledger";

describe("professional evidence ledger", () => {
  it("keeps source identity user-scoped and preserves evidence strength", () => {
    const rows = evidenceRowsFromSnapshot({
      lifeSupport: [{ enrollmentId: 12, program: "BLS", percentage: 100, practicalComplete: false, status: "active", updatedAt: "2026-10-01", phase: "Phase 1" }],
      externalCompletions: [], coursework: [], certificates: [], cpd: { sessions: [] },
    }, 42);
    expect(rows[0].sourceKey).toBe("user:42:aha-enrollment:12");
    expect(rows[0].status).toBe("learning_complete");
    expect(rows[0].evidenceStrength).toBe("recorded");
  });

  it("prioritizes an unfinished clinical learning action", () => {
    const action = nextBestProfessionalAction({
      lifeSupport: [{ nextAction: { label: "Complete BLS cognitive", destination: "/training/bls" } }],
      pathways: [], coursework: [],
    });
    expect(action.label).toBe("Complete BLS cognitive");
    expect(action.destination).toBe("/training/bls");
  });

  it("does not invent a competence claim when only a certificate exists", () => {
    const rows = evidenceRowsFromSnapshot({
      lifeSupport: [], externalCompletions: [], coursework: [],
      certificates: [{ id: 5, programType: "bls", issueDate: "2026-10-01", expiryDate: "2027-10-01", verificationCode: "PPR-1" }],
      cpd: { sessions: [] },
    }, 7);
    expect(rows[0].evidenceType).toBe("credential");
    expect(rows[0].evidenceStrength).toBe("credential");
    expect(rows[0].status).toBe("issued");
  });
});
