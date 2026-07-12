/**
 * Canonical facility registry — search, resolve merges, sync institutions, geographic rollups.
 */
import { and, desc, eq, gte, inArray, isNotNull, isNull, like, sql } from "drizzle-orm";
import { getDb } from "../db";
import {
  careFacilities,
  careSignalEvents,
  providerProfiles,
  institutionalAccounts,
  accreditedFacilities,
  facilities,
} from "../../drizzle/schema";
import { DEFAULT_FACILITY_COUNTRY } from "../../shared/kenya-counties";

export type FacilitySearchResult = {
  id: number;
  name: string;
  county: string | null;
  country: string;
  badge: string;
  /**
   * Enrichment from the unified `facilities` table (migration 0059 + 0060
   * backfill), joined via legacy_care_facility_id. Null until that facility
   * has been bridged (see scripts/apply-0060-facilities-backfill.mjs) — most
   * commonly because its country isn't yet ISO2-mapped, or Phase 2/3 syncs
   * (healthsites.io / KMHFL) haven't run. Never guessed; genuinely unknown
   * until then.
   */
  facilityOwnership: "GOVERNMENT" | "FAITH_BASED" | "PRIVATE_FOR_PROFIT" | "PRIVATE_NOT_FOR_PROFIT" | "MILITARY" | "OTHER" | null;
  countryCode: string | null;
  facilityLevelWho: string | null;
};

const OUTREACH_SLUG = "outreach-mobile";

/** Follow merge chain to canonical facility id. */
export async function resolveCanonicalFacilityId(facilityId: number): Promise<number> {
  const db = await getDb();
  if (!db) return facilityId;

  let current = facilityId;
  for (let i = 0; i < 10; i++) {
    const [row] = await db
      .select({ mergedIntoId: careFacilities.mergedIntoId })
      .from(careFacilities)
      .where(eq(careFacilities.id, current))
      .limit(1);
    if (!row?.mergedIntoId) return current;
    current = row.mergedIntoId;
  }
  return current;
}

export async function getFacilityById(facilityId: number) {
  const db = await getDb();
  if (!db) return null;
  const canonicalId = await resolveCanonicalFacilityId(facilityId);
  const [row] = await db
    .select({
      id: careFacilities.id,
      name: careFacilities.name,
      county: careFacilities.county,
      country: careFacilities.country,
      subCounty: careFacilities.subCounty,
      facilityType: careFacilities.facilityType,
      institutionalAccountId: careFacilities.institutionalAccountId,
      isSystem: careFacilities.isSystem,
      systemSlug: careFacilities.systemSlug,
      facilityOwnership: facilities.facilityOwnership,
      countryCode: facilities.countryCode,
      facilityLevelWho: facilities.facilityLevelWho,
    })
    .from(careFacilities)
    .leftJoin(facilities, eq(facilities.legacyCareFacilityId, careFacilities.id))
    .where(eq(careFacilities.id, canonicalId))
    .limit(1);
  return row ?? null;
}

/** Seed outreach row + import institutions and accredited facilities (idempotent). */
export async function ensureFacilityRegistrySeeded() {
  const db = await getDb();
  if (!db) return;

  const [outreach] = await db
    .select({ id: careFacilities.id })
    .from(careFacilities)
    .where(eq(careFacilities.systemSlug, OUTREACH_SLUG))
    .limit(1);

  if (!outreach) {
    await db.insert(careFacilities).values({
      name: "Outreach / mobile / multiple sites",
      country: DEFAULT_FACILITY_COUNTRY,
      isSystem: true,
      systemSlug: OUTREACH_SLUG,
    });
  }

  const institutions = await db
    .select({
      id: institutionalAccounts.id,
      companyName: institutionalAccounts.companyName,
    })
    .from(institutionalAccounts);

  for (const inst of institutions) {
    const name = inst.companyName?.trim();
    if (!name) continue;
    const [existing] = await db
      .select({ id: careFacilities.id })
      .from(careFacilities)
      .where(
        and(
          eq(careFacilities.institutionalAccountId, inst.id),
          isNull(careFacilities.mergedIntoId)
        )
      )
      .limit(1);
    if (existing) continue;

    const [byName] = await db
      .select({ id: careFacilities.id })
      .from(careFacilities)
      .where(and(eq(careFacilities.name, name), isNull(careFacilities.mergedIntoId)))
      .limit(1);

    if (byName) {
      await db
        .update(careFacilities)
        .set({ institutionalAccountId: inst.id })
        .where(eq(careFacilities.id, byName.id));
    } else {
      await db.insert(careFacilities).values({
        name,
        country: DEFAULT_FACILITY_COUNTRY,
        institutionalAccountId: inst.id,
      });
    }
  }

  const accredited = await db.select().from(accreditedFacilities);
  for (const a of accredited) {
    const name = a.facilityName?.trim();
    if (!name) continue;
    const [exists] = await db
      .select({ id: careFacilities.id })
      .from(careFacilities)
      .where(and(eq(careFacilities.name, name), isNull(careFacilities.mergedIntoId)))
      .limit(1);
    if (exists) {
      if (a.county) {
        await db
          .update(careFacilities)
          .set({ county: a.county })
          .where(and(eq(careFacilities.id, exists.id), isNull(careFacilities.county)));
      }
      continue;
    }
    await db.insert(careFacilities).values({
      name,
      county: a.county ?? null,
      country: DEFAULT_FACILITY_COUNTRY,
    });
  }
}

export async function searchCareFacilities(input: {
  query: string;
  country?: string;
  limit?: number;
}): Promise<{ results: FacilitySearchResult[] }> {
  await ensureFacilityRegistrySeeded();
  const db = await getDb();
  if (!db) return { results: [] };

  const q = input.query.trim();
  const limit = input.limit ?? 12;
  if (q.length < 1) return { results: [] };

  const pattern = `%${q}%`;
  const filters = [
    isNull(careFacilities.mergedIntoId),
    like(careFacilities.name, pattern),
  ];
  if (input.country?.trim()) {
    filters.push(eq(careFacilities.country, input.country.trim()));
  }

  const rows = await db
    .select({
      id: careFacilities.id,
      name: careFacilities.name,
      county: careFacilities.county,
      country: careFacilities.country,
      institutionalAccountId: careFacilities.institutionalAccountId,
      isSystem: careFacilities.isSystem,
      facilityOwnership: facilities.facilityOwnership,
      countryCode: facilities.countryCode,
      facilityLevelWho: facilities.facilityLevelWho,
    })
    .from(careFacilities)
    .leftJoin(facilities, eq(facilities.legacyCareFacilityId, careFacilities.id))
    .where(and(...filters))
    .orderBy(desc(careFacilities.id))
    .limit(limit);

  return {
    results: rows.map((r) => ({
      id: r.id,
      name: r.name,
      county: r.county,
      country: r.country,
      badge: r.isSystem
        ? "System"
        : r.institutionalAccountId
          ? "Registered hospital"
          : "Community",
      facilityOwnership: r.facilityOwnership,
      countryCode: r.countryCode,
      facilityLevelWho: r.facilityLevelWho,
    })),
  };
}

export async function createCareFacility(input: {
  name: string;
  county?: string | null;
  country: string;
  facilityType?:
    | "primary_health_center"
    | "health_post"
    | "district_hospital"
    | "private_clinic"
    | "ngo_clinic"
    | "other"
    | null;
  createdByUserId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const name = input.name.trim();
  if (name.length < 2) throw new Error("Facility name is too short");

  const [dup] = await db
    .select({ id: careFacilities.id })
    .from(careFacilities)
    .where(and(eq(careFacilities.name, name), isNull(careFacilities.mergedIntoId)))
    .limit(1);

  if (dup) return { id: dup.id, created: false as const };

  const insertResult = await db.insert(careFacilities).values({
    name,
    county: input.county?.trim() || null,
    country: input.country.trim() || DEFAULT_FACILITY_COUNTRY,
    facilityType: input.facilityType ?? null,
  });

  const id = (insertResult as unknown as { insertId: number }).insertId;
  return { id, created: true as const };
}

export async function syncProviderProfileFacility(
  userId: number,
  facilityId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const canonicalId = await resolveCanonicalFacilityId(facilityId);
  const facility = await getFacilityById(canonicalId);
  if (!facility) return;

  await db
    .update(providerProfiles)
    .set({
      facilityId: canonicalId,
      facilityName: facility.name,
      facilityRegion: facility.county ?? null,
      facilityCountry: facility.country,
      updatedAt: new Date(),
    })
    .where(eq(providerProfiles.userId, userId));
}

export async function mergeCareFacilities(input: {
  sourceFacilityId: number;
  targetFacilityId: number;
  adminUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const sourceId = await resolveCanonicalFacilityId(input.sourceFacilityId);
  const targetId = await resolveCanonicalFacilityId(input.targetFacilityId);

  if (sourceId === targetId) {
    return { ok: true, movedEvents: 0, movedProfiles: 0 };
  }

  const [target] = await db
    .select()
    .from(careFacilities)
    .where(eq(careFacilities.id, targetId))
    .limit(1);
  if (!target) throw new Error("Target facility not found");

  await db
    .update(careFacilities)
    .set({ mergedIntoId: targetId, updatedAt: new Date() })
    .where(eq(careFacilities.id, sourceId));

  const eventsUpdated = await db
    .update(careSignalEvents)
    .set({ facilityId: targetId })
    .where(eq(careSignalEvents.facilityId, sourceId));

  const profilesUpdated = await db
    .update(providerProfiles)
    .set({
      facilityId: targetId,
      facilityName: target.name,
      facilityRegion: target.county,
      facilityCountry: target.country,
      updatedAt: new Date(),
    })
    .where(eq(providerProfiles.facilityId, sourceId));

  const children = await db
    .select({ id: careFacilities.id })
    .from(careFacilities)
    .where(eq(careFacilities.mergedIntoId, sourceId));

  for (const child of children) {
    await db
      .update(careFacilities)
      .set({ mergedIntoId: targetId, updatedAt: new Date() })
      .where(eq(careFacilities.id, child.id));
  }

  return {
    ok: true,
    sourceFacilityId: sourceId,
    targetFacilityId: targetId,
    movedEvents: (eventsUpdated as unknown as { rowsAffected?: number }).rowsAffected ?? 0,
    movedProfiles: (profilesUpdated as unknown as { rowsAffected?: number }).rowsAffected ?? 0,
    adminUserId: input.adminUserId,
  };
}

export async function listFacilitiesForAdminMerge(input: { search?: string; limit?: number }) {
  const db = await getDb();
  if (!db) return { facilities: [] as Array<typeof careFacilities.$inferSelect> };

  const limit = input.limit ?? 100;
  const filters = [isNull(careFacilities.mergedIntoId)];
  if (input.search?.trim()) {
    filters.push(like(careFacilities.name, `%${input.search.trim()}%`));
  }

  const facilities = await db
    .select()
    .from(careFacilities)
    .where(and(...filters))
    .orderBy(careFacilities.name)
    .limit(limit);

  return { facilities };
}

/** Aggregate Care Signal metrics by county or country using facilityId. */
export async function getGeographicCareSignalDashboard(input: {
  level: "county" | "country";
  name: string;
  lastDays?: number;
}) {
  const db = await getDb();
  const lastDays = input.lastDays ?? 90;
  const since = new Date(Date.now() - lastDays * 24 * 60 * 60 * 1000);
  const geoName = input.name.trim();

  if (!db || !geoName) {
    return emptyGeoDashboard(input.level, geoName, lastDays);
  }

  const facilityFilter =
    input.level === "county"
      ? eq(careFacilities.county, geoName)
      : eq(careFacilities.country, geoName);

  const facilitiesInGeo = await db
    .select({ id: careFacilities.id, name: careFacilities.name })
    .from(careFacilities)
    .where(and(facilityFilter, isNull(careFacilities.mergedIntoId)));

  const facilityIds = facilitiesInGeo.map((f) => f.id);
  if (facilityIds.length === 0) {
    return {
      ...emptyGeoDashboard(input.level, geoName, lastDays),
      facilitiesInArea: 0,
    };
  }

  const events = await db
    .select({
      id: careSignalEvents.id,
      facilityId: careSignalEvents.facilityId,
      systemGaps: careSignalEvents.systemGaps,
      outcome: careSignalEvents.outcome,
      status: careSignalEvents.status,
      eventDate: careSignalEvents.eventDate,
      createdAt: careSignalEvents.createdAt,
    })
    .from(careSignalEvents)
    .where(
      and(gte(careSignalEvents.createdAt, since), inArray(careSignalEvents.facilityId, facilityIds))
    );

  const gapBreakdown: Record<string, number> = {};
  const outcomeBreakdown: Record<string, number> = {};
  for (const e of events) {
    outcomeBreakdown[e.outcome] = (outcomeBreakdown[e.outcome] ?? 0) + 1;
    try {
      const gaps = JSON.parse(e.systemGaps) as string[];
      for (const g of gaps) gapBreakdown[g] = (gapBreakdown[g] ?? 0) + 1;
    } catch {
      /* skip */
    }
  }

  const topGaps = Object.entries(gapBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([gap, count]) => ({ gap, count }));

  const topFacilities = await db
    .select({
      facilityId: careSignalEvents.facilityId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(careSignalEvents)
    .where(
      and(gte(careSignalEvents.createdAt, since), inArray(careSignalEvents.facilityId, facilityIds))
    )
    .groupBy(careSignalEvents.facilityId)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  const facilityNameById = new Map(facilitiesInGeo.map((f) => [f.id, f.name]));

  return {
    level: input.level,
    name: geoName,
    lastDays,
    facilitiesInArea: facilityIds.length,
    totalSubmissions: events.length,
    underReviewCount: events.filter((e) => e.status === "under_review").length,
    outcomeBreakdown,
    topGaps,
    topFacilities: topFacilities.map((row) => ({
      facilityId: row.facilityId,
      facilityName: facilityNameById.get(row.facilityId ?? 0) ?? "Unknown",
      count: row.count,
    })),
  };
}

function emptyGeoDashboard(level: "county" | "country", name: string, lastDays: number) {
  return {
    level,
    name,
    lastDays,
    facilitiesInArea: 0,
    totalSubmissions: 0,
    underReviewCount: 0,
    outcomeBreakdown: {} as Record<string, number>,
    topGaps: [] as Array<{ gap: string; count: number }>,
    topFacilities: [] as Array<{ facilityId: number | null; facilityName: string; count: number }>,
  };
}

export async function listGeographicAreas() {
  const db = await getDb();
  if (!db) return { counties: [] as string[], countries: [] as string[] };

  await ensureFacilityRegistrySeeded();

  const countyRows = await db
    .selectDistinct({ county: careFacilities.county })
    .from(careFacilities)
    .where(and(isNull(careFacilities.mergedIntoId), isNotNull(careFacilities.county)));

  const countryRows = await db
    .selectDistinct({ country: careFacilities.country })
    .from(careFacilities)
    .where(isNull(careFacilities.mergedIntoId));

  return {
    counties: countyRows.map((r) => r.county).filter((c): c is string => Boolean(c?.trim())),
    countries: countryRows.map((r) => r.country).filter(Boolean),
  };
}
