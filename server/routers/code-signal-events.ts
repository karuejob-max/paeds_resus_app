import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, count, gte } from "drizzle-orm";
import { getDb, insertAdminAuditLog } from "../db";
import { codeSignalEvents, providerProfiles, iersEvidenceRecords, iersActionItems } from "../../drizzle/schema";
import { trackEvent } from "../services/analytics.service";
import {
  getFacilityById,
  resolveCanonicalFacilityId,
  syncProviderProfileFacility,
} from "../services/facility-registry.service";
import { evaluateCodeSignalSubmissionGuard } from "../lib/code-signal-rate-limit";
import { assertCodeSignalProviderOrAdmin } from "../lib/code-signal-access";
import { daysBackForTimeframe } from "./care-signal-events";

/** Start of a calendar month in EAT (UTC+3), expressed as a UTC Date. Mirrors care-signal-events.ts's private helper — kept local since that one isn't exported. */
function startOfMonthEAT(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1, -3, 0, 0, 0));
}

/** Convert a UTC Date to EAT year/month (UTC+3). */
function toEATYearMonth(date: Date): { year: number; month: number } {
  const eat = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  return { year: eat.getUTCFullYear(), month: eat.getUTCMonth() + 1 };
}

/**
 * Code Signal — adult/whole-hospital resuscitation incident & near-miss
 * reporting. Sibling of Care Signal (server/routers/care-signal-events.ts),
 * deliberately much smaller — see the scope note in drizzle/schema.ts's
 * codeSignalEvents comment for what this pass does NOT include (Fellowship
 * credit, FPKB linkage, institutional follow-up, admin review UI, analytics
 * dashboard, dynamic recommendations). This ships submit + a provider's own
 * history + a minimal admin list, matching the "flag, don't silently drop"
 * house style used throughout this repo's WORK_STATUS entries.
 */
export const codeSignalEventsRouter = router({
  submitEvent: protectedProcedure
    .input(
      z.object({
        facilityId: z.number().int().positive().optional(),
        eventDate: z.string(),
        patientCategory: z.enum(["ADULT_PATIENT", "MOTHER_OF_PATIENT", "STAFF_MEMBER", "OTHER"]),
        conditionCategory: z.string().max(64),
        outcomeCategory: z.string().max(64),
        roleAtTimeOfEvent: z.string().max(64),
        country: z.string().max(2).optional(),
        admin_level_1: z.string().max(128).optional(),
        admin_level_2: z.string().max(128).optional(),
        facility_ownership: z.string().max(64).optional(),
        submissionMode: z.enum(["named", "anonymous"]).default("named"),
        reportTrack: z.enum(["FAILURE", "SUCCESS"]),
        failureDomains: z.array(z.string()).optional(),
        failureModeCodes: z.array(z.string()).optional(),
        successDomains: z.array(z.string()).optional(),
        successFactorCodes: z.array(z.string()).optional(),
        rawNarrative: z.string().min(20).max(10000),
        eventId: z.string().max(36).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        assertCodeSignalProviderOrAdmin(ctx.user);

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable. Please try again later." });
        }

        let resolvedFacilityId: number | null = null;
        {
          let facilityId = input.facilityId ?? null;
          if (!facilityId) {
            const [profile] = await db
              .select({ facilityId: providerProfiles.facilityId })
              .from(providerProfiles)
              .where(eq(providerProfiles.userId, ctx.user.id))
              .limit(1);
            facilityId = profile?.facilityId ?? null;
          }
          if (!facilityId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Please select the facility where this event occurred.",
            });
          }
          resolvedFacilityId = await resolveCanonicalFacilityId(facilityId);
          const facility = await getFacilityById(resolvedFacilityId);
          if (!facility) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Selected facility is not valid." });
          }
          if (input.submissionMode === "named") {
            await syncProviderProfileFacility(ctx.user.id, resolvedFacilityId);
          }
        }

        if (input.submissionMode !== "anonymous") {
          const recentSubmissions = await db
            .select({
              eventDate: codeSignalEvents.eventDate,
              conditionCategory: codeSignalEvents.conditionCategory,
              createdAt: codeSignalEvents.createdAt,
            })
            .from(codeSignalEvents)
            .where(eq(codeSignalEvents.userId, ctx.user.id))
            .orderBy(desc(codeSignalEvents.createdAt))
            .limit(20);

          const guard = evaluateCodeSignalSubmissionGuard(recentSubmissions, {
            eventDate: input.eventDate,
            conditionCategory: input.conditionCategory,
          });

          if (!guard.allowed) {
            throw new TRPCError({
              code: guard.reason === "rate_limit" ? "TOO_MANY_REQUESTS" : "BAD_REQUEST",
              message:
                guard.reason === "rate_limit"
                  ? "Code Signal limit: maximum 5 reports per day (EAT). Try again tomorrow."
                  : "A very similar report was submitted in the last 10 minutes. Wait briefly or adjust event details if this is a distinct case.",
            });
          }
        }

        const insertResult = await db.insert(codeSignalEvents).values({
          userId: input.submissionMode === "named" ? ctx.user.id : null,
          submissionMode: input.submissionMode,
          facilityId: resolvedFacilityId,
          eventDate: new Date(input.eventDate),
          patientCategory: input.patientCategory,
          conditionCategory: input.conditionCategory,
          outcomeCategory: input.outcomeCategory,
          roleAtTimeOfEvent: input.roleAtTimeOfEvent,
          country: input.country,
          adminLevel1: input.admin_level_1,
          adminLevel2: input.admin_level_2,
          facilityOwnership: input.facility_ownership,
          reportTrack: input.reportTrack,
          failureDomains: input.failureDomains?.length ? JSON.stringify(input.failureDomains) : null,
          failureModeCodes: input.failureModeCodes?.length ? JSON.stringify(input.failureModeCodes) : null,
          successDomains: input.successDomains?.length ? JSON.stringify(input.successDomains) : null,
          successFactorCodes: input.successFactorCodes?.length ? JSON.stringify(input.successFactorCodes) : null,
          rawNarrative: input.rawNarrative,
          redactedNarrative: null,
          status: "submitted",
          eventId: input.eventId,
        });

        const insertId = (insertResult as unknown as { insertId: number }).insertId;
        const linkedFacility = resolvedFacilityId ? await getFacilityById(resolvedFacilityId) : null;
        const linkedInstitutionId = linkedFacility?.institutionalAccountId ?? null;
        if (linkedInstitutionId) {
          const failureSummary = input.failureModeCodes?.length ? input.failureModeCodes.join(", ") : "No structured failure code selected";
          await db.insert(iersEvidenceRecords).values({
            institutionId: linkedInstitutionId,
            domain: "quality_improvement",
            criterionCode: "QI-01",
            title: `Code Signal QI event #${insertId}`,
            evidenceType: "metric",
            description: `Whole-hospital QI event recorded for institutional review. Track: ${input.reportTrack}; patient category: ${input.patientCategory}; condition: ${input.conditionCategory}; outcome: ${input.outcomeCategory}.`,
            observedAt: new Date(input.eventDate),
            submittedByUserId: ctx.user.id,
            status: "submitted",
          });
          if (input.reportTrack === "FAILURE" && input.failureModeCodes?.length) {
            await db.insert(iersActionItems).values({
              institutionId: linkedInstitutionId,
              sourceType: "code_signal",
              sourceId: insertId,
              title: `Review Code Signal failures from event #${insertId}`,
              gapDescription: failureSummary,
              ownerUserId: input.submissionMode === "named" ? ctx.user.id : null,
              priority: "medium",
              status: "open",
              createdByUserId: ctx.user.id,
            });
          }
        }

        await trackEvent({
          userId: ctx.user.id,
          eventType: "code_signal_submission_created",
          eventName: "Code Signal submission",
          eventData: {
            codeSignalEventId: insertId,
            patientCategory: input.patientCategory,
            conditionCategory: input.conditionCategory,
            reportTrack: input.reportTrack,
            facilityId: resolvedFacilityId,
          },
        }).catch(() => undefined);

        return {
          success: true,
          message: "Event logged successfully! Your report has been submitted confidentially.",
          eventId: String(insertId),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Code Signal Event Error]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to log event. Please try again." });
      }
    }),

  /** Provider's own submission history — mirrors Care Signal's getEventHistory shape, minus fellowship/streak fields Code Signal doesn't have. */
  getEventHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: true, events: [], total: 0 };

      const [events, totalResult] = await Promise.all([
        db
          .select()
          .from(codeSignalEvents)
          .where(eq(codeSignalEvents.userId, ctx.user.id))
          .orderBy(desc(codeSignalEvents.createdAt))
          .limit(input.limit)
          .offset(input.offset),
        db.select({ total: count() }).from(codeSignalEvents).where(eq(codeSignalEvents.userId, ctx.user.id)),
      ]);

      return { success: true, events, total: Number(totalResult[0]?.total ?? 0) };
    }),

  /** Admin-only: the review queue — now with an actual review-outcome workflow (WORK_STATUS 2026-08-07 queue item #1; getEventsUnderReview itself unchanged from the original pass). */
  getEventsUnderReview: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: true, events: [], total: 0 };

      const [events, totalResult] = await Promise.all([
        db
          .select()
          .from(codeSignalEvents)
          .where(eq(codeSignalEvents.status, "submitted"))
          .orderBy(desc(codeSignalEvents.createdAt))
          .limit(input.limit)
          .offset(input.offset),
        db.select({ total: count() }).from(codeSignalEvents).where(eq(codeSignalEvents.status, "submitted")),
      ]);

      return { success: true, events, total: Number(totalResult[0]?.total ?? 0) };
    }),

  /**
   * Admin marks a submitted event reviewed. Plain typed columns rather than
   * Care Signal's JSON `gapDetails` blob pattern (`markReviewed` in
   * care-signal-events.ts) — Code Signal has no equivalent legacy column to
   * reuse, so a dedicated migration (0091) added reviewOutcome/reviewerNotes/
   * reviewedAt/reviewedBy directly.
   */
  markReviewed: adminProcedure
    .input(
      z.object({
        eventId: z.number().int().positive(),
        reviewOutcome: z.enum(["acknowledged", "escalated", "closed"]),
        reviewerNotes: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
        }

        await db
          .update(codeSignalEvents)
          .set({
            status: "reviewed",
            reviewOutcome: input.reviewOutcome,
            reviewerNotes: input.reviewerNotes ?? null,
            reviewedAt: new Date(),
            reviewedBy: ctx.user.id,
          })
          .where(eq(codeSignalEvents.id, input.eventId));

        await trackEvent({
          userId: ctx.user.id,
          eventType: "code_signal_review_completed",
          eventName: "Code Signal review completed",
          eventData: { codeSignalEventId: input.eventId, reviewOutcome: input.reviewOutcome },
        }).catch(() => undefined);

        await insertAdminAuditLog({
          adminUserId: ctx.user.id,
          procedurePath: "codeSignalEvents.markReviewed",
          inputSummary: JSON.stringify({ eventId: input.eventId, reviewOutcome: input.reviewOutcome }),
          createdAt: new Date(),
        }).catch(() => undefined);

        return { success: true, eventId: input.eventId, reviewOutcome: input.reviewOutcome };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Code Signal Mark Reviewed Error]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to mark event as reviewed." });
      }
    }),

  /**
   * Admin dashboard metrics — deliberately simpler than Care Signal's
   * equivalent (no gapBreakdown/topFacilities JSON parsing, since Code
   * Signal's failureDomains/successDomains are already clean JSON arrays,
   * not a legacy blob). "Pending" = status still "submitted" — Code Signal
   * has no separate "under_review" state (Care Signal's own use of that
   * state is not exercised anywhere either, per inspection).
   */
  getAdminMetrics: adminProcedure
    .input(z.object({ timeframe: z.enum(["week", "month", "quarter", "year"]).default("month") }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return {
          success: true,
          totalSubmissions: 0,
          submissionsThisMonth: 0,
          uniqueProviders: 0,
          pendingCount: 0,
          conditionBreakdown: {} as Record<string, number>,
          patientCategoryBreakdown: {} as Record<string, number>,
          timeframe: input.timeframe,
        };
      }

      const since = new Date(Date.now() - daysBackForTimeframe(input.timeframe) * 86_400_000);
      const now = new Date();
      const { year: cy, month: cm } = toEATYearMonth(now);
      const monthStart = startOfMonthEAT(cy, cm);

      const [allEvents, thisMonthEvents, pending] = await Promise.all([
        db
          .select({
            userId: codeSignalEvents.userId,
            conditionCategory: codeSignalEvents.conditionCategory,
            patientCategory: codeSignalEvents.patientCategory,
          })
          .from(codeSignalEvents)
          .where(gte(codeSignalEvents.createdAt, since)),
        db.select({ id: codeSignalEvents.id }).from(codeSignalEvents).where(gte(codeSignalEvents.createdAt, monthStart)),
        db.select({ id: codeSignalEvents.id }).from(codeSignalEvents).where(eq(codeSignalEvents.status, "submitted")),
      ]);

      const uniqueProviders = new Set(allEvents.map((e) => e.userId).filter(Boolean)).size;

      const conditionBreakdown: Record<string, number> = {};
      const patientCategoryBreakdown: Record<string, number> = {};
      for (const e of allEvents) {
        conditionBreakdown[e.conditionCategory] = (conditionBreakdown[e.conditionCategory] ?? 0) + 1;
        patientCategoryBreakdown[e.patientCategory] = (patientCategoryBreakdown[e.patientCategory] ?? 0) + 1;
      }

      return {
        success: true,
        totalSubmissions: allEvents.length,
        submissionsThisMonth: thisMonthEvents.length,
        uniqueProviders,
        pendingCount: pending.length,
        conditionBreakdown,
        patientCategoryBreakdown,
        timeframe: input.timeframe,
      };
    }),
});
