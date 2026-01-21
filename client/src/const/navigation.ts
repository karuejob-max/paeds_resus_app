/**
 * Comprehensive Navigation Configuration
 * All pages and their navigation structure
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

// Main navigation items for Header
export const mainNavItems: NavItem[] = [
  { label: "For Providers", href: "/providers", category: "main" },
  { label: "For Hospitals", href: "/institutional", category: "main" },
  { label: "For Parents", href: "/parents", category: "main" },
  { label: "Facilities", href: "/facilities", category: "main" },
  { label: "Resources", href: "/resources", category: "main" },
  { label: "About", href: "/about", category: "main" },
  { label: "Contact", href: "/contact", category: "main" },
];

// Authenticated user navigation
export const authenticatedNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", requiresAuth: true },
  { label: "My Progress", href: "/progress", requiresAuth: true },
  { label: "My Achievements", href: "/achievements", requiresAuth: true },
  { label: "Leaderboard", href: "/leaderboard", requiresAuth: true },
  { label: "Referral Program", href: "/referral-program", requiresAuth: true },
  { label: "My Certificates", href: "/verify-certificate", requiresAuth: true },
  { label: "Payment History", href: "/payments", requiresAuth: true },
];

// Admin navigation items
export const adminNavItems: NavItem[] = [
  { label: "Admin Dashboard", href: "/admin", requiresAdmin: true },
  { label: "Institutional Mgmt", href: "/institutional-management", requiresAdmin: true },
  { label: "SMS Management", href: "/sms-management", requiresAdmin: true },
  { label: "Analytics", href: "/analytics", requiresAdmin: true },
];

// Learning & Development
export const learningNavItems: NavItem[] = [
  { label: "Elite Fellowship", href: "/elite-fellowship", description: "Head, Heart, Hands framework" },
  { label: "Safe-Truth Tool", href: "/safe-truth", description: "Interactive assessment tool" },
  { label: "Training Schedules", href: "/training-schedules", description: "View upcoming training" },
  { label: "AHA eLearning", href: "/aha-elearning", description: "American Heart Association courses" },
  { label: "Success Stories", href: "/success-stories", description: "Learn from others" },
];

// Institutional Features
export const institutionalNavItems: NavItem[] = [
  { label: "Institutional Dashboard", href: "/institutional-dashboard", description: "Manage your institution" },
  { label: "Pricing Calculator", href: "/pricing-calculator", description: "Calculate costs" },
  { label: "ROI Calculator", href: "/roi-calculator", description: "Calculate return on investment" },
];

// Support & Information
export const supportNavItems: NavItem[] = [
  { label: "FAQ", href: "/faq", description: "Frequently asked questions" },
  { label: "Help Center", href: "/support", description: "Get help and support" },
  { label: "Contact Us", href: "/contact", description: "Get in touch with us" },
];

// Legal & Compliance
export const legalNavItems: NavItem[] = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

// Footer sections
export const footerSections = {
  quickLinks: [
    { label: "Home", href: "/" },
    { label: "For Providers", href: "/providers" },
    { label: "For Hospitals", href: "/institutional" },
    { label: "For Parents", href: "/parents" },
    { label: "Resources", href: "/resources" },
  ],
  learning: [
    { label: "Elite Fellowship", href: "/elite-fellowship" },
    { label: "Safe-Truth Tool", href: "/safe-truth" },
    { label: "Training Schedules", href: "/training-schedules" },
    { label: "AHA eLearning", href: "/aha-elearning" },
    { label: "Success Stories", href: "/success-stories" },
  ],
  support: [
    { label: "FAQ", href: "/faq" },
    { label: "Help Center", href: "/support" },
    { label: "Contact Us", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
  institutional: [
    { label: "Institutional Dashboard", href: "/institutional-dashboard" },
    { label: "Pricing Calculator", href: "/pricing-calculator" },
    { label: "ROI Calculator", href: "/roi-calculator" },
  ],
};

// Dashboard sidebar navigation for authenticated users
export const dashboardNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "My Progress", href: "/progress", icon: "📈" },
  { label: "My Achievements", href: "/achievements", icon: "🏆" },
  { label: "Leaderboard", href: "/leaderboard", icon: "🎯" },
  { label: "Referral Program", href: "/referral-program", icon: "🤝" },
  { label: "My Certificates", href: "/verify-certificate", icon: "📜" },
  { label: "Payment History", href: "/payments", icon: "💳" },
  { label: "Learning Paths", href: "/elite-fellowship", icon: "🎓" },
  { label: "AHA Courses", href: "/aha-elearning", icon: "❤️" },
  { label: "Community", href: "/community", icon: "👥" },
  { label: "Search Courses", href: "/search", icon: "🔍" },
];

// Breadcrumb navigation helper
export const breadcrumbMap: Record<string, string[]> = {
  "/elite-fellowship": ["Home", "Learning", "Elite Fellowship"],
  "/safe-truth": ["Home", "Learning", "Safe-Truth Tool"],
  "/training-schedules": ["Home", "Learning", "Training Schedules"],
  "/aha-elearning": ["Home", "Learning", "AHA eLearning"],
  "/success-stories": ["Home", "Learning", "Success Stories"],
  "/institutional-dashboard": ["Home", "Institutional", "Dashboard"],
  "/pricing-calculator": ["Home", "Institutional", "Pricing Calculator"],
  "/roi-calculator": ["Home", "Institutional", "ROI Calculator"],
  "/achievements": ["Home", "Learning", "My Achievements"],
  "/leaderboard": ["Home", "Learning", "Leaderboard"],
  "/referral-program": ["Home", "Learning", "Referral Program"],
  "/progress": ["Home", "Learning", "My Progress"],
  "/dashboard": ["Home", "My Account", "Dashboard"],
  "/verify-certificate": ["Home", "My Account", "Certificates"],
  "/payments": ["Home", "My Account", "Payment History"],
  "/faq": ["Home", "Support", "FAQ"],
  "/support": ["Home", "Support", "Help Center"],
  "/contact": ["Home", "Support", "Contact Us"],
  "/about": ["Home", "About"],
  "/terms": ["Home", "Legal", "Terms of Service"],
  "/privacy": ["Home", "Legal", "Privacy Policy"],
};
