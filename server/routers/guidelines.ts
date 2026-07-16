// tRPC router for guideline version control system

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { guidelines, guidelineChanges, protocolStatus, protocolGuidelines } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { checkGuidelineUpdates, getProtocolsNeedingReview } from '../guideline-monitor';
import { invokeLLM } from '../_core/llm';

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

  // Analyze a text block of a local hospital's guideline and run a drift compliance audit
  analyzeGuidelineDrift: protectedProcedure
    .input(
      z.object({
        protocolId: z.string(),
        guidelineText: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const DRIFT_SYSTEM_PROMPT = `You are a clinical compliance auditor for pediatric emergency guidelines.
Analyze the provided hospital guideline text and compare it to the platform standard protocol ID.
Identify any protocol drift, drug dosage discrepancies, age/weight threshold mismatches, or diagnostic deviations.

Return ONLY a valid JSON object matching this schema:
{
  "complianceScore": 85, // integer 0 to 100
  "status": "aligned|deviated|critical_mismatch",
  "discrepancies": [
    {
      "severity": "info|warning|critical",
      "topic": "Topic category (e.g. Adrenaline Dosing)",
      "standard": "Standard protocol guideline description (e.g. 0.01 mg/kg IV)",
      "local": "Local guideline description (e.g. 0.02 mg/kg IV)",
      "explanation": "Brief explanation of the clinical risk of this deviation"
    }
  ]
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: DRIFT_SYSTEM_PROMPT },
            { role: "user", content: `Reference Protocol ID: ${input.protocolId}\nLocal Hospital Guideline Text:\n${input.guidelineText}` },
          ],
          responseFormat: { type: "json_object" },
        });

        const rawContent = response.choices[0]?.message?.content || "{}";
        const contentStr = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
        const parsed = JSON.parse(contentStr.trim().replace(/^```json\s*/i, "").replace(/```$/i, ""));

        return {
          success: true,
          complianceScore: parsed.complianceScore ?? 100,
          status: parsed.status ?? "aligned",
          discrepancies: parsed.discrepancies ?? [],
        };
      } catch (error) {
        console.error("[Guidelines] analyzeGuidelineDrift error:", error);
        throw new Error("Failed to run guideline compliance drift analysis");
      }
    }),
});
