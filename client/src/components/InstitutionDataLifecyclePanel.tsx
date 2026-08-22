import { useEffect, useMemo, useState } from "react";
import { Archive, Download, FileText, LifeBuoy, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const PRODUCTS = [
  { key: "iers" as const, label: "IERS", description: "Readiness, activation, evidence, drills, actions, and implementation records." },
  { key: "cpd_portal" as const, label: "CPD Portal", description: "Sessions, attendance, staff development, and CPD records." },
];

type ProductKey = (typeof PRODUCTS)[number]["key"];

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function InstitutionDataLifecyclePanel({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const isPlatformAdmin = user?.role === "admin";
  const [selectedProduct, setSelectedProduct] = useState<ProductKey>("iers");
  const [retentionDays, setRetentionDays] = useState("3650");
  const [legalHold, setLegalHold] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const lifecycleQuery = trpc.institutionProducts.getDataLifecycle.useQuery({ institutionId });
  const exportData = trpc.institutionProducts.exportProductData.useMutation({
    onSuccess: (result) => {
      downloadCsv(result.filename, result.content);
      toast.success(`${result.productKey === "iers" ? "IERS" : "CPD Portal"} export downloaded (${result.recordCount} records)`);
      void utils.institutionProducts.getDataLifecycle.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message || "Could not create the product export"),
  });
  const updatePolicy = trpc.institutionProducts.updateDataLifecyclePolicy.useMutation({
    onSuccess: () => {
      toast.success("Data-lifecycle policy saved");
      void utils.institutionProducts.getDataLifecycle.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message || "Could not save the data-lifecycle policy"),
  });
  const requestLifecycle = trpc.institutionProducts.requestDataLifecycle.useMutation({
    onSuccess: (_, variables) => {
      toast.success(`${variables.requestType === "recovery" ? "Recovery" : "Offboarding"} request recorded for platform review`);
      void utils.institutionProducts.getDataLifecycle.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message || "Could not record the lifecycle request"),
  });
  const reviewLifecycle = trpc.institutionProducts.reviewDataLifecycleRequest.useMutation({
    onSuccess: () => {
      setReviewNote("");
      toast.success("Lifecycle request status updated");
      void utils.institutionProducts.getDataLifecycle.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message || "Could not update the lifecycle request"),
  });

  const selectedPolicy = useMemo(() => lifecycleQuery.data?.policies.find((policy) => policy.productKey === selectedProduct), [lifecycleQuery.data?.policies, selectedProduct]);
  useEffect(() => {
    if (selectedPolicy) {
      setRetentionDays(String(selectedPolicy.retentionDays));
      setLegalHold(selectedPolicy.legalHold);
    }
  }, [selectedPolicy]);

  const savePolicy = () => {
    const days = Number(retentionDays);
    if (!Number.isInteger(days) || days < 30 || days > 3650) {
      toast.error("Retention must be a whole number between 30 and 3650 days");
      return;
    }
    updatePolicy.mutate({
      institutionId,
      productKey: selectedProduct,
      retentionDays: days,
      legalHold,
      reason: `${selectedProduct === "iers" ? "IERS" : "CPD Portal"} retention policy reviewed in Administration.`,
    });
  };

  const request = (requestType: "recovery" | "offboarding") => {
    requestLifecycle.mutate({
      institutionId,
      productKey: selectedProduct,
      requestType,
      reason: requestType === "recovery"
        ? `Request controlled recovery review for ${selectedProduct === "iers" ? "IERS" : "CPD Portal"} data and access.`
        : `Request controlled offboarding review for ${selectedProduct === "iers" ? "IERS" : "CPD Portal"}; preserve records until an approved retention decision is completed.`,
    });
  };

  const review = (requestId: number, status: "approved" | "in_progress" | "completed" | "cancelled") => {
    reviewLifecycle.mutate({
      institutionId,
      requestId,
      status,
      reviewNote: reviewNote.trim() || `Platform administrator marked this request ${status}.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Product-filtered exports</CardTitle>
          <CardDescription>Exports contain only the selected product’s structured institutional records. Free-text activation and evidence narratives are deliberately excluded from this first portability package.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {PRODUCTS.map((product) => (
            <div key={product.key} className="rounded-lg border p-4">
              <p className="font-semibold">{product.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
              <Button className="mt-4" variant="outline" onClick={() => exportData.mutate({ institutionId, productKey: product.key })} disabled={exportData.isPending}>
                <Download className="mr-2 h-4 w-4" />{exportData.isPending ? "Preparing…" : `Download ${product.label} CSV`}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LockKeyhole className="h-5 w-5" />Retention and legal hold</CardTitle>
          <CardDescription>Changing a policy never deletes records automatically. Legal hold prevents future cleanup until the hold is explicitly released.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">{PRODUCTS.map((product) => <Button key={product.key} type="button" size="sm" variant={selectedProduct === product.key ? "default" : "outline"} onClick={() => setSelectedProduct(product.key)}>{product.label}</Button>)}</div>
          <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-end">
            <div className="space-y-2"><label className="text-sm font-medium" htmlFor="retention-days">Retention days</label><Input id="retention-days" type="number" min={30} max={3650} value={retentionDays} onChange={(event) => setRetentionDays(event.target.value)} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={legalHold} onChange={(event) => setLegalHold(event.target.checked)} />Place this product on legal hold</label>
          </div>
          <div className="flex flex-wrap items-center gap-3"><Button onClick={savePolicy} disabled={updatePolicy.isPending}>{updatePolicy.isPending ? "Saving…" : "Save policy"}</Button>{selectedPolicy && <span className="text-xs text-muted-foreground">Current policy: {selectedPolicy.retentionDays} days · {selectedPolicy.legalHold ? "legal hold active" : "no legal hold"}</span>}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Recovery and offboarding controls</CardTitle>
          <CardDescription>These actions create reviewable requests. They do not revoke emergency continuity or erase institutional history from the browser.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={() => request("recovery")} disabled={requestLifecycle.isPending}><RefreshCw className="mr-2 h-4 w-4" />Request {selectedProduct === "iers" ? "IERS" : "CPD"} recovery review</Button><Button type="button" variant="outline" className="border-red-200 text-red-700" onClick={() => request("offboarding")} disabled={requestLifecycle.isPending}><Archive className="mr-2 h-4 w-4" />Request controlled offboarding</Button></div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><LifeBuoy className="mr-2 inline h-4 w-4" />Offboarding requires a platform review, export confirmation, retention decision, and emergency-continuity check before any access change.</div>
          {isPlatformAdmin && <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3"><p className="text-sm font-medium text-blue-950">Platform review note</p><Input value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Record the review decision or execution note" maxLength={2000} /><p className="text-xs text-blue-900/70">Review controls are visible only to Paeds Resus platform administrators. No request automatically deletes data or interrupts active IERS events.</p></div>}
          <div className="rounded-lg border"><div className="border-b px-4 py-3 text-sm font-medium">Recent lifecycle requests</div>{lifecycleQuery.isLoading ? <p className="p-4 text-sm text-muted-foreground">Loading lifecycle history…</p> : !lifecycleQuery.data?.requests.length ? <p className="p-4 text-sm text-muted-foreground">No lifecycle requests recorded.</p> : <div className="divide-y">{lifecycleQuery.data.requests.map((requestRow) => <div key={requestRow.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{requestRow.productKey} · {requestRow.requestType.replaceAll("_", " ")}</p><p className="text-xs text-muted-foreground">{requestRow.reason}</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant={requestRow.status === "completed" ? "default" : requestRow.status === "cancelled" ? "outline" : "secondary"}>{requestRow.status}</Badge>{isPlatformAdmin && requestRow.status !== "completed" && requestRow.status !== "cancelled" && requestRow.requestType !== "export" && <>{requestRow.status === "requested" && <Button type="button" size="sm" variant="outline" onClick={() => review(requestRow.id, "approved")} disabled={reviewLifecycle.isPending}>Approve</Button>}{requestRow.status === "approved" && <Button type="button" size="sm" variant="outline" onClick={() => review(requestRow.id, "in_progress")} disabled={reviewLifecycle.isPending}>Start</Button>}{requestRow.status === "in_progress" && <Button type="button" size="sm" onClick={() => review(requestRow.id, "completed")} disabled={reviewLifecycle.isPending}>Complete</Button>}<Button type="button" size="sm" variant="ghost" onClick={() => review(requestRow.id, "cancelled")} disabled={reviewLifecycle.isPending}>Cancel</Button></>}</div></div>)}</div>}</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InstitutionDataLifecyclePanel;
