/**
 * Seed BLS Course Content
 * Creates minimal BLS course with 5 modules and quizzes for MVP
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const poolConnection = await mysql.createPool({
  uri: DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

const db = drizzle(poolConnection, { schema });

const blsCourse = {
  title: "BLS Certification",
  description: "Basic Life Support training and certification",
  programType: "bls",
  duration: 120, // 2 hours
  level: "beginner",
  order: 1,
};

const blsModules = [
  {
    title: "Module 1: Recognition and Response",
    description: "Learn to recognize cardiac arrest and activate emergency services",
    content: `
      <h2>Recognition and Response</h2>
      <p>The first step in the Chain of Survival is recognizing when someone needs help.</p>
      <h3>Key Points:</h3>
      <ul>
        <li>Check for responsiveness</li>
        <li>Check for normal breathing</li>
        <li>Call emergency services (911 or local equivalent)</li>
        <li>Get an AED if available</li>
      </ul>
      <p><strong>Remember:</strong> When in doubt, call emergency services immediately.</p>
    `,
    duration: 15,
    order: 1,
  },
  {
    title: "Module 2: High-Quality CPR",
    description: "Master the technique of effective chest compressions and rescue breaths",
    content: `
      <h2>High-Quality CPR</h2>
      <p>CPR is the most critical intervention in cardiac arrest.</p>
      <h3>Chest Compression Technique:</h3>
      <ul>
        <li>Place heel of hand on center of chest</li>
        <li>Place other hand on top</li>
        <li>Push hard and fast at least 2 inches deep</li>
        <li>Compress at rate of 100-120 compressions per minute</li>
        <li>Allow full recoil between compressions</li>
      </ul>
      <h3>Rescue Breaths:</h3>
      <ul>
        <li>Give 2 rescue breaths after every 30 compressions (for adults)</li>
        <li>Ensure airway is open</li>
        <li>Deliver breath over 1 second</li>
      </ul>
    `,
    duration: 20,
    order: 2,
  },
  {
    title: "Module 3: Defibrillation",
    description: "Learn when and how to use an Automated External Defibrillator",
    content: `
      <h2>Using an AED</h2>
      <p>An AED can restore a normal heart rhythm in ventricular fibrillation.</p>
      <h3>AED Steps:</h3>
      <ol>
        <li>Turn on the AED</li>
        <li>Attach pads to bare chest</li>
        <li>Let AED analyze rhythm</li>
        <li>If shock advised, ensure no one is touching patient</li>
        <li>Press shock button</li>
        <li>Resume CPR immediately</li>
      </ol>
      <p><strong>Important:</strong> Never delay CPR to use an AED.</p>
    `,
    duration: 15,
    order: 3,
  },
  {
    title: "Module 4: Special Situations",
    description: "Handle cardiac arrest in special populations and scenarios",
    content: `
      <h2>Special Situations in BLS</h2>
      <h3>Pediatric Cardiac Arrest:</h3>
      <ul>
        <li>Use gentler compressions for children</li>
        <li>Compression depth: 2 inches or 1/3 chest depth</li>
        <li>Rate: 100-120 compressions per minute</li>
      </ul>
      <h3>Choking:</h3>
      <ul>
        <li>Perform abdominal thrusts (Heimlich maneuver)</li>
        <li>Repeat until object is dislodged or patient becomes unresponsive</li>
      </ul>
      <h3>Drowning:</h3>
      <ul>
        <li>Remove from water safely</li>
        <li>Begin CPR immediately</li>
        <li>Don't delay for water removal</li>
      </ul>
    `,
    duration: 15,
    order: 4,
  },
  {
    title: "Module 5: Recovery and Aftercare",
    description: "Manage the post-resuscitation period",
    content: `
      <h2>Post-Resuscitation Care</h2>
      <p>After successful resuscitation, proper aftercare is critical.</p>
      <h3>Immediate Actions:</h3>
      <ul>
        <li>Continue monitoring vital signs</li>
        <li>Place in recovery position if breathing normally</li>
        <li>Keep warm</li>
        <li>Provide oxygen if available</li>
        <li>Transport to hospital</li>
      </ul>
      <h3>Documentation:</h3>
      <ul>
        <li>Record time of collapse</li>
        <li>Record time CPR started</li>
        <li>Record initial rhythm</li>
        <li>Record medications given</li>
      </ul>
    `,
    duration: 15,
    order: 5,
  },
];

const quizzes = [
  {
    moduleOrder: 1,
    title: "Module 1 Quiz",
    passingScore: 70,
    questions: [
      {
        question: "What is the first step when you find an unresponsive person?",
        type: "multiple_choice",
        options: JSON.stringify([
          "Check for responsiveness and breathing",
          "Start CPR immediately",
          "Look for an AED",
          "Call their name loudly",
        ]),
        correctAnswer: JSON.stringify(0),
        explanation: "Always check for responsiveness and normal breathing first.",
      },
      {
        question: "True or False: You should always wait for emergency services before starting CPR.",
        type: "true_false",
        options: JSON.stringify(["True", "False"]),
        correctAnswer: JSON.stringify(1),
        explanation: "False. Start CPR immediately while waiting for emergency services.",
      },
    ],
  },
  {
    moduleOrder: 2,
    title: "Module 2 Quiz",
    passingScore: 70,
    questions: [
      {
        question: "What is the recommended chest compression depth for adults?",
        type: "multiple_choice",
        options: JSON.stringify([
          "1 inch",
          "At least 2 inches",
          "3 inches",
          "1/2 inch",
        ]),
        correctAnswer: JSON.stringify(1),
        explanation: "Adult chest compressions should be at least 2 inches deep.",
      },
      {
        question: "What is the recommended compression rate for CPR?",
        type: "multiple_choice",
        options: JSON.stringify([
          "60-80 compressions per minute",
          "100-120 compressions per minute",
          "140-160 compressions per minute",
          "80-100 compressions per minute",
        ]),
        correctAnswer: JSON.stringify(1),
        explanation: "The recommended rate is 100-120 compressions per minute.",
      },
    ],
  },
  {
    moduleOrder: 3,
    title: "Module 3 Quiz",
    passingScore: 70,
    questions: [
      {
        question: "When should you use an AED?",
        type: "multiple_choice",
        options: JSON.stringify([
          "Only after 5 minutes of CPR",
          "As soon as it's available",
          "Never, it's too dangerous",
          "Only if trained",
        ]),
        correctAnswer: JSON.stringify(1),
        explanation: "Use an AED as soon as it's available. It can save lives.",
      },
      {
        question: "True or False: You should delay CPR to attach AED pads.",
        type: "true_false",
        options: JSON.stringify(["True", "False"]),
        correctAnswer: JSON.stringify(1),
        explanation: "False. Continue CPR while preparing the AED.",
      },
    ],
  },
];

async function seedCourses() {
  try {
    console.log("🌱 Seeding BLS course content...");

    // Insert course
    const courseResult = await db.insert(schema.courses).values(blsCourse);
    const courseId = courseResult[0]?.insertId || 1;
    console.log(`✅ Created course: ${blsCourse.title} (ID: ${courseId})`);

    // Insert modules
    for (const module of blsModules) {
      const moduleResult = await db.insert(schema.modules).values({
        ...module,
        courseId,
      });
      const moduleId = moduleResult[0]?.insertId;
      console.log(`✅ Created module: ${module.title} (ID: ${moduleId})`);

      // Insert quiz for this module
      const quizData = quizzes.find((q) => q.moduleOrder === module.order);
      if (quizData && moduleId) {
        const quizResult = await db.insert(schema.quizzes).values({
          moduleId,
          title: quizData.title,
          passingScore: quizData.passingScore,
          order: 1,
        });
        const quizId = quizResult[0]?.insertId;
        console.log(`✅ Created quiz: ${quizData.title} (ID: ${quizId})`);

        // Insert quiz questions
        for (const question of quizData.questions) {
          await db.insert(schema.quizQuestions).values({
            quizId,
            question: question.question,
            questionType: question.type,
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            order: quizData.questions.indexOf(question) + 1,
          });
        }
        console.log(`✅ Added ${quizData.questions.length} questions to quiz`);
      }
    }

    console.log("\n✨ BLS course seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding courses:", error);
    process.exit(1);
  }
}

seedCourses();
