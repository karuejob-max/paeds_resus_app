import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  CheckCircle,
  Award,
  TrendingUp,
  ArrowRight,
  Play,
  Sparkles,
  ClipboardList,
  Clock,
  PartyPopper,
  RotateCcw,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { buildPssModuleSteps } from "@/lib/pss-module-formative";
import { PssModulePagedReader } from "@/components/PssModulePagedReader";
import { useProviderConversionAnalytics } from "@/hooks/useProviderConversionAnalytics";

function ModuleHtmlSections({ html }: { html: string }) {
  const sections = useMemo(() => {
    const h = html?.trim() ?? "";
    if (!h) return [];
    const parts = h.split(/(?=<h2\b)/i).map((s) => s.trim()).filter(Boolean);
    return parts.length ? parts : [h];
  }, [html]);

  const prose = cn(
    "prose prose-neutral max-w-none dark:prose-invert",
    "prose-headings:font-semibold prose-headings:text-foreground prose-headings:scroll-mt-24",
    "prose-p:text-foreground/90 prose-p:leading-relaxed",
    "prose-li:marker:text-primary prose-strong:text-foreground",
    "prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
  );

  if (sections.length <= 1) {
    return <div className={cn(prose, "mb-8")} dangerouslySetInnerHTML={{ __html: sections[0] ?? "" }} />;
  }

  return (
    <div className="space-y-4 mb-8">
      {sections.map((chunk, i) => (
        <Card
          key={i}
          className="overflow-hidden rounded-2xl border-border/90 bg-gradient-to-br from-card to-brand-surface/25 shadow-sm"
        >
          <div className={cn(prose, "p-5 md:p-6")} dangerouslySetInnerHTML={{ __html: chunk }} />
        </Card>
      ))}
    </div>
  );
}

interface LearningPathProps {
  enrollmentId: number;
  programType: "bls" | "acls" | "pals" | "fellowship" | "instructor";
  /** When set (PALS micro-course), only this catalog course is shown. */
  courseId?: number | null;
  /** Paediatric Septic Shock I: paginated sections + formative checks before graded quiz. */
  pagedSepticShockModule?: boolean;
}

export const LearningPath: React.FC<LearningPathProps> = ({
  enrollmentId,
  programType,
  courseId: scopeCourseId,
  pagedSepticShockModule = false,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    passingScore: number;
  } | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ questionId: number; answer: string }[]>([]);
  const [pssFlowComplete, setPssFlowComplete] = useState(false);
  const { track } = useProviderConversionAnalytics("/learning-path");

  const coursesQuery = trpc.learning.getCourses.useQuery({
    programType,
    courseId: scopeCourseId ?? undefined,
  });

  const courseDetailsQuery = trpc.learning.getCourseDetails.useQuery(
    { courseId: selectedCourse! },
    { enabled: !!selectedCourse }
  );

  const moduleContentQuery = trpc.learning.getModuleContent.useQuery(
    { moduleId: selectedModule! },
    { enabled: !!selectedModule }
  );

  const userProgressQuery = trpc.learning.getUserProgress.useQuery(
    { courseId: enrollmentId },
    { enabled: !!selectedCourse }
  );

  const courseStatsQuery = trpc.learning.getCourseStats.useQuery(
    { courseId: selectedCourse!, enrollmentId },
    { enabled: !!selectedCourse }
  );

  const recordQuizAttemptMutation = trpc.learning.recordQuizAttempt.useMutation();
  const completeModuleMutation = trpc.learning.completeModule.useMutation();
  const myMicroEnrollmentsQuery = trpc.courses.getUserEnrollments.useQuery(undefined, {
    enabled: Boolean(selectedCourse),
  });
  const microCatalogQuery = trpc.courses.listAll.useQuery(undefined, {
    enabled: Boolean(selectedCourse),
  });

  const learningPanelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!selectedModule) return;
    learningPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedModule, showQuiz, showQuizResult]);

  useEffect(() => {
    setPssFlowComplete(false);
  }, [selectedModule]);

  const pssPagedSteps = useMemo(() => {
    if (!pagedSepticShockModule || !moduleContentQuery.data?.content) return [];
    const order = moduleContentQuery.data.order ?? 0;
    return buildPssModuleSteps(order, moduleContentQuery.data.content);
  }, [pagedSepticShockModule, moduleContentQuery.data?.content, moduleContentQuery.data?.order]);

  const modulesOrdered = courseDetailsQuery.data?.modules ?? [];
  const nextPurchaseCourse = useMemo(() => {
    const enrolled = new Set(
      (myMicroEnrollmentsQuery.data ?? [])
        .map((row) => row?.course?.courseId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    );
    const options = (microCatalogQuery.data ?? []).filter((course) => !enrolled.has(course.courseId));
    if (!options.length) return null;
    return [...options].sort((a, b) => {
      const byLevel = a.level === b.level ? 0 : a.level === "foundational" ? -1 : 1;
      if (byLevel !== 0) return byLevel;
      return a.title.localeCompare(b.title);
    })[0];
  }, [microCatalogQuery.data, myMicroEnrollmentsQuery.data]);
  const nextModuleAfterCurrent = useMemo(() => {
    if (!selectedModule || !modulesOrdered.length) return null;
    const idx = modulesOrdered.findIndex((m: { id: number }) => m.id === selectedModule);
    if (idx < 0 || idx >= modulesOrdered.length - 1) return null;
    return modulesOrdered[idx + 1] as { id: number; title?: string };
  }, [selectedModule, modulesOrdered]);

  function computeQuizScorePercent(): number {
    const questions = moduleContentQuery.data?.quizzes?.[0]?.questions ?? [];
    if (!questions.length) return 0;
    let correctCount = 0;
    for (const q of questions) {
      const userAns = quizAnswers.find((a) => a.questionId === q.id)?.answer;
      let expected = "";
      try {
        const raw = (q as { correctAnswer?: string }).correctAnswer;
        expected = typeof raw === "string" ? JSON.parse(raw) : String(raw ?? "");
      } catch {
        expected = String((q as { correctAnswer?: string }).correctAnswer ?? "");
      }
      if (userAns === expected) correctCount++;
    }
    return Math.round((correctCount / questions.length) * 100);
  }

  const handleSubmitQuiz = async () => {
    if (!selectedModule) return;

    const score = computeQuizScorePercent();
    const result = await recordQuizAttemptMutation.mutateAsync({
      quizId: moduleContentQuery.data?.quizzes?.[0]?.id || 0,
      moduleId: selectedModule,
      enrollmentId,
      score,
      answers: quizAnswers,
    });

    if (result.success && "passed" in result && "passingScore" in result) {
      setQuizResult({
        score: result.score,
        passed: result.passed,
        passingScore: result.passingScore,
      });
      setShowQuizResult(true);
      setShowQuiz(false);
      setQuizAnswers([]);

      if (result.passed) {
        track("provider_conversion", "module_completed", {
          enrollmentId,
          moduleId: selectedModule,
          quizId: moduleContentQuery.data?.quizzes?.[0]?.id || null,
          score: result.score,
          passingScore: result.passingScore,
        });
        await completeModuleMutation.mutateAsync({
          moduleId: selectedModule,
          enrollmentId,
        });
      }
      await Promise.all([userProgressQuery.refetch(), courseStatsQuery.refetch()]);
    }
  };

  if (coursesQuery.isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-36 rounded-2xl bg-muted/80" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="h-24 rounded-xl bg-muted/60" />
            <div className="h-24 rounded-xl bg-muted/60" />
            <div className="h-24 rounded-xl bg-muted/60" />
          </div>
          <div className="h-48 rounded-2xl bg-muted/70" />
        </div>
      </div>
    );
  }

  const courses = (coursesQuery.data || []).filter(
    (c: { programType?: string }) => c.programType === programType
  );
  const stats = courseStatsQuery.data;
  const completedCount =
    userProgressQuery.data && Array.isArray(userProgressQuery.data)
      ? userProgressQuery.data.filter((p: { status?: string }) => p.status === "completed").length
      : 0;

  if (!coursesQuery.isLoading && courses.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 space-y-4">
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
          <h2 className="text-lg font-semibold text-foreground">No modules yet</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {programType.toUpperCase()} — we couldn&apos;t load course content. Refresh the page, or contact support if
            this persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 space-y-8 pb-16">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-brand-surface/60 shadow-sm">
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-[var(--brand-orange)]/5 blur-2xl" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Your learning</p>
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary shadow-inner">
                  <BookOpen className="h-5 w-5" />
                </span>
                <span>Learning path</span>
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-xl leading-relaxed">
                {programType.toUpperCase()}
                {scopeCourseId ? " · Micro-course" : " program"} — work through each module, then complete the short
                quiz to track your progress.
              </p>
            </div>
            {selectedCourse && userProgressQuery.data && Array.isArray(userProgressQuery.data) && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-background/80 px-4 py-3 shadow-inner">
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums text-foreground">{completedCount}</p>
                  <p className="text-xs text-muted-foreground">modules done</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <Sparkles className="h-5 w-5 text-[var(--brand-orange)] opacity-80" />
              </div>
            )}
          </div>

          {stats && typeof stats.percentComplete === "number" && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Overall progress</span>
                <span className="font-medium text-foreground tabular-nums">{stats.percentComplete}%</span>
              </div>
              <Progress value={stats.percentComplete} className="h-2 bg-muted" />
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "Modules completed",
              value: stats.completedModules,
              icon: CheckCircle,
              accent: "text-primary",
              bg: "bg-primary/10",
            },
            {
              label: "Average quiz score",
              value: `${stats.averageScore}%`,
              icon: Award,
              accent: "text-[var(--brand-orange)]",
              bg: "bg-[var(--brand-orange)]/10",
            },
            {
              label: "Course progress",
              value: `${stats.percentComplete}%`,
              icon: TrendingUp,
              accent: "text-primary",
              bg: "bg-primary/10",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", item.bg)}>
                <item.icon className={cn("h-6 w-6", item.accent)} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold tabular-nums text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!selectedCourse ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Choose a course</h2>
          <div className="grid grid-cols-1 gap-4">
            {courses.map((course: { id: number; title?: string; description?: string }) => (
              <button
                type="button"
                key={course.id}
                className="group text-left rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/25 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  track("provider_conversion", "course_started", {
                    enrollmentId,
                    courseId: course.id,
                    programType,
                  });
                  setSelectedCourse(course.id);
                }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    {course.description ? (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{course.description}</p>
                    ) : null}
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm group-hover:bg-primary/90">
                    <Play className="h-4 w-4" />
                    Start
                    <ArrowRight className="h-4 w-4 opacity-80" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Button
            onClick={() => {
              setSelectedCourse(null);
              setSelectedModule(null);
              setShowQuiz(false);
              setShowQuizResult(false);
              setQuizResult(null);
              setQuizAnswers([]);
            }}
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl border-border"
          >
            ← Back to courses
          </Button>

          {!selectedModule ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground md:text-2xl">{courseDetailsQuery.data?.title}</h2>
                {courseDetailsQuery.data?.description ? (
                  <p className="text-muted-foreground leading-relaxed">{courseDetailsQuery.data.description}</p>
                ) : null}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Modules</p>
                {courseDetailsQuery.data?.modules?.map((module: { id: number; title?: string; description?: string; duration?: number }, index: number) => (
                  <button
                    type="button"
                    key={module.id}
                    className="group w-full text-left rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:bg-brand-surface/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => {
                      track("provider_conversion", "module_started", {
                        enrollmentId,
                        courseId: selectedCourse,
                        moduleId: module.id,
                      });
                      setSelectedModule(module.id);
                      setShowQuiz(false);
                      setShowQuizResult(false);
                      setQuizResult(null);
                      setQuizAnswers([]);
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="font-semibold text-foreground">{module.title}</h3>
                        {module.description ? (
                          <p className="text-sm text-muted-foreground leading-relaxed">{module.description}</p>
                        ) : null}
                        <div className="flex flex-wrap gap-3 pt-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {module.duration ?? 15} min
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ClipboardList className="h-3.5 w-3.5" />
                            Includes quiz
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6" ref={learningPanelRef}>
              <Button
                onClick={() => {
                  setSelectedModule(null);
                  setShowQuiz(false);
                  setShowQuizResult(false);
                  setQuizResult(null);
                }}
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl"
              >
                ← Back to modules
              </Button>

              {showQuizResult && quizResult ? (
                <Card className="overflow-hidden rounded-2xl border-border shadow-md">
                  <div
                    className={cn(
                      "border-b px-6 py-5",
                      quizResult.passed
                        ? "bg-gradient-to-r from-primary/10 to-brand-surface/80"
                        : "bg-destructive/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {quizResult.passed ? (
                        <PartyPopper className="h-8 w-8 text-[var(--brand-orange)]" />
                      ) : (
                        <RotateCcw className="h-8 w-8 text-muted-foreground" />
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-foreground">
                          {quizResult.passed ? "Module complete" : "Not quite there yet"}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {moduleContentQuery.data?.title}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 md:p-8 space-y-6">
                    <div className="rounded-xl border border-border bg-muted/20 px-6 py-5 text-center">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Your score</p>
                      <p className="text-4xl font-bold tabular-nums text-foreground mt-1">{quizResult.score}%</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Pass mark: {quizResult.passingScore}%
                      </p>
                    </div>

                    {quizResult.passed ? (
                      <div className="space-y-3">
                        {nextModuleAfterCurrent ? (
                          <Button
                            variant="cta"
                            size="lg"
                            className="w-full rounded-xl"
                            onClick={() => {
                              setSelectedModule(nextModuleAfterCurrent.id);
                              setShowQuiz(false);
                              setShowQuizResult(false);
                              setQuizResult(null);
                              setQuizAnswers([]);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            Continue: {nextModuleAfterCurrent.title?.trim() || "next module"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm text-center text-muted-foreground leading-relaxed">
                              You&apos;ve finished all modules in this course. Download your certificate from your
                              dashboard.
                            </p>
                            {nextPurchaseCourse ? (
                              <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
                                <p className="text-sm text-foreground">
                                  Next recommended course:{" "}
                                  <span className="font-semibold">{nextPurchaseCourse.title}</span>
                                </p>
                                <Button
                                  variant="cta"
                                  size="lg"
                                  className="w-full rounded-xl"
                                  asChild
                                >
                                  <Link
                                    href={`/enroll?courseId=${nextPurchaseCourse.courseId}`}
                                    onClick={() =>
                                      track("provider_conversion", "completion_upsell_clicked", {
                                        enrollmentId,
                                        completedCourseId: selectedCourse,
                                        recommendedCourseId: nextPurchaseCourse.courseId,
                                        programType,
                                      })
                                    }
                                  >
                                    Start next recommended course
                                  </Link>
                                </Button>
                              </div>
                            ) : null}
                            <Button variant={nextPurchaseCourse ? "outline" : "cta"} size="lg" className="w-full rounded-xl" asChild>
                              <Link href="/home#my-certificates">View my certificate</Link>
                            </Button>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          className="w-full rounded-xl"
                          onClick={() => {
                            setShowQuizResult(false);
                            setQuizResult(null);
                          }}
                        >
                          Back to module list
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground text-center">
                          Review the module content and try the quiz again when you&apos;re ready.
                        </p>
                        <Button
                          variant="cta"
                          className="w-full rounded-xl"
                          onClick={() => {
                            setShowQuizResult(false);
                            setQuizResult(null);
                            setShowQuiz(true);
                            setQuizAnswers([]);
                          }}
                        >
                          Retry quiz
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full rounded-xl"
                          onClick={() => {
                            setShowQuizResult(false);
                            setQuizResult(null);
                          }}
                        >
                          Back to module content
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ) : !showQuiz ? (
                <Card className="overflow-hidden rounded-2xl border-border shadow-md">
                  <div className="border-b border-border bg-gradient-to-r from-brand-surface/80 to-card px-6 py-4">
                    <h2 className="text-lg font-bold text-foreground md:text-xl">{moduleContentQuery.data?.title}</h2>
                  </div>
                  <div className="p-6 md:p-8">
                    {pagedSepticShockModule && pssPagedSteps.length > 0 ? (
                      <>
                        {!pssFlowComplete ? (
                          <PssModulePagedReader
                            steps={pssPagedSteps}
                            moduleTitle={moduleContentQuery.data?.title ?? "Module"}
                            onCompleteFlow={() => setPssFlowComplete(true)}
                          />
                        ) : (
                          <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-4 mb-6 text-sm text-foreground leading-relaxed">
                            You&apos;ve worked through this module with quick checks along the way. When ready, take the
                            graded quiz to complete the module and build toward managing septic shock confidently within
                            your facility&apos;s protocols.
                          </div>
                        )}
                        <Button
                          onClick={() => setShowQuiz(true)}
                          variant="cta"
                          size="lg"
                          disabled={pagedSepticShockModule && !pssFlowComplete}
                          className="w-full rounded-xl text-base shadow-sm"
                        >
                          Take module quiz
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <ModuleHtmlSections html={moduleContentQuery.data?.content || ""} />
                        <Button
                          onClick={() => setShowQuiz(true)}
                          variant="cta"
                          size="lg"
                          className="w-full rounded-xl text-base shadow-sm"
                        >
                          Take module quiz
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ) : (
                <Card className="rounded-2xl border-border shadow-md overflow-hidden">
                  <div className="border-b border-border bg-muted/30 px-6 py-4">
                    <h2 className="text-lg font-bold text-foreground">Quiz · {moduleContentQuery.data?.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">Select the best answer for each question.</p>
                  </div>
                  <div className="p-6 md:p-8 space-y-8">
                    {moduleContentQuery.data?.quizzes?.[0]?.questions?.map((question: { id: number; question?: string; options?: string[] }, idx: number) => (
                      <div key={question.id ?? idx} className="space-y-4">
                        <p className="font-semibold text-foreground leading-snug">
                          <span className="text-primary tabular-nums">{idx + 1}.</span> {question.question}
                        </p>
                        <div className="space-y-2">
                          {question.options?.map((option: string, optIdx: number) => {
                            const selected =
                              quizAnswers.find((a) => a.questionId === question.id)?.answer === option;
                            return (
                              <label
                                key={optIdx}
                                className={cn(
                                  "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all",
                                  selected
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border bg-card hover:border-primary/35 hover:bg-muted/30"
                                )}
                              >
                                <input
                                  type="radio"
                                  name={`question-${question.id}-${idx}`}
                                  value={option}
                                  checked={selected}
                                  onChange={(e) => {
                                    setQuizAnswers([
                                      ...quizAnswers.filter((a) => a.questionId !== question.id),
                                      { questionId: question.id, answer: e.target.value },
                                    ]);
                                  }}
                                  className="mt-1 h-4 w-4 shrink-0 border-primary text-primary focus:ring-primary"
                                />
                                <span className="text-sm leading-relaxed text-foreground">{option}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/20 p-6 sm:flex-row">
                    <Button
                      onClick={() => setShowQuiz(false)}
                      variant="outline"
                      className="flex-1 rounded-xl"
                    >
                      Back to content
                    </Button>
                    <Button
                      onClick={handleSubmitQuiz}
                      disabled={recordQuizAttemptMutation.isPending}
                      variant="cta"
                      className="flex-1 rounded-xl"
                    >
                      {recordQuizAttemptMutation.isPending ? "Submitting…" : "Submit answers"}
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
