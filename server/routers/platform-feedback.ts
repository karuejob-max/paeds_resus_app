import { z } from "zod";
import { eq } from "drizzle-orm";
import { adminProcedure, router } from "../_core/trpc";
import { getDb, insertAdminAuditLog } from "../db";
import { platformFeedbackTickets } from "../../drizzle/schema";
import {
  FEEDBACK_AGENT_ASSIGNEES,
  FEEDBACK_CATEGORIES,
  FEEDBACK_ISSUE_TYPES,
  FEEDBACK_SEVERITIES,
  FEEDBACK_STATUSES,
} from "../../shared/platform-feedback";
import {
  appendFeedbackStatusHistory,
  formatFeedbackExportMarkdown,
  getFeedbackTicketById,
  listAdminFeedbackTickets,
  listOpenFeedbackTicketsForExport,
} from "../lib/platform-feedback-tickets";

const listInputSchema = z
  .object({
    status: z.union([z.enum(FEEDBACK_STATUSES), z.literal("actionable")]).optional(),
    category: z.enum(FEEDBACK_CATEGORIES).optional(),
    issueType: z.enum(FEEDBACK_ISSUE_TYPES).optional(),
    severity: z.enum(FEEDBACK_SEVERITIES).optional(),
    courseSlug: z.string().max(64).optional(),
    assignedAgent: z.union([z.enum(FEEDBACK_AGENT_ASSIGNEES), z.literal("all")]).optional(),
    createdAfter: z.coerce.date().optional(),
    createdBefore: z.coerce.date().optional(),
    limit: z.number().int().min(1).max(200).default(100),
  })
  .optional();

export const adminFeedbackRouter = router({
  list: adminProcedure.input(listInputSchema).query(async ({ input }) => listAdminFeedbackTickets(input ?? undefined)),

  getById: adminProcedure
    .input(z.object({ ticketId: z.number().int().positive() }))
    .query(async ({ input }) => getFeedbackTicketById(input.ticketId)),

  updateStatus: adminProcedure
    .input(
      z.object({
        ticketId: z.number().int().positive(),
        status: z.enum(FEEDBACK_STATUSES),
        note: z.string().max(2000).optional(),
        duplicateOfTicketId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false as const, error: "Database not available" };
      const ticket = await getFeedbackTicketById(input.ticketId);
      if (!ticket) return { success: false as const, error: "Ticket not found" };

      await db
        .update(platformFeedbackTickets)
        .set({
          status: input.status,
          ...(input.status === "duplicate" && input.duplicateOfTicketId
            ? { duplicateOfTicketId: input.duplicateOfTicketId }
            : {}),
        })
        .where(eq(platformFeedbackTickets.id, input.ticketId));

      await appendFeedbackStatusHistory(input.ticketId, {
        from: ticket.status as (typeof FEEDBACK_STATUSES)[number],
        to: input.status,
        note: input.note,
        at: new Date().toISOString(),
        byUserId: ctx.user.id,
      });

      await insertAdminAuditLog({
        adminUserId: ctx.user.id,
        procedurePath: "adminFeedback.updateStatus",
        inputSummary: `ticketId=${input.ticketId} status=${input.status}`,
      });
      return { success: true as const };
    }),

  updateAssignment: adminProcedure
    .input(
      z.object({
        ticketId: z.number().int().positive(),
        assignedAgent: z.enum(FEEDBACK_AGENT_ASSIGNEES).optional(),
        agentTags: z.array(z.string().max(64)).max(20).optional(),
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
          ...(input.assignedAgent !== undefined ? { assignedAgent: input.assignedAgent } : {}),
          ...(input.agentTags !== undefined ? { agentTags: input.agentTags } : {}),
        })
        .where(eq(platformFeedbackTickets.id, input.ticketId));
      await insertAdminAuditLog({
        adminUserId: ctx.user.id,
        procedurePath: "adminFeedback.updateAssignment",
        inputSummary: `ticketId=${input.ticketId} agent=${input.assignedAgent ?? "—"}`,
      });
      return { success: true as const };
    }),

  respond: adminProcedure
    .input(
      z.object({
        ticketId: z.number().int().positive(),
        adminResponse: z.string().min(1).max(8000),
        status: z.enum(FEEDBACK_STATUSES).optional(),
        note: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false as const, error: "Database not available" };
      const ticket = await getFeedbackTicketById(input.ticketId);
      if (!ticket) return { success: false as const, error: "Ticket not found" };

      const nextStatus = input.status ?? ticket.status;
      await db
        .update(platformFeedbackTickets)
        .set({
          adminResponse: input.adminResponse.trim(),
          respondedAt: new Date(),
          respondedBy: ctx.user.id,
          ...(input.status ? { status: input.status } : {}),
        })
        .where(eq(platformFeedbackTickets.id, input.ticketId));

      if (input.status && input.status !== ticket.status) {
        await appendFeedbackStatusHistory(input.ticketId, {
          from: ticket.status as (typeof FEEDBACK_STATUSES)[number],
          to: input.status,
          note: input.note ?? "Admin response saved",
          at: new Date().toISOString(),
          byUserId: ctx.user.id,
        });
      }

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
