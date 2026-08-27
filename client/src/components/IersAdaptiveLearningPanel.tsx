import { useMemo } from "react";
import { Activity, AlertTriangle, BarChart3, HeartPulse, Loader2, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = { institutionId: number | null };

export default function IersAdaptiveLearningPanel({ institutionId }: Props) {
  const query = trpc.iersAdaptiveLearning.getInstitutionSignals.useQuery({ institutionId: institutionId ?? 0, days: 90 }, { enabled: Boolean(institutionId), staleTime: 60_000 });
  const cprQuery = trpc.iersAdaptiveLearning.getCprEventSignals.useQuery({ institutionId: institutionId ?? 0, days: 90 }, { enabled: Boolean(institutionId), staleTime: 60_000 });
  const createAction = trpc.iers.createAction.useMutation({
    onSuccess: () => toast.success("Added to the IERS action queue for review."),
    onError: (error) => toast.error(error.message || "The IERS action could not be created."),
  });
  const topGaps = useMemo(() => Object.entries(query.data?.readiness.criticalGapCounts ?? {}).sort(([, a], [, b]) => b - a).slice(0, 6), [query.data?.readiness.criticalGapCounts]);
  if (!institutionId) return null;
  return <Card className="border-indigo-200 bg-indigo-50/20">
    <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-indigo-700" /> Adaptive Learning — operational signals</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      {query.isLoading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Calculating the current IERS signal window…</p>}
      {query.isError && <p className="text-sm text-destructive">Adaptive-learning signals could not be loaded. Refresh and try again.</p>}
      {query.data && <>
        <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg border bg-white p-3"><p className="text-xs text-muted-foreground">Team records</p><p className="mt-1 text-2xl font-semibold">{query.data.coverage.teamCount}</p></div><div className="rounded-lg border bg-white p-3"><p className="text-xs text-muted-foreground">UTL/ERTL/member acceptance</p><p className="mt-1 text-2xl font-semibold">{query.data.roleCoverage.acceptanceRate === null ? "—" : `${Math.round(query.data.roleCoverage.acceptanceRate * 100)}%`}</p><p className="text-xs text-muted-foreground">{query.data.roleCoverage.uncoveredRoleCount} pending/declined</p></div><div className="rounded-lg border bg-white p-3"><p className="text-xs text-muted-foreground">Readiness checks</p><p className="mt-1 text-2xl font-semibold">{query.data.readiness.totalChecks}</p><p className="text-xs text-muted-foreground">{query.data.readiness.notReady} not ready</p></div></div>
        <div className="grid gap-4 md:grid-cols-2"><div className="rounded-lg border bg-white p-3"><p className="flex items-center gap-2 text-sm font-semibold"><BarChart3 className="h-4 w-4" /> Repeated critical gaps</p>{topGaps.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">No critical gaps recorded in the selected window.</p> : <div className="mt-2 space-y-2">{topGaps.map(([label, count]) => <div key={label} className="flex items-center justify-between gap-2 text-sm"><span>{label}</span><Badge variant="destructive">{count}</Badge></div>)}</div>}</div><div className="rounded-lg border bg-white p-3"><p className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4" /> Role-report observations</p>{Object.entries(query.data.targetedRoleReports.byObservationCode).length === 0 ? <p className="mt-2 text-xs text-muted-foreground">No targeted role reports recorded in the selected window.</p> : <div className="mt-2 space-y-2">{Object.entries(query.data.targetedRoleReports.byObservationCode).map(([code, count]) => <div key={code} className="flex items-center justify-between gap-2 text-sm"><span>{code.replaceAll("_", " ")}</span><Badge variant="secondary">{count}</Badge></div>)}</div>}</div></div>
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs text-muted-foreground"><p className="font-semibold text-indigo-900">Interpretation boundary</p><ul className="mt-1 list-disc space-y-1 pl-4">{query.data.interpretation.map((note) => <li key={note}>{note}</li>)}</ul><p className="mt-2">Window: {query.data.windowDays} days · generated {new Date(query.data.generatedAt).toLocaleString()}</p></div>
      </>}
      <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-red-950"><HeartPulse className="h-4 w-4 text-red-700" /> CPR event-loop signals</p>
        {cprQuery.isLoading && <p className="mt-2 text-xs text-muted-foreground">Calculating linked arrest documentation signals…</p>}
        {cprQuery.isError && <p className="mt-2 text-xs text-destructive">CPR event signals could not be loaded. Refresh and try again.</p>}
        {cprQuery.data && <>
          <div className="mt-3 grid gap-2 sm:grid-cols-3"><div className="rounded-md border bg-white p-2"><p className="text-[11px] text-muted-foreground">Linked CPR events</p><p className="text-xl font-semibold">{cprQuery.data.coverage.linkedCprEvents}</p><p className="text-[11px] text-muted-foreground">{cprQuery.data.coverage.completedEvents} with outcome</p></div><div className="rounded-md border bg-white p-2"><p className="text-[11px] text-muted-foreground">Debrief coverage</p><p className="text-xl font-semibold">{cprQuery.data.coverage.linkedCprEvents ? `${Math.round((cprQuery.data.coverage.debriefedEvents / cprQuery.data.coverage.linkedCprEvents) * 100)}%` : "—"}</p><p className="text-[11px] text-muted-foreground">{cprQuery.data.coverage.debriefedEvents} submitted</p></div><div className="rounded-md border bg-white p-2"><p className="text-[11px] text-muted-foreground">Open resource needs</p><p className="text-xl font-semibold">{cprQuery.data.unresolvedResourceCount}</p><p className="text-[11px] text-muted-foreground">not yet resolved</p></div></div>
          <div className="mt-3 grid gap-3 md:grid-cols-2"><div><p className="text-xs font-semibold text-slate-800">Pathways</p><div className="mt-1 flex flex-wrap gap-1">{Object.entries(cprQuery.data.pathways).length ? Object.entries(cprQuery.data.pathways).map(([pathway, count]) => <Badge key={pathway} variant="outline">{pathway}: {count}</Badge>) : <span className="text-xs text-muted-foreground">No linked CPR events in this window.</span>}</div></div><div><p className="text-xs font-semibold text-slate-800">Outcomes</p><div className="mt-1 flex flex-wrap gap-1">{Object.entries(cprQuery.data.outcomes).map(([outcome, count]) => <Badge key={outcome} variant="secondary">{outcome}: {count}</Badge>)}</div></div></div>
          <div className="mt-3 rounded-md border bg-white p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-slate-800">Committee follow-up</p><span className="text-[11px] text-muted-foreground">Review before adding</span></div><div className="mt-2 space-y-2">{cprQuery.data.recommendations.map((recommendation) => <div key={recommendation} className="flex flex-col gap-2 rounded-md border bg-slate-50 p-2 sm:flex-row sm:items-start sm:justify-between"><p className="text-xs text-slate-600">{recommendation}</p><Button type="button" size="sm" variant="outline" className="shrink-0" disabled={createAction.isPending} onClick={() => createAction.mutate({ institutionId, sourceType: "activation", title: "CPR event-loop follow-up", gapDescription: recommendation, priority: "medium" })}><Plus className="mr-1 h-3.5 w-3.5" />Add action</Button></div>)}</div></div>
          <p className="mt-2 text-[11px] text-muted-foreground">These are operational documentation signals, not patient outcomes or individual performance scores. Window: {cprQuery.data.windowDays} days.</p>
        </>}
      </div>
    </CardContent>
  </Card>;
}
