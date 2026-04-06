import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { liveTrainingService } from "../live-training";

export const liveTrainingRouter = router({
  /**
   * Create a new live session
   */
  createSession: adminProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        startTime: z.number(),
        endTime: z.number(),
        maxParticipants: z.number().min(1).max(500),
      })
    )
    .mutation(({ ctx, input }) => {
      const session = liveTrainingService.createSession({
        title: input.title,
        description: input.description,
        instructorId: ctx.user.id,
        startTime: input.startTime,
        endTime: input.endTime,
        maxParticipants: input.maxParticipants,
        status: "scheduled",
        metadata: {},
      });

      return {
        success: true,
        session,
      };
    }),

  /**
   * Get session details
   */
  getSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ input }) => {
      const session = liveTrainingService.getSession(input.sessionId);

      return {
        success: !!session,
        session: session || undefined,
      };
    }),

  /**
   * Join session
   */
  joinSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        isAudioEnabled: z.boolean().optional().default(true),
        isVideoEnabled: z.boolean().optional().default(true),
      })
    )
    .mutation(({ ctx, input }) => {
      const success = liveTrainingService.addParticipant(input.sessionId, {
        userId: ctx.user.id,
        name: ctx.user.name || "Anonymous",
        email: ctx.user.email || "unknown@example.com",
        joinedAt: Date.now(),
        role: "participant",
        isAudioEnabled: input.isAudioEnabled,
        isVideoEnabled: input.isVideoEnabled,
        screenShareActive: false,
      });

      return {
        success,
        message: success ? "Joined session" : "Failed to join session",
      };
    }),

  /**
   * Leave session
   */
  leaveSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(({ ctx, input }) => {
      const success = liveTrainingService.removeParticipant(input.sessionId, ctx.user.id);

      return {
        success,
        message: success ? "Left session" : "Failed to leave session",
      };
    }),

  /**
   * Create breakout room
   */
  createBreakoutRoom: adminProcedure
    .input(
      z.object({
        sessionId: z.string(),
        name: z.string(),
      })
    )
    .mutation(({ input }) => {
      const room = liveTrainingService.createBreakoutRoom(input.sessionId, input.name);

      return {
        success: !!room,
        room,
      };
    }),

  /**
   * Start recording
   */
  startRecording: adminProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(({ input }) => {
      const recordingId = liveTrainingService.startRecording(input.sessionId);

      return {
        success: !!recordingId,
        recordingId: recordingId || "",
      };
    }),

  /**
   * End recording
   */
  endRecording: adminProcedure
    .input(
      z.object({
        recordingId: z.string(),
        duration: z.number(),
        size: z.number(),
      })
    )
    .mutation(({ input }) => {
      const success = liveTrainingService.endRecording(input.recordingId, input.duration, input.size);

      return {
        success,
        message: success ? "Recording saved" : "Failed to save recording",
      };
    }),

  /**
   * Get session analytics
   */
  getSessionAnalytics: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ input }) => {
      const analytics = liveTrainingService.getSessionAnalytics(input.sessionId);

      return {
        success: !!analytics,
        analytics,
      };
    }),

  /**
   * Get upcoming sessions
   */
  getUpcomingSessions: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional().default(10) }))
    .query(({ input }) => {
      const sessions = liveTrainingService.getUpcomingSessions(input.limit);

      return {
        success: true,
        sessions,
        total: sessions.length,
      };
    }),

  /**
   * Get past sessions
   */
  getPastSessions: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional().default(10) }))
    .query(({ input }) => {
      const sessions = liveTrainingService.getPastSessions(input.limit);

      return {
        success: true,
        sessions,
        total: sessions.length,
      };
    }),

  /**
   * Get session recordings
   */
  getSessionRecordings: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ input }) => {
      const recordings = liveTrainingService.getSessionRecordings(input.sessionId);

      return {
        success: true,
        recordings,
        total: recordings.length,
      };
    }),

  /**
   * Get session statistics
   */
  getSessionStatistics: adminProcedure.query(() => {
    const stats = liveTrainingService.getSessionStatistics();

    return {
      success: true,
      ...stats,
    };
  }),

  /**
   * End session
   */
  endSession: adminProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(({ input }) => {
      const success = liveTrainingService.endSession(input.sessionId);

      return {
        success,
        message: success ? "Session ended" : "Failed to end session",
      };
    }),
});
