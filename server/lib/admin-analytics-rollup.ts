/**
 * Aggregates raw analytics rows the same way as adminStats.getReport (rolling window).
 * Keeps CLI verify script and Admin Reports numerically aligned.
 */

export type AnalyticsRow = {
  eventType: string | null;
  eventName: string | null;
};

function bucketKey(e: AnalyticsRow): string {
  return e.eventType || e.eventName || "other";
}

/** Mirrors adminStats.getReport — all event types, top 15 by count */
export function rollupAnalyticsLastDays(analyticsInPeriod: AnalyticsRow[]) {
  const eventCounts: Record<string, number> = {};
  analyticsInPeriod.forEach((e) => {
    const key = bucketKey(e);
    eventCounts[key] = (eventCounts[key] || 0) + 1;
  });
  const eventTypes = Object.entries(eventCounts)
    .map(([eventType, count]) => ({ eventType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
  return {
    count: analyticsInPeriod.length,
    eventTypes,
  };
}

/** Mirrors adminStats.getReport — only resus_* prefixes */
export function rollupResusGpsLastDays(analyticsInPeriod: AnalyticsRow[]) {
  const resusCounts: Record<string, number> = {};
  analyticsInPeriod.forEach((e) => {
    const key = (e.eventType || e.eventName || "").toString();
    if (!key.startsWith("resus_")) return;
    const bucket = e.eventType || e.eventName || "resus_other";
    resusCounts[bucket] = (resusCounts[bucket] || 0) + 1;
  });
  const totalEvents = Object.values(resusCounts).reduce((a, b) => a + b, 0);
  const eventTypes = Object.entries(resusCounts)
    .map(([eventType, count]) => ({ eventType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
  return { totalEvents, eventTypes };
}
