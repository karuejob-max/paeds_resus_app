import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, gt, inArray, or, sql } from "drizzle-orm";
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
  professionalCompetenceEvidence,
  professionalAssessorAuthorities,
  professionalPathwayCourseAttributions,
  professionalEvidenceReconciliationRuns,
  professionalEvidenceConflicts,
} from "../../drizzle/schema";
import {
  adminProcedure,
  publicProcedure,
  protectedProcedure,
  router,
} from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import {
  phaseForEnrollment,
  progressForEnrollment,
  selectBestCurrentEnrollments,
  selectBestExternalCompletions,
} from "../lib/professional-progress-calculation";
import {
  getAhaNextPhaseAction,
  getIerpNextAction,
  getNerpNextAction,
  type AhaProgramType,
} from "../../shared/provider-course-routes";
import { isInstitutionAdmin } from "../lib/institution-access";
import {
  evidenceRowsFromSnapshot,
  effectiveCompetenceStatus,
  goalActualValue,
  goalComputedStatus,
  PROFESSIONAL_METRICS,
  readinessBottleneck,
  selectEvidenceForReport,
  nextBestProfessionalAction,
} from "../lib/professional-evidence-ledger";
import { buildTruthAuditSummary, detectConflicts, notProjectedSource, reconcileSourceRows } from "../lib/professional-evidence-integrity";
import { publicVerificationSnapshot } from "../lib/professional-public-verification";

const reportInput = z
  .object({
    reportType: z
      .enum(["monthly", "quarterly", "annual", "custom"])
      .default("monthly"),
    reportScope: z.enum(["activity", "current_status"]).default("activity"),
    periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine(value => value.periodStart <= value.periodEnd, {
    message: "periodStart must be on or before periodEnd",
    path: ["periodStart"],
  });

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

async function syncAndReadCanonicalEvidence(
  db: any,
  userId: number,
  snapshot: any
) {
  const projected = evidenceRowsFromSnapshot(snapshot, userId);
  for (const row of projected) {
    await db
      .insert(professionalEvidenceLedger)
      .values({ ...row, userId })
      .onDuplicateKeyUpdate({ set: { ...row, updatedAt: new Date() } });
  }
  return db
    .select()
    .from(professionalEvidenceLedger)
    .where(eq(professionalEvidenceLedger.userId, userId))
    .orderBy(desc(professionalEvidenceLedger.updatedAt));
}

async function buildProgressSnapshot(
  db: any,
  userId: number,
  input: z.infer<typeof reportInput>
) {
  const [
    userRow,
    ahaRows,
    microRows,
    nerpRows,
    ierpRows,
    externalRows,
    certRows,
    fellowshipRows,
    competenceRows,
  ] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        cadre: users.cadre,
        cadreOther: users.cadreOther,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, userId),
          inArray(enrollments.programType, ["bls", "acls", "pals", "nrp"])
        )
      ),
    db
      .select({ enrollment: microCourseEnrollments, course: microCourses })
      .from(microCourseEnrollments)
      .innerJoin(
        microCourses,
        eq(microCourses.id, microCourseEnrollments.microCourseId)
      )
      .where(eq(microCourseEnrollments.userId, userId))
      .orderBy(desc(microCourseEnrollments.updatedAt)),
    db
      .select()
      .from(nerpOfferEnrollments)
      .where(
        and(
          eq(nerpOfferEnrollments.userId, userId),
          eq(nerpOfferEnrollments.offerKey, "nerp-acls-2026")
        )
      )
      .limit(1),
    db
      .select()
      .from(ierpProgramEnrollments)
      .where(
        and(
          eq(ierpProgramEnrollments.userId, userId),
          eq(ierpProgramEnrollments.programKey, "ierp")
        )
      )
      .limit(1),
    db
      .select()
      .from(externalTrainingCompletions)
      .where(eq(externalTrainingCompletions.userId, userId))
      .orderBy(desc(externalTrainingCompletions.recordedAt)),
    db
      .select({
        id: certificates.id,
        programType: certificates.programType,
        certificateNumber: certificates.certificateNumber,
        issueDate: certificates.issueDate,
        expiryDate: certificates.expiryDate,
        verificationCode: certificates.verificationCode,
      })
      .from(certificates)
      .where(eq(certificates.userId, userId))
      .orderBy(desc(certificates.issueDate)),
    db
      .select()
      .from(fellowshipProgress)
      .where(eq(fellowshipProgress.userId, userId))
      .limit(1),
    db
      .select()
      .from(professionalCompetenceEvidence)
      .where(eq(professionalCompetenceEvidence.userId, userId))
      .orderBy(desc(professionalCompetenceEvidence.assessmentDate)),
  ]);
  const user = userRow[0] ?? null;
  const hasNerp = Boolean(nerpRows[0]);
  const hasIerp = Boolean(ierpRows[0]);
  const source = sourceLabel(hasNerp, hasIerp);
  const [nerpLinks, nerpVerifications] = await Promise.all([
    nerpRows[0]
      ? db
          .select()
          .from(nerpOfferCourses)
          .where(eq(nerpOfferCourses.nerpOfferEnrollmentId, nerpRows[0].id))
      : Promise.resolve([]),
    nerpRows[0]
      ? db
          .select()
          .from(nerpOfferExternalVerifications)
          .where(
            eq(
              nerpOfferExternalVerifications.nerpOfferEnrollmentId,
              nerpRows[0].id
            )
          )
      : Promise.resolve([]),
  ]);
  const linkedEnrollmentIds = new Set<number>(
    nerpLinks.map((row: any) => Number(row.enrollmentId))
  );
  const ierpAttributions = hasIerp
    ? await db
        .select()
        .from(professionalPathwayCourseAttributions)
        .where(
          and(
            eq(professionalPathwayCourseAttributions.pathwayType, "ierp"),
            eq(
              professionalPathwayCourseAttributions.pathwayEnrollmentId,
              Number(ierpRows[0].id)
            )
          )
        )
    : [];
  const ierpEnrollmentIds = new Set<number>(
    ierpAttributions.map((row: any) => Number(row.courseEnrollmentId))
  );
  const linkedAhaRows = linkedEnrollmentIds.size
    ? await db
        .select()
        .from(enrollments)
        .where(inArray(enrollments.id, [...linkedEnrollmentIds]))
    : [];
  const allAhaRows = selectBestCurrentEnrollments([
    ...ahaRows,
    ...linkedAhaRows.filter(
      (row: any) => !ahaRows.some((existing: any) => existing.id === row.id)
    ),
  ]);

  const nerpEnrollmentIds = new Set(
    nerpLinks.map((row: any) => Number(row.enrollmentId))
  );
  const lifeSupport = allAhaRows.map((row: any) => ({
    program: String(row.programType).toUpperCase(),
    // NERP has an explicit course-link ledger. IERP currently stores pathway
    // state but does not store an AHA enrollment link, so do not claim IERP
    // attribution for a course we cannot prove belongs to that pathway.
    source: nerpEnrollmentIds.has(Number(row.id))
      ? "NERP"
      : ierpEnrollmentIds.has(Number(row.id))
        ? "IERP"
        : "Individual / unlinked",
    phase: phaseForEnrollment(row),
    percentage: progressForEnrollment(row),
    status: row.enrollmentStatus,
    recordStatus:
      row.enrollmentStatus === "cancelled"
        ? "cancelled"
        : progressForEnrollment(row) >= 100
          ? "completed"
          : progressForEnrollment(row) > 0
            ? "in_progress"
            : "enrolled_not_started",
    dataQuality: {
      level: row.courseId == null ? "partial" : "linked",
      reasons: [
        ...(row.courseId == null
          ? ["Course catalogue link is not present on this enrollment."]
          : []),
        ...(progressForEnrollment(row) === 0
          ? ["No completed learning activity is recorded yet."]
          : []),
      ],
    },
    paymentStatus: row.paymentStatus,
    updatedAt: row.updatedAt,
    cognitiveComplete:
      Boolean(row.cognitiveModulesComplete) ||
      progressForEnrollment(row) >= 100,
    practicalComplete: Boolean(row.practicalSkillsSignedOff),
    enrollmentId: Number(row.id),
    courseDbId: row.courseId == null ? null : Number(row.courseId),
    nextAction: getAhaNextPhaseAction(
      String(row.programType) as AhaProgramType,
      Number(row.id),
      row.courseId == null ? undefined : Number(row.courseId),
      Boolean(row.cognitiveModulesComplete) ||
        progressForEnrollment(row) >= 100,
      Boolean(row.practicalSkillsSignedOff),
      row.enrollmentStatus
    ),
  }));
  const verifiedPhase2 = nerpVerifications.some(
    (row: any) => row.phase === "phase_2" && row.status === "verified"
  );
  const verifiedPhase3 = nerpVerifications.some(
    (row: any) => row.phase === "phase_3" && row.status === "verified"
  );
  const bestAhaByProgram = new Map(
    lifeSupport.map((row: any) => [row.program, row])
  );
  const bls = bestAhaByProgram.get("BLS");
  const acls = bestAhaByProgram.get("ACLS");
  const pathwayRecords = [];
  if (hasNerp) {
    const courseworkComplete =
      Number(bls?.percentage ?? 0) >= 100 &&
      Number(acls?.percentage ?? 0) >= 100;
    const nextAction = getNerpNextAction({
      bls: bls && {
        id: bls.enrollmentId,
        courseId: bls.courseDbId,
        cognitiveComplete: bls.cognitiveComplete,
        progress: bls.percentage,
      },
      acls: acls && {
        id: acls.enrollmentId,
        courseId: acls.courseDbId,
        cognitiveComplete: acls.cognitiveComplete,
        progress: acls.percentage,
      },
      phase2Verified: verifiedPhase2,
      phase3Verified: verifiedPhase3,
      paymentComplete:
        nerpRows[0]?.status === "completed" ||
        Number(nerpRows[0]?.amountPaidKes ?? 0) >=
          Number(nerpRows[0]?.totalAmountKes ?? 15000),
      offerStatus: nerpRows[0]?.status,
    });
    pathwayRecords.push({
      program: "NERP ACLS PATHWAY",
      source: "NERP",
      phase: verifiedPhase3
        ? "Provider / Phase 3 · completed"
        : verifiedPhase2
          ? "Simulation / Phase 2 · verified"
          : courseworkComplete
            ? "BLS/ACLS complete · Phase 2 verification pending"
            : "Started · BLS/ACLS coursework in progress",
      percentage: verifiedPhase3
        ? 100
        : verifiedPhase2
          ? 75
          : courseworkComplete
            ? 50
            : Math.max(
                Number(bls?.percentage ?? 0),
                Number(acls?.percentage ?? 0)
              ),
      status: nerpRows[0]?.status ?? "active",
      paymentStatus: null,
      updatedAt: nerpRows[0]?.updatedAt,
      nextAction,
    });
  }
  if (hasIerp) {
    const program = ierpRows[0];
    const percentage =
      program.phaseStatus === "completed"
        ? 100
        : program.phaseStatus === "phase_3"
          ? 75
          : program.phaseStatus === "phase_2"
            ? 50
            : program.phase1Status === "verified"
              ? 25
              : 0;
    const nextAction = getIerpNextAction({
      bls: bls && {
        id: bls.enrollmentId,
        courseId: bls.courseDbId,
        cognitiveComplete: bls.cognitiveComplete,
      },
      acls: acls && {
        id: acls.enrollmentId,
        courseId: acls.courseDbId,
        cognitiveComplete: acls.cognitiveComplete,
      },
      phaseStatus: program.phaseStatus,
      phase1Complete: program.phase1Status === "verified",
      paymentComplete:
        program.paymentStatus === "paid_in_full" ||
        program.paymentStatus === "not_required",
      lifecycleStatus: program.lifecycleStatus,
    });
    pathwayRecords.push({
      program: "IERP READINESS PATHWAY",
      source: "IERP",
      phase:
        program.phaseStatus === "completed"
          ? "Completed"
          : program.phase1Status === "not_started"
            ? "Phase 1 · not started"
            : `Phase ${program.phaseStatus.replace("phase_", "")}`,
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
    phase: row.phase3Completed
      ? "Provider / Phase 3"
      : row.phase2Completed
        ? "Simulation / Phase 2"
        : "Cognitive prerequisite",
    percentage: row.phase3Completed ? 100 : row.phase2Completed ? 50 : 0,
    status: "verified_external",
    paymentStatus: null,
    updatedAt: row.recordedAt,
  }));
  const externalCompletions = selectBestExternalCompletions(
    externalCompletionRows
  );

  const cpdFilters = [
    sql`(${cpdAttendees.userId} = ${userId} OR LOWER(TRIM(${cpdAttendees.email})) = ${String(
      user?.email ?? ""
    )
      .trim()
      .toLowerCase()})`,
    eq(cpdAttendees.attendanceStatus, "attendance_verified"),
  ];
  if (input.reportScope === "activity") {
    cpdFilters.push(sql`${cpdEvents.eventDateAt} >= ${input.periodStart}`);
    cpdFilters.push(sql`${cpdEvents.eventDateAt} <= ${input.periodEnd}`);
  }
  const cpdRows = await db
    .select({ attendee: cpdAttendees, event: cpdEvents })
    .from(cpdAttendees)
    .innerJoin(cpdEvents, eq(cpdEvents.id, cpdAttendees.cpdEventId))
    .where(and(...cpdFilters))
    .orderBy(desc(cpdEvents.eventDateAt));
  const cpdPoints = cpdRows.reduce(
    (sum: number, row: any) => sum + Number(row.event.cpdPoints ?? 0),
    0
  );
  const fellowship = fellowshipRows[0]
    ? {
        overallPercentage: fellowshipRows[0].overallPercentage ?? 0,
        coursesPercentage: fellowshipRows[0].coursesPercentage ?? 0,
        resusGPSPercentage: fellowshipRows[0].resusGPSPercentage ?? 0,
        careSignalPercentage: fellowshipRows[0].careSignalPercentage ?? 0,
      }
    : null;

  return {
    schemaVersion: 1,
    reportScope: input.reportScope,
    subject: {
      name: user?.name ?? "Provider",
      email: user?.email ?? null,
      cadre: user?.cadreOther || user?.cadre || null,
    },
    period: {
      type: input.reportType,
      start: input.periodStart,
      end: input.periodEnd,
    },
    lifeSupport,
    externalCompletions,
    pathways: pathwayRecords,
    coursework: microRows
      .filter(
        ({ enrollment }: any) =>
          input.reportScope === "current_status" ||
          (enrollment.completedAt &&
            dateOnly(enrollment.completedAt) >= input.periodStart &&
            dateOnly(enrollment.completedAt) <= input.periodEnd) ||
          (!enrollment.completedAt &&
            dateOnly(enrollment.updatedAt) >= input.periodStart &&
            dateOnly(enrollment.updatedAt) <= input.periodEnd)
      )
      .map(({ enrollment, course }: any) => ({
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
      sessions: cpdRows.map((row: any) => ({
        eventId: row.event.id,
        title: row.event.name,
        date: row.event.eventDateAt ?? row.event.eventDate,
        points: Number(row.event.cpdPoints ?? 0),
        departmentId: row.event.facilityDepartmentId,
      })),
    },
    fellowship,
    competenceEvidence: competenceRows.map((row: any) => ({
      ...row,
      effectiveStatus: effectiveCompetenceStatus(row),
    })),
    certificates: certRows
      .filter(
        (row: any) =>
          input.reportScope === "current_status" ||
          (dateOnly(row.issueDate) >= input.periodStart &&
            dateOnly(row.issueDate) <= input.periodEnd)
      )
      .map((row: any) => ({
        programType: row.programType,
        certificateNumber: row.certificateNumber,
        issueDate: row.issueDate,
        expiryDate: row.expiryDate,
        verificationCode: row.verificationCode,
        verificationStatus: row.verificationCode ? "verified" : "recorded",
        source: "Paeds Resus certificate registry",
      })),
    sourceAttribution: {
      hasNerp,
      hasIerp,
      standaloneLearningIncluded: true,
      unlinkedAhaRecords: lifeSupport.filter(
        (item: any) => item.source === "Individual / unlinked"
      ).length,
      ierpAttributedAhaRecords: lifeSupport.filter(
        (item: any) => item.source === "IERP"
      ).length,
    },
    readinessBottleneck: readinessBottleneck({
      lifeSupport,
      pathways: pathwayRecords,
      certificates: certRows,
      competenceEvidence: competenceRows,
    }),
    periodSemantics:
      input.reportScope === "activity"
        ? "Activity report: learning activity, verified attendance, and certificates issued between the selected dates. Current status is shown only in the clearly labelled contextual section and is not period activity."
        : "This report shows current status as of report generation. Period dates are retained as the requested reporting window but do not filter current status.",
    generatedAt: new Date().toISOString(),
  };
}

async function loadProfessionalTruthAudit(db: any) {
  const [aha, certificatesRows, fellowship, externalRows, ierpRows, nerpRows, cpdRows, ledgerRows, conflictRows, reportRows] = await Promise.all([
    db.select({ sourceRecordId: enrollments.id, userId: enrollments.userId }).from(enrollments).where(inArray(enrollments.programType, ["bls", "acls", "pals", "nrp"])),
    db.select({ sourceRecordId: certificates.id, userId: certificates.userId }).from(certificates),
    db.select({ sourceRecordId: microCourseEnrollments.id, userId: microCourseEnrollments.userId }).from(microCourseEnrollments),
    db.select({ sourceRecordId: sql<string>`CONCAT(${externalTrainingCompletions.id}, ':phase2')`, userId: externalTrainingCompletions.userId }).from(externalTrainingCompletions),
    db.select({ sourceRecordId: ierpProgramEnrollments.id, userId: ierpProgramEnrollments.userId }).from(ierpProgramEnrollments),
    db.select({ sourceRecordId: nerpOfferEnrollments.id, userId: nerpOfferEnrollments.userId }).from(nerpOfferEnrollments),
    db.select({ sourceRecordId: cpdAttendees.id, userId: cpdAttendees.userId }).from(cpdAttendees).where(sql`${cpdAttendees.userId} IS NOT NULL`),
    db.select({ userId: professionalEvidenceLedger.userId, sourceRecordId: professionalEvidenceLedger.sourceRecordId, sourceSystem: professionalEvidenceLedger.sourceSystem, sourceRecordType: professionalEvidenceLedger.sourceRecordType, evidenceType: professionalEvidenceLedger.evidenceType, programme: professionalEvidenceLedger.programme, competencyDomain: professionalEvidenceLedger.competencyDomain, status: professionalEvidenceLedger.status, evidenceStrength: professionalEvidenceLedger.evidenceStrength, verificationMethod: professionalEvidenceLedger.verificationMethod, expiresAt: professionalEvidenceLedger.expiresAt, sourceFactJson: professionalEvidenceLedger.sourceFactJson, interpretationVersion: professionalEvidenceLedger.interpretationVersion }).from(professionalEvidenceLedger),
    db.select().from(professionalEvidenceConflicts).where(eq(professionalEvidenceConflicts.state, "open")).orderBy(desc(professionalEvidenceConflicts.updatedAt)).limit(100),
    db.select({ status: professionalProgressReports.status, publicExpiresAt: professionalProgressReports.publicExpiresAt }).from(professionalProgressReports),
  ]);
  const rawCount = async (table: string, predicate = "") => {
    const result: any = await db.execute(sql.raw(`SELECT COUNT(*) AS count FROM \`${table}\`${predicate ? ` WHERE ${predicate}` : ""}`));
    return Number(result[0]?.[0]?.count ?? result[0]?.count ?? 0);
  };
  const unlinkedCpd = await rawCount("cpdAttendees", "userId IS NULL");
  const ledgerBy = (system: string, type: string) => ledgerRows.filter((row: any) => row.sourceSystem === system && row.sourceRecordType === type).map((row: any) => ({ userId: row.userId, sourceRecordId: row.sourceRecordId, sourceSystem: row.sourceSystem, sourceRecordType: row.sourceRecordType }));
  const sources = [
    reconcileSourceRows("AHA enrollments", aha, ledgerBy("aha_learning", "enrollments"), { sourceSystem: "aha_learning", sourceRecordType: "enrollments" }),
    reconcileSourceRows("Certificates", certificatesRows, ledgerBy("certificates", "certificates"), { sourceSystem: "certificates", sourceRecordType: "certificates" }),
    reconcileSourceRows("Fellowship micro-courses", fellowship, ledgerBy("fellowship", "microCourseEnrollments"), { sourceSystem: "fellowship", sourceRecordType: "microCourseEnrollments" }),
    reconcileSourceRows("External completions", externalRows, ledgerBy("external_completion", "externalTrainingCompletions.phase2"), { sourceSystem: "external_completion", sourceRecordType: "externalTrainingCompletions.phase2" }),
    reconcileSourceRows("IERP enrollments", ierpRows, ledgerBy("ierp", "ierpProgramEnrollments"), { sourceSystem: "ierp", sourceRecordType: "ierpProgramEnrollments" }),
    reconcileSourceRows("NERP enrollments", nerpRows, ledgerBy("nerp", "nerp_offer_enrollments"), { sourceSystem: "nerp", sourceRecordType: "nerp_offer_enrollments" }),
    reconcileSourceRows("CPD linked attendees", cpdRows, ledgerBy("cpd_portal", "cpdAttendees"), { sourceSystem: "cpd_portal", sourceRecordType: "cpdAttendees" }),
    notProjectedSource("CPD attendees without account linkage", unlinkedCpd),
  ];
  const detected = detectConflicts(ledgerRows as any);
  const summary = buildTruthAuditSummary({
    sources,
    ledgerRows,
    conflicts: [...conflictRows, ...detected],
    reports: {
      superseded: reportRows.filter((row: any) => row.status === "superseded").length,
      activePublic: reportRows.filter((row: any) => row.status === "active" && (!row.publicExpiresAt || new Date(row.publicExpiresAt).getTime() > Date.now())).length,
    },
  });
  return { summary, detected };
}

async function persistProfessionalTruthAudit(db: any, userId: number, summary: any, detected: any[]) {
  for (const conflict of detected) {
    await db.insert(professionalEvidenceConflicts).values({
      conflictKey: conflict.conflictKey,
      userId: conflict.userId,
      evidenceType: conflict.evidenceType,
      subject: conflict.subject,
      state: conflict.state,
      reason: conflict.reason,
      sourceRowsJson: JSON.stringify(conflict.sourceRows),
    }).onDuplicateKeyUpdate({ set: { state: conflict.state, reason: conflict.reason, sourceRowsJson: JSON.stringify(conflict.sourceRows), updatedAt: new Date() } });
  }
  const runKey = `truth-audit:${new Date().toISOString().slice(0, 10)}:${userId}`;
  await db.insert(professionalEvidenceReconciliationRuns).values({ runKey, triggeredByUserId: userId, status: "completed", summaryJson: JSON.stringify(summary), completedAt: new Date() }).onDuplicateKeyUpdate({ set: { summaryJson: JSON.stringify(summary), completedAt: new Date(), status: "completed" } });
  return { ...summary, persisted: true, runKey };
}

export const professionalProgressRouter = router({
  getProfessionalTruthAudit: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const { summary } = await loadProfessionalTruthAudit(db);
    return { ...summary, persisted: false };
  }),

  persistProfessionalTruthAudit: adminProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const { summary, detected } = await loadProfessionalTruthAudit(db);
    return persistProfessionalTruthAudit(db, ctx.user.id, summary, detected);
  }),

  getMyEvidenceLedger: protectedProcedure
    .input(reportInput)
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const snapshot = await buildProgressSnapshot(db, ctx.user.id, input);
      const rows = await syncAndReadCanonicalEvidence(
        db,
        ctx.user.id,
        snapshot
      );
      return {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        evidence: selectEvidenceForReport(
          rows,
          input.reportScope,
          input.periodStart,
          input.periodEnd
        ),
        nextBestAction: nextBestProfessionalAction(snapshot),
        trustStatement:
          "Each item identifies its source system, evidence strength, and current status. Learning completion is not presented as observed clinical competence.",
      };
    }),

  syncMyEvidenceLedger: protectedProcedure
    .input(reportInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const snapshot = await buildProgressSnapshot(db, ctx.user.id, input);
      const rows = await syncAndReadCanonicalEvidence(
        db,
        ctx.user.id,
        snapshot
      );
      return {
        success: true as const,
        synchronized: rows.length,
        selected: selectEvidenceForReport(
          rows,
          input.reportScope,
          input.periodStart,
          input.periodEnd
        ).length,
        generatedAt: new Date().toISOString(),
      };
    }),

  getMyReport: protectedProcedure
    .input(reportInput)
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const snapshot = await buildProgressSnapshot(db, ctx.user.id, input);
      return {
        ...snapshot,
        nextBestAction: nextBestProfessionalAction(snapshot),
      };
    }),

  getInstitutionStaffProgress: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      if (!(await isInstitutionAdmin(db, ctx.user.id, input.institutionId)))
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Only institution administrators can view staff progress summaries",
        });
      const staff = await db
        .select({
          userId: institutionalStaffMembers.userId,
          staffName: institutionalStaffMembers.staffName,
          staffRole: institutionalStaffMembers.staffRole,
          department: institutionalStaffMembers.department,
        })
        .from(institutionalStaffMembers)
        .where(
          and(
            eq(
              institutionalStaffMembers.institutionalAccountId,
              input.institutionId
            ),
            sql`${institutionalStaffMembers.userId} IS NOT NULL`,
            sql`${institutionalStaffMembers.removedAt} IS NULL`
          )
        );
      const rows = [];
      for (const member of staff) {
        if (!member.userId) continue;
        const snapshot = await buildProgressSnapshot(db, member.userId, {
          reportType: "custom",
          reportScope: "current_status",
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
        });
        const evidence = await syncAndReadCanonicalEvidence(
          db,
          member.userId,
          snapshot
        );
        rows.push({
          staffName: member.staffName,
          staffRole: member.staffRole,
          department: member.department,
          lifeSupport: snapshot.lifeSupport.map((item: any) => ({
            program: item.program,
            percentage: item.percentage,
            recordStatus: item.recordStatus,
          })),
          pathways: snapshot.pathways.map((item: any) => ({
            program: item.program,
            percentage: item.percentage,
            status: item.status,
          })),
          cpdVerifiedSessions: snapshot.cpd.verifiedSessions,
          evidenceSummary: {
            total: evidence.length,
            verified: evidence.filter((item: any) =>
              [
                "credential",
                "verified_external",
                "verified_attendance",
                "assessed",
              ].includes(item.evidenceStrength)
            ).length,
            gaps: evidence
              .filter(
                (item: any) =>
                  item.status === "enrolled_not_started" ||
                  item.status === "learning_in_progress"
              )
              .map((item: any) => item.title),
          },
          nextBestAction: nextBestProfessionalAction(snapshot),
          readinessBottleneck: snapshot.readinessBottleneck,
          dataQuality: snapshot.lifeSupport
            .filter((item: any) => item.dataQuality?.level !== "linked")
            .map((item: any) => ({
              program: item.program,
              reasons: item.dataQuality.reasons,
            })),
        });
      }
      return {
        institutionId: input.institutionId,
        generatedAt: new Date().toISOString(),
        privacy:
          "Names, role, department, learning status, and support signals only; no email, certificates, narratives, or clinical event content.",
        staff: rows,
      };
    }),

  listMyCorrectionCases: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });
    return db
      .select()
      .from(professionalProgressCorrectionCases)
      .where(eq(professionalProgressCorrectionCases.userId, ctx.user.id))
      .orderBy(desc(professionalProgressCorrectionCases.createdAt));
  }),

  createCorrectionCase: protectedProcedure
    .input(
      z.object({
        category: z.enum([
          "missing_record",
          "duplicate_record",
          "wrong_identity",
          "wrong_certificate",
          "wrong_status",
          "wrong_date",
          "other",
        ]),
        subject: z.string().trim().min(3).max(255),
        description: z.string().trim().min(10).max(4000),
        evidenceReference: z.string().trim().max(512).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const result = await db
        .insert(professionalProgressCorrectionCases)
        .values({ userId: ctx.user.id, ...input });
      return { success: true as const, caseId: Number(result[0].insertId) };
    }),

  listCorrectionCasesForReview: adminProcedure
    .input(
      z
        .object({
          status: z
            .enum(["open", "under_review", "resolved", "rejected"])
            .optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const filters = input?.status
        ? eq(professionalProgressCorrectionCases.status, input.status)
        : undefined;
      return db
        .select({
          case: professionalProgressCorrectionCases,
          userName: users.name,
          userEmail: users.email,
        })
        .from(professionalProgressCorrectionCases)
        .innerJoin(
          users,
          eq(users.id, professionalProgressCorrectionCases.userId)
        )
        .where(filters)
        .orderBy(desc(professionalProgressCorrectionCases.createdAt));
    }),

  resolveCorrectionCase: adminProcedure
    .input(
      z.object({
        caseId: z.number().int().positive(),
        status: z.enum(["under_review", "resolved", "rejected"]),
        resolutionNote: z.string().trim().min(3).max(4000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const cases = await db
        .select()
        .from(professionalProgressCorrectionCases)
        .where(eq(professionalProgressCorrectionCases.id, input.caseId))
        .limit(1);
      const correction = cases[0];
      if (!correction)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Correction case not found",
        });
      await db
        .update(professionalProgressCorrectionCases)
        .set({
          status: input.status,
          resolutionNote: input.resolutionNote,
          resolvedByUserId: ctx.user.id,
          resolvedAt: new Date(),
        })
        .where(eq(professionalProgressCorrectionCases.id, input.caseId));
      const material = [
        "wrong_identity",
        "duplicate_record",
        "wrong_certificate",
        "wrong_status",
        "wrong_date",
      ].includes(correction.category);
      let invalidatedReports = 0;
      if (input.status === "resolved" && material) {
        const result = await db
          .update(professionalProgressReports)
          .set({
            status: "superseded",
            invalidatedAt: new Date(),
            invalidationReason: `Material evidence correction case #${input.caseId} resolved: ${input.resolutionNote}`,
          })
          .where(
            and(
              eq(professionalProgressReports.userId, correction.userId),
              eq(professionalProgressReports.status, "active")
            )
          );
        invalidatedReports = Number(result[0].affectedRows ?? 0);
      }
      return {
        success: true as const,
        invalidatedReports,
        replacementReportRecommended: invalidatedReports > 0,
      };
    }),

  listMyCompetenceEvidence: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });
    return db
      .select()
      .from(professionalCompetenceEvidence)
      .where(eq(professionalCompetenceEvidence.userId, ctx.user.id))
      .orderBy(desc(professionalCompetenceEvidence.assessmentDate));
  }),

  grantAssessorAuthority: adminProcedure
    .input(z.object({
      assessorUserId: z.number().int().positive(),
      competencyDomain: z.string().trim().min(2).max(128),
      assessmentMethods: z.array(z.string().trim().min(2).max(64)).min(1).max(12),
      expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const result = await db.insert(professionalAssessorAuthorities).values({
        assessorUserId: input.assessorUserId,
        competencyDomain: input.competencyDomain,
        assessmentMethods: JSON.stringify(input.assessmentMethods),
        approvedByUserId: ctx.user.id,
        expiresAt: input.expiresAt ? new Date(`${input.expiresAt}T23:59:59.999Z`) : null,
        status: "active",
      });
      return { success: true as const, authorityId: Number(result[0].insertId) };
    }),

  linkPathwayCourse: adminProcedure
    .input(z.object({
      pathwayType: z.enum(["ierp", "nerp"]),
      pathwayEnrollmentId: z.number().int().positive(),
      courseEnrollmentId: z.number().int().positive(),
      attributionType: z.string().trim().min(2).max(32).default("pathway_component"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.insert(professionalPathwayCourseAttributions).values({ ...input, createdByUserId: ctx.user.id });
      return { success: true as const };
    }),

  createObservedCompetenceEvidence: adminProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        competencyDomain: z.string().trim().min(2).max(128),
        assessmentType: z.string().trim().min(2).max(64),
        assessmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        assessmentMethod: z.string().trim().min(2).max(64),
        result: z.enum(["competent", "requires_support", "not_yet_competent"]),
        validityMonths: z.number().int().positive().max(60).optional(),
        validUntil: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        evidenceReference: z.string().trim().max(512).optional(),
        notes: z.string().trim().max(4000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const authorityRows = await db
        .select()
        .from(professionalAssessorAuthorities)
        .where(
          and(
            eq(professionalAssessorAuthorities.assessorUserId, ctx.user.id),
            eq(professionalAssessorAuthorities.competencyDomain, input.competencyDomain),
            eq(professionalAssessorAuthorities.status, "active"),
            or(
              sql`${professionalAssessorAuthorities.expiresAt} IS NULL`,
              gt(professionalAssessorAuthorities.expiresAt, new Date())
            )
          )
        )
        .limit(1);
      if (!authorityRows.length)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This assessor is not authorised for the selected competency domain.",
        });
      const allowedMethods = JSON.parse(authorityRows[0].assessmentMethods) as string[];
      if (!allowedMethods.includes(input.assessmentMethod))
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This assessor authority does not include the selected assessment method.",
        });
      const result = await db.insert(professionalCompetenceEvidence).values({
        ...input,
        assessorUserId: ctx.user.id,
        assessmentDate: new Date(`${input.assessmentDate}T00:00:00.000Z`),
        validUntil: input.validUntil
          ? new Date(`${input.validUntil}T00:00:00.000Z`)
          : null,
        status: input.result === "competent" ? "current" : "support_required",
      });
      const id = Number(result[0].insertId);
      await db.insert(professionalEvidenceLedger).values({
        userId: input.userId,
        sourceKey: `user:${input.userId}:competence:${id}`,
        evidenceType: "competence",
        title: input.competencyDomain,
        programme: "Observed competence",
        competencyDomain: input.competencyDomain,
        sourceSystem: "competence_assessment",
        sourceRecordType: "professionalCompetenceEvidence",
        sourceRecordId: String(id),
        status: input.result === "competent" ? "competent" : "support_required",
        evidenceStrength: "assessed",
        verificationMethod: input.assessmentMethod,
        verifiedByUserId: ctx.user.id,
        verifiedAt: new Date(),
        completedAt: new Date(`${input.assessmentDate}T00:00:00.000Z`),
        expiresAt: input.validUntil
          ? new Date(`${input.validUntil}T00:00:00.000Z`)
          : null,
        evidenceReference: input.evidenceReference ?? null,
        visibility: "shareable",
        metadataJson: JSON.stringify({
          assessmentType: input.assessmentType,
          result: input.result,
        }),
        sourceFactJson: JSON.stringify({
          result: input.result,
          assessmentDate: input.assessmentDate,
          validUntil: input.validUntil ?? null,
          assessorUserId: ctx.user.id,
        }),
        interpretation: "effective_competence_status",
        interpretationVersion: "0173-v1",
      });
      return { success: true as const, evidenceId: id };
    }),

  listMyGoals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });
    const goals = await db
      .select()
      .from(professionalProgressGoals)
      .where(eq(professionalProgressGoals.userId, ctx.user.id))
      .orderBy(desc(professionalProgressGoals.periodStart));
    const today = new Date().toISOString().slice(0, 10);
    const snapshot = await buildProgressSnapshot(db, ctx.user.id, {
      reportType: "custom",
      reportScope: "current_status",
      periodStart: today,
      periodEnd: today,
    });
    return Promise.all(goals.map(async goal => {
      if (!(PROFESSIONAL_METRICS as readonly string[]).includes(goal.metricKey)) return goal;
      const actual = goalActualValue(goal.metricKey, snapshot);
      if (actual == null) return goal;
      const target = Number(goal.targetValue);
      const progress = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
      const computedStatus = goalComputedStatus(target, actual, String(goal.periodEnd).slice(0, 10));
      await db.update(professionalProgressGoals).set({ actualValue: String(actual), progressValue: String(progress), computedStatus }).where(eq(professionalProgressGoals.id, goal.id));
      return { ...goal, actualValue: String(actual), progressValue: String(progress), computedStatus };
    }));
  }),

  createGoal: protectedProcedure
    .input(
      z.object({
        metricKey: z.enum(PROFESSIONAL_METRICS),
        title: z.string().trim().min(2).max(255),
        targetValue: z.number().positive(),
        unit: z.string().trim().min(1).max(32),
        periodType: z.enum(["monthly", "quarterly", "annual"]),
        periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      await db.insert(professionalProgressGoals).values({
        userId: ctx.user.id,
        metricKey: input.metricKey,
        title: input.title,
        targetValue: String(input.targetValue),
        unit: input.unit,
        periodType: input.periodType,
        periodStart: new Date(`${input.periodStart}T00:00:00.000Z`),
        periodEnd: new Date(`${input.periodEnd}T00:00:00.000Z`),
      });
      return { success: true as const };
    }),

  createVerifiedReport: protectedProcedure
    .input(reportInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const snapshot = await buildProgressSnapshot(db, ctx.user.id, input);
      const allEvidence = await syncAndReadCanonicalEvidence(
        db,
        ctx.user.id,
        snapshot
      );
      (snapshot as any).evidence = selectEvidenceForReport(
        allEvidence,
        input.reportScope,
        input.periodStart,
        input.periodEnd
      );
      const snapshotJson = JSON.stringify(snapshot);
      const snapshotHash = createHash("sha256")
        .update(snapshotJson)
        .digest("hex");
      const verificationCode = `PPR-${randomBytes(12).toString("hex").toUpperCase()}`;
      const result = await db.insert(professionalProgressReports).values({
        userId: ctx.user.id,
        reportType: input.reportType,
        reportScope: input.reportScope,
        periodStart: new Date(`${input.periodStart}T00:00:00.000Z`),
        periodEnd: new Date(`${input.periodEnd}T00:00:00.000Z`),
        snapshotJson,
        snapshotHash,
        verificationCode,
        publicExpiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      });
      const reportId = Number(result[0].insertId);
      const verificationUrl = `/verify-progress/${verificationCode}`;
      return {
        reportId,
        verificationCode,
        snapshotHash,
        verificationUrl,
        pdfUrl: `/api/professional-progress/report/${verificationCode}.pdf`,
        snapshot,
      };
    }),

  verifyReport: publicProcedure
    .input(z.object({ verificationCode: z.string().trim().min(8).max(64) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const rows = await db
        .select({
          report: professionalProgressReports,
          name: users.name,
          cadre: users.cadre,
        })
        .from(professionalProgressReports)
        .innerJoin(users, eq(users.id, professionalProgressReports.userId))
        .where(
          eq(
            professionalProgressReports.verificationCode,
            input.verificationCode
          )
        )
        .limit(1);
      const row = rows[0];
      if (
        !row ||
        row.report.status !== "active" ||
        (row.report.publicExpiresAt &&
          new Date(row.report.publicExpiresAt).getTime() < Date.now())
      )
        return {
          verified: false as const,
          reason:
            row?.report.status === "revoked"
              ? "revoked"
              : row?.report.status === "superseded"
                ? "superseded"
                : "expired",
        };
      const snapshot = JSON.parse(row.report.snapshotJson);
      return {
        verified: true as const,
        reportId: row.report.id,
        verificationCode: row.report.verificationCode,
        snapshotHash: row.report.snapshotHash,
        generatedAt: row.report.generatedAt,
        reportType: row.report.reportType,
        reportScope: row.report.reportScope,
        periodStart: row.report.periodStart,
        periodEnd: row.report.periodEnd,
        status: row.report.status,
        publicExpiresAt: row.report.publicExpiresAt,
        subjectName: row.name,
        cadre: row.cadre,
        snapshot: publicVerificationSnapshot(snapshot),
      };
    }),

  revokeMyReport: protectedProcedure
    .input(z.object({ verificationCode: z.string().trim().min(8).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      await db
        .update(professionalProgressReports)
        .set({ status: "revoked" })
        .where(
          and(
            eq(professionalProgressReports.userId, ctx.user.id),
            eq(
              professionalProgressReports.verificationCode,
              input.verificationCode
            )
          )
        );
      return { success: true as const };
    }),
});
