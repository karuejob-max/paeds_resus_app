import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Zap, BookOpen, Users, BarChart3, AlertCircle, FileText, Heart, Settings } from "lucide-react";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  roles: ("provider" | "parent" | "institution")[];
}

const FEATURES: Feature[] = [
  {
    id: "resus-gps",
    title: "ResusGPS",
    description: "Real-time clinical decision support at the bedside. Step-by-step guidance for pediatric emergencies.",
    icon: <Zap className="w-6 h-6" />,
    href: "/resus",
    badge: "Essential",
    roles: ["provider", "parent"],
  },
  {
    id: "courses",
    title: "Micro-Courses",
    description: "Learn pediatric resuscitation through focused, evidence-based micro-courses. Start your Fellowship journey.",
    icon: <BookOpen className="w-6 h-6" />,
    href: "/courses",
    badge: "Learning",
    roles: ["provider", "parent"],
  },
  {
    id: "fellowship",
    title: "Fellowship",
    description: "Track your progress through the Paeds Resus Fellowship. Complete micro-courses and earn certification.",
    icon: <Heart className="w-6 h-6" />,
    href: "/fellowship",
    badge: "Pathway",
    roles: ["provider"],
  },
  {
    id: "aha-courses",
    title: "AHA Certification",
    description: "BLS, ACLS, and PALS certification courses. Optional standalone offerings for advanced training.",
    icon: <FileText className="w-6 h-6" />,
    href: "/aha-courses",
    badge: "Certification",
    roles: ["provider"],
  },
  {
    id: "care-signal",
    title: "Care Signal",
    description: "Real-time clinical alerts and facility-wide safety monitoring. Identify and respond to patient deterioration.",
    icon: <AlertCircle className="w-6 h-6" />,
    href: "/care-signal",
    badge: "Safety",
    roles: ["provider"],
  },
  {
    id: "patients",
    title: "Patients",
    description: "Manage your patient list, track care episodes, and monitor outcomes.",
    icon: <Users className="w-6 h-6" />,
    href: "/patients",
    roles: ["provider"],
  },
  {
    id: "performance",
    title: "Performance Dashboard",
    description: "Track your clinical performance, completion rates, and improvement metrics.",
    icon: <BarChart3 className="w-6 h-6" />,
    href: "/performance-dashboard",
    roles: ["provider"],
  },
  {
    id: "protocols",
    title: "Emergency Protocols",
    description: "Quick reference guides for emergency management. Evidence-based protocols for common scenarios.",
    icon: <FileText className="w-6 h-6" />,
    href: "/protocols",
    roles: ["provider"],
  },
  {
    id: "instructor",
    title: "Instructor Portal",
    description: "Create and manage courses. Track student progress and outcomes.",
    icon: <Settings className="w-6 h-6" />,
    href: "/instructor-portal",
    roles: ["provider"],
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Facility-wide analytics and insights. Track training impact and patient outcomes.",
    icon: <BarChart3 className="w-6 h-6" />,
    href: "/advanced-analytics",
    roles: ["institution"],
  },
];

interface FeatureDiscoveryDashboardProps {
  userRole?: "provider" | "parent" | "institution" | null;
}

export function FeatureDiscoveryDashboard({ userRole }: FeatureDiscoveryDashboardProps) {
  const filteredFeatures = userRole
    ? FEATURES.filter((f) => f.roles.includes(userRole))
    : FEATURES.filter((f) => f.roles.includes("provider"));

  const essentialFeatures = filteredFeatures.filter((f) => f.badge === "Essential" || f.badge === "Learning");
  const otherFeatures = filteredFeatures.filter((f) => !f.badge || (f.badge !== "Essential" && f.badge !== "Learning"));

  return (
    <div className="space-y-8">
      {/* Essential Features */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Get Started</h2>
        <p className="text-muted-foreground mb-6">Start here to learn pediatric resuscitation and access real-time clinical support.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {essentialFeatures.map((feature) => (
            <Link key={feature.id} href={feature.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-primary">{feature.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        {feature.badge && (
                          <span className="inline-block mt-1 px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                            {feature.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Other Features */}
      {otherFeatures.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Explore More</h2>
          <p className="text-muted-foreground mb-6">Advanced tools for managing patients, tracking progress, and improving outcomes.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherFeatures.map((feature) => (
              <Link key={feature.id} href={feature.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-primary">{feature.icon}</div>
                        <div>
                          <CardTitle className="text-base">{feature.title}</CardTitle>
                          {feature.badge && (
                            <span className="inline-block mt-1 px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                              {feature.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
