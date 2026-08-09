/**
 * Provider performance aggregation — CEO-requested 2026-08-09: a scorecard
 * pulling together CPD, Life Support certification status, QI reporting
 * (Care Signal + Code Signal), and crash cart audits, for both the
 * provider's own view and an institution's staff roster.
 *
 * Deliberately Phase 1 only — aggregates data that ALREADY EXISTS. Two
 * things the CEO asked about (shift huddle participation, code
 * team-lead/participation counts) are NOT in this file because they don't
 * exist anywhere in the schema yet; see WORK_STATUS 2026-08-09 for that
 * as a separate, flagged Phase 2.
 *
 * Real limitations, stated plainly rather than silently assumed away:
 *
 * 1. CPD "sessions attended" is matched by email (`cpdAttendees` has no
 *    userId column — it's a public sign-in-sheet model, not linked to
 *    platform accounts). Matched case-insensitively against the user's
 *    account email. This will under- or mis-count for anyone who signs in
 *    at a CPD event with a different email than their account, or with a
 *    typo. "Sessions presented" is reliable (cpdEvents.presenterUserId is
 *    a real FK) — only "attended" carries this risk.
 * 2. Life Support certificate expiry is NOT tracked anywhere in the
 *    schema. This computes expiry as `trainingDate + 2 years`, the
 *    standard AHA validity period — an assumption, not a stored fact.
 *    If a facility's actual renewal cycle differs, this will be wrong.
 * 3. "Facility median" comparison is facility-level, not department-level
 *    — `providerProfiles` has no clean structured department field
 *    (only free-text `department` on individual CPD sign-ins), so
 *    department-level cohorts aren't reliably computable yet.
 */
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "../db";
import {
  users,
  enrollments,
  cpdEvents,
  cpdAttendees,
  careSignalEvents,
  codeSignalEvents,
  equipmentAuditLogs,
  providerProfiles,
} from "../../drizzle/schema";

const LIFE_SUPPORT_VALIDITY_DAYS = 2 * 365;
const EXPIRING_SOON_WINDOW_DAYS = 60;

export type LifeSupportStatus = {
  programType: "bls" | "acls" | "pals";
  trainingDate: Date;
  expiresAt: Date;
  status: "valid" | "expiring_soon" | "expired";
};

export type ProviderScorecard = {
  userId: number;
  name: string | null;
  cpd: { sessionsAttended: number; sessionsPresented: number; pointsEarned: number };
  lifeSupport: LifeSupportStatus[];
  qi: { careSignalCount: number; codeSignalCount: number };
  crashCartAudits: number;
  priorityFlags: string[];
};

function computeLifeSupportStatus(programType: "bls" | "acls" | "pals", trainingDate: Date, now: Date): LifeSupportStatus {
  const expiresAt = new Date(trainingDate.getTime() + LIFE_SUPPORT_VALIDITY_DAYS * 86_400_000);
  const daysToExpiry = (expiresAt.getTime() - now.getTime()) / 86_400_000;
  const status = daysToExpiry < 0 ? "expired" : daysToExpiry <= EXPIRING_SOON_WINDOW_DAYS ? "expiring_soon" : "valid";
  return { programType, trainingDate, expiresAt, status };
}

async function computeCoreCounts(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
  userEmail: string | null,
  institutionalAccountId: number | null,
  since: Date
): Promise<{
  sessionsAttended: number;
  sessionsPresented: number;
  pointsEarned: number;
  lifeSupport: LifeSupportStatus[];
  careSignalCount: number;
  codeSignalCount: number;
  crashCartAudits: number;
}> {
  const now = new Date();

  const [presented, attended, lifeSupportRows, careSignalRows, codeSignalRows, auditRows] = await Promise.all([
    db
      .select({ id: cpdEvents.id, cpdPoints: cpdEvents.cpdPoints })
      .from(cpdEvents)
      .where(and(eq(cpdEvents.presenterUserId, userId), gte(cpdEvents.createdAt, since))),
    userEmail && institutionalAccountId
      ? db
          .select({ cpdEventId: cpdAttendees.cpdEventId, cpdPoints: cpdEvents.cpdPoints })
          .from(cpdAttendees)
          .innerJoin(cpdEvents, eq(cpdAttendees.cpdEventId, cpdEvents.id))
          .where(
            and(
              sql`LOWER(${cpdAttendees.email}) = LOWER(${userEmail})`,
              eq(cpdAttendees.institutionalAccountId, institutionalAccountId),
              gte(cpdAttendees.submittedAt, since)
            )
          )
      : Promise.resolve([]),
    db
      .select({ programType: enrollments.programType, trainingDate: enrollments.trainingDate })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, userId),
          inArray(enrollments.programType, ["bls", "acls", "pals"]),
          eq(enrollments.certificateVerified, true)
        )
      ),
    db
      .select({ id: careSignalEvents.id })
      .from(careSignalEvents)
      .where(and(eq(careSignalEvents.userId, userId), eq(careSignalEvents.submissionMode, "named"), gte(careSignalEvents.createdAt, since))),
    db
      .select({ id: codeSignalEvents.id })
      .from(codeSignalEvents)
      .where(and(eq(codeSignalEvents.userId, userId), eq(codeSignalEvents.submissionMode, "named"), gte(codeSignalEvents.createdAt, since))),
    db
      .select({ id: equipmentAuditLogs.id })
      .from(equipmentAuditLogs)
      .where(and(eq(equipmentAuditLogs.auditedByUserId, userId), gte(equipmentAuditLogs.auditDate, since))),
  ]);

  const pointsFromPresented = presented.reduce((sum, e) => sum + Number(e.cpdPoints ?? 0), 0);
  const pointsFromAttended = attended.reduce((sum, e) => sum + Number(e.cpdPoints ?? 0), 0);

  const lifeSupport = lifeSupportRows
    .filter((r): r is { programType: "bls" | "acls" | "pals"; trainingDate: Date } => r.trainingDate != null)
    .map((r) => computeLifeSupportStatus(r.programType as "bls" | "acls" | "pals", r.trainingDate, now));

  return {
    sessionsAttended: attended.length,
    sessionsPresented: presented.length,
    pointsEarned: pointsFromPresented + pointsFromAttended,
    lifeSupport,
    careSignalCount: careSignalRows.length,
    codeSignalCount: codeSignalRows.length,
    crashCartAudits: auditRows.length,
  };
}

export async function getProviderScorecard(input: {
  userId: number;
  institutionalAccountId: number | null;
  lastDays: number;
}): Promise<ProviderScorecard | null> {
  const db = await getDb();
  if (!db) return null;

  const [user] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, input.userId)).limit(1);
  if (!user) return null;

  const since = new Date(Date.now() - input.lastDays * 24 * 60 * 60 * 1000);
  const core = await computeCoreCounts(db, user.id, user.email, input.institutionalAccountId, since);

  const priorityFlags: string[] = [];
  if (core.sessionsAttended + core.sessionsPresented === 0) priorityFlags.push("no_cpd_this_period");
  if (core.lifeSupport.some((l) => l.status === "expired")) priorityFlags.push("life_support_cert_expired");
  else if (core.lifeSupport.some((l) => l.status === "expiring_soon")) priorityFlags.push("life_support_cert_expiring_soon");
  if (core.careSignalCount + core.codeSignalCount === 0) priorityFlags.push("no_qi_reports_this_period");

  return {
    userId: user.id,
    name: user.name,
    cpd: { sessionsAttended: core.sessionsAttended, sessionsPresented: core.sessionsPresented, pointsEarned: core.pointsEarned },
    lifeSupport: core.lifeSupport,
    qi: { careSignalCount: core.careSignalCount, codeSignalCount: core.codeSignalCount },
    crashCartAudits: core.crashCartAudits,
    priorityFlags,
  };
}

/** Facility-level median for a provider's own private self-comparison — never shown to peers, only to the provider themselves and to institution admins. */
export async function getFacilityMedianQiCount(facilityId: number, lastDays: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const since = new Date(Date.now() - lastDays * 24 * 60 * 60 * 1000);

  const providerIds = await db
    .select({ userId: providerProfiles.userId })
    .from(providerProfiles)
    .where(eq(providerProfiles.facilityId, facilityId));
  const ids = providerIds.map((p) => p.userId).filter((id): id is number => id != null);
  if (ids.length === 0) return 0;

  const [careRows, codeRows] = await Promise.all([
    db
      .select({ userId: careSignalEvents.userId })
      .from(careSignalEvents)
      .where(and(inArray(careSignalEvents.userId, ids), eq(careSignalEvents.submissionMode, "named"), gte(careSignalEvents.createdAt, since))),
    db
      .select({ userId: codeSignalEvents.userId })
      .from(codeSignalEvents)
      .where(and(inArray(codeSignalEvents.userId, ids), eq(codeSignalEvents.submissionMode, "named"), gte(codeSignalEvents.createdAt, since))),
  ]);

  const counts = new Map<number, number>(ids.map((id) => [id, 0]));
  for (const r of [...careRows, ...codeRows]) {
    if (r.userId == null) continue;
    counts.set(r.userId, (counts.get(r.userId) ?? 0) + 1);
  }

  const sorted = [...counts.values()].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length === 0) return 0;
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
