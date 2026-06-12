import { eq, desc, and, inArray, gte, lte, sql } from "drizzle-orm";
import type {
  FeedbackCategory,
  FeedbackContextJson,
  FeedbackIssueType,
  FeedbackPriority,
  FeedbackSeverity,
  FeedbackStatusHistoryEntry,
  FeedbackTicketStatus,
} from "../../shared/platform-feedback";
import {
  FEEDBACK_CATEGORY_LABELS,
  defaultIssueTypeForCategory,
  defaultSeverityForCategory,
} from "../../shared/platform-feedback";
import { getDb } from "../db";
import { platformFeedbackTickets } from "../../drizzle/schema";

export type CreateFeedbackTicketInput = {
  userId: number;
  category: FeedbackCategory;
  message: string;
  subject?: string;
  contextJson?: FeedbackContextJson;
  priority?: FeedbackPriority;
  issueType?: FeedbackIssueType;
  severity?: FeedbackSeverity;
};

export async function createPlatformFeedbackTicket(
  input: CreateFeedbackTicketInput
): Promise<{ success: true; ticketId: number } | { success: false; error: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };

  const priority =
    input.priority ?? (input.category === "safety_concern" ? "safety" : "normal");
  const subject = input.subject?.trim() || FEEDBACK_CATEGORY_LABELS[input.category];
  const issueType = input.issueType ?? defaultIssueTypeForCategory(input.category);
  const severity = input.severity ?? defaultSeverityForCategory(input.category, priority);

  const result = await db.insert(platformFeedbackTickets).values({
    userId: input.userId,
    category: input.category,
    issueType,
    subject,
    message: input.message.trim(),
    contextJson: input.contextJson ?? null,
    status: "open",
    priority,
    severity,
    statusHistoryJson: [
      {
        from: null,
        to: "open",
        note: "Submitted by user",
        at: new Date().toISOString(),
        byUserId: input.userId,
      } satisfies FeedbackStatusHistoryEntry,
    ],
  });

  return { success: true, ticketId: Number(result[0].insertId) };
}

export function formatFeedbackExportMarkdown(
  tickets: Array<{
    id: number;
    category: string;
    issueType: string | null;
    status: string;
    priority: string;
    severity: string;
    message: string;
    subject: string | null;
    contextJson: unknown;
    assignedAgent: string | null;
    agentTags: unknown;
    createdAt: Date;
  }>,
  categoryCounts: Record<string, number>
): string {
  const lines = [
    "# Open platform feedback tickets",
    "",
    `**Generated:** ${new Date().toISOString().slice(0, 10)} · **Open tickets:** ${tickets.length}`,
    "",
    "## Category counts",
    "",
    "| Category | Count |",
    "|----------|------:|",
    ...Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => `| ${cat} | ${count} |`),
    "",
    "## Verbatim messages",
    "",
  ];

  for (const t of tickets) {
    lines.push(
      `### #${t.id} — ${t.category} / ${t.issueType ?? "—"} (${t.severity}, ${t.priority})`,
      "",
      `- **Status:** ${t.status}`,
      `- **Assigned:** ${t.assignedAgent ?? "unassigned"}`,
      `- **Tags:** ${JSON.stringify(t.agentTags ?? [])}`,
      `- **Subject:** ${t.subject ?? "—"}`,
      `- **Created:** ${t.createdAt.toISOString()}`,
      `- **Context:** \`${JSON.stringify(t.contextJson ?? {})}\``,
      "",
      t.message,
      "",
      "---",
      ""
    );
  }

  return lines.join("\n");
}

export async function listOpenFeedbackTicketsForExport() {
  const db = await getDb();
  if (!db) return { tickets: [], categoryCounts: {} as Record<string, number> };

  const tickets = await db
    .select()
    .from(platformFeedbackTickets)
    .where(inArray(platformFeedbackTickets.status, ["open", "in_progress"]))
    .orderBy(
      desc(platformFeedbackTickets.severity),
      desc(platformFeedbackTickets.priority),
      desc(platformFeedbackTickets.createdAt)
    );

  const categoryCounts: Record<string, number> = {};
  for (const t of tickets) categoryCounts[t.category] = (categoryCounts[t.category] ?? 0) + 1;

  return { tickets, categoryCounts };
}

export async function getFeedbackTicketById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(platformFeedbackTickets).where(eq(platformFeedbackTickets.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listUserFeedbackTickets(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(platformFeedbackTickets)
    .where(eq(platformFeedbackTickets.userId, userId))
    .orderBy(desc(platformFeedbackTickets.createdAt))
    .limit(limit);
}

export type AdminFeedbackListFilters = {
  status?: FeedbackTicketStatus | "actionable";
  category?: FeedbackCategory;
  issueType?: FeedbackIssueType;
  severity?: FeedbackSeverity;
  courseSlug?: string;
  assignedAgent?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
};

export async function listAdminFeedbackTickets(filters?: AdminFeedbackListFilters) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.status === "actionable") {
    conditions.push(inArray(platformFeedbackTickets.status, ["open", "in_progress"]));
  } else if (filters?.status) {
    conditions.push(eq(platformFeedbackTickets.status, filters.status));
  }
  if (filters?.category) conditions.push(eq(platformFeedbackTickets.category, filters.category));
  if (filters?.issueType) conditions.push(eq(platformFeedbackTickets.issueType, filters.issueType));
  if (filters?.severity) conditions.push(eq(platformFeedbackTickets.severity, filters.severity));
  if (filters?.assignedAgent && filters.assignedAgent !== "all") {
    if (filters.assignedAgent === "unassigned") {
      conditions.push(sql`(${platformFeedbackTickets.assignedAgent} IS NULL OR ${platformFeedbackTickets.assignedAgent} = 'unassigned')`);
    } else {
      conditions.push(eq(platformFeedbackTickets.assignedAgent, filters.assignedAgent));
    }
  }
  if (filters?.courseSlug?.trim()) {
    const slug = filters.courseSlug.trim();
    conditions.push(
      sql`JSON_UNQUOTE(JSON_EXTRACT(${platformFeedbackTickets.contextJson}, '$.courseSlug')) = ${slug}`
    );
  }
  if (filters?.createdAfter) {
    conditions.push(gte(platformFeedbackTickets.createdAt, filters.createdAfter));
  }
  if (filters?.createdBefore) {
    conditions.push(lte(platformFeedbackTickets.createdAt, filters.createdBefore));
  }

  const limit = filters?.limit ?? 100;
  const query = db.select().from(platformFeedbackTickets);

  if (conditions.length === 0) {
    return query.orderBy(desc(platformFeedbackTickets.createdAt)).limit(limit);
  }
  if (conditions.length === 1) {
    return query.where(conditions[0]).orderBy(desc(platformFeedbackTickets.createdAt)).limit(limit);
  }
  return query.where(and(...conditions)).orderBy(desc(platformFeedbackTickets.createdAt)).limit(limit);
}

export async function appendFeedbackStatusHistory(
  ticketId: number,
  entry: FeedbackStatusHistoryEntry
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const ticket = await getFeedbackTicketById(ticketId);
  if (!ticket) return;
  const history = Array.isArray(ticket.statusHistoryJson)
    ? [...(ticket.statusHistoryJson as FeedbackStatusHistoryEntry[]), entry]
    : [entry];
  await db
    .update(platformFeedbackTickets)
    .set({ statusHistoryJson: history })
    .where(eq(platformFeedbackTickets.id, ticketId));
}
