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
import { Textarea } from "@/components/ui/textarea";
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
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { buildIncidentsGovernanceCsv, downloadCsv } from "@/lib/incidentsCsv";
import { toast } from "sonner";

const WELCOME_KEY = "institutionalPortalWelcome";

export default function HospitalAdminDashboard() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [showWelcome, setShowWelcome] = useState(false);
  const [bulkCourse, setBulkCourse] = useState<"bls" | "acls" | "pals" | "fellowship">("bls");
  const [bulkDate, setBulkDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [incidentForm, setIncidentForm] = useState({
    incidentDate: new Date().toISOString().slice(0, 16),
    incidentType: "other" as
      | "cardiac_arrest"
      | "respiratory_failure"
      | "severe_sepsis"
      | "shock"
      | "trauma"
      | "other",
    patientAge: "",
    responseTime: "",
    outcome: "unknown" as "pCOSCA" | "ROSC" | "mortality" | "ongoing_resuscitation" | "unknown",
    neurologicalStatus: "" as
      | ""
      | "intact"
      | "mild_impairment"
      | "moderate_impairment"
      | "severe_impairment"
      | "unknown",
    staffIdsCsv: "",
    protocolsCsv: "",
    gapsCsv: "",
    improvements: "",
    notes: "",
  });

  /** HI-B2B-1: New training session form */
  const [scheduleForm, setScheduleForm] = useState({
    programType: "bls" as "bls" | "acls" | "pals" | "fellowship",
    trainingType: "hands_on" as "online" | "hands_on" | "hybrid",
    scheduledDate: new Date().toISOString().slice(0, 16),
    startTime: "",
    endTime: "",
    location: "",
    instructorName: "",
    maxCapacity: "24",
  });

  /** HI-B2B-2: which session’s attendance roster is open */
  const [selectedScheduleForAttendance, setSelectedScheduleForAttendance] = useState<number | null>(null);

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

  const { data: incidentsList, isLoading: incidentsLoading } = trpc.institution.getIncidents.useQuery(
    { institutionId: institutionId!, limit: 100 },
    { enabled: !!institutionId }
  );

  const { data: rolledUpAnalytics, isLoading: analyticsLoading } = trpc.institution.getInstitutionalAnalytics.useQuery(
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

  const createIncidentMutation = trpc.institution.createIncident.useMutation({
    onSuccess: () => {
      if (institutionId) {
        void utils.institution.getIncidents.invalidate({ institutionId });
        void utils.institution.getInstitutionalAnalytics.invalidate({ institutionId });
      }
    },
  });

  const createTrainingScheduleMutation = trpc.institution.createTrainingSchedule.useMutation({
    onSuccess: () => {
      if (institutionId) {
        void utils.institution.getTrainingSchedules.invalidate({ institutionId });
        void utils.institution.getInstitutionalAnalytics.invalidate({ institutionId });
      }
      toast.success("Training session scheduled");
    },
    onError: (err) => toast.error(err.message || "Could not create schedule"),
  });

  const { data: attendanceRoster, isLoading: attendanceRosterLoading } =
    trpc.institution.getTrainingAttendanceForSchedule.useQuery(
      {
        institutionId: institutionId!,
        trainingScheduleId: selectedScheduleForAttendance!,
      },
      { enabled: !!institutionId && selectedScheduleForAttendance != null }
    );

  const upsertAttendanceMutation = trpc.institution.upsertTrainingAttendance.useMutation({
    onSuccess: () => {
      if (institutionId && selectedScheduleForAttendance != null) {
        void utils.institution.getTrainingAttendanceForSchedule.invalidate({
          institutionId,
          trainingScheduleId: selectedScheduleForAttendance,
        });
        void utils.institution.getTrainingSchedules.invalidate({ institutionId });
      }
    },
    onError: (err) => toast.error(err.message || "Could not update attendance"),
  });

  const registerAllStaffMutation = trpc.institution.registerAllStaffForTrainingSession.useMutation({
    onSuccess: (data) => {
      if (institutionId && selectedScheduleForAttendance != null) {
        void utils.institution.getTrainingAttendanceForSchedule.invalidate({
          institutionId,
          trainingScheduleId: selectedScheduleForAttendance,
        });
        void utils.institution.getTrainingSchedules.invalidate({ institutionId });
      }
      toast.success(data.added ? `Registered ${data.added} staff` : "Roster was already complete");
    },
    onError: (err) => toast.error(err.message || "Could not register roster"),
  });

  const refreshAnalyticsMutation = trpc.institution.refreshInstitutionalAnalytics.useMutation({
    onSuccess: () => {
      if (institutionId) {
        void utils.institution.getInstitutionalAnalytics.invalidate({ institutionId });
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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 mb-8 gap-1 h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
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

            {/* INST-14: rolled-up analytics (nightly job + refresh) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="w-5 h-5" />
                    Institutional analytics
                  </CardTitle>
                  <CardDescription>
                    Aggregated metrics (updated nightly, or when you log incidents / refresh)
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={!institutionId || refreshAnalyticsMutation.isPending}
                  onClick={() => institutionId && refreshAnalyticsMutation.mutate({ institutionId })}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshAnalyticsMutation.isPending ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <p className="text-sm text-slate-500">Loading…</p>
                ) : !rolledUpAnalytics ? (
                  <p className="text-sm text-slate-600">
                    No rollup row yet. Click <strong>Refresh</strong> to compute from staff roster and incidents.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Staff enrolled</p>
                      <p className="text-xl font-semibold">{rolledUpAnalytics.totalStaffEnrolled ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Certified</p>
                      <p className="text-xl font-semibold">{rolledUpAnalytics.totalStaffCertified ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Cert. rate</p>
                      <p className="text-xl font-semibold">{rolledUpAnalytics.certificationRate ?? 0}%</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Incidents logged</p>
                      <p className="text-xl font-semibold">{rolledUpAnalytics.incidentsHandled ?? 0}</p>
                    </div>
                    {rolledUpAnalytics.averageResponseTime != null && (
                      <div>
                        <p className="text-slate-500">Avg response (s)</p>
                        <p className="text-xl font-semibold">{rolledUpAnalytics.averageResponseTime}</p>
                      </div>
                    )}
                    {rolledUpAnalytics.averageCompletionTime != null && (
                      <div>
                        <p className="text-slate-500">Avg completion (days)</p>
                        <p className="text-xl font-semibold">{rolledUpAnalytics.averageCompletionTime}</p>
                      </div>
                    )}
                  </div>
                )}
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
                  Add training session
                </CardTitle>
                <CardDescription>
                  HI-B2B-1: Create a schedule row for your institution (requires matching course catalog program type).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Program</Label>
                    <Select
                      value={scheduleForm.programType}
                      onValueChange={(v) =>
                        setScheduleForm((f) => ({ ...f, programType: v as typeof f.programType }))
                      }
                    >
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
                    <Label>Format</Label>
                    <Select
                      value={scheduleForm.trainingType}
                      onValueChange={(v) =>
                        setScheduleForm((f) => ({ ...f, trainingType: v as typeof f.trainingType }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="hands_on">Hands-on</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Date & time</Label>
                    <Input
                      type="datetime-local"
                      value={scheduleForm.scheduledDate}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start time (optional HH:MM)</Label>
                    <Input
                      placeholder="09:00"
                      value={scheduleForm.startTime}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End time (optional HH:MM)</Label>
                    <Input
                      placeholder="17:00"
                      value={scheduleForm.endTime}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, endTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="Simulation lab / ward / link"
                      value={scheduleForm.location}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, location: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Instructor name (optional)</Label>
                    <Input
                      value={scheduleForm.instructorName}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, instructorName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max capacity</Label>
                    <Input
                      type="number"
                      min={1}
                      max={2000}
                      value={scheduleForm.maxCapacity}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, maxCapacity: e.target.value }))}
                    />
                  </div>
                </div>
                <Button
                  className="bg-[#1a4d4d] hover:bg-[#0d3333]"
                  disabled={!institutionId || createTrainingScheduleMutation.isPending}
                  onClick={() => {
                    if (!institutionId) return;
                    const cap = parseInt(scheduleForm.maxCapacity, 10);
                    if (!Number.isFinite(cap) || cap < 1) {
                      toast.error("Enter a valid capacity");
                      return;
                    }
                    createTrainingScheduleMutation.mutate({
                      institutionId,
                      programType: scheduleForm.programType,
                      trainingType: scheduleForm.trainingType,
                      scheduledDate: new Date(scheduleForm.scheduledDate),
                      startTime: scheduleForm.startTime.trim() || undefined,
                      endTime: scheduleForm.endTime.trim() || undefined,
                      location: scheduleForm.location.trim() || undefined,
                      instructorName: scheduleForm.instructorName.trim() || undefined,
                      maxCapacity: cap,
                    });
                  }}
                >
                  {createTrainingScheduleMutation.isPending ? "Saving…" : "Create session"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming & past sessions
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
                          <th className="py-2 pr-4">Attendance</th>
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
                            <td className="py-2 pr-4">
                              <Button
                                type="button"
                                variant={selectedScheduleForAttendance === row.id ? "default" : "outline"}
                                size="sm"
                                className={
                                  selectedScheduleForAttendance === row.id
                                    ? "bg-[#1a4d4d] hover:bg-[#0d3333]"
                                    : ""
                                }
                                onClick={() =>
                                  setSelectedScheduleForAttendance((cur) => (cur === row.id ? null : row.id))
                                }
                              >
                                {selectedScheduleForAttendance === row.id ? "Close" : "Roster"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedScheduleForAttendance != null && institutionId && (
              <Card>
                <CardHeader>
                  <CardTitle>Session attendance (HI-B2B-2)</CardTitle>
                  <CardDescription>
                    Register roster staff and mark attended / absent. Enrolled count on the session updates from
                    non-cancelled rows.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={registerAllStaffMutation.isPending}
                      onClick={() =>
                        registerAllStaffMutation.mutate({
                          institutionId,
                          trainingScheduleId: selectedScheduleForAttendance,
                        })
                      }
                    >
                      Register all staff (missing rows only)
                    </Button>
                  </div>
                  {attendanceRosterLoading ? (
                    <p className="text-sm text-slate-500">Loading roster…</p>
                  ) : !attendanceRoster?.rows?.length ? (
                    <p className="text-sm text-slate-600">No staff on roster. Add staff in the Staff tab first.</p>
                  ) : (
                    <div className="overflow-x-auto border rounded-md">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-slate-50 text-left text-slate-600">
                            <th className="py-2 px-3">Name</th>
                            <th className="py-2 px-3">Role</th>
                            <th className="py-2 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceRoster.rows.map((r) => (
                            <tr key={r.staffMemberId} className="border-b border-slate-100">
                              <td className="py-2 px-3">
                                <div className="font-medium text-slate-900">{r.staffName}</div>
                                <div className="text-xs text-slate-500">{r.staffEmail}</div>
                              </td>
                              <td className="py-2 px-3 capitalize">{r.staffRole?.replace(/_/g, " ")}</td>
                              <td className="py-2 px-3 min-w-[200px]">
                                {r.attendanceId == null ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={upsertAttendanceMutation.isPending}
                                    onClick={() =>
                                      upsertAttendanceMutation.mutate({
                                        institutionId,
                                        trainingScheduleId: selectedScheduleForAttendance,
                                        staffMemberId: r.staffMemberId,
                                        attendanceStatus: "registered",
                                      })
                                    }
                                  >
                                    Register on session
                                  </Button>
                                ) : (
                                  <Select
                                    value={r.attendanceStatus ?? "registered"}
                                    onValueChange={(v) =>
                                      upsertAttendanceMutation.mutate({
                                        institutionId,
                                        trainingScheduleId: selectedScheduleForAttendance,
                                        staffMemberId: r.staffMemberId,
                                        attendanceStatus: v as
                                          | "registered"
                                          | "attended"
                                          | "absent"
                                          | "cancelled",
                                      })
                                    }
                                    disabled={upsertAttendanceMutation.isPending}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="registered">Registered</SelectItem>
                                      <SelectItem value="attended">Attended</SelectItem>
                                      <SelectItem value="absent">Absent</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="incidents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Log incident
                </CardTitle>
                <CardDescription>
                  Clinical resuscitation / emergency events for governance and analytics (INST-13).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Incident date & time</Label>
                    <Input
                      type="datetime-local"
                      value={incidentForm.incidentDate}
                      onChange={(e) => setIncidentForm((f) => ({ ...f, incidentDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={incidentForm.incidentType}
                      onValueChange={(v) =>
                        setIncidentForm((f) => ({ ...f, incidentType: v as typeof f.incidentType }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cardiac_arrest">Cardiac arrest</SelectItem>
                        <SelectItem value="respiratory_failure">Respiratory failure</SelectItem>
                        <SelectItem value="severe_sepsis">Severe sepsis</SelectItem>
                        <SelectItem value="shock">Shock</SelectItem>
                        <SelectItem value="trauma">Trauma</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Patient age (months, optional)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={incidentForm.patientAge}
                      onChange={(e) => setIncidentForm((f) => ({ ...f, patientAge: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Response time (seconds, optional)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={incidentForm.responseTime}
                      onChange={(e) => setIncidentForm((f) => ({ ...f, responseTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Outcome</Label>
                    <Select
                      value={incidentForm.outcome}
                      onValueChange={(v) =>
                        setIncidentForm((f) => ({ ...f, outcome: v as typeof f.outcome }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pCOSCA">pCOSCA</SelectItem>
                        <SelectItem value="ROSC">ROSC</SelectItem>
                        <SelectItem value="mortality">Mortality</SelectItem>
                        <SelectItem value="ongoing_resuscitation">Ongoing resuscitation</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Neurological status (optional)</Label>
                    <Select
                      value={incidentForm.neurologicalStatus || "none"}
                      onValueChange={(v) =>
                        setIncidentForm((f) => ({
                          ...f,
                          neurologicalStatus: v === "none" ? "" : (v as typeof f.neurologicalStatus),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        <SelectItem value="intact">Intact</SelectItem>
                        <SelectItem value="mild_impairment">Mild impairment</SelectItem>
                        <SelectItem value="moderate_impairment">Moderate impairment</SelectItem>
                        <SelectItem value="severe_impairment">Severe impairment</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Staff member IDs (optional, comma-separated roster IDs)</Label>
                  <Input
                    placeholder="e.g. 1, 2, 3"
                    value={incidentForm.staffIdsCsv}
                    onChange={(e) => setIncidentForm((f) => ({ ...f, staffIdsCsv: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Protocols used (comma-separated)</Label>
                  <Input
                    placeholder="e.g. PALS, CPR"
                    value={incidentForm.protocolsCsv}
                    onChange={(e) => setIncidentForm((f) => ({ ...f, protocolsCsv: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>System gaps (comma-separated)</Label>
                  <Input
                    value={incidentForm.gapsCsv}
                    onChange={(e) => setIncidentForm((f) => ({ ...f, gapsCsv: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Improvements implemented</Label>
                  <Textarea
                    rows={2}
                    value={incidentForm.improvements}
                    onChange={(e) => setIncidentForm((f) => ({ ...f, improvements: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    rows={3}
                    value={incidentForm.notes}
                    onChange={(e) => setIncidentForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                <Button
                  className="bg-[#1a4d4d] hover:bg-[#0d3333]"
                  disabled={!institutionId || createIncidentMutation.isPending}
                  onClick={() => {
                    if (!institutionId) return;
                    const staffInvolved = incidentForm.staffIdsCsv
                      .split(",")
                      .map((s) => parseInt(s.trim(), 10))
                      .filter((n) => !Number.isNaN(n));
                    const protocolsUsed = incidentForm.protocolsCsv
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    const systemGapsIdentified = incidentForm.gapsCsv
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    createIncidentMutation.mutate({
                      institutionId,
                      incidentDate: new Date(incidentForm.incidentDate),
                      incidentType: incidentForm.incidentType,
                      patientAge: incidentForm.patientAge ? parseInt(incidentForm.patientAge, 10) : undefined,
                      responseTime: incidentForm.responseTime ? parseInt(incidentForm.responseTime, 10) : undefined,
                      outcome: incidentForm.outcome,
                      neurologicalStatus: incidentForm.neurologicalStatus || undefined,
                      staffInvolved: staffInvolved.length ? staffInvolved : undefined,
                      protocolsUsed: protocolsUsed.length ? protocolsUsed : undefined,
                      systemGapsIdentified: systemGapsIdentified.length ? systemGapsIdentified : undefined,
                      improvementsImplemented: incidentForm.improvements.trim() || undefined,
                      notes: incidentForm.notes.trim() || undefined,
                    });
                  }}
                >
                  {createIncidentMutation.isPending ? "Saving…" : "Save incident"}
                </Button>
                {createIncidentMutation.isSuccess && (
                  <p className="text-sm text-green-700">Incident saved. Analytics rollup updated.</p>
                )}
                {createIncidentMutation.isError && (
                  <p className="text-sm text-red-600">{createIncidentMutation.error.message}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
                <div>
                  <CardTitle>Recent incidents</CardTitle>
                  <CardDescription>Newest first</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-2"
                  disabled={!incidentsList?.length}
                  onClick={() => {
                    if (!incidentsList?.length) return;
                    const csv = buildIncidentsGovernanceCsv(incidentsList ?? []);
                    const slug = new Date().toISOString().slice(0, 10);
                    downloadCsv(`incidents-governance-${slug}.csv`, csv);
                    toast.success("Downloaded CSV (notes excluded for governance)");
                  }}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {incidentsLoading ? (
                  <p className="text-sm text-slate-500">Loading…</p>
                ) : !incidentsList?.length ? (
                  <p className="text-sm text-slate-600">No incidents recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-slate-600">
                          <th className="py-2 pr-4">Date</th>
                          <th className="py-2 pr-4">Type</th>
                          <th className="py-2 pr-4">Outcome</th>
                          <th className="py-2 pr-4">Response (s)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidentsList.map((row) => (
                          <tr key={row.id} className="border-b border-slate-100">
                            <td className="py-2 pr-4 whitespace-nowrap">
                              {row.incidentDate ? new Date(row.incidentDate).toLocaleString() : "—"}
                            </td>
                            <td className="py-2 pr-4 capitalize">{row.incidentType?.replace(/_/g, " ")}</td>
                            <td className="py-2 pr-4">{row.outcome}</td>
                            <td className="py-2 pr-4">{row.responseTime ?? "—"}</td>
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
