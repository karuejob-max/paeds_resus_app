import { eq, desc, and, inArray } from "drizzle-orm";
import type { FeedbackCategory, FeedbackContextJson, FeedbackPriority } from "../../shared/platform-feedback";
import { FEEDBACK_CATEGORY_LABELS } from "../../shared/platform-feedback";
import { getDb } from "../db";
import { platformFeedbackTickets } from "../../drizzle/schema";

export type CreateFeedbackTicketInput = {
  userId: number;
  category: FeedbackCategory;
  message: string;
  subject?: string;
  contextJson?: FeedbackContextJson;
  priority?: FeedbackPriority;
};

export async function createPlatformFeedbackTicket(
  input: CreateFeedbackTicketInput
): Promise<{ success: true; ticketId: number } | { success: false; error: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };

  const priority =
    input.priority ?? (input.category === "safety_concern" ? "safety" : "normal");
  const subject = input.subject?.trim() || FEEDBACK_CATEGORY_LABELS[input.category];

  const result = await db.insert(platformFeedbackTickets).values({
    userId: input.userId,
    category: input.category,
    subject,
    message: input.message.trim(),
    contextJson: input.contextJson ?? null,
    status: "open",
    priority,
  });

  return { success: true, ticketId: Number(result[0].insertId) };
}

export function formatFeedbackExportMarkdown(
  tickets: Array<{
    id: number;
    category: string;
    status: string;
    priority: string;
    message: string;
    subject: string | null;
    contextJson: unknown;
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
      `### #${t.id} — ${t.category} (${t.priority})`,
      "",
      `- **Status:** ${t.status}`,
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
    .orderBy(desc(platformFeedbackTickets.priority), desc(platformFeedbackTickets.createdAt));

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

export async function listAdminFeedbackTickets(filters?: {
  status?: "open" | "in_progress" | "resolved" | "wont_fix";
  category?: FeedbackCategory;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.status) conditions.push(eq(platformFeedbackTickets.status, filters.status));
  if (filters?.category) conditions.push(eq(platformFeedbackTickets.category, filters.category));

  const limit = filters?.limit ?? 100;
  const query = db.select().from(platformFeedbackTickets);

  if (conditions.length === 1) {
    return query.where(conditions[0]).orderBy(desc(platformFeedbackTickets.createdAt)).limit(limit);
  }
  if (conditions.length === 2) {
    return query.where(and(...conditions)).orderBy(desc(platformFeedbackTickets.createdAt)).limit(limit);
  }
  return query.orderBy(desc(platformFeedbackTickets.createdAt)).limit(limit);
}
