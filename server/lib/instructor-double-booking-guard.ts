import { and, eq, gte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { trainingSchedules } from "../../drizzle/schema";

type DbClient = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/**
 * Blocks assigning an instructor to a session that overlaps another one
 * they're already assigned to. A missing endDate means the scheduledDate
 * calendar day only. Any multi-day overlap is blocked conservatively; for a
 * single shared day, complete time windows are compared as before.
 */
export async function assertNoInstructorDoubleBooking(
  db: DbClient,
  params: {
    instructorId: number;
    scheduledDate: Date;
    endDate?: Date | null;
    startTime: string | null | undefined;
    endTime: string | null | undefined;
    excludeScheduleId?: number;
  },
) {
  const newStartDate = new Date(params.scheduledDate);
  newStartDate.setHours(0, 0, 0, 0);
  const newEndDate = new Date(params.endDate ?? params.scheduledDate);
  newEndDate.setHours(0, 0, 0, 0);
  if (newEndDate < newStartDate) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "A multi-day session must end on or after its start date." });
  }
  const queryEndExclusive = new Date(newEndDate);
  queryEndExclusive.setDate(queryEndExclusive.getDate() + 1);

  const overlapConditions = [
    eq(trainingSchedules.instructorId, params.instructorId),
    sql`${trainingSchedules.scheduledDate} < ${queryEndExclusive}`,
    sql`COALESCE(${trainingSchedules.endDate}, ${trainingSchedules.scheduledDate}) >= ${newStartDate}`,
    sql`${trainingSchedules.status} != 'cancelled'`,
  ];
  if (params.excludeScheduleId != null) {
    overlapConditions.push(sql`${trainingSchedules.id} != ${params.excludeScheduleId}`);
  }

  const candidates = await db
    .select({
      id: trainingSchedules.id,
      scheduledDate: trainingSchedules.scheduledDate,
      endDate: trainingSchedules.endDate,
      startTime: trainingSchedules.startTime,
      endTime: trainingSchedules.endTime,
      institutionalAccountId: trainingSchedules.institutionalAccountId,
    })
    .from(trainingSchedules)
    .where(and(...overlapConditions));

  if (candidates.length === 0) return;

  const newStart = params.startTime?.trim() || null;
  const newEnd = params.endTime?.trim() || null;
  const newIsMultiDay = newEndDate.getTime() > newStartDate.getTime();

  for (const candidate of candidates) {
    const candidateStartDate = new Date(candidate.scheduledDate);
    candidateStartDate.setHours(0, 0, 0, 0);
    const candidateEndDate = new Date(candidate.endDate ?? candidate.scheduledDate);
    candidateEndDate.setHours(0, 0, 0, 0);
    const candidateIsMultiDay = candidateEndDate.getTime() > candidateStartDate.getTime();

    if (newIsMultiDay || candidateIsMultiDay || candidateStartDate.getTime() !== newStartDate.getTime()) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `This instructor is already assigned to an overlapping session (schedule #${candidate.id}). Multi-day or cross-day assignments require a different instructor.`,
      });
    }

    if (!newStart || !newEnd || !candidate.startTime || !candidate.endTime) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `This instructor is already assigned to another session on this date (schedule #${candidate.id}) without a full time window recorded, so we can't confirm there's no overlap. Set both start and end times, or pick a different instructor/date.`,
      });
    }
    if (newStart < candidate.endTime && newEnd > candidate.startTime) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `This instructor is already assigned to another session on this date from ${candidate.startTime}-${candidate.endTime} (schedule #${candidate.id}). Pick a different time or instructor.`,
      });
    }
  }
}
