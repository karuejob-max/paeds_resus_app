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
  { label: "Care Signal", href: "/care-signal", category: "main" },
  { label: "For Institutions", href: "/institutional", category: "main" },
  { label: "For Parents", href: "/parent-safe-truth", category: "main" },
  { label: "Courses", href: "/course/bls", category: "main" },
];

// Authenticated user navigation - ONLY WORKING PAGES
export const authenticatedNavItems: NavItem[] = [
  { label: "Learner Dashboard", href: "/home", requiresAuth: true },
  { label: "Payment", href: "/payment", requiresAuth: true },
];

// Admin navigation items - ONLY WORKING PAGES
export const adminNavItems: NavItem[] = [
  { label: "Institution Workspace", href: "/institution", requiresAdmin: true },
  { label: "Kaizen KPI", href: "/kaizen-dashboard", requiresAdmin: true },
];

// Learning & Development - ONLY WORKING PAGES
export const learningNavItems: NavItem[] = [
  { label: "Learning guide", href: "/learning/guide", description: "How to use individual and institutional Learning" },
  { label: "Care Signal", href: "/care-signal", description: "Provider incident & near-miss reporting" },
  { label: "BLS Course", href: "/course/bls", description: "Basic Life Support training" },
];

// Institutional Features - ONLY WORKING PAGES
export const institutionalNavItems: NavItem[] = [
  { label: "Institution Workspace", href: "/institution", description: "IERS Readiness, ILS Program, CPD Portal, and administration" },
  { label: "Institutional Life Support", href: "/training/institutional-life-support", description: "Paeds Resus competency training for provider cohorts" },
  { label: "Institutional Onboarding", href: "/institutional-onboarding", description: "Get started" },
];

// Support & Information — point to existing routes (contact/faq redirect in App)
export const supportNavItems: NavItem[] = [
  { label: "Help", href: "/help", description: "Help centre and common paths" },
  { label: "Contact", href: "/contact", description: "Institutional quote and enquiries" },
  { label: "FAQ", href: "/faq", description: "FAQ (help centre)" },
];

// Legal & Compliance
export const legalNavItems: NavItem[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "About", href: "/about" },
];

// Footer sections - ONLY WORKING PAGES
export const footerSections = {
  quickLinks: [
    { label: "Home", href: "/" },
    { label: "Care Signal", href: "/care-signal" },
    { label: "For Institutions", href: "/institutional" },
    { label: "For Parents", href: "/parent-safe-truth" },
  ],
  learning: [
    { label: "Care Signal", href: "/care-signal" },
    { label: "BLS Course", href: "/course/bls" },
  ],
  institutional: [
    { label: "Institution Workspace", href: "/institution" },
    { label: "Institutional Life Support", href: "/training/institutional-life-support" },
    { label: "Institutional Onboarding", href: "/institutional-onboarding" },
  ],
  // Simulated ML previews — not linked in production nav (see AspirationalSurfaceGate).
  mlDashboards: [] as { label: string; href: string }[],
};

// Dashboard sidebar navigation for authenticated users - ONLY WORKING PAGES
export const dashboardNavItems: NavItem[] = [
  { label: "Learner Dashboard", href: "/home", icon: "📊" },
  { label: "Learning guide", href: "/learning/guide", icon: "🧭" },
  { label: "Payment", href: "/payment", icon: "💳" },
  { label: "Care Signal", href: "/care-signal", icon: "🔍" },
  { label: "BLS Course", href: "/course/bls", icon: "❤️" },
];

// Breadcrumb navigation helper - ONLY WORKING PAGES
export const breadcrumbMap: Record<string, string[]> = {
  "/": ["Home"],
  "/care-signal": ["Home", "Care Signal"],
  "/parent-safe-truth": ["Home", "Parent Resources"],
  "/course/bls": ["Home", "Courses", "BLS"],
  "/institutional": ["Home", "Institutions"],
  "/institutional-portal": ["Home", "Institutions", "Institution Workspace"],
  "/institutional-onboarding": ["Home", "Institutions", "Onboarding"],
  "/home": ["Home", "Dashboard"],
  "/payment": ["Home", "Payment"],
  "/institution": ["Home", "Institutions", "Institution Workspace"],
  "/kaizen-dashboard": ["Home", "Admin", "Kaizen KPI"],
  "/predictive-intervention": ["Home", "ML", "Predictive Alerts"],
  "/personalized-learning": ["Home", "ML", "Learning Path"],
  "/learning/guide": ["Home", "Learning", "Guide"],
  "/training/institutional-life-support": ["Home", "Institutions", "ILS Program"],
  "/enroll": ["Home", "Enroll"],
  "/protocols": ["Home", "Protocols"],
  "/care-signal-analytics": ["Home", "Admin", "Care Signal analytics"],
};
