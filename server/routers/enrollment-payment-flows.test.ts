/**
 * Comprehensive tests for enrollment payment flows:
 * - M-Pesa (STK push)
 * - Admin-free (role-based)
 * - Promo-code (discount + usage tracking)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";

// Avoid touching MySQL during unit tests when CI sets DATABASE_URL (pool exists but tests mock enrollment DB helpers).
vi.mock("../lib/micro-course-catalog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/micro-course-catalog")>();
  return {
    ...actual,
    ensureMicroCoursesCatalog: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock db-enrollment functions
vi.mock("../db-enrollment", () => ({
  validatePromoCode: vi.fn(),
  getCourseDetails: vi.fn(),
  calculateFinalPrice: vi.fn(),
  isUserEnrolled: vi.fn(),
  getPendingMpesaEnrollment: vi.fn(),
  setEnrollmentCheckoutRequestId: vi.fn(),
  createEnrollment: vi.fn(),
  incrementPromoCodeUsage: vi.fn(),
  isUserAdmin: vi.fn(),
}));

vi.mock("../services/analytics.service", () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
  trackPaymentInitiation: vi.fn().mockResolvedValue(undefined),
}));

function createAuthContext(overrides?: Partial<User>): TrpcContext {
  const user: User = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
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

describe("enrollment payment flows", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
    vi.clearAllMocks();
  });

  describe("M-Pesa flow", () => {
    it("should initiate M-Pesa enrollment with phone number", async () => {
      const { getCourseDetails, isUserEnrolled, createEnrollment } = await import("../db-enrollment");

      // Mock successful course lookup
      vi.mocked(getCourseDetails).mockResolvedValueOnce({
        id: 1,
        courseId: "asthma-i",
        title: "Asthma Management I",
        price: 20000, // 200 KES in cents
        level: "foundational",
        emergencyType: "respiratory",
        duration: 120,
        prerequisiteId: null,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock not already enrolled
      vi.mocked(isUserEnrolled).mockResolvedValueOnce(false);

      // Mock enrollment creation
      vi.mocked(createEnrollment).mockResolvedValueOnce({
        insertId: 100,
      });

      const caller = appRouter.createCaller(ctx);

      const result = await caller.enrollment.enrollWithPayment({
        courseId: "asthma-i",
        phoneNumber: "+254712345678",
      });

      expect(result.success).toBe(true);
      expect(result.paymentMethod).toBe("m-pesa");
      expect(result.enrollmentId).toBeDefined();
    });

    it("should reject M-Pesa enrollment without phone number", async () => {
      const { getCourseDetails, isUserEnrolled } = await import("../db-enrollment");

      vi.mocked(getCourseDetails).mockResolvedValueOnce({
        id: 1,
        courseId: "asthma-i",
        title: "Asthma Management I",
        price: 20000,
        level: "foundational",
        emergencyType: "respiratory",
        duration: 120,
        prerequisiteId: null,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(isUserEnrolled).mockResolvedValueOnce(false);

      const caller = appRouter.createCaller(ctx);

      const result = await caller.enrollment.enrollWithPayment({
        courseId: "asthma-i",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Phone number required");
    });

    it("should reject M-Pesa enrollment for non-existent course", async () => {
      const { getCourseDetails } = await import("../db-enrollment");

      vi.mocked(getCourseDetails).mockResolvedValueOnce(null);

      const caller = appRouter.createCaller(ctx);

      const result = await caller.enrollment.enrollWithPayment({
        courseId: "invalid-course",
        phoneNumber: "+254712345678",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Course not found");
    });

    it("should prevent double enrollment in M-Pesa flow", async () => {
      const { getCourseDetails, isUserEnrolled } = await import("../db-enrollment");

      vi.mocked(getCourseDetails).mockResolvedValueOnce({
        id: 1,
        courseId: "asthma-i",
        title: "Asthma Management I",
        price: 20000,
        level: "foundational",
        emergencyType: "respiratory",
        duration: 120,
        prerequisiteId: null,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // User already enrolled
      vi.mocked(isUserEnrolled).mockResolvedValueOnce(true);

      const caller = appRouter.createCaller(ctx);

      const result = await caller.enrollment.enrollWithPayment({
        courseId: "asthma-i",
        phoneNumber: "+254712345678",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Already enrolled");
    });
  });

  describe("Admin-free flow", () => {
    it("should create free enrollment for admin users", async () => {
      const { getCourseDetails, isUserEnrolled, isUserAdmin, createEnrollment } = await import("../db-enrollment");

      vi.mocked(getCourseDetails).mockResolvedValueOnce({
        id: 1,
        courseId: "asthma-i",
        title: "Asthma Management I",
        price: 20000,
        level: "foundational",
        emergencyType: "respiratory",
        duration: 120,
        prerequisiteId: null,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(isUserEnrolled).mockResolvedValueOnce(false);
      vi.mocked(isUserAdmin).mockResolvedValueOnce(true);
      vi.mocked(createEnrollment).mockResolvedValueOnce({
        insertId: 101,
      });

      const caller = appRouter.createCaller(ctx);

      const result = await caller.enrollment.enrollWithPayment({
        courseId: "asthma-i",
      });

      expect(result.success).toBe(true);
      expect(result.paymentMethod).toBe("admin-free");
      expect(result.enrollmentId).toBe(101);
      expect(result.message).toContain("Admin enrollment successful");
    });

    it("should not apply admin-free to non-admin users", async () => {
      const { getCourseDetails, isUserEnrolled, isUserAdmin } = await import("../db-enrollment");

      vi.mocked(getCourseDetails).mockResolvedValueOnce({
        id: 1,
        courseId: "asthma-i",
        title: "Asthma Management I",
        price: 20000,
        level: "foundational",
        emergencyType: "respiratory",
        duration: 120,
        prerequisiteId: null,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(isUserEnrolled).mockResolvedValueOnce(false);
      vi.mocked(isUserAdmin).mockResolvedValueOnce(false);

      const caller = appRouter.createCaller(ctx);

      const result = await caller.enrollment.enrollWithPayment({
        courseId: "asthma-i",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Phone number required");
    });
  });

  describe("Promo-code flow", () => {
    it("should apply valid promo code with discount", async () => {
      const { getCourseDetails, isUserEnrolled, isUserAdmin, validatePromoCode, calculateFinalPrice, createEnrollment, incrementPromoCodeUsage } = await import("../db-enrollment");

      vi.mocked(getCourseDetails).mockResolvedValueOnce({
        id: 1,
        courseId: "asthma-i",
        title: "Asthma Management I",
        price: 20000, // 200 KES
        level: "foundational",
        emergencyType: "respiratory",
        duration: 120,
        prerequisiteId: null,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(isUserEnrolled).mockResolvedValueOnce(false);
      vi.mocked(isUserAdmin).mockResolvedValueOnce(false);

      // Valid promo code with 50% discount
      vi.mocked(validatePromoCode).mockResolvedValueOnce({
        valid: true,
        id: 10,
        code: "HALF50",
        discountPercent: 50,
        description: "50% off all courses",
      });

      // Calculate final price: 20000 - (20000 * 50 / 100) = 10000
      vi.mocked(calculateFinalPrice).mockReturnValueOnce(10000);

      vi.mocked(createEnrollment).mockResolvedValueOnce({
        insertId: 102,
      });

      vi.mocked(incrementPromoCodeUsage).mockResolvedValueOnce(undefined);

      const caller = appRouter.createCaller(ctx);

      const result = await caller.enrollment.enrollWithPayment({
        courseId: "asthma-i",
        promoCode: "HALF50",
      });

      expect(result.success).toBe(true);
      expect(result.paymentMethod).toBe("promo-code");
      expect(result.amountPaid).toBe(10000);
      expect(result.message).toContain("50% discount applied");
      expect(vi.mocked(incrementPromoCodeUsage)).toHaveBeenCalledWith(10);
    });

    it("should handle 100% discount promo code (free)", async () => {
      const { getCourseDetails, isUserEnrolled, isUserAdmin, validatePromoCode, calculateFinalPrice, createEnrollment, incrementPromoCodeUsage } = await import("../db-enrollment");

      vi.mocked(getCourseDetails).mockResolvedValueOnce({
        id: 1,
        courseId: "asthma-i",
        title: "Asthma Management I",
        price: 20000,
        level: "foundational",
        emergencyType: "respiratory",
        duration: 120,
        prerequisiteId: null,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(isUserEnrolled).mockResolvedValueOnce(false);
      vi.mocked(isUserAdmin).mockResolvedValueOnce(false);

      // 100% discount promo code
      vi.mocked(validatePromoCode).mockResolvedValueOnce({
        valid: true,
        id: 11,
        code: "FREE100",
        discountPercent: 100,
        description: "Completely free",
      });

      vi.mocked(calculateFinalPrice).mockReturnValueOnce(0);

      vi.mocked(createEnrollment).mockResolvedValueOnce({
        insertId: 103,
      });

      vi.mocked(incrementPromoCodeUsage).mockResolvedValueOnce(undefined);

      const caller = appRouter.createCaller(ctx);

      const result = await caller.enrollment.enrollWithPayment({
        courseId: "asthma-i",
        promoCode: "FREE100",
      });

      expect(result.success).toBe(true);
      expect(result.amountPaid).toBe(0);
      expect(result.message).toContain("Free course via promo code");
    });

    it("should reject expired promo code", async () => {
      const { getCourseDetails, isUserEnrolled, isUserAdmin, validatePromoCode } = await import("../db-enrollment");

      vi.mocked(getCourseDetails).mockResolvedValueOnce({
        id: 1,
        courseId: "asthma-i",
        title: "Asthma Management I",
        price: 20000,
        level: "foundational",
        emergencyType: "respiratory",
        duration: 120,
        prerequisiteId: null,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(isUserEnrolled).mockResolvedValueOnce(false);
      vi.mocked(isUserAdmin).mockResolvedValueOnce(false);

      // Expired promo code
      vi.mocked(validatePromoCode).mockResolvedValueOnce({
        valid: false,
        error: "Promo code has expired",
      });

      const caller = appRouter.createCaller(ctx);

      const result = await caller.enrollment.enrollWithPayment({
        courseId: "asthma-i",
        promoCode: "EXPIRED",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("expired");
    });

    it("should reject promo code that has reached max uses", async () => {
      const { getCourseDetails, isUserEnrolled, isUserAdmin, validatePromoCode } = await import("../db-enrollment");

      vi.mocked(getCourseDetails).mockResolvedValueOnce({
        id: 1,
        courseId: "asthma-i",
        title: "Asthma Management I",
        price: 20000,
        level: "foundational",
        emergencyType: "respiratory",
        duration: 120,
        prerequisiteId: null,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(isUserEnrolled).mockResolvedValueOnce(false);
      vi.mocked(isUserAdmin).mockResolvedValueOnce(false);

      // Max uses reached
      vi.mocked(validatePromoCode).mockResolvedValueOnce({
        valid: false,
        error: "Promo code has reached maximum uses",
      });

      const caller = appRouter.createCaller(ctx);

      const result = await caller.enrollment.enrollWithPayment({
        courseId: "asthma-i",
        promoCode: "MAXED",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("maximum uses");
    });

    it("should reject invalid promo code", async () => {
      const { getCourseDetails, isUserEnrolled, isUserAdmin, validatePromoCode } = await import("../db-enrollment");

      vi.mocked(getCourseDetails).mockResolvedValueOnce({
        id: 1,
        courseId: "asthma-i",
        title: "Asthma Management I",
        price: 20000,
        level: "foundational",
        emergencyType: "respiratory",
        duration: 120,
        prerequisiteId: null,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(isUserEnrolled).mockResolvedValueOnce(false);
      vi.mocked(isUserAdmin).mockResolvedValueOnce(false);

      // Invalid code
      vi.mocked(validatePromoCode).mockResolvedValueOnce({
        valid: false,
        error: "Promo code not found",
      });

      const caller = appRouter.createCaller(ctx);

      const result = await caller.enrollment.enrollWithPayment({
        courseId: "asthma-i",
        promoCode: "INVALID",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should increment promo code usage on successful enrollment", async () => {
      const { getCourseDetails, isUserEnrolled, isUserAdmin, validatePromoCode, calculateFinalPrice, createEnrollment, incrementPromoCodeUsage } = await import("../db-enrollment");

      vi.mocked(getCourseDetails).mockResolvedValueOnce({
        id: 1,
        courseId: "asthma-i",
        title: "Asthma Management I",
        price: 20000,
        level: "foundational",
        emergencyType: "respiratory",
        duration: 120,
        prerequisiteId: null,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(isUserEnrolled).mockResolvedValueOnce(false);
      vi.mocked(isUserAdmin).mockResolvedValueOnce(false);

      vi.mocked(validatePromoCode).mockResolvedValueOnce({
        valid: true,
        id: 12,
        code: "TRACK",
        discountPercent: 25,
        description: "Usage tracking test",
      });

      vi.mocked(calculateFinalPrice).mockReturnValueOnce(15000);

      vi.mocked(createEnrollment).mockResolvedValueOnce({
        insertId: 104,
      });

      vi.mocked(incrementPromoCodeUsage).mockResolvedValueOnce(undefined);

      const caller = appRouter.createCaller(ctx);

      await caller.enrollment.enrollWithPayment({
        courseId: "asthma-i",
        promoCode: "TRACK",
      });

      // Verify usage was incremented
      expect(vi.mocked(incrementPromoCodeUsage)).toHaveBeenCalledWith(12);
      expect(vi.mocked(incrementPromoCodeUsage)).toHaveBeenCalledTimes(1);
    });
  });

  describe("Payment flow priority (Admin-free > Promo > M-Pesa)", () => {
    it("should prefer admin-free over promo code when user is admin", async () => {
      const { getCourseDetails, isUserEnrolled, isUserAdmin, validatePromoCode, calculateFinalPrice, createEnrollment, incrementPromoCodeUsage } = await import("../db-enrollment");

      vi.mocked(getCourseDetails).mockResolvedValueOnce({
        id: 1,
        courseId: "asthma-i",
        title: "Asthma Management I",
        price: 20000,
        level: "foundational",
        emergencyType: "respiratory",
        duration: 120,
        prerequisiteId: null,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(isUserEnrolled).mockResolvedValueOnce(false);
      vi.mocked(isUserAdmin).mockResolvedValueOnce(true); // User is admin

      // But promo code is provided
      vi.mocked(validatePromoCode).mockResolvedValueOnce({
        valid: true,
        id: 13,
        code: "PRIORITY",
        discountPercent: 50,
        description: "Priority test",
      });

      vi.mocked(calculateFinalPrice).mockReturnValueOnce(10000);

      vi.mocked(createEnrollment).mockResolvedValueOnce({
        insertId: 105,
      });

      vi.mocked(incrementPromoCodeUsage).mockResolvedValueOnce(undefined);

      const caller = appRouter.createCaller(ctx);

      const result = await caller.enrollment.enrollWithPayment({
        courseId: "asthma-i",
        promoCode: "PRIORITY",
      });

      // Should use admin-free, not promo-code (admin takes priority)
      expect(result.paymentMethod).toBe("admin-free");
      // amountPaid not returned in admin-free response
    });
  });
});
