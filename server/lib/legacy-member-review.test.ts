import { describe, expect, it, vi } from "vitest";
import {
  facilityDepartments,
  inAppNotifications,
  institutionDepartmentHeads,
  institutionDepartmentResponseCoordinators,
  institutionEducationCoordinators,
  institutionMembershipEvents,
  institutionMembershipReviews,
  institutionMemberships,
  institutionProductRoles,
  institutionalStaffMembers,
} from "../../drizzle/schema";

const adminCheck = vi.hoisted(() => ({ isAdmin: false }));
vi.mock("./institution-access", () => ({ isInstitutionAdmin: vi.fn(async () => adminCheck.isAdmin) }));

import {
  assignLegacyMemberDepartment,
  confirmLegacyMember,
  flagNotInMyDepartment,
  listLegacyMembers,
  removeLegacyMember,
  resolveReviewScope,
  summariseReview,
  type ReviewRow,
  type ReviewScope,
} from "./legacy-member-review";

type Rows = {
  memberships?: any[];
  staff?: any[];
  reviews?: any[];
  productRoles?: any[];
  heads?: any[];
  education?: any[];
  response?: any[];
  departments?: any[];
};

function fakeDb(rows: Rows) {
  const inserts: { table: unknown; values: any }[] = [];
  const updates: { table: unknown; set: any }[] = [];
  const result = (table: unknown): unknown[] => {
    if (table === institutionMemberships) return rows.memberships ?? [];
    if (table === institutionalStaffMembers) return rows.staff ?? [];
    if (table === institutionMembershipReviews) return rows.reviews ?? [];
    if (table === institutionProductRoles) return rows.productRoles ?? [];
    if (table === institutionDepartmentHeads) return rows.heads ?? [];
    if (table === institutionEducationCoordinators) return rows.education ?? [];
    if (table === institutionDepartmentResponseCoordinators) return rows.response ?? [];
    if (table === facilityDepartments) return rows.departments ?? [];
    return [];
  };
  const exec: any = {
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
    insert: (table: unknown) => ({ values: async (values: any) => { inserts.push({ table, values }); return [{ insertId: 1 }]; } }),
    update: (table: unknown) => ({ set: (set: any) => ({ where: async () => { updates.push({ table, set }); } }) }),
  };
  exec.transaction = async (cb: (tx: unknown) => Promise<unknown>) => cb(exec);
  return { db: exec as never, inserts, updates };
}

const pending = (membershipId: number): ReviewRow => ({ id: membershipId * 10, decision: "legacy_pending", departmentId: null, reviewerUserId: null, note: null });
const reviewRow = (membershipId: number, over: Partial<ReviewRow> & { decision: ReviewRow["decision"] }) => ({ membershipId, id: membershipId * 10 + 1, departmentId: null, reviewerUserId: null, note: null, ...over });
const membership = (id: number, staffMemberId: number | null, userId: number | null = 100 + id) => ({ id, userId, staffMemberId, invitedEmail: `m${id}@example.com` });
const staffRow = (id: number, facilityDepartmentId: number | null, name = `Member ${id}`) => ({ id, staffName: name, department: facilityDepartmentId ? "Paediatrics" : null, facilityDepartmentId });
const institutionScope: ReviewScope = { tier: "institution", role: "institution_admin", departmentIds: null };
const deptScope: ReviewScope = { tier: "department", role: "department_head", departmentIds: [7] };
const user = { id: 9 };

describe("summariseReview", () => {
  const row = (id: number, decision: ReviewRow["decision"], over: Partial<ReviewRow> = {}): ReviewRow => ({ id, decision, departmentId: null, reviewerUserId: null, note: null, ...over });
  it("is open after legacy_pending and closed by confirmed or removed", () => {
    expect(summariseReview([row(1, "legacy_pending")]).open).toBe(true);
    expect(summariseReview([row(1, "legacy_pending"), row(2, "confirmed")])).toMatchObject({ open: false, closedAs: "confirmed" });
    expect(summariseReview([row(1, "legacy_pending"), row(2, "removed")])).toMatchObject({ open: false, closedAs: "removed" });
  });
  it("department flags keep it open and count; assigning a department resets them", () => {
    const flagged = summariseReview([row(1, "legacy_pending"), row(2, "not_in_my_department", { departmentId: 7, note: "Works in theatre" })]);
    expect(flagged.open).toBe(true);
    expect(flagged.flags).toHaveLength(1);
    const reassigned = summariseReview([row(1, "legacy_pending"), row(2, "not_in_my_department", { departmentId: 7 }), row(3, "department_assigned", { departmentId: 8 })]);
    expect(reassigned.flags).toHaveLength(0);
    expect(reassigned.open).toBe(true);
  });
  it("a member with no review rows is not open", () => {
    expect(summariseReview([]).open).toBe(false);
  });
});

describe("resolveReviewScope", () => {
  it("administrators and institution-level coordinators review the whole institution", async () => {
    adminCheck.isAdmin = true;
    expect(await resolveReviewScope(fakeDb({}).db, { id: 9 }, 3)).toMatchObject({ tier: "institution" });
    adminCheck.isAdmin = false;
    const { db } = fakeDb({ productRoles: [{ roleKey: "cpd_coordinator", userId: 9, invitedEmail: "x@example.com" }] });
    expect(await resolveReviewScope(db, { id: 9 }, 3)).toMatchObject({ tier: "institution", role: "cpd_coordinator" });
  });

  it("department heads, department CPD coordinators and department response coordinators review their departments", async () => {
    adminCheck.isAdmin = false;
    expect(await resolveReviewScope(fakeDb({ heads: [{ departmentId: 7 }] }).db, { id: 9 }, 3)).toEqual({ tier: "department", role: "department_head", departmentIds: [7] });
    expect(await resolveReviewScope(fakeDb({ education: [{ departmentId: 8 }] }).db, { id: 9 }, 3)).toMatchObject({ tier: "department", role: "department_cpd_coordinator", departmentIds: [8] });
    expect(await resolveReviewScope(fakeDb({ response: [{ departmentId: 7 }, { departmentId: 9 }] }).db, { id: 9 }, 3)).toMatchObject({ tier: "department", role: "department_response_coordinator", departmentIds: [7, 9] });
  });

  it("someone with no responsibility gets nothing", async () => {
    adminCheck.isAdmin = false;
    expect(await resolveReviewScope(fakeDb({}).db, { id: 9 }, 3)).toBeNull();
  });
});

describe("listing legacy members", () => {
  const rows: Rows = {
    memberships: [membership(1, 11), membership(2, 12), membership(3, 13), membership(4, 14)],
    staff: [staffRow(11, 7, "Ann"), staffRow(12, 8, "Ben"), staffRow(13, null, "Cara"), staffRow(14, 7, "Dan")],
    reviews: [
      reviewRow(1, { decision: "legacy_pending" }), reviewRow(2, { decision: "legacy_pending" }), reviewRow(3, { decision: "legacy_pending" }),
      reviewRow(4, { decision: "legacy_pending" }), reviewRow(4, { decision: "confirmed", id: 999 }),
    ],
  };

  it("institution-level reviewers see every open member, including unassigned ones; confirmed ones are gone", async () => {
    const list = await listLegacyMembers(fakeDb(rows).db, institutionScope, 3);
    expect(list.map((m) => m.name)).toEqual(["Ann", "Ben", "Cara"]);
    expect(list.find((m) => m.name === "Cara")!.unassigned).toBe(true);
  });

  it("department reviewers see only members of their own departments, never unassigned ones", async () => {
    const list = await listLegacyMembers(fakeDb(rows).db, deptScope, 3);
    expect(list.map((m) => m.name)).toEqual(["Ann"]);
  });

  it("flagged members sort first, and only institution-level reviewers see the notes", async () => {
    const flagged: Rows = { ...rows, reviews: [...rows.reviews!, reviewRow(2, { decision: "not_in_my_department", id: 500, departmentId: 8, note: "Works in theatre" })] };
    const list = await listLegacyMembers(fakeDb(flagged).db, institutionScope, 3);
    expect(list[0]).toMatchObject({ name: "Ben", flagCount: 1 });
    expect(list[0].flags[0].note).toBe("Works in theatre");
    const asDept = await listLegacyMembers(fakeDb(flagged).db, { tier: "department", role: "department_head", departmentIds: [8] }, 3);
    expect(asDept[0].flags).toEqual([]);
    expect(asDept[0].flagCount).toBe(1);
  });
});

describe("department reviewers pass people on; they cannot end anyone", () => {
  const one: Rows = { memberships: [membership(1, 11)], staff: [staffRow(11, 7)], reviews: [reviewRow(1, { decision: "legacy_pending" })] };

  it("'not in my department' records the flag and changes nothing else", async () => {
    const { db, inserts, updates } = fakeDb(one);
    await flagNotInMyDepartment(db, deptScope, user, { institutionId: 3, membershipId: 1, note: "Works in theatre" });
    expect(inserts.find((i) => i.table === institutionMembershipReviews)!.values).toMatchObject({ decision: "not_in_my_department", departmentId: 7, reviewerUserId: 9, reviewerRole: "department_head" });
    expect(updates).toHaveLength(0);
  });

  it("cannot flag someone outside their department", async () => {
    const { db, inserts } = fakeDb({ ...one, staff: [staffRow(11, 8)] });
    await expect(flagNotInMyDepartment(db, deptScope, user, { institutionId: 3, membershipId: 1, note: "x y z" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(inserts).toHaveLength(0);
  });

  it("cannot remove or reassign", async () => {
    const { db, updates } = fakeDb(one);
    await expect(removeLegacyMember(db, deptScope, user, { institutionId: 3, membershipId: 1, reason: "left" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(assignLegacyMemberDepartment(db, deptScope, user, { institutionId: 3, membershipId: 1, departmentId: 7 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(updates).toHaveLength(0);
  });

  it("institution-level reviewers decide directly rather than flag", async () => {
    const { db } = fakeDb(one);
    await expect(flagNotInMyDepartment(db, institutionScope, user, { institutionId: 3, membershipId: 1, note: "x y z" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("confirm", () => {
  it("records a confirmation for one member and ends nothing", async () => {
    const { db, inserts, updates } = fakeDb({ memberships: [membership(1, 11)], staff: [staffRow(11, 7)], reviews: [reviewRow(1, { decision: "legacy_pending" })] });
    await confirmLegacyMember(db, deptScope, user, { institutionId: 3, membershipId: 1 });
    expect(inserts.find((i) => i.table === institutionMembershipReviews)!.values).toMatchObject({ decision: "confirmed", reviewerRole: "department_head" });
    expect(updates).toHaveLength(0);
  });

  it("is refused for a member who is not waiting for review", async () => {
    const { db } = fakeDb({ memberships: [membership(1, 11)], staff: [staffRow(11, 7)], reviews: [] });
    await expect(confirmLegacyMember(db, institutionScope, user, { institutionId: 3, membershipId: 1 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("institution-level removal", () => {
  it("ends access with the shared cleanup, audits it, closes the review and tells the person", async () => {
    const { db, inserts, updates } = fakeDb({ memberships: [membership(1, 11)], staff: [staffRow(11, null)], reviews: [reviewRow(1, { decision: "legacy_pending" })] });
    await removeLegacyMember(db, institutionScope, user, { institutionId: 3, membershipId: 1, reason: "Not on our staff list" });
    expect(updates.find((u) => u.table === institutionMemberships)!.set).toMatchObject({ membershipStatus: "ended" });
    expect(updates.find((u) => u.table === institutionalStaffMembers)!.set).toMatchObject({ facilityLinkStatus: "rejected" });
    expect(inserts.find((i) => i.table === institutionMembershipEvents)!.values).toMatchObject({ eventType: "removed", actorUserId: 9 });
    expect(inserts.find((i) => i.table === institutionMembershipReviews)!.values).toMatchObject({ decision: "removed" });
    expect(inserts.find((i) => i.table === inAppNotifications)!.values).toMatchObject({ userId: 101 });
  });
});

describe("assigning a department", () => {
  const one: Rows = { memberships: [membership(1, 11)], staff: [staffRow(11, null)], reviews: [reviewRow(1, { decision: "legacy_pending" })] };

  it("sets the roster department and records it, leaving the review open", async () => {
    const { db, inserts, updates } = fakeDb({ ...one, departments: [{ id: 7, departmentName: "Paediatrics" }] });
    await assignLegacyMemberDepartment(db, institutionScope, user, { institutionId: 3, membershipId: 1, departmentId: 7 });
    expect(updates.find((u) => u.table === institutionalStaffMembers)!.set).toMatchObject({ facilityDepartmentId: 7, department: "Paediatrics" });
    expect(inserts.find((i) => i.table === institutionMembershipReviews)!.values).toMatchObject({ decision: "department_assigned", departmentId: 7 });
  });

  it("refuses a department that is not a current department of the institution", async () => {
    const { db, updates } = fakeDb({ ...one, departments: [] });
    await expect(assignLegacyMemberDepartment(db, institutionScope, user, { institutionId: 3, membershipId: 1, departmentId: 99 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(updates).toHaveLength(0);
  });
});
