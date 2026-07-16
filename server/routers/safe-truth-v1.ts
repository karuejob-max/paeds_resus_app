/**
 * Safe-Truth v1 — no-auth submission router.
 * Spec: docs/EVENT_MODELS_V1.md §2 (gap-analysis queue item #11, Phase A).
 *
 * Every procedure here is `publicProcedure` — deliberately. §2.2 requires
 * genuinely no account, ever, for a caregiver to submit. This is the whole
 * point of Phase A's schema work (see drizzle/schema.ts's
 * `safeTruthSubmissions` doc comment for why that meant new tables, not a
 * retrofit of the old authenticated `parentSafeTruthSubmissions`).
 *
 * The old `parentSafeTruthRouter` (parent-safetruth.ts) is untouched —
 * existing authenticated historical submissions and their admin-facing
 * analytics keep working exactly as before.
 */
import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { safeTruthSubmissions, safeTruthFacilityVisits, safeTruthDisclaimerAcks } from "../../drizzle/schema";
import { safeTruthSubmissionInputSchema } from "../../shared/safe-truth-v1";
import { getCountryGeoConfig, countryNameToIso2 } from "../../shared/geo-taxonomy";
import {
  checkAndRecordSafeTruthRateLimit,
  isHoneypotTripped,
  normalizeClientIp,
} from "../lib/safe-truth-rate-limit";

const CURRENT_DISCLAIMER_VERSION = "1.0";

function getClientIp(req: { ip?: string; socket?: { remoteAddress?: string } }): string {
  return normalizeClientIp(String(req.ip || req.socket?.remoteAddress || "unknown"));
}

export const safeTruthV1Router = router({
  /**
   * Country → admin-level label config, for the (Phase B) form to render
   * the right question wording per country without hardcoding it.
   */
  getGeoLabels: publicProcedure.input(z.object({ country: z.string() })).query(({ input }) => {
    return getCountryGeoConfig(input.country);
  }),

  /**
   * Log that a device saw and accepted the emergency-services disclaimer
   * (§2.2's no-auth replacement for the old logged-in guardian gate — see
   * SafeTruthGuardianGate.tsx and safeTruthDisclaimerAcks' schema doc
   * comment). Never linked to a submission or any identity — purely an
   * anonymous "was this shown and accepted" audit trail.
   */
  acknowledgeDisclaimer: publicProcedure
    .input(z.object({ deviceSessionId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.insert(safeTruthDisclaimerAcks).values({
        deviceSessionId: input.deviceSessionId,
        disclaimerVersion: CURRENT_DISCLAIMER_VERSION,
      });

      return { success: true };
    }),

  /**
   * The submission itself. No auth. Honeypot + IP rate limit are the only
   * gates (CEO-approved, 2026-07-16) — see safe-truth-rate-limit.ts for
   * why this is intentionally light-touch.
   */
  submit: publicProcedure.input(safeTruthSubmissionInputSchema).mutation(async ({ ctx, input }) => {
    if (isHoneypotTripped(input.website)) {
      // Don't tell a bot it was caught — behave as if it worked.
      return { submissionUuid: randomUUID() };
    }

    const clientIp = getClientIp(ctx.req);
    if (!checkAndRecordSafeTruthRateLimit(clientIp)) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Submission limit reached for this connection today. Please try again tomorrow.",
      });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const submissionUuid = randomUUID();
    const countryIso2 = countryNameToIso2(input.country);

    await db.insert(safeTruthSubmissions).values({
      submissionUuid,
      country: countryIso2,
      adminLevel1: input.adminLevel1,
      adminLevel2: input.adminLevel2,
      facilityNameRaw: input.facilityNameRaw,
      facilityLevel: input.facilityLevel,
      childAgeBand: input.childAgeBand,
      conditionCategory: input.conditionCategory,
      outcomeCategory: input.outcomeCategory,
      isCaseLinkageConsented: Boolean(input.eventCodeEntered),
      eventCodeEntered: input.eventCodeEntered,

      symptomOnsetDaysAgo: input.symptomOnsetDaysAgo,
      firstSymptomNoticed: input.firstSymptomNoticed,
      dangerSignsPresent: input.dangerSignsPresent ? JSON.stringify(input.dangerSignsPresent) : null,
      adviceReceivedBeforeFacility: JSON.stringify(input.adviceReceivedBeforeFacility),
      adviceContentRaw: input.adviceContentRaw,
      reassuredDespiteDanger: input.reassuredDespiteDanger,
      decisionToSeekCareTrigger: input.decisionToSeekCareTrigger,

      transportUsed: JSON.stringify(input.transportUsed),
      transportDelayOccurred: input.transportDelayOccurred,
      transportDelayReason: input.transportDelayReason,
      travelTimeToFirstFacility: input.travelTimeToFirstFacility,
      costBarrierOccurred: input.costBarrierOccurred,
      costBarrierDetails: input.costBarrierDetails,
      facilitiesVisitedCount: input.facilitiesVisitedCount,

      followUpInstructionsReceived: input.followUpInstructionsReceived,
      ableToFollowInstructions: input.ableToFollowInstructions,
      unableToFollowReason: input.unableToFollowReason,
      overallExperienceRating: input.overallExperienceRating,
      whatCouldHaveBeenBetter: input.whatCouldHaveBeenBetter,
      rawNarrative: input.rawNarrative,
    });

    // mysql2's insertId isn't reliably surfaced through this codebase's
    // Drizzle setup on every insert path — re-fetch by the UUID we
    // generated ourselves rather than depend on it.
    const [row] = await db
      .select({ id: safeTruthSubmissions.id })
      .from(safeTruthSubmissions)
      .where(eq(safeTruthSubmissions.submissionUuid, submissionUuid))
      .limit(1);

    if (input.facilityVisits.length > 0 && row) {
      await db.insert(safeTruthFacilityVisits).values(
        input.facilityVisits.map((visit, index) => ({
          submissionId: row.id,
          visitSequence: index + 1,
          visitFacilityNameRaw: visit.visitFacilityNameRaw,
          visitFacilityIsFinal: visit.visitFacilityIsFinal,
          wasSeenPromptly: visit.wasSeenPromptly,
          turnedAway: visit.wasSeenPromptly === "We were turned away",
          turnedAwayReason: visit.turnedAwayReason,
          informationReceived: visit.informationReceived,
          familyInvolvement: visit.familyInvolvement,
          visitExperienceRaw: visit.visitExperienceRaw,
          dangerSignAdviceAtDischarge: visit.dangerSignAdviceAtDischarge,
        }))
      );
    }

    return { submissionUuid };
  }),
});
