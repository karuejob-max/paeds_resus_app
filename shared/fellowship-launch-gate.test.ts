import { describe, expect, it } from "vitest";
import {
  canDisplayFellowTitle,
  FELLOWSHIP_LAUNCH_READINESS,
  FELLOWSHIP_PATHWAY_IN_PROGRESS_LABEL,
} from "./fellowship-launch-gate";

describe("fellowship-launch-gate", () => {
  it("blocks Fellow title until launch readiness is enabled", () => {
    expect(FELLOWSHIP_LAUNCH_READINESS.fellowTitleEnabled).toBe(false);
    expect(canDisplayFellowTitle(true)).toBe(false);
    expect(canDisplayFellowTitle(false)).toBe(false);
  });

  it("exposes honest in-progress pathway label", () => {
    expect(FELLOWSHIP_PATHWAY_IN_PROGRESS_LABEL).toMatch(/pathway/i);
    expect(FELLOWSHIP_PATHWAY_IN_PROGRESS_LABEL).not.toMatch(/\bPaeds Resus Fellow\b/);
  });
});
