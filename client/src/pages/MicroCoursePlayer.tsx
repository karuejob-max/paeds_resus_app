import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, BookOpen, Award, AlertCircle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { getMicroCourseContent } from "@/lib/microCourseContent";

/**
 * Generic Micro-Course Player
 * Renders any micro-course from the catalog without a dedicated page.
 * Supports modules, quizzes, and progress tracking.
 *
 * All React hooks are declared unconditionally at the top of the component
 * to comply with the Rules of Hooks (no hooks after early returns).
 */
export default function MicroCoursePlayer() {
  const { courseId } = useParams<{ courseId: string }>();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // ── State (all hooks must be before any early return) ──────────────────────
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState<Set<number>>(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [issuedCertNumber, setIssuedCertNumber] = useState<string | null>(null);
  // Track whether we've already seeded completedModules from DB enrollment status
  const [progressSeeded, setProgressSeeded] = useState(false);

  // ── Server queries ──────────────────────────────────────────────────────────
  const { data: allCourses, isLoading: coursesLoading } = trpc.courses.listAll.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: myEnrollments } = trpc.courses.getUserEnrollments.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // ── Derived data ────────────────────────────────────────────────────────────
  const currentCourse = useMemo(
    () => allCourses?.find((c) => c.courseId === courseId),
    [allCourses, courseId]
  );

  const isEnrolled = useMemo(
    () => myEnrollments?.some((e) => e.course?.courseId === courseId),
    [myEnrollments, courseId]
  );

  // Derive the current enrollment row so we can check DB completion status
  const currentEnrollment = useMemo(
    () => myEnrollments?.find((e) => e.course?.courseId === courseId),
    [myEnrollments, courseId]
  );

  // Seed completedModules from DB on first load — if the course is already
  // marked completed in the DB, mark all modules as done so the
  // "Get Certificate" / "Course Completed" banner shows immediately.
  // This runs as a side-effect after enrollments are loaded.
  useEffect(() => {
    if (progressSeeded) return;
    if (!currentEnrollment) return;
    const modules = courseId ? getMicroCourseContent(courseId)?.modules ?? [] : [];
    if (modules.length === 0) return;
    if (
      currentEnrollment.enrollmentStatus === 'completed' ||
      (currentEnrollment.progressPercentage != null && currentEnrollment.progressPercentage >= 100)
    ) {
      // Mark all modules as completed so the completion banner renders
      setCompletedModules(new Set(modules.map((_, i) => i)));
      setCurrentModuleIndex(modules.length - 1);
    }
    setProgressSeeded(true);
  }, [currentEnrollment, progressSeeded, courseId]);

  // Static content layer — modules, quizzes, key points, references
  const staticContent = useMemo(
    () => (courseId ? getMicroCourseContent(courseId) : undefined),
    [courseId]
  );

  // ── Mutations (must be before early returns) ────────────────────────────────
  const completeCourse = trpc.courses.complete.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        if (data.certificateNumber) {
          setIssuedCertNumber(data.certificateNumber);
          toast.success(`Certificate issued! #${data.certificateNumber}`);
        } else {
          toast.success("Course completed!");
        }
        setTimeout(() => navigate("/home"), 2500);
      } else {
        toast.error(data.message || "Failed to complete course");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to mark course as complete");
    },
  });

  const submitQuiz = trpc.courses.submitModuleQuiz.useMutation({
    onSuccess: (result) => {
      if (result.success && result.passed) {
        toast.success(result.message);
        setTimeout(() => handleModuleComplete(), 1500);
      } else if (result.success) {
        toast.error(result.message);
      } else {
        toast.error("Failed to save quiz submission");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit quiz");
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleModuleComplete = () => {
    const newCompleted = new Set(completedModules);
    newCompleted.add(currentModuleIndex);
    setCompletedModules(newCompleted);
    setShowQuiz(false);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    if (currentModuleIndex < (staticContent?.modules.length ?? 0) - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
    }
  };

  const handleQuizSubmit = () => {
    if (!currentModule?.quiz) return;
    let correct = 0;
    currentModule.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) correct++;
    });
    const score = Math.round((correct / currentModule.quiz.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);

    // enrollmentId comes from the URL query string: /micro-course/:courseId?enrollmentId=9
    const enrollmentId = new URLSearchParams(window.location.search).get("enrollmentId");
    if (enrollmentId && currentCourse?.id) {
      // Convert number-keyed answers to string-keyed for the server schema
      const stringAnswers: Record<string, string> = {};
      Object.entries(quizAnswers).forEach(([k, v]) => { stringAnswers[k] = v; });
      submitQuiz.mutate({
        enrollmentId: parseInt(enrollmentId),
        moduleId: currentModuleIndex,
        score,
        answers: stringAnswers,
      });
    } else {
      if (score >= 80) {
        toast.success("Quiz passed! Moving to next module.");
        setTimeout(() => handleModuleComplete(), 1500);
      } else {
        toast.error("Quiz score below 80%. Please review and try again.");
      }
    }
  };

  const handleCompleteCourse = () => {
    if (!currentCourse?.courseId) return;
    completeCourse.mutate({ courseId: currentCourse.courseId });
  };

  // ── Early returns (after all hooks) ────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Please sign in to access this course.
            </p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (coursesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!currentCourse) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Button variant="ghost" onClick={() => navigate("/fellowship")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Course not found. Please check the course ID and try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Button variant="ghost" onClick={() => navigate("/fellowship")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to enroll in this course first. Please go to the courses page and enroll.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ── Content resolution ──────────────────────────────────────────────────────
  const modules = staticContent?.modules ?? [];
  const currentModule = modules[currentModuleIndex];
  const isLastModule = currentModuleIndex === modules.length - 1;
  const allModulesCompleted = modules.length > 0 && completedModules.size === modules.length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/fellowship")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">{currentCourse.title}</h1>
              <p className="text-xs text-muted-foreground">
                {modules.length > 0
                  ? `Module ${currentModuleIndex + 1} of ${modules.length}`
                  : "Content loading..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{currentCourse.level}</Badge>
            <Badge variant="secondary">{currentCourse.duration} min</Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* No content yet */}
        {modules.length === 0 && (
          <Card className="mb-8">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Course content is being prepared. Check back soon.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Progress Bar */}
        {modules.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Course Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedModules.size} of {modules.length} modules
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedModules.size / modules.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Module Content */}
        {currentModule && !showQuiz && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {currentModule.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Duration: {currentModule.duration} minutes
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Learning Objectives */}
              {currentModule.learningObjectives && currentModule.learningObjectives.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Learning Objectives</h3>
                  <ul className="space-y-2">
                    {currentModule.learningObjectives.map((obj, idx) => (
                      <li key={idx} className="text-sm flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{typeof obj === "string" ? obj : obj.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Module Content */}
              {currentModule.content && (
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: currentModule.content }} />
                </div>
              )}

              {/* Key Points */}
              {currentModule.keyPoints && currentModule.keyPoints.length > 0 && (
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Key Points
                  </h3>
                  <ul className="space-y-2">
                    {currentModule.keyPoints.map((point, idx) => (
                      <li key={idx} className="text-sm flex gap-2">
                        <span className="text-primary">✓</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* References */}
              {currentModule.references && currentModule.references.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">References</h3>
                  <ul className="space-y-2">
                    {currentModule.references.map((ref, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">
                        {typeof ref === "string" ? ref : `${ref.title} — ${ref.source} (${ref.year})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setCurrentModuleIndex(Math.max(0, currentModuleIndex - 1))}
                  disabled={currentModuleIndex === 0}
                >
                  Previous
                </Button>
                {currentModule.quiz && currentModule.quiz.length > 0 ? (
                  <Button onClick={() => setShowQuiz(true)} className="flex-1">
                    Take Quiz
                  </Button>
                ) : (
                  <Button onClick={handleModuleComplete} className="flex-1">
                    {isLastModule ? "Complete Course" : "Next Module"}
                  </Button>
                )}
                {!isLastModule && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentModuleIndex(Math.min(modules.length - 1, currentModuleIndex + 1))
                    }
                  >
                    Skip
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quiz */}
        {showQuiz && currentModule?.quiz && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Module Quiz</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">Pass with 80% or higher to continue</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentModule.quiz.map((question, qIdx) => (
                <div key={qIdx} className="space-y-3">
                  <p className="font-medium text-sm">
                    {qIdx + 1}. {question.question}
                  </p>
                  <div className="space-y-2 ml-4">
                    {question.options.map((option, oIdx) => (
                      <label key={oIdx} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${qIdx}`}
                          value={option}
                          checked={quizAnswers[qIdx] === option}
                          onChange={(e) => {
                            setQuizAnswers({ ...quizAnswers, [qIdx]: e.target.value });
                          }}
                          disabled={quizSubmitted}
                          className="cursor-pointer"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                  {quizSubmitted && (
                    <div
                      className={`text-xs p-2 rounded ${
                        quizAnswers[qIdx] === question.correctAnswer
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {quizAnswers[qIdx] === question.correctAnswer
                        ? "✓ Correct"
                        : `✗ Correct answer: ${question.correctAnswer}`}
                    </div>
                  )}
                </div>
              ))}

              {quizSubmitted && quizScore !== null && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium">
                    Your Score: <span className="text-lg font-bold">{quizScore}%</span>
                  </p>
                  {quizScore >= 80 ? (
                    <p className="text-sm text-green-700 mt-1">✓ Quiz passed!</p>
                  ) : (
                    <p className="text-sm text-red-700 mt-1">✗ Please review and try again</p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowQuiz(false);
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                    setQuizScore(null);
                  }}
                  disabled={quizSubmitted && !quizScore}
                >
                  Back
                </Button>
                {!quizSubmitted && (
                  <Button
                    onClick={handleQuizSubmit}
                    className="flex-1"
                    disabled={
                      Object.keys(quizAnswers).length !== currentModule.quiz.length ||
                      submitQuiz.isPending
                    }
                  >
                    {submitQuiz.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Quiz"
                    )}
                  </Button>
                )}
                {quizSubmitted && quizScore !== null && quizScore >= 80 && (
                  <Button onClick={handleModuleComplete} className="flex-1">
                    {isLastModule ? "Finish Course" : "Continue to Next Module"}
                  </Button>
                )}
                {quizSubmitted && quizScore !== null && quizScore < 80 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuizAnswers({});
                      setQuizSubmitted(false);
                      setQuizScore(null);
                    }}
                    className="flex-1"
                  >
                    Retry Quiz
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Completion */}
        {allModulesCompleted && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Course Completed!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {issuedCertNumber ? (
                <div className="text-sm text-green-800 space-y-1">
                  <p className="font-semibold">🎉 Certificate issued!</p>
                  <p>Certificate number: <span className="font-mono font-bold">{issuedCertNumber}</span></p>
                  <p className="text-xs text-green-700">Redirecting to your dashboard…</p>
                </div>
              ) : (
                <p className="text-sm text-green-800">
                  Congratulations! You've completed all modules. Click below to generate your certificate.
                </p>
              )}
              {!issuedCertNumber && (
                <Button
                  onClick={handleCompleteCourse}
                  disabled={completeCourse.isPending}
                  className="w-full"
                >
                  {completeCourse.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating certificate…
                    </>
                  ) : (
                    "Get Certificate"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
