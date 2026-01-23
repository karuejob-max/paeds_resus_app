/**
 * Operational Data Integration
 * 
 * Query real platform data instead of hardcoded metrics
 */

import { getDb } from '../db';
import { users, certificates, payments } from '../../drizzle/schema';

export class UserMetrics {
  static async getUserGrowthMetrics() {
    try {
      const db = await getDb();
      if (!db) return null;

      const allUsers = await db.select().from(users);
      const activeUsers = allUsers.filter((u: any) => {
        const lastActive = u.lastActive || new Date(0);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return new Date(lastActive) > thirtyDaysAgo;
      });

      const newUsersThisMonth = allUsers.filter((u: any) => {
        const createdAt = u.createdAt || new Date(0);
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        return new Date(createdAt) > firstDayOfMonth;
      });

      const monthlyGrowthRate = newUsersThisMonth.length / Math.max(allUsers.length - newUsersThisMonth.length, 1);

      return {
        totalUsers: allUsers.length,
        activeUsers: activeUsers.length,
        activeUserRate: ((activeUsers.length / allUsers.length) * 100).toFixed(1),
        newUsersThisMonth: newUsersThisMonth.length,
        monthlyGrowthRate: (monthlyGrowthRate * 100).toFixed(1),
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[UserMetrics] Error:', error);
      return null;
    }
  }

  static async getUserRetentionMetrics() {
    try {
      const db = await getDb();
      if (!db) return null;

      const allUsers = await db.select().from(users);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const usersCreatedThirtyDaysAgo = allUsers.filter((u: any) => {
        const createdAt = u.createdAt || new Date(0);
        return new Date(createdAt) <= thirtyDaysAgo;
      });

      const retainedUsers = usersCreatedThirtyDaysAgo.filter((u: any) => {
        const lastActive = u.lastActive || new Date(0);
        return new Date(lastActive) > thirtyDaysAgo;
      });

      const retentionRate = usersCreatedThirtyDaysAgo.length > 0 
        ? (retainedUsers.length / usersCreatedThirtyDaysAgo.length) * 100 
        : 0;

      return {
        usersCreatedThirtyDaysAgo: usersCreatedThirtyDaysAgo.length,
        retainedUsers: retainedUsers.length,
        retentionRate: retentionRate.toFixed(1),
        churnRate: (100 - retentionRate).toFixed(1),
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[UserMetrics] Error:', error);
      return null;
    }
  }
}

export class RevenueMetrics {
  static async getARPU() {
    try {
      const db = await getDb();
      if (!db) return null;

      const allPayments = await db.select().from(payments);
      const allUsers = await db.select().from(users);

      const totalRevenue = allPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const arpu = allUsers.length > 0 ? totalRevenue / allUsers.length : 0;

      return {
        totalRevenue: totalRevenue.toFixed(2),
        totalUsers: allUsers.length,
        arpu: arpu.toFixed(2),
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[RevenueMetrics] Error:', error);
      return null;
    }
  }

  static async getMonthlyRevenue() {
    try {
      const db = await getDb();
      if (!db) return null;

      const allPayments = await db.select().from(payments);
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const thisMonthPayments = allPayments.filter((p: any) => {
        const createdAt = p.createdAt || new Date(0);
        return new Date(createdAt) >= thisMonth;
      });

      const monthlyRevenue = thisMonthPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

      return {
        monthlyRevenue: monthlyRevenue.toFixed(2),
        transactionCount: thisMonthPayments.length,
        averageTransactionValue: thisMonthPayments.length > 0 
          ? (monthlyRevenue / thisMonthPayments.length).toFixed(2) 
          : '0',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[RevenueMetrics] Error:', error);
      return null;
    }
  }
}

export class LearningMetrics {
  static async getCertificationMetrics() {
    try {
      const db = await getDb();
      if (!db) return null;

      const allCertificates = await db.select().from(certificates);
      const allUsers = await db.select().from(users);

      const certificationRate = allUsers.length > 0 
        ? (allCertificates.length / allUsers.length) * 100 
        : 0;

      const certificationsThisMonth = allCertificates.filter((c: any) => {
        const createdAt = c.createdAt || new Date(0);
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        return new Date(createdAt) > firstDayOfMonth;
      }).length;

      return {
        totalCertifications: allCertificates.length,
        totalUsers: allUsers.length,
        certificationRate: certificationRate.toFixed(1),
        certificationsThisMonth,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[LearningMetrics] Error:', error);
      return null;
    }
  }
}

export class OperationalDataIntegration {
  static async getAllRealMetrics() {
    console.log('[Operational Data Integration] Fetching all real metrics');

    const userGrowth = await UserMetrics.getUserGrowthMetrics();
    const userRetention = await UserMetrics.getUserRetentionMetrics();
    const arpu = await RevenueMetrics.getARPU();
    const monthlyRevenue = await RevenueMetrics.getMonthlyRevenue();
    const certifications = await LearningMetrics.getCertificationMetrics();

    return {
      timestamp: new Date(),
      userMetrics: { growth: userGrowth, retention: userRetention },
      revenueMetrics: { arpu, monthlyRevenue },
      learningMetrics: { certifications },
      status: 'COMPLETE',
    };
  }
}
