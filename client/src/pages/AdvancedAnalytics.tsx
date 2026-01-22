import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  LineChart,
  TrendingUp,
  Download,
  Filter,
  Calendar,
  Users,
  Award,
  DollarSign,
  Activity,
} from "lucide-react";

export default function AdvancedAnalytics() {
  const [dateRange, setDateRange] = useState("30days");
  const [selectedMetric, setSelectedMetric] = useState("enrollment");

  const metrics: Record<string, any> = {
    enrollment: {
      title: "Enrollment Trends",
      value: 1247,
      change: 12.5,
      icon: Users,
    },
    completion: {
      title: "Course Completion Rate",
      value: 78.3,
      change: 5.2,
      unit: "%",
      icon: Award,
    },
    revenue: {
      title: "Total Revenue",
      value: 2450000,
      change: 18.7,
      unit: "KES",
      icon: DollarSign,
    },
    engagement: {
      title: "Platform Engagement",
      value: 92.1,
      change: 3.4,
      unit: "%",
      icon: Activity,
    },
  };

  const enrollmentData = [
    { month: "Jan", individual: 120, institutional: 450 },
    { month: "Feb", individual: 150, institutional: 520 },
    { month: "Mar", individual: 180, institutional: 610 },
    { month: "Apr", individual: 220, institutional: 720 },
    { month: "May", individual: 280, institutional: 850 },
    { month: "Jun", individual: 350, institutional: 1020 },
  ];

  const coursePerformance = [
    { course: "BLS", enrollments: 450, completions: 380, revenue: 4500000 },
    { course: "ACLS", enrollments: 280, completions: 215, revenue: 4300000 },
    { course: "PALS", enrollments: 320, completions: 245, revenue: 4900000 },
    { course: "Fellowship", enrollments: 197, completions: 142, revenue: 9940000 },
  ];

  const demographicData = [
    { role: "Doctor", count: 450, percentage: 36 },
    { role: "Nurse", count: 580, percentage: 46 },
    { role: "Paramedic", count: 150, percentage: 12 },
    { role: "Other", count: 67, percentage: 6 },
  ];

  const geographicData = [
    { region: "Nairobi", enrollments: 580, completions: 470 },
    { region: "Mombasa", enrollments: 320, completions: 245 },
    { region: "Kisumu", enrollments: 180, completions: 135 },
    { region: "Nakuru", enrollments: 167, completions: 125 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Advanced Analytics</h1>
          <p className="text-lg text-slate-600">
            Comprehensive platform metrics, trends, and insights
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {Object.entries(metrics).map(([key, metric]) => {
            const Icon = metric.icon;
            return (
              <Card
                key={key}
                className={`cursor-pointer transition ${
                  selectedMetric === key ? "ring-2 ring-teal-600" : ""
                }`}
                onClick={() => setSelectedMetric(key)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {metric.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-slate-900">
                    {metric.value.toLocaleString()}
                    {metric.unit ? <span className="text-lg ml-1">{metric.unit}</span> : null}
                  </p>
                  <p className={`text-sm mt-1 ${metric.change > 0 ? "text-green-600" : "text-red-600"}`}>
                    {metric.change > 0 ? "↑" : "↓"} {Math.abs(metric.change)}% from last month
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="enrollment" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="geography">Geography</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          {/* Enrollment Tab */}
          <TabsContent value="enrollment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <LineChart className="w-5 h-5" />
                    Enrollment Trends
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="w-4 h-4" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>Individual vs Institutional enrollments over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 bg-slate-100 rounded-lg flex items-center justify-center">
                  <p className="text-slate-600">Chart visualization (integrate with Recharts/Chart.js)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enrollment Data Table</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Month</th>
                        <th className="text-left py-3 px-4 font-semibold">Individual</th>
                        <th className="text-left py-3 px-4 font-semibold">Institutional</th>
                        <th className="text-left py-3 px-4 font-semibold">Total</th>
                        <th className="text-left py-3 px-4 font-semibold">Growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollmentData.map((row) => (
                        <tr key={row.month} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4">{row.month}</td>
                          <td className="py-3 px-4">{row.individual}</td>
                          <td className="py-3 px-4">{row.institutional}</td>
                          <td className="py-3 px-4 font-semibold">
                            {row.individual + row.institutional}
                          </td>
                          <td className="py-3 px-4 text-green-600">+12.5%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Performance</CardTitle>
                <CardDescription>Enrollment, completion, and revenue by course</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {coursePerformance.map((course) => (
                    <div key={course.course} className="border-b pb-6 last:border-b-0">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-slate-900">{course.course}</h4>
                        <Badge className="bg-teal-100 text-teal-700">
                          {((course.completions / course.enrollments) * 100).toFixed(1)}% completion
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-slate-600">Enrollments</p>
                          <p className="text-2xl font-bold text-blue-600">{course.enrollments}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Completions</p>
                          <p className="text-2xl font-bold text-green-600">{course.completions}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Revenue</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {(course.revenue / 1000000).toFixed(1)}M KES
                          </p>
                        </div>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${(course.completions / course.enrollments) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Demographics Tab */}
          <TabsContent value="demographics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Learner Demographics</CardTitle>
                <CardDescription>Breakdown by professional role</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {demographicData.map((demo) => (
                  <div key={demo.role}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{demo.role}</span>
                      <span className="text-sm font-bold">{demo.count} ({demo.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full"
                        style={{ width: `${demo.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Geography Tab */}
          <TabsContent value="geography" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Enrollments and completions by region</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Region</th>
                        <th className="text-left py-3 px-4 font-semibold">Enrollments</th>
                        <th className="text-left py-3 px-4 font-semibold">Completions</th>
                        <th className="text-left py-3 px-4 font-semibold">Completion Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {geographicData.map((geo) => (
                        <tr key={geo.region} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium">{geo.region}</td>
                          <td className="py-3 px-4">{geo.enrollments}</td>
                          <td className="py-3 px-4">{geo.completions}</td>
                          <td className="py-3 px-4">
                            <Badge className="bg-green-100 text-green-700">
                              {((geo.completions / geo.enrollments) * 100).toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Export</CardTitle>
                <CardDescription>Download analytics data in various formats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Download className="w-4 h-4" />
                  Export Enrollment Data (CSV)
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Download className="w-4 h-4" />
                  Export Course Performance (Excel)
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Download className="w-4 h-4" />
                  Export Demographics (PDF)
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Download className="w-4 h-4" />
                  Export Geographic Data (JSON)
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Download className="w-4 h-4" />
                  Export Full Analytics Report (PDF)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scheduled Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <div>
                    <p className="font-medium">Weekly Summary</p>
                    <p className="text-sm text-slate-600">Every Monday at 8:00 AM</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <div>
                    <p className="font-medium">Monthly Report</p>
                    <p className="text-sm text-slate-600">First day of month at 9:00 AM</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
