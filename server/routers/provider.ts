import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { providerProfiles, providerPerformanceMetrics, users } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const providerRouter = router({
  // Get or create provider profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    let profile = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.userId, ctx.user.id))
      .limit(1);

    if (!profile[0]) {
      // Create default profile if doesn't exist
      await db.insert(providerProfiles).values({
        userId: ctx.user.id,
        profileCompleted: false,
        profileCompletionPercentage: 0,
      });

      profile = await db
        .select()
        .from(providerProfiles)
        .where(eq(providerProfiles.userId, ctx.user.id))
        .limit(1);
    }

    return profile[0] || null;
  }),

  // Update provider profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        licenseNumber: z.string().optional(),
        licenseExpiry: z.date().optional(),
        specialization: z.string().optional(),
        yearsOfExperience: z.number().optional(),
        facilityName: z.string().optional(),
        facilityType: z.enum([
          "primary_health_center",
          "health_post",
          "district_hospital",
          "private_clinic",
          "ngo_clinic",
          "other",
        ]).optional(),
        facilityRegion: z.string().optional(),
        facilityCountry: z.string().optional(),
        facilityPhone: z.string().optional(),
        facilityEmail: z.string().optional(),
        averagePatientLoad: z.number().optional(),
        bio: z.string().optional(),
        certifications: z.array(z.string()).optional(),
        languages: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Calculate completion percentage
      let completionPercentage = 0;
      const fields = [
        input.licenseNumber,
        input.specialization,
        input.yearsOfExperience,
        input.facilityName,
        input.facilityType,
        input.facilityRegion,
        input.bio,
      ];
      completionPercentage = Math.round((fields.filter(f => f !== undefined && f !== null).length / fields.length) * 100);

      const updateData: any = {
        ...input,
        certifications: input.certifications ? JSON.stringify(input.certifications) : undefined,
        languages: input.languages ? JSON.stringify(input.languages) : undefined,
        profileCompletionPercentage: completionPercentage,
        profileCompleted: completionPercentage >= 80,
        updatedAt: new Date(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

      await db
        .update(providerProfiles)
        .set(updateData)
        .where(eq(providerProfiles.userId, ctx.user.id));

      return { success: true, completionPercentage };
    }),

  // Get provider performance metrics
  getPerformanceMetrics: protectedProcedure
    .input(z.object({ period: z.enum(["daily", "weekly", "monthly", "yearly"]).optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const query = db
        .select()
        .from(providerPerformanceMetrics)
        .where(eq(providerPerformanceMetrics.userId, ctx.user.id));

      let metrics = await query;

      if (input.period) {
        metrics = metrics.filter(m => m.period === input.period);
      }

      return metrics.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }),

  // Get provider dashboard data
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Get user info
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    // Get profile
    const profile = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.userId, ctx.user.id))
      .limit(1);

    // Get latest monthly metrics
    const metrics = await db
      .select()
      .from(providerPerformanceMetrics)
      .where(and(
        eq(providerPerformanceMetrics.userId, ctx.user.id),
        eq(providerPerformanceMetrics.period, "monthly")
      ))
      .orderBy(desc(providerPerformanceMetrics.createdAt))
      .limit(1);

    const currentMetrics = metrics[0] || {
      decisionsLogged: 0,
      diagnosticAccuracy: 0,
      avgDecisionTime: 0,
      protocolAdherence: 0,
      patientSurvivalRate: 0,
      livesSavedCount: 0,
      patientsMonitoredCount: 0,
      coursesCompleted: 0,
      certificationsEarned: 0,
      referralsMade: 0,
      earnings: 0,
    };

    return {
      user: user[0],
      profile: profile[0],
      currentMetrics,
      profileCompletion: profile[0]?.profileCompletionPercentage || 0,
    };
  }),

  // Initialize provider performance metrics for a new period
  initializeMetrics: protectedProcedure
    .input(z.object({ period: z.enum(["daily", "weekly", "monthly", "yearly"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      await db.insert(providerPerformanceMetrics).values({
        userId: ctx.user.id,
        period: input.period,
      });

      return { success: true };
    }),

  // Update provider performance metrics
  updateMetrics: protectedProcedure
    .input(
      z.object({
        period: z.enum(["daily", "weekly", "monthly", "yearly"]),
        decisionsLogged: z.number().optional(),
        diagnosticAccuracy: z.string().optional(),
        avgDecisionTime: z.number().optional(),
        protocolAdherence: z.string().optional(),
        patientSurvivalRate: z.string().optional(),
        livesSavedCount: z.number().optional(),
        patientsMonitoredCount: z.number().optional(),
        coursesCompleted: z.number().optional(),
        certificationsEarned: z.number().optional(),
        referralsMade: z.number().optional(),
        earnings: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get or create metrics for this period
      const existing = await db
        .select()
        .from(providerPerformanceMetrics)
        .where(and(
          eq(providerPerformanceMetrics.userId, ctx.user.id),
          eq(providerPerformanceMetrics.period, input.period)
        ))
        .orderBy(desc(providerPerformanceMetrics.createdAt))
        .limit(1);

      const { period, ...updates } = input;

      if (existing[0]) {
        await db
          .update(providerPerformanceMetrics)
          .set({
            ...updates,
            updatedAt: new Date(),
          } as any)
          .where(eq(providerPerformanceMetrics.id, existing[0].id));
      } else {
        await db.insert(providerPerformanceMetrics).values({
          userId: ctx.user.id,
          period,
          ...updates,
        } as any);
      }

      return { success: true };
    }),

  // Get provider statistics for comparison with peers
  getProviderStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Get current provider's metrics
    const myMetrics = await db
      .select()
      .from(providerPerformanceMetrics)
      .where(and(
        eq(providerPerformanceMetrics.userId, ctx.user.id),
        eq(providerPerformanceMetrics.period, "monthly")
      ))
      .orderBy(desc(providerPerformanceMetrics.createdAt))
      .limit(1);

    // Get all providers' metrics for comparison (peer average)
    const allMetrics = await db
      .select()
      .from(providerPerformanceMetrics)
      .where(eq(providerPerformanceMetrics.period, "monthly"))
      .orderBy(desc(providerPerformanceMetrics.createdAt));

    const myStats = myMetrics[0];

    // Calculate peer averages
    const peerAverages = {
      diagnosticAccuracy: allMetrics.length > 0
        ? Math.round(
            allMetrics.reduce((sum, m) => sum + Number(m.diagnosticAccuracy || 0), 0) / allMetrics.length
          )
        : 0,
      avgDecisionTime: allMetrics.length > 0
        ? Math.round(
            allMetrics.reduce((sum, m) => sum + (m.avgDecisionTime || 0), 0) / allMetrics.length
          )
        : 0,
      protocolAdherence: allMetrics.length > 0
        ? Math.round(
            allMetrics.reduce((sum, m) => sum + Number(m.protocolAdherence || 0), 0) / allMetrics.length
          )
        : 0,
      patientSurvivalRate: allMetrics.length > 0
        ? Math.round(
            allMetrics.reduce((sum, m) => sum + Number(m.patientSurvivalRate || 0), 0) / allMetrics.length
          )
        : 0,
    };

    return {
      myStats,
      peerAverages,
      comparison: {
        diagnosticAccuracy: {
          mine: Number(myStats?.diagnosticAccuracy || 0),
          peers: peerAverages.diagnosticAccuracy,
          percentile: myStats ? Math.round(((Number(myStats.diagnosticAccuracy || 0) - peerAverages.diagnosticAccuracy) / peerAverages.diagnosticAccuracy) * 100) : 0,
        },
        decisionSpeed: {
          mine: myStats?.avgDecisionTime || 0,
          peers: peerAverages.avgDecisionTime,
          percentile: myStats && peerAverages.avgDecisionTime > 0 ? Math.round(((peerAverages.avgDecisionTime - (myStats.avgDecisionTime || 0)) / peerAverages.avgDecisionTime) * 100) : 0,
        },
        protocolAdherence: {
          mine: Number(myStats?.protocolAdherence || 0),
          peers: peerAverages.protocolAdherence,
          percentile: myStats ? Math.round(((Number(myStats.protocolAdherence || 0) - peerAverages.protocolAdherence) / peerAverages.protocolAdherence) * 100) : 0,
        },
        patientSurvivalRate: {
          mine: Number(myStats?.patientSurvivalRate || 0),
          peers: peerAverages.patientSurvivalRate,
          percentile: myStats ? Math.round(((Number(myStats.patientSurvivalRate || 0) - peerAverages.patientSurvivalRate) / peerAverages.patientSurvivalRate) * 100) : 0,
        },
      },
    };
  }),
});
