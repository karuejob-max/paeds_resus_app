export type IersShiftType = "morning" | "evening" | "night";

export type MonthlyRotaShift = {
  shiftDate: string;
  shiftType: IersShiftType;
};

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function normalizeMonthStart(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("monthStart must use YYYY-MM-DD format.");
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.getUTCDate() !== 1) {
    throw new Error("monthStart must be the first day of a calendar month.");
  }
  return formatUtcDate(parsed);
}

export function getMonthStartForDate(date = new Date()): string {
  return formatUtcDate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)));
}

export function getMonthEnd(monthStart: string): string {
  const normalized = normalizeMonthStart(monthStart);
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  return formatUtcDate(new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, 0)));
}

export function getMonthlyShiftRows(monthStart: string): MonthlyRotaShift[] {
  const normalized = normalizeMonthStart(monthStart);
  const start = new Date(`${normalized}T00:00:00.000Z`);
  const end = new Date(`${getMonthEnd(normalized)}T00:00:00.000Z`);
  const shiftTypes: IersShiftType[] = ["morning", "evening", "night"];
  const rows: MonthlyRotaShift[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    for (const shiftType of shiftTypes) rows.push({ shiftDate: formatUtcDate(cursor), shiftType });
  }
  return rows;
}

export function getIsoWeekKey(date: Date): { weekNumber: number; year: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return {
    weekNumber: Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7),
    year: d.getUTCFullYear(),
  };
}

export function getIsoWeekRange(date: Date): { startDate: string; endDate: string } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 1);
  const start = formatUtcDate(d);
  d.setUTCDate(d.getUTCDate() + 6);
  return { startDate: start, endDate: formatUtcDate(d) };
}

export function monthStartFromShiftDate(shiftDate: string): string {
  const parsed = new Date(`${shiftDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) throw new Error("shiftDate must use YYYY-MM-DD format.");
  return getMonthStartForDate(parsed);
}
