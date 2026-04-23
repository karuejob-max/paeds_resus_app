import { useEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle2, ArrowLeft } from "lucide-react";
import { useProviderConversionAnalytics } from "@/hooks/useProviderConversionAnalytics";
import { getAhaContinueRoute } from "@/lib/providerCourseRoutes";

const AHA_PROGRAM_COPY: Record<"bls" | "acls" | "pals", { title: string; description: string }> = {
  bls: {
    title: "BLS (Basic Life Support)",
    description: "Core life support skills for rapid recognition, CPR, and team response.",
  },
  acls: {
    title: "ACLS (Advanced Cardiovascular Life Support)",
    description: "Advanced cardiac emergency assessment, algorithms, and post-event management.",
  },
  pals: {
    title: "PALS (Pediatric Advanced Life Support)",
    description: "Pediatric emergency assessment and stabilization for critically ill children.",
  },
};

export default function AHACourses() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { track } = useProviderConversionAnalytics("/aha-courses");

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [loading, user, setLocation]);

  const { data: ahaCourses } = trpc.courses.listAhaHubPrograms.useQuery();
  const { data: ahaEnrollments } = trpc.courses.getMyAhaEnrollments.useQuery(undefined, { enabled: !!user });

  const latestAhaByProgram = useMemo(() => {
    const m = new Map<string, (NonNullable<typeof ahaEnrollments>[number])>();
    for (const e of ahaEnrollments ?? []) {
      const pt = e.programType;
      const cur = m.get(pt);
      if (!cur || new Date(e.createdAt) > new Date(cur.createdAt)) m.set(pt, e);
    }
    return m;
  }, [ahaEnrollments]);

  const primaryAction = useMemo(() => {
    for (const pt of ["bls", "acls", "pals"] as const) {
      const enrol = latestAhaByProgram.get(pt);
      if (enrol && enrol.paymentStatus !== "completed") {
        return {
          label: `Pay now for ${pt.toUpperCase()}`,
          onClick: () => {
            track("provider_conversion", "aha_complete_payment_clicked", {
              programType: pt,
              enrollmentId: enrol.id,
              source: "aha_courses_primary",
            });
            setLocation(`/payment?enrollmentId=${enrol.id}&courseId=${pt}`);
          },
        };
      }
    }
    for (const pt of ["bls", "acls", "pals"] as const) {
      if (!latestAhaByProgram.get(pt)) {
        return {
          label: `Start ${pt.toUpperCase()} enrollment`,
          onClick: () => {
            track("enrollment_started", "aha_enrollment_started", {
              programType: pt,
              source: "aha_courses_primary",
            });
            setLocation(`/enroll?courseId=${pt}`);
          },
        };
      }
    }
    return null;
  }, [latestAhaByProgram, setLocation, track]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/home")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Hub
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BookOpen className="h-8 w-8" />
              AHA certification
            </h1>
            <p className="text-muted-foreground mt-2">BLS, ACLS, and PALS only. Fellowship micro-courses are managed in Fellowship.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(ahaCourses ?? []).map((course) => {
            const pt = course.programType;
            const programCopy = AHA_PROGRAM_COPY[pt as "bls" | "acls" | "pals"];
            const enrol = latestAhaByProgram.get(pt);
            const isEnrolled = !!enrol;
            const isPaid = enrol?.paymentStatus === "completed";
            const hours = Math.max(1, Math.round((course.duration ?? 360) / 60));
            return (
              <Card key={course.id} className="hover:border-primary/50 transition-colors flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-snug">{programCopy?.title ?? course.title}</CardTitle>
                    {isPaid && <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />}
                  </div>
                  <CardDescription>{hours} hours (typical)</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {programCopy?.description ?? (course.description || "Structured certification path with assessment.")}
                  </p>
                  {isPaid && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 text-center">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Ready to learn</p>
                    </div>
                  )}
                  {isEnrolled && !isPaid && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        track("provider_conversion", "aha_complete_payment_clicked", {
                          programType: pt,
                          enrollmentId: enrol?.id ?? null,
                          source: "aha_courses_page",
                        });
                        if (enrol?.id) {
                          setLocation(`/payment?enrollmentId=${enrol.id}&courseId=${pt}`);
                          return;
                        }
                        setLocation("/payment");
                      }}
                    >
                      Pay now
                    </Button>
                  )}
                  {isEnrolled && isPaid && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        track("provider_conversion", "aha_continue_learning_clicked", {
                          programType: pt,
                          enrollmentId: enrol?.id ?? null,
                          source: "aha_courses_page",
                        });
                        if (enrol?.id) {
                          const config = getAhaContinueRoute(pt as "bls" | "acls" | "pals", enrol.id);
                          setLocation(config.destination);
                          return;
                        }
                        setLocation("/home");
                      }}
                    >
                      {enrol?.id
                        ? getAhaContinueRoute(pt as "bls" | "acls" | "pals", enrol.id).ctaLabel
                        : "Open learner dashboard"}
                    </Button>
                  )}
                  {!isEnrolled && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        track("enrollment_started", "aha_enrollment_started", {
                          programType: pt,
                          source: "aha_courses_page",
                        });
                        setLocation(`/enroll?courseId=${pt}`);
                      }}
                    >
                      Start enrollment
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {primaryAction && (
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Primary next action</CardTitle>
              <CardDescription>One recommended step for your AHA certification path</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="cta" className="w-full" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </Button>
            </CardContent>
          </Card>
        )}

        {(!ahaCourses || ahaCourses.length === 0) && (
          <Card className="text-center p-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No AHA programs are available right now. Please try again shortly.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
