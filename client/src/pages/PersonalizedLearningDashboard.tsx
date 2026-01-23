import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Zap, TrendingUp, Award, Heart, Users, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedTime: number;
  completionRate: number;
  relevanceScore: number;
  reason: string;
  impact: string;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  courses: Course[];
  estimatedDuration: number;
  difficulty: string;
  personalizationReason: string;
}

export default function PersonalizedLearningDashboard() {
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [personalImpact, setPersonalImpact] = useState(23);
  const [learningVelocity, setLearningVelocity] = useState(1.2);
  const [nextMilestone, setNextMilestone] = useState("5 certifications");
  const [completedCourses, setCompletedCourses] = useState(8);

  useEffect(() => {
    // Simulate ML-generated personalized learning path
    const mockPath: LearningPath = {
      id: "path-001",
      title: "Pediatric Emergency Care Specialist",
      description: "AI-generated learning path optimized for your learning style and patient population",
      personalizationReason:
        "Based on your learning style (visual learner), pace (20% faster than peers), and patient population (high malaria prevalence region)",
      estimatedDuration: 12,
      difficulty: "INTERMEDIATE",
      courses: [
        {
          id: "c1",
          title: "Sepsis Recognition & Management",
          description: "Identify and manage sepsis in pediatric patients with early intervention protocols",
          difficulty: "INTERMEDIATE",
          estimatedTime: 4,
          completionRate: 75,
          relevanceScore: 98,
          reason: "Critical for your patient population - 40% of your patients have sepsis risk",
          impact: "Completing this course will help you save 5-8 lives per year",
        },
        {
          id: "c2",
          title: "Malaria Complications in Children",
          description: "Advanced management of severe malaria with neurological complications",
          difficulty: "INTERMEDIATE",
          estimatedTime: 3,
          completionRate: 0,
          relevanceScore: 95,
          reason: "Highest impact for your region - 60% of pediatric admissions are malaria-related",
          impact: "Completing this course will help you save 8-12 lives per year",
        },
        {
          id: "c3",
          title: "Respiratory Distress Management",
          description: "Oxygen therapy, ventilation strategies, and airway management",
          difficulty: "INTERMEDIATE",
          estimatedTime: 3,
          completionRate: 0,
          relevanceScore: 92,
          reason: "Second most common presentation in your patient population",
          impact: "Completing this course will help you save 3-5 lives per year",
        },
        {
          id: "c4",
          title: "Pediatric Resuscitation Protocols",
          description: "Advanced CPR, ACLS, and emergency resuscitation techniques",
          difficulty: "ADVANCED",
          estimatedTime: 5,
          completionRate: 0,
          relevanceScore: 88,
          reason: "Foundation for all emergency care - recommended after completing sepsis course",
          impact: "Completing this course will help you save 10-15 lives per year",
        },
      ],
    };

    setLearningPath(mockPath);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "BEGINNER":
        return "bg-green-100 text-green-800";
      case "INTERMEDIATE":
        return "bg-yellow-100 text-yellow-800";
      case "ADVANCED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Your Personalized Learning Path
          </h1>
          <p className="text-lg text-gray-600">
            AI-generated course sequence optimized for your learning style and patient population
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Lives Saved This Year</p>
                  <div className="text-3xl font-bold text-red-600">{personalImpact}</div>
                </div>
                <Heart className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Through your training</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Learning Velocity</p>
                  <div className="text-3xl font-bold text-blue-600">{learningVelocity}x</div>
                </div>
                <Zap className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Faster than peers</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Courses Completed</p>
                  <div className="text-3xl font-bold text-green-600">{completedCourses}</div>
                </div>
                <Award className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">With 8 certifications</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Next Milestone</p>
                  <div className="text-lg font-bold text-purple-600">{nextMilestone}</div>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">3 courses away</p>
            </CardContent>
          </Card>
        </div>

        {/* Personalization Explanation */}
        {learningPath && (
          <Card className="mb-8 border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" />
                Why This Path?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{learningPath.personalizationReason}</p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>ML Analysis:</strong> Your learning data shows you're a visual learner who progresses 20% faster than average. Your patient population has high malaria prevalence (60% of admissions) and sepsis risk (40%). This path prioritizes courses that will have the most impact for your specific context.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Learning Path Visualization */}
        {learningPath && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Recommended Course Sequence</h2>

            <div className="space-y-4">
              {learningPath.courses.map((course, index) => (
                <Card
                  key={course.id}
                  className={`border-l-4 ${
                    course.completionRate > 0 ? "border-l-green-500" : "border-l-blue-500"
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      {/* Course Info */}
                      <div className="md:col-span-2">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {course.completionRate === 100 ? (
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            ) : course.completionRate > 0 ? (
                              <Clock className="w-6 h-6 text-blue-600" />
                            ) : (
                              <AlertCircle className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{course.description}</p>

                            <div className="flex gap-2 mt-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(course.difficulty)}`}>
                                {course.difficulty}
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                {course.estimatedTime} hours
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Relevance & Impact */}
                      <div className="md:col-span-1">
                        <p className="text-xs text-gray-600 mb-2">Relevance Score</p>
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-gray-900">{course.relevanceScore}%</span>
                          </div>
                          <Progress value={course.relevanceScore} className="h-2" />
                        </div>

                        <p className="text-xs text-gray-600 mb-1">Why Recommended:</p>
                        <p className="text-xs text-gray-700 font-medium">{course.reason}</p>
                      </div>

                      {/* Impact */}
                      <div className="md:col-span-1">
                        <p className="text-xs text-gray-600 mb-2">Expected Impact</p>
                        <div className="p-3 bg-red-50 rounded-lg">
                          <p className="text-sm font-semibold text-red-900">{course.impact}</p>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="md:col-span-1 flex flex-col justify-center gap-2">
                        {course.completionRate === 100 ? (
                          <Button disabled className="bg-green-600">
                            ✓ Completed
                          </Button>
                        ) : course.completionRate > 0 ? (
                          <>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                              Continue ({course.completionRate}%)
                            </Button>
                          </>
                        ) : (
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            Start Course
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {course.completionRate > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-600">Progress</span>
                          <span className="text-xs font-bold text-gray-900">{course.completionRate}%</span>
                        </div>
                        <Progress value={course.completionRate} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Learning Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Adaptive Difficulty */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Adaptive Difficulty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Your difficulty level adapts in real-time based on your performance.
              </p>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Current Level</span>
                    <span className="text-sm font-bold text-gray-900">INTERMEDIATE</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>

                <div className="p-3 bg-blue-50 rounded text-sm text-blue-900">
                  <strong>Next Level:</strong> You're 2 more correct answers away from ADVANCED difficulty
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Peer Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                Peer Benchmarking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                How you compare to other healthcare workers in your region.
              </p>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Your Learning Velocity</span>
                    <span className="text-sm font-bold text-green-600">Top 5%</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>

                <div className="p-3 bg-green-50 rounded text-sm text-green-900">
                  <strong>You're ahead:</strong> Completing courses 20% faster than peers
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
