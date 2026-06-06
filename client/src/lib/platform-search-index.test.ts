import { describe, expect, it } from "vitest";
import {
  buildPlatformSearchIndex,
  filterPlatformSearchItems,
  itemMatchesQuery,
  isSearchItemVisible,
  scoreSearchMatch,
} from "./platform-search-index";

describe("platform-search-index", () => {
  const index = buildPlatformSearchIndex();

  it("includes published micro-courses and AHA courses", () => {
    expect(index.some((i) => i.id === "micro-dka-i")).toBe(true);
    expect(index.some((i) => i.id === "aha-pals")).toBe(true);
    expect(index.some((i) => i.href === "/resus")).toBe(true);
  });

  it("hides provider-only routes from guests", () => {
    const guest = { isAuthenticated: false, isAdmin: false, role: null as const };
    const results = filterPlatformSearchItems(index, "PALS", guest);
    expect(results.some((r) => r.id === "aha-pals")).toBe(false);
    expect(results.some((r) => r.id === "training-hub")).toBe(true);
  });

  it("shows provider routes to authenticated providers", () => {
    const provider = { isAuthenticated: true, isAdmin: false, role: "provider" as const };
    const results = filterPlatformSearchItems(index, "PALS", provider);
    expect(results.some((r) => r.id === "aha-pals")).toBe(true);
  });

  it("shows DKA micro-course when searching DKA", () => {
    const provider = { isAuthenticated: true, isAdmin: false, role: "provider" as const };
    const results = filterPlatformSearchItems(index, "DKA", provider);
    expect(results.some((r) => r.id === "micro-dka-i")).toBe(true);
  });

  it("shows ResusGPS for provider search", () => {
    const provider = { isAuthenticated: true, isAdmin: false, role: "provider" as const };
    const results = filterPlatformSearchItems(index, "ResusGPS", provider);
    expect(results.some((r) => r.id === "resusgps")).toBe(true);
  });

  it("hides admin routes from non-admins", () => {
    const provider = { isAuthenticated: true, isAdmin: false, role: "provider" as const };
    const adminItem = index.find((i) => i.id === "admin-reports")!;
    expect(isSearchItemVisible(adminItem, provider)).toBe(false);
    const admin = { isAuthenticated: true, isAdmin: true, role: "provider" as const };
    expect(isSearchItemVisible(adminItem, admin)).toBe(true);
  });

  it("scores label prefix matches higher than body matches", () => {
    const pals = index.find((i) => i.id === "aha-pals")!;
    const training = index.find((i) => i.id === "training-hub")!;
    expect(scoreSearchMatch(pals, "pals")).toBeGreaterThan(scoreSearchMatch(training, "pals"));
  });

  it("itemMatchesQuery is case-insensitive includes", () => {
    const resus = index.find((i) => i.id === "resusgps")!;
    expect(itemMatchesQuery(resus, "resusgps")).toBe(true);
    expect(itemMatchesQuery(resus, "GPS")).toBe(true);
  });
});
