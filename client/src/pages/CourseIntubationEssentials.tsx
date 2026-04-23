import { useMemo } from "react";
import { useSearch } from "wouter";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LearningPath } from "@/components/LearningPath";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowLeft, AirVent, BookOpen } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function CourseIntubationEssentials() {
  const { isAuthenticated } = useAuth();
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const enrollmentIdParam = params.get("enrollmentId");
  const parsed = enrollmentIdParam ? parseInt(enrollmentIdParam, 10) : NaN;
  const enrollmentIdFromUrl = Number.isFinite(parsed) ? parsed : undefined;

  const { data: rows, isLoading: enrollmentsLoading } = trpc.enrollment.getByUserId.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: meta, isLoading: metaLoading } = trpc.learning.getIntubationSampleCourseMeta.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const intubationEnrollmentId = useMemo(() => {
    if (!rows || meta?.courseId == null) return undefined;
    const matchedFromUrl =
      enrollmentIdFromUrl !== undefined
        ? rows.find((e) => e.id === enrollmentIdFromUrl && e.courseId === meta.courseId)
        : undefined;
    if (matchedFromUrl) return matchedFromUrl.id;
    const latest = rows
      .filter((e) => e.programType === "fellowship" && e.courseId === meta.courseId)
      .sort((a, b) => b.id - a.id)[0];
    return latest?.id;
  }, [rows, enrollmentIdFromUrl, meta?.courseId]);

  const loading = enrollmentsLoading || metaLoading;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-brand-surface">
        <Card className="max-w-md w-full border-border shadow-sm">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">Sign in to access your course.</p>
            <a href={getLoginUrl()}>
              <Button variant="cta" className="w-full">
                Sign in
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-surface flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading your course...</p>
        </div>
      </div>
    );
  }

  if (intubationEnrollmentId === undefined) {
    return (
      <div className="min-h-screen bg-brand-surface py-10 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <AirVent className="w-6 h-6 text-[var(--brand-orange)]" />
                Paediatric Intubation Essentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Enrol in <strong>Paediatric Intubation Essentials</strong> from the Fellowship dashboard, complete payment,
                then open the course from the same dashboard.
              </p>
              <Link href="/fellowship">
                <Button variant="cta" className="w-full">
                  Open Fellowship
                </Button>
              </Link>
              <Link href="/home">
                <Button variant="outline" className="w-full gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Learner dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-surface py-8 px-4">
      <div className="max-w-4xl mx-auto mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link href="/fellowship">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
            <ArrowLeft className="w-4 h-4" />
            Fellowship
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto mb-8 rounded-2xl border border-border bg-gradient-to-br from-card via-card to-brand-surface/50 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-orange)]/12 text-[var(--brand-orange)]">
            <AirVent className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Sample micro-course</p>
              <h1 className="mt-1 text-xl font-bold text-foreground md:text-2xl">
                Paediatric Intubation Essentials
              </h1>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              End-to-end sample flow: enrollment, payment, learning module completion, and certificate eligibility.
              Always follow facility policy and supervision rules for airway procedures.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-2.5 py-1">
                <BookOpen className="h-3.5 w-3.5" />
                Modules + quiz
              </span>
            </div>
          </div>
        </div>
      </div>

      <LearningPath enrollmentId={intubationEnrollmentId} programType="fellowship" courseId={meta?.courseId ?? null} />
    </div>
  );
}
