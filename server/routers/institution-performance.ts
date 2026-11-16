import { TRPCError } from "@trpc/server";
import { and, eq, gte, inArray, isNull, lte, notInArray } from "drizzle-orm";
import { z } from "zod";
import {
  cpdAttendees,
  cpdEventCoPresenters,
  cpdEvents,
  facilityDepartments,
  institutionalQiActions,
  institutionalQiReports,
  institutionalStaffMembers,
  professionalCredentials,
} from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { getCredentialAccess } from "./institution-accountability";
import type { AppDb } from "../lib/institution-access";

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
const periodTypes = ["monthly", "quarterly", "annual"] as const;

type SourceState = "available" | "unavailable" | "empty";

type SourceResult<T> = {
  status: SourceState;
  data: T;
};

function eatDateKey(date: Date): string {
  return new Date(date.getTime() + EAT_OFFSET_MS).toISOString().slice(0, 10);
}

function periodBounds(periodType: (typeof periodTypes)[number], now = new Date()) {
  const eatNow = new Date(now.getTime() + EAT_OFFSET_MS);
  const year = eatNow.getUTCFullYear();
  const month = eatNow.getUTCMonth();
  const startMonth = periodType === "annual" ? 0 : periodType === "quarterly" ? Math.floor(month / 3) * 3 : month;
  const start = new Date(Date.UTC(year, startMonth, 1) - EAT_OFFSET_MS);
  const end = periodType === "annual"
    ? new Date(Date.UTC(year + 1, 0, 1) - EAT_OFFSET_MS - 1)
    : periodType === "quarterly"
      ? new Date(Date.UTC(year, startMonth + 3, 1) - EAT_OFFSET_MS - 1)
      : new Date(Date.UTC(year, startMonth + 1, 1) - EAT_OFFSET_MS - 1);
  return { start, end, periodStart: eatDateKey(start), periodEnd: eatDateKey(end) };
}

function requireDb(): Promise<AppDb> {
  return getDb().then(db => {
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed." });
    return db;
  });
}

async function source<T>(
  label: string,
  load: () => Promise<T>,
  empty: (value: T) => boolean,
): Promise<SourceResult<T>> {
  try {
    const data = await load();
    return { status: empty(data) ? "empty" : "available", data };
  } catch (error) {
    console.warn(`[institution-performance] ${label} source unavailable`, error);
    return { status: "unavailable", data: [] as T };
  }
}

export const institutionPerformanceRouter = router({
  /**
   * Read-only institutional source contract. Each domain is loaded independently
   * so a stale or unavailable source never turns the whole performance view into
   * a false zero or a blank institution.
   */
  getSourceSnapshot: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      periodType: z.enum(periodTypes).default("quarterly"),
    }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const access = await getCredentialAccess(db, ctx.user, input.institutionId);
      const period = periodBounds(input.periodType);
      const scope = access.departmentIds;
      const staff = await db
        .select({ id: institutionalStaffMembers.id, userId: institutionalStaffMembers.userId, facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId, department: institutionalStaffMembers.department })
        .from(institutionalStaffMembers)
        .where(and(
          eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
          isNull(institutionalStaffMembers.removedAt),
          scope ? inArray(institutionalStaffMembers.facilityDepartmentId, scope) : undefined,
        ));
      const staffIds = staff.map(row => row.userId).filter((id): id is number => id != null);
      const departmentScope = scope ? inArray(facilityDepartments.id, scope) : undefined;

      const [departmentSource, cpdSource, qiSource, credentialSource] = await Promise.all([
        source("departments", async () => db
          .select({ id: facilityDepartments.id, name: facilityDepartments.departmentName })
          .from(facilityDepartments)
          .where(and(eq(facilityDepartments.institutionId, input.institutionId), eq(facilityDepartments.isActive, true), departmentScope)), value => Array.isArray(value) && value.length === 0),
        source("cpd", async () => {
          const events = await db.select({ id: cpdEvents.id, presenterUserId: cpdEvents.presenterUserId, presenterName: cpdEvents.presenterName, facilityDepartmentId: cpdEvents.facilityDepartmentId, eventDateAt: cpdEvents.eventDateAt })
            .from(cpdEvents)
            .where(and(eq(cpdEvents.institutionalAccountId, input.institutionId), gte(cpdEvents.eventDateAt, period.start), lte(cpdEvents.eventDateAt, period.end), notInArray(cpdEvents.lifecycleStatus, ["cancelled", "voided", "archived"])));
          const eventIds = events.map(event => event.id);
          if (!eventIds.length) return { events: 0, verifiedAttendance: 0, unresolvedAttendance: 0, leadPresenters: 0, coPresenters: 0 };
          const [attendees, coPresenters] = await Promise.all([
            db.select({ userId: cpdAttendees.userId, attendanceStatus: cpdAttendees.attendanceStatus }).from(cpdAttendees).where(and(eq(cpdAttendees.institutionalAccountId, input.institutionId), inArray(cpdAttendees.cpdEventId, eventIds))),
            db.select({ id: cpdEventCoPresenters.id }).from(cpdEventCoPresenters).where(and(eq(cpdEventCoPresenters.institutionalAccountId, input.institutionId), inArray(cpdEventCoPresenters.cpdEventId, eventIds))),
          ]);
          const verified = attendees.filter(row => row.attendanceStatus === "attendance_verified");
          return { events: events.length, verifiedAttendance: verified.length, unresolvedAttendance: verified.filter(row => row.userId == null).length, leadPresenters: events.filter(row => row.presenterUserId != null || Boolean(row.presenterName?.trim())).length, coPresenters: coPresenters.length };
        }, value => !value || value.events === 0),
        source("quality", async () => {
          const [reports, actions] = await Promise.all([
            db.select({ severity: institutionalQiReports.severity, status: institutionalQiReports.status }).from(institutionalQiReports).where(eq(institutionalQiReports.institutionalAccountId, input.institutionId)),
            db.select({ dueAt: institutionalQiActions.dueAt, status: institutionalQiActions.status }).from(institutionalQiActions).where(eq(institutionalQiActions.institutionalAccountId, input.institutionId)),
          ]);
          const openReports = reports.filter(row => row.status !== "closed").length;
          const highSeverityOpenReports = reports.filter(row => row.status !== "closed" && ["severe", "critical"].includes(row.severity)).length;
          const overdueActions = actions.filter(row => ["open", "in_progress"].includes(row.status) && row.dueAt != null && row.dueAt.getTime() < Date.now()).length;
          return { reports: reports.length, openReports, highSeverityOpenReports, actions: actions.length, overdueActions };
        }, value => !value || (value.reports === 0 && value.actions === 0)),
        source("credentials", async () => {
          if (!staffIds.length) return { linkedStaff: 0, verified: 0, expiringWithin90Days: 0, expired: 0 };
          const rows = await db.select({ userId: professionalCredentials.userId, status: professionalCredentials.status, expiresAt: professionalCredentials.expiresAt }).from(professionalCredentials).where(inArray(professionalCredentials.userId, staffIds));
          const now = Date.now();
          const horizon = now + 90 * 24 * 60 * 60 * 1000;
          return { linkedStaff: new Set(rows.map(row => row.userId)).size, verified: rows.filter(row => row.status === "verified").length, expiringWithin90Days: rows.filter(row => row.status === "verified" && row.expiresAt != null && row.expiresAt.getTime() > now && row.expiresAt.getTime() <= horizon).length, expired: rows.filter(row => row.status === "verified" && row.expiresAt != null && row.expiresAt.getTime() <= now).length };
        }, value => !value || value.linkedStaff === 0),
      ]);

      return {
        institutionId: input.institutionId,
        access: { role: access.role, canViewIndividuals: access.canViewIndividuals },
        period: { type: input.periodType, periodStart: period.periodStart, periodEnd: period.periodEnd, timezone: "Africa/Nairobi" },
        roster: { status: staff.length ? "available" : "empty", activeStaff: staff.length, canonicalDepartmentStaff: staff.filter(row => row.facilityDepartmentId != null).length, unassignedStaff: staff.filter(row => row.facilityDepartmentId == null).length },
        sources: { departments: departmentSource, cpd: cpdSource, quality: qiSource, credentials: credentialSource },
        generatedAt: new Date().toISOString(),
      };
    }),
});
