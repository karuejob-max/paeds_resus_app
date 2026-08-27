import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import {
  cpdAttendees,
  cpdEvents,
  enrollments,
  facilityDepartments,
  institutionLearningTargets,
  institutionalStaffMembers,
} from "../../drizzle/schema";
import type { getDb } from "../db";
import {
  computeInstitutionLearningAnalytics,
  LEARNING_PROGRAM_TYPES,
  type LearningPeriod,
} from "./institution-learning-analytics";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

type DashboardInput = {
  periodType: "monthly" | "quarterly" | "annual";
  periodStart?: string;
  periodEnd?: string;
};

function dateOnlyAsDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function resolveLearningPeriod(input: DashboardInput): LearningPeriod {
  if (input.periodStart && input.periodEnd) {
    return {
      periodType: input.periodType,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    };
  }
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const startMonth =
    input.periodType === "annual"
      ? 0
      : input.periodType === "quarterly"
        ? Math.floor(month / 3) * 3
        : month;
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end =
    input.periodType === "annual"
      ? new Date(Date.UTC(year + 1, 0, 0))
      : input.periodType === "quarterly"
        ? new Date(Date.UTC(year, startMonth + 3, 0))
        : new Date(Date.UTC(year, startMonth + 1, 0));
  return {
    periodType: input.periodType,
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  };
}

export async function loadInstitutionLearningDashboard(
  db: Db,
  institutionId: number,
  input: DashboardInput,
  allowedDepartmentIds: number[] | null,
  options: {
    includeIndividualDetails?: boolean;
    includeContactDetails?: boolean;
  } = {},
) {
  const period = resolveLearningPeriod(input);
  const [events, attendees, departments, staff, enrollmentRows, targets] =
    await Promise.all([
      db
        .select()
        .from(cpdEvents)
        .where(eq(cpdEvents.institutionalAccountId, institutionId)),
      db
        .select()
        .from(cpdAttendees)
        .where(eq(cpdAttendees.institutionalAccountId, institutionId)),
      db
        .select({
          id: facilityDepartments.id,
          departmentName: facilityDepartments.departmentName,
        })
        .from(facilityDepartments)
        .where(
          and(
            eq(facilityDepartments.institutionId, institutionId),
            eq(facilityDepartments.isActive, true)
          )
        )
        .orderBy(asc(facilityDepartments.departmentName)),
      db
        .select({
          id: institutionalStaffMembers.id,
          userId: institutionalStaffMembers.userId,
          fullName: institutionalStaffMembers.staffName,
          email: institutionalStaffMembers.staffEmail,
          staffRole: institutionalStaffMembers.staffRole,
          department: institutionalStaffMembers.department,
          facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId,
          assignedCourses: institutionalStaffMembers.assignedCourses,
          phaseStatus: institutionalStaffMembers.phaseStatus,
        })
        .from(institutionalStaffMembers)
        .where(
          and(
            eq(institutionalStaffMembers.institutionalAccountId, institutionId),
            sql`${institutionalStaffMembers.removedAt} IS NULL`
          )
        ),
      db
        .select({
          userId: enrollments.userId,
          programType: enrollments.programType,
          cognitiveModulesComplete: enrollments.cognitiveModulesComplete,
          practicalSkillsSignedOff: enrollments.practicalSkillsSignedOff,
          createdAt: enrollments.createdAt,
        })
        .from(enrollments)
        .where(inArray(enrollments.programType, [...LEARNING_PROGRAM_TYPES])),
      db
        .select()
        .from(institutionLearningTargets)
        .where(
          and(
            eq(
              institutionLearningTargets.institutionalAccountId,
              institutionId
            ),
            eq(institutionLearningTargets.status, "active"),
            lte(
              institutionLearningTargets.periodStart,
              dateOnlyAsDate(period.periodEnd)
            ),
            gte(
              institutionLearningTargets.periodEnd,
              dateOnlyAsDate(period.periodStart)
            )
          )
        )
        .orderBy(
          desc(institutionLearningTargets.periodStart),
          asc(institutionLearningTargets.id)
        ),
    ]);

  const staffInScope = allowedDepartmentIds
    ? staff.filter(
        row =>
          row.facilityDepartmentId != null &&
          allowedDepartmentIds.includes(row.facilityDepartmentId)
      )
    : staff;
  const staffUserIds = new Set(
    staffInScope.map(row => row.userId).filter((id): id is number => id != null)
  );
  const eventsInScope = allowedDepartmentIds
    ? events.filter(
        event =>
          event.facilityDepartmentId == null ||
          allowedDepartmentIds.includes(event.facilityDepartmentId)
      )
    : events;
  const eventIdsInScope = new Set(eventsInScope.map(event => event.id));
  const attendeesInScope = allowedDepartmentIds
    ? attendees.filter(attendee => eventIdsInScope.has(attendee.cpdEventId))
    : attendees;
  const departmentsInScope = allowedDepartmentIds
    ? departments.filter(department =>
        allowedDepartmentIds.includes(department.id)
      )
    : departments;
  const targetsInScope = allowedDepartmentIds
    ? targets.filter(
        target =>
          target.targetScope === "facility" ||
          (target.departmentId != null &&
            allowedDepartmentIds.includes(target.departmentId)) ||
          (target.userId != null && staffUserIds.has(target.userId))
      )
    : targets;

  const report = computeInstitutionLearningAnalytics({
    period,
    events: eventsInScope as any,
    attendees: attendeesInScope as any,
    staff: staffInScope as any,
    departments: departmentsInScope,
    enrollments: enrollmentRows.filter(row =>
      staffUserIds.has(row.userId)
    ) as any,
    targets: targetsInScope as any,
  });
  const includeIndividualDetails = options.includeIndividualDetails !== false;
  const includeContactDetails = options.includeContactDetails === true;
  return {
    ...report,
    individuals: includeIndividualDetails
      ? report.individuals.map(row => ({
          ...row,
          email: includeContactDetails ? row.email : "",
        }))
      : [],
    courses: includeIndividualDetails
      ? report.courses.map(row => ({
          ...row,
          email: includeContactDetails ? row.email : "",
        }))
      : [],
    individualDetailRestricted: !includeIndividualDetails,
    contactDetailRestricted: !includeContactDetails,
  };
}
