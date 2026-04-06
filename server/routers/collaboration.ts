import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { collaborationService } from "../collaboration";

export const collaborationRouter = router({
  /**
   * Create channel
   */
  createChannel: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        type: z.enum(["direct", "group", "institutional", "public"]),
        members: z.array(z.number()).optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const channel = collaborationService.createChannel(
        input.name,
        input.description,
        input.type as "direct" | "group" | "institutional" | "public",
        ctx.user.id,
        input.members || [],
        input.metadata || {}
      );

      return {
        success: true,
        channel,
      };
    }),

  /**
   * Send message
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        content: z.string(),
        type: z.enum(["text", "file", "image", "video", "system"]).optional(),
        attachments: z
          .array(
            z.object({
              url: z.string(),
              filename: z.string(),
              mimeType: z.string(),
              size: z.number(),
            })
          )
          .optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const message = collaborationService.sendMessage(
        input.channelId,
        ctx.user.id,
        ctx.user.name || "Unknown",
        input.content,
        (input.type || "text") as "text" | "file" | "image" | "video" | "system",
        input.attachments
      );

      return {
        success: !!message,
        message,
      };
    }),

  /**
   * Edit message
   */
  editMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        channelId: z.string(),
        newContent: z.string(),
      })
    )
    .mutation(({ input }) => {
      const message = collaborationService.editMessage(input.messageId, input.channelId, input.newContent);

      return {
        success: !!message,
        message,
      };
    }),

  /**
   * Delete message
   */
  deleteMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        channelId: z.string(),
      })
    )
    .mutation(({ input }) => {
      const success = collaborationService.deleteMessage(input.messageId, input.channelId);

      return {
        success,
        message: success ? "Message deleted" : "Failed to delete message",
      };
    }),

  /**
   * Add reaction
   */
  addReaction: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        channelId: z.string(),
        emoji: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      const success = collaborationService.addReaction(
        input.messageId,
        input.channelId,
        input.emoji,
        ctx.user.id
      );

      return {
        success,
        message: success ? "Reaction added" : "Failed to add reaction",
      };
    }),

  /**
   * Pin message
   */
  pinMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        channelId: z.string(),
      })
    )
    .mutation(({ input }) => {
      const success = collaborationService.pinMessage(input.messageId, input.channelId);

      return {
        success,
        message: success ? "Message pinned" : "Failed to pin message",
      };
    }),

  /**
   * Get channel messages
   */
  getChannelMessages: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        limit: z.number().min(1).max(100).optional().default(50),
      })
    )
    .query(({ input }) => {
      const messages = collaborationService.getChannelMessages(input.channelId, input.limit);

      return {
        success: true,
        messages,
        total: messages.length,
      };
    }),

  /**
   * Send direct message
   */
  sendDirectMessage: protectedProcedure
    .input(
      z.object({
        recipientId: z.number(),
        content: z.string(),
        attachments: z
          .array(
            z.object({
              url: z.string(),
              filename: z.string(),
              mimeType: z.string(),
              size: z.number(),
            })
          )
          .optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const message = collaborationService.sendDirectMessage(
        ctx.user.id,
        ctx.user.name || "Unknown",
        input.recipientId,
        input.content,
        input.attachments
      );

      return {
        success: !!message,
        message,
      };
    }),

  /**
   * Update user presence
   */
  updatePresence: protectedProcedure
    .input(
      z.object({
        status: z.enum(["online", "away", "offline", "in_call"]),
        currentChannel: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const presence = collaborationService.updateUserPresence(
        ctx.user.id,
        input.status as "online" | "away" | "offline" | "in_call",
        input.currentChannel
      );

      return {
        success: true,
        presence,
      };
    }),

  /**
   * Get channel members presence
   */
  getChannelMembersPresence: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
      })
    )
    .query(({ input }) => {
      const presence = collaborationService.getChannelMembersPresence(input.channelId);

      return {
        success: true,
        presence,
        total: presence.length,
      };
    }),

  /**
   * Start typing
   */
  startTyping: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      collaborationService.startTyping(input.channelId, ctx.user.id);

      return {
        success: true,
        message: "Typing indicator started",
      };
    }),

  /**
   * Stop typing
   */
  stopTyping: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      collaborationService.stopTyping(input.channelId, ctx.user.id);

      return {
        success: true,
        message: "Typing indicator stopped",
      };
    }),

  /**
   * Get typing users
   */
  getTypingUsers: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
      })
    )
    .query(({ input }) => {
      const users = collaborationService.getTypingUsers(input.channelId);

      return {
        success: true,
        users,
        total: users.length,
      };
    }),

  /**
   * Initiate video call
   */
  initiateVideoCall: protectedProcedure
    .input(
      z.object({
        participantIds: z.array(z.number()),
        channelId: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const call = collaborationService.initiateVideoCall(ctx.user.id, input.participantIds, input.channelId);

      return {
        success: true,
        call,
      };
    }),

  /**
   * Accept video call
   */
  acceptVideoCall: protectedProcedure
    .input(
      z.object({
        callId: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      const call = collaborationService.acceptVideoCall(input.callId, ctx.user.id);

      return {
        success: !!call,
        call,
      };
    }),

  /**
   * End video call
   */
  endVideoCall: protectedProcedure
    .input(
      z.object({
        callId: z.string(),
        recordingUrl: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const call = collaborationService.endVideoCall(input.callId, input.recordingUrl);

      return {
        success: !!call,
        call,
      };
    }),

  /**
   * Add channel member
   */
  addChannelMember: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        userId: z.number(),
      })
    )
    .mutation(({ input }) => {
      const success = collaborationService.addChannelMember(input.channelId, input.userId);

      return {
        success,
        message: success ? "Member added" : "Failed to add member",
      };
    }),

  /**
   * Get collaboration statistics
   */
  getStatistics: adminProcedure.query(() => {
    const stats = collaborationService.getStatistics();

    return {
      success: true,
      ...stats,
    };
  }),
});
