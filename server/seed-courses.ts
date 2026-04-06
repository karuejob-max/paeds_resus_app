/**
 * Seed BLS Course Content
 * Creates minimal BLS course with 5 modules and quizzes for MVP
 */

import { getDb } from "./db";
import { courses, modules, quizzes, quizQuestions } from "../drizzle/schema";

const blsCourse = {
  title: "BLS Certification",
  description: "Basic Life Support training and certification",
  programType: "bls" as const,
  duration: 120, // 2 hours
  level: "beginner" as const,
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

async function seedCourses() {
  try {
    console.log("🌱 Seeding BLS course content...");
    
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Insert course
    const courseResult = await db.insert(courses).values(blsCourse as any);
    console.log(`✅ Created course: ${blsCourse.title}`);

    // Insert modules with quizzes
    for (const module of blsModules) {
      const moduleResult = await db.insert(modules).values({
        ...module,
        courseId: 1,
      } as any);
      console.log(`✅ Created module: ${module.title}`);
    }

    console.log("\n✨ BLS course seeding complete!");
  } catch (error) {
    console.error("❌ Error seeding courses:", error);
  }
}

seedCourses();
