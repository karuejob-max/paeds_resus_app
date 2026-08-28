import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileCheck2,
  Loader2,
  Search,
  ShieldCheck,
  XCircle,
  PlusCircle,
  UserPlus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

const DRAFT_SUBJECT = "A practical six-month path to AHA ACLS certification";
const DRAFT_BODY = `Hello [First Name],\n\nIf AHA ACLS is part of your professional development plan, Paeds Resus has introduced a flexible Lipa Mdogo Mdogo option at KSh 2,500 per month for six months.\n\nThe guided pathway checks your BLS cognitive completion first. If BLS cognitive is not yet complete, you will complete that step before continuing to the ACLS cognitive pathway. On successful completion of the programme requirements, you will receive your AHA ACLS certification, together with a free Paeds Resus BLS Certificate.\n\nLearn more and check the next steps: https://www.paedsresus.com/programs/nerp-acls/start\n\nThis opportunity is optional and is not an institutional performance assessment.\n\nQuestions or clarification? Call 0706781260 or email paedsresus254@gmail.com. If you would prefer not to receive programme updates, use the recipient-specific unsubscribe link in the email.\n\nRegards,\nPaeds Resus`;

const phases = [
  { key: "phase_2" as const, label: "Phase 2 · Online simulations" },
  { key: "phase_3" as const, label: "Phase 3 · Hands-on completion" },
];

type FormState = {
  completedAt: string;
  evidenceNote: string;
  evidenceReference: string;
  reason: string;
};

function emptyForm(): FormState {
  return {
    completedAt: "",
    evidenceNote: "",
    evidenceReference: "",
    reason: "",
  };
}

export default function AdminNerpVerification() {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [forms, setForms] = useState<Record<string, FormState>>({});
  const utils = trpc.useUtils();
  const queue = trpc.nerp.getAdminVerificationQueue.useQuery({
    search: submittedSearch || undefined,
    limit: 100,
  });
  const preview = trpc.nerpCampaigns.previewAudience.useQuery({
    institutionId: 3,
    limit: 200,
  });
  const externalQueue = trpc.nerp.getExternalVerificationQueue.useQuery({
    institutionalAccountId: 3,
    search: submittedSearch || undefined,
    limit: 100,
  });
  const suppressions = trpc.nerp.listCampaignSuppressions.useQuery({
    institutionalAccountId: 3,
    includeInactive: false,
  });
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [approvalConfirmation, setApprovalConfirmation] = useState("");
  const [sendConfirmation, setSendConfirmation] = useState("");
  const campaignStatus = trpc.nerpCampaigns.getStatus.useQuery(undefined, { retry: false });
  const campaigns = trpc.nerpCampaigns.list.useQuery(undefined, { retry: false });
  const campaign = trpc.nerpCampaigns.getCampaign.useQuery(
    { campaignId: campaignId ?? 0 },
    { enabled: campaignId !== null, retry: false }
  );
  const createCampaignDraft = trpc.nerpCampaigns.createDraft.useMutation({
    onSuccess: async result => {
      if (result.campaign?.id) setCampaignId(result.campaign.id);
      await campaigns.refetch();
    },
  });
  const approveCampaign = trpc.nerpCampaigns.approveSnapshot.useMutation({
    onSuccess: async () => {
      setApprovalConfirmation("");
      await Promise.all([campaign.refetch(), campaigns.refetch(), preview.refetch()]);
    },
  });
  const sendCampaign = trpc.nerpCampaigns.sendApproved.useMutation({
    onSuccess: async () => {
      setSendConfirmation("");
      await Promise.all([campaign.refetch(), campaigns.refetch(), preview.refetch()]);
    },
  });
  useEffect(() => {
    if (campaignId === null && campaigns.data?.[0]?.id) setCampaignId(campaigns.data[0].id);
  }, [campaignId, campaigns.data]);
  const [externalCandidateType, setExternalCandidateType] = useState<"nerp_nurse" | "non_nurse_external">("nerp_nurse");
  const [externalCandidateName, setExternalCandidateName] = useState("");
  const [externalCandidateEmail, setExternalCandidateEmail] = useState("");
  const [externalCandidateCadre, setExternalCandidateCadre] = useState("");
  const [externalProviderName, setExternalProviderName] = useState("");
  const [externalCertificateReference, setExternalCertificateReference] = useState("");
  const [externalSourceType, setExternalSourceType] = useState<"external_provider_certificate" | "employer_record" | "manual_admin_attestation" | "other">("external_provider_certificate");
  const [externalCaseNote, setExternalCaseNote] = useState("");
  const [externalForms, setExternalForms] = useState<Record<string, FormState>>({});
  const [suppressionMatchType, setSuppressionMatchType] = useState<"email" | "exact_name">("email");
  const [suppressionMatchValue, setSuppressionMatchValue] = useState("");
  const [suppressionReasonCode, setSuppressionReasonCode] = useState<"admin_nurse" | "external_completion" | "manual" | "not_registered" | "identity_correction">("manual");
  const [suppressionNote, setSuppressionNote] = useState("");
  const createLedger = trpc.nerp.createVerificationLedger.useMutation({
    onSuccess: async () => {
      await utils.nerp.getAdminVerificationQueue.invalidate();
    },
  });
  const review = trpc.nerp.reviewExternalPhase.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.nerp.getAdminVerificationQueue.invalidate(),
        utils.nerpCampaigns.previewAudience.invalidate(),
      ]);
    },
  });
  const createExternalCase = trpc.nerp.createExternalVerificationCase.useMutation({
    onSuccess: async () => {
      setExternalCandidateType("nerp_nurse");
      setExternalCandidateName("");
      setExternalCandidateEmail("");
      setExternalCandidateCadre("");
      setExternalProviderName("");
      setExternalCertificateReference("");
      setExternalCaseNote("");
      await utils.nerp.getExternalVerificationQueue.invalidate();
    },
  });
  const reviewExternalCase = trpc.nerp.reviewExternalCasePhase.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.nerp.getExternalVerificationQueue.invalidate(),
        utils.nerpCampaigns.previewAudience.invalidate(),
        utils.nerp.listCampaignSuppressions.invalidate(),
      ]);
    },
  });
  const upsertSuppression = trpc.nerp.upsertCampaignSuppression.useMutation({
    onSuccess: async () => {
      setSuppressionMatchValue("");
      setSuppressionNote("");
      await Promise.all([
        utils.nerp.listCampaignSuppressions.invalidate(),
        utils.nerpCampaigns.previewAudience.invalidate(),
      ]);
    },
  });
  const deactivateSuppression = trpc.nerp.deactivateCampaignSuppression.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.nerp.listCampaignSuppressions.invalidate(),
        utils.nerpCampaigns.previewAudience.invalidate(),
      ]);
    },
  });
  const getForm = (offerId: number, phase: string) =>
    forms[`${offerId}:${phase}`] ?? emptyForm();
  const updateForm = (
    offerId: number,
    phase: string,
    patch: Partial<FormState>
  ) => {
    const key = `${offerId}:${phase}`;
    setForms(current => ({
      ...current,
      [key]: { ...getForm(offerId, phase), ...patch },
    }));
  };
  const getExternalForm = (caseId: number, phase: string) =>
    externalForms[`${caseId}:${phase}`] ?? emptyForm();
  const updateExternalForm = (
    caseId: number,
    phase: string,
    patch: Partial<FormState>
  ) => {
    const key = `${caseId}:${phase}`;
    setExternalForms(current => ({
      ...current,
      [key]: { ...getExternalForm(caseId, phase), ...patch },
    }));
  };
  const submitExternal = (
    caseId: number,
    phase: "phase_2" | "phase_3",
    decision: "verified" | "rejected" | "revoked"
  ) => {
    const form = getExternalForm(caseId, phase);
    if (!form.reason.trim() || (decision === "verified" && (!form.completedAt || !form.evidenceNote.trim()))) return;
    reviewExternalCase.mutate({
      caseId,
      phase,
      decision,
      completedAt: decision === "verified" ? form.completedAt : undefined,
      evidenceNote: decision === "verified" ? form.evidenceNote : undefined,
      evidenceReference: form.evidenceReference || undefined,
      reason: form.reason,
    });
  };

  const submit = (
    offerId: number,
    phase: "phase_2" | "phase_3",
    decision: "verified" | "revoked"
  ) => {
    const form = getForm(offerId, phase);
    if (
      !form.reason.trim() ||
      (decision === "verified" &&
        (!form.completedAt || !form.evidenceNote.trim()))
    )
      return;
    review.mutate({
      offerEnrollmentId: offerId,
      phase,
      decision,
      completedAt: decision === "verified" ? form.completedAt : undefined,
      evidenceNote: decision === "verified" ? form.evidenceNote : undefined,
      evidenceReference: form.evidenceReference || undefined,
      reason: form.reason,
    });
  };

  const downloadableRows = useMemo(
    () => preview.data?.recipients.filter(row => row.sendable) ?? [],
    [preview.data]
  );
  const downloadCsv = () => {
    const header = [
      "name",
      "email",
      "department",
      "promotion_status",
      "suppression_reason",
    ];
    const lines = [
      header.join(","),
      ...downloadableRows.map(row =>
        [
          row.name,
          row.email,
          row.department ?? "",
          row.promotionStatus,
          row.suppressionReason ?? "",
        ]
          .map(value => `"${String(value).replaceAll('"', '""')}"`)
          .join(",")
      ),
    ];
    const url = URL.createObjectURL(
      new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "institution-3-nerp-nurse-draft-recipients.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              NERP verification and campaign controls
            </h1>
            <p className="text-sm text-muted-foreground">
              Global Admin only · verify external phases, preserve an audit
              trail, and preview—not send—promotional recipients.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>External completion verification</CardTitle>
            <CardDescription>
              Verify Phase 2 and Phase 3 separately. A verified decision
              requires a completion date, evidence note, reason, and your admin
              identity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form
              className="flex gap-2"
              onSubmit={event => {
                event.preventDefault();
                setSubmittedSearch(search.trim());
              }}
            >
              <Input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search staff name or email"
                className="max-w-md"
              />
              <Button type="submit" variant="outline">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </form>
            {queue.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading NERP ledgers…
              </div>
            ) : null}
            {queue.isError ? (
              <div className="flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                {queue.error.message}
              </div>
            ) : null}
            {!queue.isLoading && !queue.data?.length ? (
              <p className="text-sm text-muted-foreground">
                No NERP offer enrollments matched. An offer ledger is created
                when a learner starts the authenticated pathway.
              </p>
            ) : null}
            <div className="space-y-4">
              {queue.data?.map(record => {
                const phaseStatus = record.verifications;
                return (
                  <Card key={record.staff.id} className="border-slate-200">
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">
                            {record.staff.staffName}
                          </CardTitle>
                          <CardDescription>
                            {record.staff.staffEmail} ·{" "}
                            {record.staff.department ??
                              "Department not recorded"}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            record.pathwayComplete ? "default" : "outline"
                          }
                        >
                          {record.pathwayComplete
                            ? "Pathway complete"
                            : "Verification in progress"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {record.offer
                          ? `Payment ledger: KES ${Number(record.offer.amountPaidKes).toLocaleString()} of KES ${Number(record.offer.totalAmountKes).toLocaleString()}`
                          : "No NERP offer ledger yet"}{" "}
                        · Existing phase status:{" "}
                        {record.staff.phaseStatus ?? "phase_1"}
                      </p>
                      {!record.offer ? (
                        <div className="rounded-lg border border-dashed p-4">
                          <p className="text-sm text-muted-foreground">
                            This staff record shows NERP-related activity but
                            has no offer ledger. Create a review ledger only
                            when you are ready to assess external Phase 2/3
                            evidence.
                          </p>
                          <Button
                            type="button"
                            className="mt-3"
                            onClick={() =>
                              createLedger.mutate({
                                userId: record.staff.userId!,
                              })
                            }
                            disabled={createLedger.isPending}
                          >
                            <FileCheck2 className="mr-2 h-4 w-4" />
                            Create review ledger
                          </Button>
                        </div>
                      ) : null}
                      {record.offer ? (
                        <div className="grid gap-4 lg:grid-cols-2">
                          {phases.map(phase => {
                            const current = phaseStatus.find(
                              (row: (typeof phaseStatus)[number]) =>
                                row.phase === phase.key
                            );
                            const form = getForm(record.offer.id, phase.key);
                            const verified = current?.status === "verified";
                            return (
                              <div
                                key={phase.key}
                                className="rounded-lg border p-4 space-y-3"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-medium">{phase.label}</p>
                                  {verified ? (
                                    <Badge className="bg-emerald-600">
                                      <CheckCircle2 className="mr-1 h-3 w-3" />
                                      Verified
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">
                                      {current?.status ?? "Not reviewed"}
                                    </Badge>
                                  )}
                                </div>
                                {current?.reviewReason ? (
                                  <p className="text-xs text-muted-foreground">
                                    Last review: {current.reviewReason}
                                  </p>
                                ) : null}
                                {!verified ? (
                                  <>
                                    <Input
                                      type="date"
                                      value={form.completedAt}
                                      onChange={event =>
                                        updateForm(record.offer.id, phase.key, {
                                          completedAt: event.target.value,
                                        })
                                      }
                                      aria-label={`${phase.label} completion date`}
                                    />
                                    <Input
                                      value={form.evidenceNote}
                                      onChange={event =>
                                        updateForm(record.offer.id, phase.key, {
                                          evidenceNote: event.target.value,
                                        })
                                      }
                                      placeholder="Evidence note (required to verify)"
                                    />
                                    <Input
                                      value={form.evidenceReference}
                                      onChange={event =>
                                        updateForm(record.offer.id, phase.key, {
                                          evidenceReference: event.target.value,
                                        })
                                      }
                                      placeholder="Certificate or record reference (optional)"
                                    />
                                    <Input
                                      value={form.reason}
                                      onChange={event =>
                                        updateForm(record.offer.id, phase.key, {
                                          reason: event.target.value,
                                        })
                                      }
                                      placeholder="Admin review reason (required)"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() =>
                                          submit(
                                            record.offer.id,
                                            phase.key,
                                            "verified"
                                          )
                                        }
                                        disabled={review.isPending}
                                      >
                                        <FileCheck2 className="mr-1 h-4 w-4" />
                                        Verify phase
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          submit(
                                            record.offer.id,
                                            phase.key,
                                            "revoked"
                                          )
                                        }
                                        disabled={review.isPending}
                                      >
                                        <XCircle className="mr-1 h-4 w-4" />
                                        Reject
                                      </Button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-xs text-emerald-800">
                                      This phase contributes to NERP completion
                                      and campaign suppression. Revoke it if the
                                      evidence was entered incorrectly.
                                    </p>
                                    <Input
                                      value={form.reason}
                                      onChange={event =>
                                        updateForm(record.offer.id, phase.key, {
                                          reason: event.target.value,
                                        })
                                      }
                                      placeholder="Reason for revocation (required)"
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        submit(
                                          record.offer.id,
                                          phase.key,
                                          "revoked"
                                        )
                                      }
                                      disabled={review.isPending}
                                    >
                                      Revoke verification
                                    </Button>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlusCircle className="h-5 w-5 text-blue-700" />
                    Verify training completed outside Paeds Resus pathways
                  </CardTitle>
                  <CardDescription>
                    Choose whether the candidate is a nurse being reviewed for NERP or a
                    non-nurse with outside-pathway completion. A case does not create a
                    NERP offer, payment record, institutional membership, or IERS access.
                  </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={event => {
                event.preventDefault();
                if (!externalCandidateName.trim()) return;
                createExternalCase.mutate({
                  institutionalAccountId: 3,
                  candidateType: externalCandidateType,
                  candidateCadre: externalCandidateCadre.trim() || undefined,
                  candidateName: externalCandidateName,
                  candidateEmail: externalCandidateEmail.trim() || undefined,
                  providerName: externalProviderName.trim() || undefined,
                  certificateReference: externalCertificateReference.trim() || undefined,
                  sourceType: externalSourceType,
                  caseNote: externalCaseNote.trim() || undefined,
                });
              }}
            >
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={externalCandidateType}
                onChange={event => setExternalCandidateType(event.target.value as typeof externalCandidateType)}
                aria-label="External candidate type"
              >
                <option value="nerp_nurse">Nurse — NERP external completion</option>
                <option value="non_nurse_external">Non-nurse — outside-pathway completion</option>
              </select>
              <Input
                value={externalCandidateName}
                onChange={event => setExternalCandidateName(event.target.value)}
                placeholder="Candidate full name"
                aria-label="External candidate full name"
              />
              <Input
                type="email"
                value={externalCandidateEmail}
                onChange={event => setExternalCandidateEmail(event.target.value)}
                placeholder="Candidate email (optional for an unregistered person)"
                aria-label="External candidate email"
              />
              {externalCandidateType === "non_nurse_external" ? (
                <Input
                  value={externalCandidateCadre}
                  onChange={event => setExternalCandidateCadre(event.target.value)}
                  placeholder="Candidate cadre, e.g. doctor, paramedic, midwife"
                  aria-label="External non-nurse candidate cadre"
                />
              ) : null}
              <Input
                value={externalProviderName}
                onChange={event => setExternalProviderName(event.target.value)}
                placeholder="Training provider or institution"
                aria-label="External training provider"
              />
              <Input
                value={externalCertificateReference}
                onChange={event => setExternalCertificateReference(event.target.value)}
                placeholder="Certificate or record reference (optional)"
                aria-label="External certificate reference"
              />
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={externalSourceType}
                onChange={event => setExternalSourceType(event.target.value as typeof externalSourceType)}
                aria-label="External evidence source"
              >
                <option value="external_provider_certificate">External provider certificate</option>
                <option value="employer_record">Employer training record</option>
                <option value="manual_admin_attestation">Manual admin attestation</option>
                <option value="other">Other evidence</option>
              </select>
              <textarea
                className="min-h-10 rounded-md border bg-background px-3 py-2 text-sm"
                value={externalCaseNote}
                onChange={event => setExternalCaseNote(event.target.value)}
                placeholder="Case note (optional)"
                aria-label="External verification case note"
              />
              <div className="md:col-span-2">
                <Button type="submit" disabled={!externalCandidateName.trim() || createExternalCase.isPending}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {createExternalCase.isPending ? "Creating review case…" : "Create external review case"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>External completion review queue</CardTitle>
            <CardDescription>
              Review Phase 2 and Phase 3 separately. Nurse cases are eligible for
              NERP completion/suppression rules; non-nurse cases are tracked as
              outside-pathway completions and never enter the NERP nurse audience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {externalQueue.isLoading ? <p className="text-sm text-muted-foreground">Loading external review cases…</p> : null}
            {externalQueue.isError ? <p className="text-sm text-red-700">{externalQueue.error.message}</p> : null}
            {!externalQueue.isLoading && !externalQueue.data?.length ? <p className="text-sm text-muted-foreground">No external completion cases yet.</p> : null}
            {externalQueue.data?.map(record => (
              <Card key={record.id} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{record.candidateName}</CardTitle>
                      <CardDescription>
                        {record.candidateEmail || "No email / not registered"}
                        {record.userId ? " · Linked account" : " · No platform account linked"}
                        {record.candidateType === "non_nurse_external" ? " · Non-nurse outside pathway" : " · NERP nurse"}
                        {record.candidateCadre ? ` · ${record.candidateCadre}` : ""}
                        {record.providerName ? ` · ${record.providerName}` : ""}
                      </CardDescription>
                    </div>
                    <Badge variant={record.status === "complete" ? "default" : "outline"}>{record.status.replaceAll("_", " ")}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">Case {record.caseKey}{record.certificateReference ? ` · Reference ${record.certificateReference}` : ""}</p>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {phases.map(phase => {
                      const current = record.phases.find(row => row.phase === phase.key);
                      const verified = current?.status === "verified";
                      const form = getExternalForm(record.id, phase.key);
                      return (
                        <div key={phase.key} className="space-y-3 rounded-lg border p-4">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">{phase.label}</p>
                            <Badge variant={verified ? "default" : "outline"}>{current?.status ?? "Not reviewed"}</Badge>
                          </div>
                          {current?.reviewReason ? <p className="text-xs text-muted-foreground">Last review: {current.reviewReason}</p> : null}
                          {!verified ? (
                            <>
                              <Input type="date" value={form.completedAt} onChange={event => updateExternalForm(record.id, phase.key, { completedAt: event.target.value })} aria-label={`${record.candidateName} ${phase.label} completion date`} />
                              <Input value={form.evidenceNote} onChange={event => updateExternalForm(record.id, phase.key, { evidenceNote: event.target.value })} placeholder="Evidence note (required to verify)" />
                              <Input value={form.evidenceReference} onChange={event => updateExternalForm(record.id, phase.key, { evidenceReference: event.target.value })} placeholder="Evidence reference (optional)" />
                              <Input value={form.reason} onChange={event => updateExternalForm(record.id, phase.key, { reason: event.target.value })} placeholder="Review reason (required)" />
                              <div className="flex flex-wrap gap-2">
                                <Button type="button" size="sm" onClick={() => submitExternal(record.id, phase.key, "verified")} disabled={reviewExternalCase.isPending}><FileCheck2 className="mr-1 h-4 w-4" />Verify phase</Button>
                                <Button type="button" size="sm" variant="outline" onClick={() => submitExternal(record.id, phase.key, "rejected")} disabled={reviewExternalCase.isPending}><XCircle className="mr-1 h-4 w-4" />Reject</Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-emerald-800">{record.candidateType === "non_nurse_external" ? "Verified outside-pathway evidence is recorded for this non-nurse candidate and does not enter the NERP nurse campaign audience or issue an official AHA credential." : "Verified external evidence contributes to the NERP completion record and campaign suppression only. It does not issue an official AHA credential."}</p>
                              <Input value={form.reason} onChange={event => updateExternalForm(record.id, phase.key, { reason: event.target.value })} placeholder="Reason for revocation (required)" />
                              <Button type="button" size="sm" variant="outline" onClick={() => submitExternal(record.id, phase.key, "revoked")} disabled={reviewExternalCase.isPending}><XCircle className="mr-1 h-4 w-4" />Revoke verification</Button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-700" />Precise NERP campaign suppressions</CardTitle>
            <CardDescription>
              Use an email match for a known address or an exact full-name match
              when no account exists. Exact-name rules never match shorter or
              different names. This is a preview control only; sending is disabled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="grid gap-3 md:grid-cols-[1fr_1.6fr_1fr_auto]"
              onSubmit={event => {
                event.preventDefault();
                if (!suppressionMatchValue.trim()) return;
                upsertSuppression.mutate({ institutionalAccountId: 3, matchType: suppressionMatchType, matchValue: suppressionMatchValue, reasonCode: suppressionReasonCode, note: suppressionNote.trim() || undefined });
              }}
            >
              <select className="h-10 rounded-md border bg-background px-3 text-sm" value={suppressionMatchType} onChange={event => setSuppressionMatchType(event.target.value as typeof suppressionMatchType)} aria-label="Suppression match type">
                <option value="email">Email</option>
                <option value="exact_name">Exact full name</option>
              </select>
              <Input value={suppressionMatchValue} onChange={event => setSuppressionMatchValue(event.target.value)} placeholder={suppressionMatchType === "email" ? "person@example.com" : "Exact full name"} aria-label="Suppression match value" />
              <select className="h-10 rounded-md border bg-background px-3 text-sm" value={suppressionReasonCode} onChange={event => setSuppressionReasonCode(event.target.value as typeof suppressionReasonCode)} aria-label="Suppression reason">
                <option value="admin_nurse">Admin nurse</option>
                <option value="external_completion">External completion</option>
                <option value="manual">Manual</option>
                <option value="not_registered">Not registered</option>
                <option value="identity_correction">Identity correction</option>
              </select>
              <Button type="submit" disabled={!suppressionMatchValue.trim() || upsertSuppression.isPending}>Save suppression</Button>
              <textarea className="md:col-span-4 min-h-10 rounded-md border bg-background px-3 py-2 text-sm" value={suppressionNote} onChange={event => setSuppressionNote(event.target.value)} placeholder="Why this exact person/address is suppressed (recommended)" aria-label="Suppression note" />
            </form>
            {suppressions.isLoading ? <p className="text-sm text-muted-foreground">Loading suppressions…</p> : null}
            {suppressions.data?.length ? (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-muted/40"><tr><th className="p-3 text-left">Match</th><th className="p-3 text-left">Reason</th><th className="p-3 text-left">Note</th><th className="p-3 text-right">Action</th></tr></thead>
                  <tbody>{suppressions.data.map(row => <tr key={row.id} className="border-t"><td className="p-3"><div className="font-medium">{row.matchValue}</div><div className="text-xs text-muted-foreground">{row.matchType === "exact_name" ? "Exact full name" : "Email"}</div></td><td className="p-3">{row.reasonCode.replaceAll("_", " ")}</td><td className="p-3 text-muted-foreground">{row.note || "—"}</td><td className="p-3 text-right"><Button type="button" size="sm" variant="outline" onClick={() => { const reason = window.prompt("Reason for removing this suppression:"); if (reason?.trim()) deactivateSuppression.mutate({ institutionalAccountId: 3, suppressionId: row.id, reason: reason.trim() }); }} disabled={deactivateSuppression.isPending}><Trash2 className="mr-1 h-4 w-4" />Deactivate</Button></td></tr>)}</tbody>
                </table>
              </div>
            ) : <p className="text-sm text-muted-foreground">No active suppressions stored.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Institution 3 · governed NERP nurse campaign</CardTitle>
            <CardDescription>
              Departmental nurses only. Nursing admins and all other active suppressions are excluded. The list is recomputed from active staff and suppression rules, then frozen for review before any delivery. Sending requires a final preview review and an explicit confirmation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Building suppression-aware preview…
              </div>
            ) : null}
            {preview.isError ? <p className="text-sm text-red-700">{preview.error.message}</p> : null}
            {preview.data ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                  {[
                    ["Nurse records", preview.data.counts.totalNurses],
                    ["Draft-eligible", preview.data.counts.sendable],
                    ["Suppressed", preview.data.counts.suppressed],
                    ["Needs review", preview.data.counts.needsReview],
                    ["Name excluded", preview.data.counts.excludedByName],
                    ["Suppression-only", preview.data.counts.suppressionOnly],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-1 text-2xl font-bold">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={downloadCsv}
                    disabled={!downloadableRows.length}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download current eligible CSV
                  </Button>
                  <Button
                    type="button"
                    onClick={() => createCampaignDraft.mutate({ institutionId: 3 })}
                    disabled={createCampaignDraft.isPending}
                  >
                    {campaign.data?.campaign?.status === "draft" ? "Use current draft" : "Create governed draft"}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Provider: {campaignStatus.data?.provider.provider ?? "checking"}{" "}
                    {campaignStatus.data?.provider.ready ? "ready" : "not configured"}. Automatic sending is disabled. Delivery rechecks suppression immediately before sending and records each result.
                  </span>
                </div>
                {campaign.data?.campaign ? (
                  <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Campaign lifecycle</p>
                        <p className="mt-1 font-medium">{campaign.data.campaign.status}</p>
                      </div>
                      <Badge variant={campaign.data.campaign.status === "sent" ? "default" : "outline"}>
                        {campaign.data.campaign.audienceCount} snapshot recipient(s)
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Approved snapshot: {campaign.data.counts.audienceCount} · Sent: {campaign.data.counts.sentCount} · Failed: {campaign.data.counts.failedCount} · Pending: {campaign.data.counts.pendingCount} · Skipped: {campaign.data.counts.skippedCount}
                    </p>
                    {campaign.data.recipients.length ? (
                      <details className="rounded-md border bg-background p-3">
                        <summary className="cursor-pointer text-sm font-medium">Review immutable approved snapshot</summary>
                        <div className="mt-3 max-h-72 overflow-auto">
                          <table className="w-full min-w-[640px] text-sm">
                            <thead className="bg-muted/40"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Email</th><th className="p-2 text-left">Department</th><th className="p-2 text-left">Delivery</th></tr></thead>
                            <tbody>{campaign.data.recipients.map((row: { id: number; displayName: string; email: string; department: string | null; status: string; skipReason: string | null }) => <tr key={row.id} className="border-t"><td className="p-2">{row.displayName}</td><td className="p-2">{row.email}</td><td className="p-2">{row.department ?? "—"}</td><td className="p-2">{row.status}{row.skipReason ? ` · ${row.skipReason}` : ""}</td></tr>)}</tbody>
                          </table>
                        </div>
                      </details>
                    ) : null}
                    {campaign.data.campaign.status === "draft" ? (
                      <div className="space-y-2 rounded-md border bg-background p-3">
                        <p className="text-sm">Review the current counts and type <strong>{campaignStatus.data?.approvalPhrase}</strong> to freeze the suppression-aware recipient snapshot.</p>
                        <Input value={approvalConfirmation} onChange={event => setApprovalConfirmation(event.target.value)} placeholder={campaignStatus.data?.approvalPhrase} aria-label="NERP campaign approval confirmation" />
                        <Button
                          type="button"
                          onClick={() => approveCampaign.mutate({ campaignId: campaign.data!.campaign.id, confirmation: approvalConfirmation })}
                          disabled={approveCampaign.isPending || approvalConfirmation !== campaignStatus.data?.approvalPhrase}
                        >
                          Approve recipient snapshot
                        </Button>
                      </div>
                    ) : null}
                    {campaign.data.campaign.status === "approved" || campaign.data.campaign.status === "failed" ? (
                      <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-950">
                        <p className="text-sm">Send-time checks will re-read active opt-out suppressions. Type <strong>{campaignStatus.data?.sendPhrase}</strong> only after reviewing the exact snapshot and provider readiness.</p>
                        <Input value={sendConfirmation} onChange={event => setSendConfirmation(event.target.value)} placeholder={campaignStatus.data?.sendPhrase} aria-label="NERP campaign send confirmation" />
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => sendCampaign.mutate({ campaignId: campaign.data!.campaign.id, confirmation: sendConfirmation })}
                          disabled={sendCampaign.isPending || !campaignStatus.data?.provider.ready || sendConfirmation !== campaignStatus.data?.sendPhrase}
                        >
                          Send approved campaign
                        </Button>
                      </div>
                    ) : null}
                    {approveCampaign.error ? <p className="text-sm text-red-700">{approveCampaign.error.message}</p> : null}
                    {sendCampaign.error ? <p className="text-sm text-red-700">{sendCampaign.error.message}</p> : null}
                  </div>
                ) : null}
                <div className="grid gap-3 rounded-lg border bg-muted/20 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Governed subject</p>
                    <p className="mt-1 font-medium">{DRAFT_SUBJECT}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Governed message preview</p>
                    <textarea readOnly value={DRAFT_BODY} className="mt-1 min-h-48 w-full rounded-md border bg-background p-3 text-sm leading-6" />
                  </div>
                </div>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="p-3 text-left">Name</th>
                        <th className="p-3 text-left">Department</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Reason</th>
                        <th className="p-3 text-left">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.data.recipients.map(row => (
                        <tr key={row.staffId} className="border-t">
                          <td className="p-3">{row.name}</td>
                          <td className="p-3">{row.department ?? "—"}</td>
                          <td className="p-3"><Badge variant={row.sendable ? "default" : "outline"}>{row.promotionStatus}</Badge></td>
                          <td className="p-3 text-muted-foreground">{row.suppressionReason ?? "Ready for review"}</td>
                          <td className="p-3 text-muted-foreground">{row.suppressionNote ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
