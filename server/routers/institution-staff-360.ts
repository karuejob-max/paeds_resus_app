import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, isNull, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb, insertAdminAuditLog } from "../db";
import {
  certificates,
  cpdAttendees,
  cpdEvents,
  enrollments,
  institutionMemberships,
  institutionProductRoles,
  institutionalAccounts,
  institutionalProducts,
  institutionalStaffMembers,
  institutionDepartmentHeads,
  institutionDepartmentResponseCoordinators,
  institutionEducationCoordinators,
  ertlWeeklyRotations,
  shiftUtlRosters,
  users,
  facilityDepartments,
} from "../../drizzle/schema";
import { resolveStaff360Scope, assertStaff360DepartmentScope } from "../lib/institution-staff-360-access";
import { isInstitutionAdmin } from "../lib/institution-access";
import { buildStaff360Responsibilities, type Staff360StandingAppointment, type Staff360DatedDuty } from "../lib/institution-staff-360-responsibilities";

const inputSchema = z.object({ institutionId: z.number().int().positive() });

function searchPattern(search?: string) {
  const clean = search?.trim().replace(/[%_\\]/g, "") ?? "";
  return clean ? `%${clean}%` : null;
}

export const institutionStaff360Router = router({
  getDirectory: protectedProcedure.input(inputSchema.extend({ search: z.string().max(200).optional() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
    const scope = await resolveStaff360Scope(db, ctx.user, input.institutionId);
    const pattern = searchPattern(input.search);
    const predicates = [eq(institutionalStaffMembers.institutionalAccountId, input.institutionId), isNull(institutionalStaffMembers.removedAt)];
    if (!scope.institutionWide) predicates.push(inArray(institutionalStaffMembers.facilityDepartmentId, scope.departmentIds));
    if (pattern) predicates.push(or(like(institutionalStaffMembers.staffName, pattern), like(institutionalStaffMembers.staffEmail, pattern), like(institutionalStaffMembers.department, pattern))!);
    const rows = await db.select({
      staffMemberId: institutionalStaffMembers.id,
      userId: institutionalStaffMembers.userId,
      name: institutionalStaffMembers.staffName,
      email: institutionalStaffMembers.staffEmail,
      staffRole: institutionalStaffMembers.staffRole,
      department: institutionalStaffMembers.department,
      facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId,
      facilityLinkStatus: institutionalStaffMembers.facilityLinkStatus,
      membershipStatus: institutionMemberships.membershipStatus,
      enrollmentStatus: institutionalStaffMembers.enrollmentStatus,
      certificationStatus: institutionalStaffMembers.certificationStatus,
    }).from(institutionalStaffMembers)
      .leftJoin(institutionMemberships, and(eq(institutionMemberships.institutionalAccountId, input.institutionId), or(eq(institutionMemberships.staffMemberId, institutionalStaffMembers.id), eq(institutionMemberships.userId, institutionalStaffMembers.userId))))
      .where(and(...predicates)).orderBy(institutionalStaffMembers.staffName).limit(501);
    const capped = rows.length > 500;
    return { scope, rows: capped ? rows.slice(0, 500) : rows, institutionId: input.institutionId, capped, returnedCount: capped ? 500 : rows.length };
  }),

  getProfile: protectedProcedure.input(inputSchema.extend({ userId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
    const scope = await resolveStaff360Scope(db, ctx.user, input.institutionId);
    const [staff] = await db.select({
      staffMemberId: institutionalStaffMembers.id,
      userId: institutionalStaffMembers.userId,
      staffName: institutionalStaffMembers.staffName,
      staffEmail: institutionalStaffMembers.staffEmail,
      staffPhone: institutionalStaffMembers.staffPhone,
      staffRole: institutionalStaffMembers.staffRole,
      designation: institutionalStaffMembers.designation,
      governanceRole: institutionalStaffMembers.governanceRole,
      institutionalRole: institutionalStaffMembers.institutionalRole,
      department: institutionalStaffMembers.department,
      facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId,
      yearsOfExperience: institutionalStaffMembers.yearsOfExperience,
      enrollmentStatus: institutionalStaffMembers.enrollmentStatus,
      phaseStatus: institutionalStaffMembers.phaseStatus,
      facilityLinkStatus: institutionalStaffMembers.facilityLinkStatus,
      certificationStatus: institutionalStaffMembers.certificationStatus,
      certificationDate: institutionalStaffMembers.certificationDate,
      certificationExpiryDate: institutionalStaffMembers.certificationExpiryDate,
      enrollmentDate: institutionalStaffMembers.enrollmentDate,
      completionDate: institutionalStaffMembers.completionDate,
      createdAt: institutionalStaffMembers.createdAt,
      updatedAt: institutionalStaffMembers.updatedAt,
    }).from(institutionalStaffMembers).where(and(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId), eq(institutionalStaffMembers.userId, input.userId), isNull(institutionalStaffMembers.removedAt))).limit(1);
    if (!staff) throw new TRPCError({ code: "NOT_FOUND", message: "This person is not an active linked member of the institution." });
    assertStaff360DepartmentScope(scope, staff.facilityDepartmentId);
    const [user] = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, providerType: users.providerType, cadre: users.cadre, cadreOther: users.cadreOther, createdAt: users.createdAt, updatedAt: users.updatedAt }).from(users).where(eq(users.id, input.userId)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User account not found" });
    const [institution, memberships, cpd, roles, department, departmentHeadRows, ercoRows, educationRows, ertlDuties, utlDuties] = await Promise.all([
      db.select({ companyName: institutionalAccounts.companyName, status: institutionalAccounts.status }).from(institutionalAccounts).where(eq(institutionalAccounts.id, input.institutionId)).limit(1),
      db.select({ id: institutionMemberships.id, membershipStatus: institutionMemberships.membershipStatus, responsibilityRole: institutionMemberships.responsibilityRole, invitedAt: institutionMemberships.invitedAt, acceptedAt: institutionMemberships.acceptedAt, endedAt: institutionMemberships.endedAt }).from(institutionMemberships).where(and(eq(institutionMemberships.institutionalAccountId, input.institutionId), eq(institutionMemberships.userId, input.userId))).orderBy(desc(institutionMemberships.updatedAt)),
      db.select({ attendeeId: cpdAttendees.id, eventId: cpdAttendees.cpdEventId, eventName: cpdEvents.name, eventDate: cpdEvents.eventDate, eventDateAt: cpdEvents.eventDateAt, cpdPoints: cpdEvents.cpdPoints, attendanceStatus: cpdAttendees.attendanceStatus, submittedAt: cpdAttendees.submittedAt, attendanceVerifiedAt: cpdAttendees.attendanceVerifiedAt, department: cpdAttendees.department }).from(cpdAttendees).innerJoin(cpdEvents, eq(cpdAttendees.cpdEventId, cpdEvents.id)).where(and(eq(cpdAttendees.institutionalAccountId, input.institutionId), eq(cpdAttendees.userId, input.userId))).orderBy(desc(cpdAttendees.submittedAt)).limit(100),
      db.select({ id: institutionProductRoles.id, roleKey: institutionProductRoles.roleKey, roleStatus: institutionProductRoles.roleStatus, productKey: institutionalProducts.productKey, productName: institutionalProducts.displayName }).from(institutionProductRoles).innerJoin(institutionalProducts, eq(institutionProductRoles.productId, institutionalProducts.id)).where(and(eq(institutionProductRoles.institutionalAccountId, input.institutionId), or(eq(institutionProductRoles.userId, input.userId), eq(institutionProductRoles.invitedEmail, staff.staffEmail.toLowerCase())))),
      staff.facilityDepartmentId ? db.select({ id: facilityDepartments.id, name: facilityDepartments.departmentName, isActive: facilityDepartments.isActive }).from(facilityDepartments).where(eq(facilityDepartments.id, staff.facilityDepartmentId)).limit(1) : Promise.resolve([]),
      db.select({
        departmentId: institutionDepartmentHeads.departmentId,
        userId: institutionDepartmentHeads.userId,
        assignmentStatus: institutionDepartmentHeads.assignmentStatus,
        assignedAt: institutionDepartmentHeads.assignedAt,
        acceptedAt: institutionDepartmentHeads.acceptedAt,
        deputyUserId: institutionDepartmentHeads.deputyUserId,
        deputyAssignmentStatus: institutionDepartmentHeads.deputyAssignmentStatus,
        deputyAssignedAt: institutionDepartmentHeads.deputyAssignedAt,
        deputyAcceptedAt: institutionDepartmentHeads.deputyAcceptedAt,
      }).from(institutionDepartmentHeads).where(and(
        eq(institutionDepartmentHeads.institutionalAccountId, input.institutionId),
        staff.facilityDepartmentId ? eq(institutionDepartmentHeads.departmentId, staff.facilityDepartmentId) : sql`1 = 0`,
        or(eq(institutionDepartmentHeads.userId, input.userId), eq(institutionDepartmentHeads.deputyUserId, input.userId)),
      )),
      db.select({
        id: institutionDepartmentResponseCoordinators.id,
        departmentId: institutionDepartmentResponseCoordinators.departmentId,
        departmentLabel: facilityDepartments.departmentName,
        coordinatorUserId: institutionDepartmentResponseCoordinators.coordinatorUserId,
        deputyUserId: institutionDepartmentResponseCoordinators.deputyUserId,
        assignmentStatus: institutionDepartmentResponseCoordinators.assignmentStatus,
        deputyAssignmentStatus: institutionDepartmentResponseCoordinators.deputyAssignmentStatus,
        assignedAt: institutionDepartmentResponseCoordinators.assignedAt,
        acceptedAt: institutionDepartmentResponseCoordinators.acceptedAt,
        deputyAcceptedAt: institutionDepartmentResponseCoordinators.deputyAcceptedAt,
        effectiveFrom: institutionDepartmentResponseCoordinators.effectiveFrom,
        effectiveUntil: institutionDepartmentResponseCoordinators.effectiveUntil,
      }).from(institutionDepartmentResponseCoordinators)
        .leftJoin(facilityDepartments, eq(facilityDepartments.id, institutionDepartmentResponseCoordinators.departmentId))
        .where(and(
          eq(institutionDepartmentResponseCoordinators.institutionId, input.institutionId),
          or(
            eq(institutionDepartmentResponseCoordinators.coordinatorUserId, input.userId),
            eq(institutionDepartmentResponseCoordinators.deputyUserId, input.userId),
          ),
        )),
      db.select({
        id: institutionEducationCoordinators.id,
        departmentId: institutionEducationCoordinators.departmentId,
        departmentLabel: facilityDepartments.departmentName,
        userId: institutionEducationCoordinators.userId,
        deputyUserId: institutionEducationCoordinators.deputyUserId,
        assignmentStatus: institutionEducationCoordinators.assignmentStatus,
        deputyAssignmentStatus: institutionEducationCoordinators.deputyAssignmentStatus,
        assignedAt: institutionEducationCoordinators.assignedAt,
        acceptedAt: institutionEducationCoordinators.acceptedAt,
        deputyAssignedAt: institutionEducationCoordinators.deputyAssignedAt,
        deputyAcceptedAt: institutionEducationCoordinators.deputyAcceptedAt,
      }).from(institutionEducationCoordinators)
        .leftJoin(facilityDepartments, eq(facilityDepartments.id, institutionEducationCoordinators.departmentId))
        .where(and(
          eq(institutionEducationCoordinators.institutionalAccountId, input.institutionId),
          or(
            eq(institutionEducationCoordinators.userId, input.userId),
            eq(institutionEducationCoordinators.deputyUserId, input.userId),
          ),
        )),
      db.select({
        id: ertlWeeklyRotations.id,
        departmentId: ertlWeeklyRotations.departmentId,
        departmentLabel: facilityDepartments.departmentName,
        roleKey: sql<string>`'ertl'`,
        effectiveFrom: ertlWeeklyRotations.startDate,
        effectiveUntil: ertlWeeklyRotations.endDate,
        assignmentStatus: ertlWeeklyRotations.assignmentStatus,
        acceptedAt: ertlWeeklyRotations.acceptedAt,
        shiftType: sql<null>`NULL`,
      }).from(ertlWeeklyRotations)
        .leftJoin(facilityDepartments, eq(facilityDepartments.id, ertlWeeklyRotations.departmentId))
        .where(and(eq(ertlWeeklyRotations.institutionId, input.institutionId), eq(ertlWeeklyRotations.ertlUserId, input.userId)))
        .orderBy(desc(ertlWeeklyRotations.startDate)).limit(50),
      db.select({
        id: shiftUtlRosters.id,
        departmentId: shiftUtlRosters.departmentId,
        departmentLabel: facilityDepartments.departmentName,
        roleKey: sql<string>`CASE WHEN ${shiftUtlRosters.isShiftErtl} = 1 THEN 'ertl' ELSE 'utl' END`,
        effectiveFrom: shiftUtlRosters.shiftDate,
        effectiveUntil: shiftUtlRosters.shiftDate,
        assignmentStatus: shiftUtlRosters.assignmentStatus,
        acceptedAt: shiftUtlRosters.acceptedAt,
        shiftType: shiftUtlRosters.shiftType,
      }).from(shiftUtlRosters)
        .leftJoin(facilityDepartments, eq(facilityDepartments.id, shiftUtlRosters.departmentId))
        .where(and(eq(shiftUtlRosters.institutionId, input.institutionId), eq(shiftUtlRosters.utlUserId, input.userId)))
        .orderBy(desc(shiftUtlRosters.shiftDate)).limit(50),
    ]);
    const headRow = departmentHeadRows[0];
    const departmentalAppointment = headRow
      ? headRow.userId === input.userId && ["active", "pending_acceptance"].includes(headRow.assignmentStatus)
        ? { departmentId: headRow.departmentId, role: "primary" as const, label: "department_head" as const, status: headRow.assignmentStatus, assignedAt: headRow.assignedAt, acceptedAt: headRow.acceptedAt }
        : headRow.deputyUserId === input.userId && headRow.deputyAssignmentStatus && ["active", "pending_acceptance"].includes(headRow.deputyAssignmentStatus)
          ? { departmentId: headRow.departmentId, role: "deputy" as const, label: "deputy_department_head" as const, status: headRow.deputyAssignmentStatus, assignedAt: headRow.deputyAssignedAt, acceptedAt: headRow.deputyAcceptedAt }
          : null
      : null;
    const now = Date.now();
    const standingAppointments: Staff360StandingAppointment[] = [];
    for (const row of departmentHeadRows) {
      if (row.userId === input.userId) standingAppointments.push({ kind: "department_head", scope: "department", departmentId: row.departmentId, departmentLabel: department[0]?.name ?? null, status: row.assignmentStatus as Staff360StandingAppointment["status"], assignedAt: row.assignedAt, acceptedAt: row.acceptedAt, effectiveFrom: null, effectiveUntil: null, source: "department_head", sourceId: null });
      if (row.deputyUserId === input.userId && row.deputyAssignmentStatus) standingAppointments.push({ kind: "deputy_department_head", scope: "department", departmentId: row.departmentId, departmentLabel: department[0]?.name ?? null, status: row.deputyAssignmentStatus as Staff360StandingAppointment["status"], assignedAt: row.deputyAssignedAt, acceptedAt: row.deputyAcceptedAt, effectiveFrom: null, effectiveUntil: null, source: "department_head", sourceId: null });
    }
    for (const row of ercoRows) {
      if (row.coordinatorUserId === input.userId) standingAppointments.push({ kind: "department_erco", scope: "department", departmentId: row.departmentId, departmentLabel: row.departmentLabel ?? null, status: row.assignmentStatus as Staff360StandingAppointment["status"], assignedAt: row.assignedAt, acceptedAt: row.acceptedAt, effectiveFrom: row.effectiveFrom, effectiveUntil: row.effectiveUntil, source: "department_erco", sourceId: row.id });
      if (row.deputyUserId === input.userId && row.deputyAssignmentStatus) standingAppointments.push({ kind: "deputy_department_erco", scope: "department", departmentId: row.departmentId, departmentLabel: row.departmentLabel ?? null, status: row.deputyAssignmentStatus as Staff360StandingAppointment["status"], assignedAt: row.assignedAt, acceptedAt: row.deputyAcceptedAt, effectiveFrom: row.effectiveFrom, effectiveUntil: row.effectiveUntil, source: "department_erco", sourceId: row.id });
    }
    for (const row of educationRows) {
      if (row.userId === input.userId) standingAppointments.push({ kind: "department_cpd_coordinator", scope: "department", departmentId: row.departmentId, departmentLabel: row.departmentLabel ?? null, status: row.assignmentStatus as Staff360StandingAppointment["status"], assignedAt: row.assignedAt, acceptedAt: row.acceptedAt, effectiveFrom: null, effectiveUntil: null, source: "education_coordinator", sourceId: row.id });
      if (row.deputyUserId === input.userId && row.deputyAssignmentStatus) standingAppointments.push({ kind: "deputy_department_cpd_coordinator", scope: "department", departmentId: row.departmentId, departmentLabel: row.departmentLabel ?? null, status: row.deputyAssignmentStatus as Staff360StandingAppointment["status"], assignedAt: row.deputyAssignedAt, acceptedAt: row.deputyAcceptedAt, effectiveFrom: null, effectiveUntil: null, source: "education_coordinator", sourceId: row.id });
    }
    const productRoleRows = roles.map((role) => ({ id: role.id, productKey: role.productKey, roleKey: role.roleKey, roleStatus: role.roleStatus }));
    for (const role of productRoleRows) {
      if (role.roleStatus !== "active") continue;
      if (role.roleKey === "iers_coordinator") standingAppointments.push({ kind: "institutional_erco", scope: "institution", departmentId: null, departmentLabel: null, status: "active", assignedAt: null, acceptedAt: null, effectiveFrom: null, effectiveUntil: null, source: "product_role", sourceId: role.id });
      if (role.roleKey === "cpd_coordinator" || role.roleKey === "cpd_education_coordinator") standingAppointments.push({ kind: "institutional_cpd_coordinator", scope: "institution", departmentId: null, departmentLabel: null, status: "active", assignedAt: null, acceptedAt: null, effectiveFrom: null, effectiveUntil: null, source: "product_role", sourceId: role.id });
    }
    const datedDuties: Staff360DatedDuty[] = [...ertlDuties, ...utlDuties].map((row) => ({ assignmentId: row.id, roleScope: row.roleKey === "ertl" ? "ertl" : "utl", roleKey: row.roleKey, departmentId: row.departmentId, departmentLabel: row.departmentLabel ?? null, effectiveFrom: row.effectiveFrom, effectiveUntil: row.effectiveUntil, shiftType: row.shiftType, assignmentStatus: row.assignmentStatus as Staff360DatedDuty["assignmentStatus"], acceptedAt: row.acceptedAt }));
    const responsibilities = buildStaff360Responsibilities({ standingAppointments, productRoles: productRoleRows, datedDuties });
    const actions: Array<{ key: string; severity: "high" | "medium" | "low"; label: string; detail: string }> = [];
    if (staff.facilityLinkStatus !== "linked") actions.push({ key: "link", severity: "high", label: "Institution link needs review", detail: `Current link status is ${staff.facilityLinkStatus ?? "not recorded"}.` });
    if (staff.facilityDepartmentId == null) actions.push({ key: "department", severity: "medium", label: "Department mapping needs review", detail: "This record has no canonical facility department." });
    if (staff.certificationExpiryDate && new Date(staff.certificationExpiryDate).getTime() < now) actions.push({ key: "certificate", severity: "medium", label: "Institutional certification expired", detail: "Review renewal or evidence status before relying on the record." });
    if (staff.enrollmentStatus === "pending" || staff.enrollmentStatus === "in_progress") actions.push({ key: "training", severity: "low", label: "Institutional training is not complete", detail: `Current training status is ${staff.enrollmentStatus}.` });
    if (memberships.some(row => row.membershipStatus === "active" && !row.acceptedAt)) actions.push({ key: "acceptance", severity: "medium", label: "Membership acceptance is not recorded", detail: "Confirm the person has accepted the institutional membership." });
    void insertAdminAuditLog({ adminUserId: ctx.user.id, procedurePath: "institutionStaff360.getProfile", inputSummary: JSON.stringify({ institutionId: input.institutionId, userId: input.userId, scope: scope.authority }), createdAt: new Date() });
    return {
      generatedAt: new Date(),
      scope,
      institution: institution[0] ?? null,
      department: department[0] ?? null,
      staff,
      departmentalAppointment,
      user,
      memberships,
      roles,
      responsibilities,
      cpd,
      actions,
      sourceBoundary: "Institution-scoped read-only record. Training, attendance, certificates and assignments are evidence states; none is proof of competence, licensure, dispatch authority or clinical performance.",
      excluded: ["other institutions", "platform payment history", "passwords and login metadata", "private clinical narratives", "platform risk and support notes"],
    };
  }),
});
