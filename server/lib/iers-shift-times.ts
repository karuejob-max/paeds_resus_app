export type ShiftTimeInput = {
  startTime: string;
  endTime: string;
  endDayOffset: number;
};

export type ShiftTemplatePreset = ShiftTimeInput & {
  name: string;
  shiftType: "morning" | "evening" | "night";
};

export const DEFAULT_SHIFT_TEMPLATES: readonly ShiftTemplatePreset[] = [
  { name: "Day", shiftType: "morning", startTime: "07:30", endTime: "17:30", endDayOffset: 0 },
  { name: "Evening", shiftType: "evening", startTime: "17:30", endTime: "21:30", endDayOffset: 0 },
  { name: "Night", shiftType: "night", startTime: "21:30", endTime: "05:30", endDayOffset: 1 },
];

const CLOCK_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export function normalizeClockTime(value: string): string {
  const trimmed = value.trim();
  if (!CLOCK_TIME_PATTERN.test(trimmed)) {
    throw new Error("Shift times must use 24-hour HH:MM format.");
  }
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

function minutesSinceMidnight(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function validateShiftInterval(input: ShiftTimeInput): { startTime: string; endTime: string; endDayOffset: 0 | 1; durationMinutes: number } {
  const startTime = normalizeClockTime(input.startTime);
  const endTime = normalizeClockTime(input.endTime);
  if (input.endDayOffset !== 0 && input.endDayOffset !== 1) {
    throw new Error("A shift may end on its start date or the following date only.");
  }
  const durationMinutes = minutesSinceMidnight(endTime) + input.endDayOffset * 24 * 60 - minutesSinceMidnight(startTime);
  if (durationMinutes <= 0 || durationMinutes > 24 * 60) {
    throw new Error("Shift end must be after shift start and no longer than 24 hours.");
  }
  return { startTime, endTime, endDayOffset: input.endDayOffset, durationMinutes };
}

export function formatShiftInterval(input: ShiftTimeInput): string {
  const startTime = normalizeClockTime(input.startTime).slice(0, 5);
  const endTime = normalizeClockTime(input.endTime).slice(0, 5);
  return `${startTime}–${endTime}${input.endDayOffset === 1 ? " (+1 day)" : ""}`;
}

export function shiftTemplateForType(shiftType: ShiftTemplatePreset["shiftType"]): ShiftTemplatePreset {
  return DEFAULT_SHIFT_TEMPLATES.find((template) => template.shiftType === shiftType) ?? DEFAULT_SHIFT_TEMPLATES[0];
}
