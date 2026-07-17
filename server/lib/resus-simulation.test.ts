import { describe, expect, it, vi } from "vitest";
import { practiceLabRouter } from "../routers/practice-lab";
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

// Mock db client calls
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockResolvedValue([{ id: 101, paymentStatus: "completed", cognitiveModulesComplete: true }]),
      })),
    })),
  }),
  insertAdminAuditLog: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock("../lib/training-workspace-guard", () => ({
  assertTrainingWorkspaceOrAdmin: vi.fn().mockReturnValue(true),
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

describe("resus-simulation", () => {
  describe("sendAiRoleplayMessage", () => {
    it("sends user orders to Gemini and returns nurse response + updated vitals", async () => {
      mockInvokeLLM.mockClear();
      const mockResponse = JSON.stringify({
        dialog: "Yes, doctor. Giving 20ml/kg normal saline now.",
        vitals: {
          heartRate: 155,
          respiratoryRate: 40,
          bloodPressure: "80/48",
          spo2: 94,
          temperature: 39.2,
        },
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
      const caller = practiceLabRouter.createCaller(ctx);

      const result = await caller.sendAiRoleplayMessage({
        scenarioName: "Septic Shock (Infant)",
        scenarioDescription: "18-month infant presenting with fever and cold extremities.",
        vitals: { heartRate: 175, respiratoryRate: 48, bloodPressure: "68/42", spo2: 91, temperature: 39.4 },
        chatHistory: [],
        userMessage: "Start IO access and give 20ml/kg normal saline bolus",
      });

      expect(result.success).toBe(true);
      expect(result.dialog).toContain("Giving 20ml/kg normal saline");
      expect(result.vitals.heartRate).toBe(155);

      const callArgs = mockInvokeLLM.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain("nurse assistant and parent roleplayer");
      expect(callArgs.messages[callArgs.messages.length - 1].content).toContain("Start IO access");
    });
  });

  describe("evaluateAiRoleplaySession", () => {
    it("analyzes chat history and returns score, pass status, and events log", async () => {
      mockInvokeLLM.mockClear();
      const mockResponse = JSON.stringify({
        score: 88,
        passed: true,
        debrief: "Strengths: Prompt fluid resuscitation. Gaps: Slight lag in oxygen delivery.",
        events: [
          { timestamp: 15, type: "action", description: "Clinician requested IO access", correct: true },
          { timestamp: 90, type: "action", description: "Fluid bolus given", correct: true },
        ],
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
      const caller = practiceLabRouter.createCaller(ctx);

      const result = await caller.evaluateAiRoleplaySession({
        scenarioName: "Septic Shock (Infant)",
        scenarioDescription: "18-month infant presenting with fever and cold extremities.",
        chatHistory: [
          { role: "assistant", content: "Hi Doctor, initial orders?" },
          { role: "user", content: "Establish access and give fluid bolus" },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.score).toBe(88);
      expect(result.passed).toBe(true);
      expect(result.events.length).toBe(2);
      expect(result.events[0].description).toBe("Clinician requested IO access");

      const callArgs = mockInvokeLLM.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain("expert clinical quality auditor");
      expect(callArgs.messages[0].content).toContain("Establish access");
    });
  });
});
