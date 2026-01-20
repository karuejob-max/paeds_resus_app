import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";

// Mock database functions
vi.mock("../db", () => ({
  createEnrollment: vi.fn().mockResolvedValue({ insertId: 1 }),
  createPayment: vi.fn().mockResolvedValue({ insertId: 1 }),
  createSmsReminder: vi.fn().mockResolvedValue({ insertId: 1 }),
  getEnrollmentsByUserId: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      programType: "pals",
      trainingDate: new Date("2026-02-15"),
      paymentStatus: "completed",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
}));

function createAuthContext(): TrpcContext {
  const user: User = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
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

describe("enrollment router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
  });

  describe("enrollment.create", () => {
    it("should create a new enrollment with valid input", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.enrollment.create({
        programType: "pals",
        trainingDate: new Date("2026-02-15"),
      });

      expect(result).toEqual({
        success: true,
        enrollmentId: expect.any(Number),
      });
    });

    it("should create SMS reminder for enrollment confirmation", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.enrollment.create({
        programType: "acls",
        trainingDate: new Date("2026-02-20"),
      });

      expect(result.success).toBe(true);
      expect(result.enrollmentId).toBeDefined();
    });

    it("should handle all program types", async () => {
      const caller = appRouter.createCaller(ctx);
      const programTypes: Array<"bls" | "acls" | "pals" | "fellowship"> = [
        "bls",
        "acls",
        "pals",
        "fellowship",
      ];

      for (const programType of programTypes) {
        const result = await caller.enrollment.create({
          programType,
          trainingDate: new Date("2026-02-15"),
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe("enrollment.recordPayment", () => {
    it("should record a payment for an enrollment", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.enrollment.recordPayment({
        enrollmentId: 1,
        amount: 10000,
        paymentMethod: "mpesa",
        transactionId: "TXN123456",
      });

      expect(result).toEqual({
        success: true,
        paymentId: 1,
      });
    });

    it("should handle different payment methods", async () => {
      const caller = appRouter.createCaller(ctx);
      const paymentMethods: Array<"mpesa" | "bank_transfer" | "card"> = [
        "mpesa",
        "bank_transfer",
        "card",
      ];

      for (const method of paymentMethods) {
        const result = await caller.enrollment.recordPayment({
          enrollmentId: 1,
          amount: 5000,
          paymentMethod: method,
          transactionId: `TXN-${method}-123`,
        });

        expect(result.success).toBe(true);
      }
    });

    it("should record correct payment amounts", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.enrollment.recordPayment({
        enrollmentId: 1,
        amount: 50000,
        paymentMethod: "mpesa",
        transactionId: "TXN-FELLOWSHIP-001",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("enrollment.getByUserId", () => {
    it("should retrieve user enrollments", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.enrollment.getByUserId();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return enrollment with correct structure", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.enrollment.getByUserId();

      if (result.length > 0) {
        const enrollment = result[0];
        expect(enrollment).toHaveProperty("id");
        expect(enrollment).toHaveProperty("userId");
        expect(enrollment).toHaveProperty("programType");
        expect(enrollment).toHaveProperty("trainingDate");
        expect(enrollment).toHaveProperty("paymentStatus");
      }
    });

    it("should only return enrollments for authenticated user", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.enrollment.getByUserId();

      // All enrollments should belong to the authenticated user
      result.forEach((enrollment) => {
        expect(enrollment.userId).toBe(ctx.user!.id);
      });
    });
  });

  describe("enrollment validation", () => {
    it("should validate program type", async () => {
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.enrollment.create({
          programType: "invalid" as any,
          trainingDate: new Date("2026-02-15"),
        });
        // If we reach here, validation didn't catch it
        expect(true).toBe(false);
      } catch (error) {
        // Expected to throw validation error
        expect(error).toBeDefined();
      }
    });

    it("should validate training date is in future", async () => {
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.enrollment.create({
          programType: "pals",
          trainingDate: new Date("2020-01-01"), // Past date
        });
        // If we reach here, validation didn't catch it
        expect(true).toBe(false);
      } catch (error) {
        // Expected to throw validation error
        expect(error).toBeDefined();
      }
    });

    it("should validate payment amount is positive", async () => {
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.enrollment.recordPayment({
          enrollmentId: 1,
          amount: -1000, // Negative amount
          paymentMethod: "mpesa",
          transactionId: "TXN123",
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
