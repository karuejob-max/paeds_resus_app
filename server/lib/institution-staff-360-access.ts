import { TRPCError } from "@trpc/server";
import { and, eq, inArray, or } from "drizzle-orm";
import {
  institutionDepartmentHeads,
  institutionDepartmentResponseCoordinators,
  institutionEducationCoordinators,
  institutionProductRoles,
  institutionalProducts,
} from "../../drizzle/schema";
import type { User } from "../../drizzle/schema";
import type { AppDb } from "./institution-access";
import { isInstitutionAdmin } from "./institution-access";

export type Staff360Scope = {
  authority: "platform_admin" | "institution_admin" | "institution_role" | "department_role";
  institutionWide: boolean;
  departmentIds: number[];
};

const INSTITUTION_WIDE_READ_ROLES = [
  "iers_chair",
  "iers_governance",
  "iers_coordinator",
  "iers_reviewer",
  "iers_viewer",
  "cpd_coordinator",
  "cpd_reviewer",
  "cpd_reporter",
  "cpd_viewer",
] as const;

async function getDepartmentRoleScope(db: AppDb, user: Pick<User, "id">, institutionId: number) {
  const [heads, ercos, education] = await Promise.all([
    db.select({ departmentId: institutionDepartmentHeads.departmentId })
      .from(institutionDepartmentHeads)
      .where(and(eq(institutionDepartmentHeads.institutionalAccountId, institutionId), or(
        and(eq(institutionDepartmentHeads.userId, user.id), eq(institutionDepartmentHeads.assignmentStatus, "active")),
        and(eq(institutionDepartmentHeads.deputyUserId, user.id), eq(institutionDepartmentHeads.deputyAssignmentStatus, "active")),
      ))),
    db.select({ departmentId: institutionDepartmentResponseCoordinators.departmentId })
      .from(institutionDepartmentResponseCoordinators)
      .where(and(eq(institutionDepartmentResponseCoordinators.institutionId, institutionId), eq(institutionDepartmentResponseCoordinators.assignmentStatus, "active"), or(
        eq(institutionDepartmentResponseCoordinators.coordinatorUserId, user.id),
        eq(institutionDepartmentResponseCoordinators.backupUserId, user.id),
        and(eq(institutionDepartmentResponseCoordinators.deputyUserId, user.id), eq(institutionDepartmentResponseCoordinators.deputyAssignmentStatus, "active")),
      ))),
    db.select({ departmentId: institutionEducationCoordinators.departmentId })
      .from(institutionEducationCoordinators)
      .where(and(eq(institutionEducationCoordinators.institutionalAccountId, institutionId), or(
        and(eq(institutionEducationCoordinators.userId, user.id), eq(institutionEducationCoordinators.assignmentStatus, "active")),
        and(eq(institutionEducationCoordinators.deputyUserId, user.id), eq(institutionEducationCoordinators.deputyAssignmentStatus, "active")),
      ))),
  ]);
  return Array.from(new Set([...heads, ...ercos, ...education].map(row => row.departmentId)));
}

async function hasInstitutionWideReadRole(db: AppDb, user: Pick<User, "id" | "email">, institutionId: number) {
  const identity = user.email?.trim().toLowerCase()
    ? or(eq(institutionProductRoles.userId, user.id), eq(institutionProductRoles.invitedEmail, user.email.trim().toLowerCase()))
    : eq(institutionProductRoles.userId, user.id);
  const rows = await db.select({ roleKey: institutionProductRoles.roleKey })
    .from(institutionProductRoles)
    .innerJoin(institutionalProducts, eq(institutionProductRoles.productId, institutionalProducts.id))
    .where(and(
      eq(institutionProductRoles.institutionalAccountId, institutionId),
      eq(institutionProductRoles.roleStatus, "active"),
      inArray(institutionProductRoles.roleKey, [...INSTITUTION_WIDE_READ_ROLES]),
      identity,
    )).limit(1);
  return rows.length > 0;
}

export async function resolveStaff360Scope(db: AppDb, user: Pick<User, "id" | "role" | "email">, institutionId: number): Promise<Staff360Scope> {
  if (user.role === "admin") return { authority: "platform_admin", institutionWide: true, departmentIds: [] };
  if (await isInstitutionAdmin(db, user.id, institutionId)) return { authority: "institution_admin", institutionWide: true, departmentIds: [] };
  if (await hasInstitutionWideReadRole(db, user, institutionId)) return { authority: "institution_role", institutionWide: true, departmentIds: [] };
  const departmentIds = await getDepartmentRoleScope(db, user, institutionId);
  if (departmentIds.length) return { authority: "department_role", institutionWide: false, departmentIds };
  throw new TRPCError({ code: "FORBIDDEN", message: "An authorised institutional Staff 360 role is required." });
}

export function assertStaff360DepartmentScope(scope: Staff360Scope, departmentId: number | null | undefined) {
  if (scope.institutionWide) return;
  if (departmentId == null || !scope.departmentIds.includes(departmentId)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "This Staff 360 record is outside your appointed department scope." });
  }
}
