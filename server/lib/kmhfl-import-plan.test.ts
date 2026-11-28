import { describe, expect, it } from "vitest";
// @ts-ignore plain .mjs script helper
import { planImport } from "../../scripts/kmhfl-import-plan.mjs";

const row = (over: Record<string, unknown> = {}) => ({ name: "Itete Dispensary", code: "25720", county: "Kakamega", facilityType: "Dispensary", operationalStatus: "operational", ...over });

describe("planImport", () => {
  it("inserts new facilities and skips rows without an official code", () => {
    const plan = planImport([row(), row({ name: "Mukavakava", code: "None" }), row({ name: "", code: "30000" })], []);
    expect(plan.inserts).toHaveLength(1);
    expect(plan.skipped).toBe(2);
  });

  it("ignores a code that appears twice in the file", () => {
    const plan = planImport([row(), row({ name: "Itete Dispensary (copy)" })], []);
    expect(plan.inserts).toHaveLength(1);
    expect(plan.duplicates).toBe(1);
  });

  it("updates an existing facility only when something changed", () => {
    const same = { id: 1, name: "Itete Dispensary", code: "25720", county: "Kakamega", facilityType: "Dispensary", operationalStatus: "operational" };
    expect(planImport([row()], [same]).updates).toHaveLength(0);
    expect(planImport([row({ county: "Vihiga" })], [same]).updates).toEqual([expect.objectContaining({ id: 1, county: "Vihiga" })]);
  });

  it("converts a sample row with the same name instead of duplicating it, once", () => {
    const sample = { id: 7, name: "Consolata Hospital Mathari", code: "CHM-001", county: "Nyeri", facilityType: "hospital", operationalStatus: "operational" };
    const plan = planImport([row({ name: "Consolata Hospital Mathari", code: "10100", county: "Nyeri" }), row({ name: "Consolata Hospital Mathari", code: "10101", county: "Nyeri" })], [sample]);
    expect(plan.converted).toEqual([expect.objectContaining({ id: 7, code: "10100" })]);
    expect(plan.inserts).toHaveLength(1);
  });

  it("does not convert a sample row in a different county", () => {
    const sample = { id: 7, name: "Coast General", code: "CG-001", county: "Mombasa", facilityType: "hospital", operationalStatus: "operational" };
    const plan = planImport([row({ name: "Coast General", code: "22222", county: "Nyeri" })], [sample]);
    expect(plan.converted).toHaveLength(0);
    expect(plan.inserts).toHaveLength(1);
  });
});
