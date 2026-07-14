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
import {
  analyzeFeedbackTicket,
  clusterFeedbackTickets,
  draftFeedbackReply,
  generateFeedbackAgentBrief,
  type FeedbackTicketLlmInput,
} from "../lib/feedback-ai-assist";
import { TRPCError } from "@trpc/server";

function toLlmInput(ticket: {
  id: number;
  category: string;
  issueType?: string | null;
  severity?: string | null;
  priority?: string | null;
  status: string;
  message: string;
  contextJson?: unknown;
  assignedAgent?: string | null;
  agentTags?: unknown;
}): FeedbackTicketLlmInput {
  return {
    id: ticket.id,
    category: ticket.category,
    issueType: ticket.issueType,
    severity: ticket.severity,
    priority: ticket.priority,
    status: ticket.status,
    message: ticket.message,
    contextJson: ticket.contextJson,
    assignedAgent: ticket.assignedAgent,
    agentTags: Array.isArray(ticket.agentTags)
      ? ticket.agentTags.map((t) => String(t))
      : null,
  };
}

function llmUnavailableError(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  if (/GEMINI_API_KEY|BUILT_IN_FORGE|not configured/i.test(message)) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Gemini is not configured. Set GEMINI_API_KEY on the server.",
    });
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: `AI assist failed: ${message.slice(0, 300)}`,
  });
}

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
        issueType: z.enum(FEEDBACK_ISSUE_TYPES).optional(),
        severity: z.enum(FEEDBACK_SEVERITIES).optional(),
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
          ...(input.issueType !== undefined ? { issueType: input.issueType } : {}),
          ...(input.severity !== undefined ? { severity: input.severity } : {}),
        })
        .where(eq(platformFeedbackTickets.id, input.ticketId));
      await insertAdminAuditLog({
        adminUserId: ctx.user.id,
        procedurePath: "adminFeedback.updateAssignment",
        inputSummary: `ticketId=${input.ticketId} agent=${input.assignedAgent ?? "—"} severity=${input.severity ?? "—"} issueType=${input.issueType ?? "—"}`,
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

  /** Gemini triage suggestion for one ticket — does not mutate the row until CEO applies. */
  analyzeTicket: adminProcedure
    .input(z.object({ ticketId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await getFeedbackTicketById(input.ticketId);
      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }
      try {
        const suggestion = await analyzeFeedbackTicket(toLlmInput(ticket));
        await insertAdminAuditLog({
          adminUserId: ctx.user.id,
          procedurePath: "adminFeedback.analyzeTicket",
          inputSummary: `ticketId=${input.ticketId}`,
        });
        return { ticketId: ticket.id, suggestion };
      } catch (err) {
        llmUnavailableError(err);
      }
    }),

  /** Cluster open/in-progress tickets for duplicate / theme detection. */
  clusterOpen: adminProcedure
    .input(z.object({ limit: z.number().int().min(2).max(40).default(30) }).optional())
    .mutation(async ({ ctx, input }) => {
      const tickets = await listAdminFeedbackTickets({
        status: "actionable",
        limit: input?.limit ?? 30,
      });
      try {
        const result = await clusterFeedbackTickets(tickets.map(toLlmInput));
        await insertAdminAuditLog({
          adminUserId: ctx.user.id,
          procedurePath: "adminFeedback.clusterOpen",
          inputSummary: `ticketCount=${tickets.length} clusters=${result.clusters.length}`,
        });
        return { ...result, scannedCount: tickets.length };
      } catch (err) {
        llmUnavailableError(err);
      }
    }),

  /** Draft a user-facing admin reply; CEO must review before Save. */
  draftReply: adminProcedure
    .input(
      z.object({
        ticketId: z.number().int().positive(),
        guidance: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ticket = await getFeedbackTicketById(input.ticketId);
      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }
      try {
        const draftReply = await draftFeedbackReply(toLlmInput(ticket), input.guidance);
        await insertAdminAuditLog({
          adminUserId: ctx.user.id,
          procedurePath: "adminFeedback.draftReply",
          inputSummary: `ticketId=${input.ticketId}`,
        });
        return { ticketId: ticket.id, draftReply };
      } catch (err) {
        llmUnavailableError(err);
      }
    }),

  /**
   * Paste-ready Cursor/Manus agent brief for one ticket or a cluster.
   * Does not mutate tickets — CEO copies/downloads the markdown.
   */
  generateAgentBrief: adminProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number().int().positive()).min(1).max(10),
        clusterTheme: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const uniqueIds = [...new Set(input.ticketIds)];
      const tickets = [];
      for (const id of uniqueIds) {
        const row = await getFeedbackTicketById(id);
        if (!row) {
          throw new TRPCError({ code: "NOT_FOUND", message: `Ticket #${id} not found` });
        }
        tickets.push(toLlmInput(row));
      }
      try {
        const brief = await generateFeedbackAgentBrief(tickets, {
          clusterTheme: input.clusterTheme,
        });
        await insertAdminAuditLog({
          adminUserId: ctx.user.id,
          procedurePath: "adminFeedback.generateAgentBrief",
          inputSummary: `ticketIds=${uniqueIds.join(",")}`,
        });
        return brief;
      } catch (err) {
        llmUnavailableError(err);
      }
    }),
});
