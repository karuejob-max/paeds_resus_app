import { validateProfessionalEvidenceRow } from "./professional-evidence-ontology";

export type EvidenceProjection = {
  sourceKey: string;
  evidenceType: string;
  title: string;
  programme: string | null;
  sourceSystem: string;
  sourceRecordType: string;
  sourceRecordId: string;
  evidenceInstanceKey: string;
  status: string;
  evidenceStrength: string;
  verificationMethod: string | null;
  completedAt?: string | Date | null;
  issuedAt?: string | Date | null;
  expiresAt?: string | Date | null;
  evidenceReference?: string | null;
  visibility: string;
  metadataJson: string;
  sourceFactJson?: string | null;
  interpretation?: string | null;
  interpretationVersion?: string | null;
};

function json(value: unknown) { return JSON.stringify(value); }
function dateOnly(value: unknown) { return value ? new Date(value as any).toISOString().slice(0, 10) : null; }

export function effectiveCompetenceStatus(item: { result?: string; status?: string; validUntil?: string | Date | null }, now = new Date()) {
  const result = item.result ?? item.status;
  if (result === "requires_support" || result === "support_required") return "support_required";
  if (result === "not_yet_competent") return "not_yet_competent";
  if (item.validUntil && new Date(item.validUntil).getTime() < now.getTime()) return "expired";
  return result === "competent" || result === "current" ? "current" : String(result ?? "recorded");
}

function row(source: Omit<EvidenceProjection, "metadataJson"> & { sourceFacts: unknown; interpretation: string }): EvidenceProjection {
  const result = { ...source, metadataJson: json(source.sourceFacts), sourceFactJson: json(source.sourceFacts), interpretation: source.interpretation, interpretationVersion: "0173-v1" };
  const errors = validateProfessionalEvidenceRow(result);
  if (errors.length) throw new Error(`Invalid professional evidence projection: ${errors.join(", ")}`);
  return result;
}

export function evidenceRowsFromSnapshot(snapshot: any, userId: number): EvidenceProjection[] {
  const rows: EvidenceProjection[] = [];
  for (const item of snapshot.lifeSupport ?? []) {
    const completed = Number(item.percentage ?? 0) >= 100;
    const sourceFacts = { cognitiveModulesComplete: Boolean(item.cognitiveComplete), practicalSkillsSignedOff: Boolean(item.practicalComplete), progressPercentage: Number(item.percentage ?? 0), enrollmentStatus: item.status, updatedAt: item.updatedAt };
    rows.push(row({ sourceKey: `user:${userId}:aha-enrollment:${item.enrollmentId}`, evidenceType: "learning", title: `${item.program} Life Support learning`, programme: item.program, sourceSystem: "aha_learning", sourceRecordType: "enrollments", sourceRecordId: String(item.enrollmentId), evidenceInstanceKey: `aha:enrollment:${item.enrollmentId}`, status: item.status === "cancelled" ? "cancelled" : completed ? "learning_complete" : Number(item.percentage ?? 0) > 0 ? "learning_in_progress" : "enrolled_not_started", evidenceStrength: completed && item.practicalComplete ? "assessed" : completed ? "recorded" : "developing", verificationMethod: item.practicalComplete ? "approved_instructor" : null, completedAt: completed ? item.updatedAt : null, issuedAt: null, expiresAt: null, evidenceReference: null, visibility: "private", sourceFacts, interpretation: "learning_status" }));
  }
  for (const item of snapshot.externalCompletions ?? []) { const id = String(item.id ?? item.sourceRecordId ?? `${item.program}:${item.source}`); rows.push(row({ sourceKey: `user:${userId}:external-completion:${id}:phase2`, evidenceType: "credential", title: `${item.program} external completion`, programme: item.program, sourceSystem: "external_completion", sourceRecordType: "externalTrainingCompletions.phase2", sourceRecordId: `${id}:phase2`, evidenceInstanceKey: `external:completion:${id}:phase2`, status: item.status, evidenceStrength: "verified_external", verificationMethod: "admin_review", completedAt: item.updatedAt, issuedAt: null, expiresAt: null, evidenceReference: null, visibility: "shareable", sourceFacts: { pathway: item.pathway, phase2Completed: item.phase2Completed, phase3Completed: item.phase3Completed, recordedAt: item.updatedAt }, interpretation: "external_completion" })); }
  for (const item of snapshot.coursework ?? []) rows.push(row({ sourceKey: `user:${userId}:micro-course:${item.courseId}`, evidenceType: "learning", title: item.title, programme: "Paeds Resus Fellowship", sourceSystem: "fellowship", sourceRecordType: "microCourseEnrollments", sourceRecordId: String(item.courseId), evidenceInstanceKey: `fellowship:microcourse:${item.courseId}`, status: item.status === "completed" ? "learning_complete" : Number(item.percentage ?? 0) > 0 ? "learning_in_progress" : "enrolled_not_started", evidenceStrength: item.status === "completed" ? "recorded" : "developing", verificationMethod: null, completedAt: item.completedAt, issuedAt: null, expiresAt: null, evidenceReference: null, visibility: "private", sourceFacts: { enrollmentStatus: item.status, progressPercentage: Number(item.percentage ?? 0), completedAt: item.completedAt, updatedAt: item.updatedAt }, interpretation: "learning_status" }));
  for (const item of snapshot.certificates ?? []) { const id = String(item.id ?? item.certificateNumber ?? item.verificationCode); const instance = `certificate:${item.certificateNumber ?? id}`; rows.push(row({ sourceKey: `user:${userId}:certificate:${id}`, evidenceType: "credential", title: `${String(item.programType).toUpperCase()} certificate`, programme: item.programType, sourceSystem: "certificates", sourceRecordType: "certificates", sourceRecordId: id, evidenceInstanceKey: instance, status: "issued", evidenceStrength: "credential", verificationMethod: item.verificationCode ? "platform_verification" : null, completedAt: item.issueDate, issuedAt: item.issueDate, expiresAt: item.expiryDate ?? null, evidenceReference: item.verificationCode ?? null, visibility: "shareable", sourceFacts: { certificateNumber: item.certificateNumber, issueDate: item.issueDate, expiryDate: item.expiryDate, verificationCodePresent: Boolean(item.verificationCode) }, interpretation: "credential_issued" })); }
  for (const item of snapshot.cpd?.sessions ?? []) { const id = String(item.attendeeId ?? item.eventId ?? `${item.title}:${item.date}`); rows.push(row({ sourceKey: `user:${userId}:cpd:${id}`, evidenceType: "cpd", title: item.title, programme: "CPD", sourceSystem: "cpd_portal", sourceRecordType: "cpdAttendees", sourceRecordId: id, evidenceInstanceKey: `cpd:attendee:${id}`, status: "attendance_verified", evidenceStrength: "verified_attendance", verificationMethod: "cpd_attendance", completedAt: item.date, issuedAt: null, expiresAt: null, evidenceReference: null, visibility: "shareable", sourceFacts: { attendanceStatus: "attendance_verified", points: item.points, date: item.date }, interpretation: "verified_attendance" })); }
  for (const item of snapshot.competenceEvidence ?? []) {
    const status = effectiveCompetenceStatus(item);
    rows.push(row({ sourceKey: `user:${userId}:competence:${item.id}`, evidenceType: "competence", title: item.competencyDomain, programme: "Observed competence", sourceSystem: "competence_assessment", sourceRecordType: "professionalCompetenceEvidence", sourceRecordId: String(item.id), evidenceInstanceKey: `competence:assessment:${item.id}`, status, evidenceStrength: "assessed", verificationMethod: item.assessmentMethod, completedAt: item.assessmentDate, expiresAt: item.validUntil ?? null, evidenceReference: item.evidenceReference ?? null, visibility: "shareable", sourceFacts: { result: item.result, storedStatus: item.status, assessmentDate: item.assessmentDate, validUntil: item.validUntil, assessorUserId: item.assessorUserId }, interpretation: "effective_competence_status" }));
  }
  return rows;
}

export function selectEvidenceForReport(rows: any[], scope: "activity" | "current_status", start: string, end: string) {
  if (scope === "current_status") return rows;
  return rows.filter(item => {
    let metadata: any = {};
    try { metadata = item.metadataJson ? JSON.parse(item.metadataJson) : {}; } catch { metadata = {}; }
    const value = dateOnly(item.completedAt ?? item.issuedAt ?? item.createdAt ?? item.updatedAt ?? metadata.updatedAt ?? metadata.recordedAt ?? metadata.date);
    return value != null && value >= start && value <= end;
  });
}

export function readinessBottleneck(snapshot: any) {
  const expired = (snapshot.competenceEvidence ?? []).find((item: any) => effectiveCompetenceStatus(item) === "expired");
  if (expired) return { kind: "competence_expired", label: `${expired.competencyDomain} competence expired`, currentState: "Expired", evidence: `professionalCompetenceEvidence #${expired.id}`, nextAction: { label: "Arrange reassessment", destination: "/my-progress?section=development" } };
  const credential = (snapshot.certificates ?? []).find((item: any) => item.expiryDate && new Date(item.expiryDate).getTime() < Date.now());
  if (credential) return { kind: "credential_expired", label: `${String(credential.programType).toUpperCase()} credential expired`, currentState: "Expired", evidence: `certificate #${credential.id ?? credential.verificationCode}`, nextAction: { label: "Renew credential", destination: `/training/${String(credential.programType).toLowerCase()}` } };
  const practical = (snapshot.lifeSupport ?? []).find((item: any) => item.cognitiveComplete && !item.practicalComplete && item.status !== "cancelled");
  if (practical) return { kind: "practical_outstanding", label: `${practical.program} practical assessment outstanding`, currentState: "Learning complete; practical sign-off not recorded", evidence: `enrollment #${practical.enrollmentId}`, nextAction: practical.nextAction ?? { label: "Arrange practical assessment", destination: `/training/${String(practical.program).toLowerCase()}` } };
  const pathway = (snapshot.pathways ?? []).find((item: any) => item.nextAction);
  if (pathway) return { kind: "pathway_phase", label: `${pathway.program}: ${pathway.phase}`, currentState: pathway.status, evidence: pathway.program, nextAction: pathway.nextAction };
  const developing = (snapshot.lifeSupport ?? []).find((item: any) => Number(item.percentage ?? 0) < 100);
  if (developing) return { kind: "learning_incomplete", label: `${developing.program} learning incomplete`, currentState: developing.phase, evidence: `enrollment #${developing.enrollmentId}`, nextAction: developing.nextAction };
  return { kind: "none", label: "No unresolved readiness bottleneck recorded", currentState: "No current bottleneck", evidence: "Evidence Ledger", nextAction: { label: "Set a professional goal", destination: "/my-progress?section=development" } };
}

export const PROFESSIONAL_METRICS = [
  "cpd_points",
  "cpd_sessions_attended",
  "cpd_sessions_presented",
  "life_support_courses_completed",
  "fellowship_completion",
  "cpd_sessions",
  "life_support_completed",
] as const;
export function goalActualValue(metricKey: string, snapshot: any) {
  if (metricKey === "cpd_points") return Number(snapshot.cpd?.points ?? 0);
  if (metricKey === "cpd_sessions_attended" || metricKey === "cpd_sessions") return Number(snapshot.cpd?.sessionsAttended ?? snapshot.cpd?.verifiedSessions ?? 0);
  if (metricKey === "cpd_sessions_presented") return Number(snapshot.cpd?.sessionsPresented ?? 0);
  if (metricKey === "life_support_courses_completed" || metricKey === "life_support_completed") return (snapshot.lifeSupport ?? []).filter((item: any) => item.recordStatus === "completed").length;
  if (metricKey === "fellowship_completion") return Number(snapshot.fellowship?.overallPercentage ?? 0);
  return null;
}
export function goalComputedStatus(target: number, actual: number, end: string, now = new Date()) {
  if (actual >= target) return "achieved";
  if (new Date(`${end}T23:59:59.999Z`).getTime() < now.getTime()) return "expired";
  const remainingDays = Math.max(1, Math.ceil((new Date(`${end}T23:59:59.999Z`).getTime() - now.getTime()) / 86400000));
  return actual / target < 0.5 && remainingDays <= 30 ? "at_risk" : "active";
}

export function nextBestProfessionalAction(snapshot: any) {
  const bottleneck = readinessBottleneck(snapshot);
  if (bottleneck.kind !== "none") return { ...bottleneck.nextAction, priority: 110, why: bottleneck.label, evidenceTrigger: bottleneck.evidence, outcome: `Resolves the current bottleneck: ${bottleneck.currentState}.`, bottleneck };
  const candidates = [...(snapshot.lifeSupport ?? []).map((item: any) => item.nextAction ? { ...item.nextAction, priority: 100 } : null), ...(snapshot.pathways ?? []).map((item: any) => item.nextAction ? { ...item.nextAction, priority: 95 } : null)].filter(Boolean).sort((a: any, b: any) => b.priority - a.priority);
  if (candidates[0]) return { ...candidates[0], why: candidates[0].reason, evidenceTrigger: "An unfinished or unverified professional learning/pathway record", outcome: "Completing this action advances the named learning or verification phase; it does not by itself establish competence." };
  const unfinished = (snapshot.coursework ?? []).find((item: any) => item.status !== "completed");
  if (unfinished) return { label: `Continue ${unfinished.title}`, href: "/my-progress?section=development", reason: "An active Fellowship learning item is not complete.", why: "This is the earliest unfinished learning item in the current portfolio.", evidenceTrigger: unfinished.title, outcome: "Completing it will add a learning-completion record to the Evidence Ledger." };
  return { label: "Set a professional goal", href: "/my-progress?section=development", reason: "Your portfolio has no recorded next action.", why: "No unfinished learning or pathway action is currently recorded.", evidenceTrigger: "No active next action", outcome: "A goal creates a measurable development target; it does not create evidence until completed." };
}
