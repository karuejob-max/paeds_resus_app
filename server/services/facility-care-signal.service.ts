/**
 * Facility-, county-, and country-level Care Signal intelligence.
 */
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { getDb } from "../db";
import {
  careSignalEvents,
  providerProfiles,
  users,
  careFacilities,
} from "../../drizzle/schema";
import { getFacilityById, resolveCanonicalFacilityId } from "./facility-registry.service";

/** Facilities with Care Signal volume (canonical registry). */
export async function listCareSignalFacilities(options: { limit?: number } = {}) {
  const db = await getDb();
  if (!db) return { facilities: [] as Array<{ facilityId: number; facilityName: string; county: string | null; country: string; eventCount: number }> };

  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const allEvents = await db
    .select({
      facilityId: careSignalEvents.facilityId,
      gapDetails: careSignalEvents.gapDetails,
    })
    .from(careSignalEvents)
    .where(gte(careSignalEvents.createdAt, since));

  const countsByFacilityId: Record<number, number> = {};
  const legacyNameCounts: Record<string, number> = {};

  for (const row of allEvents) {
    if (row.facilityId) {
      countsByFacilityId[row.facilityId] = (countsByFacilityId[row.facilityId] ?? 0) + 1;
      continue;
    }
    try {
      const details = JSON.parse(row.gapDetails) as { facilityName?: string };
      const name = (details.facilityName ?? "").trim();
      if (!name || name === "Unknown") continue;
      legacyNameCounts[name] = (legacyNameCounts[name] ?? 0) + 1;
    } catch {
      /* skip */
    }
  }


  const facilityIds = Object.keys(countsByFacilityId).map(Number);
  const registryRows =
    facilityIds.length > 0
      ? await db
          .select({
            id: careFacilities.id,
            name: careFacilities.name,
            county: careFacilities.county,
            country: careFacilities.country,
          })
          .from(careFacilities)
          .where(inArray(careFacilities.id, facilityIds))
      : [];

  const facilities = registryRows
    .map((f) => ({
      facilityId: f.id,
      facilityName: f.name,
      county: f.county,
      country: f.country,
      eventCount: countsByFacilityId[f.id] ?? 0,
    }))
    .concat(
      Object.entries(legacyNameCounts).map(([facilityName, eventCount]) => ({
        facilityId: 0,
        facilityName,
        county: null as string | null,
        country: "Kenya",
        eventCount,
      }))
    )
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, options.limit ?? 100);

  return { facilities };
}

export async function getFacilityCareSignalDashboard(input: {
  facilityId?: number;
  facilityName?: string;
  lastDays?: number;
}) {
  const db = await getDb();
  const lastDays = input.lastDays ?? 90;
  const since = new Date(Date.now() - lastDays * 24 * 60 * 60 * 1000);

  let facilityId = input.facilityId ?? null;
  let facilityName = input.facilityName?.trim() ?? "";
  let facilityCounty: string | null = null;
  let facilityCountry = "Kenya";

  if (facilityId) {
    const canonicalId = await resolveCanonicalFacilityId(facilityId);
    const facility = await getFacilityById(canonicalId);
    if (facility) {
      facilityId = facility.id;
      facilityName = facility.name;
      facilityCounty = facility.county;
      facilityCountry = facility.country;
    }
  }

  if (!db || (!facilityId && !facilityName)) {
    return emptyDashboard(facilityName, lastDays, facilityCounty, facilityCountry);
  }

  const allRecent = await db
    .select({
      id: careSignalEvents.id,
      userId: careSignalEvents.userId,
      isAnonymous: careSignalEvents.isAnonymous,
      facilityId: careSignalEvents.facilityId,
      eventDate: careSignalEvents.eventDate,
      eventType: careSignalEvents.eventType,
      outcome: careSignalEvents.outcome,
      systemGaps: careSignalEvents.systemGaps,
      status: careSignalEvents.status,
      gapDetails: careSignalEvents.gapDetails,
      createdAt: careSignalEvents.createdAt,
    })
    .from(careSignalEvents)
    .where(gte(careSignalEvents.createdAt, since))
    .orderBy(desc(careSignalEvents.createdAt));

  const events = allRecent.filter((e) => {
    if (facilityId && e.facilityId === facilityId) return true;
    if (!facilityName) return false;
    try {
      const details = JSON.parse(e.gapDetails) as { facilityName?: string };
      return (details.facilityName ?? "").trim() === facilityName;
    } catch {
      return false;
    }
  });

  const outcomeBreakdown: Record<string, number> = {};
  const gapBreakdown: Record<string, number> = {};
  const statusBreakdown: Record<string, number> = {};
  const reporterIds = new Set<number>();
  const preventableCounts: Record<string, number> = {};
  const contributingFactorCounts: Record<string, number> = {};
  const equipmentGapCounts: Record<string, number> = {};
  let v2SubmissionCount = 0;
  let deathsCount = 0;

  for (const e of events) {
    outcomeBreakdown[e.outcome] = (outcomeBreakdown[e.outcome] ?? 0) + 1;
    statusBreakdown[e.status] = (statusBreakdown[e.status] ?? 0) + 1;
    if (e.userId && !e.isAnonymous) reporterIds.add(e.userId);
    if (e.outcome === "died") deathsCount++;
    try {
      const gaps = JSON.parse(e.systemGaps) as string[];
      for (const g of gaps) gapBreakdown[g] = (gapBreakdown[g] ?? 0) + 1;
    } catch {
      /* skip */
    }
    try {
      const details = JSON.parse(e.gapDetails) as {
        formVersion?: string;
        preventableAssessment?: string;
        contributingFactors?: string[];
        response?: { equipmentUnavailable?: string[] };
      };
      if (details.formVersion === "v2") {
        v2SubmissionCount++;
        const pa = details.preventableAssessment ?? "unknown";
        preventableCounts[pa] = (preventableCounts[pa] ?? 0) + 1;
        for (const f of details.contributingFactors ?? []) {
          contributingFactorCounts[f] = (contributingFactorCounts[f] ?? 0) + 1;
        }
        for (const eq of details.response?.equipmentUnavailable ?? []) {
          equipmentGapCounts[eq] = (equipmentGapCounts[eq] ?? 0) + 1;
        }
      }
    } catch {
      /* skip */
    }
  }

  const topContributingFactors = Object.entries(contributingFactorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([factor, count]) => ({ factor, count }));

  const topEquipmentGaps = Object.entries(equipmentGapCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([item, count]) => ({ item, count }));

  const providersAtFacility = facilityId
    ? await db
        .select({
          userId: providerProfiles.userId,
          userName: users.name,
          userEmail: users.email,
        })
        .from(providerProfiles)
        .innerJoin(users, eq(providerProfiles.userId, users.id))
        .where(eq(providerProfiles.facilityId, facilityId))
        .limit(200)
    : facilityName
      ? await db
          .select({
            userId: providerProfiles.userId,
            userName: users.name,
            userEmail: users.email,
          })
          .from(providerProfiles)
          .innerJoin(users, eq(providerProfiles.userId, users.id))
          .where(eq(providerProfiles.facilityName, facilityName))
          .limit(200)
      : [];

  const providersWithoutSubmission = providersAtFacility.filter(
    (p) => !reporterIds.has(p.userId)
  );

  const topGaps = Object.entries(gapBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([gap, count]) => ({ gap, count }));

  const underReview = events.filter((e) => e.status === "under_review").length;

  return {
    facilityId,
    facilityName,
    facilityCounty,
    facilityCountry,
    lastDays,
    totalSubmissions: events.length,
    submissionsThisMonth: events.filter((e) => {
      const d = new Date(e.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    underReviewCount: underReview,
    uniqueReporters: reporterIds.size,
    providersRegistered: providersAtFacility.length,
    providersWithoutSubmission: providersWithoutSubmission.length,
    outcomeBreakdown,
    statusBreakdown,
    topGaps,
    recentEvents: events.slice(0, 25).map((e) => ({
      id: e.id,
      eventDate: e.eventDate,
      eventType: e.eventType,
      outcome: e.outcome,
      status: e.status,
      userId: e.isAnonymous ? null : e.userId,
    })),
    providersAtFacility,
    providersWithoutSubmissionList: providersWithoutSubmission.slice(0, 20),
    qiMetrics: {
      v2SubmissionCount,
      deathsCount,
      likelyPreventableCount:
        (preventableCounts.likely_preventable ?? 0) + (preventableCounts.possibly_preventable ?? 0),
      preventableBreakdown: preventableCounts,
      topContributingFactors,
      topEquipmentGaps,
    },
  };
}

function emptyDashboard(
  facilityName: string,
  lastDays: number,
  facilityCounty: string | null,
  facilityCountry: string
) {
  return {
    facilityId: null as number | null,
    facilityName,
    facilityCounty,
    facilityCountry,
    lastDays,
    totalSubmissions: 0,
    submissionsThisMonth: 0,
    underReviewCount: 0,
    uniqueReporters: 0,
    providersRegistered: 0,
    providersWithoutSubmission: 0,
    outcomeBreakdown: {} as Record<string, number>,
    statusBreakdown: {} as Record<string, number>,
    topGaps: [] as Array<{ gap: string; count: number }>,
    recentEvents: [] as Array<{
      id: number;
      eventDate: Date;
      eventType: string;
      outcome: string;
      status: string;
      userId: number | null;
    }>,
    providersAtFacility: [] as Array<{
      userId: number;
      userName: string | null;
      userEmail: string | null;
    }>,
    providersWithoutSubmissionList: [] as Array<{
      userId: number;
      userName: string | null;
      userEmail: string | null;
    }>,
    qiMetrics: {
      v2SubmissionCount: 0,
      deathsCount: 0,
      likelyPreventableCount: 0,
      preventableBreakdown: {} as Record<string, number>,
      topContributingFactors: [] as Array<{ factor: string; count: number }>,
      topEquipmentGaps: [] as Array<{ item: string; count: number }>,
    },
  };
}
