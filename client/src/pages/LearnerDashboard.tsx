import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award, TrendingUp, Users, Calendar, Download, Share2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function LearnerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const enrollments = trpc.enrollment.getByUserId.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In to View Dashboard</CardTitle>
            <CardDescription>Access your learning progress and certificates</CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()}>
              <Button className="w-full bg-blue-900 hover:bg-blue-800">Sign In</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock learner progress data
  const mockProgress = {
    currentProgram: "PALS (Pediatric Advanced Life Support)",
    progressPercentage: 65,
    modulesCompleted: 13,
    totalModules: 20,
    badges: ["Quick Learner", "Perfect Score", "Active Participant"],
    leaderboardRank: 12,
    totalLearners: 487,
    lastActivityAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  };

  const modules = [
    { name: "Module 1: Pediatric Assessment", completed: true, score: 95 },
    { name: "Module 2: Airway Management", completed: true, score: 88 },
    { name: "Module 3: Shock Recognition", completed: true, score: 92 },
    { name: "Module 4: Arrhythmia Recognition", completed: true, score: 85 },
    { name: "Module 5: Medication Administration", completed: false, score: null },
    { name: "Module 6: Post-Resuscitation Care", completed: false, score: null },
  ];

  const upcomingEvents = [
    {
      type: "Live Session",
      title: "Advanced Airway Techniques",
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      instructor: "Dr. Jane Kipchoge",
    },
    {
      type: "Quiz",
      title: "Module 5 Assessment",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      instructor: "Self-paced",
    },
    {
      type: "Practical",
      title: "Simulation Training",
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      instructor: "PICU Training Center",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600">Track your learning progress and achievements</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{mockProgress.progressPercentage}%</div>
              <p className="text-xs text-gray-500 mt-1">Current program</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Modules Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{mockProgress.modulesCompleted}/{mockProgress.totalModules}</div>
              <p className="text-xs text-gray-500 mt-1">Learning units</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Badges Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{mockProgress.badges.length}</div>
              <p className="text-xs text-gray-500 mt-1">Achievements</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Leaderboard Rank</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">#{mockProgress.leaderboardRank}</div>
              <p className="text-xs text-gray-500 mt-1">of {mockProgress.totalLearners}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Program */}
            <Card>
              <CardHeader>
                <CardTitle>Current Program</CardTitle>
                <CardDescription>{mockProgress.currentProgram}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm font-bold">{mockProgress.progressPercentage}%</span>
                  </div>
                  <Progress value={mockProgress.progressPercentage} className="h-2" />
                </div>

                <div className="flex gap-4">
                  <Button className="flex-1 bg-blue-900 hover:bg-blue-800">Continue Learning</Button>
                  <Button variant="outline" className="flex-1">View Resources</Button>
                </div>
              </CardContent>
            </Card>

            {/* Modules */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Modules</CardTitle>
                <CardDescription>Complete all modules to finish the program</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {modules.map((module, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                            module.completed
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {module.completed ? "✓" : index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{module.name}</p>
                          {module.score && (
                            <p className="text-sm text-gray-500">Score: {module.score}%</p>
                          )}
                        </div>
                      </div>
                      {module.completed && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Completed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Don't miss these important dates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingEvents.map((event, index) => (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                      <div className="flex-shrink-0">
                        <Calendar className="w-5 h-5 text-blue-900" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {event.type}
                          </span>
                        </div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-500">
                          {event.date.toLocaleDateString()} • {event.instructor}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Badges Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockProgress.badges.map((badge) => (
                    <div key={badge} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Award className="w-5 h-5 text-yellow-700" />
                      </div>
                      <span className="text-sm font-medium">{badge}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-blue-900">#{mockProgress.leaderboardRank}</div>
                  <p className="text-sm text-gray-500">out of {mockProgress.totalLearners} learners</p>
                </div>
                <Button variant="outline" className="w-full">View Full Leaderboard</Button>
              </CardContent>
            </Card>

            {/* Share Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Share Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full gap-2">
                  <Share2 className="w-4 h-4" />
                  Share on Social Media
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Download className="w-4 h-4" />
                  Download Certificate
                </Button>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full">Contact Support</Button>
                <Button variant="outline" className="w-full">View FAQ</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
