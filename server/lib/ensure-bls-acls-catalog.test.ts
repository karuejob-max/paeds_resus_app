import { describe, expect, it } from "vitest";
import { BLS_MODULES } from "./bls-modules-data";
import { isBlsCatalogShapeStale } from "./ensure-bls-acls-catalog";

describe("BLS catalog shape repair", () => {
  it("accepts the current module definition shape", () => {
    expect(
      isBlsCatalogShapeStale(
        BLS_MODULES.map(({ order, title }) => ({ order, title })),
      ),
    ).toBe(false);
  });

  it("detects the legacy nine-module production shape", () => {
    const legacyRows = [
      ...BLS_MODULES.map(({ order, title }) => ({ order, title })),
      { order: 7, title: "Module 7: Bleeding Control & Wounds (HCP Depth)" },
      { order: 8, title: "Module 8: Team Dynamics & Multi-Rescuer CPR" },
      { order: 9, title: "Module 9: Airway Management & Special Situations" },
    ];

    expect(isBlsCatalogShapeStale(legacyRows)).toBe(true);
  });

  it("detects a missing or renamed current module", () => {
    const rows = BLS_MODULES.map(({ order, title }) => ({ order, title }));
    rows[0] = { order: 1, title: "Legacy BLS module" };

    expect(isBlsCatalogShapeStale(rows)).toBe(true);
  });
});
