import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Download,
  Calendar,
  Filter,
  PieChart,
  LineChart,
} from "lucide-react";

interface AnalyticsData {
  totalEnrollments: number;
  activeLearners: number;
  completionRate: number;
  averageScore: number;
  certificatesIssued: number;
  totalRevenue: number;
  enrollmentTrend: Array<{ date: string; count: number }>;
  coursePerformance: Array<{ course: string; enrollments: number; completion: number }>;
  learnerDemographics: Array<{ category: string; percentage: number }>;
}

export default function Analytics() {
  const [dateRange, setDateRange] = useState<"week" | "month" | "quarter" | "year">(
    "month"
  );
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  // Mock analytics data
  const analyticsData: AnalyticsData = {
    totalEnrollments: 2450,
    activeLearners: 1890,
    completionRate: 78,
    averageScore: 82,
    certificatesIssued: 1912,
    totalRevenue: 12250000,
    enrollmentTrend: [
      { date: "Jan 1", count: 145 },
      { date: "Jan 8", count: 189 },
      { date: "Jan 15", count: 234 },
      { date: "Jan 22", count: 267 },
      { date: "Jan 29", count: 312 },
      { date: "Feb 5", count: 356 },
      { date: "Feb 12", count: 401 },
    ],
    coursePerformance: [
      { course: "BLS Fundamentals", enrollments: 450, completion: 85 },
      { course: "ACLS Advanced", enrollments: 380, completion: 82 },
      { course: "PALS Pediatric", enrollments: 420, completion: 79 },
      { course: "Airway Management", enrollments: 340, completion: 75 },
      { course: "Neonatal Resuscitation", enrollments: 380, completion: 88 },
      { course: "Trauma Essentials", enrollments: 300, completion: 71 },
    ],
    learnerDemographics: [
      { category: "Doctors", percentage: 35 },
      { category: "Nurses", percentage: 42 },
      { category: "Paramedics", percentage: 15 },
      { category: "Other", percentage: 8 },
    ],
  };

  const getMetricChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
    };
  };

  const enrollmentChange = getMetricChange(2450, 2100);
  const completionChange = getMetricChange(78, 72);
  const revenueChange = getMetricChange(12250000, 10500000);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
                <p className="text-gray-600">Track platform performance and learner insights</p>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>

          {/* Date Range Filter */}
          <div className="flex gap-2">
            {["week", "month", "quarter", "year"].map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? "default" : "outline"}
                onClick={() => setDateRange(range as any)}
                className="capitalize"
              >
                {range}
              </Button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Enrollments</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analyticsData.totalEnrollments.toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
            <p className={`text-sm font-medium ${enrollmentChange.isPositive ? "text-green-600" : "text-red-600"}`}>
              {enrollmentChange.isPositive ? "+" : "-"}{enrollmentChange.value}% vs last period
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Learners</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analyticsData.activeLearners.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
            </div>
            <p className="text-sm text-gray-600">
              {((analyticsData.activeLearners / analyticsData.totalEnrollments) * 100).toFixed(1)}% of enrollments
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analyticsData.completionRate}%
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
            <p className={`text-sm font-medium ${completionChange.isPositive ? "text-green-600" : "text-red-600"}`}>
              {completionChange.isPositive ? "+" : "-"}{completionChange.value}% vs last period
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Score</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analyticsData.averageScore}%
                </p>
              </div>
              <LineChart className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
            <p className="text-sm text-gray-600">Across all courses</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Certificates Issued</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analyticsData.certificatesIssued.toLocaleString()}
                </p>
              </div>
              <Award className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
            <p className="text-sm text-gray-600">
              {((analyticsData.certificatesIssued / analyticsData.totalEnrollments) * 100).toFixed(1)}% completion rate
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-green-700 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-green-900">
                  KES {(analyticsData.totalRevenue / 1000000).toFixed(1)}M
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 opacity-50" />
            </div>
            <p className={`text-sm font-medium ${revenueChange.isPositive ? "text-green-600" : "text-red-600"}`}>
              {revenueChange.isPositive ? "+" : "-"}{revenueChange.value}% vs last period
            </p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Enrollment Trend */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <LineChart className="w-5 h-5" />
              Enrollment Trend
            </h3>
            <div className="h-64 flex items-end gap-2 justify-between">
              {analyticsData.enrollmentTrend.map((data, idx) => {
                const maxCount = Math.max(...analyticsData.enrollmentTrend.map((d) => d.count));
                const height = (data.count / maxCount) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all hover:opacity-80"
                      style={{ height: `${height}%`, minHeight: "20px" }}
                    />
                    <span className="text-xs text-gray-600 mt-2 text-center">{data.date}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Learner Demographics */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Learner Demographics
            </h3>
            <div className="space-y-4">
              {analyticsData.learnerDemographics.map((demo, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{demo.category}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {demo.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${demo.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Course Performance */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Course Performance
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Course
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Enrollments
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Completion Rate
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Trend
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.coursePerformance.map((course, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {course.course}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {course.enrollments.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              course.completion >= 80
                                ? "bg-green-500"
                                : course.completion >= 70
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${course.completion}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {course.completion}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-green-600 font-medium">↑ 12%</span>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCourse(course.course)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Export Options */}
        <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-4">Generate Reports</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: "Enrollment Report", icon: Users },
              { label: "Performance Report", icon: TrendingUp },
              { label: "Revenue Report", icon: BarChart3 },
            ].map((report, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="justify-start h-auto p-4"
              >
                <report.icon className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{report.label}</p>
                  <p className="text-xs text-gray-600">Download as PDF</p>
                </div>
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
