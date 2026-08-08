/**
 * Facility-level Code Signal intelligence — sibling of
 * facility-care-signal.service.ts, deliberately smaller. Care Signal's
 * dashboard carries years of accumulated depth that doesn't map cleanly
 * onto Code Signal yet: v2-era "gapDetails" QI metrics (Code Signal has no
 * v2, only ever one form version), ResusGPS adoption stats (unrelated
 * system), and a "providers without submission" roster completeness check
 * (deferred deliberately — Care Signal's roster is the paediatric ward
 * roster; Code Signal is whole-hospital by design, so "who's expected to
 * report" isn't the same roster, and isn't a call to make silently here).
 *
 * What this DOES give a facility admin: submission volume, pending-review
 * count, condition/patient-category breakdowns, and recent events — enough
 * to answer "how are we doing on whole-hospital readiness" without
 * inventing metrics that need a real design decision first.
 */
import { and, desc, eq, gte } from "drizzle-orm";
import { getDb } from "../db";
import { codeSignalEvents } from "../../drizzle/schema";

export async function getFacilityCodeSignalDashboard(input: {
  facilityId?: number;
  lastDays?: number;
}) {
  const lastDays = input.lastDays ?? 90;
  const db = await getDb();
  if (!db || !input.facilityId) {
    return {
      lastDays,
      totalSubmissions: 0,
      submissionsThisMonth: 0,
      pendingCount: 0,
      conditionBreakdown: {} as Record<string, number>,
      patientCategoryBreakdown: {} as Record<string, number>,
      recentEvents: [] as Array<{
        id: number;
        conditionCategory: string;
        patientCategory: string;
        outcomeCategory: string;
        status: string;
        eventDate: Date;
      }>,
    };
  }

  const since = new Date(Date.now() - lastDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [windowEvents, thisMonthEvents, pending, recentEvents] = await Promise.all([
    db
      .select({
        conditionCategory: codeSignalEvents.conditionCategory,
        patientCategory: codeSignalEvents.patientCategory,
      })
      .from(codeSignalEvents)
      .where(and(eq(codeSignalEvents.facilityId, input.facilityId), gte(codeSignalEvents.createdAt, since))),
    db
      .select({ id: codeSignalEvents.id })
      .from(codeSignalEvents)
      .where(and(eq(codeSignalEvents.facilityId, input.facilityId), gte(codeSignalEvents.createdAt, monthStart))),
    db
      .select({ id: codeSignalEvents.id })
      .from(codeSignalEvents)
      .where(and(eq(codeSignalEvents.facilityId, input.facilityId), eq(codeSignalEvents.status, "submitted"))),
    db
      .select({
        id: codeSignalEvents.id,
        conditionCategory: codeSignalEvents.conditionCategory,
        patientCategory: codeSignalEvents.patientCategory,
        outcomeCategory: codeSignalEvents.outcomeCategory,
        status: codeSignalEvents.status,
        eventDate: codeSignalEvents.eventDate,
      })
      .from(codeSignalEvents)
      .where(eq(codeSignalEvents.facilityId, input.facilityId))
      .orderBy(desc(codeSignalEvents.createdAt))
      .limit(10),
  ]);

  const conditionBreakdown: Record<string, number> = {};
  const patientCategoryBreakdown: Record<string, number> = {};
  for (const e of windowEvents) {
    conditionBreakdown[e.conditionCategory] = (conditionBreakdown[e.conditionCategory] ?? 0) + 1;
    patientCategoryBreakdown[e.patientCategory] = (patientCategoryBreakdown[e.patientCategory] ?? 0) + 1;
  }

  return {
    lastDays,
    totalSubmissions: windowEvents.length,
    submissionsThisMonth: thisMonthEvents.length,
    pendingCount: pending.length,
    conditionBreakdown,
    patientCategoryBreakdown,
    recentEvents,
  };
}
