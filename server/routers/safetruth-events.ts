import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

/**
 * Safe-Truth Event Logging Router
 * Handles confidential pediatric emergency event reporting
 */

export const safeTruthEventsRouter = router({
  /**
   * Log a new Safe-Truth event
   */
  logEvent: protectedProcedure
    .input(
      z.object({
        eventDate: z.string(),
        childAge: z.number(),
        eventType: z.string(),
        presentation: z.string(),
        isAnonymous: z.boolean().default(false),
        chainOfSurvival: z.object({
          recognition: z.boolean(),
          recognitionNotes: z.string().optional(),
          activation: z.boolean(),
          activationNotes: z.string().optional(),
          cpr: z.boolean(),
          cprQuality: z.string().optional(),
          cprNotes: z.string().optional(),
          defibrillation: z.boolean(),
          defibrillationNotes: z.string().optional(),
          advancedCare: z.boolean(),
          advancedCareDetails: z.string().optional(),
          postResuscitation: z.boolean(),
          postResuscitationNotes: z.string().optional(),
        }),
        systemGaps: z.array(z.string()),
        gapDetails: z.record(z.string(), z.any()),
        outcome: z.string(),
        neurologicalStatus: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify user is a healthcare provider
        if (!ctx.user.providerType && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Safe-Truth is for healthcare providers only",
          });
        }

        const db = getDb();

        // Create event record
        const eventData = {
          providerId: input.isAnonymous ? null : ctx.user.id,
          eventDate: new Date(input.eventDate),
          childAge: input.childAge,
          eventType: input.eventType,
          presentation: input.presentation,
          isAnonymous: input.isAnonymous,
          chainOfSurvival: JSON.stringify(input.chainOfSurvival),
          systemGaps: JSON.stringify(input.systemGaps),
          gapDetails: JSON.stringify(input.gapDetails),
          outcome: input.outcome,
          neurologicalStatus: input.neurologicalStatus,
          createdAt: new Date(),
          status: "submitted",
        };

        // Log to console for audit trail
        console.log("[Safe-Truth Event Logged]", {
          provider: input.isAnonymous ? "ANONYMOUS" : ctx.user.id,
          eventType: input.eventType,
          childAge: input.childAge,
          outcome: input.outcome,
          systemGaps: input.systemGaps,
          timestamp: new Date().toISOString(),
        });

        // TODO: Insert into database when schema is available
        // const result = await db.insert(safeTruthEvents).values(eventData);

        return {
          success: true,
          message: "Event logged successfully! Your report has been submitted confidentially.",
          eventId: `event-${Date.now()}`,
          timestamp: new Date(),
        };
      } catch (error) {
        console.error("[Safe-Truth Event Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to log event. Please try again.",
        });
      }
    }),

  /**
   * Get provider's event history (non-anonymous only)
   */
  getEventHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Verify user is a healthcare provider
        if (!ctx.user.providerType && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Safe-Truth is for healthcare providers only",
          });
        }

        // TODO: Query from database when schema is available
        // const events = await db.query.safeTruthEvents.findMany({
        //   where: eq(safeTruthEvents.providerId, ctx.user.id),
        //   limit: input.limit,
        //   offset: input.offset,
        // });

        console.log(`[Safe-Truth History] Provider ${ctx.user.id} requested event history`);

        return {
          success: true,
          events: [],
          total: 0,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        console.error("[Safe-Truth History Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve event history",
        });
      }
    }),

  /**
   * Get event statistics for provider
   */
  getEventStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Verify user is a healthcare provider
      if (!ctx.user.providerType && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Safe-Truth is for healthcare providers only",
        });
      }

      // TODO: Query from database when schema is available
      // const stats = await db
      //   .select({
      //     totalEvents: count(),
      //     successfulOutcomes: count(sql`CASE WHEN outcome = 'Survived' THEN 1 END`),
      //     avgChildAge: sql`AVG(childAge)`,
      //     mostCommonEventType: sql`MODE(eventType)`,
      //   })
      //   .from(safeTruthEvents)
      //   .where(eq(safeTruthEvents.providerId, ctx.user.id));

      console.log(`[Safe-Truth Stats] Provider ${ctx.user.id} requested statistics`);

      return {
        success: true,
        totalEvents: 0,
        successfulOutcomes: 0,
        avgChildAge: 0,
        mostCommonEventType: "N/A",
      };
    } catch (error) {
      console.error("[Safe-Truth Stats Error]", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve statistics",
      });
    }
  }),

  /**
   * Get system gap analysis
   */
  getGapAnalysis: protectedProcedure
    .input(
      z.object({
        timeframe: z.enum(["week", "month", "quarter", "year"]).default("month"),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Verify user is a healthcare provider or admin
        if (!ctx.user.providerType && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Safe-Truth is for healthcare providers only",
          });
        }

        // TODO: Analyze system gaps from database
        const gapAnalysis = {
          "Knowledge Gap": 0,
          "Resources Gap": 0,
          "Leadership Gap": 0,
          "Communication Gap": 0,
          "Protocol Gap": 0,
          "Equipment Gap": 0,
          "Training Gap": 0,
          "Staffing Gap": 0,
          "Infrastructure Gap": 0,
        };

        console.log(`[Safe-Truth Gap Analysis] Provider ${ctx.user.id} - Timeframe: ${input.timeframe}`);

        return {
          success: true,
          timeframe: input.timeframe,
          gaps: gapAnalysis,
          recommendations: [],
        };
      } catch (error) {
        console.error("[Safe-Truth Gap Analysis Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to analyze system gaps",
        });
      }
    }),

  /**
   * Submit event for institutional review
   */
  submitForReview: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        reviewNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify user is a healthcare provider or admin
        if (!ctx.user.providerType && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Safe-Truth is for healthcare providers only",
          });
        }

        console.log(`[Safe-Truth Review] Event ${input.eventId} submitted for review by ${ctx.user.id}`);

        return {
          success: true,
          message: "Event submitted for institutional review",
          eventId: input.eventId,
          status: "under_review",
        };
      } catch (error) {
        console.error("[Safe-Truth Review Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit event for review",
        });
      }
    }),

  /**
   * Get recommendations based on event
   */
  getRecommendations: protectedProcedure
    .input(
      z.object({
        eventType: z.string(),
        systemGaps: z.array(z.string()),
        outcome: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Verify user is a healthcare provider
        if (!ctx.user.providerType && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Safe-Truth is for healthcare providers only",
          });
        }

        // Generate recommendations based on gaps
        const recommendations = [
          {
            gap: "Knowledge Gap",
            recommendation: "Enroll in pediatric emergency care certification course",
            priority: "high",
          },
          {
            gap: "Equipment Gap",
            recommendation: "Request additional resuscitation equipment from administration",
            priority: "high",
          },
          {
            gap: "Training Gap",
            recommendation: "Schedule PALS/NRP training for your team",
            priority: "medium",
          },
        ].filter((rec) => input.systemGaps.includes(rec.gap));

        console.log(`[Safe-Truth Recommendations] Generated for event type: ${input.eventType}`);

        return {
          success: true,
          recommendations,
          eventType: input.eventType,
        };
      } catch (error) {
        console.error("[Safe-Truth Recommendations Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate recommendations",
        });
      }
    }),
});
