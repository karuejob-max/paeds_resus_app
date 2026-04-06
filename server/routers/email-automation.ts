import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { emailAutomationService } from "../email-automation";

export const emailAutomationRouter = router({
  /**
   * Create email template
   */
  createTemplate: adminProcedure
    .input(
      z.object({
        name: z.string(),
        subject: z.string(),
        htmlContent: z.string(),
        textContent: z.string(),
        variables: z.array(z.string()),
        category: z.enum(["enrollment", "payment", "training", "certificate", "reminder", "feedback", "custom"]),
      })
    )
    .mutation(({ input }) => {
      const template = emailAutomationService.createTemplate({
        name: input.name,
        subject: input.subject,
        htmlContent: input.htmlContent,
        textContent: input.textContent,
        variables: input.variables,
        category: input.category,
        isActive: true,
      });

      return {
        success: true,
        template,
      };
    }),

  /**
   * Get template
   */
  getTemplate: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .query(({ input }) => {
      const template = emailAutomationService.getTemplate(input.templateId);

      return {
        success: !!template,
        template,
      };
    }),

  /**
   * Get all templates
   */
  getTemplates: protectedProcedure.query(() => {
    const templates = emailAutomationService.getTemplates();

    return {
      success: true,
      templates,
      total: templates.length,
    };
  }),

  /**
   * Create campaign
   */
  createCampaign: adminProcedure
    .input(
      z.object({
        name: z.string(),
        templateId: z.string(),
        recipients: z.array(
          z.object({
            email: z.string().email(),
            name: z.string(),
            userId: z.number().optional(),
          })
        ),
        variables: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(({ input }) => {
      const campaign = emailAutomationService.createCampaign({
        name: input.name,
        templateId: input.templateId,
        recipients: input.recipients.map((r) => ({
          email: r.email,
          name: r.name,
          userId: r.userId,
          status: "pending" as const,
        })) as any,
        status: "draft",
        variables: input.variables || {},
        metadata: {},
      });

      return {
        success: true,
        campaign,
      };
    }),

  /**
   * Schedule campaign
   */
  scheduleCampaign: adminProcedure
    .input(
      z.object({
        campaignId: z.string(),
        scheduledTime: z.number(),
      })
    )
    .mutation(({ input }) => {
      const success = emailAutomationService.scheduleCampaign(input.campaignId, input.scheduledTime);

      return {
        success,
        message: success ? "Campaign scheduled" : "Failed to schedule campaign",
      };
    }),

  /**
   * Send campaign
   */
  sendCampaign: adminProcedure
    .input(z.object({ campaignId: z.string() }))
    .mutation(({ input }) => {
      const success = emailAutomationService.sendCampaign(input.campaignId);

      return {
        success,
        message: success ? "Campaign sent" : "Failed to send campaign",
      };
    }),

  /**
   * Record email open
   */
  recordEmailOpen: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        email: z.string().email(),
      })
    )
    .mutation(({ input }) => {
      const success = emailAutomationService.recordEmailOpen(input.campaignId, input.email);

      return {
        success,
        message: success ? "Email open recorded" : "Failed to record email open",
      };
    }),

  /**
   * Record email click
   */
  recordEmailClick: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        email: z.string().email(),
      })
    )
    .mutation(({ input }) => {
      const success = emailAutomationService.recordEmailClick(input.campaignId, input.email);

      return {
        success,
        message: success ? "Email click recorded" : "Failed to record email click",
      };
    }),

  /**
   * Create workflow
   */
  createWorkflow: adminProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        trigger: z.object({
          type: z.enum(["enrollment", "payment", "course-completion", "quiz-failure", "inactivity", "manual"]),
          conditions: z.record(z.string(), z.unknown()).optional(),
        }),
        steps: z.array(
          z.object({
            type: z.enum(["email", "delay", "condition"]),
            templateId: z.string().optional(),
            delayDays: z.number().optional(),
            order: z.number(),
          })
        ),
      })
    )
    .mutation(({ input }) => {
      const workflow = emailAutomationService.createWorkflow({
        name: input.name,
        description: input.description,
        trigger: input.trigger as any,
        steps: input.steps.map((s, i) => ({
          id: `step-${i}`,
          type: s.type as "email" | "delay" | "condition",
          templateId: s.templateId,
          delayDays: s.delayDays,
          order: s.order,
        })) as any,
        isActive: true,
      });

      return {
        success: true,
        workflow,
      };
    }),

  /**
   * Get workflows
   */
  getWorkflows: protectedProcedure.query(() => {
    const workflows = emailAutomationService.getWorkflows();

    return {
      success: true,
      workflows,
      total: workflows.length,
    };
  }),

  /**
   * Create A/B test
   */
  createABTest: adminProcedure
    .input(
      z.object({
        campaignId: z.string(),
        variants: z.array(
          z.object({
            name: z.string(),
            templateId: z.string(),
            percentage: z.number(),
          })
        ),
      })
    )
    .mutation(({ input }) => {
      const abTest = emailAutomationService.createABTest({
        campaignId: input.campaignId,
        variants: input.variants.map((v) => ({
          id: `variant-${Math.random().toString(36).substr(2, 9)}`,
          name: v.name,
          templateId: v.templateId,
          percentage: v.percentage,
          openRate: 0,
          clickRate: 0,
          conversionRate: 0,
        })),
        status: "running",
      });

      return {
        success: true,
        abTest,
      };
    }),

  /**
   * Get campaign analytics
   */
  getCampaignAnalytics: protectedProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(({ input }) => {
      const analytics = emailAutomationService.getCampaignAnalytics(input.campaignId);

      return {
        success: !!analytics,
        analytics,
      };
    }),

  /**
   * Get email statistics
   */
  getEmailStatistics: adminProcedure.query(() => {
    const stats = emailAutomationService.getEmailStatistics();

    return {
      success: true,
      ...stats,
    };
  }),

  /**
   * Add to bounce list
   */
  addToBounceList: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(({ input }) => {
      emailAutomationService.addToBounceList(input.email);

      return {
        success: true,
        message: "Email added to bounce list",
      };
    }),

  /**
   * Add to unsubscribe list
   */
  addToUnsubscribeList: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(({ input }) => {
      emailAutomationService.addToUnsubscribeList(input.email);

      return {
        success: true,
        message: "Email added to unsubscribe list",
      };
    }),
});
