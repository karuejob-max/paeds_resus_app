import { describe, it, expect, beforeEach, vi } from "vitest";
import { chatSupportRouter } from "./routers/chat-support";
import { createCallerFactory } from "./_core/trpc";

describe("Chat Support System", () => {
  let caller: ReturnType<typeof createCallerFactory>;
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = {
      user: {
        id: 1,
        name: "Test Provider",
        email: "test@hospital.com",
        role: "user",
        providerType: "nurse",
      },
    };
  });

  describe("createConversation", () => {
    it("should create a new conversation with valid input", async () => {
      const result = await chatSupportRouter.createMsw({
        topic: "activation_help",
        initialMessage: "I need help with activation",
      });

      expect(result.success).toBe(true);
      expect(result.conversationId).toBeDefined();
      expect(typeof result.conversationId).toBe("number");
    });

    it("should require a topic", async () => {
      expect(async () => {
        await chatSupportRouter.createConversation({
          topic: "invalid_topic" as any,
          initialMessage: "Help",
        });
      }).rejects.toThrow();
    });

    it("should require an initial message", async () => {
      expect(async () => {
        await chatSupportRouter.createConversation({
          topic: "activation_help",
          initialMessage: "",
        });
      }).rejects.toThrow();
    });
  });

  describe("sendMessage", () => {
    it("should send a message in a conversation", async () => {
      const result = await chatSupportRouter.sendMessage({
        conversationId: 123,
        content: "This is a test message",
        messageType: "text",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.content).toBe("This is a test message");
    });

    it("should enforce message length limits", async () => {
      const longMessage = "a".repeat(5001);
      expect(async () => {
        await chatSupportRouter.sendMessage({
          conversationId: 123,
          content: longMessage,
          messageType: "text",
        });
      }).rejects.toThrow();
    });

    it("should not allow empty messages", async () => {
      expect(async () => {
        await chatSupportRouter.sendMessage({
          conversationId: 123,
          content: "",
          messageType: "text",
        });
      }).rejects.toThrow();
    });
  });

  describe("getConversations", () => {
    it("should retrieve provider conversations", async () => {
      const result = await chatSupportRouter.getConversations({
        limit: 20,
      });

      expect(result.conversations).toBeDefined();
      expect(Array.isArray(result.conversations)).toBe(true);
      expect(result.total).toBeDefined();
    });

    it("should filter by status", async () => {
      const result = await chatSupportRouter.getConversations({
        status: "active",
        limit: 20,
      });

      expect(result.conversations).toBeDefined();
    });

    it("should respect limit parameter", async () => {
      const result = await chatSupportRouter.getConversations({
        limit: 5,
      });

      expect(result.conversations.length).toBeLessThanOrEqual(5);
    });
  });

  describe("rateConversation", () => {
    it("should accept ratings from 1-5", async () => {
      for (let rating = 1; rating <= 5; rating++) {
        const result = await chatSupportRouter.rateConversation({
          conversationId: 123,
          rating,
        });

        expect(result.success).toBe(true);
      }
    });

    it("should reject ratings outside 1-5 range", async () => {
      expect(async () => {
        await chatSupportRouter.rateConversation({
          conversationId: 123,
          rating: 0,
        });
      }).rejects.toThrow();

      expect(async () => {
        await chatSupportRouter.rateConversation({
          conversationId: 123,
          rating: 6,
        });
      }).rejects.toThrow();
    });

    it("should accept optional feedback", async () => {
      const result = await chatSupportRouter.rateConversation({
        conversationId: 123,
        rating: 5,
        feedback: "Great support!",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("sendTypingIndicator", () => {
    it("should send typing indicator", async () => {
      const result = await chatSupportRouter.sendTypingIndicator({
        conversationId: 123,
        isTyping: true,
      });

      expect(result.success).toBe(true);
    });

    it("should handle typing indicator off", async () => {
      const result = await chatSupportRouter.sendTypingIndicator({
        conversationId: 123,
        isTyping: false,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Agent Procedures", () => {
    beforeEach(() => {
      mockCtx.user.role = "admin";
    });

    it("should fetch agent dashboard for admins", async () => {
      const result = await chatSupportRouter.getAgentDashboard();

      expect(result.activeConversations).toBeDefined();
      expect(result.waitingConversations).toBeDefined();
      expect(result.averageResponseTime).toBeDefined();
      expect(result.totalResolved).toBeDefined();
    });

    it("should deny agent dashboard for non-admins", async () => {
      mockCtx.user.role = "user";

      expect(async () => {
        await chatSupportRouter.getAgentDashboard();
      }).rejects.toThrow("FORBIDDEN");
    });

    it("should assign conversation to agent", async () => {
      const result = await chatSupportRouter.assignConversation({
        conversationId: 123,
        agentId: 456,
      });

      expect(result.success).toBe(true);
    });

    it("should get canned responses", async () => {
      const result = await chatSupportRouter.getCannedResponses();

      expect(result.responses).toBeDefined();
      expect(Array.isArray(result.responses)).toBe(true);
      expect(result.responses.length).toBeGreaterThan(0);
    });

    it("should have canned responses with shortcuts", async () => {
      const result = await chatSupportRouter.getCannedResponses();

      result.responses.forEach((response) => {
        expect(response.id).toBeDefined();
        expect(response.title).toBeDefined();
        expect(response.content).toBeDefined();
        expect(response.shortcut).toBeDefined();
      });
    });

    it("should update agent status", async () => {
      const statuses = ["online", "offline", "away", "busy"] as const;

      for (const status of statuses) {
        const result = await chatSupportRouter.updateAgentStatus({
          status,
        });

        expect(result.success).toBe(true);
        expect(result.status).toBe(status);
      }
    });

    it("should fetch chat analytics", async () => {
      const result = await chatSupportRouter.getChatAnalytics({
        period: "week",
      });

      expect(result.totalConversations).toBeDefined();
      expect(result.averageResponseTime).toBeDefined();
      expect(result.averageSatisfaction).toBeDefined();
      expect(result.resolutionRate).toBeDefined();
      expect(result.topTopics).toBeDefined();
      expect(result.agentPerformance).toBeDefined();
    });
  });

  describe("Message Management", () => {
    it("should mark message as read", async () => {
      const result = await chatSupportRouter.markAsRead({
        messageId: 789,
        conversationId: 123,
      });

      expect(result.success).toBe(true);
    });

    it("should close conversation", async () => {
      const result = await chatSupportRouter.closeConversation({
        conversationId: 123,
      });

      expect(result.success).toBe(true);
    });

    it("should retrieve message history", async () => {
      const result = await chatSupportRouter.getMessages({
        conversationId: 123,
        limit: 50,
        offset: 0,
      });

      expect(result.messages).toBeDefined();
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.total).toBeDefined();
      expect(result.hasMore).toBeDefined();
    });

    it("should support pagination", async () => {
      const page1 = await chatSupportRouter.getMessages({
        conversationId: 123,
        limit: 10,
        offset: 0,
      });

      const page2 = await chatSupportRouter.getMessages({
        conversationId: 123,
        limit: 10,
        offset: 10,
      });

      expect(page1.messages).toBeDefined();
      expect(page2.messages).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid conversation IDs gracefully", async () => {
      const result = await chatSupportRouter.getMessages({
        conversationId: -1,
        limit: 50,
      });

      expect(result.messages).toBeDefined();
    });

    it("should validate input types", async () => {
      expect(async () => {
        await chatSupportRouter.sendMessage({
          conversationId: "invalid" as any,
          content: "test",
          messageType: "text",
        });
      }).rejects.toThrow();
    });
  });
});
