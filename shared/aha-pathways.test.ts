import { describe, expect, it } from "vitest";
import {
  AHA_PROGRAM_LABELS,
  AHA_PROGRAM_TYPES,
  INDEPENDENT_AHA_PATHWAY_LABEL,
  INDEPENDENT_AHA_PRICES_KES,
  getIndependentAhaPriceKes,
  isAhaProgramType,
} from "./aha-pathways";

describe("Independent AHA Pathway", () => {
  it("includes every independently priced AHA course", () => {
    expect(AHA_PROGRAM_TYPES).toEqual(["bls", "acls", "pals", "heartsaver", "nrp", "instructor"]);
  });

  it("uses the published individual prices", () => {
    expect(INDEPENDENT_AHA_PRICES_KES).toEqual({
      bls: 10_000,
      acls: 20_000,
      pals: 20_000,
      heartsaver: 5_000,
      nrp: 10_000,
      instructor: 25_000,
    });
  });

  it("resolves labels and prices only for supported AHA programmes", () => {
    expect(AHA_PROGRAM_LABELS.pals).toBe("PALS");
    expect(AHA_PROGRAM_LABELS.nrp).toBe("NRP");
    expect(getIndependentAhaPriceKes("acls")).toBe(20_000);
    expect(getIndependentAhaPriceKes("fellowship")).toBeNull();
    expect(isAhaProgramType("instructor")).toBe(true);
    expect(isAhaProgramType("fellowship")).toBe(false);
  });

  it("uses an explicit non-cohort label", () => {
    expect(INDEPENDENT_AHA_PATHWAY_LABEL).toBe("Independent AHA Pathway");
  });
});
