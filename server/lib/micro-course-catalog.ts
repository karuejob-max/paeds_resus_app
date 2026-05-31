/**
 * Single source of truth for fellowship ADF micro-courses.
 * Prices are in KES cents; product default 200 KES per micro-course (PSoT / leadership).
 */

/** Count of published micro-courses required for Pillar A (includes sample catalog rows). */
export function getFellowshipMicroCourseRequiredCount(): number {
  return MICRO_COURSE_CATALOG.filter((c) => c.isPublished).length;
}

import { asc, eq, inArray } from "drizzle-orm";
import {
  CLINICAL_CONTENT_VERSION as CLINICAL_CONTENT_VERSION_DEFAULT,
  formatMicroCourseCatalogTitle,
} from "../../shared/micro-course-display";
import { getDb } from "../db";
import { microCourses } from "../../drizzle/schema";
import { ensureSeriouslyIllChildFellowshipCatalog } from "./ensure-seriously-ill-child-fellowship-catalog";

/** Re-export for player footer and ops (env `CLINICAL_CONTENT_VERSION` overrides default). */
export const CLINICAL_CONTENT_VERSION =
  process.env.CLINICAL_CONTENT_VERSION?.trim() || CLINICAL_CONTENT_VERSION_DEFAULT;

/** 200 KES = 20000 cents — agreed micro-course list price */
export const MICRO_COURSE_PRICE_KES_CENTS = 20000;

export type MicroCourseCatalogRow = {
  courseId: string;
  title: string;
  description: string;
  /** Foundational vs advanced track (UI badge + certificate). */
  tier: "foundational" | "advanced";
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
  {
    courseId: "seriously-ill-child-i",
    title: formatMicroCourseCatalogTitle("Seriously Ill Child", "foundational"),
    description:
      "Fellowship pillar: structured ABCDE assessment, prioritisation, escalation, and safety — cross-cutting foundation (maps to ResusGPS ABCDE engine).",
    tier: "foundational",
    level: "foundational",
    emergencyType: "trauma",
    duration: 45,
    prerequisiteId: null,
    order: 0,
    isPublished: true,
  },
  { courseId: "asthma-i", title: formatMicroCourseCatalogTitle("Paediatric Asthma", "foundational"), description: "Recognize asthma severity; salbutamol + ipratropium; dexamethasone, prednisolone, or hydrocortisone where taught.", tier: "foundational", level: "foundational", emergencyType: "respiratory", duration: 45, prerequisiteId: null, order: 1, isPublished: true },
  { courseId: "asthma-ii", title: formatMicroCourseCatalogTitle("Paediatric Asthma", "advanced"), description: "Status asthmaticus; continuous nebulised salbutamol; IV salbutamol where appropriate; magnesium; ICU escalation.", tier: "advanced", level: "advanced", emergencyType: "respiratory", duration: 60, prerequisiteId: "asthma-i", order: 2, isPublished: true },
  { courseId: "pneumonia-i", title: formatMicroCourseCatalogTitle("Paediatric Pneumonia", "foundational"), description: "Recognize pneumonia severity, perform chest examination, initiate appropriate antibiotics based on age and risk factors.", tier: "foundational", level: "foundational", emergencyType: "respiratory", duration: 45, prerequisiteId: null, order: 3, isPublished: true },
  { courseId: "pneumonia-ii", title: formatMicroCourseCatalogTitle("Paediatric Pneumonia", "advanced"), description: "Manage severe pneumonia, recognize sepsis progression, implement fluid resuscitation and vasopressor support.", tier: "advanced", level: "advanced", emergencyType: "respiratory", duration: 60, prerequisiteId: "pneumonia-i", order: 4, isPublished: true },
  { courseId: "septic-shock-i", title: formatMicroCourseCatalogTitle("Septic Shock", "foundational"), description: "Recognize sepsis criteria, implement 10–20 mL/kg bolus with reassessment, plan vasopressor escalation (FEAST-aware).", tier: "foundational", level: "foundational", emergencyType: "shock", duration: 45, prerequisiteId: null, order: 5, isPublished: true },
  { courseId: "septic-shock-ii", title: formatMicroCourseCatalogTitle("Septic Shock", "advanced"), description: "Manage refractory shock with noradrenaline/adrenaline, prevent organ failure, manage coagulopathy and ARDS.", tier: "advanced", level: "advanced", emergencyType: "shock", duration: 60, prerequisiteId: "septic-shock-i", order: 6, isPublished: true },
  { courseId: "hypovolemic-shock-i", title: formatMicroCourseCatalogTitle("Hypovolemic Shock", "foundational"), description: "Recognize hypovolemic shock from hemorrhage or dehydration, calculate fluid deficit, implement resuscitation protocol.", tier: "foundational", level: "foundational", emergencyType: "shock", duration: 45, prerequisiteId: null, order: 7, isPublished: true },
  { courseId: "hypovolemic-shock-ii", title: formatMicroCourseCatalogTitle("Hypovolemic Shock", "advanced"), description: "Manage massive hemorrhage, activate massive transfusion protocol, prevent coagulopathy, prepare for surgical intervention.", tier: "advanced", level: "advanced", emergencyType: "shock", duration: 60, prerequisiteId: "hypovolemic-shock-i", order: 8, isPublished: true },
  { courseId: "cardiogenic-shock-i", title: formatMicroCourseCatalogTitle("Cardiogenic Shock", "foundational"), description: "Recognize acute heart failure, assess cardiac function, manage fluid overload, prepare for inotropic support.", tier: "foundational", level: "foundational", emergencyType: "shock", duration: 45, prerequisiteId: null, order: 9, isPublished: true },
  { courseId: "cardiogenic-shock-ii", title: formatMicroCourseCatalogTitle("Cardiogenic Shock", "advanced"), description: "Manage inotropic escalation, recognize arrhythmias, prepare for ECMO or mechanical support.", tier: "advanced", level: "advanced", emergencyType: "shock", duration: 60, prerequisiteId: "cardiogenic-shock-i", order: 10, isPublished: true },
  { courseId: "status-epilepticus-i", title: formatMicroCourseCatalogTitle("Status Epilepticus", "foundational"), description: "SE recognition; midazolam/lorazepam international first-line; Kenya diazepam option; neonates — no benzos.", tier: "foundational", level: "foundational", emergencyType: "seizure", duration: 45, prerequisiteId: null, order: 11, isPublished: true },
  { courseId: "status-epilepticus-ii", title: formatMicroCourseCatalogTitle("Status Epilepticus", "advanced"), description: "Refractory SE; second-line agents; intubation readiness; continuous EEG where available.", tier: "advanced", level: "advanced", emergencyType: "seizure", duration: 60, prerequisiteId: "status-epilepticus-i", order: 12, isPublished: true },
  { courseId: "dka-i", title: formatMicroCourseCatalogTitle("DKA", "foundational"), description: "DKA in mmol/L; fluids NS vs balanced crystalloid; insulin when safe — until ketosis resolving.", tier: "foundational", level: "foundational", emergencyType: "metabolic", duration: 45, prerequisiteId: null, order: 13, isPublished: true },
  { courseId: "dka-ii", title: formatMicroCourseCatalogTitle("DKA", "advanced"), description: "Insulin infusion; cerebral oedema vigilance; electrolytes; euglycemic DKA.", tier: "advanced", level: "advanced", emergencyType: "metabolic", duration: 60, prerequisiteId: "dka-i", order: 14, isPublished: true },
  { courseId: "anaphylaxis-i", title: formatMicroCourseCatalogTitle("Anaphylaxis", "foundational"), description: "Recognize anaphylaxis, calculate epinephrine dose (0.01 mg/kg IM), manage airway, assess for biphasic reaction.", tier: "foundational", level: "foundational", emergencyType: "shock", duration: 45, prerequisiteId: null, order: 15, isPublished: true },
  { courseId: "anaphylaxis-ii", title: formatMicroCourseCatalogTitle("Anaphylaxis", "advanced"), description: "Manage refractory anaphylaxis with IV epinephrine, vasopressors, manage airway complications.", tier: "advanced", level: "advanced", emergencyType: "shock", duration: 60, prerequisiteId: "anaphylaxis-i", order: 16, isPublished: true },
  { courseId: "meningitis-i", title: formatMicroCourseCatalogTitle("Meningitis", "foundational"), description: "Recognize meningitis signs, perform lumbar puncture safely, initiate empiric antibiotics, manage airway.", tier: "foundational", level: "foundational", emergencyType: "infectious", duration: 45, prerequisiteId: null, order: 17, isPublished: true },
  { courseId: "meningitis-ii", title: formatMicroCourseCatalogTitle("Meningitis", "advanced"), description: "Manage meningitis complications (subdural empyema, ventriculitis), manage increased ICP, prevent secondary infection.", tier: "advanced", level: "advanced", emergencyType: "infectious", duration: 60, prerequisiteId: "meningitis-i", order: 18, isPublished: true },
  { courseId: "malaria-i", title: formatMicroCourseCatalogTitle("Severe Malaria", "foundational"), description: "Recognize severe malaria, initiate artesunate IV/IM, manage cerebral malaria, assess for complications.", tier: "foundational", level: "foundational", emergencyType: "infectious", duration: 45, prerequisiteId: null, order: 19, isPublished: true },
  { courseId: "malaria-ii", title: formatMicroCourseCatalogTitle("Severe Malaria", "advanced"), description: "Manage severe malaria complications (ARDS, AKI, metabolic acidosis), prepare for exchange transfusion.", tier: "advanced", level: "advanced", emergencyType: "infectious", duration: 60, prerequisiteId: "malaria-i", order: 20, isPublished: true },
  { courseId: "burns-i", title: formatMicroCourseCatalogTitle("Burns", "foundational"), description: "Calculate burn surface area (Rule of 9s), estimate fluid requirements (Parkland formula), manage airway in inhalation injury.", tier: "foundational", level: "foundational", emergencyType: "burns", duration: 45, prerequisiteId: null, order: 21, isPublished: true },
  { courseId: "burns-ii", title: formatMicroCourseCatalogTitle("Burns", "advanced"), description: "Manage burn wounds, prevent infection, manage pain, prepare for skin grafting, manage compartment syndrome.", tier: "advanced", level: "advanced", emergencyType: "burns", duration: 60, prerequisiteId: "burns-i", order: 22, isPublished: true },
  { courseId: "trauma-i", title: formatMicroCourseCatalogTitle("Trauma", "foundational"), description: "Perform primary survey (ABCDE), calculate fluid requirements, manage airway in trauma, activate trauma protocol.", tier: "foundational", level: "foundational", emergencyType: "trauma", duration: 45, prerequisiteId: null, order: 23, isPublished: true },
  { courseId: "trauma-ii", title: formatMicroCourseCatalogTitle("Trauma", "advanced"), description: "Manage massive hemorrhage, activate trauma protocol, prepare for damage control surgery, prevent hypothermia.", tier: "advanced", level: "advanced", emergencyType: "trauma", duration: 60, prerequisiteId: "trauma-i", order: 24, isPublished: true },
  { courseId: "aki-i", title: formatMicroCourseCatalogTitle("AKI", "foundational"), description: "Recognize AKI (KDIGO), urine output and creatinine monitoring, initial fluid balance, electrolyte basics.", tier: "foundational", level: "foundational", emergencyType: "metabolic", duration: 45, prerequisiteId: null, order: 25, isPublished: true },
  { courseId: "aki-ii", title: formatMicroCourseCatalogTitle("AKI", "advanced"), description: "RRT indications (AEIOU), fluid restriction, K⁺/phosphate emergencies, nephrotoxin avoidance, PD as LMIC option when HD unavailable.", tier: "advanced", level: "advanced", emergencyType: "metabolic", duration: 60, prerequisiteId: "aki-i", order: 26, isPublished: true },
  { courseId: "anaemia-i", title: formatMicroCourseCatalogTitle("Anaemia", "foundational"), description: "Recognize severe anaemia, initial transfusion volume, transfusion reactions, address underlying cause.", tier: "foundational", level: "foundational", emergencyType: "metabolic", duration: 45, prerequisiteId: null, order: 27, isPublished: true },
  { courseId: "anaemia-ii", title: formatMicroCourseCatalogTitle("Anaemia", "advanced"), description: "WHO transfusion thresholds, sickle crisis basics, malaria co-morbidity, Kenya blood bank reality, iron vs transfusion.", tier: "advanced", level: "advanced", emergencyType: "metabolic", duration: 60, prerequisiteId: "anaemia-i", order: 28, isPublished: true },
  {
    courseId: "intubation-essentials",
    title: "Intubation Essentials (Sample): Preparation to Post-Intubation Care",
    description:
      "Sample procedural micro-course — not a Fellowship pillar. Prepare equipment/team, safe first-pass attempt, confirm tube position, and stabilize after intubation.",
    tier: "advanced",
    level: "advanced",
    emergencyType: "respiratory",
    duration: 60,
    prerequisiteId: null,
    order: 29,
    isPublished: true,
  },
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

  try {
    await ensureSeriouslyIllChildFellowshipCatalog(db);
  } catch (e) {
    console.error("[micro-course-catalog] ensure seriously-ill-child fellowship content failed:", e);
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
