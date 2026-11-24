import { describe, expect, it } from "vitest";
import {
  inAppNotifications,
  institutionalAccountAdmins,
  institutionalAccounts,
  institutionalAdminEvents,
  institutionalAdminInvites,
} from "../../drizzle/schema";
import { acceptAdminInvite, createAdminInvite, declineAdminInvite, revokeAdminInvite } from "./institution-admin-grants";

type Invite = { id: number; institutionalAccountId: number; invitedEmail: string; invitedName: string | null; invitedByUserId: number | null; source: string; status: string };
type Rows = { admins?: { id: number; userId: number }[]; existingAdmin?: { id: number } | null; pendingInvite?: { id: number } | null; invite?: Invite | null };

function fakeDb(rows: Rows) {
  const inserts: { table: unknown; values: any }[] = [];
  const updates: { table: unknown; set: any }[] = [];
  const result = (table: unknown, limited: boolean): unknown[] => {
    if (table === institutionalAccountAdmins) {
      // limit(1) is the "is this person already an admin?" lookup; the unlimited read is the admin list.
      return limited ? (rows.existingAdmin ? [rows.existingAdmin] : []) : (rows.admins ?? []);
    }
    if (table === institutionalAccounts) return [{ ownerUserId: 1, companyName: "Test Hospital" }];
    if (table === institutionalAdminInvites) {
      if (rows.invite) return [rows.invite];
      return rows.pendingInvite ? [rows.pendingInvite] : [];
    }
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
    insert: (table: unknown) => ({ values: async (values: any) => { inserts.push({ table, values }); return [{ insertId: 88 }]; } }),
    delete: () => ({ where: async () => undefined }),
    update: (table: unknown) => ({ set: (set: any) => ({ where: async () => { updates.push({ table, set }); } }) }),
  };
  return { db: db as never, inserts, updates };
}

const invitee = { id: 42, name: "Dr Second", email: "Second@Example.com" };
const invite = (over: Partial<Invite> = {}): Invite => ({ id: 9, institutionalAccountId: 5, invitedEmail: "second@example.com", invitedName: "Dr Second", invitedByUserId: 1, source: "admin_invite", status: "pending", ...over });
const adminInserts = (inserts: { table: unknown }[]) => inserts.filter((i) => i.table === institutionalAccountAdmins);
const eventInserts = (inserts: { table: unknown; values: any }[]) => inserts.filter((i) => i.table === institutionalAdminEvents).map((i) => i.values);

describe("administrator grants are invitations", () => {
  it("inviting an account creates a pending invite and NO admin row", async () => {
    const { db, inserts } = fakeDb({});
    const result = await createAdminInvite(db, { institutionId: 5, invitee, actorUserId: 1, source: "admin_invite" });
    expect(result).toEqual({ status: "invited", inviteId: 88 });
    expect(adminInserts(inserts)).toHaveLength(0);
    const row = inserts.find((i) => i.table === institutionalAdminInvites)!.values;
    expect(row).toMatchObject({ invitedEmail: "second@example.com", invitedByUserId: 1, source: "admin_invite", status: "pending" });
  });

  it("records an audit event and notifies the invitee and the other admins", async () => {
    const { db, inserts } = fakeDb({ admins: [{ id: 1, userId: 3 }] });
    await createAdminInvite(db, { institutionId: 5, invitee, actorUserId: 1, source: "registration" });
    expect(eventInserts(inserts)[0]).toMatchObject({ eventType: "invited", subjectUserId: 42, actorUserId: 1, inviteId: 88 });
    const notices = inserts.filter((i) => i.table === inAppNotifications).flatMap((i) => i.values);
    expect(notices.map((n: { userId: number }) => n.userId).sort()).toEqual([3, 42]);
  });

  it("an existing administrator or pending invite is not duplicated", async () => {
    const a = fakeDb({ existingAdmin: { id: 1 } });
    expect((await createAdminInvite(a.db, { institutionId: 5, invitee, actorUserId: 1, source: "admin_invite" })).status).toBe("already_admin");
    expect(a.inserts).toHaveLength(0);
    const b = fakeDb({ pendingInvite: { id: 4 } });
    expect(await createAdminInvite(b.db, { institutionId: 5, invitee, actorUserId: 1, source: "admin_invite" })).toEqual({ status: "already_invited", inviteId: 4 });
    expect(b.inserts).toHaveLength(0);
  });

  it("accepting adds the admin row, closes the invite, records the event and tells the others", async () => {
    const { db, inserts, updates } = fakeDb({ invite: invite(), admins: [{ id: 1, userId: 3 }] });
    await acceptAdminInvite(db, { id: 42, email: "second@example.com" }, 9);
    expect(adminInserts(inserts)[0].values).toMatchObject({ institutionalAccountId: 5, userId: 42, addedByUserId: 1 });
    expect(updates.find((u) => u.table === institutionalAdminInvites)!.set).toMatchObject({ status: "accepted" });
    expect(eventInserts(inserts)[0]).toMatchObject({ eventType: "accepted", subjectUserId: 42, actorUserId: 42 });
    expect(inserts.some((i) => i.table === inAppNotifications)).toBe(true);
  });

  it("a recovery grant past its cooling-off period transfers ownership and says so in the audit", async () => {
    const { db, inserts, updates } = fakeDb({ invite: invite({ source: "recovery_approval", invitedByUserId: null, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }) });
    await acceptAdminInvite(db, { id: 42, email: "second@example.com" }, 9);
    expect(updates.find((u) => u.table === institutionalAccounts)!.set).toMatchObject({ userId: 42 });
    expect(eventInserts(inserts).map((e) => e.eventType)).toContain("owner_transferred");
  });

  it("declining adds no admin row and is recorded", async () => {
    const { db, inserts, updates } = fakeDb({ invite: invite() });
    await declineAdminInvite(db, { id: 42, email: "second@example.com" }, 9);
    expect(adminInserts(inserts)).toHaveLength(0);
    expect(updates.find((u) => u.table === institutionalAdminInvites)!.set).toMatchObject({ status: "declined" });
    expect(eventInserts(inserts)[0]).toMatchObject({ eventType: "declined", actorUserId: 42 });
  });

  it("someone else's invite, or one already answered, cannot be accepted or declined", async () => {
    const { db } = fakeDb({ invite: null });
    await expect(acceptAdminInvite(db, { id: 42, email: "second@example.com" }, 9)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(declineAdminInvite(db, { id: 42, email: "second@example.com" }, 9)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(acceptAdminInvite(db, { id: 42, email: null }, 9)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("revoking cancels a pending invite and records who did it", async () => {
    const { db, inserts, updates } = fakeDb({ invite: invite() });
    await revokeAdminInvite(db, 1, 5, 9);
    expect(updates.find((u) => u.table === institutionalAdminInvites)!.set).toMatchObject({ status: "revoked" });
    expect(eventInserts(inserts)[0]).toMatchObject({ eventType: "revoked", actorUserId: 1 });
    const none = fakeDb({ invite: null });
    await expect(revokeAdminInvite(none.db, 1, 5, 9)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
