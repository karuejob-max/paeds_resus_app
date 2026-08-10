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
 * Revised 2026-08-10: originally computed Life Support expiry with a
 * hardcoded "trainingDate + 2 years" assumption against `enrollments`,
 * flagged at the time as not a stored fact. A real `certificates` table
 * and `server/lib/certificate-expiry.ts` utility (issueDate + validity
 * years, with a stored `expiryDate` taking priority when present) landed
 * on `main` in the meantime — this now uses that canonical source instead
 * of a duplicated approximation. Genuinely more accurate, not just
 * refactored for its own sake.
 *
 * Remaining real limitations, stated plainly:
 *
 * 1. CPD "sessions attended" is matched by email (`cpdAttendees` has no
 *    userId column — it's a public sign-in-sheet model, not linked to
 *    platform accounts). Matched case-insensitively against the user's
 *    account email. This will under- or mis-count for anyone who signs in
 *    at a CPD event with a different email than their account, or with a
 *    typo. "Sessions presented" is reliable (cpdEvents.presenterUserId is
 *    a real FK) — only "attended" carries this risk.
 * 2. Department-level median comparison (getDepartmentMedianQiCount below)
 *    groups by `providerProfiles.department`, which is free text, not a
 *    canonical FK — inconsistent naming ("ICU" vs "Icu") will fragment a
 *    cohort that's really one department. Real signal, imperfect data
 *    hygiene, not a missing feature (see that function's own comment;
 *    this was originally flagged as entirely unavailable, which was
 *    wrong — corrected 2026-08-10).
 */
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "../db";
import {
  users,
  certificates,
  cpdEvents,
  cpdAttendees,
  careSignalEvents,
  codeSignalEvents,
  equipmentAuditLogs,
  providerProfiles,
} from "../../drizzle/schema";
import { computeCertificateExpiryDate, getCertificateExpiryStatus } from "../lib/certificate-expiry";

const EXPIRING_SOON_WINDOW_DAYS = 60;
const LIFE_SUPPORT_PROGRAM_TYPES = ["bls", "acls", "pals"] as const;

export type LifeSupportStatus = {
  programType: "bls" | "acls" | "pals";
  issueDate: Date;
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

  const [presented, attended, certRows, careSignalRows, codeSignalRows, auditRows] = await Promise.all([
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
      .select({ programType: certificates.programType, issueDate: certificates.issueDate, expiryDate: certificates.expiryDate })
      .from(certificates)
      .where(and(eq(certificates.userId, userId), inArray(certificates.programType, [...LIFE_SUPPORT_PROGRAM_TYPES]))),
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

  // Most recent certificate per program type wins, mirroring how the rest
  // of the platform (certificates.ts) treats renewals.
  const latestByProgram = new Map<string, (typeof certRows)[number]>();
  for (const c of certRows) {
    const existing = latestByProgram.get(c.programType);
    if (!existing || c.issueDate.getTime() > existing.issueDate.getTime()) {
      latestByProgram.set(c.programType, c);
    }
  }

  const lifeSupport: LifeSupportStatus[] = [...latestByProgram.values()]
    .filter((c): c is typeof c & { programType: "bls" | "acls" | "pals" } =>
      (LIFE_SUPPORT_PROGRAM_TYPES as readonly string[]).includes(c.programType)
    )
    .map((c) => {
      const expiresAt = c.expiryDate ?? computeCertificateExpiryDate(c.issueDate, c.programType);
      const rawStatus = getCertificateExpiryStatus(expiresAt, now);
      const daysToExpiry = (expiresAt.getTime() - now.getTime()) / 86_400_000;
      const status: LifeSupportStatus["status"] =
        rawStatus === "expired" ? "expired" : daysToExpiry <= EXPIRING_SOON_WINDOW_DAYS ? "expiring_soon" : "valid";
      return { programType: c.programType, issueDate: c.issueDate, expiresAt, status };
    });

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
  return computeMedianQiCount({ facilityId }, lastDays);
}

/**
 * Department-level median — added 2026-08-10 on a follow-up review. The
 * original version of this file stated department-level comparison wasn't
 * possible because `providerProfiles` had no structured department field —
 * that was wrong. `providerProfiles.department` (migration 0086) already
 * exists and is confirmed live in production (see WORK_STATUS 2026-08-03/05).
 * It's free text, not a canonical FK to `facilityDepartments`, so cohorts
 * are grouped by exact string match — typos or inconsistent naming
 * ("ICU" vs "Icu" vs "I.C.U.") will fragment a cohort that's really one
 * department. Real signal, just not perfectly clean; falls back to
 * facility-level (still available above) when a provider has no
 * `department` value set.
 */
export async function getDepartmentMedianQiCount(facilityId: number, department: string, lastDays: number): Promise<number> {
  return computeMedianQiCount({ facilityId, department }, lastDays);
}

async function computeMedianQiCount(scope: { facilityId: number; department?: string }, lastDays: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const since = new Date(Date.now() - lastDays * 24 * 60 * 60 * 1000);

  const providerIds = await db
    .select({ userId: providerProfiles.userId })
    .from(providerProfiles)
    .where(
      scope.department
        ? and(eq(providerProfiles.facilityId, scope.facilityId), eq(providerProfiles.department, scope.department))
        : eq(providerProfiles.facilityId, scope.facilityId)
    );
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
