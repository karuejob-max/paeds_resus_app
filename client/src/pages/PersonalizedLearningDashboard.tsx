import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, TrendingUp, Users, Home, ArrowLeft, Play } from "lucide-react";
import { Link } from "wouter";

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  progress: number;
  estimatedTime: string;
  status: "not_started" | "in_progress" | "completed";
  relevance: number;
  livesImpact: number;
}

export default function PersonalizedLearningDashboard() {
  const [courses] = useState<Course[]>([
    {
      id: "1",
      title: "Pediatric Sepsis Recognition & Management",
      description: "Learn to identify and manage sepsis in children",
      difficulty: "Intermediate",
      progress: 65,
      estimatedTime: "4 hours",
      status: "in_progress",
      relevance: 98,
      livesImpact: 2400,
    },
    {
      id: "2",
      title: "Respiratory Distress in Infants",
      description: "Master assessment of respiratory distress in infants",
      difficulty: "Intermediate",
      progress: 0,
      estimatedTime: "3 hours",
      status: "not_started",
      relevance: 95,
      livesImpact: 1800,
    },
    {
      id: "3",
      title: "Fluid Management & Dehydration",
      description: "Comprehensive guide to IV fluid therapy",
      difficulty: "Beginner",
      progress: 0,
      estimatedTime: "2 hours",
      status: "not_started",
      relevance: 92,
      livesImpact: 1500,
    },
    {
      id: "5",
      title: "BLS Certification",
      description: "Basic Life Support certification",
      difficulty: "Beginner",
      progress: 100,
      estimatedTime: "2 hours",
      status: "completed",
      relevance: 100,
      livesImpact: 3200,
    },
  ]);

  const [startedCourses, setStartedCourses] = useState<string[]>(["1", "5"]);

  const handleStartCourse = (courseId: string) => {
    if (!startedCourses.includes(courseId)) {
      setStartedCourses([...startedCourses, courseId]);
    }
    alert("Course started! You can continue learning at your own pace.");
  };

  const completedCount = courses.filter((c) => c.status === "completed").length;
  const inProgressCount = courses.filter((c) => c.status === "in_progress").length;
  const totalLivesImpact = courses.reduce((sum, c) => sum + (c.status === "completed" ? c.livesImpact : 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Personalized Learning Path</h1>
          <p className="text-lg text-gray-600">ML-generated courses optimized for your learning style</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Completed</p>
                  <div className="text-3xl font-bold text-green-600">{completedCount}</div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">In Progress</p>
                  <div className="text-3xl font-bold text-blue-600">{inProgressCount}</div>
                </div>
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Lives Impacted</p>
                  <div className="text-3xl font-bold text-red-600">{totalLivesImpact.toLocaleString()}</div>
                </div>
                <Users className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Avg. Relevance</p>
                  <div className="text-3xl font-bold text-purple-600">94%</div>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {courses.filter((c) => c.status === "in_progress").length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Continue Learning</h2>
            {courses
              .filter((c) => c.status === "in_progress")
              .map((course) => (
                <Card key={course.id} className="border-l-4 border-l-blue-600 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <div className="flex items-start gap-3 mb-4">
                          <Clock className="w-5 h-5 text-blue-600 mt-1" />
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-2">Your Progress</p>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex-1 bg-gray-300 rounded-full h-3">
                            <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${course.progress}%` }}></div>
                          </div>
                          <span className="font-bold text-gray-900">{course.progress}%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">Time Left</p>
                            <p className="font-semibold text-gray-900">
                              {Math.ceil(((100 - course.progress) / 100) * 4)} hrs
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Relevance</p>
                            <p className="font-semibold text-gray-900">{course.relevance}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2">
                          <Play className="w-4 h-4" />
                          Continue Course
                        </Button>
                        <Button variant="outline">View Progress Details</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommended Next Courses</h2>
          <div className="space-y-4">
            {courses
              .filter((c) => c.status === "not_started")
              .sort((a, b) => b.relevance - a.relevance)
              .map((course) => (
                <Card key={course.id} className="border-l-4 border-l-green-600 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <div className="flex items-start gap-3">
                          <Play className="w-5 h-5 text-gray-600 mt-1" />
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                            <span className="inline-block mt-2 px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                              {course.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-1">Relevance Score</p>
                        <p className="text-2xl font-bold text-gray-900 mb-3">{course.relevance}%</p>
                        <p className="text-sm text-gray-600 mb-1">Estimated Time</p>
                        <p className="font-semibold text-gray-900">{course.estimatedTime}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-1">Lives You Could Impact</p>
                        <p className="text-2xl font-bold text-red-600">{course.livesImpact.toLocaleString()}</p>
                        <p className="text-xs text-gray-600 mt-2">When you complete this course</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold gap-2"
                          onClick={() => handleStartCourse(course.id)}
                        >
                          <Play className="w-4 h-4" />
                          Start Course
                        </Button>
                        <Button variant="outline">Learn More</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {courses.filter((c) => c.status === "completed").length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Completed Courses</h2>
            <div className="space-y-3">
              {courses
                .filter((c) => c.status === "completed")
                .map((course) => (
                  <Card key={course.id} className="border-l-4 border-l-green-600 bg-green-50">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <div>
                            <p className="font-semibold text-gray-900">{course.title}</p>
                            <p className="text-sm text-gray-600">Lives impacted: {course.livesImpact.toLocaleString()}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Certificate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        <Card className="mb-8 bg-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Peer Benchmarking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Your Rank</p>
                <p className="text-3xl font-bold text-purple-600">Top 15%</p>
                <p className="text-xs text-gray-600 mt-1">Among 427 learners</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg. Completion Time</p>
                <p className="text-3xl font-bold text-blue-600">3.2 hrs</p>
                <p className="text-xs text-gray-600 mt-1">vs. 4.1 hrs peer average</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Lives Impacted vs. Peers</p>
                <p className="text-3xl font-bold text-green-600">+340%</p>
                <p className="text-xs text-gray-600 mt-1">You're making more impact</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <Link href="/predictive-intervention">
            <Button className="gap-2">
              View Predictive Alerts
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Button>
          </Link>
          <Link href="/kaizen-dashboard">
            <Button variant="outline" className="gap-2">
              Kaizen Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
