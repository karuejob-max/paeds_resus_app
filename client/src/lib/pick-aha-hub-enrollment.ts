import type { AhaProgramType } from "@/lib/providerCourseRoutes";
import { PALS_ADF_CATALOG_TITLE_MARKERS } from "@shared/training-product-taxonomy";

export type AhaHubEnrollmentRow = {
  id: number;
  programType: string;
  courseId?: number | null;
  createdAt: Date | string;
  cognitiveModulesComplete?: boolean | null;
  practicalSkillsSignedOff?: boolean | null;
  courseTitle?: string | null;
};

function isPalsAdfCatalogTitle(title: string | null | undefined): boolean {
  const normalized = (title ?? "").toLowerCase();
  return PALS_ADF_CATALOG_TITLE_MARKERS.some((marker) => normalized.includes(marker));
}

/**
 * Pick the enrollment row that drives AHA hub certification UI for a program.
 * PALS: prefer canonical AHA catalog anchor over legacy ADF micro-course rows (same programType).
 */
export function pickAhaHubEnrollmentForProgram(
  enrollments: AhaHubEnrollmentRow[] | undefined,
  programType: AhaProgramType,
  hubAnchorCourseId?: number
): AhaHubEnrollmentRow | undefined {
  const candidates = (enrollments ?? []).filter((row) => row.programType === programType);
  if (!candidates.length) return undefined;

  const byRecency = [...candidates].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (programType === "pals") {
    if (hubAnchorCourseId != null) {
      const anchorMatch = byRecency.find((row) => row.courseId === hubAnchorCourseId);
      if (anchorMatch) return anchorMatch;
    }
    const ahaPals = byRecency.filter((row) => !isPalsAdfCatalogTitle(row.courseTitle));
    if (ahaPals.length) return ahaPals[0];
  }

  return byRecency[0];
}

export function buildAhaHubEnrollmentMap(
  enrollments: AhaHubEnrollmentRow[] | undefined,
  hubCourseIdByProgram: Map<string, number>
): Map<AhaProgramType, AhaHubEnrollmentRow> {
  const programs: AhaProgramType[] = ["bls", "acls", "pals", "heartsaver", "nrp"];
  const map = new Map<AhaProgramType, AhaHubEnrollmentRow>();
  for (const programType of programs) {
    const picked = pickAhaHubEnrollmentForProgram(
      enrollments,
      programType,
      hubCourseIdByProgram.get(programType)
    );
    if (picked) map.set(programType, picked);
  }
  return map;
}
