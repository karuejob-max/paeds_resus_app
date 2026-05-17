import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Shield,
  AlertTriangle,
  Wallet,
  BookOpen,
  LifeBuoy,
  Server,
  Loader2,
  ExternalLink,
  RefreshCw,
  LineChart,
  Webhook,
  Bell,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminOps() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const adminOk = Boolean(isAuthenticated && (user as { role?: string })?.role === "admin");

  const { data: ops, isLoading, refetch, isFetching } = trpc.adminStats.getOpsHealthSnapshot.useQuery(
    undefined,
    { enabled: adminOk }
  );

  const { data: careSignal } = trpc.careSignalEvents.getAdminMetrics.useQuery(
    { timeframe: "month" },
    { enabled: adminOk }
  );

  const { data: alertDispatches, refetch: refetchAlerts } =
    trpc.adminStats.getAdminAlertDispatches.useQuery({ limit: 10 }, { enabled: adminOk });

  const runAlerts = trpc.adminStats.runAdminOpsAlertsNow.useMutation({
    onSuccess: (r) => {
      toast.success(`Alerts: ${r.alertsSent} sent (${r.rulesEvaluated} rules matched)`);
      void refetchAlerts();
    },
    onError: (e) => toast.error(e.message),
  });

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

  if (loading || !adminOk) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const hasAlerts =
    (ops?.errors.criticalCount ?? 0) > 0 ||
    (ops?.payments.staleMpesaPendingCount ?? 0) > 0 ||
    (ops?.enrollments.stuckPendingPayment.length ?? 0) > 0 ||
    (careSignal?.underReviewCount ?? 0) > 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Platform ops</h1>
              <p className="text-muted-foreground text-sm">
                Errors, payments, stuck enrollments, deployment context, Care Signal facility signal
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setLocation("/admin")}>
              ← Admin hub
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-1">Refresh</span>
            </Button>
          </div>
        </div>

        {isLoading || !ops ? (
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading ops snapshot…
          </p>
        ) : (
          <>
            {hasAlerts ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Attention needed</AlertTitle>
                <AlertDescription>
                  Review stale M-Pesa ({ops.payments.staleMpesaPendingCount}), stuck enrollments (
                  {ops.enrollments.stuckPendingPayment.length}), critical errors ({ops.errors.criticalCount}),
                  Care Signal under review ({careSignal?.underReviewCount ?? 0}).
                </AlertDescription>
              </Alert>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Server className="h-5 w-5" />
                  Deployment & staging
                </CardTitle>
                <CardDescription>
                  Use a staging branch before production changes — see{" "}
                  <code className="text-xs bg-muted px-1 rounded">docs/STAGING_BRANCH_SETUP.md</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">NODE_ENV</span>
                  <p className="font-medium">{ops.deployment.nodeEnv}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">M-Pesa mode</span>
                  <p className="font-medium">{ops.deployment.mpesaMode}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">APP base URL</span>
                  <p className="font-medium break-all">{ops.deployment.appBaseUrl ?? "—"}</p>
                </div>
                {ops.deployment.renderGitCommit ? (
                  <div>
                    <span className="text-muted-foreground">Deploy commit</span>
                    <p className="font-mono text-xs">{ops.deployment.renderGitCommit}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wallet className="h-5 w-5" />
                    Payments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>
                    Stale M-Pesa pending (&gt;24h):{" "}
                    <Badge variant={ops.payments.staleMpesaPendingCount > 0 ? "destructive" : "secondary"}>
                      {ops.payments.staleMpesaPendingCount}
                    </Badge>
                  </p>
                  <p className="text-muted-foreground">
                    Failed payments (7d): {ops.payments.failedRecent.length}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation("/admin/mpesa-reconciliation")}
                  >
                    Open M-Pesa reconciliation
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="h-5 w-5" />
                    Stuck enrollments
                  </CardTitle>
                  <CardDescription>Payment still pending after 48+ hours</CardDescription>
                </CardHeader>
                <CardContent>
                  {ops.enrollments.stuckPendingPayment.length === 0 ? (
                    <p className="text-sm text-muted-foreground">None in the last query window.</p>
                  ) : (
                    <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
                      {ops.enrollments.stuckPendingPayment.map((e) => (
                        <li key={e.id}>
                          #{e.id} user {e.userId} · {e.programType} ·{" "}
                          {e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "—"}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="px-0 mt-2"
                    onClick={() => setLocation("/admin/reports")}
                  >
                    Full enrollment ledger →
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-5 w-5" />
                  Server errors
                </CardTitle>
                <CardDescription>
                  From <code className="text-xs">errorTracking</code> (status=new)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ops.errors.recent.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No new errors in recent window.</p>
                ) : (
                  <ul className="text-xs space-y-2 max-h-48 overflow-y-auto">
                    {ops.errors.recent.map((err) => (
                      <li key={err.id} className="border-b border-border/60 pb-2">
                        <Badge variant="outline" className="mr-1">
                          {err.severity}
                        </Badge>
                        <span className="font-medium">{err.errorType}</span>
                        <span className="text-muted-foreground block truncate">
                          {err.errorMessage ?? err.endpoint ?? "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <LineChart className="h-5 w-5" />
                  Care Signal (facility signal)
                </CardTitle>
                <CardDescription>
                  Platform-wide; top facilities from event metadata
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {careSignal ? (
                  <>
                    <p>
                      Submissions ({careSignal.timeframe}): <strong>{careSignal.totalSubmissions}</strong> ·
                      This month: {careSignal.submissionsThisMonth} · Under review:{" "}
                      {careSignal.underReviewCount}
                    </p>
                    {careSignal.topFacilities.length > 0 ? (
                      <ol className="list-decimal list-inside text-xs">
                        {careSignal.topFacilities.map((f) => (
                          <li key={f.facilityName}>
                            {f.facilityName} — {f.count}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-muted-foreground">No facility breakdown yet.</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation("/admin/facility-care-signal")}
                      >
                        Facility dashboards
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation("/admin/care-signal-review")}
                      >
                        Review queue
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation("/admin/national-signal")}
                      >
                        National signal
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Webhook className="h-5 w-5" />
                    M-Pesa webhooks
                  </CardTitle>
                  <CardDescription>Callback audit log (signature, outcomes)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation("/admin/mpesa-webhooks")}
                  >
                    Open webhook log
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bell className="h-5 w-5" />
                    Automated alerts
                  </CardTitle>
                  <CardDescription>
                    Email to ADMIN_ALERT_EMAIL when thresholds breach (6h cooldown per rule)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={runAlerts.isPending}
                    onClick={() => runAlerts.mutate()}
                  >
                    {runAlerts.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Run rules now"
                    )}
                  </Button>
                  {alertDispatches?.rows?.length ? (
                    <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                      {alertDispatches.rows.map((a) => (
                        <li key={a.id}>
                          <Badge variant="outline" className="mr-1">
                            {a.ruleKey}
                          </Badge>
                          {new Date(a.createdAt).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-xs">No recent alert dispatches.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <LifeBuoy className="h-5 w-5" />
                  Support
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                Open tickets: <strong>{ops.support.openTicketCount}</strong>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
