import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, count } from "drizzle-orm";
import { getDb } from "../db";
import { codeSignalEvents, providerProfiles } from "../../drizzle/schema";
import { trackEvent } from "../services/analytics.service";
import {
  getFacilityById,
  resolveCanonicalFacilityId,
  syncProviderProfileFacility,
} from "../services/facility-registry.service";
import { evaluateCodeSignalSubmissionGuard } from "../lib/code-signal-rate-limit";
import { assertCodeSignalProviderOrAdmin } from "../lib/code-signal-access";

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

  /** Admin-only: minimal list, no review-outcome workflow yet (flagged, not built this pass). */
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
});
