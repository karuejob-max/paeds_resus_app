/**
 * Streak Badge Component
 * 
 * Displays streak milestones with visual progression:
 * - Silver: 7-day streak
 * - Gold: 14-day streak
 * - Platinum: 30-day streak
 * 
 * Strategic alignment: Gamification drives daily Pillar B practice
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy, Star, Zap } from 'lucide-react';

interface StreakBadgeProps {
  currentStreak: number;
  milestone?: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
  condition: string;
  lastPracticeDate?: Date;
  compact?: boolean;
}

export function StreakBadge({
  currentStreak,
  milestone,
  condition,
  lastPracticeDate,
  compact = false,
}: StreakBadgeProps) {
  if (currentStreak < 7) {
    return (
      <div className="flex items-center gap-1">
        <Flame className="w-4 h-4 text-orange-400" />
        <span className="text-xs font-medium text-orange-600">{currentStreak} day streak</span>
      </div>
    );
  }

  const getMilestoneIcon = () => {
    switch (milestone) {
      case 'platinum':
        return <Trophy className="w-4 h-4 text-purple-600" />;
      case 'gold':
        return <Star className="w-4 h-4 text-yellow-600" />;
      case 'silver':
        return <Zap className="w-4 h-4 text-gray-400" />;
      default:
        return <Flame className="w-4 h-4 text-orange-400" />;
    }
  };

  const getMilestoneColor = () => {
    switch (milestone) {
      case 'platinum':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'silver':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-orange-100 text-orange-800 border-orange-300';
    }
  };

  const getMilestoneLabel = () => {
    switch (milestone) {
      case 'platinum':
        return '30-Day Champion';
      case 'gold':
        return '14-Day Master';
      case 'silver':
        return '7-Day Streak';
      default:
        return `${currentStreak} Days`;
    }
  };

  if (compact) {
    return (
      <Badge variant="outline" className={`gap-1 ${getMilestoneColor()}`}>
        {getMilestoneIcon()}
        <span className="font-semibold">{currentStreak}d</span>
      </Badge>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getMilestoneColor()}`}>
      {getMilestoneIcon()}
      <div className="flex-1">
        <p className="font-semibold text-sm">{getMilestoneLabel()}</p>
        <p className="text-xs opacity-75">
          {condition} • {currentStreak} consecutive days
        </p>
      </div>
      {milestone === 'platinum' && (
        <div className="text-lg">👑</div>
      )}
      {milestone === 'gold' && (
        <div className="text-lg">🏆</div>
      )}
      {milestone === 'silver' && (
        <div className="text-lg">⚡</div>
      )}
    </div>
  );
}

/**
 * Streak Leaderboard Component
 * 
 * Shows facility-level streak rankings (anonymized)
 */
interface StreakLeaderboardProps {
  leaderboard: Array<{
    condition: string;
    avgStreak: number;
    activeUsers: number;
  }>;
  isLoading?: boolean;
}

export function StreakLeaderboard({ leaderboard, isLoading }: StreakLeaderboardProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="text-center py-8">
        <Flame className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          No streaks yet. Start practicing to build your streak!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {leaderboard.map((item, index) => (
        <div
          key={item.condition}
          className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-200 font-bold text-sm">
              {index + 1}
            </div>
            <div>
              <p className="font-medium text-sm">{item.condition}</p>
              <p className="text-xs text-muted-foreground">
                {item.activeUsers} staff practicing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-600" />
            <span className="font-bold text-lg text-orange-600">{item.avgStreak}</span>
            <span className="text-xs text-muted-foreground">days avg</span>
          </div>
        </div>
      ))}
    </div>
  );
}
