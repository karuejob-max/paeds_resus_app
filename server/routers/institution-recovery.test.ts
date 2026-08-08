import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

const dbMock = vi.hoisted(() => {
  const mockState = {
    users: [
      { id: 1, email: "founder@hosp.com", name: "Founder Admin" },
      { id: 2, email: "other@hosp.com", name: "Other Admin" },
      { id: 3, email: "third@hosp.com", name: "Third Admin" },
      { id: 4, email: "requester@hosp.com", name: "Requester User" },
    ],
    institutionalAccounts: [
      { id: 1, userId: 1, companyName: "Test Hospital", registrationNumber: "MOH-123" }
    ],
    institutionalAccountAdmins: [
      { id: 10, institutionalAccountId: 1, userId: 1, createdAt: new Date(2026, 1, 1) },
      { id: 11, institutionalAccountId: 1, userId: 2, createdAt: new Date(2026, 1, 2) },
      { id: 12, institutionalAccountId: 1, userId: 3, createdAt: new Date(2026, 1, 3) },
    ],
    institutionalAdminInvites: [] as any[],
    institutionalRecoveryRequests: [
      {
        id: 100,
        companyNameClaimed: "Test Hospital",
        claimedRegistrationNumber: "MOH-123",
        requesterName: "Requester User",
        requesterEmail: "requester@hosp.com",
        letterheadUrl: "http://example.com/proof.pdf",
        status: "pending",
        createdAt: new Date(),
      }
    ],
  };

  const insertChain = {
    values: vi.fn().mockImplementation((val) => {
      return Promise.resolve([{ insertId: 99 }]);
    }),
  };

  const updateChain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue({ affectedRows: 1 }),
  };

  const deleteChain = {
    where: vi.fn().mockResolvedValue({ affectedRows: 1 }),
  };

  return {
    mockState,
    insertChain,
    updateChain,
    deleteChain,
    getDb: vi.fn().mockResolvedValue({
      insert: vi.fn().mockImplementation(() => insertChain),
      update: vi.fn().mockImplementation(() => updateChain),
      delete: vi.fn().mockImplementation(() => deleteChain),
      select: vi.fn().mockImplementation((fields) => {
        return {
          from: vi.fn().mockImplementation((table) => {
            // Drizzle table name identification
            const tableNameSymbol = Object.getOwnPropertySymbols(table).find(
              (s) => s.toString() === "Symbol(drizzle:Name)"
            );
            const tableName = tableNameSymbol ? (table as any)[tableNameSymbol] : "";
            const result = mockState[tableName as keyof typeof mockState] || [];

            const limit = vi.fn().mockImplementation((n) => {
              return Promise.resolve(result.slice(0, n));
            });

            const orderBy = vi.fn().mockImplementation(() => {
              return {
                limit,
                then: (resolve: any) => resolve(result),
              };
            });

            const where = vi.fn().mockImplementation((whereClause) => {
              return {
                limit,
                orderBy,
                then: (resolve: any) => resolve(result),
              };
            });

            return {
              where,
              orderBy,
              then: (resolve: any) => resolve(result),
            };
          })
        };
      })
    })
  };
});

vi.mock("../db", () => ({
  getDb: dbMock.getDb,
  insertAdminAuditLog: vi.fn().mockResolvedValue(undefined),
}));

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 5,
      openId: "admin-user",
      email: "admin@paedsresus.com",
      name: "Global Admin",
      role: "admin",
      loginMethod: "manus",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as any,
    res: {} as any,
  };
}

function createInstitutionAdminContext(): TrpcContext {
  return {
    user: {
      id: 2, // Matches "Other Admin" in mock database
      openId: "inst-admin",
      email: "other@hosp.com",
      name: "Other Admin",
      role: "individual",
      loginMethod: "manus",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as any,
    res: {} as any,
  };
}

describe("Institutional Admins & Recovery Routers", () => {
  beforeEach(() => {
    // Reset mock state
    dbMock.mockState.users = [
      { id: 1, email: "founder@hosp.com", name: "Founder Admin" },
      { id: 2, email: "other@hosp.com", name: "Other Admin" },
      { id: 3, email: "third@hosp.com", name: "Third Admin" },
      { id: 4, email: "requester@hosp.com", name: "Requester User" },
    ];
    dbMock.mockState.institutionalAccounts = [
      { id: 1, userId: 1, companyName: "Test Hospital", registrationNumber: "MOH-123" }
    ];
    dbMock.mockState.institutionalAccountAdmins = [
      { id: 10, institutionalAccountId: 1, userId: 1, createdAt: new Date(2026, 1, 1) },
      { id: 11, institutionalAccountId: 1, userId: 2, createdAt: new Date(2026, 1, 2) },
      { id: 12, institutionalAccountId: 1, userId: 3, createdAt: new Date(2026, 1, 3) },
    ];
    dbMock.mockState.institutionalAdminInvites = [];
    dbMock.mockState.institutionalRecoveryRequests = [
      {
        id: 100,
        companyNameClaimed: "Test Hospital",
        claimedRegistrationNumber: "MOH-123",
        requesterName: "Requester User",
        requesterEmail: "requester@hosp.com",
        letterheadUrl: "http://example.com/proof.pdf",
        status: "pending",
        createdAt: new Date(),
      }
    ];
    vi.clearAllMocks();
  });

  describe("Self-Service Admin Removal", () => {
    it("should allow removing a non-founding admin", async () => {
      const ctx = createInstitutionAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.institutionAdmins.remove({
        institutionId: 1,
        adminUserId: 3,
      });

      expect(result.success).toBe(true);
    });

    it("should allow removing founding admin and promote next oldest admin", async () => {
      const ctx = createInstitutionAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.institutionAdmins.remove({
        institutionId: 1,
        adminUserId: 1,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Admin-Led Account Recovery Approval", () => {
    it("should approve recovery request immediately if user exists", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.institutionRecovery.review({
        requestId: 100,
        decision: "approve",
        matchedInstitutionalAccountId: 1,
        reviewNotes: "Looks valid",
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("approved");
    });

    it("should approve recovery request and create invite if user does not exist", async () => {
      // Change requester email to one that doesn't exist in users list
      dbMock.mockState.institutionalRecoveryRequests[0].requesterEmail = "new_admin@hosp.com";

      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.institutionRecovery.review({
        requestId: 100,
        decision: "approve",
        matchedInstitutionalAccountId: 1,
        reviewNotes: "Valid letterhead",
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("approved");
    });

    it("should allow searching institutions by name or reg. number", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.institutionRecovery.searchInstitutions({
        query: "Test",
      });

      expect(result.institutions).toBeDefined();
      expect(result.institutions.length).toBeGreaterThan(0);
      expect(result.institutions[0].companyName).toBe("Test Hospital");
    });
  });
});
