import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

function publicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function authenticatedContext(): TrpcContext {
  return {
    ...publicContext(),
    user: {
      id: 1,
      openId: "phase3-test-user",
      email: "phase3@example.com",
      name: "Phase 3 Test User",
      role: "admin",
      loginMethod: "manus",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
  } as TrpcContext;
}

describe("institution accountability Phase 3 read procedure", () => {
  it("is exposed as a query without changing the existing active-only procedure", () => {
    expect(appRouter._def.procedures["institutionAccountability.listDepartmentHeadAppointments"]).toBeDefined();
    expect(appRouter._def.procedures["institutionAccountability.listDepartmentHeads"]).toBeDefined();
  });

  it("keeps the new procedure behind protected authentication and validates institution IDs", async () => {
    await expect(appRouter.createCaller(publicContext()).institutionAccountability.listDepartmentHeadAppointments({ institutionId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(appRouter.createCaller(authenticatedContext()).institutionAccountability.listDepartmentHeadAppointments({ institutionId: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
