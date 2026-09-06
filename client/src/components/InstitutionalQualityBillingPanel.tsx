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
  const utils = trpc.useUtils();
  const reports = trpc.institutionalQi.listReports.useQuery({ institutionalAccountId: institutionId, limit: 50 });
  const invoices = trpc.institutionalBilling.listInvoices.useQuery({ institutionalAccountId: institutionId, limit: 10 }, { enabled: canManageBilling });
  const createReport = trpc.institutionalQi.createReport.useMutation({
    onSuccess: async () => {
      setTitle(""); setProblemStatement(""); setCareArea("");
      await utils.institutionalQi.listReports.invalidate();
      toast.success("QI report saved");
    },
    onError: error => toast.error(error.message),
    onSettled: () => setSaving(false),
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
        {canManageBilling ? <Card>
          <CardHeader><CardTitle className="text-base">Institution billing</CardTitle><CardDescription>Annual invoice-first renewal. Card autopay is optional; M-Pesa and bank transfer remain invoice-led.</CardDescription></CardHeader>
          <CardContent className="space-y-3">{invoices.isLoading ? <p className="text-sm text-muted-foreground">Loading invoices…</p> : invoices.data?.length ? invoices.data.map(invoice => <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"><div><p className="font-medium">{invoice.invoiceNumber}</p><p className="text-xs text-muted-foreground">{invoice.currency} {(invoice.amountCents / 100).toLocaleString()} · {invoice.status}</p></div><Badge variant={invoice.status === "paid" ? "default" : "outline"}>{invoice.status.replaceAll("_", " ")}</Badge></div>) : <p className="text-sm text-muted-foreground">No institutional invoices have been issued.</p>}</CardContent>
        </Card> : null}
      </div>
    </div>
  );
}
