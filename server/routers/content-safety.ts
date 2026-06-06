import { z } from "zod";
import { desc } from "drizzle-orm";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { contentSafetyReports } from "../../drizzle/schema";
import { createPlatformFeedbackTicket } from "../lib/platform-feedback-tickets";
import { trackEvent } from "../services/analytics.service";

export const contentSafetyRouter = router({
  reportUnsafeContent: protectedProcedure
    .input(
      z.object({
        courseId: z.string().min(1).max(64),
        moduleId: z.number().int().positive().optional(),
        message: z.string().min(10).max(4000),
        surface: z.enum(["fellowship_player", "aha_player", "resus_gps"]).optional(),
        pageUrl: z.string().max(512).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false as const, error: "Database not available" };

      const ticketResult = await createPlatformFeedbackTicket({
        userId: ctx.user.id,
        category: "safety_concern",
        message: input.message.trim(),
        contextJson: {
          pageUrl: input.pageUrl,
          courseId: input.courseId,
          courseSlug: input.courseId,
          moduleId: input.moduleId,
          surface: input.surface,
        },
        priority: "safety",
      });
      if (!ticketResult.success) return { success: false as const, error: ticketResult.error };

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
        eventData: { courseId: input.courseId, moduleId: input.moduleId, surface: input.surface, ticketId: ticketResult.ticketId },
        sessionId: `content_safety_${input.courseId}`,
      });

      return { success: true as const, ticketId: ticketResult.ticketId };
    }),

  listReports: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(contentSafetyReports).orderBy(desc(contentSafetyReports.createdAt)).limit(input?.limit ?? 50);
    }),
});
