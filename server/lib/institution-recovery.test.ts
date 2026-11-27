import { describe, expect, it } from "vitest";
import {
  inAppNotifications,
  institutionalAccountAdmins,
  institutionalAccounts,
  institutionalAdminEvents,
  institutionalAdminInvites,
} from "../../drizzle/schema";
import { acceptAdminInvite, createRecoveryGrant, recoveryEffectiveAt, RECOVERY_COOLING_OFF_DAYS } from "./institution-admin-grants";

const DAY = 24 * 60 * 60 * 1000;

function fakeDb(opts: { admins?: { userId: number }[]; invite?: any }) {
  const inserts: { table: unknown; values: any }[] = [];
  const updates: { table: unknown; set: any }[] = [];
  const deletes: unknown[] = [];
  const result = (table: unknown, limited: boolean): unknown[] => {
    if (table === institutionalAccounts) return [{ ownerUserId: 1, companyName: "Test Hospital" }];
    if (table === institutionalAccountAdmins) return limited ? [] : (opts.admins ?? []);
    if (table === institutionalAdminInvites) return opts.invite ? [opts.invite] : [];
    return [];
  };
  const db = {
    select: () => ({
      from: (table: unknown) => {
        const chain: any = {};
        chain.where = () => chain;
        chain.orderBy = () => chain;
        chain.limit = async () => result(table, true);
        chain.then = (resolve: (v: unknown[]) => unknown) => Promise.resolve(result(table, false)).then(resolve);
        return chain;
      },
    }),
    insert: (table: unknown) => ({ values: async (values: any) => { inserts.push({ table, values }); return [{ insertId: 77 }]; } }),
    update: (table: unknown) => ({ set: (set: any) => ({ where: async () => { updates.push({ table, set }); } }) }),
    delete: (table: unknown) => ({ where: async () => { deletes.push(table); } }),
  };
  return { db: db as never, inserts, updates, deletes };
}

const requester = { name: "Claimant", email: "Claimant@Hosp.com" };

describe("recovery approval is a cooling-off grant, not an immediate takeover", () => {
  it("creates a pending recovery invite and touches neither owner nor administrators", async () => {
    const { db, inserts, updates, deletes } = fakeDb({ admins: [{ userId: 2 }] });
    const grant = await createRecoveryGrant(db, { institutionId: 1, requester, reviewerUserId: 9, requestId: 100 });
    const invite = inserts.find((i) => i.table === institutionalAdminInvites)!.values;
    expect(invite).toMatchObject({ source: "recovery_approval", status: "pending", invitedEmail: "claimant@hosp.com" });
    expect(updates.some((u) => u.table === institutionalAccounts)).toBe(false);
    expect(deletes).toHaveLength(0);
    expect(grant.effectiveAt.getTime()).toBeGreaterThan(Date.now() + (RECOVERY_COOLING_OFF_DAYS - 1) * DAY);
  });

  it("records an audit event naming the reviewer and tells every current administrator", async () => {
    const { db, inserts } = fakeDb({ admins: [{ userId: 2 }, { userId: 3 }] });
    await createRecoveryGrant(db, { institutionId: 1, requester, reviewerUserId: 9, requestId: 100 });
    expect(inserts.find((i) => i.table === institutionalAdminEvents)!.values).toMatchObject({ eventType: "invited", actorUserId: 9 });
    const notified = inserts.filter((i) => i.table === inAppNotifications).flatMap((i) => i.values).map((n: { userId: number }) => n.userId).sort();
    expect(notified).toEqual([1, 2, 3]);
  });
});

describe("accepting a recovery grant", () => {
  const baseInvite = { id: 5, institutionalAccountId: 1, invitedEmail: "claimant@hosp.com", invitedName: "Claimant", invitedByUserId: null, source: "recovery_approval", status: "pending" };
  const claimant = { id: 40, email: "claimant@hosp.com" };

  it("is refused during the cooling-off period and changes nothing", async () => {
    const { db, inserts, updates, deletes } = fakeDb({ admins: [{ userId: 2 }], invite: { ...baseInvite, createdAt: new Date() } });
    await expect(acceptAdminInvite(db, claimant, 5)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(inserts).toHaveLength(0);
    expect(updates).toHaveLength(0);
    expect(deletes).toHaveLength(0);
  });

  it("fails closed when the grant has no creation time", async () => {
    const { db } = fakeDb({ invite: { ...baseInvite } });
    await expect(acceptAdminInvite(db, claimant, 5)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("after the cooling-off period transfers ownership and replaces the former administrators", async () => {
    const old = new Date(Date.now() - (RECOVERY_COOLING_OFF_DAYS + 1) * DAY);
    const { db, inserts, updates, deletes } = fakeDb({ admins: [{ userId: 2 }, { userId: 3 }], invite: { ...baseInvite, createdAt: old } });
    await acceptAdminInvite(db, claimant, 5);
    expect(updates.find((u) => u.table === institutionalAccounts)!.set).toMatchObject({ userId: 40 });
    expect(deletes).toContain(institutionalAccountAdmins);
    const events = inserts.filter((i) => i.table === institutionalAdminEvents).map((i) => i.values.eventType);
    expect(events).toContain("owner_transferred");
    expect(events.filter((e) => e === "removed")).toHaveLength(3); // owner 1 + admins 2, 3
  });

  it("an ordinary admin invite is not delayed", async () => {
    const { db } = fakeDb({ invite: { ...baseInvite, source: "admin_invite", createdAt: new Date() } });
    await expect(acceptAdminInvite(db, claimant, 5)).resolves.toEqual({ institutionalAccountId: 1 });
  });

  it("effective date is cooling-off days after creation", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    expect(recoveryEffectiveAt(start).getTime() - start.getTime()).toBe(RECOVERY_COOLING_OFF_DAYS * DAY);
  });
});

describe("a recovery grant that is never accepted lapses", () => {
  it("cannot be accepted after its 30-day window", async () => {
    const stale = new Date(Date.now() - 31 * DAY);
    const { db, updates } = fakeDb({ invite: { id: 5, institutionalAccountId: 1, invitedEmail: "claimant@hosp.com", invitedName: "C", invitedByUserId: null, source: "recovery_approval", status: "pending", createdAt: stale } });
    await expect(acceptAdminInvite(db, { id: 40, email: "claimant@hosp.com" }, 5)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(updates).toHaveLength(0);
  });
});
