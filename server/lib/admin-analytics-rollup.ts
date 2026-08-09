/**
 * Aggregates raw analytics rows the same way as adminStats.getReport (rolling window).
 * Keeps CLI verify script and Admin Reports numerically aligned.
 */

export type AnalyticsRow = {
  eventType: string | null;
  eventName: string | null;
  count?: number;
};

function bucketKey(e: AnalyticsRow): string {
  return e.eventType || e.eventName || "other";
}

/** Mirrors adminStats.getReport — all event types, top 15 by count */
export function rollupAnalyticsLastDays(analyticsInPeriod: AnalyticsRow[]) {
  const eventCounts: Record<string, number> = {};
  analyticsInPeriod.forEach((e) => {
    const key = bucketKey(e);
    const weight = e.count ?? 1;
    eventCounts[key] = (eventCounts[key] || 0) + weight;
  });
  const eventTypes = Object.entries(eventCounts)
    .map(([eventType, count]) => ({ eventType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
  return {
    count: analyticsInPeriod.reduce((acc, e) => acc + (e.count ?? 1), 0),
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
    const weight = e.count ?? 1;
    resusCounts[bucket] = (resusCounts[bucket] || 0) + weight;
  });
  const totalEvents = Object.values(resusCounts).reduce((a, b) => a + b, 0);
  const eventTypes = Object.entries(resusCounts)
    .map(([eventType, count]) => ({ eventType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
  return { totalEvents, eventTypes };
}
