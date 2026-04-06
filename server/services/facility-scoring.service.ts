import { getDb } from "../db";
import { safetruthEvents, facilityScores } from "../../drizzle/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export interface FacilityScoreInput {
  facilityId: number;
  facilityName: string;
}

export interface FacilityScoreData {
  facilityId: number;
  facilityName: string;
  pCOSCARate: number;
  totalEventsReported: number;
  averageRemediationDays: number;
  staffEngagementScore: number;
  overallScore: number;
  badge: "Bronze" | "Silver" | "Gold" | "None";
  accreditationStatus: "accredited" | "pending" | "ineligible";
}

/**
 * Calculate comprehensive facility score based on multiple metrics
 */
export async function calculateFacilityScore(
  input: FacilityScoreInput
): Promise<FacilityScoreData> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const { facilityId, facilityName } = input;

  // Get all events for this facility in the past 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const events = await db
    .select()
    .from(safetruthEvents)
    .where(
      and(
        eq(safetruthEvents.facilityId, facilityId),
        gte(safetruthEvents.eventDate, twelveMonthsAgo)
      )
    );

  // Calculate metrics based on event frequency and engagement
  // pCOSCA rate is estimated from event reporting frequency (more events = better engagement)
  const pCOSCARate = Math.min(100, (events.length / 50) * 100); // Normalize: 50 events = 100%

  // Calculate staff engagement (events per staff member estimate)
  const staffEngagementScore = Math.min(
    100,
    (events.length / 100) * 100 // Normalize to 100 for 100+ events
  );

  // Calculate average remediation time (estimated from event recency)
  // Facilities that report regularly have faster remediation
  let averageRemediationDays = 30; // Default
  if (events.length > 0) {
    const eventDates = events.map((e) => new Date(e.eventDate).getTime());
    const now = Date.now();
    const avgDaysOld = eventDates.reduce((sum, date) => sum + (now - date) / (1000 * 60 * 60 * 24), 0) / events.length;
    // Facilities with recent events are assumed to remediate faster
    averageRemediationDays = Math.max(7, 30 - (avgDaysOld / 365) * 20);
  }

  // Calculate overall score (weighted)
  const overallScore =
    pCOSCARate * 0.4 + // pCOSCA rate: 40% weight
    staffEngagementScore * 0.3 + // Staff engagement: 30% weight
    (100 - Math.min(100, (averageRemediationDays / 30) * 100)) * 0.3; // Remediation speed: 30% weight

  // Determine accreditation badge
  let badge: "Bronze" | "Silver" | "Gold" | "None" = "None";
  let accreditationStatus: "accredited" | "pending" | "ineligible" = "ineligible";

  if (
    pCOSCARate >= 60 &&
    events.length >= 50 &&
    averageRemediationDays <= 30 &&
    staffEngagementScore >= 60
  ) {
    badge = "Bronze";
    accreditationStatus = "accredited";
  }

  if (
    pCOSCARate >= 75 &&
    events.length >= 100 &&
    averageRemediationDays <= 21 &&
    staffEngagementScore >= 75
  ) {
    badge = "Silver";
    accreditationStatus = "accredited";
  }

  if (
    pCOSCARate >= 85 &&
    events.length >= 150 &&
    averageRemediationDays <= 14 &&
    staffEngagementScore >= 85
  ) {
    badge = "Gold";
    accreditationStatus = "accredited";
  }

  // If not yet accredited but close, mark as pending
  if (accreditationStatus === "ineligible" && overallScore >= 60) {
    accreditationStatus = "pending";
  }

  const score: FacilityScoreData = {
    facilityId,
    facilityName,
    pCOSCARate: Math.round(pCOSCARate * 10) / 10,
    totalEventsReported: events.length,
    averageRemediationDays: Math.round(averageRemediationDays * 10) / 10,
    staffEngagementScore: Math.round(staffEngagementScore * 10) / 10,
    overallScore: Math.round(overallScore * 10) / 10,
    badge,
    accreditationStatus,
  };

  // Save to database
  await db
    .insert(facilityScores)
    .values({
      facilityId,
      facilityName,
      pCOSCARate: score.pCOSCARate.toString(),
      totalEventsReported: score.totalEventsReported,
      systemGapRemediationSpeed: Math.round(score.averageRemediationDays),
      staffEngagementScore: score.staffEngagementScore.toString(),
      overallScore: score.overallScore.toString(),
    })
    .onDuplicateKeyUpdate({
      set: {
        pCOSCARate: score.pCOSCARate.toString(),
        totalEventsReported: score.totalEventsReported,
        systemGapRemediationSpeed: Math.round(score.averageRemediationDays),
        staffEngagementScore: score.staffEngagementScore.toString(),
        overallScore: score.overallScore.toString(),
      },
    });

  return score;
}

/**
 * Get facility score from database
 */
export async function getFacilityScore(facilityId: number): Promise<FacilityScoreData | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db
    .select()
    .from(facilityScores)
    .where(eq(facilityScores.facilityId, facilityId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const row = result[0];
  const pCOSCARate = parseFloat(row.pCOSCARate || "0");
  const totalEvents = row.totalEventsReported || 0;
  const remediationDays = row.systemGapRemediationSpeed || 0;
  const engagementScore = parseFloat(row.staffEngagementScore || "0");

  let badge: "Bronze" | "Silver" | "Gold" | "None" = "None";
  if (
    pCOSCARate >= 85 &&
    totalEvents >= 150 &&
    remediationDays <= 14 &&
    engagementScore >= 85
  ) {
    badge = "Gold";
  } else if (
    pCOSCARate >= 75 &&
    totalEvents >= 100 &&
    remediationDays <= 21 &&
    engagementScore >= 75
  ) {
    badge = "Silver";
  } else if (
    pCOSCARate >= 60 &&
    totalEvents >= 50 &&
    remediationDays <= 30 &&
    engagementScore >= 60
  ) {
    badge = "Bronze";
  }

  return {
    facilityId: row.facilityId,
    facilityName: row.facilityName,
    pCOSCARate,
    totalEventsReported: totalEvents,
    averageRemediationDays: remediationDays,
    staffEngagementScore: engagementScore,
    overallScore: parseFloat(row.overallScore || "0"),
    badge,
    accreditationStatus: badge !== "None" ? "accredited" : "ineligible",
  };
}

/**
 * Get top performing facilities (for public directory)
 */
export async function getTopFacilities(limit: number = 10): Promise<FacilityScoreData[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const results = await db
    .select()
    .from(facilityScores)
    .orderBy(sql`CAST(${facilityScores.overallScore} AS DECIMAL) DESC`)
    .limit(limit);

  return results.map((row) => {
    const pCOSCARate = parseFloat(row.pCOSCARate || "0");
    const totalEvents = row.totalEventsReported || 0;
    const remediationDays = row.systemGapRemediationSpeed || 0;
    const engagementScore = parseFloat(row.staffEngagementScore || "0");

    let badge: "Bronze" | "Silver" | "Gold" | "None" = "None";
    if (
      pCOSCARate >= 85 &&
      totalEvents >= 150 &&
      remediationDays <= 14 &&
      engagementScore >= 85
    ) {
      badge = "Gold";
    } else if (
      pCOSCARate >= 75 &&
      totalEvents >= 100 &&
      remediationDays <= 21 &&
      engagementScore >= 75
    ) {
      badge = "Silver";
    } else if (
      pCOSCARate >= 60 &&
      totalEvents >= 50 &&
      remediationDays <= 30 &&
      engagementScore >= 60
    ) {
      badge = "Bronze";
    }

    return {
      facilityId: row.facilityId,
      facilityName: row.facilityName,
      pCOSCARate,
      totalEventsReported: totalEvents,
      averageRemediationDays: remediationDays,
      staffEngagementScore: engagementScore,
      overallScore: parseFloat(row.overallScore || "0"),
      badge,
      accreditationStatus: badge !== "None" ? "accredited" : "ineligible",
    };
  });
}

/**
 * Get facilities by badge level
 */
export async function getFacilitiesByBadge(
  badge: "Bronze" | "Silver" | "Gold"
): Promise<FacilityScoreData[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const results = await db
    .select()
    .from(facilityScores)
    .orderBy(sql`CAST(${facilityScores.overallScore} AS DECIMAL) DESC`);

  return results
    .map((row) => {
      const pCOSCARate = parseFloat(row.pCOSCARate || "0");
      const totalEvents = row.totalEventsReported || 0;
      const remediationDays = row.systemGapRemediationSpeed || 0;
      const engagementScore = parseFloat(row.staffEngagementScore || "0");

      let calculatedBadge: "Bronze" | "Silver" | "Gold" | "None" = "None";
      if (
        pCOSCARate >= 85 &&
        totalEvents >= 150 &&
        remediationDays <= 14 &&
        engagementScore >= 85
      ) {
        calculatedBadge = "Gold";
      } else if (
        pCOSCARate >= 75 &&
        totalEvents >= 100 &&
        remediationDays <= 21 &&
        engagementScore >= 75
      ) {
        calculatedBadge = "Silver";
      } else if (
        pCOSCARate >= 60 &&
        totalEvents >= 50 &&
        remediationDays <= 30 &&
        engagementScore >= 60
      ) {
        calculatedBadge = "Bronze";
      }

      return {
        facilityId: row.facilityId,
        facilityName: row.facilityName,
        pCOSCARate,
        totalEventsReported: totalEvents,
        averageRemediationDays: remediationDays,
        staffEngagementScore: engagementScore,
        overallScore: parseFloat(row.overallScore || "0"),
        badge: calculatedBadge,
        accreditationStatus: (calculatedBadge !== "None" ? "accredited" : "ineligible") as "accredited" | "pending" | "ineligible",
      };
    })
    .filter((score) => score.badge === badge);
}

/**
 * Recalculate all facility scores (batch operation)
 */
export async function recalculateAllFacilityScores(): Promise<number> {
  const db = await getDb();
  if (!db) {
    return 0;
  }

  // Get unique facilities from events
  const facilitiesResult = await db
    .selectDistinct({ facilityId: safetruthEvents.facilityId })
    .from(safetruthEvents);

  let count = 0;
  for (const { facilityId } of facilitiesResult) {
    if (facilityId) {
      try {
        await calculateFacilityScore({
          facilityId,
          facilityName: `Facility ${facilityId}`,
        });
        count++;
      } catch (error) {
        console.error(`Failed to calculate score for facility ${facilityId}:`, error);
      }
    }
  }

  return count;
}
