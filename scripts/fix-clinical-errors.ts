import { getDb } from "../server/db";
import { modules, quizQuestions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function fixErrors() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  console.log("Auditing modules for Hydrocortisone dosage errors...");
  const allModules = await db.select().from(modules);
  let moduleFixes = 0;

  for (const mod of allModules) {
    if (mod.content && (mod.content.includes("50 mg/kg") || mod.content.includes("50mg/kg"))) {
      const newContent = mod.content.replace(/50\s?mg\/kg/g, "4-5 mg/kg");
      await db.update(modules)
        .set({ content: newContent })
        .where(eq(modules.id, mod.id));
      moduleFixes++;
    }
  }

  console.log(`Fixed ${moduleFixes} modules.`);

  console.log("Auditing quiz questions for Hydrocortisone dosage errors...");
  const allQuestions = await db.select().from(quizQuestions);
  let questionFixes = 0;

  for (const q of allQuestions) {
    let changed = false;
    let newExplanation = q.explanation;
    let newOptions = q.options;

    if (q.explanation && (q.explanation.includes("50 mg/kg") || q.explanation.includes("50mg/kg"))) {
      newExplanation = q.explanation.replace(/50\s?mg\/kg/g, "4-5 mg/kg");
      changed = true;
    }

    if (q.options && q.options.includes("50 mg/kg")) {
      newOptions = q.options.replace(/50\s?mg\/kg/g, "4-5 mg/kg");
      changed = true;
    }

    if (changed) {
      await db.update(quizQuestions)
        .set({ explanation: newExplanation, options: newOptions })
        .where(eq(quizQuestions.id, q.id));
      questionFixes++;
    }
  }

  console.log(`Fixed ${questionFixes} quiz questions.`);
  console.log("Clinical error cleanup complete!");
  process.exit(0);
}

fixErrors().catch(console.error);
