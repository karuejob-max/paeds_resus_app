import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

const statusLabel: Record<string, string> = { review_required: "Needs review", accepted: "Accepted for training record", rejected: "Rejected" };

export default function AdminAdultAclsEvidence() {
  const [status, setStatus] = useState<"review_required" | "accepted" | "rejected">("review_required");
  const [reason, setReason] = useState<Record<number, string>>({});
  const evidence = trpc.practiceLab.listAdultAclsEvidence.useQuery({ status });
  const review = trpc.practiceLab.reviewAdultAclsEvidence.useMutation({ onSuccess: () => void evidence.refetch() });

  return <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
    <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Learning & certification governance</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Adult ACLS simulation evidence</h1><p className="mt-2 max-w-3xl text-sm text-slate-600">Review server-recorded Adult ACLS rehearsals for training feedback and quality governance. Accepting evidence does not prove competence, complete Phase 2 or Phase 3, or issue an AHA credential.</p></div>
    <div className="flex flex-wrap gap-2"><Button variant={status === "review_required" ? "default" : "outline"} onClick={() => setStatus("review_required")}>Needs review</Button><Button variant={status === "accepted" ? "default" : "outline"} onClick={() => setStatus("accepted")}>Accepted</Button><Button variant={status === "rejected" ? "default" : "outline"} onClick={() => setStatus("rejected")}>Rejected</Button></div>
    {evidence.isLoading && <Card><CardContent className="p-5 text-sm text-slate-500">Loading evidence…</CardContent></Card>}
    {!evidence.isLoading && evidence.data?.length === 0 && <Card><CardContent className="p-5 text-sm text-slate-500">No Adult ACLS simulation evidence in this queue.</CardContent></Card>}
    <div className="grid gap-4">{evidence.data?.map((item) => { const assessment = (item.assessmentJson ?? {}) as Record<string, unknown>; const currentReason = reason[item.id] ?? item.reviewerReason ?? ""; return <Card key={item.id} className="border-slate-200"><CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardTitle className="text-base">{item.learnerName || `Learner ${item.userId}`}</CardTitle><p className="mt-1 text-xs text-slate-500">Evidence #{item.id} · Session #{item.sessionId} · Enrollment #{item.enrollmentId}</p></div><Badge variant="outline">{statusLabel[item.evidenceStatus] ?? item.evidenceStatus}</Badge></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 text-sm sm:grid-cols-4"><div><span className="text-xs text-slate-500">Scenario</span><strong className="block">{item.scenarioId}</strong></div><div><span className="text-xs text-slate-500">Role</span><strong className="block">{item.role}</strong></div><div><span className="text-xs text-slate-500">Phase at finish</span><strong className="block">{String(assessment.phase ?? "not recorded")}</strong></div><div><span className="text-xs text-slate-500">Critical safety events</span><strong className="block">{String(assessment.criticalFailures ?? "0")}</strong></div></div><div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><strong>Governance boundary:</strong> this review changes the evidence status only. It must not be used as a competence declaration, certificate decision, or Phase 2/3 completion record.</div><Textarea value={currentReason} onChange={(event) => setReason((previous) => ({ ...previous, [item.id]: event.target.value }))} placeholder="Record the review rationale, observed strengths, limitations, and follow-up…" disabled={review.isPending} /><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={review.isPending || currentReason.trim().length < 10} onClick={() => review.mutate({ evidenceId: item.id, decision: "rejected", reason: currentReason })}>Reject evidence</Button><Button disabled={review.isPending || currentReason.trim().length < 10} onClick={() => review.mutate({ evidenceId: item.id, decision: "accepted", reason: currentReason })}>Accept training record</Button></div></CardContent></Card>; })}</div>
  </div>;
}
