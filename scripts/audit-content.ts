import { getDb } from '../server/db';
import { microCourses, modules, quizzes } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

async function audit() {
  const db = await getDb();
  if (!db) { console.error('No DB connection'); process.exit(1); }

  const courses = await db.select().from(microCourses);
  console.log(`Found ${courses.length} micro-courses.`);

  const moduleCounts = await db.select({ 
    courseId: modules.courseId, 
    count: sql<number>`count(*)` 
  }).from(modules).groupBy(modules.courseId);

  const quizCounts = await db.select({ 
    moduleId: quizzes.moduleId, 
    count: sql<number>`count(*)` 
  }).from(quizzes).groupBy(quizzes.moduleId);

  console.log('\n=== Content Audit ===');
  for (const course of courses) {
    const mCount = moduleCounts.find(m => m.courseId === course.id)?.count || 0;
    console.log(`Course: ${course.courseId} (ID: ${course.id}) - Modules: ${mCount}`);
  }

  const totalModules = moduleCounts.reduce((acc, curr) => acc + curr.count, 0);
  const totalQuizzes = quizCounts.reduce((acc, curr) => acc + curr.count, 0);

  console.log(`\nTotal Modules in DB: ${totalModules}`);
  console.log(`Total Quizzes in DB: ${totalQuizzes}`);

  process.exit(0);
}

audit();
