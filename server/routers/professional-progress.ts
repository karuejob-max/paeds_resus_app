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
  nerpOfferEnrollments,
  professionalProgressGoals,
  professionalProgressReports,
  users,
} from "../../drizzle/schema";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";

const reportInput = z.object({
  reportType: z.enum(["monthly", "quarterly", "annual", "custom"]).default("monthly"),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function progressForEnrollment(row: any) {
  if (row.certificateVerified || row.practicalSkillsSignedOff) return 100;
  if (row.cognitiveModulesComplete) return 50;
  if (row.ahaPrecourseCompleted || row.elearningProofVerifiedAt) return 25;
  return 0;
}

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
    db.select({ id: nerpOfferEnrollments.id }).from(nerpOfferEnrollments).where(and(eq(nerpOfferEnrollments.userId, userId), eq(nerpOfferEnrollments.offerKey, "nerp-acls"))).limit(1),
    db.select({ id: ierpProgramEnrollments.id }).from(ierpProgramEnrollments).where(and(eq(ierpProgramEnrollments.userId, userId), eq(ierpProgramEnrollments.programKey, "ierp"))).limit(1),
    db.select().from(externalTrainingCompletions).where(eq(externalTrainingCompletions.userId, userId)).orderBy(desc(externalTrainingCompletions.recordedAt)),
    db.select({ id: certificates.id, programType: certificates.programType, certificateNumber: certificates.certificateNumber, issueDate: certificates.issueDate, verificationCode: certificates.verificationCode }).from(certificates).where(eq(certificates.userId, userId)).orderBy(desc(certificates.issueDate)),
    db.select().from(fellowshipProgress).where(eq(fellowshipProgress.userId, userId)).limit(1),
  ]);
  const user = userRow[0] ?? null;
  const hasNerp = Boolean(nerpRows[0]);
  const hasIerp = Boolean(ierpRows[0]);
  const source = sourceLabel(hasNerp, hasIerp);

  const lifeSupport = ahaRows.map((row: any) => ({
    program: String(row.programType).toUpperCase(),
    source,
    phase: row.certificateVerified || row.practicalSkillsSignedOff ? "Provider / Phase 3" : row.cognitiveModulesComplete ? "Cognitive / Phase 2" : "Started",
    percentage: progressForEnrollment(row),
    status: row.enrollmentStatus,
    paymentStatus: row.paymentStatus,
    updatedAt: row.updatedAt,
  }));
  for (const row of externalRows) {
    lifeSupport.push({
      program: String(row.courseProgramType).toUpperCase(),
      source: `${String(row.pathway).toUpperCase()} · External completion`,
      phase: row.phase3Completed ? "Provider / Phase 3" : row.phase2Completed ? "Simulation / Phase 2" : "Cognitive prerequisite",
      percentage: row.phase3Completed ? 100 : row.phase2Completed ? 50 : 0,
      status: "verified_external",
      paymentStatus: null,
      updatedAt: row.recordedAt,
    });
  }

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
