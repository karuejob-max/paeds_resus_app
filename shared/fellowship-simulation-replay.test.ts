import { describe, expect, it } from "vitest";

/** Documents fellowship sim completion contract used by MicroCoursePlayerDB. */
function shouldPersistFellowshipSimCompletion(alreadyPassed: boolean): boolean {
  return !alreadyPassed;
}

function fellowshipSimCompleteAdvance(opts: {
  reviewMode: boolean;
  advanceToSummative?: boolean;
}): boolean {
  return opts.advanceToSummative ?? !opts.reviewMode;
}

describe("fellowship simulation replay contract", () => {
  it("first completion persists progress and unlocks summative", () => {
    expect(shouldPersistFellowshipSimCompletion(false)).toBe(true);
    expect(
      fellowshipSimCompleteAdvance({ reviewMode: false, advanceToSummative: undefined })
    ).toBe(true);
  });

  it("review replay does not re-persist and can return to course without advancing", () => {
    expect(shouldPersistFellowshipSimCompletion(true)).toBe(false);
    expect(
      fellowshipSimCompleteAdvance({ reviewMode: true, advanceToSummative: false })
    ).toBe(false);
    expect(
      fellowshipSimCompleteAdvance({ reviewMode: true, advanceToSummative: true })
    ).toBe(true);
  });
});
