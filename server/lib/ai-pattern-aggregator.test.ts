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
      it("triggers Gemini and returns proposed patterns list", async () => {
        mockInvokeLLM.mockClear();
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
        expect(mockInvokeLLM).toHaveBeenCalledTimes(1);

        const callArgs = mockInvokeLLM.mock.calls[0][0];
        expect(callArgs.messages[0].content).toContain("analyst and clinical auditor");
        expect(callArgs.messages[1].content).not.toContain("jane@example.com");
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
