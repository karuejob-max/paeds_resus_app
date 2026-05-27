import { describe, expect, it } from "vitest";
import {
  CARE_SIGNAL_DUPLICATE_WINDOW_MS,
  CARE_SIGNAL_MAX_SUBMISSIONS_PER_USER_PER_DAY,
  countSubmissionsSince,
  evaluateCareSignalSubmissionGuard,
  isDuplicateCareSignalSubmission,
  startOfTodayEAT,
} from "./care-signal-rate-limit";

const baseInput = {
  eventDate: "2026-05-27T10:00:00.000Z",
  eventType: "shock_sepsis",
  childAge: 48,
};

describe("care-signal-rate-limit", () => {
  it("blocks when user exceeds daily submission cap (EAT day)", () => {
    const now = new Date("2026-05-27T14:00:00.000Z");
    const todayStart = startOfTodayEAT(now);
    const recentRows = Array.from({ length: CARE_SIGNAL_MAX_SUBMISSIONS_PER_USER_PER_DAY }, (_, i) => ({
      eventDate: new Date(baseInput.eventDate),
      eventType: baseInput.eventType,
      childAge: baseInput.childAge,
      createdAt: new Date(todayStart.getTime() + i * 60_000),
    }));

    const result = evaluateCareSignalSubmissionGuard(recentRows, baseInput, now);
    expect(result).toEqual({ allowed: false, reason: "rate_limit" });
  });

  it("allows submission under daily cap", () => {
    const now = new Date("2026-05-27T14:00:00.000Z");
    const todayStart = startOfTodayEAT(now);
    const recentRows = [
      {
        eventDate: new Date(baseInput.eventDate),
        eventType: baseInput.eventType,
        childAge: baseInput.childAge,
        createdAt: new Date(todayStart.getTime() + 60_000),
      },
    ];

    expect(evaluateCareSignalSubmissionGuard(recentRows, baseInput, now)).toEqual({ allowed: true });
  });

  it("detects duplicate submissions within 10 minutes", () => {
    const now = new Date("2026-05-27T10:05:00.000Z");
    const recentRows = [
      {
        eventDate: new Date(baseInput.eventDate),
        eventType: baseInput.eventType,
        childAge: baseInput.childAge,
        createdAt: new Date(now.getTime() - 2 * 60_000),
      },
    ];

    expect(isDuplicateCareSignalSubmission(recentRows[0]!, baseInput, now)).toBe(true);
    expect(evaluateCareSignalSubmissionGuard(recentRows, baseInput, now)).toEqual({
      allowed: false,
      reason: "duplicate",
    });
  });

  it("does not flag duplicate after window expires", () => {
    const now = new Date("2026-05-27T10:20:00.000Z");
    const recentRows = [
      {
        eventDate: new Date(baseInput.eventDate),
        eventType: baseInput.eventType,
        childAge: baseInput.childAge,
        createdAt: new Date(now.getTime() - CARE_SIGNAL_DUPLICATE_WINDOW_MS - 1_000),
      },
    ];

    expect(isDuplicateCareSignalSubmission(recentRows[0]!, baseInput, now)).toBe(false);
  });

  it("counts only rows since EAT day start", () => {
    const now = new Date("2026-05-27T08:00:00.000Z");
    const todayStart = startOfTodayEAT(now);
    const yesterday = new Date(todayStart.getTime() - 60_000);
    const rows = [
      { eventDate: new Date(), eventType: "x", childAge: 1, createdAt: yesterday },
      { eventDate: new Date(), eventType: "x", childAge: 2, createdAt: new Date(todayStart.getTime() + 1_000) },
    ];
    expect(countSubmissionsSince(rows, todayStart)).toBe(1);
  });
});
