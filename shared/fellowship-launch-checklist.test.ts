import { describe, expect, it } from "vitest";
import {
  checklistSummary,
  evaluateFellowshipLaunchChecklist,
} from "./fellowship-launch-checklist";

const allGreenInput = {
  careSignalEventsTableReady: true,
  careSignalEatBucketingTested: true,
  fellowTitleAutomationOnly: true,
  resusGpsDepthRulesImplemented: true,
  microCourseCompletionPipelineReady: true,
  streakGraceCatchUpTested: true,
  singleFellowshipDashboard: true,
  fellowBadgeGated: true,
  safeTruthNamingCorrect: true,
  privacyPolicyPublished: false,
  careSignalConsentImplemented: true,
  appealsProcessDocumented: false,
  accreditedListReady: false,
};

describe("fellowship-launch-checklist", () => {
  it("engineering items pass when automation ready", () => {
    const items = evaluateFellowshipLaunchChecklist(allGreenInput);
    const summary = checklistSummary(items);
    expect(summary.fail).toBe(0);
    expect(summary.engineeringPass).toBe(true);
    expect(items.find((i) => i.id === "gate-fellow-title")?.status).toBe("blocked");
  });

  it("fails when fellow title gate would be open", () => {
    const items = evaluateFellowshipLaunchChecklist({
      ...allGreenInput,
      fellowBadgeGated: false,
    });
    expect(items.find((i) => i.id === "11.2-fellow-badge")?.status).toBe("fail");
  });
});
