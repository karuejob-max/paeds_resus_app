import { describe, it, expect } from "vitest";
import { rollupAnalyticsLastDays, rollupResusGpsLastDays } from "./admin-analytics-rollup";

describe("admin-analytics-rollup", () => {
  it("matches admin report bucketing (eventType || eventName)", () => {
    const rows = [
      { eventType: "course_enrollment", eventName: "x" },
      { eventType: "course_enrollment", eventName: "y" },
      { eventType: "page_view", eventName: "View /home" },
    ];
    const r = rollupAnalyticsLastDays(rows);
    expect(r.count).toBe(3);
    expect(r.eventTypes.find((e) => e.eventType === "course_enrollment")?.count).toBe(2);
  });

  it("only counts resus_* in ResusGPS rollup", () => {
    const rows = [
      { eventType: "resus_session_start", eventName: "a" },
      { eventType: "course_enrollment", eventName: "b" },
      { eventType: "resus_intervention", eventName: "c" },
    ];
    const r = rollupResusGpsLastDays(rows);
    expect(r.totalEvents).toBe(2);
    expect(r.eventTypes.length).toBe(2);
  });
});
