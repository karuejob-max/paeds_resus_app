import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Shield, TrendingUp, FileText, LineChart, Wallet } from "lucide-react";
import { useEffect } from "react";

export default function AdminHub() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

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

  if (loading || !isAuthenticated || (user as { role?: string })?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Admin</h1>
            <p className="text-muted-foreground">Platform administration and analytics</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setLocation("/admin/mpesa-reconciliation")}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  M-Pesa reconciliation
                </CardTitle>
                <CardDescription>
                  Stale pending payments, STK query reconcile, export CSV, config readiness
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setLocation("/admin/reports")}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Reports & insights
                </CardTitle>
                <CardDescription>
                  Registered users, BLS/ACLS enrollments & certifications, parent Safe-Truth usage, Paeds Resus activity
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setLocation("/hospital-admin-dashboard")}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Hospital Admin Dashboard
                </CardTitle>
                <CardDescription>
                  Institutional metrics, staff, and training overview
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setLocation("/advanced-analytics")}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Advanced Analytics
                </CardTitle>
                <CardDescription>
                  Deeper analytics and reporting
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setLocation("/care-signal-analytics")}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Care Signal analytics
                </CardTitle>
                <CardDescription>
                  Insights from Care Signal event submissions and system gaps
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
