/**
 * sample-history.ts
 *
 * Server-side SAMPLE history persistence — Phase 5.2
 *
 * Endpoints:
 *   - saveSampleHistory: upsert the provider's last SAMPLE history (called on case end)
 *   - getLastSampleHistory: retrieve the provider's last SAMPLE history (called on case start)
 */

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { providerSampleHistory } from '../../drizzle/schema';

const sampleHistoryInput = z.object({
  signs: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  pastHistory: z.string().optional(),
  lastMeal: z.string().optional(),
  events: z.string().optional(),
  caseWeight: z.number().optional(),
  caseAge: z.string().optional(),
});

export const sampleHistoryRouter = router({
  /**
   * Upsert the provider's SAMPLE history.
   * Called when a ResusGPS case ends (or when SAMPLE fields are updated).
   */
  saveSampleHistory: protectedProcedure
    .input(sampleHistoryInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: 'Database unavailable' };
      const userId = ctx.user.id;

      // Check if a row already exists for this user
      const existing = await db
        .select({ id: providerSampleHistory.id })
        .from(providerSampleHistory)
        .where(eq(providerSampleHistory.userId, userId))
        .limit(1);

      if (existing.length > 0) {
        // Update existing row
        await db
          .update(providerSampleHistory)
          .set({
            signs: input.signs ?? null,
            allergies: input.allergies ?? null,
            medications: input.medications ?? null,
            pastHistory: input.pastHistory ?? null,
            lastMeal: input.lastMeal ?? null,
            events: input.events ?? null,
            caseWeight: input.caseWeight?.toString() ?? null,
            caseAge: input.caseAge ?? null,
          })
          .where(eq(providerSampleHistory.userId, userId));
      } else {
        // Insert new row
        await db.insert(providerSampleHistory).values({
          userId,
          signs: input.signs ?? null,
          allergies: input.allergies ?? null,
          medications: input.medications ?? null,
          pastHistory: input.pastHistory ?? null,
          lastMeal: input.lastMeal ?? null,
          events: input.events ?? null,
          caseWeight: input.caseWeight?.toString() ?? null,
          caseAge: input.caseAge ?? null,
        });
      }

      return { success: true };
    }),

  /**
   * Retrieve the provider's last SAMPLE history.
   * Called when a new ResusGPS case starts to pre-fill the SAMPLE fields.
   */
  getLastSampleHistory: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const userId = ctx.user.id;

      const rows = await db
        .select()
        .from(providerSampleHistory)
        .where(eq(providerSampleHistory.userId, userId))
        .limit(1);

      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        signs: row.signs ?? '',
        allergies: row.allergies ?? '',
        medications: row.medications ?? '',
        pastHistory: row.pastHistory ?? '',
        lastMeal: row.lastMeal ?? '',
        events: row.events ?? '',
        caseWeight: row.caseWeight ? parseFloat(row.caseWeight) : undefined,
        caseAge: row.caseAge ?? undefined,
        updatedAt: row.updatedAt,
      };
    }),
});
