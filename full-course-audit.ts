import { eq, and, isNull, or } from "drizzle-orm";
import { getDb } from "./server/db";
import {
  microCourses,
  courseModules,
  moduleSections,
  quizzes,
  quizQuestions,
} from "./drizzle/schema";

async function runAudit() {
  const db = await getDb();
  if (!db) { console.error("No DB"); process.exit(1); }

  // 1. Get all courses
  const courses = await db.select().from(microCourses).orderBy(microCourses.id);
  console.log(`\n=== FULL COURSE AUDIT: ${courses.length} courses ===\n`);

  const issues: Array<{
    courseId: number;
    courseTitle: string;
    type: string;
    detail: string;
  }> = [];

  for (const course of courses) {
    // Get modules
    const modules = await db.select().from(courseModules)
      .where(eq(courseModules.microCourseId, course.id))
      .orderBy(courseModules.orderIndex);

    if (modules.length === 0) {
      issues.push({ courseId: course.id, courseTitle: course.title, type: "NO_MODULES", detail: "Course has 0 modules" });
      continue;
    }

    for (const mod of modules) {
      // Check sections
      const sections = await db.select().from(moduleSections)
        .where(eq(moduleSections.moduleId, mod.id))
        .orderBy(moduleSections.orderIndex);

      if (sections.length === 0) {
        issues.push({
          courseId: course.id,
          courseTitle: course.title,
          type: "NO_SECTIONS",
          detail: `Module ${mod.orderIndex + 1}: "${mod.title}" has 0 sections`,
        });
      } else {
        // Check for blank/short section content
        for (const sec of sections) {
          const contentLen = (sec.content ?? "").trim().length;
          if (contentLen === 0) {
            issues.push({
              courseId: course.id,
              courseTitle: course.title,
              type: "BLANK_SECTION",
              detail: `Module ${mod.orderIndex + 1} > Section "${sec.title}" has empty content`,
            });
          } else if (contentLen < 100) {
            issues.push({
              courseId: course.id,
              courseTitle: course.title,
              type: "SHORT_SECTION",
              detail: `Module ${mod.orderIndex + 1} > Section "${sec.title}" has only ${contentLen} chars`,
            });
          }
        }

        // Check for formative quiz after this module
        const formativeQuiz = await db.select().from(quizzes)
          .where(and(
            eq(quizzes.moduleId, mod.id),
            eq(quizzes.quizType, "formative")
          ));

        if (formativeQuiz.length === 0) {
          issues.push({
            courseId: course.id,
            courseTitle: course.title,
            type: "NO_FORMATIVE_QUIZ",
            detail: `Module ${mod.orderIndex + 1}: "${mod.title}" has no formative quiz`,
          });
        } else {
          // Check quiz has questions
          const questions = await db.select().from(quizQuestions)
            .where(eq(quizQuestions.quizId, formativeQuiz[0].id));

          if (questions.length === 0) {
            issues.push({
              courseId: course.id,
              courseTitle: course.title,
              type: "EMPTY_FORMATIVE_QUIZ",
              detail: `Module ${mod.orderIndex + 1}: "${mod.title}" formative quiz has 0 questions`,
            });
          } else {
            // Check for questions with blank text
            for (const q of questions) {
              if (!q.questionText || q.questionText.trim().length < 10) {
                issues.push({
                  courseId: course.id,
                  courseTitle: course.title,
                  type: "BLANK_QUESTION",
                  detail: `Module ${mod.orderIndex + 1} formative quiz Q${q.id}: blank/short question text`,
                });
              }
              // Check options
              let opts: string[] = [];
              try { opts = JSON.parse(q.options as string ?? "[]"); } catch {}
              if (opts.length < 2) {
                issues.push({
                  courseId: course.id,
                  courseTitle: course.title,
                  type: "MISSING_OPTIONS",
                  detail: `Module ${mod.orderIndex + 1} formative quiz Q${q.id}: only ${opts.length} options`,
                });
              }
              // Check correct answer
              if (!q.correctAnswer || q.correctAnswer.trim().length === 0) {
                issues.push({
                  courseId: course.id,
                  courseTitle: course.title,
                  type: "MISSING_CORRECT_ANSWER",
                  detail: `Module ${mod.orderIndex + 1} formative quiz Q${q.id}: no correct answer set`,
                });
              }
            }
          }
        }
      }
    }

    // Check summative quiz
    const summativeQuiz = await db.select().from(quizzes)
      .where(and(
        eq(quizzes.microCourseId, course.id),
        eq(quizzes.quizType, "summative")
      ));

    if (summativeQuiz.length === 0) {
      issues.push({
        courseId: course.id,
        courseTitle: course.title,
        type: "NO_SUMMATIVE_QUIZ",
        detail: "Course has no summative (knowledge check) quiz",
      });
    } else {
      const sumQuestions = await db.select().from(quizQuestions)
        .where(eq(quizQuestions.quizId, summativeQuiz[0].id));

      if (sumQuestions.length === 0) {
        issues.push({
          courseId: course.id,
          courseTitle: course.title,
          type: "EMPTY_SUMMATIVE_QUIZ",
          detail: "Summative quiz has 0 questions",
        });
      } else if (sumQuestions.length < 5) {
        issues.push({
          courseId: course.id,
          courseTitle: course.title,
          type: "FEW_SUMMATIVE_QUESTIONS",
          detail: `Summative quiz has only ${sumQuestions.length} questions (expected ≥5)`,
        });
      } else {
        // Check for vague/missing clinical specificity in summative questions
        for (const q of sumQuestions) {
          let opts: string[] = [];
          try { opts = JSON.parse(q.options as string ?? "[]"); } catch {}
          if (!q.correctAnswer || q.correctAnswer.trim().length === 0) {
            issues.push({
              courseId: course.id,
              courseTitle: course.title,
              type: "SUMMATIVE_MISSING_ANSWER",
              detail: `Summative Q${q.id}: "${(q.questionText ?? "").substring(0, 60)}..." has no correct answer`,
            });
          }
          if (opts.length < 3) {
            issues.push({
              courseId: course.id,
              courseTitle: course.title,
              type: "SUMMATIVE_FEW_OPTIONS",
              detail: `Summative Q${q.id}: only ${opts.length} options`,
            });
          }
        }
      }
    }
  }

  // Print summary
  if (issues.length === 0) {
    console.log("✅ ALL CLEAR — No issues found across all 27 courses.\n");
  } else {
    console.log(`⚠️  FOUND ${issues.length} ISSUES:\n`);

    // Group by course
    const byCourse: Record<string, typeof issues> = {};
    for (const issue of issues) {
      const key = `[${issue.courseId}] ${issue.courseTitle}`;
      if (!byCourse[key]) byCourse[key] = [];
      byCourse[key].push(issue);
    }

    for (const [courseKey, courseIssues] of Object.entries(byCourse)) {
      console.log(`\n📚 ${courseKey}`);
      for (const issue of courseIssues) {
        const icon = issue.type.includes("BLANK") || issue.type.includes("EMPTY") || issue.type.includes("NO_") ? "❌" : "⚠️";
        console.log(`  ${icon} [${issue.type}] ${issue.detail}`);
      }
    }

    // Summary by type
    console.log("\n\n=== ISSUE TYPE SUMMARY ===");
    const byType: Record<string, number> = {};
    for (const issue of issues) {
      byType[issue.type] = (byType[issue.type] ?? 0) + 1;
    }
    for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${type}: ${count}`);
    }
  }

  process.exit(0);
}

runAudit().catch((e) => { console.error(e); process.exit(1); });
