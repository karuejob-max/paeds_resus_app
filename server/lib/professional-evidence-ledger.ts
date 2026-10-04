export type EvidenceProjection = {
  sourceKey: string;
  evidenceType: string;
  title: string;
  programme: string | null;
  sourceSystem: string;
  sourceRecordType: string;
  sourceRecordId: string;
  status: string;
  evidenceStrength: string;
  verificationMethod: string | null;
  completedAt?: string | Date | null;
  issuedAt?: string | Date | null;
  expiresAt?: string | Date | null;
  evidenceReference?: string | null;
  visibility: string;
  metadataJson: string;
};

function json(value: unknown) {
  return JSON.stringify(value);
}

export function evidenceRowsFromSnapshot(snapshot: any, userId: number): EvidenceProjection[] {
  const rows: EvidenceProjection[] = [];
  for (const item of snapshot.lifeSupport ?? []) {
    const completed = Number(item.percentage ?? 0) >= 100;
    rows.push({
      sourceKey: `user:${userId}:aha-enrollment:${item.enrollmentId}`,
      evidenceType: "learning",
      title: `${item.program} Life Support learning`,
      programme: item.program,
      sourceSystem: "aha_learning",
      sourceRecordType: "enrollments",
      sourceRecordId: String(item.enrollmentId),
      status: item.status === "cancelled" ? "cancelled" : completed ? "learning_complete" : Number(item.percentage ?? 0) > 0 ? "learning_in_progress" : "enrolled_not_started",
      evidenceStrength: completed && item.practicalComplete ? "assessed" : completed ? "recorded" : "developing",
      verificationMethod: item.practicalComplete ? "approved_instructor" : null,
      completedAt: completed ? item.updatedAt : null,
      issuedAt: null,
      expiresAt: null,
      evidenceReference: null,
      visibility: "private",
      metadataJson: json({ percentage: item.percentage, phase: item.phase, source: item.source, nextAction: item.nextAction }),
    });
  }
  for (const item of snapshot.externalCompletions ?? []) {
    rows.push({
      sourceKey: `user:${userId}:external-completion:${item.program}:${item.source}`,
      evidenceType: "credential",
      title: `${item.program} external completion`,
      programme: item.program,
      sourceSystem: "external_verification",
      sourceRecordType: "externalTrainingCompletions",
      sourceRecordId: `${item.program}:${item.source}`,
      status: item.status,
      evidenceStrength: "verified_external",
      verificationMethod: "admin_review",
      completedAt: item.updatedAt,
      issuedAt: null,
      expiresAt: null,
      visibility: "shareable",
      metadataJson: json({ phase: item.phase, source: item.source }),
    });
  }
  for (const item of snapshot.coursework ?? []) {
    rows.push({
      sourceKey: `user:${userId}:micro-course:${item.courseId}`,
      evidenceType: "learning",
      title: item.title,
      programme: "Paeds Resus Fellowship",
      sourceSystem: "fellowship",
      sourceRecordType: "microCourseEnrollments",
      sourceRecordId: String(item.courseId),
      status: item.status === "completed" ? "learning_complete" : Number(item.percentage ?? 0) > 0 ? "learning_in_progress" : "enrolled_not_started",
      evidenceStrength: item.status === "completed" ? "recorded" : "developing",
      verificationMethod: null,
      completedAt: item.completedAt,
      issuedAt: null,
      expiresAt: null,
      visibility: "private",
      metadataJson: json({ percentage: item.percentage, category: item.category }),
    });
  }
  for (const item of snapshot.certificates ?? []) {
    rows.push({
      sourceKey: `user:${userId}:certificate:${item.id ?? item.certificateNumber ?? item.verificationCode}`,
      evidenceType: "credential",
      title: `${String(item.programType).toUpperCase()} certificate`,
      programme: item.programType,
      sourceSystem: "certificates",
      sourceRecordType: "certificates",
      sourceRecordId: String(item.id ?? item.certificateNumber ?? item.verificationCode),
      status: "issued",
      evidenceStrength: "credential",
      verificationMethod: item.verificationCode ? "platform_verification" : null,
      completedAt: item.issueDate,
      issuedAt: item.issueDate,
      expiresAt: item.expiryDate ?? null,
      evidenceReference: item.verificationCode ?? null,
      visibility: "shareable",
      metadataJson: json({ certificateNumber: item.certificateNumber }),
    });
  }
  for (const item of snapshot.cpd?.sessions ?? []) {
    rows.push({
      sourceKey: `user:${userId}:cpd:${item.eventId ?? `${item.title}:${item.date}`}`,
      evidenceType: "cpd",
      title: item.title,
      programme: "CPD",
      sourceSystem: "cpd_portal",
      sourceRecordType: "cpdEvents",
      sourceRecordId: String(item.eventId ?? `${item.title}:${item.date}`),
      status: "attendance_verified",
      evidenceStrength: "verified_attendance",
      verificationMethod: "cpd_attendance",
      completedAt: item.date,
      visibility: "shareable",
      metadataJson: json({ points: item.points, departmentId: item.departmentId }),
    });
  }
  return rows;
}

export function nextBestProfessionalAction(snapshot: any) {
  const candidates = [
    ...(snapshot.lifeSupport ?? []).map((item: any) => item.nextAction ? { ...item.nextAction, priority: 100 } : null),
    ...(snapshot.pathways ?? []).map((item: any) => item.nextAction ? { ...item.nextAction, priority: 95 } : null),
  ].filter(Boolean).sort((a: any, b: any) => b.priority - a.priority);
  if (candidates[0]) return candidates[0];
  const unfinished = (snapshot.coursework ?? []).find((item: any) => item.status !== "completed");
  if (unfinished) return { label: `Continue ${unfinished.title}`, href: "/my-progress?section=development", reason: "An active Fellowship learning item is not complete." };
  return { label: "Set a professional goal", href: "/my-progress?section=development", reason: "Your portfolio has no recorded next action." };
}
