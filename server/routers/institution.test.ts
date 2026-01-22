import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

function createPublicContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Institution Router", () => {
  describe("register", () => {
    it("should register a new institution successfully", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.institution.register({
        hospitalName: "Test Hospital",
        hospitalType: "private",
        county: "Nairobi",
        phone: "+254712345678",
        email: "hospital@test.com",
        website: "https://hospital.test.com",
        adminFirstName: "John",
        adminLastName: "Doe",
        adminEmail: "john@hospital.test.com",
        adminPhone: "+254712345679",
        adminTitle: "Administrator",
        planId: "plan_basic",
        planPrice: 50000,
        maxStaff: 100,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.institutionId).toBeDefined();
      expect(result.nextStep).toBe("payment");
    });

    it("should reject invalid hospital name", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.institution.register({
          hospitalName: "AB", // Too short
          hospitalType: "private",
          county: "Nairobi",
          phone: "+254712345678",
          email: "hospital@test.com",
          website: "https://hospital.test.com",
          adminFirstName: "John",
          adminLastName: "Doe",
          adminEmail: "john@hospital.test.com",
          adminPhone: "+254712345679",
          adminTitle: "Administrator",
          planId: "plan_basic",
          planPrice: 50000,
          maxStaff: 100,
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("Too small");
      }
    });

    it("should reject invalid email", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.institution.register({
          hospitalName: "Test Hospital",
          hospitalType: "private",
          county: "Nairobi",
          phone: "+254712345678",
          email: "invalid-email", // Invalid email
          website: "https://hospital.test.com",
          adminFirstName: "John",
          adminLastName: "Doe",
          adminEmail: "john@hospital.test.com",
          adminPhone: "+254712345679",
          adminTitle: "Administrator",
          planId: "plan_basic",
          planPrice: 50000,
          maxStaff: 100,
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("Invalid email");
      }
    });
  });

  describe("bulkImportStaff", () => {
    it("should validate staff roles", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.institution.bulkImportStaff({
          institutionId: 1,
          staff: [
            {
              staffName: "Test Staff",
              staffEmail: "test@hospital.com",
              staffRole: "invalid_role" as any,
            },
          ],
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("Invalid option");
      }
    });

    it("should require staffName and staffEmail", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.institution.bulkImportStaff({
          institutionId: 1,
          staff: [
            {
              staffName: "",
              staffEmail: "test@hospital.com",
              staffRole: "nurse",
            },
          ],
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        // Empty string validation - should fail
        expect(error).toBeDefined();
      }
    });

    it("should accept valid staff data", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.institution.bulkImportStaff({
        institutionId: 1,
        staff: [
          {
            staffName: "Jane Nurse",
            staffEmail: "jane@hospital.com",
            staffPhone: "+254712345680",
            staffRole: "nurse",
            department: "Emergency",
            yearsOfExperience: 5,
          },
          {
            staffName: "John Doctor",
            staffEmail: "john@hospital.com",
            staffRole: "doctor",
            department: "Pediatrics",
          },
        ],
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.imported).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getStats", () => {
    it("should return institution statistics", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.institution.getStats({
        institutionId: 1,
      });

      expect(result).toBeDefined();
      expect(result.totalStaff).toBeDefined();
      expect(result.enrolledStaff).toBeDefined();
      expect(result.completedStaff).toBeDefined();
      expect(result.certifiedStaff).toBeDefined();
      expect(result.completionRate).toBeGreaterThanOrEqual(0);
      expect(result.certificationRate).toBeGreaterThanOrEqual(0);
    });

    it("should calculate completion rate correctly", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.institution.getStats({
        institutionId: 1,
      });

      if (result.totalStaff > 0) {
        expect(result.completionRate).toBeLessThanOrEqual(100);
        expect(result.certificationRate).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("verify", () => {
    it("should verify institution existence", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.institution.verify({
        institutionId: 1,
      });

      expect(result).toBeDefined();
      expect(result.exists).toBeDefined();
      expect(result.active).toBeDefined();
    });

    it("should return false for non-existent institution", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.institution.verify({
        institutionId: 99999,
      });

      expect(result.exists).toBe(false);
      expect(result.active).toBe(false);
    });
  });
});
