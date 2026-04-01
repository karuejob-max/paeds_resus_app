import { eq, and, isNotNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  users,
  trainingSchedules,
  courses,
  institutionalAccounts,
} from "../../drizzle/schema";

export const instructorRouter = router({
  /** Certification + platform approval flags for the instructor journey. */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }
    const [row] = await db
      .select({
        instructorNumber: users.instructorNumber,
        instructorCertifiedAt: users.instructorCertifiedAt,
        instructorApprovedAt: users.instructorApprovedAt,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    return {
      certified: Boolean(row?.instructorCertifiedAt && row?.instructorNumber),
      instructorNumber: row?.instructorNumber ?? null,
      instructorCertifiedAt: row?.instructorCertifiedAt ?? null,
      approved: Boolean(row?.instructorApprovedAt),
      instructorApprovedAt: row?.instructorApprovedAt ?? null,
      portalUnlocked: Boolean(
        row?.instructorNumber && row?.instructorCertifiedAt && row?.instructorApprovedAt
      ),
    };
  }),

  /** B2B sessions where this user is the assigned instructor (`trainingSchedules.instructorId`). */
  getMyAssignments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }

    const [u] = await db
      .select({
        instructorNumber: users.instructorNumber,
        instructorCertifiedAt: users.instructorCertifiedAt,
        instructorApprovedAt: users.instructorApprovedAt,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    const eligible =
      u?.instructorNumber &&
      u.instructorCertifiedAt &&
      u.instructorApprovedAt;

    if (!eligible) {
      return { assignments: [] as const, eligible: false as const };
    }

    const rows = await db
      .select({
        id: trainingSchedules.id,
        scheduledDate: trainingSchedules.scheduledDate,
        startTime: trainingSchedules.startTime,
        endTime: trainingSchedules.endTime,
        location: trainingSchedules.location,
        trainingType: trainingSchedules.trainingType,
        status: trainingSchedules.status,
        maxCapacity: trainingSchedules.maxCapacity,
        enrolledCount: trainingSchedules.enrolledCount,
        programType: courses.programType,
        courseTitle: courses.title,
        institutionName: institutionalAccounts.companyName,
        institutionContactName: institutionalAccounts.contactName,
        institutionContactEmail: institutionalAccounts.contactEmail,
        institutionContactPhone: institutionalAccounts.contactPhone,
      })
      .from(trainingSchedules)
      .innerJoin(courses, eq(trainingSchedules.courseId, courses.id))
      .innerJoin(
        institutionalAccounts,
        eq(trainingSchedules.institutionalAccountId, institutionalAccounts.id)
      )
      .where(
        and(eq(trainingSchedules.instructorId, ctx.user.id), isNotNull(trainingSchedules.instructorId))
      );

    const now = Date.now();
    const assignments = [...rows].sort((a, b) => {
      const ta = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
      const tb = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
      const aUp = ta >= now;
      const bUp = tb >= now;
      if (aUp && !bUp) return -1;
      if (!aUp && bUp) return 1;
      if (aUp && bUp) return ta - tb;
      return tb - ta;
    });

    return { assignments, eligible: true as const };
  }),
});
