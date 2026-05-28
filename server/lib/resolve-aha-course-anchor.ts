/**
 * Pick the canonical `courses` row for an AHA program (BLS / ACLS / PALS / Heartsaver).
 * Prefers the row with the most modules so empty test duplicates are ignored.
 */
import { and, asc, eq, inArray, like, not, sql } from "drizzle-orm";
import { courses, modules } from "../../drizzle/schema";
import { ensureBlsCatalog, ensureAclsCatalog } from "./ensure-bls-acls-catalog";
import { ensureHeartsaverCatalog } from "./ensure-heartsaver-catalog";
import { ensurePalsAhaCatalog } from "./ensure-pals-aha-catalog";
import { ensureNrpCatalog } from "./ensure-nrp-catalog";

export type AhaAnchorProgramType = "bls" | "acls" | "pals" | "heartsaver" | "nrp";

export async function ensureAhaProgramCatalog(
  db: any,
  programType: AhaAnchorProgramType
): Promise<void> {
  if (programType === "bls") {
    await ensureBlsCatalog(db);
  } else if (programType === "acls") {
    await ensureAclsCatalog(db);
  } else if (programType === "pals") {
    await ensurePalsAhaCatalog(db);
  } else if (programType === "heartsaver") {
    await ensureHeartsaverCatalog(db);
  } else if (programType === "nrp") {
    await ensureNrpCatalog(db);
  }
}

const ANCHOR_CACHE_TTL_MS = 5 * 60 * 1000;
const anchorCache = new Map<
  AhaAnchorProgramType,
  { anchor: (typeof courses.$inferSelect) | null; expiresAt: number }
>();

/** Cached wrapper — catalog anchors change rarely; avoids repeat ensure + module counts per request. */
export async function resolveAhaCourseAnchorCached(
  db: any,
  programType: AhaAnchorProgramType
): Promise<(typeof courses.$inferSelect) | null> {
  const hit = anchorCache.get(programType);
  if (hit && hit.expiresAt > Date.now()) return hit.anchor;
  const anchor = await resolveAhaCourseAnchor(db, programType);
  anchorCache.set(programType, { anchor, expiresAt: Date.now() + ANCHOR_CACHE_TTL_MS });
  return anchor;
}

export async function resolveAhaCourseAnchor(
  db: any,
  programType: AhaAnchorProgramType
): Promise<(typeof courses.$inferSelect) | null> {
  await ensureAhaProgramCatalog(db, programType);

  const palsFilter =
    programType === "pals"
      ? and(
          eq(courses.programType, programType),
          not(like(courses.title, "%seriously ill%")),
          not(like(courses.title, "%Paediatric septic shock%"))
        )
      : eq(courses.programType, programType);

  const rows = await db
    .select()
    .from(courses)
    .where(palsFilter)
    .orderBy(asc(courses.id));

  if (!rows.length) return null;

  const counts = await db
    .select({
      courseId: modules.courseId,
      moduleCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(modules)
    .where(
      inArray(
        modules.courseId,
        rows.map((r: { id: number }) => r.id)
      )
    )
    .groupBy(modules.courseId);

  const countByCourse = new Map(counts.map((c: { courseId: number; moduleCount: number }) => [c.courseId, c.moduleCount]));

  let best = rows[0] as (typeof courses.$inferSelect);
  let bestCount = countByCourse.get(best.id) ?? 0;
  for (const row of rows as (typeof courses.$inferSelect)[]) {
    const n = countByCourse.get(row.id) ?? 0;
    if (n > bestCount) {
      best = row;
      bestCount = n;
    }
  }

  return best;
}
