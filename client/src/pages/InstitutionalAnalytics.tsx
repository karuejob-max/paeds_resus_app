import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, PieChart, TrendingUp, Users, BookOpen, CheckCircle, AlertCircle, Download } from "lucide-react";

export default function InstitutionalAnalytics() {
  const [dateRange, setDateRange] = useState({ start: "2026-01-01", end: "2026-01-21" });

  // Mock data - replace with real tRPC calls
  const analytics = {
    providerActivation: {
      total: 250,
      activated: 187,
      pending: 45,
      inactive: 18,
      activationRate: 74.8,
    },
    courseCompletion: {
      enrolled: 450,
      completed: 312,
      inProgress: 98,
      completionRate: 69.3,
      avgTimeToCompletion: "24.5 days",
    },
    safeTruthEvents: {
      totalEvents: 1245,
      systemGaps: 87,
      outcomes: {
        positive: 892,
        neutral: 245,
        negative: 108,
      },
      eventTrend: "↑ 12% this month",
    },
    retention: {
      month1: 95,
      month2: 87,
      month3: 76,
      month6: 62,
      avgRetention: 80,
    },
    churnRisk: {
      highRisk: 23,
      mediumRisk: 45,
      lowRisk: 182,
      predictedChurn: 12,
    },
  };

  const handleExport = (format: "csv" | "pdf") => {
    console.log(`Exporting analytics as ${format}`);
    // TODO: Implement export functionality
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9f9] to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#1a4d4d] mb-2">Institutional Analytics Dashboard</h1>
          <p className="text-gray-600">Real-time insights into provider performance, engagement, and retention</p>
        </div>

        {/* Date Range & Export */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex gap-4">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleExport("csv")} variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              CSV
            </Button>
            <Button onClick={() => handleExport("pdf")} variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              PDF
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Provider Activation */}
          <Card className="border-l-4 border-l-[#1a4d4d]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1a4d4d]" />
                Provider Activation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#1a4d4d]">{analytics.providerActivation.activationRate}%</div>
              <p className="text-xs text-gray-500 mt-2">
                {analytics.providerActivation.activated} of {analytics.providerActivation.total} activated
              </p>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#1a4d4d] h-2 rounded-full"
                  style={{ width: `${analytics.providerActivation.activationRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Course Completion */}
          <Card className="border-l-4 border-l-[#ff6633]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#ff6633]" />
                Course Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#ff6633]">{analytics.courseCompletion.completionRate}%</div>
              <p className="text-xs text-gray-500 mt-2">
                {analytics.courseCompletion.completed} of {analytics.courseCompletion.enrolled} completed
              </p>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#ff6633] h-2 rounded-full"
                  style={{ width: `${analytics.courseCompletion.completionRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Safe-Truth Events */}
          <Card className="border-l-4 border-l-green-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Safe-Truth Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{analytics.safeTruthEvents.totalEvents}</div>
              <p className="text-xs text-gray-500 mt-2">{analytics.safeTruthEvents.eventTrend}</p>
              <p className="text-xs text-red-600 mt-2 font-semibold">{analytics.safeTruthEvents.systemGaps} system gaps</p>
            </CardContent>
          </Card>

          {/* Churn Risk */}
          <Card className="border-l-4 border-l-red-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Churn Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{analytics.churnRisk.highRisk}</div>
              <p className="text-xs text-gray-500 mt-2">High-risk providers</p>
              <p className="text-xs text-orange-600 mt-2">{analytics.churnRisk.mediumRisk} medium-risk</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Provider Activation Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5 text-[#1a4d4d]" />
                Provider Activation Breakdown
              </CardTitle>
              <CardDescription>Distribution of provider statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Activated</span>
                    <span className="text-sm font-bold text-[#1a4d4d]">{analytics.providerActivation.activated}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-[#1a4d4d] h-3 rounded-full" style={{ width: "75%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Pending</span>
                    <span className="text-sm font-bold text-orange-600">{analytics.providerActivation.pending}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-orange-600 h-3 rounded-full" style={{ width: "18%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Inactive</span>
                    <span className="text-sm font-bold text-red-600">{analytics.providerActivation.inactive}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-red-600 h-3 rounded-full" style={{ width: "7%" }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Completion Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#ff6633]" />
                Course Completion Metrics
              </CardTitle>
              <CardDescription>Enrollment and completion statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Completed</span>
                    <span className="text-sm font-bold text-green-600">{analytics.courseCompletion.completed}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-600 h-3 rounded-full" style={{ width: "69%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">In Progress</span>
                    <span className="text-sm font-bold text-blue-600">{analytics.courseCompletion.inProgress}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-600 h-3 rounded-full" style={{ width: "22%" }} />
                  </div>
                </div>
                <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Average Time to Completion:</strong> {analytics.courseCompletion.avgTimeToCompletion}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Retention & Churn Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Retention Cohort */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-[#1a4d4d]" />
                Retention Cohort Analysis
              </CardTitle>
              <CardDescription>User retention over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Month 1</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded h-2">
                      <div className="bg-[#1a4d4d] h-2 rounded" style={{ width: "95%" }} />
                    </div>
                    <span className="text-sm font-bold">{analytics.retention.month1}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Month 2</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded h-2">
                      <div className="bg-[#1a4d4d] h-2 rounded" style={{ width: "87%" }} />
                    </div>
                    <span className="text-sm font-bold">{analytics.retention.month2}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Month 3</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded h-2">
                      <div className="bg-[#1a4d4d] h-2 rounded" style={{ width: "76%" }} />
                    </div>
                    <span className="text-sm font-bold">{analytics.retention.month3}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Month 6</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded h-2">
                      <div className="bg-[#1a4d4d] h-2 rounded" style={{ width: "62%" }} />
                    </div>
                    <span className="text-sm font-bold">{analytics.retention.month6}%</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-teal-50 rounded-lg border border-[#1a4d4d]">
                  <p className="text-sm text-gray-700">
                    <strong>Average Retention:</strong> {analytics.retention.avgRetention}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Churn Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-red-600" />
                Churn Risk Distribution
              </CardTitle>
              <CardDescription>Provider risk segmentation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-sm font-medium">High Risk</span>
                  <span className="text-lg font-bold text-red-600">{analytics.churnRisk.highRisk}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="text-sm font-medium">Medium Risk</span>
                  <span className="text-lg font-bold text-orange-600">{analytics.churnRisk.mediumRisk}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-sm font-medium">Low Risk</span>
                  <span className="text-lg font-bold text-green-600">{analytics.churnRisk.lowRisk}</span>
                </div>
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Predicted Churn (30 days):</strong> {analytics.churnRisk.predictedChurn} providers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
