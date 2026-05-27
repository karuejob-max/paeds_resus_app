/**
 * Parse PILOT_FACILITY_IDS (institutional account IDs) for clinical outcomes pilot.
 */
export function parsePilotFacilityIds(raw: string | undefined): number[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number.parseInt(s, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export function isInstitutionInPilotProgram(
  institutionId: number | null | undefined,
  pilotFacilityIds: number[]
): boolean {
  if (institutionId == null || pilotFacilityIds.length === 0) return false;
  return pilotFacilityIds.includes(institutionId);
}
