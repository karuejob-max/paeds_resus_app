import { useMemo } from "react";
import { Activity, AlertTriangle, BarChart3, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { institutionId: number | null };

export default function IersAdaptiveLearningPanel({ institutionId }: Props) {
  const query = trpc.iersAdaptiveLearning.getInstitutionSignals.useQuery({ institutionId: institutionId ?? 0, days: 90 }, { enabled: Boolean(institutionId), staleTime: 60_000 });
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
    </CardContent>
  </Card>;
}
