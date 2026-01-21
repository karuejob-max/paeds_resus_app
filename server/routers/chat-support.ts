import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const chatSupportRouter = router({
  // Create new conversation
  createConversation: protectedProcedure
    .input(
      z.object({
        topic: z.enum(["activation_help", "password_reset", "course_enrollment", "payment_issue", "technical_support", "other"]),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        initialMessage: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const conversationId = Math.floor(Math.random() * 1000000);
        
        console.log(`[CHAT] New conversation created: ${conversationId} for provider ${ctx.user.id}`);

        return {
          success: true,
          conversationId,
          message: "Chat conversation started. A support agent will be with you shortly.",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create conversation",
        });
      }
    }),

  // Send message in conversation
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        content: z.string().min(1).max(5000),
        messageType: z.enum(["text", "file", "system"]).default("text"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const messageId = Math.floor(Math.random() * 1000000);

        console.log(`[CHAT] Message ${messageId} sent in conversation ${input.conversationId}`);

        return {
          success: true,
          messageId,
          timestamp: new Date(),
          content: input.content,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message",
        });
      }
    }),

  // Get conversation messages
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        return {
          messages: [],
          total: 0,
          hasMore: false,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch messages",
        });
      }
    }),

  // Get active conversations for provider
  getConversations: protectedProcedure
    .input(
      z.object({
        status: z.enum(["active", "waiting", "assigned", "resolved", "closed"]).optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        return {
          conversations: [],
          total: 0,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch conversations",
        });
      }
    }),

  // Mark message as read
  markAsRead: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        conversationId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark message as read",
        });
      }
    }),

  // Send typing indicator
  sendTypingIndicator: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        isTyping: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send typing indicator",
        });
      }
    }),

  // Rate conversation (satisfaction)
  rateConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        rating: z.number().min(1).max(5),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return {
          success: true,
          message: "Thank you for your feedback!",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to rate conversation",
        });
      }
    }),

  // Close conversation
  closeConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return { success: true, message: "Conversation closed" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to close conversation",
        });
      }
    }),

  // AGENT PROCEDURES

  // Get agent dashboard data
  getAgentDashboard: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return {
        activeConversations: 0,
        waitingConversations: 0,
        averageResponseTime: 0,
        totalResolved: 0,
        agentStats: [],
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch dashboard",
      });
    }
  }),

  // Get assigned conversations for agent
  getAssignedConversations: protectedProcedure.query(async ({ ctx }) => {
    try {
      return {
        conversations: [],
        total: 0,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch assigned conversations",
      });
    }
  }),

  // Assign conversation to agent
  assignConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        agentId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return { success: true, message: "Conversation assigned" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to assign conversation",
        });
      }
    }),

  // Send canned response
  sendCannedResponse: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        cannedResponseId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return { success: true, message: "Canned response sent" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send canned response",
        });
      }
    }),

  // Get canned responses
  getCannedResponses: protectedProcedure.query(async ({ ctx }) => {
    try {
      return {
        responses: [
          {
            id: 1,
            title: "Activation Help",
            shortcut: "/activate",
            content: "To activate your account, please check your email for the activation link. Click the link and set your password.",
          },
          {
            id: 2,
            title: "Password Reset",
            shortcut: "/password",
            content: "To reset your password, click on 'Forgot Password' on the login page and follow the instructions sent to your email.",
          },
          {
            id: 3,
            title: "Course Enrollment",
            shortcut: "/enroll",
            content: "To enroll in a course, go to the Courses section, select your desired course, and click 'Enroll'. Payment will be processed immediately.",
          },
        ],
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch canned responses",
      });
    }
  }),

  // Update agent status
  updateAgentStatus: protectedProcedure
    .input(
      z.object({
        status: z.enum(["online", "offline", "away", "busy"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return { success: true, status: input.status };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update status",
        });
      }
    }),

  // Get chat analytics
  getChatAnalytics: protectedProcedure
    .input(
      z.object({
        period: z.enum(["day", "week", "month"]).default("week"),
        agentId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return {
          totalConversations: 0,
          averageResponseTime: 0,
          averageSatisfaction: 0,
          resolutionRate: 0,
          topTopics: [],
          agentPerformance: [],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch analytics",
        });
      }
    }),
});
