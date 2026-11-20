import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
  Printer,
  ShieldAlert,
  UsersRound,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function percent(value: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((value / denominator) * 100);
}

function csvCell(value: string | number | null | undefined): string {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function nextPeriodStart(periodStart: string, periodType: "monthly" | "quarterly" | "annual"): string {
  const date = new Date(`${periodStart}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + (periodType === "monthly" ? 1 : periodType === "annual" ? 12 : 3));
  return date.toISOString().slice(0, 10);
}

function comparableReports(current: { period: { type: "monthly" | "quarterly" | "annual"; periodStart: string }; reportVersion: string }, previous?: { period: { type: "monthly" | "quarterly" | "annual"; periodStart: string }; reportVersion: string; metrics: { activeStaff: number; cpdEvents: number; qiOpenReports: number } }) {
  return previous && current.period.type === previous.period.type && current.reportVersion === previous.reportVersion && nextPeriodStart(previous.period.periodStart, previous.period.type) === current.period.periodStart ? previous : null;
}

export function InstitutionPerformanceSnapshot({
  institutionId,
  enabled,
  onOpenAccountability,
  onOpenLearning,
  onOpenReadiness,
  onOpenAdministration,
}: {
  institutionId: number;
  enabled: boolean;
  onOpenAccountability: () => void;
  onOpenLearning: () => void;
  onOpenReadiness: () => void;
  onOpenAdministration: () => void;
}) {
  const dashboardQuery = trpc.institutionAccountability.getComplianceDashboard.useQuery(
    { institutionId, periodType: "quarterly" },
    {
      enabled,
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  );
  const sourceQuery = trpc.institutionPerformance.getSourceSnapshot.useQuery(
    { institutionId, periodType: "quarterly" },
    {
      enabled,
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  );
  const [reportPeriodType, setReportPeriodType] = useState<"monthly" | "quarterly" | "annual">("quarterly");
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const reportHistoryQuery = trpc.institutionPerformance.listExecutiveReports.useQuery(
    { institutionId, periodType: reportPeriodType, limit: 12 },
    { enabled, staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  );
  const selectedHistoryId = selectedReportId ?? reportHistoryQuery.data?.[0]?.id ?? null;
  const reportDetailQuery = trpc.institutionPerformance.getExecutiveReport.useQuery(
    { institutionId, reportId: selectedHistoryId ?? 0 },
    { enabled: enabled && selectedHistoryId != null, staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  );
  const generateReport = trpc.institutionPerformance.generateExecutiveReport.useMutation({
    onSuccess: report => {
      if ("id" in report) { setSelectedReportId(report.id); }
      void reportHistoryQuery.refetch();
    },
  });
  const qiQuery = trpc.institutionalQi.listReports.useQuery(
    { institutionalAccountId: institutionId, limit: 50 },
    { enabled, staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  );

  const data = dashboardQuery.data;
  const summary = data?.summary;
  const openQualityReports = (qiQuery.data ?? []).filter(
    report => report.status !== "closed",
  );
  const highSeverityReports = openQualityReports.filter(report =>
    ["severe", "critical"].includes(report.severity),
  );
  const departmentRows = data?.departments ?? [];
  const sourceRows = sourceQuery.data
    ? Object.entries(sourceQuery.data.sources).map(([label, source]) => ({ label, status: source.status }))
    : [];
  const csv = useMemo(() => {
    if (!data) return "";
    const rows = [
      ["Department", "Active staff", "Licence current/expiring", "Life Support current/expiring", "CPD attendance %", "Sessions presented", "Sessions co-presented", "Learning status"],
      ...departmentRows.map(row => [
        row.department,
        row.staffCount,
        row.licensedCurrentOrExpiring,
        row.lifeSupportCurrentOrExpiring,
        row.attendanceRate,
        row.sessionsPresented,
        row.sessionsCoPresented,
        row.status,
      ]),
    ];
    return rows.map(row => row.map(cell => csvCell(cell)).join(",")).join("\n");
  }, [data, departmentRows]);

  if (!enabled) return null;
  if (dashboardQuery.isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Preparing the institutional performance snapshot…</p>
          <p>Loading roster, departments, learning evidence, credentials, and CPD signals.</p>
          <div className="grid gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map(item => <div key={item} className="h-20 animate-pulse rounded-lg bg-muted" />)}
          </div>
        </CardContent>
      </Card>
    );
  }
  if (dashboardQuery.error) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
        <CardContent className="flex items-start gap-3 py-5 text-sm">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p className="font-semibold">Performance snapshot unavailable</p>
            <p className="mt-1 text-muted-foreground">The existing Accountability lane remains available. No performance conclusion is inferred while this source is unavailable.</p>
            <Button className="mt-3" size="sm" variant="outline" onClick={onOpenAccountability}>Open accountability</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (!data || !summary) return null;

  const downloadCsv = () => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `paeds-resus-institution-performance-${institutionId}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const downloadExecutiveReportCsv = () => {
    const report = reportDetailQuery.data;
    if (!report) return;
    const rows = [
      ["Metric", "Value"],
      ...Object.entries(report.snapshot.metrics).map(([key, value]) => [key, value]),
      ["period_start_eat", report.period.periodStart],
      ["period_end_eat", report.period.periodEnd],
      ["generated_at", report.generatedAt],
      ...Object.entries(report.disclosures.sourceAvailability).map(([key, value]) => [`source_${key}`, value]),
      ...Object.entries(report.disclosures.sourceFreshness).map(([key, value]) => [`source_${key}_queried_at`, value]),
      ["freshness_note", report.disclosures.freshnessNote],
      ...report.limitations.map((limitation, index) => [`limitation_${index + 1}`, limitation]),
    ];
    const content = rows.map(row => row.map(cell => csvCell(cell)).join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `paeds-resus-executive-report-${institutionId}-${report.period.periodStart}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const licenceRisk = summary.licensedExpired + summary.licensedMissing;
  const lifeSupportRisk = summary.lifeSupportExpired + summary.lifeSupportMissing;
  const qualityUnavailable = qiQuery.isError;
  const attentionItems = sourceQuery.data?.attention ?? [];
  const openAction = (action: string) => {
    if (action === "accountability") onOpenAccountability();
    else if (action === "administration") onOpenAdministration();
    else if (action === "readiness") onOpenReadiness();
    else onOpenLearning();
  };

  return (
    <Card className="border-indigo-200 bg-indigo-50/30 dark:border-indigo-900/60 dark:bg-indigo-950/10">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-indigo-700" />Institution performance snapshot</CardTitle>
            <CardDescription className="mt-1">A transparent operating view across the selected period. These are evidence and activity states, not competence, accreditation, licence, or clinical-outcome claims.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>
            <Button size="sm" variant="outline" onClick={downloadCsv}><Download className="mr-2 h-4 w-4" />CSV</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Active roster" value={summary.staffCount} detail={`${departmentRows.length} canonical department(s)`} icon={UsersRound} />
          <MetricCard label="Licence evidence" value={`${percent(summary.licensedCurrentOrExpiring, summary.staffCount)}%`} detail={`${summary.licensedCurrentOrExpiring} current/expiring · ${licenceRisk} risk`} icon={FileText} progress={percent(summary.licensedCurrentOrExpiring, summary.staffCount)} risk={licenceRisk > 0} />
          <MetricCard label="Life Support evidence" value={`${percent(summary.lifeSupportCurrentOrExpiring, summary.staffCount)}%`} detail={`${summary.lifeSupportCurrentOrExpiring} current/expiring · ${lifeSupportRisk} risk`} icon={CheckCircle2} progress={percent(summary.lifeSupportCurrentOrExpiring, summary.staffCount)} risk={lifeSupportRisk > 0} />
          <MetricCard label="CPD verified attendance" value={`${summary.cpdAttendanceRate}%`} detail={`${summary.cpdSessionsHeld} session(s) · ${summary.cpdVerifiedAttendanceRecords} verified record(s)`} icon={BarChart3} progress={summary.cpdAttendanceRate} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="bg-background/80 lg:col-span-2">
            <CardHeader className="pb-3"><CardTitle className="text-base">Department comparison</CardTitle><CardDescription>Department denominators use active roster rows with canonical department links. Unassigned staff are not silently redistributed.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {departmentRows.length === 0 ? <p className="text-sm text-muted-foreground">No canonical departments or active staff are recorded yet.</p> : departmentRows.map(row => (
                <div key={row.departmentId} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{row.department}</p><Badge variant={row.status === "needs_support" ? "destructive" : row.status === "no_data" ? "outline" : "secondary"}>{row.status.replaceAll("_", " ")}</Badge></div>
                  <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-4"><span>{row.staffCount} active staff</span><span>{row.attendanceRate}% CPD attendance</span><span>{row.sessionsPresented} lead · {row.sessionsCoPresented} co-presented</span><span>{row.lifeSupportCurrentOrExpiring}/{row.staffCount} Life Support evidence</span></div>
                  <Progress value={row.attendanceRate} className="mt-3 h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="bg-background/80">
            <CardHeader className="pb-3"><CardTitle className="text-base">Attention queue</CardTitle><CardDescription>Explicit records needing review, not an inferred hospital score.</CardDescription></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {sourceQuery.isError ? <p className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">The actionable source is unavailable. Open the relevant lane directly; no action is inferred while the queue is unavailable.</p> : attentionItems.length ? attentionItems.map(item => <ActionableAttentionRow key={item.id} item={item} onOpen={() => openAction(item.action)} />) : <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100"><p className="font-medium">No actionable records returned</p><p className="mt-1">This means no matching records were found in the connected sources, not that institutional competence or safety has been established.</p></div>}
              {!sourceQuery.isError && !attentionItems.length && (licenceRisk > 0 || lifeSupportRisk > 0 || !qualityUnavailable && (openQualityReports.length > 0 || highSeverityReports.length > 0)) ? <p className="text-xs text-muted-foreground">Some legacy summary signals remain available below; open Accountability, Learning, or Readiness for their authoritative detail.</p> : null}
              <div className="border-t pt-3 text-xs text-muted-foreground">CPD presenting: {summary.cpdSessionsPresented} lead · {summary.cpdSessionsCoPresented} co-presented. Attendance and presenting are separate measures.</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-background/70 p-3 text-xs text-muted-foreground dark:border-slate-800">
          <div>
            <span>Data quality: {summary.cpdDataQualityStatus}; identity match {summary.cpdIdentityMatchRate == null ? "not available" : `${summary.cpdIdentityMatchRate}%`}; unresolved CPD records {summary.cpdUnresolvedIdentityRecords}.</span>
            <div className="mt-2 flex flex-wrap gap-2" aria-label="Performance source status">
              {sourceRows.map(row => <Badge key={row.label} variant={row.status === "unavailable" ? "destructive" : row.status === "empty" ? "outline" : "secondary"}>{row.label}: {row.status}</Badge>)}
              {sourceQuery.isError ? <Badge variant="destructive">performance source contract unavailable</Badge> : null}
            </div>
          </div>
          <span>Source period: {data.learning.period.periodStart} to {data.learning.period.periodEnd} (EAT calendar convention).</span>
        </div>

        <Card className="bg-background/80">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">Executive reporting</CardTitle>
                <CardDescription>Generate a preserved EAT-period snapshot for leadership review. Historical reports do not change when live source rows change.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <select aria-label="Executive report period" value={reportPeriodType} onChange={event => { setReportPeriodType(event.target.value as "monthly" | "quarterly" | "annual"); setSelectedReportId(null); }} className="h-9 rounded-md border bg-background px-2 text-sm">
                  <option value="quarterly">Quarterly</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual calendar year</option>
                </select>
                <Button size="sm" onClick={() => generateReport.mutate({ institutionId, periodType: reportPeriodType })} disabled={generateReport.isPending}>
                  {generateReport.isPending ? "Generating…" : "Generate report"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {generateReport.error ? <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">The report could not be generated. Existing live performance lanes remain available; no executive conclusion is inferred.</p> : null}
            {reportHistoryQuery.isError ? <p className="text-xs text-muted-foreground">Report history is unavailable. No historical trend is inferred.</p> : reportHistoryQuery.data?.length ? <>
              <div className="grid gap-2 sm:grid-cols-3">
                {reportHistoryQuery.data.slice(0, 3).map((report, index, reports) => {
                  const previous = comparableReports(report, reports[index + 1]);
                  const delta = previous ? report.metrics.activeStaff - previous.metrics.activeStaff : null;
                  const trend = previous ? `Trend: roster ${delta! >= 0 ? "+" : ""}${delta}; CPD events ${report.metrics.cpdEvents - previous.metrics.cpdEvents >= 0 ? "+" : ""}${report.metrics.cpdEvents - previous.metrics.cpdEvents}; open QI ${report.metrics.qiOpenReports - previous.metrics.qiOpenReports >= 0 ? "+" : ""}${report.metrics.qiOpenReports - previous.metrics.qiOpenReports}` : "No contiguous same-version comparison";
                  return <button type="button" key={report.id} onClick={() => setSelectedReportId(report.id)} className={`rounded-lg border p-3 text-left text-xs transition-colors hover:bg-muted ${selectedHistoryId === report.id ? "border-indigo-400 bg-indigo-50/60" : ""}`}><span className="font-medium">{report.period.periodStart} to {report.period.periodEnd}</span><span className="mt-1 block text-muted-foreground">{report.period.type} · {report.sourceAvailability.credentials ?? "unknown"} credentials source</span><span className="mt-2 block">Active roster: {report.metrics.activeStaff}{delta == null ? "" : ` · ${delta >= 0 ? "+" : ""}${delta} vs prior`}</span><span className="mt-1 block text-muted-foreground">{trend}</span></button>;
                })}
              </div>
              {reportDetailQuery.data ? <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 text-xs dark:border-indigo-900 dark:bg-indigo-950/20">
                <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">Report {reportDetailQuery.data.period.periodStart} to {reportDetailQuery.data.period.periodEnd}</p><p className="mt-1 text-muted-foreground">Generated {new Date(reportDetailQuery.data.generatedAt).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })} · {reportDetailQuery.data.period.timezone}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => window.print()}>Print report</Button><Button size="sm" variant="outline" onClick={downloadExecutiveReportCsv}>CSV report</Button></div></div>
                <div className="mt-3 grid gap-2 sm:grid-cols-4"><span>{reportDetailQuery.data.snapshot.metrics.activeStaff} active staff</span><span>{reportDetailQuery.data.snapshot.metrics.cpdEvents} CPD events</span><span>{reportDetailQuery.data.snapshot.metrics.verifiedCredentials} verified credentials</span><span>{reportDetailQuery.data.snapshot.metrics.qiOverdueActions} overdue QI actions</span></div>
                <div className="mt-3 flex flex-wrap gap-2">{Object.entries(reportDetailQuery.data.disclosures.sourceAvailability).map(([key, value]) => <Badge key={key} variant={value === "unavailable" ? "destructive" : value === "empty" ? "outline" : "secondary"}>{key}: {value}</Badge>)}</div>
                <div className="mt-3 rounded border bg-background/70 p-2"><p className="font-medium">Source capture times</p>{Object.entries(reportDetailQuery.data.disclosures.sourceFreshness).map(([key, value]) => <p key={key} className="mt-1">{key}: {new Date(value).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })} EAT</p>)}<p className="mt-2 text-muted-foreground">{reportDetailQuery.data.disclosures.freshnessNote}</p></div>
                <p className="mt-3 text-muted-foreground">Limitations: {reportDetailQuery.data.limitations.join(" ")}</p>
              </div> : null}
            </> : <p className="text-xs text-muted-foreground">No preserved executive reports yet. Generate the first monthly, quarterly, or annual snapshot to start a governed history; no trend is shown before two comparable reports exist.</p>}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value, detail, icon: Icon, progress, risk }: { label: string; value: string | number; detail: string; icon: typeof UsersRound; progress?: number; risk?: boolean }) {
  return <Card className="bg-background/80"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-muted-foreground">{label}</span><Icon className={`h-4 w-4 ${risk ? "text-amber-700" : "text-indigo-700"}`} /></div><p className="mt-2 text-2xl font-semibold">{value}</p>{progress != null ? <Progress value={progress} className="mt-2 h-1.5" /> : null}<p className="mt-2 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}

function ActionableAttentionRow({ item, onOpen }: { item: { title: string; detail: string; severity: string; count: number; ownerUserId: number | null; ownerName?: string | null; dueAt: string | null; action: string }; onOpen: () => void }) {
  const due = item.dueAt ? new Date(item.dueAt).toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" }) : null;
  return <div className="rounded-lg border p-3"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><div><p className="font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></div></div><Badge variant={item.severity === "urgent" ? "destructive" : item.severity === "high" ? "secondary" : "outline"}>{item.count}</Badge></div><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{item.ownerName ?? (item.ownerUserId ? `Owner user #${item.ownerUserId}` : "Owner not assigned")}{due ? ` · due ${due}` : ""}</span><Button size="sm" variant="outline" onClick={onOpen}>Open workflow</Button></div></div>;
}
