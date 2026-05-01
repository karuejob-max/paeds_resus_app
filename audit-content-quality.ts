import { getDb } from './server/db';
import { moduleSections, courses, modules, quizzes, quizQuestions } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const db = await getDb();

  // Check for duplicate questions across different quizzes
  const allQuestions = await db.select({
    id: quizQuestions.id,
    quizId: quizQuestions.quizId,
    question: quizQuestions.question,
  }).from(quizQuestions);

  // Group by question text
  const questionMap = new Map<string, Array<{id: number, quizId: number}>>();
  for (const q of allQuestions) {
    const key = (q.question || '').trim().toLowerCase().slice(0, 80);
    const existing = questionMap.get(key) || [];
    existing.push({ id: q.id, quizId: q.quizId });
    questionMap.set(key, existing);
  }

  console.log('\n=== DUPLICATE QUESTIONS ACROSS QUIZZES ===');
  let dupCount = 0;
  for (const [key, entries] of questionMap) {
    if (entries.length > 1) {
      const quizIds = [...new Set(entries.map((e) => e.quizId))];
      if (quizIds.length > 1) {
        dupCount++;
        console.log('DUPLICATE: ' + key.slice(0, 60));
        console.log('  In quizzes: ' + quizIds.join(', ') + ' | Question IDs: ' + entries.map((e) => e.id).join(', '));
      }
    }
  }
  console.log('Total duplicate question groups: ' + dupCount);

  // Check for essay-format sections (no HTML tags, just plain text > 50 words)
  const allSections = await db.select({
    id: moduleSections.id,
    title: moduleSections.title,
    content: moduleSections.content,
    moduleId: moduleSections.moduleId,
  }).from(moduleSections);

  console.log('\n=== ESSAY FORMAT SECTIONS (plain text, no HTML structure) ===');
  let essayCount = 0;
  for (const sec of allSections) {
    const content = sec.content || '';
    const hasHtml = /<[a-z][\s\S]*>/i.test(content);
    const wordCount = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    if (!hasHtml && wordCount > 50) {
      essayCount++;
      console.log('ESSAY: Section ' + sec.id + ' (' + sec.title + ') - ' + wordCount + ' words, no HTML');
    }
  }
  console.log('Total essay-format sections: ' + essayCount);

  // Check for self-praise language
  console.log('\n=== SELF-PRAISE LANGUAGE IN SECTIONS ===');
  const praiseTerms = ['world-class', 'world class', 'best in class', 'state of the art', 'cutting-edge', 'revolutionary', 'unparalleled', 'groundbreaking'];
  let praiseCount = 0;
  for (const sec of allSections) {
    const content = (sec.content || '').toLowerCase();
    const found = praiseTerms.filter((t) => content.includes(t));
    if (found.length > 0) {
      praiseCount++;
      console.log('PRAISE: Section ' + sec.id + ' (' + sec.title + ') - terms: ' + found.join(', '));
    }
  }
  console.log('Total sections with self-praise: ' + praiseCount);

  // Check for wrong-topic content (burns/trauma in non-burns/trauma courses)
  console.log('\n=== WRONG TOPIC CONTENT (burns keywords in non-burns courses) ===');
  const burnTerms = ['tbsa', 'burn classification', 'fluid resuscitation in burns', 'parkland formula', 'inhalation injury in burns', 'burn wound'];
  let wrongTopicCount = 0;
  for (const sec of allSections) {
    const content = (sec.content || '').toLowerCase();
    const found = burnTerms.filter((t) => content.includes(t));
    if (found.length > 0) {
      wrongTopicCount++;
      console.log('WRONG TOPIC: Section ' + sec.id + ' (' + sec.title + ') - terms: ' + found.join(', '));
    }
  }
  console.log('Total wrong-topic sections: ' + wrongTopicCount);

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
