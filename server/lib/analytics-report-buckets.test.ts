import { describe, expect, it } from "vitest";
import {
  buildAnalyticsEventSummary,
  buildResusGpsAnalyticsSummary,
  resolveAnalyticsEventBucket,
} from "./analytics-report-buckets";

describe("analytics-report-buckets", () => {
  it("resolves bucket using eventType then eventName fallback", () => {
    expect(resolveAnalyticsEventBucket({ eventType: "course_enrollment", eventName: "Enroll PALS" })).toBe(
      "course_enrollment"
    );
    expect(resolveAnalyticsEventBucket({ eventType: "  ", eventName: "View /home" })).toBe("View /home");
    expect(resolveAnalyticsEventBucket({ eventType: null, eventName: "   " })).toBe("other");
  });

  it("builds analytics summary with admin-compatible fallback grouping", () => {
    const summary = buildAnalyticsEventSummary([
      { eventType: "course_enrollment", eventName: "Enroll PALS" },
      { eventType: "course_enrollment", eventName: "Enroll PALS" },
      { eventType: "", eventName: "View /home" },
      { eventType: null, eventName: "View /home" },
    ]);
    expect(summary.count).toBe(4);
    expect(summary.eventTypes).toEqual([
      { eventType: "course_enrollment", count: 2 },
      { eventType: "View /home", count: 2 },
    ]);
  });

  it("filters ResusGPS summary by bucket prefix", () => {
    const summary = buildResusGpsAnalyticsSummary([
      { eventType: "resus_assessment_started", eventName: "Resus assessment" },
      { eventType: "resus_assessment_started", eventName: "Resus assessment" },
      { eventType: null, eventName: "resus_fallback_name" },
      { eventType: "course_enrollment", eventName: "Enroll PALS" },
    ]);
    expect(summary.totalEvents).toBe(3);
    expect(summary.eventTypes).toEqual([
      { eventType: "resus_assessment_started", count: 2 },
      { eventType: "resus_fallback_name", count: 1 },
    ]);
  });
});
