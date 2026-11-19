import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, isNull, lte, notInArray } from "drizzle-orm";
import { z } from "zod";
import {
  cpdAttendees,
  cpdEventCoPresenters,
  cpdEvents,
  facilityDepartments,
  institutionalPerformanceReports,
  institutionalQiActions,
  institutionalQiReports,
  institutionalStaffMembers,
  professionalCredentials,
  users,
} from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { getCredentialAccess } from "./institution-accountability";
import type { AppDb } from "../lib/institution-access";
import { buildDepartmentSnapshots, type DepartmentSnapshot } from "../lib/institution-performance-departments";
import { buildExecutiveFindings } from "../lib/institution-executive-findings";

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
const periodTypes = ["monthly", "quarterly"] as const;
type PeriodType = (typeof periodTypes)[number];
type ReportScopeInput = { scopeType?: "institution" | "department"; departmentId?: number };
type ReportScope = { type: "institution" | "department"; departmentId: number | null; departmentName: string | null; key: string };
type SourceState = "available" | "unavailable" | "empty";

type AttentionItem = {
  id: string;
  domain: "credentials" | "roster" | "cpd" | "quality";
  title: string;
  detail: string;
  severity: "urgent" | "high" | "medium" | "info";
  count: number;
  ownerUserId: number | null;
  ownerName?: string | null;
  dueAt: string | null;
  action: "accountability" | "administration" | "cpd" | "learning" | "readiness";
};

type SourceResult<T> = { status: SourceState; data: T };
type ReportPeriod = {
  type: PeriodType;
  periodStart: string;
  periodEnd: string;
  timezone: "Africa/Nairobi";
};

type PerformanceSnapshot = {
  institutionId: number;
  access: { role: string; canViewIndividuals: boolean };
  scope: { type: "institution" | "department"; departmentId: number | null; departmentName: string | null };
  period: ReportPeriod;
  roster: {
    status: SourceState;
    activeStaff: number;
    canonicalDepartmentStaff: number;
    unassignedStaff: number;
  };
  sources: {
    departments: SourceResult<Array<{ id: number; name: string }>>;
    cpd: SourceResult<{
      events: number;
      verifiedAttendance: number;
      unresolvedAttendance: number;
      leadPresenters: number;
      coPresenters: number;
    }>;
    quality: SourceResult<{
      reports: number;
      openReports: number;
      highSeverityOpenReports: number;
      actions: number;
      overdueActions: number;
      overdueActionRows: Array<{
        id: number;
        dueAt: Date | null;
        status: string;
        ownerUserId: number | null;
        ownerName: string | null;
        actionText: string;
      }>;
    }>;
    credentials: SourceResult<{
      linkedStaff: number;
      verified: number;
      expiringWithin90Days: number;
      expired: number;
      earliestExpiringAt: string | null;
      lifeSupportCurrentOrExpiring: number;
      lifeSupportExpired: number;
      lifeSupportMissing: number;
    }>;
  };
  departments?: DepartmentSnapshot[];
  metrics: {
    departmentCount: number;
    activeStaff: number;
    canonicalDepartmentStaff: number;
    unassignedStaff: number;
    cpdEvents: number;
    cpdVerifiedAttendance: number;
    cpdUnresolvedAttendance: number;
    cpdLeadPresenters: number;
    cpdCoPresenters: number;
    qiReports: number;
    qiOpenReports: number;
    qiHighSeverityOpenReports: number;
    qiOverdueActions: number;
    verifiedCredentials: number;
    credentialsExpiringWithin90Days: number;
    credentialsExpired: number;
    lifeSupportCurrentOrExpiring: number;
    lifeSupportExpired: number;
    lifeSupportMissing: number;
  };
  attention: AttentionItem[];
  sourceFreshness: Record<string, string>;
  generatedAt: string;
};

type ReportDisclosures = {
  sourceAvailability: Record<string, SourceState>;
  sourceFreshness: Record<string, string>;
  freshnessNote: string;
  limitations: string[];
};

function eatDateKey(date: Date): string {
  return new Date(date.getTime() + EAT_OFFSET_MS).toISOString().slice(0, 10);
}

export function periodBounds(periodType: PeriodType, requestedStart?: string, now = new Date()): ReportPeriod & { start: Date; end: Date } {
  const eatNow = new Date(now.getTime() + EAT_OFFSET_MS);
  let year = eatNow.getUTCFullYear();
  let month = eatNow.getUTCMonth();
  if (requestedStart) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedStart)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "periodStart must use YYYY-MM-DD." });
    }
    const requested = new Date(`${requestedStart}T00:00:00.000Z`);
    if (Number.isNaN(requested.getTime())) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "periodStart is not a valid date." });
    }
    year = requested.getUTCFullYear();
    month = requested.getUTCMonth();
    if (requested.getUTCDate() !== 1 || (periodType === "quarterly" && month % 3 !== 0) || (periodType === "monthly" && requestedStart !== `${year.toString().padStart(4, "0")}-${(month + 1).toString().padStart(2, "0")}-01`)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: `${periodType} reports must start on the first day of a calendar period in EAT.` });
    }
    if (periodType === "monthly" && requested.getUTCDate() !== 1) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Monthly reports must start on the first day of the month in EAT." });
    }
  }
  const startMonth = periodType === "quarterly" ? Math.floor(month / 3) * 3 : month;
  const start = new Date(Date.UTC(year, startMonth, 1) - EAT_OFFSET_MS);
  const end = new Date(Date.UTC(year, startMonth + (periodType === "quarterly" ? 3 : 1), 1) - EAT_OFFSET_MS - 1);
  return { type: periodType, periodStart: eatDateKey(start), periodEnd: eatDateKey(end), timezone: "Africa/Nairobi", start, end };
}

function requireDb(): Promise<AppDb> {
  return getDb().then(db => {
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed." });
    return db;
  });
}

async function source<T>(label: string, load: () => Promise<T>, empty: (value: T) => boolean): Promise<SourceResult<T>> {
  try {
    const data = await load();
    return { status: empty(data) ? "empty" : "available", data };
  } catch (error) {
    console.warn(`[institution-performance] ${label} source unavailable`, error);
    return { status: "unavailable", data: null as unknown as T };
  }
}

function safeJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function reportDisclosures(snapshot: PerformanceSnapshot): ReportDisclosures {
  const sourceAvailability = Object.fromEntries(
    Object.entries(snapshot.sources).map(([key, value]) => [key, value.status]),
  ) as Record<string, SourceState>;
  return {
    sourceAvailability,
    sourceFreshness: snapshot.sourceFreshness,
    freshnessNote: "Each source was queried at report generation time. The current source tables do not expose a uniform last-updated timestamp, so these timestamps are an as-of capture marker, not a claim that every underlying row changed at that time.",
    limitations: [
      "Metrics describe recorded evidence, activity, and operational records only.",
      "CPD counts are activity within the selected EAT period; roster and credential values are as-of report generation; QI backlog values are current at capture and are not historical outcome measures.",
      "Active roster denominators exclude removed roster rows and exclude unassigned staff from department-specific comparisons.",
      "Unavailable or empty sources must not be interpreted as zero performance or institutional safety.",
      "Life Support and credential values are evidence and renewal states, not proof of competence, licensure, accreditation, dispatch authority, or clinical performance.",
      "No mortality, lives-saved, causal outcome, accreditation, or competence claim is made from this report.",
    ],
  };
}

async function resolveReportScope(db: AppDb, user: any, institutionId: number, input: ReportScopeInput = {}): Promise<ReportScope> {
  const access = await getCredentialAccess(db, user, institutionId);
  const scopeType = input.scopeType ?? "institution";
  if (scopeType === "institution") {
    if (access.departmentIds != null) throw new TRPCError({ code: "FORBIDDEN", message: "Whole-institution reports require institution-wide access." });
    return { type: "institution", departmentId: null, departmentName: null, key: "institution" };
  }
  if (!input.departmentId) throw new TRPCError({ code: "BAD_REQUEST", message: "A department is required for a department report." });
  if (access.departmentIds != null && !access.departmentIds.includes(input.departmentId)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this department report." });
  }
  const rows = await db.select({ id: facilityDepartments.id, name: facilityDepartments.departmentName }).from(facilityDepartments).where(and(eq(facilityDepartments.id, input.departmentId), eq(facilityDepartments.institutionId, institutionId), eq(facilityDepartments.isActive, true))).limit(1);
  if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "The selected department is not active in this institution." });
  return { type: "department", departmentId: rows[0].id, departmentName: rows[0].name, key: `department:${rows[0].id}` };
}

function hydrateReport(row: typeof institutionalPerformanceReports.$inferSelect) {
  const snapshot = safeJson<PerformanceSnapshot>(row.snapshotJson, {} as PerformanceSnapshot);
  const disclosures = safeJson<ReportDisclosures>(row.sourceSummaryJson, {
    sourceAvailability: {},
    sourceFreshness: {},
    freshnessNote: "Freshness metadata was not recorded by this report version.",
    limitations: [],
  });
  return {
    id: row.id,
    institutionId: row.institutionalAccountId,
    scope: {
      type: row.scopeDepartmentId ? "department" : "institution",
      departmentId: row.scopeDepartmentId,
      departmentName: snapshot.scope?.departmentName ?? null,
    },
    period: {
      type: row.periodType,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      timezone: row.timezone,
    },
    reportVersion: row.reportVersion,
    status: row.status,
    generatedByUserId: row.generatedByUserId,
    generatedAt: row.generatedAt.toISOString(),
    snapshot,
    findings: snapshot.departments ? buildExecutiveFindings(snapshot.departments, { minimumStaff: 5, lifeSupportFloor: 0.8, cpdAttendanceFloor: 0.5 }) : undefined,
    disclosures,
    limitations: safeJson<string[]>(row.limitationsJson, disclosures.limitations),
  };
}

async function buildSourceSnapshot(db: AppDb, user: any, institutionId: number, periodType: PeriodType, requestedStart?: string, scopeInput?: ReportScopeInput): Promise<PerformanceSnapshot> {
  const access = await getCredentialAccess(db, user, institutionId);
  const reportScope = await resolveReportScope(db, user, institutionId, scopeInput);
  const period = periodBounds(periodType, requestedStart);
  const scope = reportScope.type === "department" ? [reportScope.departmentId!] : access.departmentIds;
  const staff = await db
    .select({ id: institutionalStaffMembers.id, userId: institutionalStaffMembers.userId, facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId, department: institutionalStaffMembers.department })
    .from(institutionalStaffMembers)
    .where(and(
      eq(institutionalStaffMembers.institutionalAccountId, institutionId),
      isNull(institutionalStaffMembers.removedAt),
      scope ? inArray(institutionalStaffMembers.facilityDepartmentId, scope) : undefined,
    ));
  const staffIds = staff.map(row => row.userId).filter((id): id is number => id != null);
  const departmentScope = scope ? inArray(facilityDepartments.id, scope) : undefined;
  const generatedAt = new Date().toISOString();

  const [departmentSource, cpdSource, qiSource, credentialSource] = await Promise.all([
    source("departments", async () => db
      .select({ id: facilityDepartments.id, name: facilityDepartments.departmentName })
      .from(facilityDepartments)
      .where(and(eq(facilityDepartments.institutionId, institutionId), eq(facilityDepartments.isActive, true), departmentScope)), value => value.length === 0),
    source("cpd", async () => {
      const events = await db.select({ id: cpdEvents.id, presenterUserId: cpdEvents.presenterUserId, presenterName: cpdEvents.presenterName, eventDateAt: cpdEvents.eventDateAt })
        .from(cpdEvents)
        .where(and(eq(cpdEvents.institutionalAccountId, institutionId), gte(cpdEvents.eventDateAt, period.start), lte(cpdEvents.eventDateAt, period.end), notInArray(cpdEvents.lifecycleStatus, ["cancelled", "voided", "archived"]), scope ? inArray(cpdEvents.facilityDepartmentId, scope) : undefined));
      const eventIds = events.map(event => event.id);
      if (!eventIds.length) return { events: 0, verifiedAttendance: 0, unresolvedAttendance: 0, leadPresenters: 0, coPresenters: 0 };
      const [attendees, coPresenters] = await Promise.all([
        db.select({ userId: cpdAttendees.userId, attendanceStatus: cpdAttendees.attendanceStatus }).from(cpdAttendees).where(and(eq(cpdAttendees.institutionalAccountId, institutionId), inArray(cpdAttendees.cpdEventId, eventIds))),
        db.select({ id: cpdEventCoPresenters.id }).from(cpdEventCoPresenters).where(and(eq(cpdEventCoPresenters.institutionalAccountId, institutionId), inArray(cpdEventCoPresenters.cpdEventId, eventIds))),
      ]);
      const verified = attendees.filter(row => row.attendanceStatus === "attendance_verified");
      return { events: events.length, verifiedAttendance: verified.length, unresolvedAttendance: verified.filter(row => row.userId == null).length, leadPresenters: events.filter(row => row.presenterUserId != null || Boolean(row.presenterName?.trim())).length, coPresenters: coPresenters.length };
    }, value => value.events === 0),
    source("quality", async () => {
      const [reports, actions] = await Promise.all([
        db.select({ severity: institutionalQiReports.severity, status: institutionalQiReports.status }).from(institutionalQiReports).where(and(eq(institutionalQiReports.institutionalAccountId, institutionId), scope ? inArray(institutionalQiReports.facilityDepartmentId, scope) : undefined)),
        db.select({ id: institutionalQiActions.id, dueAt: institutionalQiActions.dueAt, status: institutionalQiActions.status, ownerUserId: institutionalQiActions.ownerUserId, ownerName: users.name, actionText: institutionalQiActions.actionText }).from(institutionalQiActions).innerJoin(institutionalQiReports, eq(institutionalQiReports.id, institutionalQiActions.reportId)).leftJoin(users, eq(users.id, institutionalQiActions.ownerUserId)).where(and(eq(institutionalQiActions.institutionalAccountId, institutionId), scope ? inArray(institutionalQiReports.facilityDepartmentId, scope) : undefined)),
      ]);
      const openReports = reports.filter(row => row.status !== "closed").length;
      const overdue = actions.filter(row => ["open", "in_progress"].includes(row.status) && row.dueAt != null && row.dueAt.getTime() < Date.now());
      return { reports: reports.length, openReports, highSeverityOpenReports: reports.filter(row => row.status !== "closed" && ["severe", "critical"].includes(row.severity)).length, actions: actions.length, overdueActions: overdue.length, overdueActionRows: overdue.slice(0, 10) };
    }, value => value.reports === 0 && value.actions === 0),
    source("credentials", async () => {
      if (!staffIds.length) return { linkedStaff: 0, verified: 0, expiringWithin90Days: 0, expired: 0, earliestExpiringAt: null, lifeSupportCurrentOrExpiring: 0, lifeSupportExpired: 0, lifeSupportMissing: 0 };
      const rows = await db.select({ userId: professionalCredentials.userId, credentialType: professionalCredentials.credentialType, status: professionalCredentials.status, expiresAt: professionalCredentials.expiresAt }).from(professionalCredentials).where(inArray(professionalCredentials.userId, staffIds));
      const now = Date.now();
      const horizon = now + 90 * 24 * 60 * 60 * 1000;
      const verifiedRows = rows.filter(row => row.status === "verified");
      const expiringRows = verifiedRows.filter(row => row.expiresAt != null && row.expiresAt.getTime() > now && row.expiresAt.getTime() <= horizon);
      const lifeSupportTypes = new Set(["paeds_resus_bls_cognitive", "paeds_resus_bls_simulation", "paeds_resus_bls_provider", "paeds_resus_acls_provider", "paeds_resus_pals_provider", "paeds_resus_nrp_provider", "external_aha_bls", "external_aha_acls", "external_aha_pals", "external_aha_nrp", "external_aha_other"]);
      const lifeRows = rows.filter(row => lifeSupportTypes.has(row.credentialType) && row.status === "verified");
      const lifeCurrentOrExpiring = new Set(lifeRows.filter(row => row.expiresAt == null || row.expiresAt.getTime() > now).map(row => row.userId)).size;
      const lifeExpired = new Set(lifeRows.filter(row => row.expiresAt != null && row.expiresAt.getTime() <= now).map(row => row.userId)).size;
      return { linkedStaff: new Set(rows.map(row => row.userId)).size, verified: verifiedRows.length, expiringWithin90Days: expiringRows.length, expired: verifiedRows.filter(row => row.expiresAt != null && row.expiresAt.getTime() <= now).length, earliestExpiringAt: expiringRows.sort((a, b) => (a.expiresAt?.getTime() ?? Infinity) - (b.expiresAt?.getTime() ?? Infinity))[0]?.expiresAt?.toISOString() ?? null, lifeSupportCurrentOrExpiring: lifeCurrentOrExpiring, lifeSupportExpired: lifeExpired, lifeSupportMissing: Math.max(0, staffIds.length - lifeCurrentOrExpiring - lifeExpired) };
    }, value => value.linkedStaff === 0),
  ]);

  const [departmentCredentialRows, departmentCpdRows, departmentAttendeeRows, departmentQiReports, departmentQiActions] = await Promise.all([
    source("department-credentials", async () => {
      if (reportScope.type !== "institution" || !staffIds.length) return [];
      return db.select({ userId: professionalCredentials.userId, credentialType: professionalCredentials.credentialType, status: professionalCredentials.status, expiresAt: professionalCredentials.expiresAt }).from(professionalCredentials).where(inArray(professionalCredentials.userId, staffIds));
    }, value => value.length === 0),
    source("department-cpd-events", async () => {
      if (reportScope.type !== "institution") return [];
      return db.select({ id: cpdEvents.id, facilityDepartmentId: cpdEvents.facilityDepartmentId }).from(cpdEvents).where(and(eq(cpdEvents.institutionalAccountId, institutionId), gte(cpdEvents.eventDateAt, period.start), lte(cpdEvents.eventDateAt, period.end), notInArray(cpdEvents.lifecycleStatus, ["cancelled", "voided", "archived"])));
    }, value => value.length === 0),
    source("department-cpd-attendees", async () => {
      if (reportScope.type !== "institution") return [];
      const eventRows = await db.select({ id: cpdEvents.id }).from(cpdEvents).where(and(eq(cpdEvents.institutionalAccountId, institutionId), gte(cpdEvents.eventDateAt, period.start), lte(cpdEvents.eventDateAt, period.end), notInArray(cpdEvents.lifecycleStatus, ["cancelled", "voided", "archived"])));
      const eventIds = eventRows.map(row => row.id);
      if (!eventIds.length) return [];
      return db.select({ cpdEventId: cpdAttendees.cpdEventId, facilityDepartmentId: cpdAttendees.facilityDepartmentId, attendanceStatus: cpdAttendees.attendanceStatus }).from(cpdAttendees).where(and(eq(cpdAttendees.institutionalAccountId, institutionId), inArray(cpdAttendees.cpdEventId, eventIds)));
    }, value => value.length === 0),
    source("department-qi-reports", async () => {
      if (reportScope.type !== "institution") return [];
      return db.select({ id: institutionalQiReports.id, facilityDepartmentId: institutionalQiReports.facilityDepartmentId, status: institutionalQiReports.status }).from(institutionalQiReports).where(eq(institutionalQiReports.institutionalAccountId, institutionId));
    }, value => value.length === 0),
    source("department-qi-actions", async () => {
      if (reportScope.type !== "institution") return [];
      return db.select({ reportId: institutionalQiActions.reportId, status: institutionalQiActions.status, dueAt: institutionalQiActions.dueAt }).from(institutionalQiActions).where(eq(institutionalQiActions.institutionalAccountId, institutionId));
    }, value => value.length === 0),
  ]);
  const departments = reportScope.type === "institution" && departmentSource.status !== "unavailable"
    ? buildDepartmentSnapshots({
      departments: departmentSource.data,
      staff,
      credentials: departmentCredentialRows.status === "unavailable" ? [] : departmentCredentialRows.data,
      cpdEvents: departmentCpdRows.status === "unavailable" ? [] : departmentCpdRows.data,
      cpdAttendees: departmentAttendeeRows.status === "unavailable" ? [] : departmentAttendeeRows.data,
      qiReports: departmentQiReports.status === "unavailable" ? [] : departmentQiReports.data,
      qiActions: departmentQiActions.status === "unavailable" ? [] : departmentQiActions.data,
      sourceStates: { credentials: credentialSource.status, cpd: cpdSource.status, quality: qiSource.status },
      now: new Date(),
    })
    : undefined;

  const attention: AttentionItem[] = [];
  const unassignedStaff = staff.filter(row => row.facilityDepartmentId == null).length;
  if (unassignedStaff > 0) attention.push({ id: "roster-unassigned-department", domain: "roster", title: "Assign canonical departments", detail: `${unassignedStaff} active roster member(s) have no canonical department link.`, severity: "medium", count: unassignedStaff, ownerUserId: null, dueAt: null, action: "administration" });
  if (credentialSource.status === "available" && credentialSource.data.expired > 0) attention.push({ id: "credentials-expired", domain: "credentials", title: "Review expired credential evidence", detail: `${credentialSource.data.expired} verified credential record(s) are past their recorded expiry date.`, severity: "urgent", count: credentialSource.data.expired, ownerUserId: null, dueAt: null, action: "accountability" });
  if (credentialSource.status === "available" && credentialSource.data.expiringWithin90Days > 0) attention.push({ id: "credentials-expiring", domain: "credentials", title: "Plan credential renewals", detail: `${credentialSource.data.expiringWithin90Days} verified credential record(s) expire within 90 days.`, severity: "high", count: credentialSource.data.expiringWithin90Days, ownerUserId: null, dueAt: credentialSource.data.earliestExpiringAt, action: "accountability" });
  if (cpdSource.status === "available" && cpdSource.data.unresolvedAttendance > 0) attention.push({ id: "cpd-unresolved-identity", domain: "cpd", title: "Resolve CPD attendance identity gaps", detail: `${cpdSource.data.unresolvedAttendance} verified attendance record(s) have no linked user identity.`, severity: "medium", count: cpdSource.data.unresolvedAttendance, ownerUserId: null, dueAt: null, action: "cpd" });
  if (qiSource.status === "available") for (const action of qiSource.data.overdueActionRows) attention.push({ id: `quality-action-${action.id}`, domain: "quality", title: "Review overdue quality action", detail: action.actionText, severity: "urgent", count: 1, ownerUserId: action.ownerUserId, ownerName: access.canViewIndividuals ? action.ownerName : null, dueAt: action.dueAt?.toISOString() ?? null, action: "readiness" });

  return {
    institutionId,
    access: { role: access.role, canViewIndividuals: access.canViewIndividuals },
    scope: { type: reportScope.type, departmentId: reportScope.departmentId, departmentName: reportScope.departmentName },
    departments,
    period: { type: period.type, periodStart: period.periodStart, periodEnd: period.periodEnd, timezone: period.timezone },
    roster: { status: staff.length ? "available" : "empty", activeStaff: staff.length, canonicalDepartmentStaff: staff.filter(row => row.facilityDepartmentId != null).length, unassignedStaff },
    sources: { departments: departmentSource, cpd: cpdSource, quality: qiSource, credentials: credentialSource },
    metrics: {
      departmentCount: departmentSource.status === "available" ? departmentSource.data.length : 0,
      activeStaff: staff.length,
      canonicalDepartmentStaff: staff.length - unassignedStaff,
      unassignedStaff,
      cpdEvents: cpdSource.status === "available" ? cpdSource.data.events : 0,
      cpdVerifiedAttendance: cpdSource.status === "available" ? cpdSource.data.verifiedAttendance : 0,
      cpdUnresolvedAttendance: cpdSource.status === "available" ? cpdSource.data.unresolvedAttendance : 0,
      cpdLeadPresenters: cpdSource.status === "available" ? cpdSource.data.leadPresenters : 0,
      cpdCoPresenters: cpdSource.status === "available" ? cpdSource.data.coPresenters : 0,
      qiReports: qiSource.status === "available" ? qiSource.data.reports : 0,
      qiOpenReports: qiSource.status === "available" ? qiSource.data.openReports : 0,
      qiHighSeverityOpenReports: qiSource.status === "available" ? qiSource.data.highSeverityOpenReports : 0,
      qiOverdueActions: qiSource.status === "available" ? qiSource.data.overdueActions : 0,
      verifiedCredentials: credentialSource.status === "available" ? credentialSource.data.verified : 0,
      credentialsExpiringWithin90Days: credentialSource.status === "available" ? credentialSource.data.expiringWithin90Days : 0,
      credentialsExpired: credentialSource.status === "available" ? credentialSource.data.expired : 0,
      lifeSupportCurrentOrExpiring: credentialSource.status === "available" ? credentialSource.data.lifeSupportCurrentOrExpiring : 0,
      lifeSupportExpired: credentialSource.status === "available" ? credentialSource.data.lifeSupportExpired : 0,
      lifeSupportMissing: credentialSource.status === "available" ? credentialSource.data.lifeSupportMissing : 0,
    },
    attention,
    sourceFreshness: Object.fromEntries(Object.keys({ departments: departmentSource, cpd: cpdSource, quality: qiSource, credentials: credentialSource }).map(key => [key, generatedAt])),
    generatedAt,
  };
}

async function findReport(db: AppDb, institutionId: number, scopeKey: string, periodType: PeriodType, periodStart: string) {
  const rows = await db.select().from(institutionalPerformanceReports).where(and(eq(institutionalPerformanceReports.institutionalAccountId, institutionId), eq(institutionalPerformanceReports.scopeKey, scopeKey), eq(institutionalPerformanceReports.periodType, periodType), eq(institutionalPerformanceReports.periodStart, periodStart))).limit(1);
  return rows[0] ?? null;
}

async function assertReportScopeAccess(db: AppDb, user: any, institutionId: number, row: typeof institutionalPerformanceReports.$inferSelect) {
  const scope = await resolveReportScope(db, user, institutionId, row.scopeDepartmentId ? { scopeType: "department", departmentId: row.scopeDepartmentId } : { scopeType: "institution" });
  if (scope.key !== row.scopeKey) throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this report scope." });
}

function isDuplicateKeyError(error: unknown): boolean {
  const candidate = error as { code?: string; errno?: number; message?: string };
  return candidate?.code === "ER_DUP_ENTRY" || candidate?.errno === 1062 || candidate?.message?.toLowerCase().includes("duplicate entry") === true;
}

export const institutionPerformanceRouter = router({
  getSourceSnapshot: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), periodType: z.enum(periodTypes).default("quarterly"), periodStart: z.string().optional(), scopeType: z.enum(["institution", "department"]).default("institution"), departmentId: z.number().int().positive().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      return buildSourceSnapshot(db, ctx.user, input.institutionId, input.periodType, input.periodStart, input);
    }),

  getReportScopes: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const access = await getCredentialAccess(db, ctx.user, input.institutionId);
      const departments = await db.select({ id: facilityDepartments.id, name: facilityDepartments.departmentName }).from(facilityDepartments).where(and(eq(facilityDepartments.institutionId, input.institutionId), eq(facilityDepartments.isActive, true), access.departmentIds ? inArray(facilityDepartments.id, access.departmentIds) : undefined));
      return { wholeInstitution: access.departmentIds == null, departments };
    }),

  generateExecutiveReport: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), periodType: z.enum(periodTypes).default("quarterly"), periodStart: z.string().optional(), scopeType: z.enum(["institution", "department"]).default("institution"), departmentId: z.number().int().positive().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const snapshot = await buildSourceSnapshot(db, ctx.user, input.institutionId, input.periodType, input.periodStart, input);
      const scope = await resolveReportScope(db, ctx.user, input.institutionId, input);
      const existing = await findReport(db, input.institutionId, scope.key, input.periodType, snapshot.period.periodStart);
      if (existing) return hydrateReport(existing);
      const disclosures = reportDisclosures(snapshot);
      try {
        await db.insert(institutionalPerformanceReports).values({
          institutionalAccountId: input.institutionId,
          scopeKey: scope.key,
          scopeDepartmentId: scope.departmentId,
          periodType: input.periodType,
          periodStart: snapshot.period.periodStart,
          periodEnd: snapshot.period.periodEnd,
          timezone: "Africa/Nairobi",
          reportVersion: snapshot.departments ? "v2" : "v1",
          status: "final",
          generatedByUserId: ctx.user.id,
          snapshotJson: JSON.stringify(snapshot),
          sourceSummaryJson: JSON.stringify(disclosures),
          limitationsJson: JSON.stringify(disclosures.limitations),
        });
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;
        // Another request won the unique period insert. Return the canonical immutable row.
      }
      const created = await findReport(db, input.institutionId, scope.key, input.periodType, snapshot.period.periodStart);
      if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Executive report could not be persisted." });
      return hydrateReport(created);
    }),

  listExecutiveReports: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), periodType: z.enum(periodTypes).optional(), scopeType: z.enum(["institution", "department"]).default("institution"), departmentId: z.number().int().positive().optional(), limit: z.number().int().min(1).max(24).default(12) }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const scope = await resolveReportScope(db, ctx.user, input.institutionId, input);
      const rows = await db.select().from(institutionalPerformanceReports).where(and(eq(institutionalPerformanceReports.institutionalAccountId, input.institutionId), eq(institutionalPerformanceReports.scopeKey, scope.key), input.periodType ? eq(institutionalPerformanceReports.periodType, input.periodType) : undefined)).orderBy(desc(institutionalPerformanceReports.periodStart)).limit(input.limit);
      return rows.map(row => {
        const report = hydrateReport(row);
        return { id: report.id, institutionId: report.institutionId, scope: report.scope, period: report.period, reportVersion: report.reportVersion, status: report.status, generatedAt: report.generatedAt, metrics: report.snapshot.metrics, sourceAvailability: report.disclosures.sourceAvailability, sourceFreshness: report.disclosures.sourceFreshness, limitations: report.limitations };
      });
    }),

  getExecutiveReport: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), reportId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      await getCredentialAccess(db, ctx.user, input.institutionId);
      const rows = await db.select().from(institutionalPerformanceReports).where(and(eq(institutionalPerformanceReports.id, input.reportId), eq(institutionalPerformanceReports.institutionalAccountId, input.institutionId))).limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Executive report not found." });
      await assertReportScopeAccess(db, ctx.user, input.institutionId, rows[0]);
      return hydrateReport(rows[0]);
    }),
});
