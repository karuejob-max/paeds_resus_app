/**
 * Streak Tracking System
 * 
 * Tracks consecutive days of practice per condition to drive engagement (Pillar B).
 * Supports facility-level leaderboards and anonymized comparisons.
 * 
 * Strategic alignment: Gamification drives daily ResusGPS practice → mastery → fellowship readiness
 * 
 * Timezone: EAT (UTC+3) for consistency across East African facilities
 */

import { getDb } from '../db';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { analyticsEvents } from '../../drizzle/schema';

const EAT_OFFSET = 3 * 60 * 60 * 1000; // UTC+3

/**
 * Get start of day in EAT timezone
 */
export function getEATDayStart(date: Date = new Date()): Date {
  const utcDate = new Date(date.getTime() + EAT_OFFSET);
  utcDate.setUTCHours(0, 0, 0, 0);
  return new Date(utcDate.getTime() - EAT_OFFSET);
}

/**
 * Get end of day in EAT timezone
 */
export function getEATDayEnd(date: Date = new Date()): Date {
  const utcDate = new Date(date.getTime() + EAT_OFFSET);
  utcDate.setUTCHours(23, 59, 59, 999);
  return new Date(utcDate.getTime() - EAT_OFFSET);
}

/**
 * Calculate streak for a user and condition
 * Returns: { currentStreak, longestStreak, lastPracticeDate, milestone }
 */
export async function calculateStreak(userId: number, condition: string) {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  // Get user's ResusGPS sessions for this condition (last 90 days)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const events = await db
    .select()
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.userId, userId),
        eq(analyticsEvents.eventType, 'resusGps_session_completed'),
        gte(analyticsEvents.createdAt, ninetyDaysAgo)
      )
    )
    .orderBy(desc(analyticsEvents.createdAt));

  // Parse events and find sessions for this condition
  const practicesByDay = new Map<string, boolean>();
  let lastPracticeDate: Date | null = null;

  for (const event of events) {
    try {
      const data = typeof event.eventData === 'string' 
        ? JSON.parse(event.eventData) 
        : event.eventData;
      
      if (data.attributedConditions?.includes(condition)) {
        const dayKey = getEATDayStart(event.createdAt).toISOString().split('T')[0];
        practicesByDay.set(dayKey, true);
        if (!lastPracticeDate) lastPracticeDate = event.createdAt;
      }
    } catch (e) {
      console.error('Error parsing event data:', e);
    }
  }

  // Calculate current streak (from today backwards)
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  const today = getEATDayStart();
  let checkDate = new Date(today);

  for (let i = 0; i < 90; i++) {
    const dayKey = checkDate.toISOString().split('T')[0];
    if (practicesByDay.has(dayKey)) {
      tempStreak++;
      if (i === 0 || (i === 1 && !practicesByDay.has(today.toISOString().split('T')[0]))) {
        currentStreak = tempStreak; // Current streak if today or yesterday practiced
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
    checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
  }

  // Determine milestone badge
  let milestone: 'bronze' | 'silver' | 'gold' | 'platinum' | null = null;
  if (currentStreak >= 30) milestone = 'platinum';
  else if (currentStreak >= 14) milestone = 'gold';
  else if (currentStreak >= 7) milestone = 'silver';

  return {
    currentStreak,
    longestStreak,
    lastPracticeDate,
    milestone,
    practiceCount: practicesByDay.size,
  };
}

/**
 * Get facility-level streak leaderboard (anonymized)
 * Returns top 10 conditions by average streak across active learners
 */
export async function getFacilityStreakLeaderboard(institutionId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  // Get all staff at this institution
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  // Query active sessions in last 30 days
  const recentSessions = await db
    .select()
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, 'resusGps_session_completed'),
        gte(analyticsEvents.createdAt, thirtyDaysAgo)
      )
    )
    .orderBy(desc(analyticsEvents.createdAt));

  // Aggregate by condition
  const conditionStats = new Map<string, { totalStreak: number; userCount: number }>();

  for (const session of recentSessions) {
    try {
      const data = typeof session.eventData === 'string'
        ? JSON.parse(session.eventData)
        : session.eventData;

      if (data.attributedConditions) {
        for (const condition of data.attributedConditions) {
          if (!conditionStats.has(condition)) {
            conditionStats.set(condition, { totalStreak: 0, userCount: 0 });
          }
          const stats = conditionStats.get(condition)!;
          stats.totalStreak += 1;
          stats.userCount += 1;
        }
      }
    } catch (e) {
      console.error('Error parsing session data:', e);
    }
  }

  // Calculate averages and sort
  const leaderboard = Array.from(conditionStats.entries())
    .map(([condition, stats]) => ({
      condition,
      avgStreak: Math.round(stats.totalStreak / stats.userCount),
      activeUsers: stats.userCount,
    }))
    .sort((a, b) => b.avgStreak - a.avgStreak)
    .slice(0, 10);

  return leaderboard;
}

/**
 * Get streak milestones for a user across all conditions
 */
export async function getUserStreakMilestones(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  // Get all conditions this user has practiced
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const events = await db
    .select()
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.userId, userId),
        eq(analyticsEvents.eventType, 'resusGps_session_completed'),
        gte(analyticsEvents.createdAt, thirtyDaysAgo)
      )
    );

  const conditions = new Set<string>();
  for (const event of events) {
    try {
      const data = typeof event.eventData === 'string'
        ? JSON.parse(event.eventData)
        : event.eventData;
      if (data.attributedConditions) {
        data.attributedConditions.forEach((c: string) => conditions.add(c));
      }
    } catch (e) {
      console.error('Error parsing event data:', e);
    }
  }

  // Calculate streaks for each condition
  const milestones = [];
  for (const condition of conditions) {
    const streak = await calculateStreak(userId, condition);
    if (streak.milestone) {
      milestones.push({
        condition,
        milestone: streak.milestone,
        currentStreak: streak.currentStreak,
        lastPracticeDate: streak.lastPracticeDate,
      });
    }
  }

  return milestones.sort((a, b) => b.currentStreak - a.currentStreak);
}
