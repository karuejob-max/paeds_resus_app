import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  TrendingUp,
  Award,
  DollarSign,
  Settings,
  Download,
  Share2,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function EnterpriseDashboard() {
  const [dateRange, setDateRange] = useState("month");

  // Mock data for enterprise metrics
  const enterpriseMetrics = {
    totalStaff: 450,
    activeUsers: 387,
    completionRate: 86,
    certifications: 342,
    totalSpent: 4500000,
    roi: 850,
    livesSaved: 127,
  };

  const enrollmentData = [
    { month: "Jan", enrolled: 45, completed: 38, certified: 32 },
    { month: "Feb", enrolled: 52, completed: 48, certified: 42 },
    { month: "Mar", enrolled: 48, completed: 45, certified: 40 },
    { month: "Apr", enrolled: 61, completed: 58, certified: 52 },
    { month: "May", enrolled: 55, completed: 52, certified: 48 },
    { month: "Jun", enrolled: 67, completed: 64, certified: 58 },
  ];

  const departmentData = [
    { name: "ICU", value: 120, color: "#3b82f6" },
    { name: "Emergency", value: 95, color: "#ef4444" },
    { name: "Pediatrics", value: 87, color: "#10b981" },
    { name: "Surgery", value: 65, color: "#f59e0b" },
    { name: "Other", value: 40, color: "#8b5cf6" },
  ];

  const coursePerformance = [
    { course: "BLS", completion: 92, satisfaction: 4.8 },
    { course: "ACLS", completion: 88, satisfaction: 4.7 },
    { course: "PALS", completion: 85, satisfaction: 4.6 },
    { course: "Elite Fellowship", completion: 78, satisfaction: 4.9 },
  ];

  const teamMembers = [
    { id: 1, name: "Dr. James Mwangi", role: "Admin", status: "active", courses: 3 },
    { id: 2, name: "Dr. Sarah Kipchoge", role: "Trainer", status: "active", courses: 5 },
    { id: 3, name: "Nurse Michael", role: "Coordinator", status: "active", courses: 2 },
    { id: 4, name: "Dr. Emily Okonkwo", role: "Admin", status: "inactive", courses: 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Enterprise Dashboard</h1>
              <p className="text-slate-600 mt-1">Kenyatta National Hospital</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Staff</p>
                    <p className="text-2xl font-bold text-slate-900">{enterpriseMetrics.totalStaff}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Active Users</p>
                    <p className="text-2xl font-bold text-slate-900">{enterpriseMetrics.activeUsers}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-slate-900">{enterpriseMetrics.completionRate}%</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Certifications</p>
                    <p className="text-2xl font-bold text-slate-900">{enterpriseMetrics.certifications}</p>
                  </div>
                  <Award className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Enrollment Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Enrollment Trend</CardTitle>
                  <CardDescription>Last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={enrollmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="enrolled" stroke="#3b82f6" />
                      <Line type="monotone" dataKey="completed" stroke="#10b981" />
                      <Line type="monotone" dataKey="certified" stroke="#f59e0b" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Department Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Distribution</CardTitle>
                  <CardDescription>Staff by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* ROI & Impact */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 font-semibold">ROI</p>
                      <p className="text-3xl font-bold text-green-900">{enterpriseMetrics.roi}%</p>
                      <p className="text-xs text-green-700 mt-2">Return on investment</p>
                    </div>
                    <DollarSign className="w-12 h-12 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700 font-semibold">Total Investment</p>
                      <p className="text-3xl font-bold text-blue-900">KES {(enterpriseMetrics.totalSpent / 1000000).toFixed(1)}M</p>
                      <p className="text-xs text-blue-700 mt-2">Annual spend</p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700 font-semibold">Lives Saved</p>
                      <p className="text-3xl font-bold text-purple-900">{enterpriseMetrics.livesSaved}+</p>
                      <p className="text-xs text-purple-700 mt-2">Estimated impact</p>
                    </div>
                    <Award className="w-12 h-12 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Performance</CardTitle>
                <CardDescription>Completion rates and satisfaction scores</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={coursePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="course" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completion" fill="#3b82f6" name="Completion %" />
                    <Bar dataKey="satisfaction" fill="#10b981" name="Satisfaction (out of 5)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">High Engagement</p>
                    <p className="text-sm text-blue-700">86% completion rate is 15% above industry average</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">Strong ROI</p>
                    <p className="text-sm text-green-700">850% ROI indicates significant operational improvements</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage your institutional team</CardDescription>
                </div>
                <Button size="sm">Add Member</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-600">{member.role}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={member.status === "active" ? "default" : "secondary"}>
                          {member.status}
                        </Badge>
                        <span className="text-sm text-slate-600">{member.courses} courses</span>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>Manage your subscription and payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg bg-slate-50">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="font-semibold text-slate-900">Current Plan</p>
                      <p className="text-sm text-slate-600">Enterprise - 450 staff members</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">Active</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Monthly Cost</p>
                      <p className="font-bold text-slate-900">KES 375,000</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Renewal Date</p>
                      <p className="font-bold text-slate-900">Feb 20, 2026</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Status</p>
                      <p className="font-bold text-green-600">Paid</p>
                    </div>
                  </div>
                </div>
                <Button className="w-full">Upgrade Plan</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Institution Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Institution Name</label>
                  <input
                    type="text"
                    defaultValue="Kenyatta National Hospital"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Contact Email</label>
                  <input
                    type="email"
                    defaultValue="admin@knh.go.ke"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">API Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      defaultValue="sk_live_xxxxxxxxxxxxx"
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button variant="outline">Copy</Button>
                  </div>
                </div>
                <Button className="w-full">Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
