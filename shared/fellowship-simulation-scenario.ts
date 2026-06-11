/**
 * Fellowship simulation scenario JSON — seed stores pages at root; UI expects `.pages`.
 */

export type FellowshipSimulationPages = Record<string, unknown>;

export type FellowshipSimulationScenarioPayload = {
  pages: FellowshipSimulationPages;
};

/** Map catalog / microCourses level to fellowshipSimulations enum. */
export function resolveFellowshipSimulationLevel(
  level: string | null | undefined
): "foundational" | "advanced" {
  if (level === "advanced" || level === "intermediate") return "advanced";
  return "foundational";
}

/** Parse DB/json scenario blob into `{ pages }` regardless of legacy shape. */
export function parseFellowshipScenarioData(
  raw: unknown
): FellowshipSimulationScenarioPayload {
  let data: unknown = raw;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return { pages: {} };
    }
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { pages: {} };
  }
  const obj = data as Record<string, unknown>;
  if (obj.pages && typeof obj.pages === "object" && !Array.isArray(obj.pages)) {
    return { pages: obj.pages as FellowshipSimulationPages };
  }
  return { pages: obj as FellowshipSimulationPages };
}

export function fellowshipSimulationHasSteps(raw: unknown): boolean {
  return Object.keys(parseFellowshipScenarioData(raw).pages).length > 0;
}

export function fellowshipSimulationSteps(raw: unknown): unknown[] {
  return Object.values(parseFellowshipScenarioData(raw).pages);
}
