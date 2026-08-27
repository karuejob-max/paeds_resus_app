import { and, asc, desc, eq, gte, inArray, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import {
  facilityDepartments,
  iersActivationEvents,
  iersActivationTeamSnapshots,
  iersShiftRoleAssignments,
  iersShiftTeams,
  iersTargetedRoleReports,
  institutionMemberships,
  institutionalStaffMembers,
  users,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

const reportPhase = z.enum(["recognition", "activation", "response", "stabilization", "recovery_debrief"]);
const observationCode = z.enum([
  "equipment_gap",
  "role_clarity",
  "communication_barrier",
  "task_completed",
  "escalation_made",
  "access_delay",
  "medication_access_issue",
  "airway_access_issue",
  "handoff_issue",
  "other",
]);

async function getTeamContext(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number, activationEventId: number, teamId: number) {
  const [event] = await db.select().from(iersActivationEvents).where(eq(iersActivationEvents.id, activationEventId)).limit(1);
  const [team] = await db.select().from(iersShiftTeams).where(eq(iersShiftTeams.id, teamId)).limit(1);
  if (!event || !team || event.institutionalAccountId !== team.institutionId) throw new TRPCError({ code: "NOT_FOUND", message: "The activation or team context is not available." });
  const [member] = await db
    .select({ poleId: facilityDepartments.poleId, institutionId: institutionalStaffMembers.institutionalAccountId })
    .from(institutionalStaffMembers)
    .innerJoin(institutionMemberships, and(eq(institutionMemberships.userId, userId), eq(institutionMemberships.institutionalAccountId, team.institutionId), eq(institutionMemberships.membershipStatus, "active")))
    .leftJoin(facilityDepartments, eq(facilityDepartments.id, institutionalStaffMembers.facilityDepartmentId))
    .where(and(eq(institutionalStaffMembers.userId, userId), eq(institutionalStaffMembers.institutionalAccountId, team.institutionId), isNull(institutionalStaffMembers.removedAt)))
    .limit(1);
  if (!member || member.poleId !== team.poleId) throw new TRPCError({ code: "FORBIDDEN", message: "Only active providers assigned to this pole can view its activation team." });
  return { event, team };
}

async function ensureSnapshot(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, activationEventId: number, team: typeof iersShiftTeams.$inferSelect) {
  const existing = await db.select().from(iersActivationTeamSnapshots).where(and(eq(iersActivationTeamSnapshots.activationEventId, activationEventId), eq(iersActivationTeamSnapshots.teamId, team.id)));
  if (existing.length > 0) return existing;
  const assignments = await db.select().from(iersShiftRoleAssignments).where(eq(iersShiftRoleAssignments.teamId, team.id));
  for (const assignment of assignments) {
    if (assignment.departmentId == null) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The ERT assignment has no department scope." });
    await db.insert(iersActivationTeamSnapshots).values({ activationEventId, teamId: team.id, teamVersion: team.teamVersion, institutionId: team.institutionId, poleId: team.poleId, departmentId: assignment.departmentId, providerUserId: assignment.providerUserId, roleScope: assignment.roleScope, roleKey: assignment.roleKey, assignmentStatus: assignment.assignmentStatus }).onDuplicateKeyUpdate({ set: { roleKey: assignment.roleKey } });
  }
  return db.select().from(iersActivationTeamSnapshots).where(and(eq(iersActivationTeamSnapshots.activationEventId, activationEventId), eq(iersActivationTeamSnapshots.teamId, team.id)));
}

export const iersTargetedReportsRouter = router({
  listOpenActivationsForTeam: protectedProcedure
    .input(z.object({ teamId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const [team] = await db.select().from(iersShiftTeams).where(eq(iersShiftTeams.id, input.teamId)).limit(1);
      if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "Shift team not found." });
      const [providerScope] = await db.select({ poleId: facilityDepartments.poleId }).from(institutionalStaffMembers).innerJoin(institutionMemberships, and(eq(institutionMemberships.userId, ctx.user.id), eq(institutionMemberships.institutionalAccountId, team.institutionId), eq(institutionMemberships.membershipStatus, "active"))).leftJoin(facilityDepartments, eq(facilityDepartments.id, institutionalStaffMembers.facilityDepartmentId)).where(and(eq(institutionalStaffMembers.userId, ctx.user.id), eq(institutionalStaffMembers.institutionalAccountId, team.institutionId), isNull(institutionalStaffMembers.removedAt))).limit(1);
      if (!providerScope || providerScope.poleId !== team.poleId) throw new TRPCError({ code: "FORBIDDEN", message: "Only active providers assigned to this pole can view its activations." });
      return db.select({ id: iersActivationEvents.id, institutionId: iersActivationEvents.institutionalAccountId, activationType: iersActivationEvents.activationType, status: iersActivationEvents.status, location: iersActivationEvents.location, department: iersActivationEvents.department, triggeredAt: iersActivationEvents.triggeredAt }).from(iersActivationEvents).where(and(eq(iersActivationEvents.institutionalAccountId, team.institutionId), gte(iersActivationEvents.triggeredAt, new Date(Date.now() - 48 * 60 * 60 * 1000)), inArray(iersActivationEvents.status, ["triggered", "notifying", "acknowledged", "responding", "at_scene", "stabilized", "debrief_pending"]))).orderBy(desc(iersActivationEvents.triggeredAt)).limit(20);
    }),

  getActivationTeam: protectedProcedure
    .input(z.object({ activationEventId: z.number().int().positive(), teamId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const { event, team } = await getTeamContext(db, ctx.user.id, input.activationEventId, input.teamId);
      const snapshots = await db.select().from(iersActivationTeamSnapshots).where(and(eq(iersActivationTeamSnapshots.activationEventId, input.activationEventId), eq(iersActivationTeamSnapshots.teamId, input.teamId))).orderBy(asc(iersActivationTeamSnapshots.roleScope), asc(iersActivationTeamSnapshots.roleKey));
      const assignments = snapshots.length === 0 ? await db.select({ assignment: iersShiftRoleAssignments, providerName: users.name, providerEmail: users.email }).from(iersShiftRoleAssignments).leftJoin(users, eq(users.id, iersShiftRoleAssignments.providerUserId)).where(eq(iersShiftRoleAssignments.teamId, input.teamId)).orderBy(asc(iersShiftRoleAssignments.roleScope), asc(iersShiftRoleAssignments.roleKey)) : [];
      const members = snapshots.length > 0
        ? await Promise.all(snapshots.map(async (snapshot) => { const [provider] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, snapshot.providerUserId)).limit(1); return { ...snapshot, providerName: provider?.name ?? provider?.email ?? "Provider", isCurrentUser: snapshot.providerUserId === ctx.user.id }; }))
        : assignments.map(({ assignment, providerName, providerEmail }) => ({ id: assignment.id, activationEventId: input.activationEventId, teamId: assignment.teamId, teamVersion: team.teamVersion, institutionId: assignment.institutionId, poleId: assignment.poleId, departmentId: assignment.departmentId, providerUserId: assignment.providerUserId, roleScope: assignment.roleScope, roleKey: assignment.roleKey, assignmentStatus: assignment.assignmentStatus, snapshottedAt: null, providerName: providerName ?? providerEmail ?? "Provider", isCurrentUser: assignment.providerUserId === ctx.user.id }));
      return { activation: { id: event.id, activationType: event.activationType, status: event.status, location: event.location, department: event.department, triggeredAt: event.triggeredAt }, team: { id: team.id, poleId: team.poleId, teamVersion: team.teamVersion }, members };
    }),

  submitRoleReport: protectedProcedure
    .input(z.object({
      activationEventId: z.number().int().positive(),
      teamId: z.number().int().positive(),
      assignmentId: z.number().int().positive(),
      clientRequestId: z.string().trim().min(8).max(128),
      reportPhase,
      observationCode,
      timingCategory: z.string().trim().max(64).optional(),
      narrative: z.string().trim().max(2000).optional(),
      noPatientIdentifiersAcknowledged: z.literal(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const { event, team } = await getTeamContext(db, ctx.user.id, input.activationEventId, input.teamId);
      const [assignment] = await db.select().from(iersShiftRoleAssignments).where(and(eq(iersShiftRoleAssignments.id, input.assignmentId), eq(iersShiftRoleAssignments.teamId, input.teamId), eq(iersShiftRoleAssignments.providerUserId, ctx.user.id), ne(iersShiftRoleAssignments.assignmentStatus, "declined"))).limit(1);
      if (!assignment || !["accepted"].includes(assignment.assignmentStatus)) throw new TRPCError({ code: "FORBIDDEN", message: "Only an accepted assigned ERT role can submit a targeted role report." });
      const [existingRequest] = await db.select({ id: iersTargetedRoleReports.id }).from(iersTargetedRoleReports).where(and(eq(iersTargetedRoleReports.providerUserId, ctx.user.id), eq(iersTargetedRoleReports.idempotencyKey, input.clientRequestId))).limit(1);
      if (existingRequest) return { success: true, reportId: existingRequest.id, duplicate: true };
      const departmentId = assignment.departmentId;
      if (departmentId == null) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The accepted ERT assignment has no department scope." });
      const snapshots = await ensureSnapshot(db, input.activationEventId, team);
      const snapshot = snapshots.find((row) => row.providerUserId === ctx.user.id && row.roleKey === assignment.roleKey);
      if (!snapshot) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The activation team snapshot could not be resolved." });
      const inserted = await db.insert(iersTargetedRoleReports).values({ activationEventId: event.id, teamId: team.id, assignmentId: assignment.id, roleSnapshotId: snapshot.id, institutionId: team.institutionId, poleId: team.poleId, departmentId, providerUserId: ctx.user.id, idempotencyKey: input.clientRequestId, roleAtEvent: assignment.roleKey, reportPhase: input.reportPhase, observationCode: input.observationCode, timingCategory: input.timingCategory ?? null, narrative: input.narrative ?? null, noPatientIdentifiersAcknowledged: true, submissionState: "submitted", submittedAt: new Date() });
      return { success: true, reportId: Number((inserted as unknown as { insertId: number }).insertId) };
    }),
});
