/**
 * Fellowship Progress Dashboard
 * 
 * Displays the 3-pillar fellowship qualification status:
 * 1. Courses: Completion of 26 micro-courses + legacy courses
 * 2. ResusGPS: ≥3 cases per taught condition
 * 3. Care Signal: 24 consecutive months of monthly reporting
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BookOpen, Stethoscope, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useLocation } from "wouter";

export default function FellowshipProgress() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not logged in
  if (!loading && !user) {
    setLocation("/login");
    return null;
  }

  // Fetch fellowship progress
  const { data: progress, isLoading, error } = trpc.fellowship.getProgress.useQuery();

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading fellowship progress…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load fellowship progress. Please try again later.
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
            <CardTitle>Fellowship Progress</CardTitle>
            <CardDescription>
              Your fellowship qualification status will appear here once you start courses and ResusGPS cases.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/courses")} className="w-full">
              Start a Course
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { coursesPillar, resusGPSPillar, careSignalPillar, isQualified, overallPercentage } = progress;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Fellowship Qualification Progress</h1>
          <p className="text-muted-foreground mt-2">
            Track your progress across the 3 pillars of the Paeds Resus Elite Fellowship.
          </p>
        </div>

        {/* Overall Status */}
        <Card className={isQualified ? "border-green-200 bg-green-50" : ""}>
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
                      <Clock className="h-5 w-5 text-amber-600" />
                      In Progress
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {isQualified
                    ? "Congratulations! You have completed all requirements for the Paeds Resus Elite Fellowship."
                    : `Overall progress: ${overallPercentage}% complete`}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{overallPercentage}%</div>
                <p className="text-sm text-muted-foreground">Overall</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 3 Pillars */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Pillar 1: Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5" />
                Pillar 1: Courses
              </CardTitle>
              <CardDescription>Micro-courses & certifications</CardDescription>
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
                <Progress value={coursesPillar.percentage} className="h-2" />
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">{coursesPillar.completed}</span> of{" "}
                  <span className="font-medium">{coursesPillar.required}</span> courses completed
                </p>
                {coursesPillar.legacyCourses > 0 && (
                  <p className="text-muted-foreground">
                    + {coursesPillar.legacyCourses} legacy courses (BLS/ACLS/PALS)
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setLocation("/courses")}
              >
                View Courses
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
              <CardDescription>Clinical cases & conditions</CardDescription>
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
                <Progress value={resusGPSPillar.percentage} className="h-2" />
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">{resusGPSPillar.conditionsWithThreshold}</span> of{" "}
                  <span className="font-medium">{resusGPSPillar.totalConditionsTaught}</span> conditions
                  with ≥3 cases
                </p>
                <p className="text-muted-foreground">
                  {resusGPSPillar.casesCompleted} total cases completed
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setLocation("/resus")}
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
              <CardDescription>Monthly incident reporting</CardDescription>
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
                <Progress value={careSignalPillar.percentage} className="h-2" />
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">{careSignalPillar.streak}</span> of{" "}
                  <span className="font-medium">24</span> consecutive months
                </p>
                <p className="text-muted-foreground">
                  {careSignalPillar.eventsSubmitted} total events submitted
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setLocation("/care-signal")}
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
            <CardDescription>What you need to complete</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-medium">Pillar 1: Courses</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Complete all 26 micro-courses</li>
                  <li>✓ BLS, ACLS, PALS (bonus)</li>
                  <li>✓ Maintain 80%+ quiz scores</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Pillar 2: ResusGPS</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ ≥3 cases per taught condition</li>
                  <li>✓ Full ABCDE assessments</li>
                  <li>✓ Server-side depth validation</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Pillar 3: Care Signal</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ 24 consecutive months</li>
                  <li>✓ ≥1 event per month (normal)</li>
                  <li>✓ ≥3 events in catch-up month (after grace)</li>
                  <li>✓ Up to 2 grace months per year</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        {!isQualified && (
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {coursesPillar.percentage < 100 && (
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-700">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Complete Remaining Courses</p>
                      <p className="text-sm text-muted-foreground">
                        You have {coursesPillar.required - coursesPillar.completed} courses left to complete.
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1"
                        onClick={() => setLocation("/courses")}
                      >
                        View Courses →
                      </Button>
                    </div>
                  </div>
                )}

                {resusGPSPillar.percentage < 100 && (
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-700">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Complete ResusGPS Cases</p>
                      <p className="text-sm text-muted-foreground">
                        You need ≥3 cases for{" "}
                        {resusGPSPillar.totalConditionsTaught - resusGPSPillar.conditionsWithThreshold}{" "}
                        more conditions.
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1"
                        onClick={() => setLocation("/resus")}
                      >
                        Launch ResusGPS →
                      </Button>
                    </div>
                  </div>
                )}

                {careSignalPillar.percentage < 100 && (
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-700">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Build Care Signal Streak</p>
                      <p className="text-sm text-muted-foreground">
                        You have {careSignalPillar.streak} of 24 consecutive months. Keep reporting incidents.
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1"
                        onClick={() => setLocation("/care-signal")}
                      >
                        Report Incident →
                      </Button>
                    </div>
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
