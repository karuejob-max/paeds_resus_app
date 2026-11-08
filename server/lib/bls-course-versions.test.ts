import { describe, expect, it } from "vitest";
import { BLS_MODULES } from "./bls-modules-data";
import { BLS_MODULES_V2, BLS_V2_COURSE_TITLE } from "./bls-modules-v2-data";
import {
  getBlsModuleDefinitionForCourse,
  getBlsModulesForCourse,
  isBlsCourseShapeStale,
  isBlsV2Course,
} from "./bls-course-versions";

const v1Row = { title: "BLS Provider Course — AHA 2025 Guidelines" };
const v2Row = { title: BLS_V2_COURSE_TITLE };
const rowsOf = (defs: { order: number; title: string }[]) => defs.map(({ order, title }) => ({ order, title }));

describe("BLS course versions", () => {
  it("identifies v2 only by its exact title", () => {
    expect(isBlsV2Course(v2Row)).toBe(true);
    expect(isBlsV2Course(v1Row)).toBe(false);
    expect(isBlsV2Course({ title: "Basic Life Support (BLS)" })).toBe(false);
    expect(isBlsV2Course(null)).toBe(false);
  });

  it("uses v2 definitions for v2 rows and the original definitions for every other row", () => {
    expect(getBlsModulesForCourse(v2Row)).toBe(BLS_MODULES_V2);
    expect(getBlsModulesForCourse(v1Row)).toBe(BLS_MODULES);
    expect(getBlsModuleDefinitionForCourse(v1Row, 4)?.title).toBe(BLS_MODULES[3]!.title);
    expect(getBlsModuleDefinitionForCourse(v2Row, 4)?.title).toBe(BLS_MODULES_V2[3]!.title);
  });

  it("never reports a frozen (non-v2) row as stale, so it is never rewritten", () => {
    expect(isBlsCourseShapeStale(v1Row, [])).toBe(false);
    expect(isBlsCourseShapeStale(v1Row, rowsOf(BLS_MODULES))).toBe(false);
    expect(isBlsCourseShapeStale({ title: "Basic Life Support (BLS)" }, [{ order: 1, title: "x" }])).toBe(false);
  });

  it("reports a v2 row as stale only when its shape differs from the v2 definition", () => {
    expect(isBlsCourseShapeStale(v2Row, rowsOf(BLS_MODULES_V2))).toBe(false);
    expect(isBlsCourseShapeStale(v2Row, rowsOf(BLS_MODULES_V2).slice(0, 3))).toBe(true);
    const renamed = rowsOf(BLS_MODULES_V2);
    renamed[0] = { order: 1, title: "old" };
    expect(isBlsCourseShapeStale(v2Row, renamed)).toBe(true);
  });

  it("keeps the original (v1) curriculum frozen", () => {
    // If this fails, someone edited v1 content in place. Learners already enrolled
    // read v1 modules and progress by module id; deliver changes as v2 instead.
    expect(BLS_MODULES).toHaveLength(6);
    expect(BLS_MODULES.map((m) => m.title)).toEqual([
      "Module 1: Foundations & The Unified Chain of Survival",
      "Module 2: Adult CPR, AED & Healthcare Provider Depth",
      "Module 3: Infant & Child CPR (HCP Standards)",
      "Module 4: Choking Relief (Unified 5 & 5)",
      "Module 5: Team Dynamics & Multi-Rescuer CPR",
      "Module 6: Airway Management & Special Situations",
    ]);
  });
});
