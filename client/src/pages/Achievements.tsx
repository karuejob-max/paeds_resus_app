import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2, Download } from "lucide-react";

export default function Achievements() {
  const badges = [
    {
      id: 1,
      name: "Getting Started",
      description: "Completed your first lesson",
      icon: "🚀",
      earned: true,
      earnedDate: "Jan 10, 2026",
      rarity: "Common",
    },
    {
      id: 2,
      name: "Week One Warrior",
      description: "Completed 7 days of training",
      icon: "⚔️",
      earned: true,
      earnedDate: "Jan 17, 2026",
      rarity: "Common",
    },
    {
      id: 3,
      name: "Quiz Master",
      description: "Scored 100% on 5 quizzes",
      icon: "🧠",
      earned: true,
      earnedDate: "Jan 25, 2026",
      rarity: "Uncommon",
    },
    {
      id: 4,
      name: "Consistency Champion",
      description: "Trained for 30 consecutive days",
      icon: "🏆",
      earned: false,
      progress: 18,
      total: 30,
      rarity: "Uncommon",
    },
    {
      id: 5,
      name: "Module Master",
      description: "Completed all modules in a program",
      icon: "🎓",
      earned: false,
      progress: 6,
      total: 8,
      rarity: "Rare",
    },
    {
      id: 6,
      name: "Certified Expert",
      description: "Earned certification in 3 programs",
      icon: "🌟",
      earned: false,
      progress: 1,
      total: 3,
      rarity: "Rare",
    },
    {
      id: 7,
      name: "Mentor",
      description: "Helped 10 other learners",
      icon: "👥",
      earned: false,
      progress: 3,
      total: 10,
      rarity: "Epic",
    },
    {
      id: 8,
      name: "Elite Fellow",
      description: "Completed Elite Fellowship program",
      icon: "👑",
      earned: false,
      progress: 0,
      total: 1,
      rarity: "Legendary",
    },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common":
        return "bg-gray-100 text-gray-800";
      case "Uncommon":
        return "bg-green-100 text-green-800";
      case "Rare":
        return "bg-blue-100 text-blue-800";
      case "Epic":
        return "bg-purple-100 text-purple-800";
      case "Legendary":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const earnedBadges = badges.filter((b) => b.earned);
  const inProgressBadges = badges.filter((b) => !b.earned);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Your Achievements
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Earn badges and unlock achievements as you progress through your training
          </p>
          <div className="flex justify-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {earnedBadges.length}
              </div>
              <p className="text-gray-600">Badges Earned</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {inProgressBadges.length}
              </div>
              <p className="text-gray-600">In Progress</p>
            </div>
          </div>
        </div>
      </section>

      {/* Earned Badges */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Earned Badges</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {earnedBadges.map((badge) => (
              <Card key={badge.id} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-8">
                  <div className="text-6xl mb-4">{badge.icon}</div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">
                    {badge.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {badge.description}
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Badge className={getRarityColor(badge.rarity)}>
                      {badge.rarity}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Earned on {badge.earnedDate}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* In Progress Badges */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">In Progress</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {inProgressBadges.map((badge) => (
              <Card
                key={badge.id}
                className="text-center hover:shadow-lg transition-shadow opacity-75"
              >
                <CardContent className="pt-8">
                  <div className="text-6xl mb-4 opacity-50">{badge.icon}</div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">
                    {badge.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {badge.description}
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Badge className={getRarityColor(badge.rarity)}>
                      {badge.rarity}
                    </Badge>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>
                        {"progress" in badge && badge.progress}/{badge.total}
                      </span>
                    </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            ("progress" in badge && badge.progress !== undefined && badge.total !== undefined
                              ? (badge.progress / badge.total) * 100
                              : 0)
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full" disabled>
                    Locked
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Top Badge Collectors</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[
                  { rank: 1, name: "Dr. Jane Kipchoge", badges: 12, icon: "👑" },
                  { rank: 2, name: "James Mwangi", badges: 10, icon: "🥈" },
                  { rank: 3, name: "Sarah Okonkwo", badges: 9, icon: "🥉" },
                  { rank: 4, name: "You", badges: 3, icon: "⭐" },
                  { rank: 5, name: "David Kiplagat", badges: 2, icon: "📍" },
                ].map((user) => (
                  <div
                    key={user.rank}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{user.icon}</div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          #{user.rank} {user.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {user.badges}
                      </p>
                      <p className="text-xs text-gray-600">badges</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
