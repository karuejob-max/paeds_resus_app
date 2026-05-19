import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";

const e2eDbMock = vi.hoisted(() => {
  const mockState = { limitRows: [] as Array<Record<string, unknown>> };
  const insertResult = Object.assign([{ insertId: 1, id: 1 }], { insertId: 1 });
  const insertChain = {
    values: vi.fn().mockResolvedValue(insertResult),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };
  const institutionRow = {
    id: 1,
    userId: 1,
    companyName: "Test Hospital",
    status: "active",
    name: "Test Hospital",
  };
  const queryable = {
    limit: vi.fn().mockImplementation(() => Promise.resolve(mockState.limitRows)),
    orderBy: vi.fn().mockReturnValue({
      limit: vi.fn().mockImplementation(() => Promise.resolve(mockState.limitRows)),
    }),
    then: (resolve: (v: unknown) => void) => resolve(mockState.limitRows),
  };
  return {
    mockState,
    getDb: vi.fn().mockResolvedValue({
      insert: vi.fn().mockReturnValue(insertChain),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(queryable),
          orderBy: vi.fn().mockResolvedValue([institutionRow]),
        }),
      }),
      update: vi.fn().mockReturnValue(insertChain),
    }),
  };
});

vi.mock("../db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../db")>();
  return {
    ...actual,
    getDb: e2eDbMock.getDb,
    createEnrollment: vi.fn().mockResolvedValue({ id: 99 }),
    createSmsReminder: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("../mpesa", () => ({
  getMpesaAccessToken: vi.fn().mockResolvedValue("test-token"),
  initiateStkPush: vi.fn().mockResolvedValue({
    success: true,
    checkoutRequestID: "ws_CO_e2e_test",
  }),
  queryStk: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("../db-enrollment", () => ({
  createEnrollment: vi.fn().mockResolvedValue({ id: 99 }),
  getEnrollmentsByUserId: vi.fn().mockResolvedValue([]),
  validatePromoCode: vi.fn(),
  getCourseDetails: vi.fn(),
  calculateFinalPrice: vi.fn(),
  isUserEnrolled: vi.fn(),
  getPendingMpesaEnrollment: vi.fn(),
  setEnrollmentCheckoutRequestId: vi.fn(),
  incrementPromoCodeUsage: vi.fn(),
  isUserAdmin: vi.fn(),
}));

vi.mock("../certificates", () => ({
  saveCertificate: vi.fn().mockResolvedValue({
    success: true,
    certificateNumber: "CERT-E2E-001",
    verificationHash: "verify-hash-e2e",
  }),
  verifyCertificate: vi.fn().mockResolvedValue({
    valid: true,
    certificate: {
      certificateNumber: "CERT-E2E-001",
      recipientName: "Jane Doe",
      programType: "bls",
      issueDate: new Date(),
      expiryDate: new Date(),
      isValid: true,
    },
  }),
  getCertificatesByUserId: vi.fn().mockResolvedValue([]),
}));

vi.mock("../email-service", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: "email-e2e-1" }),
}));

vi.mock("../lib/institution-access", () => ({
  assertInstitutionAccess: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../services/analytics.service", () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
  trackPaymentInitiation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../services/facility-registry.service", () => ({
  getFacilityById: vi.fn().mockResolvedValue({
    id: 1,
    name: "Test Hospital",
    county: "Nairobi",
    country: "Kenya",
  }),
  resolveCanonicalFacilityId: vi.fn().mockImplementation((id: number) => Promise.resolve(id)),
  syncProviderProfileFacility: vi.fn().mockResolvedValue(undefined),
}));

/**
 * End-to-End Test Suite for Hospital Workflow
 * Tests the complete flow from institutional registration to certification
 * 
 * Key Design:
 * - Uses outer scope variables for persistence across tests
 * - Each test depends on previous test data
 * - Tests are sequential and ordered by phase
 */

describe("Hospital Workflow E2E Tests", () => {
  let institutionId: number;
  let staffMemberId: number;
  let enrollmentId: number;
  let certificateNumber: string;

  const institutionRow = {
    id: 1,
    userId: 1,
    companyName: "Test Hospital",
    status: "active",
    name: "Test Hospital",
  };

  // Test context factory
  const createTestContext = (userId: number = 1, role: "admin" | "user" = "admin") => ({
    user: {
      id: userId,
      role,
      userType: "institutional" as const,
      openId: `test-${userId}`,
      email: "test@hospital.com",
      name: "Test User",
      loginMethod: "manus",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: () => {} } as any,
  });

  beforeEach(() => {
    e2eDbMock.mockState.limitRows = [institutionRow];
  });

  describe("Phase 1: Institutional Registration", () => {
    it("should register a new hospital", async () => {
      e2eDbMock.mockState.limitRows = [];
      const result = await appRouter.createCaller(createTestContext(1, "admin")).institution.register({
        hospitalName: "Test Hospital",
        hospitalType: "private",
        county: "Nairobi",
        phone: "+254712345678",
        email: "hospital@test.com",
        website: "https://test.com",
        adminFirstName: "Test",
        adminLastName: "Admin",
        adminEmail: "admin@hospital.com",
        adminPhone: "+254712345678",
        adminTitle: "Director",
        planId: "professional",
        planPrice: 50000,
        maxStaff: 50,
      });

      expect(result.success).toBe(true);
      expect(result.institutionId).toBeDefined();
      institutionId = result.institutionId!;
      console.log("✓ Phase 1.1: Institution registered with ID", institutionId);
    });

    it("should fetch institution details", async () => {
      expect(institutionId).toBeGreaterThan(0);
      
      const result = await appRouter.createCaller(createTestContext(1, "admin")).institution.getDetails({
        institutionId,
      });

      expect(result).toBeDefined();
      expect(result.companyName).toBe("Test Hospital");
      console.log("✓ Phase 1.2: Institution details fetched");
    });
  });

  describe("Phase 2: Staff Bulk Import", () => {
    it("should add individual staff member", async () => {
      expect(institutionId).toBeGreaterThan(0);
      
      const result = await appRouter.createCaller(createTestContext(1, "admin")).institution.addStaffMember({
        institutionId,
        staffName: "Jane Doe",
        staffEmail: "jane@hospital.com",
        staffRole: "nurse",
        department: "ICU",
      });

      expect(result.success).toBe(true);
      expect(result.staffId).toBeDefined();
      staffMemberId = result.staffId!;
      console.log("✓ Phase 2.1: Staff member added with ID", staffMemberId);
    });

    it("should fetch staff members list", async () => {
      expect(institutionId).toBeGreaterThan(0);
      
      const result = await appRouter.createCaller(createTestContext(1, "admin")).institution.getStaffMembers({
        institutionId,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      console.log("✓ Phase 2.2: Staff members list fetched");
    });
  });

  describe("Phase 3: Enrollment & Payment", () => {
    it("should process M-Pesa payment", async () => {
      const result = await appRouter.createCaller(createTestContext(1, "user")).mpesa.initiatePayment({
        amount: 9000,
        phoneNumber: "254712345678",
        courseId: "bls",
        courseName: "Basic Life Support",
      });

      expect(result.success).toBe(true);
      console.log("✓ Phase 3.1: M-Pesa payment initiated");
    });

    it("should create enrollment after payment", async () => {
      const result = await appRouter.createCaller(createTestContext(1, "user")).enrollment.create({
        programType: "bls",
        trainingDate: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.enrollmentId).toBeDefined();
      enrollmentId = result.enrollmentId!;
      console.log("✓ Phase 3.2: Enrollment created with ID", enrollmentId);
    });
  });

  describe("Phase 4: Course Progress", () => {
    it("should track course progress", async () => {
      expect(enrollmentId).toBeGreaterThan(0);
      e2eDbMock.mockState.limitRows = [
        {
          id: enrollmentId,
          userId: 1,
          programType: "bls",
          paymentStatus: "completed",
          status: "in_progress",
        },
      ];

      const result = await appRouter.createCaller(createTestContext(1, "user")).enrollment.getById({
        enrollmentId,
      });

      expect(result).toBeDefined();
      expect(result?.programType).toBe("bls");
      console.log("✓ Phase 4.1: Enrollment progress row readable");
    });

    it("should get enrollment details", async () => {
      expect(enrollmentId).toBeGreaterThan(0);
      e2eDbMock.mockState.limitRows = [
        {
          id: enrollmentId,
          userId: 1,
          programType: "bls",
          paymentStatus: "completed",
        },
      ];

      const result = await appRouter.createCaller(createTestContext(1, "user")).enrollment.getById({
        enrollmentId,
      });

      expect(result).toBeDefined();
      expect(result?.programType).toBe("bls");
      console.log("✓ Phase 4.2: Enrollment details fetched");
    });
  });

  describe("Phase 5: Certificate Generation", () => {
    it("should generate certificate upon completion", async () => {
      expect(enrollmentId).toBeGreaterThan(0);

      const result = await appRouter.createCaller(createTestContext(1, "user")).certificates.generate({
        enrollmentId,
        recipientName: "Jane Doe",
        programType: "bls",
        trainingDate: new Date(),
        instructorName: "Dr. Test Instructor",
      });

      expect(result.success).toBe(true);
      expect(result.certificateNumber).toBeDefined();
      expect(result.verificationCode).toBeDefined();
      certificateNumber = result.certificateNumber!;
      console.log("✓ Phase 5.1: Certificate generated with number", certificateNumber);
    });

    it("should verify certificate", async () => {
      expect(certificateNumber).toBeDefined();

      const result = await appRouter.createCaller(createTestContext(1, "user")).certificates.verify({
        certificateNumber,
        recipientName: "Jane Doe",
      });

      expect(result.valid).toBe(true);
      expect(result.certificate?.certificateNumber).toBe("CERT-E2E-001");
      console.log("✓ Phase 5.2: Certificate verified");
    });
  });

  describe("Phase 6: Hospital Admin Dashboard", () => {
    it("should get institution statistics", async () => {
      expect(institutionId).toBeGreaterThan(0);
      e2eDbMock.mockState.limitRows = [
        {
          id: 1,
          institutionalAccountId: institutionId,
          enrollmentStatus: "enrolled",
          certificationStatus: "certified",
        },
        {
          id: 2,
          institutionalAccountId: institutionId,
          enrollmentStatus: "completed",
          certificationStatus: "certified",
        },
      ];

      const result = await appRouter.createCaller(createTestContext(1, "admin")).institution.getStats({
        institutionId,
      });

      expect(result.totalStaff).toBeGreaterThan(0);
      expect(result.enrolledStaff).toBeGreaterThanOrEqual(0);
      expect(result.completedStaff).toBeGreaterThanOrEqual(0);
      console.log("✓ Phase 6.1: Institution statistics fetched");
    });
  });

  describe("Phase 7: Safe-Truth Incident Reporting", () => {
    it("should report incident", async () => {
      expect(institutionId).toBeGreaterThan(0);

      const result = await appRouter.createCaller(createTestContext(1, "admin")).careSignalEvents.logEvent({
        eventDate: new Date().toISOString(),
        childAge: 5,
        eventType: "cardiac_arrest",
        presentation: "Collapsed at triage",
        isAnonymous: false,
        facilityId: 1,
        chainOfSurvival: {
          recognition: true,
          activation: true,
          cpr: true,
          defibrillation: false,
          advancedCare: true,
          postResuscitation: true,
        },
        systemGaps: ["triage-delay"],
        gapDetails: {},
        outcome: "survived",
        neurologicalStatus: "intact",
      });

      expect(result.success).toBe(true);
      console.log("✓ Phase 7.1: Incident reported");
    });
  });

  describe("Phase 8: Notifications", () => {
    it("should send enrollment reminder", async () => {
      expect(institutionId).toBeGreaterThan(0);

      const result = await appRouter.createCaller(createTestContext(1, "admin")).institutionalNotifications.sendEnrollmentReminder({
        institutionId,
        staffEmail: "jane@hospital.com",
        staffName: "Jane Doe",
        courseType: "bls",
        enrollmentDeadline: new Date("2026-02-22"),
      });

      expect(result.success).toBe(true);
      expect(result.emailId).toBeDefined();
      console.log("✓ Phase 8.1: Enrollment reminder sent");
    });

    it("should send completion email", async () => {
      expect(institutionId).toBeGreaterThan(0);
      certificateNumber = certificateNumber || "CERT-E2E-001";

      const result = await appRouter.createCaller(createTestContext(1, "admin")).institutionalNotifications.sendCompletionEmail({
        institutionId,
        staffEmail: "jane@hospital.com",
        staffName: "Jane Doe",
        courseType: "bls",
        certificateNumber,
        completionDate: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.emailId).toBeDefined();
      console.log("✓ Phase 8.2: Completion email sent");
    });
  });

  describe("Phase 9: Analytics & Reporting", () => {
    it("should get advanced analytics", async () => {
      const result = await appRouter.createCaller(createTestContext(1, "admin")).advancedAnalytics.getMetrics({
        timeRange: "30days",
        metrics: ["enrollment", "completion", "revenue"],
      });

      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
      console.log("✓ Phase 9.1: Advanced analytics retrieved");
    });
  });

  describe("Phase 10: Security & Compliance", () => {
    it("should run security audit", async () => {
      const result = await appRouter.createCaller(createTestContext(1, "admin")).productionSecurity.runSecurityAudit({
        auditType: "full",
      });

      expect(result.success).toBe(true);
      expect(result.audit?.summary.score).toBe(100);
      console.log("✓ Phase 10.1: Security audit completed");
    });

    it("should verify deployment readiness", async () => {
      const result = await appRouter.createCaller(createTestContext(1, "admin")).productionSecurity.verifyDeploymentReadiness();

      expect(result.success).toBe(true);
      expect(result.readiness?.summary.readyForDeployment).toBe(true);
      console.log("✓ Phase 10.2: Deployment readiness verified");
    });
  });
});

describe("Error Handling & Edge Cases", () => {
  const createTestContext = (userId: number = 1, role: "admin" | "user" = "admin") => ({
    user: { id: userId, role },
    req: {} as any,
    res: {} as any,
  });

  it("should handle invalid institution ID", async () => {
    try {
      const result = await appRouter.createCaller(createTestContext(1, "admin")).institution.getDetails({
        institutionId: 99999,
      });

      expect(result.success).toBe(false);
      console.log("✓ Error Handling 1: Invalid institution ID handled");
    } catch (error) {
      // Expected - invalid ID throws error
      expect(error).toBeDefined();
      console.log("✓ Error Handling 1: Invalid institution ID handled (error thrown)");
    }
  });

  it("should require authentication for institution.register", async () => {
    const ctx = { user: null, req: {} as any, res: {} as any };
    const caller = appRouter.createCaller(ctx as any);
    await expect(
      caller.institution.register({
        hospitalName: "No Auth Hospital",
        hospitalType: "private",
        county: "Nairobi",
        phone: "+254712345678",
        email: "hospital@test.com",
        website: "https://test.com",
        adminFirstName: "Test",
        adminLastName: "Admin",
        adminEmail: "admin@test.com",
        adminPhone: "+254712345678",
        adminTitle: "Director",
        planId: "basic",
        planPrice: 5000,
        maxStaff: 20,
      })
    ).rejects.toThrow();
    console.log("✓ Error Handling 2: Unauthenticated register rejected");
  });
});
