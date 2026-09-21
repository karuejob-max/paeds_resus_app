import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Award, BookOpen, Building2, CheckCircle2, Clock3, Download, FileText, GraduationCap, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { CertificateDownloadFeedbackDialog } from "@/components/CertificateDownloadFeedbackDialog";
import { getLifeSupportCognitiveProgramType, isLifeSupportCertificateProgramType, LIFE_SUPPORT_COURSES, getLifeSupportProgressRecordLabel, type LifeSupportCourseKey } from "@shared/life-support-pathways";

function daysUntil(value: Date | string | null | undefined) {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;
  return Math.ceil((time - Date.now()) / 86_400_000);
}

type FeedbackState = { certificateId: number; sourceCertificateId: number; courseLabel: string } | null;
type RecordsTab = "aha" | "cpd" | "fellowship";

type PhaseRowProps = {
  label: string;
  description: string;
  complete: boolean;
  applicable?: boolean;
  certificate?: { id: number; certificateNumber: string | null };
  onDownload?: () => void;
  downloading?: boolean;
};

const certificatesPlaceholder = [] as Array<{
  id: number;
  certificateNumber: string | null;
  programType: string;
  courseTitle: string | null;
  issueDate: Date | string | null;
  expiryDate: Date | string | null;
}>;

const AHA_COURSES = [
  { key: "bls", label: "BLS", subtitle: "Basic Life Support" },
  { key: "acls", label: "ACLS", subtitle: "Advanced Cardiovascular Life Support" },
  { key: "pals", label: "PALS", subtitle: "Pediatric Advanced Life Support" },
  { key: "nrp", label: "NRP", subtitle: "Neonatal Resuscitation" },
  { key: "heartsaver", label: "Heartsaver", subtitle: "Heartsaver pathway" },
  { key: "instructor", label: "Instructor", subtitle: "Instructor development" },
] as const;

function StatusBadge({ complete, label }: { complete: boolean; label?: string }) {
  return complete ? (
    <Badge className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50">
      <CheckCircle2 className="h-3.5 w-3.5" /> {label ?? "Complete"}
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 border-slate-200 text-slate-500">
      <Clock3 className="h-3.5 w-3.5" /> Not recorded
    </Badge>
  );
}

function PhaseRow({ label, description, complete, applicable = true, certificate, onDownload, downloading }: PhaseRowProps) {
  return (
    <div className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${applicable ? "border-slate-200 bg-white" : "border-dashed border-slate-200 bg-slate-50"}`}>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {applicable ? <StatusBadge complete={complete} /> : <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-500">Not applicable</Badge>}
        {applicable && certificate?.certificateNumber && onDownload ? (
          <Button type="button" size="sm" variant="outline" disabled={downloading} onClick={onDownload}>
            <Download className="mr-1.5 h-4 w-4" /> {downloading ? "Preparing…" : "Download"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function ProviderRecords({ focusCertificates = false }: { focusCertificates?: boolean }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const certificatesQuery = trpc.certificates.getMyCertificates.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: 1,
  });
  const phaseStatusQuery = trpc.certificates.getPaedsResusCertificateStatus.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: 1,
  });
  const completionStatusQuery = trpc.completionRecords.getMyStatus.useQuery(undefined, {
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
  const [activeTab, setActiveTab] = useState<RecordsTab>("aha");
  const [selectedCourse, setSelectedCourse] = useState<LifeSupportCourseKey>("bls");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [feedbackState, setFeedbackState] = useState<FeedbackState>(null);
  const downloadCertificate = trpc.certificates.download.useMutation();
  const syncPaedsResusCertificates = trpc.certificates.syncPaedsResusCertificates.useMutation();
  const syncAttemptedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || certificatesQuery.isLoading || phaseStatusQuery.isLoading || completionStatusQuery.isLoading || syncAttemptedRef.current) return;
    const completedCoursesMissingPhase3 = LIFE_SUPPORT_COURSES.some((course) => {
      const hasLedgerPhase3 = (completionStatusQuery.data ?? []).some(
        (record) => record.courseProgramType === course.key && record.phase3Completed && !record.revokedAt,
      );
      const hasFinalProviderCertificate = (certificatesQuery.data?.certificates ?? []).some(
        (certificate) => certificate.programType === `paeds_resus_${course.key}_provider`,
      );
      const hasPhase3Certificate = (phaseStatusQuery.data ?? []).some(
        (certificate) => certificate.programType === `paeds_resus_${course.key}_phase3`,
      );
      return (hasLedgerPhase3 || hasFinalProviderCertificate) && !hasPhase3Certificate;
    });
    if (!completedCoursesMissingPhase3) return;
    syncAttemptedRef.current = true;
    syncPaedsResusCertificates.mutate(undefined, {
      onSuccess: () => {
        void phaseStatusQuery.refetch();
        void certificatesQuery.refetch();
      },
      onError: (error) => {
        syncAttemptedRef.current = false;
        console.error("Life Support certificate projection sync failed:", error);
      },
    });
  }, [certificatesQuery.data, certificatesQuery.isLoading, certificatesQuery.refetch, completionStatusQuery.data, completionStatusQuery.isLoading, isAuthenticated, phaseStatusQuery.data, phaseStatusQuery.isLoading, phaseStatusQuery.refetch, syncPaedsResusCertificates]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your records…
      </div>
    );
  }

  const certificates = certificatesQuery.data?.certificates ?? [];
  const phaseCertificates = phaseStatusQuery.data ?? [];
  const completionRecords = completionStatusQuery.data ?? [];
  const cpdRecords = cpdQuery.data?.records ?? [];
  const activeMemberships = (membershipsQuery.data ?? []).filter((membership) => membership.membershipStatus === "active");
  const selectedPathway = LIFE_SUPPORT_COURSES.find((course) => course.key === selectedCourse) ?? LIFE_SUPPORT_COURSES[0];
  const selectedCompletion = completionRecords.find((record) => record.courseProgramType === selectedCourse && !record.revokedAt);
  const phase2Certificate = phaseCertificates.find((certificate) => certificate.programType === `paeds_resus_${selectedCourse}_phase2`);
  const phase3Certificate = phaseCertificates.find((certificate) => certificate.programType === `paeds_resus_${selectedCourse}_phase3`);
  const providerCertificates = new Map<string, (typeof phaseCertificates)[number]>(phaseCertificates.filter((certificate) => certificate.programType.endsWith("_provider")).map((certificate) => [certificate.programType, certificate]));
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
  const ahaCertificates = certificates.filter((certificate) => isLifeSupportCertificateProgramType(certificate.programType));
  const fellowshipCertificates = certificates.filter((certificate) => ["fellowship", "fellowship_diploma"].includes(certificate.programType));

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-5 sm:py-7">
        <div className="flex items-start gap-3">
          <Button type="button" variant="ghost" size="icon" className="mt-0.5 shrink-0" aria-label="Back to Today" onClick={() => setLocation("/home")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Individual Platform</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">My Records</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">One place for your AHA certificates, CPD history, Fellowship progress, and downloadable completion evidence.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-emerald-200 bg-white p-4"><p className="text-2xl font-bold text-emerald-800">{ahaCertificates.length}</p><p className="mt-1 text-xs text-slate-500">AHA certificates</p></div>
          <div className="rounded-xl border border-blue-200 bg-white p-4"><p className="text-2xl font-bold text-blue-800">{cpdRecords.length}</p><p className="mt-1 text-xs text-slate-500">CPD records</p></div>
          <div className="rounded-xl border border-violet-200 bg-white p-4"><p className="text-2xl font-bold text-violet-800">{fellowshipCertificates.length}</p><p className="mt-1 text-xs text-slate-500">Fellowship records</p></div>
          <div className="rounded-xl border border-amber-200 bg-white p-4"><p className="text-2xl font-bold text-amber-800">{expiringCertificates.length}</p><p className="mt-1 text-xs text-slate-500">Need attention</p></div>
        </div>

        {expiringCertificates.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/70">
            <CardHeader className="pb-3"><CardTitle className="text-base text-amber-950">Certificate attention</CardTitle><CardDescription className="text-amber-900/75">One or more certificates expire within 90 days or have expired. Review the Life Support records tab before booking a renewal.</CardDescription></CardHeader>
            <CardContent><Button type="button" variant="outline" onClick={() => { setActiveTab("aha"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Review Life Support records <Award className="ml-2 h-4 w-4" /></Button></CardContent>
          </Card>
        )}

        <div role="tablist" aria-label="My records categories" className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {([
            { id: "aha", label: "My Life Support records", icon: Award, description: "Courses and phases" },
            { id: "cpd", label: "My CPD records", icon: FileText, description: "Sessions and points" },
            { id: "fellowship", label: "My Fellowship records", icon: GraduationCap, description: "Courses and diploma" },
          ] as const).map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return <button key={tab.id} type="button" role="tab" aria-selected={selected} className={`rounded-xl px-2 py-3 text-left transition ${selected ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`} onClick={() => setActiveTab(tab.id)}><span className="flex items-center gap-2 text-xs font-bold sm:text-sm"><Icon className="h-4 w-4 shrink-0" />{tab.label}</span><span className={`mt-1 hidden text-[11px] sm:block ${selected ? "text-slate-300" : "text-slate-400"}`}>{tab.description}</span></button>;
          })}
        </div>

        {activeTab === "aha" && (
          <section role="tabpanel" aria-label="My AHA records" className="space-y-4">
            <Card className="border-emerald-200 bg-white">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Award className="h-5 w-5 text-emerald-700" />Life Support course records</CardTitle><CardDescription>Choose a course to see its actual pathway. Supporting gatepass records are separate from the final provider certificate.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Life Support course records">
                  {LIFE_SUPPORT_COURSES.map((course) => <button key={course.key} type="button" role="tab" aria-selected={selectedCourse === course.key} onClick={() => setSelectedCourse(course.key)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${selectedCourse === course.key ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"}`}>{course.label}</button>)}
                </div>
                {(() => {
                  const cognitiveCertificate = certificates.find((certificate) => certificate.programType === getLifeSupportCognitiveProgramType(selectedCourse));
                  const finalCertificate = certificates.find((certificate) => certificate.programType === `paeds_resus_${selectedCourse}_provider`);
                  const providerStatus = providerCertificates.get(`paeds_resus_${selectedCourse}_provider`);
                  const phase3Complete = Boolean(selectedCompletion?.phase3Completed || phase3Certificate || finalCertificate || providerStatus);
                  const finalRecord = finalCertificate ?? (providerStatus ? certificates.find((certificate) => certificate.certificateNumber === providerStatus.certificateNumber) : undefined);
                  const phase1Complete = Boolean(cognitiveCertificate || finalRecord);
                  return <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"><div className="mb-3 flex items-start justify-between gap-3"><div><h3 className="text-base font-bold text-slate-950">{selectedPathway.label}</h3><p className="text-xs text-slate-500">{selectedPathway.subtitle}</p></div><Badge variant="outline" className="border-emerald-200 bg-white text-emerald-800">{finalRecord ? "Primary credential issued" : phase3Complete ? "Practical skills complete" : phase1Complete ? "Cognitive complete" : "In progress"}</Badge></div><div className="space-y-2">{selectedPathway.phases.map((phase) => { const certificate = phase.key === "phase1" ? cognitiveCertificate : phase.key === "phase2" ? phase2Certificate : phase.key === "phase3" ? phase3Certificate : finalRecord; const complete = phase.key === "phase1" ? phase1Complete : phase.key === "phase2" ? Boolean(selectedCompletion?.phase2Completed || phase2Certificate) : phase.key === "phase3" ? phase3Complete : Boolean(finalRecord); return <PhaseRow key={phase.key} label={phase.key === "phase1" || phase.key === "phase2" || phase.key === "phase3" ? getLifeSupportProgressRecordLabel(selectedCourse, phase.key) : phase.label} description={phase.description} applicable={phase.applicable} complete={complete} certificate={certificate} downloading={downloadingId === certificate?.id} onDownload={certificate ? () => handleDownload(certificate as (typeof certificates)[number]) : undefined} />; })}</div>{finalRecord ? <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-900">Primary credential: use the final provider certificate for employment or professional verification. Earlier phase records are supporting pathway evidence only.</p> : null}</div>;
                })()}
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-slate-900">Need the full certificate list?</p><p className="text-xs text-slate-500">Open the existing certificate library for verification and downloads.</p></div><Button type="button" variant="outline" onClick={() => setLocation("/certificates")}>Open certificate library <span className="ml-2">→</span></Button></CardContent></Card>
          </section>
        )}

        {activeTab === "cpd" && (
          <section role="tabpanel" aria-label="My CPD records" className="space-y-4">
            <Card className="border-blue-200 bg-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5 text-blue-700" />CPD attendance and certificates</CardTitle><CardDescription>Your sessions, approved points, councils, facilities, and downloadable CPD certificates.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-blue-50 p-3"><p className="text-2xl font-bold text-blue-800">{cpdRecords.length}</p><p className="text-xs text-blue-700">Sessions recorded</p></div><div className="rounded-xl bg-cyan-50 p-3"><p className="text-2xl font-bold text-cyan-800">{cpdRecords.reduce((total, record) => total + (Number(record.cpdPoints) || 0), 0)}</p><p className="text-xs text-cyan-700">Approved points</p></div><div className="rounded-xl bg-slate-100 p-3"><p className="text-2xl font-bold text-slate-800">{new Set(cpdRecords.map((record) => record.institutionName).filter(Boolean)).size}</p><p className="text-xs text-slate-600">Facilities represented</p></div></div>{cpdRecords.length > 0 ? <div className="space-y-2">{cpdRecords.slice(0, 5).map((record) => <div key={record.attendeeId} className="rounded-xl border border-blue-100 p-3"><div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-slate-900">{record.eventName}</p><p className="text-xs text-slate-500">{record.institutionName} · {record.eventDate}</p></div><Badge variant="outline" className="w-fit border-blue-200 text-blue-800">{record.cpdPoints ? `${record.cpdPoints} pts` : "Points pending"}</Badge></div></div>)}</div> : <p className="rounded-xl border border-dashed border-blue-200 bg-blue-50/30 p-4 text-sm text-slate-500">No CPD records are available yet.</p>}<Button type="button" className="w-full justify-between" variant="outline" onClick={() => setLocation("/my-cpd-certificates")}>Open full CPD records <span>→</span></Button></CardContent></Card>
          </section>
        )}

        {activeTab === "fellowship" && (
          <section role="tabpanel" aria-label="My Fellowship records" className="space-y-4">
            <Card className="border-violet-200 bg-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-5 w-5 text-violet-700" />Fellowship learning records</CardTitle><CardDescription>Micro-course certificates and the overall Fellowship diploma are kept together here.</CardDescription></CardHeader><CardContent className="space-y-3">{fellowshipCertificates.length > 0 ? <div className="space-y-2">{fellowshipCertificates.map((certificate) => <div key={certificate.id} className="flex flex-col gap-3 rounded-xl border border-violet-100 bg-violet-50/30 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-slate-900">{certificate.programType === "fellowship_diploma" ? "Fellowship diploma" : certificate.courseTitle ?? "Fellowship micro-course"}</p><p className="mt-1 text-xs text-slate-500">Issued {certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString() : "date unavailable"}</p></div><Button type="button" size="sm" variant="outline" disabled={!certificate.certificateNumber || downloadingId === certificate.id} onClick={() => handleDownload(certificate)}><Download className="mr-1.5 h-4 w-4" />{downloadingId === certificate.id ? "Preparing…" : "Download"}</Button></div>)}</div> : <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/30 p-4 text-sm text-slate-500">No Fellowship certificates are recorded yet. Your completed micro-courses and overall diploma will appear here.</div>}<Button type="button" className="w-full justify-between" variant="outline" onClick={() => setLocation("/fellowship/progress")}><BookOpen className="mr-2 h-4 w-4" />Open Fellowship progress <span className="ml-auto">→</span></Button></CardContent></Card>
          </section>
        )}

        <Card className="border-teal-200 bg-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-5 w-5 text-teal-700" />Workplace relationships</CardTitle><CardDescription>Facility membership is kept separate from learning records and certificates.</CardDescription></CardHeader><CardContent className="space-y-2">{activeMemberships.length > 0 ? activeMemberships.map((membership) => <div key={membership.id} className="rounded-lg border border-teal-100 p-3"><p className="text-sm font-medium text-slate-900">{membership.companyName}</p><p className="mt-1 text-xs text-slate-500">{[membership.department, membership.staffRole, membership.responsibilityRole].filter(Boolean).join(" · ") || "Active institutional membership"}</p></div>) : <p className="text-sm text-slate-500">No active facility relationship is linked yet.</p>}<Button type="button" variant="outline" className="w-full justify-between" onClick={() => setLocation("/workplaces")}>Open Workplaces &amp; access <span>→</span></Button></CardContent></Card>

        <Card className="border-slate-200 bg-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserRound className="h-5 w-5 text-slate-700" />Identity and access</CardTitle><CardDescription>Professional identity belongs in your profile; account security belongs in Account.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setLocation("/provider-profile")}>Professional profile</Button><Button type="button" variant="outline" onClick={() => setLocation("/account")}>Account &amp; security</Button></CardContent></Card>
      </div>
      {feedbackState ? <CertificateDownloadFeedbackDialog open={true} onOpenChange={(open) => { if (!open) setFeedbackState(null); }} certificateId={feedbackState.certificateId} courseLabel={feedbackState.courseLabel} onFeedbackSaved={() => { const sourceCertificateId = feedbackState.sourceCertificateId; setFeedbackState(null); const certificate = certificates.find((item) => item.id === sourceCertificateId); if (certificate) handleDownload(certificate); }} /> : null}
    </div>
  );
}
