import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const experienceLanes = [
  {
    title: "Clinical Training Programs",
    description:
      "Access BLS, ACLS, PALS, and fellowship learning pathways in one place.",
    cta: "Go to BLS Course",
    href: "/course/bls",
    tag: "Training",
  },
  {
    title: "Institutional Programs",
    description:
      "Support hospitals with onboarding, team setup, and institutional workflows.",
    cta: "Start Institutional Onboarding",
    href: "/institutional-onboarding",
    tag: "Institutions",
  },
  {
    title: "Parent & Community Programs",
    description:
      "Explore practical first-aid and CPR education designed for caregivers.",
    cta: "Explore Parent Safe-Truth",
    href: "/parent-safe-truth",
    tag: "Community",
  },
  {
    title: "Extensions & Integrations",
    description:
      "Connect optional platform capabilities through available add-ons.",
    cta: "Open Institutional Portal",
    href: "/institutional-portal",
    tag: "Add-ons",
  },
];

const activationModules = [
  { label: "ResusGPS Clinical Engine", href: "/resus" },
  { label: "Safe-Truth Tool", href: "/safe-truth" },
  { label: "Enrollment", href: "/enroll" },
  { label: "Payments", href: "/payment" },
  { label: "Learner Dashboard", href: "/learner-dashboard" },
  { label: "Institutional Portal", href: "/institutional-portal" },
  { label: "Advanced Analytics", href: "/advanced-analytics" },
  { label: "Kaizen Dashboard", href: "/kaizen-dashboard" },
  { label: "Predictive Intervention", href: "/predictive-intervention" },
  { label: "Personalized Learning", href: "/personalized-learning" },
];

export default function PlatformActivation() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="space-y-4">
          <Badge variant="secondary">Platform Activation</Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Welcome to Paeds Resus
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Discover every major module from one hub and move directly into
            clinical tools, learning programs, institutional workflows, and
            performance dashboards.
          </p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {experienceLanes.map(lane => (
            <Card key={lane.title}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-xl">{lane.title}</CardTitle>
                  <Badge>{lane.tag}</Badge>
                </div>
                <CardDescription>{lane.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={lane.href}>
                  <Button className="w-full">{lane.cta}</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">Activated Modules</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activationModules.map(module => (
              <Link key={module.label} href={module.href}>
                <Card className="cursor-pointer transition-colors hover:bg-muted/60">
                  <CardContent className="p-4">
                    <p className="font-medium">{module.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {module.href}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
