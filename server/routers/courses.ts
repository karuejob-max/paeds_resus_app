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
   * Seed all 26 micro-courses to database (admin only)
   */
  seedCourses: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Verify admin
      if (ctx.user?.email !== 'karuejob@gmail.com') {
        throw new Error('Admin only');
      }

      const coursesToSeed = [
        { courseId: 'asthma-i', title: 'Paediatric Asthma I: Recognition and Initial Management', description: 'Recognize asthma exacerbation severity, implement rapid bronchodilator therapy (salbutamol), and assess response to treatment.', level: 'foundational', emergencyType: 'respiratory', duration: 45, price: 80000, prerequisiteId: null, order: 1 },
        { courseId: 'asthma-ii', title: 'Paediatric Asthma II: Severe Exacerbation and Status Asthmaticus', description: 'Manage severe asthma exacerbation, IV magnesium, aminophylline, and mechanical ventilation preparation.', level: 'advanced', emergencyType: 'respiratory', duration: 60, price: 120000, prerequisiteId: 'asthma-i', order: 2 },
        { courseId: 'pneumonia-i', title: 'Paediatric Pneumonia I: Recognition and Initial Antibiotics', description: 'Recognize pneumonia severity, perform chest examination, initiate appropriate antibiotics based on age and risk factors.', level: 'foundational', emergencyType: 'respiratory', duration: 45, price: 80000, prerequisiteId: null, order: 3 },
        { courseId: 'pneumonia-ii', title: 'Paediatric Pneumonia II: Severe Pneumonia and Sepsis', description: 'Manage severe pneumonia, recognize sepsis progression, implement fluid resuscitation and vasopressor support.', level: 'advanced', emergencyType: 'respiratory', duration: 60, price: 120000, prerequisiteId: 'pneumonia-i', order: 4 },
        { courseId: 'septic-shock-i', title: 'Paediatric Septic Shock I: Recognition and Fluid Resuscitation', description: 'Recognize sepsis criteria, implement 20 mL/kg bolus, assess perfusion, and plan vasopressor escalation.', level: 'foundational', emergencyType: 'shock', duration: 45, price: 80000, prerequisiteId: null, order: 5 },
        { courseId: 'septic-shock-ii', title: 'Paediatric Septic Shock II: Vasopressors and Multi-Organ Failure', description: 'Manage refractory shock with noradrenaline/adrenaline, prevent organ failure, manage coagulopathy and ARDS.', level: 'advanced', emergencyType: 'shock', duration: 60, price: 120000, prerequisiteId: 'septic-shock-i', order: 6 },
        { courseId: 'hypovolemic-shock-i', title: 'Paediatric Hypovolemic Shock I: Hemorrhage and Dehydration', description: 'Recognize hypovolemic shock from hemorrhage or dehydration, calculate fluid deficit, implement resuscitation protocol.', level: 'foundational', emergencyType: 'shock', duration: 45, price: 80000, prerequisiteId: null, order: 7 },
        { courseId: 'hypovolemic-shock-ii', title: 'Paediatric Hypovolemic Shock II: Massive Transfusion and Damage Control', description: 'Manage massive hemorrhage, activate massive transfusion protocol, prevent coagulopathy, prepare for surgical intervention.', level: 'advanced', emergencyType: 'shock', duration: 60, price: 120000, prerequisiteId: 'hypovolemic-shock-i', order: 8 },
        { courseId: 'febrile-seizure-i', title: 'Paediatric Febrile Seizure I: Recognition and Acute Management', description: 'Recognize febrile seizure, assess for serious infection, administer benzodiazepines, manage fever.', level: 'foundational', emergencyType: 'seizure', duration: 45, price: 80000, prerequisiteId: null, order: 9 },
        { courseId: 'status-epilepticus-i', title: 'Paediatric Status Epilepticus I: First-Line Treatment', description: 'Recognize status epilepticus, administer benzodiazepines (lorazepam/diazepam), assess airway, prepare for intubation.', level: 'foundational', emergencyType: 'seizure', duration: 45, price: 80000, prerequisiteId: null, order: 10 },
        { courseId: 'status-epilepticus-ii', title: 'Paediatric Status Epilepticus II: Refractory Seizures', description: 'Manage refractory status epilepticus with phenytoin/levetiracetam, prepare for intubation and ICU care.', level: 'advanced', emergencyType: 'seizure', duration: 60, price: 120000, prerequisiteId: 'status-epilepticus-i', order: 11 },
        { courseId: 'poisoning-i', title: 'Paediatric Poisoning I: Recognition and Initial Management', description: 'Recognize poisoning, obtain history, perform decontamination, activate poison center, manage airway.', level: 'foundational', emergencyType: 'toxicology', duration: 45, price: 80000, prerequisiteId: null, order: 12 },
        { courseId: 'overdose-i', title: 'Paediatric Drug Overdose I: Opioids, Sedatives, Stimulants', description: 'Recognize overdose patterns, administer naloxone, manage respiratory depression, assess for polypharmacy.', level: 'foundational', emergencyType: 'toxicology', duration: 45, price: 80000, prerequisiteId: null, order: 13 },
        { courseId: 'caustic-ingestion-i', title: 'Paediatric Caustic Ingestion: Acids and Alkalis', description: 'Manage caustic ingestion, assess esophageal injury, avoid induced vomiting, arrange endoscopy.', level: 'foundational', emergencyType: 'toxicology', duration: 45, price: 80000, prerequisiteId: null, order: 14 },
        { courseId: 'dka-i', title: 'Paediatric DKA I: Recognition and Initial Stabilization', description: 'Recognize DKA, calculate fluid deficit, initiate IV fluids (0.9% saline), assess electrolytes.', level: 'foundational', emergencyType: 'metabolic', duration: 45, price: 80000, prerequisiteId: null, order: 15 },
        { courseId: 'dka-ii', title: 'Paediatric DKA II: Insulin Therapy and Complications', description: 'Manage insulin infusion, prevent cerebral edema, monitor potassium, manage complications.', level: 'advanced', emergencyType: 'metabolic', duration: 60, price: 120000, prerequisiteId: 'dka-i', order: 16 },
        { courseId: 'hypoglycemia-i', title: 'Paediatric Hypoglycemia: Acute Recognition and Treatment', description: 'Recognize hypoglycemia symptoms, administer dextrose IV or glucagon IM, manage rebound hyperglycemia.', level: 'foundational', emergencyType: 'metabolic', duration: 45, price: 80000, prerequisiteId: null, order: 17 },
        { courseId: 'electrolyte-i', title: 'Paediatric Electrolyte Emergencies: Sodium and Potassium', description: 'Recognize severe hyponatremia/hypernatremia and hypokalemia/hyperkalemia, calculate correction rates safely.', level: 'foundational', emergencyType: 'metabolic', duration: 45, price: 80000, prerequisiteId: null, order: 18 },
        { courseId: 'meningitis-i', title: 'Paediatric Meningitis I: Recognition and Empiric Antibiotics', description: 'Recognize meningitis, perform lumbar puncture safely, administer empiric antibiotics immediately.', level: 'foundational', emergencyType: 'infectious', duration: 45, price: 80000, prerequisiteId: null, order: 19 },
        { courseId: 'malaria-i', title: 'Paediatric Malaria: Severe Malaria and Cerebral Complications', description: 'Recognize severe malaria, administer artemether IV, manage cerebral malaria and organ failure.', level: 'foundational', emergencyType: 'infectious', duration: 45, price: 80000, prerequisiteId: null, order: 20 },
        { courseId: 'burns-i', title: 'Paediatric Burns I: Recognition and First-Hour Resuscitation', description: 'Recognize burn severity, calculate TBSA using Rule of 9s, implement Parkland formula fluid resuscitation.', level: 'foundational', emergencyType: 'burns', duration: 45, price: 80000, prerequisiteId: null, order: 21 },
        { courseId: 'burns-ii', title: 'Paediatric Burns II: Advanced Fluid Management and Complications', description: 'Manage burn complications, recognize compartment syndrome, prevent rhabdomyolysis-induced AKI, long-term rehabilitation.', level: 'advanced', emergencyType: 'burns', duration: 60, price: 120000, prerequisiteId: 'burns-i', order: 22 },
        { courseId: 'trauma-i', title: 'Paediatric Trauma I: Primary and Secondary Survey', description: 'Perform primary survey (ABCDE), manage airway with c-spine protection, assess for life-threatening injuries.', level: 'foundational', emergencyType: 'trauma', duration: 45, price: 80000, prerequisiteId: null, order: 23 },
        { courseId: 'trauma-ii', title: 'Paediatric Trauma II: Hemorrhage Control and Damage Control Surgery', description: 'Manage massive hemorrhage, activate trauma protocol, prepare for damage control surgery, prevent hypothermia.', level: 'advanced', emergencyType: 'trauma', duration: 60, price: 120000, prerequisiteId: 'trauma-i', order: 24 },
        { courseId: 'aki-i', title: 'Paediatric Acute Kidney Injury: Recognition and Management', description: 'Recognize AKI, calculate urine output and creatinine, manage fluid balance, prepare for renal replacement therapy.', level: 'foundational', emergencyType: 'metabolic', duration: 45, price: 80000, prerequisiteId: null, order: 25 },
        { courseId: 'anaemia-i', title: 'Paediatric Severe Anaemia: Transfusion and Complications', description: 'Recognize severe anaemia, calculate transfusion volume, manage transfusion reactions, address underlying cause.', level: 'foundational', emergencyType: 'metabolic', duration: 45, price: 80000, prerequisiteId: null, order: 26 },
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
