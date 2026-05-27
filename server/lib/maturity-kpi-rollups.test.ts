import { describe, expect, it } from "vitest";
import {
  rollupHolisticLoop,
  rollupMissionImpact,
  rollupProviderConversionFunnel,
  type AnalyticsRow,
} from "./maturity-kpi-rollups";

describe("maturity-kpi-rollups", () => {
  const holisticRows: AnalyticsRow[] = [
    { eventType: "holistic_loop", eventName: "care_signal_prompt_shown", userId: 1, eventData: null },
    { eventType: "holistic_loop", eventName: "care_signal_prompt_shown", userId: 2, eventData: null },
    { eventType: "holistic_loop", eventName: "care_signal_prompt_accepted", userId: 1, eventData: null },
    { eventType: "holistic_loop", eventName: "care_signal_prompt_dismissed", userId: 3, eventData: null },
    { eventType: "holistic_loop", eventName: "septic_shock_micro_course_clicked", userId: 1, eventData: null },
    {
      eventType: "care_signal_submission_created",
      eventName: "Care Signal submitted",
      userId: 1,
      eventData: JSON.stringify({ source: "resusgps" }),
    },
  ];

  it("rollupHolisticLoop computes acceptance rate", () => {
    const k = rollupHolisticLoop(holisticRows);
    expect(k.promptsShown).toBe(2);
    expect(k.promptsAccepted).toBe(1);
    expect(k.promptsDismissed).toBe(1);
    expect(k.septicCourseClicks).toBe(1);
    expect(k.acceptanceRate).toBe(50);
    expect(k.careSignalSubmissionsAfterPrompt7d).toBe(1);
  });

  it("rollupMissionImpact separates resus and care signal users", () => {
    const rows: AnalyticsRow[] = [
      ...holisticRows,
      { eventType: "resus_session", eventName: "ResusGPS workspace entered", userId: 10, eventData: null },
      { eventType: "resus_session", eventName: "ResusGPS workspace entered", userId: 11, eventData: null },
      {
        eventType: "care_signal_submission_created",
        eventName: "submit",
        userId: 20,
        eventData: null,
      },
    ];
    const m = rollupMissionImpact(rows);
    expect(m.resusSessions30d).toBe(2);
    expect(m.careSignalActiveReporters30d).toBe(2);
    expect(m.holisticLoop.promptsShown).toBe(2);
  });

  it("rollupProviderConversionFunnel tracks payer repeat rate", () => {
    const rows: AnalyticsRow[] = [
      { eventType: "provider_conversion", eventName: "provider_role_selected", userId: 1, eventData: null },
      { eventType: "provider_conversion", eventName: "payment_completed_redirect", userId: 1, eventData: null },
      { eventType: "provider_conversion", eventName: "payment_completed_redirect", userId: 1, eventData: null },
      { eventType: "provider_conversion", eventName: "payment_completed_redirect", userId: 2, eventData: null },
      {
        eventType: "provider_conversion",
        eventName: "second_purchase_recommendation_clicked",
        userId: 1,
        eventData: null,
      },
    ];
    const f = rollupProviderConversionFunnel(rows);
    expect(f.roleSelected).toBe(1);
    expect(f.paymentCompleted).toBe(3);
    expect(f.distinctPayers).toBe(2);
    expect(f.repeatPayers).toBe(1);
    expect(f.secondPurchaseRate).toBe(50);
    expect(f.secondPurchaseClicks).toBe(1);
  });
});
