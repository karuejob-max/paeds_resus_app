import { describe, expect, it, vi } from "vitest";
import { guidelinesRouter } from "../routers/guidelines";
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

describe("guidelinesRouter", () => {
  describe("analyzeGuidelineDrift", () => {
    it("successfully calls Gemini LLM with protocol guidelines and parses response", async () => {
      mockInvokeLLM.mockClear();
      const mockResult = JSON.stringify({
        complianceScore: 78,
        status: "deviated",
        discrepancies: [
          {
            severity: "warning",
            topic: "Epinephrine Dosing",
            standard: "0.01 mg/kg IV",
            local: "0.02 mg/kg IV",
            explanation: "Overdosing hazard"
          }
        ]
      });

      mockInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: mockResult
            }
          }
        ]
      });

      const ctx = createAuthContext();
      const caller = guidelinesRouter.createCaller(ctx);

      const result = await caller.analyzeGuidelineDrift({
        protocolId: "cardiac_arrest",
        guidelineText: "Give epinephrine 0.02 mg/kg IV during resus."
      });

      expect(result.success).toBe(true);
      expect(result.complianceScore).toBe(78);
      expect(result.status).toBe("deviated");
      expect(result.discrepancies[0].topic).toBe("Epinephrine Dosing");
      expect(mockInvokeLLM).toHaveBeenCalledTimes(1);

      const callArgs = mockInvokeLLM.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain("clinical compliance auditor");
      expect(callArgs.messages[1].content).toContain("cardiac_arrest");
    });
  });
});
