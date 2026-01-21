import { UserRole } from "@/hooks/useUserRole";

export interface NavItem {
  label: string;
  href: string;
  roles?: UserRole[];
  requiresAuth?: boolean;
}

/**
 * Define which pages are accessible to which roles
 */
export const roleBasedPages = {
  // Pages accessible to all users (no role restriction)
  public: [
    "/",
    "/about",
    "/contact",
    "/faq",
    "/support",
    "/terms",
    "/privacy",
    "/search",
  ],

  // Parent/Caregiver only pages
  parent: [
    "/parents",
    "/resources", // But with parent-specific content
  ],

  // Healthcare Provider only pages
  provider: [
    "/providers",
    "/elite-fellowship",
    "/safe-truth",
    "/resources", // But with provider-specific content
  ],

  // Institution only pages
  institution: [
    "/institutional",
    "/institutional-management",
    "/institutional-dashboard",
    "/analytics",
    "/resources", // But with institution-specific content
  ],

  // Pages accessible to authenticated users
  authenticated: [
    "/dashboard",
    "/profile",
    "/settings",
    "/resources",
    "/learner-dashboard",
    "/payment-history",
    "/certificates",
  ],

  // Pages accessible to providers and institutions
  professional: [
    "/providers",
    "/institutional",
    "/elite-fellowship",
    "/safe-truth",
    "/admin-dashboard",
    "/analytics",
  ],
};

/**
 * Check if a user with a specific role can access a page
 */
export function canAccessPage(page: string, role: UserRole): boolean {
  // Public pages are accessible to everyone
  if (roleBasedPages.public.includes(page)) {
    return true;
  }

  // If no role is set, only allow public pages
  if (!role) {
    return roleBasedPages.public.includes(page);
  }

  // Check role-specific access
  switch (role) {
    case "parent":
      return (
        roleBasedPages.public.includes(page) ||
        roleBasedPages.parent.includes(page) ||
        roleBasedPages.authenticated.includes(page)
      );

    case "provider":
      return (
        roleBasedPages.public.includes(page) ||
        roleBasedPages.provider.includes(page) ||
        roleBasedPages.professional.includes(page) ||
        roleBasedPages.authenticated.includes(page)
      );

    case "institution":
      return (
        roleBasedPages.public.includes(page) ||
        roleBasedPages.institution.includes(page) ||
        roleBasedPages.professional.includes(page) ||
        roleBasedPages.authenticated.includes(page)
      );

    default:
      return roleBasedPages.public.includes(page);
  }
}

/**
 * Filter navigation items based on user role
 */
export function filterNavItems(items: NavItem[], role: UserRole): NavItem[] {
  return items.filter((item) => {
    // If item has specific roles defined, check if current role is included
    if (item.roles && item.roles.length > 0) {
      if (!role) return false;
      return item.roles.includes(role);
    }

    // If item requires auth and user has no role, exclude it
    if (item.requiresAuth && !role) {
      return false;
    }

    // Otherwise, include the item
    return true;
  });
}

/**
 * Get role-appropriate label for navigation items
 */
export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "parent":
      return "Parent/Caregiver";
    case "provider":
      return "Healthcare Provider";
    case "institution":
      return "Institution/Hospital";
    default:
      return "Guest";
  }
}
