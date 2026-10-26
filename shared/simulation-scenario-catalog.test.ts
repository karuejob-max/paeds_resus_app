import { describe, expect, it } from "vitest";
import { getSimulationScenarioCatalog } from "./simulation-scenario-catalog";

describe("Simulation scenario catalog", () => {
  it("exposes multiple arrest scenarios for BLS without exposing adult ACLS cases", () => {
    const scenarios = getSimulationScenarioCatalog("bls");
    expect(scenarios.filter((item) => item.trackId === "cardiac_arrest").length).toBeGreaterThanOrEqual(6);
    expect(scenarios.some((item) => item.id === "unstable-bradycardia")).toBe(false);
  });

  it("exposes distinct ACLS scenarios across rhythm recognition and adult ACLS", () => {
    const scenarios = getSimulationScenarioCatalog("acls");
    expect(scenarios.filter((item) => item.trackId === "adult_acls_world").length).toBeGreaterThanOrEqual(11);
    expect(scenarios.filter((item) => item.trackId === "rhythm_recognition").length).toBeGreaterThanOrEqual(5);
    expect(scenarios.find((item) => item.id === "high-grade-av-block")).toMatchObject({
      title: "High-grade AV block",
      missionId: "adult-acls-world",
      trackId: "adult_acls_world",
      supportedPrograms: ["acls"],
    });
  });

  it("exposes multiple newborn emergencies for NRP", () => {
    const scenarios = getSimulationScenarioCatalog("nrp");
    expect(scenarios.filter((item) => item.trackId === "nrp_world").map((item) => item.id)).toEqual([
      "newborn-not-breathing",
      "newborn-apnoea-after-meconium",
      "preterm-thermal-risk",
      "newborn-persistent-bradycardia",
    ]);
  });

  it("keeps Heartsaver scoped to community first-response simulations", () => {
    const scenarios = getSimulationScenarioCatalog("heartsaver");
    expect(scenarios.length).toBeGreaterThanOrEqual(7);
    expect(scenarios.every((item) => item.supportedPrograms.includes("heartsaver"))).toBe(true);
    expect(scenarios.some((item) => item.trackId === "adult_acls_world" || item.trackId === "nrp_world")).toBe(false);
  });
});
