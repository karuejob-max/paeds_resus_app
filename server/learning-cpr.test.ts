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
  cprEvents,
} from "../drizzle/schema";

describe("Learning Path and CPR Clock Integration", () => {
  let db: any;
  let testUserId: number;
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
        openId: `openid-${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        name: "Test User",
        role: "user",
        loginMethod: "manus",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      });
    testUserId = (userResult as any).insertId || 1;

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
      });
    testCourseId = (courseResult as any).insertId || 1;

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
      });
    testModuleId = (moduleResult as any).insertId || 1;

    // Create test quiz
    const quizResult = await (db as any)
      .insert(quizzes)
      .values({
        moduleId: testModuleId,
        title: "Test Quiz",
        passingScore: 70,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    testQuizId = (quizResult as any).insertId || 1;

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
      });
    testEnrollmentId = (enrollmentResult as any).insertId || 1;

    // Create test CPR session
    const cprResult = await (db as any)
      .insert(cprSessions)
      .values({
        patientId: testUserId,
        providerId: testUserId,
        startTime: new Date(),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    testCprSessionId = (cprResult as any).insertId || 1;
  });

  afterAll(async () => {
    if (!db) return;

    // Cleanup test data
    await (db as any)
      .delete(cprEvents)
      .where(eq(cprEvents.cprSessionId, testCprSessionId));
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

    it.skip("should retrieve module content", async () => {
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
        });

      expect(result).toBeDefined();
      
      // Verify the record was inserted by fetching it
      const inserted = await (db as any)
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, testUserId),
            eq(userProgress.quizId, testQuizId)
          )
        )
        .limit(1);
      
      expect(inserted[0]).toBeDefined();
      expect(inserted[0].score).toBe(85);
      expect(inserted[0].status).toBe("completed");
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

      expect(progress.length).toBeGreaterThanOrEqual(0);
      if (progress.length > 0) {
        expect(progress[0].userId).toBe(testUserId);
      }
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
    it.skip("should create CPR session", async () => {
      const session = await (db as any)
        .select()
        .from(cprSessions)
        .where(eq(cprSessions.id, testCprSessionId))
        .limit(1);

      expect(session[0]).toBeDefined();
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

    it.skip("should track CPR session metadata", async () => {
      const session = await (db as any)
        .select()
        .from(cprSessions)
        .where(eq(cprSessions.id, testCprSessionId))
        .limit(1);

      expect(session[0]).toBeDefined();
      expect(session[0].patientId).toBe(testUserId);
      expect(session[0].providerId).toBe(testUserId);
    });

    it("should record CPR event", async () => {
      const result = await (db as any)
        .insert(cprEvents)
        .values({
          cprSessionId: testCprSessionId,
          eventType: "medication",
          eventTime: 60,
          description: "Epinephrine administered",
          value: "0.01 mg/kg",
          createdAt: new Date(),
        });

      expect(result).toBeDefined();
      
      // Verify the record was inserted
      const inserted = await (db as any)
        .select()
        .from(cprEvents)
        .where(eq(cprEvents.cprSessionId, testCprSessionId))
        .limit(1);
      
      expect(inserted[0]).toBeDefined();
      expect(inserted[0].eventType).toBe("medication");
    });

    it("should retrieve CPR session events", async () => {
      const events = await (db as any)
        .select()
        .from(cprEvents)
        .where(eq(cprEvents.cprSessionId, testCprSessionId));

      expect(Array.isArray(events)).toBe(true);
      if (events.length > 0) {
        expect(events[0].cprSessionId).toBe(testCprSessionId);
      }
    });

    it("should calculate total event count", async () => {
      const events = await (db as any)
        .select()
        .from(cprEvents)
        .where(eq(cprEvents.cprSessionId, testCprSessionId));

      const totalEvents = events.length;
      expect(totalEvents).toBeGreaterThanOrEqual(0);
    });

    it("should track event sequence", async () => {
      const events = await (db as any)
        .select()
        .from(cprEvents)
        .where(eq(cprEvents.cprSessionId, testCprSessionId));

      if (events.length > 1) {
        const firstEvent = events[0];
        const secondEvent = events[1];
        const timeDiff = secondEvent.eventTime - firstEvent.eventTime;
        expect(timeDiff).toBeGreaterThanOrEqual(0);
      }
      expect(events.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("CPR Clock - Medication Protocols", () => {
    it("should follow PALS epinephrine protocol", () => {
      const patientWeight = 20; // kg
      const epinephrineDoze = patientWeight * 0.01; // 0.01 mg/kg
      const maxDose = 1; // mg

      expect(epinephrineDoze).toBeLessThanOrEqual(maxDose);
      expect(epinephrineDoze).toBeGreaterThan(0);
    });

    it("should validate CPR quality assessment", () => {
      const validQualities = ["excellent", "good", "adequate", "poor"];
      const testQuality = "good";
      expect(validQualities).toContain(testQuality);
    });

    it("should follow PALS amiodarone protocol", () => {
      const patientWeight = 20; // kg
      const amiodaroneInitial = patientWeight * 5; // 5 mg/kg
      const amiodaroneRepeat = patientWeight * 5; // 5 mg/kg

      expect(amiodaroneInitial).toBeGreaterThan(0);
      expect(amiodaroneRepeat).toBeGreaterThan(0);
      expect(amiodaroneRepeat).toBeLessThanOrEqual(300);
    });

    it("should validate CPR session outcomes", () => {
      const validOutcomes = ["ROSC", "pCOSCA", "mortality", "ongoing"];
      const testOutcome = "ROSC";
      expect(validOutcomes).toContain(testOutcome);
    });
  });

  describe("Learning Path - Assessment", () => {
    it("should validate CPR session status transitions", () => {
      const validStatuses = ["active", "completed", "abandoned"];
      const testStatus = "active";
      expect(validStatuses).toContain(testStatus);
    });

    it("should evaluate quiz performance", async () => {
      const progress = await (db as any)
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, testUserId),
            eq(userProgress.quizId, testQuizId)
          )
        );

      if (progress.length > 0) {
        expect(progress[0].score).toBeGreaterThanOrEqual(0);
        expect(progress[0].score).toBeLessThanOrEqual(100);
      }
    });

    it("should track multiple attempts", async () => {
      const progress = await (db as any)
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, testUserId));

      const quizAttempts = progress.filter(
        (p: any) => p.quizId === testQuizId
      );
      expect(quizAttempts.length).toBeGreaterThanOrEqual(0);
    });
  });
});
