import { conflictKey, classifyConflict, enrichEvidenceOntology } from "./professional-evidence-ontology";

export type SourceReconciliation = { source: string; adapterStatus?: "covered" | "not_projected"; sourceRecords: number; ledgerRecords: number; missing: number; duplicates: number; conflicts: number; provenanceGaps: number };

export function reconcileSourceRows(source: string, sourceRows: Array<{ sourceRecordId: string | number; userId: number }>, ledgerRows: Array<{ sourceRecordId: string; userId: number }>): SourceReconciliation {
  const sourceKeys = sourceRows.map(row => `${row.userId}:${row.sourceRecordId}`);
  const ledgerKeys = ledgerRows.map(row => `${row.userId}:${row.sourceRecordId}`);
  const sourceSet = new Set(sourceKeys);
  const ledgerSet = new Set(ledgerKeys);
  const duplicates = sourceKeys.length - sourceSet.size;
  return { source, adapterStatus: "covered", sourceRecords: sourceRows.length, ledgerRecords: ledgerRows.filter(row => sourceSet.has(`${row.userId}:${row.sourceRecordId}`)).length, missing: [...sourceSet].filter(key => !ledgerSet.has(key)).length, duplicates, conflicts: 0, provenanceGaps: 0 };
}

export function notProjectedSource(source: string, sourceRecords: number): SourceReconciliation {
  return { source, adapterStatus: "not_projected", sourceRecords, ledgerRecords: 0, missing: sourceRecords, duplicates: 0, conflicts: 0, provenanceGaps: sourceRecords };
}

export function buildTruthAuditSummary(input: { sources: SourceReconciliation[]; ledgerRows: any[]; conflicts: any[]; reports: { superseded: number; activePublic: number }; }) {
  const enriched = input.ledgerRows.map(enrichEvidenceOntology);
  return {
    ontologyVersion: "0173-v1",
    generatedAt: new Date().toISOString(),
    sourceCoverage: input.sources,
    totals: {
      sourceRecords: input.sources.reduce((n, row) => n + row.sourceRecords, 0),
      ledgerRecords: enriched.length,
      unprojectedRecords: input.sources.reduce((n, row) => n + row.missing, 0),
      duplicateRecords: input.sources.reduce((n, row) => n + row.duplicates, 0),
      conflictingRecords: input.conflicts.filter(row => row.state.startsWith("conflict")).length,
      expiredEvidence: enriched.filter(row => row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()).length,
      missingProvenance: enriched.filter(row => !row.sourceSystem || !row.sourceRecordType || !row.sourceRecordId || !row.sourceFactJson).length,
      unverifiedCompetence: enriched.filter(row => row.evidenceType === "competence" && row.authorityLevel !== "authorised_assessor").length,
      supersededReports: input.reports.superseded,
      activePublicReports: input.reports.activePublic,
    },
    conflicts: input.conflicts,
  };
}

export function detectConflicts(rows: Array<{ userId: number; evidenceType: string; programme?: string | null; competencyDomain?: string | null; status?: string | null; expiresAt?: string | Date | null; sourceSystem?: string | null; evidenceStrength?: string | null; verificationMethod?: string | null }>) {
  const grouped = new Map<string, typeof rows>();
  for (const row of rows) { const key = conflictKey(row); const bucket = grouped.get(key) ?? []; bucket.push(row); grouped.set(key, bucket); }
  return [...grouped.entries()].flatMap(([key, bucket]) => {
    if (bucket.length < 2) return [];
    const result = classifyConflict(bucket);
    if (result.state === "consistent") return [];
    return [{ conflictKey: key, userId: bucket[0].userId, evidenceType: bucket[0].evidenceType, subject: bucket[0].programme ?? bucket[0].competencyDomain ?? bucket[0].evidenceType, state: result.state, reason: result.reason, sourceRows: bucket }];
  });
}

export const INTEGRITY_INVARIANTS = [
  "learning_complete_never_creates_observed_competence",
  "expired_validity_overrides_current_status",
  "assessor_authority_is_required_for_observed_competence",
  "material_correction_supersedes_active_report",
  "public_verification_is_minimum_disclosure",
  "activity_report_excludes_out_of_period_evidence",
  "unattributed_course_remains_individual_unlinked",
] as const;
