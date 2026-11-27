import { describe, expect, it, vi } from "vitest";
import {
  careFacilities,
  facilityMembershipRequests,
  inAppNotifications,
  institutionMemberships,
  institutionalAccountAdmins,
  institutionalAccounts,
  institutionalStaffMembers,
  providerProfiles,
} from "../../drizzle/schema";

vi.mock("../db", () => ({ getDb: vi.fn() }));

import { applyCpdFacilityRelationship } from "../services/facility-registry.service";

type Rows = {
  membership?: { id: number; userId: number | null; membershipStatus: string; staffMemberId: number | null } | null;
  staff?: { id: number; facilityLinkStatus: string; removedAt: Date | null; facilityDepartmentId: null; department: null; designation: string; enrollmentStatus: string } | null;
  request?: { id: number } | null;
  facility?: { id: number; name: string; county: string | null; country: string } | null;
  unverified?: boolean;
};

function fakeDb(rows: Rows) {
  const inserts: { table: unknown; values: any }[] = [];
  const updates: { table: unknown; set: any }[] = [];
  const result = (table: unknown): unknown[] => {
    if (table === institutionMemberships) return rows.membership ? [rows.membership] : [];
    if (table === institutionalStaffMembers) return rows.staff ? [rows.staff] : [];
    if (table === facilityMembershipRequests) return rows.request ? [rows.request] : [];
    if (table === careFacilities) return rows.facility === null ? [] : [rows.facility ?? { id: 3, name: "Test Hospital", county: "Nairobi", country: "Kenya" }];
    if (table === institutionalAccounts) return [{ ownerUserId: 1, verificationStatus: rows.unverified ? "unverified" : "verified" }];
    if (table === institutionalAccountAdmins) return [{ userId: 2 }];
    return [];
  };
  const db = {
    select: () => ({
      from: (table: unknown) => {
        const chain: any = {};
        chain.where = () => chain;
        chain.orderBy = () => chain;
        chain.limit = async () => result(table);
        chain.then = (resolve: (v: unknown[]) => unknown) => Promise.resolve(result(table)).then(resolve);
        return chain;
      },
    }),
    insert: (table: unknown) => ({ values: async (values: any) => { inserts.push({ table, values }); return [{ insertId: 55 }]; } }),
    update: (table: unknown) => ({ set: (set: any) => ({ where: async () => { updates.push({ table, set }); } }) }),
  };
  return { db: db as never, inserts, updates };
}

const staff = (over: Partial<NonNullable<Rows["staff"]>> = {}) => ({ id: 5, facilityLinkStatus: "pending", removedAt: null, facilityDepartmentId: null, department: null, designation: "other", enrollmentStatus: "pending", ...over });
const input = { institutionalAccountId: 9, userId: 42, staffName: "Nurse A", staffEmail: "A@Example.com", providerType: "nurse", relationship: "permanent_facility" as const };
const membershipInserts = (inserts: { table: unknown }[]) => inserts.filter((i) => i.table === institutionMemberships);
const membershipUpdates = (updates: { table: unknown }[]) => updates.filter((u) => u.table === institutionMemberships);

describe("CPD attendance raises a request; it never activates membership", () => {
  it("no membership: creates a pending request, no membership row, notifies admins", async () => {
    const { db, inserts, updates } = fakeDb({ staff: staff() });
    const result = await applyCpdFacilityRelationship(db, input);
    expect(result.status).toBe("request_pending");
    expect(membershipInserts(inserts)).toHaveLength(0);
    expect(membershipUpdates(updates)).toHaveLength(0);
    const request = inserts.find((i) => i.table === facilityMembershipRequests)!.values;
    expect(request).toMatchObject({ status: "pending", userId: 42, relationshipType: "permanent_staff", pendingRequestKey: "9:42", requesterEmail: "a@example.com" });
    const notice = inserts.find((i) => i.table === inAppNotifications)!.values;
    expect(notice.map((n: { userId: number }) => n.userId).sort()).toEqual([1, 2]);
  });

  it("the staff row is never marked linked by attendance alone", async () => {
    const { db, updates } = fakeDb({ staff: staff() });
    await applyCpdFacilityRelationship(db, input);
    expect(updates.filter((u) => u.table === institutionalStaffMembers && u.set.facilityLinkStatus === "linked")).toHaveLength(0);
  });

  it("an invited membership is NOT accepted on the person's behalf", async () => {
    const { db, updates } = fakeDb({ staff: staff(), membership: { id: 7, userId: 42, membershipStatus: "invited", staffMemberId: 5 } });
    const result = await applyCpdFacilityRelationship(db, input);
    expect(result.status).toBe("request_pending");
    expect(result.membershipStatus).toBe("invited");
    expect(membershipUpdates(updates)).toHaveLength(0);
  });

  it("an active member stays linked with no new request and the primary facility is updated", async () => {
    const { db, inserts, updates } = fakeDb({ staff: staff({ facilityLinkStatus: "linked" }), membership: { id: 7, userId: 42, membershipStatus: "active", staffMemberId: 5 } });
    const result = await applyCpdFacilityRelationship(db, input);
    expect(result.status).toBe("linked");
    expect(inserts.filter((i) => i.table === facilityMembershipRequests)).toHaveLength(0);
    expect(updates.some((u) => u.table === providerProfiles && u.set.facilityId === 3)).toBe(true);
  });

  it("a locum relationship does not change the primary facility", async () => {
    const { db, updates } = fakeDb({ staff: staff({ facilityLinkStatus: "linked" }), membership: { id: 7, userId: 42, membershipStatus: "active", staffMemberId: 5 } });
    await applyCpdFacilityRelationship(db, { ...input, relationship: "locum_outreach" });
    expect(updates.some((u) => u.table === providerProfiles)).toBe(false);
  });

  it("an existing pending request is not duplicated and admins are not re-notified", async () => {
    const { db, inserts } = fakeDb({ staff: staff(), request: { id: 12 } });
    const result = await applyCpdFacilityRelationship(db, input);
    expect(result.status).toBe("request_pending");
    expect(inserts.filter((i) => i.table === facilityMembershipRequests)).toHaveLength(0);
    expect(inserts.filter((i) => i.table === inAppNotifications)).toHaveLength(0);
  });

  it("a locum attendee's request carries the locum relationship type", async () => {
    const { db, inserts } = fakeDb({ staff: staff() });
    await applyCpdFacilityRelationship(db, { ...input, relationship: "locum_outreach" });
    expect(inserts.find((i) => i.table === facilityMembershipRequests)!.values.relationshipType).toBe("locum_outreach");
  });

  it("suspended, ended, rejected or removed relationships stay with the administrator", async () => {
    for (const rows of [
      { staff: staff(), membership: { id: 7, userId: 42, membershipStatus: "suspended", staffMemberId: 5 } },
      { staff: staff(), membership: { id: 7, userId: 42, membershipStatus: "ended", staffMemberId: 5 } },
      { staff: staff({ facilityLinkStatus: "rejected" }) },
      { staff: staff({ removedAt: new Date() }) },
    ] as Rows[]) {
      const { db, inserts } = fakeDb(rows);
      const result = await applyCpdFacilityRelationship(db, input);
      expect(result.status).toBe("admin_review_required");
      expect(inserts.filter((i) => i.table === facilityMembershipRequests)).toHaveLength(0);
    }
  });

  it("an institution with no facility record falls back to administrator review", async () => {
    const { db, inserts } = fakeDb({ staff: staff(), facility: null });
    const result = await applyCpdFacilityRelationship(db, input);
    expect(result.status).toBe("admin_review_required");
    expect(inserts.filter((i) => i.table === facilityMembershipRequests)).toHaveLength(0);
  });
});

describe("an unverified institution cannot receive CPD link requests", () => {
  it("creates no roster row, request or notification and asks for administrator review", async () => {
    const { db, inserts, updates } = fakeDb({ unverified: true });
    const result = await applyCpdFacilityRelationship(db, input);
    expect(result.status).toBe("admin_review_required");
    expect(inserts).toHaveLength(0);
    expect(updates).toHaveLength(0);
  });

  it("a person who is already an active member keeps their relationship", async () => {
    const { db, inserts } = fakeDb({
      unverified: true,
      staff: staff({ facilityLinkStatus: "linked" }),
      membership: { id: 7, userId: 42, membershipStatus: "active", staffMemberId: 5 },
    });
    const result = await applyCpdFacilityRelationship(db, input);
    expect(result.status).toBe("linked");
    expect(inserts.filter((i) => i.table === facilityMembershipRequests)).toHaveLength(0);
  });
});
