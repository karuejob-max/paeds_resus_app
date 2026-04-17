/**
 * Course Player Component
 * 
 * Main learning interface for course modules
 * Features:
 * - Module content display (markdown)
 * - Module quiz integration
 * - Progress tracking
 * - Navigation between modules
 * - Learning objectives display
 * - References and resources
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Streamdown } from 'streamdown';
import { ModuleQuiz } from '@/components/ModuleQuiz';
import { CheckCircle2, ChevronRight, ChevronLeft, BookOpen, FileText, AlertCircle } from 'lucide-react';
import type { Module, ModuleQuiz as ModuleQuizType, CourseContent } from '@/lib/courseContent';

interface CoursePlayerProps {
  course: CourseContent;
  onModuleComplete: (moduleId: string, quizScore: number) => void;
  onCourseComplete: () => void;
  completedModules?: string[];
}

interface ModuleState {
  currentModuleIndex: number;
  quizScores: Record<string, number>;
  showQuiz: boolean;
}

export function CoursePlayer({
  course,
  onModuleComplete,
  onCourseComplete,
  completedModules = [],
}: CoursePlayerProps) {
  const [state, setState] = useState<ModuleState>({
    currentModuleIndex: 0,
    quizScores: {},
    showQuiz: false,
  });

  const currentModule = course.modules[state.currentModuleIndex];
  const isModuleCompleted = completedModules.includes(currentModule.id);
  const allModulesCompleted = course.modules.every((m) => completedModules.includes(m.id));
  const progressPercent = (completedModules.length / course.modules.length) * 100;

  const handleNextModule = () => {
    if (state.currentModuleIndex < course.modules.length - 1) {
      setState((prev) => ({
        ...prev,
        currentModuleIndex: prev.currentModuleIndex + 1,
        showQuiz: false,
      }));
    } else if (allModulesCompleted) {
      onCourseComplete();
    }
  };

  const handlePreviousModule = () => {
    if (state.currentModuleIndex > 0) {
      setState((prev) => ({
        ...prev,
        currentModuleIndex: prev.currentModuleIndex - 1,
        showQuiz: false,
      }));
    }
  };

  const handleQuizComplete = (score: number, passed: boolean) => {
    setState((prev) => ({
      ...prev,
      quizScores: {
        ...prev.quizScores,
        [currentModule.id]: score,
      },
      showQuiz: false,
    }));

    if (passed) {
      onModuleComplete(currentModule.id, score);
    }
  };

  const handleStartQuiz = () => {
    setState((prev) => ({
      ...prev,
      showQuiz: true,
    }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Module List */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Course Modules</CardTitle>
              <CardDescription>
                {completedModules.length} of {course.modules.length} completed
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
              <Progress value={progressPercent} className="h-2 mb-4" />

              <div className="space-y-1 max-h-96 overflow-y-auto">
                {course.modules.map((module, idx) => {
                  const isCompleted = completedModules.includes(module.id);
                  const isCurrent = idx === state.currentModuleIndex;

                  return (
                    <button
                      key={module.id}
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          currentModuleIndex: idx,
                          showQuiz: false,
                        }))
                      }
                      className={`w-full text-left p-2 rounded-lg transition-colors text-sm ${
                        isCurrent
                          ? 'bg-blue-100 border-l-4 border-blue-600'
                          : isCompleted
                            ? 'bg-green-50 hover:bg-green-100'
                            : 'hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">Module {module.moduleNumber}</p>
                          <p className="text-xs text-slate-600 truncate">{module.title}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {state.showQuiz ? (
            <ModuleQuiz
              quiz={{
                id: `${currentModule.id}-quiz`,
                moduleId: currentModule.id,
                title: `${currentModule.title} - Quiz`,
                passingScore: 80,
                questions: [], // Would be populated from courseContent
              }}
              onComplete={handleQuizComplete}
              onSkip={() => setState((prev) => ({ ...prev, showQuiz: false }))}
            />
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-2">
                      Module {currentModule.moduleNumber}
                    </Badge>
                    <CardTitle className="text-2xl">{currentModule.title}</CardTitle>
                    <CardDescription className="mt-2">{currentModule.description}</CardDescription>
                  </div>
                  {isModuleCompleted && (
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Learning Objectives */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Learning Objectives
                  </h3>
                  <ul className="space-y-2">
                    {currentModule.learningObjectives.map((obj) => (
                      <li key={obj.id} className="flex gap-2 text-sm">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>{obj.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Module Content */}
                <div className="prose prose-sm max-w-none">
                  <Streamdown>{currentModule.content}</Streamdown>
                </div>

                {/* Key Points */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    Key Points
                  </h3>
                  <ul className="space-y-1">
                    {currentModule.keyPoints.map((point, idx) => (
                      <li key={idx} className="text-sm text-slate-700">
                        ✓ {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* References */}
                {currentModule.references.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      References
                    </h3>
                    <ul className="space-y-2">
                      {currentModule.references.map((ref, idx) => (
                        <li key={idx} className="text-sm">
                          <p className="font-medium">{ref.title}</p>
                          <p className="text-slate-600">
                            {ref.source} ({ref.year})
                          </p>
                          {ref.url && (
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs"
                            >
                              View Source
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Module Duration */}
                <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                  ⏱️ Estimated time: {currentModule.duration} minutes
                </div>

                {/* Quiz Button */}
                {!isModuleCompleted && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-900 mb-3">
                      Complete the quiz to mark this module as done
                    </p>
                    <Button onClick={handleStartQuiz} className="w-full">
                      Take Module Quiz
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handlePreviousModule}
              variant="outline"
              disabled={state.currentModuleIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex-1" />

            <Button
              onClick={handleNextModule}
              disabled={!isModuleCompleted && state.currentModuleIndex < course.modules.length - 1}
              className="gap-2"
            >
              {state.currentModuleIndex === course.modules.length - 1 && allModulesCompleted
                ? 'Complete Course'
                : 'Next'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
