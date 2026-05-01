import { getDb } from "../server/db";
import { 
  courses, 
  modules, 
  moduleSections, 
  quizzes, 
  quizQuestions 
} from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

async function verify() {
  const db = await getDb();
  console.log("Verifying interactive content...");

  const [courseCount] = await (db as any).select({ count: sql`count(*)` }).from(courses);
  const [moduleCount] = await (db as any).select({ count: sql`count(*)` }).from(modules);
  const [sectionCount] = await (db as any).select({ count: sql`count(*)` }).from(moduleSections);
  const [quizCount] = await (db as any).select({ count: sql`count(*)` }).from(quizzes);
  const [questionCount] = await (db as any).select({ count: sql`count(*)` }).from(quizQuestions);

  console.log(`Total Courses: ${courseCount.count}`);
  console.log(`Total Modules: ${moduleCount.count}`);
  console.log(`Total Sections: ${sectionCount.count}`);
  console.log(`Total Quizzes: ${quizCount.count}`);
  console.log(`Total Questions: ${questionCount.count}`);

  process.exit(0);
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
