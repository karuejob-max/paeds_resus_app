import { describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";

function createAuthContext(overrides?: Partial<User>): TrpcContext {
  const user: User = {
    id: 9001,
    openId: "role-test-user",
    email: "role-test@example.com",
    name: "Role Test",
    loginMethod: "manus",
    role: "user",
    userType: "individual",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("provider API role boundaries", () => {
  // userType "parent" was retired 2026-07 (migration 0069) and is no longer a valid
  // value in the User type. This test intentionally casts past that to keep regression
  // coverage for any stale/unmigrated row a production DB might still have mid-rollout --
  // the runtime check should still reject it even though new code can never produce it.
  it("denies stale 'parent'-typed rows on enrollment provider payment API", async () => {
    const caller = appRouter.createCaller(
      createAuthContext({
        userType: "parent" as unknown as "individual" | "institutional",
        role: "user",
        email: "parent@example.com",
      })
    );

    await expect(
      caller.enrollment.validatePromo({
        code: "TESTCODE",
        coursePrice: 20000,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows institutional users on courses provider enrollment API", async () => {
    const caller = appRouter.createCaller(
      createAuthContext({
        userType: "institutional",
        role: "user",
        email: "institution@example.com",
      })
    );

    const rows = await caller.courses.getUserEnrollments();
    expect(Array.isArray(rows)).toBe(true);
  });

  it("denies stale 'parent'-typed rows on instructor provider API", async () => {
    const caller = appRouter.createCaller(
      createAuthContext({
        userType: "parent" as unknown as "individual" | "institutional",
        role: "user",
        email: "parent2@example.com",
      })
    );

    await expect(caller.instructor.getStatus()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
