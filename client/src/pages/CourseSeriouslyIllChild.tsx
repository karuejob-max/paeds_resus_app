import { useMemo } from "react";
import { useSearch } from "wouter";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LearningPath } from "@/components/LearningPath";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertCircle, ArrowLeft, BookOpen } from "lucide-react";
import { getLoginUrl } from "@/const";

/**
 * Learning path for PALS program: "The systematic approach to a seriously ill child"
 * (pricing + enroll use `pals` program type). Pass ?enrollmentId= from Payment after checkout.
 */
export default function CourseSeriouslyIllChild() {
  const { isAuthenticated } = useAuth();
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const enrollmentIdParam = params.get("enrollmentId");
  const parsed = enrollmentIdParam ? parseInt(enrollmentIdParam, 10) : NaN;
  const enrollmentIdFromUrl = Number.isFinite(parsed) ? parsed : undefined;

  const { data: rows, isLoading: enrollmentsLoading } = trpc.enrollment.getByUserId.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: palsCatalog, isLoading: catalogLoading } = trpc.learning.getCourses.useQuery({ programType: "pals" });
  const seriouslyIllCourseId = useMemo(() => {
    return palsCatalog?.find((c: { title?: string }) => /seriously ill/i.test(c.title ?? ""))?.id as
      | number
      | undefined;
  }, [palsCatalog]);

  const palsEnrollmentId = useMemo(() => {
    if (enrollmentIdFromUrl !== undefined) return enrollmentIdFromUrl;
    if (!rows || seriouslyIllCourseId == null) return undefined;
    const pals = rows.filter((e) => e.programType === "pals").sort((a, b) => b.id - a.id);
    const match =
      pals.find((e) => e.courseId === seriouslyIllCourseId) ?? pals.find((e) => e.courseId == null);
    return match?.id;
  }, [rows, enrollmentIdFromUrl, seriouslyIllCourseId]);

  const dataPending = enrollmentsLoading || catalogLoading;

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

  if (dataPending) {
    return (
      <div className="min-h-screen bg-brand-surface flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading your course…</p>
        </div>
      </div>
    );
  }

  if (palsEnrollmentId === undefined) {
    return (
      <div className="min-h-screen bg-brand-surface py-10 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <AlertCircle className="w-6 h-6 text-[var(--brand-orange)]" />
                No enrollment found
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Enrol in <strong>The systematic approach to a seriously ill child</strong> first, complete payment,
                then return here. You can add{" "}
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">?enrollmentId=</code> to the URL after
                checkout.
              </p>
              <Link href="/enroll#course-pals">
                <Button variant="cta" className="w-full">
                  Go to enroll
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
        <Link href="/home">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Button>
        </Link>
        <p className="text-sm text-muted-foreground max-w-md text-right leading-relaxed">
          Enrollment #{palsEnrollmentId} · After payment, your certificate appears on the learner dashboard.
        </p>
      </div>

      <div className="max-w-4xl mx-auto mb-8 rounded-2xl border border-border bg-gradient-to-br from-card via-card to-brand-surface/50 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <BookOpen className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">PALS micro-course</p>
            <h1 className="mt-1 text-xl font-bold text-foreground md:text-2xl">Seriously ill child</h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              A systematic approach to assessment and stabilisation. Work through modules at your pace, then complete
              each quiz to confirm understanding.
            </p>
          </div>
        </div>
      </div>

      <LearningPath
        enrollmentId={palsEnrollmentId}
        programType="pals"
        courseId={seriouslyIllCourseId ?? null}
      />
    </div>
  );
}
