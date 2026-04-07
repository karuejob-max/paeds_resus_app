import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, CheckCircle2, Lock } from "lucide-react";

export default function AHACourses() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not logged in
  if (!loading && !user) {
    setLocation("/login");
    return null;
  }

  // Fetch AHA courses (BLS, ACLS, PALS)
  const { data: allCourses } = trpc.courses.listAll.useQuery();

  // Fetch user enrollments
  const { data: enrollments } = trpc.courses.getUserEnrollments.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  // Filter AHA courses (BLS, ACLS, PALS)
  const ahaCourseTitles = ["BLS", "ACLS", "PALS"];
  const ahaCourses = allCourses?.filter((c: any) =>
    ahaCourseTitles.some(title => c.title.includes(title))
  ) || [];

  // Prepare enrollment data
  const enrolledCourseIds = new Set(enrollments?.map((e: any) => e.courseId) || []);
  const completedCourseIds = new Set(enrollments?.filter((e: any) => e.status === "completed").map((e: any) => e.courseId) || []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BookOpen className="h-8 w-8" />
              AHA Certification Courses
            </h1>
            <p className="text-muted-foreground mt-2">
              Complete BLS, ACLS, or PALS certification courses
            </p>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ahaCourses.map((course: any) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            const isCompleted = completedCourseIds.has(course.id);
            
            return (
              <Card key={course.id} className="hover:border-primary/50 transition-colors flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    {isCompleted && <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />}
                  </div>
                  <CardDescription>{course.duration} hours</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {course.description || "Official certification course"}
                  </p>
                  
                  {isCompleted && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 text-center">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        ✓ Completed
                      </p>
                    </div>
                  )}
                  
                  {isEnrolled && !isCompleted && (
                    <Button size="sm" variant="outline" className="w-full">
                      Continue
                    </Button>
                  )}
                  
                  {!isEnrolled && (
                    <Button size="sm" className="w-full">
                      Enroll Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty state */}
        {ahaCourses.length === 0 && (
          <Card className="text-center p-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No AHA courses available</p>
          </Card>
        )}
      </div>
    </div>
  );
}
