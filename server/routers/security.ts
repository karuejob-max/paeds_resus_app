import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { securityService } from "../security";

export const securityRouter = router({
  /**
   * Get audit logs (admin only)
   */
  getAuditLogs: adminProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        action: z.string().optional(),
        resource: z.string().optional(),
        status: z.enum(["success", "failure"]).optional(),
        limit: z.number().min(1).max(100).optional().default(50),
      })
    )
    .query(({ input }) => {
      const logs = securityService.getAuditLogs({
        userId: input.userId,
        action: input.action,
        resource: input.resource,
        status: input.status,
      });

      return {
        success: true,
        logs: logs.slice(0, input.limit),
        total: logs.length,
      };
    }),

  /**
   * Get data access logs (admin only)
   */
  getDataAccessLogs: adminProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        dataType: z.string().optional(),
        accessType: z.enum(["read", "write", "delete"]).optional(),
        limit: z.number().min(1).max(100).optional().default(50),
      })
    )
    .query(({ input }) => {
      const logs = securityService.getDataAccessLogs({
        userId: input.userId,
        dataType: input.dataType,
        accessType: input.accessType,
      });

      return {
        success: true,
        logs: logs.slice(0, input.limit),
        total: logs.length,
      };
    }),

  /**
   * Check compliance status (admin only)
   */
  checkCompliance: adminProcedure.query(() => {
    const result = securityService.checkCompliance();
    return {
      success: true,
      ...result,
    };
  }),

  /**
   * Generate compliance report (admin only)
   */
  generateComplianceReport: adminProcedure.query(() => {
    const report = securityService.generateComplianceReport();
    return {
      success: true,
      report,
    };
  }),

  /**
   * Validate email format
   */
  validateEmail: protectedProcedure
    .input(
      z.object({
        email: z.string(),
      })
    )
    .query(({ input }) => {
      const isValid = securityService.isValidEmail(input.email);
      return {
        success: true,
        isValid,
        message: isValid ? "Email format is valid" : "Invalid email format",
      };
    }),

  /**
   * Validate phone number format
   */
  validatePhoneNumber: protectedProcedure
    .input(
      z.object({
        phone: z.string(),
      })
    )
    .query(({ input }) => {
      const isValid = securityService.isValidPhoneNumber(input.phone);
      return {
        success: true,
        isValid,
        message: isValid ? "Phone number format is valid" : "Invalid phone number format",
      };
    }),

  /**
   * Sanitize input
   */
  sanitizeInput: protectedProcedure
    .input(
      z.object({
        input: z.string(),
      })
    )
    .query(({ input }) => {
      const sanitized = securityService.sanitizeInput(input.input);
      return {
        success: true,
        sanitized,
      };
    }),

  /**
   * Clear old logs (admin only)
   */
  clearOldLogs: adminProcedure
    .input(
      z.object({
        daysOld: z.number().min(1).optional().default(90),
      })
    )
    .mutation(({ input }) => {
      const removed = securityService.clearOldLogs(input.daysOld);
      return {
        success: true,
        message: `Removed ${removed} old log entries`,
        removed,
      };
    }),
});
