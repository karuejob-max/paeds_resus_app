import { describe, expect, it, vi } from "vitest";
import { assertNoInstructorDoubleBooking } from "./instructor-double-booking-guard";

function dbWithCandidates(candidates: Array<Record<string, unknown>>) {
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(candidates),
      }),
    }),
  } as never;
}

describe("instructor double-booking guard", () => {
  it("rejects an end date before the start date", async () => {
    await expect(assertNoInstructorDoubleBooking(dbWithCandidates([]), {
      instructorId: 1,
      scheduledDate: new Date("2026-08-22T09:00:00Z"),
      endDate: new Date("2026-08-21T23:59:59Z"),
      startTime: "09:00",
      endTime: "17:00",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("blocks overlapping multi-day assignments conservatively", async () => {
    await expect(assertNoInstructorDoubleBooking(dbWithCandidates([{
      id: 10,
      scheduledDate: new Date("2026-08-23T09:00:00Z"),
      endDate: new Date("2026-08-24T23:59:59Z"),
      startTime: "09:00",
      endTime: "17:00",
      institutionalAccountId: 9,
    }]), {
      instructorId: 1,
      scheduledDate: new Date("2026-08-24T09:00:00Z"),
      endDate: new Date("2026-08-25T23:59:59Z"),
      startTime: "09:00",
      endTime: "17:00",
    })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("allows separate single-day time windows", async () => {
    await expect(assertNoInstructorDoubleBooking(dbWithCandidates([{
      id: 11,
      scheduledDate: new Date("2026-08-22T09:00:00Z"),
      endDate: null,
      startTime: "09:00",
      endTime: "11:00",
      institutionalAccountId: 9,
    }]), {
      instructorId: 1,
      scheduledDate: new Date("2026-08-22T12:00:00Z"),
      startTime: "13:00",
      endTime: "16:00",
    })).resolves.toBeUndefined();
  });

  it("blocks a same-day assignment when either time window is incomplete", async () => {
    await expect(assertNoInstructorDoubleBooking(dbWithCandidates([{
      id: 12,
      scheduledDate: new Date("2026-08-22T09:00:00Z"),
      endDate: null,
      startTime: null,
      endTime: "17:00",
      institutionalAccountId: 9,
    }]), {
      instructorId: 1,
      scheduledDate: new Date("2026-08-22T12:00:00Z"),
      startTime: "13:00",
      endTime: "16:00",
    })).rejects.toMatchObject({ code: "CONFLICT" });
  });
});
