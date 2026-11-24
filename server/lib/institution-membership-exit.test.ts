import { describe, expect, it, vi } from "vitest";
import {
  inAppNotifications,
  institutionAccountScopes,
  institutionDepartmentResponseCoordinators,
  institutionMembershipEvents,
  institutionMemberships,
  institutionProductRoles,
  institutionalAccountAdmins,
  institutionalAccounts,
  institutionalStaffMembers,
  monthlyUtlRotations,
  shiftUtlRosters,
} from "../../drizzle/schema";
import { endMembershipAccess, leaveInstitutionMembership } from "./institution-membership-exit";

type Rows = {
  membership?: { id: number; institutionalAccountId: number; userId: number | null; staffMemberId: number | null; membershipStatus: string } | null;
  ownerUserId?: number;
  adminRow?: { id: number } | null;
  admins?: { userId: number }[];
  failNotification?: boolean;
};

function fakeDb(rows: Rows) {
  const inserts: { table: unknown; values: any }[] = [];
  const updates: { table: unknown; set: any }[] = [];
  const result = (table: unknown, limited: boolean): unknown[] => {
    if (table === institutionMemberships) return rows.membership ? [rows.membership] : [];
    if (table === institutionalAccounts) return [{ ownerUserId: rows.ownerUserId ?? 1, companyName: "Test Hospital" }];
    if (table === institutionalAccountAdmins) return limited ? (rows.adminRow ? [rows.adminRow] : []) : (rows.admins ?? []);
    return [];
  };
  const exec: any = {
    select: () => ({
      from: (table: unknown) => {
        const chain: any = {};
        chain.where = () => chain;
        chain.limit = async () => result(table, true);
        chain.then = (resolve: (v: unknown[]) => unknown) => Promise.resolve(result(table, false)).then(resolve);
        return chain;
      },
    }),
    insert: (table: unknown) => ({
      values: async (values: any) => {
        if (table === inAppNotifications && rows.failNotification) throw new Error("notify down");
        inserts.push({ table, values });
        return [{ insertId: 1 }];
      },
    }),
    update: (table: unknown) => ({ set: (set: any) => ({ where: async () => { updates.push({ table, set }); } }) }),
  };
  exec.transaction = async (cb: (tx: unknown) => Promise<unknown>) => cb(exec);
  return { db: exec as never, inserts, updates };
}

const active = { id: 7, institutionalAccountId: 5, userId: 42, staffMemberId: 11, membershipStatus: "active" };
const user = { id: 42, name: "Nurse A", email: "a@example.com" };
const set = (updates: { table: unknown; set: any }[], table: unknown) => updates.filter((u) => u.table === table).map((u) => u.set);

describe("a provider can leave an institution", () => {
  it("ends the membership, the roster link, roles, scopes, coordinator seats and future duties", async () => {
    const { db, updates } = fakeDb({ membership: active, admins: [{ userId: 3 }] });
    await leaveInstitutionMembership(db, user, { membershipId: 7, reason: "Moved to another hospital" });
    expect(set(updates, institutionMemberships)[0]).toMatchObject({ membershipStatus: "ended" });
    expect(set(updates, institutionProductRoles)[0]).toMatchObject({ roleStatus: "ended" });
    expect(set(updates, institutionAccountScopes)[0]).toMatchObject({ scopeStatus: "ended" });
    expect(set(updates, institutionDepartmentResponseCoordinators)[0]).toMatchObject({ assignmentStatus: "ended" });
    expect(set(updates, monthlyUtlRotations)[0]).toMatchObject({ assignmentStatus: "ended", providerUserId: null });
    expect(set(updates, shiftUtlRosters)[0]).toMatchObject({ assignmentStatus: "ended" });
  });

  it("leaves the roster row rejected, never pending", async () => {
    const { db, updates } = fakeDb({ membership: active });
    await leaveInstitutionMembership(db, user, { membershipId: 7, reason: "Moved to another hospital" });
    const staff = set(updates, institutionalStaffMembers);
    expect(staff).toHaveLength(1);
    expect(staff[0].facilityLinkStatus).toBe("rejected");
  });

  it("writes an audit event naming the provider as the actor", async () => {
    const { db, inserts } = fakeDb({ membership: active });
    await leaveInstitutionMembership(db, user, { membershipId: 7, reason: "Moved to another hospital" });
    const event = inserts.find((i) => i.table === institutionMembershipEvents)!.values;
    expect(event).toMatchObject({ eventType: "removed", previousMembershipStatus: "active", currentMembershipStatus: "ended", actorUserId: 42, userId: 42 });
    expect(event.reason).toContain("Moved to another hospital");
  });

  it("tells the owner and administrators", async () => {
    const { db, inserts } = fakeDb({ membership: active, ownerUserId: 1, admins: [{ userId: 3 }] });
    await leaveInstitutionMembership(db, user, { membershipId: 7, reason: "Moved to another hospital" });
    const notices = inserts.filter((i) => i.table === inAppNotifications).flatMap((i) => i.values);
    expect(notices.map((n: { userId: number }) => n.userId).sort()).toEqual([1, 3]);
  });

  it("an administrator or the owner cannot leave without handing over first", async () => {
    for (const rows of [{ membership: active, ownerUserId: 42 }, { membership: active, adminRow: { id: 2 } }] as Rows[]) {
      const { db, updates } = fakeDb(rows);
      await expect(leaveInstitutionMembership(db, user, { membershipId: 7, reason: "Moved on" })).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(updates).toHaveLength(0);
    }
  });

  it("only the member's own active membership can be left", async () => {
    const { db, updates } = fakeDb({ membership: null });
    await expect(leaveInstitutionMembership(db, user, { membershipId: 7, reason: "Moved on" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(updates).toHaveLength(0);
  });

  it("a failed notification does not undo the exit", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { db, updates } = fakeDb({ membership: active, admins: [{ userId: 3 }], failNotification: true });
    await expect(leaveInstitutionMembership(db, user, { membershipId: 7, reason: "Moved on" })).resolves.toEqual({ institutionalAccountId: 5 });
    expect(set(updates, institutionMemberships)[0]).toMatchObject({ membershipStatus: "ended" });
    spy.mockRestore();
  });
});

describe("administrator unlink and provider leave share one cleanup", () => {
  it("never resets the roster row to pending", async () => {
    const { db, updates } = fakeDb({});
    await endMembershipAccess(db, { institutionId: 5, membership: { id: 7, userId: 42, staffMemberId: 11 }, now: new Date() });
    expect(set(updates, institutionalStaffMembers).every((s) => s.facilityLinkStatus === "rejected")).toBe(true);
  });

  it("a membership with no linked account only ends the membership and roster row", async () => {
    const { db, updates } = fakeDb({});
    await endMembershipAccess(db, { institutionId: 5, membership: { id: 7, userId: null, staffMemberId: null }, now: new Date() });
    expect(updates.map((u) => u.table)).toEqual([institutionMemberships]);
  });
});
