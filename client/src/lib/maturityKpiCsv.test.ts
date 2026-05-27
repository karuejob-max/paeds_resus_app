import { describe, expect, it } from "vitest";
import { buildMaturityKpiCsv } from "./maturityKpiCsv";

describe("buildMaturityKpiCsv", () => {
  it("includes mission impact and holistic loop metrics", () => {
    const csv = buildMaturityKpiCsv({
      exportedAt: new Date("2026-05-27T12:00:00.000Z"),
      windowDays: 30,
      missionImpact: {
        resusSessions30d: 12,
        careSignalActiveReporters30d: 5,
        holisticLoop: {
          promptsShown: 8,
          promptsAccepted: 3,
          promptsDismissed: 5,
          septicCourseClicks: 2,
          acceptanceRate: 38,
          careSignalSubmissionsAfterPrompt7d: 2,
        },
      },
      activePayingProviders30d: 4,
      conversionFunnel: {
        roleSelected: 20,
        enrollmentStarted: 10,
        paymentInitiated: 8,
        paymentCompleted: 6,
        secondPurchaseClicks: 1,
        distinctPayers: 6,
        repeatPayers: 2,
        secondPurchaseRate: 33,
      },
      fellowshipChecklist: {
        fellowTitleEnabled: false,
        summary: { pass: 8, fail: 1, manual: 2, blocked: 1 },
        items: [
          {
            id: "11.1.a",
            section: "Data",
            label: "Care Signal table ready",
            status: "pass",
          },
        ],
      },
    });

    expect(csv).toContain("holistic_loop,prompts_shown,8");
    expect(csv).toContain("mission_impact,resus_sessions_30d,12");
    expect(csv).toContain("provider_conversion,payment_completed,6");
    expect(csv).toContain("fellowship_checklist,pass_count,8");
    expect(csv).toContain("11.1.a,Data,Care Signal table ready,pass");
  });
});
