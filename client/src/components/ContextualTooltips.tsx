import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface TooltipConfig {
  id: string;
  title: string;
  description: string;
  examples?: string[];
}

const TOOLTIPS: Record<string, TooltipConfig> = {
  "enrollment-payment-method": {
    id: "enrollment-payment-method",
    title: "Payment Methods",
    description: "Choose how you'd like to pay for this course",
    examples: [
      "M-Pesa: Pay via mobile money (fastest)",
      "Admin-Free: Available if you're an admin",
      "Promo Code: Use a discount code if you have one",
    ],
  },
  "fellowship-progress": {
    id: "fellowship-progress",
    title: "Fellowship Progress",
    description:
      "Track your journey through the Paeds Resus Fellowship. Complete micro-courses to progress.",
    examples: [
      "Each micro-course counts toward your fellowship",
      "You can access ResusGPS while enrolled",
      "Progress is saved automatically",
    ],
  },
  "care-signal-alerts": {
    id: "care-signal-alerts",
    title: "Care Signal Alerts",
    description:
      "Real-time clinical alerts for your facility based on patient presentations",
    examples: [
      "Alerts appear on your dashboard",
      "You can customize alert preferences",
      "Helps identify learning opportunities",
    ],
  },
  "promo-code": {
    id: "promo-code",
    title: "Promo Code",
    description: "Enter a promotional code to receive a discount on your enrollment",
    examples: [
      "Codes are case-insensitive",
      "Each code has a limited number of uses",
      "Expired codes won't work",
    ],
  },
  "course-access-duration": {
    id: "course-access-duration",
    title: "Course Access Duration",
    description:
      "How long you have access to the course materials after enrollment",
    examples: [
      "Most courses: 30 days of access",
      "Access includes all materials and videos",
      "You can download materials for offline use",
    ],
  },
  "resus-gps": {
    id: "resus-gps",
    title: "ResusGPS",
    description:
      "Your bedside clinical decision support system for pediatric emergencies",
    examples: [
      "Works offline on installed app",
      "Provides step-by-step guidance",
      "Includes drug dosing and procedures",
    ],
  },
  "admin-free-enrollment": {
    id: "admin-free-enrollment",
    title: "Admin-Free Enrollment",
    description:
      "If you're an admin, you can enroll in courses for free as part of your role",
    examples: [
      "Only available to admins",
      "No payment required",
      "Counts toward your fellowship",
    ],
  },
  "parent-resources": {
    id: "parent-resources",
    title: "Parent Resources",
    description:
      "Curated content for parents and caregivers about pediatric first aid and safety",
    examples: [
      "Age-appropriate guidance",
      "Downloadable guides",
      "Video demonstrations",
    ],
  },
  "institutional-dashboard": {
    id: "institutional-dashboard",
    title: "Institutional Dashboard",
    description:
      "Manage your institution's training program, staff, and track outcomes",
    examples: [
      "Add and manage team members",
      "Assign courses to staff",
      "View completion and outcome metrics",
    ],
  },
};

interface ContextualTooltipProps {
  id: keyof typeof TOOLTIPS;
  children?: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

export function ContextualTooltip({
  id,
  children,
  side = "right",
}: ContextualTooltipProps) {
  const tooltip = TOOLTIPS[id];

  if (!tooltip) {
    console.warn(`Tooltip with id "${id}" not found`);
    return children || null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <button className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition">
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">{tooltip.title}</p>
            <p className="text-sm">{tooltip.description}</p>
            {tooltip.examples && tooltip.examples.length > 0 && (
              <div className="text-xs space-y-1 mt-2 pt-2 border-t border-border/50">
                <p className="font-semibold">Examples:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {tooltip.examples.map((example, idx) => (
                    <li key={idx}>{example}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function TooltipIcon({ id }: { id: keyof typeof TOOLTIPS }) {
  return (
    <ContextualTooltip id={id}>
      <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition cursor-help" />
    </ContextualTooltip>
  );
}
