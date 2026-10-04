import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AdminProfessionalTruthAudit() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const audit = trpc.professionalProgress.getProfessionalTruthAudit.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin", staleTime: 30_000 });
  useEffect(() => { if (!loading && (!isAuthenticated || user?.role !== "admin")) setLocation("/"); }, [loading, isAuthenticated, user, setLocation]);
  if (loading || !isAuthenticated || user?.role !== "admin") return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (audit.isLoading) return <div className="p-8 text-muted-foreground">Running reconciliation…</div>;
  if (audit.error) return <div className="p-8 text-destructive">Unable to run the Professional Truth Audit: {audit.error.message}</div>;
  const data = audit.data;
  if (!data) return null;
  const totals = data.totals;
  const hasAttention = totals.unprojectedRecords > 0 || totals.duplicateRecords > 0 || totals.conflictingRecords > 0 || totals.missingProvenance > 0 || totals.unverifiedCompetence > 0;
  return <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
    <header className="rounded-2xl border bg-background p-6 shadow-sm"><div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><ShieldCheck className="h-6 w-6" /></div><div><p className="text-sm font-medium text-primary">Paeds Resus · Evidence Integrity</p><h1 className="mt-1 text-2xl font-semibold">Professional Truth Audit</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Control-room evidence that Professional Progress is complete, attributable, conflict-aware, and safe to share. This is not a performance score.</p></div></div></header>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[
      ["Unprojected source records", totals.unprojectedRecords], ["Duplicate records", totals.duplicateRecords], ["Conflicts", totals.conflictingRecords], ["Missing provenance", totals.missingProvenance], ["Unverified competence", totals.unverifiedCompetence],
    ].map(([label, value]) => <Card key={String(label)} className={Number(value) > 0 ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50"}><CardHeader className="pb-2"><CardDescription>{label}</CardDescription><CardTitle className="text-2xl">{String(value)}</CardTitle></CardHeader></Card>)} </section>
    <Card className={hasAttention ? "border-amber-300" : "border-emerald-300"}><CardHeader><CardTitle className="flex items-center gap-2">{hasAttention ? <AlertTriangle className="h-5 w-5 text-amber-600" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600" />} Integrity disposition</CardTitle><CardDescription>{hasAttention ? "Professional Progress must not be described as complete until the listed source gaps and conflicts are resolved or explicitly accepted as not projected." : "Covered source records have matching ledger identities and no unresolved integrity signal was detected."}</CardDescription></CardHeader><CardContent><p className="text-sm">Ontology version: <strong>{data.ontologyVersion}</strong> · Generated: {new Date(data.generatedAt).toLocaleString()}</p></CardContent></Card>
    <Card><CardHeader><CardTitle>Source reconciliation</CardTitle><CardDescription>Not projected is intentionally visible. It is not silently counted as complete.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-2">Source</th><th className="p-2">Adapter</th><th className="p-2">Source records</th><th className="p-2">Ledger records</th><th className="p-2">Missing</th><th className="p-2">Duplicates</th></tr></thead><tbody>{data.sourceCoverage.map(row => <tr key={row.source} className="border-b"><td className="p-2 font-medium">{row.source}</td><td className="p-2"><Badge variant={row.adapterStatus === "covered" ? "default" : "secondary"}>{row.adapterStatus === "covered" ? "Covered" : "Not projected"}</Badge></td><td className="p-2">{row.sourceRecords}</td><td className="p-2">{row.ledgerRecords}</td><td className="p-2">{row.missing}</td><td className="p-2">{row.duplicates}</td></tr>)}</tbody></table></div></CardContent></Card>
    <div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>Report integrity</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p>Ledger records: <strong>{totals.ledgerRecords}</strong></p><p>Expired evidence: <strong>{totals.expiredEvidence}</strong></p><p>Superseded reports: <strong>{totals.supersededReports}</strong></p><p>Active public reports: <strong>{totals.activePublicReports}</strong></p></CardContent></Card><Card><CardHeader><CardTitle>Conflicts requiring review</CardTitle></CardHeader><CardContent>{data.conflicts.length ? <div className="space-y-2">{data.conflicts.slice(0, 10).map((conflict: any) => <div key={conflict.conflictKey} className="rounded border border-amber-300 bg-amber-50 p-3 text-sm"><p className="font-medium">{conflict.subject}</p><p className="text-amber-900">{conflict.reason}</p></div>)}</div> : <p className="text-sm text-muted-foreground">No unresolved conflicts recorded.</p>}</CardContent></Card></div>
  </main>;
}
