/**
 * Server Initialization Module
 * Runs on server startup to apply DB migrations and seed data (courses, etc.)
 */

import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { microCourses } from "../../drizzle/schema";


/**
 * Run pending Drizzle migrations at server startup.
 * Safe to call on every deploy — Drizzle tracks applied migrations in __drizzle_migrations table.
 */
export async function runMigrations() {
  try {
    const db = await getDb();
    if (!db) {
      console.log('[Migrations] Database not available, skipping migrations');
      return;
    }
    // 0039: add microCourseEnrollmentId to certificates (idempotent column-existence check)
    const [cols] = await db.execute(sql`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'certificates'
        AND COLUMN_NAME = 'microCourseEnrollmentId'
    `);
    if (Array.isArray(cols) && (cols as any[]).length === 0) {
      console.log('[Migrations] Adding microCourseEnrollmentId to certificates...');
      await db.execute(sql`ALTER TABLE \`certificates\` ADD COLUMN \`microCourseEnrollmentId\` int`);
      console.log('[Migrations] ✓ microCourseEnrollmentId column added');
    } else {
      console.log('[Migrations] ✓ microCourseEnrollmentId already exists, skipping');
    }
  } catch (error) {
    console.error('[Migrations] Migration error (non-fatal):', error instanceof Error ? error.message : error);
    // Don't throw — allow server to start even if a migration fails
  }
}

function normalizeEmergencyType(
  emergencyType: string
): "respiratory" | "shock" | "seizure" | "toxicology" | "metabolic" | "infectious" | "burns" | "trauma" {
  switch (emergencyType) {
    case "neurological":
      return "seizure";
    case "allergic":
      return "toxicology";
    default:
      return emergencyType as "respiratory" | "shock" | "seizure" | "toxicology" | "metabolic" | "infectious" | "burns" | "trauma";
  }
}

const COURSES = [
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

export async function initializeDatabase() {
  try {
    const db = await getDb();
    if (!db) {
      console.log('[Initialize] Database not available, skipping seed');
      return;
    }

    // Check if courses already exist
    const existing = await db.query.microCourses.findFirst();
    if (existing) {
      console.log('[Initialize] Courses already seeded, skipping');
      return;
    }

    console.log('[Initialize] Seeding 26 micro-courses...');
    
    // Insert all courses
    for (const course of COURSES) {
      await db.insert(microCourses).values({
        courseId: course.courseId,
        title: course.title,
        description: course.description,
        level: course.level,
        emergencyType: normalizeEmergencyType(course.emergencyType),
        duration: course.duration,
        price: course.price,
        prerequisiteId: course.prerequisiteId,
        order: course.order,
      });
    }

    console.log(`[Initialize] ✓ Successfully seeded ${COURSES.length} micro-courses`);
  } catch (error) {
    console.error('[Initialize] Error seeding courses:', error instanceof Error ? error.message : error);
    // Don't throw - allow server to continue even if seeding fails
  }
}
