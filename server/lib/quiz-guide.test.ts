import { describe, expect, it, vi } from "vitest";
import { aiAssistantRouter } from "../routers/ai-assistant";
import type { TrpcContext } from "../_core/context";

const mockInvokeLLM = vi.fn().mockResolvedValue({
  choices: [
    {
      message: {
        content: "Mocked response",
      },
    },
  ],
});

vi.mock("../_core/llm", () => ({
  invokeLLM: (...args: any[]) => mockInvokeLLM(...args),
}));

// Mock db client calls to prevent adminProcedure auditing errors
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue({}),
  insertAdminAuditLog: vi.fn().mockResolvedValue({ success: true }),
}));

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 7001,
      openId: "test-provider",
      email: "test@example.com",
      name: "Test Provider",
      loginMethod: "manus",
      role: "provider",
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

describe("getQuizGuideAnalysis", () => {
  it("sends question and answers to Gemini and returns parsed physiological analysis", async () => {
    mockInvokeLLM.mockClear();
    const mockResponse = JSON.stringify({
      pathophysiology: "The patient's capillary refill is 4 seconds, indicating peripheral vasoconstriction due to distributive septic shock.",
      comparison: "Your choice of 0.1 mg epinephrine was correct, but you indicated central access first which was delayed. IO access is faster.",
      clinicalTakeaway: "1. Prioritize IO over central access in pediatric shock. 2. Rapid fluid resuscitation improves survival.",
    });

    mockInvokeLLM.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: mockResponse,
          },
        },
      ],
    });

    const ctx = createAuthContext();
    const caller = aiAssistantRouter.createCaller(ctx);

    const result = await caller.getQuizGuideAnalysis({
      question: "What is the first step in septic shock fluid management?",
      options: ["Central line access", "Intraosseous access", "Wait for vitals"],
      correctOption: "Intraosseous access",
      userAnswer: "Central line access",
      explanation: "IO is faster than central line during arrest/shock.",
    });

    expect(result.success).toBe(true);
    expect(result.pathophysiology).toContain("distributive septic shock");
    expect(result.comparison).toContain("IO access is faster");
    expect(result.clinicalTakeaway).toContain("Prioritize IO");

    const callArgs = mockInvokeLLM.mock.calls[0][0];
    expect(callArgs.messages[0].content).toContain("pediatric emergency medicine tutor and clinical physiologist");
    expect(callArgs.messages[0].content).toContain("What is the first step");
  });
});
