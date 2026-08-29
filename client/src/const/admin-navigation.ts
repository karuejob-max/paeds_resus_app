import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  BookOpenCheck,
  Building2,
  ClipboardCheck,
  FileBarChart,
  KeyRound,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Users,
  WalletCards,
} from "lucide-react";

export type AdminRouteRisk = "read" | "review" | "operational" | "bulk" | "maintenance";

export type AdminRouteItem = {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
  risk?: AdminRouteRisk;
  badge?: string;
};

export type AdminNavigationGroup = {
  label: string;
  icon: LucideIcon;
  items: AdminRouteItem[];
};

export const adminNavigationGroups: AdminNavigationGroup[] = [
  {
    label: "Overview",
    icon: BarChart3,
    items: [
      {
        label: "Admin overview",
        href: "/admin",
        description: "What needs attention across the Paeds Resus platform today.",
        icon: BarChart3,
        risk: "read",
      },
    ],
  },
  {
    label: "People & access",
    icon: Users,
    items: [
      {
        label: "Institutional recovery",
        href: "/admin-institutional-recovery",
        description: "Review verified institution recovery requests.",
        icon: RefreshCw,
        risk: "operational",
      },
      {
        label: "Feedback inbox",
        href: "/admin/feedback",
        description: "Review user feedback across courses, ResusGPS, and Care Signal.",
        icon: ClipboardCheck,
        risk: "review",
      },
    ],
  },
  {
    label: "Access & entitlements",
    icon: KeyRound,
    items: [
      {
        label: "Access grants",
        href: "/admin/access-grants",
        description: "Issue named, auditable free or discounted access to Paeds Resus programmes and services.",
        icon: KeyRound,
        risk: "operational",
        badge: "New",
      },
    ],
  },
  {
    label: "Learning & certification",
    icon: BookOpenCheck,
    items: [
      {
        label: "Capstone grading",
        href: "/admin/capstone-grading",
        description: "Review and grade fellowship capstone submissions.",
        icon: ClipboardCheck,
        risk: "review",
      },
      {
        label: "CPD analytics",
        href: "/admin/cpd-analytics",
        description: "Review continuing professional development activity and trends.",
        icon: BookOpenCheck,
        risk: "read",
      },
      {
        label: "Course management",
        href: "/admin/courses",
        description: "Manage the learning catalogue and course content.",
        icon: Stethoscope,
        risk: "operational",
      },
    ],
  },
  {
    label: "Quality & clinical intelligence",
    icon: ShieldCheck,
    items: [
      {
        label: "Care Signal review",
        href: "/admin/care-signal-review",
        description: "Review provider-submitted incidents and near misses awaiting action.",
        icon: ShieldCheck,
        risk: "review",
      },
      {
        label: "Code Signal review",
        href: "/admin/code-signal-review",
        description: "Review whole-hospital resuscitation reports awaiting action.",
        icon: ShieldCheck,
        risk: "review",
      },
      {
        label: "Facility Care Signal",
        href: "/admin/facility-care-signal",
        description: "Inspect facility-level quality and reporting coverage.",
        icon: Building2,
        risk: "read",
      },
      {
        label: "Institutional analytics",
        href: "/admin/institutional-analytics",
        description: "Inspect facility training gaps and institutional coverage.",
        icon: Building2,
        risk: "read",
      },
      {
        label: "National signal",
        href: "/admin/national-signal",
        description: "View governed, anonymised national paediatric emergency signal.",
        icon: Activity,
        risk: "read",
      },
      {
        label: "Knowledge Stewardship",
        href: "/admin/knowledge-stewardship",
        description: "Review governed knowledge and clinical intelligence records.",
        icon: Stethoscope,
        risk: "review",
      },
    ],
  },
  {
    label: "Revenue & communications",
    icon: WalletCards,
    items: [
      {
        label: "M-Pesa reconciliation",
        href: "/admin/mpesa-reconciliation",
        description: "Resolve stale or failed payment records.",
        icon: WalletCards,
        risk: "operational",
      },
      {
        label: "M-Pesa webhook log",
        href: "/admin/mpesa-webhooks",
        description: "Inspect payment callback events and signature outcomes.",
        icon: WalletCards,
        risk: "read",
      },
      {
        label: "NERP verification",
        href: "/admin/nerp-verification",
        description: "Verify external NERP phases and campaign previews.",
        icon: ClipboardCheck,
        risk: "review",
      },
      {
        label: "AHA proof review",
        href: "/admin/aha-proof-review",
        description: "Review private AHA Video Prework and Self-Assessment certificates.",
        icon: ClipboardCheck,
        risk: "review",
      },
      {
        label: "IERP campaigns",
        href: "/admin/ierp-campaigns",
        description: "Manage governed IERP campaign operations.",
        icon: Megaphone,
        risk: "operational",
      },
      {
        label: "Promotional messaging",
        href: "/admin/promotional-messaging",
        description: "Preview and govern bulk promotional delivery.",
        icon: Megaphone,
        risk: "bulk",
      },
    ],
  },
  {
    label: "Reports & platform operations",
    icon: FileBarChart,
    items: [
      {
        label: "Reports & insights",
        href: "/admin/reports",
        description: "Find users and inspect enrolments, certificates, analytics, and exports.",
        icon: FileBarChart,
        risk: "read",
      },
      {
        label: "Platform Ops",
        href: "/admin/ops",
        description: "Inspect errors, stuck workflows, and system health.",
        icon: Activity,
        risk: "operational",
      },
      {
        label: "Kaizen KPI",
        href: "/kaizen-dashboard",
        description: "Review internal operating targets and KPI trends.",
        icon: BarChart3,
        risk: "read",
      },
    ],
  },
];

export const adminPrimaryRoutes = adminNavigationGroups.flatMap(group => group.items);

export const adminRouteByHref = new Map(adminPrimaryRoutes.map(item => [item.href, item]));

export function isAdminRouteActive(currentPath: string, href: string) {
  if (href === "/admin") return currentPath === "/admin";
  if (href.includes("?")) return currentPath === href.split("?")[0];
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export const adminRiskLabels: Record<AdminRouteRisk, string> = {
  read: "Read-only",
  review: "Review",
  operational: "Operational",
  bulk: "Bulk action",
  maintenance: "Maintenance",
};
