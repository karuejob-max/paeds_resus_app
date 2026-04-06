/**
 * Seed Script: Populate microCourses table with all 26 courses
 * Run: npx tsx server/seed-micro-courses.ts
 */

import { drizzle } from 'drizzle-orm/mysql2/driver';
import { microCourses } from '../drizzle/schema';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const COURSES = [
  // ===== RESPIRATORY (4 courses) =====
  {
    courseId: 'asthma-i',
    title: 'Paediatric Asthma I: Recognition and Initial Management',
    description: 'Recognize asthma exacerbation severity, implement rapid bronchodilator therapy (salbutamol), and assess response to treatment.',
    level: 'foundational' as const,
    emergencyType: 'respiratory' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
    order: 1,
  },
  {
    courseId: 'asthma-ii',
    title: 'Paediatric Asthma II: Severe Exacerbation and Status Asthmaticus',
    description: 'Manage severe asthma exacerbation, IV magnesium, aminophylline, and mechanical ventilation preparation.',
    level: 'advanced' as const,
    emergencyType: 'respiratory' as const,
    duration: 60,
    price: 120000,
    prerequisiteId: 'asthma-i',
    order: 2,
  },
  {
    courseId: 'pneumonia-i',
    title: 'Paediatric Pneumonia I: Recognition and Initial Antibiotics',
    description: 'Recognize pneumonia severity, perform chest examination, initiate appropriate antibiotics based on age and risk factors.',
    level: 'foundational' as const,
    emergencyType: 'respiratory' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
    order: 3,
  },
  {
    courseId: 'pneumonia-ii',
    title: 'Paediatric Pneumonia II: Severe Pneumonia and Sepsis',
    description: 'Manage severe pneumonia, recognize sepsis progression, implement fluid resuscitation and vasopressor support.',
    level: 'advanced' as const,
    emergencyType: 'respiratory' as const,
    duration: 60,
    price: 120000,
    prerequisiteId: 'pneumonia-i',
    order: 4,
  },

  // ===== SHOCK (4 courses) =====
  {
    courseId: 'septic-shock-i',
    title: 'Paediatric Septic Shock I: Recognition and Fluid Resuscitation',
    description: 'Recognize sepsis criteria, implement 20 mL/kg bolus, assess perfusion, and plan vasopressor escalation.',
    level: 'foundational' as const,
    emergencyType: 'shock' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
    order: 5,
  },
  {
    courseId: 'septic-shock-ii',
    title: 'Paediatric Septic Shock II: Vasopressors and Multi-Organ Failure',
    description: 'Manage refractory shock with noradrenaline/adrenaline, prevent organ failure, manage coagulopathy and ARDS.',
    level: 'advanced' as const,
    emergencyType: 'shock' as const,
    duration: 60,
    price: 120000,
    prerequisiteId: 'septic-shock-i',
    order: 6,
  },
  {
    courseId: 'hypovolemic-shock-i',
    title: 'Paediatric Hypovolemic Shock I: Hemorrhage and Dehydration',
    description: 'Recognize hypovolemic shock from hemorrhage or dehydration, calculate fluid deficit, implement resuscitation protocol.',
    level: 'foundational' as const,
    emergencyType: 'shock' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
    order: 7,
  },
  {
    courseId: 'hypovolemic-shock-ii',
    title: 'Paediatric Hypovolemic Shock II: Massive Transfusion and Damage Control',
    description: 'Manage massive hemorrhage, activate massive transfusion protocol, prevent coagulopathy, prepare for surgical intervention.',
    level: 'advanced' as const,
    emergencyType: 'shock' as const,
    duration: 60,
    price: 120000,
    prerequisiteId: 'hypovolemic-shock-i',
    order: 8,
  },

  // ===== SEIZURE (3 courses) =====
  {
    courseId: 'febrile-seizure-i',
    title: 'Paediatric Febrile Seizure I: Recognition and Acute Management',
    description: 'Recognize febrile seizure, assess for serious infection, administer benzodiazepines, manage fever.',
    level: 'foundational' as const,
    emergencyType: 'seizure' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
    order: 9,
  },
  {
    courseId: 'status-epilepticus-i',
    title: 'Paediatric Status Epilepticus I: First-Line Treatment',
    description: 'Recognize status epilepticus, administer benzodiazepines (lorazepam/diazepam), assess airway, prepare for intubation.',
    level: 'foundational' as const,
    emergencyType: 'seizure' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
    order: 10,
  },
  {
    courseId: 'status-epilepticus-ii',
    title: 'Paediatric Status Epilepticus II: Refractory Seizures',
    description: 'Manage refractory status epilepticus with phenytoin/levetiracetam, prepare for intubation and ICU care.',
    level: 'advanced' as const,
    emergencyType: 'seizure' as const,
    duration: 60,
    price: 120000,
    prerequisiteId: 'status-epilepticus-i',
    order: 11,
  },

  // ===== TOXICOLOGY (3 courses) =====
  {
    courseId: 'poisoning-i',
    title: 'Paediatric Poisoning I: Recognition and Initial Management',
    description: 'Recognize poisoning, obtain history, perform decontamination, activate poison center, manage airway.',
    level: 'foundational' as const,
    emergencyType: 'toxicology' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
    order: 12,
  },
  {
    courseId: 'overdose-i',
    title: 'Paediatric Drug Overdose I: Opioids, Sedatives, Stimulants',
    description: 'Recognize overdose patterns, administer naloxone, manage respiratory depression, assess for polypharmacy.',
    level: 'foundational' as const,
    emergencyType: 'toxicology' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
    order: 13,
  },
  {
    courseId: 'caustic-ingestion-i',
    title: 'Paediatric Caustic Ingestion: Acids and Alkalis',
    description: 'Manage caustic ingestion, assess esophageal injury, avoid induced vomiting, arrange endoscopy.',
    level: 'foundational' as const,
    emergencyType: 'toxicology' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
    order: 14,
  },

  // ===== METABOLIC (4 courses) =====
  {
    courseId: 'dka-i',
    title: 'Paediatric DKA I: Recognition and Initial Stabilization',
    description: 'Recognize DKA, calculate fluid deficit, initiate IV fluids (0.9% saline), assess electrolytes.',
    level: 'foundational' as const,
    emergencyType: 'metabolic' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
    order: 15,
  },
  {
    courseId: 'dka-ii',
    title: 'Paediatric DKA II: Insulin Therapy and Complications',
    description: 'Manage insulin infusion, prevent cerebral edema, monitor potassium, manage complications.',
    level: 'advanced' as const,
    emergencyType: 'metabolic' as const,
    duration: 60,
    price: 120000,
    prerequisiteId: 'dka-i',
    order: 16,
  },
  {
    courseId: 'hypoglycemia-i',
    title: 'Paediatric Hypoglycemia: Acute Recognition and Treatment',
    description: 'Recognize hypoglycemia symptoms, administer dextrose IV or glucagon IM, manage rebound hyperglycemia.',
    level: 'foundational' as const,
    emergencyType: 'metabolic' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
    order: 17,
  },
  {
    courseId: 'electrolyte-i',
    title: 'Paediatric Electrolyte Emergencies: Sodium and Potassium',
    description: 'Recognize severe hyponatremia/hypernatremia and hypokalemia/hyperkalemia, calculate correction rates safely.',
    level: 'foundational' as const,
    emergencyType: 'metabolic' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
    order: 18,
  },

  // ===== INFECTIOUS (2 courses) =====
  {
    courseId: 'meningitis-i',
    title: 'Paediatric Meningitis I: Recognition and Empiric Antibiotics',
    description: 'Recognize meningitis, perform lumbar puncture safely, administer empiric antibiotics immediately.',
    level: 'foundational' as const,
    emergencyType: 'infectious' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
    order: 19,
  },
  {
    courseId: 'malaria-i',
    title: 'Paediatric Malaria: Severe Malaria and Cerebral Complications',
    description: 'Recognize severe malaria, administer artemether IV, manage cerebral malaria and organ failure.',
    level: 'foundational' as const,
    emergencyType: 'infectious' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
    order: 20,
  },

  // ===== BURNS (2 courses) =====
  {
    courseId: 'burns-i',
    title: 'Paediatric Burns I: Recognition and First-Hour Resuscitation',
    description: 'Recognize burn severity, calculate TBSA using Rule of 9s, implement Parkland formula fluid resuscitation.',
    level: 'foundational' as const,
    emergencyType: 'burns' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
    order: 21,
  },
  {
    courseId: 'burns-ii',
    title: 'Paediatric Burns II: Advanced Fluid Management and Complications',
    description: 'Manage burn complications, recognize compartment syndrome, prevent rhabdomyolysis-induced AKI, long-term rehabilitation.',
    level: 'advanced' as const,
    emergencyType: 'burns' as const,
    duration: 60,
    price: 120000,
    prerequisiteId: 'burns-i',
    order: 22,
  },

  // ===== TRAUMA (2 courses) =====
  {
    courseId: 'trauma-i',
    title: 'Paediatric Trauma I: Primary and Secondary Survey',
    description: 'Perform primary survey (ABCDE), manage airway with c-spine protection, assess for life-threatening injuries.',
    level: 'foundational' as const,
    emergencyType: 'trauma' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
    order: 23,
  },
  {
    courseId: 'trauma-ii',
    title: 'Paediatric Trauma II: Hemorrhage Control and Damage Control Surgery',
    description: 'Manage massive hemorrhage, activate trauma protocol, prepare for damage control surgery, prevent hypothermia.',
    level: 'advanced' as const,
    emergencyType: 'trauma' as const,
    duration: 60,
    price: 120000,
    prerequisiteId: 'trauma-i',
    order: 24,
  },

  // ===== ADDITIONAL CRITICAL COURSES (2 courses) =====
  {
    courseId: 'aki-i',
    title: 'Paediatric Acute Kidney Injury: Recognition and Management',
    description: 'Recognize AKI, calculate urine output and creatinine, manage fluid balance, prepare for renal replacement therapy.',
    level: 'foundational' as const,
    emergencyType: 'metabolic' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
    order: 25,
  },
  {
    courseId: 'anaemia-i',
    title: 'Paediatric Severe Anaemia: Transfusion and Complications',
    description: 'Recognize severe anaemia, calculate transfusion volume, manage transfusion reactions, address underlying cause.',
    level: 'foundational' as const,
    emergencyType: 'metabolic' as const,
    duration: 45,
    price: 80000,
    prerequisiteId: null,
    order: 26,
  },
];

async function seedCourses() {
  let poolConnection;
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'paeds_resus',
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
    });

    poolConnection = await pool.getConnection();
    console.log('✓ Connected to database');

    const db = drizzle(poolConnection);

    // Check if courses already exist
    const existing = await db.select().from(microCourses).limit(1);
    if (existing.length > 0) {
      console.log('⚠ Database already has courses. Skipping seed.');
      await poolConnection.release();
      await pool.end();
      return;
    }

    // Insert all courses
    let inserted = 0;
    for (const course of COURSES) {
      await db.insert(microCourses).values({
        courseId: course.courseId,
        title: course.title,
        description: course.description,
        level: course.level,
        emergencyType: course.emergencyType,
        duration: course.duration,
        price: course.price,
        prerequisiteId: course.prerequisiteId,
        order: course.order,
      });
      inserted++;
      console.log(`✓ Inserted: ${course.title}`);
    }

    console.log(`\n✅ Successfully seeded ${inserted} micro-courses`);

    await poolConnection.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Seed error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

seedCourses();
