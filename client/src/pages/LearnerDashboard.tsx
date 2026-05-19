import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Award, BookOpen, Download, FileText, GraduationCap, Loader2, Users } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CertificateDownloadFeedbackDialog } from "@/components/CertificateDownloadFeedbackDialog";
import { useProviderConversionAnalytics } from "@/hooks/useProviderConversionAnalytics";
import { getProviderCourseDestination } from "@/lib/providerCourseRoutes";

function daysUntilExpiry(expiryDate: string | Date | null | undefined): number | null {
  if (!expiryDate) return null;
  const d = new Date(expiryDate);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

export default function LearnerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { role: selectedRole } = useUserRole();
  const [, navigate] = useLocation();
  const { data: certData } = trpc.certificates.getMyCertificates.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: parentStats, isLoading: parentStatsLoading } = trpc.parentSafeTruth.getSafeTruthStats.useQuery(
    undefined,
    { enabled: isAuthenticated && selectedRole === "parent" }
  );
  const utils = trpc.useUtils();
  const { track } = useProviderConversionAnalytics("/learner-dashboard");
  const downloadCert = trpc.certificates.download.useMutation();
  const renewalReminderEmail = trpc.certificates.requestRenewalReminderEmail.useMutation({
    onSuccess: (r) => {
      if (r.success) toast.success("Renewal reminder sent to your email.");
      else toast.error(r.error ?? "Could not send email.");
    },
    onError: (e) => toast.error(e.message || "Could not send email."),
  });
  const myCertificates = certData?.success ? certData.certificates ?? [] : [];

  const { data: myEnrollments } = trpc.enrollment.getByUserId.useQuery(undefined, {
    enabled: isAuthenticated && selectedRole === "provider",
  });
  const { data: instructorStatus } = trpc.instructor.getStatus.useQuery(undefined, {
    enabled: isAuthenticated && selectedRole === "provider",
  });
  const { data: myMicroEnrollments } = trpc.courses.getUserEnrollments.useQuery(undefined, {
    enabled: isAuthenticated && selectedRole === "provider",
  });
  const { data: lifecycleNudges } = trpc.notifications.getLifecycleNudges.useQuery(undefined, {
    enabled: isAuthenticated && selectedRole === "provider",
    staleTime: 60_000,
  });
  const dispatchLifecycleNudges = trpc.notifications.dispatchLifecycleNudges.useMutation();
  const [lifecycleDispatchTriggered, setLifecycleDispatchTriggered] = useState(false);
  const { data: microCatalog } = trpc.courses.listAll.useQuery(undefined, {
    enabled: isAuthenticated && selectedRole === "provider",
  });
  const instructorEnrollment = useMemo(() => {
    const rows = myEnrollments ?? [];
    return rows.filter((e) => e.programType === "instructor").sort((a, b) => b.id - a.id)[0];
  }, [myEnrollments]);
  const nextPurchaseRecommendation = useMemo(() => {
    const enrolledCourseIds = new Set(
      (myMicroEnrollments ?? [])
        .map((row) => row?.course?.courseId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    );
    const notYetEnrolled = (microCatalog ?? []).filter((course) => !enrolledCourseIds.has(course.courseId));
    if (!notYetEnrolled.length) return null;
    const ranked = [...notYetEnrolled].sort((a, b) => {
      const byLevel = a.level === b.level ? 0 : a.level === "foundational" ? -1 : 1;
      if (byLevel !== 0) return byLevel;
      return a.title.localeCompare(b.title);
    });
    return ranked[0];
  }, [microCatalog, myMicroEnrollments]);
  // Payment gate removed: count all enrollments regardless of payment status
  const completedOrPaidCount = useMemo(
    () => (myMicroEnrollments ?? []).length,
    [myMicroEnrollments]
  );
  const getContinuePathForEnrollment = (courseId: string | null | undefined, enrollmentId: number) => {
    return getProviderCourseDestination(courseId, enrollmentId, "/fellowship");
  };
  const lifecycleResumeNudge = useMemo(() => {
    const rows = [...(myMicroEnrollments ?? [])].sort((a, b) => b.id - a.id);
    // Payment gate removed: show resume nudge for all enrolled users
    const startedNotCompleted = rows.find(
      (row) =>
        row.enrollmentStatus !== "completed" &&
        Number(row.progressPercentage ?? 0) > 0 &&
        Number(row.progressPercentage ?? 0) < 100
    );
    if (startedNotCompleted) {
      return {
        type: "started_not_completed" as const,
        enrollmentId: startedNotCompleted.id,
        courseId: startedNotCompleted.course?.courseId,
        courseTitle: startedNotCompleted.course?.title ?? "your current course",
        cta: "Resume course now",
      };
    }
    // Payment gate removed: show start nudge for all enrolled users
    const paidNotStarted = rows.find(
      (row) =>
        row.enrollmentStatus !== "completed" &&
        Number(row.progressPercentage ?? 0) <= 0
    );
    if (paidNotStarted) {
      return {
        type: "paid_not_started" as const,
        enrollmentId: paidNotStarted.id,
        courseId: paidNotStarted.course?.courseId,
        courseTitle: paidNotStarted.course?.title ?? "your paid course",
        cta: "Start course now",
      };
    }
    return null;
  }, [myMicroEnrollments]);
  const timedLifecycleNudge = useMemo(() => {
    const nudgeRows = lifecycleNudges?.nudges ?? [];
    if (!nudgeRows.length) return null;
    const sorted = [...nudgeRows].sort((a, b) => b.cadenceHours - a.cadenceHours);
    return sorted[0];
  }, [lifecycleNudges?.nudges]);
  useEffect(() => {
    if (!isAuthenticated || selectedRole !== "provider") return;
    if (lifecycleDispatchTriggered) return;
    const due = lifecycleNudges?.nudges ?? [];
    if (!due.length) return;
    setLifecycleDispatchTriggered(true);
    dispatchLifecycleNudges.mutate(
      { limit: 5 },
      {
        onSuccess: (res) => {
          if (res.sent > 0) {
            track("provider_conversion", "lifecycle_timed_nudge_dispatch_client", {
              sent: res.sent,
              skipped: res.skipped,
              processed: res.processed,
              source: "learner_dashboard_provider",
            });
          }
        },
      }
    );
  }, [
    isAuthenticated,
    selectedRole,
    lifecycleDispatchTriggered,
    lifecycleNudges?.nudges,
    dispatchLifecycleNudges,
    track,
  ]);

  const { data: myInstitution } = trpc.institution.getMyInstitution.useQuery(undefined, {
    enabled: isAuthenticated && selectedRole === "institution",
  });
  const institutionId = myInstitution?.institution?.id;
  const { data: instStats, isLoading: instStatsLoading } = trpc.institution.getStats.useQuery(
    { institutionId: institutionId! },
    { enabled: !!institutionId && selectedRole === "institution" }
  );

  const renewalAttention = myCertificates.filter((c) => {
    const d = daysUntilExpiry(c.expiryDate);
    return d !== null && d <= 90;
  });

  const [downloadingCertificateId, setDownloadingCertificateId] = useState<number | null>(null);
  const [feedbackDialog, setFeedbackDialog] = useState<{
    certificateId: number;
    certificateNumber: string;
    courseLabel: string;
  } | null>(null);

  useEffect(() => {
    const id = window.location.hash?.replace(/^#/, "").trim();
    if (id === "my-certificates") {
      requestAnimationFrame(() =>
        document.getElementById("my-certificates")?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    }
  }, []);

  const savePdfFromResult = (result: {
    success?: boolean;
    pdfBase64?: string;
    filename?: string | null;
    error?: string;
  }) => {
    if (!result.success || !result.pdfBase64) {
      const msg =
        result && typeof result === "object" && typeof result.error === "string"
          ? result.error
          : "Could not generate your certificate PDF.";
      toast.error(msg);
      return;
    }
    try {
      const bin = atob(result.pdfBase64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const blob = new Blob([arr], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename ?? "certificate.pdf";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Your browser could not save the PDF. Try another browser or disable strict download blocking.");
    }
  };

  const runCertificateDownload = (certificateNumber: string, certificateId?: number) => {
    setDownloadingCertificateId(
      certificateId ?? myCertificates.find((c) => c.certificateNumber === certificateNumber)?.id ?? null
    );
    downloadCert.mutate(
      { certificateNumber },
      {
        onSettled: () => setDownloadingCertificateId(null),
        onError: (err) => {
          toast.error(err.message || "Download failed. Try again or contact support.");
        },
        onSuccess: (result) => {
          if (!result.success) {
            if (result.error === "feedback_required" && "certificateId" in result && typeof result.certificateId === "number") {
              const cert = myCertificates.find((x) => x.certificateNumber === certificateNumber);
              const label = cert?.courseTitle?.trim() || cert?.programType?.toUpperCase() || "this course";
              setFeedbackDialog({
                certificateId: result.certificateId,
                certificateNumber,
                courseLabel: label,
              });
              return;
            }
            const msg =
              result && typeof result === "object" && typeof result.error === "string"
                ? result.error
                : "Could not generate your certificate PDF.";
            toast.error(msg);
            return;
          }
          savePdfFromResult(result);
        },
      }
    );
  };

  const handleDownloadCertificate = async (
    certificateId: number,
    certificateNumber: string | null,
    courseTitle: string | null | undefined,
    programType: string
  ) => {
    if (!certificateNumber) return;
    setDownloadingCertificateId(certificateId);
    try {
      const status = await utils.certificates.getDownloadFeedbackStatus.fetch({ certificateNumber });
      if (!status.ok) {
        toast.error("Certificate not found.");
        return;
      }
      if (!status.submitted) {
        const label = courseTitle?.trim() || programType.toUpperCase();
        setFeedbackDialog({
          certificateId: status.certificateId,
          certificateNumber,
          courseLabel: label,
        });
        return;
      }
      runCertificateDownload(certificateNumber, certificateId);
    } catch {
      toast.error("Could not check download status. Try again.");
    } finally {
      setDownloadingCertificateId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-brand-surface to-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Sign in to access your dashboard</p>
            <a href={getLoginUrl()}>
              <Button className="w-full" variant="default">Sign In</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-surface to-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">Welcome, {user?.name}!</h1>
        <p className="text-lg text-muted-foreground mb-8">
          {selectedRole === "parent"
            ? "Share your healthcare journey and help improve pediatric care"
            : selectedRole === "provider"
            ? "Log clinical events and contribute to system improvements"
            : "Manage your institution's training programs"}
        </p>

        {!selectedRole ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Select Your Role</h2>
                <p className="text-muted-foreground mb-6">Choose how you'll use the platform</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button onClick={() => navigate("/")}>Go Back</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : selectedRole === "parent" ? (
          <div className="space-y-6">
            {parentStatsLoading ? (
              <Card>
                <CardContent className="pt-6 flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading your Safe-Truth submissions…
                </CardContent>
              </Card>
            ) : parentStats ? (
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Submissions this month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-foreground">{parentStats.submissionsThisMonth}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total stories shared</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-foreground">{parentStats.totalSubmissions}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Last submission</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-semibold text-foreground">
                      {parentStats.lastSubmission
                        ? new Date(parentStats.lastSubmission).toLocaleDateString()
                        : "—"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : null}
            <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Your Stories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Share your healthcare journey to help improve pediatric care</p>
                <Button className="w-full" onClick={() => navigate("/parent-safe-truth")}>
                  Share Your Story
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Community Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Your feedback helps improve care for families</p>
                <Button variant="outline" className="w-full" onClick={() => navigate("/personal-impact")}>View Impact</Button>
              </CardContent>
            </Card>
            </div>
          </div>
        ) : selectedRole === "provider" ? (
          <div className="grid md:grid-cols-3 gap-6">
            {lifecycleResumeNudge && (
              <Card className="md:col-span-3 border-2 border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    {lifecycleResumeNudge.type === "started_not_completed"
                      ? "Continue where you stopped"
                      : "Your course is paid and ready"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground/90">
                    {lifecycleResumeNudge.type === "started_not_completed"
                      ? `You already started ${lifecycleResumeNudge.courseTitle}. Continue now to complete and unlock your next milestone.`
                      : `You paid for ${lifecycleResumeNudge.courseTitle} but have not started yet. Begin now while your motivation is high.`}
                  </p>
                  <Button
                    variant="cta"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      const destination = getContinuePathForEnrollment(
                        lifecycleResumeNudge.courseId,
                        lifecycleResumeNudge.enrollmentId
                      );
                      track("provider_conversion", "lifecycle_resume_nudge_clicked", {
                        nudgeType: lifecycleResumeNudge.type,
                        enrollmentId: lifecycleResumeNudge.enrollmentId,
                        courseId: lifecycleResumeNudge.courseId,
                        destination,
                        source: "learner_dashboard_provider",
                      });
                      navigate(destination);
                    }}
                  >
                    {lifecycleResumeNudge.cta}
                  </Button>
                </CardContent>
              </Card>
            )}
            {timedLifecycleNudge && (
              <Card className="md:col-span-3 border-2 border-amber-300 bg-amber-50/90">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-700" />
                    {timedLifecycleNudge.cadenceHours}h reminder
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-amber-900">
                    {timedLifecycleNudge.nudgeType === "started_not_completed"
                      ? `You started ${timedLifecycleNudge.courseTitle} and paused. Continue now to finish your current milestone.`
                      : `You paid for ${timedLifecycleNudge.courseTitle} and have not started yet. Start now to activate value from your purchase.`}
                  </p>
                  <Button
                    variant="cta"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      const destination = getContinuePathForEnrollment(
                        timedLifecycleNudge.courseId,
                        timedLifecycleNudge.enrollmentId
                      );
                      track("provider_conversion", "lifecycle_timed_nudge_clicked", {
                        nudgeType: timedLifecycleNudge.nudgeType,
                        cadenceHours: timedLifecycleNudge.cadenceHours,
                        dueSinceHours: timedLifecycleNudge.dueSinceHours,
                        enrollmentId: timedLifecycleNudge.enrollmentId,
                        courseId: timedLifecycleNudge.courseId,
                        destination,
                        source: "learner_dashboard_provider",
                      });
                      navigate(destination);
                    }}
                  >
                    {timedLifecycleNudge.nudgeType === "started_not_completed"
                      ? "Resume and finish"
                      : "Start my paid course"}
                  </Button>
                </CardContent>
              </Card>
            )}
            {nextPurchaseRecommendation && completedOrPaidCount >= 1 && (
              <Card className="md:col-span-3 border-2 border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Continue your learning momentum
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground/90">
                    {completedOrPaidCount === 1
                      ? "You have completed your first paid step. Start your next course now to build a strong second-purchase habit."
                      : "Keep momentum high with your next recommended course."}
                  </p>
                  <div className="rounded-md border bg-card p-3">
                    <p className="font-medium text-foreground">{nextPurchaseRecommendation.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {nextPurchaseRecommendation.level} • KES{" "}
                      {(nextPurchaseRecommendation.price / 100).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    variant="cta"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      track("provider_conversion", "second_purchase_recommendation_clicked", {
                        recommendedCourseId: nextPurchaseRecommendation.courseId,
                        completedOrPaidCount,
                        source: "learner_dashboard_provider",
                      });
                      navigate(`/enroll?courseId=${nextPurchaseRecommendation.courseId}`);
                    }}
                  >
                    Start next recommended course
                  </Button>
                </CardContent>
              </Card>
            )}
            {renewalAttention.length > 0 && (
              <Alert className="md:col-span-3 border-amber-200 bg-amber-50/80">
                <AlertCircle className="h-4 w-4 text-amber-700" />
                <AlertTitle className="text-amber-900">Certificate renewal</AlertTitle>
                <AlertDescription className="text-amber-900/90">
                  {renewalAttention.length} certificate(s) expire within 90 days or are expired. Recertify to stay
                  compliant.
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button className="bg-amber-700 hover:bg-amber-800" size="sm" onClick={() => navigate("/enroll")}>
                      Renew / recertify
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-amber-800 text-amber-900 bg-white/80"
                      disabled={renewalReminderEmail.isPending}
                      onClick={() => renewalReminderEmail.mutate()}
                    >
                      {renewalReminderEmail.isPending ? "Sending…" : "Email me a reminder"}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Care Signal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Log clinical events and keep your fellowship pillar active.</p>
                <Button className="w-full" onClick={() => navigate("/care-signal")}>
                  Log event (Care Signal)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Learning hubs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Fellowship and AHA are managed separately. Choose the hub that matches your next step.
                </p>
                <Button className="w-full" onClick={() => navigate("/fellowship")}>
                  Open fellowship
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate("/aha-courses")}>
                  Open AHA certification
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Instructor pathway
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Build toward your instructor number, then use the instructor portal for teaching assignments.
                </p>
                {instructorStatus?.certified && instructorStatus.instructorNumber ? (
                  <p className="text-xs text-muted-foreground">
                    Instructor number:{" "}
                    <span className="font-mono font-semibold text-foreground">{instructorStatus.instructorNumber}</span>
                    {!instructorStatus.approved && (
                      <span className="block mt-1">Awaiting platform approval for B2B assignments.</span>
                    )}
                  </p>
                ) : null}
                {instructorEnrollment ? (
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => navigate(`/course/instructor?enrollmentId=${instructorEnrollment.id}`)}
                  >
                    Continue instructor course
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => navigate("/enroll#course-instructor")}>
                    Enroll in instructor course
                  </Button>
                )}
                <Button variant="cta" className="w-full" onClick={() => navigate("/instructor-portal")}>
                  Open instructor portal
                </Button>
              </CardContent>
            </Card>

            {/* My Certificates */}
            <Card id="my-certificates" className="md:col-span-3 scroll-mt-20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  My Certificates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myCertificates.length === 0 ? (
                  <>
                    <p className="text-muted-foreground mb-4">You don't have any certificates yet. Complete a course and payment to receive your certificate.</p>
                    <Button variant="outline" onClick={() => navigate("/payment")}>
                      Enroll in a course
                    </Button>
                  </>
                ) : (
                  <ul className="space-y-3">
                    {myCertificates.map((c) => {
                      const days = daysUntilExpiry(c.expiryDate);
                      const renewSoon = days !== null && days <= 90;
                      return (
                        <li key={c.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-3">
                          <div>
                            <p className="font-medium text-foreground">
                              {c.courseTitle?.trim() || c.programType.toUpperCase()}
                            </p>
                            {c.courseTitle?.trim() ? (
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">{c.programType}</p>
                            ) : null}
                            <p className="text-sm text-muted-foreground">
                              Issued {c.issueDate ? new Date(c.issueDate).toLocaleDateString() : "—"}
                              {c.expiryDate ? ` · Expires ${new Date(c.expiryDate).toLocaleDateString()}` : ""}
                            </p>
                            {renewSoon && (
                              <p className={`text-xs font-medium mt-1 ${days! < 0 ? "text-red-600" : "text-amber-700"}`}>
                                {days! < 0 ? "Expired — renew to stay current" : `Renews in ${days} days`}
                              </p>
                            )}
                            {c.certificateNumber && (
                              <p className="text-xs text-muted-foreground/80 mt-1">No. {c.certificateNumber}</p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {renewSoon && (
                              <Button size="sm" variant="secondary" onClick={() => navigate("/enroll")}>
                                Renew
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!c.certificateNumber || downloadingCertificateId === c.id}
                              onClick={() =>
                                handleDownloadCertificate(c.id, c.certificateNumber, c.courseTitle ?? null, c.programType)
                              }
                            >
                              {c.certificateNumber && downloadingCertificateId === c.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </>
                              )}
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            {feedbackDialog ? (
              <CertificateDownloadFeedbackDialog
                open
                onOpenChange={(o) => {
                  if (!o) setFeedbackDialog(null);
                }}
                certificateId={feedbackDialog.certificateId}
                courseLabel={feedbackDialog.courseLabel}
                onFeedbackSaved={() => {
                  const num = feedbackDialog.certificateNumber;
                  const cid = feedbackDialog.certificateId;
                  setFeedbackDialog(null);
                  if (num) runCertificateDownload(num, cid);
                }}
              />
            ) : null}
          </div>
        ) : (
          <div className="space-y-6">
            {!institutionId && !instStatsLoading && (
              <Alert>
                <AlertTitle>No institution linked</AlertTitle>
                <AlertDescription className="flex flex-wrap gap-2 items-center">
                  Register or onboard your hospital to see live training metrics.
                  <Button size="sm" variant="outline" onClick={() => navigate("/institutional-onboarding")}>
                    Institutional onboarding
                  </Button>
                  <Button size="sm" onClick={() => navigate("/hospital-admin-dashboard")}>
                    Hospital portal
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {instStatsLoading && institutionId ? (
              <Card>
                <CardContent className="pt-6 flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading institution metrics…
                </CardContent>
              </Card>
            ) : null}
            {instStats && (
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Staff roster
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-brand-orange mb-2">{instStats.totalStaff}</p>
                    <p className="text-muted-foreground">Total staff on roster</p>
                    <p className="text-sm text-muted-foreground mt-2">{instStats.enrolledStaff} enrolled in training</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Completion rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600 mb-2">{instStats.completionRate}%</p>
                    <p className="text-muted-foreground">Staff who completed training</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Certifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-purple-600 mb-2">{instStats.certifiedStaff}</p>
                    <p className="text-muted-foreground">Certified ({instStats.certificationRate}% of roster)</p>
                  </CardContent>
                </Card>
              </div>
            )}
            {institutionId ? (
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate("/hospital-admin-dashboard")}>Open full hospital dashboard</Button>
                <Button variant="outline" onClick={() => navigate("/advanced-analytics")}>
                  Analytics
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
