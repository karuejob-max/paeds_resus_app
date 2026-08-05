import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { sendEmail } from "../email-service";
import { courses, trainingAttendance, trainingSchedules, retrospectiveRoleClaims, users } from "../../drizzle/schema";

const APP_BASE = process.env.APP_BASE_URL?.replace(/\/$/, "") || "https://www.paedsresus.com";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

// Mirrors PHASE2_ROLE_LABELS in LearnerDashboard.tsx / InstructorPortal.tsx
// (not imported from either -- both are client-only paths). If the named
// Phase 2 roles ever change, update all three.
const PHASE2_ROLE_LABELS: Record<string, string> = {
  team_member: "Team Member",
  team_leader: "Team Leader",
  team_member_airway_ventilation: "Airway & Ventilation",
  team_member_compressor_1: "Compressor 1",
  team_member_compressor_2: "Compressor 2",
  team_member_monitor_defib_cpr_coach: "Monitor/Defib/CPR Coach",
  team_member_iv_io_meds: "IV/IO Access & Meds",
  team_member_scribe: "Scribe",
  observer: "Observer",
};

/**
 * Email a learner promoted off a hands-on session's waitlist into a
 * confirmed booking (see cancelHandsOnSession's promotion branch). Without
 * this, the only way to find out is opening the dashboard and noticing the
 * status pill changed. Best-effort: logs and returns if no email on file.
 */
export async function notifyBookingWaitlistPromoted(db: Db, scheduleId: number, staffMemberId: number): Promise<void> {
  try {
    const [session] = await db
      .select({
        scheduledDate: trainingSchedules.scheduledDate,
        startTime: trainingSchedules.startTime,
        endTime: trainingSchedules.endTime,
        location: trainingSchedules.location,
        courseTitle: courses.title,
      })
      .from(trainingSchedules)
      .innerJoin(courses, eq(trainingSchedules.courseId, courses.id))
      .where(eq(trainingSchedules.id, scheduleId))
      .limit(1);
    if (!session) return;

    const [learner] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, staffMemberId))
      .limit(1);

    const emailTo = learner?.email?.trim();
    if (!emailTo) {
      console.warn("[cohort-program-notifications] No email for promoted learner", staffMemberId);
      return;
    }

    const when = session.scheduledDate
      ? new Date(session.scheduledDate).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })
      : "—";
    const timeBits = [session.startTime, session.endTime].filter(Boolean).join("–");

    await sendEmail(emailTo, "bookingWaitlistPromoted", {
      learnerName: learner?.name?.trim() || "there",
      courseTitle: session.courseTitle || "your session",
      scheduledSummary: `${when}${timeBits ? ` · ${timeBits}` : ""}`,
      locationLine: session.location?.trim() || "Not specified yet",
      dashboardUrl: `${APP_BASE}/dashboard#my-bookings`,
    });
  } catch (e) {
    console.error("[cohort-program-notifications] waitlist promotion", e);
  }
}

/**
 * Email an instructor when confirmMentorshipGroup's promotion branch bumps
 * their tier (provisional -> qualified, or qualified -> lead_instructor).
 * Best-effort: logs and returns if no email on file.
 */
export async function notifyMentorshipTierPromoted(
  db: Db,
  userId: number,
  newTier: "qualified" | "lead_instructor"
): Promise<void> {
  try {
    const [row] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
    const emailTo = row?.email?.trim();
    if (!emailTo) {
      console.warn("[cohort-program-notifications] No email for promoted instructor", userId);
      return;
    }
    await sendEmail(emailTo, "mentorshipTierPromoted", {
      instructorName: row?.name?.trim() || "there",
      newTier: newTier === "lead_instructor" ? "Lead Instructor" : "Qualified",
      portalUrl: `${APP_BASE}/instructor-portal`,
    });
  } catch (e) {
    console.error("[cohort-program-notifications] mentorship promotion", e);
  }
}

/**
 * Email a learner once their instructor confirms or does-not-confirm the
 * Phase 2 role they booked (see confirmPhase2Role, §4.5). Without this, a
 * learner only finds out by noticing their Phase 2 progress counter moved
 * (or didn't) on the dashboard. Fires for both outcomes -- a non-confirmed
 * role is actionable (book again), not just a silent no-op. Best-effort.
 */
export async function notifyPhase2RoleConfirmed(db: Db, attendanceId: number, passed: boolean): Promise<void> {
  try {
    const [row] = await db
      .select({
        staffMemberId: trainingAttendance.staffMemberId,
        simulationRole: trainingAttendance.simulationRole,
        courseTitle: courses.title,
        scheduledDate: trainingSchedules.scheduledDate,
      })
      .from(trainingAttendance)
      .innerJoin(trainingSchedules, eq(trainingAttendance.trainingScheduleId, trainingSchedules.id))
      .innerJoin(courses, eq(trainingSchedules.courseId, courses.id))
      .where(eq(trainingAttendance.id, attendanceId))
      .limit(1);
    if (!row) return;

    const [learner] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, row.staffMemberId))
      .limit(1);

    const emailTo = learner?.email?.trim();
    if (!emailTo) {
      console.warn("[cohort-program-notifications] No email for learner", row.staffMemberId);
      return;
    }

    const roleLabel = (row.simulationRole && PHASE2_ROLE_LABELS[row.simulationRole]) || row.simulationRole || "your role";
    const courseTitle = row.courseTitle || "your session";
    const when = row.scheduledDate
      ? new Date(row.scheduledDate).toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" })
      : "your session";

    await sendEmail(emailTo, "phase2RoleConfirmed", {
      learnerName: learner?.name?.trim() || "there",
      outcomeHeading: passed ? "Role confirmed" : "Role not confirmed",
      outcomeBody: passed
        ? `Your instructor confirmed you filled the ${roleLabel} role in ${courseTitle} on ${when} — it now counts toward your Phase 2 completion.`
        : `Your instructor reviewed your ${roleLabel} role in ${courseTitle} on ${when} and it wasn't confirmed as complete this time. You're welcome to book another session for this role.`,
      dashboardUrl: `${APP_BASE}/dashboard#my-bookings`,
    });
  } catch (e) {
    console.error("[cohort-program-notifications] phase2 role confirmation", e);
  }
}

/**
 * Email the claimant once the session's instructor approves or rejects
 * their retrospective role claim (see reviewRetrospectiveRoleClaim, §4.5).
 * Fires for both outcomes, same reasoning as notifyPhase2RoleConfirmed
 * above. Best-effort.
 */
export async function notifyRetrospectiveClaimReviewed(db: Db, claimId: number, approved: boolean): Promise<void> {
  try {
    const [row] = await db
      .select({
        claimantUserId: retrospectiveRoleClaims.claimantUserId,
        role: retrospectiveRoleClaims.role,
        courseTitle: courses.title,
        scheduledDate: trainingSchedules.scheduledDate,
      })
      .from(retrospectiveRoleClaims)
      .innerJoin(trainingSchedules, eq(retrospectiveRoleClaims.trainingScheduleId, trainingSchedules.id))
      .innerJoin(courses, eq(trainingSchedules.courseId, courses.id))
      .where(eq(retrospectiveRoleClaims.id, claimId))
      .limit(1);
    if (!row) return;

    const [claimant] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, row.claimantUserId))
      .limit(1);

    const emailTo = claimant?.email?.trim();
    if (!emailTo) {
      console.warn("[cohort-program-notifications] No email for claimant", row.claimantUserId);
      return;
    }

    const roleLabel = (row.role && PHASE2_ROLE_LABELS[row.role]) || row.role || "your claimed role";
    const courseTitle = row.courseTitle || "the session";
    const when = row.scheduledDate
      ? new Date(row.scheduledDate).toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" })
      : "that session";

    await sendEmail(emailTo, "retrospectiveClaimReviewed", {
      claimantName: claimant?.name?.trim() || "there",
      outcomeHeading: approved ? "Claim approved" : "Claim not approved",
      outcomeBody: approved
        ? `Your instructor approved your claim for the ${roleLabel} role in ${courseTitle} on ${when} — it now counts toward your Phase 2 completion.`
        : `Your instructor reviewed your claim for the ${roleLabel} role in ${courseTitle} on ${when} and it wasn't approved this time.`,
      dashboardUrl: `${APP_BASE}/dashboard#my-bookings`,
    });
  } catch (e) {
    console.error("[cohort-program-notifications] retrospective claim review", e);
  }
}
