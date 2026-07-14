import { describe, expect, it } from "vitest";
import {
  assembleAgentBriefMarkdown,
  heuristicPathsForCategory,
  parseFeedbackAnalyzeSuggestion,
  parseFeedbackClusterResult,
} from "./feedback-ai-assist";

describe("feedback-ai-assist parsers", () => {
  it("parses analyze JSON and coerces invalid enums", () => {
    const result = parseFeedbackAnalyzeSuggestion({
      summary: "Quiz answer key wrong on asthma-i",
      suggestedSeverity: "not-a-severity",
      suggestedIssueType: "content",
      suggestedAssignee: "cursor",
      suggestedTags: ["asthma-i", "quiz", ""],
      triageNotes: "Compare seed vs player explanation",
      regressionGuard: "Do not shallow formative bank",
      confidence: "high",
    });
    expect(result.suggestedSeverity).toBe("medium");
    expect(result.suggestedIssueType).toBe("content");
    expect(result.suggestedAssignee).toBe("cursor");
    expect(result.suggestedTags).toEqual(["asthma-i", "quiz"]);
    expect(result.confidence).toBe("high");
  });

  it("extracts analyze JSON from fenced model output", () => {
    const result = parseFeedbackAnalyzeSuggestion(`\`\`\`json
{"summary":"Payment STK timeout","suggestedSeverity":"high","suggestedIssueType":"billing","suggestedAssignee":"manus","suggestedTags":["mpesa"],"triageNotes":"Check Daraja env","regressionGuard":"Keep callback IP allowlist","confidence":"medium"}
\`\`\``);
    expect(result.summary).toContain("Payment");
    expect(result.suggestedSeverity).toBe("high");
  });

  it("keeps only multi-ticket clusters from known ids", () => {
    const known = new Set([1, 2, 3, 4]);
    const result = parseFeedbackClusterResult(
      {
        clusters: [
          { theme: "Same quiz bug", ticketIds: [1, 2, 99], suggestedSeverity: "high", rationale: "same course" },
          { theme: "Singleton", ticketIds: [3], suggestedSeverity: "low", rationale: "alone" },
        ],
        unclusteredTicketIds: [4],
      },
      known
    );
    expect(result.clusters).toHaveLength(1);
    expect(result.clusters[0]?.ticketIds).toEqual([1, 2]);
    expect(result.unclusteredTicketIds.sort()).toEqual([3, 4]);
  });

  it("assembles paste-ready agent brief markdown with regression guard", () => {
    const md = assembleAgentBriefMarkdown({
      enrichment: {
        title: "Fix asthma-i quiz key",
        problemStatement: "Formative answer key mismatches stem.",
        likelyFiles: ["shared/quiz-answer-contract.ts"],
        investigationCommands: ["pnpm run audit:fellowship-assessments:strict"],
        acceptanceChecks: ["Wrong key corrected without removing rationale"],
        regressionGuard: "Do not delete module 2",
        suggestedAssignee: "cursor",
      },
      heuristicPaths: heuristicPathsForCategory("course_content", "asthma-i"),
      tickets: [
        {
          id: 9,
          category: "course_content",
          issueType: "content",
          severity: "high",
          status: "open",
          message: "Option B is marked correct but explanation says A.",
          contextJson: { courseSlug: "asthma-i", pageUrl: "/micro-course/asthma-i" },
        },
      ],
    });
    expect(md).toContain("Agent brief: Fix asthma-i quiz key");
    expect(md).toContain("Do not delete module 2");
    expect(md).toContain("asthma-i");
    expect(md).toContain("Paste-ready agent prompt");
    expect(heuristicPathsForCategory("resus_gps")).toContain("pnpm run test:clinical");
  });
});
