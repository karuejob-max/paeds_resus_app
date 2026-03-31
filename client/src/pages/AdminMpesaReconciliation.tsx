import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, RefreshCw, Download, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function AdminMpesaReconciliation() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [olderThanHours, setOlderThanHours] = useState(24);
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    if ((user as { role?: string })?.role !== "admin") {
      setLocation("/home");
    }
  }, [user, isAuthenticated, loading, setLocation]);

  const { data: readiness } = trpc.mpesa.getOperationalReadiness.useQuery(undefined, {
    enabled: isAuthenticated && (user as { role?: string })?.role === "admin",
  });

  const {
    data: stale,
    isLoading,
    refetch,
    isFetching,
  } = trpc.mpesa.getStaleMpesaPendingForReconciliation.useQuery(
    { olderThanHours, limit },
    { enabled: isAuthenticated && (user as { role?: string })?.role === "admin" }
  );

  const reconcile = trpc.mpesa.adminReconcileMpesaPayment.useMutation({
    onSuccess: () => refetch(),
  });

  const csvBlob = useMemo(() => {
    if (!stale?.payments?.length) return null;
    const headers = ["id", "enrollmentId", "userId", "amount", "transactionId", "status", "createdAt"];
    const rows = stale.payments.map((p: Record<string, unknown>) =>
      headers.map((h) => JSON.stringify(p[h] ?? "")).join(",")
    );
    const body = [headers.join(","), ...rows].join("\n");
    return new Blob([body], { type: "text/csv;charset=utf-8" });
  }, [stale]);

  const downloadCsv = () => {
    if (!csvBlob) return;
    const url = URL.createObjectURL(csvBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mpesa-stale-pending-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !isAuthenticated || (user as { role?: string })?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">M-Pesa reconciliation</h1>
              <p className="text-muted-foreground text-sm">
                Stale pending payments · STK query · CSV export (P1-ADM-1 / P2-MPESA-1)
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setLocation("/admin")}>
            ← Admin home
          </Button>
        </div>

        {readiness && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Operational readiness</CardTitle>
              <CardDescription>Non-secret checks (P0-PAY-1). Run a live STK test per runbook after green.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge variant={readiness.databaseConnected ? "default" : "destructive"}>
                DB {readiness.databaseConnected ? "OK" : "down"}
              </Badge>
              <Badge variant="secondary">
                Env: {readiness.mpesaEnvironment} · {readiness.mpesaEnvironmentSource}
              </Badge>
              <Badge variant={readiness.allRequiredForStk ? "default" : "outline"}>
                STK config {readiness.allRequiredForStk ? "complete" : "incomplete"}
              </Badge>
              {!readiness.allRequiredForStk && (
                <span className="text-sm text-muted-foreground w-full">
                  Missing: consumer key/secret, shortcode, passkey, or valid callback URL.
                </span>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>List M-Pesa payments still pending older than N hours.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Older than (hours)</Label>
              <Input
                id="hours"
                type="number"
                min={1}
                max={720}
                value={olderThanHours}
                onChange={(e) => setOlderThanHours(Number(e.target.value) || 24)}
                className="w-32"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lim">Max rows</Label>
              <Input
                id="lim"
                type="number"
                min={1}
                max={500}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value) || 100)}
                className="w-28"
              />
            </div>
            <Button type="button" variant="secondary" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Refresh</span>
            </Button>
            <Button type="button" variant="outline" onClick={downloadCsv} disabled={!csvBlob}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CardContent>
        </Card>

        {isLoading ? (
          <p className="text-muted-foreground">Loading stale payments…</p>
        ) : stale && stale.count === 0 ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>No stale pending rows</AlertTitle>
            <AlertDescription>No M-Pesa pending payments older than {stale.olderThanHours}h in this window.</AlertDescription>
          </Alert>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Enrollment</th>
                  <th className="text-left p-3">Amount (KES)</th>
                  <th className="text-left p-3">CheckoutRequestID</th>
                  <th className="text-left p-3">Created</th>
                  <th className="text-left p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {stale?.payments.map((p: Record<string, unknown>) => (
                  <tr key={String(p.id)} className="border-b">
                    <td className="p-3 font-mono">{String(p.id)}</td>
                    <td className="p-3">{String(p.userId)}</td>
                    <td className="p-3">{String(p.enrollmentId)}</td>
                    <td className="p-3">{Number(p.amount).toLocaleString()}</td>
                    <td className="p-3 max-w-[200px] truncate font-mono text-xs" title={String(p.transactionId ?? "")}>
                      {String(p.transactionId ?? "—")}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {p.createdAt ? new Date(p.createdAt as string).toLocaleString() : "—"}
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reconcile.isPending}
                        onClick={() => reconcile.mutate({ paymentId: Number(p.id) })}
                      >
                        Reconcile (STK query)
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reconcile.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Reconcile failed</AlertTitle>
            <AlertDescription>{(reconcile.error as Error)?.message ?? "Unknown error"}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
