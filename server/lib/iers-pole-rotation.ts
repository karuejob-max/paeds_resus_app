export type PoleRotationDepartment = {
  id: number;
  createdAt: Date;
  poleSequence: number | null;
};

export function asDateOnly(value: Date | string): string {
  return (value instanceof Date ? value.toISOString() : String(value)).slice(0, 10);
}

export function mondayForDate(value: Date | string): Date {
  const date = new Date(`${asDateOnly(value)}T00:00:00Z`);
  const day = date.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date;
}

export function weeksBetween(mondayA: Date, mondayB: Date): number {
  return Math.floor((mondayB.getTime() - mondayA.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

export function derivePoleRotationDepartmentId(
  departments: PoleRotationDepartment[],
  anchorValue: Date | string | null | undefined,
  weekStart: Date | string,
): number | null {
  if (departments.length === 0) return null;
  const anchor = mondayForDate(anchorValue ?? departments[0].createdAt);
  const target = mondayForDate(weekStart);
  const index = ((weeksBetween(anchor, target) % departments.length) + departments.length) % departments.length;
  return departments[index]?.id ?? null;
}

export function isoWeekMonday(year: number, weekNumber: number): Date {
  const januaryFourth = new Date(Date.UTC(year, 0, 4));
  const day = januaryFourth.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  januaryFourth.setUTCDate(januaryFourth.getUTCDate() - daysSinceMonday + ((weekNumber - 1) * 7));
  return januaryFourth;
}
