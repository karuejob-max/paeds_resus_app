/**
 * BLS course versioning (pure helpers — no database access).
 *
 * v1 = the original curriculum (`bls-modules-data.ts`), now frozen. Learners
 * already enrolled keep reading the course row their enrollment points at.
 * v2 = the updated curriculum (`bls-modules-v2-data.ts`), identified by its
 * exact course title, so no schema migration is required.
 */
import { BLS_MODULES, type BLSModule } from "./bls-modules-data";
import { BLS_MODULES_V2, BLS_V2_COURSE_TITLE } from "./bls-modules-v2-data";

export { BLS_V2_COURSE_TITLE };

export function isBlsV2CourseTitle(title: string | null | undefined): boolean {
  return title === BLS_V2_COURSE_TITLE;
}

export function isBlsV2Course(course: { title?: string | null } | null | undefined): boolean {
  return isBlsV2CourseTitle(course?.title);
}

/** Module definitions for a course row: v2 rows use v2, every other BLS row is v1. */
export function getBlsModulesForCourse(course: { title?: string | null } | null | undefined): BLSModule[] {
  return isBlsV2Course(course) ? BLS_MODULES_V2 : BLS_MODULES;
}

export function getBlsModuleDefinitionForCourse(
  course: { title?: string | null } | null | undefined,
  order: number | null | undefined
): BLSModule | undefined {
  return getBlsModulesForCourse(course).find((m) => m.order === order);
}

/**
 * True when a v2 course row's modules do not match the v2 definition (needs
 * repair). v1 and legacy rows are frozen and are never reported stale, so they
 * are never rewritten.
 */
export function isBlsCourseShapeStale(
  course: { title?: string | null } | null | undefined,
  moduleRows: Array<{ order?: number | null; title?: string | null }>
): boolean {
  if (!isBlsV2Course(course)) return false;
  if (moduleRows.length !== BLS_MODULES_V2.length) return true;
  return BLS_MODULES_V2.some((expected) => {
    const actual = moduleRows.find((row) => row.order === expected.order);
    return actual?.title !== expected.title;
  });
}
