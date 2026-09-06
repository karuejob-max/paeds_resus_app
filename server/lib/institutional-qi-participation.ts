import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import {
  careSignalEvents,
  codeSignalEvents,
  institutionalQiEffectivenessReviews,
  institutionalQiParticipationSnapshots,
  institutionalQiReports,
  institutionProductSubscriptions,
} from "../../drizzle/schema";
import { participationRequirement, type FacilityLevel } from "@shared/institutional-pricing";

const CURE_DAYS = 30;

function quarterStart(end: Date) {
  return new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
}

export async function evaluateInstitutionalQiParticipation(db: any, now = new Date()) {
  const subscriptions = await db.select().from(institutionProductSubscriptions).where(
    and(
      eq(institutionProductSubscriptions.dataSharingStatus, "consented"),
      sql`${institutionProductSubscriptions.facilityLevel} is not null`,
    ),
  );
  let evaluated = 0;
  let met = 0;
  let curesStarted = 0;
  let lapsed = 0;
  for (const subscription of subscriptions) {
    const start = quarterStart(now);
    const [closed] = await db.select({ count: sql<number>`count(distinct ${institutionalQiReports.id})` }).from(institutionalQiReports).innerJoin(institutionalQiEffectivenessReviews, eq(institutionalQiEffectivenessReviews.reportId, institutionalQiReports.id)).where(and(eq(institutionalQiReports.institutionalAccountId, subscription.institutionalAccountId), eq(institutionalQiReports.status, "closed"), gte(institutionalQiReports.closedAt, start), lt(institutionalQiReports.closedAt, now)));
    const [care] = await db.select({ count: sql<number>`count(*)` }).from(careSignalEvents).where(and(eq(careSignalEvents.facilityId, subscription.institutionalAccountId), gte(careSignalEvents.createdAt, start), lt(careSignalEvents.createdAt, now)));
    const [code] = await db.select({ count: sql<number>`count(*)` }).from(codeSignalEvents).where(and(eq(codeSignalEvents.facilityId, subscription.institutionalAccountId), gte(codeSignalEvents.createdAt, start), lt(codeSignalEvents.createdAt, now)));
    const closedEffectiveReports = Number(closed?.count ?? 0);
    const required = participationRequirement(subscription.facilityLevel as FacilityLevel);
    const participationStatus = closedEffectiveReports >= required ? "met" : "not_met";
    const cureEndsAt = participationStatus === "not_met" && !subscription.participationCureEndsAt ? new Date(now.getTime() + CURE_DAYS * 24 * 60 * 60 * 1000) : participationStatus === "met" ? null : subscription.participationCureEndsAt;
    const shouldLapse = participationStatus === "not_met" && cureEndsAt != null && cureEndsAt <= now;
    await db.insert(institutionalQiParticipationSnapshots).values({ institutionalAccountId: subscription.institutionalAccountId, quarterStart: start, quarterEnd: now, facilityLevel: subscription.facilityLevel, requiredClosedEffectiveReports: required, closedEffectiveReports, careSignalReports: Number(care?.count ?? 0), codeSignalReports: Number(code?.count ?? 0), participationStatus });
    await db.update(institutionProductSubscriptions).set({ participationLastEvaluatedAt: now, participationLastStatus: participationStatus, participationCureEndsAt: shouldLapse ? null : cureEndsAt, dataSharingStatus: shouldLapse ? "lapsed" : subscription.dataSharingStatus, dataSharingLapsedAt: shouldLapse ? now : subscription.dataSharingLapsedAt, updatedAt: now }).where(eq(institutionProductSubscriptions.id, subscription.id));
    evaluated += 1;
    if (participationStatus === "met") met += 1;
    if (cureEndsAt && cureEndsAt > now && participationStatus === "not_met") curesStarted += 1;
    if (shouldLapse) lapsed += 1;
  }
  return { evaluated, met, curesStarted, lapsed };
}
