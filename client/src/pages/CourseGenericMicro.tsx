import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  Clock,
  BookOpen,
  Play,
  Award,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Lock,
  Loader2
} from "lucide-react";

export default function CourseGenericMicro() {
  const [, params] = useRoute("/course/:courseId");
  const courseId = params?.courseId;
  const [, setLocation] = useLocation();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  // Fetch all courses to find this one
  const { data: allCourses, isLoading: isLoadingCourses } = trpc.courses.listAll.useQuery();
  
  // Fetch user enrollments to check if enrolled and get progress
  const { data: enrollments, isLoading: isLoadingEnrollments } = trpc.courses.getEnrollments.useQuery();

  const course = allCourses?.find(c => c.courseId === courseId);
  const enrollment = enrollments?.find(e => e.course?.courseId === courseId);
  const isEnrolled = !!enrollment;
  const isPublished = course?.isPublished;

  useEffect(() => {
    if (!isLoadingCourses && !course) {
      // If course not found in catalog, redirect back to fellowship
      setLocation("/fellowship");
    }
  }, [course, isLoadingCourses, setLocation]);

  if (isLoadingCourses || isLoadingEnrollments) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) return null;

  const progress = enrollment?.progressPercentage || 0;

  // Mock modules for now until we have a real LearningPath backend for micro-courses
  const modules = [
    {
      id: "module-1",
      title: "Module 1: Introduction & Recognition",
      duration: Math.floor(course.duration * 0.4),
      completed: progress > 30,
      lessons: [
        { id: "l1", title: "Key Concepts", type: "video", duration: 10, completed: progress > 10 },
        { id: "l2", title: "Clinical Presentation", type: "reading", duration: 15, completed: progress > 20 },
        { id: "l3", title: "Initial Assessment Quiz", type: "quiz", duration: 10, completed: progress > 30 },
      ]
    },
    {
      id: "module-2",
      title: "Module 2: Management & Stabilization",
      duration: Math.floor(course.duration * 0.6),
      completed: progress === 100,
      lessons: [
        { id: "l4", title: "Standard Protocols", type: "video", duration: 15, completed: progress > 50 },
        { id: "l5", title: "Advanced Interventions", type: "reading", duration: 20, completed: progress > 75 },
        { id: "l6", title: "Final Competency Exam", type: "quiz", duration: 15, completed: progress === 100 },
      ]
    }
  ];

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video": return <Play className="w-4 h-4" />;
      case "reading": return <BookOpen className="w-4 h-4" />;
      case "quiz": return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/fellowship")}
          className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Fellowship
        </Button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-slate-900">{course.title}</h1>
              {!isPublished && <Badge variant="secondary">Coming soon</Badge>}
            </div>
            <p className="text-slate-600">{course.level} • {course.duration} minutes total</p>
          </div>
          {isEnrolled && (
            <div className="flex items-center gap-3 bg-white p-3 rounded-lg border shadow-sm">
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Your Progress</p>
                <p className="text-xl font-bold text-primary">{progress}%</p>
              </div>
              <div className="w-24">
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          )}
        </div>

        {!isPublished && (
          <Alert className="bg-amber-50 border-amber-200">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Content under development</AlertTitle>
            <AlertDescription className="text-amber-700">
              This micro-course is currently being finalized by our clinical team. You can view the curriculum below, but the interactive modules will be available shortly.
            </AlertDescription>
          </Alert>
        )}

        {!isEnrolled && isPublished && (
          <Alert className="bg-blue-50 border-blue-200">
            <Lock className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Enrollment Required</AlertTitle>
            <AlertDescription className="text-blue-700">
              You need to enroll in this course from the Fellowship Dashboard to access the full content and earn credit.
            </AlertDescription>
          </Alert>
        )}

        {/* Course Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Course Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">
              {course.description || "No description available for this course."}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase">Emergency Type</p>
                <Badge variant="outline" className="capitalize">{course.emergencyType}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase">Level</p>
                <p className="text-sm font-semibold capitalize">{course.level}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase">Duration</p>
                <p className="text-sm font-semibold">{course.duration} mins</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase">Credit</p>
                <p className="text-sm font-semibold">Fellowship Pillar 1</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Modules */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Curriculum</h2>
          {modules.map((module) => (
            <Card key={module.id} className={!isEnrolled || !isPublished ? "opacity-75" : ""}>
              <div 
                className="p-4 cursor-pointer hover:bg-slate-50 transition flex items-center justify-between"
                onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
              >
                <div className="flex items-center gap-3">
                  {module.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900">{module.title}</h3>
                    <p className="text-xs text-slate-500">{module.lessons.length} lessons • {module.duration} mins</p>
                  </div>
                </div>
                {expandedModule === module.id ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </div>
              
              {expandedModule === module.id && (
                <div className="border-t bg-slate-50 p-2 space-y-1">
                  {module.lessons.map((lesson) => (
                    <div 
                      key={lesson.id}
                      className="flex items-center justify-between p-3 bg-white rounded-md border border-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-slate-400">{getLessonIcon(lesson.type)}</div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{lesson.title}</p>
                          <p className="text-[10px] text-slate-500 uppercase">{lesson.type} • {lesson.duration} mins</p>
                        </div>
                      </div>
                      {isEnrolled && isPublished ? (
                        lesson.completed ? (
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">Done</Badge>
                        ) : (
                          <Button size="sm" variant="outline" className="h-8 text-xs">Start</Button>
                        )
                      ) : (
                        <Lock className="h-4 w-4 text-slate-300" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>

        {isEnrolled && isPublished && (
          <Card className={`${progress === 100 ? 'bg-slate-900' : 'bg-primary'} text-primary-foreground border-none shadow-lg overflow-hidden relative`}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Award className="h-24 w-24" />
            </div>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <h3 className="text-xl font-bold">
                    {progress === 100 ? "Course Completed!" : "Ready to continue?"}
                  </h3>
                  <p className="text-primary-foreground/80">
                    {progress === 100 
                      ? "You've mastered this content. You can review the material anytime." 
                      : `You're ${progress}% through this course. Complete it to earn credit.`}
                  </p>
                </div>
                <div className="flex gap-3">
                  {progress === 100 && enrollment?.certificateUrl && (
                    <Button 
                      variant="outline" 
                      className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                      onClick={() => window.open(enrollment.certificateUrl!, '_blank')}
                    >
                      View Certificate
                    </Button>
                  )}
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="font-bold shadow-md"
                    onClick={() => setLocation(`/micro-course/${courseId}`)}
                  >
                    {progress === 100 ? "Review Course" : "Continue Learning"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
