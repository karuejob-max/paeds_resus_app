import { describe, expect, it } from "vitest";
import {
  computeDefinitiveCareStepProgress,
  isDefinitiveCareProgressComplete,
} from "./definitive-care-completion";

describe("definitive-care-completion", () => {
  const steps = [
    { id: "a", isReassessment: false },
    { id: "b", isReassessment: false },
    { id: "c", isReassessment: true },
  ];

  it("counts only non-reassessment steps toward completion", () => {
    const progress = computeDefinitiveCareStepProgress(steps, { a: "done", b: "pending" });
    expect(progress.total).toBe(2);
    expect(progress.completed).toBe(1);
    expect(progress.isComplete).toBe(false);
  });

  it("treats skipped steps as complete", () => {
    const progress = computeDefinitiveCareStepProgress(steps, { a: "done", b: "skipped" });
    expect(progress.isComplete).toBe(true);
  });

  it("honours completedAt on progress record", () => {
    expect(
      isDefinitiveCareProgressComplete(steps, {
        fellowshipId: "dka",
        stepStatuses: {},
        completedAt: Date.now(),
      })
    ).toBe(true);
  });

  it("rejects incomplete progress without completedAt", () => {
    expect(
      isDefinitiveCareProgressComplete(steps, {
        fellowshipId: "dka",
        stepStatuses: { a: "done" },
      })
    ).toBe(false);
  });
});
