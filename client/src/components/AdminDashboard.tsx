import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, DollarSign, Target } from "lucide-react";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"kpis" | "metrics" | "trends">("kpis");

  // Fetch dashboard data
  const { data: dashboard, isLoading: dashboardLoading } = trpc.dashboards.getExecutiveDashboard.useQuery();
  const { data: metrics, isLoading: metricsLoading } = trpc.dashboards.getAnalyticsMetrics.useQuery();

  if (dashboardLoading || metricsLoading) {
    return <div className="p-4">Loading dashboard...</div>;
  }

  if (!dashboard || !metrics) {
    return <div className="p-4">Failed to load dashboard data</div>;
  }

  const kpis = dashboard.kpis;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Executive Dashboard</h1>
        <p className="text-gray-600">Real-time KPI tracking and analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-gray-500">Active users this month: {kpis.activeUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {(kpis.totalRevenue / 1000).toFixed(1)}K</div>
            <p className="text-xs text-gray-500">{kpis.totalEnrollments} enrollments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.conversionRate}%</div>
            <p className="text-xs text-gray-500">Enrollment to payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.npsScore}</div>
            <p className="text-xs text-gray-500">Customer satisfaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {["kpis", "metrics", "trends"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "kpis" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
              <CardDescription>Current performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Retention Rate:</span>
                <span className="font-medium">{kpis.customerRetention}%</span>
              </div>
              <div className="flex justify-between">
                <span>Active Users:</span>
                <span className="font-medium">{kpis.activeUsers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Enrollments:</span>
                <span className="font-medium">{kpis.totalEnrollments.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Conversion Rate:</span>
                <span className="font-medium">{kpis.conversionRate}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
              <CardDescription>System notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard.alerts.length === 0 ? (
                <p className="text-sm text-gray-500">No alerts at this time</p>
              ) : (
                <div className="space-y-2">
                  {dashboard.alerts.slice(0, 5).map((alert, i) => (
                    <div key={i} className={`p-2 rounded text-sm ${
                      alert.severity === "high" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"
                    }`}>
                      {alert.message}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "metrics" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>User Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Total Users:</span>
                <span className="font-medium">{metrics.userMetrics.totalUsers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>New This Month:</span>
                <span className="font-medium">{metrics.userMetrics.newUsersThisMonth}</span>
              </div>
              <div className="flex justify-between">
                <span>Churn Rate:</span>
                <span className="font-medium">{metrics.userMetrics.churnRate}%</span>
              </div>
              <div className="flex justify-between">
                <span>LTV:</span>
                <span className="font-medium">KES {metrics.userMetrics.ltv.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Total Revenue:</span>
                <span className="font-medium">KES {(metrics.revenueMetrics.totalRevenue / 1000).toFixed(1)}K</span>
              </div>
              <div className="flex justify-between">
                <span>This Month:</span>
                <span className="font-medium">KES {(metrics.revenueMetrics.revenueThisMonth / 1000).toFixed(1)}K</span>
              </div>
              <div className="flex justify-between">
                <span>AOV:</span>
                <span className="font-medium">KES {metrics.revenueMetrics.averageOrderValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>MRR:</span>
                <span className="font-medium">KES {(metrics.revenueMetrics.monthlyRecurringRevenue / 1000).toFixed(1)}K</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "trends" && (
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboard.trends.enrollmentTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboard.trends.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
