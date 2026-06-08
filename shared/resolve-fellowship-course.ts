/** Fellowship `courses` row shape for in-memory resolution (player, tests). */
export type FellowshipCourseCandidate = {
  id: number;
  title: string;
  order?: number | null;
};

export type MicroCourseCatalogRef = {
  title: string;
  order?: number | null;
};

export function fellowshipTitlePrefix(title: string): string | null {
  const prefix = title.split(":")[0]?.trim();
  return prefix || null;
}

/**
 * Resolve fellowship `courses` row from candidates + catalog micro-course ref.
 * Priority: exact catalog title → shared order → title prefix contains.
 * Aligns with server `resolveFellowshipCourseId` (microcourse-exam-gate.ts).
 */
export function resolveFellowshipCourseFromCandidates<T extends FellowshipCourseCandidate>(
  candidates: T[],
  microCourse: MicroCourseCatalogRef
): T | undefined {
  const exact = candidates.find((c) => c.title === microCourse.title);
  if (exact) return exact;

  if (microCourse.order != null) {
    const byOrder = candidates.find((c) => c.order === microCourse.order);
    if (byOrder) return byOrder;
  }

  const prefix = fellowshipTitlePrefix(microCourse.title);
  if (prefix) {
    const byPrefix = candidates.find((c) => c.title.includes(prefix));
    if (byPrefix) return byPrefix;
  }

  return undefined;
}
