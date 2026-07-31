import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { sendEmail } from "../email-service";
import { courses, trainingSchedules, users } from "../../drizzle/schema";

const APP_BASE = process.env.APP_BASE_URL?.replace(/\/$/, "") || "https://www.paedsresus.com";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

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
