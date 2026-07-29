import { eq, and, isNotNull, desc } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  users,
  trainingSchedules,
  trainingAttendance,
  enrollments,
  courses,
  institutionalAccounts,
  instructorQualifications,
  instructorMentorships,
  instructorMentorshipGroups,
} from "../../drizzle/schema";
import { signOffPracticalSkills } from "../certificates";

export const instructorRouter = router({
  /** Certification + platform approval flags for the instructor journey. */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.userType !== "individual" && ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Instructor portal is available to provider accounts only.",
      });
    }
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }
    const [row] = await db
      .select({
        instructorNumber: users.instructorNumber,
        instructorCertifiedAt: users.instructorCertifiedAt,
        instructorApprovedAt: users.instructorApprovedAt,
        instructorTier: users.instructorTier,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    const qualifications = await db
      .select({ programType: instructorQualifications.programType })
      .from(instructorQualifications)
      .where(eq(instructorQualifications.userId, ctx.user.id));

    const [mentorship] = await db
      .select({ id: instructorMentorships.id, mentorUserId: instructorMentorships.mentorUserId })
      .from(instructorMentorships)
      .where(eq(instructorMentorships.menteeUserId, ctx.user.id))
      .limit(1);

    let confirmedGroupCount = 0;
    if (mentorship) {
      const groups = await db
        .select({ id: instructorMentorshipGroups.id })
        .from(instructorMentorshipGroups)
        .where(eq(instructorMentorshipGroups.mentorshipId, mentorship.id));
      confirmedGroupCount = groups.length;
    }

    return {
      certified: Boolean(row?.instructorCertifiedAt && row?.instructorNumber),
      instructorNumber: row?.instructorNumber ?? null,
      instructorCertifiedAt: row?.instructorCertifiedAt ?? null,
      approved: Boolean(row?.instructorApprovedAt),
      instructorApprovedAt: row?.instructorApprovedAt ?? null,
      portalUnlocked: Boolean(
        row?.instructorNumber && row?.instructorCertifiedAt && row?.instructorApprovedAt
      ),
      instructorTier: row?.instructorTier ?? null,
      qualifiedCourses: qualifications.map((q: { programType: string }) => q.programType),
      mentorUserId: mentorship?.mentorUserId ?? null,
      confirmedGroupCount,
      groupsNeededForQualified: Math.max(0, 3 - confirmedGroupCount),
    };
  }),

  /** B2B sessions where this user is the assigned instructor (`trainingSchedules.instructorId`). */
  getMyAssignments: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.userType !== "individual" && ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Instructor assignments are available to provider accounts only.",
      });
    }
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

  // ─────────────────────────────────────────────────────────────────────────
  // AHA-CERT-1: Roster for a training session — lists enrolled learners with
  // their cognitive completion status and practical sign-off state.
  // ─────────────────────────────────────────────────────────────────────────
  getSessionRoster: protectedProcedure
    .input(z.object({ scheduleId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Only the assigned instructor or an admin may view the roster
      const [schedule] = await db
        .select({ instructorId: trainingSchedules.instructorId, courseId: trainingSchedules.courseId })
        .from(trainingSchedules)
        .where(eq(trainingSchedules.id, input.scheduleId))
        .limit(1);

      if (!schedule) throw new TRPCError({ code: "NOT_FOUND", message: "Training session not found" });
      if (ctx.user.role !== "admin" && schedule.instructorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not the assigned instructor for this session." });
      }

      // Get attendance records for this session
      const attendanceRows = await db
        .select({
          id: trainingAttendance.id,
          staffMemberId: trainingAttendance.staffMemberId,
          attendanceStatus: trainingAttendance.attendanceStatus,
          skillsAssessmentScore: trainingAttendance.skillsAssessmentScore,
          feedback: trainingAttendance.feedback,
          certificateIssued: trainingAttendance.certificateIssued,
        })
        .from(trainingAttendance)
        .where(eq(trainingAttendance.trainingScheduleId, input.scheduleId));

      if (attendanceRows.length === 0) return { roster: [] };

      const staffIds = attendanceRows.map((r) => r.staffMemberId);

      // Get user details for each staff member
      const userRows = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, staffIds[0])); // Drizzle inArray workaround — fetch individually if small

      // Get enrollment records for these users for the course
      const enrollmentRows = await db
        .select({
          id: enrollments.id,
          userId: enrollments.userId,
          programType: enrollments.programType,
          cognitiveModulesComplete: enrollments.cognitiveModulesComplete,
          practicalSkillsSignedOff: enrollments.practicalSkillsSignedOff,
          practicalSignedOffAt: enrollments.practicalSignedOffAt,
          practicalSignedOffByName: enrollments.practicalSignedOffByName,
          paymentStatus: enrollments.paymentStatus,
        })
        .from(enrollments)
        .where(eq(enrollments.courseId, schedule.courseId))
        .orderBy(desc(enrollments.createdAt));

      // Build roster map
      const enrollmentByUserId = new Map(enrollmentRows.map((e) => [e.userId, e]));
      const userById = new Map(userRows.map((u) => [u.id, u]));

      const roster = attendanceRows.map((att) => {
        const user = userById.get(att.staffMemberId);
        const enrollment = enrollmentByUserId.get(att.staffMemberId);
        return {
          attendanceId: att.id,
          enrollmentId: enrollment?.id ?? null,
          userId: att.staffMemberId,
          name: user?.name ?? "Unknown",
          email: user?.email ?? null,
          attendanceStatus: att.attendanceStatus,
          skillsAssessmentScore: att.skillsAssessmentScore,
          feedback: att.feedback,
          cognitiveModulesComplete: enrollment?.cognitiveModulesComplete ?? false,
          practicalSkillsSignedOff: enrollment?.practicalSkillsSignedOff ?? false,
          practicalSignedOffAt: enrollment?.practicalSignedOffAt ?? null,
          practicalSignedOffByName: enrollment?.practicalSignedOffByName ?? null,
          certificateIssued: att.certificateIssued,
          paymentStatus: enrollment?.paymentStatus ?? "pending",
        };
      });

      return { roster };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // AHA-CERT-1: Instructor signs off practical skills for a learner.
  // This is the trigger that allows certificate issuance for BLS/ACLS/PALS.
  // ─────────────────────────────────────────────────────────────────────────
  signOffPracticalSkills: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.number().int().positive(),
        /** Optional score 0-100 for the skills assessment */
        skillsScore: z.number().int().min(0).max(100).optional(),
        /** Optional notes from the instructor */
        notes: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify the calling user is an approved instructor or admin
      const [u] = await db
        .select({
          name: users.name,
          instructorApprovedAt: users.instructorApprovedAt,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!u) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      if (!u.instructorApprovedAt && u.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only approved instructors or admins can sign off practical skills assessments.",
        });
      }

      const instructorName = u.name ?? "Instructor";

      // Perform the sign-off (this will also attempt to issue the certificate)
      const result = await signOffPracticalSkills(input.enrollmentId, ctx.user.id, instructorName);

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error ?? "Sign-off failed",
        });
      }

      return {
        success: true,
        certificateIssued: result.certificateIssued,
        message: result.certificateIssued
          ? "Practical skills signed off and certificate issued successfully."
          : "Practical skills signed off. Certificate will be issued once all cognitive modules are also complete.",
      };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // AHA-CERT-1: Update attendance status for a learner in a session
  // ─────────────────────────────────────────────────────────────────────────
  updateAttendance: protectedProcedure
    .input(
      z.object({
        attendanceId: z.number().int().positive(),
        attendanceStatus: z.enum(["registered", "attended", "absent", "cancelled"]),
        skillsAssessmentScore: z.number().int().min(0).max(100).optional(),
        feedback: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [u] = await db
        .select({ instructorApprovedAt: users.instructorApprovedAt, role: users.role })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!u?.instructorApprovedAt && u?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only approved instructors or admins can update attendance.",
        });
      }

      await db
        .update(trainingAttendance)
        .set({
          attendanceStatus: input.attendanceStatus,
          ...(input.skillsAssessmentScore !== undefined
            ? { skillsAssessmentScore: input.skillsAssessmentScore }
            : {}),
          ...(input.feedback !== undefined ? { feedback: input.feedback } : {}),
        })
        .where(eq(trainingAttendance.id, input.attendanceId));

      return { success: true };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // MENTORSHIP PATHWAY (CEO decision, 2026-07-21): provisional -> qualified
  // -> lead_instructor. Admin-only to assign a mentor (keeps this a deliberate
  // pairing decision, not self-service). A mentor confirms groups their
  // mentee led independently; 3 confirmed groups auto-promotes the mentee
  // to qualified; 10 mentees taken to qualified auto-promotes the mentor
  // to lead_instructor.
  // ─────────────────────────────────────────────────────────────────────────

  assignMentor: protectedProcedure
    .input(z.object({ menteeUserId: z.number().int().positive(), mentorUserId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only platform admins can assign an instructor mentor." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const existing = await db
        .select({ id: instructorMentorships.id })
        .from(instructorMentorships)
        .where(eq(instructorMentorships.menteeUserId, input.menteeUserId))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This instructor already has a mentor assigned for their provisional period." });
      }

      await db.insert(instructorMentorships).values({
        menteeUserId: input.menteeUserId,
        mentorUserId: input.mentorUserId,
      });

      return { success: true };
    }),

  confirmMentorshipGroup: protectedProcedure
    .input(z.object({
      menteeUserId: z.number().int().positive(),
      programType: z.enum(["bls", "acls", "pals", "fellowship", "instructor", "fellowship_diploma", "heartsaver", "nrp"]),
      institutionalAccountId: z.number().int().positive().optional(),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [mentorship] = await db
        .select({ id: instructorMentorships.id, mentorUserId: instructorMentorships.mentorUserId })
        .from(instructorMentorships)
        .where(eq(instructorMentorships.menteeUserId, input.menteeUserId))
        .limit(1);

      if (!mentorship) {
        throw new TRPCError({ code: "NOT_FOUND", message: "This instructor has no mentor assigned." });
      }
      if (mentorship.mentorUserId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only this instructor's assigned mentor (or an admin) can confirm a group." });
      }

      await db.insert(instructorMentorshipGroups).values({
        mentorshipId: mentorship.id,
        institutionalAccountId: input.institutionalAccountId,
        programType: input.programType,
        confirmedByUserId: ctx.user.id,
        notes: input.notes,
      });

      const groups = await db
        .select({ id: instructorMentorshipGroups.id })
        .from(instructorMentorshipGroups)
        .where(eq(instructorMentorshipGroups.mentorshipId, mentorship.id));

      let promoted = false;
      if (groups.length >= 3) {
        await db
          .update(users)
          .set({ instructorTier: "qualified" })
          .where(and(eq(users.id, input.menteeUserId), eq(users.instructorTier, "provisional")));
        promoted = true;

        // Lead Instructor check: has this mentor now taken 10 distinct mentees to "qualified"?
        const mentorMentorships = await db
          .select({ menteeUserId: instructorMentorships.menteeUserId })
          .from(instructorMentorships)
          .where(eq(instructorMentorships.mentorUserId, mentorship.mentorUserId));

        let qualifiedMenteeCount = 0;
        for (const m of mentorMentorships) {
          const [menteeUser] = await db
            .select({ instructorTier: users.instructorTier })
            .from(users)
            .where(eq(users.id, m.menteeUserId))
            .limit(1);
          if (menteeUser?.instructorTier === "qualified" || menteeUser?.instructorTier === "lead_instructor") {
            qualifiedMenteeCount++;
          }
        }
        if (qualifiedMenteeCount >= 10) {
          await db
            .update(users)
            .set({ instructorTier: "lead_instructor" })
            .where(and(eq(users.id, mentorship.mentorUserId), eq(users.instructorTier, "qualified")));
        }
      }

      return { success: true, groupCount: groups.length, promotedToQualified: promoted };
    }),

  /** Bootstrap override (CEO decision, 2026-07-21): for instructors trained
   * directly by the CEO before this system existed, who have no real
   * mentor to log into it. Admin-only, direct tier assignment. */
  setInstructorTierOverride: protectedProcedure
    .input(z.object({ userId: z.number().int().positive(), tier: z.enum(["provisional", "qualified", "lead_instructor"]) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only platform admins can override an instructor's tier." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(users).set({ instructorTier: input.tier }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  /** For a mentor's own portal view: who they're mentoring and progress toward lead instructor. */
  getMyMentees: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const mentorships = await db
      .select({ id: instructorMentorships.id, menteeUserId: instructorMentorships.menteeUserId })
      .from(instructorMentorships)
      .where(eq(instructorMentorships.mentorUserId, ctx.user.id));

    const result = [];
    for (const m of mentorships) {
      const [mentee] = await db
        .select({ name: users.name, instructorTier: users.instructorTier })
        .from(users)
        .where(eq(users.id, m.menteeUserId))
        .limit(1);
      const groups = await db
        .select({ id: instructorMentorshipGroups.id })
        .from(instructorMentorshipGroups)
        .where(eq(instructorMentorshipGroups.mentorshipId, m.id));
      result.push({
        menteeUserId: m.menteeUserId,
        menteeName: mentee?.name ?? "Unknown",
        instructorTier: mentee?.instructorTier ?? null,
        confirmedGroupCount: groups.length,
      });
    }
    return result;
  }),
});
