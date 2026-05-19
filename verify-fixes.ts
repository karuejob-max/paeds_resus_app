import { getDb } from './server/db';
import { moduleSections, quizQuestions } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function verify() {
  const db = await getDb();
  const secs = await db.select().from(moduleSections).where(eq(moduleSections.moduleId, 6));
  console.log('Asthma I Module 1 sections:', secs.length);
  const qs = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, 104));
  console.log('Cardiogenic Shock I Module 1 quiz questions:', qs.length);
  const q460 = await db.select().from(quizQuestions).where(eq(quizQuestions.id, 460));
  console.log('Q460 correct answer:', q460[0]?.correctAnswer);
  process.exit(0);
}
verify().catch(e => { console.error(e); process.exit(1); });
