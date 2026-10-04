import { conflictKey, classifyConflict, enrichEvidenceOntology } from "./professional-evidence-ontology";

export type EvidenceIdentity = {
  sourceRecordId: string | number;
  userId: number;
  sourceSystem?: string | null;
  sourceRecordType?: string | null;
};

export type SourceReconciliation = {
  source: string;
  adapterStatus: "covered" | "not_projected";
  sourceRecords: number;
  ledgerRecords: number;
  missing: number;
  duplicates: number;
  ledgerDuplicates: number;
  wrongSourceSystem: number;
  wrongSourceType: number;
  wrongUserOwnership: number;
  conflicts: number;
  provenanceGaps: number;
  complete: boolean;
};

function identity(row: EvidenceIdentity) {
  return `${row.userId}:${String(row.sourceRecordId)}`;
}

export function reconcileSourceRows(
  source: string,
  sourceRows: EvidenceIdentity[],
  ledgerRows: EvidenceIdentity[],
  expected?: { sourceSystem: string; sourceRecordType: string },
): SourceReconciliation {
  const sourceKeys = sourceRows.map(identity);
  const ledgerKeys = ledgerRows.map(identity);
  const sourceCounts = new Map<string, number>();
  const ledgerCounts = new Map<string, number>();
  for (const key of sourceKeys) sourceCounts.set(key, (sourceCounts.get(key) ?? 0) + 1);
  for (const key of ledgerKeys) ledgerCounts.set(key, (ledgerCounts.get(key) ?? 0) + 1);
  const sourceSet = new Set(sourceKeys);
  const matchedLedgerRows = ledgerRows.filter(row => sourceSet.has(identity(row)));
  const sourceRecordIds = new Set(sourceRows.map(row => String(row.sourceRecordId)));
  const ledgerDuplicates = [...ledgerCounts.values()].reduce((n, count) => n + Math.max(0, count - 1), 0);
  const wrongSourceSystem = expected
    ? matchedLedgerRows.filter(row => row.sourceSystem !== expected.sourceSystem).length
    : 0;
  const wrongSourceType = expected
    ? matchedLedgerRows.filter(row => row.sourceRecordType !== expected.sourceRecordType).length
    : 0;
  const wrongUserOwnership = ledgerRows.filter(row => sourceRecordIds.has(String(row.sourceRecordId)) && !sourceSet.has(identity(row))).length;
  const duplicates = [...sourceCounts.values()].reduce((n, count) => n + Math.max(0, count - 1), 0);
  const missing = [...sourceSet].filter(key => !ledgerCounts.has(key)).length;
  return {
    source,
    adapterStatus: "covered",
    sourceRecords: sourceRows.length,
    ledgerRecords: matchedLedgerRows.length,
    missing,
    duplicates,
    ledgerDuplicates,
    wrongSourceSystem,
    wrongSourceType,
    wrongUserOwnership,
    conflicts: 0,
    provenanceGaps: matchedLedgerRows.filter(row => !row.sourceSystem || !row.sourceRecordType || !row.sourceRecordId).length,
    complete: missing === 0 && duplicates === 0 && ledgerDuplicates === 0 && wrongSourceSystem === 0 && wrongSourceType === 0 && wrongUserOwnership === 0,
  };
}

export function notProjectedSource(source: string, sourceRecords: number): SourceReconciliation {
  return {
    source,
    adapterStatus: "not_projected",
    sourceRecords,
    ledgerRecords: 0,
    missing: sourceRecords,
    duplicates: 0,
    ledgerDuplicates: 0,
    wrongSourceSystem: 0,
    wrongSourceType: 0,
    wrongUserOwnership: 0,
    conflicts: 0,
    provenanceGaps: sourceRecords,
    complete: false,
  };
}

export function buildTruthAuditSummary(input: {
  sources: SourceReconciliation[];
  ledgerRows: any[];
  conflicts: any[];
  reports: { superseded: number; activePublic: number };
}) {
  const enriched = input.ledgerRows.map(enrichEvidenceOntology);
  const openConflicts = input.conflicts.filter(row => String(row.state).startsWith("conflict") || row.state === "open");
  return {
    ontologyVersion: "0173-v1",
    generatedAt: new Date().toISOString(),
    sourceCoverage: input.sources,
    totals: {
      sourceRecords: input.sources.reduce((n, row) => n + row.sourceRecords, 0),
      ledgerRecords: enriched.length,
      unprojectedRecords: input.sources.reduce((n, row) => n + row.missing, 0),
      duplicateRecords: input.sources.reduce((n, row) => n + row.duplicates + row.ledgerDuplicates, 0),
      ownershipIntegrityFailures: input.sources.reduce((n, row) => n + row.wrongSourceSystem + row.wrongSourceType + row.wrongUserOwnership, 0),
      incompleteAdapters: input.sources.filter(row => row.adapterStatus !== "covered").length,
      conflictingRecords: openConflicts.length,
      expiredEvidence: enriched.filter(row => row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()).length,
      missingProvenance: enriched.filter(row => !row.sourceSystem || !row.sourceRecordType || !row.sourceRecordId || !row.sourceFactJson || !row.interpretationVersion).length,
      unverifiedCompetence: enriched.filter(row => row.evidenceType === "competence" && row.authorityLevel !== "authorised_assessor").length,
      supersededReports: input.reports.superseded,
      activePublicReports: input.reports.activePublic,
    },
    integrityStatus: input.sources.every(row => row.complete) && openConflicts.length === 0 ? "complete" : "review_required",
    conflicts: input.conflicts,
  };
}

export function detectConflicts(rows: Array<{
  userId: number;
  evidenceType: string;
  programme?: string | null;
  competencyDomain?: string | null;
  status?: string | null;
  expiresAt?: string | Date | null;
  sourceSystem?: string | null;
  evidenceStrength?: string | null;
  verificationMethod?: string | null;
}>) {
  const grouped = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = conflictKey(row);
    const bucket = grouped.get(key) ?? [];
    bucket.push(row);
    grouped.set(key, bucket);
  }
  return [...grouped.entries()].flatMap(([key, bucket]) => {
    if (bucket.length < 2) return [];
    const result = classifyConflict(bucket);
    if (result.state === "consistent") return [];
    return [{
      conflictKey: key,
      userId: bucket[0].userId,
      evidenceType: bucket[0].evidenceType,
      subject: bucket[0].programme ?? bucket[0].competencyDomain ?? bucket[0].evidenceType,
      state: result.state,
      reason: result.reason,
      sourceRows: bucket,
    }];
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
  "one_source_identity_maps_to_exactly_one_ledger_identity",
  "all_covered_sources_are_reconciled_bidirectionally",
  "cross_source_disagreement_is_explicit_conflict",
  "read_only_audit_has_no_database_side_effects",
] as const;
