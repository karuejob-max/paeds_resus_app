/**
 * Paeds Resus Fellowship Dashboard
 * 
 * Single fellowship path with 3-pillar qualification system:
 * 1. Courses: All fellowship pillar micro-courses (displayed with progress)
 * 2. ResusGPS: ≥3 cases per taught condition
 * 3. Care Signal: 24 consecutive months of monthly reporting
 * 
 * All courses are integrated into one fellowship path.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  Clock,
  Award,
  Heart,
  Zap,
  Lock,
  Download,
  Loader2,
} from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EnrollmentModal } from "@/components/EnrollmentModal";
import { microCourseTrackLabel, type MicroCourseTier } from "@shared/micro-course-display";
import { CertificateDownloadFeedbackDialog } from "@/components/CertificateDownloadFeedbackDialog";
import { getProviderCourseDestination } from "@/lib/providerCourseRoutes";
import {
  canDisplayFellowTitle,
} from "@shared/fellowship-launch-gate";

export default function FellowshipDashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const utils = trpc.useUtils();
  const initialTab = new URLSearchParams(search).get("tab");
  const [activeTab, setActiveTab] = useState(
    initialTab === "certificates" ? "certificates" : "overview"
  );
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [downloadingCertificateId, setDownloadingCertificateId] = useState<number | null>(null);
  const [feedbackDialog, setFeedbackDialog] = useState<{
    certificateId: number;
    certificateNumber: string;
    courseLabel: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [loading, user, setLocation]);

  useEffect(() => {
    const tab = new URLSearchParams(search).get("tab");
    if (tab === "certificates") setActiveTab("certificates");
  }, [search]);

  // Fetch fellowship progress
  const { data: progress, isLoading, error } = trpc.fellowship.getProgress.useQuery(undefined, {
    enabled: Boolean(user),
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const { data: resusCaseLog } = trpc.fellowship.getResusGPSCaseLog.useQuery(
    { limit: 30 },
    {
      enabled: Boolean(user) && (activeTab === "resusgps" || activeTab === "overview"),
      refetchOnWindowFocus: true,
      staleTime: 30_000,
    }
  );

  const { data: careSignalHistory } = trpc.careSignalEvents.getEventHistory.useQuery(
    { limit: 24, offset: 0 },
    {
      enabled: Boolean(user) && (activeTab === "caresignal" || activeTab === "overview"),
      refetchOnWindowFocus: true,
      staleTime: 30_000,
    }
  );

  // Fetch all courses for Pillar 1 display
  const { data: allCourses = [] } = trpc.courses.listAll.useQuery(undefined, {
    enabled: Boolean(user) && activeTab === "courses",
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  // Fetch user enrollments (always — powers course tab badges + completion state)
  const { data: enrollments = [] } = trpc.courses.getEnrollments.useQuery(undefined, {
    enabled: Boolean(user),
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });

  const { data: certData } = trpc.certificates.getMyCertificates.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const fellowshipCertificates = (certData?.success ? certData.certificates ?? [] : []).filter(
    (c) => c.programType === "fellowship"
  );

  const downloadCert = trpc.certificates.download.useMutation();
  const ensureCert = trpc.certificates.ensureMicroCourseCertificate.useMutation({
    onSuccess: async (res) => {
      if (res.success) {
        toast.success(
          res.certificateNumber
            ? `Certificate ready (#${res.certificateNumber})`
            : "Certificate issued"
        );
        await utils.certificates.getMyCertificates.invalidate();
      } else {
        toast.error(res.error ?? "Could not issue certificate");
      }
    },
    onError: (e) => toast.error(e.message || "Could not issue certificate"),
  });

  const triggerBrowserDownload = (pdfBase64: string, filename: string) => {
    try {
      const byteCharacters = atob(pdfBase64);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success("Certificate downloaded");
    } catch {
      toast.error("Failed to save the PDF. Try another browser.");
    }
  };

  const runCertificateDownload = (certNumber: string, certId: number) => {
    downloadCert.mutate(
      { certificateNumber: certNumber },
      {
        onSuccess: (res) => {
          setDownloadingCertificateId(null);
          if (res.success && res.pdfBase64) {
            triggerBrowserDownload(res.pdfBase64, res.filename || `certificate-${certNumber}.pdf`);
          } else if (res.error === "feedback_required" && "certificateId" in res && res.certificateId) {
            const cert = fellowshipCertificates.find((c) => c.certificateNumber === certNumber);
            setFeedbackDialog({
              certificateId: res.certificateId,
              certificateNumber: certNumber,
              courseLabel: cert?.courseTitle?.trim() || "Fellowship micro-course",
            });
          } else {
            toast.error(typeof res.error === "string" ? res.error : "Download failed");
          }
        },
        onError: (e) => {
          setDownloadingCertificateId(null);
          toast.error(e.message || "Download failed");
        },
      }
    );
  };

  const handleDownloadCertificate = (certId: number, certNumber: string | null | undefined) => {
    if (!certNumber) {
      toast.error("Certificate not issued yet. Use “Get certificate” if you finished the course.");
      return;
    }
    setDownloadingCertificateId(certId);
    runCertificateDownload(certNumber, certId);
  };

  const handleEnrollClick = (course: any) => {
    setSelectedCourse(course);
    setIsEnrollmentModalOpen(true);
  };

  const handleEnrollmentSuccess = () => {
    void utils.courses.getEnrollments.invalidate();
    void utils.courses.getUserEnrollments.invalidate();
    void utils.fellowship.getProgress.invalidate();
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading fellowship dashboard…</p>
      </div>
    );
  }
  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load fellowship dashboard. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Paeds Resus Fellowship
            </CardTitle>
            <CardDescription>
              Begin your fellowship journey by completing the first course.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setActiveTab("courses")} className="w-full">
              Open Fellowship courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { coursesPillar, resusGPSPillar, careSignalPillar, isQualified, overallPercentage } = progress;
  const showFellowCredential = canDisplayFellowTitle(isQualified);

  // Prepare course data
  const enrolledCourseIds = new Set(enrollments?.map((e: any) => e.course?.courseId) || []);
  const enrollmentIdByCourseId = new Map<string, number>(
    (enrollments ?? [])
      .filter((e: any) => typeof e?.course?.courseId === "string" && typeof e?.id === "number")
      .map((e: any) => [e.course.courseId as string, e.id as number])
  );
  const completedCourseIds = new Set(enrollments?.filter((e: any) => e.enrollmentStatus === "completed").map((e: any) => e.course?.courseId) || []);

  // Sort courses by order
  const sortedCourses = [...(allCourses || [])].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Award className="h-8 w-8" />
            Paeds Resus Fellowship
          </h1>
          <p className="text-muted-foreground">
            One fellowship path with 3 pillars: courses, ResusGPS, and Care Signal.
          </p>
        </div>

        {/* Overall Progress */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Fellowship progress</CardTitle>
                <CardDescription>{overallPercentage}% complete. All 3 pillars must reach 100%.</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{overallPercentage}%</div>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={overallPercentage} className="h-3" />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Micro-courses ({coursesPillar.completed}/{coursesPillar.required})</TabsTrigger>
            <TabsTrigger value="certificates">
              Certificates{fellowshipCertificates.length > 0 ? ` (${fellowshipCertificates.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="resusgps">ResusGPS</TabsTrigger>
            <TabsTrigger value="caresignal">Care Signal</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pillar 1: Courses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Pillar 1: Micro-courses
                  </CardTitle>
                  <CardDescription>Micro-courses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <Badge
                        variant={coursesPillar.percentage === 100 ? "default" : "secondary"}
                      >
                        {coursesPillar.percentage}%
                      </Badge>
                    </div>
                    <Progress value={coursesPillar.percentage} className="h-3" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-bold text-lg">{coursesPillar.completed}</span>
                      <span className="text-muted-foreground"> of {coursesPillar.required} courses</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {coursesPillar.required - coursesPillar.completed} remaining
                    </p>
                  </div>
                  <Button
                    onClick={() => setActiveTab("courses")}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Open courses
                  </Button>
                </CardContent>
              </Card>

              {/* Pillar 2: ResusGPS */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Stethoscope className="h-5 w-5 text-green-600" />
                    Pillar 2: ResusGPS cases
                  </CardTitle>
                  <CardDescription>≥3 ResusGPS cases per fellowship micro-course condition</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <Badge
                        variant={resusGPSPillar.percentage === 100 ? "default" : "secondary"}
                      >
                        {resusGPSPillar.percentage}%
                      </Badge>
                    </div>
                    <Progress value={resusGPSPillar.percentage} className="h-3" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-bold text-lg">{resusGPSPillar.conditionsWithThreshold}</span>
                      <span className="text-muted-foreground"> of {resusGPSPillar.totalConditionsTaught} conditions</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {resusGPSPillar.casesCompleted} case{resusGPSPillar.casesCompleted === 1 ? "" : "s"} logged
                      {(resusGPSPillar.casesStillNeeded ?? 0) > 0
                        ? ` · ${resusGPSPillar.casesStillNeeded} more case${resusGPSPillar.casesStillNeeded === 1 ? "" : "s"} needed`
                        : ""}
                    </p>
                    {(resusGPSPillar.incompleteConditions ?? 0) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {resusGPSPillar.incompleteConditions} condition
                        {resusGPSPillar.incompleteConditions === 1 ? "" : "s"} still below 3 cases
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => setActiveTab("resusgps")}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    View case tracker
                  </Button>
                </CardContent>
              </Card>

              {/* Pillar 3: Care Signal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Heart className="h-5 w-5 text-red-600" />
                    Pillar 3: Care Signal reports
                  </CardTitle>
                  <CardDescription>Monthly reporting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <Badge
                        variant={careSignalPillar.percentage === 100 ? "default" : "secondary"}
                      >
                        {careSignalPillar.percentage}%
                      </Badge>
                    </div>
                    <Progress value={careSignalPillar.percentage} className="h-3" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-bold text-lg">{careSignalPillar.streak}</span>
                      <span className="text-muted-foreground"> of 24 months</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {careSignalPillar.eventsSubmitted} report{careSignalPillar.eventsSubmitted === 1 ? "" : "s"} submitted
                      {(careSignalPillar.reportsThisMonth ?? 0) > 0
                        ? ` · ${careSignalPillar.reportsThisMonth} this month`
                        : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(careSignalPillar.monthsRemaining ?? Math.max(0, 24 - careSignalPillar.streak))} month
                      {(careSignalPillar.monthsRemaining ?? Math.max(0, 24 - careSignalPillar.streak)) === 1
                        ? ""
                        : "s"}{" "}
                      remaining on streak
                    </p>
                  </div>
                  <Button
                    onClick={() => setActiveTab("caresignal")}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    View report tracker
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Courses Tab - All 26 Courses */}
          <TabsContent value="courses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fellowship micro-courses</CardTitle>
                <CardDescription>
                  Complete all {coursesPillar.required} toward fellowship certification. Each completed course extends ResusGPS access by 30 days
                  (stackable). Pay per course (KES 200 each) via M-Pesa or approved paths.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedCourses.map((course: any) => {
                    const courseId = course.courseId || course.id;
                    const isEnrolled = enrolledCourseIds.has(courseId);
                    const isCompleted = completedCourseIds.has(courseId);
                    const isPublished = course.isPublished;
                    
                    return (
                      <div
                        key={courseId}
                        className={`p-4 rounded-lg border transition-colors ${
                          isCompleted
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                            : isEnrolled
                            ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                            : "bg-muted border-border hover:border-primary/50"
                        } ${!isPublished && !isEnrolled ? "opacity-75" : ""}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm line-clamp-2 flex-1">{course.title}</h4>
                          {isCompleted && <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 ml-2" />}
                          {isEnrolled && !isCompleted && <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />}
                          {!isEnrolled && isPublished && <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />}
                          {!isPublished && <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-2">Coming soon</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          {course.duration} mins •{" "}
                          {course.level === "foundational" || course.level === "advanced"
                            ? microCourseTrackLabel(course.level as MicroCourseTier)
                            : course.level}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            {course.level === "foundational" || course.level === "advanced"
                              ? microCourseTrackLabel(course.level as MicroCourseTier)
                              : course.level}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{course.emergencyType}</Badge>
                        </div>
                        {course.prerequisiteId && !isCompleted && !isEnrolled && (
                          <p className="text-xs text-amber-800 mb-2">
                            Requires completed foundational course first
                          </p>
                        )}
                        {isCompleted && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                            onClick={() => {
                              setLocation(`/micro-course/${courseId}?review=true`);
                            }}
                          >
                            Review Course
                          </Button>
                        )}
                        {isEnrolled && !isCompleted && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              const enrollmentId = enrollmentIdByCourseId.get(courseId);
                              setLocation(getProviderCourseDestination(courseId, enrollmentId));
                            }}
                          >
                            {isPublished ? "Open course" : "View status"}
                          </Button>
                        )}
                        {!isEnrolled && (
                          <Button 
                            size="sm" 
                            className="w-full"
                            disabled={!isPublished}
                            onClick={() => handleEnrollClick(course)}
                          >
                            {isPublished ? "Enroll" : "Coming soon"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fellowship micro-course certificates</CardTitle>
                <CardDescription>
                  Download PDF certificates for completed micro-courses. One quick feedback step is required before each first download.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fellowshipCertificates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No certificates yet. Complete a micro-course final exam to receive yours.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {fellowshipCertificates.map((c) => (
                      <li
                        key={c.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium text-sm">{c.courseTitle?.trim() || "Fellowship course"}</p>
                          <p className="text-xs text-muted-foreground">
                            Issued {c.issueDate ? new Date(c.issueDate).toLocaleDateString() : "—"}
                            {c.certificateNumber ? ` · No. ${c.certificateNumber}` : ""}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!c.certificateNumber || downloadingCertificateId === c.id}
                          onClick={() => handleDownloadCertificate(c.id, c.certificateNumber)}
                        >
                          {downloadingCertificateId === c.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-1" />
                              Download PDF
                            </>
                          )}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}

                {(() => {
                  const certTitles = new Set(
                    fellowshipCertificates.map((c) => c.courseTitle?.trim()).filter(Boolean) as string[]
                  );
                  return enrollments
                    .filter((e) => e.enrollmentStatus === "completed" && e.course?.courseId)
                    .filter((e) => !certTitles.has(e.course?.title?.trim() ?? ""))
                    .map((e) => {
                    const slug = e.course!.courseId;
                    return (
                      <div
                        key={e.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-dashed p-3 bg-muted/40"
                      >
                        <p className="text-sm font-medium">{e.course?.title ?? slug}</p>
                        <Button
                          size="sm"
                          disabled={ensureCert.isPending}
                          onClick={() => ensureCert.mutate({ courseId: slug })}
                        >
                          {ensureCert.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Get certificate"
                          )}
                        </Button>
                      </div>
                    );
                  });
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ResusGPS Tab */}
          <TabsContent value="resusgps" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>ResusGPS case tracker</CardTitle>
                <CardDescription>
                  ≥3 saved cases per fellowship micro-course condition ({resusGPSPillar.totalConditionsTaught}{" "}
                  conditions). Only cases saved for fellowship credit on the ResusGPS end screen count here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg border p-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground">Conditions complete</p>
                    <p className="text-2xl font-bold">
                      {resusGPSPillar.conditionsWithThreshold}/{resusGPSPillar.totalConditionsTaught}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground">Cases logged</p>
                    <p className="text-2xl font-bold">{resusGPSPillar.casesCompleted}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground">Cases still needed</p>
                    <p className="text-2xl font-bold">{resusGPSPillar.casesStillNeeded ?? 0}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground">Pillar progress</p>
                    <p className="text-2xl font-bold">{resusGPSPillar.percentage}%</p>
                  </div>
                </div>

                <div>
                  <Progress value={resusGPSPillar.percentage} className="h-2" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Progress by condition</h3>
                  {(resusGPSPillar.conditionBreakdown ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No conditions tracked yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {[...(resusGPSPillar.conditionBreakdown ?? [])]
                        .sort((a, b) => {
                          if (a.complete !== b.complete) return a.complete ? 1 : -1;
                          return b.count - a.count;
                        })
                        .map((cond) => (
                          <li
                            key={cond.id}
                            className={`rounded-lg border p-3 ${
                              cond.complete
                                ? "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                                : "bg-background"
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {cond.complete ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                                )}
                                <span className="text-sm font-medium">{cond.label}</span>
                              </div>
                              <Badge variant={cond.complete ? "default" : "secondary"} className="text-xs">
                                {cond.count}/{cond.required} cases
                              </Badge>
                            </div>
                            <Progress
                              value={Math.min(100, Math.round((cond.count / cond.required) * 100))}
                              className="h-1.5"
                            />
                            {!cond.complete && (
                              <p className="text-xs text-muted-foreground mt-1.5">
                                {cond.remaining} more case{cond.remaining === 1 ? "" : "s"} needed
                              </p>
                            )}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Recent saved cases</h3>
                  {!resusCaseLog?.cases?.length ? (
                    <p className="text-sm text-muted-foreground">
                      No saved cases yet. Complete a ResusGPS case and use Save for Fellowship credit on the last
                      screen.
                    </p>
                  ) : (
                    <ul className="divide-y rounded-lg border">
                      {resusCaseLog.cases.map((c) => (
                        <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                          <div>
                            <p className="font-medium">{c.diagnosisLabel}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(c.createdAt).toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                              {c.outcome ? ` · ${c.outcome.replace(/_/g, " ")}` : ""}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            Saved
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Button className="w-full" onClick={() => setLocation("/resus")}>
                  <Zap className="h-4 w-4 mr-2" />
                  Launch ResusGPS
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Care Signal Tab */}
          <TabsContent value="caresignal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Care Signal report tracker</CardTitle>
                <CardDescription>
                  24 consecutive qualifying months of monthly reporting. At least 1 report per month; after a grace
                  month, submit 3 reports in the following month to catch up.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg border p-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground">Current streak</p>
                    <p className="text-2xl font-bold">{careSignalPillar.streak}/24</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground">Months remaining</p>
                    <p className="text-2xl font-bold">
                      {careSignalPillar.monthsRemaining ?? Math.max(0, 24 - careSignalPillar.streak)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground">Total reports</p>
                    <p className="text-2xl font-bold">{careSignalPillar.eventsSubmitted}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground">This month</p>
                    <p className="text-2xl font-bold">{careSignalPillar.reportsThisMonth ?? 0}</p>
                  </div>
                </div>

                <div>
                  <Progress value={careSignalPillar.percentage} className="h-2" />
                </div>

                {(careSignalPillar.reportsThisMonth ?? 0) === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No report submitted this month yet. Submit at least one Care Signal report to keep your streak
                      on track.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Monthly timeline</h3>
                  {(careSignalPillar.monthlyTimeline ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Your monthly timeline will appear after your first report.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {(careSignalPillar.monthlyTimeline ?? []).map((month) => {
                        const qualified = month.reportCount >= 1;
                        const catchUpNeeded = month.reportCount > 0 && month.reportCount < 3;
                        return (
                          <div
                            key={month.monthKey}
                            className={`rounded-lg border p-2 text-center text-xs ${
                              month.isCurrentMonth
                                ? "border-primary ring-1 ring-primary/30 bg-primary/5"
                                : qualified
                                  ? "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                                  : "bg-muted/30 border-border"
                            }`}
                          >
                            <p className="font-medium truncate">{month.label}</p>
                            <p className="text-lg font-bold mt-0.5">{month.reportCount}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {month.isCurrentMonth
                                ? "This month"
                                : qualified
                                  ? catchUpNeeded
                                    ? "Partial"
                                    : "Qualified"
                                  : "No report"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Recent reports</h3>
                  {!careSignalHistory?.events?.length ? (
                    <p className="text-sm text-muted-foreground">
                      No Care Signal reports yet. Submit your first monthly report to start your streak.
                    </p>
                  ) : (
                    <ul className="divide-y rounded-lg border">
                      {careSignalHistory.events.map((e) => (
                        <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                          <div>
                            <p className="font-medium capitalize">
                              {(e.eventType ?? "Report").replace(/_/g, " ")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {e.eventDate
                                ? new Date(e.eventDate).toLocaleDateString(undefined, {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : new Date(e.createdAt).toLocaleDateString(undefined, {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                              {e.outcome ? ` · ${e.outcome.replace(/_/g, " ")}` : ""}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {e.status?.replace(/_/g, " ") ?? "submitted"}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Button className="w-full" onClick={() => setLocation("/care-signal")}>
                  <Heart className="h-4 w-4 mr-2" />
                  Submit Care Signal report
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Qualification Status */}
          {showFellowCredential ? (
            <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                Congratulations! You have earned the title of Paeds Resus Fellow.
              </AlertDescription>
            </Alert>
          ) : isQualified ? (
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900 dark:text-amber-100">
                You have met all three pillars. The Paeds Resus Fellow credential will appear here after platform launch
                readiness checks (§11) are complete — your progress is saved.
              </AlertDescription>
            </Alert>
          ) : null}
        </Tabs>

        {/* Enrollment Modal */}
        <EnrollmentModal
          course={selectedCourse}
          isOpen={isEnrollmentModalOpen}
          onClose={() => setIsEnrollmentModalOpen(false)}
          onEnrollmentSuccess={handleEnrollmentSuccess}
        />

        {feedbackDialog ? (
          <CertificateDownloadFeedbackDialog
            open
            onOpenChange={(o) => {
              if (!o) setFeedbackDialog(null);
            }}
            certificateId={feedbackDialog.certificateId}
            courseLabel={feedbackDialog.courseLabel}
            onFeedbackSaved={() => {
              const num = feedbackDialog.certificateNumber;
              const cid = feedbackDialog.certificateId;
              setFeedbackDialog(null);
              runCertificateDownload(num, cid);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}