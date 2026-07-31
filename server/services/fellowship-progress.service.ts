/**
 * Fellowship pillar calculations + denormalized `fellowshipProgress` sync.
 * Single source of truth for live UX and admin ledger rows.
 */
import { and, desc, eq, gte, inArray, isNull, like, or, sql } from "drizzle-orm";
import { getDb, getFellowshipProgress, createFellowshipProgress, updateFellowshipProgress, getFellowshipTokenByTokenId, updateFellowshipToken } from "../db";
import {
  certificates,
  microCourseEnrollments,
  microCourses,
  resusGPSSessions,
  resusGPSCases,
  careSignalEvents,
  fellowshipGraceUsage,
  fellowshipProgress,
  users,
  enrollments,
  cpdCodeRevealLogs,
  institutionalStaffMembers,
  trainingAttendance,
  trainingSchedules,
  courses,
} from "../../drizzle/schema";
import {
  getFellowshipPillarACourseStatus,
  FELLOWSHIP_REQUIRED_COURSES,
  type FellowshipPillarACourseStatus,
} from "../lib/fellowship-phase2-completion";
import {
  computeCareSignalStreak,
  computeCareSignalTimelineKeys,
  enumerateMonthsEndingAt,
  monthKeyEAT,
} from "../routers/fellowship-care-signal-streak";
import {
  FELLOWSHIP_PILLAR_MICRO_COURSE_IDS,
  getFellowshipMicroCourseRequiredCount,
} from "../lib/micro-course-catalog";
import {
  FELLOWSHIP_MICROCOURSE_RESUS_CONDITIONS,
  computeResusGpsPillarPercentage,
  getFellowshipMicrocourseResusConditionCount,
  isFellowshipMicrocourseResusCondition,
  normalizeToFellowshipResusConditionId,
} from "../../shared/fellowship-microcourse-resus-conditions";

export type FellowshipPillarStatus = Awaited<ReturnType<typeof calculateFellowshipStatus>>;

export type CoursesPillarResult = {
  completed: number;
  required: number;
  percentage: number;
  legacyCourses: number;
  phase2: FellowshipPillarACourseStatus;
};

export async function calculateCoursesPillar(userId: number): Promise<CoursesPillarResult> {
  const db = await getDb();
  const totalRequired = getFellowshipMicroCourseRequiredCount();
  const emptyPhase2: FellowshipPillarACourseStatus = {
    courses: FELLOWSHIP_REQUIRED_COURSES.map((course) => ({
      course,
      met: false,
      cognitiveComplete: false,
      ahaPrecourseComplete: false,
      teamMemberSessionsPassed: 0,
      teamLeaderSessionsPassed: 0,
      grandfathered: false,
    })),
    met: false,
  };
  if (!db) {
    return { completed: 0, required: totalRequired, percentage: 0, legacyCourses: 0, phase2: emptyPhase2 };
  }

  try {
    const completedCerts = await db.query.certificates.findMany({
      where: (certs) => eq(certs.userId, userId),
    });
    const pillarIds = new Set(FELLOWSHIP_PILLAR_MICRO_COURSE_IDS);
    const completedMicroRows = await db
      .select({ courseId: microCourses.courseId })
      .from(microCourseEnrollments)
      .innerJoin(microCourses, eq(microCourseEnrollments.microCourseId, microCourses.id))
      .where(
        and(
          eq(microCourseEnrollments.userId, userId),
          eq(microCourseEnrollments.enrollmentStatus, "completed")
        )
      );
    const legacyCourses = completedCerts.filter((c) =>
      ["bls", "acls", "pals", "instructor"].includes(c.programType)
    ).length;
    const completed = completedMicroRows.filter((r) => pillarIds.has(r.courseId)).length;

    // Phase 2 (North Star v2.1 addendum §1 as corrected): BLS+ACLS+PALS+NRP
    // course-completion status, joined via the learner's institutional
    // staff record(s) -- trainingAttendance is keyed by staffMemberId, not
    // userId directly, since Phase 2 simulations run through the same
    // Cohort Program session infrastructure regardless of whether the
    // attendee happens to also be pursuing Fellowship (CEO decision,
    // 2026-07-29: "this rule doesn't change because someone is doing
    // fellowship"). A user can have more than one staff-member record
    // (changed institutions), so this aggregates across all of them.
    const fellowshipEnrollments = await db.query.enrollments.findMany({
      where: (e) => and(eq(e.userId, userId), inArray(e.programType, [...FELLOWSHIP_REQUIRED_COURSES])),
    });
    const staffMemberRows = await db
      .select({ id: institutionalStaffMembers.id })
      .from(institutionalStaffMembers)
      .where(eq(institutionalStaffMembers.userId, userId));
    const staffMemberIds = staffMemberRows.map((r) => r.id);
    const attendanceRows = staffMemberIds.length
      ? await db
          .select({
            coursesProgramType: courses.programType,
            simulationRole: trainingAttendance.simulationRole,
            simulationCompetencyPassed: trainingAttendance.simulationCompetencyPassed,
          })
          .from(trainingAttendance)
          .innerJoin(trainingSchedules, eq(trainingAttendance.trainingScheduleId, trainingSchedules.id))
          .innerJoin(courses, eq(trainingSchedules.courseId, courses.id))
          .where(inArray(trainingAttendance.staffMemberId, staffMemberIds))
      : [];

    const phase2 = getFellowshipPillarACourseStatus(
      fellowshipEnrollments.map((e) => ({
        programType: e.programType,
        cognitiveModulesComplete: e.cognitiveModulesComplete,
        ahaPrecourseCompleted: e.ahaPrecourseCompleted ?? false,
        fellowshipGrandfathered: e.fellowshipGrandfathered ?? false,
      })),
      attendanceRows
    );
    const phase2CoursesMet = phase2.courses.filter((c) => c.met).length;

    // Blended total: micro-courses (29) + the 4 required-course Phase 2
    // statuses, as one combined item count -- not an average of two
    // percentages. This means 100% is reachable only when BOTH streams
    // are individually complete; there's no way to "make up" a Phase 2
    // shortfall with extra micro-courses or vice versa, since each side
    // is capped at its own required count.
    const combinedRequired = totalRequired + FELLOWSHIP_REQUIRED_COURSES.length;
    const combinedCompleted = completed + phase2CoursesMet;
    const percentage = Math.min(100, Math.round((combinedCompleted / combinedRequired) * 100));

    return { completed, required: totalRequired, percentage, legacyCourses, phase2 };
  } catch (error) {
    console.error("[Fellowship] Error calculating courses pillar:", error);
    return { completed: 0, required: totalRequired, percentage: 0, legacyCourses: 0, phase2: emptyPhase2 };
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
    const percentage = computeResusGpsPillarPercentage(casesByCondition, totalConditionsTaught);
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

type CareSignalPillarResult = {
  streak: number;
  eventsSubmitted: number;
  reportsThisMonth: number;
  percentage: number;
  monthsRemaining: number;
  monthlyTimeline: Array<{
    monthKey: string;
    label: string;
    reportCount: number;
    isCurrentMonth: boolean;
  }>;
};

function emptyCareSignalPillarResult(): CareSignalPillarResult {
  return {
    streak: 0,
    eventsSubmitted: 0,
    reportsThisMonth: 0,
    percentage: 0,
    monthsRemaining: 24,
    monthlyTimeline: [],
  };
}

/**
 * Shared streak/percentage math for Care Signal Pillar C, independent of
 * whether the events came from a `userId` (named) or a `fellowshipTokenId`
 * (pseudonymous, gap-analysis #10) query. Extracted so the two identity
 * paths can never silently compute this differently.
 */
export function computeCareSignalPillarFromEvents(
  allEvents: Array<{ eventDate: Date | string }>,
  graceUsage: Array<{ year: number; month: number }>
): CareSignalPillarResult {
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

  const timelineKeys = computeCareSignalTimelineKeys(eventsByMonth, currentYear, currentMonth, 24);

  const streak = computeCareSignalStreak({
    eventsByMonth,
    graceUsage,
    anchorYear: currentYear,
    anchorMonth: currentMonth,
    windowMonths: 24,
    timelineKeys,
  });

  const reportsThisMonth = eventsByMonth[currentMonthKey] ?? 0;
  const percentage = Math.min(100, Math.round((streak / 24) * 100));
  const monthsRemaining = Math.max(0, 24 - streak);
  const displayTimelineKeys =
    timelineKeys.length > 0 ? timelineKeys : enumerateMonthsEndingAt(currentYear, currentMonth, 24);
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
}

export async function calculateCareSignalPillar(userId: number): Promise<CareSignalPillarResult> {
  const db = await getDb();
  if (!db) return emptyCareSignalPillarResult();

  try {
    const namedEvents = await db.query.careSignalEvents.findMany({
      where: (events) => eq(events.userId, userId),
    });

    // Merge in Care Signal events submitted under any pseudonymous
    // Fellowship token(s) this provider has since explicitly linked to
    // their real account (fellowship.linkPseudonymousToken). Closes a
    // gap documented since item #10 shipped (2026-07-15): "no merge/dedup
    // logic if a provider contributes via both a named account and a
    // separately linked token" — in practice this meant a linked token's
    // Care Signal history was tracked on the fellowshipTokens row itself
    // (see syncFellowshipTokenProgress) but never actually counted toward
    // the provider's real Fellowship qualification once linked, which is
    // the opposite of what linking is supposed to achieve. No double-
    // counting risk in this union: a careSignalEvents row has either
    // userId XOR fellowshipTokenId set, never both (submission mode is
    // fixed at filing time — see care-signal-events.ts), so a report
    // can appear in at most one of these two queries.
    const linkedTokens = await db.query.fellowshipTokens.findMany({
      where: (tokens) => eq(tokens.linkedUserId, userId),
    });
    const linkedTokenEvents = linkedTokens.length
      ? await db.query.careSignalEvents.findMany({
          where: (events) =>
            inArray(
              events.fellowshipTokenId,
              linkedTokens.map((t) => t.tokenId)
            ),
        })
      : [];

    const allEvents = [...namedEvents, ...linkedTokenEvents];

    const eatNow = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const currentYear = eatNow.getUTCFullYear();
    const currentMonth = eatNow.getUTCMonth() + 1;
    const eventsByMonthForGraceLookup: Record<string, number> = {};
    allEvents.forEach((event) => {
      const eatEvent = new Date(new Date(event.eventDate).getTime() + 3 * 60 * 60 * 1000);
      const key = monthKeyEAT(eatEvent.getUTCFullYear(), eatEvent.getUTCMonth() + 1);
      eventsByMonthForGraceLookup[key] = (eventsByMonthForGraceLookup[key] || 0) + 1;
    });
    const timelineKeys = computeCareSignalTimelineKeys(
      eventsByMonthForGraceLookup,
      currentYear,
      currentMonth,
      24
    );
    const windowYears = [...new Set(timelineKeys.map((k) => Number(k.slice(0, 4))))];

    // Grace usage stays userId-keyed only — a still-documented, narrower
    // simplification (see calculateCareSignalPillarForToken's doc
    // comment): a pseudonymous streak gets no manual grace exceptions
    // before linking. Once linked, this function is what actually counts
    // the token's history, but any grace exception a provider needed
    // *during* the pseudonymous period still can't be granted
    // retroactively — that's a separate, smaller gap than the one this
    // fix closes, and is left as-is rather than silently expanded here.
    const graceUsage = await db.query.fellowshipGraceUsage.findMany({
      // requirementType filter added when CPD grace joined this table
      // (North Star v2.1 addendum §3) -- without it, a CPD grace row would
      // silently also count toward the Care Signal streak, defeating the
      // whole point of giving each an independent budget.
      where: (grace) =>
        and(eq(grace.userId, userId), eq(grace.requirementType, "care_signal"), inArray(grace.year, windowYears)),
    });

    return computeCareSignalPillarFromEvents(
      allEvents,
      graceUsage.map((g) => ({ year: g.year, month: g.month }))
    );
  } catch (error) {
    console.error("[Fellowship] Error calculating Care Signal pillar:", error);
    return emptyCareSignalPillarResult();
  }
}

/**
 * CPD's own Pillar C stream (North Star v2.1 addendum §3, joined
 * 2026-07-30): 1 qualifying CPD session per month, sharing Care Signal's
 * streak/grace algorithm as a template but with its own independent grace
 * budget (fellowshipGraceUsage.requirementType = 'cpd'). Deliberately
 * reuses computeCareSignalPillarFromEvents unmodified rather than forking
 * the streak math -- the function was always generic (month-keyed event
 * counts + grace rows in, streak/percentage/timeline out), so there's
 * nothing Care-Signal-specific to strip out.
 *
 * "First session of the month counts" (CEO decision, 2026-07-29): a
 * cpdCodeRevealLogs row is created the moment a user claims/reveals their
 * CPD code for an event they attended (server/routers/cpd.ts) -- one row
 * per (user, event). If a user attends more than one CPD event in the
 * same month, computeCareSignalPillarFromEvents's monthly event COUNT
 * would show >1, but the streak algorithm only checks whether a month has
 * >=1 event, not how many -- so extra sessions in a month don't add value
 * beyond the first, which is exactly the intended rule.
 */
export async function calculateCpdPillar(userId: number): Promise<CareSignalPillarResult> {
  const db = await getDb();
  if (!db) return emptyCareSignalPillarResult();

  try {
    const revealLogs = await db.query.cpdCodeRevealLogs.findMany({
      where: (logs) => eq(logs.userId, userId),
    });
    const allEvents = revealLogs.map((log) => ({ eventDate: log.revealedAt }));

    const eatNow = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const currentYear = eatNow.getUTCFullYear();
    const currentMonth = eatNow.getUTCMonth() + 1;
    const eventsByMonthForGraceLookup: Record<string, number> = {};
    allEvents.forEach((event) => {
      const eatEvent = new Date(new Date(event.eventDate).getTime() + 3 * 60 * 60 * 1000);
      const key = monthKeyEAT(eatEvent.getUTCFullYear(), eatEvent.getUTCMonth() + 1);
      eventsByMonthForGraceLookup[key] = (eventsByMonthForGraceLookup[key] || 0) + 1;
    });
    const timelineKeys = computeCareSignalTimelineKeys(eventsByMonthForGraceLookup, currentYear, currentMonth, 24);
    const windowYears = [...new Set(timelineKeys.map((k) => Number(k.slice(0, 4))))];

    const graceUsage = await db.query.fellowshipGraceUsage.findMany({
      where: (grace) =>
        and(eq(grace.userId, userId), eq(grace.requirementType, "cpd"), inArray(grace.year, windowYears)),
    });

    return computeCareSignalPillarFromEvents(
      allEvents,
      graceUsage.map((g) => ({ year: g.year, month: g.month }))
    );
  } catch (error) {
    console.error("[Fellowship] Error calculating CPD pillar:", error);
    return emptyCareSignalPillarResult();
  }
}

/**
 * Token-keyed variant of calculateCareSignalPillar, for §5.5 Layer 2
 * pseudonymous submissions (gap-analysis #10). Queries by
 * `fellowshipTokenId` instead of `userId` — these events have `userId`
 * NULL, so the userId-keyed function above would never find them.
 *
 * KNOWN SIMPLIFICATION (documented, not silently assumed): grace-period
 * usage (`fellowshipGraceUsage`) is keyed by userId and isn't extended to
 * tokens — a pseudonymous streak gets no manual grace exceptions before
 * the token is linked to a real account. This only matters for providers
 * who'd otherwise qualify for a grace exception; flagged as a follow-up
 * if pseudonymous adoption is high enough for this to matter in practice.
 */
export async function calculateCareSignalPillarForToken(
  tokenId: string
): Promise<CareSignalPillarResult> {
  const db = await getDb();
  if (!db) return emptyCareSignalPillarResult();

  try {
    const allEvents = await db.query.careSignalEvents.findMany({
      where: (events) => eq(events.fellowshipTokenId, tokenId),
    });
    return computeCareSignalPillarFromEvents(allEvents, []);
  } catch (error) {
    console.error("[Fellowship] Error calculating Care Signal pillar for token:", error);
    return emptyCareSignalPillarResult();
  }
}

export async function calculateFellowshipStatus(userId: number): Promise<{
  coursesPillar: CoursesPillarResult;
  resusGPSPillar: Awaited<ReturnType<typeof calculateResusGPSPillar>>;
  careSignalPillar: CareSignalPillarResult & { cpd: CareSignalPillarResult };
  isQualified: boolean;
  overallPercentage: number;
}> {
  const coursesPillar = await calculateCoursesPillar(userId);
  const resusGPSPillar = await calculateResusGPSPillar(userId);
  const careSignalOnly = await calculateCareSignalPillar(userId);
  const cpdOnly = await calculateCpdPillar(userId);

  // Pillar C, blended (North Star v2.1 addendum §3): CPD joined Care
  // Signal here, each with its own independent streak/grace budget --
  // "met" requires BOTH at 24/24, not either one alone or an average that
  // could paper over one stream lagging behind. All the existing
  // Care-Signal-specific fields below (streak, eventsSubmitted,
  // reportsThisMonth, monthsRemaining, monthlyTimeline) keep their
  // pre-existing meaning unchanged -- they were always Care Signal's own
  // numbers and still are. `percentage` is the one field whose meaning
  // changes: it now reflects the combined Pillar C total (both streams
  // averaged), matching the same "percentage is the authoritative combined
  // number, sub-fields carry the breakdown" pattern used for Pillar A
  // above. `cpd` is new -- CPD's full breakdown (its own streak,
  // monthlyTimeline, etc.), for the same kind of drill-down UI Pillar A's
  // `phase2` field is meant to feed.
  const careSignalPillar = {
    ...careSignalOnly,
    percentage: Math.min(100, Math.round((careSignalOnly.percentage + cpdOnly.percentage) / 2)),
    cpd: cpdOnly,
  };

  const isQualified =
    coursesPillar.percentage === 100 &&
    resusGPSPillar.percentage === 100 &&
    careSignalOnly.percentage === 100 &&
    cpdOnly.percentage === 100;

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

/**
 * Upsert `fellowshipTokens`' credit fields from live pillar calculation, for
 * §5.5 Layer 2 pseudonymous submissions (gap-analysis #10). Unlike
 * syncFellowshipProgressForUser, this only ever touches Pillar 3 (Care
 * Signal) — a token has no Courses or ResusGPS pillar, since those require
 * a named account. A token's "Fellowship status" is Care-Signal-only until
 * (and unless) it's linked to a real account via fellowship.linkToken.
 */
export async function syncFellowshipTokenProgress(tokenId: string) {
  const pillar = await calculateCareSignalPillarForToken(tokenId);
  const existing = await getFellowshipTokenByTokenId(tokenId);
  if (!existing) {
    throw new Error(`[Fellowship] syncFellowshipTokenProgress: unknown tokenId ${tokenId}`);
  }

  await updateFellowshipToken(tokenId, {
    careSignalStreak: pillar.streak,
    careSignalEventsSubmitted: pillar.eventsSubmitted,
    careSignalPercentage: pillar.percentage,
    lastSubmissionAt: new Date(),
  });

  return pillar;
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
