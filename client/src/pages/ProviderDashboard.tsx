import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  CreditCard,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  RefreshCcw,
  Siren,
  Stethoscope,
} from "lucide-react";
import { useProviderConversionAnalytics } from "@/hooks/useProviderConversionAnalytics";
import { CertificateDownloadFeedbackDialog } from "@/components/CertificateDownloadFeedbackDialog";
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

  // ── Summary (next-step engine) ──────────────────────────────────────────────
  const summaryQuery = trpc.dashboards.getSummary.useQuery(undefined, {
    enabled: Boolean(user),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // ── Certificates ────────────────────────────────────────────────────────────
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

  const runCertificateDownload = (certNumber: string, certId: number) => {
    downloadCert.mutate(
      { certificateNumber: certNumber },
      {
        onSuccess: (res) => {
          setDownloadingCertificateId(null);
          if (res.success && res.url) {
            const a = document.createElement("a");
            a.href = res.url;
            a.download = `certificate-${certNumber}.pdf`;
            a.click();
          } else {
            toast.error(res.error ?? "Download failed.");
          }
          void utils.certificates.getMyCertificates.invalidate();
        },
        onError: (e) => {
          setDownloadingCertificateId(null);
          toast.error(e.message || "Download failed.");
        },
      }
    );
  };

  const handleDownloadCertificate = (
    certId: number,
    certNumber: string | null | undefined,
    courseTitle: string | null | undefined,
    programType: string
  ) => {
    if (!certNumber) {
      toast.error("Certificate is not yet issued. Check back after your payment is confirmed.");
      return;
    }
    const label = courseTitle?.trim() || programType.toUpperCase();
    setDownloadingCertificateId(certId);
    setFeedbackDialog({ certificateId: certId, certificateNumber: certNumber, courseLabel: label });
  };

  const renewalAttention = myCertificates.filter((c) => {
    const days = daysUntilExpiry(c.expiryDate);
    return days !== null && days <= 90;
  });

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [loading, user, setLocation]);

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading || !user || summaryQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-2xl mx-4">
          <CardHeader>
            <CardTitle>Loading your provider workspace…</CardTitle>
            <CardDescription>Checking courses, payments, and ResusGPS access.</CardDescription>
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

  // ── Error fallback ───────────────────────────────────────────────────────────
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
            <span className="inline-flex items-center gap-2"><GraduationCap className="h-4 w-4" />Open Fellowship</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between" onClick={() => setLocation("/aha-courses")}>
            <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4" />Open AHA Courses</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const { primaryAction, secondaryActions, stats, resusAccess } = summaryQuery.data;

  const recommendationReason =
    primaryAction.key === "resume_payment"
      ? "You already started an AHA enrollment — payment is the one blocker before learning continues."
      : primaryAction.key === "start_course"
        ? "You have a paid course ready to begin. Fastest progress is to enter learning directly."
        : primaryAction.key === "continue_learning"
          ? "You already started a course. Continuing it is the clearest path to completion."
          : primaryAction.key === "renew_resusgps"
            ? "Your ResusGPS access needs renewal before you can rely on it at the bedside."
            : "Your learning and payment items are clear — go straight into bedside guidance.";

  const statusHighlights = [
    {
      key: "aha",
      label:
        stats.unpaidAhaCount > 0
          ? `${stats.unpaidAhaCount} AHA payment${stats.unpaidAhaCount === 1 ? "" : "s"} pending`
          : "AHA enrollments clear",
    },
    {
      key: "ready",
      label:
        stats.paidNotStartedCount > 0
          ? `${stats.paidNotStartedCount} paid course${stats.paidNotStartedCount === 1 ? "" : "s"} ready`
          : "No courses waiting to start",
    },
    {
      key: "progress",
      label:
        stats.inProgressCount > 0
          ? `${stats.inProgressCount} course${stats.inProgressCount === 1 ? "" : "s"} in progress`
          : "No course in progress",
    },
    {
      key: "resus",
      label: stats.hasResusGpsAccess
        ? `ResusGPS active${resusAccess.expiresAt ? ` until ${new Date(resusAccess.expiresAt).toLocaleDateString()}` : ""}`
        : "ResusGPS not active",
    },
  ];

  const primaryIcon =
    primaryAction.key === "resume_payment" ? (
      <CreditCard className="h-4 w-4" />
    ) : primaryAction.key === "renew_resusgps" ? (
      <AlertTriangle className="h-4 w-4" />
    ) : primaryAction.key === "open_resusgps" ? (
      <Siren className="h-4 w-4" />
    ) : (
      <BookOpen className="h-4 w-4" />
    );

  const handlePrimaryAction = () => {
    if (primaryAction.key === "resume_payment") {
      track("provider_conversion", "provider_next_action_resume_payment_clicked", {
        source: "provider_home_summary",
        programType: primaryAction.programType,
        enrollmentId: primaryAction.enrollmentId,
      });
    } else if (primaryAction.key === "start_course") {
      track("provider_conversion", "provider_next_action_start_course_clicked", {
        source: "provider_home_summary",
        enrollmentId: primaryAction.enrollmentId,
        courseId: primaryAction.courseId,
        destination: primaryAction.destination,
      });
    } else if (primaryAction.key === "continue_learning") {
      track("provider_conversion", "provider_next_action_continue_learning_clicked", {
        source: "provider_home_summary",
        enrollmentId: primaryAction.enrollmentId,
        courseId: primaryAction.courseId,
        destination: primaryAction.destination,
      });
    } else if (primaryAction.key === "renew_resusgps") {
      track("provider_conversion", "provider_next_action_renew_resusgps_clicked", {
        source: "provider_home_summary",
      });
    } else {
      track("provider_conversion", "provider_next_action_open_resusgps_clicked", {
        source: "provider_home_summary",
      });
    }
    setLocation(primaryAction.destination);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Stethoscope className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">
              {user.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Provider workspace"}
            </h1>
            <p className="text-sm text-muted-foreground">Your clinical learning and bedside tools in one place</p>
          </div>
        </div>

        {/* ── Status badges ────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {statusHighlights.map((item) => (
            <Badge key={item.key} variant="secondary" className="font-normal">
              {item.label}
            </Badge>
          ))}
        </div>

        {/* ── Certificate renewal alert ────────────────────────────────────── */}
        {renewalAttention.length > 0 && (
          <Alert className="border-amber-200 bg-amber-50/80">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <AlertTitle className="text-amber-900">Certificate renewal needed</AlertTitle>
            <AlertDescription className="text-amber-900/90">
              {renewalAttention.length} certificate{renewalAttention.length > 1 ? "s" : ""} expire within 90 days or
              are already expired.
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" className="bg-amber-700 hover:bg-amber-800" onClick={() => setLocation("/enroll")}>
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

        {/* ── Recommended next step ────────────────────────────────────────── */}
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base inline-flex items-center gap-2">
              {primaryIcon}
              {primaryAction.title}
            </CardTitle>
            <CardDescription>{primaryAction.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <AlertTitle>Why this is your next step</AlertTitle>
              <AlertDescription>{recommendationReason}</AlertDescription>
            </Alert>
            <Button variant="cta" className="w-full justify-between" onClick={handlePrimaryAction}>
              {primaryAction.cta}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* ── Secondary actions ────────────────────────────────────────────── */}
        {secondaryActions.map((action) => (
          <Button
            key={action.key}
            variant={action.key === "open_fellowship" ? "secondary" : "outline"}
            className="w-full justify-between"
            onClick={() => {
              track(
                "provider_conversion",
                action.key === "open_fellowship" ? "provider_cta_open_fellowship" : "provider_cta_open_aha_hub",
                { source: "provider_home_summary" }
              );
              setLocation(action.destination);
            }}
          >
            <span className="inline-flex items-center gap-2">
              {action.key === "open_fellowship" ? (
                <GraduationCap className="h-4 w-4" />
              ) : (
                <BookOpen className="h-4 w-4" />
              )}
              {action.label}
            </span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ))}

        {/* ── Quick-access tool strip ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-auto flex-col gap-1 py-4"
            onClick={() => {
              track("provider_conversion", "provider_quick_access_resusgps", { source: "provider_home_quick_strip" });
              setLocation("/resus");
            }}
          >
            <Siren className="h-5 w-5 text-primary" />
            <span className="text-xs font-medium">ResusGPS</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-1 py-4"
            onClick={() => setLocation("/care-signal")}
          >
            <FileText className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-medium">Care Signal</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-1 py-4"
            onClick={() => setLocation("/fellowship")}
          >
            <GraduationCap className="h-5 w-5 text-violet-600" />
            <span className="text-xs font-medium">Fellowship</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-1 py-4"
            onClick={() => setLocation("/aha-courses")}
          >
            <BookOpen className="h-5 w-5 text-amber-600" />
            <span className="text-xs font-medium">AHA Courses</span>
          </Button>
        </div>

        {/* ── My Certificates ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-5 w-5" />
              My Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myCertificates.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  No certificates yet. Complete a course and payment to receive your certificate.
                </p>
                <Button variant="outline" size="sm" onClick={() => setLocation("/enroll")}>
                  Enroll in a course
                </Button>
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
                          <p
                            className={`text-xs font-medium mt-1 ${
                              days! < 0 ? "text-red-600" : "text-amber-700"
                            }`}
                          >
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
              </ul>
            )}
          </CardContent>
        </Card>

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
