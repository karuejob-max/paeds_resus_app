// tRPC router for guideline version control system

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { guidelines, guidelineChanges, protocolStatus, protocolGuidelines } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { checkGuidelineUpdates, getProtocolsNeedingReview } from '../guideline-monitor';

export const guidelinesRouter = router({
  // Get flagged protocols requiring review
  getFlaggedProtocols: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return await getProtocolsNeedingReview();
  }),

  // Get recent guideline changes
  getRecentChanges: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const changes = await db
      .select()
      .from(guidelineChanges)
      .orderBy(desc(guidelineChanges.detectedAt))
      .limit(20);

    // Enrich with guideline information
    const enriched = await Promise.all(
      changes.map(async (change) => {
        const guideline = await db
          .select()
          .from(guidelines)
          .where(eq(guidelines.id, change.guidelineId))
          .limit(1);

        return {
          ...change,
          guidelineTitle: guideline[0]?.title || 'Unknown',
          organization: guideline[0]?.organization || 'Unknown',
        };
      })
    );

    return enriched;
  }),

  // Get statistics for dashboard
  getStatistics: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { flaggedCount: 0, currentCount: 0, pendingChanges: 0, lastCheck: 'Never' };
    const flagged = await db
      .select()
      .from(protocolStatus)
      .where(eq(protocolStatus.currentStatus, 'flagged'));

    const current = await db
      .select()
      .from(protocolStatus)
      .where(eq(protocolStatus.currentStatus, 'current'));

    const pendingChanges = flagged.reduce((sum, p) => sum + (p.pendingChanges || 0), 0);

    return {
      flaggedCount: flagged.length,
      currentCount: current.length,
      pendingChanges,
      lastCheck: 'Today', // Placeholder - would track actual last check time
    };
  }),

  // Mark protocol as reviewed
  markProtocolReviewed: protectedProcedure
    .input(
      z.object({
        protocolId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db
        .update(protocolStatus)
        .set({
          currentStatus: 'current',
          lastReviewed: new Date(),
          pendingChanges: 0,
          flagReason: null,
          updatedAt: new Date(),
        })
        .where(eq(protocolStatus.protocolId, input.protocolId));

      return { success: true };
    }),

  // Manually trigger guideline check
  checkForUpdates: protectedProcedure.mutation(async () => {
    const results = await checkGuidelineUpdates();
    return results;
  }),

  // Get protocol guideline mappings
  getProtocolGuidelines: protectedProcedure
    .input(
      z.object({
        protocolId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(protocolGuidelines)
        .where(eq(protocolGuidelines.protocolId, input.protocolId));
    }),

  // Get all guidelines
  getAllGuidelines: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return await db
      .select()
      .from(guidelines)
      .orderBy(desc(guidelines.publicationDate));
  }),

  // Get guideline by ID
  getGuidelineById: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const guideline = await db
        .select()
        .from(guidelines)
        .where(eq(guidelines.id, input.id))
        .limit(1);

      return guideline[0] || null;
    }),
});
