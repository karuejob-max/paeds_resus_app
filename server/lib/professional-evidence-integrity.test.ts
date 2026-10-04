import { describe, expect, it } from "vitest";
import { authorityForEvidence, classifyConflict, enrichEvidenceOntology } from "./professional-evidence-ontology";
import { buildTruthAuditSummary, detectConflicts, reconcileSourceRows } from "./professional-evidence-integrity";
import { effectiveCompetenceStatus, selectEvidenceForReport } from "./professional-evidence-ledger";

const learningOnly = { userId: 1, evidenceType: "learning", programme: "BLS", status: "learning_complete", evidenceStrength: "recorded", sourceSystem: "aha_learning", sourceRecordType: "enrollments", sourceRecordId: "7", sourceFactJson: "{}" };

describe("Professional Truth invariants", () => {
  it("never treats 100% learning as observed competence", () => {
    expect(learningOnly.evidenceType).not.toBe("competence");
    expect(learningOnly.evidenceStrength).not.toBe("observed_competence");
  });
  it("forces expired validity to win over stored current status", () => {
    expect(effectiveCompetenceStatus({ result: "competent", status: "current", validUntil: "2026-08-01" }, new Date("2026-10-04"))).toBe("expired");
  });
  it("maps authority objectively rather than by the word strong", () => {
    expect(authorityForEvidence({ sourceSystem: "certificates", evidenceStrength: "credential", verificationMethod: "platform_verification" })).toBe("issuing_body");
    expect(authorityForEvidence({ sourceSystem: "unknown", evidenceStrength: "recorded", verificationMethod: null })).toBe("self_reported");
    expect(enrichEvidenceOntology(learningOnly).ontologyVersion).toBe("0173-v1");
  });
  it("returns conflict rather than silently choosing contradictory sources", () => {
    const result = classifyConflict([
      { status: "current", expiresAt: "2027-08-01", sourceSystem: "aha_learning", evidenceStrength: "credential", verificationMethod: "platform_verification" },
      { status: "expired", expiresAt: "2026-08-01", sourceSystem: "external_verification", evidenceStrength: "verified_external", verificationMethod: "admin_review" },
    ]);
    expect(result.state).toMatch(/^conflict/);
    expect(result.reason).toContain("no source is silently selected");
  });
  it("detects conflicts per person and professional subject", () => {
    const conflicts = detectConflicts([
      { userId: 3, evidenceType: "credential", programme: "ACLS", status: "issued", expiresAt: "2027-01-01", sourceSystem: "certificates", evidenceStrength: "credential" },
      { userId: 3, evidenceType: "credential", programme: "ACLS", status: "issued", expiresAt: "2026-01-01", sourceSystem: "external_verification", evidenceStrength: "verified_external" },
    ]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].state).toMatch(/^conflict/);
  });
  it("proves missing source records and duplicate source identities", () => {
    const result = reconcileSourceRows("AHA", [{ userId: 1, sourceRecordId: 7 }, { userId: 1, sourceRecordId: 7 }, { userId: 2, sourceRecordId: 8 }], [{ userId: 1, sourceRecordId: "7", sourceSystem: "aha_learning", sourceRecordType: "enrollments" }], { sourceSystem: "aha_learning", sourceRecordType: "enrollments" });
    expect(result.duplicates).toBe(1);
    expect(result.missing).toBe(1);
    expect(result.complete).toBe(false);
  });
  it("detects duplicate canonical rows and wrong source ownership/type", () => {
    const result = reconcileSourceRows("Certificates", [{ userId: 7, sourceRecordId: 123 }], [
      { userId: 7, sourceRecordId: "123", sourceSystem: "external_completion", sourceRecordType: "wrong" },
      { userId: 7, sourceRecordId: "123", sourceSystem: "external_completion", sourceRecordType: "wrong" },
    ], { sourceSystem: "certificates", sourceRecordType: "certificates" });
    expect(result.ledgerDuplicates).toBe(1);
    expect(result.wrongSourceSystem).toBe(2);
    expect(result.wrongSourceType).toBe(2);
    expect(result.complete).toBe(false);
  });
  it("keeps activity reports inside the requested period", () => {
    expect(selectEvidenceForReport([{ sourceKey: "old", completedAt: "2026-01-01" }, { sourceKey: "new", completedAt: "2026-10-02" }], "activity", "2026-10-01", "2026-10-31").map(row => row.sourceKey)).toEqual(["new"]);
  });
  it("makes not-projected sources visible in the truth summary", () => {
    const summary = buildTruthAuditSummary({ sources: [{ source: "IERP", adapterStatus: "not_projected", sourceRecords: 4, ledgerRecords: 0, missing: 4, duplicates: 0, ledgerDuplicates: 0, wrongSourceSystem: 0, wrongSourceType: 0, wrongUserOwnership: 0, conflicts: 0, provenanceGaps: 4, complete: false }], ledgerRows: [], conflicts: [], reports: { superseded: 1, activePublic: 2 } });
    expect(summary.totals.unprojectedRecords).toBe(4);
    expect(summary.sourceCoverage[0].adapterStatus).toBe("not_projected");
    expect(summary.integrityStatus).toBe("review_required");
  });
});
