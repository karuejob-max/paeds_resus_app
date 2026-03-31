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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function AdminReports() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showUsers, setShowUsers] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [userSearch, setUserSearch] = useState("");

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

  const downloadUsersCsv = () => {
    if (!usersData?.users.length) return;
    const headers = ["id", "name", "email", "userType", "createdAt"];
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
      setLocation("/home");
    }
  }, [user, isAuthenticated, loading, setLocation]);

  if (loading || !isAuthenticated || (user as { role?: string })?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Reports & insights</h1>
              <p className="text-muted-foreground">
                Registered users, enrollments, certifications, Safe-Truth, and app usage
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
                          <th className="text-left py-2">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersData.users.map((u) => (
                          <tr key={u.id} className="border-b">
                            <td className="py-2">{u.name ?? "—"}</td>
                            <td className="py-2">{u.email ?? "—"}</td>
                            <td className="py-2">{u.userType ?? "—"}</td>
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
                  Events in {report.lastDaysLabel} (page views, interactions, usage)
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
                  Events whose type starts with <code className="text-xs">resus_</code> in {report.lastDaysLabel}
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
      </div>
    </div>
  );
}
