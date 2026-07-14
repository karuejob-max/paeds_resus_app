import { describe, expect, it, vi } from "vitest";
import { aiAssistantRouter } from "../routers/ai-assistant";
import type { TrpcContext } from "../_core/context";
import { BEDSIDE_REDIRECT_REPLY } from "./gemini-user-assist";

const mockInvokeLLM = vi.fn().mockResolvedValue({
  choices: [
    {
      message: {
        content: "Mocked Gemini Assistant Response",
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
      role: "user",
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

describe("aiAssistantRouter", () => {
  describe("sendMessage", () => {
    it("invokes LLM for non-clinical platform help query", async () => {
      mockInvokeLLM.mockClear();
      const ctx = createAuthContext();
      const caller = aiAssistantRouter.createCaller(ctx);

      const result = await caller.sendMessage({
        message: "How do I download my PALS certificate?",
        context: "general",
      });

      expect(result.success).toBe(true);
      expect(result.response).toBe("Mocked Gemini Assistant Response");
      expect(mockInvokeLLM).toHaveBeenCalledTimes(1);
      
      // Verify system prompt matches platform help system prompt
      const callArgs = mockInvokeLLM.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain("You are Paeds Resus Help");
    });

    it("bypasses LLM and returns bedside redirect warning for clinical dosing request", async () => {
      mockInvokeLLM.mockClear();
      const ctx = createAuthContext();
      const caller = aiAssistantRouter.createCaller(ctx);

      const result = await caller.sendMessage({
        message: "Give me adrenaline dosing mcg/kg right now for active resus",
        context: "clinical",
      });

      expect(result.success).toBe(true);
      expect(result.response).toBe(BEDSIDE_REDIRECT_REPLY);
      expect(mockInvokeLLM).not.toHaveBeenCalled();
    });
  });

  describe("getQuizTutorResponse", () => {
    it("invokes LLM to tutor learner on quiz question details", async () => {
      mockInvokeLLM.mockClear();
      const ctx = createAuthContext();
      const caller = aiAssistantRouter.createCaller(ctx);

      const result = await caller.getQuizTutorResponse({
        question: "What is the CPR compression depth for infants?",
        options: ["1-2cm", "4-5cm", "7-8cm"],
        correctOption: "4-5cm",
        userAnswer: "1-2cm",
        explanation: "CPR compression depth for infants should be 1/3 the chest depth, approx 4-5cm.",
        userQuery: "Why isn't 1-2cm correct?",
        messages: [],
      });

      expect(result.success).toBe(true);
      expect(result.response).toBe("Mocked Gemini Assistant Response");
      expect(mockInvokeLLM).toHaveBeenCalledTimes(1);

      const callArgs = mockInvokeLLM.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain("learning tutor for micro-course quizzes");
      expect(callArgs.messages[1].content).toContain("What is the CPR compression depth for infants?");
    });

    it("returns bedside redirect warning if learner asks clinical query to tutor", async () => {
      mockInvokeLLM.mockClear();
      const ctx = createAuthContext();
      const caller = aiAssistantRouter.createCaller(ctx);

      const result = await caller.getQuizTutorResponse({
        question: "What is the CPR compression depth for infants?",
        options: ["1-2cm", "4-5cm", "7-8cm"],
        correctOption: "4-5cm",
        userAnswer: "1-2cm",
        explanation: "CPR compression depth for infants should be 1/3 the chest depth, approx 4-5cm.",
        userQuery: "Give adrenaline dose mcg/kg for active resus in front of me",
        messages: [],
      });

      expect(result.success).toBe(true);
      expect(result.response).toBe(BEDSIDE_REDIRECT_REPLY);
      expect(mockInvokeLLM).not.toHaveBeenCalled();
    });
  });
});
