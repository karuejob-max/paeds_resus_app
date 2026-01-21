import { UserRole } from "@/hooks/useUserRole";

/**
 * Content Visibility Configuration
 * Defines which pages and features are visible to each user role
 */

export interface PageVisibility {
  [key: string]: UserRole[] | "all";
}

export const pageVisibility: PageVisibility = {
  // Public pages (visible to all)
  "/": "all",
  "/home": "all",
  "/about": "all",
  "/contact": "all",
  "/faq": "all",

  // Parent/Caregiver specific
  "/parents": ["parent"],
  "/parent-courses": ["parent"],
  "/parent-resources": ["parent"],
  "/family-package": ["parent"],

  // Healthcare Provider specific
  "/providers": ["provider"],
  "/elite-fellowship": ["provider"],
  "/safe-truth": ["provider"],
  "/safetruth-tool": ["provider"],
  "/clinical-protocols": ["provider"],
  "/provider-resources": ["provider"],
  "/provider-channels": ["provider"],

  // Institution specific
  "/institutions": ["institution"],
  "/institutional-dashboard": ["institution"],
  "/institutional-management": ["institution"],
  "/institutional-analytics": ["institution"],
  "/institutional-accreditation": ["institution"],
  "/bulk-enrollment": ["institution"],
  "/staff-management": ["institution"],

  // Shared pages
  "/resources": "all", // Shows role-specific content
  "/courses": "all", // Shows role-specific courses
  "/search": "all",
  "/dashboard": "all", // Shows role-specific dashboard
  "/profile": "all",
  "/settings": "all",
  "/help": "all",
  "/support": "all",
  "/verify-certificate": "all",
  "/payments": "all",
  "/progress": "all",
  "/achievements": "all",
  "/leaderboard": "all",
  "/referral-program": "all",
  "/facilities": "all",
  "/training-schedules": "all",
};

/**
 * Check if a page is visible to a user role
 */
export function isPageVisible(path: string, role: UserRole | null): boolean {
  if (!role) return false;

  const visibility = pageVisibility[path];

  if (visibility === "all") return true;
  if (Array.isArray(visibility)) return visibility.includes(role);

  return false;
}

/**
 * Get all visible pages for a user role
 */
export function getVisiblePages(role: UserRole | null): string[] {
  if (!role) return [];

  return Object.entries(pageVisibility)
    .filter(([_, visibility]) => {
      if (visibility === "all") return true;
      if (Array.isArray(visibility)) return visibility.includes(role);
      return false;
    })
    .map(([path]) => path);
}

/**
 * Navigation items visibility by role
 */
export interface NavItemVisibility {
  [key: string]: UserRole[] | "all";
}

export const navItemVisibility: NavItemVisibility = {
  "Safe-Truth": ["provider"],
  "Elite Fellowship": ["provider"],
  "For Providers": ["provider"],
  "For Institutions": ["institution"],
  "For Parents": ["parent"],
  "Institutional Management": ["institution"],
  "Provider Resources": ["provider"],
  "Parent Resources": ["parent"],
  Resources: "all",
  Facilities: "all",
  "Training Schedules": "all",
  About: "all",
  Contact: "all",
};

/**
 * Check if a navigation item should be visible
 */
export function isNavItemVisible(itemLabel: string, role: UserRole | null): boolean {
  if (!role) return false;

  const visibility = navItemVisibility[itemLabel];

  if (visibility === "all") return true;
  if (Array.isArray(visibility)) return visibility.includes(role);

  return false;
}

/**
 * Get visible navigation items for a role
 */
export function getVisibleNavItems(role: UserRole | null): string[] {
  if (!role) return [];

  return Object.entries(navItemVisibility)
    .filter(([_, visibility]) => {
      if (visibility === "all") return true;
      if (Array.isArray(visibility)) return visibility.includes(role);
      return false;
    })
    .map(([label]) => label);
}

/**
 * Feature visibility by role
 */
export interface FeatureVisibility {
  [key: string]: UserRole[] | "all";
}

export const featureVisibility: FeatureVisibility = {
  "Safe-Truth Logging": ["provider"],
  "Clinical Protocols": ["provider"],
  "Provider Analytics": ["provider"],
  "Institutional Dashboard": ["institution"],
  "Staff Management": ["institution"],
  "Bulk Enrollment": ["institution"],
  "ROI Calculator": ["institution"],
  "Parent Courses": ["parent"],
  "Family Resources": ["parent"],
  "AI Assistant": "all",
  "Chat Support": "all",
  "Certificate Verification": "all",
  "Course Search": "all",
};

/**
 * Check if a feature is available to a user role
 */
export function isFeatureAvailable(featureName: string, role: UserRole | null): boolean {
  if (!role) return false;

  const visibility = featureVisibility[featureName];

  if (visibility === "all") return true;
  if (Array.isArray(visibility)) return visibility.includes(role);

  return false;
}
