import { describe, expect, it } from "vitest";
import { rollupHolisticLoop, rollupMissionImpact } from "../server/lib/maturity-kpi-rollups";
import { simulateHolisticLoopEvents } from "./holistic-loop-events";

describe("holistic loop — septic shock vertical slice", () => {
  it("simulates ResusGPS save → prompt → accept → Care Signal submit → rollup", () => {
    const events = simulateHolisticLoopEvents({ userId: 42 });
    const holistic = rollupHolisticLoop(events);
    const mission = rollupMissionImpact(events);

    expect(holistic.promptsShown).toBe(1);
    expect(holistic.promptsAccepted).toBe(1);
    expect(holistic.promptsDismissed).toBe(0);
    expect(holistic.acceptanceRate).toBe(100);
    expect(holistic.careSignalSubmissionsAfterPrompt7d).toBe(1);

    expect(mission.resusSessions30d).toBe(1);
    expect(mission.careSignalActiveReporters30d).toBe(1);
    expect(mission.holisticLoop.septicCourseClicks).toBe(0);
  });

  it("tracks dismiss path without Care Signal submission", () => {
    const events = simulateHolisticLoopEvents({
      userId: 7,
      steps: ["resus_session_completed", "care_signal_prompt_shown", "care_signal_prompt_dismissed"],
    });
    const holistic = rollupHolisticLoop(events);

    expect(holistic.promptsShown).toBe(1);
    expect(holistic.promptsDismissed).toBe(1);
    expect(holistic.promptsAccepted).toBe(0);
    expect(holistic.acceptanceRate).toBe(0);
    expect(holistic.careSignalSubmissionsAfterPrompt7d).toBe(0);
  });

  it("includes septic shock micro-course click in loop metrics", () => {
    const events = simulateHolisticLoopEvents({
      userId: 99,
      includeSepticCourseClick: true,
    });
    const holistic = rollupHolisticLoop(events);

    expect(holistic.septicCourseClicks).toBe(1);
  });
});
