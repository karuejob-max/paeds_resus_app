/**
 * Fellowship pillar calculations + denormalized `fellowshipProgress` sync.
 * Single source of truth for live UX and admin ledger rows.
 */
import { and, desc, eq, gte, inArray, isNull, like, or, sql } from "drizzle-orm";
import { getDb, getFellowshipProgress, createFellowshipProgress, updateFellowshipProgress } from "../db";
import {
  certificates,
  microCourseEnrollments,
  resusGPSSessions,
  resusGPSCases,
  careSignalEvents,
  fellowshipGraceUsage,
  fellowshipProgress,
  users,
  enrollments,
} from "../../drizzle/schema";
import {
  computeCareSignalStreak,
  computeCareSignalTimelineKeys,
  enumerateMonthsEndingAt,
  monthKeyEAT,
} from "../routers/fellowship-care-signal-streak";
import { getFellowshipMicroCourseRequiredCount } from "../lib/micro-course-catalog";
import {
  FELLOWSHIP_MICROCOURSE_RESUS_CONDITIONS,
  getFellowshipMicrocourseResusConditionCount,
  isFellowshipMicrocourseResusCondition,
  normalizeToFellowshipResusConditionId,
} from "../../shared/fellowship-microcourse-resus-conditions";

export type FellowshipPillarStatus = Awaited<ReturnType<typeof calculateFellowshipStatus>>;

export async function calculateCoursesPillar(userId: number) {
  const db = await getDb();
  if (!db) {
    const required = getFellowshipMicroCourseRequiredCount();
    return { completed: 0, required, percentage: 0, legacyCourses: 0 };
  }

  try {
    const totalRequired = getFellowshipMicroCourseRequiredCount();
    const completedCerts = await db.query.certificates.findMany({
      where: (certs) => eq(certs.userId, userId),
    });
    const completedMicroCourses = await db.query.microCourseEnrollments.findMany({
      where: (enrollments) =>
        and(eq(enrollments.userId, userId), eq(enrollments.enrollmentStatus, "completed")),
    });
    const legacyCourses = completedCerts.filter((c) =>
      ["bls", "acls", "pals", "instructor"].includes(c.programType)
    ).length;
    const completed = completedMicroCourses.length;
    const percentage = Math.min(100, Math.round((completed / totalRequired) * 100));
    return { completed, required: totalRequired, percentage, legacyCourses };
  } catch (error) {
    console.error("[Fellowship] Error calculating courses pillar:", error);
    const required = getFellowshipMicroCourseRequiredCount();
    return { completed: 0, required, percentage: 0, legacyCourses: 0 };
  }
}

export async function calculateResusGPSPillar(userId: number) {
  const db = await getDb();
  if (!db) {
    const emptyBreakdown = FELLOWSHIP_MICROCOURSE_RESUS_CONDITIONS.map((cond) => ({
      id: cond.id,
      label: cond.label,
      count: 0,
      required: 3,
      remaining: 3,
      complete: false,
    }));
    return {
      casesCompleted: 0,
      conditionsWithThreshold: 0,
      totalConditionsTaught: getFellowshipMicrocourseResusConditionCount(),
      percentage: 0,
      casesByCondition: {} as Record<string, number>,
      conditionBreakdown: emptyBreakdown,
      casesStillNeeded: emptyBreakdown.reduce((sum, c) => sum + c.remaining, 0),
      incompleteConditions: emptyBreakdown.length,
    };
  }

  try {
    const sessions = await db
      .select()
      .from(resusGPSSessions)
      .where(and(eq(resusGPSSessions.userId, userId), eq(resusGPSSessions.status, "completed")));

    const completedSessionIds = new Set(sessions.map((s) => s.sessionId));

    const userCases = await db
      .select()
      .from(resusGPSCases)
      .where(eq(resusGPSCases.userId, userId));

    const casesInCompletedSessions = userCases.filter((c) => completedSessionIds.has(c.sessionId));

    // One fellowship credit per completed session (case diagnosis overrides session primary)
    const creditBySession = new Map<string, string>();
    for (const s of sessions) {
      const condition = normalizeToFellowshipResusConditionId(s.primaryDiagnosis);
      if (isFellowshipMicrocourseResusCondition(condition)) {
        creditBySession.set(s.sessionId, condition);
      }
    }
    for (const c of casesInCompletedSessions) {
      const condition = normalizeToFellowshipResusConditionId(c.diagnosis);
      if (isFellowshipMicrocourseResusCondition(condition)) {
        creditBySession.set(c.sessionId, condition);
      }
    }

    const casesByCondition: Record<string, number> = {};
    for (const condition of creditBySession.values()) {
      casesByCondition[condition] = (casesByCondition[condition] || 0) + 1;
    }

    const casesCompleted = creditBySession.size;
    const conditionsWithThreshold = FELLOWSHIP_MICROCOURSE_RESUS_CONDITIONS.filter(
      (cond) => (casesByCondition[cond.id] ?? 0) >= 3
    ).length;
    const totalConditionsTaught = getFellowshipMicrocourseResusConditionCount();
    const percentage = Math.min(
      100,
      Math.round((conditionsWithThreshold / totalConditionsTaught) * 100)
    );
    const conditionBreakdown = FELLOWSHIP_MICROCOURSE_RESUS_CONDITIONS.map((cond) => {
      const count = casesByCondition[cond.id] ?? 0;
      const required = 3;
      return {
        id: cond.id,
        label: cond.label,
        count,
        required,
        remaining: Math.max(0, required - count),
        complete: count >= required,
      };
    });
    const casesStillNeeded = conditionBreakdown.reduce((sum, c) => sum + c.remaining, 0);
    const incompleteConditions = conditionBreakdown.filter((c) => !c.complete).length;

    return {
      casesCompleted,
      conditionsWithThreshold,
      totalConditionsTaught,
      percentage,
      casesByCondition,
      conditionBreakdown,
      casesStillNeeded,
      incompleteConditions,
    };
  } catch (error) {
    console.error("[Fellowship] Error calculating ResusGPS pillar:", error);
    return {
      casesCompleted: 0,
      conditionsWithThreshold: 0,
      totalConditionsTaught: getFellowshipMicrocourseResusConditionCount(),
      percentage: 0,
      casesByCondition: {} as Record<string, number>,
      conditionBreakdown: [] as Array<{
        id: string;
        label: string;
        count: number;
        required: number;
        remaining: number;
        complete: boolean;
      }>,
      casesStillNeeded: getFellowshipMicrocourseResusConditionCount() * 3,
      incompleteConditions: getFellowshipMicrocourseResusConditionCount(),
    };
  }
}

function formatCareSignalMonthLabel(monthKey: string): string {
  const year = Number(monthKey.slice(0, 4));
  const month = Number(monthKey.slice(5, 7));
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function calculateCareSignalPillar(userId: number) {
  const db = await getDb();
  if (!db) {
    return {
      streak: 0,
      eventsSubmitted: 0,
      reportsThisMonth: 0,
      percentage: 0,
      monthsRemaining: 24,
      monthlyTimeline: [] as Array<{
        monthKey: string;
        label: string;
        reportCount: number;
        isCurrentMonth: boolean;
      }>,
    };
  }

  try {
    const allEvents = await db.query.careSignalEvents.findMany({
      where: (events) => eq(events.userId, userId),
    });
    const eventsByMonth: Record<string, number> = {};
    const currentDate = new Date();
    const eatNow = new Date(currentDate.getTime() + 3 * 60 * 60 * 1000);
    const currentYear = eatNow.getUTCFullYear();
    const currentMonth = eatNow.getUTCMonth() + 1;
    const currentMonthKey = monthKeyEAT(currentYear, currentMonth);

    allEvents.forEach((event) => {
      const eventDate = new Date(event.eventDate);
      const eatEvent = new Date(eventDate.getTime() + 3 * 60 * 60 * 1000);
      const year = eatEvent.getUTCFullYear();
      const month = eatEvent.getUTCMonth() + 1;
      const key = monthKeyEAT(year, month);
      eventsByMonth[key] = (eventsByMonth[key] || 0) + 1;
    });

    const timelineKeys = computeCareSignalTimelineKeys(
      eventsByMonth,
      currentYear,
      currentMonth,
      24
    );
    const windowYears = [...new Set(timelineKeys.map((k) => Number(k.slice(0, 4))))];

    const graceUsage = await db.query.fellowshipGraceUsage.findMany({
      where: (grace) => and(eq(grace.userId, userId), inArray(grace.year, windowYears)),
    });

    const streak = computeCareSignalStreak({
      eventsByMonth,
      graceUsage: graceUsage.map((g) => ({ year: g.year, month: g.month })),
      anchorYear: currentYear,
      anchorMonth: currentMonth,
      windowMonths: 24,
      timelineKeys,
    });

    const reportsThisMonth = eventsByMonth[currentMonthKey] ?? 0;
    const percentage = Math.min(100, Math.round((streak / 24) * 100));
    const monthsRemaining = Math.max(0, 24 - streak);
    const displayTimelineKeys =
      timelineKeys.length > 0
        ? timelineKeys
        : enumerateMonthsEndingAt(currentYear, currentMonth, 24);
    const monthlyTimeline = displayTimelineKeys.map((monthKey) => ({
      monthKey,
      label: formatCareSignalMonthLabel(monthKey),
      reportCount: eventsByMonth[monthKey] ?? 0,
      isCurrentMonth: monthKey === currentMonthKey,
    }));

    return {
      streak,
      eventsSubmitted: allEvents.length,
      reportsThisMonth,
      percentage,
      monthsRemaining,
      monthlyTimeline,
    };
  } catch (error) {
    console.error("[Fellowship] Error calculating Care Signal pillar:", error);
    return {
      streak: 0,
      eventsSubmitted: 0,
      reportsThisMonth: 0,
      percentage: 0,
      monthsRemaining: 24,
      monthlyTimeline: [],
    };
  }
}

export async function calculateFellowshipStatus(userId: number) {
  const coursesPillar = await calculateCoursesPillar(userId);
  const resusGPSPillar = await calculateResusGPSPillar(userId);
  const careSignalPillar = await calculateCareSignalPillar(userId);

  const isQualified =
    coursesPillar.percentage === 100 &&
    resusGPSPillar.percentage === 100 &&
    careSignalPillar.percentage === 100;

  const overallPercentage = Math.round(
    (coursesPillar.percentage + resusGPSPillar.percentage + careSignalPillar.percentage) / 3
  );

  return {
    coursesPillar,
    resusGPSPillar,
    careSignalPillar,
    isQualified,
    overallPercentage,
  };
}

/** Upsert `fellowshipProgress` from live pillar calculations. */
export async function syncFellowshipProgressForUser(userId: number) {
  const status = await calculateFellowshipStatus(userId);
  const existing = await getFellowshipProgress(userId);
  const now = new Date();

  const qualifiedAt =
    status.isQualified && !existing?.isQualified
      ? now
      : existing?.qualifiedAt ?? (status.isQualified ? now : null);

  const patch = {
    totalCoursesRequired: status.coursesPillar.required,
    coursesCompleted: status.coursesPillar.completed,
    coursesPercentage: status.coursesPillar.percentage,
    resusGPSCasesCompleted: status.resusGPSPillar.casesCompleted,
    conditionsWithThreshold: status.resusGPSPillar.conditionsWithThreshold,
    totalConditionsTaught: status.resusGPSPillar.totalConditionsTaught,
    resusGPSPercentage: status.resusGPSPillar.percentage,
    careSignalStreak: status.careSignalPillar.streak,
    careSignalEventsSubmitted: status.careSignalPillar.eventsSubmitted,
    careSignalPercentage: status.careSignalPillar.percentage,
    isQualified: status.isQualified,
    qualifiedAt,
    overallPercentage: status.overallPercentage,
    updatedAt: now,
  };

  if (existing) {
    await updateFellowshipProgress(userId, patch);
  } else {
    await createFellowshipProgress({ userId, ...patch });
  }

  return { status, created: !existing };
}

/** User IDs for batch sync (individual providers). */
export async function listUserIdsForFellowshipSync(options: {
  limit: number;
  offset: number;
  onlyWithActivity?: boolean;
}): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  if (!options.onlyWithActivity) {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.userType, "individual"))
      .orderBy(users.id)
      .limit(options.limit)
      .offset(options.offset);
    return rows.map((r) => r.id);
  }

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const idSet = new Set<number>();

  const [microRows, careRows, resusRows, enrollRows] = await Promise.all([
    db
      .selectDistinct({ userId: microCourseEnrollments.userId })
      .from(microCourseEnrollments)
      .where(gte(microCourseEnrollments.updatedAt, since)),
    db
      .selectDistinct({ userId: careSignalEvents.userId })
      .from(careSignalEvents)
      .where(gte(careSignalEvents.createdAt, since)),
    db
      .selectDistinct({ userId: resusGPSSessions.userId })
      .from(resusGPSSessions)
      .where(gte(resusGPSSessions.updatedAt, since)),
    db
      .selectDistinct({ userId: enrollments.userId })
      .from(enrollments)
      .where(gte(enrollments.updatedAt, since)),
  ]);

  for (const r of [...microRows, ...careRows, ...resusRows, ...enrollRows]) {
    if (r.userId != null) idSet.add(r.userId);
  }

  const sorted = [...idSet].sort((a, b) => a - b);
  return sorted.slice(options.offset, options.offset + options.limit);
}

export async function syncFellowshipProgressBatch(options: {
  limit: number;
  offset: number;
  onlyWithActivity?: boolean;
}) {
  const userIds = await listUserIdsForFellowshipSync(options);
  let succeeded = 0;
  const errors: Array<{ userId: number; message: string }> = [];

  for (const userId of userIds) {
    try {
      await syncFellowshipProgressForUser(userId);
      succeeded++;
    } catch (e) {
      errors.push({
        userId,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { processed: userIds.length, succeeded, errors };
}

/** Nightly job: refresh active learners' fellowship rows. */
export async function runScheduledFellowshipProgressSync() {
  const batchSize = Number(process.env.FELLOWSHIP_SYNC_BATCH_SIZE ?? 200);
  let offset = 0;
  let totalSucceeded = 0;
  let totalProcessed = 0;

  for (;;) {
    const batch = await syncFellowshipProgressBatch({
      limit: batchSize,
      offset,
      onlyWithActivity: true,
    });
    totalProcessed += batch.processed;
    totalSucceeded += batch.succeeded;
    if (batch.processed < batchSize) break;
    offset += batchSize;
  }

  return { totalProcessed, totalSucceeded };
}

/** Providers with no `fellowshipProgress` row (admin radar). */
export async function listProvidersWithoutFellowshipProgress(options: {
  limit: number;
  offset: number;
  search?: string;
  withActivityOnly?: boolean;
}) {
  const db = await getDb();
  if (!db) return { rows: [], total: 0 };

  const rawSearch = options.search?.trim().replace(/[%_\\]/g, "") ?? "";
  const searchPattern = rawSearch.length > 0 ? `%${rawSearch}%` : null;

  const baseParts = [eq(users.userType, "individual"), isNull(fellowshipProgress.id)];
  if (searchPattern) {
    const searchOr = or(like(users.email, searchPattern), like(users.name, searchPattern));
    if (searchOr) baseParts.push(searchOr);
  }
  const whereBase = baseParts.length === 1 ? baseParts[0] : and(...baseParts);

  let candidateIds: number[] | null = null;
  if (options.withActivityOnly) {
    const idSet = new Set<number>();
    const [microRows, careRows, resusRows, enrollRows] = await Promise.all([
      db.selectDistinct({ userId: microCourseEnrollments.userId }).from(microCourseEnrollments),
      db.selectDistinct({ userId: careSignalEvents.userId }).from(careSignalEvents),
      db.selectDistinct({ userId: resusGPSSessions.userId }).from(resusGPSSessions),
      db.selectDistinct({ userId: enrollments.userId }).from(enrollments),
    ]);
    for (const r of [...microRows, ...careRows, ...resusRows, ...enrollRows]) {
      if (r.userId != null) idSet.add(r.userId);
    }
    candidateIds = [...idSet];
    if (candidateIds.length === 0) return { rows: [], total: 0 };
  }

  const whereCombined =
    candidateIds && candidateIds.length > 0
      ? and(whereBase, inArray(users.id, candidateIds))
      : whereBase;

  const countBase = db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .leftJoin(fellowshipProgress, eq(users.id, fellowshipProgress.userId));
  const countRow = await countBase.where(whereCombined);
  const total = Number(countRow[0]?.count ?? 0);

  const listBase = db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userCreatedAt: users.createdAt,
    })
    .from(users)
    .leftJoin(fellowshipProgress, eq(users.id, fellowshipProgress.userId));

  const rows = await listBase
    .where(whereCombined)
    .orderBy(desc(users.createdAt))
    .limit(options.limit)
    .offset(options.offset);

  return { rows, total };
}
