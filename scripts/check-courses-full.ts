/**
 * Full diagnostic: check microCourses table, published status, and enrollment linkage
 */
import { getDb } from '../server/db';
import { microCourses, microCourseEnrollments } from '../drizzle/schema';
import { asc } from 'drizzle-orm';

async function checkDetails() {
  const db = await getDb();
  if (!db) { console.log('No DB'); process.exit(1); }

  const rows = await db.select().from(microCourses).orderBy(asc(microCourses.order));
  console.log('=== microCourses table ===');
  console.log('Total courses:', rows.length);
  console.log('');

  const published = rows.filter(r => r.isPublished);
  const unpublished = rows.filter(r => !r.isPublished);

  console.log('Published (' + published.length + '):');
  published.forEach(r => console.log('  [PUBLISHED] order=' + r.order + ' id=' + r.id + ' ' + r.courseId + ' - ' + r.title));
  console.log('');
  console.log('Unpublished (' + unpublished.length + '):');
  unpublished.forEach(r => console.log('  [DRAFT]     order=' + r.order + ' id=' + r.id + ' ' + r.courseId + ' - ' + r.title));

  const enrollments = await db.select().from(microCourseEnrollments);
  console.log('');
  console.log('=== microCourseEnrollments table ===');
  console.log('Total enrollments:', enrollments.length);
  if (enrollments.length > 0) {
    const statusCounts: Record<string, number> = {};
    enrollments.forEach(e => {
      statusCounts[e.enrollmentStatus ?? 'null'] = (statusCounts[e.enrollmentStatus ?? 'null'] || 0) + 1;
    });
    console.log('By status:', statusCounts);
  }

  process.exit(0);
}
checkDetails();
