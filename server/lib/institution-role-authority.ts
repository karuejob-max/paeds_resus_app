import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import {
  institutionDepartmentHeads,
  institutionDepartmentResponseCoordinators,
  institutionEducationCoordinators,
} from "../../drizzle/schema";
import type { User } from "../../drizzle/schema";
import type { AppDb } from "./institution-access";
import { isInstitutionAdmin } from "./institution-access";
import { assertInstitutionProductRole } from "./institution-product-roles";

export type InstitutionalRoleArea = "iers" | "cpd_portal";

export type InstitutionalRoleAuthority =
  | "institution_admin"
  | "iers_chair"
  | "iers_governance"
  | "iers_coordinator"
  | "cpd_coordinator"
  | "department_head";

export async function assertCanManageProductRoles(
  db: AppDb,
  user: Pick<User, "id" | "role" | "email">,
  institutionId: number,
  productKey: "iers" | "cpd_portal",
) {
  const requiredRoles = productKey === "iers"
    ? ["iers_chair", "iers_governance", "iers_coordinator"] as const
    : ["cpd_coordinator"] as const;
  const role = await assertInstitutionProductRole(db, user, institutionId, productKey, requiredRoles);
  if (role.roleKey === "institution_admin") return { authority: "institution_admin" as const };
  if (role.roleKey === "legacy_fallback") {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Institution product roles are not available yet. Ask a platform administrator to complete the role migration." });
  }
  return { authority: role.roleKey as InstitutionalRoleAuthority };
}

export async function assertCanManageArea(
  db: AppDb,
  user: Pick<User, "id" | "role" | "email">,
  institutionId: number,
  area: InstitutionalRoleArea,
  departmentId?: number,
) {
  if (user.role === "admin" || await isInstitutionAdmin(db, user.id, institutionId)) {
    return { authority: "institution_admin" as const };
  }

  if (area === "iers") {
    try {
      const role = await assertInstitutionProductRole(db, user, institutionId, "iers", ["iers_chair", "iers_governance", "iers_coordinator"]);
      if (role.roleKey !== "legacy_fallback") return { authority: role.roleKey as InstitutionalRoleAuthority };
    } catch (error) {
      if (!(error instanceof TRPCError) || error.code !== "FORBIDDEN") throw error;
    }
  } else {
    try {
      const role = await assertInstitutionProductRole(db, user, institutionId, "cpd_portal", ["cpd_coordinator"]);
      if (role.roleKey !== "legacy_fallback") return { authority: role.roleKey as InstitutionalRoleAuthority };
    } catch (error) {
      if (!(error instanceof TRPCError) || error.code !== "FORBIDDEN") throw error;
    }
  }

  if (departmentId == null) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: area === "iers"
        ? "Institutional Emergency Readiness Chair or IERS governance authority is required for this action."
        : "Institutional CPD Coordinator authority is required for this action.",
    });
  }

  const [head] = await db
    .select({ id: institutionDepartmentHeads.id })
    .from(institutionDepartmentHeads)
    .where(and(
      eq(institutionDepartmentHeads.institutionalAccountId, institutionId),
      eq(institutionDepartmentHeads.departmentId, departmentId),
      eq(institutionDepartmentHeads.userId, user.id),
      eq(institutionDepartmentHeads.assignmentStatus, "active"),
    ))
    .limit(1);
  if (!head) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Departmental Head authority is limited to the appointed department.",
    });
  }
  return { authority: "department_head" as const };
}

export async function assertCanManageDepartmentHead(
  db: AppDb,
  user: Pick<User, "id" | "role" | "email">,
  institutionId: number,
) {
  if (user.role === "admin" || await isInstitutionAdmin(db, user.id, institutionId)) {
    return { authority: "institution_admin" as const };
  }
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Only an institutional administrator can assign or end Departmental Heads.",
  });
}

export async function assertCanManageExistingDepartmentAssignment(
  db: AppDb,
  user: Pick<User, "id" | "role" | "email">,
  institutionId: number,
  assignmentId: number,
  area: InstitutionalRoleArea,
) {
  if (area === "iers") {
    const [assignment] = await db
      .select({ departmentId: institutionDepartmentResponseCoordinators.departmentId })
      .from(institutionDepartmentResponseCoordinators)
      .where(and(
        eq(institutionDepartmentResponseCoordinators.id, assignmentId),
        eq(institutionDepartmentResponseCoordinators.institutionId, institutionId),
      ))
      .limit(1);
    if (!assignment) throw new TRPCError({ code: "NOT_FOUND", message: "Department ERCo assignment not found." });
    return { assignment, authority: await assertCanManageArea(db, user, institutionId, area, assignment.departmentId) };
  }

  const [assignment] = await db
    .select({ departmentId: institutionEducationCoordinators.departmentId })
    .from(institutionEducationCoordinators)
    .where(and(
      eq(institutionEducationCoordinators.id, assignmentId),
      eq(institutionEducationCoordinators.institutionalAccountId, institutionId),
    ))
    .limit(1);
  if (!assignment) throw new TRPCError({ code: "NOT_FOUND", message: "Department CPD coordinator assignment not found." });
  return { assignment, authority: await assertCanManageArea(db, user, institutionId, area, assignment.departmentId) };
}

export function isDepartmentHeadAuthority(authority: InstitutionalRoleAuthority): boolean {
  return authority === "department_head";
}

export function isInstitutionWideAuthority(authority: InstitutionalRoleAuthority): boolean {
  return authority !== "department_head";
}
