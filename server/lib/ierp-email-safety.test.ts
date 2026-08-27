import { describe, expect, it } from "vitest";
import { blockIerpPromotionalSend, getIerpEmailSafetyStatus, IERP_PROMOTIONAL_SENDING_ENABLED } from "./ierp-email-safety";

describe("IERP promotional email safety", () => {
  it("keeps promotional sending disabled and limits lifecycle states", () => {
    expect(IERP_PROMOTIONAL_SENDING_ENABLED).toBe(false);
    expect(getIerpEmailSafetyStatus()).toMatchObject({
      programKey: "ierp",
      promotionalSendingEnabled: false,
      allowedScheduleStates: ["draft", "paused"],
    });
  });

  it("returns a blocked result rather than delivering a message", () => {
    expect(blockIerpPromotionalSend()).toEqual({
      success: false,
      blocked: true,
      reason: "IERP promotional sending is disabled. Use audience preview only.",
    });
  });
});
