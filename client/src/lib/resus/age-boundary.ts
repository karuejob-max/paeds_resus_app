export function parseAgeTextToMonths(ageText: string | null | undefined): number | undefined {
  if (!ageText) return undefined;
  const lower = ageText.toLowerCase();
  const numeric = lower.match(/\d+(\.\d+)?/);
  if (!numeric) return undefined;

  const value = parseFloat(numeric[0]);
  if (!Number.isFinite(value)) return undefined;

  if (lower.includes('year') || lower.includes('yr') || /\by\b/.test(lower)) {
    return Math.round(value * 12);
  }
  if (lower.includes('month') || lower.includes('mo') || /\bm\b/.test(lower)) {
    return Math.round(value);
  }
  if (lower.includes('week') || lower.includes('wk') || /\bw\b/.test(lower)) {
    return Math.max(0, Math.round(value / 4.345));
  }
  if (lower.includes('day') || /\bd\b/.test(lower)) {
    return 0;
  }

  // Fallback when unit is omitted in legacy strings.
  return Math.round(value * 12);
}

export function formatAgeLabelFromMonths(months: number): string {
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} year${years === 1 ? '' : 's'}`;
  return `${years} year${years === 1 ? '' : 's'} ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`;
}
