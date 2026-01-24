/**
 * Navigation Configuration - ONLY WORKING PAGES
 * Removed all broken/non-existent links
 */

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  description?: string;
  category?: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
}

// Main navigation items for Header - ONLY WORKING PAGES
export const mainNavItems: NavItem[] = [
  { label: "Safe-Truth", href: "/safe-truth", category: "main" },
  { label: "For Institutions", href: "/institutional", category: "main" },
  { label: "For Parents", href: "/parent-safe-truth", category: "main" },
  { label: "Courses", href: "/course/bls", category: "main" },
];

// Authenticated user navigation - ONLY WORKING PAGES
export const authenticatedNavItems: NavItem[] = [
  { label: "Learner Dashboard", href: "/learner-dashboard", requiresAuth: true },
  { label: "Payment", href: "/payment", requiresAuth: true },
];

// Admin navigation items - ONLY WORKING PAGES
export const adminNavItems: NavItem[] = [
  { label: "Hospital Admin", href: "/hospital-admin-dashboard", requiresAdmin: true },
  { label: "Advanced Analytics", href: "/advanced-analytics", requiresAdmin: true },
];

// Learning & Development - ONLY WORKING PAGES
export const learningNavItems: NavItem[] = [
  { label: "Safe-Truth Tool", href: "/safe-truth", description: "Interactive assessment tool" },
  { label: "BLS Course", href: "/course/bls", description: "Basic Life Support training" },
];

// Institutional Features - ONLY WORKING PAGES
export const institutionalNavItems: NavItem[] = [
  { label: "Institutional Portal", href: "/institutional-portal", description: "Manage your institution" },
  { label: "Institutional Onboarding", href: "/institutional-onboarding", description: "Get started" },
];

// Support & Information - ONLY WORKING PAGES
export const supportNavItems: NavItem[] = [
  // No support pages implemented yet
];

// Legal & Compliance - ONLY WORKING PAGES
export const legalNavItems: NavItem[] = [
  // No legal pages implemented yet
];

// Footer sections - ONLY WORKING PAGES
export const footerSections = {
  quickLinks: [
    { label: "Home", href: "/" },
    { label: "Safe-Truth", href: "/safe-truth" },
    { label: "For Institutions", href: "/institutional" },
    { label: "For Parents", href: "/parent-safe-truth" },
  ],
  learning: [
    { label: "Safe-Truth Tool", href: "/safe-truth" },
    { label: "BLS Course", href: "/course/bls" },
  ],
  institutional: [
    { label: "Institutional Portal", href: "/institutional-portal" },
    { label: "Institutional Onboarding", href: "/institutional-onboarding" },
  ],
  mlDashboards: [
    { label: "Predictive Alerts", href: "/predictive-intervention" },
    { label: "Learning Path", href: "/personalized-learning" },
    { label: "Kaizen Dashboard", href: "/kaizen-dashboard" },
  ],
};

// Dashboard sidebar navigation for authenticated users - ONLY WORKING PAGES
export const dashboardNavItems: NavItem[] = [
  { label: "Learner Dashboard", href: "/learner-dashboard", icon: "📊" },
  { label: "Payment", href: "/payment", icon: "💳" },
  { label: "Safe-Truth", href: "/safe-truth", icon: "🔍" },
  { label: "BLS Course", href: "/course/bls", icon: "❤️" },
  { label: "Predictive Alerts", href: "/predictive-intervention", icon: "🚨" },
  { label: "Learning Path", href: "/personalized-learning", icon: "🧠" },
  { label: "Kaizen Dashboard", href: "/kaizen-dashboard", icon: "📈" },
];

// Breadcrumb navigation helper - ONLY WORKING PAGES
export const breadcrumbMap: Record<string, string[]> = {
  "/": ["Home"],
  "/safe-truth": ["Home", "Safe-Truth"],
  "/parent-safe-truth": ["Home", "Parent Resources"],
  "/course/bls": ["Home", "Courses", "BLS"],
  "/institutional": ["Home", "Institutions"],
  "/institutional-portal": ["Home", "Institutions", "Portal"],
  "/institutional-onboarding": ["Home", "Institutions", "Onboarding"],
  "/learner-dashboard": ["Home", "Dashboard"],
  "/payment": ["Home", "Payment"],
  "/hospital-admin-dashboard": ["Home", "Admin", "Hospital Dashboard"],
  "/advanced-analytics": ["Home", "Admin", "Analytics"],
  "/safe-truth-analytics": ["Home", "Analytics"],
  "/kaizen-dashboard": ["Home", "Kaizen"],
  "/predictive-intervention": ["Home", "ML", "Predictive Alerts"],
  "/personalized-learning": ["Home", "ML", "Learning Path"],
  "/enroll": ["Home", "Enroll"],
};
