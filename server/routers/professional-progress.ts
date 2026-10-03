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
  microCourseEnrollments,
  microCourses,
  nerpOfferCourses,
  nerpOfferEnrollments,
  nerpOfferExternalVerifications,
  professionalProgressGoals,
  professionalProgressReports,
  users,
} from "../../drizzle/schema";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { phaseForEnrollment, progressForEnrollment, selectBestCurrentEnrollments } from "../lib/professional-progress-calculation";
import { getAhaNextPhaseAction, type AhaProgramType } from "../../shared/provider-course-routes";

const reportInput = z.object({
  reportType: z.enum(["monthly", "quarterly", "annual", "custom"]).default("monthly"),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function sourceLabel(hasNerp: boolean, hasIerp: boolean) {
  if (hasNerp && hasIerp) return "NERP + IERP";
  if (hasNerp) return "NERP";
  if (hasIerp) return "IERP";
  return "Self Pay / Individual";
}

async function buildProgressSnapshot(db: any, userId: number, input: z.infer<typeof reportInput>) {
  const [userRow, ahaRows, microRows, nerpRows, ierpRows, externalRows, certRows, fellowshipRows] = await Promise.all([
    db.select({ id: users.id, name: users.name, email: users.email, cadre: users.cadre, cadreOther: users.cadreOther }).from(users).where(eq(users.id, userId)).limit(1),
    db.select().from(enrollments).where(and(eq(enrollments.userId, userId), inArray(enrollments.programType, ["bls", "acls", "pals", "nrp"]))),
    db.select({ enrollment: microCourseEnrollments, course: microCourses }).from(microCourseEnrollments).innerJoin(microCourses, eq(microCourses.id, microCourseEnrollments.microCourseId)).where(eq(microCourseEnrollments.userId, userId)).orderBy(desc(microCourseEnrollments.updatedAt)),
    db.select().from(nerpOfferEnrollments).where(and(eq(nerpOfferEnrollments.userId, userId), eq(nerpOfferEnrollments.offerKey, "nerp-acls-2026"))).limit(1),
    db.select().from(ierpProgramEnrollments).where(and(eq(ierpProgramEnrollments.userId, userId), eq(ierpProgramEnrollments.programKey, "ierp"))).limit(1),
    db.select().from(externalTrainingCompletions).where(eq(externalTrainingCompletions.userId, userId)).orderBy(desc(externalTrainingCompletions.recordedAt)),
    db.select({ id: certificates.id, programType: certificates.programType, certificateNumber: certificates.certificateNumber, issueDate: certificates.issueDate, verificationCode: certificates.verificationCode }).from(certificates).where(eq(certificates.userId, userId)).orderBy(desc(certificates.issueDate)),
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

  const lifeSupport = allAhaRows.map((row: any) => ({
    program: String(row.programType).toUpperCase(),
    source,
    phase: phaseForEnrollment(row),
    percentage: progressForEnrollment(row),
    status: row.enrollmentStatus,
    paymentStatus: row.paymentStatus,
    updatedAt: row.updatedAt,
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
  const pathwayRecords = [];
  if (hasNerp) {
    const bls = bestAhaByProgram.get("BLS");
    const acls = bestAhaByProgram.get("ACLS");
    const courseworkComplete = Number(bls?.percentage ?? 0) >= 100 && Number(acls?.percentage ?? 0) >= 100;
    pathwayRecords.push({
      program: "NERP ACLS PATHWAY",
      source: "NERP",
      phase: verifiedPhase3 ? "Provider / Phase 3 · completed" : verifiedPhase2 ? "Simulation / Phase 2 · verified" : courseworkComplete ? "BLS/ACLS complete · Phase 2 verification pending" : "Started · BLS/ACLS coursework in progress",
      percentage: verifiedPhase3 ? 100 : verifiedPhase2 ? 75 : courseworkComplete ? 50 : Math.max(Number(bls?.percentage ?? 0), Number(acls?.percentage ?? 0)),
      status: nerpRows[0]?.status ?? "active",
      paymentStatus: null,
      updatedAt: nerpRows[0]?.updatedAt,
    });
  }
  if (hasIerp) {
    const program = ierpRows[0];
    const percentage = program.phaseStatus === "completed" ? 100 : program.phaseStatus === "phase_3" ? 75 : program.phaseStatus === "phase_2" ? 50 : program.phase1Status === "verified" ? 25 : 0;
    pathwayRecords.push({
      program: "IERP READINESS PATHWAY",
      source: "IERP",
      phase: program.phaseStatus === "completed" ? "Completed" : program.phase1Status === "not_started" ? "Phase 1 · not started" : `Phase ${program.phaseStatus.replace("phase_", "")}`,
      percentage,
      status: program.lifecycleStatus,
      paymentStatus: program.paymentStatus,
      updatedAt: program.updatedAt,
    });
  }
  const externalCompletions = externalRows.map((row: any) => ({
      program: String(row.courseProgramType).toUpperCase(),
      source: `${String(row.pathway).toUpperCase()} · External completion`,
      phase: row.phase3Completed ? "Provider / Phase 3" : row.phase2Completed ? "Simulation / Phase 2" : "Cognitive prerequisite",
      percentage: row.phase3Completed ? 100 : row.phase2Completed ? 50 : 0,
      status: "verified_external",
      paymentStatus: null,
      updatedAt: row.recordedAt,
    }));

  const cpdRows = await db.select({ attendee: cpdAttendees, event: cpdEvents }).from(cpdAttendees).innerJoin(cpdEvents, eq(cpdEvents.id, cpdAttendees.cpdEventId)).where(and(sql`(${cpdAttendees.userId} = ${userId} OR LOWER(TRIM(${cpdAttendees.email})) = ${String(user?.email ?? "").trim().toLowerCase()})`, eq(cpdAttendees.attendanceStatus, "attendance_verified"), sql`${cpdEvents.eventDateAt} >= ${input.periodStart}`, sql`${cpdEvents.eventDateAt} <= ${input.periodEnd}`)).orderBy(desc(cpdEvents.eventDateAt));
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
    coursework: microRows.map(({ enrollment, course }: any) => ({
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
      sessions: cpdRows.map((row: any) => ({ title: row.event.name, date: row.event.eventDateAt ?? row.event.eventDate, points: Number(row.event.cpdPoints ?? 0), departmentId: row.event.facilityDepartmentId })),
    },
    fellowship,
    certificates: certRows.map((row: any) => ({ programType: row.programType, certificateNumber: row.certificateNumber, issueDate: row.issueDate, verificationCode: row.verificationCode })),
    sourceAttribution: { hasNerp, hasIerp, standaloneLearningIncluded: true },
    generatedAt: new Date().toISOString(),
  };
}

export const professionalProgressRouter = router({
  getMyReport: protectedProcedure.input(reportInput).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return buildProgressSnapshot(db, ctx.user.id, input);
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
    await db.insert(professionalProgressReports).values({ userId: ctx.user.id, reportType: input.reportType, periodStart: new Date(`${input.periodStart}T00:00:00.000Z`), periodEnd: new Date(`${input.periodEnd}T00:00:00.000Z`), snapshotJson, snapshotHash, verificationCode });
    return { verificationCode, snapshotHash, verificationUrl: `/verify-progress/${verificationCode}`, snapshot };
  }),

  verifyReport: publicProcedure.input(z.object({ verificationCode: z.string().trim().min(8).max(64) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const rows = await db.select({ report: professionalProgressReports, name: users.name, cadre: users.cadre }).from(professionalProgressReports).innerJoin(users, eq(users.id, professionalProgressReports.userId)).where(eq(professionalProgressReports.verificationCode, input.verificationCode)).limit(1);
    const row = rows[0];
    if (!row) return { verified: false as const };
    return { verified: true as const, verificationCode: row.report.verificationCode, snapshotHash: row.report.snapshotHash, generatedAt: row.report.generatedAt, reportType: row.report.reportType, periodStart: row.report.periodStart, periodEnd: row.report.periodEnd, subjectName: row.name, cadre: row.cadre, snapshot: JSON.parse(row.report.snapshotJson) };
  }),
});
