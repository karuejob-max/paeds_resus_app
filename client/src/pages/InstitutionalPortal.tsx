import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, BarChart3, Users, FileText, Calendar, CheckCircle, TrendingUp } from "lucide-react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import StaffBulkImport from "@/components/StaffBulkImport";

const WELCOME_KEY = "institutionalPortalWelcome";

export default function InstitutionalPortal() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showWelcome, setShowWelcome] = useState(false);

  const { data: myInstitution, isLoading: myInstitutionLoading } = trpc.institution.getMyInstitution.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const institutionId = myInstitution?.institution?.id ?? null;

  const { data: stats } = trpc.institution.getStats.useQuery(
    { institutionId: institutionId! },
    { enabled: !!institutionId }
  );

  const { data: staffList, isLoading: staffLoading } = trpc.institution.getStaffMembers.useQuery(
    { institutionId: institutionId! },
    { enabled: !!institutionId }
  );

  useEffect(() => {
    if (sessionStorage.getItem(WELCOME_KEY) === "1") {
      sessionStorage.removeItem(WELCOME_KEY);
      setShowWelcome(true);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">Sign in to access the Institutional Portal</p>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>No institution on your account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Sign in with the account you used for onboarding, or complete institutional onboarding to link a facility.
              </p>
              <Button onClick={() => navigate("/institution-onboarding")} className="w-full bg-[#1a4d4d] hover:bg-[#0d3333]">
                Institutional onboarding
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate("/institutional")}>
                Contact / pricing
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalStaff = stats?.totalStaff ?? 0;
  const enrolledStaff = stats?.enrolledStaff ?? 0;
  const certifiedStaff = stats?.certifiedStaff ?? 0;
  const completionPct = stats?.completionRate ?? 0;
  const certificationPct = stats?.certificationRate ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Institutional Portal</h1>
          <p className="text-lg text-slate-600">Manage your facility's training program and track impact</p>
        </div>

        {/* First-time welcome (after onboarding) */}
        {showWelcome && (
          <Alert className="mb-6 border-green-600/50 bg-green-50 text-green-900">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>Welcome! Your institution is set up. You can now manage staff enrollments, view certifications, and track impact from this portal.</span>
              <Button variant="ghost" size="sm" onClick={() => setShowWelcome(false)} className="text-green-700 shrink-0">
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {totalStaff === 0 && (
          <Card className="mb-8 border-[#1a4d4d]/30 bg-[#1a4d4d]/5">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-8 h-8 text-[#1a4d4d]" />
                  <div>
                    <p className="font-semibold text-slate-900">Add your team</p>
                    <p className="text-sm text-slate-600">
                      Import staff or add them manually so you can track enrollments and certifications.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" onClick={() => navigate("/hospital-admin-dashboard")}>
                    Hospital admin dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards — wired to institution.getStats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Staff in roster</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{totalStaff}</p>
              <p className="text-xs text-slate-500 mt-1">{enrolledStaff} actively enrolled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Certified</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{certifiedStaff}</p>
              <p className="text-xs text-slate-500 mt-1">Certification rate: {certificationPct}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Course completion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{completionPct}%</p>
              <p className="text-xs text-slate-500 mt-1">Of roster with completed training</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Incidents / impact</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">—</p>
              <p className="text-xs text-slate-500 mt-1">Incident tracking coming soon</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="quotation">Quotation</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Program Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-slate-600">Enrollment Status</span>
                    <span className="font-semibold">
                      {enrolledStaff} / {totalStaff} staff
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-slate-600">Course Completion</span>
                    <span className="font-semibold">{completionPct}%</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-slate-600">Certification Rate</span>
                    <span className="font-semibold">{certificationPct}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Average Response Time</span>
                    <span className="font-semibold">-- seconds</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Impact Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-slate-600">Incidents Handled</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-slate-600">Lives Improved (Est.)</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">System Gaps Resolved</span>
                    <span className="font-semibold">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Staff Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-8">
                  <Button className="w-full bg-blue-900 hover:bg-blue-800" onClick={() => navigate("/hospital-admin-dashboard")}>
                    Open full staff tools
                  </Button>
                </div>
                <StaffBulkImport institutionId={institutionId} />
                {staffLoading ? (
                  <p className="text-center text-slate-600 py-8">Loading staff…</p>
                ) : staffList && staffList.length > 0 ? (
                  <div className="mt-8 overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50">
                          <th className="text-left py-3 px-4 font-semibold">Name</th>
                          <th className="text-left py-3 px-4 font-semibold">Role</th>
                          <th className="text-left py-3 px-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffList.map((staff) => (
                          <tr key={staff.id} className="border-b">
                            <td className="py-3 px-4">{staff.staffName}</td>
                            <td className="py-3 px-4 capitalize">{staff.staffRole.replace(/_/g, " ")}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{staff.enrollmentStatus}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-6 text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No staff members yet</p>
                    <p className="text-sm text-slate-400">Use CSV import above or the hospital admin dashboard</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quotation Tab */}
          <TabsContent value="quotation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Quotation Generator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Number of Staff
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 50"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Select Courses
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3" />
                        <span>BLS (10,000 KES per staff)</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3" />
                        <span>ACLS (20,000 KES per staff)</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3" />
                        <span>PALS (20,000 KES per staff)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Payment Terms
                    </label>
                    <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>One-time payment</option>
                      <option>3 monthly installments</option>
                      <option>6 monthly installments</option>
                      <option>12 monthly installments</option>
                    </select>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-600">Subtotal:</span>
                      <span className="font-semibold">0 KES</span>
                    </div>
                    <div className="flex justify-between mb-4 pb-4 border-b">
                      <span className="text-slate-600">Discount:</span>
                      <span className="font-semibold text-green-600">0 KES</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-blue-600">0 KES</span>
                    </div>
                  </div>

                  <Button className="w-full bg-blue-900 hover:bg-blue-800">
                    Generate & Download Quotation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Training Schedules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full bg-blue-900 hover:bg-blue-800">
                    + Schedule Training Session
                  </Button>
                </div>
                <div className="mt-6 text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No training sessions scheduled</p>
                  <p className="text-sm text-slate-400">Create your first training session</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Incidents Tab */}
          <TabsContent value="incidents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Incident Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full bg-blue-900 hover:bg-blue-800">
                    + Log Incident
                  </Button>
                </div>
                <div className="mt-6 text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No incidents logged yet</p>
                  <p className="text-sm text-slate-400">Log real-world emergency events to track impact</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
