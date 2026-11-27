import { describe, expect, it } from "vitest";
import { institutionalAccountAdmins, institutionalAccounts, institutionalStaffMembers, institutionVerificationEvents } from "../../drizzle/schema";
import { archiveInstitution, restoreInstitution, reviewInstitutionVerification, submitVerificationEvidence } from "./institution-verification";

function fakeDb(opts: { account?: Record<string, unknown> | null; otherAdmins?: number; activeMembers?: number }) {
  const inserts: { table: unknown; values: any }[] = [];
  const updates: { table: unknown; set: any }[] = [];
  const rows = (table: unknown): unknown[] => {
    if (table === institutionalAccounts) return opts.account === null ? [] : [{ ownerUserId: 1, verificationStatus: "unverified", archivedAt: null, ...opts.account }];
    if (table === institutionalAccountAdmins) return [{ total: opts.otherAdmins ?? 0 }];
    if (table === institutionalStaffMembers) return [{ total: opts.activeMembers ?? 0 }];
    return [];
  };
  const db = {
    select: () => ({
      from: (table: unknown) => {
        const chain: any = {};
        chain.where = () => chain;
        chain.limit = async () => rows(table);
        chain.then = (resolve: (v: unknown[]) => unknown) => Promise.resolve(rows(table)).then(resolve);
        return chain;
      },
    }),
    insert: (table: unknown) => ({ values: async (values: any) => { inserts.push({ table, values }); } }),
    update: (table: unknown) => ({ set: (set: any) => ({ where: async () => { updates.push({ table, set }); } }) }),
  };
  return { db: db as never, inserts, updates };
}

describe("archiveInstitution", () => {
  it("archives a duplicate and records who did it and why", async () => {
    const { db, inserts, updates } = fakeDb({});
    await archiveInstitution(db, { institutionId: 1, actorUserId: 9, reason: "Typo duplicate of #3" });
    expect(updates[0].set).toMatchObject({ archivedByUserId: 9, archiveReason: "Typo duplicate of #3" });
    expect(updates[0].set.archivedAt).toBeInstanceOf(Date);
    const event = inserts.find((i) => i.table === institutionVerificationEvents)!.values;
    expect(event).toMatchObject({ eventType: "archived", actorUserId: 9, institutionalAccountId: 1 });
  });

  it("requires a reason", async () => {
    const { db, updates } = fakeDb({});
    await expect(archiveInstitution(db, { institutionId: 1, actorUserId: 9, reason: " " })).rejects.toThrow(/reason/i);
    expect(updates).toHaveLength(0);
  });

  it("refuses a verified institution", async () => {
    const { db, updates } = fakeDb({ account: { verificationStatus: "verified" } });
    await expect(archiveInstitution(db, { institutionId: 1, actorUserId: 9, reason: "dup" })).rejects.toThrow(/Revoke/);
    expect(updates).toHaveLength(0);
  });

  it("refuses when there are other administrators", async () => {
    const { db, updates } = fakeDb({ otherAdmins: 1 });
    await expect(archiveInstitution(db, { institutionId: 1, actorUserId: 9, reason: "dup" })).rejects.toThrow(/other administrators/);
    expect(updates).toHaveLength(0);
  });

  it("refuses when there are active members", async () => {
    const { db, updates } = fakeDb({ activeMembers: 3 });
    await expect(archiveInstitution(db, { institutionId: 1, actorUserId: 9, reason: "dup" })).rejects.toThrow(/active members/);
    expect(updates).toHaveLength(0);
  });

  it("refuses an already archived institution and an unknown one", async () => {
    await expect(archiveInstitution(fakeDb({ account: { archivedAt: new Date() } }).db, { institutionId: 1, actorUserId: 9, reason: "dup" })).rejects.toThrow(/already archived/);
    await expect(archiveInstitution(fakeDb({ account: null }).db, { institutionId: 1, actorUserId: 9, reason: "dup" })).rejects.toThrow(/not found/i);
  });
});

describe("restoreInstitution", () => {
  it("restores an archived institution and records it", async () => {
    const { db, inserts, updates } = fakeDb({ account: { archivedAt: new Date() } });
    await restoreInstitution(db, { institutionId: 1, actorUserId: 9, reason: "Archived by mistake" });
    expect(updates[0].set).toEqual({ archivedAt: null, archivedByUserId: null, archiveReason: null });
    expect(inserts.find((i) => i.table === institutionVerificationEvents)!.values).toMatchObject({ eventType: "restored" });
  });

  it("refuses an institution that is not archived", async () => {
    await expect(restoreInstitution(fakeDb({}).db, { institutionId: 1, actorUserId: 9, reason: "x y z" })).rejects.toThrow(/not archived/);
  });
});

describe("archived institutions cannot be verified or sent evidence", () => {
  it("refuses verify and evidence while archived", async () => {
    const archived = { archivedAt: new Date() };
    await expect(reviewInstitutionVerification(fakeDb({ account: archived }).db, { institutionId: 1, reviewerUserId: 9, decision: "verify", note: "ok ok" })).rejects.toThrow(/archived/);
    await expect(submitVerificationEvidence(fakeDb({ account: archived }).db, { institutionId: 1, actorUserId: 9, method: "letterhead", evidenceUrl: "https://x.org/a" })).rejects.toThrow(/archived/);
  });
});
