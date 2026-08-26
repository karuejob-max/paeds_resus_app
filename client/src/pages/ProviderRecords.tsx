import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Award, Building2, Download, FileText, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { CertificateDownloadFeedbackDialog } from "@/components/CertificateDownloadFeedbackDialog";

function daysUntil(value: Date | string | null | undefined) {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;
  return Math.ceil((time - Date.now()) / 86_400_000);
}

type FeedbackState = { certificateId: number; sourceCertificateId: number; courseLabel: string } | null;

export default function ProviderRecords({ focusCertificates = false }: { focusCertificates?: boolean }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const certificatesQuery = trpc.certificates.getMyCertificates.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: 1,
  });
  const cpdQuery = trpc.cpd.myCertificates.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: 1,
  });
  const membershipsQuery = trpc.institution.getMyMemberships.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: 1,
  });
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [feedbackState, setFeedbackState] = useState<FeedbackState>(null);
  const downloadCertificate = trpc.certificates.download.useMutation();

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your records…
      </div>
    );
  }

  const certificates = certificatesQuery.data?.certificates ?? [];
  const cpdRecords = cpdQuery.data?.records ?? [];
  const activeMemberships = (membershipsQuery.data ?? []).filter((membership) => membership.membershipStatus === "active");
  const triggerBrowserDownload = (pdfBase64: string, filename: string) => {
    try {
      const bytes = atob(pdfBase64);
      const byteArray = new Uint8Array(bytes.length);
      for (let index = 0; index < bytes.length; index += 1) byteArray[index] = bytes.charCodeAt(index);
      const url = URL.createObjectURL(new Blob([byteArray], { type: "application/pdf" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Certificate downloaded successfully.");
    } catch (error) {
      console.error("Certificate download processing error:", error);
      toast.error("Failed to process certificate file.");
    }
  };

  const handleDownload = (certificate: (typeof certificates)[number]) => {
    if (!certificate.certificateNumber) {
      toast.error("Certificate is not yet issued. Complete the course to receive your certificate.");
      return;
    }
    setDownloadingId(certificate.id);
    downloadCertificate.mutate(
      { certificateNumber: certificate.certificateNumber },
      {
        onSuccess: (result) => {
          setDownloadingId(null);
          if (result.success && (result as { pdfBase64?: string }).pdfBase64) {
            triggerBrowserDownload((result as { pdfBase64: string; filename?: string }).pdfBase64, (result as { filename?: string }).filename ?? `certificate-${certificate.certificateNumber}.pdf`);
          } else if ((result as { error?: string }).error === "feedback_required") {
            setFeedbackState({ certificateId: (result as { certificateId?: number }).certificateId ?? certificate.id, sourceCertificateId: certificate.id, courseLabel: certificate.courseTitle ?? certificate.programType });
          } else {
            toast.error((result as { error?: string }).error ?? "Download failed. Please try again.");
          }
        },
        onError: (error) => {
          setDownloadingId(null);
          toast.error(error.message || "Download failed. Please try again.");
        },
      },
    );
  };

  const expiringCertificates = certificates.filter((certificate) => {
    const days = daysUntil(certificate.expiryDate);
    return days !== null && days <= 90;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-5 sm:py-7">
        <div className="flex items-start gap-3">
          <Button type="button" variant="ghost" size="icon" className="mt-0.5 shrink-0" aria-label="Back to Today" onClick={() => setLocation("/home")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Individual Platform</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">My Records</h1>
            <p className="mt-1 text-sm text-slate-500">Your professional evidence, certificates, and facility relationships.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-blue-200 bg-white p-4"><p className="text-2xl font-bold text-blue-800">{cpdRecords.length}</p><p className="mt-1 text-xs text-slate-500">CPD records</p></div>
          <div className="rounded-xl border border-emerald-200 bg-white p-4"><p className="text-2xl font-bold text-emerald-800">{certificates.length}</p><p className="mt-1 text-xs text-slate-500">Certificates</p></div>
          <div className="rounded-xl border border-teal-200 bg-white p-4"><p className="text-2xl font-bold text-teal-800">{activeMemberships.length}</p><p className="mt-1 text-xs text-slate-500">Active facilities</p></div>
          <div className="rounded-xl border border-amber-200 bg-white p-4"><p className="text-2xl font-bold text-amber-800">{expiringCertificates.length}</p><p className="mt-1 text-xs text-slate-500">Need attention</p></div>
        </div>

        {expiringCertificates.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/70">
            <CardHeader className="pb-3"><CardTitle className="text-base text-amber-950">Certificate attention</CardTitle><CardDescription className="text-amber-900/75">One or more certificates expire within 90 days or have expired. Open the certificate list before booking a renewal.</CardDescription></CardHeader>
            <CardContent><Button type="button" variant="outline" onClick={() => setLocation("/certificates")}>Review certificates <Award className="ml-2 h-4 w-4" /></Button></CardContent>
          </Card>
        )}

        <Card className="border-emerald-200 bg-white">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Award className="h-5 w-5 text-emerald-700" />{focusCertificates ? "My Certificates" : "Certificates"}</CardTitle><CardDescription>AHA and Fellowship certificates are separate from CPD attendance records.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {certificates.length > 0 ? (
              <div className="space-y-2">
                {certificates.slice(0, 5).map((certificate) => {
                  const days = daysUntil(certificate.expiryDate);
                  return <div key={certificate.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{certificate.courseTitle ?? certificate.programType ?? "Certificate"}</p><p className="text-xs text-slate-500">Issued {certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString() : "date unavailable"}{certificate.expiryDate ? ` · Expires ${new Date(certificate.expiryDate).toLocaleDateString()}` : ""}</p>{days !== null && days <= 90 ? <Badge variant="outline" className="mt-1 border-amber-200 text-amber-800">{days < 0 ? "Expired" : `Expires in ${days} days`}</Badge> : null}</div><Button type="button" size="sm" variant="outline" disabled={!certificate.certificateNumber || downloadingId === certificate.id} onClick={() => handleDownload(certificate)}><Download className="mr-2 h-4 w-4" />{downloadingId === certificate.id ? "Preparing…" : "Download"}</Button></div>;
                })}
              </div>
            ) : <p className="text-sm text-slate-500">No AHA or Fellowship certificates are recorded yet.</p>}
            <Button type="button" variant="outline" className="w-full justify-between" onClick={() => setLocation("/certificates")}>View all certificates <ArrowRightIcon /></Button>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-white">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5 text-blue-700" />CPD record</CardTitle><CardDescription>Your CPD attendance and certificate history, including facility and department details where recorded.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {cpdRecords.length > 0 ? <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3 text-sm text-slate-700">{cpdRecords.length} CPD record{cpdRecords.length === 1 ? "" : "s"} available. Open the CPD record to review points, councils, events, and downloads.</div> : <p className="text-sm text-slate-500">No CPD records are available yet.</p>}
            <Button type="button" variant="outline" className="w-full justify-between" onClick={() => setLocation("/my-cpd-certificates")}>Open CPD record <ArrowRightIcon /></Button>
          </CardContent>
        </Card>

        <Card className="border-teal-200 bg-white">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-5 w-5 text-teal-700" />Workplace relationships</CardTitle><CardDescription>Requests and institution memberships are managed in one dedicated access surface so facility context is not confused with professional evidence.</CardDescription></CardHeader>
          <CardContent><Button type="button" variant="outline" className="w-full justify-between" onClick={() => setLocation("/workplaces")}>Open Workplaces &amp; access <ArrowRightIcon /></Button></CardContent>
        </Card>

        <Card className="border-teal-200 bg-white">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-5 w-5 text-teal-700" />Current facility memberships</CardTitle><CardDescription>Review the hospitals linked to your account. Facility membership does not automatically create an IERS duty.</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {activeMemberships.length > 0 ? activeMemberships.map((membership) => <div key={membership.id} className="rounded-lg border border-teal-100 p-3"><p className="text-sm font-medium text-slate-900">{membership.companyName}</p><p className="mt-1 text-xs text-slate-500">{[membership.department, membership.staffRole, membership.responsibilityRole].filter(Boolean).join(" · ") || "Active institutional membership"}</p></div>) : <p className="text-sm text-slate-500">No active facility relationship is linked yet.</p>}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserRound className="h-5 w-5 text-slate-700" />Identity and access</CardTitle><CardDescription>Professional identity belongs in your profile; sign-in identity and security belong in Account &amp; security.</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setLocation("/provider-profile")}>Professional profile</Button><Button type="button" variant="outline" onClick={() => setLocation("/workplaces")}>Workplaces &amp; access</Button><Button type="button" variant="outline" onClick={() => setLocation("/account")}>Account &amp; security</Button></CardContent>
        </Card>
      </div>
      {feedbackState ? <CertificateDownloadFeedbackDialog open={true} onOpenChange={(open) => { if (!open) setFeedbackState(null); }} certificateId={feedbackState.certificateId} courseLabel={feedbackState.courseLabel} onFeedbackSaved={() => { const sourceCertificateId = feedbackState.sourceCertificateId; setFeedbackState(null); const certificate = certificates.find((item) => item.id === sourceCertificateId); if (certificate) handleDownload(certificate); }} /> : null}
    </div>
  );
}

function ArrowRightIcon() {
  return <span aria-hidden="true">→</span>;
}
