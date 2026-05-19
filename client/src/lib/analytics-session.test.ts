import { describe, expect, it, beforeEach } from "vitest";
import { getAnalyticsSessionId } from "./analytics-session";

describe("getAnalyticsSessionId", () => {
  beforeEach(() => {
    if (typeof sessionStorage !== "undefined") sessionStorage.clear();
  });

  it("returns the same id on repeat calls in one browser session", () => {
    const a = getAnalyticsSessionId();
    const b = getAnalyticsSessionId();
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(3);
  });
});
