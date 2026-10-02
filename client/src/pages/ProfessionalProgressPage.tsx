import { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { AlertCircle, CheckCircle2, FileCheck2, Printer, Target } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function periodDates() {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  return { start, end };
}

function MetricCard({ title, value, detail, tone = "teal" }: { title: string; value: number; detail: string; tone?: "teal" | "indigo" | "amber" }) {
  const colour = tone === "indigo" ? "text-indigo-700" : tone === "amber" ? "text-amber-700" : "text-teal-700";
  return <Card><CardHeader className="pb-2"><CardDescription>{title}</CardDescription><CardTitle className={`text-3xl ${colour}`}>{value}%</CardTitle></CardHeader><CardContent><Progress value={value} className="h-2" /><p className="mt-2 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}

export default function ProfessionalProgressPage() {
  const [, verifyParams] = useRoute("/verify-progress/:verificationCode");
  const { user, loading } = useAuth({ redirectOnUnauthenticated: !verifyParams, redirectPath: "/login?next=%2Fmy-progress" });
  const defaults = useMemo(periodDates, []);
  const [periodType, setPeriodType] = useState<"monthly" | "quarterly" | "annual">("monthly");
  const [periodStart, setPeriodStart] = useState(defaults.start);
  const [periodEnd, setPeriodEnd] = useState(defaults.end);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("1");
  const [verifiedCode, setVerifiedCode] = useState<string | null>(null);
  const reportInput = { reportType: periodType, periodStart, periodEnd } as const;
  const reportQuery = trpc.professionalProgress.getMyReport.useQuery(reportInput, { enabled: Boolean(user && !verifyParams), retry: false });
  const goalsQuery = trpc.professionalProgress.listMyGoals.useQuery(undefined, { enabled: Boolean(user && !verifyParams), retry: false });
  const verifyQuery = trpc.professionalProgress.verifyReport.useQuery({ verificationCode: verifyParams?.verificationCode ?? "" }, { enabled: Boolean(verifyParams?.verificationCode), retry: false });
  const createReport = trpc.professionalProgress.createVerifiedReport.useMutation({ onSuccess: result => setVerifiedCode(result.verificationCode) });
  const createGoal = trpc.professionalProgress.createGoal.useMutation({ onSuccess: async () => { setGoalTitle(""); await goalsQuery.refetch(); } });

  if (verifyParams) {
    const verified = verifyQuery.data;
    return <main className="min-h-screen bg-muted/20 px-4 py-10"><Card className="mx-auto max-w-3xl"><CardHeader><CardTitle className="flex items-center gap-2"><FileCheck2 className="h-5 w-5 text-teal-700" />Professional progress verification</CardTitle><CardDescription>Public verification of a learner-approved progress snapshot.</CardDescription></CardHeader><CardContent>{verifyQuery.isLoading ? <p>Checking verification record…</p> : verified?.verified ? <div className="space-y-4"><div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-5 w-5" />Verified snapshot</div><p><strong>{verified.subjectName}</strong> · {verified.cadre || "Provider"}</p><p className="text-sm text-muted-foreground">{verified.reportType} report · {String(verified.periodStart)} to {String(verified.periodEnd)}</p><p className="break-all rounded bg-muted p-3 font-mono text-xs">SHA-256: {verified.snapshotHash}</p><Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print verified record</Button></div> : <div className="flex items-center gap-2 text-red-700"><AlertCircle className="h-5 w-5" />This progress record could not be verified.</div>}</CardContent></Card></main>;
  }

  if (loading || !user || reportQuery.isLoading) return <main className="p-8 text-center">Loading your professional progress…</main>;
  if (reportQuery.isError) return <main className="p-8 text-center text-red-700">Your progress record could not be loaded. No learning data was changed.</main>;
  const report = reportQuery.data as any;
  if (!report) return <main className="p-8 text-center">No progress record is available for this period yet.</main>;
  const lifeSupport = report.lifeSupport as Array<{ program: string; source: string; phase: string; percentage: number }>;
  const averageLifeSupport = lifeSupport.length ? Math.round(lifeSupport.reduce((sum: number, item: { percentage: number }) => sum + item.percentage, 0) / lifeSupport.length) : 0;
  const fellowship = report.fellowship?.overallPercentage ?? 0;

  return <main className="min-h-screen bg-muted/20 px-4 py-8 md:px-8 print:bg-white"><div className="mx-auto max-w-6xl space-y-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wider text-teal-700">My Professional Progress</p><h1 className="mt-2 text-3xl font-bold">Your learning record, not just a score</h1><p className="mt-2 text-muted-foreground">Life-support pathway progress, Fellowship coursework, verified CPD, goals, and certificates in one period view.</p></div><div className="flex gap-2 print:hidden"><Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print / save PDF</Button><Link href="/fellowship/progress"><Button variant="outline">Fellowship detail</Button></Link></div></div>
    <Card className="print:hidden"><CardContent className="flex flex-wrap items-end gap-3 pt-5"><label className="text-sm">Report period<select className="mt-1 block h-10 rounded-md border bg-background px-3" value={periodType} onChange={e => setPeriodType(e.target.value as typeof periodType)}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option></select></label><label className="text-sm">From<Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} /></label><label className="text-sm">To<Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} /></label><Button onClick={() => reportQuery.refetch()}>Refresh record</Button><Button variant="secondary" onClick={() => createReport.mutate(reportInput)} disabled={createReport.isPending}><FileCheck2 className="mr-2 h-4 w-4" />{createReport.isPending ? "Signing…" : "Create verifiable snapshot"}</Button></CardContent></Card>
    {verifiedCode ? <Card className="border-emerald-200 bg-emerald-50 print:hidden"><CardContent className="pt-5"><p className="font-semibold text-emerald-900">Snapshot created and signed for verification.</p><p className="mt-1 break-all font-mono text-xs">{window.location.origin}/verify-progress/{verifiedCode}</p><p className="mt-2 text-sm text-emerald-800">Print this page now, or share the verification link with an interviewer, appraiser, or recommender.</p></CardContent></Card> : null}
    <div className="grid gap-4 md:grid-cols-3"><MetricCard title="Life-support pathways" value={averageLifeSupport} detail={`${lifeSupport.length} BLS/ACLS/PALS/NRP record(s), labelled by pathway`} /><MetricCard title="Fellowship coursework" value={fellowship} detail="Fellowship progress remains separate from optional AHA certification" tone="indigo" /><MetricCard title="CPD participation" value={Math.min(100, report.cpd.verifiedSessions ? 100 : 0)} detail={`${report.cpd.verifiedSessions} verified session(s) · ${report.cpd.points} points`} tone="amber" /></div>
    <Card><CardHeader><CardTitle>Life-support progress</CardTitle><CardDescription>Each record shows the programme source, phase, and percentage of the complete journey.</CardDescription></CardHeader><CardContent className="space-y-4">{lifeSupport.length ? lifeSupport.map((item: { program: string; source: string; phase: string; percentage: number }, index: number) => <div key={`${item.program}-${index}`} className="rounded-lg border p-4"><div className="flex flex-wrap justify-between gap-2"><div><p className="font-semibold">{item.program} · {item.source}</p><p className="text-sm text-muted-foreground">{item.phase}</p></div><Badge>{item.percentage}% complete</Badge></div><Progress value={item.percentage} className="mt-3 h-2" /></div>) : <p className="text-sm text-muted-foreground">No life-support pathway record is linked to this account yet.</p>}</CardContent></Card>
    <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Verified CPD record</CardTitle><CardDescription>Only attendance marked attendance verified contributes to this record.</CardDescription></CardHeader><CardContent>{report.cpd.sessions.length ? <div className="space-y-3">{report.cpd.sessions.map((session: any, index: number) => <div key={`${session.title}-${index}`} className="flex justify-between border-b pb-2 text-sm"><span>{session.title}<br /><span className="text-muted-foreground">{String(session.date)}</span></span><span className="font-medium">{session.points} pts</span></div>)}</div> : <p className="text-sm text-muted-foreground">No verified CPD attendance in this period.</p>}</CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Professional goals</CardTitle><CardDescription>Set a measurable target for your next appraisal period.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex gap-2 print:hidden"><Input placeholder="e.g. Complete 2 CPD sessions" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} /><Input className="w-24" type="number" min="1" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} /><Button disabled={!goalTitle.trim() || createGoal.isPending} onClick={() => createGoal.mutate({ metricKey: "cpd_sessions", title: goalTitle, targetValue: Number(goalTarget), unit: "sessions", periodType, periodStart, periodEnd })}>Set</Button></div>{goalsQuery.data?.length ? goalsQuery.data.map(goal => <div key={goal.id} className="rounded border p-3 text-sm"><p className="font-medium">{goal.title}</p><p className="text-muted-foreground">Target: {goal.targetValue} {goal.unit} · {goal.periodType}</p></div>) : <p className="text-sm text-muted-foreground">No active goals yet.</p>}</CardContent></Card></div>
    <Card><CardHeader><CardTitle>Certificates and evidence</CardTitle><CardDescription>Certificates remain individually verifiable; this record links them into your period summary.</CardDescription></CardHeader><CardContent>{report.certificates.length ? <div className="grid gap-2 md:grid-cols-2">{report.certificates.map((cert: any) => <div key={cert.verificationCode || cert.certificateNumber} className="rounded border p-3 text-sm"><p className="font-medium">{String(cert.programType).replaceAll("_", " ")}</p><p className="text-muted-foreground">{cert.certificateNumber || "Certificate number pending"}</p></div>)}</div> : <p className="text-sm text-muted-foreground">No certificates issued yet.</p>}</CardContent></Card>
  </div></main>;
}
