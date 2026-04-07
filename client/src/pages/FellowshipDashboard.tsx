/**
 * Paeds Resus Fellowship Dashboard
 * 
 * Single unified fellowship tier with 3-pillar qualification system:
 * 1. Courses: All 26 micro-courses (displayed with progress)
 * 2. ResusGPS: ≥3 cases per taught condition
 * 3. Care Signal: 24 consecutive months of monthly reporting
 * 
 * All courses are integrated into the fellowship path - no separate tiers.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Stethoscope, AlertCircle, CheckCircle2, Clock, Award } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function FellowshipDashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Redirect if not logged in
  if (!loading && !user) {
    setLocation("/login");
    return null;
  }

  // Fetch fellowship progress
  const { data: progress, isLoading, error } = trpc.fellowship.getProgress.useQuery();

  // Fetch all courses for Pillar 1 display
  const { data: allCourses } = trpc.courses.listAll.useQuery();

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading fellowship dashboard…</p>
      </div>
    );
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
            <Button onClick={() => setLocation("/courses")} className="w-full">
              Start Fellowship Path
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { coursesPillar, resusGPSPillar, careSignalPillar, isQualified, overallPercentage } = progress;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-amber-600" />
            <h1 className="text-3xl font-bold">Paeds Resus Fellowship</h1>
          </div>
          <p className="text-muted-foreground">
            Single unified fellowship tier. Complete all 3 pillars to achieve qualification.
          </p>
        </div>

        {/* Overall Status Card */}
        <Card className={isQualified ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {isQualified ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Fellowship Qualified
                    </>
                  ) : (
                    <>
                      <Clock className="h-5 w-5 text-blue-600" />
                      Fellowship In Progress
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {isQualified
                    ? "Congratulations! You have achieved the Paeds Resus Fellowship."
                    : `Overall progress: ${overallPercentage}% complete. All 3 pillars must reach 100%.`}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{overallPercentage}%</div>
                <p className="text-sm text-muted-foreground">Complete</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs: Overview, Courses, ResusGPS, Care Signal */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="resusgps">ResusGPS</TabsTrigger>
            <TabsTrigger value="caresignal">Care Signal</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Pillar 1: Courses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5" />
                    Pillar 1: Courses
                  </CardTitle>
                  <CardDescription>26 micro-courses</CardDescription>
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
                    View All Courses
                  </Button>
                </CardContent>
              </Card>

              {/* Pillar 2: ResusGPS */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Stethoscope className="h-5 w-5" />
                    Pillar 2: ResusGPS
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
                    Launch ResusGPS
                  </Button>
                </CardContent>
              </Card>

              {/* Pillar 3: Care Signal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertCircle className="h-5 w-5" />
                    Pillar 3: Care Signal
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
                      {careSignalPillar.eventsSubmitted} events submitted
                    </p>
                  </div>
                  <Button
                    onClick={() => setLocation("/care-signal")}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Report Incident
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Requirements Info */}
            <Card>
              <CardHeader>
                <CardTitle>Fellowship Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Pillar 1: Courses</h4>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li className="flex gap-2">
                        <span>✓</span>
                        <span>Complete all 26 micro-courses</span>
                      </li>
                      <li className="flex gap-2">
                        <span>✓</span>
                        <span>Pass quizzes (80%+ score)</span>
                      </li>
                      <li className="flex gap-2">
                        <span>✓</span>
                        <span>Earn certificates</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Pillar 2: ResusGPS</h4>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li className="flex gap-2">
                        <span>✓</span>
                        <span>≥3 cases per condition</span>
                      </li>
                      <li className="flex gap-2">
                        <span>✓</span>
                        <span>Full ABCDE assessments</span>
                      </li>
                      <li className="flex gap-2">
                        <span>✓</span>
                        <span>Depth validation</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Pillar 3: Care Signal</h4>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li className="flex gap-2">
                        <span>✓</span>
                        <span>24 consecutive months</span>
                      </li>
                      <li className="flex gap-2">
                        <span>✓</span>
                        <span>≥3 events per month</span>
                      </li>
                      <li className="flex gap-2">
                        <span>✓</span>
                        <span>Grace periods available</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All 26 Micro-Courses</CardTitle>
                <CardDescription>
                  Complete all courses to achieve 100% on Pillar 1. Progress: {coursesPillar.completed}/{coursesPillar.required}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allCourses && allCourses.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {allCourses.map((course: any) => (
                        <div
                          key={course.id}
                          className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => setLocation(`/courses/${course.id}`)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{course.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {course.description?.substring(0, 60)}...
                              </p>
                            </div>
                            {course.completed && (
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                          <div className="mt-3 text-xs text-muted-foreground">
                            {course.difficulty} • {course.durationMinutes} min
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Loading courses...</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button onClick={() => setLocation("/courses")} className="w-full">
              View Full Course Catalog
            </Button>
          </TabsContent>

          {/* ResusGPS Tab */}
          <TabsContent value="resusgps" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ResusGPS Cases</CardTitle>
                <CardDescription>
                  You need ≥3 cases for each condition taught in your courses.
                  Current: {resusGPSPillar.conditionsWithThreshold}/{resusGPSPillar.totalConditionsTaught} conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm">
                    <span className="font-semibold">{resusGPSPillar.casesCompleted}</span> total cases completed
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {resusGPSPillar.totalConditionsTaught - resusGPSPillar.conditionsWithThreshold} conditions need more cases
                  </p>
                </div>
                <Button onClick={() => setLocation("/resus")} className="w-full">
                  Launch ResusGPS
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Care Signal Tab */}
          <TabsContent value="caresignal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Care Signal Streak</CardTitle>
                <CardDescription>
                  Build a 24-month consecutive streak of monthly incident reporting.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm">
                    <span className="font-semibold text-lg">{careSignalPillar.streak}</span>
                    <span className="text-muted-foreground"> of 24 consecutive months</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {careSignalPillar.eventsSubmitted} total incidents reported
                  </p>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Report at least 3 incidents per month to maintain your streak. Grace periods are available (max 2 per year).
                  </AlertDescription>
                </Alert>
                <Button onClick={() => setLocation("/care-signal")} className="w-full">
                  Report an Incident
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Next Steps */}
        {!isQualified && (
          <Card>
            <CardHeader>
              <CardTitle>Your Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {coursesPillar.percentage < 100 && (
                  <div className="flex gap-3 p-3 border rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-700">1</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Complete Remaining Courses</p>
                      <p className="text-sm text-muted-foreground">
                        {coursesPillar.required - coursesPillar.completed} courses left
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("courses")}
                    >
                      Go →
                    </Button>
                  </div>
                )}

                {resusGPSPillar.percentage < 100 && (
                  <div className="flex gap-3 p-3 border rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-700">2</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Complete ResusGPS Cases</p>
                      <p className="text-sm text-muted-foreground">
                        {resusGPSPillar.totalConditionsTaught - resusGPSPillar.conditionsWithThreshold} conditions need ≥3 cases
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("resusgps")}
                    >
                      Go →
                    </Button>
                  </div>
                )}

                {careSignalPillar.percentage < 100 && (
                  <div className="flex gap-3 p-3 border rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-700">3</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Build Care Signal Streak</p>
                      <p className="text-sm text-muted-foreground">
                        {24 - careSignalPillar.streak} months remaining
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("caresignal")}
                    >
                      Go →
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
