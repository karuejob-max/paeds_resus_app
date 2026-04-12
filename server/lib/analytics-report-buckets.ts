export type AnalyticsEventBucketSource = {
  eventType: string | null;
  eventName: string | null;
};

export type AnalyticsEventTypeCount = {
  eventType: string;
  count: number;
};

function normalizeBucketValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Canonical grouping rule for admin analytics:
 * bucket by eventType, fallback to eventName, fallback to "other".
 */
export function resolveAnalyticsEventBucket(event: AnalyticsEventBucketSource): string {
  return normalizeBucketValue(event.eventType) ?? normalizeBucketValue(event.eventName) ?? "other";
}

function toSortedCounts(counts: Record<string, number>, limit: number): AnalyticsEventTypeCount[] {
  return Object.entries(counts)
    .map(([eventType, count]) => ({ eventType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function buildAnalyticsEventSummary(
  events: AnalyticsEventBucketSource[],
  options?: { topLimit?: number }
): { count: number; eventTypes: AnalyticsEventTypeCount[] } {
  const topLimit = options?.topLimit ?? 15;
  const counts: Record<string, number> = {};

  for (const event of events) {
    const bucket = resolveAnalyticsEventBucket(event);
    counts[bucket] = (counts[bucket] ?? 0) + 1;
  }

  return {
    count: events.length,
    eventTypes: toSortedCounts(counts, topLimit),
  };
}

export function buildResusGpsAnalyticsSummary(
  events: AnalyticsEventBucketSource[],
  options?: { topLimit?: number }
): { totalEvents: number; eventTypes: AnalyticsEventTypeCount[] } {
  const topLimit = options?.topLimit ?? 15;
  const counts: Record<string, number> = {};
  let totalEvents = 0;

  for (const event of events) {
    const bucket = resolveAnalyticsEventBucket(event);
    if (!bucket.startsWith("resus_")) continue;
    counts[bucket] = (counts[bucket] ?? 0) + 1;
    totalEvents += 1;
  }

  return {
    totalEvents,
    eventTypes: toSortedCounts(counts, topLimit),
  };
}
