import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Bell,
  CheckCircle2,
  Clock,
  Download,
  GraduationCap,
  Loader2,
  RefreshCcw,
  Siren,
  ChevronRight,
} from "lucide-react";
import { useProviderConversionAnalytics } from "@/hooks/useProviderConversionAnalytics";
import { CertificateDownloadFeedbackDialog } from "@/components/CertificateDownloadFeedbackDialog";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

function daysUntilExpiry(expiryDate: string | Date | null | undefined): number | null {
  if (!expiryDate) return null;
  const d = new Date(expiryDate);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

export default function ProviderDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { track } = useProviderConversionAnalytics("/home/provider");
  const [showCertificates, setShowCertificates] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const summaryQuery = trpc.dashboards.getSummary.useQuery(undefined, {
    enabled: Boolean(user),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { data: enrollmentsData } = trpc.courses.getUserEnrollments.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: certData } = trpc.certificates.getMyCertificates.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const myCertificates = certData?.success ? (certData.certificates ?? []) : [];

  const renewalReminderEmail = trpc.certificates.requestRenewalReminderEmail.useMutation({
    onSuccess: (r) => {
      if (r.success) toast.success("Renewal reminder sent to your email.");
      else toast.error(r.error ?? "Could not send email.");
    },
    onError: (e) => toast.error(e.message || "Could not send email."),
  });

  const downloadCert = trpc.certificates.download.useMutation();
  const utils = trpc.useUtils();
  const [downloadingCertificateId, setDownloadingCertificateId] = useState<number | null>(null);
  const [feedbackDialog, setFeedbackDialog] = useState<{
    certificateId: number;
    certificateNumber: string | null;
    courseLabel: string;
  } | null>(null);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const allEnrollments = enrollmentsData ?? [];
  const inProgressCourses = allEnrollments.filter(
    (e) => e.enrollmentStatus === "active" && (e.progressPercentage ?? 0) > 0
  );
  const notStartedCourses = allEnrollments.filter(
    (e) => e.enrollmentStatus === "active" && (e.progressPercentage ?? 0) === 0
  );
  const completedCourses = allEnrollments.filter(
    (e) => e.enrollmentStatus === "completed"
  );
  const renewalAttention = myCertificates.filter((c) => {
    const days = daysUntilExpiry(c.expiryDate);
    return days !== null && days <= 90;
  });

  // Build notification list
  type Notification = {
    id: string;
    type: "warning" | "info";
    message: string;
    action?: () => void;
    actionLabel?: string;
  };
  const notifications: Notification[] = [];
  inProgressCourses.slice(0, 3).forEach((e) => {
    notifications.push({
      id: `progress-${e.id}`,
      type: "info",
      message: `Continue: ${e.course?.title ?? "Course"} — ${e.progressPercentage ?? 0}% complete`,
      action: () => setLocation(`/micro-course/${e.course?.courseId}`),
      actionLabel: "Resume",
    });
  });
  if (notStartedCourses.length > 0) {
    notifications.push({
      id: "not-started",
      type: "info",
      message: `${notStartedCourses.length} enrolled course${notStartedCourses.length > 1 ? "s" : ""} not yet started`,
      action: () => setLocation("/fellowship"),
      actionLabel: "Start now",
    });
  }
  if (renewalAttention.length > 0) {
    notifications.push({
      id: "renewal",
      type: "warning",
      message: `${renewalAttention.length} certificate${renewalAttention.length > 1 ? "s" : ""} expiring within 90 days`,
      action: () => setShowCertificates(true),
      actionLabel: "View",
    });
  }

  // ── Certificate download ──────────────────────────────────────────────────────
  const triggerBrowserDownload = (pdfBase64: string, filename: string) => {
    try {
      const byteCharacters = atob(pdfBase64);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success("Certificate downloaded successfully.");
    } catch (err) {
      console.error("PDF download processing error:", err);
      toast.error("Failed to process certificate file.");
    }
  };

  const runCertificateDownload = (certNumber: string, certId: number) => {
    downloadCert.mutate(
      { certificateNumber: certNumber },
      {
        onSuccess: (res) => {
          setDownloadingCertificateId(null);
          if (res.success && (res as any).pdfBase64) {
            triggerBrowserDownload((res as any).pdfBase64, (res as any).filename || `certificate-${certNumber}.pdf`);
          } else if ((res as any).error === "feedback_required") {
            // Backend requires feedback before download — open feedback dialog
            const cert = myCertificates.find(c => c.certificateNumber === certNumber);
            const label = cert?.courseTitle?.trim() || "Course Certificate";
            const fbCertId = (res as any).certificateId ?? certId;
            setFeedbackDialog({ certificateId: fbCertId, certificateNumber: certNumber, courseLabel: label });
          } else {
            toast.error((res as any).error ?? "Download failed. Please try again.");
          }
          void utils.certificates.getMyCertificates.invalidate();
        },
        onError: (e) => {
          setDownloadingCertificateId(null);
          toast.error(e.message || "Download failed. Please try again.");
        },
      }
    );
  };

  const handleDownloadCertificate = (
    certId: number,
    certNumber: string | null | undefined,
    _courseTitle: string | null | undefined,
    _programType: string
  ) => {
    if (!certNumber) {
      toast.error("Certificate is not yet issued. Complete the course to receive your certificate.");
      return;
    }
    setDownloadingCertificateId(certId);
    // Try direct download — backend handles feedback gate
    runCertificateDownload(certNumber, certId);
  };

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [loading, user, setLocation]);

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (loading || !user || summaryQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-2xl mx-4">
          <CardHeader>
            <CardTitle>Loading your provider workspace…</CardTitle>
            <CardDescription>Checking courses and certifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-24 rounded-lg bg-muted animate-pulse" />
            <div className="h-11 rounded-lg bg-muted animate-pulse" />
            <div className="h-11 rounded-lg bg-muted animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Error fallback ────────────────────────────────────────────────────────────
  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Provider workspace temporarily unavailable</AlertTitle>
            <AlertDescription>{summaryQuery.error?.message || "Please try again in a moment."}</AlertDescription>
          </Alert>
          <Button className="w-full justify-between" onClick={() => void summaryQuery.refetch()}>
            Retry <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button variant="secondary" className="w-full justify-between" onClick={() => setLocation("/fellowship")}>
            <span className="inline-flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />Open Fellowship
            </span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Welcome header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Paeds Resus Provider Workspace</p>
          </div>
          {notifications.length > 0 && (
            <div className="relative">
              <Bell className="h-6 w-6 text-slate-500" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                {notifications.length}
              </span>
            </div>
          )}
        </div>

        {/* ── Notifications panel ────────────────────────────────────────────── */}
        {notifications.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/60">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications ({notifications.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                    n.type === "warning"
                      ? "bg-amber-100 text-amber-900 border border-amber-200"
                      : "bg-white text-slate-700 border border-slate-100"
                  }`}
                >
                  <span className="flex-1 mr-2">{n.message}</span>
                  {n.action && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs font-semibold shrink-0"
                      onClick={n.action}
                    >
                      {n.actionLabel} <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── Paeds Resus Fellowship ─────────────────────────────────────────── */}
        <Card className="border-violet-200 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 opacity-90" />
              <div>
                <h2 className="font-bold text-lg leading-tight">Paeds Resus Fellowship</h2>
                <p className="text-violet-200 text-xs mt-0.5">27 micro-courses · Evidence-based · Certified</p>
              </div>
            </div>
          </div>
          <CardContent className="px-5 py-4 space-y-3">
            {allEnrollments.length > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{completedCourses.length} of {allEnrollments.length} courses completed</span>
                  <span className="font-semibold text-slate-700">
                    {Math.round((completedCourses.length / allEnrollments.length) * 100)}%
                  </span>
                </div>
                <Progress
                  value={Math.round((completedCourses.length / allEnrollments.length) * 100)}
                  className="h-2"
                />
                {inProgressCourses.length > 0 && (
                  <p className="text-xs text-slate-500">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {inProgressCourses[0].course?.title ?? "A course"} is in progress
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Start your fellowship journey today.</p>
            )}
            <Button
              className="w-full justify-between bg-violet-600 hover:bg-violet-700 text-white"
              onClick={() => {
                track("provider_conversion", "provider_cta_open_fellowship", { source: "provider_home_fellowship_card" });
                setLocation("/fellowship");
              }}
            >
              <span className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                {inProgressCourses.length > 0 ? "Continue Fellowship" : completedCourses.length > 0 ? "View Fellowship" : "Start Fellowship"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* ── AHA Courses ───────────────────────────────────────────────────── */}
        <Card className="border-amber-200 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 opacity-90" />
              <div>
                <h2 className="font-bold text-lg leading-tight">AHA Courses</h2>
                <p className="text-amber-100 text-xs mt-0.5">BLS · ACLS · PALS · Internationally recognized</p>
              </div>
            </div>
          </div>
          <CardContent className="px-5 py-4 space-y-3">
            <p className="text-sm text-slate-600">
              Earn internationally recognized American Heart Association certifications for BLS, ACLS, and PALS.
            </p>
            <Button
              className="w-full justify-between bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => {
                track("provider_conversion", "provider_cta_open_aha_hub", { source: "provider_home_aha_card" });
                setLocation("/aha-courses");
              }}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                View AHA Courses
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* ── Certificates section ───────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-600" />
                My Certificates
                {myCertificates.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{myCertificates.length}</Badge>
                )}
              </CardTitle>
              {myCertificates.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowCertificates(!showCertificates)}
                >
                  {showCertificates ? "Hide" : "Show all"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {myCertificates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No certificates yet. Complete a course to receive your certificate.
              </p>
            ) : !showCertificates ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <p className="text-sm text-slate-600">
                  You have <strong>{myCertificates.length}</strong> certificate{myCertificates.length > 1 ? "s" : ""}.
                  {renewalAttention.length > 0 && (
                    <span className="text-amber-700 font-medium ml-1">
                      {renewalAttention.length} expiring soon.
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {myCertificates.map((c) => {
                  const days = daysUntilExpiry(c.expiryDate);
                  const renewSoon = days !== null && days <= 90;
                  return (
                    <li
                      key={c.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {c.courseTitle?.trim() || c.programType.toUpperCase()}
                        </p>
                        {c.courseTitle?.trim() ? (
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">{c.programType}</p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
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
                          <Button size="sm" variant="secondary" onClick={() => setLocation("/enroll")}>
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
                {renewalAttention.length > 0 && (
                  <div className="pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-amber-700 border-amber-300"
                      disabled={renewalReminderEmail.isPending}
                      onClick={() => renewalReminderEmail.mutate()}
                    >
                      {renewalReminderEmail.isPending ? "Sending…" : "Email me renewal reminders"}
                    </Button>
                  </div>
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ── Quick access: ResusGPS ─────────────────────────────────────────── */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Siren className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold text-sm text-slate-900">ResusGPS</p>
                <p className="text-xs text-slate-500">Real-time bedside decision support</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-primary text-primary"
              onClick={() => setLocation("/resus")}
            >
              Open <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* PWA install banner */}
        <PWAInstallBanner variant="card" className="mb-2" />
      </div>

      {/* ── Certificate download feedback dialog ─────────────────────────── */}
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
  );
}
