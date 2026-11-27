import { beforeEach, describe, expect, it, vi } from "vitest";
import { institutionMemberships, institutionMembershipEvents, institutionalAccounts, users } from "../../drizzle/schema";

const { sendEmail, notify } = vi.hoisted(() => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
  notify: vi.fn().mockResolvedValue({ created: true }),
}));
vi.mock("../email-service", () => ({ sendEmail }));
vi.mock("../lib/notifications", () => ({ createCanonicalNotification: notify }));

import { ensureProviderMembershipForStaff } from "../routers/institution";

type Rows = { user?: { id: number } | null; membership?: { id: number; membershipStatus: string } | null };

function fakeDb(rows: Rows) {
  const inserts: { table: unknown; values: Record<string, unknown> }[] = [];
  const updates: { table: unknown; set: Record<string, unknown> }[] = [];
  const db = {
    select: () => ({
      from: (table: unknown) => ({
        where: () => ({
          limit: async () => {
            if (table === users) return rows.user ? [rows.user] : [];
            if (table === institutionMemberships) return rows.membership ? [rows.membership] : [];
            if (table === institutionalAccounts) return [{ companyName: "Test Hospital" }];
            return [];
          },
        }),
      }),
    }),
    insert: (table: unknown) => ({
      values: async (values: Record<string, unknown>) => {
        inserts.push({ table, values });
        return [{ insertId: 77 }];
      },
    }),
    update: (table: unknown) => ({
      set: (set: Record<string, unknown>) => ({
        where: async () => {
          updates.push({ table, set });
        },
      }),
    }),
  };
  return { db: db as never, inserts, updates };
}

const base = { institutionId: 9, staffMemberId: 5, email: "Nurse@Example.com", staffName: "Nurse", actor: { id: 1, name: "Admin" } };

describe("admin roster adds create invitations, not memberships", () => {
  beforeEach(() => {
    sendEmail.mockClear();
    notify.mockClear();
  });

  it("an existing account becomes 'invited', never 'active', with no acceptedAt", async () => {
    const { db, inserts } = fakeDb({ user: { id: 42 } });
    const result = await ensureProviderMembershipForStaff(db, base);
    expect(result).toEqual({ membershipId: 77, status: "invited" });
    const membership = inserts.find((i) => i.table === institutionMemberships)!.values;
    expect(membership.membershipStatus).toBe("invited");
    expect(membership.acceptedAt).toBeUndefined();
    expect(membership.responsibilityRole).toBe("general_staff");
    expect(membership.invitedByUserId).toBe(1);
  });

  it("writes an audit event for the invitation", async () => {
    const { db, inserts } = fakeDb({ user: { id: 42 } });
    await ensureProviderMembershipForStaff(db, base);
    const event = inserts.find((i) => i.table === institutionMembershipEvents)!.values;
    expect(event).toMatchObject({ eventType: "invited", currentMembershipStatus: "invited", actorUserId: 1 });
  });

  it("notifies an existing account and emails the address", async () => {
    const { db } = fakeDb({ user: { id: 42 } });
    await ensureProviderMembershipForStaff(db, base);
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, requiresAction: true }));
    expect(sendEmail).toHaveBeenCalledWith("nurse@example.com", "institutionProviderInvitation", expect.anything());
  });

  it("an unknown email is invited and emailed, with no in-app notification", async () => {
    const { db } = fakeDb({ user: null });
    await ensureProviderMembershipForStaff(db, base);
    expect(notify).not.toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("never touches an already-active membership", async () => {
    const { db, inserts, updates } = fakeDb({ user: { id: 42 }, membership: { id: 3, membershipStatus: "active" } });
    const result = await ensureProviderMembershipForStaff(db, base);
    expect(result).toEqual({ membershipId: 3, status: "active" });
    expect(inserts).toHaveLength(0);
    expect(updates).toHaveLength(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("re-invites a declined membership and resets acceptance", async () => {
    const { db, updates, inserts } = fakeDb({ user: { id: 42 }, membership: { id: 3, membershipStatus: "declined" } });
    const result = await ensureProviderMembershipForStaff(db, base);
    expect(result).toEqual({ membershipId: 3, status: "reinvited" });
    expect(updates[0].set).toMatchObject({ membershipStatus: "invited", acceptedAt: null, endedAt: null });
    expect(inserts.find((i) => i.table === institutionMembershipEvents)!.values).toMatchObject({
      eventType: "reinvited",
      previousMembershipStatus: "declined",
    });
  });

  it("does not link the staff roster row to the account", async () => {
    const { db, updates } = fakeDb({ user: { id: 42 } });
    await ensureProviderMembershipForStaff(db, base);
    expect(updates.filter((u) => u.table !== institutionMemberships)).toHaveLength(0);
  });

  it("a delivery failure does not undo the recorded invitation", async () => {
    sendEmail.mockRejectedValueOnce(new Error("smtp down"));
    const { db } = fakeDb({ user: null });
    await expect(ensureProviderMembershipForStaff(db, base)).resolves.toMatchObject({ status: "invited" });
  });
});
