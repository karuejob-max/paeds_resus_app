/**
 * Course Management Router
 * Handles micro-course catalog, enrollment, M-Pesa payments, and admin access
 */

import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { db } from '../db';
import { microCourses, microCourseEnrollments, payments, users } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { initiateSTKPush, validatePhoneNumber, isMpesaConfigured } from '../_core/mpesa';

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
   * Enroll user in course with M-Pesa STK Push payment
   */
  enrollWithMpesa: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        phoneNumber: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check M-Pesa configuration
        if (!isMpesaConfigured()) {
          throw new Error('M-Pesa payment system not configured. Contact admin.');
        }

        // Validate phone number
        if (!validatePhoneNumber(input.phoneNumber)) {
          throw new Error(
            'Invalid phone number. Use format: 254712345678, +254712345678, or 0712345678'
          );
        }

        // Get course
        const course = await db?.query.microCourses.findFirst({
          where: (courses, { eq }) => eq(courses.courseId, input.courseId),
        });

        if (!course) {
          throw new Error('Course not found');
        }

        // Check if already enrolled
        const existing = await db?.query.microCourseEnrollments.findFirst({
          where: (enrollments, { and, eq }) =>
            and(
              eq(enrollments.userId, ctx.user.id),
              eq(enrollments.courseId, input.courseId)
            ),
        });

        if (existing) {
          throw new Error('Already enrolled in this course');
        }

        // Create pending enrollment record
        const enrollmentResult = await db?.insert(microCourseEnrollments).values({
          userId: ctx.user.id,
          courseId: input.courseId,
          status: 'pending',
          paymentStatus: 'pending',
          enrolledAt: new Date(),
        });

        const enrollmentId = (enrollmentResult as any)?.[0]?.insertId || 0;

        if (!enrollmentId) {
          throw new Error('Failed to create enrollment record');
        }

        // Initiate STK Push
        const stkResponse = await initiateSTKPush(
          input.phoneNumber,
          course.price / 100, // Convert cents to KES
          course.courseId,
          course.title,
          enrollmentId
        );

        if (!stkResponse.success) {
          // Mark enrollment as failed
          await db
            ?.update(microCourseEnrollments)
            .set({ paymentStatus: 'failed' })
            .where((enrollments) => eq(enrollments.id, enrollmentId));

          throw new Error(stkResponse.message);
        }

        // Store checkout request ID for callback verification
        await db
          ?.update(microCourseEnrollments)
          .set({ checkoutRequestId: stkResponse.checkoutRequestId })
          .where((enrollments) => eq(enrollments.id, enrollmentId));

        // Create payment record
        await db?.insert(payments).values({
          enrollmentId,
          userId: ctx.user.id,
          amount: course.price,
          paymentMethod: 'mpesa',
          status: 'pending',
          checkoutRequestId: stkResponse.checkoutRequestId,
        });

        return {
          success: true,
          message: stkResponse.message,
          enrollmentId,
          checkoutRequestId: stkResponse.checkoutRequestId,
          courseTitle: course.title,
          amount: course.price / 100,
        };
      } catch (error) {
        console.error('[M-Pesa] Enrollment error:', error);
        throw new Error(
          error instanceof Error ? error.message : 'Failed to process M-Pesa payment'
        );
      }
    }),

  /**
   * Confirm M-Pesa payment and activate enrollment
   * Called by webhook callback from Daraja API
   */
  confirmMpesaPayment: publicProcedure
    .input(
      z.object({
        checkoutRequestId: z.string(),
        resultCode: z.string(),
        mpesaReceiptNumber: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Find enrollment by checkout request ID
        const enrollment = await db?.query.microCourseEnrollments.findFirst({
          where: (enrollments, { eq }) =>
            eq(enrollments.checkoutRequestId, input.checkoutRequestId),
        });

        if (!enrollment) {
          throw new Error('Enrollment not found');
        }

        // Check result code (0 = success)
        if (input.resultCode === '0') {
          // Payment successful - activate enrollment
          await db
            ?.update(microCourseEnrollments)
            .set({
              status: 'active',
              paymentStatus: 'completed',
            })
            .where((enrollments) => eq(enrollments.id, enrollment.id));

          // Update payment record
          await db
            ?.update(payments)
            .set({
              status: 'completed',
              mpesaReceiptNumber: input.mpesaReceiptNumber,
            })
            .where((p) => eq(p.checkoutRequestId, input.checkoutRequestId));

          console.log('[M-Pesa] Payment confirmed for enrollment:', enrollment.id);

          return {
            success: true,
            message: 'Payment confirmed. Course access activated.',
            enrollmentId: enrollment.id,
          };
        } else {
          // Payment failed
          await db
            ?.update(microCourseEnrollments)
            .set({
              status: 'failed',
              paymentStatus: 'failed',
            })
            .where((enrollments) => eq(enrollments.id, enrollment.id));

          return {
            success: false,
            message: 'Payment failed. Please try again.',
            enrollmentId: enrollment.id,
          };
        }
      } catch (error) {
        console.error('[M-Pesa] Payment confirmation error:', error);
        throw new Error('Failed to confirm payment');
      }
    }),

  /**
   * Grant admin free access to course
   */
  grantAdminAccess: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user is admin
      if (ctx.user?.email !== 'karuejob@gmail.com') {
        throw new Error('Admin access only');
      }

      try {
        // Get course
        const course = await db?.query.microCourses.findFirst({
          where: (courses, { eq }) => eq(courses.courseId, input.courseId),
        });

        if (!course) {
          throw new Error('Course not found');
        }

        // Check if already enrolled
        const existing = await db?.query.microCourseEnrollments.findFirst({
          where: (enrollments, { and, eq }) =>
            and(
              eq(enrollments.userId, ctx.user.id),
              eq(enrollments.courseId, input.courseId)
            ),
        });

        if (existing) {
          return { success: true, message: 'Already enrolled in this course' };
        }

        // Create active enrollment (free for admin)
        await db?.insert(microCourseEnrollments).values({
          userId: ctx.user.id,
          courseId: input.courseId,
          status: 'active',
          paymentStatus: 'free',
          enrolledAt: new Date(),
        });

        return {
          success: true,
          message: 'Admin access granted to course',
        };
      } catch (error) {
        console.error('Admin access error:', error);
        throw new Error('Failed to grant admin access');
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
    .mutation(async ({ ctx, input }) => {
      try {
        // Get enrollment
        const enrollment = await db?.query.microCourseEnrollments.findFirst({
          where: (enrollments, { eq }) => eq(enrollments.id, input.enrollmentId),
        });

        if (!enrollment || enrollment.userId !== ctx.user.id) {
          throw new Error('Enrollment not found or unauthorized');
        }

        // Check if score meets passing threshold (80%)
        if (input.quizScore < 80) {
          throw new Error(`Quiz score ${input.quizScore}% is below passing threshold of 80%`);
        }

        // Mark enrollment as completed
        await db
          ?.update(microCourseEnrollments)
          .set({
            status: 'completed',
            completedAt: new Date(),
            quizScore: input.quizScore,
          })
          .where((enrollments) => eq(enrollments.id, input.enrollmentId));

        return {
          success: true,
          message: 'Course completed successfully! Certificate generated.',
          enrollmentId: input.enrollmentId,
          quizScore: input.quizScore,
        };
      } catch (error) {
        console.error('Course completion error:', error);
        throw new Error(
          error instanceof Error ? error.message : 'Failed to complete course'
        );
      }
    }),

  /**
   * Seed all 26 micro-courses to database (admin only)
   */
  seedCourses: protectedProcedure.mutation(async ({ ctx }) => {
    // Verify admin
    if (ctx.user?.email !== 'karuejob@gmail.com') {
      throw new Error('Admin only');
    }

    const coursesToSeed = [
      {
        courseId: 'asthma-i',
        title: 'Paediatric Asthma I: Recognition and Initial Management',
        description:
          'Recognize asthma exacerbation severity, implement rapid bronchodilator therapy (salbutamol), and assess response to treatment.',
        level: 'foundational',
        emergencyType: 'respiratory',
        duration: 45,
        price: 80000,
        prerequisiteId: null,
        order: 1,
      },
      {
        courseId: 'asthma-ii',
        title: 'Paediatric Asthma II: Severe Exacerbation and Status Asthmaticus',
        description:
          'Manage severe asthma exacerbation, IV magnesium, aminophylline, and mechanical ventilation preparation.',
        level: 'advanced',
        emergencyType: 'respiratory',
        duration: 60,
        price: 120000,
        prerequisiteId: 'asthma-i',
        order: 2,
      },
      {
        courseId: 'pneumonia-i',
        title: 'Paediatric Pneumonia I: Recognition and Initial Antibiotics',
        description:
          'Recognize pneumonia severity, perform chest examination, initiate appropriate antibiotics based on age and risk factors.',
        level: 'foundational',
        emergencyType: 'respiratory',
        duration: 45,
        price: 80000,
        prerequisiteId: null,
        order: 3,
      },
      {
        courseId: 'pneumonia-ii',
        title: 'Paediatric Pneumonia II: Severe Pneumonia and Sepsis',
        description:
          'Manage severe pneumonia, recognize sepsis progression, implement fluid resuscitation and vasopressor support.',
        level: 'advanced',
        emergencyType: 'respiratory',
        duration: 60,
        price: 120000,
        prerequisiteId: 'pneumonia-i',
        order: 4,
      },
      {
        courseId: 'septic-shock-i',
        title: 'Paediatric Septic Shock I: Recognition and Fluid Resuscitation',
        description:
          'Recognize sepsis criteria, implement 20 mL/kg bolus, assess perfusion, and plan vasopressor escalation.',
        level: 'foundational',
        emergencyType: 'shock',
        duration: 45,
        price: 80000,
        prerequisiteId: null,
        order: 5,
      },
      {
        courseId: 'septic-shock-ii',
        title: 'Paediatric Septic Shock II: Vasopressors and Multi-Organ Failure',
        description:
          'Manage refractory shock with noradrenaline/adrenaline, prevent organ failure, manage coagulopathy and ARDS.',
        level: 'advanced',
        emergencyType: 'shock',
        duration: 60,
        price: 120000,
        prerequisiteId: 'septic-shock-i',
        order: 6,
      },
      {
        courseId: 'hypovolemic-shock-i',
        title: 'Paediatric Hypovolemic Shock I: Hemorrhage and Dehydration',
        description:
          'Recognize hypovolemic shock from hemorrhage or dehydration, calculate fluid deficit, implement resuscitation protocol.',
        level: 'foundational',
        emergencyType: 'shock',
        duration: 45,
        price: 80000,
        prerequisiteId: null,
        order: 7,
      },
      {
        courseId: 'hypovolemic-shock-ii',
        title: 'Paediatric Hypovolemic Shock II: Massive Transfusion and Damage Control',
        description:
          'Manage massive hemorrhage, activate massive transfusion protocol, prevent coagulopathy, prepare for surgical intervention.',
        level: 'advanced',
        emergencyType: 'shock',
        duration: 60,
        price: 120000,
        prerequisiteId: 'hypovolemic-shock-i',
        order: 8,
      },
      {
        courseId: 'febrile-seizure-i',
        title: 'Paediatric Febrile Seizure I: Recognition and Acute Management',
        description:
          'Recognize febrile seizure, assess for serious infection, administer benzodiazepines, manage fever.',
        level: 'foundational',
        emergencyType: 'seizure',
        duration: 45,
        price: 80000,
        prerequisiteId: null,
        order: 9,
      },
      {
        courseId: 'status-epilepticus-i',
        title: 'Paediatric Status Epilepticus I: First-Line Treatment',
        description:
          'Recognize status epilepticus, administer benzodiazepines (lorazepam/diazepam), assess airway, prepare for intubation.',
        level: 'foundational',
        emergencyType: 'seizure',
        duration: 45,
        price: 80000,
        prerequisiteId: null,
        order: 10,
      },
      {
        courseId: 'status-epilepticus-ii',
        title: 'Paediatric Status Epilepticus II: Refractory Seizures',
        description:
          'Manage refractory status epilepticus with phenytoin/levetiracetam, prepare for intubation and ICU care.',
        level: 'advanced',
        emergencyType: 'seizure',
        duration: 60,
        price: 120000,
        prerequisiteId: 'status-epilepticus-i',
        order: 11,
      },
      {
        courseId: 'poisoning-i',
        title: 'Paediatric Poisoning I: Recognition and Initial Management',
        description:
          'Recognize poisoning, obtain history, perform decontamination, activate poison center, manage airway.',
        level: 'foundational',
        emergencyType: 'toxicology',
        duration: 45,
        price: 80000,
        prerequisiteId: null,
        order: 12,
      },
      {
        courseId: 'overdose-i',
        title: 'Paediatric Drug Overdose I: Opioids, Sedatives, Stimulants',
        description:
          'Recognize overdose patterns, administer naloxone, manage respiratory depression, assess for polypharmacy.',
        level: 'foundational',
        emergencyType: 'toxicology',
        duration: 45,
        price: 80000,
        prerequisiteId: null,
        order: 13,
      },
      {
        courseId: 'caustic-ingestion-i',
        title: 'Paediatric Caustic Ingestion: Acids and Alkalis',
        description:
          'Manage caustic ingestion, assess esophageal injury, avoid induced vomiting, arrange endoscopy.',
        level: 'foundational',
        emergencyType: 'toxicology',
        duration: 45,
        price: 80000,
        prerequisiteId: null,
        order: 14,
      },
      {
        courseId: 'dka-i',
        title: 'Paediatric DKA I: Recognition and Initial Stabilization',
        description:
          'Recognize DKA, calculate fluid deficit, initiate IV fluids (0.9% saline), assess electrolytes.',
        level: 'foundational',
        emergencyType: 'metabolic',
        duration: 45,
        price: 80000,
        prerequisiteId: null,
        order: 15,
      },
      {
        courseId: 'dka-ii',
        title: 'Paediatric DKA II: Insulin Therapy and Complications',
        description:
          'Manage insulin infusion, prevent cerebral edema, monitor potassium, manage complications.',
        level: 'advanced',
        emergencyType: 'metabolic',
        duration: 60,
        price: 120000,
        prerequisiteId: 'dka-i',
        order: 16,
      },
      {
        courseId: 'hypoglycemia-i',
        title: 'Paediatric Hypoglycemia: Acute Recognition and Treatment',
        description:
          'Recognize hypoglycemia symptoms, administer dextrose IV or glucagon IM, manage rebound hyperglycemia.',
        level: 'foundational',
        emergencyType: 'metabolic',
        duration: 45,
        price: 80000,
        prerequisiteId: null,
        order: 17,
      },
      {
        courseId: 'electrolyte-i',
        title: 'Paediatric Electrolyte Emergencies: Sodium and Potassium',
        description:
          'Recognize severe hyponatremia/hypernatremia and hypokalemia/hyperkalemia, calculate correction rates safely.',
        level: 'foundational',
        emergencyType: 'metabolic',
        duration: 45,
        price: 80000,
        prerequisiteId: null,
        order: 18,
      },
      {
        courseId: 'meningitis-i',
        title: 'Paediatric Meningitis I: Recognition and Empiric Antibiotics',
        description:
          'Recognize meningitis, perform lumbar puncture safely, administer empiric antibiotics immediately.',
        level: 'foundational',
        emergencyType: 'infectious',
        duration: 45,
        price: 80000,
        prerequisiteId: null,
        order: 19,
      },
      {
        courseId: 'malaria-i',
        title: 'Paediatric Malaria: Severe Malaria and Cerebral Complications',
        description:
          'Recognize severe malaria, administer artemether IV, manage cerebral malaria and organ failure.',
        level: 'foundational',
        emergencyType: 'infectious',
        duration: 45,
        price: 80000,
        prerequisiteId: null,
        order: 20,
      },
      {
        courseId: 'burns-i',
        title: 'Paediatric Burns I: Recognition and First-Hour Resuscitation',
        description:
          'Recognize burn severity, calculate TBSA using Rule of 9s, implement Parkland formula fluid resuscitation.',
        level: 'foundational',
        emergencyType: 'burns',
        duration: 45,
        price: 80000,
        prerequisiteId: null,
        order: 21,
      },
      {
        courseId: 'burns-ii',
        title: 'Paediatric Burns II: Advanced Fluid Management and Complications',
        description:
          'Manage burn complications, recognize compartment syndrome, prevent rhabdomyolysis-induced AKI, long-term rehabilitation.',
        level: 'advanced',
        emergencyType: 'burns',
        duration: 60,
        price: 120000,
        prerequisiteId: 'burns-i',
        order: 22,
      },
      {
        courseId: 'trauma-i',
        title: 'Paediatric Trauma I: Primary and Secondary Survey',
        description:
          'Perform primary survey (ABCDE), manage airway with c-spine protection, assess for life-threatening injuries.',
        level: 'foundational',
        emergencyType: 'trauma',
        duration: 45,
        price: 80000,
        prerequisiteId: null,
        order: 23,
      },
      {
        courseId: 'trauma-ii',
        title: 'Paediatric Trauma II: Hemorrhage Control and Damage Control Surgery',
        description:
          'Manage massive hemorrhage, activate trauma protocol, prepare for damage control surgery, prevent hypothermia.',
        level: 'advanced',
        emergencyType: 'trauma',
        duration: 60,
        price: 120000,
        prerequisiteId: 'trauma-i',
        order: 24,
      },
      {
        courseId: 'aki-i',
        title: 'Paediatric Acute Kidney Injury: Recognition and Management',
        description:
          'Recognize AKI, calculate urine output and creatinine, manage fluid balance, prepare for renal replacement therapy.',
        level: 'foundational',
        emergencyType: 'metabolic',
        duration: 45,
        price: 80000,
        prerequisiteId: null,
        order: 25,
      },
      {
        courseId: 'anaemia-i',
        title: 'Paediatric Severe Anaemia: Transfusion and Complications',
        description:
          'Recognize severe anaemia, calculate transfusion volume, manage transfusion reactions, address underlying cause.',
        level: 'foundational',
        emergencyType: 'metabolic',
        duration: 45,
        price: 80000,
        prerequisiteId: null,
        order: 26,
      },
    ];

    try {
      let inserted = 0;
      for (const course of coursesToSeed) {
        try {
          await db?.insert(microCourses).values(course);
          inserted++;
        } catch (err: any) {
          // Skip if duplicate key
          if (err.code !== 'ER_DUP_ENTRY') {
            throw err;
          }
        }
      }

      return { success: true, message: `Seeded ${inserted} courses to database` };
    } catch (error) {
      console.error('Seed error:', error);
      throw new Error('Failed to seed courses');
    }
  }),
});
