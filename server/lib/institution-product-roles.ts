import { TRPCError } from "@trpc/server";
import { and, eq, or } from "drizzle-orm";
import {
  institutionProductRoles,
  institutionalProducts,
} from "../../drizzle/schema";
import type { User } from "../../drizzle/schema";
import type { AppDb } from "./institution-access";
import { isInstitutionAdmin } from "./institution-access";
import { isMissingTableError } from "./is-missing-db-table";
import type { InstitutionalProductKey } from "./institution-entitlements";

export type InstitutionalProductRoleKey =
  | "iers_chair"
  | "iers_coordinator"
  | "iers_responder"
  | "iers_reviewer"
  | "iers_governance"
  | "iers_viewer"
  | "cpd_coordinator"
  | "cpd_education_coordinator"
  | "cpd_reviewer"
  | "cpd_reporter"
  | "cpd_viewer"
  | "cpd_department_head"
  | "connected_services_manager"
  | "connected_services_viewer";

export type InstitutionalProductRoleStatus = "invited" | "active" | "suspended" | "ended";

export const PRODUCT_ROLE_DEFINITIONS: Record<InstitutionalProductKey, Array<{
  roleKey: InstitutionalProductRoleKey;
  label: string;
  description: string;
}>> = {
  iers: [
    { roleKey: "iers_chair", label: "Institutional Emergency Readiness Chair", description: "Owns institution-wide Emergency Readiness governance and may assign and oversee IERS roles, Departmental Heads’ emergency-preparedness responsibilities, and department ERCo appointments." },
    { roleKey: "iers_coordinator", label: "IERS Lead", description: "Leads institutional IERS setup, pole allocation, governance, activations, drills, evidence, and improvement actions. This role does not itself prove acceptance of a dated provider duty." },
    { roleKey: "iers_responder", label: "IERS response operator", description: "Acknowledges and records response activity during activations and drills when assigned and accepted for the relevant duty." },
    { roleKey: "iers_reviewer", label: "IERS reviewer", description: "Reviews evidence and verifies action closure." },
    { roleKey: "iers_governance", label: "IERS governance", description: "Owns milestones, institutional rollout, and governance review." },
    { roleKey: "iers_viewer", label: "IERS viewer", description: "Views readiness, evidence, action, and reporting surfaces." },
  ],
  cpd_portal: [
    { roleKey: "cpd_coordinator", label: "CPD coordinator", description: "Manages CPD sessions, attendance, certificates, and settings." },
        {
      roleKey: "cpd_education_coordinator",
      label: "Department Education Coordinator",
      description:
        "Creates and coordinates learning sessions for an assigned department; cannot view other departments’ private records unless separately authorized.",
    },
    {
      roleKey: "cpd_reviewer",
      label: "CPD reviewer", description: "Reviews attendance, certificates, and professional-development records." },
    { roleKey: "cpd_reporter", label: "CPD reporter", description: "Views staff-development and CPD decision reports." },
    { roleKey: "cpd_viewer", label: "CPD viewer", description: "Views the CPD Portal without changing records." },
  ],
  connected_services: [
    { roleKey: "connected_services_manager", label: "Connected Services manager", description: "Manages institution-level access to explicitly enabled connected services." },
    { roleKey: "connected_services_viewer", label: "Connected Services viewer", description: "Views the managed connected-services portfolio." },
  ],
};

export function isKnownProductRole(productKey: InstitutionalProductKey, roleKey: string): roleKey is InstitutionalProductRoleKey {
  return PRODUCT_ROLE_DEFINITIONS[productKey].some((role) => role.roleKey === roleKey);
}

export function selectMatchingProductRole(
  rows: Array<{ roleKey: string; roleStatus: string; userId: number | null; invitedEmail: string }>,
  user: { userId: number; email?: string | null },
  requiredRoles: readonly InstitutionalProductRoleKey[],
): InstitutionalProductRoleKey | undefined {
  const email = user.email?.trim().toLowerCase();
  const matching = rows.find((row) =>
    row.roleStatus === "active" &&
    (row.userId === user.userId || (email != null && row.invitedEmail.toLowerCase() === email)) &&
    requiredRoles.includes(row.roleKey as InstitutionalProductRoleKey)
  );
  return matching?.roleKey as InstitutionalProductRoleKey | undefined;
}

export async function assertInstitutionProductRole(
  db: AppDb,
  user: Pick<User, "id" | "role" | "email">,
  institutionId: number,
  productKey: InstitutionalProductKey,
  requiredRoles: readonly InstitutionalProductRoleKey[],
): Promise<{ roleKey: InstitutionalProductRoleKey | "institution_admin" | "legacy_fallback" }> {
  if (user.role === "admin" || await isInstitutionAdmin(db, user.id, institutionId)) {
    return { roleKey: "institution_admin" };
  }

  try {
    const [product] = await db
      .select({ id: institutionalProducts.id })
      .from(institutionalProducts)
      .where(eq(institutionalProducts.productKey, productKey))
      .limit(1);
    if (!product) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Product registry entry is missing for ${productKey}.` });
    }

    const email = user.email?.trim().toLowerCase();
    const identityPredicate = email
      ? or(eq(institutionProductRoles.userId, user.id), eq(institutionProductRoles.invitedEmail, email))
      : eq(institutionProductRoles.userId, user.id);
    const rows = await db
      .select({ roleKey: institutionProductRoles.roleKey, roleStatus: institutionProductRoles.roleStatus, userId: institutionProductRoles.userId, invitedEmail: institutionProductRoles.invitedEmail })
      .from(institutionProductRoles)
      .where(and(
        eq(institutionProductRoles.institutionalAccountId, institutionId),
        eq(institutionProductRoles.productId, product.id),
        eq(institutionProductRoles.roleStatus, "active"),
        identityPredicate,
      ));

    const matchingRole = selectMatchingProductRole(rows, { userId: user.id, email: user.email }, requiredRoles);
    if (!matchingRole) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You do not have an active ${productKey} responsibility role for this institution. Ask an institution administrator to assign one before operating this workspace.`,
      });
    }
    return { roleKey: matchingRole };
  } catch (error) {
    if (isMissingTableError(error)) return { roleKey: "legacy_fallback" };
    throw error;
  }
}
