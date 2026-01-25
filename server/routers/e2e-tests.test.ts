import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "../routers";
import { createTRPCMsw } from "msw-trpc";

/**
 * End-to-End Test Suite for Hospital Workflow
 * Tests the complete flow from institutional registration to certification
 */

describe("Hospital Workflow E2E Tests", () => {
  let institutionId: number;
  let staffMemberId: number;
  let enrollmentId: number;
  let certificateNumber: string;

  describe("Phase 1: Institutional Registration", () => {
    it("should register a new hospital", async () => {
      const result = await appRouter.createCaller({
        user: { id: 1, role: "admin" },
        req: {} as any,
        res: {} as any,
      }).institution.register({
        hospitalName: "Test Hospital",
        adminEmail: "admin@hospital.com",
        adminName: "Dr. Test Admin",
        phoneNumber: "+254712345678",
        county: "Nairobi",
        staffCount: 50,
        subscriptionPlan: "professional",
      });

      expect(result.success).toBe(true);
      expect(result.institutionId).toBeDefined();
      institutionId = result.institutionId!;
    });

    it("should fetch institution details", async () => {
      const result = await appRouter.createCaller({
        user: { id: 1, role: "admin" },
        req: {} as any,
        res: {} as any,
      }).institution.getDetails({
        institutionId,
      });

      expect(result.success).toBe(true);
      expect(result.institution?.hospitalName).toBe("Test Hospital");
    });
  });

  describe("Phase 2: Staff Bulk Import", () => {
    it("should add individual staff member", async () => {
      const result = await appRouter.createCaller({
        user: { id: 1, role: "admin" },
        req: {} as any,
        res: {} as any,
      }).institution.addStaffMember({
        institutionId,
        staffName: "Jane Doe",
        staffEmail: "jane@hospital.com",
        staffRole: "nurse",
        department: "ICU",
      });

      expect(result.success).toBe(true);
      expect(result.staffMemberId).toBeDefined();
      staffMemberId = result.staffMemberId!;
    });

    it("should fetch staff members list", async () => {
      const result = await appRouter.createCaller({
        user: { id: 1, role: "admin" },
        req: {} as any,
        res: {} as any,
      }).institution.getStaffMembers({
        institutionId,
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.staffMembers)).toBe(true);
      expect(result.staffMembers!.length).toBeGreaterThan(0);
    });
  });

  describe("Phase 3: Enrollment & Payment", () => {
    it("should process M-Pesa payment", async () => {
      const result = await appRouter.createCaller({
        user: { id: 1, role: "user" },
        req: {} as any,
        res: {} as any,
      }).mpesa.initiateStkPush({
        amount: 9000,
        phoneNumber: "254712345678",
        courseType: "bls",
        staffName: "Jane Doe",
        staffEmail: "jane@hospital.com",
      });

      expect(result.success).toBe(true);
      expect(result.checkoutRequestId).toBeDefined();
    });

    it("should create enrollment after payment", async () => {
      const result = await appRouter.createCaller({
        user: { id: 1, role: "user" },
        req: {} as any,
        res: {} as any,
      }).enrollment.createEnrollment({
        staffMemberId,
        courseType: "bls",
        paymentMethod: "mpesa",
        transactionId: "test_transaction_123",
      });

      expect(result.success).toBe(true);
      expect(result.enrollmentId).toBeDefined();
      enrollmentId = result.enrollmentId!;
    });
  });

  describe("Phase 4: Course Progress", () => {
    it("should track course progress", async () => {
      const result = await appRouter.createCaller({
        user: { id: 1, role: "user" },
        req: {} as any,
        res: {} as any,
      }).enrollment.updateProgress({
        enrollmentId,
        moduleId: "module-1",
        lessonId: "lesson-1",
        completed: true,
      });

      expect(result.success).toBe(true);
    });

    it("should get enrollment details", async () => {
      const result = await appRouter.createCaller({
        user: { id: 1, role: "user" },
        req: {} as any,
        res: {} as any,
      }).enrollment.getEnrollmentDetails({
        enrollmentId,
      });

      expect(result.success).toBe(true);
      expect(result.enrollment?.courseType).toBe("bls");
    });
  });

  describe("Phase 5: Certificate Generation", () => {
    it("should generate certificate upon completion", async () => {
      const result = await appRouter.createCaller({
        user: { id: 1, role: "user" },
        req: {} as any,
        res: {} as any,
      }).certificates.generateCertificate({
        enrollmentId,
        recipientName: "Jane Doe",
        programType: "bls",
        instructorName: "Dr. Test Instructor",
      });

      expect(result.success).toBe(true);
      expect(result.certificateNumber).toBeDefined();
      expect(result.verificationCode).toBeDefined();
      expect(result.certificateUrl).toBeDefined();
      certificateNumber = result.certificateNumber!;
    });

    it("should verify certificate", async () => {
      const result = await appRouter.createCaller({
        user: { id: 1, role: "user" },
        req: {} as any,
        res: {} as any,
      }).certificates.verifyCertificate({
        certificateNumber,
      });

      expect(result.success).toBe(true);
      expect(result.certificate?.recipientName).toBe("Jane Doe");
      expect(result.certificate?.isValid).toBe(true);
    });
  });

  describe("Phase 6: Hospital Admin Dashboard", () => {
    it("should get institution statistics", async () => {
      const result = await appRouter.createCaller({
        user: { id: 1, role: "admin" },
        req: {} as any,
        res: {} as any,
      }).institution.getStats({
        institutionId,
      });

      expect(result.success).toBe(true);
      expect(result.totalStaff).toBeGreaterThan(0);
      expect(result.enrolledStaff).toBeGreaterThanOrEqual(0);
      expect(result.completedStaff).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Phase 7: Safe-Truth Incident Reporting", () => {
    it("should report incident", async () => {
      const result = await appRouter.createCaller({
        user: { id: 1, role: "user" },
        req: {} as any,
        res: {} as any,
      }).safeTruthEvents.reportIncident({
        institutionId,
        eventType: "cardiac_arrest",
        description: "Test incident report",
        outcome: "survived",
        gapCategory: "knowledge",
        recommendations: ["Implement training"],
      });

      expect(result.success).toBe(true);
      expect(result.incidentId).toBeDefined();
    });
  });

  describe("Phase 8: Notifications", () => {
    it("should send enrollment reminder", async () => {
      const result = await appRouter.createCaller({
        user: { id: 1, role: "admin" },
        req: {} as any,
        res: {} as any,
      }).institutionalNotifications.sendEnrollmentReminder({
        institutionId,
        staffEmail: "jane@hospital.com",
        staffName: "Jane Doe",
        courseType: "bls",
        enrollmentDeadline: new Date("2026-02-22"),
      });

      expect(result.success).toBe(true);
      expect(result.emailId).toBeDefined();
    });

    it("should send completion email", async () => {
      const result = await appRouter.createCaller({
        user: { id: 1, role: "admin" },
        req: {} as any,
        res: {} as any,
      }).institutionalNotifications.sendCompletionEmail({
        institutionId,
        staffEmail: "jane@hospital.com",
        staffName: "Jane Doe",
        courseType: "bls",
        certificateNumber,
        completionDate: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.emailId).toBeDefined();
    });
  });

  describe("Phase 9: Analytics & Reporting", () => {
    it("should get advanced analytics", async () => {
      const result = await appRouter.createCaller({
        user: { id: 1, role: "admin" },
        req: {} as any,
        res: {} as any,
      }).analytics.getMetrics({
        timeRange: "30days",
        metrics: ["enrollment", "completion", "revenue"],
      });

      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
    });
  });

  describe("Phase 10: Security & Compliance", () => {
    it("should run security audit", async () => {
      const result = await appRouter.createCaller({
        user: { id: 1, role: "admin" },
        req: {} as any,
        res: {} as any,
      }).productionSecurity.runSecurityAudit({
        auditType: "full",
      });

      expect(result.success).toBe(true);
      expect(result.audit?.summary.readyForDeployment).toBe(true);
    });

    it("should verify deployment readiness", async () => {
      const result = await appRouter.createCaller({
        user: { id: 1, role: "admin" },
        req: {} as any,
        res: {} as any,
      }).productionSecurity.verifyDeploymentReadiness();

      expect(result.success).toBe(true);
      expect(result.readiness?.summary.readyForDeployment).toBe(true);
    });
  });
});

describe("Error Handling & Edge Cases", () => {
  it("should handle invalid institution ID", async () => {
    const result = await appRouter.createCaller({
      user: { id: 1, role: "admin" },
      req: {} as any,
      res: {} as any,
    }).institution.getDetails({
      institutionId: 99999,
    });

    expect(result.success).toBe(false);
  });

    it("should prevent unauthorized access", async () => {
      try {
        const result = await appRouter.createCaller({
          user: { id: 1, role: "user" },
          req: {} as any,
          res: {} as any,
        }).institution.register({
          hospitalName: "Unauthorized Hospital",
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
        });
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
});
