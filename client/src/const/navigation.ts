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
  { label: "Hospital Admin", href: "/hospital-admin-dashboard", requiresAdmin: true },
  { label: "Advanced Analytics", href: "/advanced-analytics", requiresAdmin: true },
];

// Learning & Development - ONLY WORKING PAGES
export const learningNavItems: NavItem[] = [
  { label: "Care Signal", href: "/care-signal", description: "Provider incident & near-miss reporting" },
  { label: "BLS Course", href: "/course/bls", description: "Basic Life Support training" },
];

// Institutional Features - ONLY WORKING PAGES
export const institutionalNavItems: NavItem[] = [
  { label: "Institutional Dashboard", href: "/hospital-admin-dashboard", description: "Manage your institution" },
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
    { label: "Institutional Dashboard", href: "/hospital-admin-dashboard" },
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
  { label: "Learner Dashboard", href: "/home", icon: "📊" },
  { label: "Payment", href: "/payment", icon: "💳" },
  { label: "Care Signal", href: "/care-signal", icon: "🔍" },
  { label: "BLS Course", href: "/course/bls", icon: "❤️" },
  { label: "Predictive Alerts", href: "/predictive-intervention", icon: "🚨" },
  { label: "Learning Path", href: "/personalized-learning", icon: "🧠" },
  { label: "Kaizen Dashboard", href: "/kaizen-dashboard", icon: "📈" },
];

// Breadcrumb navigation helper - ONLY WORKING PAGES
export const breadcrumbMap: Record<string, string[]> = {
  "/": ["Home"],
  "/care-signal": ["Home", "Care Signal"],
  "/parent-safe-truth": ["Home", "Parent Resources"],
  "/course/bls": ["Home", "Courses", "BLS"],
  "/institutional": ["Home", "Institutions"],
  "/institutional-portal": ["Home", "Institutions", "Portal (legacy redirect)"],
  "/institutional-onboarding": ["Home", "Institutions", "Onboarding"],
  "/home": ["Home", "Dashboard"],
  "/payment": ["Home", "Payment"],
  "/hospital-admin-dashboard": ["Home", "Admin", "Hospital Dashboard"],
  "/advanced-analytics": ["Home", "Admin", "Analytics"],
  "/kaizen-dashboard": ["Home", "Kaizen"],
  "/predictive-intervention": ["Home", "ML", "Predictive Alerts"],
  "/personalized-learning": ["Home", "ML", "Learning Path"],
  "/enroll": ["Home", "Enroll"],
  "/protocols": ["Home", "Protocols"],
  "/care-signal-analytics": ["Home", "Admin", "Care Signal analytics"],
};
