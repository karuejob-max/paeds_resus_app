/**
 * tRPC procedures for micro-courses (Paediatric Septic Shock I, II, etc.)
 * Aligned with PSOT §16 (Learning products: UX, certificates, tiered courses)
 */

import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { loadMicroCoursesFromDb } from '../lib/micro-course-catalog';

/**
 * Legacy router name: prefer `courses.listAll` + `EnrollmentModal` for paid fellowship micro-courses.
 */
export const microCoursesRouter = router({
  /**
   * Fellowship ADF micro-courses (same catalog as `courses.listAll`).
   */
  listCourses: publicProcedure.query(async () => {
    const rows = await loadMicroCoursesFromDb();
    return rows.map((r) => ({
      id: r.courseId,
      courseId: r.courseId,
      courseDisplayName: r.title,
      level: r.level,
      duration: r.duration,
      price: r.price,
      description: r.description ?? '',
      targetAudience: 'Healthcare providers',
      alignment: [] as string[],
    }));
  }),

  /**
   * Get course details with modules and quiz
   */
  getCourseDetails: publicProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ input }) => {
      // TODO: Fetch from database with modules and quiz
      return {
        id: input.courseId,
        courseDisplayName: 'Paediatric Septic Shock I: Recognition and First-Hour Safe Actions',
        level: 'foundational',
        duration: 45,
        modules: [
          {
            id: 'module-1',
            moduleNumber: 1,
            title: 'Recognition of Septic Shock',
            duration: 15,
          },
          {
            id: 'module-2',
            moduleNumber: 2,
            title: 'First-Hour Safe Actions',
            duration: 15,
          },
          {
            id: 'module-3',
            moduleNumber: 3,
            title: 'When to Refer',
            duration: 10,
          },
        ],
        quiz: {
          id: 'quiz-1',
          title: 'Paediatric Septic Shock I Quiz',
          passingScore: 80,
          questionCount: 10,
        },
      };
    }),

  /**
   * Enroll user in a micro-course
   */
  enrollCourse: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        paymentMethodId: z.string().optional(), // M-Pesa, card, etc.
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('User not authenticated');

      // TODO: Create enrollment record
      // TODO: Process payment if required
      // TODO: Emit analyticsEvent for course enrollment

      return {
        enrollmentId: 'enrollment-123',
        courseId: input.courseId,
        userId: ctx.user.id,
        status: 'enrolled',
        enrolledAt: new Date(),
      };
    }),

  /**
   * Get user's course enrollments
   */
  getUserEnrollments: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error('User not authenticated');

    // TODO: Fetch from database
    return [
      {
        enrollmentId: 'enrollment-123',
        courseId: 'septic-shock-i',
        courseDisplayName: 'Paediatric Septic Shock I: Recognition and First-Hour Safe Actions',
        status: 'in-progress',
        enrolledAt: new Date(),
        completedModules: 1,
        totalModules: 3,
        quizAttempts: 0,
        completedAt: null,
      },
    ];
  }),

  /**
   * Mark module as completed
   */
  completeModule: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.string(),
        moduleId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('User not authenticated');

      // TODO: Update module progress in database
      // TODO: Emit analyticsEvent for module completion

      return {
        enrollmentId: input.enrollmentId,
        moduleId: input.moduleId,
        completedAt: new Date(),
        status: 'completed',
      };
    }),

  /**
   * Submit quiz attempt
   */
  submitQuiz: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.string(),
        quizId: z.string(),
        answers: z.record(z.string(), z.string()), // { questionId: answer }
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('User not authenticated');

      // TODO: Score quiz
      // TODO: Save quiz attempt to database
      // TODO: Check if passed (score >= 80)
      // TODO: If passed, mark course as completed
      // TODO: If passed, generate certificate
      // TODO: Emit analyticsEvent for quiz submission

      const score = 85; // Example: 85%
      const passed = score >= 80;

      return {
        enrollmentId: input.enrollmentId,
        quizId: input.quizId,
        attemptNumber: 1,
        score,
        passed,
        message: passed ? 'Congratulations! You passed the quiz.' : 'You did not pass. Please review and try again.',
        certificateId: passed ? 'cert-123' : null,
      };
    }),

  /**
   * Get user's certificates
   */
  getUserCertificates: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error('User not authenticated');

    // TODO: Fetch from database
    return [
      {
        certificateId: 'cert-123',
        courseDisplayName: 'Paediatric Septic Shock I: Recognition and First-Hour Safe Actions',
        issueDate: new Date(),
        verificationCode: 'SEPTIC-SHOCK-I-ABC123',
        pdfUrl: '/certificates/cert-123.pdf',
      },
    ];
  }),

  /**
   * Download certificate PDF
   */
  downloadCertificate: protectedProcedure
    .input(z.object({ certificateId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('User not authenticated');

      // TODO: Generate or retrieve PDF
      // TODO: Return signed URL for download

      return {
        certificateId: input.certificateId,
        downloadUrl: '/api/certificates/cert-123/download',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };
    }),

  /**
   * Verify certificate by code (public endpoint)
   */
  verifyCertificate: publicProcedure
    .input(z.object({ verificationCode: z.string() }))
    .query(async ({ input }) => {
      // TODO: Look up certificate by verification code
      // TODO: Return certificate details

      return {
        valid: true,
        certificateId: 'cert-123',
        courseDisplayName: 'Paediatric Septic Shock I: Recognition and First-Hour Safe Actions',
        recipientName: 'John Doe',
        issueDate: new Date(),
        expiryDate: null,
      };
    }),

  /**
   * Get learning journey progress (e.g., Septic Shock I → II → ResusGPS)
   */
  getJourneyProgress: protectedProcedure
    .input(z.object({ journeyId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('User not authenticated');

      // TODO: Fetch journey and user progress
      return {
        journeyId: input.journeyId,
        journeyName: 'Paediatric Septic Shock Journey',
        courses: [
          {
            courseId: 'septic-shock-i',
            courseDisplayName: 'Paediatric Septic Shock I: Recognition and First-Hour Safe Actions',
            status: 'completed',
            completedAt: new Date(),
          },
          {
            courseId: 'septic-shock-ii',
            courseDisplayName: 'Paediatric Septic Shock II: Advanced Management',
            status: 'not-started',
            prerequisiteMet: true,
          },
          {
            courseId: 'resus-gps',
            courseDisplayName: 'ResusGPS: Paediatric Emergency Guidance',
            status: 'not-started',
            prerequisiteMet: true,
          },
        ],
        overallProgress: 33, // 1 of 3 courses completed
      };
    }),

  /**
   * Admin: Get course analytics (enrollments, completions, quiz pass rate)
   */
  getCourseAnalytics: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user || ctx.user.role !== 'admin') throw new Error('Admin access required');

      // TODO: Fetch analytics from database
      return {
        courseId: input.courseId,
        courseDisplayName: 'Paediatric Septic Shock I: Recognition and First-Hour Safe Actions',
        totalEnrollments: 150,
        completedEnrollments: 120,
        completionRate: 80,
        averageQuizScore: 82,
        quizPassRate: 85,
        certificatesIssued: 102,
        enrollmentsByDate: [
          { date: '2026-04-01', enrollments: 10 },
          { date: '2026-04-02', enrollments: 15 },
          { date: '2026-04-03', enrollments: 20 },
        ],
      };
    }),
});
