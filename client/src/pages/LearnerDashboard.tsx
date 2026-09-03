import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatKenyanPhoneForDisplay, normalizeKenyanPhoneNumber } from "@shared/kenyan-phone";
import { getProgramIdentity } from "@shared/program-identity";
import { getCertificateDisplayLabel } from "@shared/paeds-resus-certificates";
import { inferDesignationFromCadre } from "@shared/cadre-designation-mapping";
import { AlertCircle, Award, BookOpen, CheckCircle2, Download, FileText, GraduationCap, Loader2, Upload, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
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
  const utils = trpc.useUtils();
  const { track } = useProviderConversionAnalytics("/learner-dashboard");
  const syncPaedsResusCertificatesMutation = trpc.certificates.syncPaedsResusCertificates.useMutation({
    onSuccess: () => {
      void utils.certificates.getMyCertificates.invalidate();
    },
  });
  const paedsResusSyncAttempted = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || selectedRole !== "provider" || paedsResusSyncAttempted.current) return;
    paedsResusSyncAttempted.current = true;
    syncPaedsResusCertificatesMutation.mutate();
  }, [isAuthenticated, selectedRole, syncPaedsResusCertificatesMutation]);
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

  const [drilldownType, setDrilldownType] = useState<"roster" | "certified" | "completion" | null>(null);
  const [rosterFilter, setRosterFilter] = useState<"all" | "enrolled" | "completed">("all");

  const staffListQuery = trpc.institution.getStaffMembers.useQuery(
    { institutionId: institutionId! },
    { enabled: !!institutionId && selectedRole === "institution" && !!drilldownType }
  );
  const staffList = staffListQuery.data ?? [];

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

  // firstEnrollmentId (removed 2026-08-04): was feeding LearnerInstallmentPaymentsCard
  // a microCourseEnrollments id where it needed a main-enrollments id -- wrong
  // table entirely, a bug present since the original 2026-07-17 commit. Real
  // payment ledger now lives in ProgressAndLedgerCard (getMyPaymentLedger),
  // correctly sourced. LearnerInstallmentPaymentsCard itself is left defined
  // but unused -- its underlying getIndividualBalance call is legitimate,
  // just needs a real enrollments.id, which this page has no other correct
  // source for today.

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-surface to-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">Welcome, {user?.name}!</h1>
        <p className="text-lg text-muted-foreground mb-8">
          {selectedRole === "provider"
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
        ) : selectedRole === "provider" ? (
          <div className="grid md:grid-cols-3 gap-6">
            <ActiveAhaPathwayCard />
            <IerpProgramCard />
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
              <Card className="md:col-span-3 border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
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
              <Alert className="md:col-span-3 border-amber-300 bg-amber-50 shadow-sm dark:border-amber-800 dark:bg-amber-950/60 [&_[data-slot=alert-title]]:text-amber-950 [&_[data-slot=alert-description]]:text-amber-950 dark:[&_[data-slot=alert-title]]:text-amber-100 dark:[&_[data-slot=alert-description]]:text-amber-100">
                <AlertCircle className="h-4 w-4 text-amber-700" />
                <AlertTitle className="text-amber-900">Certificate renewal</AlertTitle>
                <AlertDescription className="text-amber-950 dark:text-amber-100">
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

            <ProgressAndLedgerCard />

            <ProgramIdentityBadge />
            <DesignationDeclarationCard />
            <Phase1ProofUploadCard />
            <MyBookingsCard />
            <Phase2BookingCard />

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
                              {getCertificateDisplayLabel(c.programType, c.courseTitle)}
                            </p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              {c.readinessPathway?.replace(/_/g, " ") ?? c.programType}
                            </p>
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
                  <Button size="sm" onClick={() => navigate("/institution")}>
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
                <Card 
                  className="cursor-pointer hover:shadow-md hover:border-orange-300 transition-all select-none"
                  onClick={() => setDrilldownType("roster")}
                >
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

                <Card 
                  className="cursor-pointer hover:shadow-md hover:border-green-300 transition-all select-none"
                  onClick={() => setDrilldownType("completion")}
                >
                  <CardHeader>
                    <CardTitle>Completion rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600 mb-2">{instStats.completionRate}%</p>
                    <p className="text-muted-foreground">Staff who completed training</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md hover:border-purple-300 transition-all select-none"
                  onClick={() => setDrilldownType("certified")}
                >
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
                <Button onClick={() => navigate("/institution")}>Open institution workspace</Button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Institutional Metrics Drilldown Modal */}
      <Dialog open={drilldownType !== null} onOpenChange={(open) => { if (!open) setDrilldownType(null); }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {drilldownType === "roster" && "Institutional Staff Roster"}
              {drilldownType === "certified" && "Certified Staff Roster"}
              {drilldownType === "completion" && "Training Completion Details"}
            </DialogTitle>
            <DialogDescription>
              {drilldownType === "roster" && "Detailed list of all staff members registered in this facility's roster."}
              {drilldownType === "certified" && "Roster members who currently hold active, verified course certifications."}
              {drilldownType === "completion" && "Roster members who have completed all required cognitive and simulation steps."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Roster Filters */}
            {drilldownType === "roster" && (
              <div className="flex gap-2">
                {(["all", "enrolled", "completed"] as const).map((filter) => (
                  <Button
                    key={filter}
                    size="sm"
                    variant={rosterFilter === filter ? "default" : "outline"}
                    onClick={() => setRosterFilter(filter)}
                    className="capitalize text-xs"
                  >
                    {filter === "all" ? "All Staff" : filter === "enrolled" ? "Actively Enrolled" : "Completed Training"}
                  </Button>
                ))}
              </div>
            )}

            {staffListQuery.isLoading ? (
              <div className="flex justify-center py-8 text-muted-foreground items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading list...
              </div>
            ) : (
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b">
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider">Staff Name</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider">Email</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider">Cadre / Role</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider">Department</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center">Enrollment Status</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center">Roster Link Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const list = staffList ?? [];
                      let filtered = list;
                      if (drilldownType === "roster") {
                        if (rosterFilter === "enrolled") {
                          filtered = list.filter(s => s.enrollmentStatus === "enrolled");
                        } else if (rosterFilter === "completed") {
                          filtered = list.filter(s => s.enrollmentStatus === "completed");
                        }
                      } else if (drilldownType === "certified") {
                        filtered = list.filter(s => s.certificationStatus === "certified");
                      } else if (drilldownType === "completion") {
                        filtered = list.filter(s => s.enrollmentStatus === "completed");
                      }

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-muted-foreground">No matching roster records found.</td>
                          </tr>
                        );
                      }

                      return filtered.map((s) => (
                        <tr key={s.id} className="border-b hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                          <td className="p-3 font-medium">{s.staffName || "—"}</td>
                          <td className="p-3 text-xs text-muted-foreground">{s.staffEmail || "—"}</td>
                          <td className="p-3 text-xs capitalize">{s.staffRole?.replace("_", " ") || "—"}</td>
                          <td className="p-3 text-xs">{s.department || "—"}</td>
                          <td className="p-3 text-center">
                            <Badge 
                              variant={s.enrollmentStatus === "completed" ? "default" : s.enrollmentStatus === "enrolled" ? "secondary" : "outline"}
                              className="capitalize text-[10px]"
                            >
                              {s.enrollmentStatus?.replace("_", " ") || "Not Enrolled"}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Badge 
                              className={`text-[10px] ${
                                s.facilityLinkStatus === "linked" 
                                  ? "bg-green-50 text-green-700 hover:bg-green-50 border-green-200" 
                                  : s.facilityLinkStatus === "pending"
                                  ? "bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200"
                                  : "bg-slate-50 text-slate-700 hover:bg-slate-50 border-slate-200"
                              }`}
                              variant="outline"
                            >
                              {s.facilityLinkStatus || "unlinked"}
                            </Badge>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LearnerInstallmentPaymentsCard({ enrollmentId }: { enrollmentId: number }) {
  const { data: balanceData, isLoading, refetch } = trpc.payments.getIndividualBalance.useQuery({ enrollmentId });
  const [payAmount, setPayAmount] = useState("");
  const [phone, setPhone] = useState("");

  const initiateMutation = trpc.payments.initiateSTKPush.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "STK Push initiated successfully");
      setPayAmount("");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to initiate payment");
    }
  });

  if (isLoading) return <p className="text-sm text-slate-500 py-4 text-center">Loading payment ledger...</p>;
  if (!balanceData) return null;

  const handlePay = () => {
    const amountVal = parseFloat(payAmount);
    if (Number.isNaN(amountVal) || amountVal <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!phone.match(/^254\d{9}$/)) {
      toast.error("Please enter phone in format 254XXXXXXXXX");
      return;
    }
    initiateMutation.mutate({
      phoneNumber: phone,
      amount: amountVal * 100, // convert to cents
      courseId: "acls",
      courseName: "ACLS Program Installment",
    });
  };

  return (
    <Card className="mt-6 md:col-span-3 border-blue-200 bg-blue-50/10">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-blue-900">
          <Award className="w-5 h-5 text-blue-700" />
          Installment Payment Ledger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-lg border shadow-sm">
            <span className="text-xs text-slate-500 block">Total Program Fee</span>
            <span className="font-semibold text-slate-900">KES {balanceData.basePrice.toLocaleString()}</span>
          </div>
          <div className="bg-white p-3 rounded-lg border shadow-sm">
            <span className="text-xs text-slate-500 block">Total Paid So Far</span>
            <span className="font-semibold text-green-700">KES {balanceData.totalPaid.toLocaleString()}</span>
          </div>
          <div className="bg-white p-3 rounded-lg border shadow-sm">
            <span className="text-xs text-slate-500 block">Remaining Balance</span>
            <span className={`font-semibold ${balanceData.balance > 0 ? "text-amber-700" : "text-green-700"}`}>
              KES {balanceData.balance.toLocaleString()}
            </span>
          </div>
          <div className="bg-white p-3 rounded-lg border shadow-sm">
            <span className="text-xs text-slate-500 block">Payment Status</span>
            <span className={`font-bold ${balanceData.isPaidInFull ? "text-green-700" : "text-amber-700"}`}>
              {balanceData.isPaidInFull ? "Paid in Full" : "Pending Balance"}
            </span>
          </div>
        </div>

        {balanceData.balance > 0 && (
          <div className="bg-white p-4 rounded-lg border space-y-3">
            <h4 className="text-sm font-semibold text-slate-800">Make an Installment Payment</h4>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">M-Pesa Phone Number</label>
                <input
                  type="text"
                  placeholder="254XXXXXXXXX"
                  className="w-full text-sm border p-2 rounded"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Amount (KES)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  className="w-full text-sm border p-2 rounded"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handlePay}
                  disabled={initiateMutation.isPending}
                >
                  {initiateMutation.isPending ? "Processing..." : "Initiate M-Pesa Pay"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type IerpEvidenceDocumentType = "video_prework" | "precourse_assessment";
type IerpEvidenceDraft = {
  fileName: string;
  contentType: "application/pdf" | "image/jpeg" | "image/png";
  dataBase64: string;
};

const AHA_PATHWAY_LABELS: Record<string, string> = {
  nerp: "NERP — Nurses Emergency Readiness Program",
  ierp: "IERP — Intern Emergency Readiness Program",
  ilsp: "ILSP — Institutional Life Support Pathway",
  independent: "Self Pay — Independent AHA Pathway",
  admin_grant: "Administrator-granted AHA access",
};

function ActiveAhaPathwayCard() {
  const { data: access, isLoading } = trpc.courses.getAhaAccessStatus.useQuery({ programType: "bls" }, { retry: false });
  if (isLoading || !access?.allowed || access.pathway === "ierp") return null;
  const label = AHA_PATHWAY_LABELS[access.pathway] ?? access.pathway;
  return (
    <Card className="md:col-span-3 border-emerald-200 bg-emerald-50/40">
      <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Your active AHA pathway</p>
          <p className="text-base font-bold text-emerald-950">{label}</p>
          <p className="text-xs text-emerald-900">Your BLS and ACLS access is being managed through this pathway.</p>
        </div>
        <Button asChild size="sm" variant="outline" className="border-emerald-300 bg-white text-emerald-900">
          <Link href="/aha-courses">Open AHA coursework</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function IerpProgramCard({ enrollmentPage = false }: { enrollmentPage?: boolean }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: enrollment, isLoading } = trpc.ierp.getMyEnrollment.useQuery(undefined, { retry: false });
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = trpc.ierp.getSummary.useQuery(undefined, {
    enabled: !!enrollment,
    retry: false,
  });
  const { data: ierpLedger } = trpc.ierp.getPaymentLedger.useQuery(undefined, {
    enabled: !!enrollment,
    retry: false,
  });
  const utils = trpc.useUtils();
  const [paymentPhone, setPaymentPhone] = useState(() => formatKenyanPhoneForDisplay(user?.phone));
  const canonicalPaymentPhone = normalizeKenyanPhoneNumber(paymentPhone);
  const [designation, setDesignation] = useState<"noi" | "coi_bsc" | "coi_diploma" | "moi" | "">("");
  const { data: internProfile } = trpc.ierp.getMyInternProfile.useQuery(undefined, { retry: false });
  const [phase1Files, setPhase1Files] = useState<Record<IerpEvidenceDocumentType, IerpEvidenceDraft | null>>({ video_prework: null, precourse_assessment: null });
  const startMutation = trpc.ierp.start.useMutation({
    onSuccess: async (result) => {
      toast.success(result.cognitiveAccessLocked
        ? "Your IERP enrolment is ready. Complete the full KES 15,000 payment before starting cognitive learning."
        : "Your IERP enrolment is ready. Continue to Phase 1 while your intern evidence review continues.");
      await Promise.all([
        utils.ierp.getMyEnrollment.invalidate(),
        utils.ierp.getSummary.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message || "Could not start IERP"),
  });

  const paymentMutation = trpc.ierp.initiatePayment.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message);
      await Promise.all([
        utils.ierp.getPaymentLedger.invalidate(),
        utils.ierp.getSummary.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message || "Could not initiate IERP payment"),
  });
  const evidenceMutation = trpc.ierp.submitPhase1Evidence.useMutation({
    onSuccess: async () => {
      toast.success("Both Phase 1 documents were submitted privately for review.");
      setPhase1Files({ video_prework: null, precourse_assessment: null });
      await utils.ierp.getSummary.invalidate();
    },
    onError: (error) => toast.error(error.message || "Could not submit Phase 1 evidence"),
  });

  useEffect(() => {
    if (!paymentPhone && user?.phone) setPaymentPhone(formatKenyanPhoneForDisplay(user.phone));
  }, [paymentPhone, user?.phone]);

  useEffect(() => {
    if (internProfile?.designation) setDesignation(internProfile.designation);
  }, [internProfile?.designation]);

  const handlePhase1File = (documentType: IerpEvidenceDocumentType, file: File | undefined) => {
    if (!file) return;
    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      toast.error("Each Phase 1 document must be between 1 byte and 10 MB.");
      return;
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png"] as const;
    if (!(allowed as readonly string[]).includes(file.type)) {
      toast.error("Upload a PDF, JPG, or PNG document.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        toast.error("Could not read that document.");
        return;
      }
      setPhase1Files((current) => ({
        ...current,
        [documentType]: { fileName: file.name, contentType: file.type as IerpEvidenceDraft["contentType"], dataBase64: reader.result as string },
      }));
    };
    reader.onerror = () => toast.error("Could not read that document.");
    reader.readAsDataURL(file);
  };

  if (isLoading) return null;
  if (!enrollment) {
    if (!enrollmentPage) return null;
    return (
      <Card id="ierp-entry" className="mt-6 md:col-span-3 border-indigo-200 bg-indigo-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-950">
            <GraduationCap className="h-5 w-5 text-indigo-700" />
            Start IERP — Intern Emergency Readiness Program
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-700">
            IERP requires a submitted intern profile. Submit your designation and MoH deployment/posting evidence before creating the programme record; this training enrolment does not grant IERS institutional access.
          </p>
          {enrollmentPage ? (
            <Button
              className="bg-indigo-700 text-white hover:bg-indigo-800"
              disabled={!designation || startMutation.isPending || !internProfile || internProfile.status === "rejected" || internProfile.status === "revoked"}
              onClick={() => designation && startMutation.mutate({ designation })}
            >
              {startMutation.isPending ? "Starting…" : "Create IERP programme record"}
            </Button>
          ) : (
            <Button className="bg-indigo-700 text-white hover:bg-indigo-800" onClick={() => navigate("/programs/ierp/enroll")}>
              Open IERP enrollment
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const internReviewBlocked = internProfile?.status === "rejected" || internProfile?.status === "revoked";
  const internReviewPending = internProfile?.status === "pending";
  const internReviewReason = internProfile?.reviewReason?.trim();
  const phase1Done = !!summary?.phase1Complete;
  const phase2Done = !!summary?.phase2.phase2Complete;
  const phase2CertificateIssued = !!summary?.phase2Certificate;
  const phase3Unlocked = !!summary?.phase3GateUnlocked;
  const blsEnrollment = summary?.aha.find((row) => row.programType === "bls");
  const aclsEnrollment = summary?.aha.find((row) => row.programType === "acls");
  const phase3Detail = summaryLoading
    ? "Checking Phases 1 and 2…"
    : summaryError
      ? "Progress unavailable — refresh to retry"
      : phase3Unlocked
        ? summary?.providerCertificates?.length
          ? "Unlocked · provider certificate issued"
          : "Unlocked"
        : !phase1Done || !phase2Done
          ? "Locked until Phases 1 and 2 are complete"
          : "Locked until the full KES 15,000 is paid";
  const phaseStatus = [
    {
      label: "Phase 1 — Cognitive foundation",
      done: phase1Done,
      detail: summaryLoading ? "Checking progress…" : summaryError ? "Progress unavailable" : summary?.phase1Status ?? "Not started",
    },
    {
      label: "Phase 2 — Online simulations",
      done: phase2Done,
      detail: summaryLoading
        ? "Checking progress…"
        : summaryError
          ? "Progress unavailable"
          : summary
            ? `Team Leader ${summary.phase2.teamLeaderCount}/${summary.phase2.teamLeaderRequired} · Named roles ${summary.phase2.teamMemberRolesCovered}/${summary.phase2.teamMemberRolesRequired}${phase2CertificateIssued ? " · Certificate issued" : phase2Done ? " · Certificate pending sync" : ""}`
            : "Not started",
    },
    { label: "Phase 3 — Hands-on assessment", done: false, detail: phase3Detail },
  ];

  return (
    <Card id="ierp-program" className="mt-6 md:col-span-3 border-indigo-200 bg-indigo-50/20">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-indigo-950">
          <GraduationCap className="h-5 w-5 text-indigo-700" />
          IERP — Intern Emergency Readiness Program
          <Badge variant="secondary">{enrollment.designation}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-700">Your IERP training record is independent of IERS facility membership. Confirmed named simulation roles and approved retrospective claims are the source of Phase 2 progress. The programme fee is KES 15,000 in total. Submitted intern evidence lets you continue the learner journey while review is pending; the payment window still determines when cognitive and Phase 2 access is available, and the full balance is required before Phase 3.</p>
        {internReviewPending ? (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-950">
            <p className="font-semibold">Intern evidence under review — you can continue</p>
            <p className="mt-1 text-xs">Your MoH deployment/posting letter was submitted. Continue to the next available payment or learning step; if the review later finds a problem, access will pause and the correction reason will be shown here.</p>
          </div>
        ) : null}
        {internReviewBlocked ? (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-950">
            <p className="font-semibold">IERP access paused — correction required</p>
            <p className="mt-1 text-xs">{internReviewReason || "Your intern evidence was not approved. Review your Intern Profile and submit corrected evidence before continuing."}</p>
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {phaseStatus.map((phase) => (
            <div key={phase.label} className={`rounded-lg border p-3 text-xs ${phase.done ? "border-green-200 bg-green-50 text-green-800" : "border-slate-200 bg-white text-slate-600"}`}>
              <p className="font-semibold">{phase.label}</p>
              <p className="mt-1 capitalize">{phase.detail}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border-2 border-indigo-400 bg-indigo-50 p-4 shadow-sm space-y-3">
          <div>
            <p className="text-base font-bold text-indigo-950">Start your IERP coursework now</p>
            <p className="text-xs text-indigo-900">Your profile is registered. Begin the BLS cognitive refresh below; ACLS opens automatically after BLS cognitive completion. Previous BLS certification does not replace this refresh.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {internReviewBlocked || !!summary?.payment.cognitiveAccessLocked ? (
              <Button size="sm" className="bg-indigo-700 text-white" disabled>Coursework locked — review access status</Button>
            ) : (
              <Button asChild size="sm" className="bg-indigo-700 px-5 text-white hover:bg-indigo-800">
                <Link href={`${getProviderCourseDestination("bls", blsEnrollment?.id, "/learner-dashboard", blsEnrollment?.courseId ?? undefined)}&pathway=ierp`}>Start BLS coursework</Link>
              </Button>
            )}
            {internReviewBlocked || !!summary?.payment.cognitiveAccessLocked || !blsEnrollment?.cognitiveModulesComplete ? (
              <Button size="sm" variant="outline" disabled>{!blsEnrollment?.cognitiveModulesComplete ? "ACLS starts after BLS" : "ACLS cognitive locked"}</Button>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link href={`${getProviderCourseDestination("acls", aclsEnrollment?.id, "/learner-dashboard", aclsEnrollment?.courseId ?? undefined)}&pathway=ierp`}>Start ACLS coursework</Link>
              </Button>
            )}
          </div>
          {!blsEnrollment?.cognitiveModulesComplete ? <p className="text-xs text-amber-700">Complete BLS cognitive learning to unlock ACLS cognitive learning.</p> : null}
          {summary?.payment.deferredStartWindow && !summary.payment.cognitiveAccessLocked ? <p className="text-xs font-medium text-emerald-700">No payment is required before 1 December EAT. Continue learning during the deferred window, or pay early below if you prefer.</p> : null}
        </div>
        <div className="rounded-lg border border-indigo-100 bg-white p-3 space-y-2">
          <p className="text-sm font-semibold text-indigo-950">Completion certificates</p>
          <p className="text-xs text-slate-600">
            {phase2CertificateIssued
              ? "Your Paeds Resus Phase 2 — Online Simulations certificate is ready and confirms eligibility for Phase 3."
              : phase2Done
                ? "Phase 2 is complete. Your certificate is being prepared; refresh this page if it does not appear in My Certificates."
                : "The Phase 2 certificate is issued after every required online simulation role is confirmed."}
          </p>
          {summary?.providerCertificates?.length ? (
            <p className="text-xs font-medium text-emerald-700">
              {summary.providerCertificates.length} Paeds Resus provider certificate{summary.providerCertificates.length === 1 ? "" : "s"} issued.
            </p>
          ) : null}
        </div>
        <div className="rounded-lg border border-indigo-100 bg-white p-3 space-y-3">
          <div>
            <p className="text-sm font-semibold text-indigo-950">Phase 1 evidence</p>
            <p className="text-xs text-slate-600">After the platform BLS and ACLS, PALS, or NRP cognitive modules are complete, upload the two certificates here. Files are private and reviewer-controlled; do not paste a public Drive link.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ["video_prework", "Video Prework Completion Certificate"],
              ["precourse_assessment", "Passed Precourse Self-Assessment Certificate"],
            ] as const).map(([documentType, label]) => {
              const existing = summary?.phase1Evidence.find((row) => row.documentType === documentType);
              const selected = phase1Files[documentType];
              return (
                <label key={documentType} className="cursor-pointer rounded border border-dashed border-indigo-200 p-3 text-xs text-slate-700 hover:bg-indigo-50">
                  <span className="block font-medium">{label}</span>
                  <span className="mt-1 block text-slate-500">{selected?.fileName ?? existing?.fileName ?? "Choose PDF, JPG, or PNG"}</span>
                  <span className="mt-1 block font-semibold capitalize text-indigo-700">{existing?.status ?? "not submitted"}</span>
                  <input className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => handlePhase1File(documentType, event.target.files?.[0])} />
                </label>
              );
            })}
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={internReviewBlocked || !phase1Files.video_prework || !phase1Files.precourse_assessment || evidenceMutation.isPending}
            onClick={() => {
              const video = phase1Files.video_prework;
              const assessment = phase1Files.precourse_assessment;
              if (video && assessment) evidenceMutation.mutate({ documents: [{ documentType: "video_prework", ...video }, { documentType: "precourse_assessment", ...assessment }] });
            }}
          >
            {evidenceMutation.isPending ? "Submitting privately…" : "Submit Phase 1 evidence"}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className={summary?.payment.paymentLockoutActive ? "font-semibold text-red-700" : ""}>
            Payment status: {ierpLedger?.status ?? summary?.payment.status ?? enrollment.paymentStatus}
          </span>
          {ierpLedger && <span>Paid KES {ierpLedger.totalPaidKsh.toLocaleString()} · Balance KES {ierpLedger.balanceKsh.toLocaleString()}</span>}
          {summary?.payment.deferredStartWindow && summary.payment.paymentDeadline && !summary.payment.cognitiveAccessLocked && (
            <span>Payment deadline for deferred access: {new Date(summary.payment.paymentDeadline).toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" })} EAT.</span>
          )}
          {summary?.payment.cognitiveAccessLocked && <span className="font-semibold text-red-700">Cognitive coursework and Phase 2 access are locked until the full KES 15,000 balance is paid.</span>}
        </div>
        {ierpLedger && ierpLedger.balanceKsh > 0 && (
          <div className="rounded-lg border border-indigo-100 bg-white p-3 space-y-2">
            <p className="text-xs font-semibold text-indigo-950">{summary?.payment.deferredStartWindow && !summary.payment.cognitiveAccessLocked ? "Pay IERP early (optional)" : "Complete IERP payment"}</p>
            <p className="text-xs text-slate-600">{summary?.payment.deferredStartWindow && !summary.payment.cognitiveAccessLocked ? `Not required yet — you are covered until 1 December EAT. Pay now if you would rather clear the KES ${ierpLedger.balanceKsh.toLocaleString()} balance early.` : `From 1 December EAT, IERP requires the remaining balance of KES ${ierpLedger.balanceKsh.toLocaleString()} in one payment. No instalment plan is used for IERP.`}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                aria-label="IERP M-Pesa phone number"
                placeholder="2547XXXXXXXX"
                value={paymentPhone}
                onChange={(event) => setPaymentPhone(event.target.value)}
                className="h-9 text-sm sm:max-w-xs"
              />
              <Button
                size="sm"
                className="bg-indigo-700 text-white hover:bg-indigo-800"
                disabled={internReviewBlocked || paymentMutation.isPending || !canonicalPaymentPhone}
                onClick={() => canonicalPaymentPhone && paymentMutation.mutate({ amountKsh: ierpLedger.balanceKsh, phase: "general", phoneNumber: canonicalPaymentPhone })}
              >
                {paymentMutation.isPending ? "Sending…" : `Pay KES ${ierpLedger.balanceKsh.toLocaleString()}`}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Enter 2547…, +2547…, 07…, 7…, or 00 254…; the number is normalized before the M-Pesa request. Your payment stays pending until the provider callback confirms it. No IERS access is created by this payment.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProgramIdentityBadge() {
  const { data: ierpSummary } = trpc.ierp.getSummary.useQuery(undefined, { retry: false });
  const { data: phase, isLoading } = trpc.courses.getPhaseSummary.useQuery();
  if (ierpSummary || isLoading || !phase?.programIdentity?.programName) return null;

  return (
    <div className="mt-6 md:col-span-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">You're on</span>
      <span className="text-sm font-bold text-blue-900">{phase.programIdentity.programName}</span>
      <span className="text-xs text-slate-500">— {phase.programIdentity.programFullName}</span>
    </div>
  );
}

function DesignationDeclarationCard() {
  const { data: ierpSummary } = trpc.ierp.getSummary.useQuery(undefined, { retry: false });
  const { data: phase, isLoading, refetch } = trpc.courses.getPhaseSummary.useQuery();
  const { user } = useAuth();
  const [designation, setDesignation] = useState<
    "noi" | "coi_bsc" | "coi_diploma" | "moi" | "permanent_nurse" | "permanent_doctor" | "other" | ""
  >("");
  const [prefilled, setPrefilled] = useState(false);

  // Pre-select from the user's existing cadre where it's unambiguous (CEO
  // decision, 2026-07-21) — e.g. any RN-family cadre already implies
  // "Permanent Nurse" regardless of sub-specialty, so don't make them
  // re-enter a fact they've already told the platform once elsewhere.
  // Still shown as an editable selection, not locked, in case it's wrong.
  useEffect(() => {
    if (prefilled || designation) return;
    const inferred = inferDesignationFromCadre((user as any)?.cadre);
    if (inferred) {
      setDesignation(inferred);
      setPrefilled(true);
    }
  }, [user, designation, prefilled]);

  const declareMutation = trpc.institution.declareMyDesignation.useMutation({
    onSuccess: () => {
      toast.success("Thanks — your designation has been recorded.");
      void refetch();
    },
    onError: (err) => toast.error(err.message || "Could not save your designation"),
  });

  if (ierpSummary || isLoading) return null;
  // Only relevant for learners already linked to a cohort-program institution
  if (!phase) return null;
  // Already declared — nothing to do here. "other" is the un-declared default,
  // so this card keeps showing until the learner picks something real.
  if (phase.designation && phase.designation !== "other") return null;

  const isNurseSelected = designation === "permanent_nurse";

  const handleSubmit = () => {
    if (!designation) {
      toast.error("Please select your designation.");
      return;
    }
    declareMutation.mutate({ designation });
  };

  return (
    <Card id="designation-declaration" className="mt-6 md:col-span-3 border-blue-200 bg-blue-50/20">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-blue-900">
          <Users className="w-5 h-5 text-blue-700" />
          Confirm Your Role
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-700">
          To unlock the KES 15,000 subsidised rate for the ACLS/BLS Cohort Program, tell us which of these you are.
          Nurses must first add their Licence number under Professional Credentials; this designation uses that same record. Interns don't need a professional licence number.
        </p>
        <div className="bg-white p-4 rounded-lg border space-y-3">
          {prefilled && (
            <p className="text-xs text-blue-700">
              We've pre-selected this based on your profile — change it below if it's not right.
            </p>
          )}
          <Select value={designation} onValueChange={(v) => setDesignation(v as typeof designation)}>
            <SelectTrigger id="designation-select">
              <SelectValue placeholder="Select your designation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="noi">NOI (Nursing Officer Intern)</SelectItem>
              <SelectItem value="coi_bsc">Clinical Officer Intern (BSc)</SelectItem>
              <SelectItem value="coi_diploma">Clinical Officer Intern (Diploma)</SelectItem>
              <SelectItem value="moi">MOI (Medical Officer Intern)</SelectItem>
              <SelectItem value="permanent_nurse">Permanent Nurse</SelectItem>
              <SelectItem value="permanent_doctor">Permanent Doctor</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          {isNurseSelected && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              Add your single regulatory Licence number in Professional Credentials
              above. This designation check will reuse that record; you do not need
              to type the number again here.
            </div>
          )}

          {designation && (() => {
            const preview = getProgramIdentity(designation);
            return (
              <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-slate-700">
                {preview.programName && (
                  <p className="font-semibold text-blue-900 mb-1">
                    You'll be on: {preview.programFullName}
                  </p>
                )}
                <ul className="list-disc pl-5 space-y-0.5">
                  {preview.rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
            );
          })()}

          <Button
            id="designation-submit-btn"
            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
            onClick={handleSubmit}
            disabled={declareMutation.isPending || !designation}
          >
            {declareMutation.isPending ? "Saving..." : "Confirm"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MyBookingsCard() {
  const { data: bookings, isLoading, refetch } = trpc.courses.getMyHandsOnBookings.useQuery();
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const cancelMutation = trpc.courses.cancelHandsOnSession.useMutation({
    onSuccess: (result) => {
      if (result.alreadyCancelled) {
        toast.success("Booking already cancelled.");
      } else if (result.promoted) {
        toast.success("Booking cancelled — a waitlisted learner has been promoted into your slot.");
      } else {
        toast.success("Booking cancelled.");
      }
      setCancellingId(null);
      void refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Could not cancel this booking");
      setCancellingId(null);
    },
  });

  // No cohort-program bookings at all yet — nothing to show. Distinct from
  // "loading," which renders nothing rather than an empty-state flash.
  if (isLoading) return null;
  if (!bookings || bookings.length === 0) return null;

  const statusLabel: Record<string, string> = {
    registered: "Registered",
    attended: "Attended",
    absent: "Absent",
    cancelled: "Cancelled",
    waitlisted: "Waitlisted",
  };
  const statusStyle: Record<string, string> = {
    registered: "bg-green-50 border-green-200 text-green-800",
    attended: "bg-blue-50 border-blue-200 text-blue-800",
    absent: "bg-slate-50 border-slate-200 text-slate-500",
    cancelled: "bg-slate-50 border-slate-200 text-slate-400 line-through decoration-slate-300",
    waitlisted: "bg-amber-50 border-amber-200 text-amber-800",
  };
  const trainingTypeLabel: Record<string, string> = {
    online: "Phase 1 · Online",
    hands_on: "Phase 3 · Hands-on",
    hybrid: "Phase 2 · Online Simulation",
  };

  const handleCancel = (scheduleId: number) => {
    setCancellingId(scheduleId);
    cancelMutation.mutate({ scheduleId });
  };

  return (
    <Card id="my-bookings" className="mt-6 md:col-span-3">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          My Cohort Program Bookings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {bookings.map((b) => {
          const canCancel = b.attendanceStatus === "registered" || b.attendanceStatus === "waitlisted";
          const isCancellingThis = cancelMutation.isPending && cancellingId === b.scheduleId;
          return (
            <div
              key={b.attendanceId}
              className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border ${
                statusStyle[b.attendanceStatus ?? ""] ?? "bg-slate-50 border-slate-200"
              }`}
            >
              <div>
                <p className="font-semibold text-sm">
                  {b.courseTitle} — {trainingTypeLabel[b.trainingType] ?? b.trainingType}
                </p>
                <p className="text-xs mt-0.5">
                  {b.scheduledDate ? new Date(b.scheduledDate).toLocaleDateString() : "Date TBC"}
                  {b.startTime ? ` · ${b.startTime}${b.endTime ? `–${b.endTime}` : ""}` : ""}
                  {b.location ? ` · ${b.location}` : ""}
                </p>
                {b.instructorName && (
                  <p className="text-xs mt-0.5 opacity-80">Instructor: {b.instructorName}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-medium px-2 py-1 rounded-full border bg-white/60">
                  {statusLabel[b.attendanceStatus ?? ""] ?? b.attendanceStatus}
                </span>
                {canCancel && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={cancelMutation.isPending}
                    onClick={() => handleCancel(b.scheduleId)}
                  >
                    {isCancellingThis ? "Cancelling..." : "Cancel"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

const PHASE2_ROLE_LABELS: Record<string, string> = {
  team_leader: "Team Leader",
  team_member_airway_ventilation: "Airway & Ventilation",
  team_member_compressor_1: "Compressor 1",
  team_member_compressor_2: "Compressor 2",
  team_member_monitor_defib_cpr_coach: "Monitor/Defib/CPR Coach",
  team_member_iv_io_meds: "IV/IO Access & Meds",
  team_member_scribe: "Scribe",
  observer: "Observer",
};
const PHASE2_ROLE_ORDER = [
  "team_leader",
  "team_member_airway_ventilation",
  "team_member_compressor_1",
  "team_member_compressor_2",
  "team_member_monitor_defib_cpr_coach",
  "team_member_iv_io_meds",
  "team_member_scribe",
  "observer",
];

function Phase2CompletionProgress() {
  const { data, isLoading } = trpc.courses.getPhase2CompletionStatus.useQuery();
  if (isLoading || !data) return null;

  const pct = Math.round(
    ((Math.min(data.teamLeaderCount, data.teamLeaderRequired) + Math.min(data.teamMemberSessionsTotal, data.teamMemberSessionsRequired)) /
      (data.teamLeaderRequired + data.teamMemberSessionsRequired)) *
      100
  );

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Phase 2 progress</span>
        <span className="text-muted-foreground">{data.phase2Complete ? "Complete" : `${pct}%`}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className={`p-2 rounded border ${data.teamLeaderMet ? "bg-green-50 border-green-200 text-green-800" : "bg-slate-50 border-slate-200"}`}>
          Team Leader: {data.teamLeaderCount}/{data.teamLeaderRequired}
        </div>
        <div className={`p-2 rounded border ${data.teamMemberMet ? "bg-green-50 border-green-200 text-green-800" : "bg-slate-50 border-slate-200"}`}>
          Team Member: {data.teamMemberSessionsTotal}/{data.teamMemberSessionsRequired} ({data.teamMemberRolesCovered}/{data.teamMemberRolesRequired} roles covered)
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {Object.entries(data.teamMemberRoleCounts).map(([role, count]) => (
          <div
            key={role}
            className={`text-[11px] p-1.5 rounded border text-center ${
              (count as number) > 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            {PHASE2_ROLE_LABELS[role] ?? role}
          </div>
        ))}
      </div>
    </div>
  );
}

function Phase2BookingCard() {
  const sessionsQuery = trpc.courses.listPhase2Sessions.useQuery({});
  const [bookingScheduleId, setBookingScheduleId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [claimingScheduleId, setClaimingScheduleId] = useState<number | null>(null);
  const [claimRole, setClaimRole] = useState<string>("");
  const [claimNotes, setClaimNotes] = useState("");

  const bookMutation = trpc.courses.bookPhase2Role.useMutation({
    onSuccess: () => {
      toast.success("Booked! You'll see this under My Bookings.");
      setBookingScheduleId(null);
      setSelectedRole("");
      void sessionsQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const claimMutation = trpc.courses.submitRetrospectiveRoleClaim.useMutation({
    onSuccess: () => {
      toast.success("Claim submitted — the instructor who ran that session will review it.");
      setClaimingScheduleId(null);
      setClaimRole("");
      setClaimNotes("");
    },
    onError: (err) => toast.error(err.message),
  });

  const sessions = sessionsQuery.data ?? [];

  return (
    <Card className="mt-6 md:col-span-3">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Phase 2 — Online Simulations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Phase2CompletionProgress />

        {sessionsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading sessions…
          </p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No instructors have declared Phase 2 availability yet — check back soon.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((s: any) => {
              const openRoles = PHASE2_ROLE_ORDER.filter((r) => (s.roleAvailability[r]?.available ?? 0) > 0);
              const isFull = openRoles.length === 0;
              return (
                <div key={s.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{s.courseTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.scheduledDate ? new Date(s.scheduledDate).toLocaleDateString() : "Date TBC"}
                        {s.startTime ? ` · ${s.startTime}${s.endTime ? `–${s.endTime}` : ""}` : ""}
                        {s.instructorName ? ` · Instructor: ${s.instructorName}` : ""}
                      </p>
                    </div>
                    {!isFull && bookingScheduleId !== s.id && (
                      <Button size="sm" variant="outline" onClick={() => setBookingScheduleId(s.id)}>
                        Book a role
                      </Button>
                    )}
                    {isFull && <span className="text-xs text-slate-500 font-medium">Fully booked</span>}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {PHASE2_ROLE_ORDER.map((r) => {
                      const avail = s.roleAvailability[r];
                      if (!avail) return null;
                      const taken = avail.available <= 0;
                      return (
                        <span
                          key={r}
                          className={`text-[11px] px-2 py-0.5 rounded-full border ${
                            taken ? "bg-slate-100 border-slate-200 text-slate-400 line-through" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                          }`}
                        >
                          {PHASE2_ROLE_LABELS[r]} ({avail.available}/{avail.capacity})
                        </span>
                      );
                    })}
                  </div>

                  {bookingScheduleId === s.id && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 p-2">
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="w-[220px] h-8 text-xs">
                          <SelectValue placeholder="Pick your role" />
                        </SelectTrigger>
                        <SelectContent>
                          {openRoles.map((r) => (
                            <SelectItem key={r} value={r}>
                              {PHASE2_ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        disabled={!selectedRole || bookMutation.isPending}
                        onClick={() => bookMutation.mutate({ scheduleId: s.id, role: selectedRole as any })}
                      >
                        {bookMutation.isPending ? "Booking..." : "Confirm booking"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setBookingScheduleId(null)}>
                        Cancel
                      </Button>
                    </div>
                  )}

                  <div className="mt-2">
                    {claimingScheduleId === s.id ? (
                      <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-2">
                        <Select value={claimRole} onValueChange={setClaimRole}>
                          <SelectTrigger className="w-[220px] h-8 text-xs bg-white">
                            <SelectValue placeholder="Which role did you fill?" />
                          </SelectTrigger>
                          <SelectContent>
                            {PHASE2_ROLE_ORDER.map((r) => (
                              <SelectItem key={r} value={r}>
                                {PHASE2_ROLE_LABELS[r]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Notes (optional)"
                          value={claimNotes}
                          onChange={(e) => setClaimNotes(e.target.value)}
                          className="h-8 text-xs w-[180px] bg-white"
                        />
                        <Button
                          size="sm"
                          disabled={!claimRole || claimMutation.isPending}
                          onClick={() => claimMutation.mutate({ scheduleId: s.id, role: claimRole as any, notes: claimNotes || undefined })}
                        >
                          Submit claim
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setClaimingScheduleId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <button
                        className="text-[11px] text-muted-foreground underline underline-offset-2"
                        onClick={() => setClaimingScheduleId(s.id)}
                      >
                        Filled in for a no-show in this session? Claim a role retrospectively
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProgressAndLedgerCard() {
  const { data: phase } = trpc.courses.getPhaseSummary.useQuery();
  const { data: phase2 } = trpc.courses.getPhase2CompletionStatus.useQuery();
  const { data: ledger, isLoading: ledgerLoading } = trpc.payments.getMyUnifiedPaymentLedger.useQuery();

  // Phase 1: done once past phase_1. Phase 2: from getPhase2CompletionStatus.
  // Phase 3: done once phaseStatus reaches phase_3/completed.
  const phase1Done = !!phase && phase.phaseStatus !== "phase_1";
  const phase2Done = !!phase2?.phase2Complete;
  const phase3Done = phase?.phaseStatus === "phase_3" || phase?.phaseStatus === "completed";
  const phasesDoneCount = [phase1Done, phase2Done, phase3Done].filter(Boolean).length;
  const overallPct = Math.round((phasesDoneCount / 3) * 100);

  return (
    <Card className="md:col-span-3">
      <CardHeader>
        <CardTitle className="text-lg font-bold">My Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="font-medium">Overall</span>
            <span className="text-muted-foreground">{overallPct}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${overallPct}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { label: "Phase 1 — Cognitive", done: phase1Done, detail: phase ? (phase.phaseStatus === "phase_1" ? "In progress" : "Complete") : "—" },
            {
              label: "Phase 2 — Simulations",
              done: phase2Done,
              detail: phase2 ? `Leader ${phase2.teamLeaderCount}/${phase2.teamLeaderRequired} · Member ${phase2.teamMemberSessionsTotal}/${phase2.teamMemberSessionsRequired}` : "—",
            },
            { label: "Phase 3 — Hands-on", done: phase3Done, detail: phase3Done ? "Complete" : phase2Done ? "Unlocked" : "Locked until Phase 2 is done" },
          ].map((p) => (
            <div key={p.label} className={`p-2.5 rounded-lg border text-xs ${p.done ? "bg-green-50 border-green-200 text-green-800" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
              <p className="font-semibold">{p.label}</p>
              <p className="mt-0.5">{p.detail}</p>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-sm font-medium mb-2">Payment ledger</p>
          {ledgerLoading ? (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </p>
          ) : !ledger?.programs?.length ? (
            <p className="text-xs text-muted-foreground">
              Your payment history will appear here after you join NERP, IERP, ILSP, or the Independent AHA Pathway.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded border border-border bg-muted/30">
                  <p className="text-muted-foreground">Paid across programmes</p>
                  <p className="font-semibold text-sm">KES {ledger.totalPaidKes.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded border border-border bg-muted/30">
                  <p className="text-muted-foreground">Outstanding</p>
                  <p className="font-semibold text-sm">KES {ledger.totalOutstandingKes.toLocaleString()}</p>
                </div>
              </div>
              {ledger.programs.map((program) => (
                <div key={`${program.key}-${program.referenceId ?? program.label}`} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{program.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Paid KES {program.totalPaidKes.toLocaleString()}
                        {program.totalDueKes !== null ? ` of KES ${program.totalDueKes.toLocaleString()}` : ""}
                        {` · ${program.status.replaceAll("_", " ")}`}
                      </p>
                    </div>
                    {program.key === "nerp" && program.balanceKes !== null && program.balanceKes > 0 ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href="/programs/nerp-acls/enroll">Open NERP payment</Link>
                      </Button>
                    ) : program.key === "ierp" && program.balanceKes !== null && program.balanceKes > 0 ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href="/programs/ierp">Open IERP payment</Link>
                      </Button>
                    ) : null}
                  </div>
                  {program.entries.length > 0 ? (
                    <div className="space-y-1">
                      {program.entries.slice(0, 4).map((entry) => (
                        <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "—"}{entry.installmentNumber ? ` · installment ${entry.installmentNumber}` : ""}</span>
                          <span>KES {entry.amountKes.toLocaleString()} · {entry.status.replaceAll("_", " ")}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No payment transaction has been recorded for this programme yet.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Phase1ProofUploadCard() {
  const { data: ierpSummary } = trpc.ierp.getSummary.useQuery(undefined, { retry: false });
  const { data: phase, isLoading, refetch } = trpc.courses.getPhaseSummary.useQuery();
  const [proofUrl, setProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const uploadMutation = trpc.institution.uploadPhase1Proof.useMutation({
    onSuccess: () => {
      toast.success("Proof submitted! Your coordinator will review it shortly.");
      setProofUrl("");
      void refetch();
    },
    onError: (err) => toast.error(err.message || "Upload failed"),
  });

  if (ierpSummary || isLoading) return null;
  // Only show this card if the learner is in a linked cohort program
  if (!phase) return null;
  // Hide once approved
  if (phase.phase1ProofApproved) return null;

  const handleSubmit = () => {
    if (!proofUrl.startsWith("http")) {
      toast.error("Please paste a valid URL (starting with http)");
      return;
    }
    uploadMutation.mutate({ staffMemberId: phase.staffMemberId, proofUrl });
  };

  // Suppress unused variable warning — submitting is set for future UX expansion
  void submitting;

  return (
    <Card id="phase1-proof-upload" className="mt-6 md:col-span-3 border-amber-200 bg-amber-50/20">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-900">
          <Upload className="w-5 h-5 text-amber-700" />
          Phase 1 Completion Proof
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {phase.phase1ProofUploaded && !phase.phase1ProofApproved ? (
          <div className="flex items-start gap-3 bg-amber-100 rounded-lg p-4 border border-amber-300">
            <Loader2 className="w-5 h-5 text-amber-700 mt-0.5 shrink-0 animate-spin" />
            <div>
              <p className="font-semibold text-amber-900 text-sm">Proof submitted — awaiting coordinator review</p>
              <p className="text-xs text-amber-700 mt-1">
                Your Phase 1 certificate has been received. You will be advanced to Phase 2 once your coordinator approves it.
                You can re-submit with a new link below if you uploaded the wrong document.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg border space-y-3">
            <p className="text-sm text-slate-700">
              To unlock Phase 2 simulations, paste the public link to your{" "}
              <a href="https://elearning.heart.org" target="_blank" rel="noreferrer" className="text-blue-600 underline">
                elearning.heart.org
              </a>{" "}
              completion screenshot or certificate PDF below.
            </p>
            <div className="flex gap-2">
              <input
                id="phase1-proof-url-input"
                type="url"
                placeholder="https://drive.google.com/file/d/..."
                className="flex-1 text-sm border p-2 rounded"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
              />
              <Button
                id="phase1-proof-submit-btn"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleSubmit}
                disabled={uploadMutation.isPending || !proofUrl}
              >
                {uploadMutation.isPending ? "Submitting..." : "Submit Proof"}
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mt-2">
          {([
            { label: "Cognitive Modules", done: true },
            { label: "AHA Prework Link", done: phase.phase1ProofUploaded },
            { label: "Coordinator Approved", done: phase.phase1ProofApproved },
          ] as const).map(({ label, done }) => (
            <div key={label} className={`flex items-center gap-2 text-xs p-2 rounded-md border ${
              done ? "bg-green-50 border-green-200 text-green-800" : "bg-slate-50 border-slate-200 text-slate-500"
            }`}>
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${done ? "text-green-600" : "text-slate-300"}`} />
              {label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
