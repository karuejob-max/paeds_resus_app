import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { careSignalEvents } from "../../drizzle/schema";
import { trackEvent } from "../services/analytics.service";

/**
 * Care Signal — provider incident & near-miss reporting (fellowship / QI pillar).
 * Parent short-form observations use the same `logEvent` with `parent-observation` + parent userType.
 * See PLATFORM_SOURCE_OF_TRUTH §3 / FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md.
 */

export const careSignalEventsRouter = router({
  /**
   * Log a Care Signal event (clinical staff) or parent-observation (parent Safe-Truth story short-form).
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
        const isParentStory =
          input.eventType === "parent-observation" && ctx.user.userType === "parent";
        if (!ctx.user.providerType && ctx.user.role !== "admin" && !isParentStory) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Care Signal is for healthcare providers. Parents: use Parent Safe-Truth to share your story.",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable. Please try again later.",
          });
        }

        const insertResult = await db.insert(careSignalEvents).values({
          userId: input.isAnonymous ? null : ctx.user.id,
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
          status: "submitted",
        });

        const insertId = (insertResult as unknown as { insertId: number }).insertId;

        await trackEvent({
          userId: ctx.user.id,
          eventType: "care_signal_submission_created",
          eventName: "Care Signal submission",
          eventData: {
            careSignalEventId: insertId,
            eventType: input.eventType,
            isAnonymous: input.isAnonymous,
          },
        });

        console.log("[Care Signal Event Logged]", {
          id: insertId,
          provider: input.isAnonymous ? "ANONYMOUS" : ctx.user.id,
          eventType: input.eventType,
          childAge: input.childAge,
          outcome: input.outcome,
          timestamp: new Date().toISOString(),
        });

        return {
          success: true,
          message: "Event logged successfully! Your report has been submitted confidentially.",
          eventId: String(insertId),
          timestamp: new Date(),
        };
      } catch (error) {
        console.error("[Care Signal Event Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to log event. Please try again.",
        });
      }
    }),

  getEventHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        if (!ctx.user.providerType && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Care Signal is for healthcare providers. Parents: use Parent Safe-Truth for your story.",
          });
        }

        console.log(`[Care Signal History] Provider ${ctx.user.id} requested event history`);

        return {
          success: true,
          events: [],
          total: 0,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        console.error("[Care Signal History Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve event history",
        });
      }
    }),

  getEventStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.user.providerType && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Care Signal is for healthcare providers. Parents: use Parent Safe-Truth for your story.",
        });
      }

      console.log(`[Care Signal Stats] Provider ${ctx.user.id} requested statistics`);

      return {
        success: true,
        totalEvents: 0,
        successfulOutcomes: 0,
        avgChildAge: 0,
        mostCommonEventType: "N/A",
      };
    } catch (error) {
      console.error("[Care Signal Stats Error]", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve statistics",
      });
    }
  }),

  getGapAnalysis: protectedProcedure
    .input(
      z.object({
        timeframe: z.enum(["week", "month", "quarter", "year"]).default("month"),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        if (!ctx.user.providerType && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Care Signal is for healthcare providers. Parents: use Parent Safe-Truth for your story.",
          });
        }

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

        console.log(`[Care Signal Gap Analysis] Provider ${ctx.user.id} - Timeframe: ${input.timeframe}`);

        return {
          success: true,
          timeframe: input.timeframe,
          gaps: gapAnalysis,
          recommendations: [],
        };
      } catch (error) {
        console.error("[Care Signal Gap Analysis Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to analyze system gaps",
        });
      }
    }),

  submitForReview: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        reviewNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user.providerType && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Care Signal is for healthcare providers. Parents: use Parent Safe-Truth for your story.",
          });
        }

        console.log(`[Care Signal Review] Event ${input.eventId} submitted for review by ${ctx.user.id}`);

        return {
          success: true,
          message: "Event submitted for institutional review",
          eventId: input.eventId,
          status: "under_review",
        };
      } catch (error) {
        console.error("[Care Signal Review Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit event for review",
        });
      }
    }),

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
        if (!ctx.user.providerType && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Care Signal is for healthcare providers. Parents: use Parent Safe-Truth for your story.",
          });
        }

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

        console.log(`[Care Signal Recommendations] Generated for event type: ${input.eventType}`);

        return {
          success: true,
          recommendations,
          eventType: input.eventType,
        };
      } catch (error) {
        console.error("[Care Signal Recommendations Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate recommendations",
        });
      }
    }),
});
