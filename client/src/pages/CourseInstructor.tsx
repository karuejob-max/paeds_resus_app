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

/** Learning path for `programType: instructor` — Paeds Resus Instructor Course. */
export default function CourseInstructor() {
  const { isAuthenticated } = useAuth();
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const enrollmentIdParam = params.get("enrollmentId");
  const parsed = enrollmentIdParam ? parseInt(enrollmentIdParam, 10) : NaN;
  const enrollmentIdFromUrl = Number.isFinite(parsed) ? parsed : undefined;

  const { data: rows } = trpc.enrollment.getByUserId.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const instructorEnrollmentId = useMemo(() => {
    if (enrollmentIdFromUrl !== undefined) return enrollmentIdFromUrl;
    const row = rows?.filter((e) => e.programType === "instructor").sort((a, b) => b.id - a.id)[0];
    return row?.id;
  }, [rows, enrollmentIdFromUrl]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-brand-surface to-background">
        <Card className="max-w-md w-full border-border">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">Sign in to access the Instructor Course.</p>
            <a href={getLoginUrl()}>
              <Button className="w-full" variant="cta">
                Sign in
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (instructorEnrollmentId === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-surface to-background py-10 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                No enrollment found
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Enroll in the <strong>Paeds Resus Instructor Course</strong> first, complete payment, then return here.
                You can add{" "}
                <code className="text-xs bg-muted px-1 rounded">?enrollmentId=</code> to the URL after checkout.
              </p>
              <Link href="/enroll">
                <Button className="w-full" variant="cta">
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
    <div className="min-h-screen bg-gradient-to-br from-brand-surface to-background py-8 px-4">
      <div className="max-w-6xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/home">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Button>
        </Link>
        <p className="text-sm text-muted-foreground">
          Enrollment #{instructorEnrollmentId} · Complete modules, then pay — your certificate and instructor number
          unlock after you pass all assessments.
        </p>
      </div>
      <LearningPath enrollmentId={instructorEnrollmentId} programType="instructor" />
    </div>
  );
}
