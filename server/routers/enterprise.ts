import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { enterpriseService } from "../enterprise";

export const enterpriseRouter = router({
  /**
   * Create enterprise organization
   */
  createOrganization: adminProcedure
    .input(
      z.object({
        name: z.string(),
        domain: z.string(),
        admins: z.array(z.string()),
      })
    )
    .mutation(({ input }) => {
      const org = enterpriseService.createOrganization({
        name: input.name,
        domain: input.domain,
        ssoEnabled: false,
        ssoProvider: "saml",
        ssoConfig: { provider: "saml" },
        members: 0,
        admins: input.admins,
        isActive: true,
      } as any);

      return {
        success: true,
        organization: org,
      };
    }),

  /**
   * Get organization
   */
  getOrganization: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(({ input }) => {
      const org = enterpriseService.getOrganization(input.organizationId);

      return {
        success: !!org,
        organization: org,
      };
    }),

  /**
   * Enable SSO
   */
  enableSSO: adminProcedure
    .input(
      z.object({
        organizationId: z.string(),
        provider: z.enum(["saml", "oauth2", "ldap"]),
        entityId: z.string().optional(),
        ssoUrl: z.string().optional(),
        certificate: z.string().optional(),
        clientId: z.string().optional(),
        clientSecret: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const success = enterpriseService.enableSSO(input.organizationId, {
        provider: input.provider,
        entityId: input.entityId,
        ssoUrl: input.ssoUrl,
        certificate: input.certificate,
        clientId: input.clientId,
        clientSecret: input.clientSecret,
      } as any);

      return {
        success,
        message: success ? "SSO enabled" : "Failed to enable SSO",
      };
    }),

  /**
   * Add enterprise user
   */
  addEnterpriseUser: adminProcedure
    .input(
      z.object({
        organizationId: z.string(),
        userId: z.number(),
        email: z.string().email(),
        role: z.enum(["admin", "manager", "instructor", "user"]),
      })
    )
    .mutation(({ input }) => {
      const user = enterpriseService.addEnterpriseUser(input.organizationId, input.userId, input.email, input.role);

      return {
        success: true,
        user,
      };
    }),

  /**
   * Get organization users
   */
  getOrganizationUsers: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(({ input }) => {
      const users = enterpriseService.getOrganizationUsers(input.organizationId);

      return {
        success: true,
        users,
        total: users.length,
      };
    }),

  /**
   * Update user role
   */
  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        newRole: z.enum(["admin", "manager", "instructor", "user"]),
      })
    )
    .mutation(({ input }) => {
      const success = enterpriseService.updateUserRole(input.userId, input.newRole);

      return {
        success,
        message: success ? "User role updated" : "Failed to update user role",
      };
    }),

  /**
   * Check permission
   */
  checkPermission: protectedProcedure
    .input(
      z.object({
        role: z.string(),
        resource: z.string(),
        action: z.string(),
      })
    )
    .query(({ input }) => {
      const hasPermission = enterpriseService.checkPermission(input.role, input.resource, input.action);

      return {
        success: true,
        hasPermission,
      };
    }),

  /**
   * Log audit event
   */
  logAuditEvent: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        action: z.string(),
        resource: z.string(),
        resourceId: z.string(),
        changes: z.record(z.string(), z.unknown()),
        ipAddress: z.string(),
        status: z.enum(["success", "failure"]),
      })
    )
    .mutation(({ ctx, input }) => {
      const log = enterpriseService.logAuditEvent(input.organizationId, ctx.user.id, {
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        changes: input.changes,
        ipAddress: input.ipAddress,
        status: input.status,
      } as any);

      return {
        success: true,
        log,
      };
    }),

  /**
   * Get audit trail
   */
  getAuditTrail: adminProcedure
    .input(
      z.object({
        organizationId: z.string(),
        userId: z.number().optional(),
        action: z.string().optional(),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
      })
    )
    .query(({ input }) => {
      const logs = enterpriseService.getAuditTrail(input.organizationId, {
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
   * Create data retention policy
   */
  createDataRetentionPolicy: adminProcedure
    .input(
      z.object({
        organizationId: z.string(),
        dataType: z.string(),
        retentionDays: z.number(),
        deleteAfterExpiry: z.boolean(),
        archiveBeforeDelete: z.boolean(),
      })
    )
    .mutation(({ input }) => {
      const policy = enterpriseService.createDataRetentionPolicy({
        organizationId: input.organizationId,
        dataType: input.dataType,
        retentionDays: input.retentionDays,
        deleteAfterExpiry: input.deleteAfterExpiry,
        archiveBeforeDelete: input.archiveBeforeDelete,
      });

      return {
        success: true,
        policy,
      };
    }),

  /**
   * Get data retention policies
   */
  getDataRetentionPolicies: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(({ input }) => {
      const policies = enterpriseService.getDataRetentionPolicies(input.organizationId);

      return {
        success: true,
        policies,
        total: policies.length,
      };
    }),

  /**
   * Create compliance checkpoint
   */
  createComplianceCheckpoint: adminProcedure
    .input(
      z.object({
        organizationId: z.string(),
        type: z.enum(["gdpr", "hipaa", "sox", "iso27001", "custom"]),
        status: z.enum(["pending", "in-progress", "completed", "failed"]),
        findings: z.array(z.string()),
      })
    )
    .mutation(({ input }) => {
      const checkpoint = enterpriseService.createComplianceCheckpoint({
        organizationId: input.organizationId,
        type: input.type,
        status: input.status,
        findings: input.findings,
        remediations: [],
      } as any);

      return {
        success: true,
        checkpoint,
      };
    }),

  /**
   * Get compliance checkpoints
   */
  getComplianceCheckpoints: adminProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(({ input }) => {
      const checkpoints = enterpriseService.getComplianceCheckpoints(input.organizationId);

      return {
        success: true,
        checkpoints,
        total: checkpoints.length,
      };
    }),

  /**
   * Get enterprise statistics
   */
  getStatistics: adminProcedure.query(() => {
    const stats = enterpriseService.getStatistics();

    return {
      success: true,
      ...stats,
    };
  }),
});
