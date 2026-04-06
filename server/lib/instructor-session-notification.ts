import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { sendEmail } from "../email-service";
import { courses, institutionalAccounts, trainingSchedules, users } from "../../drizzle/schema";

const APP_BASE = process.env.APP_BASE_URL?.replace(/\/$/, "") || "https://www.paedsresus.com";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/**
 * Email the assigned instructor when a hospital session lists them on the schedule.
 * Best-effort: logs and returns if no email on file.
 */
export async function notifyInstructorSessionAssigned(db: Db, scheduleId: number): Promise<void> {
  try {
    const rows = await db
      .select({
        instructorId: trainingSchedules.instructorId,
        scheduledDate: trainingSchedules.scheduledDate,
        startTime: trainingSchedules.startTime,
        endTime: trainingSchedules.endTime,
        location: trainingSchedules.location,
        companyName: institutionalAccounts.companyName,
        contactName: institutionalAccounts.contactName,
        contactEmail: institutionalAccounts.contactEmail,
        contactPhone: institutionalAccounts.contactPhone,
        courseTitle: courses.title,
        programType: courses.programType,
      })
      .from(trainingSchedules)
      .innerJoin(
        institutionalAccounts,
        eq(trainingSchedules.institutionalAccountId, institutionalAccounts.id)
      )
      .innerJoin(courses, eq(trainingSchedules.courseId, courses.id))
      .where(eq(trainingSchedules.id, scheduleId))
      .limit(1);

    const row = rows[0];
    if (!row?.instructorId) return;

    const [instructor] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, row.instructorId))
      .limit(1);

    const emailTo = instructor?.email?.trim();
    if (!emailTo) {
      console.warn("[instructor-session-notification] No email for instructor user", row.instructorId);
      return;
    }

    const when = row.scheduledDate
      ? new Date(row.scheduledDate).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })
      : "—";
    const timeBits = [row.startTime, row.endTime].filter(Boolean).join("–");
    const locationLine = row.location?.trim() || "Not specified yet";
    const contactParts = [
      row.contactName ? `Contact: ${row.contactName}` : "",
      row.contactEmail ? `Email: ${row.contactEmail}` : "",
      row.contactPhone ? `Phone: ${row.contactPhone}` : "",
    ].filter(Boolean);
    const contactLine =
      contactParts.length > 0 ? contactParts.join(" · ") : "Ask your hospital administrator for session details.";

    await sendEmail(emailTo, "instructorSessionAssigned", {
      instructorName: instructor.name?.trim() || "there",
      institutionName: row.companyName || "Hospital partner",
      courseTitle: row.courseTitle || String(row.programType).toUpperCase(),
      programType: String(row.programType).toUpperCase(),
      scheduledSummary: `${when}${timeBits ? ` · ${timeBits}` : ""}`,
      locationLine,
      contactLine,
      portalUrl: `${APP_BASE}/instructor-portal`,
    });
  } catch (e) {
    console.error("[instructor-session-notification]", e);
  }
}
