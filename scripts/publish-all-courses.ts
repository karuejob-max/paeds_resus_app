/**
 * Publish all micro-courses that are currently unpublished (isPublished = false).
 * Run: DATABASE_URL=... npx tsx scripts/publish-all-courses.ts
 */
import { getDb } from '../server/db';
import { microCourses } from '../drizzle/schema';
import { eq, asc } from 'drizzle-orm';

async function publishAll() {
  const db = await getDb();
  if (!db) { console.error('No DB connection'); process.exit(1); }

  const rows = await db.select().from(microCourses).orderBy(asc(microCourses.order));
  const unpublished = rows.filter(r => !r.isPublished);

  console.log('Total courses in DB:', rows.length);
  console.log('Currently unpublished:', unpublished.length);

  if (unpublished.length === 0) {
    console.log('All courses already published. Nothing to do.');
    process.exit(0);
  }

  for (const course of unpublished) {
    await db.update(microCourses)
      .set({ isPublished: true, updatedAt: new Date() })
      .where(eq(microCourses.id, course.id));
    console.log('  Published:', course.courseId, '-', course.title);
  }

  console.log('\nDone. All', rows.length, 'courses are now published.');
  process.exit(0);
}

publishAll();
