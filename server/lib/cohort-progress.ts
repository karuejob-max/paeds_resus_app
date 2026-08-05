import { eq, sql } from "drizzle-orm";
import { institutionalStaffMembers } from "../../drizzle/schema";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export interface CohortProgressRow {
  designation: string | null;
  totalCount: number;
  blsCompleteCount: number;
  aclsCompleteCount: number;
  phase2CompleteCount: number;
}

/**
 * Per-designation cohort completion counts for one institution — the same
 * query behind `institution.getCohortProgress` (the coordinator dashboard's
 * `CohortProgressWidget`) and the INST-20 readiness-summary PDF. Pulled out
 * to a shared function so the PDF and the dashboard can never quietly
 * report different numbers for the same institution.
 */
export async function getCohortProgressStats(db: Db, institutionId: number): Promise<CohortProgressRow[]> {
  const rows = await db
    .select({
      designation: institutionalStaffMembers.designation,
      totalCount: sql<number>`count(${institutionalStaffMembers.id})`,
      blsCompleteCount: sql<number>`sum(case when ${institutionalStaffMembers.certificationStatus} = 'certified' and ${institutionalStaffMembers.assignedCourses} like '%bls%' then 1 else 0 end)`,
      aclsCompleteCount: sql<number>`sum(case when ${institutionalStaffMembers.certificationStatus} = 'certified' and ${institutionalStaffMembers.assignedCourses} like '%acls%' then 1 else 0 end)`,
      phase2CompleteCount: sql<number>`sum(case when ${institutionalStaffMembers.phaseStatus} in ('phase_3', 'completed') then 1 else 0 end)`,
    })
    .from(institutionalStaffMembers)
    .where(eq(institutionalStaffMembers.institutionalAccountId, institutionId))
    .groupBy(institutionalStaffMembers.designation);

  // MySQL returns SUM()/COUNT() as strings via mysql2 in some drivers; coerce
  // defensively so downstream percentage math (PDF route) never does string
  // arithmetic silently.
  return rows.map((r) => ({
    designation: r.designation,
    totalCount: Number(r.totalCount) || 0,
    blsCompleteCount: Number(r.blsCompleteCount) || 0,
    aclsCompleteCount: Number(r.aclsCompleteCount) || 0,
    phase2CompleteCount: Number(r.phase2CompleteCount) || 0,
  }));
}
