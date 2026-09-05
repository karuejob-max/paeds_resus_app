import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getProviderCourseDestination } from "@/lib/providerCourseRoutes";
import { ProgramJourneyCard } from "@/components/ProgramJourneyCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Award, BookOpen, CheckCircle2, Clock3, GraduationCap, Loader2 } from "lucide-react";

export default function ProviderLearn() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const fellowshipQuery = trpc.fellowship.getProgress.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: 1,
  });
  const microEnrollmentsQuery = trpc.courses.getUserEnrollments.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: 1,
  });
  const ahaEnrollmentsQuery = trpc.courses.getMyAhaEnrollments.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: 1,
  });
  const nerpEnrollmentQuery = trpc.nerp.getMyEnrollment.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: 1,
  });
  const { data: nerpJourney } = trpc.nerp.getJourneyStatus.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 1,
  });
  const ierpEnrollmentQuery = trpc.ierp.getMyEnrollment.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 1,
  });
  const ierpSummaryQuery = trpc.ierp.getSummary.useQuery(undefined, {
    enabled: isAuthenticated && Boolean(ierpEnrollmentQuery.data),
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 1,
  });

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading learning workspace…
      </div>
    );
  }

  const fellowship = fellowshipQuery.data;
  const microEnrollments = microEnrollmentsQuery.data ?? [];
  const ahaEnrollments = ahaEnrollmentsQuery.data ?? [];
  const nerpEnrollment = nerpEnrollmentQuery.data;
  const ierpSummary = ierpSummaryQuery.data;
  const ierpBlsEnrollment = ierpSummary?.aha.find((entry) => entry.programType === "bls");
  const ierpCoursePath = ierpBlsEnrollment
    ? `${getProviderCourseDestination("bls", ierpBlsEnrollment.id)}&pathway=ierp`
    : null;
  const verifications = (nerpEnrollment?.verifications ?? []) as Array<{
    decision: string | null;
    phase: string | null;
  }>;
  const verifiedExternalPhases = new Set(
    verifications
      .filter((verification) => verification.decision === "verified")
      .map((verification) => verification.phase)
  );
  const nerpPathwayComplete =
    nerpEnrollment?.offer?.status === "completed" ||
    (verifiedExternalPhases.has("phase_2") && verifiedExternalPhases.has("phase_3"));
  const showNerpOffer = !nerpEnrollmentQuery.isLoading && !nerpPathwayComplete;
  const inProgressMicro = microEnrollments.find((enrollment) => enrollment.enrollmentStatus === "active" && Number(enrollment.progressPercentage ?? 0) < 100);
  const inProgressAha = ahaEnrollments.find((enrollment) => Number(enrollment.progressPercentage ?? 0) < 100 || !enrollment.practicalSkillsSignedOff);
  const coursesCompleted = fellowship?.coursesPillar?.completed ?? microEnrollments.filter((enrollment) => enrollment.enrollmentStatus === "completed").length;
  const coursesRequired = fellowship?.coursesPillar?.required ?? 27;
  const fellowshipPercentage = fellowship?.coursesPillar?.percentage ?? Math.round((coursesCompleted / Math.max(coursesRequired, 1)) * 100);

  const nextLearning = inProgressMicro
    ? {
        title: inProgressMicro.course?.title ?? "Continue your Fellowship course",
        detail: `${Math.round(Number(inProgressMicro.progressPercentage ?? 0))}% complete`,
        action: "Continue course",
        destination: getProviderCourseDestination(inProgressMicro.course?.courseId ?? "", inProgressMicro.id, "/fellowship"),
      }
    : inProgressAha
      ? {
          title: inProgressAha.courseTitle ?? `${inProgressAha.programType.toUpperCase()} training`,
          detail: `${Math.round(Number(inProgressAha.progressPercentage ?? 0))}% cognitive progress${inProgressAha.practicalSkillsSignedOff ? "" : " · practical sign-off pending"}`,
          action: "Continue AHA training",
          destination: getProviderCourseDestination(inProgressAha.programType, inProgressAha.id, "/aha-courses", inProgressAha.courseId ?? undefined),
        }
      : null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-5 sm:py-7">
        <div className="flex items-start gap-3">
          <Button type="button" variant="ghost" size="icon" className="mt-0.5 shrink-0" aria-label="Back to Today" onClick={() => setLocation("/home")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Individual Platform</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">Learn</h1>
            <p className="mt-1 text-sm text-slate-500">Continue the learning path that matters to you now.</p>
          </div>
        </div>

        <Card className="border-violet-200 bg-violet-50/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-violet-950"><GraduationCap className="h-5 w-5 text-violet-700" />Your next learning action</CardTitle>
            <CardDescription className="text-violet-900/75">Fellowship and AHA certification are separate learning tracks. Choose the one you are currently pursuing.</CardDescription>
          </CardHeader>
          <CardContent>
            {nextLearning ? (
              <div className="rounded-lg border border-violet-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{nextLearning.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{nextLearning.detail}</p>
                  </div>
                  <Clock3 className="h-5 w-5 shrink-0 text-violet-700" />
                </div>
                <Button type="button" className="mt-4 bg-violet-700 text-white hover:bg-violet-800" onClick={() => setLocation(nextLearning.destination)}>
                  {nextLearning.action} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <CheckCircle2 className="mb-2 h-5 w-5" />
                No learning task is currently in progress. Browse Fellowship or AHA courses when ready.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-5 w-5 text-orange-700" />Life Support Training</CardTitle>
            <CardDescription>Our Financial Strategy 1: AHA certification pathways for providers and interns, separate from the Fellowship.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {nerpJourney ? (
              <div className="sm:col-span-2">
                <ProgramJourneyCard title={nerpJourney.programName} subtitle="Programme progress is an orientation aid, not a clinical competence score." percentComplete={nerpJourney.percentComplete} phases={nerpJourney.phases} nextAction={nerpJourney.nextAction} compact />
              </div>
            ) : showNerpOffer ? (
              <div className="rounded-lg border border-orange-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-900">Nurse Emergency Readiness Program (NERP)</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">Lipa Mdogo Mdogo ACLS: KES 2,500 per month for six payments, with Paeds Resus BLS included.</p>
                <Button type="button" variant="link" className="mt-1 h-auto px-0 text-xs text-orange-800" onClick={() => setLocation("/programs/nerp-acls")}>
                  View NERP <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            ) : null}
            <div className="rounded-lg border-2 border-teal-300 bg-teal-50/50 p-3 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Intern Emergency Readiness Program (IERP)</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">BLS refresh first, then ACLS. Your direct coursework action appears here after registration.</p>
              {ierpEnrollmentQuery.data && ierpCoursePath && !ierpSummary?.payment.cognitiveAccessLocked ? (
                <Button type="button" className="mt-3 bg-teal-700 text-white hover:bg-teal-800" onClick={() => setLocation(ierpCoursePath)}>
                  Start BLS coursework <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              ) : ierpEnrollmentQuery.data && ierpSummary?.payment.cognitiveAccessLocked ? (
                <Button type="button" variant="outline" className="mt-3 border-teal-300 text-teal-900" onClick={() => setLocation("/programs/ierp/enroll")}>
                  Open IERP payment <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button type="button" variant="link" className="mt-1 h-auto px-0 text-xs text-teal-800" onClick={() => setLocation("/programs/ierp")}>
                  View IERP and register <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-violet-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-5 w-5 text-violet-700" />Paeds Resus Fellowship</CardTitle>
              <CardDescription>Three pillars: micro-courses, ResusGPS practice, and Care Signal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm"><span>Course pillar</span><Badge variant="outline">{coursesCompleted}/{coursesRequired}</Badge></div>
              <div className="h-2 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-violet-700" style={{ width: `${Math.min(Math.max(fellowshipPercentage, 0), 100)}%` }} /></div>
              <Button type="button" variant="outline" className="w-full justify-between" onClick={() => setLocation("/fellowship")}>Open Fellowship <ArrowRight className="h-4 w-4" /></Button>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-5 w-5 text-orange-700" />AHA life support training</CardTitle>
              <CardDescription>BLS, ACLS, PALS, NRP, and instructor training follow their own certification path.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {ahaEnrollments.length > 0 ? ahaEnrollments.slice(0, 4).map((enrollment) => (
                  <Badge key={enrollment.id} variant="outline" className="border-orange-200 text-orange-800">{enrollment.programType.toUpperCase()}</Badge>
                )) : <span className="text-sm text-slate-500">No AHA enrollment yet.</span>}
              </div>
              <Button type="button" variant="outline" className="w-full justify-between" onClick={() => setLocation("/aha-courses")}>Open AHA courses <ArrowRight className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Award className="h-5 w-5 text-emerald-700" />Keep learning connected to practice</CardTitle><CardDescription>Use ResusGPS for bedside guidance, Care Signal for provider quality-improvement reporting, and Code Signal for adult and whole-hospital events. Neither reporting surface is the same as a certificate.</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setLocation("/resus")}>Open ResusGPS</Button>
            <Button type="button" variant="outline" onClick={() => setLocation("/care-signal")}>Report to Care Signal</Button>
            <Button type="button" variant="outline" onClick={() => setLocation("/code-signal")}>Open Code Signal</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
