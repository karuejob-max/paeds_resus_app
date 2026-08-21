import { useState } from "react";
import { CalendarRange, CheckCircle2, CircleAlert, Flag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function IersImplementationPlanPanel({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const [drafts, setDrafts] = useState<Record<number, { status: string; targetDate: string; riskNote: string; evidenceId: string }>>({});
  const planQuery = trpc.iers.getImplementationPlan.useQuery({ institutionId }, { staleTime: 30_000, retry: 1 });
  const update = trpc.iers.updateImplementationMilestone.useMutation({
    onSuccess: async () => { toast.success("Implementation milestone updated."); await utils.iers.getImplementationPlan.invalidate({ institutionId }); },
    onError: (error) => toast.error(error.message || "Could not update implementation milestone."),
  });

  const draftFor = (milestone: NonNullable<typeof planQuery.data>[number]) => drafts[milestone.id] ?? { status: milestone.status, targetDate: milestone.targetDate ? new Date(milestone.targetDate).toISOString().slice(0, 10) : "", riskNote: milestone.riskNote ?? "", evidenceId: milestone.evidenceId ? String(milestone.evidenceId) : "" };
  const save = (milestone: NonNullable<typeof planQuery.data>[number]) => {
    const draft = draftFor(milestone);
    update.mutate({ institutionId, milestoneId: milestone.id, status: draft.status as "not_started" | "in_progress" | "at_risk" | "complete", targetDate: draft.targetDate ? new Date(`${draft.targetDate}T12:00:00`) : undefined, riskNote: draft.riskNote.trim() || undefined, evidenceId: draft.evidenceId ? Number(draft.evidenceId) : undefined });
  };

  return <Card className="border-cyan-200"><CardHeader className="bg-cyan-50 border-b border-cyan-100 pb-3"><CardTitle className="flex items-center gap-2 text-cyan-950 text-base"><CalendarRange className="h-5 w-5" /> IERS implementation plan</CardTitle><CardDescription className="text-cyan-900/80">The plan is evidence-gated: a milestone cannot be marked complete without a linked evidence record.</CardDescription></CardHeader><CardContent className="p-4 space-y-4">{planQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading implementation plan…</p> : planQuery.data?.map((milestone) => { const draft = draftFor(milestone); return <div key={milestone.id} className="rounded-lg border p-4 space-y-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-sm">{milestone.phaseName}</p><p className="text-sm text-slate-700 mt-1">{milestone.objective}</p></div><Badge variant="outline" className={milestone.status === "complete" ? "border-emerald-200 text-emerald-700" : milestone.status === "at_risk" ? "border-red-200 text-red-700" : "border-cyan-200 text-cyan-800"}>{label(milestone.status)}</Badge></div><div className="grid gap-3 sm:grid-cols-3"><div className="space-y-1"><Label>Status</Label><select value={draft.status} onChange={(event) => setDrafts((current) => ({ ...current, [milestone.id]: { ...draft, status: event.target.value } }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="at_risk">At risk</option><option value="complete">Complete</option></select></div><div className="space-y-1"><Label>Target date</Label><Input type="date" value={draft.targetDate} onChange={(event) => setDrafts((current) => ({ ...current, [milestone.id]: { ...draft, targetDate: event.target.value } }))} /></div><div className="space-y-1"><Label>Evidence ID for completion</Label><Input inputMode="numeric" value={draft.evidenceId} onChange={(event) => setDrafts((current) => ({ ...current, [milestone.id]: { ...draft, evidenceId: event.target.value } }))} placeholder="e.g. 42" /></div></div><Textarea value={draft.riskNote} onChange={(event) => setDrafts((current) => ({ ...current, [milestone.id]: { ...draft, riskNote: event.target.value } }))} rows={2} placeholder="Risk, dependency, or escalation note" /><div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground flex items-center gap-1">{milestone.status === "complete" ? <CheckCircle2 className="h-3 w-3 text-emerald-700" /> : milestone.status === "at_risk" ? <CircleAlert className="h-3 w-3 text-red-700" /> : <Flag className="h-3 w-3 text-cyan-700" />} Owner and evidence remain auditable.</p><Button size="sm" onClick={() => save(milestone)} disabled={update.isPending}>Save milestone</Button></div></div>; })}</CardContent></Card>;
}
