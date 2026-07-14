/**
 * Gemini-assisted triage for CEO feedback inbox.
 * Suggestions only — never auto-mutate tickets or clinical content.
 */
import { invokeLLM } from "../_core/llm";
import {
  FEEDBACK_AGENT_ASSIGNEES,
  FEEDBACK_CATEGORIES,
  FEEDBACK_ISSUE_TYPES,
  FEEDBACK_SEVERITIES,
  type FeedbackAgentAssignee,
  type FeedbackCategory,
  type FeedbackIssueType,
  type FeedbackSeverity,
} from "../../shared/platform-feedback";

export type FeedbackTicketLlmInput = {
  id: number;
  category: string;
  issueType?: string | null;
  severity?: string | null;
  priority?: string | null;
  status: string;
  message: string;
  contextJson?: unknown;
};

export type FeedbackAnalyzeSuggestion = {
  summary: string;
  suggestedSeverity: FeedbackSeverity;
  suggestedIssueType: FeedbackIssueType;
  suggestedAssignee: FeedbackAgentAssignee;
  suggestedTags: string[];
  triageNotes: string;
  regressionGuard: string;
  confidence: "low" | "medium" | "high";
};

export type FeedbackClusterGroup = {
  theme: string;
  ticketIds: number[];
  suggestedSeverity: FeedbackSeverity;
  rationale: string;
};

export type FeedbackClusterResult = {
  clusters: FeedbackClusterGroup[];
  unclusteredTicketIds: number[];
};

function asEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("LLM response did not contain a JSON object");
  }
  return JSON.parse(candidate.slice(start, end + 1)) as unknown;
}

function messageContentToString(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text ?? "");
        }
        return "";
      })
      .join("\n");
  }
  return String(content ?? "");
}

export function parseFeedbackAnalyzeSuggestion(raw: unknown): FeedbackAnalyzeSuggestion {
  const obj = (typeof raw === "string" ? extractJsonObject(raw) : raw) as Record<string, unknown>;
  const tags = Array.isArray(obj.suggestedTags)
    ? obj.suggestedTags.map((t) => String(t).trim()).filter(Boolean).slice(0, 8)
    : [];
  return {
    summary: String(obj.summary ?? "").trim() || "No summary returned.",
    suggestedSeverity: asEnum(obj.suggestedSeverity, FEEDBACK_SEVERITIES, "medium"),
    suggestedIssueType: asEnum(obj.suggestedIssueType, FEEDBACK_ISSUE_TYPES, "other"),
    suggestedAssignee: asEnum(obj.suggestedAssignee, FEEDBACK_AGENT_ASSIGNEES, "unassigned"),
    suggestedTags: tags,
    triageNotes: String(obj.triageNotes ?? "").trim(),
    regressionGuard: String(obj.regressionGuard ?? "").trim(),
    confidence: asEnum(obj.confidence, ["low", "medium", "high"] as const, "medium"),
  };
}

export function parseFeedbackClusterResult(raw: unknown, knownIds: Set<number>): FeedbackClusterResult {
  const obj = (typeof raw === "string" ? extractJsonObject(raw) : raw) as Record<string, unknown>;
  const clustersRaw = Array.isArray(obj.clusters) ? obj.clusters : [];
  const clusters: FeedbackClusterGroup[] = [];
  const seen = new Set<number>();

  for (const c of clustersRaw) {
    if (!c || typeof c !== "object") continue;
    const row = c as Record<string, unknown>;
    const ids = Array.isArray(row.ticketIds)
      ? row.ticketIds
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && knownIds.has(id))
      : [];
    const unique = [...new Set(ids)].filter((id) => !seen.has(id));
    if (unique.length < 2) continue;
    unique.forEach((id) => seen.add(id));
    clusters.push({
      theme: String(row.theme ?? "Related tickets").trim() || "Related tickets",
      ticketIds: unique,
      suggestedSeverity: asEnum(row.suggestedSeverity, FEEDBACK_SEVERITIES, "medium"),
      rationale: String(row.rationale ?? "").trim(),
    });
  }

  const unclusteredFromModel = Array.isArray(obj.unclusteredTicketIds)
    ? obj.unclusteredTicketIds.map((id) => Number(id)).filter((id) => knownIds.has(id) && !seen.has(id))
    : [];
  const remaining = [...knownIds].filter((id) => !seen.has(id));
  const unclusteredTicketIds = [...new Set([...unclusteredFromModel, ...remaining])];

  return { clusters, unclusteredTicketIds };
}

function formatTicketBlock(ticket: FeedbackTicketLlmInput): string {
  const ctx =
    ticket.contextJson && typeof ticket.contextJson === "object"
      ? JSON.stringify(ticket.contextJson)
      : "{}";
  return [
    `Ticket #${ticket.id}`,
    `category=${ticket.category}`,
    `issueType=${ticket.issueType ?? "unset"}`,
    `severity=${ticket.severity ?? "unset"}`,
    `priority=${ticket.priority ?? "normal"}`,
    `status=${ticket.status}`,
    `context=${ctx}`,
    `message=<<EOF`,
    ticket.message.slice(0, 4000),
    `EOF`,
  ].join("\n");
}

const ANALYZE_SYSTEM = `You are the triage assistant for Paeds Resus platform feedback (CEO inbox).
Return ONLY valid JSON (no markdown) with this shape:
{
  "summary": "1-2 sentence operational summary",
  "suggestedSeverity": "low|medium|high|critical",
  "suggestedIssueType": "bug|content|ux|billing|clinical|other",
  "suggestedAssignee": "unassigned|cursor|manus|ceo|clinical",
  "suggestedTags": ["short-tag"],
  "triageNotes": "concrete next step for CEO/agent",
  "regressionGuard": "what must NOT be deleted or shallowed when fixing (especially content/clinical)",
  "confidence": "low|medium|high"
}
Rules:
- Brand: Paeds Resus (org/platform); ResusGPS only for bedside tool issues.
- Prefer clinical/content as high when learner-facing harm or unsafe dosing/protocol risk is alleged.
- Safety_concern / priority=safety → severity at least high.
- Assign cursor/manus for engineering gaps; clinical for protocol judgment; ceo for policy.
- Never invent patient identifiers; never propose changing clinical truth without human review.`;

const CLUSTER_SYSTEM = `You cluster open Paeds Resus feedback tickets for CEO triage.
Return ONLY valid JSON:
{
  "clusters": [
    {
      "theme": "short theme",
      "ticketIds": [1,2],
      "suggestedSeverity": "low|medium|high|critical",
      "rationale": "why these are the same issue"
    }
  ],
  "unclusteredTicketIds": [3]
}
Rules:
- A cluster needs at least 2 ticket IDs from the input set only.
- Prefer clustering true duplicates / same bug over loose thematic groups.
- Leave unrelated tickets in unclusteredTicketIds.`;

const DRAFT_REPLY_SYSTEM = `You draft a brief admin reply for a Paeds Resus feedback ticket.
Return ONLY valid JSON: { "draftReply": "..." }
Tone: professional, grateful, concrete. Brand as Paeds Resus.
Do not invent that a fix shipped unless told. Do not give clinical dosing advice.
Keep under 120 words.`;

async function llmJson(system: string, user: string): Promise<unknown> {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    responseFormat: { type: "json_object" },
    maxTokens: 2048,
  });
  const content = messageContentToString(response.choices[0]?.message?.content);
  return extractJsonObject(content);
}

export async function analyzeFeedbackTicket(
  ticket: FeedbackTicketLlmInput
): Promise<FeedbackAnalyzeSuggestion> {
  const raw = await llmJson(ANALYZE_SYSTEM, formatTicketBlock(ticket));
  return parseFeedbackAnalyzeSuggestion(raw);
}

export async function clusterFeedbackTickets(
  tickets: FeedbackTicketLlmInput[]
): Promise<FeedbackClusterResult> {
  const knownIds = new Set(tickets.map((t) => t.id));
  if (tickets.length < 2) {
    return { clusters: [], unclusteredTicketIds: [...knownIds] };
  }
  const user = tickets
    .slice(0, 40)
    .map((t) => formatTicketBlock({ ...t, message: t.message.slice(0, 600) }))
    .join("\n\n---\n\n");
  const raw = await llmJson(CLUSTER_SYSTEM, user);
  return parseFeedbackClusterResult(raw, knownIds);
}

export async function draftFeedbackReply(
  ticket: FeedbackTicketLlmInput,
  extraGuidance?: string
): Promise<string> {
  const guidance = extraGuidance?.trim()
    ? `\nCEO guidance for tone/content:\n${extraGuidance.trim().slice(0, 1000)}`
    : "";
  const raw = (await llmJson(
    DRAFT_REPLY_SYSTEM,
    `${formatTicketBlock(ticket)}${guidance}`
  )) as Record<string, unknown>;
  const draft = String(raw.draftReply ?? "").trim();
  if (!draft) throw new Error("LLM returned empty draftReply");
  return draft;
}

/** Narrow category helper for callers that want typed labels in prompts. */
export function isFeedbackCategory(value: string): value is FeedbackCategory {
  return (FEEDBACK_CATEGORIES as readonly string[]).includes(value);
}
