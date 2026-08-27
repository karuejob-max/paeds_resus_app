import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileCheck2,
  Loader2,
  Search,
  ShieldCheck,
  XCircle,
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
const DRAFT_BODY = `Hello [First Name],\n\nIf AHA ACLS is part of your professional development plan, Paeds Resus has introduced a flexible Lipa Mdogo Mdogo option at KSh 2,500 per month for six months.\n\nOn successful completion of the programme requirements, you will receive your AHA ACLS certification, together with a free Paeds Resus BLS Certificate.\n\nLearn more and check the next steps: [Enrollment link]\n\nThis opportunity is optional and is not an institutional performance assessment. If you would prefer not to receive programme updates, [unsubscribe link].\n\nRegards,\nPaeds Resus`;

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
  const preview = trpc.nerp.getPromotionPreview.useQuery({
    institutionId: 3,
    limit: 200,
  });
  const createLedger = trpc.nerp.createVerificationLedger.useMutation({
    onSuccess: async () => {
      await utils.nerp.getAdminVerificationQueue.invalidate();
    },
  });
  const review = trpc.nerp.reviewExternalPhase.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.nerp.getAdminVerificationQueue.invalidate(),
        utils.nerp.getPromotionPreview.invalidate(),
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
            <CardTitle>Institution 3 · draft nurse campaign preview</CardTitle>
            <CardDescription>
              Departmental nurses only. Nursing admins are suppressed. This
              screen never sends email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Building suppression-aware preview…
              </div>
            ) : null}
            {preview.isError ? (
              <p className="text-sm text-red-700">{preview.error.message}</p>
            ) : null}
            {preview.data ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    ["Nurse records", preview.data.counts.totalNurses],
                    ["Draft-eligible", preview.data.counts.sendable],
                    ["Suppressed", preview.data.counts.suppressed],
                    ["Needs review", preview.data.counts.needsReview],
                    ["Name excluded", preview.data.counts.excludedByName],
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
                    Download draft recipient CSV
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Sending is deliberately disabled:{" "}
                    {preview.data.emailSending ? "enabled" : "not enabled"}.
                  </span>
                </div>
                <div className="grid gap-3 rounded-lg border bg-muted/20 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Draft subject
                    </p>
                    <p className="mt-1 font-medium">{DRAFT_SUBJECT}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Draft body
                    </p>
                    <textarea
                      readOnly
                      value={DRAFT_BODY}
                      className="mt-1 min-h-48 w-full rounded-md border bg-background p-3 text-sm leading-6"
                    />
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
                      </tr>
                    </thead>
                    <tbody>
                      {preview.data.recipients.map(row => (
                        <tr key={row.staffId} className="border-t">
                          <td className="p-3">{row.name}</td>
                          <td className="p-3">{row.department ?? "—"}</td>
                          <td className="p-3">
                            <Badge
                              variant={row.sendable ? "default" : "outline"}
                            >
                              {row.promotionStatus}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {row.suppressionReason ?? "Ready for draft review"}
                          </td>
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
