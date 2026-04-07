/**
 * Course Management Router
 * Handles micro-course catalog, enrollment, M-Pesa payments, and admin access
 */

import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { microCourses, microCourseEnrollments, payments, users } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { initiateSTKPush, validatePhoneNumber, isMpesaConfigured } from '../_core/mpesa';

// All 26 micro-courses (matches initialization data)
const ALL_COURSES = [
  { courseId: 'asthma-i', title: 'Paediatric Asthma I: Recognition and Initial Management', description: 'Recognize asthma exacerbation severity, implement rapid bronchodilator therapy (salbutamol), and assess response to treatment.', level: 'foundational' as const, emergencyType: 'respiratory' as const, duration: 45, price: 80000, prerequisiteId: null, order: 1 },
  { courseId: 'asthma-ii', title: 'Paediatric Asthma II: Severe Exacerbation and Status Asthmaticus', description: 'Manage severe asthma exacerbation, IV magnesium, aminophylline, and mechanical ventilation preparation.', level: 'advanced' as const, emergencyType: 'respiratory' as const, duration: 60, price: 120000, prerequisiteId: 'asthma-i', order: 2 },
  { courseId: 'pneumonia-i', title: 'Paediatric Pneumonia I: Recognition and Initial Antibiotics', description: 'Recognize pneumonia severity, perform chest examination, initiate appropriate antibiotics based on age and risk factors.', level: 'foundational' as const, emergencyType: 'respiratory' as const, duration: 45, price: 80000, prerequisiteId: null, order: 3 },
  { courseId: 'pneumonia-ii', title: 'Paediatric Pneumonia II: Severe Pneumonia and Sepsis', description: 'Manage severe pneumonia, recognize sepsis progression, implement fluid resuscitation and vasopressor support.', level: 'advanced' as const, emergencyType: 'respiratory' as const, duration: 60, price: 120000, prerequisiteId: 'pneumonia-i', order: 4 },
  { courseId: 'septic-shock-i', title: 'Paediatric Septic Shock I: Recognition and Fluid Resuscitation', description: 'Recognize sepsis criteria, implement 20 mL/kg bolus, assess perfusion, and plan vasopressor escalation.', level: 'foundational' as const, emergencyType: 'shock' as const, duration: 45, price: 80000, prerequisiteId: null, order: 5 },
  { courseId: 'septic-shock-ii', title: 'Paediatric Septic Shock II: Vasopressors and Multi-Organ Failure', description: 'Manage refractory shock with noradrenaline/adrenaline, prevent organ failure, manage coagulopathy and ARDS.', level: 'advanced' as const, emergencyType: 'shock' as const, duration: 60, price: 120000, prerequisiteId: 'septic-shock-i', order: 6 },
  { courseId: 'hypovolemic-shock-i', title: 'Paediatric Hypovolemic Shock I: Hemorrhage and Dehydration', description: 'Recognize hypovolemic shock from hemorrhage or dehydration, calculate fluid deficit, implement resuscitation protocol.', level: 'foundational' as const, emergencyType: 'shock' as const, duration: 45, price: 80000, prerequisiteId: null, order: 7 },
  { courseId: 'hypovolemic-shock-ii', title: 'Paediatric Hypovolemic Shock II: Massive Transfusion and Damage Control', description: 'Manage massive hemorrhage, activate massive transfusion protocol, prevent coagulopathy, prepare for surgical intervention.', level: 'advanced' as const, emergencyType: 'shock' as const, duration: 60, price: 120000, prerequisiteId: 'hypovolemic-shock-i', order: 8 },
  { courseId: 'cardiogenic-shock-i', title: 'Paediatric Cardiogenic Shock I: Heart Failure Recognition', description: 'Recognize acute heart failure, assess cardiac function, manage fluid overload, prepare for inotropic support.', level: 'foundational' as const, emergencyType: 'shock' as const, duration: 45, price: 80000, prerequisiteId: null, order: 9 },
  { courseId: 'cardiogenic-shock-ii', title: 'Paediatric Cardiogenic Shock II: Inotropes and Mechanical Support', description: 'Manage inotropic escalation, recognize arrhythmias, prepare for ECMO or mechanical support.', level: 'advanced' as const, emergencyType: 'shock' as const, duration: 60, price: 120000, prerequisiteId: 'cardiogenic-shock-i', order: 10 },
  { courseId: 'status-epilepticus-i', title: 'Paediatric Status Epilepticus I: Recognition and First-Line Treatment', description: 'Recognize status epilepticus, implement benzodiazepine protocol, assess for underlying cause.', level: 'foundational' as const, emergencyType: 'neurological' as const, duration: 45, price: 80000, prerequisiteId: null, order: 11 },
  { courseId: 'status-epilepticus-ii', title: 'Paediatric Status Epilepticus II: Refractory Seizures and ICU Management', description: 'Manage refractory status epilepticus with second-line agents, prepare for intubation and ICU care.', level: 'advanced' as const, emergencyType: 'neurological' as const, duration: 60, price: 120000, prerequisiteId: 'status-epilepticus-i', order: 12 },
  { courseId: 'dka-i', title: 'Paediatric DKA I: Recognition and Initial Fluid Resuscitation', description: 'Recognize DKA severity, calculate fluid deficit, initiate isotonic fluid resuscitation, manage electrolytes.', level: 'foundational' as const, emergencyType: 'metabolic' as const, duration: 45, price: 80000, prerequisiteId: null, order: 13 },
  { courseId: 'dka-ii', title: 'Paediatric DKA II: Insulin Therapy and Complications', description: 'Manage insulin infusion, prevent cerebral edema, monitor electrolyte shifts, manage hyperkalemia.', level: 'advanced' as const, emergencyType: 'metabolic' as const, duration: 60, price: 120000, prerequisiteId: 'dka-i', order: 14 },
  { courseId: 'anaphylaxis-i', title: 'Paediatric Anaphylaxis I: Recognition and Epinephrine', description: 'Recognize anaphylaxis, calculate epinephrine dose (0.01 mg/kg IM), manage airway, assess for biphasic reaction.', level: 'foundational' as const, emergencyType: 'allergic' as const, duration: 45, price: 80000, prerequisiteId: null, order: 15 },
  { courseId: 'anaphylaxis-ii', title: 'Paediatric Anaphylaxis II: Refractory Anaphylaxis and ICU Management', description: 'Manage refractory anaphylaxis with IV epinephrine, vasopressors, manage airway complications.', level: 'advanced' as const, emergencyType: 'allergic' as const, duration: 60, price: 120000, prerequisiteId: 'anaphylaxis-i', order: 16 },
  { courseId: 'meningitis-i', title: 'Paediatric Meningitis I: Recognition and Empiric Antibiotics', description: 'Recognize meningitis signs, perform lumbar puncture safely, initiate empiric antibiotics, manage airway.', level: 'foundational' as const, emergencyType: 'infectious' as const, duration: 45, price: 80000, prerequisiteId: null, order: 17 },
  { courseId: 'meningitis-ii', title: 'Paediatric Meningitis II: Complications and ICU Management', description: 'Manage meningitis complications (subdural empyema, ventriculitis), manage increased ICP, prevent secondary infection.', level: 'advanced' as const, emergencyType: 'infectious' as const, duration: 60, price: 120000, prerequisiteId: 'meningitis-i', order: 18 },
  { courseId: 'malaria-i', title: 'Paediatric Severe Malaria I: Recognition and Artemisinin Therapy', description: 'Recognize severe malaria, initiate artemisinin IV/IM, manage cerebral malaria, assess for complications.', level: 'foundational' as const, emergencyType: 'infectious' as const, duration: 45, price: 80000, prerequisiteId: null, order: 19 },
  { courseId: 'malaria-ii', title: 'Paediatric Severe Malaria II: Complications and Multi-Organ Failure', description: 'Manage severe malaria complications (ARDS, AKI, metabolic acidosis), prepare for exchange transfusion.', level: 'advanced' as const, emergencyType: 'infectious' as const, duration: 60, price: 120000, prerequisiteId: 'malaria-i', order: 20 },
  { courseId: 'burns-i', title: 'Paediatric Burns I: Assessment and Fluid Resuscitation', description: 'Calculate burn surface area (Rule of 9s), estimate fluid requirements (Parkland formula), manage airway in inhalation injury.', level: 'foundational' as const, emergencyType: 'trauma' as const, duration: 45, price: 80000, prerequisiteId: null, order: 21 },
  { courseId: 'burns-ii', title: 'Paediatric Burns II: Wound Management and Infection Prevention', description: 'Manage burn wounds, prevent infection, manage pain, prepare for skin grafting, manage compartment syndrome.', level: 'advanced' as const, emergencyType: 'trauma' as const, duration: 60, price: 120000, prerequisiteId: 'burns-i', order: 22 },
  { courseId: 'trauma-i', title: 'Paediatric Trauma I: Primary Survey and Resuscitation', description: 'Perform primary survey (ABCDE), calculate fluid requirements, manage airway in trauma, activate trauma protocol.', level: 'foundational' as const, emergencyType: 'trauma' as const, duration: 45, price: 80000, prerequisiteId: null, order: 23 },
  { courseId: 'trauma-ii', title: 'Paediatric Trauma II: Hemorrhage Control and Damage Control Surgery', description: 'Manage massive hemorrhage, activate trauma protocol, prepare for damage control surgery, prevent hypothermia.', level: 'advanced' as const, emergencyType: 'trauma' as const, duration: 60, price: 120000, prerequisiteId: 'trauma-i', order: 24 },
  { courseId: 'aki-i', title: 'Paediatric Acute Kidney Injury: Recognition and Management', description: 'Recognize AKI, calculate urine output and creatinine, manage fluid balance, prepare for renal replacement therapy.', level: 'foundational' as const, emergencyType: 'metabolic' as const, duration: 45, price: 80000, prerequisiteId: null, order: 25 },
  { courseId: 'anaemia-i', title: 'Paediatric Severe Anaemia: Transfusion and Complications', description: 'Recognize severe anaemia, calculate transfusion volume, manage transfusion reactions, address underlying cause.', level: 'foundational' as const, emergencyType: 'metabolic' as const, duration: 45, price: 80000, prerequisiteId: null, order: 26 },
];

export const coursesRouter = router({
  /**
   * List all available micro-courses
   * Returns all 26 courses from the hardcoded list (fallback if DB is empty)
   */
  listAll: publicProcedure.query(async () => {
    try {
      const database = await getDb();
      if (database) {
        const courses = await database.query.microCourses.findMany();
        if (courses && courses.length > 0) {
          return courses;
        }
      }
    } catch (error) {
      console.error('Error fetching courses from DB:', error);
    }

    // Fallback to all 26 courses if DB is empty or unavailable
    return ALL_COURSES;
  }),

  /**
   * Get user's course enrollments
   */
  getEnrollments: protectedProcedure.query(async ({ ctx }) => {
    try {
      const database = await getDb();
      if (!database) {
        return [];
      }

      const enrollments = await database.query.microCourseEnrollments.findMany({
        where: (enrollments) => eq(enrollments.userId, ctx.user.id),
      });

      return enrollments;
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      return [];
    }
  }),

  /**
   * Enroll user in a course
   */
  enroll: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const database = await getDb();
        if (!database) {
          throw new Error('Database unavailable');
        }

        // Check if already enrolled
        const existing = await database.query.microCourseEnrollments.findFirst({
          where: (enrollments) =>
            and(
              eq(enrollments.userId, ctx.user.id),
              eq(enrollments.courseId, input.courseId)
            ),
        });

        if (existing) {
          return { success: false, message: 'Already enrolled in this course' };
        }

        // Create enrollment
        await database.insert(microCourseEnrollments).values({
          userId: ctx.user.id,
          courseId: input.courseId,
          enrollmentStatus: 'active',
          enrolledAt: new Date(),
          progressPercentage: 0,
        });

        return { success: true, message: 'Successfully enrolled in course' };
      } catch (error) {
        console.error('Error enrolling in course:', error);
        return { success: false, message: 'Failed to enroll in course' };
      }
    }),

  /**
   * Mark course as completed
   */
  complete: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const database = await getDb();
        if (!database) {
          throw new Error('Database unavailable');
        }

        // Update enrollment status
        await database
          .update(microCourseEnrollments)
          .set({
            enrollmentStatus: 'completed',
            progressPercentage: 100,
            completedAt: new Date(),
          })
          .where(
            and(
              eq(microCourseEnrollments.userId, ctx.user.id),
              eq(microCourseEnrollments.courseId, input.courseId)
            )
          );

        return { success: true, message: 'Course marked as completed' };
      } catch (error) {
        console.error('Error completing course:', error);
        return { success: false, message: 'Failed to complete course' };
      }
    }),

  /**
   * Initiate M-Pesa payment for course enrollment
   */
  initiateMpesaPayment: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        phoneNumber: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (!isMpesaConfigured()) {
          return { success: false, message: 'M-Pesa not configured' };
        }

        // Find course to get price
        const course = ALL_COURSES.find((c) => c.courseId === input.courseId);
        if (!course) {
          return { success: false, message: 'Course not found' };
        }

        // Validate phone number
        if (!validatePhoneNumber(input.phoneNumber)) {
          return { success: false, message: 'Invalid phone number' };
        }

        // Initiate STK push
        const result = await initiateSTKPush({
          phoneNumber: input.phoneNumber,
          amount: Math.round(course.price / 100), // Convert cents to KES
          accountReference: `COURSE-${input.courseId}`,
          description: `Enrollment: ${course.title}`,
        });

        if (result.success) {
          // Save payment record
          const database = await getDb();
          if (database) {
            await database.insert(payments).values({
              userId: ctx.user.id,
              courseId: input.courseId,
              amount: course.price,
              currency: 'KES',
              paymentMethod: 'mpesa',
              status: 'pending',
              transactionId: result.transactionId || '',
              createdAt: new Date(),
            });
          }
        }

        return result;
      } catch (error) {
        console.error('Error initiating M-Pesa payment:', error);
        return { success: false, message: 'Failed to initiate payment' };
      }
    }),
});
