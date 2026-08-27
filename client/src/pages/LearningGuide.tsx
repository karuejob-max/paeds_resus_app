import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useWorkspaceAccess } from "@/hooks/useWorkspaceAccess";
import {
  INSTITUTION_DESTINATIONS,
  INSTITUTION_LEARNING_STEPS,
  INSTITUTION_LEARNING_TABS,
  INDIVIDUAL_DESTINATIONS,
  INDIVIDUAL_LEARNING_STEPS,
  LEARNING_BOUNDARIES,
  LEARNING_GUIDE_SAFETY_NOTE,
  LEARNING_GUIDE_VERSION,
  type GuideAudience,
  type LearningDestination,
  type LearningGuideStep,
} from "@/lib/learningGuideContent";

function GuideStepList({ steps }: { steps: LearningGuideStep[] }) {
  return (
    <div className="space-y-3">
      {steps.map(step => (
        <div
          key={step.number}
          className="flex gap-3 rounded-xl border bg-background p-4"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-900 dark:bg-teal-950 dark:text-teal-100">
            {step.number}
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground">{step.title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {step.detail}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DestinationGrid({
  destinations,
  navigate,
}: {
  destinations: LearningDestination[];
  navigate: (route: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {destinations.map(destination => (
        <Card
          key={destination.route}
          className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{destination.title}</CardTitle>
            <CardDescription className="leading-5">
              {destination.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate(destination.route)}
            >
              {destination.action}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function LearningGuide() {
  const [, navigate] = useLocation();
  const { effectiveWorkspace } = useWorkspaceAccess();
  const [audience, setAudience] = useState<GuideAudience>(() =>
    effectiveWorkspace === "institution" ? "institution" : "individual"
  );

  useEffect(() => {
    if (
      effectiveWorkspace === "institution" ||
      effectiveWorkspace === "provider"
    ) {
      setAudience(
        effectiveWorkspace === "institution" ? "institution" : "individual"
      );
    }
  }, [effectiveWorkspace]);

  usePageMeta({
    title: "Learning guide — Paeds Resus",
    description:
      "A current guide to using Paeds Resus Learning in the individual and institutional portals.",
    path: "/learning/guide",
  });

  const isInstitution = audience === "institution";
  const steps = isInstitution
    ? INSTITUTION_LEARNING_STEPS
    : INDIVIDUAL_LEARNING_STEPS;
  const destinations = isInstitution
    ? INSTITUTION_DESTINATIONS
    : INDIVIDUAL_DESTINATIONS;

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950/30">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-6 flex items-start gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-0.5 shrink-0"
            aria-label="Back to portal"
            onClick={() => navigate(isInstitution ? "/institution" : "/home")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-teal-200 text-teal-800 dark:border-teal-800 dark:text-teal-200"
              >
                Learning guide
              </Badge>
              <span className="text-xs text-muted-foreground">
                {LEARNING_GUIDE_VERSION}
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              Use Paeds Resus as a connected learning system
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              Start with the job you need to do today, choose the correct
              portal, and carry learning into safe practice. This guide shows
              where to begin, what each workspace is for, and how learning,
              practice, readiness, and records fit together.
            </p>
          </div>
        </div>

        <Card className="border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="flex gap-3 p-5 text-sm leading-6 text-amber-950 dark:text-amber-100">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
            <p>{LEARNING_GUIDE_SAFETY_NOTE}</p>
          </CardContent>
        </Card>

        <section className="mt-8" aria-labelledby="choose-portal-heading">
          <div className="mb-4">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
              Choose your view
            </p>
            <h2
              id="choose-portal-heading"
              className="mt-2 text-2xl font-semibold tracking-tight"
            >
              Two portals, one connected learning picture
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Individuals complete their own learning and keep their records.
              Institutions organise cohorts, competency, CPD, targets, and
              reports. Switch views only when you have the corresponding
              workspace access.
            </p>
          </div>
          <Tabs
            value={audience}
            onValueChange={value => setAudience(value as GuideAudience)}
          >
            <TabsList className="grid h-auto w-full grid-cols-1 gap-1 p-1 min-[420px]:grid-cols-2">
              <TabsTrigger value="individual" className="min-h-11 text-sm">
                <Stethoscope className="mr-2 h-4 w-4" />
                Individual portal
              </TabsTrigger>
              <TabsTrigger value="institution" className="min-h-11 text-sm">
                <Building2 className="mr-2 h-4 w-4" />
                Institutional portal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="mt-6 space-y-6">
              <Card className="border-violet-200 bg-violet-50/60 dark:border-violet-900 dark:bg-violet-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-violet-950 dark:text-violet-100">
                    <GraduationCap className="h-5 w-5 text-violet-700 dark:text-violet-300" />
                    Individual learning journey
                  </CardTitle>
                  <CardDescription className="text-violet-900/80 dark:text-violet-100/80">
                    Use /home as your starting point, /learn as the learning
                    hub, and /records for certificates and CPD history.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GuideStepList steps={INDIVIDUAL_LEARNING_STEPS} />
                </CardContent>
              </Card>
              <DestinationGrid
                destinations={INDIVIDUAL_DESTINATIONS}
                navigate={navigate}
              />
            </TabsContent>

            <TabsContent value="institution" className="mt-6 space-y-6">
              <Card className="border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-950 dark:text-blue-100">
                    <Building2 className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                    Institutional learning journey
                  </CardTitle>
                  <CardDescription className="text-blue-900/80 dark:text-blue-100/80">
                    Use /institution as the canonical workspace. Select Learning
                    for workforce development and Readiness for IERS operations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GuideStepList steps={INSTITUTION_LEARNING_STEPS} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpenCheck className="h-5 w-5 text-blue-700" />
                    What the institutional Learning tabs do
                  </CardTitle>
                  <CardDescription>
                    Use each tab for one job; do not treat training completion
                    as a readiness clearance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {INSTITUTION_LEARNING_TABS.map(tab => (
                    <div
                      key={tab.title}
                      className="rounded-xl border bg-background p-4"
                    >
                      <p className="font-semibold">{tab.title}</p>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">
                        {tab.description}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <DestinationGrid
                destinations={INSTITUTION_DESTINATIONS}
                navigate={navigate}
              />
            </TabsContent>
          </Tabs>
        </section>

        <section className="mt-10" aria-labelledby="boundary-heading">
          <div className="mb-4">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">
              Keep the boundaries clear
            </p>
            <h2
              id="boundary-heading"
              className="mt-2 text-2xl font-semibold tracking-tight"
            >
              The right tool for the right job
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {LEARNING_BOUNDARIES.map(boundary => (
              <Card key={boundary.title} className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {boundary.title === "Practice" ? (
                      <HeartPulse className="h-5 w-5 text-red-700" />
                    ) : boundary.title === "Readiness" ? (
                      <ClipboardCheck className="h-5 w-5 text-teal-700" />
                    ) : boundary.title === "Records" ? (
                      <CheckCircle2 className="h-5 w-5 text-blue-700" />
                    ) : (
                      <GraduationCap className="h-5 w-5 text-violet-700" />
                    )}
                    {boundary.title}
                  </CardTitle>
                  <CardDescription>{boundary.owner}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">
                  {boundary.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card className="mt-10 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="font-semibold">Need the IERS Readiness workflow?</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Learning explains how to develop people and review records. IERS
                Readiness explains dated responsibility, equipment, activation,
                drills, evidence, and improvement actions.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() => navigate("/iers/orientation")}
            >
              Open IERS guide <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
