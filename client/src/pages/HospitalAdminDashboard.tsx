import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  Users,
  CheckCircle2,
  TrendingUp,
  Download,
  Mail,
  AlertCircle,
  Calendar,
  Clock,
  Award,
  DollarSign,
} from "lucide-react";
import { getLoginUrl } from "@/const";

export default function HospitalAdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [institutionId, setInstitutionId] = useState<number | null>(null);

  // Fetch institution stats
  const { data: stats, isLoading: statsLoading } = trpc.institution.getStats.useQuery(
    { institutionId: institutionId || 1 },
    { enabled: !!institutionId }
  );

  // Fetch staff members
  const { data: staffData, isLoading: staffLoading } = trpc.institution.getStaffMembers.useQuery(
    { institutionId: institutionId || 1 },
    { enabled: !!institutionId }
  );

  useEffect(() => {
    // In a real app, get institutionId from user context or URL params
    if (user?.id) {
      setInstitutionId(1); // Placeholder
    }
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">Sign in to access the Hospital Admin Dashboard</p>
            <a href={getLoginUrl()}>
              <Button className="w-full bg-blue-900 hover:bg-blue-800">Sign In</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completionRate = stats?.completionRate || 0;
  const certificationRate = stats?.certificationRate || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Hospital Admin Dashboard</h1>
          <p className="text-lg text-slate-600">Real-time training program metrics and staff management</p>
        </div>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats?.totalStaff || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Active members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Enrolled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{stats?.enrolledStaff || 0}</p>
              <p className="text-xs text-slate-500 mt-1">In training</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats?.completedStaff || 0}</p>
              <p className="text-xs text-slate-500 mt-1">{completionRate.toFixed(1)}% rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Certified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{stats?.certifiedStaff || 0}</p>
              <p className="text-xs text-slate-500 mt-1">{certificationRate.toFixed(1)}% certified</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                ROI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-teal-600">3.2x</p>
              <p className="text-xs text-slate-500 mt-1">Estimated impact</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="staff">Staff Management</TabsTrigger>
            <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Completion Progress
                </CardTitle>
                <CardDescription>Overall training completion rate across all staff</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Course Completion</span>
                    <span className="text-sm font-bold">{completionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={completionRate} className="h-3" />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Certification Rate</span>
                    <span className="text-sm font-bold">{certificationRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={certificationRate} className="h-3" />
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="gap-2">
                      <Mail className="w-4 h-4" />
                      Send Reminder
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Download className="w-4 h-4" />
                      Export Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium text-sm">Batch 1 Certification</p>
                      <p className="text-xs text-slate-600">Due in 5 days</p>
                    </div>
                    <Badge variant="outline" className="bg-orange-100">
                      5 days
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <p className="font-medium text-sm">Batch 2 Enrollment</p>
                      <p className="text-xs text-slate-600">Due in 12 days</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-100">
                      12 days
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Management Tab */}
          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Staff Members</CardTitle>
                <CardDescription>Total: {staffData?.length || 0} staff members</CardDescription>
              </CardHeader>
              <CardContent>
                {staffLoading ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600">Loading staff members...</p>
                  </div>
                ) : staffData && staffData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Name</th>
                          <th className="text-left py-3 px-4 font-semibold">Role</th>
                          <th className="text-left py-3 px-4 font-semibold">Department</th>
                          <th className="text-left py-3 px-4 font-semibold">Status</th>
                          <th className="text-left py-3 px-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffData.map((staff: any) => (
                          <tr key={staff.id} className="border-b hover:bg-slate-50">
                            <td className="py-3 px-4">{staff.staffName}</td>
                            <td className="py-3 px-4 capitalize">{staff.staffRole}</td>
                            <td className="py-3 px-4">{staff.department || "—"}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="bg-blue-50">
                                Active
                              </Badge>
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
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">No staff members found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tracking Tab */}
          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Progress by Program</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {["BLS", "ACLS", "PALS", "Fellowship"].map((program) => (
                  <div key={program}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{program}</span>
                      <span className="text-sm text-slate-600">45/100 enrolled</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Individual Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Dr. Jane Smith", progress: 100, status: "Certified" },
                    { name: "Nurse John Doe", progress: 75, status: "In Progress" },
                    { name: "Dr. Alice Johnson", progress: 50, status: "In Progress" },
                    { name: "Paramedic Mike Brown", progress: 25, status: "Started" },
                  ].map((person) => (
                    <div key={person.name} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-sm">{person.name}</span>
                        <Badge
                          variant="outline"
                          className={
                            person.status === "Certified"
                              ? "bg-green-50 text-green-700"
                              : "bg-blue-50 text-blue-700"
                          }
                        >
                          {person.status}
                        </Badge>
                      </div>
                      <Progress value={person.progress} className="h-2" />
                      <p className="text-xs text-slate-600 mt-1">{person.progress}% complete</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Reports</CardTitle>
                <CardDescription>Download training and compliance reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Download className="w-4 h-4" />
                  Training Completion Report
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Download className="w-4 h-4" />
                  Certification Summary
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Download className="w-4 h-4" />
                  Compliance Audit Report
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Download className="w-4 h-4" />
                  ROI Analysis
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment & Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Current Plan: Professional</p>
                    <p className="text-sm text-slate-600">50 staff members • 9,000 KES per staff</p>
                  </div>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Next Billing Date</p>
                    <p className="text-sm text-slate-600">February 22, 2026</p>
                  </div>
                  <DollarSign className="w-5 h-5 text-slate-400" />
                </div>
                <Button variant="outline" className="w-full">
                  Upgrade Plan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
