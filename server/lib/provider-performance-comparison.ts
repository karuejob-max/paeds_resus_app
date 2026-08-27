import { and, eq, gte, inArray, lt, or, sql } from "drizzle-orm";
import { getDb } from "../db";
import {
  careSignalEvents,
  certificates,
  codeSignalEvents,
  cpdAttendees,
  cpdEvents,
  equipmentAuditLogs,
  users,
} from "../../drizzle/schema";
import {
  calculateChange,
  getPerformancePeriodWindow,
  isWithin,
  type PerformancePeriod,
  type PerformancePeriodWindow,
} from "./performance-periods";

export type SelfComparisonMetricKey =
  | "cpd_sessions_attended"
  | "cpd_sessions_presented"
  | "cpd_points"
  | "qi_reports"
  | "crash_cart_audits"
  | "life_support_certificates_issued"
  | "life_support_certificates_valid";

export type SelfComparisonMetric = {
  key: SelfComparisonMetricKey;
  label: string;
  unit: "sessions" | "points" | "reports" | "audits" | "certificates";
  current: number;
  previous: number;
  delta: number;
  percentage: number | null;
  direction: "up" | "down" | "stable";
  dataQuality: "complete" | "email_match" | "point_in_time";
  lowerIsBetter: boolean;
};

export type ProviderSelfComparison = {
  period: PerformancePeriod;
  window: Pick<
    PerformancePeriodWindow,
    | "currentStart"
    | "currentEnd"
    | "previousStart"
    | "previousEnd"
    | "currentToDateEnd"
    | "previousToDateEnd"
    | "isPartial"
    | "currentLabel"
    | "previousLabel"
  >;
  metrics: SelfComparisonMetric[];
  notes: string[];
};

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

type DatedRow = { date: Date | string | null; value?: number | string | null };

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function inPeriod(
  date: Date | string | null | undefined,
  start: Date,
  end: Date
): boolean {
  const parsed = toDate(date);
  return parsed ? isWithin(parsed, start, end) : false;
}

function sumValues(rows: DatedRow[], start: Date, end: Date): number {
  return rows.reduce(
    (sum, row) =>
      inPeriod(row.date, start, end) ? sum + Number(row.value ?? 0) : sum,
    0
  );
}

function countRows(rows: DatedRow[], start: Date, end: Date): number {
  return rows.filter(row => inPeriod(row.date, start, end)).length;
}

function metric(
  key: SelfComparisonMetricKey,
  label: string,
  unit: SelfComparisonMetric["unit"],
  current: number,
  previous: number,
  dataQuality: SelfComparisonMetric["dataQuality"],
  lowerIsBetter = false
): SelfComparisonMetric {
  const change = calculateChange(current, previous);
  return {
    key,
    label,
    unit,
    current,
    previous,
    delta: change.delta,
    percentage: change.percentage,
    direction: change.direction,
    dataQuality,
    lowerIsBetter,
  };
}

export function buildProviderSelfComparison(input: {
  period: PerformancePeriod;
  now?: Date;
  attended: DatedRow[];
  presented: DatedRow[];
  qiReports: DatedRow[];
  crashCartAudits: DatedRow[];
  certificates: Array<{
    issueDate: Date | string;
    expiryDate: Date | string | null;
  }>;
}): ProviderSelfComparison {
  const window = getPerformancePeriodWindow(input.period, input.now);
  const currentStart = window.currentStart;
  const currentEnd = window.currentToDateEnd;
  const previousStart = window.previousStart;
  const previousEnd = window.previousToDateEnd;

  const currentCertificates = input.certificates.filter(certificate =>
    inPeriod(certificate.issueDate, currentStart, currentEnd)
  ).length;
  const previousCertificates = input.certificates.filter(certificate =>
    inPeriod(certificate.issueDate, previousStart, previousEnd)
  ).length;
  const certificateWasValidAt = (
    certificate: { issueDate: Date | string; expiryDate: Date | string | null },
    cutoff: Date
  ): boolean => {
    const issueDate = toDate(certificate.issueDate);
    const expiryDate = toDate(certificate.expiryDate);
    return Boolean(
      issueDate &&
        expiryDate &&
        issueDate.getTime() <= cutoff.getTime() &&
        expiryDate.getTime() >= cutoff.getTime()
    );
  };
  const currentValidCertificates = input.certificates.filter(certificate =>
    certificateWasValidAt(certificate, currentEnd)
  ).length;
  const previousValidCertificates = input.certificates.filter(certificate =>
    certificateWasValidAt(certificate, previousEnd)
  ).length;

  return {
    period: input.period,
    window: {
      currentStart: window.currentStart,
      currentEnd: window.currentEnd,
      previousStart: window.previousStart,
      previousEnd: window.previousEnd,
      currentToDateEnd: window.currentToDateEnd,
      previousToDateEnd: window.previousToDateEnd,
      isPartial: window.isPartial,
      currentLabel: window.currentLabel,
      previousLabel: window.previousLabel,
    },
    metrics: [
      metric(
        "cpd_sessions_attended",
        "CPD sessions attended",
        "sessions",
        countRows(input.attended, currentStart, currentEnd),
        countRows(input.attended, previousStart, previousEnd),
        "email_match"
      ),
      metric(
        "cpd_sessions_presented",
        "CPD sessions presented",
        "sessions",
        countRows(input.presented, currentStart, currentEnd),
        countRows(input.presented, previousStart, previousEnd),
        "complete"
      ),
      metric(
        "cpd_points",
        "CPD points recorded",
        "points",
        sumValues(input.attended, currentStart, currentEnd) +
          sumValues(input.presented, currentStart, currentEnd),
        sumValues(input.attended, previousStart, previousEnd) +
          sumValues(input.presented, previousStart, previousEnd),
        "email_match"
      ),
      metric(
        "qi_reports",
        "Named QI reports",
        "reports",
        countRows(input.qiReports, currentStart, currentEnd),
        countRows(input.qiReports, previousStart, previousEnd),
        "complete"
      ),
      metric(
        "crash_cart_audits",
        "Crash-cart audits",
        "audits",
        countRows(input.crashCartAudits, currentStart, currentEnd),
        countRows(input.crashCartAudits, previousStart, previousEnd),
        "complete"
      ),
      metric(
        "life_support_certificates_issued",
        "Life Support certificates issued",
        "certificates",
        currentCertificates,
        previousCertificates,
        "point_in_time"
      ),
      metric(
        "life_support_certificates_valid",
        "Life Support certificates valid at period end",
        "certificates",
        currentValidCertificates,
        previousValidCertificates,
        "point_in_time"
      ),
    ],
    notes: [
      "This view compares you with your own previous comparable period; it does not rank you against peers.",
      "CPD attendance is matched to your account email and may require correction if an event used a different email address.",
      "Activity counts are evidence of participation, not a measure of clinical competence or patient outcomes.",
    ],
  };
}

export async function getProviderSelfComparison(input: {
  userId: number;
  period: PerformancePeriod;
  now?: Date;
}): Promise<ProviderSelfComparison | null> {
  const db = await getDb();
  if (!db) return null;

  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);
  if (!user) return null;

  const window = getPerformancePeriodWindow(input.period, input.now);
  const broadStart = window.previousStart;
  const broadEnd = window.currentEnd;

  const [
    attended,
    presented,
    careReports,
    codeReports,
    audits,
    certificateRows,
  ] = await Promise.all([
    user.email
      ? db
          .select({
            date: cpdAttendees.submittedAt,
            value: cpdEvents.cpdPoints,
          })
          .from(cpdAttendees)
          .innerJoin(cpdEvents, eq(cpdAttendees.cpdEventId, cpdEvents.id))
          .where(
            and(
              sql`LOWER(${cpdAttendees.email}) = LOWER(${user.email})`,
              gte(cpdAttendees.submittedAt, broadStart),
              lt(cpdAttendees.submittedAt, broadEnd)
            )
          )
      : Promise.resolve([]),
    db
      .select({
        date: cpdEvents.eventDateAt,
        fallbackDate: cpdEvents.createdAt,
        value: cpdEvents.cpdPoints,
      })
      .from(cpdEvents)
      .where(
        and(
          eq(cpdEvents.presenterUserId, input.userId),
          or(
            and(
              gte(cpdEvents.eventDateAt, broadStart),
              lt(cpdEvents.eventDateAt, broadEnd)
            ),
            and(
              gte(cpdEvents.createdAt, broadStart),
              lt(cpdEvents.createdAt, broadEnd)
            )
          )
        )
      ),
    db
      .select({ date: careSignalEvents.createdAt })
      .from(careSignalEvents)
      .where(
        and(
          eq(careSignalEvents.userId, input.userId),
          eq(careSignalEvents.submissionMode, "named"),
          gte(careSignalEvents.createdAt, broadStart),
          lt(careSignalEvents.createdAt, broadEnd)
        )
      ),
    db
      .select({ date: codeSignalEvents.createdAt })
      .from(codeSignalEvents)
      .where(
        and(
          eq(codeSignalEvents.userId, input.userId),
          eq(codeSignalEvents.submissionMode, "named"),
          gte(codeSignalEvents.createdAt, broadStart),
          lt(codeSignalEvents.createdAt, broadEnd)
        )
      ),
    db
      .select({ date: equipmentAuditLogs.auditDate })
      .from(equipmentAuditLogs)
      .where(
        and(
          eq(equipmentAuditLogs.auditedByUserId, input.userId),
          gte(equipmentAuditLogs.auditDate, broadStart),
          lt(equipmentAuditLogs.auditDate, broadEnd)
        )
      ),
    db
      .select({
        issueDate: certificates.issueDate,
        expiryDate: certificates.expiryDate,
      })
      .from(certificates)
      .where(
        and(
          eq(certificates.userId, input.userId),
          inArray(certificates.programType, ["bls", "acls", "pals"])
        )
      ),
  ]);

  return buildProviderSelfComparison({
    period: input.period,
    now: input.now,
    attended,
    presented: presented.map(row => ({
      date: row.date ?? row.fallbackDate,
      value: row.value,
    })),
    qiReports: [...careReports, ...codeReports],
    crashCartAudits: audits,
    certificates: certificateRows,
  });
}
