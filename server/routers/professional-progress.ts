import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  cpdAttendees,
  cpdEvents,
  certificates,
  enrollments,
  externalTrainingCompletions,
  fellowshipProgress,
  ierpProgramEnrollments,
  institutionalStaffMembers,
  microCourseEnrollments,
  microCourses,
  nerpOfferCourses,
  nerpOfferEnrollments,
  nerpOfferExternalVerifications,
  professionalProgressGoals,
  professionalProgressCorrectionCases,
  professionalProgressReports,
  users,
  professionalEvidenceLedger,
} from "../../drizzle/schema";
import { adminProcedure, publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { phaseForEnrollment, progressForEnrollment, selectBestCurrentEnrollments, selectBestExternalCompletions } from "../lib/professional-progress-calculation";
import { getAhaNextPhaseAction, getIerpNextAction, getNerpNextAction, type AhaProgramType } from "../../shared/provider-course-routes";
import { isInstitutionAdmin } from "../lib/institution-access";
import { evidenceRowsFromSnapshot, nextBestProfessionalAction } from "../lib/professional-evidence-ledger";

const reportInput = z.object({
  reportType: z.enum(["monthly", "quarterly", "annual", "custom"]).default("monthly"),
  reportScope: z.enum(["activity", "current_status"]).default("activity"),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).refine((value) => value.periodStart <= value.periodEnd, { message: "periodStart must be on or before periodEnd", path: ["periodStart"] });

function sourceLabel(hasNerp: boolean, hasIerp: boolean) {
  if (hasNerp && hasIerp) return "NERP + IERP";
  if (hasNerp) return "NERP";
  if (hasIerp) return "IERP";
  return "Self Pay / Individual";
}

function dateOnly(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

async function buildProgressSnapshot(db: any, userId: number, input: z.infer<typeof reportInput>) {
  const [userRow, ahaRows, microRows, nerpRows, ierpRows, externalRows, certRows, fellowshipRows] = await Promise.all([
    db.select({ id: users.id, name: users.name, email: users.email, cadre: users.cadre, cadreOther: users.cadreOther }).from(users).where(eq(users.id, userId)).limit(1),
    db.select().from(enrollments).where(and(eq(enrollments.userId, userId), inArray(enrollments.programType, ["bls", "acls", "pals", "nrp"]))),
    db.select({ enrollment: microCourseEnrollments, course: microCourses }).from(microCourseEnrollments).innerJoin(microCourses, eq(microCourses.id, microCourseEnrollments.microCourseId)).where(eq(microCourseEnrollments.userId, userId)).orderBy(desc(microCourseEnrollments.updatedAt)),
    db.select().from(nerpOfferEnrollments).where(and(eq(nerpOfferEnrollments.userId, userId), eq(nerpOfferEnrollments.offerKey, "nerp-acls-2026"))).limit(1),
    db.select().from(ierpProgramEnrollments).where(and(eq(ierpProgramEnrollments.userId, userId), eq(ierpProgramEnrollments.programKey, "ierp"))).limit(1),
    db.select().from(externalTrainingCompletions).where(eq(externalTrainingCompletions.userId, userId)).orderBy(desc(externalTrainingCompletions.recordedAt)),
    db.select({ id: certificates.id, programType: certificates.programType, certificateNumber: certificates.certificateNumber, issueDate: certificates.issueDate, expiryDate: certificates.expiryDate, verificationCode: certificates.verificationCode }).from(certificates).where(eq(certificates.userId, userId)).orderBy(desc(certificates.issueDate)),
    db.select().from(fellowshipProgress).where(eq(fellowshipProgress.userId, userId)).limit(1),
  ]);
  const user = userRow[0] ?? null;
  const hasNerp = Boolean(nerpRows[0]);
  const hasIerp = Boolean(ierpRows[0]);
  const source = sourceLabel(hasNerp, hasIerp);
  const [nerpLinks, nerpVerifications] = await Promise.all([
    nerpRows[0]
      ? db.select().from(nerpOfferCourses).where(eq(nerpOfferCourses.nerpOfferEnrollmentId, nerpRows[0].id))
      : Promise.resolve([]),
    nerpRows[0]
      ? db.select().from(nerpOfferExternalVerifications).where(eq(nerpOfferExternalVerifications.nerpOfferEnrollmentId, nerpRows[0].id))
      : Promise.resolve([]),
  ]);
  const linkedEnrollmentIds = new Set<number>(nerpLinks.map((row: any) => Number(row.enrollmentId)));
  const linkedAhaRows = linkedEnrollmentIds.size
    ? await db.select().from(enrollments).where(inArray(enrollments.id, [...linkedEnrollmentIds]))
    : [];
  const allAhaRows = selectBestCurrentEnrollments([...ahaRows, ...linkedAhaRows.filter((row: any) => !ahaRows.some((existing: any) => existing.id === row.id))]);

  const nerpEnrollmentIds = new Set(nerpLinks.map((row: any) => Number(row.enrollmentId)));
  const lifeSupport = allAhaRows.map((row: any) => ({
    program: String(row.programType).toUpperCase(),
    // NERP has an explicit course-link ledger. IERP currently stores pathway
    // state but does not store an AHA enrollment link, so do not claim IERP
    // attribution for a course we cannot prove belongs to that pathway.
    source: nerpEnrollmentIds.has(Number(row.id)) ? "NERP" : "Individual / unlinked",
    phase: phaseForEnrollment(row),
    percentage: progressForEnrollment(row),
    status: row.enrollmentStatus,
    recordStatus: row.enrollmentStatus === "cancelled" ? "cancelled" : progressForEnrollment(row) >= 100 ? "completed" : progressForEnrollment(row) > 0 ? "in_progress" : "enrolled_not_started",
    dataQuality: {
      level: row.courseId == null ? "partial" : "linked",
      reasons: [
        ...(row.courseId == null ? ["Course catalogue link is not present on this enrollment."] : []),
        ...(progressForEnrollment(row) === 0 ? ["No completed learning activity is recorded yet."] : []),
      ],
    },
    paymentStatus: row.paymentStatus,
    updatedAt: row.updatedAt,
    cognitiveComplete: Boolean(row.cognitiveModulesComplete) || progressForEnrollment(row) >= 100,
    practicalComplete: Boolean(row.practicalSkillsSignedOff),
    enrollmentId: Number(row.id),
    courseDbId: row.courseId == null ? null : Number(row.courseId),
    nextAction: getAhaNextPhaseAction(
      String(row.programType) as AhaProgramType,
      Number(row.id),
      row.courseId == null ? undefined : Number(row.courseId),
      Boolean(row.cognitiveModulesComplete) || progressForEnrollment(row) >= 100,
      Boolean(row.practicalSkillsSignedOff),
      row.enrollmentStatus,
    ),
  }));
  const verifiedPhase2 = nerpVerifications.some((row: any) => row.phase === "phase_2" && row.status === "verified");
  const verifiedPhase3 = nerpVerifications.some((row: any) => row.phase === "phase_3" && row.status === "verified");
  const bestAhaByProgram = new Map(lifeSupport.map((row: any) => [row.program, row]));
  const bls = bestAhaByProgram.get("BLS");
  const acls = bestAhaByProgram.get("ACLS");
  const pathwayRecords = [];
  if (hasNerp) {
    const courseworkComplete = Number(bls?.percentage ?? 0) >= 100 && Number(acls?.percentage ?? 0) >= 100;
    const nextAction = getNerpNextAction({
      bls: bls && { id: bls.enrollmentId, courseId: bls.courseDbId, cognitiveComplete: bls.cognitiveComplete, progress: bls.percentage },
      acls: acls && { id: acls.enrollmentId, courseId: acls.courseDbId, cognitiveComplete: acls.cognitiveComplete, progress: acls.percentage },
      phase2Verified: verifiedPhase2,
      phase3Verified: verifiedPhase3,
      paymentComplete: nerpRows[0]?.status === "completed" || Number(nerpRows[0]?.amountPaidKes ?? 0) >= Number(nerpRows[0]?.totalAmountKes ?? 15000),
      offerStatus: nerpRows[0]?.status,
    });
    pathwayRecords.push({
      program: "NERP ACLS PATHWAY",
      source: "NERP",
      phase: verifiedPhase3 ? "Provider / Phase 3 · completed" : verifiedPhase2 ? "Simulation / Phase 2 · verified" : courseworkComplete ? "BLS/ACLS complete · Phase 2 verification pending" : "Started · BLS/ACLS coursework in progress",
      percentage: verifiedPhase3 ? 100 : verifiedPhase2 ? 75 : courseworkComplete ? 50 : Math.max(Number(bls?.percentage ?? 0), Number(acls?.percentage ?? 0)),
      status: nerpRows[0]?.status ?? "active",
      paymentStatus: null,
      updatedAt: nerpRows[0]?.updatedAt,
      nextAction,
    });
  }
  if (hasIerp) {
    const program = ierpRows[0];
    const percentage = program.phaseStatus === "completed" ? 100 : program.phaseStatus === "phase_3" ? 75 : program.phaseStatus === "phase_2" ? 50 : program.phase1Status === "verified" ? 25 : 0;
    const nextAction = getIerpNextAction({
      bls: bls && { id: bls.enrollmentId, courseId: bls.courseDbId, cognitiveComplete: bls.cognitiveComplete },
      acls: acls && { id: acls.enrollmentId, courseId: acls.courseDbId, cognitiveComplete: acls.cognitiveComplete },
      phaseStatus: program.phaseStatus,
      phase1Complete: program.phase1Status === "verified",
      paymentComplete: program.paymentStatus === "paid_in_full" || program.paymentStatus === "not_required",
      lifecycleStatus: program.lifecycleStatus,
    });
    pathwayRecords.push({
      program: "IERP READINESS PATHWAY",
      source: "IERP",
      phase: program.phaseStatus === "completed" ? "Completed" : program.phase1Status === "not_started" ? "Phase 1 · not started" : `Phase ${program.phaseStatus.replace("phase_", "")}`,
      percentage,
      status: program.lifecycleStatus,
      paymentStatus: program.paymentStatus,
      updatedAt: program.updatedAt,
      nextAction,
    });
  }
  const externalCompletionRows = externalRows.map((row: any) => ({
      program: String(row.courseProgramType).toUpperCase(),
      source: `${String(row.pathway).toUpperCase()} · External completion`,
      phase: row.phase3Completed ? "Provider / Phase 3" : row.phase2Completed ? "Simulation / Phase 2" : "Cognitive prerequisite",
      percentage: row.phase3Completed ? 100 : row.phase2Completed ? 50 : 0,
      status: "verified_external",
      paymentStatus: null,
      updatedAt: row.recordedAt,
    }));
  const externalCompletions = selectBestExternalCompletions(externalCompletionRows);

  const cpdFilters = [
    sql`(${cpdAttendees.userId} = ${userId} OR LOWER(TRIM(${cpdAttendees.email})) = ${String(user?.email ?? "").trim().toLowerCase()})`,
    eq(cpdAttendees.attendanceStatus, "attendance_verified"),
  ];
  if (input.reportScope === "activity") {
    cpdFilters.push(sql`${cpdEvents.eventDateAt} >= ${input.periodStart}`);
    cpdFilters.push(sql`${cpdEvents.eventDateAt} <= ${input.periodEnd}`);
  }
  const cpdRows = await db.select({ attendee: cpdAttendees, event: cpdEvents }).from(cpdAttendees).innerJoin(cpdEvents, eq(cpdEvents.id, cpdAttendees.cpdEventId)).where(and(...cpdFilters)).orderBy(desc(cpdEvents.eventDateAt));
  const cpdPoints = cpdRows.reduce((sum: number, row: any) => sum + Number(row.event.cpdPoints ?? 0), 0);
  const fellowship = fellowshipRows[0] ? {
    overallPercentage: fellowshipRows[0].overallPercentage ?? 0,
    coursesPercentage: fellowshipRows[0].coursesPercentage ?? 0,
    resusGPSPercentage: fellowshipRows[0].resusGPSPercentage ?? 0,
    careSignalPercentage: fellowshipRows[0].careSignalPercentage ?? 0,
  } : null;

  return {
    schemaVersion: 1,
    subject: { name: user?.name ?? "Provider", email: user?.email ?? null, cadre: user?.cadreOther || user?.cadre || null },
    period: { type: input.reportType, start: input.periodStart, end: input.periodEnd },
    lifeSupport,
    externalCompletions,
    pathways: pathwayRecords,
    coursework: microRows.filter(({ enrollment }: any) => input.reportScope === "current_status" || (enrollment.completedAt && dateOnly(enrollment.completedAt) >= input.periodStart && dateOnly(enrollment.completedAt) <= input.periodEnd) || (!enrollment.completedAt && dateOnly(enrollment.updatedAt) >= input.periodStart && dateOnly(enrollment.updatedAt) <= input.periodEnd)).map(({ enrollment, course }: any) => ({
      title: course.title,
      courseId: course.courseId,
      category: "Paeds Resus Fellowship coursework",
      percentage: Number(enrollment.progressPercentage ?? 0),
      status: enrollment.enrollmentStatus,
      completedAt: enrollment.completedAt,
      updatedAt: enrollment.updatedAt,
    })),
    cpd: {
      verifiedSessions: cpdRows.length,
      points: Number(cpdPoints.toFixed(1)),
      sessions: cpdRows.map((row: any) => ({ eventId: row.event.id, title: row.event.name, date: row.event.eventDateAt ?? row.event.eventDate, points: Number(row.event.cpdPoints ?? 0), departmentId: row.event.facilityDepartmentId })),
    },
    fellowship,
    certificates: certRows.filter((row: any) => input.reportScope === "current_status" || (dateOnly(row.issueDate) >= input.periodStart && dateOnly(row.issueDate) <= input.periodEnd)).map((row: any) => ({ programType: row.programType, certificateNumber: row.certificateNumber, issueDate: row.issueDate, verificationCode: row.verificationCode })),
    sourceAttribution: { hasNerp, hasIerp, standaloneLearningIncluded: true, unlinkedAhaRecords: lifeSupport.filter((item: any) => item.source === "Individual / unlinked").length },
    periodSemantics: input.reportScope === "activity"
      ? "This report shows learning activity and certificates issued during the selected period. Life-support and pathway cards show current status as of report generation."
      : "This report shows current status as of report generation. Period dates are retained as the requested reporting window but do not filter current status.",
    generatedAt: new Date().toISOString(),
  };
}

export const professionalProgressRouter = router({
  getMyEvidenceLedger: protectedProcedure.input(reportInput).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const snapshot = await buildProgressSnapshot(db, ctx.user.id, input);
    const rows = evidenceRowsFromSnapshot(snapshot, ctx.user.id);
    return {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      evidence: rows,
      nextBestAction: nextBestProfessionalAction(snapshot),
      trustStatement: "Each item identifies its source system, evidence strength, and current status. Learning completion is not presented as observed clinical competence.",
    };
  }),

  syncMyEvidenceLedger: protectedProcedure.input(reportInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const snapshot = await buildProgressSnapshot(db, ctx.user.id, input);
    const rows = evidenceRowsFromSnapshot(snapshot, ctx.user.id);
    if (rows.length) {
      for (const row of rows) {
        const values = { ...row, userId: ctx.user.id } as any;
        await db.insert(professionalEvidenceLedger).values(values).onDuplicateKeyUpdate({ set: { ...values, updatedAt: new Date() } });
      }
    }
    return { success: true as const, synchronized: rows.length, generatedAt: new Date().toISOString() };
  }),

  getMyReport: protectedProcedure.input(reportInput).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const snapshot = await buildProgressSnapshot(db, ctx.user.id, input);
    return { ...snapshot, nextBestAction: nextBestProfessionalAction(snapshot) };
  }),

  getInstitutionStaffProgress: protectedProcedure.input(z.object({ institutionId: z.number().int().positive(), periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    if (!(await isInstitutionAdmin(db, ctx.user.id, input.institutionId))) throw new TRPCError({ code: "FORBIDDEN", message: "Only institution administrators can view staff progress summaries" });
    const staff = await db.select({ userId: institutionalStaffMembers.userId, staffName: institutionalStaffMembers.staffName, staffRole: institutionalStaffMembers.staffRole, department: institutionalStaffMembers.department }).from(institutionalStaffMembers).where(and(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId), sql`${institutionalStaffMembers.userId} IS NOT NULL`, sql`${institutionalStaffMembers.removedAt} IS NULL`));
    const rows = [];
    for (const member of staff) {
      if (!member.userId) continue;
      const snapshot = await buildProgressSnapshot(db, member.userId, { reportType: "custom", reportScope: "current_status", periodStart: input.periodStart, periodEnd: input.periodEnd });
      const evidence = evidenceRowsFromSnapshot(snapshot, member.userId);
      rows.push({ staffName: member.staffName, staffRole: member.staffRole, department: member.department, lifeSupport: snapshot.lifeSupport.map((item: any) => ({ program: item.program, percentage: item.percentage, recordStatus: item.recordStatus })), pathways: snapshot.pathways.map((item: any) => ({ program: item.program, percentage: item.percentage, status: item.status })), cpdVerifiedSessions: snapshot.cpd.verifiedSessions, evidenceSummary: { total: evidence.length, verified: evidence.filter((item) => ["credential", "verified_external", "verified_attendance", "assessed"].includes(item.evidenceStrength)).length, gaps: evidence.filter((item) => item.status === "enrolled_not_started" || item.status === "learning_in_progress").map((item) => item.title) }, nextBestAction: nextBestProfessionalAction(snapshot), dataQuality: snapshot.lifeSupport.filter((item: any) => item.dataQuality?.level !== "linked").map((item: any) => ({ program: item.program, reasons: item.dataQuality.reasons })) });
    }
    return { institutionId: input.institutionId, generatedAt: new Date().toISOString(), privacy: "Names, role, department, learning status, and support signals only; no email, certificates, narratives, or clinical event content.", staff: rows };
  }),

  listMyCorrectionCases: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db.select().from(professionalProgressCorrectionCases).where(eq(professionalProgressCorrectionCases.userId, ctx.user.id)).orderBy(desc(professionalProgressCorrectionCases.createdAt));
  }),

  createCorrectionCase: protectedProcedure.input(z.object({
    category: z.enum(["missing_record", "duplicate_record", "wrong_identity", "wrong_certificate", "wrong_status", "wrong_date", "other"]),
    subject: z.string().trim().min(3).max(255),
    description: z.string().trim().min(10).max(4000),
    evidenceReference: z.string().trim().max(512).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const result = await db.insert(professionalProgressCorrectionCases).values({ userId: ctx.user.id, ...input });
    return { success: true as const, caseId: Number(result[0].insertId) };
  }),

  listCorrectionCasesForReview: adminProcedure.input(z.object({ status: z.enum(["open", "under_review", "resolved", "rejected"]).optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const filters = input?.status ? eq(professionalProgressCorrectionCases.status, input.status) : undefined;
    return db.select({ case: professionalProgressCorrectionCases, userName: users.name, userEmail: users.email }).from(professionalProgressCorrectionCases).innerJoin(users, eq(users.id, professionalProgressCorrectionCases.userId)).where(filters).orderBy(desc(professionalProgressCorrectionCases.createdAt));
  }),

  resolveCorrectionCase: adminProcedure.input(z.object({ caseId: z.number().int().positive(), status: z.enum(["under_review", "resolved", "rejected"]), resolutionNote: z.string().trim().min(3).max(4000) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    await db.update(professionalProgressCorrectionCases).set({ status: input.status, resolutionNote: input.resolutionNote, resolvedByUserId: ctx.user.id, resolvedAt: new Date() }).where(eq(professionalProgressCorrectionCases.id, input.caseId));
    return { success: true as const };
  }),

  listMyGoals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db.select().from(professionalProgressGoals).where(and(eq(professionalProgressGoals.userId, ctx.user.id), eq(professionalProgressGoals.status, "active"))).orderBy(desc(professionalProgressGoals.periodStart));
  }),

  createGoal: protectedProcedure.input(z.object({ metricKey: z.string().trim().min(2).max(64), title: z.string().trim().min(2).max(255), targetValue: z.number().positive(), unit: z.string().trim().min(1).max(32), periodType: z.enum(["monthly", "quarterly", "annual"]), periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    await db.insert(professionalProgressGoals).values({ userId: ctx.user.id, metricKey: input.metricKey, title: input.title, targetValue: String(input.targetValue), unit: input.unit, periodType: input.periodType, periodStart: new Date(`${input.periodStart}T00:00:00.000Z`), periodEnd: new Date(`${input.periodEnd}T00:00:00.000Z`) });
    return { success: true as const };
  }),

  createVerifiedReport: protectedProcedure.input(reportInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const snapshot = await buildProgressSnapshot(db, ctx.user.id, input);
    const snapshotJson = JSON.stringify(snapshot);
    const snapshotHash = createHash("sha256").update(snapshotJson).digest("hex");
    const verificationCode = `PPR-${randomBytes(12).toString("hex").toUpperCase()}`;
    const result = await db.insert(professionalProgressReports).values({ userId: ctx.user.id, reportType: input.reportType, reportScope: input.reportScope, periodStart: new Date(`${input.periodStart}T00:00:00.000Z`), periodEnd: new Date(`${input.periodEnd}T00:00:00.000Z`), snapshotJson, snapshotHash, verificationCode, publicExpiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) });
    const reportId = Number(result[0].insertId);
    const verificationUrl = `/verify-progress/${verificationCode}`;
    return { reportId, verificationCode, snapshotHash, verificationUrl, pdfUrl: `/api/professional-progress/report/${verificationCode}.pdf`, snapshot };
  }),

  verifyReport: publicProcedure.input(z.object({ verificationCode: z.string().trim().min(8).max(64) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const rows = await db.select({ report: professionalProgressReports, name: users.name, cadre: users.cadre }).from(professionalProgressReports).innerJoin(users, eq(users.id, professionalProgressReports.userId)).where(eq(professionalProgressReports.verificationCode, input.verificationCode)).limit(1);
    const row = rows[0];
    if (!row || row.report.status !== "active" || (row.report.publicExpiresAt && new Date(row.report.publicExpiresAt).getTime() < Date.now())) return { verified: false as const, reason: row?.report.status === "revoked" ? "revoked" : row?.report.status === "superseded" ? "superseded" : "expired" };
    return { verified: true as const, reportId: row.report.id, verificationCode: row.report.verificationCode, snapshotHash: row.report.snapshotHash, generatedAt: row.report.generatedAt, reportType: row.report.reportType, periodStart: row.report.periodStart, periodEnd: row.report.periodEnd, subjectName: row.name, cadre: row.cadre, snapshot: JSON.parse(row.report.snapshotJson) };
  }),

  revokeMyReport: protectedProcedure.input(z.object({ verificationCode: z.string().trim().min(8).max(64) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    await db.update(professionalProgressReports).set({ status: "revoked" }).where(and(eq(professionalProgressReports.userId, ctx.user.id), eq(professionalProgressReports.verificationCode, input.verificationCode)));
    return { success: true as const };
  }),
});
