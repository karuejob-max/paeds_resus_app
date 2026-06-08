/**
 * Shared AHA hub program listing — used by listAhaHubPrograms and getAhaHubDashboard.
 */
import { resolveAhaCourseAnchorCached, type AhaAnchorProgramType } from "./resolve-aha-course-anchor";
import type { courses } from "../../drizzle/schema";

const HUB_PROGRAM_ORDER: readonly AhaAnchorProgramType[] = [
  "bls",
  "acls",
  "pals",
  "heartsaver",
  "nrp",
] as const;

export async function fetchAhaHubPrograms(
  database: NonNullable<Awaited<ReturnType<typeof import("../db").getDb>>>,
  options: { skipEnsure?: boolean } = { skipEnsure: true }
): Promise<(typeof courses.$inferSelect)[]> {
  // Parallel fetch using the cached resolver
  const resolved = await Promise.all(
    HUB_PROGRAM_ORDER.map(async (pt) => {
      try {
        return await resolveAhaCourseAnchorCached(database, pt, options);
      } catch (programErr) {
        console.warn(`[aha-hub-programs] skipping ${pt}:`, programErr);
        return null;
      }
    })
  );

  return resolved.filter(
    (anchor): anchor is NonNullable<Awaited<ReturnType<typeof resolveAhaCourseAnchorCached>>> =>
      anchor != null
  );
}
