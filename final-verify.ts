/**
 * Final Verification Script
 * Confirms all content gaps are resolved across all fellowship courses.
 */
import { eq, count, sql } from "drizzle-orm";
import { getDb } from "./server/db";
import { moduleSections, quizQuestions, quizzes, modules, courses } from "./drizzle/schema";

async function main() {
  const db = await getDb();
  if (!db) { console.error("No DB"); process.exit(1); }

  const allCourses = await db.select().from(courses);
  
  let totalIssues = 0;
  const report: string[] = [];

  for (const course of allCourses) {
    const mods = await db.select().from(modules).where(eq(modules.courseId, course.id));
    
    for (const mod of mods) {
      const sections = await db.select().from(moduleSections).where(eq(moduleSections.moduleId, mod.id));
      const quizList = await db.select().from(quizzes).where(eq(quizzes.moduleId, mod.id));
      
      // Check for empty modules
      if (sections.length === 0) {
        report.push(`❌ EMPTY MODULE: Course ${course.id} "${course.title}" - Module ${mod.id} "${mod.title}" has 0 sections`);
        totalIssues++;
      }
      
      // Check for short sections
      for (const sec of sections) {
        if ((sec.content || '').length < 100) {
          report.push(`⚠️  SHORT SECTION: Course ${course.id} - Module ${mod.id} - Section ${sec.id} "${sec.title}" (${(sec.content||'').length} chars)`);
          totalIssues++;
        }
      }
      
      // Check for empty quizzes
      for (const quiz of quizList) {
        const questions = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quiz.id));
        if (questions.length === 0) {
          report.push(`❌ EMPTY QUIZ: Course ${course.id} - Module ${mod.id} - Quiz ${quiz.id} "${quiz.title}" has 0 questions`);
          totalIssues++;
        }
      }
    }
  }

  if (totalIssues === 0) {
    console.log(`\n✅ ALL CLEAR — No content gaps found across ${allCourses.length} fellowship courses.\n`);
  } else {
    console.log(`\n⚠️  Found ${totalIssues} remaining issues:\n`);
    report.forEach(r => console.log(r));
  }
  
  // Summary stats
  const totalMods = await db.select({ count: count() }).from(modules);
  const totalSections = await db.select({ count: count() }).from(moduleSections);
  const totalQuizzes = await db.select({ count: count() }).from(quizzes);
  const totalQuestions = await db.select({ count: count() }).from(quizQuestions);
  
  console.log(`\n=== DATABASE SUMMARY ===`);
  console.log(`Courses: ${allCourses.length}`);
  console.log(`Modules: ${totalMods[0].count}`);
  console.log(`Sections: ${totalSections[0].count}`);
  console.log(`Quizzes: ${totalQuizzes[0].count}`);
  console.log(`Quiz Questions: ${totalQuestions[0].count}`);
  
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
