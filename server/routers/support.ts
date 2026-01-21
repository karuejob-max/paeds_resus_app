import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createTicket, addTicketMessage, getUserTickets, getOpenTicketsForAdmin, getTicketDetails, generateSupportAnalytics } from "../services/support.service";

export const supportRouter = router({
  /**
   * Create a support ticket
   */
  createTicket: protectedProcedure
    .input(
      z.object({
        subject: z.string(),
        description: z.string(),
        category: z.enum(["technical", "billing", "enrollment", "certificate", "payment", "other"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await createTicket({
        userId: ctx.user.id,
        subject: input.subject,
        description: input.description,
        category: input.category,
        priority: input.priority,
      });
    }),

  /**
   * Add message to ticket
   */
  addMessage: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        message: z.string(),
        isInternal: z.boolean().optional(),
        attachmentUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await addTicketMessage({
        ticketId: input.ticketId,
        userId: ctx.user.id,
        message: input.message,
        isInternal: input.isInternal,
        attachmentUrl: input.attachmentUrl,
      });
      return { success: true };
    }),

  /**
   * Get user's tickets
   */
  getUserTickets: protectedProcedure.query(async ({ ctx }) => {
    return await getUserTickets(ctx.user.id);
  }),

  /**
   * Get ticket details
   */
  getTicketDetails: protectedProcedure
    .input(z.object({ ticketNumber: z.string() }))
    .query(async ({ ctx, input }) => {
      const ticket = await getTicketDetails(input.ticketNumber);
      // Verify user owns this ticket or is admin
      if (ticket && ticket.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return ticket;
    }),

  /**
   * Get open tickets (admin only)
   */
  getOpenTickets: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }
    return await getOpenTicketsForAdmin(50);
  }),

  /**
   * Get support analytics (admin only)
   */
  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }
    return await generateSupportAnalytics();
  }),
});
