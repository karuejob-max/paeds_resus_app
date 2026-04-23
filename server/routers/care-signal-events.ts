import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, gte, sql } from "drizzle-orm";
import { getDb } from "../db";
import { analyticsEvents, careSignalEvents } from "../../drizzle/schema";
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

  /**
   * Aggregate resource gap trends from ResusGPS 'resus_resource_gap' analytics events.
   * Returns the top unavailable interventions ranked by frequency over the requested timeframe.
   * Used by Care Signal and HospitalAdminDashboard to surface real-world resource gaps.
   */
  getResourceGapTrends: protectedProcedure
    .input(
      z.object({
        timeframe: z.enum(["week", "month", "quarter", "year"]).default("month"),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        if (!ctx.user.providerType && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Care Signal is for healthcare providers.",
          });
        }

        const db = await getDb();
        if (!db) {
          return { success: true, timeframe: input.timeframe, gaps: [], totalEvents: 0 };
        }

        const daysBack = input.timeframe === "week" ? 7
          : input.timeframe === "month" ? 30
          : input.timeframe === "quarter" ? 90
          : 365;
        const since = new Date(Date.now() - daysBack * 86_400_000);

        // Fetch all resus_resource_gap events in the timeframe
        const rows = await db
          .select({
            eventData: analyticsEvents.eventData,
            createdAt: analyticsEvents.createdAt,
          })
          .from(analyticsEvents)
          .where(
            and(
              gte(analyticsEvents.createdAt, since),
              sql`${analyticsEvents.eventType} = 'resus_resource_gap'`
            )
          )
          .orderBy(desc(analyticsEvents.createdAt))
          .limit(1000);

        // Aggregate by interventionName
        const countMap: Record<string, number> = {};
        for (const row of rows) {
          try {
            const data = typeof row.eventData === "string"
              ? (JSON.parse(row.eventData) as Record<string, unknown>)
              : (row.eventData as Record<string, unknown> | null) ?? {};
            const name = (data.interventionName as string) || "Unknown";
            countMap[name] = (countMap[name] ?? 0) + 1;
          } catch {
            // skip malformed rows
          }
        }

        const gaps = Object.entries(countMap)
          .map(([intervention, count]) => ({ intervention, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, input.limit);

        return {
          success: true,
          timeframe: input.timeframe,
          totalEvents: rows.length,
          gaps,
        };
      } catch (error) {
        console.error("[Care Signal Resource Gap Trends Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve resource gap trends.",
        });
      }
    }),

  /**
   * Anonymised multi-facility resource gap benchmarking.
   * Returns:
   *   - Platform-wide top resource gaps (all facilities, anonymised)
   *   - This facility's top gaps
   *   - Comparison: which gaps are unique to this facility vs. widespread
   *
   * Anonymisation: user IDs are never returned. Only aggregated counts.
   * Minimum cohort size: 5 events before a gap appears in platform-wide data.
   */
  getMultiFacilityBenchmark: protectedProcedure
    .input(
      z.object({
        timeframe: z.enum(["week", "month", "quarter", "year"]).default("month"),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        if (!ctx.user.providerType && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Care Signal is for healthcare providers.",
          });
        }

        const db = await getDb();
        if (!db) {
          return {
            success: true,
            timeframe: input.timeframe,
            platformWide: [],
            myFacility: [],
            uniqueToMe: [],
            widespreadGaps: [],
            totalPlatformEvents: 0,
            totalMyEvents: 0,
          };
        }

        const daysBack = input.timeframe === "week" ? 7
          : input.timeframe === "month" ? 30
          : input.timeframe === "quarter" ? 90
          : 365;
        const since = new Date(Date.now() - daysBack * 86_400_000);
        const userId = ctx.user.id;

        // Fetch ALL resource gap events (platform-wide)
        const allRows = await db
          .select({
            userId: analyticsEvents.userId,
            eventData: analyticsEvents.eventData,
          })
          .from(analyticsEvents)
          .where(
            and(
              gte(analyticsEvents.createdAt, since),
              sql`${analyticsEvents.eventType} = 'resus_resource_gap'`
            )
          )
          .limit(5000);

        // Aggregate platform-wide (all users, anonymised)
        const platformMap: Record<string, number> = {};
        // Aggregate this user's events
        const myMap: Record<string, number> = {};

        for (const row of allRows) {
          try {
            const data = typeof row.eventData === "string"
              ? (JSON.parse(row.eventData) as Record<string, unknown>)
              : (row.eventData as Record<string, unknown> | null) ?? {};
            const name = (data.interventionName as string) || "Unknown";
            platformMap[name] = (platformMap[name] ?? 0) + 1;
            if (row.userId === userId) {
              myMap[name] = (myMap[name] ?? 0) + 1;
            }
          } catch {
            // skip malformed rows
          }
        }

        // Platform-wide: only show gaps with >=5 events (anonymisation threshold)
        const platformWide = Object.entries(platformMap)
          .filter(([, count]) => count >= 5)
          .map(([intervention, count]) => ({ intervention, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, input.limit);

        const myFacility = Object.entries(myMap)
          .map(([intervention, count]) => ({ intervention, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, input.limit);

        const platformSet = new Set(platformWide.map(g => g.intervention));
        const mySet = new Set(myFacility.map(g => g.intervention));

        // Gaps unique to this provider (not widespread on platform)
        const uniqueToMe = myFacility.filter(g => !platformSet.has(g.intervention));
        // Widespread gaps this provider also reports
        const widespreadGaps = myFacility.filter(g => platformSet.has(g.intervention));

        return {
          success: true,
          timeframe: input.timeframe,
          platformWide,
          myFacility,
          uniqueToMe,
          widespreadGaps,
          totalPlatformEvents: allRows.length,
          totalMyEvents: Object.values(myMap).reduce((a, b) => a + b, 0),
        };
      } catch (error) {
        console.error("[Multi-Facility Benchmark Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve multi-facility benchmark.",
        });
      }
    }),
});
