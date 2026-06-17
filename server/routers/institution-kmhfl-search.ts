import { publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { kmhflFacilities } from "../../drizzle/schema";
import { like } from "drizzle-orm";

/**
 * Search KMHFL facilities by name (autocomplete for institutional onboarding).
 * Returns matching facilities with name, code, and county.
 */
export const searchKmhflFacilities = publicProcedure
  .input(
    z.object({
      query: z.string().min(1).max(100),
      limit: z.number().int().min(1).max(50).default(10),
    })
  )
  .query(async ({ input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    const searchPattern = `%${input.query}%`;
    const results = await db
      .select({
        id: kmhflFacilities.id,
        name: kmhflFacilities.name,
        code: kmhflFacilities.code,
        county: kmhflFacilities.county,
        facilityType: kmhflFacilities.facilityType,
      })
      .from(kmhflFacilities)
      .where(like(kmhflFacilities.name, searchPattern))
      .limit(input.limit);

    return results;
  });
