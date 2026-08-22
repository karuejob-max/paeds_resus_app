import { useState } from "react";
import { CheckCircle2, ClipboardCheck, ClipboardList, FileCheck2, ShieldAlert, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const DOMAINS = [
  ["leadership", "Leadership"],
  ["workforce", "Workforce"],
  ["activation", "Activation & response"],
  ["equipment", "Equipment"],
  ["clinical_governance", "Clinical governance"],
  ["quality_improvement", "Quality improvement"],
  ["resusgps", "ResusGPS"],
  ["training", "Training"],
] as const;

const EVIDENCE_TYPES = [
  ["checklist", "Checklist"],
  ["document", "Document"],
  ["photo", "Photo / scan"],
  ["drill", "Drill"],
  ["activation", "Activation"],
  ["audit", "Audit"],
  ["metric", "Metric"],
  ["attestation", "Attestation"],
  ["external", "External verification"],
] as const;

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function IersEvidencePanel({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const [domain, setDomain] = useState<(typeof DOMAINS)[number][0]>("equipment");
  const [criterionCode, setCriterionCode] = useState("");
  const [title, setTitle] = useState("");
  const [evidenceType, setEvidenceType] = useState<(typeof EVIDENCE_TYPES)[number][0]>("checklist");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const evidenceQuery = trpc.iers.listEvidence.useQuery({ institutionId }, { staleTime: 15_000, retry: 1 });
  const scorecardQuery = trpc.iers.getEvidenceScorecard.useQuery({ institutionId }, { staleTime: 15_000, retry: 1 });
  const actionsQuery = trpc.iers.listActions.useQuery({ institutionId }, { staleTime: 15_000, retry: 1 });
  const submit = trpc.iers.submitEvidence.useMutation({
    onSuccess: async () => {
      setCriterionCode("");
      setTitle("");
      setDescription("");
      setEvidenceUrl("");
      toast.success("Evidence submitted for review.");
      await utils.iers.listEvidence.invalidate();
    },
    onError: (error) => toast.error(error.message || "Could not submit evidence."),
  });
  const review = trpc.iers.reviewEvidence.useMutation({
    onSuccess: async () => {
      toast.success("Evidence review recorded.");
      await utils.iers.listEvidence.invalidate();
      await utils.iers.getEvidenceScorecard.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message || "Could not record evidence review."),
  });
  const updateAction = trpc.iers.updateAction.useMutation({
    onSuccess: async () => {
      toast.success("Action queue updated.");
      await utils.iers.listActions.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message || "Could not update action."),
  });

  const submitEvidence = () => {
    submit.mutate({
      institutionId,
      domain,
      criterionCode: criterionCode.trim(),
      title: title.trim(),
      evidenceType,
      description: description.trim(),
      evidenceUrl: evidenceUrl.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {scorecardQuery.data && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3"><CardTitle className="min-w-0 flex flex-wrap items-center gap-2 break-words text-base"><ClipboardCheck className="h-5 w-5 shrink-0 text-primary" /> Evidence-derived IERS readiness</CardTitle><CardDescription>This score is calculated from accepted criterion evidence. It is not a self-declared accreditation.</CardDescription></CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-3xl font-bold text-primary">{scorecardQuery.data.totalScore} <span className="text-base font-normal text-muted-foreground">/ {scorecardQuery.data.maxScore}</span></p><p className="text-xs text-muted-foreground mt-1">{scorecardQuery.data.eligibleForCertificationReview ? "Eligible for certification review" : "Not yet eligible for certification review"}</p></div><Badge variant="outline">{label(scorecardQuery.data.accreditationLevel)}</Badge></div>
            <Progress value={scorecardQuery.data.totalScore} />
            {!scorecardQuery.data.criticalCriteriaComplete && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2">Critical evidence is still missing or not accepted. A high total score cannot bypass the critical-criteria gate.</p>}
            <div className="grid gap-2 sm:grid-cols-2">{scorecardQuery.data.criteria.map((criterion) => <div key={criterion.code} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-md border bg-background p-2 text-xs"><span className="min-w-0 break-words">{criterion.code} · {criterion.label}</span><Badge variant="outline" className={criterion.evidenceAccepted ? "border-emerald-200 text-emerald-700" : "border-slate-200 text-slate-600"}>{criterion.evidenceAccepted ? `${criterion.awardedPoints} pts` : "Evidence needed"}</Badge></div>)}</div>
          </CardContent>
        </Card>
      )}

      <Card className="border-teal-200">
        <CardHeader className="bg-teal-50 border-b border-teal-100 pb-3">
          <CardTitle className="min-w-0 flex flex-wrap items-center gap-2 break-words text-teal-900 text-base"><FileCheck2 className="h-5 w-5 shrink-0" /> Criterion-level evidence</CardTitle>
          <CardDescription className="text-teal-800/80">Submit the proof behind a readiness claim. Evidence remains submitted until reviewed by an institution leader.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Domain</Label><select value={domain} onChange={(event) => setDomain(event.target.value as typeof domain)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{DOMAINS.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="iers-criterion-code">Criterion code</Label><Input id="iers-criterion-code" value={criterionCode} onChange={(event) => setCriterionCode(event.target.value)} placeholder="e.g. EQ-01" /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="iers-evidence-title">Evidence title</Label><Input id="iers-evidence-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Paediatric crash cart daily check" /></div>
            <div className="space-y-2"><Label>Evidence type</Label><select value={evidenceType} onChange={(event) => setEvidenceType(event.target.value as typeof evidenceType)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{EVIDENCE_TYPES.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="iers-evidence-url">Evidence link (optional)</Label><Input id="iers-evidence-url" type="url" value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} placeholder="Secure document or photo link" /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="iers-evidence-description">What was observed and when?</Label><Textarea id="iers-evidence-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Describe the observed state, date, location, and any limitation. Do not include patient identifiers." /></div>
          <Button className="bg-teal-700 hover:bg-teal-800 text-white" onClick={submitEvidence} disabled={submit.isPending || !criterionCode.trim() || !title.trim() || description.trim().length < 5}><ClipboardCheck className="h-4 w-4 mr-2" />Submit evidence</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Evidence review queue</CardTitle><CardDescription>Acceptance is separate from submission, preventing self-scored accreditation.</CardDescription></CardHeader>
        <CardContent className="p-4 space-y-3">
          {evidenceQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading evidence…</p> : evidenceQuery.data?.length ? evidenceQuery.data.map((evidence) => (
            <div key={evidence.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-sm text-slate-900">{evidence.title}</p><p className="text-xs text-slate-600 mt-1">{evidence.criterionCode} · {label(evidence.domain)} · {label(evidence.evidenceType)}</p></div><Badge variant="outline" className={evidence.status === "accepted" ? "border-emerald-200 text-emerald-700" : evidence.status === "rejected" ? "border-red-200 text-red-700" : "border-amber-200 text-amber-700"}>{label(evidence.status)}</Badge></div>
              <p className="text-sm text-slate-700">{evidence.description}</p>
              {evidence.status === "submitted" && <div className="flex flex-wrap gap-2"><Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white" disabled={review.isPending} onClick={() => review.mutate({ institutionId, evidenceId: evidence.id, status: "accepted", reviewNote: "Accepted after institution leader review." })}><CheckCircle2 className="h-4 w-4 mr-2" />Accept</Button><Button size="sm" variant="outline" className="border-red-200 text-red-700" disabled={review.isPending} onClick={() => review.mutate({ institutionId, evidenceId: evidence.id, status: "rejected", reviewNote: "Returned for additional evidence or clarification." })}><XCircle className="h-4 w-4 mr-2" />Return for correction</Button></div>}
            </div>
          )) : <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"><ShieldAlert className="h-5 w-5 mx-auto mb-2 text-teal-700" />No evidence submitted yet. Start with the highest-risk physical or response-readiness gap.</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="min-w-0 flex flex-wrap items-center gap-2 break-words text-base"><ClipboardList className="h-5 w-5 shrink-0 text-amber-700" /> Owned IERS action queue</CardTitle><CardDescription>Providers can progress their actions; institution leaders verify closure.</CardDescription></CardHeader>
        <CardContent className="p-4 space-y-3">
          {actionsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading actions…</p> : actionsQuery.data?.length ? actionsQuery.data.map((action) => <div key={action.id} className="rounded-lg border p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-sm">{action.title}</p><p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{action.gapDescription}</p>{action.legacyActionLogId != null && <p className="mt-2 text-[11px] text-muted-foreground">Migrated from legacy facility QI log #{action.legacyActionLogId}; IERS is the canonical action queue.</p>}</div><Badge variant="outline">{label(action.status)}</Badge></div><div className="mt-2 flex flex-wrap gap-2">{action.status === "open" && <Button size="sm" variant="outline" disabled={updateAction.isPending} onClick={() => updateAction.mutate({ institutionId, actionId: action.id, status: "in_progress" })}>Start</Button>}{action.status === "awaiting_verification" && <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white" disabled={updateAction.isPending} onClick={() => updateAction.mutate({ institutionId, actionId: action.id, status: "closed", closureNote: "Verified by institution leader in IERS action queue." })}><CheckCircle2 className="h-4 w-4 mr-2" />Verify closure</Button>}</div></div>) : <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No open IERS actions. Provider-reported gaps and equipment deficits will appear here.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
