import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { marketplaceService } from "../marketplace";

export const marketplaceRouter = router({
  /**
   * Create extension
   */
  createExtension: adminProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        category: z.enum(["integration", "plugin", "theme", "widget", "analytics", "payment"]),
        author: z.string(),
        version: z.string(),
        price: z.number().default(0),
        permissions: z.array(z.string()),
      })
    )
    .mutation(({ input }) => {
      const extension = marketplaceService.createExtension({
        name: input.name,
        description: input.description,
        category: input.category,
        author: input.author,
        version: input.version,
        rating: 0,
        downloads: 0,
        price: input.price,
        isActive: true,
        isVerified: false,
        permissions: input.permissions,
      });

      return {
        success: true,
        extension,
      };
    }),

  /**
   * Get extension
   */
  getExtension: protectedProcedure
    .input(z.object({ extensionId: z.string() }))
    .query(({ input }) => {
      const extension = marketplaceService.getExtension(input.extensionId);

      return {
        success: !!extension,
        extension,
      };
    }),

  /**
   * List extensions
   */
  listExtensions: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        verified: z.boolean().optional(),
      })
    )
    .query(({ input }) => {
      const extensions = marketplaceService.listExtensions({
        category: input.category,
        verified: input.verified,
      });

      return {
        success: true,
        extensions,
        total: extensions.length,
      };
    }),

  /**
   * Install extension
   */
  installExtension: protectedProcedure
    .input(
      z.object({
        extensionId: z.string(),
        organizationId: z.string(),
        configuration: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const installation = marketplaceService.installExtension(input.extensionId, input.organizationId, ctx.user.id, input.configuration);

      return {
        success: true,
        installation,
      };
    }),

  /**
   * Get organization installations
   */
  getOrganizationInstallations: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(({ input }) => {
      const installations = marketplaceService.getOrganizationInstallations(input.organizationId);

      return {
        success: true,
        installations,
        total: installations.length,
      };
    }),

  /**
   * Activate extension
   */
  activateExtension: protectedProcedure
    .input(z.object({ installationId: z.string() }))
    .mutation(({ input }) => {
      const success = marketplaceService.activateExtension(input.installationId);

      return {
        success,
        message: success ? "Extension activated" : "Failed to activate extension",
      };
    }),

  /**
   * Disable extension
   */
  disableExtension: protectedProcedure
    .input(z.object({ installationId: z.string() }))
    .mutation(({ input }) => {
      const success = marketplaceService.disableExtension(input.installationId);

      return {
        success,
        message: success ? "Extension disabled" : "Failed to disable extension",
      };
    }),

  /**
   * Register webhook
   */
  registerWebhook: adminProcedure
    .input(
      z.object({
        extensionId: z.string(),
        event: z.string(),
        url: z.string().url(),
      })
    )
    .mutation(({ input }) => {
      const webhook = marketplaceService.registerWebhook(input.extensionId, input.event, input.url);

      return {
        success: true,
        webhook,
      };
    }),

  /**
   * Get extension webhooks
   */
  getExtensionWebhooks: protectedProcedure
    .input(z.object({ extensionId: z.string() }))
    .query(({ input }) => {
      const webhooks = marketplaceService.getExtensionWebhooks(input.extensionId);

      return {
        success: true,
        webhooks,
        total: webhooks.length,
      };
    }),

  /**
   * Create review
   */
  createReview: protectedProcedure
    .input(
      z.object({
        extensionId: z.string(),
        rating: z.number().min(1).max(5),
        comment: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      const review = marketplaceService.createReview(input.extensionId, ctx.user.id, input.rating, input.comment);

      return {
        success: true,
        review,
      };
    }),

  /**
   * Get extension reviews
   */
  getExtensionReviews: protectedProcedure
    .input(z.object({ extensionId: z.string() }))
    .query(({ input }) => {
      const reviews = marketplaceService.getExtensionReviews(input.extensionId);

      return {
        success: true,
        reviews,
        total: reviews.length,
      };
    }),

  /**
   * Log extension event
   */
  logEvent: protectedProcedure
    .input(
      z.object({
        extensionId: z.string(),
        organizationId: z.string(),
        eventType: z.string(),
        message: z.string(),
        status: z.enum(["success", "error", "warning"]),
      })
    )
    .mutation(({ input }) => {
      const log = marketplaceService.logEvent(input.extensionId, input.organizationId, input.eventType, input.message, input.status);

      return {
        success: true,
        log,
      };
    }),

  /**
   * Get extension logs
   */
  getExtensionLogs: protectedProcedure
    .input(
      z.object({
        extensionId: z.string(),
        organizationId: z.string().optional(),
      })
    )
    .query(({ input }) => {
      const logs = marketplaceService.getExtensionLogs(input.extensionId, input.organizationId);

      return {
        success: true,
        logs,
        total: logs.length,
      };
    }),

  /**
   * Get marketplace statistics
   */
  getStatistics: adminProcedure.query(() => {
    const stats = marketplaceService.getStatistics();

    return {
      success: true,
      ...stats,
    };
  }),
});
