/**
 * Paeds Resus Fellowship Dashboard
 * 
 * Single fellowship path with 3-pillar qualification system:
 * 1. Courses: All 26 micro-courses (displayed with progress)
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
import { BookOpen, Stethoscope, AlertCircle, CheckCircle2, Clock, Award, Heart, Zap, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { EnrollmentModal } from "@/components/EnrollmentModal";
import { getProviderCourseDestination } from "@/lib/providerCourseRoutes";

export default function FellowshipDashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [loading, user, setLocation]);

  // Fetch fellowship progress
  const { data: progress, isLoading, error } = trpc.fellowship.getProgress.useQuery(undefined, {
    enabled: Boolean(user),
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  // Fetch all courses for Pillar 1 display
  const { data: allCourses = [] } = trpc.courses.listAll.useQuery(undefined, {
    enabled: Boolean(user) && activeTab === "courses",
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  // Fetch user enrollments
  const { data: enrollments = [] } = trpc.courses.getEnrollments.useQuery(undefined, {
    enabled: Boolean(user) && activeTab === "courses",
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const handleEnrollClick = (course: any) => {
    setSelectedCourse(course);
    setIsEnrollmentModalOpen(true);
  };

  const handleEnrollmentSuccess = () => {
    // Refetch enrollments after successful enrollment
    void utils.courses.getEnrollments.invalidate();
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Micro-courses ({coursesPillar.completed}/{coursesPillar.required})</TabsTrigger>
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
                  <CardDescription>Clinical cases</CardDescription>
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
                      {resusGPSPillar.casesCompleted} total cases
                    </p>
                  </div>
                  <Button
                    onClick={() => setLocation("/resus")}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Open ResusGPS
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
                      {24 - careSignalPillar.streak} months remaining
                    </p>
                  </div>
                  <Button
                    onClick={() => setLocation("/care-signal")}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Open Care Signal
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
                  Complete all 26 toward fellowship certification. Each completed course extends ResusGPS access by 30 days
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
                        <p className="text-xs text-muted-foreground mb-3">{course.duration} mins • {course.level}</p>
                        <div className="flex gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">{course.emergencyType}</Badge>
                        </div>
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

          {/* ResusGPS Tab */}
          <TabsContent value="resusgps" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>ResusGPS Cases</CardTitle>
                <CardDescription>Record your ResusGPS cases to fulfill Pillar 2 of your fellowship</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Your ResusGPS cases will appear here as you use ResusGPS.</p>
                  <Button className="mt-4" onClick={() => setLocation("/resus")}>
                    Launch ResusGPS
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Care Signal Tab */}
          <TabsContent value="caresignal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Care Signal Monthly Reporting</CardTitle>
                <CardDescription>Track your monthly incident reporting for Pillar 3</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Your monthly Care Signal participation will appear here.</p>
                  <Button className="mt-4" onClick={() => setLocation("/care-signal")}>
                    Report Incident
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Qualification Status */}
          {isQualified && (
            <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                🎉 Congratulations! You have achieved Paeds Resus Fellowship qualification!
              </AlertDescription>
            </Alert>
          )}
        </Tabs>

        {/* Enrollment Modal */}
        <EnrollmentModal
          course={selectedCourse}
          isOpen={isEnrollmentModalOpen}
          onClose={() => setIsEnrollmentModalOpen(false)}
          onEnrollmentSuccess={handleEnrollmentSuccess}
        />
      </div>
    </div>
  );
}