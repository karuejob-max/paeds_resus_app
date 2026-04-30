/**
 * Single source of truth for fellowship ADF micro-courses (26 rows).
 * Prices are in KES cents; product default 200 KES per micro-course (PSoT / leadership).
 */

import { asc, eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { microCourses } from "../../drizzle/schema";

/** 200 KES = 20000 cents — agreed micro-course list price */
export const MICRO_COURSE_PRICE_KES_CENTS = 20000;

export type MicroCourseCatalogRow = {
  courseId: string;
  title: string;
  description: string;
  level: "foundational" | "advanced";
  emergencyType:
    | "respiratory"
    | "shock"
    | "seizure"
    | "toxicology"
    | "metabolic"
    | "infectious"
    | "burns"
    | "trauma";
  duration: number;
  prerequisiteId: string | null;
  order: number;
  isPublished: boolean;
};

export const MICRO_COURSE_CATALOG: MicroCourseCatalogRow[] = [
  { courseId: "asthma-i", title: "Paediatric Asthma I: Recognition and Initial Management", description: "Recognize asthma exacerbation severity, implement rapid bronchodilator therapy (salbutamol), and assess response to treatment.", level: "foundational", emergencyType: "respiratory", duration: 45, prerequisiteId: null, order: 1, isPublished: true },
  { courseId: "asthma-ii", title: "Paediatric Asthma II: Severe Exacerbation and Status Asthmaticus", description: "Manage severe asthma exacerbation, IV magnesium, aminophylline, and mechanical ventilation preparation.", level: "advanced", emergencyType: "respiratory", duration: 60, prerequisiteId: "asthma-i", order: 2, isPublished: false },
  { courseId: "pneumonia-i", title: "Paediatric Pneumonia I: Recognition and Initial Antibiotics", description: "Recognize pneumonia severity, perform chest examination, initiate appropriate antibiotics based on age and risk factors.", level: "foundational", emergencyType: "respiratory", duration: 45, prerequisiteId: null, order: 3, isPublished: true },
  { courseId: "pneumonia-ii", title: "Paediatric Pneumonia II: Severe Pneumonia and Sepsis", description: "Manage severe pneumonia, recognize sepsis progression, implement fluid resuscitation and vasopressor support.", level: "advanced", emergencyType: "respiratory", duration: 60, prerequisiteId: "pneumonia-i", order: 4, isPublished: false },
  { courseId: "septic-shock-i", title: "Paediatric Septic Shock I: Recognition and Fluid Resuscitation", description: "Recognize sepsis criteria, implement 20 mL/kg bolus, assess perfusion, and plan vasopressor escalation.", level: "foundational", emergencyType: "shock", duration: 45, prerequisiteId: null, order: 5, isPublished: true },
  { courseId: "septic-shock-ii", title: "Paediatric Septic Shock II: Vasopressors and Multi-Organ Failure", description: "Manage refractory shock with noradrenaline/adrenaline, prevent organ failure, manage coagulopathy and ARDS.", level: "advanced", emergencyType: "shock", duration: 60, prerequisiteId: "septic-shock-i", order: 6, isPublished: false },
  { courseId: "hypovolemic-shock-i", title: "Paediatric Hypovolemic Shock I: Hemorrhage and Dehydration", description: "Recognize hypovolemic shock from hemorrhage or dehydration, calculate fluid deficit, implement resuscitation protocol.", level: "foundational", emergencyType: "shock", duration: 45, prerequisiteId: null, order: 7, isPublished: true },
  { courseId: "hypovolemic-shock-ii", title: "Paediatric Hypovolemic Shock II: Massive Transfusion and Damage Control", description: "Manage massive hemorrhage, activate massive transfusion protocol, prevent coagulopathy, prepare for surgical intervention.", level: "advanced", emergencyType: "shock", duration: 60, prerequisiteId: "hypovolemic-shock-i", order: 8, isPublished: false },
  { courseId: "cardiogenic-shock-i", title: "Paediatric Cardiogenic Shock I: Heart Failure Recognition", description: "Recognize acute heart failure, assess cardiac function, manage fluid overload, prepare for inotropic support.", level: "foundational", emergencyType: "shock", duration: 45, prerequisiteId: null, order: 9, isPublished: true },
  { courseId: "cardiogenic-shock-ii", title: "Paediatric Cardiogenic Shock II: Inotropes and Mechanical Support", description: "Manage inotropic escalation, recognize arrhythmias, prepare for ECMO or mechanical support.", level: "advanced", emergencyType: "shock", duration: 60, prerequisiteId: "cardiogenic-shock-i", order: 10, isPublished: false },
  { courseId: "status-epilepticus-i", title: "Paediatric Status Epilepticus I: Recognition and First-Line Treatment", description: "Recognize status epilepticus, implement benzodiazepine protocol, assess for underlying cause.", level: "foundational", emergencyType: "seizure", duration: 45, prerequisiteId: null, order: 11, isPublished: true },
  { courseId: "status-epilepticus-ii", title: "Paediatric Status Epilepticus II: Refractory Seizures and ICU Management", description: "Manage refractory status epilepticus with second-line agents, prepare for intubation and ICU care.", level: "advanced", emergencyType: "seizure", duration: 60, prerequisiteId: "status-epilepticus-i", order: 12, isPublished: false },
  { courseId: "dka-i", title: "Paediatric DKA I: Recognition and Initial Fluid Resuscitation", description: "Recognize DKA severity, calculate fluid deficit, initiate isotonic fluid resuscitation, manage electrolytes.", level: "foundational", emergencyType: "metabolic", duration: 45, prerequisiteId: null, order: 13, isPublished: true },
  { courseId: "dka-ii", title: "Paediatric DKA II: Insulin Therapy and Complications", description: "Manage insulin infusion, prevent cerebral edema, monitor electrolyte shifts, manage hyperkalemia.", level: "advanced", emergencyType: "metabolic", duration: 60, prerequisiteId: "dka-i", order: 14, isPublished: false },
  { courseId: "anaphylaxis-i", title: "Paediatric Anaphylaxis I: Recognition and Epinephrine", description: "Recognize anaphylaxis, calculate epinephrine dose (0.01 mg/kg IM), manage airway, assess for biphasic reaction.", level: "foundational", emergencyType: "shock", duration: 45, prerequisiteId: null, order: 15, isPublished: true },
  { courseId: "anaphylaxis-ii", title: "Paediatric Anaphylaxis II: Refractory Anaphylaxis and ICU Management", description: "Manage refractory anaphylaxis with IV epinephrine, vasopressors, manage airway complications.", level: "advanced", emergencyType: "shock", duration: 60, prerequisiteId: "anaphylaxis-i", order: 16, isPublished: false },
  { courseId: "meningitis-i", title: "Paediatric Meningitis I: Recognition and Empiric Antibiotics", description: "Recognize meningitis signs, perform lumbar puncture safely, initiate empiric antibiotics, manage airway.", level: "foundational", emergencyType: "infectious", duration: 45, prerequisiteId: null, order: 17, isPublished: true },
  { courseId: "meningitis-ii", title: "Paediatric Meningitis II: Complications and ICU Management", description: "Manage meningitis complications (subdural empyema, ventriculitis), manage increased ICP, prevent secondary infection.", level: "advanced", emergencyType: "infectious", duration: 60, prerequisiteId: "meningitis-i", order: 18, isPublished: false },
  { courseId: "malaria-i", title: "Paediatric Severe Malaria I: Recognition and Artemisinin Therapy", description: "Recognize severe malaria, initiate artemisinin IV/IM, manage cerebral malaria, assess for complications.", level: "foundational", emergencyType: "infectious", duration: 45, prerequisiteId: null, order: 19, isPublished: true },
  { courseId: "malaria-ii", title: "Paediatric Severe Malaria II: Complications and Multi-Organ Failure", description: "Manage severe malaria complications (ARDS, AKI, metabolic acidosis), prepare for exchange transfusion.", level: "advanced", emergencyType: "infectious", duration: 60, prerequisiteId: "malaria-i", order: 20, isPublished: false },
  { courseId: "burns-i", title: "Paediatric Burns I: Assessment and Fluid Resuscitation", description: "Calculate burn surface area (Rule of 9s), estimate fluid requirements (Parkland formula), manage airway in inhalation injury.", level: "foundational", emergencyType: "burns", duration: 45, prerequisiteId: null, order: 21, isPublished: true },
  { courseId: "burns-ii", title: "Paediatric Burns II: Wound Management and Infection Prevention", description: "Manage burn wounds, prevent infection, manage pain, prepare for skin grafting, manage compartment syndrome.", level: "advanced", emergencyType: "burns", duration: 60, prerequisiteId: "burns-i", order: 22, isPublished: false },
  { courseId: "trauma-i", title: "Paediatric Trauma I: Primary Survey and Resuscitation", description: "Perform primary survey (ABCDE), calculate fluid requirements, manage airway in trauma, activate trauma protocol.", level: "foundational", emergencyType: "trauma", duration: 45, prerequisiteId: null, order: 23, isPublished: true },
  { courseId: "trauma-ii", title: "Paediatric Trauma II: Hemorrhage Control and Damage Control Surgery", description: "Manage massive hemorrhage, activate trauma protocol, prepare for damage control surgery, prevent hypothermia.", level: "advanced", emergencyType: "trauma", duration: 60, prerequisiteId: "trauma-i", order: 24, isPublished: false },
  { courseId: "aki-i", title: "Paediatric Acute Kidney Injury: Recognition and Management", description: "Recognize AKI, calculate urine output and creatinine, manage fluid balance, prepare for renal replacement therapy.", level: "foundational", emergencyType: "metabolic", duration: 45, prerequisiteId: null, order: 25, isPublished: true },
  { courseId: "anaemia-i", title: "Paediatric Severe Anaemia: Transfusion and Complications", description: "Recognize severe anaemia, calculate transfusion volume, manage transfusion reactions, address underlying cause.", level: "foundational", emergencyType: "metabolic", duration: 45, prerequisiteId: null, order: 26, isPublished: true },
  { courseId: "intubation-essentials", title: "Paediatric Intubation Essentials (Sample): Preparation to Post-Intubation Care", description: "Sample end-to-end micro-course: prepare equipment/team, perform a safe first-pass attempt, confirm tube position, and stabilize after intubation.", level: "advanced", emergencyType: "respiratory", duration: 60, prerequisiteId: null, order: 27, isPublished: true },
];

/**
 * In-memory flag: catalog is only seeded once per server process.
 * Avoids 29 sequential DB queries on every page load.
 */
let _catalogSeeded = false;

/**
 * Idempotent: upsert all catalog rows into microCourses so list + payment always resolve.
 * Runs only once per server process after first call.
 */
export async function ensureMicroCoursesCatalog(): Promise<void> {
  if (_catalogSeeded) return;
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  const allCourseIds = MICRO_COURSE_CATALOG.map(r => r.courseId);
  const existingRows = await db
    .select({ courseId: microCourses.courseId })
    .from(microCourses)
    .where(inArray(microCourses.courseId, allCourseIds));
  
  const existingIds = new Set(existingRows.map(r => r.courseId));

  for (const row of MICRO_COURSE_CATALOG) {
    const payload = {
      title: row.title,
      description: row.description,
      level: row.level,
      emergencyType: row.emergencyType,
      duration: row.duration,
      price: MICRO_COURSE_PRICE_KES_CENTS,
      prerequisiteId: row.prerequisiteId,
      order: row.order,
      isPublished: row.isPublished,
      updatedAt: now,
    };
    
    if (existingIds.has(row.courseId)) {
      await db.update(microCourses).set(payload).where(eq(microCourses.courseId, row.courseId));
    } else {
      await db.insert(microCourses).values({
        courseId: row.courseId,
        ...payload,
        createdAt: now,
      });
    }
  }
  _catalogSeeded = true;
}

/** Ordered list from DB after ensure (for routers). */
export async function loadMicroCoursesFromDb(): Promise<(typeof microCourses.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];
  await ensureMicroCoursesCatalog();
  return db.select().from(microCourses).orderBy(asc(microCourses.order));
}
