/**
 * Training schedules reference `courses.id`. Ensure at least one catalog row exists per program type
 * before creating/updating institutional schedules (same idea as PALS auto-seed on learning.getCourses).
 */
import { eq, asc } from "drizzle-orm";
import { courses } from "../../drizzle/schema";
import { ensurePalsSeriouslyIllCatalog } from "./ensure-pals-seriously-ill-catalog";

type Pt = "bls" | "acls" | "pals" | "fellowship";

const MINIMAL: Record<Exclude<Pt, "pals">, { title: string; description: string; order: number; duration: number }> = {
  bls: {
    title: "Basic Life Support (BLS)",
    description: "Institutional BLS training — catalog anchor for scheduling and roster.",
    order: 1,
    duration: 240,
  },
  acls: {
    title: "Advanced Cardiovascular Life Support (ACLS)",
    description: "Institutional ACLS training — catalog anchor for scheduling and roster.",
    order: 1,
    duration: 240,
  },
  fellowship: {
    title: "Paeds Resus Fellowship",
    description: "Institutional fellowship pathway — catalog anchor for scheduling.",
    order: 1,
    duration: 600,
  },
};

export async function ensureCourseCatalogForSchedule(db: any, programType: Pt): Promise<void> {
  const existing = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.programType, programType))
    .orderBy(asc(courses.id))
    .limit(1);
  if (existing.length) return;

  if (programType === "pals") {
    await ensurePalsSeriouslyIllCatalog(db);
    return;
  }

  const m = MINIMAL[programType];
  await db.insert(courses).values({
    title: m.title,
    description: m.description,
    programType,
    duration: m.duration,
    level: "intermediate",
    order: m.order,
  });
}
