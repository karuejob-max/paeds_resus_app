import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Flame, Award } from "lucide-react";

export default function Leaderboard() {
  const leaderboardData = [
    {
      rank: 1,
      name: "Dr. Jane Kipchoge",
      institution: "Nairobi General Hospital",
      points: 4850,
      badges: 12,
      coursesCompleted: 5,
      streak: 45,
      avatar: "👩‍⚕️",
    },
    {
      rank: 2,
      name: "James Mwangi",
      institution: "Mombasa Referral Hospital",
      points: 4620,
      badges: 10,
      coursesCompleted: 4,
      streak: 38,
      avatar: "👨‍⚕️",
    },
    {
      rank: 3,
      name: "Sarah Okonkwo",
      institution: "Dar es Salaam Medical Center",
      points: 4390,
      badges: 9,
      coursesCompleted: 4,
      streak: 32,
      avatar: "👩‍⚕️",
    },
    {
      rank: 4,
      name: "David Kiplagat",
      institution: "Kampala Hospital",
      points: 4120,
      badges: 8,
      coursesCompleted: 3,
      streak: 28,
      avatar: "👨‍⚕️",
    },
    {
      rank: 5,
      name: "Emily Kipchoge",
      institution: "Kisumu County Hospital",
      points: 3890,
      badges: 7,
      coursesCompleted: 3,
      streak: 25,
      avatar: "👩‍⚕️",
    },
    {
      rank: 6,
      name: "Peter Omondi",
      institution: "Turkana Health Center",
      points: 3650,
      badges: 6,
      coursesCompleted: 2,
      streak: 20,
      avatar: "👨‍⚕️",
    },
    {
      rank: 7,
      name: "Grace Kipchoge",
      institution: "Nairobi General Hospital",
      points: 3420,
      badges: 5,
      coursesCompleted: 2,
      streak: 18,
      avatar: "👩‍⚕️",
    },
    {
      rank: 8,
      name: "You",
      institution: "Your Institution",
      points: 2850,
      badges: 3,
      coursesCompleted: 1,
      streak: 15,
      avatar: "⭐",
      isCurrentUser: true,
    },
  ];

  const weeklyToppers = leaderboardData.slice(0, 5).map((user) => ({
    ...user,
    weeklyPoints: Math.floor(Math.random() * 500) + 100,
  }));

  const monthlyToppers = leaderboardData.slice(0, 5).map((user) => ({
    ...user,
    monthlyPoints: Math.floor(Math.random() * 2000) + 500,
  }));

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Leaderboard
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Compete with peers and climb the rankings
          </p>
        </div>
      </section>

      {/* Leaderboard Tabs */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="all">All Time</TabsTrigger>
              <TabsTrigger value="monthly">This Month</TabsTrigger>
              <TabsTrigger value="weekly">This Week</TabsTrigger>
            </TabsList>

            {/* All Time Leaderboard */}
            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle>All Time Rankings</CardTitle>
                  <CardDescription>
                    Top performers based on total points
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboardData.map((user) => (
                      <div
                        key={user.rank}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                          user.isCurrentUser
                            ? "bg-blue-50 border-blue-300"
                            : "hover:bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-2xl font-bold text-gray-900 w-12">
                            {getRankBadge(user.rank)}
                          </div>
                          <div className="text-3xl">{user.avatar}</div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {user.institution}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">
                              {user.points}
                            </p>
                            <p className="text-xs text-gray-600">points</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-bold text-purple-600">
                              {user.badges}
                            </p>
                            <p className="text-xs text-gray-600">badges</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1 mb-1">
                              <Flame className="w-4 h-4 text-orange-500" />
                              <p className="text-xl font-bold text-orange-600">
                                {user.streak}
                              </p>
                            </div>
                            <p className="text-xs text-gray-600">day streak</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Monthly Leaderboard */}
            <TabsContent value="monthly">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Rankings</CardTitle>
                  <CardDescription>
                    Top performers this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monthlyToppers.map((user) => (
                      <div
                        key={user.rank}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 border-gray-200"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-2xl font-bold text-gray-900 w-12">
                            {getRankBadge(user.rank)}
                          </div>
                          <div className="text-3xl">{user.avatar}</div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {user.institution}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            {user.monthlyPoints}
                          </p>
                          <p className="text-xs text-gray-600">points this month</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Weekly Leaderboard */}
            <TabsContent value="weekly">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Rankings</CardTitle>
                  <CardDescription>
                    Top performers this week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weeklyToppers.map((user) => (
                      <div
                        key={user.rank}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 border-gray-200"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-2xl font-bold text-gray-900 w-12">
                            {getRankBadge(user.rank)}
                          </div>
                          <div className="text-3xl">{user.avatar}</div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {user.institution}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            {user.weeklyPoints}
                          </p>
                          <p className="text-xs text-gray-600">points this week</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* How to Earn Points */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">How to Earn Points</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { activity: "Complete Lesson", points: 10, icon: "📖" },
              { activity: "Pass Quiz", points: 25, icon: "✅" },
              { activity: "Complete Module", points: 100, icon: "🎯" },
              { activity: "Earn Badge", points: 50, icon: "🏅" },
              { activity: "Daily Streak", points: 5, icon: "🔥" },
              { activity: "Help Peer", points: 15, icon: "🤝" },
              { activity: "Complete Course", points: 500, icon: "🎓" },
              { activity: "Certification", points: 1000, icon: "🌟" },
            ].map((item, idx) => (
              <Card key={idx} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <p className="font-semibold text-gray-900 mb-2">
                    {item.activity}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    +{item.points}
                  </p>
                  <p className="text-xs text-gray-600">points</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Your Stats */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Your Stats</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <Award className="w-8 h-8 text-blue-600 mb-3" />
                <p className="text-sm text-gray-600 mb-2">Current Rank</p>
                <p className="text-3xl font-bold text-gray-900">#8</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Trophy className="w-8 h-8 text-yellow-500 mb-3" />
                <p className="text-sm text-gray-600 mb-2">Total Points</p>
                <p className="text-3xl font-bold text-gray-900">2,850</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Flame className="w-8 h-8 text-orange-500 mb-3" />
                <p className="text-sm text-gray-600 mb-2">Current Streak</p>
                <p className="text-3xl font-bold text-gray-900">15 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Badge className="bg-purple-100 text-purple-800 mb-3">
                  Rank Up
                </Badge>
                <p className="text-sm text-gray-600 mb-2">Points to Next Rank</p>
                <p className="text-3xl font-bold text-gray-900">770</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
