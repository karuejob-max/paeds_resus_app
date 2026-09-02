import { describe, expect, it } from "vitest";
import { getCpdAttendeeRole } from "../routers/cpd";

describe("CPD presenter attendance roles", () => {
  it("marks the lead presenter correctly", () => {
    expect(getCpdAttendeeRole(10, [20], 10)).toBe("presenter");
  });

  it("marks a co-presenter correctly", () => {
    expect(getCpdAttendeeRole(10, [20], 20)).toBe("co_presenter");
  });

  it("keeps everyone else as an attendee", () => {
    expect(getCpdAttendeeRole(10, [20], 30)).toBe("attendee");
    expect(getCpdAttendeeRole(null, [], 30)).toBe("attendee");
  });
});
