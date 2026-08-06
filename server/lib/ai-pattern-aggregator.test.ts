import { describe, expect, it, vi } from "vitest";
import { deidentifyText } from "./ai-pattern-aggregator";
import { fpkbRouter } from "../routers/fpkb";
import type { TrpcContext } from "../_core/context";

const mockInvokeLLM = vi.fn().mockResolvedValue({
  choices: [
    {
      message: {
        content: "Mocked Gemini Response",
      },
    },
  ],
});

vi.mock("../_core/llm", () => ({
  invokeLLM: (...args: any[]) => mockInvokeLLM(...args),
}));

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: () => ({
      from: () => ({
        orderBy: () => ({
          limit: vi.fn().mockResolvedValue([
            { id: 1, presentation: "Patient Jane presented with fever. Email: jane@example.com. Phone: +254711223344.", systemGaps: "None", gapDetails: "None", outcome: "Discharged" }
          ])
        })
      })
    }),
    insert: () => ({
      values: vi.fn().mockResolvedValue({ success: true })
    })
  }),
  insertAdminAuditLog: vi.fn().mockResolvedValue({ success: true })
}));

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-provider",
      email: "test@example.com",
      name: "Test Provider",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as any,
    res: {} as any,
  };
}

describe("ai-pattern-aggregator", () => {
  describe("deidentifyText", () => {
    it("strips emails, phone numbers, and doctor names successfully", () => {
      const rawText = "Contact Dr. James Mwangi at james@test.com or +254 712 345678 regarding the sepsis checklist.";
      const clean = deidentifyText(rawText);
      expect(clean).not.toContain("james@test.com");
      expect(clean).not.toContain("712");
      expect(clean).not.toContain("James Mwangi");
      expect(clean).toContain("[REDACTED EMAIL]");
      expect(clean).toContain("[REDACTED PHONE]");
      expect(clean).toContain("Dr. [REDACTED]");
    });
  });

  describe("fpkbRouter", () => {
    describe("runAiPatternDiscovery", () => {
      it("redacts via a first LLM call, then discovers patterns via a second, and both are scrubbed of raw PII", async () => {
        mockInvokeLLM.mockClear();

        // Call 1: the redaction pass (redactObservationsWithLLM). Echo the
        // (already prescrubbed-by-deidentifyText) input back unchanged --
        // good enough for this test, which only cares that redaction ran
        // as its own, first, separate call before discovery.
        mockInvokeLLM.mockImplementationOnce(async (args: any) => {
          const requestBody = JSON.parse(args.messages[1].content);
          return {
            choices: [{ message: { content: JSON.stringify({ items: requestBody.items }) } }],
          };
        });

        // Call 2: the pattern-discovery pass.
        const mockResponse = JSON.stringify({
          proposedPatterns: [
            {
              patternTrack: "FAILURE",
              patternName: "Delayed Oxygen Administration in Triage",
              primaryDomain: "TREATMENT",
              description: "Oxygen tanks missing keys causing escalation lags",
              evidenceBasis: "3 observations in Nyeri level 4",
              cadreScope: "nursing",
              associatedObservations: ["care-signal-1"]
            }
          ]
        });
        mockInvokeLLM.mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: mockResponse
              }
            }
          ]
        });

        const ctx = createAuthContext();
        const caller = fpkbRouter.createCaller(ctx);

        const result = await caller.runAiPatternDiscovery();

        expect(result.success).toBe(true);
        expect(result.proposedPatterns.length).toBe(1);
        expect(result.proposedPatterns[0].patternName).toBe("Delayed Oxygen Administration in Triage");
        // Redaction pass + discovery pass -- see redactObservationsWithLLM's
        // doc comment for why this is deliberately 2, not 1.
        expect(mockInvokeLLM).toHaveBeenCalledTimes(2);

        const redactionCallArgs = mockInvokeLLM.mock.calls[0][0];
        expect(redactionCallArgs.messages[0].content).toContain("de-identification and redaction assistant");
        expect(redactionCallArgs.messages[1].content).not.toContain("jane@example.com");

        const discoveryCallArgs = mockInvokeLLM.mock.calls[1][0];
        expect(discoveryCallArgs.messages[0].content).toContain("analyst and clinical auditor");
        expect(discoveryCallArgs.messages[1].content).not.toContain("jane@example.com");
      });

      it("falls back to local-scrub-only text for an item the LLM redaction pass fails on, without dropping it", async () => {
        mockInvokeLLM.mockClear();

        // Redaction call fails outright (e.g. kill switch, network error).
        mockInvokeLLM.mockRejectedValueOnce(new Error("LLM unavailable"));

        // Discovery call still runs on the deidentifyText()-only fallback.
        mockInvokeLLM.mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify({ proposedPatterns: [] }) } }],
        });

        const ctx = createAuthContext();
        const caller = fpkbRouter.createCaller(ctx);
        const result = await caller.runAiPatternDiscovery();

        expect(result.success).toBe(true);
        expect(mockInvokeLLM).toHaveBeenCalledTimes(2);
        const discoveryCallArgs = mockInvokeLLM.mock.calls[1][0];
        // The seeded row's email is still scrubbed by the local first pass
        // even though the LLM redaction call itself failed.
        expect(discoveryCallArgs.messages[1].content).not.toContain("jane@example.com");
        expect(discoveryCallArgs.messages[1].content).toContain("[REDACTED EMAIL]");
      });
    });

    describe("approveProposedPattern", () => {
      it("inserts proposed pattern and audits the steward action", async () => {
        const ctx = createAuthContext();
        const caller = fpkbRouter.createCaller(ctx);

        const result = await caller.approveProposedPattern({
          patternTrack: "FAILURE",
          patternName: "Delayed Oxygen Administration in Triage",
          primaryDomain: "TREATMENT",
          description: "Oxygen tanks missing keys causing escalation lags",
          evidenceBasis: "3 observations in Nyeri level 4",
          cadreScope: "nursing",
          associatedObservations: ["care-signal-1"]
        });

        expect(result.success).toBe(true);
        expect(result.patternCode).toContain("FP-AI-");
      });
    });
  });
});
