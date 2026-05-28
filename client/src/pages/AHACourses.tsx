import { useEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle2, ArrowLeft, XCircle, Clock, ClipboardCheck, CalendarPlus, Award } from "lucide-react";
import { useProviderConversionAnalytics } from "@/hooks/useProviderConversionAnalytics";
import { getAhaContinueRoute, type AhaProgramType } from "@/lib/providerCourseRoutes";
import { AHA_COURSE_ORDER } from "@/const/aha-course-metadata";
import { AhaHubCourseCard, AhaHubCourseCardSkeleton } from "@/components/AhaHubCourseCard";
import { toast } from "sonner";

const AHA_QUERY_STALE_MS = 5 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// Certification progress indicator
// Shows the two gates a learner must pass before the full AHA certificate is issued.
// A cognitive completion certificate is issued immediately after cognitive modules
// are done — this serves as a gatepass for the practical skills session.
// ─────────────────────────────────────────────────────────────────────────────
function CertProgressBar({
  cognitiveComplete,
  practicalSignedOff,
  certificateIssued,
}: {
  cognitiveComplete: boolean;
  practicalSignedOff: boolean;
  certificateIssued: boolean;
}) {
  if (certificateIssued) {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Full AHA certificate issued — valid for 2 years
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium">Certification path</p>
      <div className="space-y-1.5">
        {/* Gate 1: Cognitive */}
        <div className="flex items-center gap-2 text-xs">
          {cognitiveComplete ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          <span className={cognitiveComplete ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}>
            {cognitiveComplete ? "Cognitive modules complete — gatepass certificate issued" : "Complete all cognitive modules"}
          </span>
        </div>
        {/* Gate 2: Practical */}
        <div className="flex items-center gap-2 text-xs">
          {practicalSignedOff ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          ) : (
            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          )}
          <span className={practicalSignedOff ? "text-emerald-700 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
            {practicalSignedOff
              ? "Practical skills signed off"
              : "Practical skills — awaiting instructor sign-off"}
          </span>
        </div>
      </div>
      {cognitiveComplete && !practicalSignedOff && (
        <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed bg-blue-50 dark:bg-blue-950/30 rounded p-2 mt-1">
          Your cognitive gatepass certificate is ready. Present it at your hands-on session to complete practical sign-off.
        </p>
      )}
      {!cognitiveComplete && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          Complete all cognitive modules to receive your gatepass certificate for the hands-on practical session.
        </p>
      )}
    </div>
  );
}

export default function AHACourses() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { track } = useProviderConversionAnalytics("/aha-courses");

  useEffect(() => {
    if (!authLoading && !user) setLocation("/login");
  }, [authLoading, user, setLocation]);

  const {
    data: ahaCourses,
    isLoading: coursesLoading,
  } = trpc.courses.listAhaHubPrograms.useQuery(undefined, {
    staleTime: AHA_QUERY_STALE_MS,
  });
  const { data: ahaEnrollments } = trpc.courses.getMyAhaEnrollments.useQuery(undefined, {
    enabled: !!user,
    staleTime: AHA_QUERY_STALE_MS,
  });

  const hubCourseByProgram = useMemo(() => {
    const m = new Map<string, NonNullable<typeof ahaCourses>[number]>();
    for (const c of ahaCourses ?? []) {
      m.set(c.programType, c);
    }
    return m;
  }, [ahaCourses]);

  const openAhaPlayer = (pt: AhaProgramType, enrollmentId: number) => {
    const hubCourse = hubCourseByProgram.get(pt);
    if (!hubCourse?.id) {
      toast.error(`${pt.toUpperCase()} course content is not ready yet. Please refresh in a moment.`);
      return;
    }
    setLocation(getAhaContinueRoute(pt, enrollmentId, hubCourse.id).destination);
  };

  const latestAhaByProgram = useMemo(() => {
    const m = new Map<string, (NonNullable<typeof ahaEnrollments>[number])>();
    for (const e of ahaEnrollments ?? []) {
      const pt = e.programType;
      const cur = m.get(pt);
      if (!cur || new Date(e.createdAt) > new Date(cur.createdAt)) m.set(pt, e);
    }
    return m;
  }, [ahaEnrollments]);

  // Primary action: guide user to the next unenrolled course, or continue an in-progress one
  const primaryAction = useMemo(() => {
    // First: find a course that is enrolled but cognitive not yet complete
    for (const pt of AHA_COURSE_ORDER) {
      const enrol = latestAhaByProgram.get(pt);
      if (enrol && !(enrol as any)?.cognitiveModulesComplete) {
        return {
          label: `Continue ${pt.toUpperCase()} cognitive modules`,
          onClick: () => {
            track("provider_conversion", "aha_continue_learning_clicked", {
              programType: pt,
              enrollmentId: enrol.id,
              source: "aha_courses_primary",
            });
            openAhaPlayer(pt, enrol.id);
          },
        };
      }
    }
    // Second: find a course not yet enrolled
    for (const pt of AHA_COURSE_ORDER) {
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
  }, [latestAhaByProgram, setLocation, track, hubCourseByProgram]);

  const anyEnrolled = [...latestAhaByProgram.values()].length > 0;
  const anyCognitiveComplete = [...latestAhaByProgram.values()].some((e) => (e as any)?.cognitiveModulesComplete);

  if (authLoading || !user) {
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
              AHA Certification
            </h1>
            <p className="text-muted-foreground mt-2">BLS, ACLS, PALS, Heartsaver, and NRP. Fellowship micro-courses are managed in the Fellowship section.</p>
          </div>
        </div>

        {/* How certification works — shown when any course is enrolled */}
        {anyEnrolled && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-800 dark:text-blue-300">
                <ClipboardCheck className="h-4 w-4" />
                How your AHA certificate is issued
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-foreground/80 space-y-1">
              <p>Your full AHA certificate is released when <strong>both</strong> requirements below are met:</p>
              <ol className="list-decimal list-inside space-y-0.5 ml-2">
                <li>All cognitive modules completed and passed — you receive a <strong>gatepass certificate</strong> immediately.</li>
                <li>Practical skills signed off by your assigned instructor at a hands-on session.</li>
              </ol>
              <p className="text-muted-foreground pt-1">Full AHA certificates are valid for 2 years from the date of issuance.</p>
            </CardContent>
          </Card>
        )}

        {/* Cognitive gatepass certificate notice */}
        {anyCognitiveComplete && (
          <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <Award className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Cognitive gatepass certificate available</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You have completed the cognitive portion of one or more AHA courses. Download your gatepass certificate to present at your practical skills session.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400"
                onClick={() => setLocation("/certificates")}
              >
                View certificates
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {coursesLoading
            ? AHA_COURSE_ORDER.map((pt) => <AhaHubCourseCardSkeleton key={pt} />)
            : AHA_COURSE_ORDER.map((pt) => {
                const enrol = latestAhaByProgram.get(pt);
                const isEnrolled = !!enrol;
                const cognitiveComplete = (enrol as any)?.cognitiveModulesComplete ?? false;
                const practicalSignedOff = (enrol as any)?.practicalSkillsSignedOff ?? false;
                const certIssued = cognitiveComplete && practicalSignedOff;

                const titleAdornment = certIssued ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                ) : cognitiveComplete && !certIssued ? (
                  <Award className="h-5 w-5 text-blue-500 flex-shrink-0" />
                ) : null;

                return (
                  <AhaHubCourseCard
                    key={pt}
                    programType={pt}
                    titleAdornment={titleAdornment}
                    className={certIssued ? "border-emerald-300 dark:border-emerald-700" : undefined}
                    middle={
                      isEnrolled ? (
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                          <CertProgressBar
                            cognitiveComplete={cognitiveComplete}
                            practicalSignedOff={practicalSignedOff}
                            certificateIssued={certIssued}
                          />
                        </div>
                      ) : undefined
                    }
                    footer={
                      <div className="space-y-2">
                        {isEnrolled && !certIssued && (
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
                                openAhaPlayer(pt, enrol.id);
                                return;
                              }
                              setLocation("/home");
                            }}
                          >
                            {enrol?.id ? "Start course" : "Open learner dashboard"}
                          </Button>
                        )}
                        {isEnrolled && cognitiveComplete && !certIssued && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => setLocation("/certificates")}
                          >
                            Download gatepass certificate
                          </Button>
                        )}
                        {isEnrolled && certIssued && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400"
                            onClick={() => setLocation("/certificates")}
                          >
                            View full certificate
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
                      </div>
                    }
                  />
                );
              })}
        </div>

        {/* Primary next action */}
        {primaryAction && (
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Recommended next step</CardTitle>
              <CardDescription>Continue your AHA certification path</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="default" className="w-full" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Book a hands-on session CTA — shown when any cognitive modules are complete */}
        {anyCognitiveComplete && (
          <Card className="border-border">
            <CardContent className="pt-5 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">Ready to complete your practical skills?</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Find and register for an upcoming hands-on session near you. Bring your gatepass certificate. Your instructor will sign off your skills to release the full AHA certificate.
                </p>
              </div>
              <Button
                variant="outline"
                className="shrink-0 gap-2"
                onClick={() => setLocation("/aha-book-session")}
              >
                <CalendarPlus className="h-4 w-4" />
                Book a session
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
