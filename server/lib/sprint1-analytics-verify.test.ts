import { describe, expect, it } from "vitest";
import {
  SPRINT1_RESUS_EVENT_PREFIX,
  SPRINT1_SERVER_EVENT_TYPES,
} from "../../shared/sprint1-expected-events";
import {
  rollupAnalyticsLastDays,
  rollupResusGpsLastDays,
} from "./admin-analytics-rollup";

describe("Sprint 1 analytics verification (rollup parity)", () => {
  const fixture = [
    { eventType: "course_enrollment", eventName: "Enrolled" },
    { eventType: "payment_completion", eventName: "Paid" },
    { eventType: "resus_session", eventName: "ResusGPS workspace entered" },
    { eventType: "resus_diagnosis", eventName: "Diagnosis Selected" },
    { eventType: null, eventName: "Legacy name only" },
  ];

  it("rolls up all product activity buckets", () => {
    const all = rollupAnalyticsLastDays(fixture);
    expect(all.count).toBe(5);
    expect(all.eventTypes.find((r) => r.eventType === "course_enrollment")?.count).toBe(1);
    expect(all.eventTypes.find((r) => r.eventType === "Legacy name only")?.count).toBe(1);
  });

  it("isolates resus_* for ResusGPS admin slice", () => {
    const resus = rollupResusGpsLastDays(fixture);
    expect(resus.totalEvents).toBe(2);
    expect(resus.eventTypes.every((r) => r.eventType.startsWith(SPRINT1_RESUS_EVENT_PREFIX))).toBe(
      true
    );
  });

  it("documents frozen Sprint 1 server event types", () => {
    expect(SPRINT1_SERVER_EVENT_TYPES.length).toBeGreaterThanOrEqual(5);
    expect(SPRINT1_SERVER_EVENT_TYPES).toContain("safetruth_submission");
  });
});
