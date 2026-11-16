import { describe, expect, it, vi } from "vitest";
import { createInstitutionalCpdSession } from "./institutional-cpd-session";

function createDbMock() {
  const insertCalls: Array<{ table: unknown; values: unknown }> = [];
  const db = {
    insert: vi.fn((table: unknown) => ({
      values: vi.fn(async (values: unknown) => {
        insertCalls.push({ table, values });
        return [{ insertId: insertCalls.length === 1 ? "42" : 0 }];
      }),
    })),
  };
  return { db, insertCalls };
}

describe("createInstitutionalCpdSession", () => {
  it("writes the canonical event, audit, and co-presenters using a numeric event id", async () => {
    const { db, insertCalls } = createDbMock();
    const result = await createInstitutionalCpdSession(db, {
      institutionId: 7,
      actorUserId: 9,
      name: "Sentinel RCA learning session",
      eventDate: "2026-11-17",
      eventDateAt: "2026-11-17",
      eventType: "cne",
      audienceScope: "facility_wide",
      presenter: {
        userId: 11,
        staffName: "Lead Nurse",
        staffEmail: "lead@example.org",
        staffRole: "RN",
        cadre: "RN",
        department: "Paediatrics",
        isInstitutionMember: true,
      },
      cpdPoints: 1.5,
      coPresenters: [{
        userId: 12,
        staffName: "Co-presenter",
        staffEmail: "co@example.org",
        staffRole: "RN",
        cadre: "RN",
        department: "ICU",
        isInstitutionMember: true,
      }],
    });

    expect(result).toEqual({ eventId: 42 });
    expect(insertCalls).toHaveLength(3);
    expect(insertCalls[0].values).toMatchObject({
      institutionalAccountId: 7,
      eventDate: "2026-11-17",
      audienceScope: "facility_wide",
      presenterUserId: 11,
      cpdPoints: "1.5",
    });
    expect(insertCalls[1].values).toMatchObject({
      institutionalAccountId: 7,
      cpdEventId: 42,
      actorUserId: 9,
      nextStatus: "open",
    });
    expect(insertCalls[2].values).toEqual([expect.objectContaining({
      institutionalAccountId: 7,
      cpdEventId: 42,
      userId: 12,
      participantType: "institution_member",
    })]);
  });
});
