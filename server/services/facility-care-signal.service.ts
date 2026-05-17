/**
 * Facility-level Care Signal intelligence (QI workspace per hospital/clinic).
 */
import { desc, eq, gte } from "drizzle-orm";
import { getDb } from "../db";
import { careSignalEvents, providerProfiles, users } from "../../drizzle/schema";

/** Distinct facility names seen in Care Signal submissions. */
export async function listCareSignalFacilities(options: { limit?: number } = {}) {
  const db = await getDb();
  if (!db) return { facilities: [] as Array<{ facilityName: string; eventCount: number }> };

  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      gapDetails: careSignalEvents.gapDetails,
      createdAt: careSignalEvents.createdAt,
    })
    .from(careSignalEvents)
    .where(gte(careSignalEvents.createdAt, since));

  const counts: Record<string, number> = {};
  for (const row of rows) {
    try {
      const details = JSON.parse(row.gapDetails) as { facilityName?: string };
      const name = (details.facilityName ?? "").trim();
      if (!name || name === "Unknown") continue;
      counts[name] = (counts[name] ?? 0) + 1;
    } catch {
      /* skip */
    }
  }

  const facilities = Object.entries(counts)
    .map(([facilityName, eventCount]) => ({ facilityName, eventCount }))
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, options.limit ?? 100);

  return { facilities };
}

export async function getFacilityCareSignalDashboard(input: {
  facilityName: string;
  lastDays?: number;
}) {
  const db = await getDb();
  const facilityName = input.facilityName.trim();
  const lastDays = input.lastDays ?? 90;
  const since = new Date(Date.now() - lastDays * 24 * 60 * 60 * 1000);

  if (!db || !facilityName) {
    return emptyDashboard(facilityName, lastDays);
  }

  const allRecent = await db
    .select({
      id: careSignalEvents.id,
      userId: careSignalEvents.userId,
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

  for (const e of events) {
    outcomeBreakdown[e.outcome] = (outcomeBreakdown[e.outcome] ?? 0) + 1;
    statusBreakdown[e.status] = (statusBreakdown[e.status] ?? 0) + 1;
    if (e.userId) reporterIds.add(e.userId);
    try {
      const gaps = JSON.parse(e.systemGaps) as string[];
      for (const g of gaps) gapBreakdown[g] = (gapBreakdown[g] ?? 0) + 1;
    } catch {
      /* skip */
    }
  }

  const providersAtFacility = await db
    .select({
      userId: providerProfiles.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(providerProfiles)
    .innerJoin(users, eq(providerProfiles.userId, users.id))
    .where(eq(providerProfiles.facilityName, facilityName))
    .limit(200);

  const reportersWithEvents = [...reporterIds];
  const providersWithoutSubmission = providersAtFacility.filter(
    (p) => !reporterIds.has(p.userId)
  );

  const topGaps = Object.entries(gapBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([gap, count]) => ({ gap, count }));

  const underReview = events.filter((e) => e.status === "under_review").length;

  return {
    facilityName,
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
      userId: e.userId,
    })),
    providersAtFacility,
    providersWithoutSubmissionList: providersWithoutSubmission.slice(0, 20),
  };
}

function emptyDashboard(facilityName: string, lastDays: number) {
  return {
    facilityName,
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
  };
}
