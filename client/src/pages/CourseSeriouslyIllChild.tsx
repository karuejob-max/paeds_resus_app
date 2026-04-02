import { useMemo } from "react";
import { useSearch } from "wouter";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LearningPath } from "@/components/LearningPath";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertCircle, ArrowLeft } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600 text-sm">Sign in to access your course.</p>
            <a href={getLoginUrl()}>
              <Button className="w-full">Sign in</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (dataPending) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <p className="text-slate-600 text-sm">Loading your course…</p>
      </div>
    );
  }

  if (palsEnrollmentId === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                No enrollment found
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600 text-sm">
                Enroll in <strong>The systematic approach to a seriously ill child</strong> first, complete
                payment, then return here. You can add{" "}
                <code className="text-xs bg-slate-100 px-1 rounded">?enrollmentId=</code> to the URL after checkout.
              </p>
              <Link href="/enroll">
                <Button className="w-full">Go to enroll</Button>
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
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/learner-dashboard">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Button>
        </Link>
        <p className="text-sm text-slate-500">
          Enrollment #{palsEnrollmentId} · After payment, your certificate appears on the learner dashboard.
        </p>
      </div>
      <LearningPath
        enrollmentId={palsEnrollmentId}
        programType="pals"
        courseId={seriouslyIllCourseId ?? null}
      />
    </div>
  );
}
