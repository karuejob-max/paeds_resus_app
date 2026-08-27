import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";

const { getDbMock, selectRows, insertValues } = vi.hoisted(() => ({
  getDbMock: vi.fn(),
  selectRows: vi.fn<() => unknown[]>(() => []),
  insertValues: vi.fn(),
}));

vi.mock("../db", () => ({ getDb: getDbMock }));

import { appRouter } from "../routers";
import { sanitizeEventData } from "./resus-event";

function createDbMock() {
  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => selectRows()),
        })),
      })),
    })),
    insert: vi.fn(() => ({ values: insertValues })),
  };
}

function createAuthContext(overrides?: Partial<User>): TrpcContext {
  const user: User = {
    id: 42,
    openId: "resus-event-test",
    email: "resus-event@test.com",
    name: "Synthetic Tester",
    loginMethod: "test",
    role: "user",
    userType: "individual",
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

describe("resusEvent.append", () => {
  beforeEach(() => {
    selectRows.mockReset();
    selectRows.mockReturnValue([]);
    insertValues.mockReset();
    insertValues.mockResolvedValue(undefined);
    getDbMock.mockReset();
    getDbMock.mockResolvedValue(createDbMock());
  });

  it("redacts patient identifiers before event data is serialized", () => {
    const serialized = sanitizeEventData({
      patientName: "Synthetic Patient",
      mrn: "TEST-001",
      patientAge: "5 years",
      finding: "wheeze",
      nested: { nationalId: "never-store", value: 94 },
    });
    expect(serialized).toBe(JSON.stringify({ patientAge: "5 years", finding: "wheeze", nested: { value: 94 } }));
  });

  it("inserts a synthetic event and returns an idempotent acknowledgement", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const input = {
      localEventId: "evt-test-0001",
      sessionId: "resus-test-session",
      eventType: "finding" as const,
      letter: "B" as const,
      detail: "Synthetic wheeze finding",
      eventData: { patientName: "Do not store", finding: "wheeze" },
      eventTimestamp: Date.now(),
    };

    const first = await caller.resusEvent.append(input);
    expect(first).toEqual({ success: true, alreadyExists: false, serverEventId: input.localEventId });
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({
      localEventId: input.localEventId,
      userId: 42,
      eventData: JSON.stringify({ finding: "wheeze" }),
    }));

    selectRows.mockReturnValue([{
      localEventId: input.localEventId,
      sessionId: input.sessionId,
      userId: 42,
      activationEventId: null,
    }]);
    const retry = await caller.resusEvent.append(input);
    expect(retry).toEqual({ success: true, alreadyExists: true, serverEventId: input.localEventId });
  });

  it("fails closed when a caller is not an active member of an activation case", async () => {
    const db = createDbMock();
    const selectMock = db.select;
    selectMock.mockImplementationOnce(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => [{ id: 7, institutionalAccountId: 9, activatedByUserId: 99 }]),
        })),
      })),
    })).mockImplementationOnce(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => []),
        })),
      })),
    }));
    getDbMock.mockResolvedValue(db);
    const caller = appRouter.createCaller(createAuthContext({ id: 42 }));

    await expect(caller.resusEvent.append({
      localEventId: "evt-test-0002",
      sessionId: "resus-test-session",
      activationEventId: 7,
      eventType: "phase_change",
      detail: "Synthetic phase change",
      eventTimestamp: Date.now(),
    })).rejects.toMatchObject<TRPCError>({ code: "FORBIDDEN" });
  });
});
