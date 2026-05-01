import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, ArrowLeft, BookOpen, Award, AlertCircle, 
  CheckCircle2, Download, ChevronRight, ChevronLeft,
  GraduationCap, ListChecks
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function MicroCoursePlayerDB() {
  const { courseId: slug } = useParams<{ courseId: string }>();
  const { isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();

  // Detect if this is an AHA course (numeric slug like "1", "2", "3", "30")
  const numericCourseId = useMemo(() => {
    const n = parseInt(slug, 10);
    return !isNaN(n) && String(n) === slug ? n : null;
  }, [slug]);
  const isAhaCourse = numericCourseId !== null;

  // Extract programType from URL query params (set by AHACourses navigation)
  const programType = useMemo(() => {
    const params = new URLSearchParams(location.split('?')[1] ?? '');
    return params.get('programType') ?? null;
  }, [location]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [showFormativeQuiz, setShowFormativeQuiz] = useState(false);
  const [showSummativeQuiz, setShowSummativeQuiz] = useState(false);
  
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [issuedCertNumber, setIssuedCertNumber] = useState<string | null>(null);
  const [feedbackGate, setFeedbackGate] = useState<{ certificateId: number; certNumber: string } | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  
  // Track progress locally for the session
  const [maxReachedModuleIndex, setMaxReachedModuleIndex] = useState(0);
  const [maxReachedSectionIndex, setMaxReachedSectionIndex] = useState(0);

  // ── Queries ────────────────────────────────────────────────────────────────

  // Path A: Fellowship courses — look up via catalog + title match
  const { data: allMicroCourses, isLoading: catalogLoading } = trpc.courses.listAll.useQuery(undefined, {
    enabled: isAuthenticated && !isAhaCourse,
  });
  const microCourseRow = useMemo(
    () => (!isAhaCourse ? allMicroCourses?.find((c) => c.courseId === slug) : undefined),
    [allMicroCourses, slug, isAhaCourse]
  );
  const { data: fellowshipCourses, isLoading: coursesLoading } = trpc.learning.getCourses.useQuery(
    { programType: "fellowship" },
    { enabled: !!microCourseRow }
  );
  const fellowshipDbCourse = useMemo(
    () => fellowshipCourses?.find((c) => c.title === microCourseRow?.title),
    [fellowshipCourses, microCourseRow]
  );

  // Path B: AHA courses — query getCourseDetails directly by numeric ID
  const { data: ahaCourseDetails, isLoading: ahaDetailsLoading } = trpc.learning.getCourseDetails.useQuery(
    { courseId: numericCourseId ?? 0 },
    { enabled: isAhaCourse && !!numericCourseId }
  );

  // Unified dbCourse: either fellowship or AHA
  const dbCourse = useMemo(() => {
    if (isAhaCourse && ahaCourseDetails) {
      // Wrap AHA course in the same shape as fellowship course
      return {
        id: ahaCourseDetails.id,
        courseId: String(ahaCourseDetails.id),
        title: ahaCourseDetails.title,
        level: (ahaCourseDetails as any).level ?? 'Intermediate',
        duration: (ahaCourseDetails as any).duration ?? 60,
        programType: (ahaCourseDetails as any).programType ?? programType ?? 'bls',
      };
    }
    return fellowshipDbCourse ?? null;
  }, [isAhaCourse, ahaCourseDetails, fellowshipDbCourse, programType]);

  // Unified courseDetails: for AHA use ahaCourseDetails, for fellowship use the separate query
  const { data: fellowshipCourseDetails, isLoading: detailsLoading } = trpc.learning.getCourseDetails.useQuery(
    { courseId: fellowshipDbCourse?.id ?? 0 },
    { enabled: !!fellowshipDbCourse && !isAhaCourse }
  );
  const courseDetails = isAhaCourse ? ahaCourseDetails : fellowshipCourseDetails;

  const currentModuleId = useMemo(() => {
    return courseDetails?.modules?.[currentModuleIndex]?.id;
  }, [courseDetails, currentModuleIndex]);

  const { data: moduleContent, isLoading: contentLoading } = trpc.learning.getModuleContent.useQuery(
    { moduleId: currentModuleId ?? 0 },
    { enabled: !!currentModuleId }
  );

  const { data: myEnrollments } = trpc.courses.getUserEnrollments.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: myAhaEnrollments } = trpc.courses.getMyAhaEnrollments.useQuery(undefined, {
    enabled: isAuthenticated && isAhaCourse,
  });

  const enrollment = useMemo(() => {
    if (isAhaCourse) {
      // For AHA courses, find enrollment by programType
      const pt = programType ?? (numericCourseId === 1 ? 'bls' : numericCourseId === 2 ? 'acls' : numericCourseId === 3 ? 'pals' : 'heartsaver');
      return myAhaEnrollments?.find((e: any) => e.programType === pt) as any;
    }
    return myEnrollments?.find((e) => e.course?.courseId === slug);
  }, [isAhaCourse, myAhaEnrollments, myEnrollments, slug, programType, numericCourseId]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const markAhaCognitive = trpc.courses.markAhaCognitiveComplete.useMutation({
    onSuccess: (data) => {
      if (data.success && data.certificateNumber) {
        setIssuedCertNumber(data.certificateNumber);
        toast.success(`Cognitive certificate issued! #${data.certificateNumber}`);
      }
    },
  });

  const completeCourse = trpc.courses.complete.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        if (data.certificateNumber) {
          setIssuedCertNumber(data.certificateNumber);
          toast.success(`Certificate issued! #${data.certificateNumber}`);
        } else {
          toast.success("Course completed!");
        }
      } else {
        toast.error(data.message || "Failed to complete course");
      }
    },
  });

  const downloadCert = trpc.certificates.download.useMutation();
  const submitFeedbackMutation = trpc.certificates.submitDownloadFeedback.useMutation();

  const handleDownload = (certNumber: string) => {
    downloadCert.mutate(
      { certificateNumber: certNumber },
      {
        onSuccess: (res) => {
          if (res.success && res.pdfBase64) {
            try {
              const byteCharacters = atob(res.pdfBase64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'application/pdf' });
              const blobUrl = URL.createObjectURL(blob);
              
              const a = document.createElement("a");
              a.href = blobUrl;
              a.download = res.filename || `certificate-${certNumber}.pdf`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(blobUrl);
              toast.success("Certificate downloaded!");
            } catch (err) {
              console.error("PDF download error:", err);
              toast.error("Failed to process certificate file.");
            }
          } else if ((res as any).error === 'feedback_required' && (res as any).certificateId) {
            setFeedbackGate({ certificateId: (res as any).certificateId, certNumber: certNumber });
          } else {
            toast.error((res as any).error || "Download failed.");
          }
        },
        onError: (e) => toast.error(e.message || "Download failed."),
      }
    );
  };

  const submitQuizMutation = trpc.learning.recordQuizAttempt.useMutation({
    onSuccess: (result) => {
      if (result.success && result.passed) {
        toast.success(showSummativeQuiz ? "Final exam passed!" : "Module quiz passed!");
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
  const modules = courseDetails?.modules ?? [];
  const sections = moduleContent?.sections ?? [];
  const quizzes = moduleContent?.quizzes ?? [];
  const isLastModule = currentModuleIndex === modules.length - 1;
  const isReviewMode = enrollment?.enrollmentStatus === 'completed' || location.includes('review=true');

  const handleNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      const nextIdx = currentSectionIndex + 1;
      setCurrentSectionIndex(nextIdx);
      if (nextIdx > maxReachedSectionIndex) {
        setMaxReachedSectionIndex(nextIdx);
      }
      window.scrollTo(0, 0);
    } else if (quizzes.length > 0) {
      // Show formative quiz after last section
      setShowFormativeQuiz(true);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
      window.scrollTo(0, 0);
    } else {
      // No quiz, move to next module
      handleModuleTransition();
    }
  };

  const handleModuleTransition = () => {
    if (currentModuleIndex < modules.length - 1) {
      const nextIdx = currentModuleIndex + 1;
      setCurrentModuleIndex(nextIdx);
      setCurrentSectionIndex(0);
      setMaxReachedSectionIndex(0);
      setShowFormativeQuiz(false);
      if (nextIdx > maxReachedModuleIndex) {
        setMaxReachedModuleIndex(nextIdx);
      }
      window.scrollTo(0, 0);
    } else {
      // Final module complete, show final summative quiz
      setShowSummativeQuiz(true);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
      window.scrollTo(0, 0);
    }
  };

  const handleQuizSubmit = () => {
    const quiz = quizzes[0]; // Currently support one quiz per module
    if (!quiz || !enrollment) return;

    let correct = 0;
    quiz.questions.forEach((q: any, idx: number) => {
      const userAnswer = quizAnswers[idx];
      const correctAnswer = typeof q.correctAnswer === 'string' ? JSON.parse(q.correctAnswer) : q.correctAnswer;
      if (userAnswer === correctAnswer) correct++;
    });

    const score = Math.round((correct / quiz.questions.length) * 100);
    
    submitQuizMutation.mutate({
      enrollmentId: enrollment.id,
      moduleId: currentModuleId!,
      quizId: quiz.id,
      score,
      answers: quizAnswers,
    });
  };

  const handleFinalSubmit = () => {
    if (!dbCourse) return;
    if (isAhaCourse) {
      // AHA: issue cognitive gatepass certificate
      const pt = (dbCourse as any).programType ?? programType ?? 'bls';
      const enrollmentId = (enrollment as any)?.id ?? 0;
      markAhaCognitive.mutate({ enrollmentId, programType: pt });
    } else {
      completeCourse.mutate({ courseId: dbCourse.courseId });
    }
  };

  // ── Loading States ─────────────────────────────────────────────────────────
  const isLoading = isAhaCourse
    ? ahaDetailsLoading
    : (catalogLoading || coursesLoading || detailsLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading interactive experience...</p>
        </div>
      </div>
    );
  }

  if (!dbCourse || (!isAhaCourse && !microCourseRow)) {
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Content Not Found</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          This course is not yet available in the interactive format.
        </p>
        <Button onClick={() => navigate(isAhaCourse ? "/aha-courses" : "/fellowship")}>Go Back</Button>
      </div>
    );
  }

  // ── Completion View ────────────────────────────────────────────────────────
  if (completeCourse.isSuccess || markAhaCognitive.isSuccess) {
    const submitFeedbackAndDownload = () => {
      if (!feedbackGate) return;
      if (feedbackRating === 0) { toast.error('Please select a star rating.'); return; }
      if (feedbackText.trim().length < 10) { toast.error('Please write at least 10 characters of feedback.'); return; }
      submitFeedbackMutation.mutate(
        {
          certificateId: feedbackGate.certificateId,
          rating: feedbackRating,
          improvements: feedbackText,
        },
        {
          onSuccess: (result) => {
            if (result.success) {
              const certNum = feedbackGate.certNumber;
              setFeedbackGate(null);
              handleDownload(certNum);
            } else {
              toast.error((result as any).error || 'Failed to submit feedback. Please try again.');
            }
          },
          onError: (e) => toast.error(e.message || 'Failed to submit feedback.'),
        }
      );
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        {feedbackGate ? (
          <Card className="max-w-md w-full shadow-xl border-none">
            <CardContent className="pt-10 pb-8 px-8">
              <h2 className="text-xl font-bold text-slate-900 mb-2 text-center">One quick step before your certificate</h2>
              <p className="text-slate-500 text-sm mb-6 text-center">Your feedback helps us improve clinical education for providers across Africa.</p>
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">How would you rate this course?</p>
                <div className="flex gap-2 justify-center">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setFeedbackRating(n)}
                      className={`w-10 h-10 rounded-full border-2 font-bold text-sm transition-all ${
                        feedbackRating >= n ? 'bg-yellow-400 border-yellow-400 text-white' : 'border-slate-200 text-slate-400 hover:border-yellow-300'
                      }`}>{n}★</button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-700 mb-2">What could be improved?</p>
                <textarea
                  className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                  placeholder="Share your thoughts on the content, clarity, or clinical relevance..."
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                />
              </div>
              <Button className="w-full py-4 font-bold" onClick={submitFeedbackAndDownload} disabled={submitFeedbackMutation.isPending || downloadCert.isPending}>
                {(submitFeedbackMutation.isPending || downloadCert.isPending) ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
                Submit & Download Certificate
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-md w-full shadow-xl border-none">
            <CardContent className="pt-10 pb-8 px-8 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Course Completed!</h2>
              <p className="text-slate-600 mb-8">
                Congratulations! You have successfully completed <strong>{dbCourse.title}</strong>.
              </p>
              {issuedCertNumber && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-8">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Certificate Number</p>
                  <p className="text-lg font-mono font-bold text-primary">{issuedCertNumber}</p>
                </div>
              )}
              <div className="flex flex-col gap-3">
                {issuedCertNumber && (
                  <Button 
                    className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2"
                    onClick={() => handleDownload(issuedCertNumber)}
                    disabled={downloadCert.isPending}
                  >
                    {downloadCert.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    Download My Certificate
                  </Button>
                )}
                <Button 
                  variant="outline"
                  className="w-full py-6 border-slate-200 text-slate-700 font-semibold"
                  onClick={() => navigate("/fellowship?tab=certificates")}
                >
                  View My Certificates
                </Button>
                <Button 
                  variant="ghost"
                  className="w-full py-4 text-slate-500 font-medium"
                  onClick={() => navigate("/fellowship")}
                >
                  Return to Fellowship Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const currentModule = modules[currentModuleIndex];
  const currentSection = sections[currentSectionIndex];
  const currentQuiz = quizzes[0]; // Formative quiz for the module

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/fellowship")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-slate-900 line-clamp-1">{dbCourse.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 uppercase font-bold tracking-wider">
                  {dbCourse.level}
                </Badge>
                {isReviewMode && (
                  <Badge className="text-[10px] h-4 px-1.5 bg-emerald-500 text-white border-none">Review Mode</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <Progress 
              value={((currentModuleIndex) / modules.length) * 100} 
              className="w-32 h-2" 
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        {/* Step-by-Step Navigation */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {modules.map((m, idx) => (
            <div key={m.id} className="flex items-center">
              <button
                onClick={() => {
                  if (idx <= maxReachedModuleIndex || isReviewMode) {
                    setCurrentModuleIndex(idx);
                    setCurrentSectionIndex(0);
                    setShowFormativeQuiz(false);
                    setShowSummativeQuiz(false);
                  }
                }}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all",
                  idx === currentModuleIndex 
                    ? "bg-primary text-white ring-4 ring-primary/20" 
                    : idx < currentModuleIndex || idx <= maxReachedModuleIndex
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-500 cursor-not-allowed"
                )}
              >
                {idx < currentModuleIndex ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </button>
              {idx < modules.length - 1 && (
                <div className={cn(
                  "w-4 h-0.5 mx-1",
                  idx < currentModuleIndex ? "bg-emerald-200" : "bg-slate-200"
                )} />
              )}
            </div>
          ))}
          <div className="mx-2 text-slate-300">|</div>
          <div 
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all",
              showSummativeQuiz 
                ? "bg-primary text-white ring-4 ring-primary/20" 
                : isLastModule && (maxReachedSectionIndex >= sections.length - 1 || isReviewMode)
                  ? "bg-slate-100 text-slate-600"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            <GraduationCap className="w-4 h-4" />
          </div>
        </div>

        {/* Content Area */}
        {showSummativeQuiz ? (
          <SummativeQuizView 
            course={dbCourse}
            quiz={currentQuiz} // For now use module quiz as summative proxy if needed
            onComplete={handleFinalSubmit}
            isPending={completeCourse.isPending}
          />
        ) : showFormativeQuiz ? (
          <FormativeQuizView 
            moduleTitle={currentModule?.title ?? ""}
            quiz={currentQuiz}
            answers={quizAnswers}
            setAnswers={setQuizAnswers}
            onSubmit={handleQuizSubmit}
            submitted={quizSubmitted}
            score={quizScore}
            onNext={handleModuleTransition}
            isPending={submitQuizMutation.isPending}
          />
        ) : (
          <div className="space-y-6">
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-white border-b border-slate-100 py-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    Module {currentModuleIndex + 1} • Section {currentSectionIndex + 1} of {sections.length || 1}
                  </span>
                  {sections.length > 1 && (
                    <div className="flex gap-1">
                      {sections.map((_, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "h-1 w-4 rounded-full transition-all",
                            i === currentSectionIndex ? "bg-primary w-8" : i < currentSectionIndex ? "bg-emerald-400" : "bg-slate-200"
                          )} 
                        />
                      ))}
                    </div>
                  )}
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  {currentSection?.title || currentModule?.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 pb-10 px-6 md:px-10">
                {contentLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary/30 mb-4" />
                    <p className="text-slate-400 text-sm italic">Loading clinical guidance...</p>
                  </div>
                ) : (
                  <div 
                    className="module-content max-w-none"
                    dangerouslySetInnerHTML={{ __html: currentSection?.content || currentModule?.content || "" }} 
                  />
                )}
              </CardContent>
              <CardFooter className="bg-muted/30 border-t border-border p-6 flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  className="text-muted-foreground font-semibold"
                  onClick={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
                  disabled={currentSectionIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                <Button 
                  className="px-8 py-6 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all active:scale-95"
                  onClick={handleNextSection}
                >
                  {currentSectionIndex < sections.length - 1 ? (
                    <>Next Section <ChevronRight className="w-5 h-5 ml-2" /></>
                  ) : quizzes.length > 0 ? (
                    <>Knowledge Check <ListChecks className="w-5 h-5 ml-2" /></>
                  ) : (
                    <>Next Module <ChevronRight className="w-5 h-5 ml-2" /></>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Context Helper */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-6 flex gap-4">
              <div className="bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-1">Learning Tip</h4>
                <p className="text-sm text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                  Focus on the "Clinical Notes" in this section. These contain the high-yield resuscitation parameters 
                  required for the fellowship examination and real-world bedside performance.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-Components ───────────────────────────────────────────────────────────

function FormativeQuizView({ 
  moduleTitle, quiz, answers, setAnswers, onSubmit, 
  submitted, score, onNext, isPending 
}: any) {
  if (!quiz) return null;

  return (
    <Card className="border-none shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="bg-primary text-primary-foreground p-8">
        <div className="flex items-center gap-2 text-primary-400 mb-2">
          <ListChecks className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest opacity-80">Knowledge Check</span>
        </div>
        <CardTitle className="text-2xl font-bold">Review: {moduleTitle}</CardTitle>
        <p className="text-primary-foreground/70 text-sm mt-2">
          Test your understanding of the concepts covered in this module. 
          Passing score: <span className="text-white font-bold">{quiz.passingScore}%</span>
        </p>
      </CardHeader>
      <CardContent className="p-8 space-y-10">
        {quiz.questions.map((q: any, idx: number) => (
          <div key={q.id} className="space-y-4">
            <div className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-muted rounded-lg flex items-center justify-center font-bold text-muted-foreground text-sm">
                {idx + 1}
              </span>
              <h3 className="text-lg font-semibold text-foreground leading-snug">{q.question}</h3>
            </div>
            <div className="grid gap-3 ml-12">
              {q.options.map((option: string) => {
                const isSelected = answers[idx] === option;
                const isCorrect = submitted && option === (typeof q.correctAnswer === 'string' ? JSON.parse(q.correctAnswer) : q.correctAnswer);
                const isWrong = submitted && isSelected && !isCorrect;

                return (
                  <button
                    key={option}
                    disabled={submitted}
                    onClick={() => setAnswers({ ...answers, [idx]: option })}
                    className={cn(
                      "text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group",
                      isSelected && !submitted ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-muted-foreground/30",
                      isCorrect ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "",
                      isWrong ? "border-red-500 bg-red-50 text-red-700" : ""
                    )}
                  >
                    <span className="font-medium">{option}</span>
                    {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    {isWrong && <AlertCircle className="w-5 h-5 text-red-600" />}
                  </button>
                );
              })}
            </div>
            {submitted && q.explanation && (
              <div className="ml-12 p-4 bg-muted rounded-xl text-sm text-muted-foreground italic border-l-4 border-border">
                <strong>Rationale:</strong> {q.explanation}
              </div>
            )}
          </div>
        ))}
      </CardContent>
      <CardFooter className="p-8 bg-muted/30 border-t border-border flex flex-col gap-6">
        {!submitted ? (
          <Button 
            className="w-full py-8 rounded-2xl font-bold text-xl shadow-xl shadow-primary/20"
            disabled={Object.keys(answers).length < quiz.questions.length || isPending}
            onClick={onSubmit}
          >
            {isPending ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null}
            Submit Answers
          </Button>
        ) : (
          <div className="w-full text-center space-y-6">
            <div className={cn(
              "inline-flex flex-col items-center p-6 rounded-2xl border-2",
              score >= quiz.passingScore ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"
            )}>
              <span className="text-sm font-bold uppercase tracking-widest mb-1">Your Score</span>
              <span className="text-5xl font-black">{score}%</span>
              <span className="text-sm font-medium mt-2">
                {score >= quiz.passingScore ? "Great job! You've mastered this module." : "Keep studying and try again."}
              </span>
            </div>
            
            {score >= quiz.passingScore ? (
              <Button 
                className="w-full py-8 rounded-2xl font-bold text-xl bg-emerald-600 hover:bg-emerald-700"
                onClick={onNext}
              >
                Continue to Next Module
              </Button>
            ) : (
              <Button 
                variant="outline"
                className="w-full py-8 rounded-2xl font-bold text-xl border-border"
                onClick={() => {
                  setAnswers({});
                  onNext(); // Or allow retry
                }}
              >
                Retry Knowledge Check
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

function SummativeQuizView({ course, quiz, onComplete, isPending }: any) {
  return (
    <Card className="border-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
      <div className="bg-primary p-12 text-center text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Award className="w-48 h-48 rotate-12" />
        </div>
        <GraduationCap className="w-16 h-16 mx-auto mb-6 text-primary-200" />
        <h2 className="text-3xl font-black mb-2">Final Verification</h2>
        <p className="text-primary-100 max-w-md mx-auto">
          You have completed all learning modules for <strong>{course.title}</strong>. 
          Submit your final assessment to receive your Paeds Resus Fellowship certificate.
        </p>
      </div>
      <CardContent className="p-12 text-center space-y-8">
        <div className="flex justify-center gap-12">
          <div className="text-center">
            <p className="text-4xl font-black text-foreground">100%</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Content Read</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-black text-foreground">{course.duration}m</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Time Invested</p>
          </div>
        </div>
        
        <div className="p-8 bg-muted/30 rounded-3xl border-2 border-dashed border-border">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h4 className="font-bold text-foreground text-lg mb-2">Ready for Certification</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            By clicking below, you confirm that you have reviewed all clinical protocols and are ready 
            to be recognized as a Paeds Resus verified provider for this specialty.
          </p>
        </div>

        <Button 
          className="w-full py-10 rounded-3xl font-black text-2xl shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
          onClick={onComplete}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="w-8 h-8 animate-spin mr-3" /> : <Award className="w-8 h-8 mr-3" />}
          Issue My Certificate
        </Button>
      </CardContent>
    </Card>
  );
}
