import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { insertAdminAuditLog } from "../db";
import {
  confirmUnlistedFacility,
  createCareFacility,
  ensureFacilityRegistrySeeded,
  getFacilityById,
  listFacilitiesAwaitingReview,
  listFacilitiesForAdminMerge,
  listGeographicAreas,
  mergeCareFacilities,
  resolveUnlistedFacilityToRegistry,
  searchCareFacilities,
  syncProviderProfileFacility,
  getGeographicCareSignalDashboard,
} from "../services/facility-registry.service";

export const facilitiesRouter = router({
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(120),
        country: z.string().max(128).optional(),
        limit: z.number().int().min(1).max(20).default(12),
      })
    )
    .query(async ({ input }) => searchCareFacilities(input)),

  getById: protectedProcedure
    .input(z.object({ facilityId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const facility = await getFacilityById(input.facilityId);
      if (!facility) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Facility not found" });
      }
      return facility;
    }),

  /** Provider adds a facility not in the directory (county + country required). */
  createCommunityFacility: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(255),
        county: z.string().max(128).optional(),
        country: z.string().min(2).max(128).default("Kenya"),
        facilityType: z
          .enum([
            "primary_health_center",
            "health_post",
            "district_hospital",
            "private_clinic",
            "ngo_clinic",
            "other",
          ])
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.country === "Kenya" && !input.county?.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "County is required for facilities in Kenya.",
        });
      }
      const result = await createCareFacility({
        name: input.name,
        county: input.county,
        country: input.country,
        facilityType: input.facilityType ?? null,
        createdByUserId: ctx.user.id,
      });
      await syncProviderProfileFacility(ctx.user.id, result.id);
      return result;
    }),

  /** Set the signed-in provider's primary facility (Care Signal default). */
  setMyFacility: protectedProcedure
    .input(z.object({ facilityId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const facility = await getFacilityById(input.facilityId);
      if (!facility) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Facility not found" });
      }
      await syncProviderProfileFacility(ctx.user.id, facility.id);
      return { success: true, facility };
    }),

  listGeographicAreas: adminProcedure.query(async () => listGeographicAreas()),

  getGeographicCareSignalDashboard: adminProcedure
    .input(
      z.object({
        level: z.enum(["county", "country"]),
        name: z.string().min(1).max(128),
        lastDays: z.number().int().min(7).max(365).default(90),
      })
    )
    .query(async ({ input }) => getGeographicCareSignalDashboard(input)),

  listForMerge: adminProcedure
    .input(
      z.object({
        search: z.string().max(120).optional(),
        limit: z.number().int().min(1).max(200).default(80),
      }).optional()
    )
    .query(async ({ input }) => listFacilitiesForAdminMerge(input ?? {})),

  mergeFacilities: adminProcedure
    .input(
      z.object({
        sourceFacilityId: z.number().int().positive(),
        targetFacilityId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await mergeCareFacilities({
        sourceFacilityId: input.sourceFacilityId,
        targetFacilityId: input.targetFacilityId,
        adminUserId: ctx.user.id,
      });
      await insertAdminAuditLog({
        adminUserId: ctx.user.id,
        procedurePath: "facilities.mergeFacilities",
        inputSummary: JSON.stringify({
          sourceFacilityId: input.sourceFacilityId,
          targetFacilityId: input.targetFacilityId,
          result,
        }).slice(0, 4000),
      });
      return result;
    }),

  /** Platform administrator: facilities reporters added because they were not in the registry. */
  listAwaitingReview: adminProcedure.query(async () => listFacilitiesAwaitingReview()),

  /** Platform administrator: this unlisted facility is really that registry facility (reports move across). */
  resolveUnlisted: adminProcedure
    .input(z.object({ facilityId: z.number().int().positive(), kmhflFacilityId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await resolveUnlistedFacilityToRegistry({ ...input, adminUserId: ctx.user.id });
        await insertAdminAuditLog({
          adminUserId: ctx.user.id,
          procedurePath: "facilities.resolveUnlisted",
          inputSummary: JSON.stringify({ ...input, result }).slice(0, 4000),
        });
        return result;
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Could not resolve the facility" });
      }
    }),

  /** Platform administrator: it is genuinely not in the registry; keep it as its own facility. */
  confirmUnlisted: adminProcedure
    .input(z.object({ facilityId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await confirmUnlistedFacility(input.facilityId);
      await insertAdminAuditLog({
        adminUserId: ctx.user.id,
        procedurePath: "facilities.confirmUnlisted",
        inputSummary: JSON.stringify(input),
      });
      return { success: true as const };
    }),

  ensureSeeded: adminProcedure.mutation(async () => {
    await ensureFacilityRegistrySeeded();
    return { ok: true };
  }),
});
