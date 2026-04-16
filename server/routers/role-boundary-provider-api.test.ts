import { describe, expect, it } from "vitest";
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
  it("denies parent users on enrollment provider payment API", async () => {
    const caller = appRouter.createCaller(
      createAuthContext({ userType: "parent", role: "user", email: "parent@example.com" })
    );

    await expect(
      caller.enrollment.validatePromo({
        code: "TESTCODE",
        coursePrice: 20000,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("denies institutional users on courses provider enrollment API", async () => {
    const caller = appRouter.createCaller(
      createAuthContext({
        userType: "institutional",
        role: "user",
        email: "institution@example.com",
      })
    );

    await expect(caller.courses.getUserEnrollments()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("denies parent users on instructor provider API", async () => {
    const caller = appRouter.createCaller(
      createAuthContext({ userType: "parent", role: "user", email: "parent2@example.com" })
    );

    await expect(caller.instructor.getStatus()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
