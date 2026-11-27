import { describe, expect, it, vi } from "vitest";
import { institutionMemberships, institutionalStaffMembers } from "../../drizzle/schema";

vi.mock("../db", () => ({ getDb: vi.fn() }));

import { reconcileInstitutionalStaffMember } from "../services/facility-registry.service";

type StaffRow = { id: number; facilityLinkStatus: string; removedAt: Date | null; facilityDepartmentId: number | null; department: string | null; designation: string; enrollmentStatus: string };

function fakeDb(rows: { membership?: { membershipStatus: string } | null; staff?: StaffRow | null }) {
  const inserts: Record<string, unknown>[] = [];
  const updates: Record<string, unknown>[] = [];
  const query = (table: unknown) => {
    const result = () => {
      if (table === institutionMemberships) return rows.membership ? [rows.membership] : [];
      if (table === institutionalStaffMembers) return rows.staff ? [rows.staff] : [];
      return [];
    };
    const chain: Record<string, unknown> = {};
    chain.where = () => chain;
    chain.orderBy = () => chain;
    chain.limit = async () => result();
    return chain;
  };
  const db = {
    select: () => ({ from: (table: unknown) => query(table) }),
    insert: () => ({ values: async (v: Record<string, unknown>) => { inserts.push(v); return [{ insertId: 91 }]; } }),
    update: () => ({ set: (v: Record<string, unknown>) => ({ where: async () => { updates.push(v); } }) }),
  };
  return { db: db as never, inserts, updates };
}

const base = { institutionalAccountId: 9, userId: 42, staffName: "Nurse", staffEmail: "n@example.com", providerType: "nurse" };
const staffRow = (over: Partial<StaffRow> = {}): StaffRow => ({ id: 5, facilityLinkStatus: "pending", removedAt: null, facilityDepartmentId: null, department: null, designation: "other", enrollmentStatus: "pending", ...over });

describe("facility selection must not create institution roster rows", () => {
  it("passive selection (createIfMissing=false) with no relationship inserts nothing", async () => {
    const { db, inserts, updates } = fakeDb({});
    const result = await reconcileInstitutionalStaffMember(db, { ...base, createIfMissing: false });
    expect(result.staffMemberId).toBeNull();
    expect(inserts).toHaveLength(0);
    expect(updates).toHaveLength(0);
  });

  it("passive selection with only an invited membership still inserts nothing", async () => {
    const { db, inserts } = fakeDb({ membership: { membershipStatus: "invited" } });
    await reconcileInstitutionalStaffMember(db, { ...base, createIfMissing: false });
    expect(inserts).toHaveLength(0);
  });

  it("passive selection refreshes an existing roster row", async () => {
    const { db, inserts, updates } = fakeDb({ staff: staffRow() });
    const result = await reconcileInstitutionalStaffMember(db, { ...base, createIfMissing: false });
    expect(result.staffMemberId).toBe(5);
    expect(inserts).toHaveLength(0);
    expect(updates).toHaveLength(1);
  });

  it("passive selection still maintains an active member's row", async () => {
    const { db, inserts } = fakeDb({ membership: { membershipStatus: "active" } });
    const result = await reconcileInstitutionalStaffMember(db, { ...base, createIfMissing: false });
    expect(result.facilityLinkStatus).toBe("linked");
    expect(inserts).toHaveLength(1);
  });

  it("explicit flows (default) still create the row as pending", async () => {
    const { db, inserts } = fakeDb({});
    const result = await reconcileInstitutionalStaffMember(db, base);
    expect(result.staffMemberId).toBe(91);
    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toMatchObject({ facilityLinkStatus: "pending" });
  });

  it("a retired roster row is never revived", async () => {
    const { db, inserts, updates } = fakeDb({ staff: staffRow({ removedAt: new Date() }) });
    const result = await reconcileInstitutionalStaffMember(db, { ...base, createIfMissing: false });
    expect(result.facilityLinkStatus).toBe("rejected");
    expect(inserts).toHaveLength(0);
    expect(updates).toHaveLength(0);
  });
});
