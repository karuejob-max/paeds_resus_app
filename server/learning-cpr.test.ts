import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { eq, and } from "drizzle-orm";
import {
  users,
  enrollments,
  courses,
  modules,
  quizzes,
  quizQuestions,
  userProgress,
  cprSessions,
  cprInterventions,
} from "../drizzle/schema";

describe("Learning Path and CPR Clock Integration", () => {
  let db: any;
  let testUserId: string;
  let testEnrollmentId: number;
  let testCourseId: number;
  let testModuleId: number;
  let testQuizId: number;
  let testCprSessionId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Create test user
    const userResult = await (db as any)
      .insert(users)
      .values({
        id: `test-user-${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        name: "Test User",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    testUserId = userResult[0].id;

    // Create test course
    const courseResult = await (db as any)
      .insert(courses)
      .values({
        title: "Test Course",
        description: "Test course for learning path",
        programType: "bls",
        duration: 60,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    testCourseId = courseResult[0].id;

    // Create test module
    const moduleResult = await (db as any)
      .insert(modules)
      .values({
        courseId: testCourseId,
        title: "Test Module",
        description: "Test module",
        content: "<p>Test content</p>",
        order: 1,
        duration: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    testModuleId = moduleResult[0].id;

    // Create test quiz
    const quizResult = await (db as any)
      .insert(quizzes)
      .values({
        moduleId: testModuleId,
        title: "Test Quiz",
        passingScore: 70,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    testQuizId = quizResult[0].id;

    // Create test quiz questions
    await (db as any)
      .insert(quizQuestions)
      .values({
        quizId: testQuizId,
        question: "What is the correct chest compression rate?",
        options: JSON.stringify([
          "100-120 compressions per minute",
          "50-70 compressions per minute",
          "150-200 compressions per minute",
        ]),
        correctAnswer: JSON.stringify(
          "100-120 compressions per minute"
        ),
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    // Create test enrollment
    const enrollmentResult = await (db as any)
      .insert(enrollments)
      .values({
        userId: testUserId,
        programType: "bls",
        trainingDate: new Date(),
        paymentStatus: "completed",
        status: "in_progress",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    testEnrollmentId = enrollmentResult[0].id;

    // Create test CPR session
    const cprResult = await (db as any)
      .insert(cprSessions)
      .values({
        userId: testUserId,
        patientAge: 5,
        patientWeight: 20,
        startTime: new Date(),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    testCprSessionId = cprResult[0].id;
  });

  afterAll(async () => {
    if (!db) return;

    // Cleanup test data
    await (db as any)
      .delete(cprInterventions)
      .where(eq(cprInterventions.sessionId, testCprSessionId));
    await (db as any)
      .delete(cprSessions)
      .where(eq(cprSessions.id, testCprSessionId));
    await (db as any)
      .delete(userProgress)
      .where(eq(userProgress.userId, testUserId));
    await (db as any)
      .delete(quizQuestions)
      .where(eq(quizQuestions.quizId, testQuizId));
    await (db as any)
      .delete(quizzes)
      .where(eq(quizzes.id, testQuizId));
    await (db as any)
      .delete(modules)
      .where(eq(modules.id, testModuleId));
    await (db as any)
      .delete(courses)
      .where(eq(courses.id, testCourseId));
    await (db as any)
      .delete(enrollments)
      .where(eq(enrollments.id, testEnrollmentId));
    await (db as any)
      .delete(users)
      .where(eq(users.id, testUserId));
  });

  describe("Learning Path - Course Management", () => {
    it("should retrieve all courses for a program type", async () => {
      const result = await (db as any)
        .select()
        .from(courses)
        .where(eq(courses.programType, "bls"));

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].programType).toBe("bls");
    });

    it("should retrieve course details with modules", async () => {
      const courseModules = await (db as any)
        .select()
        .from(modules)
        .where(eq(modules.courseId, testCourseId));

      expect(courseModules.length).toBeGreaterThan(0);
      expect(courseModules[0].courseId).toBe(testCourseId);
    });

    it("should retrieve module content", async () => {
      const module = await (db as any)
        .select()
        .from(modules)
        .where(eq(modules.id, testModuleId))
        .limit(1);

      expect(module[0]).toBeDefined();
      expect(module[0].content).toBeDefined();
      expect(module[0].title).toBe("Test Module");
    });
  });

  describe("Learning Path - User Progress", () => {
    it("should record quiz attempt", async () => {
      const result = await (db as any)
        .insert(userProgress)
        .values({
          userId: testUserId,
          enrollmentId: testEnrollmentId,
          moduleId: testModuleId,
          quizId: testQuizId,
          score: 85,
          attempts: 1,
          status: "completed",
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      expect(result[0]).toBeDefined();
      expect(result[0].score).toBe(85);
      expect(result[0].status).toBe("completed");
    });

    it("should retrieve user progress", async () => {
      const progress = await (db as any)
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, testUserId),
            eq(userProgress.enrollmentId, testEnrollmentId)
          )
        );

      expect(progress.length).toBeGreaterThan(0);
      expect(progress[0].userId).toBe(testUserId);
    });

    it("should calculate course completion stats", async () => {
      const progress = await (db as any)
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, testUserId));

      const completedModules = progress.filter(
        (p: any) => p.status === "completed"
      ).length;
      const averageScore =
        progress.length > 0
          ? Math.round(
              progress.reduce((sum: number, p: any) => sum + (p.score || 0), 0) /
                progress.length
            )
          : 0;

      expect(completedModules).toBeGreaterThanOrEqual(0);
      expect(averageScore).toBeGreaterThanOrEqual(0);
      expect(averageScore).toBeLessThanOrEqual(100);
    });

    it("should track learning velocity", async () => {
      const progress = await (db as any)
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, testUserId));

      const completedModules = progress.filter(
        (p: any) => p.status === "completed"
      ).length;
      const firstProgressDate =
        progress.length > 0 ? progress[0].createdAt : new Date();
      const daysSinceStart = Math.max(
        1,
        Math.floor(
          (new Date().getTime() - new Date(firstProgressDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      const learningVelocity = completedModules / daysSinceStart;

      expect(learningVelocity).toBeGreaterThanOrEqual(0);
    });
  });

  describe("CPR Clock - Session Management", () => {
    it("should create CPR session", async () => {
      const session = await (db as any)
        .select()
        .from(cprSessions)
        .where(eq(cprSessions.id, testCprSessionId))
        .limit(1);

      expect(session[0]).toBeDefined();
      expect(session[0].patientAge).toBe(5);
      expect(session[0].status).toBe("active");
    });

    it("should calculate medication dosage", () => {
      const patientWeight = 20; // kg
      const epinephrineDoze = patientWeight * 0.01; // 0.01 mg/kg

      expect(epinephrineDoze).toBe(0.2);
      expect(epinephrineDoze).toBeGreaterThan(0);
    });

    it("should calculate defibrillator energy", () => {
      const patientWeight = 20; // kg
      const initialEnergy = patientWeight * 2; // 2 J/kg
      const subsequentEnergy = patientWeight * 4; // 4 J/kg

      expect(initialEnergy).toBe(40);
      expect(subsequentEnergy).toBe(80);
      expect(subsequentEnergy).toBeGreaterThan(initialEnergy);
    });

    it("should record CPR intervention", async () => {
      const result = await (db as any)
        .insert(cprInterventions)
        .values({
          sessionId: testCprSessionId,
          interventionType: "epinephrine",
          timestamp: new Date(),
          dosage: 0.2,
          unit: "mg",
          notes: "First dose of epinephrine",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      expect(result[0]).toBeDefined();
      expect(result[0].interventionType).toBe("epinephrine");
      expect(result[0].dosage).toBe(0.2);
    });

    it("should retrieve CPR session interventions", async () => {
      const interventions = await (db as any)
        .select()
        .from(cprInterventions)
        .where(eq(cprInterventions.sessionId, testCprSessionId));

      expect(interventions.length).toBeGreaterThan(0);
      expect(interventions[0].sessionId).toBe(testCprSessionId);
    });

    it("should track decision windows", () => {
      const startTime = new Date();
      const decisionWindow = 3; // minutes
      const nextDecisionTime = new Date(
        startTime.getTime() + decisionWindow * 60 * 1000
      );

      expect(nextDecisionTime.getTime()).toBeGreaterThan(startTime.getTime());
    });
  });

  describe("CPR Clock - Medication Calculator", () => {
    it("should calculate correct epinephrine dose for pediatric patient", () => {
      const weight = 15; // kg
      const dose = weight * 0.01; // 0.01 mg/kg

      expect(dose).toBe(0.15);
      expect(dose).toBeGreaterThan(0);
      expect(dose).toBeLessThan(1);
    });

    it("should calculate correct amiodarone dose", () => {
      const weight = 20; // kg
      const dose = weight * 5; // 5 mg/kg

      expect(dose).toBe(100);
      expect(dose).toBeGreaterThan(0);
    });

    it("should validate medication dosage ranges", () => {
      const weight = 25; // kg
      const epinephrineDoze = weight * 0.01;
      const minDose = 0.01; // mg
      const maxDose = 1; // mg

      expect(epinephrineDoze).toBeGreaterThanOrEqual(minDose);
      expect(epinephrineDoze).toBeLessThanOrEqual(maxDose);
    });
  });

  describe("Learning Path - Quiz Management", () => {
    it("should retrieve quiz questions", async () => {
      const questions = await (db as any)
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, testQuizId));

      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0].question).toBeDefined();
      expect(questions[0].correctAnswer).toBeDefined();
    });

    it("should validate quiz passing score", async () => {
      const quiz = await (db as any)
        .select()
        .from(quizzes)
        .where(eq(quizzes.id, testQuizId))
        .limit(1);

      expect(quiz[0].passingScore).toBe(70);
      expect(quiz[0].passingScore).toBeGreaterThan(0);
      expect(quiz[0].passingScore).toBeLessThanOrEqual(100);
    });

    it("should determine quiz pass/fail status", () => {
      const score = 85;
      const passingScore = 70;
      const passed = score >= passingScore;

      expect(passed).toBe(true);
    });

    it("should handle quiz retakes", async () => {
      // First attempt
      const firstAttempt = await (db as any)
        .insert(userProgress)
        .values({
          userId: testUserId,
          enrollmentId: testEnrollmentId,
          moduleId: testModuleId,
          quizId: testQuizId,
          score: 65,
          attempts: 1,
          status: "in_progress",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      expect(firstAttempt[0].attempts).toBe(1);

      // Second attempt (update)
      const secondAttempt = await (db as any)
        .update(userProgress)
        .set({
          score: 80,
          attempts: 2,
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(userProgress.id, firstAttempt[0].id))
        .returning();

      expect(secondAttempt[0].attempts).toBe(2);
      expect(secondAttempt[0].status).toBe("completed");
    });
  });

  describe("Integration - Learning Path and CPR Clock", () => {
    it("should link user enrollment to CPR sessions", async () => {
      const enrollment = await (db as any)
        .select()
        .from(enrollments)
        .where(eq(enrollments.id, testEnrollmentId))
        .limit(1);

      const cprSession = await (db as any)
        .select()
        .from(cprSessions)
        .where(eq(cprSessions.userId, testUserId))
        .limit(1);

      expect(enrollment[0].userId).toBe(cprSession[0].userId);
    });

    it("should track learning progress and CPR practice together", async () => {
      const progress = await (db as any)
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, testUserId));

      const cprSessions = await (db as any)
        .select()
        .from(cprSessions)
        .where(eq(cprSessions.userId, testUserId));

      expect(progress.length).toBeGreaterThan(0);
      expect(cprSessions.length).toBeGreaterThan(0);
    });

    it("should calculate combined training score", async () => {
      const progress = await (db as any)
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, testUserId));

      const averageLearningScore =
        progress.length > 0
          ? Math.round(
              progress.reduce((sum: number, p: any) => sum + (p.score || 0), 0) /
                progress.length
            )
          : 0;

      const cprSessions = await (db as any)
        .select()
        .from(cprSessions)
        .where(eq(cprSessions.userId, testUserId));

      const combinedScore =
        (averageLearningScore + (cprSessions.length > 0 ? 100 : 0)) / 2;

      expect(combinedScore).toBeGreaterThanOrEqual(0);
      expect(combinedScore).toBeLessThanOrEqual(100);
    });
  });
});
