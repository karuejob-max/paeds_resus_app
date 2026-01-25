import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  chatConversations,
  chatMessages,
  supportAgents,
  cannedResponses,
  chatAnalytics,
} from "../../drizzle/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";

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
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Create conversation
        const result = await db
          .insert(chatConversations)
          .values({
            userId: ctx.user.id,
            topic: input.topic,
            priority: input.priority || "medium",
            status: "open",
          });
        
        const conversationId = (result as any).insertId || 1;
        const [conversation] = await db
          .select()
          .from(chatConversations)
          .where(eq(chatConversations.id, Number(conversationId)));

        // Create initial message
        await db.insert(chatMessages).values({
          conversationId: conversation.id,
          senderId: ctx.user.id,
          senderType: "user",
          content: input.initialMessage,
          messageType: "text",
        });

        console.log(`[CHAT] New conversation created: ${conversation.id} for provider ${ctx.user.id}`);

        return {
          success: true,
          conversationId: conversation.id,
          message: "Chat conversation started. A support agent will be with you shortly.",
        };
      } catch (error) {
        console.error("[CHAT] Error creating conversation:", error);
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
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Verify conversation exists and user has access
        const [conversation] = await db
          .select()
          .from(chatConversations)
          .where(
            and(
              eq(chatConversations.id, input.conversationId),
              eq(chatConversations.userId, ctx.user.id)
            )
          );

        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Create message
        const result = await db
          .insert(chatMessages)
          .values({
            conversationId: input.conversationId,
            senderId: ctx.user.id,
            senderType: "user",
            content: input.content,
            messageType: input.messageType,
          });
        
        const messageId = (result as any).insertId || 1;
        const [message] = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.id, Number(messageId)));

        console.log(`[CHAT] Message ${message.id} sent in conversation ${input.conversationId}`);

        return {
          success: true,
          messageId: message.id,
          timestamp: message.createdAt,
          content: input.content,
        };
      } catch (error) {
        console.error("[CHAT] Error sending message:", error);
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
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Verify conversation exists and user has access
        const [conversation] = await db
          .select()
          .from(chatConversations)
          .where(
            and(
              eq(chatConversations.id, input.conversationId),
              eq(chatConversations.userId, ctx.user.id)
            )
          );

        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Get total count
        const [{ total }] = await db
          .select({ total: sql<number>`COUNT(*)` })
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, input.conversationId));

        // Get messages
        const messages = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, input.conversationId))
          .orderBy(asc(chatMessages.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return {
          messages,
          total,
          hasMore: input.offset + input.limit < total,
        };
      } catch (error) {
        console.error("[CHAT] Error fetching messages:", error);
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
        status: z.enum(["open", "assigned", "in_progress", "resolved", "closed"]).optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const whereConditions = input.status
          ? and(eq(chatConversations.userId, ctx.user.id), eq(chatConversations.status, input.status))
          : eq(chatConversations.userId, ctx.user.id);
        
        const query = db
          .select()
          .from(chatConversations)
          .where(whereConditions);

        const conversations = await query
          .orderBy(desc(chatConversations.createdAt))
          .limit(input.limit);

        const countResult = await db
          .select({ total: sql<number>`COUNT(*)` })
          .from(chatConversations)
          .where(eq(chatConversations.userId, ctx.user.id));
        const total = countResult[0]?.total || 0;

        return {
          conversations,
          total,
        };
      } catch (error) {
        console.error("[CHAT] Error fetching conversations:", error);
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
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Verify user has access to conversation
        const [conversation] = await db
          .select()
          .from(chatConversations)
          .where(
            and(
              eq(chatConversations.id, input.conversationId),
              eq(chatConversations.userId, ctx.user.id)
            )
          );

        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        await db
          .update(chatMessages)
          .set({
            isRead: true,
            readAt: new Date(),
          })
          .where(eq(chatMessages.id, input.messageId));

        return { success: true };
      } catch (error) {
        console.error("[CHAT] Error marking message as read:", error);
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
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Verify conversation exists
        const [conversation] = await db
          .select()
          .from(chatConversations)
          .where(
            and(
              eq(chatConversations.id, input.conversationId),
              eq(chatConversations.userId, ctx.user.id)
            )
          );

        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // In a real implementation, this would broadcast via WebSocket
        return { success: true };
      } catch (error) {
        console.error("[CHAT] Error sending typing indicator:", error);
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
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Verify conversation exists and user has access
        const [conversation] = await db
          .select()
          .from(chatConversations)
          .where(
            and(
              eq(chatConversations.id, input.conversationId),
              eq(chatConversations.userId, ctx.user.id)
            )
          );

        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Update conversation status to resolved
        await db
          .update(chatConversations)
          .set({
            status: "resolved",
            updatedAt: new Date(),
          })
          .where(eq(chatConversations.id, input.conversationId));

        return {
          success: true,
          message: "Thank you for your feedback!",
        };
      } catch (error) {
        console.error("[CHAT] Error rating conversation:", error);
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
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Verify conversation exists and user has access
        const [conversation] = await db
          .select()
          .from(chatConversations)
          .where(
            and(
              eq(chatConversations.id, input.conversationId),
              eq(chatConversations.userId, ctx.user.id)
            )
          );

        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        await db
          .update(chatConversations)
          .set({
            status: "closed",
            updatedAt: new Date(),
          })
          .where(eq(chatConversations.id, input.conversationId));

        return { success: true, message: "Conversation closed" };
      } catch (error) {
        console.error("[CHAT] Error closing conversation:", error);
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
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get active conversations
      const [{ activeConversations }] = await db
        .select({ activeConversations: sql<number>`COUNT(*)` })
        .from(chatConversations)
        .where(eq(chatConversations.status, "in_progress"));

      // Get waiting conversations
      const [{ waitingConversations }] = await db
        .select({ waitingConversations: sql<number>`COUNT(*)` })
        .from(chatConversations)
        .where(eq(chatConversations.status, "open"));

      // Get total resolved
      const [{ totalResolved }] = await db
        .select({ totalResolved: sql<number>`COUNT(*)` })
        .from(chatConversations)
        .where(eq(chatConversations.status, "resolved"));

      // Get agent stats
      const agentStats = await db
        .select({
          agentId: supportAgents.id,
          agentName: supportAgents.agentName,
          activeConversations: supportAgents.activeConversations,
          totalResolved: supportAgents.totalResolved,
          status: supportAgents.status,
        })
        .from(supportAgents);

      return {
        activeConversations,
        waitingConversations,
        averageResponseTime: 0, // Would need timestamps for real calculation
        totalResolved,
        agentStats,
      };
    } catch (error) {
      console.error("[CHAT] Error fetching agent dashboard:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch dashboard",
      });
    }
  }),

  // Get assigned conversations for agent
  getAssignedConversations: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Get agent record
      const [agent] = await db
        .select()
        .from(supportAgents)
        .where(eq(supportAgents.userId, ctx.user.id));

      if (!agent) {
        return { conversations: [], total: 0 };
      }

      const conversations = await db
        .select()
        .from(chatConversations)
        .where(eq(chatConversations.agentId, agent.id))
        .orderBy(desc(chatConversations.createdAt));

      return {
        conversations,
        total: conversations.length,
      };
    } catch (error) {
      console.error("[CHAT] Error fetching assigned conversations:", error);
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
        
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        

        // Verify agent exists
        const [agent] = await db
          .select()
          .from(supportAgents)
          .where(eq(supportAgents.id, input.agentId));

        if (!agent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Agent not found",
          });
        }

        // Update conversation
        await db
          .update(chatConversations)
          .set({
            agentId: input.agentId,
            status: "assigned",
            updatedAt: new Date(),
          })
          .where(eq(chatConversations.id, input.conversationId));

        // Update agent active conversations count
        if (agent.activeConversations !== null) {
          await db
            .update(supportAgents)
            .set({
              activeConversations: agent.activeConversations + 1,
            })
            .where(eq(supportAgents.id, input.agentId));
        }

        return { success: true, message: "Conversation assigned" };
      } catch (error) {
        console.error("[CHAT] Error assigning conversation:", error);
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
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Get canned response
        const [response] = await db
          .select()
          .from(cannedResponses)
          .where(eq(cannedResponses.id, input.cannedResponseId));

        if (!response) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Canned response not found",
          });
        }

        // Create message from canned response
        await db.insert(chatMessages).values({
          conversationId: input.conversationId,
          senderId: ctx.user.id,
          senderType: "agent",
          content: response.content,
          messageType: "text",
        });

        return { success: true, message: "Canned response sent" };
      } catch (error) {
        console.error("[CHAT] Error sending canned response:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send canned response",
        });
      }
    }),

  // Get canned responses
  getCannedResponses: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const responses = await db
        .select()
        .from(cannedResponses)
        .where(eq(cannedResponses.agentId, ctx.user.id));

      return { responses };
    } catch (error) {
      console.error("[CHAT] Error fetching canned responses:", error);
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
        status: z.enum(["available", "busy", "offline"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Get or create agent record
        const [agent] = await db
          .select()
          .from(supportAgents)
          .where(eq(supportAgents.userId, ctx.user.id));

        if (agent) {
          await db
            .update(supportAgents)
            .set({ status: input.status })
            .where(eq(supportAgents.id, agent.id));
        }

        return { success: true, status: input.status };
      } catch (error) {
        console.error("[CHAT] Error updating agent status:", error);
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
        
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Get total conversations
        const [{ totalConversations }] = await db
          .select({ totalConversations: sql<number>`COUNT(*)` })
          .from(chatConversations);

        // Get resolved conversations
        const [{ resolvedConversations }] = await db
          .select({ resolvedConversations: sql<number>`COUNT(*)` })
          .from(chatConversations)
          .where(eq(chatConversations.status, "resolved"));

        // Get analytics
        const analytics = await db
          .select()
          .from(chatAnalytics)
          .orderBy(desc(chatAnalytics.updatedAt));

        const resolutionRate =
          totalConversations > 0
            ? Math.round((resolvedConversations / totalConversations) * 100)
            : 0;

        return {
          totalConversations,
          averageResponseTime: 0,
          averageSatisfaction: 0,
          resolutionRate,
          topTopics: [],
          agentPerformance: analytics,
        };
      } catch (error) {
        console.error("[CHAT] Error fetching analytics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch analytics",
        });
      }
    }),
});
