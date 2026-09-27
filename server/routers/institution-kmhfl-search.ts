import { publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { kmhflFacilities } from "../../drizzle/schema";
import { and, asc, eq, isNull, like, or, sql } from "drizzle-orm";

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

/**
 * Search KMHFL facilities by name (autocomplete for institutional onboarding).
 * Returns matching facilities with name, code, and county.
 */
export const searchKmhflFacilities = publicProcedure
  .input(
    z.object({
      query: z.string().trim().min(2).max(100),
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

    const normalizedQuery = input.query.trim().toLowerCase();
    const escapedQuery = escapeLike(normalizedQuery);
    const searchPattern = `%${escapedQuery}%`;
    const prefixPattern = `${escapedQuery}%`;
    const results = await db
      .select({
        id: kmhflFacilities.id,
        name: kmhflFacilities.name,
        code: kmhflFacilities.code,
        county: kmhflFacilities.county,
        facilityType: kmhflFacilities.facilityType,
        operationalStatus: kmhflFacilities.operationalStatus,
      })
      .from(kmhflFacilities)
      .where(and(
        or(
          eq(kmhflFacilities.operationalStatus, "operational"),
          isNull(kmhflFacilities.operationalStatus),
        ),
        or(
          like(sql`LOWER(${kmhflFacilities.name})`, searchPattern),
          like(sql`LOWER(${kmhflFacilities.code})`, searchPattern),
          like(sql`LOWER(${kmhflFacilities.county})`, searchPattern),
        ),
      ))
      .orderBy(
        sql`CASE
          WHEN LOWER(${kmhflFacilities.code}) = ${normalizedQuery} THEN 0
          WHEN LOWER(${kmhflFacilities.name}) = ${normalizedQuery} THEN 1
          WHEN LOWER(${kmhflFacilities.name}) LIKE ${prefixPattern} THEN 2
          WHEN LOWER(${kmhflFacilities.code}) LIKE ${prefixPattern} THEN 3
          ELSE 4 END`,
        asc(kmhflFacilities.name),
        asc(kmhflFacilities.id),
      )
      .limit(input.limit);

    return results;
  });
