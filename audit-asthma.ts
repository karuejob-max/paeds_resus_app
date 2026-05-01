import { getDb } from './server/db';
import { courses, modules, moduleSections, quizzes, quizQuestions } from './drizzle/schema';
import { eq, like } from 'drizzle-orm';

async function auditCourse(titlePattern: string) {
  const db = await getDb();
  
  const [course] = await db.select().from(courses).where(like(courses.title, `%${titlePattern}%`));
  if (!course) { console.log('COURSE NOT FOUND:', titlePattern); return; }
  console.log('\n=== COURSE:', course.id, course.title, '===');
  
  const mods = await db.select().from(modules).where(eq(modules.courseId, course.id));
  
  for (const mod of mods) {
    const secs = await db.select().from(moduleSections).where(eq(moduleSections.moduleId, mod.id));
    const qzs = await db.select().from(quizzes).where(eq(quizzes.moduleId, mod.id));
    
    console.log(`\n  MODULE ${mod.id}: "${mod.title}"`);
    console.log(`    Sections: ${secs.length}`);
    secs.forEach(s => console.log(`      [${s.id}] "${s.title}" - content: ${s.content?.length || 0} chars`));
    console.log(`    Quizzes: ${qzs.length}`);
    
    for (const qz of qzs) {
      const qs = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, qz.id));
      console.log(`      Quiz ${qz.id} - ${qs.length} questions, passingScore: ${qz.passingScore}`);
      qs.forEach(q => {
        const opts = q.options ? JSON.parse(q.options) : [];
        const correct = q.correctAnswer ? JSON.parse(q.correctAnswer) : null;
        console.log(`        Q${q.id}: "${q.question?.substring(0, 80)}"`);
        console.log(`          Options: ${opts.join(' | ')}`);
        console.log(`          Correct: ${correct}`);
      });
    }
  }
}

async function main() {
  await auditCourse('Asthma I');
  await auditCourse('Asthma II');
  await auditCourse('Cardiogenic Shock');
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
