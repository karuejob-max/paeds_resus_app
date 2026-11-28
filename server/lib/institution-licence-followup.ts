import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, ne } from "drizzle-orm";
import {
  inAppNotifications,
  institutionalAccounts,
  institutionalStaffMembers,
  professionalCredentials,
  users,
} from "../../drizzle/schema";
import type { getDb } from "../db";
import { activeStaffCondition } from "./institution-active-member";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/** Professional identities that hold a regulatory licence. */
export const LICENSED_PROVIDER_TYPES = new Set(["nurse", "doctor", "pharmacist", "paramedic", "lab_tech", "respiratory_therapist", "midwife"]);
/** Someone who joins after the deadline was set gets this long from the day they joined. */
export const NEW_JOINER_GRACE_DAYS = 30;
/** A person is reminded at most once in this many days. */
export const REMINDER_COOLDOWN_DAYS = 7;
export const EXPIRING_SOON_DAYS = 90;
export const LICENCE_NOTIFICATION_TYPE = "licence_followup";

export type LicenceState = "no_licence" | "pending_review" | "rejected" | "revoked" | "expired" | "expiring" | "current";
const DAY = 24 * 60 * 60 * 1000;

export type LicenceCredentialRow = { status: string; expiresAt: Date | null };

export function licenceStateOf(row: LicenceCredentialRow | undefined, now: Date = new Date()): LicenceState {
  if (!row) return "no_licence";
  if (row.status === "pending") return "pending_review";
  if (row.status === "rejected") return "rejected";
  if (row.status === "revoked") return "revoked";
  if (row.status !== "verified") return "no_licence";
  if (!row.expiresAt) return "current";
  const left = row.expiresAt.getTime() - now.getTime();
  if (left <= 0) return "expired";
  if (left <= EXPIRING_SOON_DAYS * DAY) return "expiring";
  return "current";
}

/** States where the person has to do something. Pending review is waiting on the reviewer, not the person. */
export function personMustAct(state: LicenceState): boolean {
  return state === "no_licence" || state === "rejected" || state === "revoked" || state === "expired";
}

export function isLicensedIdentity(input: { providerType?: string | null; staffRole?: string | null }): boolean {
  return LICENSED_PROVIDER_TYPES.has(input.providerType ?? "") || input.staffRole === "nurse";
}

/** When this person's licence is due. Null when the institution has set no requirement. */
export function licenceDueAt(institutionDeadline: Date | null, joinedAt: Date): Date | null {
  if (!institutionDeadline) return null;
  const afterJoining = new Date(joinedAt.getTime() + NEW_JOINER_GRACE_DAYS * DAY);
  return afterJoining.getTime() > institutionDeadline.getTime() ? afterJoining : institutionDeadline;
}

export type StaffLicenceRow = {
  staffId: number;
  userId: number | null;
  name: string;
  email: string;
  department: string | null;
  staffRole: string | null;
  providerType: string | null;
  joinedAt: Date;
  credential?: LicenceCredentialRow;
};

export type LicencePerson = {
  staffId: number;
  userId: number | null;
  name: string;
  department: string | null;
  licensed: boolean;
  identityMissing: boolean;
  state: LicenceState;
  dueAt: Date | null;
  overdue: boolean;
  mustAct: boolean;
};

export function buildLicenceFollowUp(rows: StaffLicenceRow[], institutionDeadline: Date | null, now: Date = new Date()) {
  const people: LicencePerson[] = rows.map((row) => {
    const licensed = isLicensedIdentity(row);
    const state = licenceStateOf(row.credential, now);
    const dueAt = licensed ? licenceDueAt(institutionDeadline, row.joinedAt) : null;
    const mustAct = licensed && personMustAct(state);
    return {
      staffId: row.staffId,
      userId: row.userId,
      name: row.name,
      department: row.department,
      licensed,
      identityMissing: !licensed && !row.providerType,
      state,
      dueAt,
      overdue: Boolean(dueAt && dueAt.getTime() <= now.getTime() && mustAct),
      mustAct,
    };
  });
  const counts = { licensedStaff: 0, current: 0, expiring: 0, pending: 0, mustAct: 0, overdue: 0, identityMissing: 0 };
  for (const person of people) {
    if (person.identityMissing) counts.identityMissing += 1;
    if (!person.licensed) continue;
    counts.licensedStaff += 1;
    if (person.state === "current") counts.current += 1;
    if (person.state === "expiring") counts.expiring += 1;
    if (person.state === "pending_review") counts.pending += 1;
    if (person.mustAct) counts.mustAct += 1;
    if (person.overdue) counts.overdue += 1;
  }
  return { counts, people };
}

/** Who gets a reminder now: people who must act, have an account, and were not reminded recently. */
export function pickReminderTargets(people: LicencePerson[], recentlyRemindedUserIds: Set<number>) {
  const targets: LicencePerson[] = [];
  let skippedRecently = 0;
  for (const person of people) {
    if (!person.mustAct || person.userId == null) continue;
    if (recentlyRemindedUserIds.has(person.userId)) { skippedRecently += 1; continue; }
    targets.push(person);
  }
  return { targets, skippedRecently };
}

export async function loadStaffLicenceRows(db: Db, institutionId: number, departmentIds: number[] | null): Promise<StaffLicenceRow[]> {
  const staff = await db
    .select({
      staffId: institutionalStaffMembers.id,
      userId: institutionalStaffMembers.userId,
      name: institutionalStaffMembers.staffName,
      email: institutionalStaffMembers.staffEmail,
      department: institutionalStaffMembers.department,
      departmentId: institutionalStaffMembers.facilityDepartmentId,
      staffRole: institutionalStaffMembers.staffRole,
      joinedAt: institutionalStaffMembers.createdAt,
      providerType: users.providerType,
    })
    .from(institutionalStaffMembers)
    .leftJoin(users, eq(users.id, institutionalStaffMembers.userId))
    .where(and(eq(institutionalStaffMembers.institutionalAccountId, institutionId), activeStaffCondition()));
  const scoped = departmentIds ? staff.filter((row) => row.departmentId != null && departmentIds.includes(row.departmentId)) : staff;
  const userIds = scoped.map((row) => row.userId).filter((id): id is number => id != null);
  const latest = new Map<number, LicenceCredentialRow>();
  if (userIds.length > 0) {
    const credentials = await db
      .select({ userId: professionalCredentials.userId, status: professionalCredentials.status, expiresAt: professionalCredentials.expiresAt })
      .from(professionalCredentials)
      .where(
        and(
          inArray(professionalCredentials.userId, userIds),
          eq(professionalCredentials.credentialType, "regulatory_license"),
          ne(professionalCredentials.status, "superseded"),
        ),
      )
      .orderBy(desc(professionalCredentials.updatedAt));
    for (const row of credentials) if (!latest.has(row.userId)) latest.set(row.userId, { status: row.status, expiresAt: row.expiresAt });
  }
  return scoped.map((row) => ({
    staffId: row.staffId,
    userId: row.userId,
    name: row.name,
    email: row.email,
    department: row.department,
    staffRole: row.staffRole,
    providerType: row.providerType ?? null,
    joinedAt: row.joinedAt,
    credential: row.userId != null ? latest.get(row.userId) : undefined,
  }));
}

export async function getInstitutionLicenceDeadline(db: Db, institutionId: number): Promise<Date | null> {
  const [row] = await db
    .select({ deadline: institutionalAccounts.licenceDeadlineAt })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, institutionId))
    .limit(1);
  return row?.deadline ?? null;
}

function actionUrl() {
  return `${(process.env.APP_BASE_URL?.trim() || "https://www.paedsresus.com").replace(/\/$/, "")}/provider-profile#professional-credentials`;
}

function dateLabel(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function notifyPeople(db: Db, institutionId: number, institutionName: string, targets: LicencePerson[], deadline: Date | null, announcement: boolean) {
  const rows = targets
    .filter((person) => person.userId != null)
    .map((person) => ({
      userId: person.userId!,
      type: LICENCE_NOTIFICATION_TYPE,
      domain: "credentials",
      severity: person.overdue ? "high" : "normal",
      requiresAction: true,
      institutionId,
      dueAt: person.dueAt ?? deadline,
      title: person.identityMissing ? "Set your professional role" : announcement ? `${institutionName} now requires your professional licence` : "Add your professional licence",
      body: person.identityMissing
        ? `Tell us your professional role (nurse, doctor, clinical officer and so on) so ${institutionName} can see whether a licence is needed and unlock the right emergency-response roles.`
        : person.state === "expired"
        ? `Your professional licence has expired. Submit your renewed licence so ${institutionName} can verify it.`
        : person.state === "rejected" || person.state === "revoked"
          ? `Your submitted licence was not accepted. Open Professional Credentials, read the reason, and submit it again.`
          : `${institutionName} needs your regulatory licence number and a copy of your licence${person.dueAt ? ` by ${dateLabel(person.dueAt)}` : ""}. It unlocks emergency-response roles and shows you as duty-ready.`,
      actionUrl: actionUrl(),
      relatedId: institutionId,
    }));
  if (rows.length > 0) await db.insert(inAppNotifications).values(rows);
  return rows.length;
}

/** Send a reminder to everyone who must act and has not been reminded in the last week. */
export async function remindMissingLicences(db: Db, input: { institutionId: number; departmentIds: number[] | null }) {
  const [inst] = await db
    .select({ name: institutionalAccounts.companyName, deadline: institutionalAccounts.licenceDeadlineAt })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, input.institutionId))
    .limit(1);
  if (!inst) throw new TRPCError({ code: "NOT_FOUND", message: "Institution not found" });
  const rows = await loadStaffLicenceRows(db, input.institutionId, input.departmentIds);
  const { people } = buildLicenceFollowUp(rows, inst.deadline);
  const ids = people.map((p) => p.userId).filter((id): id is number => id != null);
  const since = new Date(Date.now() - REMINDER_COOLDOWN_DAYS * DAY);
  const recent = ids.length
    ? await db
        .select({ userId: inAppNotifications.userId })
        .from(inAppNotifications)
        .where(and(inArray(inAppNotifications.userId, ids), eq(inAppNotifications.type, LICENCE_NOTIFICATION_TYPE), eq(inAppNotifications.institutionId, input.institutionId), gte(inAppNotifications.createdAt, since)))
    : [];
  const { targets, skippedRecently } = pickReminderTargets(people, new Set(recent.map((r) => r.userId)));
  const sent = await notifyPeople(db, input.institutionId, inst.name, targets, inst.deadline, false);
  return { sent, skippedRecently };
}

/** An institution administrator sets (or clears) the date by which licensed staff must hold a verified licence. */
export async function setLicenceDeadline(db: Db, input: { institutionId: number; actorUserId: number; deadline: Date | null; notifyStaff: boolean }) {
  if (input.deadline && input.deadline.getTime() < Date.now() + DAY) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a date at least a day from now." });
  }
  const [inst] = await db
    .select({ name: institutionalAccounts.companyName })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, input.institutionId))
    .limit(1);
  if (!inst) throw new TRPCError({ code: "NOT_FOUND", message: "Institution not found" });
  await db
    .update(institutionalAccounts)
    .set({ licenceDeadlineAt: input.deadline, licenceDeadlineSetByUserId: input.deadline ? input.actorUserId : null })
    .where(eq(institutionalAccounts.id, input.institutionId));
  if (!input.deadline || !input.notifyStaff) return { announced: 0 };
  const rows = await loadStaffLicenceRows(db, input.institutionId, null);
  const { people } = buildLicenceFollowUp(rows, input.deadline);
  const announced = await notifyPeople(db, input.institutionId, inst.name, people.filter((p) => p.mustAct || p.identityMissing), input.deadline, true);
  return { announced };
}

/** What the signed-in provider has to do about their licence, per institution they belong to. */
export async function getMyLicenceTasks(db: Db, userId: number) {
  const staff = await db
    .select({
      institutionId: institutionalStaffMembers.institutionalAccountId,
      institutionName: institutionalAccounts.companyName,
      deadline: institutionalAccounts.licenceDeadlineAt,
      staffRole: institutionalStaffMembers.staffRole,
      joinedAt: institutionalStaffMembers.createdAt,
      providerType: users.providerType,
    })
    .from(institutionalStaffMembers)
    .innerJoin(institutionalAccounts, eq(institutionalAccounts.id, institutionalStaffMembers.institutionalAccountId))
    .leftJoin(users, eq(users.id, institutionalStaffMembers.userId))
    .where(and(eq(institutionalStaffMembers.userId, userId), activeStaffCondition()));
  if (staff.length === 0) return [];
  const [credential] = await db
    .select({ status: professionalCredentials.status, expiresAt: professionalCredentials.expiresAt })
    .from(professionalCredentials)
    .where(and(eq(professionalCredentials.userId, userId), eq(professionalCredentials.credentialType, "regulatory_license"), ne(professionalCredentials.status, "superseded")))
    .orderBy(desc(professionalCredentials.updatedAt))
    .limit(1);
  const state = licenceStateOf(credential);
  const now = new Date();
  const tasks = [];
  for (const row of staff) {
    if (row.institutionId == null) continue;
    const licensed = isLicensedIdentity(row);
    const identityMissing = !licensed && !row.providerType;
    if (!identityMissing && !(licensed && personMustAct(state))) continue;
    if (!row.deadline && !licensed) continue; // do not nag people about a requirement that does not exist yet
    const dueAt = licenceDueAt(row.deadline, row.joinedAt);
    tasks.push({
      institutionId: row.institutionId,
      institutionName: row.institutionName,
      state,
      identityMissing,
      dueAt,
      overdue: Boolean(dueAt && dueAt.getTime() <= now.getTime()),
      required: Boolean(row.deadline),
    });
  }
  return tasks;
}
