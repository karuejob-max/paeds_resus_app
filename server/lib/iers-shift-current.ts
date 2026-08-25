export type ShiftState = "current" | "upcoming" | "past";

export type ShiftIntervalLike = {
  shiftDate: Date | string;
  shiftStartTime: string;
  shiftEndTime: string;
  shiftEndDayOffset: number;
};

function dateKey(value: Date | string): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

function localDateTimeKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function boundaryKey(date: string, time: string, dayOffset: number): string {
  return `${addDays(date, dayOffset)}T${time.slice(0, 5)}`;
}

export function classifyShiftInterval(
  interval: ShiftIntervalLike,
  now = new Date(),
  timeZone = "Africa/Nairobi",
): ShiftState {
  const start = boundaryKey(dateKey(interval.shiftDate), interval.shiftStartTime, 0);
  const end = boundaryKey(dateKey(interval.shiftDate), interval.shiftEndTime, interval.shiftEndDayOffset);
  const current = localDateTimeKey(now, timeZone);
  if (current >= start && current < end) return "current";
  return current < start ? "upcoming" : "past";
}

export function currentShiftSortWeight(state: ShiftState): number {
  if (state === "current") return 0;
  if (state === "upcoming") return 1;
  return 2;
}

export function shiftSortKey(interval: ShiftIntervalLike): string {
  return boundaryKey(dateKey(interval.shiftDate), interval.shiftStartTime, 0);
}
