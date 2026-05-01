import { getDb } from "../server/db";
import { 
  courses, 
  modules, 
  moduleSections, 
  quizzes, 
  quizQuestions 
} from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { microCoursesBatch1To5 } from "../server/data/micro-courses-batch-1-5";
import { microCoursesBatch3To5 } from "../server/data/micro-courses-batch-3-5";
import { microCoursesFinalBatch } from "../server/data/micro-courses-final-batch";
import { microCoursesBurns } from "../server/data/micro-courses-burns";
import { MICRO_COURSE_CATALOG } from "../server/lib/micro-course-catalog";

async function seedInteractive() {
  const db = await getDb();
  console.log("Starting interactive content seeding...");

  const allSourceCourses = [
    ...microCoursesBatch1To5,
    ...microCoursesBatch3To5,
    ...microCoursesFinalBatch,
    ...microCoursesBurns
  ];

  const idToTitleMap: Record<string, string> = {};
  for (const row of MICRO_COURSE_CATALOG) {
    idToTitleMap[row.courseId] = row.title;
  }

  // Final Mappings for all batches
  idToTitleMap['asthma-i'] = "Paediatric Asthma I: Recognition and Initial Management";
  idToTitleMap['asthma-ii'] = "Paediatric Asthma II: Severe Exacerbation and Status Asthmaticus";
  idToTitleMap['pneumonia-i'] = "Paediatric Pneumonia I: Recognition and Initial Antibiotics";
  idToTitleMap['pneumonia-ii'] = "Paediatric Pneumonia II: Severe Pneumonia and Sepsis";
  idToTitleMap['severe-pneumonia-ards-i'] = "Paediatric Pneumonia I: Recognition and Initial Antibiotics";
  idToTitleMap['severe-pneumonia-ards-ii'] = "Paediatric Pneumonia II: Severe Pneumonia and Sepsis";
  idToTitleMap['anaphylaxis-i'] = "Paediatric Anaphylaxis I: Recognition and Epinephrine";
  idToTitleMap['anaphylaxis-ii'] = "Paediatric Anaphylaxis II: Refractory Anaphylaxis and ICU Management";
  idToTitleMap['dka-i'] = "Paediatric DKA I: Recognition and Initial Fluid Resuscitation";
  idToTitleMap['dka-ii'] = "Paediatric DKA II: Insulin Therapy and Complications";
  idToTitleMap['hypovolemic-shock-i'] = "Paediatric Hypovolemic Shock I: Hemorrhage and Dehydration";
  idToTitleMap['hypovolemic-shock-ii'] = "Paediatric Hypovolemic Shock II: Massive Transfusion and Damage Control";
  idToTitleMap['cardiogenic-shock-i'] = "Paediatric Cardiogenic Shock I: Heart Failure Recognition";
  idToTitleMap['cardiogenic-shock-ii'] = "Paediatric Cardiogenic Shock II: Inotropes and Mechanical Support";
  idToTitleMap['malaria-i'] = "Paediatric Severe Malaria I: Recognition and Artemisinin Therapy";
  idToTitleMap['severe-malaria-i'] = "Paediatric Severe Malaria I: Recognition and Artemisinin Therapy";
  idToTitleMap['malaria-ii'] = "Paediatric Severe Malaria II: Complications and Multi-Organ Failure";
  idToTitleMap['severe-malaria-ii'] = "Paediatric Severe Malaria II: Complications and Multi-Organ Failure";
  idToTitleMap['aki-i'] = "Paediatric Acute Kidney Injury: Recognition and Management";
  idToTitleMap['acute-kidney-injury-i'] = "Paediatric Acute Kidney Injury: Recognition and Management";
  idToTitleMap['anaemia-i'] = "Paediatric Severe Anaemia: Transfusion and Complications";
  idToTitleMap['severe-anaemia-i'] = "Paediatric Severe Anaemia: Transfusion and Complications";
  idToTitleMap['burns-i'] = "Paediatric Burns I: Assessment and Fluid Resuscitation";
  idToTitleMap['burns-ii'] = "Paediatric Burns II: Wound Management and Infection Prevention";
  idToTitleMap['trauma-i'] = "Paediatric Trauma I: Primary Survey and Resuscitation";
  idToTitleMap['trauma-ii'] = "Paediatric Trauma II: Hemorrhage Control and Damage Control Surgery";
  idToTitleMap['meningitis-i'] = "Paediatric Meningitis I: Recognition and Empiric Antibiotics";
  idToTitleMap['meningitis-ii'] = "Paediatric Meningitis II: Complications and ICU Management";

  for (const sourceCourse of allSourceCourses) {
    const targetTitle = idToTitleMap[sourceCourse.id] || sourceCourse.title;
    
    const [courseRow] = await (db as any)
      .select()
      .from(courses)
      .where(eq(courses.title, targetTitle))
      .limit(1);

    if (!courseRow) {
      console.log(`Course not found: ${targetTitle} (Source ID: ${sourceCourse.id})`);
      continue;
    }

    console.log(`Processing Course: ${targetTitle} (ID: ${courseRow.id})`);

    const existingModules = await (db as any)
      .select()
      .from(modules)
      .where(eq(modules.courseId, courseRow.id));

    for (const mod of existingModules) {
      await (db as any).delete(moduleSections).where(eq(moduleSections.moduleId, mod.id));
      await (db as any).delete(quizQuestions).where(eq(quizQuestions.quizId, mod.id));
      await (db as any).delete(quizzes).where(eq(quizzes.moduleId, mod.id));
      await (db as any).delete(modules).where(eq(modules.id, mod.id));
    }

    for (let mIdx = 0; mIdx < sourceCourse.modules.length; mIdx++) {
      const sourceMod = sourceCourse.modules[mIdx];
      
      const [moduleResult] = await (db as any).insert(modules).values({
        courseId: courseRow.id,
        title: sourceMod.title,
        duration: sourceMod.duration || 15,
        order: mIdx + 1,
        content: "" 
      });
      
      const moduleId = moduleResult.insertId;

      const rawContent = sourceMod.content;
      const sectionParts = rawContent.split(/<h3>/).filter(p => p.trim() !== "");
      
      if (sectionParts.length === 0) {
        await (db as any).insert(moduleSections).values({
          moduleId,
          title: "Overview",
          content: rawContent,
          order: 1
        });
      } else {
        for (let sIdx = 0; sIdx < sectionParts.length; sIdx++) {
          let part = sectionParts[sIdx].trim();
          let title = "Overview";
          let content = part;

          if (part.includes("</h3>")) {
            const titleEnd = part.indexOf("</h3>");
            title = part.substring(0, titleEnd).replace(/<[^>]*>/g, "").trim();
            content = part.substring(titleEnd + 5).trim();
          }

          await (db as any).insert(moduleSections).values({
            moduleId,
            title: title || `Section ${sIdx + 1}`,
            content: content,
            order: sIdx + 1
          });
        }
      }

      if (sourceCourse.quiz && sourceCourse.quiz.questions) {
        const [quizResult] = await (db as any).insert(quizzes).values({
          moduleId,
          title: `${sourceMod.title} Knowledge Check`,
          passingScore: 80,
          order: 1
        });
        const quizId = quizResult.insertId;

        const questionsPerModule = Math.max(2, Math.floor(sourceCourse.quiz.questions.length / sourceCourse.modules.length));
        const startQ = mIdx * questionsPerModule;
        const finalQs = (mIdx === sourceCourse.modules.length - 1) 
          ? sourceCourse.quiz.questions.slice(startQ)
          : sourceCourse.quiz.questions.slice(startQ, startQ + questionsPerModule);

        for (let qIdx = 0; qIdx < finalQs.length; qIdx++) {
          const q = finalQs[qIdx];
          await (db as any).insert(quizQuestions).values({
            quizId,
            question: q.question,
            options: JSON.stringify(q.options),
            correctAnswer: JSON.stringify(q.options[q.correct] || q.options[0]),
            explanation: q.explanation || "",
            order: qIdx + 1
          });
        }
      }
    }
  }

  console.log("Interactive seeding complete!");
  process.exit(0);
}

seedInteractive().catch(err => {
  console.error(err);
  process.exit(1);
});
