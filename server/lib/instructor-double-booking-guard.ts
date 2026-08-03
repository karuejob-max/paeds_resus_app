import { and, eq, gte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { trainingSchedules } from "../../drizzle/schema";

type DbClient = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/**
 * Blocks assigning an instructor to a session that overlaps another one
 * they're already assigned to. "Overlap" rule: same scheduledDate (compared
 * as a calendar day) plus a time-window overlap when both sessions have
 * startTime/endTime set. If either session is missing a time, we can't
 * safely compare windows -- treated as blocking the whole day, since an
 * untimed session usually means "sometime that day," not a known-safe gap.
 * excludeScheduleId lets an update check against every *other* schedule
 * without flagging itself.
 *
 * Extracted 2026-08-02 from server/routers/institution.ts (originally
 * built for coordinator-created sessions) so the new self-service
 * instructor-declared-availability flow (courses.ts, Phase 2 booking,
 * docs/IERP_NERP_PROGRAM_V2_SPEC.md §4.4) gets the same protection instead
 * of a second, drifting copy of this logic.
 */
export async function assertNoInstructorDoubleBooking(
  db: DbClient,
  params: {
    instructorId: number;
    scheduledDate: Date;
    startTime: string | null | undefined;
    endTime: string | null | undefined;
    excludeScheduleId?: number;
  }
) {
  const dayStart = new Date(params.scheduledDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const sameDayConditions = [
    eq(trainingSchedules.instructorId, params.instructorId),
    gte(trainingSchedules.scheduledDate, dayStart),
    sql`${trainingSchedules.scheduledDate} < ${dayEnd}`,
    sql`${trainingSchedules.status} != 'cancelled'`,
  ];
  if (params.excludeScheduleId != null) {
    sameDayConditions.push(sql`${trainingSchedules.id} != ${params.excludeScheduleId}`);
  }

  const candidates = await db
    .select({
      id: trainingSchedules.id,
      startTime: trainingSchedules.startTime,
      endTime: trainingSchedules.endTime,
      institutionalAccountId: trainingSchedules.institutionalAccountId,
    })
    .from(trainingSchedules)
    .where(and(...sameDayConditions));

  if (candidates.length === 0) return;

  const newStart = params.startTime?.trim() || null;
  const newEnd = params.endTime?.trim() || null;

  for (const c of candidates) {
    // Either session missing a time window -> can't rule out overlap, block.
    if (!newStart || !newEnd || !c.startTime || !c.endTime) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `This instructor is already assigned to another session on this date (schedule #${c.id}) without a full time window recorded, so we can't confirm there's no overlap. Set both start and end times, or pick a different instructor/date.`,
      });
    }
    // Standard interval overlap check: starts before the other ends, and
    // ends after the other starts.
    if (newStart < c.endTime && newEnd > c.startTime) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `This instructor is already assigned to another session on this date from ${c.startTime}-${c.endTime} (schedule #${c.id}). Pick a different time or instructor.`,
      });
    }
  }
}
