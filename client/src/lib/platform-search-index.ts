import { AHA_COURSE_ORDER, getAhaCourseMetadata } from "@/const/aha-course-metadata";
import { MICRO_COURSE_CATALOG } from "@shared/micro-course-catalog";

export type SearchCategory = "Courses" | "Fellowship" | "Tools" | "Legal" | "Admin" | "Help";

export type AppRole = "provider" | "parent" | "institution" | null;

export type PlatformSearchItem = {
  id: string;
  label: string;
  href: string;
  category: SearchCategory;
  description?: string;
  keywords?: string[];
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  allowedRoles?: AppRole[];
};

export type SearchContext = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  role: AppRole;
};

function item(
  partial: PlatformSearchItem & { id: string; label: string; href: string; category: SearchCategory }
): PlatformSearchItem {
  return partial;
}

function microCourseItems(): PlatformSearchItem[] {
  return MICRO_COURSE_CATALOG.filter((c) => c.isPublished).map((c) => ({
    id: `micro-${c.courseId}`,
    label: c.title,
    href: `/micro-course/${c.courseId}`,
    category: "Courses" as const,
    description: c.description,
    keywords: [c.courseId, c.emergencyType, c.tier],
    requiresAuth: true,
    allowedRoles: ["provider"],
  }));
}

function ahaCourseItems(): PlatformSearchItem[] {
  return AHA_COURSE_ORDER.map((slug) => {
    const meta = getAhaCourseMetadata(slug);
    return item({
      id: `aha-${slug}`,
      label: meta.title,
      href: `/course/${slug}`,
      category: "Courses",
      description: meta.shortDescription,
      keywords: [meta.badge, slug, "AHA", "training"],
      requiresAuth: true,
      allowedRoles: ["provider"],
    });
  });
}

const STATIC_ITEMS: PlatformSearchItem[] = [
  // Navigation — public
  item({ id: "home", label: "Home", href: "/", category: "Help", keywords: ["landing", "start"] }),
  item({
    id: "for-providers",
    label: "For providers",
    href: "/for-providers",
    category: "Help",
    keywords: ["healthcare", "clinician"],
  }),
  item({
    id: "for-parents",
    label: "For parents",
    href: "/for-parents",
    category: "Help",
    keywords: ["family", "caregiver"],
  }),
  item({
    id: "for-institutions",
    label: "For institutions",
    href: "/for-institutions",
    category: "Help",
    keywords: ["hospital", "ERT"],
  }),
  item({
    id: "training-hub",
    label: "Training hub",
    href: "/training",
    category: "Courses",
    keywords: ["BLS", "ACLS", "PALS", "NRP", "AHA"],
  }),
  item({ id: "about", label: "About Paeds Resus", href: "/about", category: "Help" }),

  // Provider dashboard
  item({
    id: "provider-home",
    label: "Provider dashboard",
    href: "/home",
    category: "Help",
    keywords: ["dashboard", "learner"],
    requiresAuth: true,
    allowedRoles: ["provider"],
  }),

  // Fellowship
  item({
    id: "fellowship",
    label: "Fellowship dashboard",
    href: "/fellowship",
    category: "Fellowship",
    keywords: ["ADF", "micro-courses", "pillar"],
    requiresAuth: true,
    allowedRoles: ["provider"],
  }),
  item({
    id: "fellowship-about",
    label: "Fellowship guide",
    href: "/fellowship/about",
    category: "Fellowship",
    keywords: ["about", "qualification"],
    requiresAuth: true,
    allowedRoles: ["provider"],
  }),
  item({
    id: "fellowship-why",
    label: "Why fellowship",
    href: "/fellowship/why",
    category: "Fellowship",
    keywords: ["benefits", "QI"],
    requiresAuth: true,
    allowedRoles: ["provider"],
  }),
  item({
    id: "fellowship-progress",
    label: "Fellowship progress",
    href: "/fellowship/progress",
    category: "Fellowship",
    keywords: ["pillars", "status"],
    requiresAuth: true,
    allowedRoles: ["provider"],
  }),
  item({
    id: "exam-policy",
    label: "Exam policy",
    href: "/learning/exam-policy",
    category: "Fellowship",
    keywords: ["summative", "assessment", "retry"],
  }),
  item({
    id: "micro-courses-landing",
    label: "Micro-courses catalog",
    href: "/micro-courses",
    category: "Fellowship",
    keywords: ["ADF", "catalog"],
    requiresAuth: true,
    allowedRoles: ["provider"],
  }),
  item({
    id: "aha-courses",
    label: "AHA courses hub",
    href: "/aha-courses",
    category: "Courses",
    keywords: ["BLS", "ACLS", "PALS", "NRP", "Heartsaver"],
    requiresAuth: true,
    allowedRoles: ["provider"],
  }),

  // Tools
  item({
    id: "resusgps",
    label: "ResusGPS",
    href: "/resus",
    category: "Tools",
    description: "Bedside paediatric emergency clinical guidance",
    keywords: ["ABCDE", "CPR", "protocols", "GPS"],
    requiresAuth: true,
    allowedRoles: ["provider"],
  }),
  item({
    id: "care-signal",
    label: "Care Signal",
    href: "/care-signal",
    category: "Tools",
    description: "Provider incident and near-miss reporting",
    keywords: ["QI", "safety", "report"],
    requiresAuth: true,
    allowedRoles: ["provider"],
  }),
  item({
    id: "instructor-portal",
    label: "Instructor portal",
    href: "/instructor-portal",
    category: "Tools",
    requiresAuth: true,
    allowedRoles: ["provider"],
  }),
  item({
    id: "verify-certificate",
    label: "Verify certificate",
    href: "/verify",
    category: "Tools",
    keywords: ["certificate", "validation", "QR"],
  }),
  item({
    id: "certificates",
    label: "My certificates",
    href: "/certificates",
    category: "Tools",
    keywords: ["download", "credential"],
    requiresAuth: true,
    allowedRoles: ["provider"],
  }),

  // Institution
  item({
    id: "hospital-admin",
    label: "Hospital admin dashboard",
    href: "/hospital-admin-dashboard",
    category: "Tools",
    requiresAuth: true,
    allowedRoles: ["institution"],
  }),
  item({
    id: "institutional",
    label: "Institutional overview",
    href: "/institutional",
    category: "Help",
    keywords: ["quote", "onboarding"],
  }),
  item({
    id: "parent-safe-truth",
    label: "Parent Safe-Truth",
    href: "/parent-safe-truth",
    category: "Help",
    keywords: ["family", "guardian"],
    requiresAuth: true,
    allowedRoles: ["parent"],
  }),

  // Help
  item({
    id: "help",
    label: "Help centre",
    href: "/help",
    category: "Help",
    keywords: ["support", "FAQ", "contact"],
  }),
  item({
    id: "account",
    label: "Account settings",
    href: "/account",
    category: "Help",
    requiresAuth: true,
  }),
  item({
    id: "enroll",
    label: "Enrol in a course",
    href: "/enroll",
    category: "Help",
    requiresAuth: true,
    allowedRoles: ["provider"],
  }),
  item({
    id: "payment",
    label: "Payment",
    href: "/payment",
    category: "Help",
    requiresAuth: true,
    allowedRoles: ["provider"],
  }),

  // Legal
  item({ id: "terms", label: "Terms of use", href: "/terms", category: "Legal" }),
  item({ id: "privacy", label: "Privacy policy", href: "/privacy", category: "Legal" }),
  item({
    id: "clinical-use",
    label: "Clinical intended use",
    href: "/legal/clinical-use",
    category: "Legal",
    keywords: ["disclaimer", "scope"],
  }),
  item({ id: "cookies", label: "Cookie notice", href: "/legal/cookies", category: "Legal" }),
  item({
    id: "care-signal-notice",
    label: "Care Signal notice",
    href: "/legal/care-signal",
    category: "Legal",
  }),

  // Admin
  item({
    id: "admin-hub",
    label: "Admin hub",
    href: "/admin",
    category: "Admin",
    requiresAdmin: true,
  }),
  item({
    id: "admin-reports",
    label: "Admin reports",
    href: "/admin/reports",
    category: "Admin",
    requiresAdmin: true,
  }),
  item({
    id: "admin-mpesa",
    label: "M-Pesa reconciliation",
    href: "/admin/mpesa-reconciliation",
    category: "Admin",
    requiresAdmin: true,
  }),
  item({
    id: "admin-feedback",
    label: "Feedback inbox",
    href: "/admin/feedback",
    category: "Admin",
    requiresAdmin: true,
    keywords: ["tickets", "user feedback", "safety"],
  }),
  item({
    id: "admin-ops",
    label: "Admin operations",
    href: "/admin/ops",
    category: "Admin",
    requiresAdmin: true,
  }),
  item({
    id: "admin-webhooks",
    label: "M-Pesa webhooks",
    href: "/admin/mpesa-webhooks",
    category: "Admin",
    requiresAdmin: true,
  }),
  item({
    id: "admin-facility-care-signal",
    label: "Facility Care Signal",
    href: "/admin/facility-care-signal",
    category: "Admin",
    requiresAdmin: true,
  }),
  item({
    id: "admin-institutional-analytics",
    label: "Institutional analytics",
    href: "/admin/institutional-analytics",
    category: "Admin",
    requiresAdmin: true,
  }),
  item({
    id: "admin-care-signal-review",
    label: "Care Signal review",
    href: "/admin/care-signal-review",
    category: "Admin",
    requiresAdmin: true,
  }),
  item({
    id: "admin-national-signal",
    label: "National aggregate signal",
    href: "/admin/national-signal",
    category: "Admin",
    requiresAdmin: true,
  }),
  item({
    id: "admin-capstone",
    label: "Capstone grading",
    href: "/admin/capstone-grading",
    category: "Admin",
    requiresAdmin: true,
  }),
  item({
    id: "kaizen-dashboard",
    label: "Kaizen KPI dashboard",
    href: "/kaizen-dashboard",
    category: "Admin",
    requiresAdmin: true,
  }),
];

/** Full curated navigation index (static + catalog-derived). */
export function buildPlatformSearchIndex(): PlatformSearchItem[] {
  return [...STATIC_ITEMS, ...ahaCourseItems(), ...microCourseItems()];
}

export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function isSearchItemVisible(item: PlatformSearchItem, context: SearchContext): boolean {
  if (item.requiresAdmin && !context.isAdmin) return false;
  if (item.requiresAuth && !context.isAuthenticated) return false;
  if (item.allowedRoles?.length) {
    if (context.isAdmin) return true;
    if (!context.role || !item.allowedRoles.includes(context.role)) return false;
  }
  return true;
}

function searchableText(item: PlatformSearchItem): string {
  return [item.label, item.description ?? "", item.href, ...(item.keywords ?? []), item.category]
    .join(" ")
    .toLowerCase();
}

/** Simple relevance score — higher is better. */
export function scoreSearchMatch(item: PlatformSearchItem, query: string): number {
  const q = normalizeSearchQuery(query);
  if (!q) return 0;
  const label = item.label.toLowerCase();
  const text = searchableText(item);
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if (item.keywords?.some((k) => k.toLowerCase().includes(q))) return 50;
  if (text.includes(q)) return 40;
  return 0;
}

export function itemMatchesQuery(item: PlatformSearchItem, query: string): boolean {
  const q = normalizeSearchQuery(query);
  if (!q) return true;
  return searchableText(item).includes(q);
}

export function filterPlatformSearchItems(
  items: PlatformSearchItem[],
  query: string,
  context: SearchContext
): PlatformSearchItem[] {
  const visible = items.filter((entry) => isSearchItemVisible(entry, context));
  const q = normalizeSearchQuery(query);
  if (!q) return visible.slice(0, 50);

  return visible
    .filter((entry) => itemMatchesQuery(entry, q))
    .sort((a, b) => scoreSearchMatch(b, q) - scoreSearchMatch(a, q))
    .slice(0, 50);
}

/** Split filtered results by category for grouped UI. */
export function groupSearchResults(
  items: PlatformSearchItem[]
): Partial<Record<SearchCategory, PlatformSearchItem[]>> {
  const groups: Partial<Record<SearchCategory, PlatformSearchItem[]>> = {};
  for (const entry of items) {
    const list = groups[entry.category] ?? [];
    list.push(entry);
    groups[entry.category] = list;
  }
  return groups;
}

export const SEARCH_CATEGORY_ORDER: SearchCategory[] = [
  "Tools",
  "Fellowship",
  "Courses",
  "Help",
  "Legal",
  "Admin",
];
