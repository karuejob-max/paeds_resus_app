import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "../_core/context";
import { institutionalActionLogs } from "../../drizzle/schema";

const { mockInsertValues, mockDb, mockAssertAccess, mockAudit, userRows } = vi.hoisted(() => {
  const mockInsertValues = vi.fn().mockResolvedValue({ insertId: 1 });
  const userRows: { current: unknown[] } = { current: [] };
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.from = self;
  chain.where = self;
  chain.orderBy = self;
  chain.limit = vi.fn(async () => userRows.current);
  const mockDb = { select: vi.fn(() => chain), insert: vi.fn(() => ({ values: mockInsertValues })) };
  return { mockInsertValues, mockDb, mockAssertAccess: vi.fn(), mockAudit: vi.fn(), userRows };
});

vi.mock("../db", () => ({ getDb: vi.fn().mockResolvedValue(mockDb), insertAdminAuditLog: vi.fn() }));
vi.mock("./institution-access", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./institution-access")>()),
  assertInstitutionAccess: (...args: unknown[]) => mockAssertAccess(...args),
}));
vi.mock("./resusgps-auditor", () => ({
  runResusGpsAuditForInstitution: (...args: unknown[]) => mockAudit(...args),
}));

import { institutionRouter } from "../routers/institution";
import { resetAccountSearchRateLimitState, ACCOUNT_SEARCH_MAX_PER_MINUTE } from "./account-directory-guard";

function ctx(id = 5001): TrpcContext {
  return {
    user: {
      id,
      openId: `u-${id}`,
      email: "someone@example.com",
      name: "Some One",
      loginMethod: "email",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as TrpcContext["user"],
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const forbidden = () => new TRPCError({ code: "FORBIDDEN", message: "not your institution" });

describe("institution access hardening", () => {
  beforeEach(() => {
    mockAssertAccess.mockReset();
    mockAudit.mockReset();
    mockInsertValues.mockClear();
    mockDb.insert.mockClear();
    userRows.current = [];
    resetAccountSearchRateLimitState();
  });

  describe("runResusGpsAudit", () => {
    it("rejects a caller who is not an admin of that institution, before any clinical data is read", async () => {
      mockAssertAccess.mockRejectedValue(forbidden());
      await expect(institutionRouter.createCaller(ctx()).runResusGpsAudit({ institutionId: 99 })).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(mockAudit).not.toHaveBeenCalled();
      expect(mockAssertAccess).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: 5001 }), 99);
    });

    it("runs the audit for an authorised caller", async () => {
      mockAssertAccess.mockResolvedValue(undefined);
      mockAudit.mockResolvedValue({ success: true, scannedCasesCount: 0, averageDepthScore: 0, findings: [] });
      const result = await institutionRouter.createCaller(ctx()).runResusGpsAudit({ institutionId: 10 });
      expect(result.success).toBe(true);
      expect(mockAudit).toHaveBeenCalledWith(expect.anything(), 10);
    });
  });

  describe("importResusGpsAuditAction", () => {
    const input = { institutionId: 99, gapIdentified: "Gap", systemChange: "Change" };

    it("never writes into another institution's action log", async () => {
      mockAssertAccess.mockRejectedValue(forbidden());
      await expect(institutionRouter.createCaller(ctx()).importResusGpsAuditAction(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it("writes for an authorised caller, recording who did it", async () => {
      mockAssertAccess.mockResolvedValue(undefined);
      await institutionRouter.createCaller(ctx(7)).importResusGpsAuditAction(input);
      expect(mockDb.insert).toHaveBeenCalledWith(institutionalActionLogs);
      expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({ institutionalAccountId: 99, createdByUserId: 7, status: "open" }));
    });

    it("rejects oversized text", async () => {
      mockAssertAccess.mockResolvedValue(undefined);
      await expect(
        institutionRouter.createCaller(ctx()).importResusGpsAuditAction({ ...input, gapIdentified: "x".repeat(4001) })
      ).rejects.toBeTruthy();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  it("no longer exposes the public institution existence check", () => {
    const procedures = Object.keys((institutionRouter as unknown as { _def: { procedures: Record<string, unknown> } })._def.procedures);
    expect(procedures).toContain("runResusGpsAudit"); // sanity: we are reading the right router
    expect(procedures).not.toContain("verify");
  });

  describe("searchPlatformAccounts", () => {
    it("masks emails for name searches", async () => {
      userRows.current = [{ id: 1, name: "Jane Doe", email: "jane@example.com" }];
      const rows = await institutionRouter.createCaller(ctx()).searchPlatformAccounts({ query: "jane", limit: 8 });
      expect(rows).toEqual([{ id: 1, name: "Jane Doe", email: "j***@example.com" }]);
    });

    it("returns the full address only when the caller typed it completely", async () => {
      userRows.current = [{ id: 1, name: "Jane Doe", email: "jane@example.com" }];
      const rows = await institutionRouter.createCaller(ctx()).searchPlatformAccounts({ query: "jane@example.com", limit: 8 });
      expect(rows[0]?.email).toBe("jane@example.com");
    });

    it("rate-limits repeated searches by the same user", async () => {
      const caller = institutionRouter.createCaller(ctx(8801));
      for (let i = 0; i < ACCOUNT_SEARCH_MAX_PER_MINUTE; i++) {
        await caller.searchPlatformAccounts({ query: "ab", limit: 8 });
      }
      await expect(caller.searchPlatformAccounts({ query: "ab", limit: 8 })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    });
  });
});
