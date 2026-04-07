/**
 * Provider Dashboard
 * 
 * Minimalist, decision-free design for healthcare providers after login.
 * 
 * LAYOUT:
 * 1. Fellowship hero message
 * 2. 3-pillar progress (starting at 0% for new providers)
 * 3. AHA courses (BLS, ACLS, PALS)
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Award, BookOpen, Zap, Heart, AlertCircle, ArrowRight, Lock, CheckCircle2 } from "lucide-react";

export default function ProviderDashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not logged in
  if (!loading && !user) {
    setLocation("/login");
    return null;
  }

  // Fetch fellowship progress (or initialize if doesn't exist)
  const { data: progress, isLoading: progressLoading } = trpc.fellowship.getProgress.useQuery();

  // Fetch AHA courses (BLS, ACLS, PALS)
  const { data: ahaCourses } = trpc.courses.listAll.useQuery();

  // Fetch user enrollments
  const { data: enrollments } = trpc.courses.getUserEnrollments.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );

  if (loading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading dashboard…</p>
      </div>
    );
  }

  // Default progress for new providers (0% on all pillars)
  const defaultProgress = {
    coursesPillar: { completed: 0, required: 26, percentage: 0 },
    resusGPSPillar: { conditionsWithThreshold: 0, totalConditionsTaught: 8, percentage: 0 },
    careSignalPillar: { streak: 0, percentage: 0 },
    isQualified: false,
    overallPercentage: 0,
  };

  const displayProgress = progress || defaultProgress;
  const { coursesPillar, resusGPSPillar, careSignalPillar, isQualified, overallPercentage } = displayProgress;

  // Determine next action
  const getNextAction = () => {
    if (coursesPillar.percentage < 100) {
      return {
        pillar: "Courses",
        action: `Complete: ${coursesPillar.required - coursesPillar.completed} courses remaining`,
        icon: BookOpen,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950/30",
        borderColor: "border-blue-200 dark:border-blue-800",
        cta: "Continue Courses",
        link: "/fellowship",
      };
    }
    if (resusGPSPillar.percentage < 100) {
      return {
        pillar: "ResusGPS",
        action: `Record cases: ${resusGPSPillar.conditionsWithThreshold} of ${resusGPSPillar.totalConditionsTaught} conditions complete`,
        icon: Zap,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950/30",
        borderColor: "border-purple-200 dark:border-purple-800",
        cta: "Launch ResusGPS",
        link: "/resus",
      };
    }
    if (careSignalPillar.percentage < 100) {
      return {
        pillar: "Care Signal",
        action: `Monthly reporting: ${careSignalPillar.streak} of 24 months complete`,
        icon: Heart,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950/30",
        borderColor: "border-red-200 dark:border-red-800",
        cta: "Report Incident",
        link: "/safe-truth",
      };
    }
    return null;
  };

  const nextAction = getNextAction();

  // Filter AHA courses (BLS, ACLS, PALS)
  const ahaCourseTitles = ["BLS", "ACLS", "PALS"];
  const ahaCoursesFiltered = ahaCourses?.filter((c: any) =>
    ahaCourseTitles.some(title => c.title.includes(title))
  ) || [];

  // Prepare enrollment data
  const enrolledCourseIds = new Set(enrollments?.map((e: any) => e.courseId) || []);
  const completedCourseIds = new Set(enrollments?.filter((e: any) => e.status === "completed").map((e: any) => e.courseId) || []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* SECTION 1: FELLOWSHIP HERO MESSAGE */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-lg p-6 md:p-8 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-start gap-4">
            <Award className="h-8 w-8 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                Become a Paeds Resus Fellow
              </h2>
              <p className="text-emerald-800 dark:text-emerald-200 mb-4">
                Earn your fellowship through a comprehensive 3-pillar qualification program. Complete courses, manage real ResusGPS cases, and participate in monthly Care Signal reporting to demonstrate mastery in pediatric emergency care.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: 3-PILLAR PROGRESS */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Award className="h-8 w-8 text-emerald-600" />
              Your Progress
            </h1>
            <p className="text-muted-foreground mt-2">
              {isQualified ? (
                <span className="text-emerald-600 font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> You are qualified as a Paeds Resus Fellow!
                </span>
              ) : (
                `${overallPercentage}% complete — ${3 - Math.ceil((100 - overallPercentage) / 33)} pillar(s) remaining`
              )}
            </p>
          </div>

          {/* Overall Progress */}
          <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fellowship Qualification</CardTitle>
                  <CardDescription>Complete all 3 pillars to earn your fellowship</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-emerald-700 dark:text-emerald-400">{overallPercentage}%</div>
                  <p className="text-sm text-muted-foreground">Complete</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={overallPercentage} className="h-3" />
            </CardContent>
          </Card>

          {/* 3-Pillar Progress */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pillar 1: Courses */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Courses
                </CardTitle>
                <CardDescription className="text-xs">26 micro-courses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{coursesPillar.completed}/{coursesPillar.required}</span>
                    <Badge variant={coursesPillar.percentage === 100 ? "default" : "secondary"}>
                      {coursesPillar.percentage}%
                    </Badge>
                  </div>
                  <Progress value={coursesPillar.percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Pillar 2: ResusGPS */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-5 w-5 text-purple-600" />
                  ResusGPS
                </CardTitle>
                <CardDescription className="text-xs">Clinical cases</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{resusGPSPillar.conditionsWithThreshold}/{resusGPSPillar.totalConditionsTaught}</span>
                    <Badge variant={resusGPSPillar.percentage === 100 ? "default" : "secondary"}>
                      {resusGPSPillar.percentage}%
                    </Badge>
                  </div>
                  <Progress value={resusGPSPillar.percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Pillar 3: Care Signal */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Heart className="h-5 w-5 text-red-600" />
                  Care Signal
                </CardTitle>
                <CardDescription className="text-xs">Monthly reporting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{careSignalPillar.streak}/24</span>
                    <Badge variant={careSignalPillar.percentage === 100 ? "default" : "secondary"}>
                      {careSignalPillar.percentage}%
                    </Badge>
                  </div>
                  <Progress value={careSignalPillar.percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Action (Single CTA) */}
          {nextAction && !isQualified && (
            <Card className={`border-2 ${nextAction.borderColor} ${nextAction.bgColor}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <nextAction.icon className={`h-5 w-5 ${nextAction.color}`} />
                  Next Step: {nextAction.pillar}
                </CardTitle>
                <CardDescription>{nextAction.action}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setLocation(nextAction.link)}
                  className="w-full"
                >
                  {nextAction.cta}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Qualified Celebration */}
          {isQualified && (
            <Alert className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-900 dark:text-emerald-100">
                <strong>Congratulations!</strong> You have completed all requirements for the Paeds Resus Fellowship. Your certificate is ready for download.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* SECTION 3: AHA COURSES (Secondary) */}
        <div className="border-t pt-8 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">AHA Certification Courses</h2>
            <p className="text-sm text-muted-foreground">Optional. Not part of the fellowship.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ahaCoursesFiltered.map((course: any) => {
              const isEnrolled = enrolledCourseIds.has(course.id);
              const isCompleted = completedCourseIds.has(course.id);
              return (
                <Card key={course.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{course.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">{course.duration} hours</CardDescription>
                      </div>
                      {isCompleted && <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />}
                      {!isEnrolled && <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isCompleted && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Completed</p>
                    )}
                    {isEnrolled && !isCompleted && (
                      <Button size="sm" variant="outline" className="w-full">
                        Continue
                      </Button>
                    )}
                    {!isEnrolled && (
                      <Button size="sm" className="w-full">
                        Enroll
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
