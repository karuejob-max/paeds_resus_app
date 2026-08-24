import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "../_core/context";

const dbMock = vi.hoisted(() => {
  const state = {
    selectResponses: [] as Array<Array<Record<string, unknown>>>,
    db: null as any,
  };

  const db = {
    select: vi.fn(() => {
      const rows = state.selectResponses.shift() ?? [];
      return {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(rows),
        orderBy: vi.fn().mockResolvedValue(rows),
      };
    }),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    })),
    insert: vi.fn(() => ({
      values: vi.fn().mockResolvedValue([{ insertId: 901 }]),
    })),
    transaction: vi.fn(async (callback: (tx: typeof db) => Promise<unknown>) => callback(db)),
  };
  state.db = db;
  return state;
});

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(dbMock.db),
}));

vi.mock("../lib/institution-account-scopes", () => ({
  assertInstitutionAccountScope: vi.fn().mockResolvedValue({ scopeKey: "institution_admin" }),
}));

import { appRouter } from "../routers";

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "institution-admin-test",
      email: "admin@example.test",
      name: "Institution Admin",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

const staffRow = {
  id: 42,
  userId: 88,
  staffName: "Rejected Nurse",
  staffEmail: "nurse@example.test",
  removedAt: null,
};

describe("institution roster removal", () => {
  beforeEach(() => {
    dbMock.selectResponses = [];
    dbMock.db.select.mockClear();
    dbMock.db.update.mockClear();
    dbMock.db.insert.mockClear();
    dbMock.db.transaction.mockClear();
  });

  it("retires a rejected roster-only row without inventing a membership", async () => {
    dbMock.selectResponses.push([staffRow], []);
    const caller = appRouter.createCaller(createAdminContext());

    const result = await caller.institution.retireInstitutionStaffRecord({
      institutionId: 7,
      staffMemberId: 42,
      reason: "Rejected roster entry is no longer part of this institution.",
    });

    expect(result).toMatchObject({ success: true, status: "removed", alreadyRemoved: false });
    expect(dbMock.db.transaction).toHaveBeenCalledTimes(1);
    expect(dbMock.db.insert).toHaveBeenCalledTimes(1);
    expect(dbMock.db.update).toHaveBeenCalled();
  });

  it("refuses the staff-only path when an active membership exists", async () => {
    dbMock.selectResponses.push([staffRow], [{ id: 93 }]);
    const caller = appRouter.createCaller(createAdminContext());

    await expect(caller.institution.retireInstitutionStaffRecord({
      institutionId: 7,
      staffMemberId: 42,
      reason: "Use the membership removal workflow for this active member.",
    })).rejects.toThrow("Use the normal member removal workflow instead");

    expect(dbMock.db.transaction).not.toHaveBeenCalled();
    expect(dbMock.db.insert).not.toHaveBeenCalled();
  });
});

