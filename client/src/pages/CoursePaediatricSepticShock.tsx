import { useMemo } from "react";
import { useSearch } from "wouter";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LearningPath } from "@/components/LearningPath";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowLeft, BookOpen, Compass, Heart } from "lucide-react";
import { getLoginUrl } from "@/const";

/**
 * PALS micro-course: Paediatric septic shock (pricing SKU pals_septic).
 */
export default function CoursePaediatricSepticShock() {
  const { isAuthenticated } = useAuth();
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const enrollmentIdParam = params.get("enrollmentId");
  const parsed = enrollmentIdParam ? parseInt(enrollmentIdParam, 10) : NaN;
  const enrollmentIdFromUrl = Number.isFinite(parsed) ? parsed : undefined;

  const { data: rows, isLoading: enrollmentsLoading } = trpc.enrollment.getByUserId.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: meta, isLoading: metaLoading } = trpc.learning.getSepticShockCourseMeta.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const septicEnrollmentId = useMemo(() => {
    if (enrollmentIdFromUrl !== undefined) return enrollmentIdFromUrl;
    if (!rows || meta?.courseId == null) return undefined;
    const match = rows
      .filter((e) => e.programType === "pals" && e.courseId === meta.courseId)
      .sort((a, b) => b.id - a.id)[0];
    return match?.id;
  }, [rows, enrollmentIdFromUrl, meta?.courseId]);

  const dataPending = enrollmentsLoading || metaLoading;

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

  if (septicEnrollmentId === undefined) {
    return (
      <div className="min-h-screen bg-brand-surface py-10 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Heart className="w-6 h-6 text-[var(--brand-orange)]" />
                Paediatric septic shock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Enrol in <strong>Paediatric septic shock</strong> on the enroll page, complete M-Pesa payment, then
                return here. After payment you can also open this page from your learner dashboard.
              </p>
              <Link href="/enroll#course-septic-shock">
                <Button variant="cta" className="w-full">
                  Go to enroll
                </Button>
              </Link>
              <Link href="/learner-dashboard">
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
        <Link href="/learner-dashboard">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Button>
        </Link>
        <p className="text-sm text-muted-foreground max-w-md text-right leading-relaxed">
          Enrollment #{septicEnrollmentId} · Evidence-informed training; follow your facility&apos;s protocols. Use{" "}
          <Link href="/resus" className="text-primary font-medium underline-offset-2 hover:underline">
            ResusGPS
          </Link>{" "}
          at the bedside for live support.
        </p>
      </div>

      <div className="max-w-4xl mx-auto mb-8 rounded-2xl border border-border bg-gradient-to-br from-card via-card to-brand-surface/50 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-orange)]/12 text-[var(--brand-orange)]">
            <Heart className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">PALS micro-course</p>
              <h1 className="mt-1 text-xl font-bold text-foreground md:text-2xl">Paediatric septic shock</h1>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Built around early recognition, fluids and antimicrobials, reassessment, and escalation—aligned with
              international sepsis care themes and low-resource quality improvement steps.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-2.5 py-1">
                <BookOpen className="h-3.5 w-3.5" />
                Modules + quizzes
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mb-8">
        <Card className="border-border shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-border bg-gradient-to-r from-primary/8 to-brand-surface/40 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <Compass className="h-5 w-5" />
              </span>
              ResusGPS and this course
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              After you work through these modules, you will get more from{" "}
              <Link href="/resus" className="text-primary font-medium underline-offset-2 hover:underline">
                ResusGPS
              </Link>
              : the pathways for shock, fluids, and escalation mirror the same ideas you practise here. Open ResusGPS
              when you are with a sick child, walk the questions step by step, and cross-check against your facility
              policy.
            </p>
            <p>
              If you have not taken this course yet, ResusGPS is still useful—but completing this course first helps
              you interpret the prompts and know when to escalate or refer.
            </p>
            <Link href="/resus">
              <Button variant="cta" size="sm" className="rounded-xl mt-1">
                Open ResusGPS
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <LearningPath
        enrollmentId={septicEnrollmentId}
        programType="pals"
        courseId={meta?.courseId ?? null}
      />
    </div>
  );
}
