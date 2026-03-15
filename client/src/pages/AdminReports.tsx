import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, BookOpen, Award, Heart, Activity, Send, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function AdminReports() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showUsers, setShowUsers] = useState(false);

  const { data: report, isLoading: reportLoading } = trpc.adminStats.getReport.useQuery(
    { lastDays: 7 },
    { enabled: isAuthenticated && (user as { role?: string })?.role === "admin" }
  );

  const { data: usersData } = trpc.adminStats.getUsers.useQuery(
    { limit: 50 },
    { enabled: showUsers && isAuthenticated && (user as { role?: string })?.role === "admin" }
  );

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
                {showUsers && usersData && (
                  <div className="mt-4 overflow-x-auto">
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
          </>
        )}
      </div>
    </div>
  );
}
