import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Award, BookOpen, Download, FileText, Loader2, Users } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

function daysUntilExpiry(expiryDate: string | Date | null | undefined): number | null {
  if (!expiryDate) return null;
  const d = new Date(expiryDate);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

export default function LearnerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { role: selectedRole } = useUserRole();
  const [, navigate] = useLocation();
  const { data: certData } = trpc.certificates.getMyCertificates.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: parentStats, isLoading: parentStatsLoading } = trpc.parentSafeTruth.getSafeTruthStats.useQuery(
    undefined,
    { enabled: isAuthenticated && selectedRole === "parent" }
  );
  const downloadCert = trpc.certificates.download.useMutation();
  const myCertificates = certData?.success ? certData.certificates ?? [] : [];

  const { data: myInstitution } = trpc.institution.getMyInstitution.useQuery(undefined, {
    enabled: isAuthenticated && selectedRole === "institution",
  });
  const institutionId = myInstitution?.institution?.id;
  const { data: instStats, isLoading: instStatsLoading } = trpc.institution.getStats.useQuery(
    { institutionId: institutionId! },
    { enabled: !!institutionId && selectedRole === "institution" }
  );

  const renewalAttention = myCertificates.filter((c) => {
    const d = daysUntilExpiry(c.expiryDate);
    return d !== null && d <= 90;
  });

  const handleDownloadCertificate = (certificateNumber: string) => {
    downloadCert.mutate(
      { certificateNumber },
      {
        onSuccess: (result) => {
          if (!result.success || !("pdfBase64" in result) || !result.pdfBase64) return;
          const bin = atob(result.pdfBase64);
          const arr = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          const blob = new Blob([arr], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = result.filename ?? "certificate.pdf";
          a.click();
          URL.revokeObjectURL(url);
        },
      }
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">Sign in to access your dashboard</p>
            <a href={getLoginUrl()}>
              <Button className="w-full bg-blue-900 hover:bg-blue-800">Sign In</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Welcome, {user?.name}!</h1>
        <p className="text-lg text-slate-600 mb-8">
          {selectedRole === "parent"
            ? "Share your healthcare journey and help improve pediatric care"
            : selectedRole === "provider"
            ? "Log clinical events and contribute to system improvements"
            : "Manage your institution's training programs"}
        </p>

        {!selectedRole ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Select Your Role</h2>
                <p className="text-slate-600 mb-6">Choose how you'll use the platform</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button onClick={() => navigate("/")}>Go Back</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : selectedRole === "parent" ? (
          <div className="space-y-6">
            {parentStatsLoading ? (
              <Card>
                <CardContent className="pt-6 flex items-center gap-2 text-slate-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading your Safe-Truth activity…
                </CardContent>
              </Card>
            ) : parentStats ? (
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Submissions this month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-slate-900">{parentStats.submissionsThisMonth}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Total stories shared</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-slate-900">{parentStats.totalSubmissions}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Last submission</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-semibold text-slate-900">
                      {parentStats.lastSubmission
                        ? new Date(parentStats.lastSubmission).toLocaleDateString()
                        : "—"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : null}
            <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Your Stories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">Share your healthcare journey to help improve pediatric care</p>
                <Button className="w-full" onClick={() => navigate("/parent-safe-truth")}>
                  Share Your Story
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Community Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">Your feedback helps improve care for families</p>
                <Button variant="outline" className="w-full" onClick={() => navigate("/personal-impact")}>View Impact</Button>
              </CardContent>
            </Card>
            </div>
          </div>
        ) : selectedRole === "provider" ? (
          <div className="grid md:grid-cols-3 gap-6">
            {renewalAttention.length > 0 && (
              <Alert className="md:col-span-3 border-amber-200 bg-amber-50/80">
                <AlertCircle className="h-4 w-4 text-amber-700" />
                <AlertTitle className="text-amber-900">Certificate renewal</AlertTitle>
                <AlertDescription className="text-amber-900/90">
                  {renewalAttention.length} certificate(s) expire within 90 days or are expired. Recertify to stay
                  compliant.
                  <Button className="mt-3 bg-amber-700 hover:bg-amber-800" size="sm" onClick={() => navigate("/enroll")}>
                    Renew / recertify
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Events Logged
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">Log clinical events to contribute to system improvements</p>
                <Button className="w-full" onClick={() => navigate("/safe-truth")}>
                  Log Event
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Certification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">BLS Certification</p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/payment")}
                >
                  Enroll Now
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  System Gaps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">View gaps identified from logged events and contribute to resolutions</p>
                <Button variant="outline" className="w-full" onClick={() => navigate("/performance")}>View performance</Button>
              </CardContent>
            </Card>

            {/* My Certificates */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  My Certificates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myCertificates.length === 0 ? (
                  <>
                    <p className="text-slate-600 mb-4">You don't have any certificates yet. Complete a course and payment to receive your certificate.</p>
                    <Button variant="outline" onClick={() => navigate("/payment")}>
                      Enroll in a course
                    </Button>
                  </>
                ) : (
                  <ul className="space-y-3">
                    {myCertificates.map((c) => {
                      const days = daysUntilExpiry(c.expiryDate);
                      const renewSoon = days !== null && days <= 90;
                      return (
                        <li key={c.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-3">
                          <div>
                            <p className="font-medium uppercase text-slate-900">{c.programType}</p>
                            <p className="text-sm text-slate-500">
                              Issued {c.issueDate ? new Date(c.issueDate).toLocaleDateString() : "—"}
                              {c.expiryDate ? ` · Expires ${new Date(c.expiryDate).toLocaleDateString()}` : ""}
                            </p>
                            {renewSoon && (
                              <p className={`text-xs font-medium mt-1 ${days! < 0 ? "text-red-600" : "text-amber-700"}`}>
                                {days! < 0 ? "Expired — renew to stay current" : `Renews in ${days} days`}
                              </p>
                            )}
                            {c.certificateNumber && (
                              <p className="text-xs text-slate-400 mt-1">No. {c.certificateNumber}</p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {renewSoon && (
                              <Button size="sm" variant="secondary" onClick={() => navigate("/enroll")}>
                                Renew
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={downloadCert.isPending}
                              onClick={() => c.certificateNumber && handleDownloadCertificate(c.certificateNumber)}
                            >
                              {downloadCert.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </>
                              )}
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {!institutionId && !instStatsLoading && (
              <Alert>
                <AlertTitle>No institution linked</AlertTitle>
                <AlertDescription className="flex flex-wrap gap-2 items-center">
                  Register or onboard your hospital to see live training metrics.
                  <Button size="sm" variant="outline" onClick={() => navigate("/institutional-onboarding")}>
                    Institutional onboarding
                  </Button>
                  <Button size="sm" onClick={() => navigate("/hospital-admin-dashboard")}>
                    Hospital portal
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {instStatsLoading && institutionId ? (
              <Card>
                <CardContent className="pt-6 flex items-center gap-2 text-slate-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading institution metrics…
                </CardContent>
              </Card>
            ) : null}
            {instStats && (
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Staff roster
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-600 mb-2">{instStats.totalStaff}</p>
                    <p className="text-slate-600">Total staff on roster</p>
                    <p className="text-sm text-slate-500 mt-2">{instStats.enrolledStaff} enrolled in training</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Completion rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600 mb-2">{instStats.completionRate}%</p>
                    <p className="text-slate-600">Staff who completed training</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Certifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-purple-600 mb-2">{instStats.certifiedStaff}</p>
                    <p className="text-slate-600">Certified ({instStats.certificationRate}% of roster)</p>
                  </CardContent>
                </Card>
              </div>
            )}
            {institutionId ? (
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate("/hospital-admin-dashboard")}>Open full hospital dashboard</Button>
                <Button variant="outline" onClick={() => navigate("/advanced-analytics")}>
                  Analytics
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
