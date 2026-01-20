/**
 * Gamification & Engagement System
 * Badges, points, leaderboards, streaks, and achievements
 */

export type BadgeType = "achievement" | "milestone" | "skill" | "social" | "challenge";
export type AchievementType = "course_completion" | "quiz_perfect" | "streak" | "mentorship" | "community";

export interface Badge {
  id: string;
  name: string;
  description: string;
  type: BadgeType;
  icon: string;
  criteria: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  pointsReward: number;
}

export interface UserBadge {
  badgeId: string;
  userId: number;
  earnedAt: Date;
  displayOrder: number;
}

export interface Achievement {
  id: string;
  userId: number;
  type: AchievementType;
  title: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
  completedAt?: Date;
  reward: {
    points: number;
    badge?: string;
  };
}

export interface UserPoints {
  userId: number;
  totalPoints: number;
  level: number;
  currentLevelPoints: number;
  pointsToNextLevel: number;
  rank: number;
  lastActivityAt: Date;
}

export interface Streak {
  userId: number;
  type: "login" | "course" | "quiz" | "practice";
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  startDate: Date;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  userName: string;
  points: number;
  level: number;
  badges: number;
  streaks: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: "daily" | "weekly" | "monthly" | "seasonal";
  difficulty: "easy" | "medium" | "hard";
  pointsReward: number;
  badgeReward?: string;
  startDate: Date;
  endDate: Date;
  criteria: string;
  participants: number;
  completions: number;
}

class GamificationService {
  private badges: Map<string, Badge> = new Map();
  private userBadges: Map<number, UserBadge[]> = new Map();
  private achievements: Map<number, Achievement[]> = new Map();
  private userPoints: Map<number, UserPoints> = new Map();
  private streaks: Map<number, Streak[]> = new Map();
  private challenges: Map<string, Challenge> = new Map();
  private leaderboard: LeaderboardEntry[] = [];

  constructor() {
    this.initializeBadges();
    this.initializeChallenges();
  }

  /**
   * Initialize default badges
   */
  private initializeBadges(): void {
    const defaultBadges: Badge[] = [
      {
        id: "first_course",
        name: "First Step",
        description: "Complete your first course",
        type: "achievement",
        icon: "🎓",
        criteria: "Complete 1 course",
        rarity: "common",
        pointsReward: 100,
      },
      {
        id: "perfect_quiz",
        name: "Perfect Score",
        description: "Score 100% on a quiz",
        type: "achievement",
        icon: "⭐",
        criteria: "Get 100% on any quiz",
        rarity: "uncommon",
        pointsReward: 250,
      },
      {
        id: "7_day_streak",
        name: "On Fire",
        description: "Maintain a 7-day learning streak",
        type: "milestone",
        icon: "🔥",
        criteria: "7-day consecutive login",
        rarity: "uncommon",
        pointsReward: 500,
      },
      {
        id: "mentor_master",
        name: "Mentor",
        description: "Mentor 5 learners",
        type: "social",
        icon: "👨‍🏫",
        criteria: "Mentor 5 different users",
        rarity: "rare",
        pointsReward: 1000,
      },
      {
        id: "community_hero",
        name: "Community Hero",
        description: "Help 10 community members",
        type: "social",
        icon: "🦸",
        criteria: "Provide 10 helpful answers",
        rarity: "rare",
        pointsReward: 1000,
      },
      {
        id: "pals_certified",
        name: "PALS Certified",
        description: "Complete PALS certification",
        type: "skill",
        icon: "🏅",
        criteria: "Complete PALS course",
        rarity: "epic",
        pointsReward: 2000,
      },
      {
        id: "elite_fellow",
        name: "Elite Fellow",
        description: "Complete Elite Fellowship program",
        type: "achievement",
        icon: "👑",
        criteria: "Complete Elite Fellowship",
        rarity: "legendary",
        pointsReward: 5000,
      },
    ];

    defaultBadges.forEach((badge) => {
      this.badges.set(badge.id, badge);
    });
  }

  /**
   * Initialize default challenges
   */
  private initializeChallenges(): void {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const defaultChallenges: Challenge[] = [
      {
        id: "daily_login",
        title: "Daily Login",
        description: "Log in every day this week",
        type: "daily",
        difficulty: "easy",
        pointsReward: 50,
        startDate: today,
        endDate: tomorrow,
        criteria: "Login daily",
        participants: 0,
        completions: 0,
      },
      {
        id: "quiz_master",
        title: "Quiz Master",
        description: "Complete 3 quizzes with 80%+ score",
        type: "weekly",
        difficulty: "medium",
        pointsReward: 300,
        badgeReward: "perfect_quiz",
        startDate: today,
        endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        criteria: "Complete 3 quizzes with 80%+",
        participants: 0,
        completions: 0,
      },
      {
        id: "course_sprint",
        title: "Course Sprint",
        description: "Complete 2 courses this month",
        type: "monthly",
        difficulty: "hard",
        pointsReward: 1000,
        startDate: today,
        endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
        criteria: "Complete 2 courses",
        participants: 0,
        completions: 0,
      },
    ];

    defaultChallenges.forEach((challenge) => {
      this.challenges.set(challenge.id, challenge);
    });
  }

  /**
   * Award badge to user
   */
  awardBadge(userId: number, badgeId: string): boolean {
    const badge = this.badges.get(badgeId);
    if (!badge) return false;

    const userBadges = this.userBadges.get(userId) || [];

    // Check if user already has this badge
    if (userBadges.some((ub) => ub.badgeId === badgeId)) {
      return false;
    }

    const userBadge: UserBadge = {
      badgeId,
      userId,
      earnedAt: new Date(),
      displayOrder: userBadges.length,
    };

    userBadges.push(userBadge);
    this.userBadges.set(userId, userBadges);

    // Award points
    this.addPoints(userId, badge.pointsReward, `Badge: ${badge.name}`);

    return true;
  }

  /**
   * Get user badges
   */
  getUserBadges(userId: number): Badge[] {
    const userBadges = this.userBadges.get(userId) || [];
    return userBadges
      .map((ub) => this.badges.get(ub.badgeId))
      .filter((badge) => badge !== undefined) as Badge[];
  }

  /**
   * Add points to user
   */
  addPoints(userId: number, points: number, reason: string): UserPoints {
    let userPoints = this.userPoints.get(userId);

    if (!userPoints) {
      userPoints = {
        userId,
        totalPoints: 0,
        level: 1,
        currentLevelPoints: 0,
        pointsToNextLevel: 1000,
        rank: 0,
        lastActivityAt: new Date(),
      };
    }

    userPoints.totalPoints += points;
    userPoints.currentLevelPoints += points;
    userPoints.lastActivityAt = new Date();

    // Check for level up
    while (userPoints.currentLevelPoints >= userPoints.pointsToNextLevel) {
      userPoints.currentLevelPoints -= userPoints.pointsToNextLevel;
      userPoints.level++;
      userPoints.pointsToNextLevel = Math.floor(userPoints.pointsToNextLevel * 1.2);
    }

    userPoints.pointsToNextLevel -= userPoints.currentLevelPoints;

    this.userPoints.set(userId, userPoints);
    this.updateLeaderboard();

    return userPoints;
  }

  /**
   * Get user points
   */
  getUserPoints(userId: number): UserPoints | null {
    return this.userPoints.get(userId) || null;
  }

  /**
   * Update streak
   */
  updateStreak(userId: number, streakType: "login" | "course" | "quiz" | "practice"): Streak {
    const streaks = this.streaks.get(userId) || [];
    let streak = streaks.find((s) => s.type === streakType);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!streak) {
      streak = {
        userId,
        type: streakType,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
        startDate: today,
      };
    } else {
      const lastActivity = new Date(streak.lastActivityDate);
      lastActivity.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Consecutive day
        streak.currentStreak++;
      } else if (daysDiff > 1) {
        // Streak broken
        streak.currentStreak = 1;
        streak.startDate = today;
      }
      // daysDiff === 0 means same day, no change

      streak.lastActivityDate = today;

      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
      }
    }

    // Replace or add streak
    const index = streaks.findIndex((s) => s.type === streakType);
    if (index !== -1) {
      streaks[index] = streak;
    } else {
      streaks.push(streak);
    }

    this.streaks.set(userId, streaks);

    // Award points for streaks
    if (streak.currentStreak % 7 === 0) {
      this.addPoints(userId, 100 * (streak.currentStreak / 7), `${streakType} streak milestone`);
    }

    return streak;
  }

  /**
   * Get user streaks
   */
  getUserStreaks(userId: number): Streak[] {
    return this.streaks.get(userId) || [];
  }

  /**
   * Update leaderboard
   */
  private updateLeaderboard(): void {
    const entries: LeaderboardEntry[] = [];

    this.userPoints.forEach((points, userId) => {
      const badges = (this.userBadges.get(userId) || []).length;
      const streaks = (this.streaks.get(userId) || []).length;

      entries.push({
        rank: 0,
        userId,
        userName: `User ${userId}`,
        points: points.totalPoints,
        level: points.level,
        badges,
        streaks,
      });
    });

    // Sort by points descending
    entries.sort((a, b) => b.points - a.points);

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    this.leaderboard = entries;
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(limit: number = 50): LeaderboardEntry[] {
    return this.leaderboard.slice(0, limit);
  }

  /**
   * Get user rank
   */
  getUserRank(userId: number): LeaderboardEntry | null {
    return this.leaderboard.find((entry) => entry.userId === userId) || null;
  }

  /**
   * Get challenges
   */
  getChallenges(): Challenge[] {
    return Array.from(this.challenges.values());
  }

  /**
   * Get active challenges
   */
  getActiveChallenges(): Challenge[] {
    const now = new Date();
    return Array.from(this.challenges.values()).filter((c) => c.startDate <= now && c.endDate >= now);
  }

  /**
   * Get gamification summary
   */
  getGamificationSummary(userId: number): {
    points: UserPoints | null;
    badges: Badge[];
    streaks: Streak[];
    rank: LeaderboardEntry | null;
    achievements: Achievement[];
  } {
    return {
      points: this.getUserPoints(userId),
      badges: this.getUserBadges(userId),
      streaks: this.getUserStreaks(userId),
      rank: this.getUserRank(userId),
      achievements: this.achievements.get(userId) || [],
    };
  }
}

// Export singleton instance
export const gamificationService = new GamificationService();
