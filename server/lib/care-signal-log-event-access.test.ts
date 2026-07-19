import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";

const { mockInsertValues, mockDb } = vi.hoisted(() => {
  const mockInsertValues = vi.fn().mockResolvedValue({ insertId: 901 });
  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(() => ({ values: mockInsertValues })),
  };
  return { mockInsertValues, mockDb };
});

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
  insertAdminAuditLog: vi.fn(),
}));

vi.mock("../services/analytics.service", () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../services/fellowship-progress.service", () => ({
  syncFellowshipProgressForUser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../services/facility-registry.service", () => ({
  resolveCanonicalFacilityId: vi.fn(async (id: number) => id),
  getFacilityById: vi.fn().mockResolvedValue({
    id: 1,
    name: "Test Hospital",
    county: "Nairobi",
    country: "Kenya",
  }),
  syncProviderProfileFacility: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../lib/care-signal-institutional-action", () => ({
  handleCareSignalInstitutionalFollowUp: vi.fn().mockResolvedValue(null),
}));

import { appRouter } from "../routers";

function drizzleSelectChain(result: unknown[]) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.from = self;
  chain.where = self;
  chain.orderBy = self;
  chain.limit = vi.fn().mockResolvedValue(result);
  return chain;
}

function createAuthContext(overrides?: Partial<User>): TrpcContext {
  const user: User = {
    id: 7001,
    openId: "care-signal-access-test",
    email: "provider@example.com",
    name: "Provider Test",
    loginMethod: "email",
    role: "user",
    userType: "individual",
    providerType: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const logEventInput = {
  eventDate: new Date().toISOString(),
  childAge: 48,
  eventType: "shock_sepsis",
  presentation: "Septic shock at triage",
  isAnonymous: false,
  facilityId: 1,
  chainOfSurvival: {
    recognition: true,
    activation: true,
    cpr: false,
    defibrillation: false,
    advancedCare: true,
    postResuscitation: false,
  },
  systemGaps: ["Training Gap"],
  gapDetails: { formVersion: "v2" },
  outcome: "survived",
  neurologicalStatus: "intact",
};

describe("careSignalEvents.logEvent access", () => {
  beforeEach(() => {
    mockInsertValues.mockClear();
    mockDb.select.mockReturnValue(drizzleSelectChain([]));
    mockInsertValues.mockResolvedValue({ insertId: 901 });
  });

  it("succeeds for individual provider without providerType profession", async () => {
    const caller = appRouter.createCaller(
      createAuthContext({ userType: "individual", providerType: null })
    );

    const result = await caller.careSignalEvents.logEvent(logEventInput);

    expect(result.success).toBe(true);
    expect(Number(result.eventId)).toBe(901);
    expect(mockInsertValues).toHaveBeenCalled();
  });

  it("blocks non-provider accounts (e.g. retired parent userType) and points to Safe-Truth", async () => {
    const caller = appRouter.createCaller(
      createAuthContext({ userType: "parent" as never, providerType: null, email: "parent@example.com" })
    );

    await expect(caller.careSignalEvents.logEvent(logEventInput)).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: expect.stringContaining("Safe-Truth"),
    });
    expect(mockInsertValues).not.toHaveBeenCalled();
  });
});
