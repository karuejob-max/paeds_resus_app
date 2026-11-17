import { useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Download, Printer, ShieldAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function currentEatMonth(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 7) + "-01";
}
function canonicalPeriodStart(value: string, type: "monthly" | "quarterly"): string {
  const date = new Date(`${value.slice(0, 7)}-01T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return currentEatMonth();
  if (type === "quarterly") date.setUTCMonth(Math.floor(date.getUTCMonth() / 3) * 3);
  return date.toISOString().slice(0, 10);
}
function csvCell(value: unknown): string { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function pct(value: number, denominator: number): number { return denominator ? Math.round((value / denominator) * 100) : 0; }

export function InstitutionReportsInsightsCenter({ institutionId, institutionName }: { institutionId: number; institutionName: string }) {
  const [periodType, setPeriodType] = useState<"monthly" | "quarterly">("monthly");
  const [periodStart, setPeriodStart] = useState(currentEatMonth());
  const [scopeType, setScopeType] = useState<"institution" | "department">("institution");
  const [departmentId, setDepartmentId] = useState<number | undefined>();
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const scopesQuery = trpc.institutionPerformance.getReportScopes.useQuery({ institutionId }, { staleTime: 60_000, retry: 1 });
  const scopeInput = { institutionId, periodType, scopeType, ...(scopeType === "department" && departmentId ? { departmentId } : {}) };
  const historyQuery = trpc.institutionPerformance.listExecutiveReports.useQuery({ ...scopeInput, limit: 12 }, { staleTime: 30_000, retry: 1 });
  const selectedHistoryId = selectedReportId ?? historyQuery.data?.[0]?.id ?? null;
  const detailQuery = trpc.institutionPerformance.getExecutiveReport.useQuery({ institutionId, reportId: selectedHistoryId ?? 0 }, { enabled: selectedHistoryId != null, staleTime: 60_000, retry: 1 });
  const generate = trpc.institutionPerformance.generateExecutiveReport.useMutation({ onSuccess: report => { setSelectedReportId(report.id); void historyQuery.refetch(); } });
  const report = detailQuery.data;
  const metrics = report?.snapshot.metrics;
  const scopeLabel = report?.scope?.departmentName ?? (scopeType === "department" ? scopesQuery.data?.departments.find(item => item.id === departmentId)?.name : "Whole institution") ?? "Selected scope";
  const good = useMemo(() => {
    if (!metrics) return [] as string[];
    const items: string[] = [];
    if (metrics.activeStaff > 0) items.push(`${metrics.activeStaff} active staff are included in the selected scope.`);
    if (metrics.cpdEvents > 0) items.push(`${metrics.cpdEvents} CPD event${metrics.cpdEvents === 1 ? "" : "s"} were recorded in the period.`);
    if (metrics.lifeSupportCurrentOrExpiring > 0) items.push(`${metrics.lifeSupportCurrentOrExpiring} staff member${metrics.lifeSupportCurrentOrExpiring === 1 ? " has" : "s have"} current or non-expired Life Support evidence.`);
    if (metrics.qiOverdueActions === 0 && metrics.qiReports > 0) items.push("No overdue QI actions were returned at report capture.");
    return items.length ? items : ["No positive signal can be stated from the available records yet."];
  }, [metrics]);
  const attention = useMemo(() => {
    if (!metrics || !report) return [] as string[];
    const items = report.snapshot.attention.map(item => item.detail).slice(0, 5);
    if (metrics.lifeSupportMissing > 0) items.push(`${metrics.lifeSupportMissing} active staff have no current Life Support evidence in the selected records.`);
    if (metrics.credentialsExpired > 0) items.push(`${metrics.credentialsExpired} verified credential record${metrics.credentialsExpired === 1 ? " is" : "s are"} expired.`);
    if (metrics.qiOverdueActions > 0) items.push(`${metrics.qiOverdueActions} QI action${metrics.qiOverdueActions === 1 ? " is" : "s are"} overdue.`);
    return Array.from(new Set(items)).slice(0, 6);
  }, [metrics, report]);
  const downloadCsv = () => {
    if (!report || !metrics) return;
    const departmentRows = (report.snapshot.departments ?? []).map(department => ["Department", department.name, department.activeStaff, department.lifeSupportCurrentOrExpiring == null ? "unavailable" : `${department.lifeSupportCurrentOrExpiring}/${department.activeStaff}`, department.cpdVerifiedAttendance == null ? "unavailable" : `${department.cpdVerifiedAttendance}/${department.cpdAttendanceDenominator ?? 0}`, department.qiOverdueActions == null ? "unavailable" : department.qiOverdueActions, department.smallGroup ? "small group; interpret with caution" : "recorded"]);
    const rows: unknown[][] = [["Metric", "Value", "Denominator", "Status"],
      ["Active staff", metrics.activeStaff, "", "recorded"],
      ["Life Support evidence", metrics.lifeSupportCurrentOrExpiring, metrics.activeStaff, `${pct(metrics.lifeSupportCurrentOrExpiring, metrics.activeStaff)}% current/non-expired evidence`],
      ["Life Support expired", metrics.lifeSupportExpired, metrics.activeStaff, "review evidence"],
      ["Life Support missing", metrics.lifeSupportMissing, metrics.activeStaff, "review evidence"],
      ["Verified credentials", metrics.verifiedCredentials, "", "recorded evidence"],
      ["Credentials expiring within 90 days", metrics.credentialsExpiringWithin90Days, "", "plan renewal"],
      ["CPD events", metrics.cpdEvents, "", "recorded activity"],
      ["Verified CPD attendance records", metrics.cpdVerifiedAttendance, "", "recorded activity"],
      ["QI reports", metrics.qiReports, "", "recorded reports"],
      ["Open QI reports", metrics.qiOpenReports, "", "follow up"],
      ["Overdue QI actions", metrics.qiOverdueActions, "", "follow up"],
      ["Scope", scopeLabel, "", ""], ["Period (EAT)", `${report.period.periodStart} to ${report.period.periodEnd}`, "", ""],
      ...departmentRows,
      ...report.limitations.map((limitation, index) => [`Limitation ${index + 1}`, limitation, "", ""]),
    ];
    const blob = new Blob([rows.map(row => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `paeds-resus-institutional-performance-report-${institutionId}-${report.period.periodStart}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };
  const canGenerateDepartment = scopeType === "institution" || departmentId != null;

  return <div className="institution-report-print-target space-y-6 print:space-y-3">
    <Card className="border-indigo-200 bg-indigo-50/30 dark:border-indigo-900/60 dark:bg-indigo-950/10 print:hidden">
      <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-indigo-700" />Reports & Insights</CardTitle><CardDescription>One place to create a shareable institutional performance report across CPD, Life Support and credential evidence, QI/readiness records, and roster signals. Source systems remain authoritative.</CardDescription></CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-5">
        <label className="text-sm"><span className="mb-1 block font-medium">Report type</span><select className="h-10 w-full rounded-md border bg-background px-3" value={periodType} onChange={event => { const next = event.target.value as "monthly" | "quarterly"; setPeriodType(next); setPeriodStart(canonicalPeriodStart(periodStart, next)); }}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option></select></label>
        <label className="text-sm"><span className="mb-1 block font-medium">Period start (EAT)</span><input className="h-10 w-full rounded-md border bg-background px-3" type="date" value={periodStart} onChange={event => setPeriodStart(canonicalPeriodStart(event.target.value, periodType))} /><span className="mt-1 block text-xs text-muted-foreground">Calendar month start; quarterly reports snap to Jan/Apr/Jul/Oct.</span></label>
        <label className="text-sm"><span className="mb-1 block font-medium">Scope</span><select className="h-10 w-full rounded-md border bg-background px-3" value={scopeType} onChange={event => { const next = event.target.value as "institution" | "department"; setScopeType(next); if (next === "institution") setDepartmentId(undefined); }}><option value="institution" disabled={!scopesQuery.data?.wholeInstitution}>Whole institution</option><option value="department">Department</option></select></label>
        <label className="text-sm"><span className="mb-1 block font-medium">Department</span><select className="h-10 w-full rounded-md border bg-background px-3" value={departmentId ?? ""} disabled={scopeType !== "department"} onChange={event => setDepartmentId(Number(event.target.value) || undefined)}><option value="">Select department</option>{scopesQuery.data?.departments.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <div className="flex items-end"><Button className="w-full" disabled={generate.isPending || !canGenerateDepartment} onClick={() => generate.mutate(scopeInput)}>{generate.isPending ? "Generating…" : "Create one-page report"}</Button></div>
      </CardContent>
      {!scopesQuery.data?.wholeInstitution ? <p className="px-6 pb-4 text-xs text-muted-foreground">Your access is department-scoped. Whole-institution data is not available to this role.</p> : null}
      {generate.error ? <p className="px-6 pb-4 text-sm text-amber-800">The report could not be created. No conclusion is inferred while the source contract is unavailable.</p> : null}
    </Card>

    <Card className="institution-report-print-sheet print:border-0 print:shadow-none">
      <CardHeader className="border-b"><div className="hidden print:flex print:items-start print:justify-between print:gap-4 print:pb-4"><div className="flex items-center gap-3"><img src="/paeds-resus-logo-brand.png" alt="Paeds Resus" className="h-12 w-auto object-contain" /><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-800">Paeds Resus</p><p className="text-xl font-bold text-slate-950">Institutional performance report</p><p className="text-xs text-slate-600">Administrative signals for learning, evidence, and follow-through</p></div></div><div className="text-right text-xs text-slate-600"><p className="font-semibold text-slate-900">{institutionName}</p><p>{scopeLabel}</p><p>{report ? `${report.period.periodStart} to ${report.period.periodEnd}` : "Draft report"} · EAT</p></div></div><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:hidden"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Paeds Resus institutional report</p><CardTitle className="mt-1">Institutional performance report</CardTitle><CardDescription className="mt-1">{scopeLabel} · {report ? `${report.period.periodStart} to ${report.period.periodEnd}` : "Create or select a preserved report"} · EAT calendar</CardDescription></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => window.print()} disabled={!report}><Printer className="mr-2 h-4 w-4" />Print</Button><Button size="sm" variant="outline" onClick={downloadCsv} disabled={!report}><Download className="mr-2 h-4 w-4" />CSV</Button></div></div></CardHeader>
      <CardContent className="space-y-5 pt-5 print:space-y-3">{!report ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Choose a period and scope, then create a report. A preserved snapshot will appear here for sharing with the institutional team.</div> : <>
        <div className="grid gap-3 sm:grid-cols-4"><SummaryTile label="Active staff" value={metrics?.activeStaff ?? 0} detail="recorded in scope" /><SummaryTile label="Life Support evidence" value={`${pct(metrics?.lifeSupportCurrentOrExpiring ?? 0, metrics?.activeStaff ?? 0)}%`} detail={`${metrics?.lifeSupportCurrentOrExpiring ?? 0}/${metrics?.activeStaff ?? 0} current/non-expired`} /><SummaryTile label="CPD activity" value={metrics?.cpdEvents ?? 0} detail={`${metrics?.cpdVerifiedAttendance ?? 0} verified attendance records`} /><SummaryTile label="QI actions overdue" value={metrics?.qiOverdueActions ?? 0} detail="at capture time" risk={(metrics?.qiOverdueActions ?? 0) > 0} /></div>
        <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4"><h2 className="flex items-center gap-2 font-semibold text-emerald-950"><CheckCircle2 className="h-4 w-4" />What is going well</h2><ul className="mt-3 space-y-2 text-sm text-emerald-950">{good.map(item => <li key={item}>• {item}</li>)}</ul></section><section className="rounded-lg border border-amber-200 bg-amber-50/50 p-4"><h2 className="flex items-center gap-2 font-semibold text-amber-950"><ShieldAlert className="h-4 w-4" />Needs attention</h2>{attention.length ? <ul className="mt-3 space-y-2 text-sm text-amber-950">{attention.map(item => <li key={item}>• {item}</li>)}</ul> : <p className="mt-3 text-sm text-amber-950">No attention record was returned. This is not a claim that competence or safety is established.</p>}</section></div>
        {scopeType === "institution" && report.snapshot.departments?.length ? <section className="print:break-inside-avoid"><h2 className="mb-2 font-semibold">Department scorecard</h2><p className="mb-2 text-xs text-muted-foreground">Department comparisons use canonical department mappings only. No composite rank or score is produced; groups below five active staff are shown with caution.</p><div className="overflow-x-auto rounded-lg border"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs uppercase"><tr><th className="p-3">Department</th><th className="p-3">Active staff</th><th className="p-3">Life Support evidence</th><th className="p-3">CPD verified / events</th><th className="p-3">Overdue QI</th><th className="p-3">Interpretation</th></tr></thead><tbody>{report.snapshot.departments.map(department => <tr key={department.id} className="border-t"><td className="p-3 font-medium">{department.name}</td><td className="p-3">{department.activeStaff}</td><td className="p-3">{department.lifeSupportCurrentOrExpiring == null ? "Unavailable" : `${department.lifeSupportCurrentOrExpiring}/${department.activeStaff}`}</td><td className="p-3">{department.cpdVerifiedAttendance == null ? "Unavailable" : `${department.cpdVerifiedAttendance}/${department.cpdAttendanceDenominator ?? 0}`}</td><td className="p-3">{department.qiOverdueActions == null ? "Unavailable" : department.qiOverdueActions}</td><td className="p-3 text-muted-foreground">{department.smallGroup ? "Small group; interpret with caution" : "Administrative signal only"}</td></tr>)}</tbody></table></div></section> : null}
        <section><h2 className="mb-2 font-semibold">Key measures</h2><div className="overflow-x-auto rounded-lg border"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs uppercase"><tr><th className="p-3">Measure</th><th className="p-3">Value</th><th className="p-3">Denominator / context</th><th className="p-3">Status</th></tr></thead><tbody>{[["Life Support evidence", `${metrics?.lifeSupportCurrentOrExpiring ?? 0}`, `${metrics?.activeStaff ?? 0} active staff`, `${pct(metrics?.lifeSupportCurrentOrExpiring ?? 0, metrics?.activeStaff ?? 0)}% current/non-expired`],["Credential evidence", `${metrics?.verifiedCredentials ?? 0}`, "verified records", `${metrics?.credentialsExpiringWithin90Days ?? 0} expiring within 90 days`],["CPD attendance", `${metrics?.cpdVerifiedAttendance ?? 0}`, `${metrics?.cpdEvents ?? 0} CPD events`, "verified activity records"],["CPD presenting", `${(metrics?.cpdLeadPresenters ?? 0) + (metrics?.cpdCoPresenters ?? 0)}`, `${metrics?.cpdLeadPresenters ?? 0} lead · ${metrics?.cpdCoPresenters ?? 0} co-presented`, "presenting is separate from attendance"],["QI / readiness", `${metrics?.qiOpenReports ?? 0} open`, `${metrics?.qiReports ?? 0} reports`, `${metrics?.qiOverdueActions ?? 0} overdue actions`]].map(row => <tr key={row[0]} className="border-t"><td className="p-3 font-medium">{row[0]}</td><td className="p-3">{row[1]}</td><td className="p-3 text-muted-foreground">{row[2]}</td><td className="p-3"><Badge variant={row[3].includes("overdue") || row[3].includes("expiring") ? "outline" : "secondary"}>{row[3]}</Badge></td></tr>)}</tbody></table></div></section>
        <section className="rounded-lg border bg-muted/20 p-4"><h2 className="font-semibold">Actions to close</h2><p className="mt-1 text-xs text-muted-foreground">Use the authoritative Accountability, Readiness, CPD, or Administration workflow to assign and close actions. Names are intentionally excluded from this institutional report.</p>{report.snapshot.attention.length ? <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{report.snapshot.attention.slice(0, 6).map(item => <li key={item.id} className="rounded border bg-background p-2"><span className="font-medium">{item.title}</span><span className="mt-1 block text-xs text-muted-foreground">{item.count} record(s) · owner/due date available in source workflow</span></li>)}</ul> : <p className="mt-3 text-sm">No recorded action was returned for this scope at capture time.</p>}</section>
        <section className="border-t pt-4 text-xs text-muted-foreground"><p><strong>Data limitations:</strong> {report.limitations.join(" ")}</p><p className="mt-2">Generated {new Date(report.generatedAt).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })} EAT. Source availability: {Object.entries(report.disclosures.sourceAvailability).map(([key, value]) => `${key} ${value}`).join(" · ")}.</p><p className="mt-2 font-medium text-slate-700">Administrative signals only — not a competence, accreditation, licensure, or clinical-performance score.</p></section>
      </>}</CardContent>
    </Card>

    {historyQuery.data?.length ? <Card className="print:hidden"><CardHeader><CardTitle className="text-base">Preserved report history</CardTitle><CardDescription>Only same-scope snapshots are listed. Comparisons are not shown unless period type, version, scope, and contiguous periods match. {historyQuery.data.length < 2 ? "Insufficient history for a comparison." : "No comparable trend is shown unless those safeguards are satisfied."}</CardDescription></CardHeader><CardContent className="grid gap-2 sm:grid-cols-3">{historyQuery.data.slice(0, 6).map(item => <button type="button" key={item.id} onClick={() => setSelectedReportId(item.id)} className={`rounded-lg border p-3 text-left text-xs hover:bg-muted ${selectedHistoryId === item.id ? "border-indigo-400 bg-indigo-50/60" : ""}`}><span className="font-medium">{item.period.periodStart} to {item.period.periodEnd}</span><span className="mt-1 block text-muted-foreground">{item.period.type} · {item.metrics.activeStaff} active staff</span><span className="mt-1 block text-muted-foreground">{item.sourceAvailability.credentials ?? "unknown"} credential source</span></button>)}</CardContent></Card> : null}
  </div>;
}

function SummaryTile({ label, value, detail, risk = false }: { label: string; value: string | number; detail: string; risk?: boolean }) { return <div className={`rounded-lg border p-4 ${risk ? "border-amber-200 bg-amber-50/50" : "bg-muted/20"}`}><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>; }
