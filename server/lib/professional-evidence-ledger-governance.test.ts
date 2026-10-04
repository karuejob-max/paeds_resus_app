import { describe, expect, it } from "vitest";
import { effectiveCompetenceStatus, evidenceRowsFromSnapshot, goalComputedStatus, readinessBottleneck, selectEvidenceForReport } from "./professional-evidence-ledger";

describe("professional evidence governance", () => {
  it("keeps January evidence out of an October activity projection", () => {
    const rows = [
      { sourceKey: "jan", completedAt: "2026-01-15" },
      { sourceKey: "oct", completedAt: "2026-10-15" },
    ];
    expect(selectEvidenceForReport(rows, "activity", "2026-10-01", "2026-10-31").map(row => row.sourceKey)).toEqual(["oct"]);
  });

  it("calculates competence as expired from immutable validity dates", () => {
    expect(effectiveCompetenceStatus({ result: "competent", status: "current", validUntil: "2026-09-30" }, new Date("2026-10-04T00:00:00Z"))).toBe("expired");
    expect(effectiveCompetenceStatus({ result: "competent", validUntil: "2026-12-31" }, new Date("2026-10-04T00:00:00Z"))).toBe("current");
  });

  it("prioritizes the practical assessment as the readiness bottleneck", () => {
    const bottleneck = readinessBottleneck({ lifeSupport: [{ program: "ACLS", enrollmentId: 4, percentage: 100, cognitiveComplete: true, practicalComplete: false, status: "active" }], pathways: [], certificates: [], competenceEvidence: [] });
    expect(bottleneck.kind).toBe("practical_outstanding");
    expect(bottleneck.label).toContain("ACLS practical assessment outstanding");
  });

  it("computes goal feedback states", () => {
    expect(goalComputedStatus(20, 14, "2026-12-31", new Date("2026-10-04T00:00:00Z"))).toBe("active");
    expect(goalComputedStatus(20, 20, "2026-12-31", new Date("2026-10-04T00:00:00Z"))).toBe("achieved");
    expect(goalComputedStatus(20, 2, "2026-10-10", new Date("2026-10-04T00:00:00Z"))).toBe("at_risk");
    expect(goalComputedStatus(20, 2, "2026-09-30", new Date("2026-10-04T00:00:00Z"))).toBe("expired");
  });

  it("preserves source facts separately from interpretation", () => {
    const [row] = evidenceRowsFromSnapshot({ lifeSupport: [{ enrollmentId: 7, program: "BLS", percentage: 100, practicalComplete: false, cognitiveComplete: true, status: "active", updatedAt: "2026-10-01" }], externalCompletions: [], coursework: [], certificates: [], cpd: { sessions: [] } }, 9);
    expect(JSON.parse(row.sourceFactJson ?? "{}").cognitiveModulesComplete).toBe(true);
    expect(row.interpretation).toBe("learning_status");
    expect(row.interpretationVersion).toBe("0171-v1");
  });
});
