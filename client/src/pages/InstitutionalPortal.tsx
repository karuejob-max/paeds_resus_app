import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, BarChart3, Users, FileText, Calendar, CheckCircle, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import StaffBulkImport from "@/components/StaffBulkImport";

const WELCOME_KEY = "institutionalPortalWelcome";

export default function InstitutionalPortal() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [bulkCourseType, setBulkCourseType] = useState<"bls" | "acls" | "pals">("bls");
  const [bulkTrainingDate, setBulkTrainingDate] = useState("");
  const [bulkPhone, setBulkPhone] = useState("");
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
              <Button onClick={() => navigate("/institutional-onboarding")} className="w-full bg-[#1a4d4d] hover:bg-[#0d3333]">
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
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="care-signal-gaps">Care Signal Gaps</TabsTrigger>
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
            <CohortProgressWidget institutionId={institutionId} />
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="care-signal-gaps" className="space-y-6">
            {institutionId ? <FacilityGapAnalysisPanel institutionId={institutionId} /> : null}
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <PendingLinkRequestsWidget institutionId={institutionId} />
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

          {/* Bulk Enrollment & Payment Tab */}
          <TabsContent value="quotation" className="space-y-6">
            {institutionId && (
              <BulkEnrollmentPanel
                institutionId={institutionId}
                courseType={bulkCourseType}
                setCourseType={setBulkCourseType}
                trainingDate={bulkTrainingDate}
                setTrainingDate={setBulkTrainingDate}
                phone={bulkPhone}
                setPhone={setBulkPhone}
              />
            )}
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

// ─────────────────────────────────────────────────────────────────────────
// FacilityGapAnalysisPanel
// Gap-analysis #5: facility-level rollup of Care Signal gaps, the
// institutional counterpart to an individual provider's own gap analysis.
// ─────────────────────────────────────────────────────────────────────────
const GAP_PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-100 text-red-900 border-red-200",
  medium: "bg-amber-100 text-amber-900 border-amber-200",
  low: "bg-blue-100 text-blue-900 border-blue-200",
};

function FacilityGapAnalysisPanel({ institutionId }: { institutionId: number }) {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "quarter" | "year">("month");
  const q = trpc.institution.getFacilityGapAnalysis.useQuery({ institutionId, timeframe });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Care Signal Gaps — your facility
          </h3>
          <p className="text-sm text-slate-500">
            Aggregated across every provider reporting at your registered facility, not just one individual.
          </p>
        </div>
        <div className="flex gap-1">
          {(["week", "month", "quarter", "year"] as const).map((tf) => (
            <Button
              key={tf}
              size="sm"
              variant={timeframe === tf ? "default" : "outline"}
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      {q.isLoading ? (
        <div className="py-12 text-center text-slate-400">Loading…</div>
      ) : q.data?.suppressed ? (
        <Card>
          <CardContent className="py-10 text-center space-y-2">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-600">
              {q.data.totalEvents} event{q.data.totalEvents === 1 ? "" : "s"} reported this {timeframe}.
            </p>
            <p className="text-sm text-slate-400 max-w-md mx-auto">{q.data.suppressionReason}</p>
          </CardContent>
        </Card>
      ) : !q.data || q.data.totalEvents === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No Care Signal events reported at your facility yet this {timeframe}.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card><CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{q.data.totalEvents}</p>
              <p className="text-xs text-slate-500">Total events</p>
            </CardContent></Card>
            <Card><CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{q.data.uniqueReporters}</p>
              <p className="text-xs text-slate-500">Reporting providers</p>
            </CardContent></Card>
            {q.data.byFacility.length > 1 && (
              <Card><CardContent className="py-4 text-center">
                <p className="text-2xl font-bold">{q.data.byFacility.length}</p>
                <p className="text-xs text-slate-500">Facilities reporting</p>
              </CardContent></Card>
            )}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Gap categories</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {q.data.gaps.map((g) => (
                <div key={g.category} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                  <span>{g.category}</span>
                  <span className="text-slate-500">{g.count} ({g.percentage}%)</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {q.data.byFacility.length > 1 && (
            <Card>
              <CardHeader><CardTitle className="text-base">By facility</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {q.data.byFacility.map((f) => (
                  <div key={f.facilityId} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                    <span>{f.facilityName}</span>
                    <span className="text-slate-500">{f.eventCount} events</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {q.data.recommendations.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Recommended actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {q.data.recommendations.map((r, i) => (
                  <div key={i} className={`rounded-lg border p-3 text-sm ${GAP_PRIORITY_BADGE[r.priority]}`}>
                    <p className="font-medium text-xs mb-1">{r.gap}</p>
                    <p className="text-xs leading-relaxed">{r.recommendation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BulkEnrollmentPanel
// Live quote + M-Pesa STK push for institutional bulk enrollment.
// ─────────────────────────────────────────────────────────────────────────
function BulkEnrollmentPanel({
  institutionId,
  courseType,
  setCourseType,
  trainingDate,
  setTrainingDate,
  phone,
  setPhone,
}: {
  institutionId: number;
  courseType: "bls" | "acls" | "pals";
  setCourseType: (v: "bls" | "acls" | "pals") => void;
  trainingDate: string;
  setTrainingDate: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
}) {
  const quoteQuery = trpc.institution.getBulkEnrollmentQuote.useQuery(
    { institutionId, courseType },
    { enabled: !!institutionId }
  );

  const payMutation = trpc.institution.initiateBulkEnrollmentPayment.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const q = quoteQuery.data;
  const staffCount = q?.staffCount ?? 0;
  const subtotal = q ? q.basePrice * staffCount : 0;
  const discount = q?.totalDiscount ?? 0;
  const total = q?.totalPrice ?? 0;
  const discountPct = q?.discountPercentage ?? 0;

  function formatKes(n: number) {
    return n.toLocaleString("en-KE") + " KES";
  }

  const canPay = staffCount > 0 && trainingDate && phone.length >= 9;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Bulk Enrollment & Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Course selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Course</label>
            <div className="flex flex-wrap gap-2">
              {(["bls", "acls", "pals"] as const).map((ct) => (
                <button
                  key={ct}
                  onClick={() => setCourseType(ct)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    courseType === ct
                      ? "bg-blue-900 text-white border-blue-900"
                      : "border-slate-300 text-slate-700 hover:border-blue-400"
                  }`}
                >
                  {ct.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Training date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Training date</label>
            <input
              type="date"
              value={trainingDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setTrainingDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* M-Pesa phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">M-Pesa phone number</label>
            <input
              type="tel"
              placeholder="e.g. 0712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">A single STK push will be sent to this number for the total amount.</p>
          </div>

          {/* Live quote */}
          <div className="bg-slate-50 p-4 rounded-lg space-y-2">
            {quoteQuery.isLoading ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculating quote…
              </div>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Staff enrolled:</span>
                  <span className="font-semibold">{staffCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Base price per staff:</span>
                  <span className="font-semibold">{formatKes(q?.basePrice ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-semibold">{formatKes(subtotal)}</span>
                </div>
                {discountPct > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Bulk discount ({discountPct}%):</span>
                    <span className="font-semibold text-green-600">− {formatKes(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg border-t pt-2 mt-2">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-blue-700">{formatKes(total)}</span>
                </div>
                {staffCount === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Add staff to your roster first (Staff tab) before initiating payment.</p>
                )}
              </>
            )}
          </div>

          {/* Pay button */}
          <Button
            className="w-full bg-blue-900 hover:bg-blue-800"
            disabled={!canPay || payMutation.isPending}
            onClick={() => {
              if (!trainingDate) return;
              payMutation.mutate({
                institutionId,
                courseType,
                trainingDate: new Date(trainingDate),
                phoneNumber: phone,
              });
            }}
          >
            {payMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Initiating payment…
              </>
            ) : (
              `Pay ${formatKes(total)} via M-Pesa`
            )}
          </Button>

          <p className="text-xs text-slate-500 text-center">
            Payment is processed via M-Pesa STK push. All staff enrollments are created immediately and certificates are released automatically once payment is confirmed and practical skills are signed off.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CohortProgressWidget({ institutionId }: { institutionId: number }) {
  const { data: cohortStats, isLoading } = trpc.institution.getCohortProgress.useQuery({ institutionId });

  if (isLoading) return <p className="text-sm text-slate-500 py-4 text-center">Loading cohort metrics...</p>;
  if (!cohortStats || cohortStats.length === 0) return null;

  const displayNameMap: Record<string, string> = {
    bsn_intern: "BSN Intern",
    coi_bsc: "Clinical Officer Intern (BSc)",
    coi_diploma: "Diploma COI",
    moi: "MOI (Medical Officer Intern)",
    permanent_nurse: "Permanent Nurse",
    permanent_doctor: "Permanent Doctor",
    other: "Other"
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-900" />
          Intern Cohort Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left py-2 px-3 font-semibold">Cohort</th>
                <th className="text-center py-2 px-3 font-semibold">Total</th>
                <th className="text-center py-2 px-3 font-semibold">BLS Complete</th>
                <th className="text-center py-2 px-3 font-semibold">ACLS Complete</th>
                <th className="text-center py-2 px-3 font-semibold">Phase 2 Complete</th>
              </tr>
            </thead>
            <tbody>
              {cohortStats.map((row) => (
                <tr key={row.designation} className="border-b">
                  <td className="py-2 px-3 font-medium text-slate-800">{displayNameMap[row.designation] || row.designation}</td>
                  <td className="text-center py-2 px-3">{row.totalCount}</td>
                  <td className="text-center py-2 px-3 text-green-700 font-semibold">{row.blsCompleteCount}</td>
                  <td className="text-center py-2 px-3 text-blue-700 font-semibold">{row.aclsCompleteCount}</td>
                  <td className="text-center py-2 px-3 text-orange-700 font-semibold">{row.phase2CompleteCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function PendingLinkRequestsWidget({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const { data: pendingRequests, isLoading } = trpc.institution.getPendingLinkRequests.useQuery({ institutionId });
  const approveMutation = trpc.institution.approveStaffFacilityLink.useMutation({
    onSuccess: (data) => {
      toast.success(`Request ${data.status} successfully`);
      void utils.institution.getPendingLinkRequests.invalidate({ institutionId });
      void utils.institution.getStaffMembers.invalidate({ institutionId });
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  if (isLoading) return <p className="text-sm text-slate-500 py-4 text-center">Loading pending link requests...</p>;
  if (!pendingRequests || pendingRequests.length === 0) return null;

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50/30">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          Pending Link Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-amber-800">
          The following providers self-registered and picked your facility. Approve them to include their metrics in your analytics and add them to the roster.
        </p>
        <div className="overflow-x-auto border border-amber-100 rounded-lg bg-white">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b bg-amber-50/50">
                <th className="py-2 px-3 font-semibold text-amber-900">Name</th>
                <th className="py-2 px-3 font-semibold text-amber-900">Email</th>
                <th className="py-2 px-3 font-semibold text-amber-900">Role</th>
                <th className="py-2 px-3 font-semibold text-amber-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((req) => (
                <tr key={req.id} className="border-b border-amber-100">
                  <td className="py-2 px-3 font-medium">{req.staffName}</td>
                  <td className="py-2 px-3 text-slate-600">{req.staffEmail}</td>
                  <td className="py-2 px-3 capitalize">{req.staffRole}</td>
                  <td className="py-2 px-3 text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-600 text-green-700 hover:bg-green-50"
                      onClick={() => approveMutation.mutate({ institutionId, staffMemberId: req.id, approve: true })}
                      disabled={approveMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => approveMutation.mutate({ institutionId, staffMemberId: req.id, approve: false })}
                      disabled={approveMutation.isPending}
                    >
                      Reject
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
