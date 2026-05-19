import { eq } from "drizzle-orm";
import { getDb } from "./server/db";
import {
  microCourses,
  modules,
  moduleSections,
  quizzes,
  quizQuestions,
} from "./drizzle/schema";

async function main() {
  const db = await getDb();
  if (!db) { console.error("No DB"); process.exit(1); }

  const courses = await db.select().from(microCourses).orderBy(microCourses.id);
  console.log(`\n=== FULL AUDIT: ${courses.length} COURSES ===\n`);

  let totalIssues = 0;

  for (const course of courses) {
    const courseModules = await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, course.id))
      .orderBy(modules.order);

    const courseIssues: string[] = [];

    if (courseModules.length === 0) {
      courseIssues.push("  ❌ NO MODULES AT ALL");
    } else {
      for (const mod of courseModules) {
        const modLabel = `Module ${mod.order + 1} "${mod.title}"`;

        // Check sections
        const sections = await db
          .select()
          .from(moduleSections)
          .where(eq(moduleSections.moduleId, mod.id));

        if (sections.length === 0) {
          courseIssues.push(`  ❌ ${modLabel}: NO SECTIONS`);
        } else {
          for (const sec of sections) {
            const len = (sec.content ?? "").trim().length;
            if (len === 0) {
              courseIssues.push(`  ❌ ${modLabel} > "${sec.title}": BLANK CONTENT`);
            } else if (len < 150) {
              courseIssues.push(`  ⚠️  ${modLabel} > "${sec.title}": SHORT CONTENT (${len} chars)`);
            }
          }
        }

        // Check formative quiz
        const formQuizzes = await db
          .select()
          .from(quizzes)
          .where(eq(quizzes.moduleId, mod.id));

        if (formQuizzes.length === 0) {
          courseIssues.push(`  ❌ ${modLabel}: NO FORMATIVE QUIZ`);
        } else {
          for (const fq of formQuizzes) {
            const qs = await db
              .select()
              .from(quizQuestions)
              .where(eq(quizQuestions.quizId, fq.id));

            if (qs.length === 0) {
              courseIssues.push(`  ❌ ${modLabel} Quiz "${fq.title}": 0 QUESTIONS`);
            } else if (qs.length < 2) {
              courseIssues.push(`  ⚠️  ${modLabel} Quiz "${fq.title}": ONLY ${qs.length} QUESTION`);
            } else {
              // Check each question for missing correct answer or options
              for (const q of qs) {
                let opts: string[] = [];
                try { opts = JSON.parse(q.options as string ?? "[]"); } catch {}
                const correctAns = (q.correctAnswer ?? "").trim();
                if (correctAns.length === 0) {
                  courseIssues.push(`  ⚠️  ${modLabel} Q${q.id}: NO CORRECT ANSWER SET`);
                }
                if (opts.length < 2) {
                  courseIssues.push(`  ⚠️  ${modLabel} Q${q.id}: ONLY ${opts.length} OPTIONS`);
                }
              }
            }
          }
        }
      }
    }

    totalIssues += courseIssues.length;

    if (courseIssues.length === 0) {
      console.log(`✅ [${course.id}] ${course.title} (${courseModules.length} modules)`);
    } else {
      console.log(`\n⚠️  [${course.id}] ${course.title} (${courseModules.length} modules)`);
      for (const ci of courseIssues) console.log(ci);
    }
  }

  console.log(`\n=== TOTAL ISSUES: ${totalIssues} ===\n`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
