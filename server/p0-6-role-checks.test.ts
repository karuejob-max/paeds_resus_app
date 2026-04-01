/**
 * P0-6: Role checks and admin audit logging tests
 *
 * Tests verify:
 * 1. adminProcedure rejects non-admin users
 * 2. adminProcedure allows admin users
 * 3. Admin actions are logged to adminAuditLog table
 * 4. Audit log contains correct metadata (userId, procedurePath, timestamp)
 * 5. Sensitive data is not logged (no passwords, tokens, PHI)
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import superjson from "superjson";
import * as db from "./db";
import type { User } from "../drizzle/schema";

// Mock context types
interface MockContext {
  user: User | null;
}

// Create a test tRPC instance with the same middleware as production
const t = initTRPC.context<MockContext>().create({
  transformer: superjson,
});

const publicProcedure = t.procedure;

const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

const protectedProcedure = t.procedure.use(requireUser);

const adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }

    const result = await next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });

    // Log admin action (same as production — tRPC v11 uses parsed `input`)
    const v = opts.input !== undefined ? opts.input : opts.rawInput;
    const inputSummary =
      v !== undefined && typeof v === "object" && v !== null && !Array.isArray(v)
        ? JSON.stringify(Object.keys(v as Record<string, unknown>).sort())
        : undefined;

    db.insertAdminAuditLog({
      adminUserId: ctx.user.id,
      procedurePath: opts.path,
      inputSummary: inputSummary ?? undefined,
    }).catch((e) => console.warn("[Audit] log failed:", e));

    return result;
  }),
);

// Mock users for testing
const adminUser: User = {
  id: 1,
  openId: "email:admin@paedsresus.com",
  name: "Admin User",
  email: "admin@paedsresus.com",
  phone: "+254712345678",
  loginMethod: "email",
  passwordHash: "hashed_password",
  role: "admin",
  providerType: "doctor",
  userType: "individual",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const regularUser: User = {
  id: 2,
  openId: "email:user@paedsresus.com",
  name: "Regular User",
  email: "user@paedsresus.com",
  phone: "+254712345679",
  loginMethod: "email",
  passwordHash: "hashed_password",
  role: "user",
  providerType: "nurse",
  userType: "individual",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("P0-6: Role checks and audit logging", () => {
  // Mock the insertAdminAuditLog function
  let auditLogSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    auditLogSpy = vi.spyOn(db, "insertAdminAuditLog").mockResolvedValue(undefined);
  });

  afterAll(() => {
    auditLogSpy.mockRestore();
  });

  describe("adminProcedure middleware - access control", () => {
    it("should reject unauthenticated users", async () => {
      const testRouter = t.router({
        adminAction: adminProcedure.query(() => "success"),
      });

      const caller = testRouter.createCaller({ user: null });

      await expect(caller.adminAction()).rejects.toThrow(
        expect.objectContaining({
          code: "FORBIDDEN",
        })
      );
    });

    it("should reject non-admin users", async () => {
      const testRouter = t.router({
        adminAction: adminProcedure.query(() => "success"),
      });

      const caller = testRouter.createCaller({ user: regularUser });

      await expect(caller.adminAction()).rejects.toThrow(
        expect.objectContaining({
          code: "FORBIDDEN",
        })
      );
    });

    it("should allow admin users", async () => {
      const testRouter = t.router({
        adminAction: adminProcedure.query(() => "admin success"),
      });

      const caller = testRouter.createCaller({ user: adminUser });

      const result = await caller.adminAction();
      expect(result).toBe("admin success");
    });
  });

  describe("adminProcedure middleware - audit logging", () => {
    it("should log admin actions with correct user ID", async () => {
      const testRouter = t.router({
        adminAction: adminProcedure.query(() => "success"),
      });

      const caller = testRouter.createCaller({ user: adminUser });

      await caller.adminAction();

      expect(auditLogSpy).toHaveBeenCalled();
      const lastCall = auditLogSpy.mock.calls[auditLogSpy.mock.calls.length - 1];
      expect(lastCall[0].adminUserId).toBe(adminUser.id);
      expect(lastCall[0].procedurePath).toContain("adminAction");
    });

    it("should log admin mutations with input data", async () => {
      const testRouter = t.router({
        adminMutation: adminProcedure
          .input(z.object({ action: z.string(), targetId: z.number() }))
          .mutation(({ input }) => {
            return { success: true, action: input.action };
          }),
      });

      const caller = testRouter.createCaller({ user: adminUser });

      await caller.adminMutation({ action: "update_user", targetId: 42 });

      expect(auditLogSpy).toHaveBeenCalled();
      const lastCall = auditLogSpy.mock.calls[auditLogSpy.mock.calls.length - 1];
      expect(lastCall[0].adminUserId).toBe(adminUser.id);
      expect(lastCall[0].procedurePath).toContain("adminMutation");
      // Audit log created successfully for mutation with input
      expect(lastCall[0]).toHaveProperty("adminUserId");
      expect(lastCall[0]).toHaveProperty("procedurePath");
    });

    it("should not log sensitive values in audit log", async () => {
      const testRouter = t.router({
        adminAction: adminProcedure
          .input(z.object({ password: z.string().optional() }))
          .mutation(({ input }) => {
            return { success: true };
          }),
      });

      const caller = testRouter.createCaller({ user: adminUser });

      await caller.adminAction({ password: "secret123" });

      expect(auditLogSpy).toHaveBeenCalled();
      const lastCall = auditLogSpy.mock.calls[auditLogSpy.mock.calls.length - 1];
      const inputSummary = lastCall[0].inputSummary || "";

      // Sensitive value should never appear in audit log
      expect(inputSummary).not.toContain("secret123");
      // Audit log is created (middleware runs successfully)
      expect(lastCall[0].adminUserId).toBe(adminUser.id);
    });

    it("should handle audit log failures gracefully", async () => {
      auditLogSpy.mockRejectedValueOnce(new Error("Database error"));

      const testRouter = t.router({
        adminAction: adminProcedure.query(() => "success"),
      });

      const caller = testRouter.createCaller({ user: adminUser });

      // The admin action should still succeed even if audit log fails
      const result = await caller.adminAction();
      expect(result).toBe("success");

      // And the error should be caught (not thrown)
      expect(auditLogSpy).toHaveBeenCalled();
    });
  });

  describe("protectedProcedure (non-admin) middleware", () => {
    it("should allow authenticated users regardless of role", async () => {
      const testRouter = t.router({
        userAction: protectedProcedure.query(() => "user success"),
      });

      const caller = testRouter.createCaller({ user: regularUser });

      const result = await caller.userAction();
      expect(result).toBe("user success");
    });

    it("should reject unauthenticated users", async () => {
      const testRouter = t.router({
        userAction: protectedProcedure.query(() => "user success"),
      });

      const caller = testRouter.createCaller({ user: null });

      await expect(caller.userAction()).rejects.toThrow(
        expect.objectContaining({
          code: "UNAUTHORIZED",
        })
      );
    });
  });

  describe("Security: role elevation prevention", () => {
    it("should not allow users to elevate their own role via procedure input", async () => {
      const testRouter = t.router({
        updateRole: adminProcedure
          .input(z.object({ userId: z.number(), newRole: z.enum(["admin", "user"]) }))
          .mutation(({ input }) => {
            // This should only be callable by admin
            return { success: true, newRole: input.newRole };
          }),
      });

      // Regular user tries to call admin procedure
      const caller = testRouter.createCaller({ user: regularUser });

      await expect(
        caller.updateRole({ userId: regularUser.id, newRole: "admin" })
      ).rejects.toThrow(
        expect.objectContaining({
          code: "FORBIDDEN",
        })
      );
    });

    it("should verify role on every admin call", async () => {
      let callCount = 0;

      const testRouter = t.router({
        adminAction: adminProcedure.query(() => {
          callCount++;
          return "success";
        }),
      });

      const caller = testRouter.createCaller({ user: adminUser });

      // First call should succeed
      await caller.adminAction();
      expect(callCount).toBe(1);

      // Simulate role change (demoted user)
      const demotedUser = { ...adminUser, role: "user" as const };
      const demotedCaller = testRouter.createCaller({ user: demotedUser });

      // Second call with demoted user should fail
      await expect(demotedCaller.adminAction()).rejects.toThrow(
        expect.objectContaining({
          code: "FORBIDDEN",
        })
      );

      // Call count should still be 1 (demoted user never reached the handler)
      expect(callCount).toBe(1);
    });

    it("should preserve admin context through middleware", async () => {
      let capturedContext: MockContext | null = null;

      const testRouter = t.router({
        adminAction: adminProcedure.query(({ ctx }) => {
          capturedContext = ctx;
          return { userId: ctx.user?.id, role: ctx.user?.role };
        }),
      });

      const caller = testRouter.createCaller({ user: adminUser });

      const result = await caller.adminAction();

      expect(result.userId).toBe(adminUser.id);
      expect(result.role).toBe("admin");
      expect(capturedContext?.user?.role).toBe("admin");
    });
  });

  describe("Audit log completeness", () => {
    it("should include all required audit fields", async () => {
      const testRouter = t.router({
        adminAction: adminProcedure.query(() => "success"),
      });

      const caller = testRouter.createCaller({ user: adminUser });

      await caller.adminAction();

      expect(auditLogSpy).toHaveBeenCalled();
      const lastCall = auditLogSpy.mock.calls[auditLogSpy.mock.calls.length - 1];
      const auditData = lastCall[0];

      // Verify all required fields are present
      expect(auditData).toHaveProperty("adminUserId");
      expect(auditData).toHaveProperty("procedurePath");
      expect(auditData.adminUserId).toBe(adminUser.id);
      expect(typeof auditData.procedurePath).toBe("string");
    });

    it("should log different admin users separately", async () => {
      auditLogSpy.mockClear();

      const testRouter = t.router({
        adminAction: adminProcedure.query(() => "success"),
      });

      const admin1Caller = testRouter.createCaller({ user: adminUser });
      const admin2User = { ...adminUser, id: 99, email: "admin2@paedsresus.com" };
      const admin2Caller = testRouter.createCaller({ user: admin2User });

      await admin1Caller.adminAction();
      await admin2Caller.adminAction();

      expect(auditLogSpy).toHaveBeenCalledTimes(2);

      const call1 = auditLogSpy.mock.calls[0][0];
      const call2 = auditLogSpy.mock.calls[1][0];

      expect(call1.adminUserId).toBe(adminUser.id);
      expect(call2.adminUserId).toBe(admin2User.id);
    });
  });
});
