import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Download, Loader2, RefreshCw } from "lucide-react";

const OUTCOMES = [
  "received",
  "signature_rejected",
  "invalid_payload",
  "duplicate_idempotency",
  "payment_not_found",
  "payment_completed",
  "payment_failed",
  "already_finalized",
  "persist_error",
  "acknowledged",
  "error",
] as const;

export default function AdminMpesaWebhooks() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [limit, setLimit] = useState(100);
  const [outcome, setOutcome] = useState<string>("all");
  const [checkoutRequestId, setCheckoutRequestId] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    if ((user as { role?: string })?.role !== "admin") {
      setLocation("/");
    }
  }, [user, isAuthenticated, loading, setLocation]);

  const adminOk = Boolean(isAuthenticated && (user as { role?: string })?.role === "admin");

  const { data, isLoading, refetch, isFetching } = trpc.adminStats.getMpesaWebhookLog.useQuery(
    {
      limit,
      outcome: outcome === "all" ? undefined : (outcome as (typeof OUTCOMES)[number]),
      checkoutRequestId: checkoutRequestId.trim() || undefined,
    },
    { enabled: adminOk }
  );

  const csvBlob = useMemo(() => {
    if (!data?.rows?.length) return null;
    const headers = [
      "id",
      "callbackType",
      "checkoutRequestId",
      "resultCode",
      "httpStatus",
      "outcome",
      "paymentId",
      "enrollmentId",
      "createdAt",
    ];
    const lines = data.rows.map((r) =>
      headers.map((h) => JSON.stringify((r as Record<string, unknown>)[h] ?? "")).join(",")
    );
    return new Blob([[headers.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  }, [data]);

  const downloadCsv = () => {
    if (!csvBlob) return;
    const url = URL.createObjectURL(csvBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mpesa-webhook-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !adminOk) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">M-Pesa webhook log</h1>
              <p className="text-muted-foreground text-sm">
                Audit trail for STK, timeout, query, and C2B callbacks
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setLocation("/admin")}>
              ← Admin hub
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setLocation("/admin/ops")}>
              Platform ops
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button type="button" size="sm" onClick={downloadCsv} disabled={!csvBlob}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div>
              <Label>Limit</Label>
              <Input
                type="number"
                min={1}
                max={500}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value) || 100)}
                className="w-24"
              />
            </div>
            <div>
              <Label>Outcome</Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {OUTCOMES.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>Checkout request ID</Label>
              <Input
                value={checkoutRequestId}
                onChange={(e) => setCheckoutRequestId(e.target.value)}
                placeholder="Optional exact match"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent callbacks</CardTitle>
            <CardDescription>{data?.rows.length ?? 0} rows (newest first)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : !data?.rows.length ? (
              <div className="text-sm text-muted-foreground space-y-2">
                <p>No webhook log entries yet.</p>
                <p>
                  This usually means Safaricom has not reached your STK callback since logging was enabled,
                  or migration <code className="text-xs bg-muted px-1 rounded">0040</code> was not applied.
                  Confirm <code className="text-xs bg-muted px-1 rounded">MPESA_CALLBACK_URL</code> in Render
                  matches the Daraja app URL, and check logs for{" "}
                  <code className="text-xs bg-muted px-1 rounded">[mpesaWebhookLog] insert failed</code>.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="p-2">Time</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Outcome</th>
                      <th className="p-2">HTTP</th>
                      <th className="p-2">Checkout</th>
                      <th className="p-2">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => (
                      <tr key={row.id} className="border-b border-border/40">
                        <td className="p-2 whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleString()}
                        </td>
                        <td className="p-2">{row.callbackType}</td>
                        <td className="p-2">
                          <Badge variant={row.outcome === "payment_completed" ? "default" : "outline"}>
                            {row.outcome}
                          </Badge>
                        </td>
                        <td className="p-2">{row.httpStatus}</td>
                        <td className="p-2 max-w-[120px] truncate" title={row.checkoutRequestId ?? ""}>
                          {row.checkoutRequestId ?? "—"}
                        </td>
                        <td className="p-2">{row.paymentId ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

