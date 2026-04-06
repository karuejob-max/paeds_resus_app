/**
 * Streak Notification System
 * 
 * Sends daily reminders and weekly digests to drive Pillar B engagement.
 * Uses EAT timezone (UTC+3) for consistency across East African facilities.
 * 
 * Strategic alignment: Gamification drives daily practice → mastery → fellowship readiness
 */

import { getDb } from '../db';
import { eq, and, gte } from 'drizzle-orm';
import { users, analyticsEvents } from '../../drizzle/schema';
import { notifyOwner } from '../_core/notification';
import { calculateStreak } from './streak-tracking';

const EAT_OFFSET = 3 * 60 * 60 * 1000; // UTC+3

/**
 * Get EAT time
 */
function getEATTime(): Date {
  return new Date(Date.now() + EAT_OFFSET);
}

/**
 * Check if it's 7am EAT (optimal reminder time)
 */
function isReminderTime(): boolean {
  const eatTime = getEATTime();
  const hour = eatTime.getUTCHours();
  const minute = eatTime.getUTCMinutes();
  
  // Send reminder between 7:00-7:59 EAT
  return hour === 7 && minute < 60;
}

/**
 * Check if it's Monday 8am EAT (weekly digest time)
 */
function isWeeklyDigestTime(): boolean {
  const eatTime = getEATTime();
  const day = eatTime.getUTCDay();
  const hour = eatTime.getUTCHours();
  
  // Send digest on Monday at 8am EAT
  return day === 1 && hour === 8;
}

/**
 * Send daily streak reminder to user
 * Called by scheduled job at 7am EAT
 */
export async function sendDailyStreakReminder(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  // Get user
  const user = await db.select().from(users).where(eq(users.id, userId));
  if (!user || user.length === 0) return;

  // Get active streaks (7+ days)
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

  // Find conditions with active streaks
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

  // Calculate streaks
  const streaks = [];
  for (const condition of conditions) {
    const streak = await calculateStreak(userId, condition);
    if (streak.currentStreak >= 7) {
      streaks.push({
        condition,
        streak: streak.currentStreak,
        milestone: streak.milestone,
      });
    }
  }

  if (streaks.length === 0) {
    // No active streaks - encourage user to start
    return {
      subject: 'Start your ResusGPS streak today! 🔥',
      body: 'Practice any condition in ResusGPS to begin building your streak and earn badges.',
      type: 'streak_encouragement',
    };
  }

  // Sort by streak length
  streaks.sort((a, b) => b.streak - a.streak);
  const topStreak = streaks[0];

  let message = `Keep your ${topStreak.streak}-day streak alive! 🔥`;
  if (topStreak.milestone === 'platinum') {
    message = `You're a 30-day champion! Maintain your streak! 👑`;
  } else if (topStreak.milestone === 'gold') {
    message = `14-day master! Keep the momentum going! 🏆`;
  } else if (topStreak.milestone === 'silver') {
    message = `7-day streak! You're on fire! ⚡`;
  }

  return {
    subject: message,
    body: `Complete a ResusGPS session for ${topStreak.condition} to keep your streak going.`,
    type: 'streak_reminder',
    data: {
      topCondition: topStreak.condition,
      currentStreak: topStreak.streak,
      milestone: topStreak.milestone,
    },
  };
}

/**
 * Send weekly digest to user
 * Called by scheduled job on Monday 8am EAT
 */
export async function sendWeeklyStreakDigest(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  // Get user
  const user = await db.select().from(users).where(eq(users.id, userId));
  if (!user || user.length === 0) return;

  // Get sessions from last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekSessions = await db
    .select()
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.userId, userId),
        eq(analyticsEvents.eventType, 'resusGps_session_completed'),
        gte(analyticsEvents.createdAt, sevenDaysAgo)
      )
    );

  const sessionCount = weekSessions.length;
  const conditions = new Set<string>();
  
  for (const session of weekSessions) {
    try {
      const data = typeof session.eventData === 'string'
        ? JSON.parse(session.eventData)
        : session.eventData;
      if (data.attributedConditions) {
        data.attributedConditions.forEach((c: string) => conditions.add(c));
      }
    } catch (e) {
      console.error('Error parsing session data:', e);
    }
  }

  // Get all active streaks
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const allEvents = await db
    .select()
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.userId, userId),
        eq(analyticsEvents.eventType, 'resusGps_session_completed'),
        gte(analyticsEvents.createdAt, thirtyDaysAgo)
      )
    );

  const allConditions = new Set<string>();
  for (const event of allEvents) {
    try {
      const data = typeof event.eventData === 'string'
        ? JSON.parse(event.eventData)
        : event.eventData;
      if (data.attributedConditions) {
        data.attributedConditions.forEach((c: string) => allConditions.add(c));
      }
    } catch (e) {
      console.error('Error parsing event data:', e);
    }
  }

  // Calculate streaks for all conditions
  const streaks = [];
  for (const condition of allConditions) {
    const streak = await calculateStreak(userId, condition);
    if (streak.currentStreak >= 7) {
      streaks.push({
        condition,
        streak: streak.currentStreak,
        milestone: streak.milestone,
      });
    }
  }

  streaks.sort((a, b) => b.streak - a.streak);

  return {
    subject: `Your Weekly ResusGPS Summary 📊`,
    body: `
This week you completed ${sessionCount} sessions across ${conditions.size} conditions.

Your Active Streaks:
${streaks.slice(0, 3).map(s => `• ${s.condition}: ${s.streak} days ${s.milestone ? `(${s.milestone})` : ''}`).join('\n')}

Keep practicing to maintain your streaks and earn more badges!
    `.trim(),
    type: 'weekly_digest',
    data: {
      sessionsThisWeek: sessionCount,
      conditionsThisWeek: conditions.size,
      activeStreaks: streaks.length,
      topStreaks: streaks.slice(0, 3),
    },
  };
}

/**
 * Send facility-level weekly digest to admin
 * Shows top performers, training gaps, and engagement trends
 */
export async function sendFacilityWeeklyDigest(institutionId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  // Get sessions from last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekSessions = await db
    .select()
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, 'resusGps_session_completed'),
        gte(analyticsEvents.createdAt, sevenDaysAgo)
      )
    );

  // Aggregate stats
  const conditionStats = new Map<string, number>();
  const userSessions = new Map<number, number>();

  for (const session of weekSessions) {
    try {
      const data = typeof session.eventData === 'string'
        ? JSON.parse(session.eventData)
        : session.eventData;

      if (data.attributedConditions) {
        for (const condition of data.attributedConditions) {
          conditionStats.set(condition, (conditionStats.get(condition) || 0) + 1);
        }
      }

      if (session.userId) {
        userSessions.set(session.userId, (userSessions.get(session.userId) || 0) + 1);
      }
    } catch (e) {
      console.error('Error parsing session data:', e);
    }
  }

  // Top conditions
  const topConditions = Array.from(conditionStats.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([condition, count]) => ({ condition, sessions: count }));

  // Top performers
  const topPerformers = Array.from(userSessions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    subject: `Facility Weekly Report: ${weekSessions.length} Sessions Completed`,
    body: `
This week your facility completed ${weekSessions.length} ResusGPS sessions.

Top Practiced Conditions:
${topConditions.map(c => `• ${c.condition}: ${c.sessions} sessions`).join('\n')}

Active Learners: ${userSessions.size}

Continue encouraging your team to maintain their streaks!
    `.trim(),
    type: 'facility_weekly_digest',
    data: {
      totalSessions: weekSessions.length,
      uniqueUsers: userSessions.size,
      topConditions,
      topPerformers: topPerformers.length,
    },
  };
}

/**
 * Scheduled job: Run at 7am EAT daily
 */
export async function runDailyReminderJob() {
  if (!isReminderTime()) return;

  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  // Get all active users
  const activeUsers = await db.select().from(users);

  for (const user of activeUsers) {
    try {
      await sendDailyStreakReminder(user.id);
    } catch (error) {
      console.error(`Failed to send reminder to user ${user.id}:`, error);
    }
  }
}

/**
 * Scheduled job: Run on Monday 8am EAT
 */
export async function runWeeklyDigestJob() {
  if (!isWeeklyDigestTime()) return;

  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  // Get all active users
  const activeUsers = await db.select().from(users);

  for (const user of activeUsers) {
    try {
      await sendWeeklyStreakDigest(user.id);
    } catch (error) {
      console.error(`Failed to send weekly digest to user ${user.id}:`, error);
    }
  }
}
