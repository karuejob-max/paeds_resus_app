import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  Users,
  BookOpen,
  Award,
  Heart,
  Activity,
  Send,
  TrendingUp,
  FileText,
  Download,
  MapPin,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type LifecycleBatchResult = {
  dryRun: boolean;
  processedUsers: number;
  sent: number;
  skipped: number;
  userReports: Array<{ userId: number; sent: number; skipped: number; processed: number }>;
};

type LifecycleBatchHistoryItem = LifecycleBatchResult & {
  runAtIso: string;
  limitUsers: number;
  limitPerUser: number;
};

function normalizeLifecycleBatchResult(result: {
  dryRun: boolean;
  processedUsers: number;
  sent: number;
  skipped: number;
  userReports: Array<Record<string, unknown>> | Array<{ userId: number; sent: number; skipped: number; processed: number }>;
}): LifecycleBatchResult {
  return {
    dryRun: result.dryRun,
    processedUsers: result.processedUsers,
    sent: result.sent,
    skipped: result.skipped,
    userReports: result.userReports.map((report) => ({
      userId: Number(report.userId ?? 0),
      sent: Number(report.sent ?? 0),
      skipped: Number(report.skipped ?? 0),
      processed: Number(report.processed ?? 0),
    })),
  };
}

type CanaryEvidenceItem = {
  capturedAtIso: string;
  canaryVerified: boolean;
  canaryMetricsReady: boolean;
  smsAttempted: number;
  smsDeliveryRatePercent: number;
  smsFallbackCount: number;
  smsPass: boolean;
  emailAttempted: number;
  emailDeliveryRatePercent: number;
  emailFallbackCount: number;
  emailPass: boolean;
  hasCriticalAlerts: boolean;
  hasWarningAlerts: boolean;
};

const LIFECYCLE_BATCH_HISTORY_KEY = "admin_lifecycle_batch_history_v1";
const LIFECYCLE_CANARY_VERIFIED_KEY = "admin_lifecycle_canary_verified_v1";
const LIFECYCLE_CANARY_EVIDENCE_KEY = "admin_lifecycle_canary_evidence_v1";
const LIFECYCLE_CANARY_EVIDENCE_MAX_AGE_MINUTES = 30;

export default function AdminReports() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showUsers, setShowUsers] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [lifecycleLimitUsers, setLifecycleLimitUsers] = useState(100);
  const [lifecycleLimitPerUser, setLifecycleLimitPerUser] = useState(5);
  const [liveDispatchConfirmText, setLiveDispatchConfirmText] = useState("");
  const [rollbackAckText, setRollbackAckText] = useState("");
  const [canaryAckText, setCanaryAckText] = useState("");
  const [canaryVerified, setCanaryVerified] = useState(false);
  const [canaryEvidenceHistory, setCanaryEvidenceHistory] = useState<CanaryEvidenceItem[]>([]);
  const [lifecycleBatchResult, setLifecycleBatchResult] = useState<LifecycleBatchResult | null>(null);
  const [lifecycleBatchHistory, setLifecycleBatchHistory] = useState<LifecycleBatchHistoryItem[]>([]);

  const { data: report, isLoading: reportLoading } = trpc.adminStats.getReport.useQuery(
    { lastDays: 7 },
    { enabled: isAuthenticated && (user as { role?: string })?.role === "admin" }
  );

  const { data: usersData } = trpc.adminStats.getUsers.useQuery(
    { limit: 200, search: userSearch.trim() || undefined },
    { enabled: showUsers && isAuthenticated && (user as { role?: string })?.role === "admin" }
  );

  const { data: auditData } = trpc.adminStats.getAdminAuditLog.useQuery(
    { limit: 1000 },
    { enabled: showAudit && isAuthenticated && (user as { role?: string })?.role === "admin" }
  );

  // Get user's institution for heatmap
  const { data: userData } = trpc.auth.me.useQuery();
  const institutionId = (userData as { institutionId?: string })?.institutionId;

  const utils = trpc.useUtils();
  const setInstructorApprovalMutation = trpc.adminStats.setInstructorApproval.useMutation({
    onSuccess: (_data, vars) => {
      void utils.adminStats.getUsers.invalidate();
      toast.success(vars.approved ? "Instructor approved for B2B sessions" : "Instructor approval removed");
    },
    onError: (e) => toast.error(e.message || "Could not update instructor status"),
  });
  const dispatchLifecycleBatchMutation = trpc.notifications.dispatchLifecycleNudgesBatch.useMutation({
    onSuccess: (result) => {
      const normalized = normalizeLifecycleBatchResult(result);
      setLifecycleBatchResult(normalized);
      const historyItem: LifecycleBatchHistoryItem = {
        ...normalized,
        runAtIso: new Date().toISOString(),
        limitUsers: lifecycleLimitUsers,
        limitPerUser: lifecycleLimitPerUser,
      };
      setLifecycleBatchHistory((prev) => [historyItem, ...prev].slice(0, 30));
      toast.success(
        normalized.dryRun
          ? `Dry-run complete: ${normalized.processedUsers} users evaluated`
          : `Dispatch complete: ${normalized.sent} sent, ${normalized.skipped} skipped`
      );
      if (!normalized.dryRun) {
        setLiveDispatchConfirmText("");
        setRollbackAckText("");
        setCanaryAckText("");
      }
    },
    onError: (e) => toast.error(e.message || "Could not run lifecycle batch dispatch"),
  });
  const { data: lifecycleDispatchSummary } = trpc.notifications.getLifecycleDispatchSummary.useQuery(
    { lastDays: 7 },
    { enabled: isAuthenticated && (user as { role?: string })?.role === "admin" }
  );
  const { data: lifecycleDispatchSummary30d } = trpc.notifications.getLifecycleDispatchSummary.useQuery(
    { lastDays: 30 },
    { enabled: isAuthenticated && (user as { role?: string })?.role === "admin" }
  );
  const matchingDryRun = useMemo(() => {
    const now = Date.now();
    return lifecycleBatchHistory.find(
      (run) =>
        run.dryRun &&
        run.limitUsers === lifecycleLimitUsers &&
        run.limitPerUser === lifecycleLimitPerUser &&
        now - new Date(run.runAtIso).getTime() <= 30 * 60 * 1000
    );
  }, [lifecycleBatchHistory, lifecycleLimitUsers, lifecycleLimitPerUser]);
  const getCanaryStatusForChannel = (channel: "sms" | "email") => {
    const sent = Number(lifecycleDispatchSummary?.channelTotals?.[channel]?.sent ?? 0);
    const failed = Number(lifecycleDispatchSummary?.channelTotals?.[channel]?.failed ?? 0);
    const attempted = sent + failed;
    const deliveryRatePercent = attempted > 0 ? Math.round((sent / attempted) * 100) : 0;
    const fallbackCount = Number(lifecycleDispatchSummary?.channelFallbackActivations?.[channel] ?? 0);
    const fallbackObserved = fallbackCount > 0;
    const healthyCanary = attempted >= 20 && deliveryRatePercent >= 85;
    return {
      attempted,
      deliveryRatePercent,
      fallbackCount,
      fallbackObserved,
      healthyCanary,
      pass: healthyCanary || fallbackObserved,
    };
  };
  const smsCanaryStatus = getCanaryStatusForChannel("sms");
  const emailCanaryStatus = getCanaryStatusForChannel("email");
  const canaryMetricsReady = smsCanaryStatus.pass && emailCanaryStatus.pass;
  const canaryAckOk = canaryAckText.trim().toUpperCase() === "CANARY PASS";
  const canaryGuardOk = canaryVerified || (canaryMetricsReady && canaryAckOk);
  const latestCanaryEvidence = canaryEvidenceHistory[0] ?? null;
  const canaryEvidenceFresh =
    latestCanaryEvidence !== null &&
    Date.now() - new Date(latestCanaryEvidence.capturedAtIso).getTime() <=
      LIFECYCLE_CANARY_EVIDENCE_MAX_AGE_MINUTES * 60 * 1000;
  const canaryEvidenceGuardOk =
    latestCanaryEvidence !== null &&
    latestCanaryEvidence.smsPass &&
    latestCanaryEvidence.emailPass &&
    latestCanaryEvidence.canaryMetricsReady &&
    canaryEvidenceFresh;
  const liveSendGuardOk =
    Boolean(matchingDryRun) &&
    liveDispatchConfirmText.trim().toUpperCase() === "SEND" &&
    rollbackAckText.trim().toUpperCase() === "ACK ROLLBACK" &&
    canaryGuardOk &&
    canaryEvidenceGuardOk;

  const downloadUsersCsv = () => {
    if (!usersData?.users.length) return;
    const headers = [
      "id",
      "name",
      "email",
      "userType",
      "instructorNumber",
      "instructorCertifiedAt",
      "instructorApprovedAt",
      "createdAt",
    ];
    const rows = usersData.users.map((u) =>
      headers.map((h) => JSON.stringify(String((u as Record<string, unknown>)[h] ?? ""))).join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAuditCsv = () => {
    if (!auditData?.rows.length) return;
    const headers = ["id", "adminUserId", "procedurePath", "inputSummary", "createdAt"];
    const rows = auditData.rows.map((r) =>
      headers
        .map((h) => {
          const v = (r as Record<string, unknown>)[h];
          const s = v instanceof Date ? v.toISOString() : String(v ?? "");
          return JSON.stringify(s);
        })
        .join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-audit-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LIFECYCLE_BATCH_HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as LifecycleBatchHistoryItem[];
      if (Array.isArray(parsed)) {
        setLifecycleBatchHistory(parsed.slice(0, 30));
      }
    } catch {
      // ignore corrupted local data
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LIFECYCLE_BATCH_HISTORY_KEY, JSON.stringify(lifecycleBatchHistory));
  }, [lifecycleBatchHistory]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LIFECYCLE_CANARY_VERIFIED_KEY);
      if (raw === "1") {
        setCanaryVerified(true);
      }
    } catch {
      // ignore corrupted local data
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LIFECYCLE_CANARY_EVIDENCE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CanaryEvidenceItem[];
      if (Array.isArray(parsed)) {
        setCanaryEvidenceHistory(parsed.slice(0, 30));
      }
    } catch {
      // ignore corrupted local data
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LIFECYCLE_CANARY_EVIDENCE_KEY, JSON.stringify(canaryEvidenceHistory));
  }, [canaryEvidenceHistory]);
  useEffect(() => {
    if (!canaryMetricsReady || !canaryAckOk || canaryVerified) return;
    setCanaryVerified(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LIFECYCLE_CANARY_VERIFIED_KEY, "1");
    }
  }, [canaryMetricsReady, canaryAckOk, canaryVerified]);
  useEffect(() => {
    setLiveDispatchConfirmText("");
    setRollbackAckText("");
    setCanaryAckText("");
  }, [lifecycleLimitUsers, lifecycleLimitPerUser]);

  const exportLifecycleCurrentRunCsv = () => {
    if (!lifecycleBatchResult) return;
    const runAt = new Date().toISOString();
    const summaryHeaders = [
      "runAtIso",
      "mode",
      "limitUsers",
      "limitPerUser",
      "processedUsers",
      "sent",
      "skipped",
    ];
    const summaryRow = [
      runAt,
      lifecycleBatchResult.dryRun ? "dry-run" : "live",
      String(lifecycleLimitUsers),
      String(lifecycleLimitPerUser),
      String(lifecycleBatchResult.processedUsers),
      String(lifecycleBatchResult.sent),
      String(lifecycleBatchResult.skipped),
    ];
    const perUserHeaders = ["userId", "processed", "sent", "skipped"];
    const perUserRows = lifecycleBatchResult.userReports.map((r) =>
      [r.userId, r.processed, r.sent, r.skipped].map((v) => JSON.stringify(String(v))).join(",")
    );
    const csv = [
      summaryHeaders.join(","),
      summaryRow.map((v) => JSON.stringify(v)).join(","),
      "",
      perUserHeaders.join(","),
      ...perUserRows,
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifecycle-batch-run-${runAt.slice(0, 19).replace(/[:T]/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportLifecycleHistoryCsv = () => {
    if (!lifecycleBatchHistory.length) return;
    const headers = [
      "runAtIso",
      "mode",
      "limitUsers",
      "limitPerUser",
      "processedUsers",
      "sent",
      "skipped",
      "reportRows",
    ];
    const rows = lifecycleBatchHistory.map((h) =>
      [
        h.runAtIso,
        h.dryRun ? "dry-run" : "live",
        h.limitUsers,
        h.limitPerUser,
        h.processedUsers,
        h.sent,
        h.skipped,
        h.userReports.length,
      ]
        .map((v) => JSON.stringify(String(v)))
        .join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifecycle-batch-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const computeChannelDeliveryRate = (channel?: {
    sent?: number;
    failed?: number;
  }): string => {
    const sent = Number(channel?.sent ?? 0);
    const failed = Number(channel?.failed ?? 0);
    const attempted = sent + failed;
    if (attempted <= 0) return "—";
    return `${Math.round((sent / attempted) * 100)}%`;
  };
  const criticalAlertCount = (lifecycleDispatchSummary?.channelHealthAlerts ?? []).filter(
    (a) => a.severity === "critical"
  ).length;
  const warningAlertCount = (lifecycleDispatchSummary?.channelHealthAlerts ?? []).filter(
    (a) => a.severity === "warning"
  ).length;

  const captureCanaryEvidence = () => {
    const snapshot: CanaryEvidenceItem = {
      capturedAtIso: new Date().toISOString(),
      canaryVerified,
      canaryMetricsReady,
      smsAttempted: smsCanaryStatus.attempted,
      smsDeliveryRatePercent: smsCanaryStatus.deliveryRatePercent,
      smsFallbackCount: smsCanaryStatus.fallbackCount,
      smsPass: smsCanaryStatus.pass,
      emailAttempted: emailCanaryStatus.attempted,
      emailDeliveryRatePercent: emailCanaryStatus.deliveryRatePercent,
      emailFallbackCount: emailCanaryStatus.fallbackCount,
      emailPass: emailCanaryStatus.pass,
      hasCriticalAlerts: criticalAlertCount > 0,
      hasWarningAlerts: warningAlertCount > 0,
    };
    setCanaryEvidenceHistory((prev) => [snapshot, ...prev].slice(0, 30));
    toast.success("Canary evidence snapshot captured");
  };

  const exportCanaryEvidenceCsv = () => {
    if (!canaryEvidenceHistory.length) return;
    const headers = [
      "capturedAtIso",
      "canaryVerified",
      "canaryMetricsReady",
      "smsAttempted",
      "smsDeliveryRatePercent",
      "smsFallbackCount",
      "smsPass",
      "emailAttempted",
      "emailDeliveryRatePercent",
      "emailFallbackCount",
      "emailPass",
      "hasCriticalAlerts",
      "hasWarningAlerts",
    ];
    const rows = canaryEvidenceHistory.map((row) =>
      [
        row.capturedAtIso,
        row.canaryVerified,
        row.canaryMetricsReady,
        row.smsAttempted,
        row.smsDeliveryRatePercent,
        row.smsFallbackCount,
        row.smsPass,
        row.emailAttempted,
        row.emailDeliveryRatePercent,
        row.emailFallbackCount,
        row.emailPass,
        row.hasCriticalAlerts,
        row.hasWarningAlerts,
      ]
        .map((v) => JSON.stringify(String(v)))
        .join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `canary-evidence-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyLatestCanaryEvidence = () => {
    const latest = canaryEvidenceHistory[0];
    if (!latest) return;
    const lines = [
      "Paeds Resus canary evidence snapshot",
      `Captured at: ${new Date(latest.capturedAtIso).toLocaleString()}`,
      `Canary verified: ${latest.canaryVerified ? "yes" : "no"}`,
      `Canary metrics ready: ${latest.canaryMetricsReady ? "yes" : "no"}`,
      `SMS: attempted=${latest.smsAttempted}, delivery=${latest.smsAttempted ? `${latest.smsDeliveryRatePercent}%` : "—"}, fallback=${latest.smsFallbackCount}, pass=${latest.smsPass ? "yes" : "no"}`,
      `Email: attempted=${latest.emailAttempted}, delivery=${latest.emailAttempted ? `${latest.emailDeliveryRatePercent}%` : "—"}, fallback=${latest.emailFallbackCount}, pass=${latest.emailPass ? "yes" : "no"}`,
      `Alerts: critical=${latest.hasCriticalAlerts ? "yes" : "no"}, warning=${latest.hasWarningAlerts ? "yes" : "no"}`,
    ];
    void navigator.clipboard.writeText(lines.join("\n")).then(
      () => toast.success("Latest canary evidence copied"),
      () => toast.error("Could not copy canary evidence")
    );
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
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Reports & insights</h1>
              <p className="text-muted-foreground">
                Registered users, enrollments, certifications, parent Safe-Truth, ResusGPS analytics, and app usage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLocation("/admin")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Admin
          </button>
        </div>

        {/* Tabs for different report sections */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="resus-analytics">ResusGPS Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {reportLoading || !report ? (
              <p className="text-muted-foreground">Loading report…</p>
            ) : !report.ok ? (
              <p className="text-destructive">{report.error ?? "Could not load report."}</p>
            ) : (
              <>
            <p className="text-sm text-muted-foreground">
                Period: {report.periodLabel} · Analytics: {report.lastDaysLabel}
              </p>

            {/* Registered users by type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Registered users
                </CardTitle>
                <CardDescription>Total: {report.totalUsers}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">{report.usersByType.individual}</p>
                    <p className="text-sm text-muted-foreground">Healthcare providers</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">{report.usersByType.parent}</p>
                    <p className="text-sm text-muted-foreground">Parents / guardians</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">{report.usersByType.institutional}</p>
                    <p className="text-sm text-muted-foreground">Institutions</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUsers(!showUsers)}
                  className="mt-3 text-sm text-primary hover:underline"
                >
                  {showUsers ? "Hide" : "Show"} registered users list
                </button>
                {showUsers && (
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <label htmlFor="admin-user-search" className="text-xs text-muted-foreground block mb-1">
                        Search name or email
                      </label>
                      <Input
                        id="admin-user-search"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Type to filter…"
                      />
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={downloadUsersCsv} disabled={!usersData?.users.length}>
                      <Download className="h-4 w-4 mr-1" />
                      Export CSV
                    </Button>
                  </div>
                )}
                {showUsers && usersData && (
                  <div className="mt-4 overflow-x-auto">
                    <p className="text-xs text-muted-foreground mb-2">Showing {usersData.users.length} of {usersData.total} matches</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Name</th>
                          <th className="text-left py-2">Email</th>
                          <th className="text-left py-2">Type</th>
                          <th className="text-left py-2">Instructor #</th>
                          <th className="text-left py-2">B2B instructor</th>
                          <th className="text-left py-2">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersData.users.map((u) => (
                          <tr key={u.id} className="border-b">
                            <td className="py-2">{u.name ?? "—"}</td>
                            <td className="py-2">{u.email ?? "—"}</td>
                            <td className="py-2">{u.userType ?? "—"}</td>
                            <td className="py-2 font-mono text-xs">
                              {"instructorNumber" in u && u.instructorNumber ? String(u.instructorNumber) : "—"}
                            </td>
                            <td className="py-2 align-top">
                              {"instructorApprovedAt" in u && u.instructorApprovedAt ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-medium text-green-800 dark:text-green-200">Approved</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8"
                                    disabled={setInstructorApprovalMutation.isPending}
                                    onClick={() =>
                                      setInstructorApprovalMutation.mutate({ userId: u.id, approved: false })
                                    }
                                  >
                                    Revoke
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  disabled={
                                    setInstructorApprovalMutation.isPending ||
                                    !(
                                      "instructorCertifiedAt" in u &&
                                      u.instructorCertifiedAt &&
                                      "instructorNumber" in u &&
                                      u.instructorNumber
                                    )
                                  }
                                  title={
                                    !("instructorCertifiedAt" in u && u.instructorCertifiedAt && "instructorNumber" in u && u.instructorNumber)
                                      ? "User must complete Instructor Course and receive an instructor number first"
                                      : undefined
                                  }
                                  onClick={() =>
                                    setInstructorApprovalMutation.mutate({ userId: u.id, approved: true })
                                  }
                                >
                                  Approve
                                </Button>
                              )}
                            </td>
                            <td className="py-2">
                              {u.createdAt
                                ? new Date(u.createdAt).toLocaleDateString()
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {usersData.total > usersData.users.length && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Showing {usersData.users.length} of {usersData.total}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enrollments (applications) this month */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Enrollments this month
                </CardTitle>
                <CardDescription>
                  Applications for BLS, ACLS, PALS, Fellowship in {report.periodLabel}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">{report.enrollmentsThisMonth.bls}</p>
                    <p className="text-sm text-muted-foreground">BLS</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">{report.enrollmentsThisMonth.acls}</p>
                    <p className="text-sm text-muted-foreground">ACLS</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">{report.enrollmentsThisMonth.pals}</p>
                    <p className="text-sm text-muted-foreground">PALS</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">{report.enrollmentsThisMonth.fellowship}</p>
                    <p className="text-sm text-muted-foreground">Fellowship</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Total: {report.totalEnrollmentsThisMonth}
                </p>
              </CardContent>
            </Card>

            {/* Certifications issued this month */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Certificates issued this month
                </CardTitle>
                <CardDescription>
                  BLS / ACLS / PALS / Fellowship certified in {report.periodLabel}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">{report.certificatesThisMonth.bls}</p>
                    <p className="text-sm text-muted-foreground">BLS</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">{report.certificatesThisMonth.acls}</p>
                    <p className="text-sm text-muted-foreground">ACLS</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">{report.certificatesThisMonth.pals}</p>
                    <p className="text-sm text-muted-foreground">PALS</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">{report.certificatesThisMonth.fellowship}</p>
                    <p className="text-sm text-muted-foreground">Fellowship</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Total: {report.totalCertificatesThisMonth}
                </p>
              </CardContent>
            </Card>

            {/* Conversion funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Conversion funnel
                </CardTitle>
                <CardDescription>
                  Enrolled vs completed in {report.periodLabel}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  Enrolled: {report.conversionFunnel.enrolled} → Completed: {report.conversionFunnel.completed}{" "}
                  ({report.conversionFunnel.conversionPercent}%)
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Applications to certifications this month
                </p>
              </CardContent>
            </Card>

            {/* Referrals this month */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Referrals this month
                </CardTitle>
                <CardDescription>
                  Clinical referrals submitted in {report.periodLabel}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{report.referralsThisMonth}</p>
                <p className="text-sm text-muted-foreground">referrals this month</p>
              </CardContent>
            </Card>

            {/* Parent Safe-Truth usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Parent Safe-Truth usage
                </CardTitle>
                <CardDescription>
                  Submissions in {report.periodLabel}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{report.parentSafeTruthThisMonth}</p>
                <p className="text-sm text-muted-foreground">parents used Safe-Truth this month</p>
              </CardContent>
            </Card>

            {/* Paeds Resus / app analytics (last 7 days) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  App & Paeds Resus activity
                </CardTitle>
                <CardDescription>
                  All <code className="text-xs">analyticsEvents</code> in {report.lastDaysLabel} — same rolling window as
                  the server report (not calendar midnight).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{report.analyticsLastDays.count}</p>
                <p className="text-sm text-muted-foreground mb-3">total events</p>
                {report.analyticsLastDays.eventTypes.length > 0 ? (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Top event types:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {report.analyticsLastDays.eventTypes.slice(0, 8).map((e) => (
                        <li key={e.eventType}>
                          {e.eventType}: {e.count}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No analytics events recorded yet. Events are stored when the app tracks usage (e.g. Paeds Resus sessions, page views).
                  </p>
                )}
              </CardContent>
            </Card>

            {/* ResusGPS analytics (subset of events) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  ResusGPS (clinical flow)
                </CardTitle>
                <CardDescription>
                  Subset: <code className="text-xs">eventType</code> starting with <code className="text-xs">resus_</code>{" "}
                  in {report.lastDaysLabel}. Mission and revenue events appear in the card above, not only here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{report.resusGpsAnalyticsLastDays.totalEvents}</p>
                <p className="text-sm text-muted-foreground mb-3">ResusGPS-related events</p>
                {report.resusGpsAnalyticsLastDays.eventTypes.length > 0 ? (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">By event type:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {report.resusGpsAnalyticsLastDays.eventTypes.map((e) => (
                        <li key={e.eventType}>
                          {e.eventType}: {e.count}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No ResusGPS events in this window yet. They appear when providers use the Paeds Resus assessment
                    flow.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Admin audit log export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Admin audit log
                </CardTitle>
                <CardDescription>Recent admin procedure calls (sanitized inputs).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowAudit(!showAudit)}
                  className="text-sm text-primary hover:underline"
                >
                  {showAudit ? "Hide" : "Load recent entries"}
                </button>
                {showAudit && auditData && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Showing {auditData.rows.length} most recent row{auditData.rows.length !== 1 ? "s" : ""}.
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={downloadAuditCsv} disabled={!auditData.rows.length}>
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </Button>
                    {auditData.rows.length > 0 ? (
                      <ul className="max-h-48 overflow-y-auto space-y-2 text-xs border rounded-md p-2 bg-muted/30">
                        {auditData.rows.slice(0, 20).map((r) => (
                          <li key={r.id} className="text-muted-foreground">
                            <span className="font-medium text-foreground">{r.procedurePath}</span>
                            <span className="mx-1">·</span>
                            admin #{r.adminUserId}
                            <span className="mx-1">·</span>
                            {new Date(r.createdAt).toLocaleString()}
                            {r.inputSummary ? (
                              <span className="block truncate" title={r.inputSummary}>
                                {r.inputSummary}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No audit rows yet.</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Lifecycle automation batch dispatch */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Lifecycle nudge batch dispatch
                </CardTitle>
                <CardDescription>
                  Admin-only ops tool for 24h/72h lifecycle reminders (dry-run preview or live send).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {lifecycleDispatchSummary && (
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-sm">
                    <div className="rounded border p-2">
                      <p className="text-muted-foreground">Runs (7d)</p>
                      <p className="font-semibold">{lifecycleDispatchSummary.totalRuns}</p>
                    </div>
                    <div className="rounded border p-2">
                      <p className="text-muted-foreground">Live sends</p>
                      <p className="font-semibold">{lifecycleDispatchSummary.liveRuns}</p>
                    </div>
                    <div className="rounded border p-2">
                      <p className="text-muted-foreground">Dry-runs</p>
                      <p className="font-semibold">{lifecycleDispatchSummary.dryRuns}</p>
                    </div>
                    <div className="rounded border p-2">
                      <p className="text-muted-foreground">Users processed</p>
                      <p className="font-semibold">{lifecycleDispatchSummary.totalProcessedUsers}</p>
                    </div>
                    <div className="rounded border p-2">
                      <p className="text-muted-foreground">Nudges sent</p>
                      <p className="font-semibold">{lifecycleDispatchSummary.totalSent}</p>
                    </div>
                    <div className="rounded border p-2">
                      <p className="text-muted-foreground">Timed nudges tracked</p>
                      <p className="font-semibold">{lifecycleDispatchSummary.totalTimedNudges}</p>
                    </div>
                  </div>
                )}
                {lifecycleDispatchSummary?.channelTotals ? (
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium text-foreground mb-2">
                      Channel outcomes ({lifecycleDispatchSummary.lastDays}d)
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Channel</th>
                            <th className="text-left py-2">Sent</th>
                            <th className="text-left py-2">Failed</th>
                            <th className="text-left py-2">Skipped</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(
                            [
                              { label: "In-app", key: "inApp" },
                              { label: "SMS", key: "sms" },
                              { label: "Email", key: "email" },
                            ] as const
                          ).map((channel) => (
                            <tr key={channel.key} className="border-b">
                              <td className="py-2">{channel.label}</td>
                              <td className="py-2">{lifecycleDispatchSummary.channelTotals[channel.key].sent}</td>
                              <td className="py-2">{lifecycleDispatchSummary.channelTotals[channel.key].failed}</td>
                              <td className="py-2">{lifecycleDispatchSummary.channelTotals[channel.key].skipped}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
                {lifecycleDispatchSummary?.channelTotals && lifecycleDispatchSummary30d?.channelTotals ? (
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium text-foreground mb-2">Delivery health trend</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Channel</th>
                            <th className="text-left py-2">7d delivery rate</th>
                            <th className="text-left py-2">30d delivery rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(
                            [
                              { label: "In-app", key: "inApp" },
                              { label: "SMS", key: "sms" },
                              { label: "Email", key: "email" },
                            ] as const
                          ).map((channel) => (
                            <tr key={`trend-${channel.key}`} className="border-b">
                              <td className="py-2">{channel.label}</td>
                              <td className="py-2">
                                {computeChannelDeliveryRate(
                                  lifecycleDispatchSummary.channelTotals[channel.key]
                                )}
                              </td>
                              <td className="py-2">
                                {computeChannelDeliveryRate(
                                  lifecycleDispatchSummary30d.channelTotals[channel.key]
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
                {lifecycleDispatchSummary?.channelFailureTop ? (
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium text-foreground mb-2">
                      Top channel failure reasons ({lifecycleDispatchSummary.lastDays}d)
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Channel</th>
                            <th className="text-left py-2">Reason</th>
                            <th className="text-left py-2">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(
                            [
                              { label: "In-app", key: "inApp" },
                              { label: "SMS", key: "sms" },
                              { label: "Email", key: "email" },
                            ] as const
                          ).flatMap((channel) => {
                            const reasons = lifecycleDispatchSummary.channelFailureTop[channel.key];
                            if (!reasons?.length) {
                              return [
                                <tr key={`${channel.key}-none`} className="border-b">
                                  <td className="py-2">{channel.label}</td>
                                  <td className="py-2 text-muted-foreground">No failures recorded</td>
                                  <td className="py-2">0</td>
                                </tr>,
                              ];
                            }
                            return reasons.map((reason, idx) => (
                              <tr key={`${channel.key}-${reason.reason}-${idx}`} className="border-b">
                                <td className="py-2">{idx === 0 ? channel.label : ""}</td>
                                <td className="py-2 font-mono text-xs">{reason.reason}</td>
                                <td className="py-2">{reason.count}</td>
                              </tr>
                            ));
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
                {lifecycleDispatchSummary?.channelHealthAlerts?.length ? (
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="text-sm font-medium text-foreground">Operational channel health alerts</p>
                    <div className="space-y-2">
                      {lifecycleDispatchSummary.channelHealthAlerts.map((alert, idx) => (
                        <div
                          key={`${alert.channel}-${idx}`}
                          className={`rounded-md border p-2 text-sm ${
                            alert.severity === "critical"
                              ? "border-destructive/40 bg-destructive/10"
                              : "border-amber-500/40 bg-amber-500/10"
                          }`}
                        >
                          <p className="font-medium">
                            {alert.channel} · {alert.severity.toUpperCase()} · {alert.deliveryRatePercent}% delivery
                          </p>
                          <p className="text-xs text-muted-foreground">{alert.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium text-foreground">Operational channel health alerts</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      No warning or critical channel alerts in the current reporting window.
                    </p>
                  </div>
                )}
                {lifecycleDispatchSummary?.channelFallbackActivations ? (
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium text-foreground">Fallback activations ({lifecycleDispatchSummary.lastDays}d)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Times sends were intentionally skipped due to degraded external channels.
                    </p>
                    <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                      <div className="rounded border p-2">
                        <p className="text-muted-foreground">SMS fallback activations</p>
                        <p className="font-semibold">{lifecycleDispatchSummary.channelFallbackActivations.sms}</p>
                      </div>
                      <div className="rounded border p-2">
                        <p className="text-muted-foreground">Email fallback activations</p>
                        <p className="font-semibold">{lifecycleDispatchSummary.channelFallbackActivations.email}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-medium text-foreground">Launch-week operator checklist</p>
                  <p className="text-xs text-muted-foreground">
                    Use `docs/LIFECYCLE_CHANNEL_LAUNCH_PLAYBOOK.md` as the canonical SOP. In this panel, run:
                    dry-run -&gt; alert review -&gt; live send -&gt; CSV export -&gt; handoff.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="rounded border p-2">
                      <p className="font-medium text-foreground">Before live send</p>
                      <p className="text-muted-foreground">No critical channel alert, or fallback active for degraded channel.</p>
                    </div>
                    <div className="rounded border p-2">
                      <p className="font-medium text-foreground">During launch week</p>
                      <p className="text-muted-foreground">Run at least 3 cycles/day and log handoff summary each cycle.</p>
                    </div>
                    <div className="rounded border p-2">
                      <p className="font-medium text-foreground">Escalation trigger</p>
                      <p className="text-muted-foreground">Any channel below 70% delivery or rising fallback activations.</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                  <p className="text-sm font-medium text-foreground">Recommended operator sequence</p>
                  <p className="text-xs text-muted-foreground">
                    1) Run dry-run with intended limits -&gt; 2) Review processed/sent/skipped -&gt; 3) Type <code>SEND</code> and execute live send.
                  </p>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground" htmlFor="lifecycle-limit-users">
                      Max users
                    </label>
                    <Input
                      id="lifecycle-limit-users"
                      type="number"
                      min={1}
                      max={500}
                      className="w-28"
                      value={lifecycleLimitUsers}
                      onChange={(e) => setLifecycleLimitUsers(Number(e.target.value) || 100)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground" htmlFor="lifecycle-limit-per-user">
                      Max nudges/user
                    </label>
                    <Input
                      id="lifecycle-limit-per-user"
                      type="number"
                      min={1}
                      max={20}
                      className="w-32"
                      value={lifecycleLimitPerUser}
                      onChange={(e) => setLifecycleLimitPerUser(Number(e.target.value) || 5)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={dispatchLifecycleBatchMutation.isPending}
                    onClick={() =>
                      dispatchLifecycleBatchMutation.mutate({
                        dryRun: true,
                        limitUsers: lifecycleLimitUsers,
                        limitPerUser: lifecycleLimitPerUser,
                      })
                    }
                  >
                    {dispatchLifecycleBatchMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Run dry-run
                  </Button>
                  <Button
                    type="button"
                    variant="cta"
                    disabled={dispatchLifecycleBatchMutation.isPending || !liveSendGuardOk}
                    onClick={() =>
                      dispatchLifecycleBatchMutation.mutate({
                        dryRun: false,
                        limitUsers: lifecycleLimitUsers,
                        limitPerUser: lifecycleLimitPerUser,
                      })
                    }
                  >
                    {dispatchLifecycleBatchMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Execute send
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={exportLifecycleCurrentRunCsv}
                    disabled={!lifecycleBatchResult}
                  >
                    Export current run CSV
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (!lifecycleBatchResult) return;
                      const summaryLines = [
                        "Paeds Resus lifecycle dispatch run summary",
                        `Run time: ${new Date().toLocaleString()}`,
                        `Mode: ${lifecycleBatchResult.dryRun ? "Dry-run" : "Live send"}`,
                        `Limits: users=${lifecycleLimitUsers}, nudges/user=${lifecycleLimitPerUser}`,
                        `Processed users: ${lifecycleBatchResult.processedUsers}`,
                        `Sent: ${lifecycleBatchResult.sent}`,
                        `Skipped: ${lifecycleBatchResult.skipped}`,
                      ];
                      void navigator.clipboard.writeText(summaryLines.join("\n")).then(
                        () => toast.success("Run summary copied"),
                        () => toast.error("Could not copy run summary")
                      );
                    }}
                    disabled={!lifecycleBatchResult}
                  >
                    Copy run summary
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={exportLifecycleHistoryCsv}
                    disabled={lifecycleBatchHistory.length === 0}
                  >
                    Export history CSV
                  </Button>
                </div>
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-medium text-foreground">Live send safety checks</p>
                  <p className="text-xs text-muted-foreground">
                    Run a dry-run with the same limits in the last 30 minutes, then type <code>SEND</code> to enable
                    live execution.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Before live send, review rollback triggers in the launch playbook and type{" "}
                    <code>ACK ROLLBACK</code>.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    For first production cycle, verify canary health/fallback and type <code>CANARY PASS</code>.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Live send also requires a canary evidence snapshot captured within the last{" "}
                    {LIFECYCLE_CANARY_EVIDENCE_MAX_AGE_MINUTES} minutes.
                  </p>
                  <div className="rounded-md border p-2 text-xs space-y-1">
                    <p className="font-medium text-foreground">Canary verification snapshot (external channels)</p>
                    <p className="text-muted-foreground">
                      Pass rule per channel: attempted sends &gt;= 20 and delivery &gt;= 85%, or fallback activation observed.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="rounded border p-2">
                        <p className="font-medium text-foreground">SMS</p>
                        <p className="text-muted-foreground">
                          attempted {smsCanaryStatus.attempted}, delivery {smsCanaryStatus.attempted ? `${smsCanaryStatus.deliveryRatePercent}%` : "—"}, fallback{" "}
                          {smsCanaryStatus.fallbackCount}
                        </p>
                        <p className={smsCanaryStatus.pass ? "text-green-700" : "text-amber-700"}>
                          {smsCanaryStatus.pass ? "Canary check passed" : "Canary check pending"}
                        </p>
                      </div>
                      <div className="rounded border p-2">
                        <p className="font-medium text-foreground">Email</p>
                        <p className="text-muted-foreground">
                          attempted {emailCanaryStatus.attempted}, delivery{" "}
                          {emailCanaryStatus.attempted ? `${emailCanaryStatus.deliveryRatePercent}%` : "—"}, fallback{" "}
                          {emailCanaryStatus.fallbackCount}
                        </p>
                        <p className={emailCanaryStatus.pass ? "text-green-700" : "text-amber-700"}>
                          {emailCanaryStatus.pass ? "Canary check passed" : "Canary check pending"}
                        </p>
                      </div>
                    </div>
                    <p className={canaryGuardOk ? "text-green-700" : "text-amber-700"}>
                      {canaryVerified
                        ? "Canary verification locked for this browser."
                        : canaryMetricsReady
                          ? "Canary metrics ready. Type CANARY PASS to unlock live send."
                          : "Canary metrics not ready yet. Run controlled canary and recheck."}
                    </p>
                    <p className={canaryEvidenceGuardOk ? "text-green-700" : "text-amber-700"}>
                      {latestCanaryEvidence
                        ? canaryEvidenceFresh
                          ? `Fresh canary evidence present (${new Date(latestCanaryEvidence.capturedAtIso).toLocaleTimeString()}).`
                          : "Latest canary evidence expired. Capture a new snapshot before live send."
                        : "No canary evidence snapshot captured yet."}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {matchingDryRun
                      ? `Dry-run verified at ${new Date(matchingDryRun.runAtIso).toLocaleTimeString()} (${matchingDryRun.processedUsers} users processed).`
                      : "No recent dry-run found for the current limits."}
                  </p>
                  <Input
                    value={liveDispatchConfirmText}
                    onChange={(e) => setLiveDispatchConfirmText(e.target.value)}
                    placeholder='Type "SEND" to confirm live dispatch'
                    className="max-w-sm"
                  />
                  <Input
                    value={rollbackAckText}
                    onChange={(e) => setRollbackAckText(e.target.value)}
                    placeholder='Type "ACK ROLLBACK" after reviewing triggers'
                    className="max-w-sm"
                  />
                  <Input
                    value={canaryAckText}
                    onChange={(e) => setCanaryAckText(e.target.value)}
                    placeholder='Type "CANARY PASS" after verification'
                    className="max-w-sm"
                    disabled={canaryVerified}
                  />
                </div>
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-medium text-foreground">Canary evidence capture</p>
                  <p className="text-xs text-muted-foreground">
                    Capture a timestamped canary snapshot before each live cycle and include it in operator handoff.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={captureCanaryEvidence}>
                      Capture canary snapshot
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={copyLatestCanaryEvidence}
                      disabled={canaryEvidenceHistory.length === 0}
                    >
                      Copy latest canary evidence
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={exportCanaryEvidenceCsv}
                      disabled={canaryEvidenceHistory.length === 0}
                    >
                      Export canary evidence CSV
                    </Button>
                  </div>
                  {canaryEvidenceHistory.length > 0 ? (
                    <div className="rounded border p-2 text-xs text-muted-foreground">
                      Latest snapshot: {new Date(canaryEvidenceHistory[0].capturedAtIso).toLocaleString()} · SMS{" "}
                      {canaryEvidenceHistory[0].smsAttempted
                        ? `${canaryEvidenceHistory[0].smsDeliveryRatePercent}%`
                        : "—"}{" "}
                      · Email{" "}
                      {canaryEvidenceHistory[0].emailAttempted
                        ? `${canaryEvidenceHistory[0].emailDeliveryRatePercent}%`
                        : "—"}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No canary snapshots captured yet.</p>
                  )}
                </div>

                {lifecycleBatchResult && (
                  <div className="space-y-3 rounded-lg border p-3">
                    <p className="text-sm text-muted-foreground">
                      Last run: {lifecycleBatchResult.dryRun ? "Dry-run" : "Live send"}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="rounded border p-2">
                        <p className="text-muted-foreground">Users processed</p>
                        <p className="font-semibold">{lifecycleBatchResult.processedUsers}</p>
                      </div>
                      <div className="rounded border p-2">
                        <p className="text-muted-foreground">Sent</p>
                        <p className="font-semibold">{lifecycleBatchResult.sent}</p>
                      </div>
                      <div className="rounded border p-2">
                        <p className="text-muted-foreground">Skipped</p>
                        <p className="font-semibold">{lifecycleBatchResult.skipped}</p>
                      </div>
                      <div className="rounded border p-2">
                        <p className="text-muted-foreground">Mode</p>
                        <p className="font-semibold">{lifecycleBatchResult.dryRun ? "Preview" : "Live"}</p>
                      </div>
                    </div>
                    {lifecycleBatchResult.userReports.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">User ID</th>
                              <th className="text-left py-2">Processed</th>
                              <th className="text-left py-2">Sent</th>
                              <th className="text-left py-2">Skipped</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lifecycleBatchResult.userReports.slice(0, 50).map((r) => (
                              <tr key={r.userId} className="border-b">
                                <td className="py-2">{r.userId}</td>
                                <td className="py-2">{r.processed}</td>
                                <td className="py-2">{r.sent}</td>
                                <td className="py-2">{r.skipped}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
                {lifecycleBatchHistory.length > 0 && (
                  <div className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">Timestamped run history</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setLifecycleBatchHistory([]);
                          toast.success("Lifecycle run history cleared");
                        }}
                      >
                        Clear history
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Run time</th>
                            <th className="text-left py-2">Mode</th>
                            <th className="text-left py-2">Limits</th>
                            <th className="text-left py-2">Processed users</th>
                            <th className="text-left py-2">Sent</th>
                            <th className="text-left py-2">Skipped</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lifecycleBatchHistory.slice(0, 20).map((h) => (
                            <tr key={h.runAtIso} className="border-b">
                              <td className="py-2">{new Date(h.runAtIso).toLocaleString()}</td>
                              <td className="py-2">{h.dryRun ? "Preview" : "Live"}</td>
                              <td className="py-2">
                                {h.limitUsers} users / {h.limitPerUser} nudges
                              </td>
                              <td className="py-2">{h.processedUsers}</td>
                              <td className="py-2">{h.sent}</td>
                              <td className="py-2">{h.skipped}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {lifecycleDispatchSummary?.recentRuns?.length ? (
                  <div className="space-y-2 rounded-lg border p-3">
                    <p className="text-sm font-medium text-foreground">Recent backend runs (analytics truth)</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Run time</th>
                            <th className="text-left py-2">Admin</th>
                            <th className="text-left py-2">Mode</th>
                            <th className="text-left py-2">Processed</th>
                            <th className="text-left py-2">Sent</th>
                            <th className="text-left py-2">Skipped</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lifecycleDispatchSummary.recentRuns.slice(0, 10).map((r, idx) => (
                            <tr key={`${r.createdAt}-${idx}`} className="border-b">
                              <td className="py-2">{new Date(String(r.createdAt)).toLocaleString()}</td>
                              <td className="py-2">{String(r.adminUserId ?? "—")}</td>
                              <td className="py-2">{r.dryRun ? "Preview" : "Live"}</td>
                              <td className="py-2">{Number(r.processedUsers ?? 0)}</td>
                              <td className="py-2">{Number(r.sent ?? 0)}</td>
                              <td className="py-2">{Number(r.skipped ?? 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Top protocols viewed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Top protocols viewed
                </CardTitle>
                <CardDescription>
                  Most viewed protocols in {report.lastDaysLabel} (ResusGPS)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.topProtocolsViewed.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {report.topProtocolsViewed.map((p, i) => (
                      <li key={i} className="text-foreground">
                        <span className="font-medium">{p.protocol}</span>
                        <span className="text-muted-foreground"> — {p.count} view{p.count !== 1 ? "s" : ""}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No protocol views recorded yet. Views are tracked when providers confirm a diagnosis in ResusGPS.
                  </p>
                )}
              </CardContent>
            </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="resus-analytics" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>ResusGPS Analytics</CardTitle>
                <CardDescription>Facility-level condition practice patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {institutionId
                    ? "Detailed facility heatmap is temporarily unavailable while the analytics panel is being refactored."
                    : "No institution associated with your account."}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
