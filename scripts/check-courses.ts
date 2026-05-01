
import { getDb } from '../server/db';
import { microCourses } from '../drizzle/schema';

async function check() {
  try {
    const db = await getDb();
    if (!db) {
      console.log('Database not initialized (DATABASE_URL likely missing)');
      process.exit(1);
    }
    const result = await db.select().from(microCourses);
    console.log('Course count:', result.length);
    if (result.length > 0) {
      console.log('Courses found:', result.map(c => c.courseId).join(', '));
    } else {
      console.log('No courses found in microCourses table.');
    }
    process.exit(0);
  } catch (e) {
    console.error('Error:', e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}
check();
