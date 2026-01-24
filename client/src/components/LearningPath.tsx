import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  Award,
  ArrowRight,
  Play,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Progress } from "@/components/ui/progress";

interface LearningPathProps {
  enrollmentId: number;
  programType: "bls" | "acls" | "pals" | "fellowship";
}

export const LearningPath: React.FC<LearningPathProps> = ({
  enrollmentId,
  programType,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<
    { questionId: number; answer: string }[]
  >([]);

  // Queries
  const coursesQuery = trpc.learning.getCourses.useQuery({
    programType,
  });

  const courseDetailsQuery = trpc.learning.getCourseDetails.useQuery(
    { courseId: selectedCourse! },
    { enabled: !!selectedCourse }
  );

  const moduleContentQuery = trpc.learning.getModuleContent.useQuery(
    { moduleId: selectedModule! },
    { enabled: !!selectedModule }
  );

  const userProgressQuery = trpc.learning.getUserProgress.useQuery({
    courseId: selectedCourse || 0,
  }, { enabled: !!selectedCourse });

  const courseStatsQuery = trpc.learning.getCourseStats.useQuery(
    { courseId: selectedCourse! },
    { enabled: !!selectedCourse }
  );

  // Mutations
  const recordQuizAttemptMutation = trpc.learning.recordQuizAttempt.useMutation();
  const completeModuleMutation = trpc.learning.completeModule.useMutation();

  const handleSubmitQuiz = async () => {
    if (!selectedModule) return;

    const result = await recordQuizAttemptMutation.mutateAsync({
      quizId: moduleContentQuery.data?.quizzes?.[0]?.id || 0,
      moduleId: selectedModule,
      enrollmentId,
      score: Math.round(
        (quizAnswers.length / (moduleContentQuery.data?.quizzes?.[0]?.questions?.length || 1)) * 100
      ),
      answers: quizAnswers,
    });

    if (result.success) {
      await completeModuleMutation.mutateAsync({
        moduleId: selectedModule,
        enrollmentId,
      });
      setShowQuiz(false);
      setQuizAnswers([]);
      userProgressQuery.refetch();
    }
  };

  if (coursesQuery.isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const courses = coursesQuery.data || [];
  const stats = courseStatsQuery.data;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={32} className="text-blue-600" />
            Personalized Learning Path
          </h1>
          <p className="text-gray-600 mt-2">
            {programType.toUpperCase()} Program
          </p>
        </div>
        {userProgressQuery.data && (
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">              {userProgressQuery.data?.progress?.filter((p: any) => p.status === "completed").length || 0}
            </div>
            <p className="text-gray-600">Modules Completed</p>
          </div>
        )}
      </div>

      {/* Course Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-semibold">
                  Completed Modules
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.completedModules}
                </p>
              </div>
              <CheckCircle size={32} className="text-blue-400" />
            </div>
          </Card>

          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-semibold">
                  Average Score
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.averageScore}%
                </p>
              </div>
              <Award size={32} className="text-green-400" />
            </div>
          </Card>

          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-semibold">
                  Progress
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.percentComplete}%
                </p>
              </div>
              <TrendingUp size={32} className="text-purple-400" />
            </div>
          </Card>
        </div>
      )}

      {/* Course List */}
      {!selectedCourse ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course: any) => (
              <Card
                key={course.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-gray-200 hover:border-blue-500"
                onClick={() => setSelectedCourse(course.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {course.description}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCourse(course.id);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Play size={16} className="mr-2" />
                  Start Learning
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        // Course Details View
        <div className="space-y-4">
          <Button
            onClick={() => {
              setSelectedCourse(null);
              setSelectedModule(null);
              setShowQuiz(false);
            }}
            variant="outline"
            className="mb-4"
          >
            ← Back to Courses
          </Button>

          {!selectedModule ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {courseDetailsQuery.data?.title}
              </h2>
              <p className="text-gray-600">
                {courseDetailsQuery.data?.description}
              </p>

              <div className="grid grid-cols-1 gap-3">
                {courseDetailsQuery.data?.modules?.map((module: any) => (
                  <Card
                    key={module.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-600"
                    onClick={() => setSelectedModule(module.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {module.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {module.description}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>📚 {module.duration || 15} min</span>
                          <span>📝 Quiz included</span>
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-blue-600" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            // Module View
            <div className="space-y-4">
              <Button
                onClick={() => {
                  setSelectedModule(null);
                  setShowQuiz(false);
                }}
                variant="outline"
                className="mb-4"
              >
                ← Back to Modules
              </Button>

              {!showQuiz ? (
                <div className="space-y-4">
                  <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      {moduleContentQuery.data?.title}
                    </h2>
                    <div
                      className="prose prose-sm max-w-none mb-6"
                      dangerouslySetInnerHTML={{
                        __html: moduleContentQuery.data?.content || "",
                      }}
                    />

                    <Button
                      onClick={() => setShowQuiz(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      Take Quiz
                      <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </Card>
                </div>
              ) : (
                // Quiz View
                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Quiz: {moduleContentQuery.data?.title}
                  </h2>

                  <div className="space-y-6">
                    {moduleContentQuery.data?.quizzes?.[0]?.questions?.map(
                      (question: any, idx: number) => (
                        <div key={idx} className="border-b pb-6">
                          <p className="font-bold text-gray-900 mb-3">
                            {idx + 1}. {question.question}
                          </p>
                          <div className="space-y-2">
                            {question.options?.map((option: string, optIdx: number) => (
                              <label
                                key={optIdx}
                                className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50"
                              >
                                <input
                                  type="radio"
                                  name={`question-${idx}`}
                                  value={option}
                                  checked={
                                    quizAnswers.find(
                                      (a) => a.questionId === question.id
                                    )?.answer === option
                                  }
                                  onChange={(e) => {
                                    setQuizAnswers([
                                      ...quizAnswers.filter(
                                        (a) => a.questionId !== question.id
                                      ),
                                      {
                                        questionId: question.id,
                                        answer: e.target.value,
                                      },
                                    ]);
                                  }}
                                  className="mr-3"
                                />
                                <span className="text-gray-700">{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Button
                      onClick={() => setShowQuiz(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmitQuiz}
                      disabled={recordQuizAttemptMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {recordQuizAttemptMutation.isPending
                        ? "Submitting..."
                        : "Submit Quiz"}
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
};
