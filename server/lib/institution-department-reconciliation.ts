import {
  DEPARTMENT_ALIASES,
  findMatchingCanonicalDepartments,
  formatDepartmentString,
  getPresetDepartmentLabels,
  resolvePresetDepartment,
} from "../../shared/clinical-departments";

export type DepartmentSuggestionConfidence = "none" | "exact" | "alias" | "ambiguous";

export type DepartmentSuggestion = {
  confidence: DepartmentSuggestionConfidence;
  suggestedLabel: string | null;
  candidateLabels: string[];
};

export function normalizeDepartmentKey(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Suggests a shared catalog label without writing anything. Exact and
 * unambiguous alias matches are safe suggestions; token-overlap ambiguity is
 * deliberately returned as manual options rather than an automatic decision.
 */
export function suggestCatalogDepartment(value: string): DepartmentSuggestion {
  const raw = value.trim();
  if (!raw) return { confidence: "none", suggestedLabel: null, candidateLabels: [] };

  const exact = resolvePresetDepartment(raw);
  if (exact) {
    return { confidence: "exact", suggestedLabel: exact.label, candidateLabels: [exact.label] };
  }

  const aliasTargets = Array.from(new Set(
    Object.entries(DEPARTMENT_ALIASES)
      .filter(([, aliases]) => aliases.some((alias) => normalizeDepartmentKey(alias) === normalizeDepartmentKey(raw)))
      .map(([label]) => resolvePresetDepartment(label)?.label)
      .filter((label): label is string => Boolean(label)),
  ));
  if (aliasTargets.length === 1) {
    return { confidence: "alias", suggestedLabel: aliasTargets[0], candidateLabels: aliasTargets };
  }

  const candidates = Array.from(new Set(
    findMatchingCanonicalDepartments(raw).map((match) => formatDepartmentString(match.parent, match.sub)),
  ));
  if (aliasTargets.length > 1 || candidates.length > 1) {
    return { confidence: "ambiguous", suggestedLabel: null, candidateLabels: Array.from(new Set([...aliasTargets, ...candidates])) };
  }
  return { confidence: "none", suggestedLabel: null, candidateLabels: [] };
}

export function isPresetCatalogLabel(value: string): boolean {
  const normalized = normalizeDepartmentKey(value);
  return getPresetDepartmentLabels().some((label) => normalizeDepartmentKey(label) === normalized);
}

export function normalizeOptionalReason(value: string | undefined): string {
  return value?.trim() ?? "";
}
