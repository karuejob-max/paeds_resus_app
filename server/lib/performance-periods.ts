export type PerformancePeriod = "week" | "month" | "quarter" | "year";

export type PerformancePeriodWindow = {
  period: PerformancePeriod;
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
  currentToDateEnd: Date;
  previousToDateEnd: Date;
  isPartial: boolean;
  currentLabel: string;
  previousLabel: string;
};

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function eatParts(date: Date): {
  year: number;
  month: number;
  day: number;
  dayOfWeek: number;
} {
  const shifted = new Date(date.getTime() + EAT_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    dayOfWeek: shifted.getUTCDay(),
  };
}

function fromEatUtc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day) - EAT_OFFSET_MS);
}

function addCalendarDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function nextBoundary(period: PerformancePeriod, start: Date): Date {
  const shifted = new Date(start.getTime() + EAT_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();

  if (period === "week") return addCalendarDays(start, 7);
  if (period === "month") return fromEatUtc(year, month + 1, 1);
  if (period === "quarter") return fromEatUtc(year, month + 3, 1);
  return fromEatUtc(year + 1, 0, 1);
}

function previousBoundary(period: PerformancePeriod, start: Date): Date {
  const shifted = new Date(start.getTime() + EAT_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();

  if (period === "week") return addCalendarDays(start, -7);
  if (period === "month") return fromEatUtc(year, month - 1, 1);
  if (period === "quarter") return fromEatUtc(year, month - 3, 1);
  return fromEatUtc(year - 1, 0, 1);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatRange(start: Date, end: Date): string {
  const inclusiveEnd = new Date(end.getTime() - 1);
  return `${formatDate(start)} – ${formatDate(inclusiveEnd)}`;
}

export function getPerformancePeriodWindow(
  period: PerformancePeriod,
  now = new Date()
): PerformancePeriodWindow {
  const parts = eatParts(now);
  const mondayOffset = parts.dayOfWeek === 0 ? 6 : parts.dayOfWeek - 1;
  const currentStart =
    period === "week"
      ? fromEatUtc(parts.year, parts.month, parts.day - mondayOffset)
      : period === "month"
        ? fromEatUtc(parts.year, parts.month, 1)
        : period === "quarter"
          ? fromEatUtc(parts.year, Math.floor(parts.month / 3) * 3, 1)
          : fromEatUtc(parts.year, 0, 1);
  const currentEnd = nextBoundary(period, currentStart);
  const previousStart = previousBoundary(period, currentStart);
  const previousEnd = currentStart;
  const currentToDateEnd = new Date(
    Math.min(now.getTime(), currentEnd.getTime())
  );
  const elapsedMs = Math.max(
    0,
    currentToDateEnd.getTime() - currentStart.getTime()
  );
  const previousToDateEnd = new Date(
    Math.min(previousStart.getTime() + elapsedMs, previousEnd.getTime())
  );

  return {
    period,
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
    currentToDateEnd,
    previousToDateEnd,
    isPartial: currentToDateEnd.getTime() < currentEnd.getTime(),
    currentLabel: formatRange(currentStart, currentToDateEnd),
    previousLabel: formatRange(previousStart, previousToDateEnd),
  };
}

export function isWithin(date: Date, start: Date, end: Date): boolean {
  const time = date.getTime();
  return time >= start.getTime() && time < end.getTime();
}

export function calculateChange(
  current: number,
  previous: number
): {
  delta: number;
  percentage: number | null;
  direction: "up" | "down" | "stable";
} {
  const delta = current - previous;
  return {
    delta,
    percentage: previous === 0 ? null : (delta / Math.abs(previous)) * 100,
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "stable",
  };
}
