/**
 * Course Management Router
 * Handles micro-course catalog, enrollment, M-Pesa payments, and admin access
 */

import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { db } from '../db';
import { microCourses, microCourseEnrollments, payments, users } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

// Mock course data (will be seeded to DB)
const MOCK_COURSES = [
  {
    courseId: 'asthma-i',
    title: 'Paediatric Asthma I: Recognition and Initial Management',
    description: 'Recognize asthma exacerbation and implement rapid bronchodilator therapy.',
    level: 'foundational' as const,
    emergencyType: 'respiratory' as const,
    duration: 45,
    price: 80000, // 800 KES in cents
    prerequisiteId: null,
  },
  {
    courseId: 'asthma-ii',
    title: 'Paediatric Asthma II: Severe Exacerbation and Status Asthmaticus',
    description: 'Manage severe asthma exacerbation, IV magnesium, and mechanical ventilation.',
    level: 'advanced' as const,
    emergencyType: 'respiratory' as const,
    duration: 60,
    price: 120000, // 1200 KES in cents
    prerequisiteId: 'asthma-i',
  },
  {
    courseId: 'septic-shock-i',
    title: 'Paediatric Septic Shock I: Recognition and Fluid Resuscitation',
    description: 'Recognize sepsis and implement aggressive fluid resuscitation.',
    level: 'foundational' as const,
    emergencyType: 'shock' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
  },
  {
    courseId: 'septic-shock-ii',
    title: 'Paediatric Septic Shock II: Vasopressors and Organ Failure',
    description: 'Manage refractory shock with vasopressors and prevent multi-organ failure.',
    level: 'advanced' as const,
    emergencyType: 'shock' as const,
    duration: 60,
    price: 120000,
    prerequisiteId: 'septic-shock-i',
  },
  {
    courseId: 'burns-i',
    title: 'Paediatric Burns I: Recognition and First-Hour Resuscitation',
    description: 'Recognize burn severity, calculate TBSA, and implement Parkland formula.',
    level: 'foundational' as const,
    emergencyType: 'burns' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
  },
  {
    courseId: 'burns-ii',
    title: 'Paediatric Burns II: Advanced Fluid Management and Complications',
    description: 'Manage burn complications, compartment syndrome, and long-term rehabilitation.',
    level: 'advanced' as const,
    emergencyType: 'burns' as const,
    duration: 60,
    price: 120000,
    prerequisiteId: 'burns-i',
  },
  // Add more courses as needed (26 total)
];

export const coursesRouter = router({
  /**
   * List all available micro-courses
   */
  listAll: publicProcedure.query(async () => {
    try {
      const courses = await db?.query.microCourses.findMany();
      if (courses && courses.length > 0) {
        return courses;
      }
    } catch (error) {
      console.error('Error fetching courses from DB:', error);
    }

    // Fallback to mock data if DB is empty or unavailable
    return MOCK_COURSES;
  }),

  /**
   * Get user's course enrollments
   */
  getUserEnrollments: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      try {
        const enrollments = await db?.query.microCourseEnrollments.findMany({
          where: eq(microCourseEnrollments.userId, input.userId),
        });
        return enrollments || [];
      } catch (error) {
        console.error('Error fetching enrollments:', error);
        return [];
      }
    }),

  /**
   * Initiate M-Pesa enrollment (STK Push)
   */
  enrollWithMpesa: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        microCourseId: z.number(),
        courseTitle: z.string(),
        amount: z.number(), // in KES cents
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.id !== input.userId) {
        throw new Error('Unauthorized');
      }

      try {
        // Check if already enrolled
        const existing = await db?.query.microCourseEnrollments.findFirst({
          where: and(
            eq(microCourseEnrollments.userId, input.userId),
            eq(microCourseEnrollments.microCourseId, input.microCourseId)
          ),
        });

        if (existing) {
          return { success: false, message: 'Already enrolled in this course' };
        }

        // Create pending enrollment
        const enrollment = await db?.insert(microCourseEnrollments).values({
          userId: input.userId,
          microCourseId: input.microCourseId,
          enrollmentStatus: 'pending',
          paymentStatus: 'pending',
        });

        // Create payment record
        const payment = await db?.insert(payments).values({
          enrollmentId: enrollment?.[0]?.insertId || 0,
          userId: input.userId,
          amount: input.amount,
          paymentMethod: 'mpesa',
          status: 'pending',
        });

        // Trigger M-Pesa STK Push (Daraja API)
        const phoneNumber = ctx.user.phone || '';
        const stkResponse = await triggerMpesaStkPush({
          phoneNumber,
          amount: Math.round(input.amount / 100), // Convert cents to KES
          accountReference: `COURSE-${input.microCourseId}`,
          transactionDescription: `${input.courseTitle} - Paeds Resus`,
          paymentId: payment?.[0]?.insertId || 0,
        });

        return {
          success: true,
          message: 'STK Push sent to your phone',
          stkResponse,
        };
      } catch (error) {
        console.error('Enrollment error:', error);
        throw new Error('Failed to initiate enrollment');
      }
    }),

  /**
   * Grant admin free access to course
   */
  grantAdminAccess: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        microCourseId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user is admin
      const user = await db?.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!user || user.email !== 'karuejob@gmail.com') {
        throw new Error('Admin access only');
      }

      try {
        // Check if already enrolled
        const existing = await db?.query.microCourseEnrollments.findFirst({
          where: and(
            eq(microCourseEnrollments.userId, input.userId),
            eq(microCourseEnrollments.microCourseId, input.microCourseId)
          ),
        });

        if (existing) {
          return { success: false, message: 'Already enrolled' };
        }

        // Create free enrollment for admin
        await db?.insert(microCourseEnrollments).values({
          userId: input.userId,
          microCourseId: input.microCourseId,
          enrollmentStatus: 'active',
          paymentStatus: 'free',
        });

        return { success: true, message: 'Admin access granted' };
      } catch (error) {
        console.error('Admin access error:', error);
        throw new Error('Failed to grant access');
      }
    }),

  /**
   * Handle M-Pesa payment callback (webhook)
   */
  handleMpesaCallback: publicProcedure
    .input(
      z.object({
        transactionId: z.string(),
        amount: z.number(),
        phoneNumber: z.string(),
        resultCode: z.number(),
        resultDesc: z.string(),
        paymentId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const isSuccess = input.resultCode === 0;

        // Update payment record
        await db
          ?.update(payments)
          .set({
            transactionId: input.transactionId,
            status: isSuccess ? 'completed' : 'failed',
            updatedAt: new Date(),
          })
          .where(eq(payments.id, input.paymentId));

        if (isSuccess) {
          // Find enrollment linked to this payment
          const payment = await db?.query.payments.findFirst({
            where: eq(payments.id, input.paymentId),
          });

          if (payment) {
            // Update enrollment to active
            await db
              ?.update(microCourseEnrollments)
              .set({
                enrollmentStatus: 'active',
                paymentStatus: 'completed',
                updatedAt: new Date(),
              })
              .where(eq(microCourseEnrollments.id, payment.enrollmentId));

            // Send confirmation SMS (optional)
            await sendConfirmationSms({
              phoneNumber: input.phoneNumber,
              amount: input.amount,
              message: 'Course enrollment successful! Check your email for access details.',
            });
          }
        }

        return { success: isSuccess };
      } catch (error) {
        console.error('M-Pesa callback error:', error);
        throw new Error('Failed to process payment');
      }
    }),

  /**
   * Complete course and generate certificate
   */
  completeCourse: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.number(),
        quizScore: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error('Unauthorized');

      try {
        // Verify quiz passed (80%+)
        if (input.quizScore < 80) {
          return { success: false, message: 'Quiz score must be 80% or higher' };
        }

        // Update enrollment
        await db
          ?.update(microCourseEnrollments)
          .set({
            enrollmentStatus: 'completed',
            quizScore: input.quizScore,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(microCourseEnrollments.id, input.enrollmentId));

        // Generate certificate (placeholder - integrate with PDF generation)
        const certificateUrl = `/certificates/${input.enrollmentId}-${Date.now()}.pdf`;

        return {
          success: true,
          message: 'Course completed! Certificate generated.',
          certificateUrl,
        };
      } catch (error) {
        console.error('Course completion error:', error);
        throw new Error('Failed to complete course');
      }
    }),
});

/**
 * Helper: Trigger M-Pesa STK Push via Daraja API
 */
async function triggerMpesaStkPush({
  phoneNumber,
  amount,
  accountReference,
  transactionDescription,
  paymentId,
}: {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDescription: string;
  paymentId: number;
}) {
  // Implementation would call Daraja API
  // For now, return mock response
  console.log('STK Push triggered:', {
    phoneNumber,
    amount,
    accountReference,
    transactionDescription,
  });

  return {
    CheckoutRequestID: `mock-${paymentId}-${Date.now()}`,
    ResponseCode: '0',
    ResponseDescription: 'Success. Request accepted for processing',
  };
}

/**
 * Helper: Send confirmation SMS
 */
async function sendConfirmationSms({
  phoneNumber,
  amount,
  message,
}: {
  phoneNumber: string;
  amount: number;
  message: string;
}) {
  // Implementation would send SMS via Twilio or similar
  console.log('SMS sent:', { phoneNumber, amount, message });
}
