/**
 * BLS course restructuring (2026-08-10, CEO decision): the live BLS course
 * had 3 First Aid modules (order 5-7: First Aid Foundations, Allergic
 * Reactions & Epi-pen, Bleeding Control & Wounds) that don't belong in AHA's
 * actual BLS Provider curriculum -- that content already has a home in the
 * platform's separate Heartsaver course. server/lib/bls-modules-data.ts has
 * been trimmed to 6 modules (renumbered 1-6) in the same PR as this script.
 *
 * CRITICAL SEQUENCING -- this script MUST run against the OLD, still-9-module
 * BLS course, BEFORE the code change deploys. Once the app runs with the new
 * 6-module BLS_MODULES, ensureBlsCatalog's sync logic reuses/repurposes
 * module row IDs by position (not content identity): the old order-5/6 rows
 * get silently overwritten with new module 5/6 content, and the old order
 * 7/8/9 rows get deleted outright. Any userProgress row still pointing at
 * those modules by the time that sync runs becomes either a false-positive
 * "completed" on content the learner never took, or an orphaned reference to
 * a deleted row. This script finds and resets exactly the affected progress
 * FIRST, while the old module content is still in the database to identify
 * against, and notifies each affected learner.
 *
 * Refuses to run (safe no-op, not a crash) if the BLS course no longer has
 * 7+ modules -- that means the code deploy already happened and this script
 * is being run too late to do anything meaningful; investigate before
 * re-running.
 *
 * Idempotent: a second run after a successful first run finds zero
 * remaining affected progress rows and zero-affected-user output.
 *
 * Run: pnpm run db:apply-XXXX  (tsx, not plain node -- imports server/ TS
 * modules directly for sendEmail, same pattern as verify:raw-narrative-immutable)
 */
import "dotenv/config";
import { getDb } from "../server/db";
import { sendEmail } from "../server/email-service";
import { courses, modules, userProgress, enrollments, users } from "../drizzle/schema";
import { eq, and, gte, inArray } from "drizzle-orm";

const APP_BASE = process.env.APP_BASE_URL?.replace(/\/$/, "") || "https://www.paedsresus.com";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("[BLS reset] Database unavailable.");
    process.exit(1);
  }

  const blsCourses = await db.select({ id: courses.id, title: courses.title }).from(courses).where(eq(courses.programType, "bls"));
  if (blsCourses.length === 0) {
    console.log("[BLS reset] No BLS course found -- nothing to do.");
    return;
  }

  let totalAffectedRows = 0;
  const affectedUsers = new Map();
  const usersWithoutEmail = [];

  for (const course of blsCourses) {
    const courseModules = await db
      .select({ id: modules.id, order: modules.order, title: modules.title })
      .from(modules)
      .where(eq(modules.courseId, course.id));

    if (courseModules.length < 7) {
      console.log(
        `[BLS reset] Course "${course.title}" (id ${course.id}) has only ${courseModules.length} module(s) -- ` +
          "looks like the 6-module structure is already live. Refusing to run against this course to avoid acting on " +
          "already-repurposed content. If this is unexpected, investigate before re-running."
      );
      continue;
    }

    const affectedModuleIds = courseModules.filter((m) => (m.order ?? 0) >= 5).map((m) => m.id);
    if (affectedModuleIds.length === 0) {
      console.log(`[BLS reset] Course "${course.title}" (id ${course.id}): no modules at order >= 5 -- nothing to reset.`);
      continue;
    }
    console.log(
      `[BLS reset] Course "${course.title}" (id ${course.id}): resetting progress on ${affectedModuleIds.length} module(s) -- ` +
        courseModules.filter((m) => affectedModuleIds.includes(m.id)).map((m) => m.title).join("; ")
    );

    const affectedProgress = await db
      .select({ id: userProgress.id, enrollmentId: userProgress.enrollmentId })
      .from(userProgress)
      .where(inArray(userProgress.moduleId, affectedModuleIds));

    if (affectedProgress.length === 0) {
      console.log(`[BLS reset] Course "${course.title}": no learner progress on those modules -- nothing to reset.`);
      continue;
    }

    const enrollmentIds = [...new Set(affectedProgress.map((p) => p.enrollmentId))];
    const affectedEnrollments = await db
      .select({ id: enrollments.id, userId: enrollments.userId })
      .from(enrollments)
      .where(inArray(enrollments.id, enrollmentIds));
    const enrollmentToUser = new Map(affectedEnrollments.map((e) => [e.id, e.userId]));

    const affectedUserIds = [...new Set(affectedEnrollments.map((e) => e.userId))];
    if (affectedUserIds.length > 0) {
      const affectedUserRows = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(inArray(users.id, affectedUserIds));
      for (const u of affectedUserRows) {
        affectedUsers.set(u.id, { name: u.name, email: u.email });
        if (!u.email) usersWithoutEmail.push(u.id);
      }
    }

    // Reset: delete the progress rows outright, matching how a
    // never-started module has no row (confirmed against the learning
    // router before writing this -- absence reads as not_started).
    await db.delete(userProgress).where(inArray(userProgress.id, affectedProgress.map((p) => p.id)));
    totalAffectedRows += affectedProgress.length;
    console.log(`[BLS reset] Course "${course.title}": deleted ${affectedProgress.length} progress row(s) for ${affectedUserIds.length} learner(s).`);
  }

  console.log(`\n[BLS reset] Total progress rows reset: ${totalAffectedRows}. Total distinct learners affected: ${affectedUsers.size}.`);
  if (usersWithoutEmail.length > 0) {
    console.log(`[BLS reset] WARNING: ${usersWithoutEmail.length} affected learner(s) have no email on file, notification skipped for: ${usersWithoutEmail.join(", ")}`);
  }

  if (affectedUsers.size === 0) {
    console.log("[BLS reset] No notifications to send. Done.");
    return;
  }

  console.log(`[BLS reset] Sending notification emails to ${affectedUsers.size} learner(s)...`);
  let sent = 0;
  let failed = 0;
  for (const [userId, u] of affectedUsers) {
    if (!u.email) continue;
    const result = await sendEmail(u.email, "blsCourseContentUpdated", {
      learnerName: u.name?.trim() || "there",
      courseUrl: `${APP_BASE}/course/bls`,
    });
    if (result.success) {
      sent++;
    } else {
      failed++;
      console.error(`[BLS reset] Failed to notify user ${userId} (${u.email}): ${result.error}`);
    }
  }
  console.log(`[BLS reset] Notifications: ${sent} sent, ${failed} failed. Done.`);
}

main().catch((err) => {
  console.error("[BLS reset] Fatal error:", err);
  process.exit(1);
});
