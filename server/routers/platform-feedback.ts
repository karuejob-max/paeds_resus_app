import { z } from "zod";
import { eq } from "drizzle-orm";
import { adminProcedure, router } from "../_core/trpc";
import { getDb, insertAdminAuditLog } from "../db";
import { platformFeedbackTickets } from "../../drizzle/schema";
import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES } from "../../shared/platform-feedback";
import {
  formatFeedbackExportMarkdown,
  getFeedbackTicketById,
  listAdminFeedbackTickets,
  listOpenFeedbackTicketsForExport,
} from "../lib/platform-feedback-tickets";

export const adminFeedbackRouter = router({
  list: adminProcedure
    .input(
      z
        .object({
          status: z.enum(FEEDBACK_STATUSES).optional(),
          category: z.enum(FEEDBACK_CATEGORIES).optional(),
          limit: z.number().int().min(1).max(200).default(100),
        })
        .optional()
    )
    .query(async ({ input }) => listAdminFeedbackTickets(input ?? undefined)),

  updateStatus: adminProcedure
    .input(z.object({ ticketId: z.number().int().positive(), status: z.enum(FEEDBACK_STATUSES) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false as const, error: "Database not available" };
      if (!(await getFeedbackTicketById(input.ticketId))) {
        return { success: false as const, error: "Ticket not found" };
      }
      await db.update(platformFeedbackTickets).set({ status: input.status }).where(eq(platformFeedbackTickets.id, input.ticketId));
      await insertAdminAuditLog({
        adminUserId: ctx.user.id,
        procedurePath: "adminFeedback.updateStatus",
        inputSummary: `ticketId=${input.ticketId} status=${input.status}`,
      });
      return { success: true as const };
    }),

  respond: adminProcedure
    .input(
      z.object({
        ticketId: z.number().int().positive(),
        adminResponse: z.string().min(1).max(8000),
        status: z.enum(FEEDBACK_STATUSES).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false as const, error: "Database not available" };
      if (!(await getFeedbackTicketById(input.ticketId))) {
        return { success: false as const, error: "Ticket not found" };
      }
      await db
        .update(platformFeedbackTickets)
        .set({
          adminResponse: input.adminResponse.trim(),
          respondedAt: new Date(),
          respondedBy: ctx.user.id,
          ...(input.status ? { status: input.status } : {}),
        })
        .where(eq(platformFeedbackTickets.id, input.ticketId));
      await insertAdminAuditLog({
        adminUserId: ctx.user.id,
        procedurePath: "adminFeedback.respond",
        inputSummary: `ticketId=${input.ticketId}`,
      });
      return { success: true as const };
    }),

  exportOpen: adminProcedure
    .input(z.object({ format: z.enum(["json", "markdown"]).default("json") }).optional())
    .query(async ({ input }) => {
      const { tickets, categoryCounts } = await listOpenFeedbackTicketsForExport();
      const markdown = formatFeedbackExportMarkdown(tickets, categoryCounts);
      if ((input?.format ?? "json") === "markdown") {
        return { format: "markdown" as const, markdown, categoryCounts, ticketCount: tickets.length };
      }
      return { format: "json" as const, tickets, categoryCounts, ticketCount: tickets.length, markdown };
    }),
});
