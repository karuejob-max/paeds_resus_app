import { Download, FileText, Gauge, ShieldCheck, TimerReset } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function secondsBetween(start: Date | string, end: Date | string | null | undefined) {
  if (!end) return null;
  const value = (new Date(end).getTime() - new Date(start).getTime()) / 1000;
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function IersExecutiveReportPanel({ institutionId }: { institutionId: number }) {
  const scorecardQuery = trpc.iers.getEvidenceScorecard.useQuery({ institutionId }, { staleTime: 30_000, retry: 1 });
  const activationQuery = trpc.iers.listInstitutionActivations.useQuery({ institutionId, limit: 100 }, { staleTime: 30_000, retry: 1 });
  const actionQuery = trpc.iers.listActions.useQuery({ institutionId }, { staleTime: 30_000, retry: 1 });
  const drillQuery = trpc.iers.listDrills.useQuery({ institutionId, limit: 100 }, { staleTime: 30_000, retry: 1 });

  const activations = activationQuery.data ?? [];
  const actions = actionQuery.data ?? [];
  const drills = drillQuery.data ?? [];
  const responseTimes = activations.map((activation) => secondsBetween(activation.triggeredAt, activation.firstResponderAt)).filter((value): value is number => value != null);
  const acknowledgementTimes = activations.map((activation) => secondsBetween(activation.triggeredAt, activation.firstAcknowledgedAt)).filter((value): value is number => value != null);
  const averageResponse = responseTimes.length ? Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length) : null;
  const averageAcknowledgement = acknowledgementTimes.length ? Math.round(acknowledgementTimes.reduce((sum, value) => sum + value, 0) / acknowledgementTimes.length) : null;
  const closedActions = actions.filter((action) => action.status === "closed").length;
  const completedDrills = drills.filter((drill) => drill.status === "completed").length;
  const readinessProfile = [
    { metric: "Evidence", value: scorecardQuery.data?.totalScore ?? 0 },
    { metric: "Critical gate", value: scorecardQuery.data?.criticalCriteriaComplete ? 100 : 0 },
    { metric: "Drills", value: drills.length ? Math.round((completedDrills / drills.length) * 100) : 0 },
    { metric: "Actions", value: actions.length ? Math.round((closedActions / actions.length) * 100) : 0 },
  ];

  const downloadCsv = () => {
    const score = scorecardQuery.data;
    const rows = [
      ["metric", "value"],
      ["evidence_score", score?.totalScore ?? "not available"],
      ["critical_criteria_complete", score?.criticalCriteriaComplete ?? "not available"],
      ["eligible_for_certification_review", score?.eligibleForCertificationReview ?? "not available"],
      ["activations_recorded", activations.length],
      ["average_acknowledgement_seconds", averageAcknowledgement ?? "not recorded"],
      ["average_first_responder_seconds", averageResponse ?? "not recorded"],
      ["actions_total", actions.length],
      ["actions_closed", closedActions],
      ["drills_total", drills.length],
      ["drills_completed", completedDrills],
    ];
    const csv = rows.map((row) => row.map((value) => JSON.stringify(String(value))).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `iers-executive-snapshot-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="border-teal-200 bg-teal-50/50 dark:border-teal-900 dark:bg-teal-950/20">
        <CardContent className="grid gap-3 p-4 text-xs sm:grid-cols-4">
          <div><p className="font-semibold text-teal-950 dark:text-teal-100">Reporting scope</p><p className="text-muted-foreground">Emergency readiness and institutional learning only.</p></div>
          <div><p className="font-semibold text-teal-950 dark:text-teal-100">Primary source</p><p className="text-muted-foreground">Reviewed evidence, activation timelines, drills, and owned actions.</p></div>
          <div><p className="font-semibold text-teal-950 dark:text-teal-100">Freshness</p><p className="text-muted-foreground">Live institution-scoped records; absent timestamps remain unrecorded.</p></div>
          <div><p className="font-semibold text-teal-950 dark:text-teal-100">Boundary</p><p className="text-muted-foreground">IERS readiness is not a CPD attendance total or official AHA credential.</p></div>
        </CardContent>
      </Card>
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-teal-700" /> IERS executive snapshot</CardTitle><CardDescription>Decision-grade metrics from reviewed evidence, activation timelines, drills, and owned actions. Unrecorded data is shown as unrecorded.</CardDescription></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={downloadCsv}><Download className="h-4 w-4 mr-2" />CSV snapshot</Button><Button size="sm" variant="outline" onClick={() => window.print()}>Print / share</Button></div></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 p-4">
          <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Evidence score</p><p className="text-2xl font-bold text-teal-800">{scorecardQuery.data ? `${scorecardQuery.data.totalScore}/100` : "—"}</p><Progress value={scorecardQuery.data?.totalScore ?? 0} className="mt-2" /></div>
          <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">First acknowledgement</p><p className="text-2xl font-bold">{averageAcknowledgement == null ? "Not recorded" : `${averageAcknowledgement}s`}</p><p className="text-xs text-muted-foreground mt-1">{acknowledgementTimes.length} activations with timestamps</p></div>
          <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">First responder</p><p className="text-2xl font-bold">{averageResponse == null ? "Not recorded" : `${averageResponse}s`}</p><p className="text-xs text-muted-foreground mt-1">{responseTimes.length} activations with timestamps</p></div>
          <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Action closure</p><p className="text-2xl font-bold">{actions.length ? `${closedActions}/${actions.length}` : "—"}</p><p className="text-xs text-muted-foreground mt-1">Closed only after leader verification</p></div>
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-base">Readiness profile</CardTitle><CardDescription>Visual summary of current evidence, critical-gate, drill, and verified-action status. This is not an accreditation score.</CardDescription></CardHeader><CardContent className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={readinessProfile} layout="vertical" margin={{ left: 16, right: 18, top: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" domain={[0, 100]} unit="%" /><YAxis type="category" dataKey="metric" width={90} tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => [`${value}%`, "Status"]} /><Bar dataKey="value" fill="#0f766e" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-700" /> Critical gate</CardTitle></CardHeader><CardContent>{scorecardQuery.data?.criticalCriteriaComplete ? <Badge className="bg-emerald-600">Complete</Badge> : <Badge variant="outline" className="border-amber-300 text-amber-800">Incomplete</Badge>}<p className="text-xs text-muted-foreground mt-2">A total score cannot bypass missing critical evidence.</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Gauge className="h-4 w-4 text-violet-700" /> Drill readiness</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{completedDrills}/{drills.length}</p><p className="text-xs text-muted-foreground">Completed drills with debrief evidence</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><TimerReset className="h-4 w-4 text-red-700" /> Activation coverage</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{activations.length}</p><p className="text-xs text-muted-foreground">Recorded events; no claims made where response time is absent</p></CardContent></Card>
      </div>
    </div>
  );
}
