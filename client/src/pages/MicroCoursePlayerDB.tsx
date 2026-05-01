
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, BookOpen, Award, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

export default function MicroCoursePlayerDB() {
  const { courseId: slug } = useParams<{ courseId: string }>();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // ── State ──────────────────────────────────────────────────────────────────
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [issuedCertNumber, setIssuedCertNumber] = useState<string | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  // 1. Get the micro-course catalog row to find the title
  const { data: allMicroCourses, isLoading: catalogLoading } = trpc.courses.listAll.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const microCourseRow = useMemo(
    () => allMicroCourses?.find((c) => c.courseId === slug),
    [allMicroCourses, slug]
  );

  // 2. Get the DB-backed course using the title from the catalog
  const { data: fellowshipCourses, isLoading: coursesLoading } = trpc.learning.getCourses.useQuery(
    { programType: "fellowship" },
    { enabled: !!microCourseRow }
  );

  const dbCourse = useMemo(
    () => fellowshipCourses?.find((c) => c.title === microCourseRow?.title),
    [fellowshipCourses, microCourseRow]
  );

  // 3. Get full course details (modules)
  const { data: courseDetails, isLoading: detailsLoading } = trpc.learning.getCourseDetails.useQuery(
    { courseId: dbCourse?.id ?? 0 },
    { enabled: !!dbCourse }
  );

  // 4. Get current module content (HTML + Quizzes)
  const currentModuleId = useMemo(() => {
    return courseDetails?.modules?.[currentModuleIndex]?.id;
  }, [courseDetails, currentModuleIndex]);

  const { data: moduleContent, isLoading: contentLoading } = trpc.learning.getModuleContent.useQuery(
    { moduleId: currentModuleId ?? 0 },
    { enabled: !!currentModuleId }
  );

  // 5. Get enrollment (needed for certificate and progress)
  const { data: myEnrollments } = trpc.courses.getUserEnrollments.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const enrollment = useMemo(
    () => myEnrollments?.find((e) => e.course?.courseId === slug),
    [myEnrollments, slug]
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const completeCourse = trpc.courses.complete.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        if (data.certificateNumber) {
          setIssuedCertNumber(data.certificateNumber);
          toast.success(`Certificate issued! #${data.certificateNumber}`);
        } else {
          toast.success("Course completed!");
        }
        setTimeout(() => navigate("/fellowship"), 2500);
      } else {
        toast.error(data.message || "Failed to complete course");
      }
    },
  });

  const submitQuiz = trpc.learning.recordQuizAttempt.useMutation({
    onSuccess: (result) => {
      if (result.success && result.passed) {
        toast.success("Quiz passed!");
        setQuizScore(result.score);
        setQuizSubmitted(true);
      } else if (result.success) {
        setQuizScore(result.score);
        setQuizSubmitted(true);
        toast.error(`Score: ${result.score}%. Passing is ${result.passingScore}%`);
      }
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleModuleComplete = () => {
    setShowQuiz(false);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    if (currentModuleIndex < (courseDetails?.modules.length ?? 0) - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
    } else if (enrollment?.enrollmentStatus === 'completed') {
      // If already completed, just go back
      navigate("/fellowship");
    }
  };

  const handleQuizSubmit = () => {
    const quiz = moduleContent?.quizzes?.[0];
    if (!quiz || !enrollment) return;

    let correct = 0;
    quiz.questions.forEach((q: any, idx: number) => {
      const userAnswer = quizAnswers[idx];
      const correctAnswer = typeof q.correctAnswer === 'string' ? JSON.parse(q.correctAnswer) : q.correctAnswer;
      if (userAnswer === correctAnswer) correct++;
    });

    const score = Math.round((correct / quiz.questions.length) * 100);
    
    submitQuiz.mutate({
      enrollmentId: enrollment.id,
      moduleId: currentModuleId!,
      quizId: quiz.id,
      score,
      answers: quizAnswers,
    });
  };

  // ── Loading States ─────────────────────────────────────────────────────────
  if (catalogLoading || coursesLoading || detailsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading authored content...</p>
        </div>
      </div>
    );
  }

  if (!microCourseRow || !dbCourse) {
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Content Not Found</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          We found the course in the catalog, but the authored modules haven't been linked to this player yet.
        </p>
        <Button onClick={() => navigate("/fellowship")}>Back to Fellowship</Button>
      </div>
    );
  }

  const modules = courseDetails?.modules ?? [];
  const currentModule = moduleContent;
  const isLastModule = currentModuleIndex === modules.length - 1;
  const quiz = currentModule?.quizzes?.[0];

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
              <h1 className="font-semibold text-lg">{dbCourse.title}</h1>
              <p className="text-xs text-muted-foreground">
                Module {currentModuleIndex + 1} of {modules.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {enrollment?.enrollmentStatus === 'completed' && (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">Review Mode</Badge>
            )}
            <Badge variant="outline" className="capitalize">{dbCourse.level}</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs mb-2">
            <span>Course Progress</span>
            <span>{Math.round(((currentModuleIndex) / modules.length) * 100)}%</span>
          </div>
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-500" 
              style={{ width: `${((currentModuleIndex) / modules.length) * 100}%` }}
            />
          </div>
        </div>

        {!showQuiz ? (
          <Card className="shadow-sm border-muted">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-xl flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                {currentModule?.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {contentLoading ? (
                <div className="py-12 flex justify-center"><Loader2 className="animate-spin" /></div>
              ) : (
                <>
                  <div 
                    className="prose prose-slate max-w-none dark:prose-invert 
                      prose-h2:text-xl prose-h2:font-bold prose-h2:text-primary prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b
                      prose-h3:text-lg prose-h3:font-semibold prose-h3:text-slate-800 prose-h3:mt-6 prose-h3:mb-3
                      prose-p:text-base prose-p:leading-relaxed prose-p:text-slate-700
                      prose-ul:my-4 prose-li:text-slate-700 prose-li:my-1
                      prose-strong:text-primary-700 prose-strong:font-bold
                      prose-img:rounded-xl prose-img:shadow-md
                      [&_.clinical-note]:bg-primary/5 [&_.clinical-note]:border-l-4 [&_.clinical-note]:border-primary [&_.clinical-note]:p-4 [&_.clinical-note]:my-6 [&_.clinical-note]:rounded-r-lg
                      [&_.clinical-note_h4]:text-primary [&_.clinical-note_h4]:font-bold [&_.clinical-note_h4]:mb-2 [&_.clinical-note_h4]:mt-0"
                    dangerouslySetInnerHTML={{ __html: currentModule?.content ?? "" }} 
                  />
                  
                  <div className="mt-10 pt-6 border-t flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentModuleIndex(Math.max(0, currentModuleIndex - 1))}
                      disabled={currentModuleIndex === 0}
                    >
                      Previous
                    </Button>
                    
                    {quiz && enrollment?.enrollmentStatus !== 'completed' ? (
                      <Button onClick={() => setShowQuiz(true)} className="px-8 bg-primary hover:bg-primary/90 shadow-sm">
                        Take Module Quiz
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleModuleComplete} 
                        className={`px-8 shadow-sm ${isLastModule ? 'bg-slate-900 hover:bg-slate-800' : 'bg-primary hover:bg-primary/90'}`}
                      >
                        {isLastModule ? (enrollment?.enrollmentStatus === 'completed' ? "Exit Review" : "Finish & Review") : "Next Module"}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-md">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle>Module Quiz: {quiz?.title}</CardTitle>
              <p className="text-sm text-muted-foreground">Pass with {quiz?.passingScore}% or higher</p>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              {quiz?.questions.map((q: any, qIdx: number) => (
                <div key={qIdx} className="space-y-4">
                  <p className="font-medium text-base">{qIdx + 1}. {q.question}</p>
                  <div className="grid gap-2 ml-2">
                    {q.options.map((opt: string, oIdx: number) => {
                      const isCorrect = JSON.parse(q.correctAnswer) === opt;
                      const isSelected = quizAnswers[qIdx] === opt;
                      
                      return (
                        <label 
                          key={oIdx} 
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                            ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}
                            ${quizSubmitted && isCorrect ? 'border-green-500 bg-green-50' : ''}
                            ${quizSubmitted && isSelected && !isCorrect ? 'border-destructive bg-destructive/5' : ''}
                          `}
                        >
                          <input
                            type="radio"
                            name={`q-${qIdx}`}
                            className="w-4 h-4 text-primary"
                            checked={isSelected}
                            onChange={() => !quizSubmitted && setQuizAnswers({...quizAnswers, [qIdx]: opt})}
                            disabled={quizSubmitted}
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                  {quizSubmitted && (
                    <div className={`text-sm p-3 rounded-md flex gap-2 ${JSON.parse(q.correctAnswer) === quizAnswers[qIdx] ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {JSON.parse(q.correctAnswer) === quizAnswers[qIdx] ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
                      <p><strong>Explanation:</strong> {q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-6 border-t flex flex-col gap-4">
                {quizSubmitted ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className={`text-center p-6 rounded-xl w-full ${quizScore! >= (quiz?.passingScore ?? 80) ? 'bg-green-100' : 'bg-destructive/10'}`}>
                      <p className="text-sm font-medium mb-1">Your Score</p>
                      <p className="text-4xl font-bold">{quizScore}%</p>
                      <p className="text-sm mt-2">
                        {quizScore! >= (quiz?.passingScore ?? 80) ? "🎉 You passed!" : "Keep studying and try again."}
                      </p>
                    </div>
                    
                    <div className="flex gap-3 w-full">
                      <Button variant="outline" className="flex-1" onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}>Retry Quiz</Button>
                      {quizScore! >= (quiz?.passingScore ?? 80) && (
                        <Button className="flex-1" onClick={isLastModule ? () => completeCourse.mutate({ courseId: slug! }) : handleModuleComplete}>
                          {isLastModule ? "Complete Course & Get Certificate" : "Continue to Next Module"}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <Button 
                    className="w-full py-6 text-lg" 
                    onClick={handleQuizSubmit}
                    disabled={Object.keys(quizAnswers).length < (quiz?.questions.length ?? 0) || submitQuiz.isPending}
                  >
                    {submitQuiz.isPending ? <Loader2 className="animate-spin mr-2" /> : "Submit Answers"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
