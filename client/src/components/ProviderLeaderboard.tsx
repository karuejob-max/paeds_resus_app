import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader, Trophy, TrendingUp, TrendingDown } from "lucide-react";

type LeaderboardCategory = "performance" | "interventions" | "patients_served" | "training";

interface ProviderLeaderboardProps {
  initialCategory?: LeaderboardCategory;
  limit?: number;
}

export function ProviderLeaderboard({ initialCategory = "performance", limit = 50 }: ProviderLeaderboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>(initialCategory);
  const [offset, setOffset] = useState(0);

  const { data: rankings, isLoading } = trpc.performance.getLeaderboard.useQuery({
    category: selectedCategory,
    limit,
    offset,
  });

  const getCategoryLabel = (category: LeaderboardCategory) => {
    const labels: Record<LeaderboardCategory, string> = {
      performance: "Overall Performance",
      interventions: "Interventions Completed",
      patients_served: "Patients Served",
      training: "Training Hours",
    };
    return labels[category];
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getRankChangeIcon = (rankChange: number | null) => {
    if (!rankChange) return null;
    if (rankChange > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs font-semibold">+{rankChange}</span>
        </div>
      );
    } else if (rankChange < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingDown className="w-4 h-4" />
          <span className="text-xs font-semibold">{rankChange}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Category Selector */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Leaderboard Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(["performance", "interventions", "patients_served", "training"] as const).map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setOffset(0);
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>
      </Card>

      {/* Leaderboard Header */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900">{getCategoryLabel(selectedCategory)}</h2>
        </div>
        <p className="text-sm text-gray-600">Top providers ranked by {getCategoryLabel(selectedCategory).toLowerCase()}</p>
      </Card>

      {/* Rankings Table */}
      {isLoading ? (
        <Card className="p-12">
          <div className="flex items-center justify-center">
            <Loader className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        </Card>
      ) : !rankings || rankings.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-gray-500">No rankings available yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {rankings.map((provider: any, index: number) => (
            <Card key={provider.id} className={`p-4 ${index < 3 ? "border-2 border-yellow-200 bg-yellow-50" : ""}`}>
              <div className="flex items-center justify-between">
                {/* Rank and Provider Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg">
                    {getMedalIcon(provider.rank)}
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{provider.userName || "Unknown Provider"}</p>
                    <p className="text-xs text-gray-500">{provider.providerType || "Healthcare Provider"}</p>
                  </div>
                </div>

                {/* Score and Stats */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{Math.round(Number(provider.score))}</p>
                    <p className="text-xs text-gray-500">Score</p>
                  </div>

                  {/* Percentile */}
                  <div className="text-right">
                    <Badge className="bg-blue-100 text-blue-800 mb-1">
                      {Math.round(Number(provider.percentile))}th percentile
                    </Badge>
                    <p className="text-xs text-gray-500">Ranking</p>
                  </div>

                  {/* Rank Change */}
                  {getRankChangeIcon(provider.rankChange) && (
                    <div className="text-right">{getRankChangeIcon(provider.rankChange)}</div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {rankings && rankings.length > 0 && (
        <Card className="p-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {offset + 1} to {Math.min(offset + limit, offset + rankings.length)} of rankings
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
            >
              Previous
            </button>

            <button
              onClick={() => setOffset(offset + limit)}
              disabled={rankings.length < limit}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        </Card>
      )}

      {/* Top Performers Summary */}
      {rankings && rankings.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 3 Performers</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rankings.slice(0, 3).map((provider: any, index: number) => (
              <div key={provider.id} className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200">
                <div className="text-center">
                  <p className="text-3xl mb-2">{["🥇", "🥈", "🥉"][index]}</p>
                  <p className="font-semibold text-gray-900">{provider.userName || "Unknown"}</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">{Math.round(Number(provider.score))}</p>
                  <p className="text-xs text-gray-600 mt-1">{getCategoryLabel(selectedCategory)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
