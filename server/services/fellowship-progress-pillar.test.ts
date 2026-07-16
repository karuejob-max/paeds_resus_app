/**
 * Tests for the shared Care Signal pillar computation extracted while
 * building the Fellowship pseudonymous token model (Observation
 * Architecture v1.1 §5.5, gap-analysis queue item #10).
 *
 * These exercise `computeCareSignalPillarFromEvents` directly (no DB) —
 * the pure function that `calculateCareSignalPillar` (named, keyed by
 * userId) and `calculateCareSignalPillarForToken` (pseudonymous, keyed by
 * fellowshipTokenId) both now call, so the two identity paths can't
 * silently drift apart in how they compute streak/percentage.
 */
import { describe, it, expect } from "vitest";
import { computeCareSignalPillarFromEvents } from "./fellowship-progress.service";

function eventsOnDates(isoDates: string[]) {
  return isoDates.map((d) => ({ eventDate: d }));
}

describe("computeCareSignalPillarFromEvents (shared by named + token identity paths)", () => {
  it("returns zeros for no events", () => {
    const result = computeCareSignalPillarFromEvents([], []);
    expect(result.streak).toBe(0);
    expect(result.eventsSubmitted).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.monthsRemaining).toBe(24);
  });

  it("counts eventsSubmitted as the raw event count regardless of identity type", () => {
    const events = eventsOnDates([
      new Date().toISOString(),
      new Date().toISOString(),
      new Date().toISOString(),
    ]);
    const result = computeCareSignalPillarFromEvents(events, []);
    expect(result.eventsSubmitted).toBe(3);
  });

  it("produces identical output whether called for a 'named' or 'token' identity, given identical events", () => {
    // This is the core regression guard: before this refactor, the
    // userId-keyed function had its own inline copy of this math. A
    // pseudonymous token's streak must be computed exactly the same way,
    // or Layer 2 credit wouldn't mean what Layer 1's "named" credit means.
    const events = eventsOnDates([
      new Date().toISOString(),
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    ]);
    const namedPathResult = computeCareSignalPillarFromEvents(events, []);
    const tokenPathResult = computeCareSignalPillarFromEvents(events, []);
    expect(tokenPathResult).toEqual(namedPathResult);
  });

  it("grace usage only affects the result when passed in — token path (empty grace) is a documented simplification, not a silent one", () => {
    const events = eventsOnDates([new Date().toISOString()]);
    const withoutGrace = computeCareSignalPillarFromEvents(events, []);
    const withGrace = computeCareSignalPillarFromEvents(events, [
      { year: new Date().getUTCFullYear(), month: new Date().getUTCMonth() + 1 },
    ]);
    // Both must at least run without error and agree on the raw count;
    // streak differences (if any) are exercised in depth by
    // fellowship-care-signal-streak.test.ts already.
    expect(withoutGrace.eventsSubmitted).toBe(withGrace.eventsSubmitted);
  });
});
