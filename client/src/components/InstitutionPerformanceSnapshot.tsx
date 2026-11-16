import { useMemo } from "react";
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

export function InstitutionPerformanceSnapshot({
  institutionId,
  enabled,
  onOpenAccountability,
  onOpenLearning,
  onOpenReadiness,
}: {
  institutionId: number;
  enabled: boolean;
  onOpenAccountability: () => void;
  onOpenLearning: () => void;
  onOpenReadiness: () => void;
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
  const licenceRisk = summary.licensedExpired + summary.licensedMissing;
  const lifeSupportRisk = summary.lifeSupportExpired + summary.lifeSupportMissing;
  const qualityUnavailable = qiQuery.isError;

  return (
    <Card className="border-indigo-200 bg-indigo-50/30 dark:border-indigo-900/60 dark:bg-indigo-950/10">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-indigo-700" />Institution performance snapshot</CardTitle>
            <CardDescription className="mt-1">A transparent quarterly operating view. These are evidence and activity states, not competence, accreditation, licence, or clinical-outcome claims.</CardDescription>
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
              <AttentionRow label="Credential renewal/missing" value={licenceRisk} onClick={onOpenAccountability} />
              <AttentionRow label="Life Support evidence gap" value={lifeSupportRisk} onClick={onOpenLearning} />
              <AttentionRow label="QI reports still open" value={qualityUnavailable ? null : openQualityReports.length} onClick={onOpenReadiness} unavailable={qualityUnavailable} />
              <AttentionRow label="High-severity QI reports" value={qualityUnavailable ? null : highSeverityReports.length} onClick={onOpenReadiness} unavailable={qualityUnavailable} />
              <div className="border-t pt-3 text-xs text-muted-foreground">CPD presenting: {summary.cpdSessionsPresented} lead · {summary.cpdSessionsCoPresented} co-presented. Attendance and presenting are separate measures.</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-background/70 p-3 text-xs text-muted-foreground dark:border-slate-800">
          <span>Data quality: {summary.cpdDataQualityStatus}; identity match {summary.cpdIdentityMatchRate == null ? "not available" : `${summary.cpdIdentityMatchRate}%`}; unresolved CPD records {summary.cpdUnresolvedIdentityRecords}.</span>
          <span>Source period: {data.learning.period.periodStart} to {data.learning.period.periodEnd} (EAT calendar convention).</span>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value, detail, icon: Icon, progress, risk }: { label: string; value: string | number; detail: string; icon: typeof UsersRound; progress?: number; risk?: boolean }) {
  return <Card className="bg-background/80"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-muted-foreground">{label}</span><Icon className={`h-4 w-4 ${risk ? "text-amber-700" : "text-indigo-700"}`} /></div><p className="mt-2 text-2xl font-semibold">{value}</p>{progress != null ? <Progress value={progress} className="mt-2 h-1.5" /> : null}<p className="mt-2 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}

function AttentionRow({ label, value, onClick, unavailable }: { label: string; value: number | null; onClick: () => void; unavailable?: boolean }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"><span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-700" />{label}</span><span className="font-semibold">{unavailable ? "—" : value}</span></button>;
}
