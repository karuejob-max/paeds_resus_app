import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, TrendingUp, Award, AlertCircle } from "lucide-react";

export default function InstitutionalDashboard() {
  const enrollmentData = [
    { month: "Jan", enrolled: 45, completed: 12, certified: 8 },
    { month: "Feb", enrolled: 52, completed: 18, certified: 14 },
    { month: "Mar", enrolled: 48, completed: 25, certified: 20 },
    { month: "Apr", enrolled: 61, completed: 35, certified: 28 },
    { month: "May", enrolled: 58, completed: 42, certified: 35 },
    { month: "Jun", enrolled: 67, completed: 52, certified: 45 },
  ];

  const departmentData = [
    { name: "Emergency", value: 45, color: "#ef4444" },
    { name: "ICU", value: 38, color: "#3b82f6" },
    { name: "Pediatrics", value: 32, color: "#10b981" },
    { name: "Nursing", value: 28, color: "#f59e0b" },
    { name: "Other", value: 15, color: "#8b5cf6" },
  ];

  const stats = [
    {
      icon: Users,
      title: "Total Enrolled",
      value: "158",
      change: "+12% this month",
      color: "text-blue-600",
    },
    {
      icon: Award,
      title: "Certified",
      value: "123",
      change: "+8 this month",
      color: "text-green-600",
    },
    {
      icon: TrendingUp,
      title: "Completion Rate",
      value: "78%",
      change: "+5% improvement",
      color: "text-purple-600",
    },
    {
      icon: AlertCircle,
      title: "In Progress",
      value: "35",
      change: "12 at risk",
      color: "text-orange-600",
    },
  ];

  const recentEnrollments = [
    {
      name: "Dr. Jane Kipchoge",
      program: "Elite Fellowship",
      status: "In Progress",
      progress: 65,
      enrollDate: "Jan 15, 2026",
    },
    {
      name: "James Mwangi",
      program: "Standard Certification",
      status: "Completed",
      progress: 100,
      enrollDate: "Dec 10, 2025",
    },
    {
      name: "Sarah Okonkwo",
      program: "Neonatal Resuscitation",
      status: "In Progress",
      progress: 45,
      enrollDate: "Jan 20, 2026",
    },
    {
      name: "David Kiplagat",
      program: "Trauma Module",
      status: "Not Started",
      progress: 0,
      enrollDate: "Jan 25, 2026",
    },
    {
      name: "Emily Kipchoge",
      program: "Elite Fellowship",
      status: "Completed",
      progress: 100,
      enrollDate: "Nov 30, 2025",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Not Started":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Institutional Dashboard
              </h1>
              <p className="text-gray-600">
                Manage your institution's training programs and track learner progress
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Download Report</Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Invite Staff
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                        <p className="text-3xl font-bold text-gray-900 mb-2">
                          {stat.value}
                        </p>
                        <p className="text-xs text-gray-500">{stat.change}</p>
                      </div>
                      <Icon className={`w-8 h-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Enrollment Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Trend</CardTitle>
              <CardDescription>Monthly enrollment and completion data</CardDescription>
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
              <CardTitle>Enrollment by Department</CardTitle>
              <CardDescription>Distribution across departments</CardDescription>
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
      </section>

      {/* Recent Enrollments */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Recent Enrollments</CardTitle>
              <CardDescription>Latest staff members enrolled in programs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Program
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Progress
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Enrolled Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEnrollments.map((enrollment, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{enrollment.name}</td>
                        <td className="py-3 px-4 text-gray-600">{enrollment.program}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(enrollment.status)}>
                            {enrollment.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${enrollment.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">
                            {enrollment.progress}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {enrollment.enrollDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Enrollment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Enroll multiple staff members at once with special bulk pricing
                </p>
                <Button variant="outline" className="w-full">
                  Start Bulk Enrollment
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing Calculator</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Calculate custom pricing based on your institution's needs
                </p>
                <Button variant="outline" className="w-full">
                  Open Calculator
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  See the return on investment from your training programs
                </p>
                <Button variant="outline" className="w-full">
                  View ROI Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
