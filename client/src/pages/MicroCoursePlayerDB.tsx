import { Link, useParams, useLocation, useSearch } from "wouter";
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
  GraduationCap, ListChecks, Lock, HelpCircle
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { getAnalyticsSessionId } from "@/lib/analytics-session";
import { cn } from "@/lib/utils";
import { sanitizeCourseHtml } from "@/lib/sanitizeCourseHtml";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { isAhaProgramSlug, type AhaProgramType } from "@/lib/providerCourseRoutes";
import { AhaCertificationPath } from "@/components/AhaCertificationPath";
import { UniversalCapstone } from "@/components/UniversalCapstone";
import { FellowshipSimulation } from "@/components/FellowshipSimulation";
import { formatCognitiveCourseworkDuration } from "@/const/aha-course-metadata";
import {
  examKindFromQuizTitle,
  dedupeQuizRowsByStem,
  shuffleQuestionsDisplayOptions,
} from "@shared/microcourse-exam-policy";
import { resolveFellowshipCourseFromCandidates } from "@shared/resolve-fellowship-course";
import {
  formatPrerequisiteHint,
  microCourseTrackLabel,
  type MicroCourseTier,
} from "@shared/micro-course-display";
import { ClinicalContentSafetyFooter } from "@/components/ClinicalContentSafetyFooter";
import { SummativeRetryBlockedBanner } from "@/components/SummativeRetryBlockedBanner";
import { examPolicyHref } from "@shared/exam-policy-learner-content";
import type { SummativeBlockKind } from "@shared/microcourse-exam-policy";

type MicroCourseCatalogRow = inferRouterOutputs<AppRouter>["courses"]["listAll"][number];
type FellowshipCatalogRow = inferRouterOutputs<AppRouter>["learning"]["getCourses"][number];
type CourseModuleRow = NonNullable<
  NonNullable<inferRouterOutputs<AppRouter>["learning"]["getCourseDetails"]>["modules"]
>[number];

export default function MicroCoursePlayerDB() {
  const { courseId: routeSlug } = useParams<{ courseId: string }>();
  const { isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const search = useSearch();

  // `/micro-course/:courseId` or legacy `/course/bls` style paths (no :courseId param)
  const slug = useMemo(() => {
    if (routeSlug) return routeSlug;
    const pathOnly = location.split("?")[0] ?? "";
    const legacy = pathOnly.match(/\/course\/(bls|acls|pals|heartsaver|nrp)$/);
    return legacy?.[1] ?? routeSlug;
  }, [routeSlug, location]);

  const numericCourseId = useMemo(() => {
    if (!slug) return null;
    const n = parseInt(slug, 10);
    return !isNaN(n) && String(n) === slug ? n : null;
  }, [slug]);

  const ahaProgramFromSlug = useMemo((): AhaProgramType | null => {
    if (slug && isAhaProgramSlug(slug)) return slug;
    return null;
  }, [slug]);

  const isAhaCourse = numericCourseId !== null || ahaProgramFromSlug !== null;
  const coursesHubPath = isAhaCourse ? "/aha-courses" : "/fellowship";
  const coursesHubReturnLabel = isAhaCourse ? "Return to AHA Courses" : "Return to Fellowship Dashboard";

  const programType = useMemo(() => {
    const params = new URLSearchParams(search);
    const fromQuery = params.get("programType");
    if (fromQuery && isAhaProgramSlug(fromQuery)) return fromQuery;
    return ahaProgramFromSlug;
  }, [search, ahaProgramFromSlug]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [showFormativeQuiz, setShowFormativeQuiz] = useState(false);
  const [showDiagnosticQuiz, setShowDiagnosticQuiz] = useState(false);
  const [showSummativeExam, setShowSummativeExam] = useState(false);
  const [showCapstoneSim, setShowCapstoneSim] = useState(false);
  const [showFellowshipSim, setShowFellowshipSim] = useState(false);
  const [showCertificateReady, setShowCertificateReady] = useState(false);
  
  // Persistence for capstone
  useEffect(() => {
    const inProgress = localStorage.getItem(`capstone-in-progress-${slug}`);
    if (inProgress === "true" && !showCertificateReady && !showCapstoneSim) {
      setShowCapstoneSim(true);
    }
  }, [slug, showCertificateReady, showCapstoneSim]);
  
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizQuestionResults, setQuizQuestionResults] = useState<
    Record<number, { correct: boolean; correctOption: string }>
  >({});
  const [issuedCertNumber, setIssuedCertNumber] = useState<string | null>(null);
  const [feedbackGate, setFeedbackGate] = useState<{ certificateId: number; certNumber: string } | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  
  // Track progress — persisted to localStorage so resume works on page refresh
  const progressKey = `course-progress-${slug}`;
  const [maxReachedModuleIndex, setMaxReachedModuleIndex] = useState(() => {
    try { return parseInt(localStorage.getItem(progressKey + '-module') ?? '0', 10) || 0; } catch { return 0; }
  });
  const [maxReachedSectionIndex, setMaxReachedSectionIndex] = useState(0);
  const [backToLastSectionOfModule, setBackToLastSectionOfModule] = useState(false);

  // Capstone state persistence
  const [capstoneInProgress, setCapstoneInProgress] = useState(() => {
    try { return localStorage.getItem(progressKey + '-capstone-in-progress') === 'true'; } catch { return false; }
  });

  // Persist maxReachedModuleIndex whenever it advances
  useEffect(() => {
    try { localStorage.setItem(progressKey + '-module', String(maxReachedModuleIndex)); } catch {}
  }, [maxReachedModuleIndex, progressKey]);

  // Persist capstone state
  useEffect(() => {
    try { localStorage.setItem(progressKey + '-capstone-in-progress', String(capstoneInProgress)); } catch {}
  }, [capstoneInProgress, progressKey]);

  // Capstone should not be auto-restored on mount to avoid trapping the user.
  // It will be triggered manually when reaching the end of modules.

  // ── Queries ────────────────────────────────────────────────────────────────

  // Path A: Fellowship courses — look up via catalog + title match
  const { data: allMicroCourses, isLoading: catalogLoading } = trpc.courses.listAll.useQuery(undefined, {
    enabled: isAuthenticated && !isAhaCourse,
  });
  const catalogTitleBySlug = useMemo(() => {
    const map: Record<string, string> = {};
    allMicroCourses?.forEach((c) => {
      map[c.courseId] = c.title;
    });
    return map;
  }, [allMicroCourses]);
  const microCourseRow = useMemo(
    () =>
      !isAhaCourse ? allMicroCourses?.find((c: MicroCourseCatalogRow) => c.courseId === slug) : undefined,
    [allMicroCourses, slug, isAhaCourse]
  );
  const { data: fellowshipCourses, isLoading: coursesLoading } = trpc.learning.getCourses.useQuery(
    { programType: "fellowship" },
    { enabled: !!microCourseRow }
  );
  const fellowshipDbCourse = useMemo(() => {
    if (!microCourseRow || !fellowshipCourses?.length) return undefined;
    return resolveFellowshipCourseFromCandidates<FellowshipCatalogRow>(fellowshipCourses, {
      title: microCourseRow.title,
      order: microCourseRow.order,
    });
  }, [fellowshipCourses, microCourseRow]);

  const ahaProgram = programType ?? ahaProgramFromSlug;

  // Path B: AHA — programType resolves stale numeric ids (e.g. /micro-course/1?programType=bls)
  const { data: ahaCourseDetails, isLoading: ahaDetailsLoading, isError: ahaDetailsError } =
    trpc.learning.getCourseDetails.useQuery(
      {
        courseId: numericCourseId ?? 0,
        programType: ahaProgram ?? undefined,
      },
      { enabled: isAhaCourse && !!ahaProgram }
    );

  // Replace legacy hardcoded ids (/micro-course/1) with the real catalog id
  useEffect(() => {
    if (!ahaCourseDetails?.id || !ahaProgram || numericCourseId === null) return;
    if (numericCourseId === ahaCourseDetails.id) return;
    const qs = new URLSearchParams(search);
    qs.set("programType", ahaProgram);
    navigate(`/micro-course/${ahaCourseDetails.id}?${qs.toString()}`, { replace: true });
  }, [ahaCourseDetails?.id, ahaProgram, numericCourseId, search, navigate]);

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
    // Fellowship: learning content lives on `courses` (numeric id) but
    // courses.complete expects microCourses.courseId slug (e.g. asthma-i).
    if (fellowshipDbCourse && microCourseRow) {
      return {
        id: fellowshipDbCourse.id,
        courseId: microCourseRow.courseId,
        title: fellowshipDbCourse.title ?? microCourseRow.title,
        level: microCourseRow.level ?? 'foundational',
        duration: microCourseRow.duration ?? fellowshipDbCourse.duration ?? 45,
      };
    }
    return null;
  }, [isAhaCourse, ahaCourseDetails, fellowshipDbCourse, microCourseRow, programType]);

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

  const firstModuleId = courseDetails?.modules?.[0]?.id;
  const { data: firstModuleContent } = trpc.learning.getModuleContent.useQuery(
    { moduleId: firstModuleId ?? 0 },
    { enabled: !!firstModuleId }
  );

  const { data: myEnrollments } = trpc.courses.getUserEnrollments.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: myAhaEnrollments } = trpc.courses.getMyAhaEnrollments.useQuery(undefined, {
    enabled: isAuthenticated && isAhaCourse,
  });

  const prerequisiteBlocked = useMemo(() => {
    if (isAhaCourse || !microCourseRow?.prerequisiteId) return false;
    const prereqSlug = microCourseRow.prerequisiteId;
    const prereq = myEnrollments?.find((e) => e.course?.courseId === prereqSlug);
    return prereq?.enrollmentStatus !== "completed";
  }, [isAhaCourse, microCourseRow, myEnrollments]);

  const enrollment = useMemo(() => {
    if (isAhaCourse) {
      const pt =
        ahaProgram ??
        ((ahaCourseDetails as { programType?: string } | undefined)?.programType as AhaProgramType | undefined) ??
        "bls";
      return myAhaEnrollments?.find((e: any) => e.programType === pt) as any;
    }
    return myEnrollments?.find((e) => e.course?.courseId === slug);
  }, [isAhaCourse, myAhaEnrollments, myEnrollments, slug, ahaProgram, ahaCourseDetails]);

  const microEnrollmentId = (enrollment as { id?: number } | undefined)?.id;
  const { data: examState } = trpc.learning.getMicroCourseExamState.useQuery(
    { enrollmentId: microEnrollmentId ?? 0 },
    { enabled: !!microEnrollmentId }
  );

  const [summativeShuffleSeed, setSummativeShuffleSeed] = useState<number | null>(null);
  const [quizOptionShuffleSeed, setQuizOptionShuffleSeed] = useState<number | null>(null);

  useEffect(() => {
    if (showSummativeExam && summativeShuffleSeed === null) {
      setSummativeShuffleSeed(Date.now());
    }
    if (!showSummativeExam) {
      setSummativeShuffleSeed(null);
    }
  }, [showSummativeExam, summativeShuffleSeed]);

  useEffect(() => {
    const quizOpen = showDiagnosticQuiz || showFormativeQuiz;
    if (quizOpen && quizOptionShuffleSeed === null) {
      setQuizOptionShuffleSeed(Date.now());
    }
    if (!quizOpen) {
      setQuizOptionShuffleSeed(null);
    }
  }, [showDiagnosticQuiz, showFormativeQuiz, quizOptionShuffleSeed]);

  const { data: shuffledSummative } = trpc.learning.getSummativeExamQuestions.useQuery(
    {
      enrollmentId: microEnrollmentId ?? 0,
      summativeQuizId: examState?.summativeQuizId ?? 0,
      shuffleSeed: summativeShuffleSeed ?? undefined,
    },
    {
      enabled:
        showSummativeExam &&
        !!microEnrollmentId &&
        !!examState?.summativeQuizId &&
        summativeShuffleSeed !== null,
    }
  );

  const ahaProgramForUi = useMemo((): AhaProgramType | null => {
    if (!isAhaCourse) return null;
    const pt =
      ahaProgram ??
      ((ahaCourseDetails as { programType?: string } | undefined)?.programType as AhaProgramType | undefined);
    return pt && isAhaProgramSlug(pt) ? pt : null;
  }, [isAhaCourse, ahaProgram, ahaCourseDetails]);

  const ahaCertState = useMemo(() => {
    const enrol = enrollment as {
      cognitiveModulesComplete?: boolean | null;
      practicalSkillsSignedOff?: boolean | null;
    } | undefined;
    const cognitiveComplete = enrol?.cognitiveModulesComplete ?? false;
    const practicalSignedOff = enrol?.practicalSkillsSignedOff ?? false;
    return {
      cognitiveComplete,
      practicalSignedOff,
      certificateIssued: cognitiveComplete && practicalSignedOff,
    };
  }, [enrollment]);

  // ── Resume Progress Query ──────────────────────────────────────────────────
  // Only fire once we have both courseDetails (to know the courseId) and
  // enrollment (to scope progress rows to this enrollment).
  const resumeQuery = trpc.learning.getResumeModule.useQuery(
    {
      courseId: courseDetails?.id ?? 0,
      enrollmentId: (enrollment as any)?.id ?? 0,
    },
    {
      enabled: !!courseDetails?.id && !!(enrollment as any)?.id,
      // Only fetch once on mount — we don't want to jump the user mid-session
      staleTime: Infinity,
    }
  );

  // On first load, jump to the first incomplete module.
  // In review mode (course already completed) we always start from module 1
  // so the user can browse freely instead of landing on the final exam.
  const [hasResumed, setHasResumed] = useState(false);
  const [diagnosticPrompted, setDiagnosticPrompted] = useState(false);
  const isReviewMode = enrollment?.enrollmentStatus === 'completed' || location.includes('review=true');

  useEffect(() => {
    if (isReviewMode || diagnosticPrompted || !examState) return;
    if (examState.diagnosticRequired && !examState.diagnosticCompleted) {
      setShowDiagnosticQuiz(true);
      setDiagnosticPrompted(true);
    }
  }, [examState, isReviewMode, diagnosticPrompted]);

  useEffect(() => {
    if (hasResumed) return;
    if (resumeQuery.data == null) return;
    const { resumeIndex, allCompleted } = resumeQuery.data as { resumeIndex: number; totalModules: number; allCompleted?: boolean };
    // Skip the resume jump when the course is fully completed — review mode
    // always begins at module 1 (index 0) so the user can read from the start.
    if (!allCompleted && resumeIndex > 0) {
      setCurrentModuleIndex(resumeIndex);
      setMaxReachedModuleIndex(resumeIndex);
    }
    // In review mode, unlock all modules so the step-nav is fully clickable.
    if (allCompleted) {
      setMaxReachedModuleIndex(Infinity);
    }
    setHasResumed(true);
  }, [resumeQuery.data, hasResumed]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const utils = trpc.useUtils();
  const ensureMicroEnrollment = trpc.courses.ensureMicroCourseEnrollment.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        void utils.courses.getUserEnrollments.invalidate();
      }
    },
  });

  // Fellowship: auto-create enrollment row on first visit (mirrors AHA path)
  const [ensureEnrollmentAttempted, setEnsureEnrollmentAttempted] = useState(false);
  useEffect(() => {
    if (isAhaCourse || !slug || !isAuthenticated || enrollment || ensureEnrollmentAttempted) return;
    setEnsureEnrollmentAttempted(true);
    ensureMicroEnrollment.mutate({ courseId: slug });
  }, [isAhaCourse, slug, isAuthenticated, enrollment, ensureEnrollmentAttempted, ensureMicroEnrollment]);

  const completeModuleMutation = trpc.learning.completeModule.useMutation({
    onSuccess: () => {
      void utils.courses.getUserEnrollments.invalidate();
    },
  });
  const trackProductActivity = trpc.events.trackEvent.useMutation();

  const markAhaCognitive = trpc.courses.markAhaCognitiveComplete.useMutation({
    onSuccess: (data) => {
      if (data.success && data.certificateNumber) {
        setIssuedCertNumber(data.certificateNumber);
        toast.success(`Cognitive certificate issued! #${data.certificateNumber}`);
      }
      if (data.success) {
        void utils.certificates.getMyCertificates.invalidate();
        void utils.fellowship.getProgress.invalidate();
        trackProductActivity.mutate({
          eventType: "micro_course",
          eventName: "AHA cognitive pathway completed",
          pageUrl: typeof window !== "undefined" ? window.location.pathname : "/micro-course",
          sessionId: getAnalyticsSessionId(),
          eventData: {
            courseSlug: slug,
            programType,
            certificateIssued: !!data.certificateNumber,
          },
        });
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
        void utils.courses.getUserEnrollments.invalidate();
        void utils.certificates.getMyCertificates.invalidate();
        void utils.fellowship.getProgress.invalidate();
        trackProductActivity.mutate({
          eventType: "micro_course",
          eventName: "Micro-course completed",
          pageUrl: typeof window !== "undefined" ? window.location.pathname : "/micro-course",
          sessionId: getAnalyticsSessionId(),
          eventData: {
            courseSlug: slug,
            certificateIssued: !!data.certificateNumber,
          },
        });
      } else {
        toast.error(data.message || "Failed to complete course");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Could not issue certificate. Please try again.");
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

  // AHA-ENROLL-1: Upsert enrollment row before first quiz submit
  const ensureAhaEnrollmentMutation = trpc.courses.ensureAhaEnrollment.useMutation();

  const applyQuizAttemptResult = (result: {
    success: boolean;
    score: number;
    passed: boolean;
    passingScore: number;
    alreadyCompleted?: boolean;
    examKind?: string;
    idempotentReplay?: boolean;
    questionResults?: Array<{
      questionId: number;
      correct: boolean;
      correctOption: string;
    }>;
  }) => {
    if (!result.success) {
      toast.error("Could not save your quiz attempt. Please try again.");
      return;
    }
    const resultsMap: Record<number, { correct: boolean; correctOption: string }> = {};
    for (const r of result.questionResults ?? []) {
      resultsMap[r.questionId] = { correct: r.correct, correctOption: r.correctOption };
    }
    setQuizQuestionResults(resultsMap);
    setQuizScore(typeof result.score === "number" ? result.score : 0);
    setQuizSubmitted(true);
    void utils.courses.getUserEnrollments.invalidate();
    void utils.learning.getMicroCourseExamState.invalidate();
    if (result.examKind === "diagnostic" || showDiagnosticQuiz) {
      if (result.alreadyCompleted) {
        setShowDiagnosticQuiz(false);
        resetQuizState();
        toast.success("Diagnostic already complete — modules unlocked.");
        return;
      }
    }
    if (result.passed) {
      toast.success(
        showSummativeExam
          ? "Summative exam passed!"
          : showDiagnosticQuiz
            ? "Diagnostic saved."
            : "Module quiz passed!"
      );
    } else {
      toast.error(`Score: ${result.score}%. Passing is ${result.passingScore}%`);
    }
  };

  const submitQuizMutation = trpc.learning.recordQuizAttempt.useMutation({
    onSuccess: applyQuizAttemptResult,
    onError: (err) => {
      toast.error(err.message || "Could not submit quiz. Please try again.");
    },
  });

  useEffect(() => {
    if (!submitQuizMutation.isPending) return;
    const timeoutId = window.setTimeout(() => {
      toast.error(
        "Submit is taking longer than expected. Check your connection — your answers may still be saving."
      );
    }, 45_000);
    return () => window.clearTimeout(timeoutId);
  }, [submitQuizMutation.isPending]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const modules = (courseDetails?.modules ?? []) as CourseModuleRow[];
  const sections = moduleContent?.sections ?? [];
  const quizzes = moduleContent?.quizzes ?? [];
  const isLastModule = currentModuleIndex === modules.length - 1;
  const diagnosticQuiz = useMemo(() => {
    const list = firstModuleContent?.quizzes ?? [];
    return list.find((q: { title?: string }) => examKindFromQuizTitle(q.title) === "diagnostic") ?? list[0];
  }, [firstModuleContent]);
  const summativeQuiz = useMemo(() => {
    const base =
      quizzes.find((q: { title?: string }) => examKindFromQuizTitle(q.title) === "summative") ??
      quizzes.find((q: { title?: string }) => examKindFromQuizTitle(q.title) !== "diagnostic");
    if (!showSummativeExam || !shuffledSummative || !base) return base;
    return {
      ...base,
      passingScore: shuffledSummative.passPercent,
      questions: shuffledSummative.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        explanation: q.explanation,
      })),
    };
  }, [quizzes, showSummativeExam, shuffledSummative]);
  const activeQuiz = showDiagnosticQuiz
    ? diagnosticQuiz
    : showSummativeExam
      ? summativeQuiz
      : quizzes.find((q: { title?: string }) => examKindFromQuizTitle(q.title) === "formative");

  const displayQuiz = useMemo(() => {
    if (!activeQuiz?.questions?.length) return activeQuiz;
    const deduped = dedupeQuizRowsByStem(
      activeQuiz.questions.map((q: { id?: number; question?: string }) => ({
        ...q,
        question: q.question ?? "",
      }))
    );
    const base =
      deduped.length === activeQuiz.questions.length
        ? activeQuiz
        : { ...activeQuiz, questions: deduped };
    // Summative options are shuffled server-side via getSummativeExamQuestions.
    if (showSummativeExam || !quizOptionShuffleSeed) return base;
    return {
      ...base,
      questions: shuffleQuestionsDisplayOptions(base.questions, quizOptionShuffleSeed),
    };
  }, [activeQuiz, showSummativeExam, quizOptionShuffleSeed]);
  const isSummativeExamActive =
    showSummativeExam || examKindFromQuizTitle(activeQuiz?.title) === "summative";

  useEffect(() => {
    if (!backToLastSectionOfModule || contentLoading || !currentModuleId) return;
    const lastSectionIdx = sections.length > 0 ? sections.length - 1 : 0;
    setCurrentSectionIndex(lastSectionIdx);
    setBackToLastSectionOfModule(false);
    window.scrollTo(0, 0);
  }, [backToLastSectionOfModule, contentLoading, currentModuleId, sections.length]);

  const resetQuizState = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setQuizQuestionResults({});
  };

  const goToPreviousStep = (exitAtStart: boolean) => {
    if (showCertificateReady || showSummativeExam || showCapstoneSim || showFellowshipSim) {
      setShowCertificateReady(false);
      setShowSummativeExam(false);
      setShowCapstoneSim(false);
      setShowFellowshipSim(false);
      setShowFormativeQuiz(false);
      resetQuizState();
      setCurrentModuleIndex(Math.max(0, modules.length - 1));
      setBackToLastSectionOfModule(true);
      return;
    }
    if (showDiagnosticQuiz) {
      setShowDiagnosticQuiz(false);
      resetQuizState();
      return;
    }
    if (showFormativeQuiz) {
      setShowFormativeQuiz(false);
      resetQuizState();
      setCurrentSectionIndex(sections.length > 0 ? sections.length - 1 : 0);
      window.scrollTo(0, 0);
      return;
    }
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      window.scrollTo(0, 0);
      return;
    }
    if (currentModuleIndex > 0) {
      setShowFormativeQuiz(false);
      setShowSummativeExam(false);
      setShowCertificateReady(false);
      setCurrentModuleIndex(currentModuleIndex - 1);
      setBackToLastSectionOfModule(true);
      return;
    }
    if (exitAtStart) {
      navigate(coursesHubPath);
    }
  };

  const handleHeaderBack = () => goToPreviousStep(true);
  const canGoBackInContent = currentSectionIndex > 0 || currentModuleIndex > 0;

  const handleNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      const nextIdx = currentSectionIndex + 1;
      setCurrentSectionIndex(nextIdx);
      if (nextIdx > maxReachedSectionIndex) {
        setMaxReachedSectionIndex(nextIdx);
      }
      window.scrollTo(0, 0);
    } else if (
      quizzes.some(
        (q: { title?: string }) =>
          examKindFromQuizTitle(q.title) === "formative" ||
          (!q.title?.toLowerCase().startsWith("summative") &&
            !q.title?.toLowerCase().startsWith("diagnostic"))
      )
    ) {
      // Show formative quiz after last section (not summative/diagnostic)
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
    // Persist module completion to the DB before advancing
    if (currentModuleId && (enrollment as any)?.id) {
      completeModuleMutation.mutate({
        moduleId: currentModuleId,
        enrollmentId: (enrollment as any).id,
      });
    }

    const isPals = programType === "pals";
    const totalModules = modules.length;

    if (currentModuleIndex < totalModules - 1) {
      const nextIdx = currentModuleIndex + 1;
      setCurrentModuleIndex(nextIdx);
      setCurrentSectionIndex(0);
      setMaxReachedSectionIndex(0);
      setShowFormativeQuiz(false);
      setShowSummativeExam(false);
      setShowCapstoneSim(false);
      if (nextIdx > maxReachedModuleIndex) {
        setMaxReachedModuleIndex(nextIdx);
      }
      window.scrollTo(0, 0);
    } else {
      // All cognitive modules finished
      // Show Capstone as the next step after the last module for all AHA courses
      if (examState?.capstoneRequired && !examState.capstonePassed) {
        setShowCapstoneSim(true);
        setShowFormativeQuiz(false);
        setShowSummativeExam(false);
        window.scrollTo(0, 0);
      } else if (microCourseRow && !isAhaCourse && !examState?.fellowshipSimPassed) {
        // For fellowship courses, show fellowship simulation after all modules
        setShowFellowshipSim(true);
        setShowFormativeQuiz(false);
        setShowSummativeExam(false);
        setShowCapstoneSim(false);
        window.scrollTo(0, 0);
      } else {
        // Otherwise go straight to Summative Exam
        setShowSummativeExam(true);
        setShowFormativeQuiz(false);
        setShowCapstoneSim(false);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setQuizScore(null);
        window.scrollTo(0, 0);
      }
    }
  };

  const doSubmitQuiz = (enrollmentId: number) => {
    const quiz = displayQuiz;
    if (!quiz) {
      toast.error("Quiz is not ready yet. Please wait a moment and try again.");
      return;
    }
    const moduleIdForQuiz = showDiagnosticQuiz
      ? (firstModuleId ?? currentModuleId!)
      : showSummativeExam
        ? (modules[modules.length - 1]?.id ?? currentModuleId!)
        : currentModuleId!;
    let correct = 0;
    quiz.questions.forEach((q: any, idx: number) => {
      const userAnswer = quizAnswers[q.id] ?? quizAnswers[idx];
      // Safe correctAnswer resolution — stored as plain string or JSON string
      let correctAnswer: string;
      try {
        const parsed = typeof q.correctAnswer === 'string' ? JSON.parse(q.correctAnswer) : q.correctAnswer;
        correctAnswer = typeof parsed === 'string' ? parsed : String(parsed);
      } catch {
        correctAnswer = typeof q.correctAnswer === 'string' ? q.correctAnswer : String(q.correctAnswer);
      }
      if (userAnswer === correctAnswer) correct++;
    });
    const score = Math.round((correct / quiz.questions.length) * 100);
    submitQuizMutation.mutate({
      enrollmentId,
      moduleId: moduleIdForQuiz,
      quizId: quiz.id,
      score,
      answers: Object.fromEntries(
        quiz.questions.map((q: any, idx: number) => [
          q.id,
          quizAnswers[q.id] ?? quizAnswers[idx] ?? "",
        ])
      ),
    });
  };

  const handleQuizSubmit = () => {
    const quiz = displayQuiz;
    if (!quiz) return;

    if (enrollment?.id) {
      doSubmitQuiz(enrollment.id);
    } else if (isAhaCourse) {
      const pt = (dbCourse as any)?.programType ?? programType ?? 'bls';
      ensureAhaEnrollmentMutation.mutate(
        { programType: pt as any },
        {
          onSuccess: (result) => {
            if (result.success && result.enrollmentId) {
              doSubmitQuiz(result.enrollmentId);
            } else {
              toast.error('Could not create enrollment. Please try again.');
            }
          },
          onError: () => toast.error('Enrollment setup failed. Please try again.'),
        }
      );
    } else if (slug) {
      ensureMicroEnrollment.mutate(
        { courseId: slug },
        {
          onSuccess: (result) => {
            if (result.success && result.enrollmentId) {
              void utils.courses.getUserEnrollments.invalidate();
              doSubmitQuiz(result.enrollmentId);
            } else {
              toast.error(result.error || 'Could not create enrollment. Please try again.');
            }
          },
          onError: () => toast.error('Enrollment setup failed. Please try again.'),
        }
      );
    } else {
      toast.error('Enrollment not found. Please refresh and try again.');
    }
  };

  const handleFinalSubmit = () => {
    if (!dbCourse) return;
    if (isAhaCourse) {
      // AHA: issue cognitive gatepass certificate
      const pt = (dbCourse as any).programType ?? programType ?? 'bls';
      const enrollmentId = (enrollment as any)?.id ?? 0;
      markAhaCognitive.mutate({ enrollmentId, programType: pt });
    } else {
      const microCourseSlug = microCourseRow?.courseId ?? slug;
      if (!microCourseSlug) {
        toast.error("Could not resolve this course. Return to Fellowship and open the course again.");
        return;
      }
      completeCourse.mutate({ courseId: microCourseSlug });
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

  if (!isAhaCourse && prerequisiteBlocked && !isReviewMode) {
    const hint = microCourseRow?.prerequisiteId
      ? formatPrerequisiteHint(microCourseRow.prerequisiteId, catalogTitleBySlug)
      : "Complete the foundational course first";
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
        <Lock className="w-12 h-12 text-amber-600 mb-4" />
        <h2 className="text-xl font-bold mb-2">Foundational course required</h2>
        <p className="text-muted-foreground mb-6">{hint} before starting this advanced course.</p>
        <Button onClick={() => navigate(coursesHubPath)}>{coursesHubReturnLabel}</Button>
      </div>
    );
  }

  if (!dbCourse || (!isAhaCourse && !microCourseRow)) {
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Content Not Found</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          {isAhaCourse && !ahaDetailsLoading && (ahaDetailsError || !ahaCourseDetails)
            ? "This AHA course could not be loaded. Please refresh the page or return to AHA Courses and try again."
            : "This course is not yet available in the interactive format."}
        </p>
        <Button onClick={() => navigate(coursesHubPath)}>Go Back</Button>
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
                {/* Review Course — re-enters the player from module 1 in review mode */}
                <Button
                  variant="outline"
                  className="w-full py-6 border-primary/40 text-primary font-semibold hover:bg-primary/5"
                  onClick={() => {
                    // Reset local state so the player starts fresh from module 1
                    setCurrentModuleIndex(0);
                    setCurrentSectionIndex(0);
                    setShowFormativeQuiz(false);
                    setShowSummativeExam(false);
                    setShowCertificateReady(false);
                    setHasResumed(false);
                    // Navigate to the same course with review=true so isReviewMode is set
                    navigate(`/micro-course/${slug}?review=true`);
                  }}
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Review Course Content
                </Button>
                <Button 
                  variant="outline"
                  className="w-full py-6 border-slate-200 text-slate-700 font-semibold"
                  onClick={() => navigate("/certificates")}
                >
                  View My Certificates
                </Button>
                <Button 
                  variant="ghost"
                  className="w-full py-4 text-slate-500 font-medium"
                  onClick={() => navigate(coursesHubPath)}
                >
                  {coursesHubReturnLabel}
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
  const isFinalExamModule = isSummativeExamActive;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleHeaderBack}
              aria-label={
                showCertificateReady || showSummativeExam || showDiagnosticQuiz || showFormativeQuiz || canGoBackInContent
                  ? "Go to previous section or module"
                  : coursesHubReturnLabel
              }
              title={
                showCertificateReady || showSummativeExam || showDiagnosticQuiz || showFormativeQuiz || canGoBackInContent
                  ? "Previous section or module"
                  : coursesHubReturnLabel
              }
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-slate-900 line-clamp-1">{dbCourse.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 uppercase font-bold tracking-wider">
                  {!isAhaCourse && microCourseRow?.level
                    ? microCourseTrackLabel(microCourseRow.level as MicroCourseTier)
                    : dbCourse.level}
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
        {ahaProgramForUi && (
          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <AlertDescription className="text-sm text-blue-900">
              <strong>AHA 2025 curriculum</strong> — separate from the Paeds Resus Fellowship. This path issues AHA-aligned cognitive certificates, not Fellowship micro-course credit.
            </AlertDescription>
          </Alert>
        )}
        {!isAhaCourse && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <AlertDescription className="text-sm text-amber-950">
              <strong>Paeds Resus Fellowship</strong> — not AHA certification. ResusGPS supports emergency steps; complete the Foundational course in each condition pair for full teaching depth.
            </AlertDescription>
          </Alert>
        )}
        {!isAhaCourse && modules.length > 0 && modules.length < 2 && (
          <Alert className="mb-4 border-slate-300 bg-slate-50">
            <AlertDescription className="text-sm text-slate-800">
              Foundation module — not a substitute for advanced training. Enroll in the Advanced track when the Foundational course is complete.
            </AlertDescription>
          </Alert>
        )}
        {ahaProgramForUi && (
          <div className="mb-6 rounded-lg border border-border bg-white p-4 shadow-sm space-y-3">
            <AhaCertificationPath
              cognitiveComplete={ahaCertState.cognitiveComplete}
              practicalSignedOff={ahaCertState.practicalSignedOff}
              certificateIssued={ahaCertState.certificateIssued}
            />
            <p className="text-xs text-muted-foreground">
              <Link href={examPolicyHref("aha")} className="text-primary underline-offset-2 hover:underline">
                How assessments work
              </Link>
              {" "}
              — diagnostic baseline first, then modules; summative pass 80%, 3 attempts, 24h between retries.
            </p>
          </div>
        )}
        {!isAhaCourse && (
          <p className="mb-4 text-xs text-muted-foreground">
            <Link href={examPolicyHref("fellowship")} className="text-primary underline-offset-2 hover:underline">
              Assessment policy
            </Link>
            {" "}
            — diagnostic, formatives, and summative rules.
          </p>
        )}

        {/* Step-by-Step Navigation */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {modules.map((m: CourseModuleRow, idx: number) => (
            <div key={m.id} className="flex items-center">
              <button
                onClick={() => {
                  const diagnosticBlocksModules =
                    !!examState?.diagnosticRequired && !examState?.diagnosticCompleted;
                  if (
                    (idx <= maxReachedModuleIndex || isReviewMode) &&
                    !(diagnosticBlocksModules && idx > 0)
                  ) {
                    setCurrentModuleIndex(idx);
                    setCurrentSectionIndex(0);
                    setShowFormativeQuiz(false);
                    setShowSummativeExam(false);
                    setShowCapstoneSim(false);
                    setShowCertificateReady(false);
                    setCapstoneInProgress(false);
                    localStorage.removeItem(`capstone-in-progress-${slug}`);
                  }
                }}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all",
                  idx === currentModuleIndex && !showCapstoneSim && !showSummativeExam && !showCertificateReady
                    ? "bg-primary text-white ring-4 ring-primary/20" 
                    : idx < currentModuleIndex || idx <= maxReachedModuleIndex
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-500 cursor-not-allowed"
                )}
              >
                {idx < currentModuleIndex ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </button>
              <div className={cn(
                "w-4 h-0.5 mx-1",
                idx < currentModuleIndex ? "bg-emerald-200" : "bg-slate-200"
              )} />
            </div>
          ))}
          
	          {/* Capstone Simulation Step (Module 10 for AHA courses) */}
		          {(examState?.capstoneRequired || (isAhaCourse && ["acls", "bls", "nrp", "heartsaver"].includes(programType ?? ""))) && (
		            <div className="flex items-center">
		              <button
		                onClick={() => {
		                  // Journey Enforcement: Only allow Capstone if all cognitive modules are completed
			                  const allCognitiveCompleted = modules.every((m) => {
			                    const modStatus = (examState as any)?.moduleStatus?.find((s: any) => s.moduleId === m.id);
			                    return modStatus?.completed;
			                  });

		                  if (isReviewMode || examState?.capstonePassed || allCognitiveCompleted) {
		                    setShowCapstoneSim(true);
		                    setShowSummativeExam(false);
		                    setShowCertificateReady(false);
		                    setShowFormativeQuiz(false);
		                  } else {
		                    toast.error("Please complete all preceding modules before starting the simulation.");
		                  }
		                }}
		                className={cn(
		                  "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all",
		                  showCapstoneSim
		                    ? "bg-primary text-white ring-4 ring-primary/20" 
		                    : examState?.capstonePassed
		                      ? "bg-emerald-100 text-emerald-700"
			                      : (modules.every((m) => (examState as any)?.moduleStatus?.find((s: any) => s.moduleId === m.id)?.completed)) || isReviewMode
		                        ? "bg-slate-100 text-slate-600"
		                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
		                )}
		              >
		                {examState?.capstonePassed ? <CheckCircle2 className="w-4 h-4" /> : modules.length + 1}
		              </button>
		              <div className={cn(
		                "w-4 h-0.5 mx-1",
		                examState?.capstonePassed ? "bg-emerald-200" : "bg-slate-200"
		              )} />
		            </div>
		          )}

	          <button 
                onClick={() => {
                  if (examState?.capstoneRequired && !examState?.capstonePassed && !isReviewMode) {
                    toast.error("Please complete the Capstone Simulation before starting the final exam.");
                    return;
                  }
                  if (isLastModule && (maxReachedSectionIndex >= sections.length - 1 || isReviewMode)) {
                    setShowSummativeExam(true);
                    setShowCapstoneSim(false);
                    setShowFormativeQuiz(false);
                    setShowCertificateReady(false);
                  }
                }}
	            className={cn(
	              "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all",
	              showSummativeExam || showCertificateReady
	                ? "bg-primary text-white ring-4 ring-primary/20" 
	                : (examState?.capstoneRequired ? examState?.capstonePassed : isLastModule && (maxReachedSectionIndex >= sections.length - 1 || isReviewMode))
	                  ? "bg-slate-100 text-slate-600"
	                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
	            )}
	          >
	            <GraduationCap className="w-4 h-4" />
	          </button>
        </div>

        {/* Content Area */}
        {showCertificateReady ? (
          <SummativeQuizView 
            course={dbCourse}
            quiz={summativeQuiz}
            onComplete={handleFinalSubmit}
            isPending={completeCourse.isPending || markAhaCognitive.isPending}
            isAhaCourse={isAhaCourse}
            ahaProgramType={ahaProgramForUi}
          />
        ) : showCapstoneSim ? (
          <UniversalCapstone
            programType={programType as any}
            onComplete={(score, passed) => {
              if (passed) {
                submitQuizMutation.mutate({
                  enrollmentId: enrollment!.id,
                  moduleId: -1,
                  quizId: -1,
                  score,
                  answers: { simReady: true },
                }, {
                  onSuccess: () => {
                    setShowCapstoneSim(false);
                    setCapstoneInProgress(false);
                    localStorage.removeItem(`capstone-in-progress-${slug}`);
                    setShowSummativeExam(true);
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                    setQuizScore(null);
                    void utils.learning.getMicroCourseExamState.invalidate();
                    window.scrollTo(0, 0);
                  }
                });
              } else {
                toast.error(`Simulation failed with score ${score}%. You need 50% to pass.`);
              }
            }}
            onClose={() => {
              setShowCapstoneSim(false);
              setCapstoneInProgress(false);
              localStorage.removeItem(`capstone-in-progress-${slug}`);
              setCurrentModuleIndex(Math.max(0, modules.length - 1));
              setBackToLastSectionOfModule(true);
            }}
                              />
        ) : showFellowshipSim && dbCourse && microCourseRow ? (
          <FellowshipSimulation
            courseId={microCourseRow.courseId}
            level={microCourseRow.level as "foundational" | "advanced"}
            onComplete={() => {
              setShowFellowshipSim(false);
              setShowSummativeExam(true);
            }}
          />
        ) : showDiagnosticQuiz || showFormativeQuiz || showSummativeExam ? (
            <FormativeQuizView 
            moduleTitle={
              showDiagnosticQuiz
                ? "Diagnostic baseline"
                : showSummativeExam
                  ? "Summative knowledge check"
                  : (currentModule?.title ?? "")
            }
            quiz={displayQuiz}
            answers={quizAnswers}
            setAnswers={setQuizAnswers}
            onSubmit={handleQuizSubmit}
            submitted={quizSubmitted}
            score={quizScore}
            questionResults={quizQuestionResults}
            onNext={() => {
              if (showDiagnosticQuiz) {
                setShowDiagnosticQuiz(false);
                resetQuizState();
                void utils.learning.getMicroCourseExamState.invalidate();
                return;
              }
              if (showSummativeExam || isSummativeExamActive) {
                setShowSummativeExam(false);
                setShowCertificateReady(true);
                resetQuizState();
                void utils.learning.getMicroCourseExamState.invalidate();
                return;
              }
              if (showCapstoneSim) {
                setShowCapstoneSim(false);
                setShowSummativeExam(true);
                resetQuizState();
                return;
              }
              handleModuleTransition();
            }}
            onRetry={() => {
              setQuizAnswers({});
              setQuizSubmitted(false);
              setQuizScore(null);
              if (showSummativeExam || isSummativeExamActive) {
                setSummativeShuffleSeed(Date.now());
              } else if (showDiagnosticQuiz || showFormativeQuiz) {
                setQuizOptionShuffleSeed(Date.now());
              }
            }}
            isPending={submitQuizMutation.isPending}
            isEnsuring={ensureAhaEnrollmentMutation.isPending || ensureMicroEnrollment.isPending}
            isFinalExam={isFinalExamModule}
            isDiagnostic={showDiagnosticQuiz}
            summativeRetryBlocked={
              !!examState &&
              !examState.canRetrySummative &&
              !examState.summativePassed &&
              isSummativeExamActive
            }
            summativeBlockKind={
              (examState?.summativeBlockKind ?? "none") as SummativeBlockKind
            }
            summativeAttempts={examState?.summativeAttempts ?? 0}
            summativeMaxAttempts={examState?.summativeMaxAttempts ?? 3}
            retryAvailableAt={examState?.retryAvailableAt ?? null}
            isAhaCourse={isAhaCourse}
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
                      {sections.map((_: unknown, i: number) => (
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
                    dangerouslySetInnerHTML={{
                      __html: sanitizeCourseHtml(
                        currentSection?.content || currentModule?.content || ""
                      ),
                    }}
                  />
                )}
              </CardContent>
              <CardFooter className="bg-muted/30 border-t border-border p-6 flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  className="text-muted-foreground font-semibold"
                  onClick={() => goToPreviousStep(false)}
                  disabled={!canGoBackInContent}
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

      <ClinicalContentSafetyFooter
        surfaceId={slug ?? ""}
        surface={isAhaCourse ? "aha_player" : "fellowship_player"}
        moduleId={currentModuleId ?? undefined}
        className="max-w-4xl mx-auto"
      />
    </div>
  );
}

// ── Sub-Components ───────────────────────────────────────────────────────────

function FormativeQuizView({ 
  moduleTitle, quiz, answers, setAnswers, onSubmit, 
  submitted, score, questionResults, onNext, onRetry, isPending, isEnsuring, isFinalExam,
  isDiagnostic, summativeRetryBlocked, summativeBlockKind, summativeAttempts, summativeMaxAttempts,
  retryAvailableAt, isAhaCourse,
}: any) {
  if (!quiz) return null;

  const passThreshold = isDiagnostic ? 0 : quiz.passingScore;
  const displayScore = typeof score === "number" ? score : null;
  const useServerResults = submitted && Object.keys(questionResults ?? {}).length > 0;

  const showSummativeBlocked =
    isFinalExam && summativeRetryBlocked && summativeBlockKind && summativeBlockKind !== "none";

  return (
    <div className="space-y-4">
      {showSummativeBlocked && (
        <SummativeRetryBlockedBanner
          attempts={summativeAttempts ?? 0}
          maxAttempts={summativeMaxAttempts ?? 3}
          blockKind={summativeBlockKind}
          retryAvailableAt={retryAvailableAt}
        />
      )}
    <Card className="border-none shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className={isFinalExam ? "bg-gradient-to-br from-slate-800 to-slate-900 text-white p-8" : "bg-primary text-primary-foreground p-8"}>
        <div className="flex items-center gap-2 mb-2 opacity-80">
          {isFinalExam ? <Award className="w-5 h-5" /> : <ListChecks className="w-5 h-5" />}
          <span className="text-xs font-bold uppercase tracking-widest">
            {isDiagnostic ? "Diagnostic baseline" : isFinalExam ? "Summative exam" : "Knowledge Check"}
          </span>
        </div>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <span>{isDiagnostic ? "Before you start" : isFinalExam ? "Summative knowledge check" : `Review: ${moduleTitle}`}</span>
          {isDiagnostic && (
            <Link
              href={examPolicyHref(isAhaCourse ? "aha" : "fellowship")}
              className="inline-flex rounded-full p-1 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="How assessments work"
              aria-label="How assessments work — read assessment policy"
            >
              <HelpCircle className="w-5 h-5" />
            </Link>
          )}
        </CardTitle>
        <p className="text-white/70 text-sm mt-2">
          {isDiagnostic
            ? "No pass mark — establishes your baseline. You cannot retake this diagnostic."
            : isFinalExam
            ? `Same topics as taught, shuffled. Score ≥${quiz.passingScore}% required. Up to 2 retries after 24 hours between attempts.`
            : `Test your understanding of the concepts covered in this module. Passing score: `
          }
          {!isFinalExam && !isDiagnostic && <span className="text-white font-bold">{quiz.passingScore}%</span>}
        </p>
        {isFinalExam && (
          <p className="text-white/60 text-xs mt-3">
            <Link
              href={examPolicyHref(isAhaCourse ? "aha" : "fellowship")}
              className="underline underline-offset-2 hover:text-white"
            >
              View assessment policy
            </Link>
          </p>
        )}
        {isFinalExam && (
          <div className="flex items-center gap-4 mt-4">
            <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-black">{quiz.questions.length}</p>
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">Questions</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-black">{quiz.passingScore}%</p>
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">To Pass</p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-8 space-y-10">
        {quiz.questions.map((q: any, idx: number) => {
          const answerKey = q.id ?? idx;
          return (
          <div key={q.id ?? idx} className="space-y-4">
            <div className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-muted rounded-lg flex items-center justify-center font-bold text-muted-foreground text-sm">
                {idx + 1}
              </span>
              <h3 className="text-lg font-semibold text-foreground leading-snug">{q.question}</h3>
            </div>
            <div className="grid gap-3 ml-12">
              {q.options.map((option: string) => {
                const isSelected = answers[answerKey] === option;
                const serverResult = questionResults?.[q.id];
                const resolvedCorrect = useServerResults
                  ? serverResult?.correctOption
                  : (() => {
                      try {
                        const p =
                          typeof q.correctAnswer === "string"
                            ? JSON.parse(q.correctAnswer)
                            : q.correctAnswer;
                        return typeof p === "string" ? p : String(p);
                      } catch {
                        return typeof q.correctAnswer === "string"
                          ? q.correctAnswer
                          : String(q.correctAnswer ?? "");
                      }
                    })();
                const isCorrect =
                  submitted &&
                  !!resolvedCorrect &&
                  (useServerResults
                    ? serverResult?.correct && isSelected
                    : option === resolvedCorrect);
                const isWrong =
                  submitted &&
                  isSelected &&
                  (useServerResults
                    ? serverResult != null && !serverResult.correct
                    : !!resolvedCorrect && option !== resolvedCorrect);
                const showCorrectOption =
                  submitted &&
                  useServerResults &&
                  serverResult &&
                  !serverResult.correct &&
                  option === serverResult.correctOption;

                return (
                  <button
                    key={option}
                    disabled={submitted}
                    onClick={() => setAnswers({ ...answers, [answerKey]: option })}
                    className={cn(
                      "text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group",
                      isSelected && !submitted ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-muted-foreground/30",
                      isCorrect || showCorrectOption
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "",
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
        );})}
      </CardContent>
      <CardFooter className="p-8 bg-muted/30 border-t border-border flex flex-col gap-6">
        {!submitted ? (
          <Button 
            className="w-full py-8 rounded-2xl font-bold text-xl shadow-xl shadow-primary/20"
            disabled={
              (isFinalExam && summativeRetryBlocked) ||
              quiz.questions.filter((q: any, idx: number) => {
                const key = q.id ?? idx;
                return answers[key] != null && answers[key] !== "";
              }).length < quiz.questions.length || isPending || isEnsuring
            }
            onClick={onSubmit}
          >
            {(isPending || isEnsuring) ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null}
            {isEnsuring ? 'Setting up...' : 'Submit Answers'}
          </Button>
        ) : displayScore !== null ? (
          <div className="w-full text-center space-y-6">
            <div className={cn(
              "inline-flex flex-col items-center p-6 rounded-2xl border-2",
              displayScore >= passThreshold ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"
            )}>
              <span className="text-sm font-bold uppercase tracking-widest mb-1">
                {isDiagnostic ? "Baseline recorded" : isFinalExam ? "Summative score" : "Your Score"}
              </span>
              <span className="text-5xl font-black">{displayScore}%</span>
              {isDiagnostic ? (
                <span className="text-sm font-medium mt-2">Thank you — continue to the course modules.</span>
              ) : displayScore >= passThreshold ? (
                <span className="text-sm font-medium mt-2">
                  {isFinalExam
                    ? `Excellent! You've passed the summative exam.`
                    : `Great job! You've mastered this module.`}
                </span>
              ) : isFinalExam && summativeRetryBlocked ? null : (
                <span className="text-sm font-medium mt-2">
                  {isFinalExam
                    ? `You need ${quiz.passingScore}% to pass. Review the material and try again.`
                    : `Keep studying and try again.`}
                </span>
              )}
              {isFinalExam && summativeRetryBlocked && (
                <div className="mt-4 w-full max-w-md">
                  <SummativeRetryBlockedBanner
                    attempts={summativeAttempts ?? 0}
                    maxAttempts={summativeMaxAttempts ?? 3}
                    blockKind={summativeBlockKind ?? "max_attempts"}
                    retryAvailableAt={retryAvailableAt}
                  />
                </div>
              )}
            </div>
            
            {displayScore >= passThreshold || isDiagnostic ? (
              <Button 
                className="w-full py-8 rounded-2xl font-bold text-xl bg-emerald-600 hover:bg-emerald-700"
                onClick={onNext}
              >
                {isDiagnostic ? <>Start course</> : isFinalExam ? <><Award className="w-6 h-6 mr-2" />Continue to certificate</> : <>Continue to Next Module</>}
              </Button>
            ) : (
              <Button 
                variant="outline"
                className="w-full py-8 rounded-2xl font-bold text-xl border-border"
                onClick={onRetry}
                disabled={summativeRetryBlocked}
              >
                {isFinalExam ? 'Retry summative exam' : 'Retry Knowledge Check'}
              </Button>
            )}
          </div>
        ) : (
          <div className="w-full text-center py-4 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Calculating your score…
          </div>
        )}
      </CardFooter>
    </Card>
    </div>
  );
}

function SummativeQuizView({
  course,
  quiz,
  onComplete,
  isPending,
  isAhaCourse,
  ahaProgramType,
}: {
  course: { title: string; duration?: number };
  quiz: unknown;
  onComplete: () => void;
  isPending: boolean;
  isAhaCourse: boolean;
  ahaProgramType?: AhaProgramType | null;
}) {
  const completedLabel =
    isAhaCourse && ahaProgramType
      ? formatCognitiveCourseworkDuration(ahaProgramType)
      : `${course.duration ?? 0}m`;
  return (
    <Card className="border-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-12 text-center text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Award className="w-48 h-48 rotate-12" />
        </div>
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-black mb-2">Final Exam Passed!</h2>
        <p className="text-white/80 max-w-md mx-auto text-base">
          You have successfully completed all modules and passed the final examination for{' '}
          <strong className="text-white">{course.title}</strong>.
        </p>
      </div>
      <CardContent className="p-10 text-center space-y-8">
        <div className="flex justify-center gap-8">
          <div className="text-center bg-muted/40 rounded-2xl p-5 min-w-[100px]">
            <p className="text-4xl font-black text-emerald-600">✓</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">All Modules</p>
          </div>
          <div className="text-center bg-muted/40 rounded-2xl p-5 min-w-[100px]">
            <p className="text-4xl font-black text-emerald-600">✓</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Final Exam</p>
          </div>
          <div className="text-center bg-muted/40 rounded-2xl p-5 min-w-[100px]">
            <p className="text-4xl font-black text-foreground">{completedLabel}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Completed</p>
          </div>
        </div>
        
        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
          <GraduationCap className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <h4 className="font-bold text-foreground text-lg mb-2">
            {isAhaCourse ? 'AHA Cognitive Certificate Ready' : 'Paeds Resus Fellowship Certificate Ready'}
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isAhaCourse
              ? 'Your AHA Cognitive Gatepass Certificate will be issued and available for download immediately.'
              : 'Your Paeds Resus Fellowship certificate will be issued and available for download immediately.'}
          </p>
        </div>

        <Button 
          className="w-full py-10 rounded-3xl font-black text-2xl shadow-2xl shadow-emerald-500/30 bg-emerald-600 hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-95"
          onClick={onComplete}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="w-8 h-8 animate-spin mr-3" /> : <Award className="w-8 h-8 mr-3" />}
          {isAhaCourse ? 'Issue AHA Certificate' : 'Issue My Certificate'}
        </Button>
      </CardContent>
    </Card>
  );
}
