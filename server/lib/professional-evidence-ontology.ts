export const PROFESSIONAL_EVIDENCE_ONTOLOGY_VERSION = "0173-v1";
export const EVIDENCE_TYPES = ["learning", "assessment", "credential", "competence", "cpd", "pathway"] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const EVIDENCE_STRENGTH = [
  "self_reported",
  "developing",
  "recorded",
  "verified_attendance",
  "verified_external",
  "assessed",
  "credential",
  "observed_competence",
] as const;
export type EvidenceStrength = (typeof EVIDENCE_STRENGTH)[number];

export const AUTHORITY_LEVELS = ["self_reported", "administrator_record", "programme_record", "issuing_body", "authorised_assessor"] as const;
export type AuthorityLevel = (typeof AUTHORITY_LEVELS)[number];

export const VERIFICATION_METHODS = ["none", "admin_review", "cpd_attendance", "platform_verification", "approved_instructor", "authorised_assessor", "issuing_body"] as const;

export const VISIBILITY_VALUES = ["private", "shareable"] as const;

export function validateProfessionalEvidenceRow(row: {
  userId?: number | null;
  sourceKey?: string | null;
  sourceSystem?: string | null;
  sourceRecordType?: string | null;
  sourceRecordId?: string | null;
  evidenceInstanceKey?: string | null;
  evidenceType?: string | null;
  evidenceStrength?: string | null;
  visibility?: string | null;
  interpretation?: string | null;
  interpretationVersion?: string | null;
  sourceFactJson?: string | null;
  verificationMethod?: string | null;
}) {
  const errors: string[] = [];
  for (const field of ["sourceKey", "sourceSystem", "sourceRecordType", "sourceRecordId", "evidenceInstanceKey", "evidenceType", "evidenceStrength", "visibility", "interpretation", "interpretationVersion", "sourceFactJson"] as const) if (!row[field]) errors.push(field);
  if (row.evidenceType && !(EVIDENCE_TYPES as readonly string[]).includes(row.evidenceType)) errors.push("evidenceType:value");
  if (row.evidenceStrength && !(EVIDENCE_STRENGTH as readonly string[]).includes(row.evidenceStrength)) errors.push("evidenceStrength:value");
  if (row.visibility && !(VISIBILITY_VALUES as readonly string[]).includes(row.visibility)) errors.push("visibility:value");
  if (row.verificationMethod && !(VERIFICATION_METHODS as readonly string[]).includes(row.verificationMethod)) errors.push("verificationMethod:value");
  if (row.interpretationVersion && row.interpretationVersion !== PROFESSIONAL_EVIDENCE_ONTOLOGY_VERSION) errors.push("interpretationVersion:value");
  return errors;
}

const STRENGTH_RANK: Record<string, number> = {
  self_reported: 10,
  developing: 15,
  recorded: 20,
  verified_attendance: 30,
  verified_external: 40,
  assessed: 50,
  credential: 60,
  observed_competence: 70,
};
const AUTHORITY_RANK: Record<string, number> = {
  self_reported: 10,
  administrator_record: 20,
  programme_record: 30,
  issuing_body: 40,
  authorised_assessor: 50,
};

export function evidenceStrengthRank(value: string | null | undefined) { return STRENGTH_RANK[value ?? ""] ?? 0; }
export function authorityRank(value: string | null | undefined) { return AUTHORITY_RANK[value ?? ""] ?? 0; }

export function authorityForEvidence(row: { sourceSystem?: string | null; evidenceStrength?: string | null; verificationMethod?: string | null }): AuthorityLevel {
  if (row.verificationMethod === "authorised_assessor" || row.evidenceStrength === "observed_competence") return "authorised_assessor";
  if (row.verificationMethod === "issuing_body" || row.verificationMethod === "platform_verification" || row.evidenceStrength === "credential") return "issuing_body";
  if (row.sourceSystem === "aha_learning" || row.sourceSystem === "fellowship" || row.sourceSystem === "cpd_portal") return "programme_record";
  if (row.verificationMethod === "admin_review" || row.verificationMethod === "approved_instructor") return "administrator_record";
  return "self_reported";
}

export function validityRule(row: { evidenceType?: string | null; expiresAt?: string | Date | null }) {
  if (row.evidenceType === "competence" || row.evidenceType === "credential") return row.expiresAt ? "valid_until_date" : "no_expiry_recorded";
  return "not_applicable";
}

export function conflictKey(row: { userId: number; programme?: string | null; competencyDomain?: string | null; evidenceType: string; evidenceInstanceKey?: string | null }) {
  const subject = `${row.userId}:${row.evidenceType}:${row.programme ?? row.competencyDomain ?? "unspecified"}`;
  return `${subject}${row.evidenceInstanceKey ? `:instance:${row.evidenceInstanceKey}` : ""}`.toLowerCase();
}

export function classifyConflict(rows: Array<{ status?: string | null; expiresAt?: string | Date | null; sourceSystem?: string | null; evidenceStrength?: string | null; verificationMethod?: string | null }>) {
  const normalized = rows.map(row => ({ ...row, authority: authorityForEvidence(row), authorityRank: authorityRank(authorityForEvidence(row)), strengthRank: evidenceStrengthRank(row.evidenceStrength) }));
  const statuses = new Set(normalized.map(row => row.status));
  const dates = new Set(normalized.map(row => row.expiresAt ? new Date(row.expiresAt).toISOString().slice(0, 10) : null));
  const conflict = statuses.size > 1 || dates.size > 1;
  if (!conflict) return { state: "consistent" as const, reason: null, winningAuthority: normalized[0]?.authority ?? null };
  const top = [...normalized].sort((a, b) => b.authorityRank - a.authorityRank || b.strengthRank - a.strengthRank);
  const sameTop = top.filter(row => row.authorityRank === top[0]?.authorityRank && row.strengthRank === top[0]?.strengthRank);
  return {
    state: sameTop.length > 1 ? "conflict" as const : "conflict_requires_review" as const,
    reason: `Sources disagree on status or validity date; no source is silently selected. Highest authority: ${top[0]?.authority ?? "unknown"}.`,
    winningAuthority: top[0]?.authority ?? null,
  };
}

export function enrichEvidenceOntology<T extends Record<string, any>>(row: T) {
  const authority = authorityForEvidence(row);
  return { ...row, authorityLevel: authority, authorityRank: authorityRank(authority), evidenceStrengthRank: evidenceStrengthRank(row.evidenceStrength), validityRule: validityRule(row), ontologyVersion: PROFESSIONAL_EVIDENCE_ONTOLOGY_VERSION };
}
