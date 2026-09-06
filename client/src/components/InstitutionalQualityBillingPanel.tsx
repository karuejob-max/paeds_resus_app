import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function InstitutionalQualityBillingPanel({ institutionId, canManageBilling = false }: { institutionId: number; canManageBilling?: boolean }) {
  const [reportType, setReportType] = useState<"safety_event" | "improvement_project">("safety_event");
  const [title, setTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [careArea, setCareArea] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const utils = trpc.useUtils();
  const reports = trpc.institutionalQi.listReports.useQuery({ institutionalAccountId: institutionId, limit: 50 });
  const invoices = trpc.institutionalBilling.listInvoices.useQuery({ institutionalAccountId: institutionId, limit: 10 }, { enabled: canManageBilling });
  const launchOverview = trpc.institutionalBilling.getLaunchOverview.useQuery({ institutionalAccountId: institutionId, product: "iers" }, { enabled: canManageBilling });
  const retentionPolicy = trpc.institutionalQi.getRetentionPolicy.useQuery({ institutionalAccountId: institutionId }, { enabled: canManageBilling });
  const createReport = trpc.institutionalQi.createReport.useMutation({
    onSuccess: async () => {
      setTitle(""); setProblemStatement(""); setCareArea("");
      await utils.institutionalQi.listReports.invalidate();
      toast.success("QI report saved");
    },
    onError: error => toast.error(error.message),
    onSettled: () => setSaving(false),
  });

  const exportReports = trpc.institutionalQi.requestExport.useMutation({
    onSuccess: result => {
      const blob = new Blob([JSON.stringify(result.rows, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `paeds-resus-qi-export-${result.exportId}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${result.rowCount} report${result.rowCount === 1 ? "" : "s"}.`);
    },
    onError: error => toast.error(error.message),
    onSettled: () => setExporting(false),
  });

  const submitReport = (status: "draft" | "submitted") => {
    if (title.trim().length < 3 || problemStatement.trim().length < 10) {
      toast.error("Add a clear title and a problem statement of at least 10 characters.");
      return;
    }
    setSaving(true);
    createReport.mutate({ institutionalAccountId: institutionId, reportType, title, problemStatement, careArea: careArea || undefined, status, harmOccurred: false, severity: "low", confidentialityLevel: "institution_only" });
  };

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,26rem)]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Structured quality improvement</CardTitle>
          <CardDescription>Capture a safety event or improvement project once, then move it through action and verified effectiveness review.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium">Report type<select className="mt-1 min-h-10 w-full rounded-md border bg-background px-3 py-2 font-normal" value={reportType} onChange={event => setReportType(event.target.value as typeof reportType)}><option value="safety_event">Safety event</option><option value="improvement_project">Improvement project</option></select></label>
            <label className="space-y-1 text-sm font-medium">Care area<input className="mt-1 min-h-10 w-full rounded-md border bg-background px-3 py-2 font-normal" value={careArea} onChange={event => setCareArea(event.target.value)} placeholder="e.g. triage, ward, theatre" /></label>
          </div>
          <label className="block space-y-1 text-sm font-medium">Title<Input value={title} onChange={event => setTitle(event.target.value)} placeholder="Short, specific description" /></label>
          <label className="block space-y-1 text-sm font-medium">Problem statement<Textarea value={problemStatement} onChange={event => setProblemStatement(event.target.value)} placeholder="What happened or what improvement is needed? Include the expected process and observed gap where known." className="min-h-28" /></label>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end"><Button variant="outline" disabled={saving} onClick={() => submitReport("draft")}>Save draft</Button><Button disabled={saving} onClick={() => submitReport("submitted")}>Submit for review</Button></div>
        </CardContent>
      </Card>

      <div className="min-w-0 space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Report queue</CardTitle><CardDescription>{reports.data?.length ?? 0} reports in this workspace</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {reports.isLoading ? <p className="text-sm text-muted-foreground">Loading reports…</p> : reports.data?.length ? reports.data.map(report => <div key={report.id} className="rounded-lg border p-3"><div className="flex flex-wrap items-start justify-between gap-2"><p className="font-medium">{report.title}</p><Badge variant="outline">{report.status.replaceAll("_", " ")}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{report.reportType.replaceAll("_", " ")} · {report.careArea || "Care area not set"}</p></div>) : <p className="text-sm text-muted-foreground">No reports yet. Start with a safety event or improvement project.</p>}
          </CardContent>
        </Card>
        {canManageBilling ? <>
          <Card>
            <CardHeader><CardTitle className="text-base">Institution billing</CardTitle><CardDescription>Annual invoice-first renewal. Card autopay is optional; M-Pesa and bank transfer remain invoice-led.</CardDescription></CardHeader>
            <CardContent className="space-y-3">{invoices.isLoading ? <p className="text-sm text-muted-foreground">Loading invoices…</p> : invoices.data?.length ? invoices.data.map(invoice => <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"><div><p className="font-medium">{invoice.invoiceNumber}</p><p className="text-xs text-muted-foreground">{invoice.currency} {(invoice.amountCents / 100).toLocaleString()} · {invoice.status} · reconciliation {invoice.reconciliationStatus}</p></div><Badge variant={invoice.status === "paid" ? "default" : "outline"}>{invoice.status.replaceAll("_", " ")}</Badge></div>) : <p className="text-sm text-muted-foreground">No institutional invoices have been issued.</p>}</CardContent>
          </Card>
                    <Card>
            <CardHeader><CardTitle className="text-base">QI governance</CardTitle><CardDescription>Exports are recorded and expire after 24 hours. Aggregate exports exclude narrative fields.</CardDescription></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><span className="font-medium">Retention:</span> {retentionPolicy.data && "configured" in retentionPolicy.data && retentionPolicy.data.configured === false ? "Not configured — default 7-year review window" : `${retentionPolicy.data?.retentionDays ?? 2555} days`}</p>
              <div className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" disabled={exporting} onClick={() => { setExporting(true); exportReports.mutate({ institutionalAccountId: institutionId, format: "json", confidentialityScope: "institution_only", limit: 500 }); }}>{exporting ? "Preparing export…" : "Export institution QI data"}</Button><Button variant="outline" disabled={exporting} onClick={() => { setExporting(true); exportReports.mutate({ institutionalAccountId: institutionId, format: "json", confidentialityScope: "aggregate_only", limit: 500 }); }}>Export aggregate QI data</Button></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Launch readiness</CardTitle>
<CardDescription>Operational checks for consent, payment configuration, webhooks, and reconciliation.</CardDescription></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {launchOverview.isLoading ? <p className="text-muted-foreground">Loading launch status…</p> : launchOverview.data ? <>
                <p><span className="font-medium">Consent:</span> {launchOverview.data.launchGates.consentConfigured ? "Configured" : "Needs configuration"}</p>
                <p><span className="font-medium">Payment provider:</span> {launchOverview.data.launchGates.paymentProviderConfigured ? "Configured" : "Credentials pending"}</p>
                <p><span className="font-medium">Webhook secret:</span> {launchOverview.data.launchGates.webhookSecretConfigured ? "Configured" : "Secret pending"}</p>
                <p><span className="font-medium">Reconciliation:</span> {launchOverview.data.launchGates.reconciliationReady ? "No unreconciled attempts" : "Finance review required"}</p>
                {launchOverview.data.attempts.length ? <div className="mt-3 space-y-2"><p className="font-medium">Recent payment attempts</p>{launchOverview.data.attempts.slice(0, 5).map(attempt => <div key={attempt.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-xs"><span>{attempt.provider} · {attempt.paymentMethod} · {attempt.status}</span><Badge variant={attempt.reconciliationStatus === "matched" ? "default" : "outline"}>{attempt.reconciliationStatus}</Badge></div>)}</div> : <p className="text-muted-foreground">No payment attempts recorded.</p>}
              </> : <p className="text-muted-foreground">Launch status is unavailable.</p>}
            </CardContent>
          </Card>
        </> : null}
      </div>
    </div>
  );
}
