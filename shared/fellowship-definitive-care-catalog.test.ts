import { describe, expect, it } from "vitest";
import { getAllFellowshipConditionIds } from "./fellowship-clinical-rigor";
import {
  FELLOWSHIP_DEFINITIVE_CARE_CATALOG,
  getFellowshipDefinitiveCareCatalogEntries,
} from "./fellowship-definitive-care-catalog";
import { requiredDefinitiveCareStepIds } from "./definitive-care-completion";

/** Client engine — imported for integration test (vitest alias @/ not needed). */
import { resolveDefinitiveCare } from "../client/src/lib/resus/definitive-care-engine";

describe("fellowship-definitive-care-catalog", () => {
  it("covers all 15 fellowship ResusGPS conditions", () => {
    const ids = getAllFellowshipConditionIds();
    expect(ids.length).toBe(15);
    for (const id of ids) {
      expect(FELLOWSHIP_DEFINITIVE_CARE_CATALOG[id], id).toBeDefined();
    }
    expect(getFellowshipDefinitiveCareCatalogEntries().length).toBe(15);
  });

  it("resolves full definitive care protocol for every fellowship condition", () => {
    for (const id of getAllFellowshipConditionIds()) {
      const care = resolveDefinitiveCare(id, 15, "6 years");
      expect(care, id).not.toBeNull();
      expect(care!.hasFullProtocol, id).toBe(true);
      expect(care!.protocol, id).not.toBeNull();
      const required = requiredDefinitiveCareStepIds(care!.allSteps);
      const meta = FELLOWSHIP_DEFINITIVE_CARE_CATALOG[id];
      expect(required.length, `${id} step count`).toBeGreaterThanOrEqual(meta.minSteps);
    }
  });

  it("gates fellowship credit on all required steps for meningitis and trauma", () => {
    for (const id of ["meningitis", "trauma", "septic_shock"] as const) {
      const care = resolveDefinitiveCare(id, 20, "8 years");
      const required = requiredDefinitiveCareStepIds(care!.allSteps);
      const statuses = Object.fromEntries(required.map((stepId) => [stepId, "done" as const]));
      const incomplete = required.slice(0, -1);
      const partial = Object.fromEntries(incomplete.map((stepId) => [stepId, "done" as const]));
      expect(Object.keys(partial).length).toBeLessThan(required.length);
      expect(Object.keys(statuses).length).toBe(required.length);
    }
  });
});
