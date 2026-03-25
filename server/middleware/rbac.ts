import { TRPCError } from "@trpc/server";

/**
 * Institutional Role Definitions
 * Defines what each role can do within the institutional platform
 */
export type InstitutionalRole =
  | "director"
  | "coordinator"
  | "finance_officer"
  | "department_head"
  | "staff_member";

/**
 * Permission Matrix
 * Maps roles to their allowed actions
 */
export const rolePermissions: Record<InstitutionalRole, string[]> = {
  director: [
    // Full access to all institutional features
    "institution:read",
    "institution:write",
    "staff:read",
    "staff:write",
    "staff:delete",
    "courses:read",
    "courses:write",
    "courses:assign",
    "progress:read",
    "progress:write",
    "certificates:read",
    "certificates:write",
    "certificates:reissue",
    "certificates:revoke",
    "reports:read",
    "reports:export",
    "settings:read",
    "settings:write",
    "payments:read",
    "payments:write",
    "audit:read",
    "users:manage",
  ],
  coordinator: [
    // Can manage staff and courses
    "institution:read",
    "staff:read",
    "staff:write",
    "courses:read",
    "courses:write",
    "courses:assign",
    "progress:read",
    "certificates:read",
    "certificates:reissue",
    "reports:read",
    "reports:export",
    "settings:read",
  ],
  finance_officer: [
    // Can view payments and billing
    "institution:read",
    "staff:read",
    "payments:read",
    "payments:write",
    "reports:read",
    "reports:export",
    "settings:read",
  ],
  department_head: [
    // Can view only their department's data
    "institution:read",
    "staff:read:own_department",
    "progress:read:own_department",
    "certificates:read:own_department",
    "reports:read:own_department",
  ],
  staff_member: [
    // Can view only their own data
    "progress:read:own",
    "certificates:read:own",
  ],
};

/**
 * Check if user has permission
 */
export function hasPermission(
  role: InstitutionalRole | null | undefined,
  permission: string
): boolean {
  if (!role) return false;
  const permissions = rolePermissions[role];
  if (!permissions) return false;

  // Check exact match
  if (permissions.includes(permission)) return true;

  // Check wildcard permissions (e.g., "staff:read" matches "staff:read:own")
  const basePerm = permission.split(":").slice(0, 2).join(":");
  return permissions.includes(basePerm);
}

/**
 * Check if user has any of the given permissions
 */
export function hasAnyPermission(
  role: InstitutionalRole | null | undefined,
  permissions: string[]
): boolean {
  return permissions.some((perm) => hasPermission(role, perm));
}

/**
 * Check if user has all of the given permissions
 */
export function hasAllPermissions(
  role: InstitutionalRole | null | undefined,
  permissions: string[]
): boolean {
  return permissions.every((perm) => hasPermission(role, perm));
}

/**
 * Throw error if user lacks permission
 */
export function requirePermission(
  role: InstitutionalRole | null | undefined,
  permission: string
): void {
  if (!hasPermission(role, permission)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You do not have permission to perform this action: ${permission}`,
    });
  }
}

/**
 * Throw error if user lacks any of the given permissions
 */
export function requireAnyPermission(
  role: InstitutionalRole | null | undefined,
  permissions: string[]
): void {
  if (!hasAnyPermission(role, permissions)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You do not have permission to perform this action`,
    });
  }
}

/**
 * Throw error if user lacks all of the given permissions
 */
export function requireAllPermissions(
  role: InstitutionalRole | null | undefined,
  permissions: string[]
): void {
  if (!hasAllPermissions(role, permissions)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You do not have permission to perform this action`,
    });
  }
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: InstitutionalRole): string {
  const displayNames: Record<InstitutionalRole, string> = {
    director: "Hospital Director",
    coordinator: "Training Coordinator",
    finance_officer: "Finance Officer",
    department_head: "Department Head",
    staff_member: "Staff Member",
  };
  return displayNames[role] || role;
}

/**
 * Get role description
 */
export function getRoleDescription(role: InstitutionalRole): string {
  const descriptions: Record<InstitutionalRole, string> = {
    director: "Full access to all institutional features and staff management",
    coordinator:
      "Manage staff enrollments, courses, and track training progress",
    finance_officer: "View and manage payments, billing, and financial reports",
    department_head: "View and manage only your department's training data",
    staff_member: "View your own training progress and certificates",
  };
  return descriptions[role] || "";
}

/**
 * Validate role assignment
 * Only directors and coordinators can assign roles
 */
export function canAssignRole(
  currentUserRole: InstitutionalRole | null | undefined,
  targetRole: InstitutionalRole
): boolean {
  if (!currentUserRole) return false;

  // Only directors can assign director role
  if (targetRole === "director") {
    return currentUserRole === "director";
  }

  // Directors and coordinators can assign other roles
  return ["director", "coordinator"].includes(currentUserRole);
}

/**
 * Get all available roles for a user to assign
 */
export function getAssignableRoles(
  currentUserRole: InstitutionalRole | null | undefined
): InstitutionalRole[] {
  if (!currentUserRole) return [];

  const allRoles: InstitutionalRole[] = [
    "director",
    "coordinator",
    "finance_officer",
    "department_head",
    "staff_member",
  ];

  if (currentUserRole === "director") {
    return allRoles;
  }

  if (currentUserRole === "coordinator") {
    return allRoles.filter((role) => role !== "director");
  }

  return [];
}
