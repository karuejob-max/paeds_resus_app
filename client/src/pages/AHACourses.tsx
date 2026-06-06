import { useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft, ClipboardCheck, CalendarPlus, Award } from "lucide-react";
import { useProviderConversionAnalytics } from "@/hooks/useProviderConversionAnalytics";
import { getAhaContinueRoute, type AhaProgramType } from "@/lib/providerCourseRoutes";
import { AHA_COURSE_ORDER } from "@/const/aha-course-metadata";
import { AHA_HUB_STALE_MS } from "@/const/aha-hub-query";
import { AhaHubProviderCourseCard } from "@/components/AhaHubProviderCourseCard";
import { AssessmentPolicyBanner } from "@/components/AssessmentPolicyBanner";
import { buildAhaHubEnrollmentMap } from "@/lib/pick-aha-hub-enrollment";
import { toast } from "sonner";

export default function AHACourses() {
  const [, setLocation] = useLocation();
  const { track } = useProviderConversionAnalytics("/aha-courses");

  const { data: dashboard, isLoading: dashboardLoading } = trpc.courses.getAhaHubDashboard.useQuery(
    undefined,
    {
      staleTime: AHA_HUB_STALE_MS,
      refetchOnWindowFocus: false,
    }
  );

  const ahaCourses = dashboard?.programs;
  const ahaEnrollments = dashboard?.enrollments;
  const enrollmentsPending = dashboardLoading && ahaEnrollments == null;

  const hubCourseIdByProgram = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of ahaCourses ?? []) {
      m.set(c.programType, c.id);
    }
    return m;
  }, [ahaCourses]);

  const hubCourseByProgram = useMemo(() => {
    const m = new Map<string, NonNullable<typeof ahaCourses>[number]>();
    for (const c of ahaCourses ?? []) {
      m.set(c.programType, c);
    }
    return m;
  }, [ahaCourses]);

  const enrollmentByProgram = useMemo(
    () => buildAhaHubEnrollmentMap(ahaEnrollments, hubCourseIdByProgram),
    [ahaEnrollments, hubCourseIdByProgram]
  );

  const openAhaPlayer = useCallback(
    (pt: AhaProgramType, enrollmentId: number) => {
      const hubCourse = hubCourseByProgram.get(pt);
      if (!hubCourse?.id) {
        toast.error(`${pt.toUpperCase()} course content is not ready yet. Please refresh in a moment.`);
        return;
      }
      setLocation(getAhaContinueRoute(pt, enrollmentId, hubCourse.id).destination);
    },
    [hubCourseByProgram, setLocation]
  );

  const handleEnroll = useCallback(
    (pt: AhaProgramType) => {
      track("enrollment_started", "aha_enrollment_started", {
        programType: pt,
        source: "aha_courses_page",
      });
      setLocation(`/enroll?courseId=${pt}`);
    },
    [setLocation, track]
  );

  const handleContinue = useCallback(
    (pt: AhaProgramType, enrollmentId: number) => {
      track("provider_conversion", "aha_continue_learning_clicked", {
        programType: pt,
        enrollmentId,
        source: "aha_courses_page",
      });
      openAhaPlayer(pt, enrollmentId);
    },
    [openAhaPlayer, track]
  );

  const goToCertificates = useCallback(() => setLocation("/certificates"), [setLocation]);

  const primaryAction = useMemo(() => {
    if (enrollmentsPending) return null;
    for (const pt of AHA_COURSE_ORDER) {
      const enrol = enrollmentByProgram.get(pt);
      if (enrol && !enrol.cognitiveModulesComplete) {
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
    for (const pt of AHA_COURSE_ORDER) {
      if (!enrollmentByProgram.get(pt)) {
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
  }, [enrollmentByProgram, enrollmentsPending, openAhaPlayer, setLocation, track]);

  const anyEnrolled = !enrollmentsPending && enrollmentByProgram.size > 0;
  const anyCognitiveComplete =
    !enrollmentsPending &&
    [...enrollmentByProgram.values()].some((e) => e.cognitiveModulesComplete);

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
            <p className="text-muted-foreground mt-2">
              BLS, ACLS, PALS, Heartsaver, and NRP. Fellowship micro-courses are managed in the Fellowship section.
            </p>
          </div>
        </div>

        <AssessmentPolicyBanner track="aha" />

        {anyEnrolled && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-800 dark:text-blue-300">
                <ClipboardCheck className="h-4 w-4" />
                How your AHA certificate is issued
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-foreground/80 space-y-1">
              <p>
                Your full AHA certificate is released when <strong>both</strong> requirements below are met:
              </p>
              <ol className="list-decimal list-inside space-y-0.5 ml-2">
                <li>
                  All cognitive modules completed and passed — you receive a <strong>gatepass certificate</strong>{" "}
                  immediately.
                </li>
                <li>Practical skills signed off by your assigned instructor at a hands-on session.</li>
              </ol>
              <p className="text-muted-foreground pt-1">
                Full AHA certificates are valid for 2 years from the date of issuance.
              </p>
            </CardContent>
          </Card>
        )}

        {anyCognitiveComplete && (
          <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <Award className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  Cognitive gatepass certificate available
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You have completed the cognitive portion of one or more AHA courses. Download your gatepass
                  certificate to present at your practical skills session.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400"
                onClick={goToCertificates}
              >
                View certificates
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {AHA_COURSE_ORDER.map((pt) => (
            <AhaHubProviderCourseCard
              key={pt}
              programType={pt}
              enrollment={enrollmentByProgram.get(pt)}
              enrollmentPending={enrollmentsPending}
              onContinue={handleContinue}
              onEnroll={handleEnroll}
              onViewCertificates={goToCertificates}
            />
          ))}
        </div>

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

        {anyCognitiveComplete && (
          <Card className="border-border">
            <CardContent className="pt-5 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">Ready to complete your practical skills?</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Find and register for an upcoming hands-on session near you. Bring your gatepass certificate. Your
                  instructor will sign off your skills to release the full AHA certificate.
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
