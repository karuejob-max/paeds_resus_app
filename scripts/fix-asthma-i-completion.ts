
import { getDb } from "../server/db";
import { microCourseEnrollments, microCourses } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("DB not initialized");

  const slug = "asthma-i";
  console.log(`Checking enrollment status for course: ${slug}`);

  const courseRows = await db.select().from(microCourses).where(eq(microCourses.courseId, slug)).limit(1);
  const course = courseRows[0];

  if (!course) {
    console.error("Course not found");
    return;
  }

  const enrollments = await db.select().from(microCourseEnrollments).where(eq(microCourseEnrollments.microCourseId, course.id));

  console.log(`Found ${enrollments.length} enrollments for ${slug}`);

  for (const enrollment of enrollments) {
    if (enrollment.enrollmentStatus === 'completed' && !enrollment.certificateIssuedAt) {
      console.log(`User ${enrollment.userId} has completed Asthma I but no certificate issued. Resetting status to 'active' to allow re-completion and certification.`);
      
      await db.update(microCourseEnrollments)
        .set({ 
          enrollmentStatus: 'active',
          progressPercentage: 0
        })
        .where(eq(microCourseEnrollments.id, enrollment.id));
      
      console.log(`Reset successful for enrollment ID: ${enrollment.id}`);
    }
  }

  console.log("Cleanup complete.");
}

main().catch(console.error);
