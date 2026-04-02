import { useMemo } from "react";
import { useSearch } from "wouter";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LearningPath } from "@/components/LearningPath";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowLeft, Heart } from "lucide-react";
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
        <p className="text-muted-foreground text-sm">Loading your course…</p>
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
      <div className="max-w-6xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/learner-dashboard">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Button>
        </Link>
        <p className="text-sm text-muted-foreground max-w-xl text-right">
          Enrollment #{septicEnrollmentId} · Evidence-informed training; always follow your facility&apos;s protocols.
          Open <Link href="/resus" className="text-primary font-medium underline-offset-2 hover:underline">ResusGPS</Link>{" "}
          at the bedside when you need step-by-step support.
        </p>
      </div>
      <div className="max-w-6xl mx-auto mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-sm">
        <span className="font-medium text-foreground">Why this course exists: </span>
        Every hour, children die from sepsis that was recognised too late or treated without a shared plan. This module
        is built to align with international sepsis care principles (including Surviving Sepsis Campaign updates and
        low-resource &quot;Ten Steps&quot; themes)—so you can act early, reassess often, and escalate clearly.
      </div>
      <LearningPath
        enrollmentId={septicEnrollmentId}
        programType="pals"
        courseId={meta?.courseId ?? null}
      />
    </div>
  );
}
