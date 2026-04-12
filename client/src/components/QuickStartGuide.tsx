import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle2, Clock, Zap, BookOpen } from "lucide-react";

interface QuickStartGuideProps {
  userRole?: "provider" | "parent" | "institution" | null;
  onDismiss?: () => void;
}

export function QuickStartGuide({ userRole, onDismiss }: QuickStartGuideProps) {
  const steps = {
    provider: [
      {
        step: 1,
        title: "Explore ResusGPS",
        description: "Start with the bedside tool for real-time clinical guidance",
        icon: <Zap className="w-5 h-5" />,
        href: "/resus",
        time: "5 min",
      },
      {
        step: 2,
        title: "Enroll in a Micro-Course",
        description: "Complete a focused course to start your Fellowship journey",
        icon: <BookOpen className="w-5 h-5" />,
        href: "/courses",
        time: "30-60 min",
      },
      {
        step: 3,
        title: "Track Your Progress",
        description: "View your Fellowship status and completed courses",
        icon: <CheckCircle2 className="w-5 h-5" />,
        href: "/fellowship",
        time: "2 min",
      },
      {
        step: 4,
        title: "Set Up Care Signal",
        description: "Enable real-time clinical alerts for your facility",
        icon: <Zap className="w-5 h-5" />,
        href: "/care-signal",
        time: "5 min",
      },
    ],
    parent: [
      {
        step: 1,
        title: "Learn Pediatric First Aid",
        description: "Start with foundational first aid training for families",
        icon: <BookOpen className="w-5 h-5" />,
        href: "/courses",
        time: "20-30 min",
      },
      {
        step: 2,
        title: "Access Safety Resources",
        description: "Browse guides and resources for child safety",
        icon: <Zap className="w-5 h-5" />,
        href: "/parent-safe-truth",
        time: "10 min",
      },
      {
        step: 3,
        title: "Explore ResusGPS",
        description: "Understand emergency response procedures",
        icon: <Zap className="w-5 h-5" />,
        href: "/resus",
        time: "10 min",
      },
    ],
    institution: [
      {
        step: 1,
        title: "Set Up Your Team",
        description: "Register staff members and assign courses",
        icon: <CheckCircle2 className="w-5 h-5" />,
        href: "/hospital-admin-dashboard",
        time: "15 min",
      },
      {
        step: 2,
        title: "Assign Micro-Courses",
        description: "Create training pathways for your staff",
        icon: <BookOpen className="w-5 h-5" />,
        href: "/admin/courses",
        time: "20 min",
      },
      {
        step: 3,
        title: "Monitor Progress",
        description: "Track completion rates and outcomes",
        icon: <CheckCircle2 className="w-5 h-5" />,
        href: "/advanced-analytics",
        time: "10 min",
      },
      {
        step: 4,
        title: "Enable Care Signal",
        description: "Set up facility-wide clinical alerts",
        icon: <Zap className="w-5 h-5" />,
        href: "/care-signal-analytics",
        time: "5 min",
      },
    ],
  };

  const currentSteps = steps[userRole || "provider"];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Quick Start Guide</CardTitle>
            <CardDescription>Get up and running in 4 easy steps</CardDescription>
          </div>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              ✕
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {currentSteps.map((item, index) => (
            <Link key={item.href} href={item.href}>
              <div className="flex gap-4 p-4 rounded-lg hover:bg-accent transition cursor-pointer border border-border/50">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                    {item.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">
                        Step {item.step}: {item.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          💡 Tip: You can access all features from the navigation menu at any time
        </p>
      </CardContent>
    </Card>
  );
}
