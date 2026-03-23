import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StaffBulkImport from "@/components/StaffBulkImport";
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
  FileText,
} from "lucide-react";
import { getLoginUrl } from "@/const";

const WELCOME_KEY = "institutionalPortalWelcome";

export default function HospitalAdminDashboard() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [showWelcome, setShowWelcome] = useState(false);
  const [bulkCourse, setBulkCourse] = useState<"bls" | "acls" | "pals" | "fellowship">("bls");
  const [bulkDate, setBulkDate] = useState(() => new Date().toISOString().slice(0, 10));

  const utils = trpc.useUtils();

  useEffect(() => {
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(WELCOME_KEY) === "1") {
      sessionStorage.removeItem(WELCOME_KEY);
      setShowWelcome(true);
    }
  }, []);

  const { data: myInstitution, isLoading: myInstitutionLoading } = trpc.institution.getMyInstitution.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const institutionId = myInstitution?.institution?.id ?? null;

  const { data: stats, isLoading: statsLoading } = trpc.institution.getStats.useQuery(
    { institutionId: institutionId! },
    { enabled: !!institutionId }
  );

  const { data: staffData, isLoading: staffLoading } = trpc.institution.getStaffMembers.useQuery(
    { institutionId: institutionId! },
    { enabled: !!institutionId }
  );

  const { data: quotations, isLoading: quotationsLoading } = trpc.institution.getQuotations.useQuery(
    { institutionId: institutionId! },
    { enabled: !!institutionId }
  );

  const { data: trainingSchedules, isLoading: schedulesLoading } = trpc.institution.getTrainingSchedules.useQuery(
    { institutionId: institutionId! },
    { enabled: !!institutionId }
  );

  const bulkEnrollMutation = trpc.institution.bulkEnrollFromStaffRoster.useMutation({
    onSuccess: () => {
      if (institutionId) {
        void utils.institution.getStats.invalidate({ institutionId });
        void utils.institution.getStaffMembers.invalidate({ institutionId });
      }
    },
  });

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

  if (myInstitutionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-slate-600">Loading your institution…</p>
      </div>
    );
  }

  if (!institutionId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-slate-100 py-12">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>No institution linked</CardTitle>
            <CardDescription>
              Complete institutional onboarding to create your facility account, or contact Paeds Resus if you need access.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => navigate("/institution-onboarding")} className="bg-[#1a4d4d] hover:bg-[#0d3333]">
              Start institutional onboarding
            </Button>
            <Button variant="outline" onClick={() => navigate("/institutional")}>
              Contact / pricing
            </Button>
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Institutional dashboard</h1>
          <p className="text-lg text-slate-600">Training metrics, staff roster, quotations, and bulk enrollment</p>
        </div>

        {showWelcome && (
          <Alert className="mb-6 border-green-600/50 bg-green-50 text-green-900">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>Welcome! Your institution is set up. Add staff, run bulk enrollment, and track progress from here.</span>
              <Button variant="ghost" size="sm" onClick={() => setShowWelcome(false)} className="text-green-700 shrink-0">
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-8 gap-1 h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="quotations">Quotations</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
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
            <StaffBulkImport institutionId={institutionId} />

            <Card>
              <CardHeader>
                <CardTitle>Bulk enrollment (roster → courses)</CardTitle>
                <CardDescription>
                  Creates enrollments and pending M-Pesa payment rows for every person on your staff list.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Program</Label>
                  <Select value={bulkCourse} onValueChange={(v) => setBulkCourse(v as typeof bulkCourse)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bls">BLS</SelectItem>
                      <SelectItem value="acls">ACLS</SelectItem>
                      <SelectItem value="pals">PALS</SelectItem>
                      <SelectItem value="fellowship">Fellowship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Training date</Label>
                  <Input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} />
                </div>
                <Button
                  className="bg-[#1a4d4d] hover:bg-[#0d3333]"
                  disabled={bulkEnrollMutation.isPending || !staffData?.length}
                  onClick={() => {
                    if (!institutionId) return;
                    bulkEnrollMutation.mutate({
                      institutionId,
                      courseType: bulkCourse,
                      trainingDate: new Date(bulkDate),
                    });
                  }}
                >
                  {bulkEnrollMutation.isPending ? "Running…" : "Run bulk enrollment"}
                </Button>
                {bulkEnrollMutation.isSuccess && bulkEnrollMutation.data && (
                  <p className="text-sm text-green-700">
                    Created {bulkEnrollMutation.data.enrolledCount} enrollment(s).{" "}
                    {bulkEnrollMutation.data.failedCount ? `${bulkEnrollMutation.data.failedCount} failed.` : ""}
                  </p>
                )}
                {bulkEnrollMutation.isError && (
                  <p className="text-sm text-red-600">{bulkEnrollMutation.error.message}</p>
                )}
              </CardContent>
            </Card>

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

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Training schedule
                </CardTitle>
                <CardDescription>Sessions linked to your institution (INST-12)</CardDescription>
              </CardHeader>
              <CardContent>
                {schedulesLoading ? (
                  <p className="text-sm text-slate-500">Loading…</p>
                ) : !trainingSchedules?.length ? (
                  <p className="text-sm text-slate-600">
                    No training sessions yet. When schedules are created in the database, they will appear here.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-slate-600">
                          <th className="py-2 pr-4">Date</th>
                          <th className="py-2 pr-4">Type</th>
                          <th className="py-2 pr-4">Status</th>
                          <th className="py-2 pr-4">Location</th>
                          <th className="py-2 pr-4">Capacity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trainingSchedules.map((row) => (
                          <tr key={row.id} className="border-b border-slate-100">
                            <td className="py-2 pr-4 whitespace-nowrap">
                              {row.scheduledDate ? new Date(row.scheduledDate).toLocaleString() : "—"}
                            </td>
                            <td className="py-2 pr-4 capitalize">{row.trainingType?.replace("_", " ")}</td>
                            <td className="py-2 pr-4 capitalize">{row.status}</td>
                            <td className="py-2 pr-4">{row.location || "—"}</td>
                            <td className="py-2 pr-4">
                              {row.enrolledCount ?? 0} / {row.maxCapacity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Quotations
                </CardTitle>
                <CardDescription>Records linked to your institution account</CardDescription>
              </CardHeader>
              <CardContent>
                {quotationsLoading ? (
                  <p className="text-slate-600">Loading…</p>
                ) : !quotations?.length ? (
                  <div className="text-center py-12 text-slate-500">
                    <p>No quotations yet.</p>
                    <p className="text-sm mt-2">Request a quote from the institutional page or contact sales.</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate("/institutional")}>
                      Go to institutional page
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-2 pr-4">Quote #</th>
                          <th className="py-2 pr-4">Status</th>
                          <th className="py-2 pr-4">Total (KES)</th>
                          <th className="py-2 pr-4">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotations.map((q) => (
                          <tr key={q.id} className="border-b">
                            <td className="py-2 pr-4 font-mono text-xs">{q.quotationNumber}</td>
                            <td className="py-2 pr-4">
                              <Badge variant="outline">{q.status ?? "—"}</Badge>
                            </td>
                            <td className="py-2 pr-4">{q.totalPrice != null ? q.totalPrice.toLocaleString() : "—"}</td>
                            <td className="py-2 pr-4">
                              {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
