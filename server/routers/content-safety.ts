import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { contentSafetyReports } from "../../drizzle/schema";
import { trackEvent } from "../services/analytics.service";

export const contentSafetyRouter = router({
  reportUnsafeContent: protectedProcedure
    .input(
      z.object({
        courseId: z.string().min(1).max(64),
        moduleId: z.number().int().positive().optional(),
        message: z.string().min(10).max(4000),
        /** UI surface for analytics (fellowship player, AHA player, ResusGPS). */
        surface: z.enum(["fellowship_player", "aha_player", "resus_gps"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return { success: false as const, error: "Database not available" };
      }

      await db.insert(contentSafetyReports).values({
        userId: ctx.user.id,
        courseId: input.courseId,
        moduleId: input.moduleId ?? null,
        message: input.message.trim(),
        status: "open",
      });

      void trackEvent({
        userId: ctx.user.id,
        eventType: "content_safety",
        eventName: "unsafe_content_reported",
        eventData: {
          courseId: input.courseId,
          moduleId: input.moduleId,
          surface: input.surface,
        },
        sessionId: `content_safety_${input.courseId}`,
      });

      return { success: true as const };
    }),

  listReports: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const limit = input?.limit ?? 50;
      return db
        .select()
        .from(contentSafetyReports)
        .orderBy(desc(contentSafetyReports.createdAt))
        .limit(limit);
    }),
});
