import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Award,
  BookOpen,
  Zap,
  Target,
  Calendar,
  Share2,
  Download,
} from "lucide-react";

interface ProgressData {
  moduleId: string;
  moduleName: string;
  progress: number;
  status: "completed" | "in_progress" | "not_started";
  score?: number;
  completedDate?: Date;
}

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedDate: Date;
}

export default function LearnerProgress() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("month");
  const [selectedModule, setSelectedModule] = useState<ProgressData | null>(null);

  // Mock progress data
  const mockProgress: ProgressData[] = [
    {
      moduleId: "m1",
      moduleName: "BLS Fundamentals",
      progress: 100,
      status: "completed",
      score: 95,
      completedDate: new Date("2026-01-15"),
    },
    {
      moduleId: "m2",
      moduleName: "Airway Management",
      progress: 100,
      status: "completed",
      score: 88,
      completedDate: new Date("2026-01-18"),
    },
    {
      moduleId: "m3",
      moduleName: "Cardiac Arrest Protocol",
      progress: 75,
      status: "in_progress",
    },
    {
      moduleId: "m4",
      moduleName: "Medication Administration",
      progress: 45,
      status: "in_progress",
    },
    {
      moduleId: "m5",
      moduleName: "Pediatric Considerations",
      progress: 0,
      status: "not_started",
    },
    {
      moduleId: "m6",
      moduleName: "Team Communication",
      progress: 30,
      status: "in_progress",
    },
  ];

  const mockBadges: BadgeData[] = [
    {
      id: "b1",
      name: "Quick Learner",
      description: "Completed first module in under 3 days",
      icon: "⚡",
      earnedDate: new Date("2026-01-15"),
    },
    {
      id: "b2",
      name: "Perfect Score",
      description: "Achieved 95% or higher on a quiz",
      icon: "🎯",
      earnedDate: new Date("2026-01-15"),
    },
    {
      id: "b3",
      name: "Consistent Learner",
      description: "Completed 3 modules in a row",
      icon: "🔥",
      earnedDate: new Date("2026-01-18"),
    },
  ];

  const mockWeeklyData = [
    { day: "Mon", minutes: 45, modules: 1 },
    { day: "Tue", minutes: 60, modules: 1 },
    { day: "Wed", minutes: 30, modules: 0 },
    { day: "Thu", minutes: 75, modules: 2 },
    { day: "Fri", minutes: 90, modules: 2 },
    { day: "Sat", minutes: 120, modules: 2 },
    { day: "Sun", minutes: 0, modules: 0 },
  ];

  const completedModules = mockProgress.filter((m) => m.status === "completed").length;
  const inProgressModules = mockProgress.filter((m) => m.status === "in_progress").length;
  const overallProgress = Math.round(
    mockProgress.reduce((sum, m) => sum + m.progress, 0) / mockProgress.length
  );
  const totalLearningHours = mockWeeklyData.reduce((sum, d) => sum + d.minutes, 0) / 60;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "not_started":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Your Progress</h1>
                <p className="text-gray-600">Track your learning journey</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Report
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-gray-600 mb-2">Overall Progress</p>
            <p className="text-4xl font-bold text-gray-900">{overallProgress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </Card>

          <Card className="p-6 bg-green-50 border-green-200">
            <p className="text-sm text-green-700 mb-2">Completed</p>
            <p className="text-4xl font-bold text-green-900">{completedModules}</p>
            <p className="text-xs text-green-600 mt-2">modules finished</p>
          </Card>

          <Card className="p-6 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-700 mb-2">In Progress</p>
            <p className="text-4xl font-bold text-blue-900">{inProgressModules}</p>
            <p className="text-xs text-blue-600 mt-2">modules active</p>
          </Card>

          <Card className="p-6 bg-purple-50 border-purple-200">
            <p className="text-sm text-purple-700 mb-2">Learning Hours</p>
            <p className="text-4xl font-bold text-purple-900">{totalLearningHours.toFixed(1)}</p>
            <p className="text-xs text-purple-600 mt-2">this week</p>
          </Card>
        </div>

        {/* Weekly Activity Chart */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Weekly Activity</h2>

          <div className="space-y-4">
            {mockWeeklyData.map((day, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{day.day}</span>
                  <span className="text-sm text-gray-600">
                    {day.minutes} min • {day.modules} module{day.modules !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                    style={{ width: `${(day.minutes / 120) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Modules Progress */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Module Progress
              </h2>

              <div className="space-y-4">
                {mockProgress.map((module) => (
                  <div
                    key={module.moduleId}
                    onClick={() => setSelectedModule(module)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{module.moduleName}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                          module.status
                        )}`}
                      >
                        {module.status === "completed"
                          ? "Completed"
                          : module.status === "in_progress"
                            ? "In Progress"
                            : "Not Started"}
                      </span>
                    </div>

                    <div className="mb-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">{module.progress}%</span>
                        {module.score && (
                          <span className="text-sm font-semibold text-green-600">
                            Score: {module.score}%
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            module.progress === 100
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${module.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {module.completedDate && (
                      <p className="text-xs text-gray-500">
                        Completed on {module.completedDate.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Badges */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Badges Earned
            </h2>

            <div className="space-y-4">
              {mockBadges.map((badge) => (
                <div key={badge.id} className="text-center">
                  <div className="text-5xl mb-2">{badge.icon}</div>
                  <h3 className="font-semibold text-gray-900 text-sm">{badge.name}</h3>
                  <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                  <p className="text-xs text-gray-500">
                    {badge.earnedDate.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 mb-3">More badges to unlock:</p>
              <ul className="space-y-2 text-xs text-gray-600">
                <li>• Complete all modules</li>
                <li>• Maintain 90%+ average</li>
                <li>• Learn 10+ hours/week</li>
              </ul>
            </div>
          </Card>
        </div>

        {/* Module Details */}
        {selectedModule && (
          <Card className="p-6 border-2 border-blue-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedModule.moduleName}
              </h2>
              <button
                onClick={() => setSelectedModule(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Progress</p>
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {selectedModule.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${selectedModule.progress}%` }}
                    ></div>
                  </div>
                </div>

                {selectedModule.score && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Quiz Score</p>
                    <p className="text-3xl font-bold text-green-600">
                      {selectedModule.score}%
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Status</p>
                <p className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedModule.status === "completed"
                    ? "✓ Completed"
                    : selectedModule.status === "in_progress"
                      ? "In Progress"
                      : "Not Started"}
                </p>

                {selectedModule.completedDate && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Completed Date</p>
                    <p className="font-semibold text-gray-900">
                      {selectedModule.completedDate.toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex gap-3">
                {selectedModule.status === "in_progress" && (
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    Continue Learning
                  </Button>
                )}
                {selectedModule.status === "completed" && (
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    Review Module
                  </Button>
                )}
                {selectedModule.status === "not_started" && (
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    Start Module
                  </Button>
                )}
                <Button variant="outline" className="flex-1">
                  View Resources
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
