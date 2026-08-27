import { describe, expect, it } from "vitest";
import { calculateCredentialReminder } from "./professional-credential-reminders";

describe("professional credential reminder cadence", () => {
  const expiry = new Date("2026-12-31T00:00:00.000Z");

  it("uses the three-month calendar threshold", () => {
    expect(
      calculateCredentialReminder(expiry, new Date("2026-09-30T12:00:00.000Z"))
    ).toMatchObject({
      stage: "three_months",
      duePeriod: new Date("2026-09-30T00:00:00.000Z"),
    });
  });

  it("moves through the two- and one-month thresholds", () => {
    expect(
      calculateCredentialReminder(expiry, new Date("2026-11-01T12:00:00.000Z"))
        ?.stage
    ).toBe("two_months");
    expect(
      calculateCredentialReminder(expiry, new Date("2026-12-01T12:00:00.000Z"))
        ?.stage
    ).toBe("one_month");
  });

  it("uses a weekly overdue period after expiry", () => {
    expect(
      calculateCredentialReminder(expiry, new Date("2027-01-07T12:00:00.000Z"))
    ).toMatchObject({
      stage: "weekly_overdue",
      duePeriod: new Date("2027-01-07T00:00:00.000Z"),
    });
    expect(
      calculateCredentialReminder(expiry, new Date("2026-08-01T12:00:00.000Z"))
    ).toBeNull();
  });
});
