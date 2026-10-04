export function publicVerificationSnapshot(snapshot: any) {
  return {
    subject: { name: snapshot.subject?.name ?? "Provider", cadre: snapshot.subject?.cadre ?? null },
    period: snapshot.period,
    reportScope: snapshot.reportScope,
    lifeSupport: (snapshot.lifeSupport ?? []).map((item: any) => ({ program: item.program, status: item.recordStatus ?? item.status, evidenceStrength: item.evidenceStrength ?? "learning", source: item.source, validUntil: item.expiresAt ?? null })),
    externalEvidence: (snapshot.externalCompletions ?? []).map((item: any) => ({ program: item.program, status: item.status ?? "verified_external", evidenceStrength: "verified_external", source: item.source })),
    pathways: (snapshot.pathways ?? []).map((item: any) => ({ program: item.program, phase: item.phase, status: item.status })),
    certificates: (snapshot.certificates ?? []).map((item: any) => ({ programType: item.programType, issueDate: item.issueDate, expiryDate: item.expiryDate ?? null, verificationStatus: item.verificationStatus ?? (item.verificationCode ? "verified" : "recorded"), source: item.source ?? "Paeds Resus record" })),
    verifiedAttendance: { sessions: Number(snapshot.cpd?.verifiedSessions ?? 0), points: Number(snapshot.cpd?.points ?? 0) },
    observedCompetence: (snapshot.competenceEvidence ?? []).map((item: any) => ({ competencyDomain: item.competencyDomain, assessmentMethod: item.assessmentMethod, result: item.result, assessmentDate: item.assessmentDate, validUntil: item.validUntil ?? null, status: item.status })),
  };
}
