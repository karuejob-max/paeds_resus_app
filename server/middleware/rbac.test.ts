import { describe, it, expect } from "vitest";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRoleDisplayName,
  getRoleDescription,
  canAssignRole,
  getAssignableRoles,
  type InstitutionalRole,
} from "./rbac";

/**
 * Test Suite: Permission Checking
 */
describe("RBAC - Permission Checking", () => {
  /**
   * Test: Director has all permissions
   */
  it("should grant director all permissions", () => {
    expect(hasPermission("director", "staff:read")).toBe(true);
    expect(hasPermission("director", "staff:write")).toBe(true);
    expect(hasPermission("director", "staff:delete")).toBe(true);
    expect(hasPermission("director", "certificates:revoke")).toBe(true);
    expect(hasPermission("director", "users:manage")).toBe(true);
  });

  /**
   * Test: Coordinator has limited permissions
   */
  it("should grant coordinator appropriate permissions", () => {
    expect(hasPermission("coordinator", "staff:read")).toBe(true);
    expect(hasPermission("coordinator", "staff:write")).toBe(true);
    expect(hasPermission("coordinator", "courses:assign")).toBe(true);
    expect(hasPermission("coordinator", "users:manage")).toBe(false);
    expect(hasPermission("coordinator", "payments:write")).toBe(false);
  });

  /**
   * Test: Finance officer can only view payments
   */
  it("should grant finance officer payment permissions only", () => {
    expect(hasPermission("finance_officer", "payments:read")).toBe(true);
    expect(hasPermission("finance_officer", "payments:write")).toBe(true);
    expect(hasPermission("finance_officer", "staff:write")).toBe(false);
    expect(hasPermission("finance_officer", "users:manage")).toBe(false);
  });

  /**
   * Test: Department head can only view own department
   */
  it("should grant department head own-department permissions", () => {
    expect(hasPermission("department_head", "staff:read:own_department")).toBe(true);
    expect(hasPermission("department_head", "progress:read:own_department")).toBe(true);
    expect(hasPermission("department_head", "staff:write")).toBe(false);
    expect(hasPermission("department_head", "users:manage")).toBe(false);
  });

  /**
   * Test: Staff member can only view own data
   */
  it("should grant staff member only own-data permissions", () => {
    expect(hasPermission("staff_member", "progress:read:own")).toBe(true);
    expect(hasPermission("staff_member", "certificates:read:own")).toBe(true);
    expect(hasPermission("staff_member", "staff:read")).toBe(false);
    expect(hasPermission("staff_member", "users:manage")).toBe(false);
  });

  /**
   * Test: Null role has no permissions
   */
  it("should deny permissions for null role", () => {
    expect(hasPermission(null, "staff:read")).toBe(false);
    expect(hasPermission(undefined, "staff:read")).toBe(false);
  });
});

/**
 * Test Suite: Multiple Permission Checks
 */
describe("RBAC - Multiple Permission Checks", () => {
  /**
   * Test: hasAnyPermission
   */
  it("should check if user has any of given permissions", () => {
    expect(hasAnyPermission("director", ["staff:read", "payments:read"])).toBe(true);
    expect(hasAnyPermission("finance_officer", ["staff:write", "payments:read"])).toBe(true);
    expect(hasAnyPermission("staff_member", ["staff:write", "payments:read"])).toBe(false);
  });

  /**
   * Test: hasAllPermissions
   */
  it("should check if user has all given permissions", () => {
    expect(hasAllPermissions("director", ["staff:read", "payments:read"])).toBe(true);
    expect(hasAllPermissions("coordinator", ["staff:read", "staff:write"])).toBe(true);
    expect(hasAllPermissions("coordinator", ["staff:read", "users:manage"])).toBe(false);
  });
});

/**
 * Test Suite: Role Assignment
 */
describe("RBAC - Role Assignment", () => {
  /**
   * Test: Only directors can assign director role
   */
  it("should only allow directors to assign director role", () => {
    expect(canAssignRole("director", "director")).toBe(true);
    expect(canAssignRole("coordinator", "director")).toBe(false);
    expect(canAssignRole("finance_officer", "director")).toBe(false);
  });

  /**
   * Test: Directors and coordinators can assign other roles
   */
  it("should allow directors and coordinators to assign other roles", () => {
    expect(canAssignRole("director", "coordinator")).toBe(true);
    expect(canAssignRole("director", "finance_officer")).toBe(true);
    expect(canAssignRole("coordinator", "coordinator")).toBe(true);
    expect(canAssignRole("coordinator", "finance_officer")).toBe(true);
    expect(canAssignRole("coordinator", "director")).toBe(false);
  });

  /**
   * Test: Others cannot assign roles
   */
  it("should not allow other roles to assign roles", () => {
    expect(canAssignRole("finance_officer", "coordinator")).toBe(false);
    expect(canAssignRole("department_head", "coordinator")).toBe(false);
    expect(canAssignRole("staff_member", "coordinator")).toBe(false);
  });

  /**
   * Test: Get assignable roles for director
   */
  it("should return all roles for director", () => {
    const roles = getAssignableRoles("director");
    expect(roles).toContain("director");
    expect(roles).toContain("coordinator");
    expect(roles).toContain("finance_officer");
    expect(roles).toContain("department_head");
    expect(roles).toContain("staff_member");
    expect(roles).toHaveLength(5);
  });

  /**
   * Test: Get assignable roles for coordinator
   */
  it("should return non-director roles for coordinator", () => {
    const roles = getAssignableRoles("coordinator");
    expect(roles).not.toContain("director");
    expect(roles).toContain("coordinator");
    expect(roles).toContain("finance_officer");
    expect(roles).toContain("department_head");
    expect(roles).toContain("staff_member");
    expect(roles).toHaveLength(4);
  });

  /**
   * Test: Get assignable roles for others
   */
  it("should return empty array for non-admin roles", () => {
    expect(getAssignableRoles("finance_officer")).toHaveLength(0);
    expect(getAssignableRoles("department_head")).toHaveLength(0);
    expect(getAssignableRoles("staff_member")).toHaveLength(0);
    expect(getAssignableRoles(null)).toHaveLength(0);
  });
});

/**
 * Test Suite: Role Display
 */
describe("RBAC - Role Display", () => {
  /**
   * Test: Get role display names
   */
  it("should return correct display names for roles", () => {
    expect(getRoleDisplayName("director")).toBe("Hospital Director");
    expect(getRoleDisplayName("coordinator")).toBe("Training Coordinator");
    expect(getRoleDisplayName("finance_officer")).toBe("Finance Officer");
    expect(getRoleDisplayName("department_head")).toBe("Department Head");
    expect(getRoleDisplayName("staff_member")).toBe("Staff Member");
  });

  /**
   * Test: Get role descriptions
   */
  it("should return correct descriptions for roles", () => {
    const directorDesc = getRoleDescription("director");
    expect(directorDesc).toContain("Full access");

    const coordinatorDesc = getRoleDescription("coordinator");
    expect(coordinatorDesc).toContain("staff enrollments");

    const financeDesc = getRoleDescription("finance_officer");
    expect(financeDesc).toContain("payments");

    const deptDesc = getRoleDescription("department_head");
    expect(deptDesc).toContain("department");

    const staffDesc = getRoleDescription("staff_member");
    expect(staffDesc).toContain("own");
  });
});

/**
 * Test Suite: Permission Hierarchy
 */
describe("RBAC - Permission Hierarchy", () => {
  /**
   * Test: Director has superset of coordinator permissions
   */
  it("should have director as superset of coordinator", () => {
    const coordinatorPerms = [
      "institution:read",
      "staff:read",
      "staff:write",
      "courses:read",
      "courses:write",
    ];

    coordinatorPerms.forEach((perm) => {
      expect(hasPermission("director", perm)).toBe(true);
    });
  });

  /**
   * Test: Coordinator has superset of department head permissions
   */
  it("should have coordinator permissions broader than department head", () => {
    expect(hasPermission("coordinator", "staff:read")).toBe(true);
    expect(hasPermission("coordinator", "courses:assign")).toBe(true);
    expect(hasPermission("department_head", "staff:read:own_department")).toBe(true);
    expect(hasPermission("department_head", "courses:assign")).toBe(false);
  });
});

/**
 * Test Suite: Wildcard Permission Matching
 */
describe("RBAC - Wildcard Permission Matching", () => {
  /**
   * Test: Wildcard permissions match specific scopes
   */
  it("should match wildcard permissions with specific scopes", () => {
    // Director has "staff:read" which should match "staff:read:own"
    expect(hasPermission("director", "staff:read")).toBe(true);
    expect(hasPermission("director", "staff:read:own")).toBe(true);
    expect(hasPermission("director", "staff:read:own_department")).toBe(true);
  });

  /**
   * Test: Scoped permissions don't match broader scopes
   */
  it("should not match scoped permissions to broader scopes", () => {
    // Department head has "staff:read:own_department" but not "staff:read"
    expect(hasPermission("department_head", "staff:read:own_department")).toBe(true);
    expect(hasPermission("department_head", "staff:read")).toBe(false);
  });
});
