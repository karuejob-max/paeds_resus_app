import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { googleWorkspaceService } from "../google-workspace";

export const googleWorkspaceRouter = router({
  /**
   * Send enrollment confirmation email
   */
  sendEnrollmentConfirmation: protectedProcedure
    .input(
      z.object({
        recipientEmail: z.string().email(),
        recipientName: z.string(),
        courseTitle: z.string(),
        enrollmentId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await googleWorkspaceService.sendEnrollmentConfirmation(
        input.recipientEmail,
        input.recipientName,
        input.courseTitle,
        input.enrollmentId
      );

      return {
        success: result.success,
        messageId: result.messageId,
      };
    }),

  /**
   * Send payment confirmation email
   */
  sendPaymentConfirmation: protectedProcedure
    .input(
      z.object({
        recipientEmail: z.string().email(),
        recipientName: z.string(),
        amount: z.number().positive(),
        currency: z.string(),
        paymentMethod: z.string(),
        transactionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await googleWorkspaceService.sendPaymentConfirmation(
        input.recipientEmail,
        input.recipientName,
        input.amount,
        input.currency,
        input.paymentMethod,
        input.transactionId
      );

      return {
        success: result.success,
        messageId: result.messageId,
      };
    }),

  /**
   * Send training reminder email
   */
  sendTrainingReminder: protectedProcedure
    .input(
      z.object({
        recipientEmail: z.string().email(),
        recipientName: z.string(),
        trainingDate: z.date(),
        trainingTime: z.string(),
        location: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await googleWorkspaceService.sendTrainingReminder(
        input.recipientEmail,
        input.recipientName,
        input.trainingDate,
        input.trainingTime,
        input.location
      );

      return {
        success: result.success,
        messageId: result.messageId,
      };
    }),

  /**
   * Send certificate email
   */
  sendCertificateEmail: protectedProcedure
    .input(
      z.object({
        recipientEmail: z.string().email(),
        recipientName: z.string(),
        courseTitle: z.string(),
        certificateNumber: z.string(),
        completionDate: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await googleWorkspaceService.sendCertificateEmail(
        input.recipientEmail,
        input.recipientName,
        input.courseTitle,
        input.certificateNumber,
        input.completionDate
      );

      return {
        success: result.success,
        messageId: result.messageId,
      };
    }),

  /**
   * Schedule training session (creates calendar event)
   */
  scheduleTrainingSession: adminProcedure
    .input(
      z.object({
        title: z.string(),
        instructorEmail: z.string().email(),
        attendeeEmails: z.array(z.string().email()),
        startTime: z.date(),
        endTime: z.date(),
        location: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await googleWorkspaceService.scheduleTrainingSession(
        input.title,
        input.instructorEmail,
        input.attendeeEmails,
        input.startTime,
        input.endTime,
        input.location,
        input.description
      );

      return {
        success: result.success,
        eventId: result.eventId,
      };
    }),

  /**
   * Create institutional folder structure
   */
  createInstitutionalFolders: adminProcedure
    .input(
      z.object({
        institutionName: z.string(),
        adminEmail: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await googleWorkspaceService.createInstitutionalFolders(
        input.institutionName,
        input.adminEmail
      );

      return {
        success: result.success,
        folders: result.folders,
        error: result.error,
      };
    }),

  /**
   * Get email statistics
   */
  getEmailStatistics: adminProcedure.query(() => {
    const stats = googleWorkspaceService.getEmailStatistics();
    return {
      success: true,
      ...stats,
    };
  }),

  /**
   * Get calendar statistics
   */
  getCalendarStatistics: adminProcedure.query(() => {
    const stats = googleWorkspaceService.getCalendarStatistics();
    return {
      success: true,
      ...stats,
    };
  }),

  /**
   * Get sent emails history
   */
  getSentEmailsHistory: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
      })
    )
    .query(({ input }) => {
      const history = googleWorkspaceService.getSentEmailsHistory(input.limit);
      return {
        success: true,
        emails: history,
        total: history.length,
      };
    }),

  /**
   * Get calendar events
   */
  getCalendarEvents: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
      })
    )
    .query(({ input }) => {
      const events = googleWorkspaceService.getCalendarEvents(input.limit);
      return {
        success: true,
        events,
        total: events.length,
      };
    }),
});
