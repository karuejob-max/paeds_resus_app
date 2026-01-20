import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Award,
  AlertCircle,
  Download,
  Filter,
} from "lucide-react";

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState<"week" | "month" | "year">("month");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");

  // Fetch certificate statistics
  const certificateStats = trpc.certificates.getStats.useQuery();

  // Mock data for demonstration
  const mockMetrics = {
    totalEnrollments: 1247,
    activeEnrollments: 892,
    completedEnrollments: 355,
    totalRevenue: 6235000,
    pendingPayments: 1850000,
    certificatesIssued: 342,
    averageCompletionRate: 85,
    averageRating: 4.7,
  };

  const mockEnrollmentTrend = [
    { date: "Jan 1", enrollments: 45, revenue: 225000 },
    { date: "Jan 8", enrollments: 62, revenue: 310000 },
    { date: "Jan 15", enrollments: 58, revenue: 290000 },
    { date: "Jan 22", enrollments: 71, revenue: 355000 },
    { date: "Jan 29", enrollments: 84, revenue: 420000 },
  ];

  const mockProgramStats = [
    { name: "BLS", enrollments: 450, revenue: 2250000, completion: 88 },
    { name: "ACLS", enrollments: 380, revenue: 1900000, completion: 85 },
    { name: "PALS", enrollments: 290, revenue: 1450000, completion: 82 },
    { name: "Fellowship", enrollments: 127, revenue: 635000, completion: 91 },
  ];

  const mockRecentEnrollments = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      program: "BLS",
      status: "completed",
      date: "2026-01-20",
    },
    {
      id: 2,
      name: "Nurse James Kipchoge",
      program: "ACLS",
      status: "in_progress",
      date: "2026-01-19",
    },
    {
      id: 3,
      name: "Dr. Mary Omondi",
      program: "PALS",
      status: "pending_payment",
      date: "2026-01-18",
    },
    {
      id: 4,
      name: "Dr. Ahmed Hassan",
      program: "Fellowship",
      status: "completed",
      date: "2026-01-17",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending_payment":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor enrollments, revenue, and platform metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Enrollments</p>
                <p className="text-3xl font-bold text-gray-900">
                  {mockMetrics.totalEnrollments}
                </p>
                <p className="text-xs text-green-600 mt-2">
                  ↑ 12% from last month
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-100" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  KES {(mockMetrics.totalRevenue / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-green-600 mt-2">
                  ↑ 8% from last month
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-green-100" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Certificates Issued</p>
                <p className="text-3xl font-bold text-gray-900">
                  {mockMetrics.certificatesIssued}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  {mockMetrics.averageCompletionRate}% completion rate
                </p>
              </div>
              <Award className="w-12 h-12 text-purple-100" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Payments</p>
                <p className="text-3xl font-bold text-gray-900">
                  KES {(mockMetrics.pendingPayments / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-orange-600 mt-2">
                  {Math.round(
                    (mockMetrics.pendingPayments / mockMetrics.totalRevenue) * 100
                  )}% of revenue
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-100" />
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Enrollment Trend */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Enrollment Trend
              </h2>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            {/* Simple Bar Chart */}
            <div className="space-y-4">
              {mockEnrollmentTrend.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {item.date}
                    </span>
                    <span className="text-sm text-gray-600">
                      {item.enrollments} enrollments
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(item.enrollments / 100) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Program Distribution */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              By Program
            </h2>

            <div className="space-y-4">
              {mockProgramStats.map((program, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {program.name}
                    </span>
                    <span className="text-sm text-gray-600">
                      {program.enrollments}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{
                        width: `${(program.enrollments / 500) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      KES {(program.revenue / 1000000).toFixed(1)}M
                    </span>
                    <span className="text-xs text-green-600">
                      {program.completion}% complete
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Enrollments */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Enrollments</h2>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Learner Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Program
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockRecentEnrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {enrollment.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {enrollment.program}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          enrollment.status
                        )}`}
                      >
                        {getStatusLabel(enrollment.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(enrollment.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Certificate Statistics */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Certificate Statistics
          </h2>

          {certificateStats.isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading certificate data...</p>
            </div>
          ) : certificateStats.data && 'stats' in certificateStats.data ? (
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Issued</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(certificateStats.data as any).stats?.totalIssued || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">By Program</p>
                <div className="space-y-1">
                  {Object.entries((certificateStats.data as any).stats?.byProgram || {}).map(
                    ([program, count]: [string, any]) => (
                      <p key={program} className="text-sm text-gray-700">
                        {program.toUpperCase()}: <span className="font-semibold">{count}</span>
                      </p>
                    )
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Recently Issued</p>
                <p className="text-sm text-gray-700">
                  Last 10 certificates tracked
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No certificate data available</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
