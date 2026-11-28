import { describe, expect, it } from "vitest";
import {
  buildLicenceFollowUp,
  licenceDueAt,
  licenceStateOf,
  pickReminderTargets,
  type StaffLicenceRow,
} from "./institution-licence-followup";

const now = new Date("2026-12-01T00:00:00Z");
const day = 86400000;
const at = (d: number) => new Date(now.getTime() + d * day);

describe("licenceStateOf", () => {
  it("classifies each situation", () => {
    expect(licenceStateOf(undefined, now)).toBe("no_licence");
    expect(licenceStateOf({ status: "pending", expiresAt: null }, now)).toBe("pending_review");
    expect(licenceStateOf({ status: "rejected", expiresAt: null }, now)).toBe("rejected");
    expect(licenceStateOf({ status: "revoked", expiresAt: null }, now)).toBe("revoked");
    expect(licenceStateOf({ status: "verified", expiresAt: at(-1) }, now)).toBe("expired");
    expect(licenceStateOf({ status: "verified", expiresAt: at(30) }, now)).toBe("expiring");
    expect(licenceStateOf({ status: "verified", expiresAt: at(400) }, now)).toBe("current");
    expect(licenceStateOf({ status: "verified", expiresAt: null }, now)).toBe("current");
  });
});

describe("licenceDueAt", () => {
  it("is null with no institution deadline", () => expect(licenceDueAt(null, at(-5))).toBeNull());
  it("uses the institution deadline for long-standing staff", () => expect(licenceDueAt(at(30), at(-100))).toEqual(at(30)));
  it("gives new joiners 30 days from joining when that is later", () => expect(licenceDueAt(at(30), at(10))).toEqual(at(40)));
});

const row = (over: Partial<StaffLicenceRow>): StaffLicenceRow => ({
  staffId: 1, userId: 1, name: "A", email: "a@x.org", department: null, staffRole: null, providerType: "nurse", joinedAt: at(-60), ...over,
});

describe("buildLicenceFollowUp", () => {
  it("counts only licensed cadres and flags identity gaps", () => {
    const { counts } = buildLicenceFollowUp(
      [
        row({ staffId: 1, userId: 1 }),
        row({ staffId: 2, userId: 2, credential: { status: "verified", expiresAt: at(500) } }),
        row({ staffId: 3, userId: 3, providerType: "administrator" }),
        row({ staffId: 4, userId: 4, providerType: null }),
      ],
      at(-1),
      now,
    );
    expect(counts.licensedStaff).toBe(2);
    expect(counts.current).toBe(1);
    expect(counts.mustAct).toBe(1);
    expect(counts.overdue).toBe(1);
    expect(counts.identityMissing).toBe(1);
  });
  it("is never overdue when no deadline is set", () => {
    expect(buildLicenceFollowUp([row({})], null, now).counts.overdue).toBe(0);
  });
  it("does not ask people whose licence awaits review to act", () => {
    expect(buildLicenceFollowUp([row({ credential: { status: "pending", expiresAt: null } })], null, now).counts.mustAct).toBe(0);
  });
});

describe("pickReminderTargets", () => {
  it("skips people reminded recently and people without accounts", () => {
    const { people } = buildLicenceFollowUp([row({ staffId: 1, userId: 1 }), row({ staffId: 2, userId: 2 }), row({ staffId: 3, userId: null })], null, now);
    const { targets, skippedRecently } = pickReminderTargets(people, new Set([1]));
    expect(targets.map((t) => t.userId)).toEqual([2]);
    expect(skippedRecently).toBe(1);
  });
});
