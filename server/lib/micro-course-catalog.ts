/**
 * Single source of truth for fellowship ADF micro-courses.
 * Prices are in KES cents; product default 200 KES per micro-course (PSoT / leadership).
 */

import { asc, eq, inArray } from "drizzle-orm";
import { CLINICAL_CONTENT_VERSION as CLINICAL_CONTENT_VERSION_DEFAULT } from "../../shared/micro-course-display";
import {
  MICRO_COURSE_CATALOG,
  type MicroCourseCatalogRow,
  isFellowshipPillarMicroCourse,
  FELLOWSHIP_PILLAR_MICRO_COURSE_IDS,
  getFellowshipMicroCourseRequiredCount,
} from "../../shared/micro-course-catalog";
import { getDb } from "../db";
import { microCourses } from "../../drizzle/schema";
import { ensureSeriouslyIllChildFellowshipCatalog } from "./ensure-seriously-ill-child-fellowship-catalog";

export {
  MICRO_COURSE_CATALOG,
  type MicroCourseCatalogRow,
  isFellowshipPillarMicroCourse,
  FELLOWSHIP_PILLAR_MICRO_COURSE_IDS,
  getFellowshipMicroCourseRequiredCount,
};

/** Re-export for player footer and ops (env `CLINICAL_CONTENT_VERSION` overrides default). */
export const CLINICAL_CONTENT_VERSION =
  process.env.CLINICAL_CONTENT_VERSION?.trim() || CLINICAL_CONTENT_VERSION_DEFAULT;

/** 200 KES = 20000 cents — agreed micro-course list price */
export const MICRO_COURSE_PRICE_KES_CENTS = 20000;

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
