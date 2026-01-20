import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { reportingService } from "../reporting";

export const reportingRouter = router({
  /**
   * Create report template
   */
  createReport: adminProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        type: z.enum(["enrollment", "payment", "training", "performance", "compliance", "custom"]),
        columns: z.array(z.string()),
        sortBy: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const report = reportingService.createReport({
        name: input.name,
        description: input.description,
        type: input.type,
        filters: [],
        columns: input.columns,
        sortBy: input.sortBy,
        isScheduled: false,
      });

      return {
        success: true,
        report,
      };
    }),

  /**
   * Get report
   */
  getReport: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .query(({ input }) => {
      const report = reportingService.getReport(input.reportId);

      return {
        success: !!report,
        report,
      };
    }),

  /**
   * Execute report
   */
  executeReport: protectedProcedure
    .input(
      z.object({
        reportId: z.string(),
        format: z.enum(["pdf", "excel", "csv"]).optional().default("pdf"),
      })
    )
    .mutation(({ input }) => {
      const execution = reportingService.executeReport(input.reportId, input.format);

      return {
        success: true,
        execution,
      };
    }),

  /**
   * Get execution status
   */
  getExecutionStatus: protectedProcedure
    .input(z.object({ executionId: z.string() }))
    .query(({ input }) => {
      const execution = reportingService.getExecutionStatus(input.executionId);

      return {
        success: !!execution,
        execution,
      };
    }),

  /**
   * Schedule report
   */
  scheduleReport: adminProcedure
    .input(
      z.object({
        reportId: z.string(),
        frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
        dayOfWeek: z.number().optional(),
        dayOfMonth: z.number().optional(),
        time: z.string(),
        recipients: z.array(z.string().email()),
        format: z.enum(["pdf", "excel", "csv"]),
      })
    )
    .mutation(({ input }) => {
      const success = reportingService.scheduleReport(input.reportId, {
        frequency: input.frequency,
        dayOfWeek: input.dayOfWeek,
        dayOfMonth: input.dayOfMonth,
        time: input.time,
        recipients: input.recipients,
        format: input.format,
      });

      return {
        success,
        message: success ? "Report scheduled" : "Failed to schedule report",
      };
    }),

  /**
   * Generate compliance report
   */
  generateComplianceReport: adminProcedure
    .input(
      z.object({
        type: z.enum(["gdpr", "hipaa", "audit", "data-retention", "access-log"]),
        startDate: z.number(),
        endDate: z.number(),
      })
    )
    .mutation(({ input }) => {
      const report = reportingService.generateComplianceReport(input.type, input.startDate, input.endDate);

      return {
        success: true,
        report,
      };
    }),

  /**
   * Get compliance report
   */
  getComplianceReport: adminProcedure
    .input(z.object({ reportId: z.string() }))
    .query(({ input }) => {
      const report = reportingService.getComplianceReport(input.reportId);

      return {
        success: !!report,
        report,
      };
    }),

  /**
   * Get audit logs
   */
  getAuditLogs: adminProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        action: z.string().optional(),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
      })
    )
    .query(({ input }) => {
      const logs = reportingService.getAuditLogs({
        userId: input.userId,
        action: input.action,
        startDate: input.startDate,
        endDate: input.endDate,
      });

      return {
        success: true,
        logs,
        total: logs.length,
      };
    }),

  /**
   * Log audit event
   */
  logAuditEvent: protectedProcedure
    .input(
      z.object({
        action: z.string(),
        resource: z.string(),
        resourceId: z.string(),
        changes: z.record(z.string(), z.unknown()),
        ipAddress: z.string(),
        status: z.enum(["success", "failure"]),
      })
    )
    .mutation(({ ctx, input }) => {
      const log = reportingService.logAuditEvent({
        userId: ctx.user.id,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        changes: input.changes,
        ipAddress: input.ipAddress,
        status: input.status,
      });

      return {
        success: true,
        log,
      };
    }),

  /**
   * Get reports
   */
  getReports: protectedProcedure.query(() => {
    const reports = reportingService.getReports();

    return {
      success: true,
      reports,
      total: reports.length,
    };
  }),

  /**
   * Get report executions
   */
  getReportExecutions: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .query(({ input }) => {
      const executions = reportingService.getReportExecutions(input.reportId);

      return {
        success: true,
        executions,
        total: executions.length,
      };
    }),

  /**
   * Delete report
   */
  deleteReport: adminProcedure
    .input(z.object({ reportId: z.string() }))
    .mutation(({ input }) => {
      const success = reportingService.deleteReport(input.reportId);

      return {
        success,
        message: success ? "Report deleted" : "Failed to delete report",
      };
    }),

  /**
   * Get reporting statistics
   */
  getStatistics: adminProcedure.query(() => {
    const stats = reportingService.getStatistics();

    return {
      success: true,
      ...stats,
    };
  }),
});
