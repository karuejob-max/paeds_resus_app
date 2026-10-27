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
  users,
  facilityDepartments,
} from "../../drizzle/schema";
import { resolveStaff360Scope, assertStaff360DepartmentScope } from "../lib/institution-staff-360-access";
import { isInstitutionAdmin } from "../lib/institution-access";

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
      .where(and(...predicates)).orderBy(institutionalStaffMembers.staffName).limit(500);
    return { scope, rows, institutionId: input.institutionId };
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
    const [institution, memberships, cpd, roles, department, departmentHeadRows] = await Promise.all([
      db.select({ companyName: institutionalAccounts.companyName, status: institutionalAccounts.status }).from(institutionalAccounts).where(eq(institutionalAccounts.id, input.institutionId)).limit(1),
      db.select({ id: institutionMemberships.id, membershipStatus: institutionMemberships.membershipStatus, responsibilityRole: institutionMemberships.responsibilityRole, invitedAt: institutionMemberships.invitedAt, acceptedAt: institutionMemberships.acceptedAt, endedAt: institutionMemberships.endedAt }).from(institutionMemberships).where(and(eq(institutionMemberships.institutionalAccountId, input.institutionId), eq(institutionMemberships.userId, input.userId))).orderBy(desc(institutionMemberships.updatedAt)),
      db.select({ attendeeId: cpdAttendees.id, eventId: cpdAttendees.cpdEventId, eventName: cpdEvents.name, eventDate: cpdEvents.eventDate, eventDateAt: cpdEvents.eventDateAt, cpdPoints: cpdEvents.cpdPoints, attendanceStatus: cpdAttendees.attendanceStatus, submittedAt: cpdAttendees.submittedAt, attendanceVerifiedAt: cpdAttendees.attendanceVerifiedAt, department: cpdAttendees.department }).from(cpdAttendees).innerJoin(cpdEvents, eq(cpdAttendees.cpdEventId, cpdEvents.id)).where(and(eq(cpdAttendees.institutionalAccountId, input.institutionId), eq(cpdAttendees.userId, input.userId))).orderBy(desc(cpdAttendees.submittedAt)).limit(100),
      db.select({ roleKey: institutionProductRoles.roleKey, roleStatus: institutionProductRoles.roleStatus, productKey: institutionalProducts.productKey, productName: institutionalProducts.displayName }).from(institutionProductRoles).innerJoin(institutionalProducts, eq(institutionProductRoles.productId, institutionalProducts.id)).where(and(eq(institutionProductRoles.institutionalAccountId, input.institutionId), or(eq(institutionProductRoles.userId, input.userId), eq(institutionProductRoles.invitedEmail, staff.staffEmail.toLowerCase())))),
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
      cpd,
      actions,
      sourceBoundary: "Institution-scoped read-only record. Training, attendance, certificates and assignments are evidence states; none is proof of competence, licensure, dispatch authority or clinical performance.",
      excluded: ["other institutions", "platform payment history", "passwords and login metadata", "private clinical narratives", "platform risk and support notes"],
    };
  }),
});
