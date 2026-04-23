import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, sql, count } from "drizzle-orm";
import { getDb } from "../db";
import {
  analyticsEvents,
  careSignalEvents,
  providerProfiles,
} from "../../drizzle/schema";
import { trackEvent } from "../services/analytics.service";

/**
 * Care Signal — provider incident & near-miss reporting (fellowship / QI pillar).
 *
 * PLATFORM_SOURCE_OF_TRUTH §3 / §17 / FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md
 *
 * Three jobs:
 *  1. Provider-facing QI incident/near-miss reporting with a real feedback loop.
 *  2. Automated driver of Fellowship Pillar C (24 consecutive qualifying months, EAT).
 *  3. Source of operational intelligence for institutional admins and MOH.
 *
 * All month boundaries use EAT (UTC+3) per PSOT §8.
 * Anonymisation threshold for platform-wide aggregates: ≥5 events.
 */

// ─── EAT helpers ─────────────────────────────────────────────────────────────

/** Convert a UTC Date to EAT year/month (UTC+3). */
function toEATYearMonth(date: Date): { year: number; month: number } {
  const eat = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  return { year: eat.getUTCFullYear(), month: eat.getUTCMonth() + 1 };
}

/** Start of a calendar month in EAT, expressed as a UTC Date. */
function startOfMonthEAT(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1, -3, 0, 0, 0));
}

/** Number of days to look back for a given timeframe label. */
function daysBackForTimeframe(timeframe: "week" | "month" | "quarter" | "year"): number {
  return timeframe === "week" ? 7
    : timeframe === "month" ? 30
    : timeframe === "quarter" ? 90
    : 365;
}

// ─── Dynamic recommendation engine ──────────────────────────────────────────

interface GapRecommendation {
  gap: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
  action: string;
}

const GAP_RECOMMENDATIONS: Record<string, GapRecommendation> = {
  "Knowledge Gap": {
    gap: "Knowledge Gap",
    recommendation:
      "Enroll in the ADF Pediatric Emergency Micro-Course series — specifically the ABCDE Assessment and Shock Recognition modules.",
    priority: "high",
    action: "Enroll in micro-courses",
  },
  "Equipment Gap": {
    gap: "Equipment Gap",
    recommendation:
      "Submit a formal equipment request to your facility administrator. Document the specific gap (e.g., missing bag-valve-mask size, absent defibrillator pads) with this Care Signal event ID as evidence.",
    priority: "high",
    action: "Submit equipment request",
  },
  "Training Gap": {
    gap: "Training Gap",
    recommendation:
      "Schedule a PALS/NRP team simulation drill within the next 30 days. Use the ResusGPS platform to run a structured case before the drill.",
    priority: "high",
    action: "Schedule team drill",
  },
  "Staffing Gap": {
    gap: "Staffing Gap",
    recommendation:
      "Escalate staffing ratio concerns to your charge nurse or medical director with this event as supporting evidence. Document the time-to-response delay.",
    priority: "high",
    action: "Escalate to management",
  },
  "Protocol Gap": {
    gap: "Protocol Gap",
    recommendation:
      "Review the relevant AHA/ILCOR pediatric resuscitation protocol in the ResusGPS library. Flag the protocol gap to your clinical governance lead.",
    priority: "medium",
    action: "Review protocol",
  },
  "Communication Gap": {
    gap: "Communication Gap",
    recommendation:
      "Implement a structured handover tool (SBAR) for pediatric emergencies. Request a team debrief within 24 hours of this event.",
    priority: "medium",
    action: "Implement SBAR handover",
  },
  "Leadership Gap": {
    gap: "Leadership Gap",
    recommendation:
      "Identify a designated code team leader for pediatric emergencies. Raise the leadership gap at your next departmental meeting with this event as context.",
    priority: "medium",
    action: "Designate code leader",
  },
  "Infrastructure Gap": {
    gap: "Infrastructure Gap",
    recommendation:
      "Document the infrastructure deficiency (power, space, connectivity) and submit a formal facilities report. Attach this Care Signal event ID.",
    priority: "medium",
    action: "Submit facilities report",
  },
  "Resources Gap": {
    gap: "Resources Gap",
    recommendation:
      "Log the specific unavailable resource in the ResusGPS resource gap tracker. Escalate to procurement with this event ID as supporting evidence.",
    priority: "high",
    action: "Log resource gap",
  },
};

function buildRecommendations(
  systemGaps: string[],
  outcome: string,
  eventType: string
): GapRecommendation[] {
  const recs: GapRecommendation[] = [];

  for (const gap of systemGaps) {
    const rec = GAP_RECOMMENDATIONS[gap];
    if (rec) recs.push(rec);
  }

  if (outcome === "died" || outcome === "poor_outcome") {
    recs.push({
      gap: "Outcome Review",
      recommendation:
        "This event had a poor outcome. Request a formal Morbidity & Mortality (M&M) review within 7 days. Use this Care Signal report as the case summary.",
      priority: "high",
      action: "Request M&M review",
    });
  }

  if (eventType === "cardiac_arrest" && !systemGaps.includes("Training Gap")) {
    recs.push({
      gap: "Cardiac Arrest Readiness",
      recommendation:
        "Cardiac arrest events benefit from regular team simulation. Consider scheduling a mock code within 30 days.",
      priority: "medium",
      action: "Schedule mock code",
    });
  }

  return recs;
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const careSignalEventsRouter = router({
  /**
   * Log a Care Signal event (clinical staff) or parent-observation (parent Safe-Truth short-form).
   * Returns immediate recommendations so the confirmation modal can display actionable feedback.
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

        // Resolve facility metadata from providerProfiles (non-blocking)
        let facilityName: string | null = null;
        let facilityRegion: string | null = null;
        try {
          const [profile] = await db
            .select({
              facilityName: providerProfiles.facilityName,
              facilityRegion: providerProfiles.facilityRegion,
            })
            .from(providerProfiles)
            .where(eq(providerProfiles.userId, ctx.user.id))
            .limit(1);
          facilityName = profile?.facilityName ?? null;
          facilityRegion = profile?.facilityRegion ?? null;
        } catch {
          // Non-critical — proceed without facility metadata
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
          gapDetails: JSON.stringify({
            ...input.gapDetails,
            facilityName,
            facilityRegion,
          }),
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
            outcome: input.outcome,
            systemGaps: input.systemGaps,
            facilityName,
            facilityRegion,
          },
        });

        const recommendations = buildRecommendations(
          input.systemGaps,
          input.outcome,
          input.eventType
        );

        console.log("[Care Signal Event Logged]", {
          id: insertId,
          provider: input.isAnonymous ? "ANONYMOUS" : ctx.user.id,
          eventType: input.eventType,
          childAge: input.childAge,
          outcome: input.outcome,
          facilityName,
          timestamp: new Date().toISOString(),
        });

        return {
          success: true,
          message: "Event logged successfully! Your report has been submitted confidentially.",
          eventId: String(insertId),
          timestamp: new Date(),
          recommendations,
          childAge: input.childAge,
          outcome: input.outcome,
        };
      } catch (error) {
        console.error("[Care Signal Event Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to log event. Please try again.",
        });
      }
    }),

  /**
   * Return this provider's own Care Signal event history from the database.
   * FIX: Previously returned an empty array stub. Now wired to real DB rows.
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
        if (!ctx.user.providerType && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Care Signal is for healthcare providers. Parents: use Parent Safe-Truth for your story.",
          });
        }

        const db = await getDb();
        if (!db) {
          return { success: true, events: [], total: 0, limit: input.limit, offset: input.offset };
        }

        const [events, totalResult] = await Promise.all([
          db
            .select({
              id: careSignalEvents.id,
              eventDate: careSignalEvents.eventDate,
              childAge: careSignalEvents.childAge,
              eventType: careSignalEvents.eventType,
              outcome: careSignalEvents.outcome,
              neurologicalStatus: careSignalEvents.neurologicalStatus,
              systemGaps: careSignalEvents.systemGaps,
              chainOfSurvival: careSignalEvents.chainOfSurvival,
              isAnonymous: careSignalEvents.isAnonymous,
              status: careSignalEvents.status,
              createdAt: careSignalEvents.createdAt,
            })
            .from(careSignalEvents)
            .where(eq(careSignalEvents.userId, ctx.user.id))
            .orderBy(desc(careSignalEvents.createdAt))
            .limit(input.limit)
            .offset(input.offset),
          db
            .select({ total: count() })
            .from(careSignalEvents)
            .where(eq(careSignalEvents.userId, ctx.user.id)),
        ]);

        const parsed = events.map((e) => ({
          ...e,
          systemGaps: (() => {
            try {
              return JSON.parse(e.systemGaps) as string[];
            } catch {
              return [] as string[];
            }
          })(),
          chainOfSurvival: (() => {
            try {
              return JSON.parse(e.chainOfSurvival) as Record<string, unknown>;
            } catch {
              return {} as Record<string, unknown>;
            }
          })(),
        }));

        return {
          success: true,
          events: parsed,
          total: Number(totalResult[0]?.total ?? 0),
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

  /**
   * Return real statistics for this provider's Care Signal submissions.
   * FIX: Previously returned all-zero stubs. Now driven by real DB aggregates.
   */
  getEventStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.user.providerType && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Care Signal is for healthcare providers. Parents: use Parent Safe-Truth for your story.",
        });
      }

      const db = await getDb();
      if (!db) {
        return {
          success: true,
          totalEvents: 0,
          successfulOutcomes: 0,
          avgChildAge: 0,
          mostCommonEventType: "N/A",
          mostCommonGap: "N/A",
          thisMonthCount: 0,
          lastMonthCount: 0,
          streakMonths: 0,
        };
      }

      const allEvents = await db
        .select({
          childAge: careSignalEvents.childAge,
          eventType: careSignalEvents.eventType,
          outcome: careSignalEvents.outcome,
          systemGaps: careSignalEvents.systemGaps,
          createdAt: careSignalEvents.createdAt,
        })
        .from(careSignalEvents)
        .where(eq(careSignalEvents.userId, ctx.user.id));

      const totalEvents = allEvents.length;

      const successfulOutcomes = allEvents.filter((e) =>
        ["survived", "neurologically_intact", "rosc", "good_outcome"].includes(e.outcome)
      ).length;

      const avgChildAge =
        totalEvents > 0
          ? Math.round(
              allEvents.reduce((sum, e) => sum + (e.childAge ?? 0), 0) / totalEvents
            )
          : 0;

      const typeCounts: Record<string, number> = {};
      for (const e of allEvents) {
        typeCounts[e.eventType] = (typeCounts[e.eventType] ?? 0) + 1;
      }
      const mostCommonEventType =
        Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

      const gapCounts: Record<string, number> = {};
      for (const e of allEvents) {
        try {
          const gaps = JSON.parse(e.systemGaps) as string[];
          for (const g of gaps) gapCounts[g] = (gapCounts[g] ?? 0) + 1;
        } catch { /* skip */ }
      }
      const mostCommonGap =
        Object.entries(gapCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

      // This month / last month counts (EAT)
      const now = new Date();
      const { year: cy, month: cm } = toEATYearMonth(now);
      const thisMonthStart = startOfMonthEAT(cy, cm);
      const lastMonthStart = startOfMonthEAT(
        cm === 1 ? cy - 1 : cy,
        cm === 1 ? 12 : cm - 1
      );

      const thisMonthCount = allEvents.filter(
        (e) => new Date(e.createdAt) >= thisMonthStart
      ).length;
      const lastMonthCount = allEvents.filter(
        (e) =>
          new Date(e.createdAt) >= lastMonthStart &&
          new Date(e.createdAt) < thisMonthStart
      ).length;

      // Simple consecutive streak (EAT months)
      const monthSet = new Set<string>();
      for (const e of allEvents) {
        const { year, month } = toEATYearMonth(new Date(e.createdAt));
        monthSet.add(`${year}-${String(month).padStart(2, "0")}`);
      }
      let streakMonths = 0;
      let sy = cy;
      let sm = cm;
      while (monthSet.has(`${sy}-${String(sm).padStart(2, "0")}`)) {
        streakMonths += 1;
        sm -= 1;
        if (sm < 1) { sm = 12; sy -= 1; }
        if (streakMonths > 24) break;
      }

      return {
        success: true,
        totalEvents,
        successfulOutcomes,
        avgChildAge,
        mostCommonEventType,
        mostCommonGap,
        thisMonthCount,
        lastMonthCount,
        streakMonths,
      };
    } catch (error) {
      console.error("[Care Signal Stats Error]", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve statistics",
      });
    }
  }),

  /**
   * Real gap analysis: aggregates this provider's reported system gaps over a timeframe.
   * FIX: Previously returned all-zero stubs. Now driven by actual careSignalEvents rows.
   */
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

        const db = await getDb();
        if (!db) {
          return {
            success: true,
            timeframe: input.timeframe,
            gaps: {} as Record<string, number>,
            recommendations: [] as GapRecommendation[],
            totalEvents: 0,
          };
        }

        const since = new Date(
          Date.now() - daysBackForTimeframe(input.timeframe) * 86_400_000
        );
        const events = await db
          .select({
            systemGaps: careSignalEvents.systemGaps,
            outcome: careSignalEvents.outcome,
            eventType: careSignalEvents.eventType,
          })
          .from(careSignalEvents)
          .where(
            and(
              eq(careSignalEvents.userId, ctx.user.id),
              gte(careSignalEvents.createdAt, since)
            )
          );

        const gapCounts: Record<string, number> = {};
        const outcomes: string[] = [];
        const eventTypes: string[] = [];

        for (const e of events) {
          outcomes.push(e.outcome);
          eventTypes.push(e.eventType);
          try {
            const gaps = JSON.parse(e.systemGaps) as string[];
            for (const g of gaps) {
              gapCounts[g] = (gapCounts[g] ?? 0) + 1;
            }
          } catch { /* skip */ }
        }

        const topGaps = Object.entries(gapCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([g]) => g);

        const worstOutcome = outcomes.includes("died")
          ? "died"
          : outcomes.includes("poor_outcome")
          ? "poor_outcome"
          : outcomes[0] ?? "unknown";

        const etCounts: Record<string, number> = {};
        for (const et of eventTypes) etCounts[et] = (etCounts[et] ?? 0) + 1;
        const mostCommonEventType =
          Object.entries(etCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unknown";

        const recommendations = buildRecommendations(
          topGaps,
          worstOutcome,
          mostCommonEventType
        );

        return {
          success: true,
          timeframe: input.timeframe,
          gaps: gapCounts,
          recommendations,
          totalEvents: events.length,
        };
      } catch (error) {
        console.error("[Care Signal Gap Analysis Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to analyze system gaps",
        });
      }
    }),

  /**
   * Submit a specific Care Signal event for institutional review.
   * FIX: Previously a no-op stub. Now updates the event status in the database.
   */
  submitForReview: protectedProcedure
    .input(
      z.object({
        eventId: z.number().int().positive(),
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

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable.",
          });
        }

        const [existing] = await db
          .select({
            id: careSignalEvents.id,
            userId: careSignalEvents.userId,
            status: careSignalEvents.status,
          })
          .from(careSignalEvents)
          .where(eq(careSignalEvents.id, input.eventId))
          .limit(1);

        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Care Signal event not found." });
        }
        if (existing.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only submit your own events for review.",
          });
        }
        if (existing.status === "under_review" || existing.status === "reviewed") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Event is already ${existing.status}.`,
          });
        }

        await db
          .update(careSignalEvents)
          .set({
            status: "under_review",
            gapDetails: sql`JSON_SET(
              COALESCE(${careSignalEvents.gapDetails}, '{}'),
              '$.reviewNotes', ${input.reviewNotes ?? ""},
              '$.reviewRequestedAt', ${new Date().toISOString()},
              '$.reviewRequestedBy', ${String(ctx.user.id)}
            )`,
          })
          .where(eq(careSignalEvents.id, input.eventId));

        await trackEvent({
          userId: ctx.user.id,
          eventType: "care_signal_review_requested",
          eventName: "Care Signal review requested",
          eventData: {
            careSignalEventId: input.eventId,
            reviewNotes: input.reviewNotes,
          },
        });

        console.log(
          `[Care Signal Review] Event ${input.eventId} submitted for review by ${ctx.user.id}`
        );

        return {
          success: true,
          message:
            "Event submitted for institutional review. Your facility coordinator will be notified.",
          eventId: input.eventId,
          status: "under_review",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Care Signal Review Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit event for review",
        });
      }
    }),

  /**
   * Dynamic recommendations based on reported gaps, outcome, and event type.
   * FIX: Previously returned 3 static strings regardless of input.
   * Now driven by the gap-specific recommendation engine.
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
        if (!ctx.user.providerType && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Care Signal is for healthcare providers. Parents: use Parent Safe-Truth for your story.",
          });
        }

        const recommendations = buildRecommendations(
          input.systemGaps,
          input.outcome,
          input.eventType
        );

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

        const since = new Date(
          Date.now() - daysBackForTimeframe(input.timeframe) * 86_400_000
        );
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

        const countMap: Record<string, number> = {};
        for (const row of rows) {
          try {
            const data =
              typeof row.eventData === "string"
                ? (JSON.parse(row.eventData) as Record<string, unknown>)
                : ((row.eventData as Record<string, unknown> | null) ?? {});
            const name = (data.interventionName as string) || "Unknown";
            countMap[name] = (countMap[name] ?? 0) + 1;
          } catch { /* skip malformed rows */ }
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
   * Compares this provider's facility gaps against platform-wide aggregates.
   * Anonymisation threshold: ≥5 events for platform-wide display.
   */
  getMultiFacilityBenchmark: protectedProcedure
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

        const [profile] = await db
          .select({ facilityName: providerProfiles.facilityName })
          .from(providerProfiles)
          .where(eq(providerProfiles.userId, ctx.user.id))
          .limit(1);
        const myFacilityName = profile?.facilityName ?? null;

        const since = new Date(
          Date.now() - daysBackForTimeframe(input.timeframe) * 86_400_000
        );
        const allRows = await db
          .select({
            eventData: analyticsEvents.eventData,
            userId: analyticsEvents.userId,
          })
          .from(analyticsEvents)
          .where(
            and(
              gte(analyticsEvents.createdAt, since),
              sql`${analyticsEvents.eventType} = 'resus_resource_gap'`
            )
          )
          .limit(5000);

        const platformMap: Record<string, number> = {};
        const myMap: Record<string, number> = {};

        for (const row of allRows) {
          try {
            const data =
              typeof row.eventData === "string"
                ? (JSON.parse(row.eventData) as Record<string, unknown>)
                : ((row.eventData as Record<string, unknown> | null) ?? {});
            const name = (data.interventionName as string) || "Unknown";
            const rowFacility = (data.facilityName as string) ?? null;
            platformMap[name] = (platformMap[name] ?? 0) + 1;
            if (myFacilityName && rowFacility === myFacilityName) {
              myMap[name] = (myMap[name] ?? 0) + 1;
            } else if (!myFacilityName && row.userId === ctx.user.id) {
              myMap[name] = (myMap[name] ?? 0) + 1;
            }
          } catch { /* skip malformed rows */ }
        }

        const platformWide = Object.entries(platformMap)
          .filter(([, c]) => c >= 5)
          .map(([intervention, count]) => ({ intervention, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, input.limit);
        const myFacility = Object.entries(myMap)
          .map(([intervention, count]) => ({ intervention, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, input.limit);
        const platformSet = new Set(platformWide.map((g) => g.intervention));
        const uniqueToMe = myFacility.filter((g) => !platformSet.has(g.intervention));
        const widespreadGaps = myFacility.filter((g) => platformSet.has(g.intervention));

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

  /**
   * MOH Export — anonymised platform-wide resource gap data for
   * county/national Ministry of Health reporting.
   * Only gaps with ≥5 events are included (anonymisation threshold).
   */
  getMOHExportData: protectedProcedure
    .input(
      z.object({
        timeframe: z.enum(["week", "month", "quarter", "year"]).default("quarter"),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        if (!ctx.user.providerType && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Care Signal export is for healthcare providers.",
          });
        }

        const db = await getDb();
        if (!db) {
          return {
            success: true,
            rows: [],
            generatedAt: new Date().toISOString(),
            timeframe: input.timeframe,
            totalEvents: 0,
          };
        }

        const since = new Date(
          Date.now() - daysBackForTimeframe(input.timeframe) * 86_400_000
        );
        const allRows = await db
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
          .limit(10000);

        const gapMap: Record<
          string,
          { count: number; firstSeen: string; lastSeen: string }
        > = {};
        for (const row of allRows) {
          try {
            const data =
              typeof row.eventData === "string"
                ? (JSON.parse(row.eventData) as Record<string, unknown>)
                : ((row.eventData as Record<string, unknown> | null) ?? {});
            const name = (data.interventionName as string) || "Unknown";
            const ts = row.createdAt
              ? new Date(row.createdAt).toISOString()
              : new Date().toISOString();
            if (!gapMap[name]) gapMap[name] = { count: 0, firstSeen: ts, lastSeen: ts };
            gapMap[name].count += 1;
            if (ts < gapMap[name].firstSeen) gapMap[name].firstSeen = ts;
            if (ts > gapMap[name].lastSeen) gapMap[name].lastSeen = ts;
          } catch { /* skip malformed */ }
        }

        const rows = Object.entries(gapMap)
          .filter(([, v]) => v.count >= 5)
          .map(([intervention, v]) => ({
            intervention,
            count: v.count,
            firstSeen: v.firstSeen.split("T")[0],
            lastSeen: v.lastSeen.split("T")[0],
            severity:
              v.count >= 50
                ? "Critical"
                : v.count >= 20
                ? "High"
                : v.count >= 10
                ? "Medium"
                : "Low",
            timeframe: input.timeframe,
          }))
          .sort((a, b) => b.count - a.count);

        return {
          success: true,
          rows,
          generatedAt: new Date().toISOString(),
          timeframe: input.timeframe,
          totalEvents: allRows.length,
        };
      } catch (error) {
        console.error("[MOH Export Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate MOH export.",
        });
      }
    }),

  /**
   * Admin-only: platform-wide Care Signal metrics for the admin dashboard.
   * Returns submission counts, gap distribution, outcome rates, and top facilities.
   */
  getAdminMetrics: adminProcedure
    .input(
      z.object({
        timeframe: z.enum(["week", "month", "quarter", "year"]).default("month"),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return {
            success: true,
            totalSubmissions: 0,
            submissionsThisMonth: 0,
            uniqueProviders: 0,
            outcomeBreakdown: {} as Record<string, number>,
            gapBreakdown: {} as Record<string, number>,
            topFacilities: [] as { facilityName: string; count: number }[],
            underReviewCount: 0,
            timeframe: input.timeframe,
          };
        }

        const since = new Date(
          Date.now() - daysBackForTimeframe(input.timeframe) * 86_400_000
        );
        const now = new Date();
        const { year: cy, month: cm } = toEATYearMonth(now);
        const monthStart = startOfMonthEAT(cy, cm);

        const [allEvents, thisMonthEvents, underReview] = await Promise.all([
          db
            .select({
              userId: careSignalEvents.userId,
              outcome: careSignalEvents.outcome,
              systemGaps: careSignalEvents.systemGaps,
              gapDetails: careSignalEvents.gapDetails,
            })
            .from(careSignalEvents)
            .where(gte(careSignalEvents.createdAt, since)),
          db
            .select({ id: careSignalEvents.id })
            .from(careSignalEvents)
            .where(gte(careSignalEvents.createdAt, monthStart)),
          db
            .select({ id: careSignalEvents.id })
            .from(careSignalEvents)
            .where(eq(careSignalEvents.status, "under_review")),
        ]);

        const uniqueProviders = new Set(
          allEvents.map((e) => e.userId).filter(Boolean)
        ).size;

        const outcomeBreakdown: Record<string, number> = {};
        const gapBreakdown: Record<string, number> = {};
        const facilityMap: Record<string, number> = {};

        for (const e of allEvents) {
          outcomeBreakdown[e.outcome] = (outcomeBreakdown[e.outcome] ?? 0) + 1;
          try {
            const gaps = JSON.parse(e.systemGaps) as string[];
            for (const g of gaps) gapBreakdown[g] = (gapBreakdown[g] ?? 0) + 1;
          } catch { /* skip */ }
          try {
            const details = JSON.parse(e.gapDetails) as Record<string, unknown>;
            const fn = (details.facilityName as string) ?? "Unknown";
            facilityMap[fn] = (facilityMap[fn] ?? 0) + 1;
          } catch { /* skip */ }
        }

        const topFacilities = Object.entries(facilityMap)
          .map(([facilityName, count]) => ({ facilityName, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        return {
          success: true,
          totalSubmissions: allEvents.length,
          submissionsThisMonth: thisMonthEvents.length,
          uniqueProviders,
          outcomeBreakdown,
          gapBreakdown,
          topFacilities,
          underReviewCount: underReview.length,
          timeframe: input.timeframe,
        };
      } catch (error) {
        console.error("[Care Signal Admin Metrics Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve admin metrics.",
        });
      }
    }),

  /**
   * Admin-only: list all Care Signal events under review for the institutional review workflow.
   */
  getEventsUnderReview: adminProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { success: true, events: [], total: 0 };

        const [events, totalResult] = await Promise.all([
          db
            .select({
              id: careSignalEvents.id,
              userId: careSignalEvents.userId,
              eventDate: careSignalEvents.eventDate,
              childAge: careSignalEvents.childAge,
              eventType: careSignalEvents.eventType,
              outcome: careSignalEvents.outcome,
              systemGaps: careSignalEvents.systemGaps,
              gapDetails: careSignalEvents.gapDetails,
              status: careSignalEvents.status,
              createdAt: careSignalEvents.createdAt,
            })
            .from(careSignalEvents)
            .where(eq(careSignalEvents.status, "under_review"))
            .orderBy(desc(careSignalEvents.createdAt))
            .limit(input.limit)
            .offset(input.offset),
          db
            .select({ total: count() })
            .from(careSignalEvents)
            .where(eq(careSignalEvents.status, "under_review")),
        ]);

        const parsed = events.map((e) => ({
          ...e,
          systemGaps: (() => {
            try {
              return JSON.parse(e.systemGaps) as string[];
            } catch {
              return [] as string[];
            }
          })(),
          gapDetails: (() => {
            try {
              return JSON.parse(e.gapDetails) as Record<string, unknown>;
            } catch {
              return {} as Record<string, unknown>;
            }
          })(),
        }));

        return {
          success: true,
          events: parsed,
          total: Number(totalResult[0]?.total ?? 0),
        };
      } catch (error) {
        console.error("[Care Signal Review Queue Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve review queue.",
        });
      }
    }),

  /**
   * Admin-only: mark a Care Signal event as reviewed and record the outcome.
   */
  markReviewed: adminProcedure
    .input(
      z.object({
        eventId: z.number().int().positive(),
        reviewOutcome: z.enum(["acknowledged", "escalated", "closed"]),
        reviewerNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable.",
          });
        }

        await db
          .update(careSignalEvents)
          .set({
            status: "reviewed",
            gapDetails: sql`JSON_SET(
              COALESCE(${careSignalEvents.gapDetails}, '{}'),
              '$.reviewOutcome', ${input.reviewOutcome},
              '$.reviewerNotes', ${input.reviewerNotes ?? ""},
              '$.reviewedAt', ${new Date().toISOString()},
              '$.reviewedBy', ${String(ctx.user.id)}
            )`,
          })
          .where(eq(careSignalEvents.id, input.eventId));

        await trackEvent({
          userId: ctx.user.id,
          eventType: "care_signal_review_completed",
          eventName: "Care Signal review completed",
          eventData: {
            careSignalEventId: input.eventId,
            reviewOutcome: input.reviewOutcome,
          },
        });

        return {
          success: true,
          eventId: input.eventId,
          reviewOutcome: input.reviewOutcome,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Care Signal Mark Reviewed Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark event as reviewed.",
        });
      }
    }),
});
