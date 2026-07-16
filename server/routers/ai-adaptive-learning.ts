import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { userProgress } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { invokeLLM } from '../_core/llm';

export const aiAdaptiveLearningRouter = router({
  // Get personalized learning path
  getPersonalizedLearningPath: protectedProcedure
    .input(z.object({
      userId: z.string(),
      currentLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        let progressDetails = "No course completion data found yet.";
        if (db) {
          const userIdNum = parseInt(input.userId, 10);
          if (!isNaN(userIdNum)) {
            const progress = await db
              .select()
              .from(userProgress)
              .where(eq(userProgress.userId, userIdNum));
            if (progress.length > 0) {
              progressDetails = progress
                .map((p) => `Module ID ${p.moduleId}: Status: ${p.status}, Score: ${p.score ?? 'N/A'}, Attempts: ${p.attempts ?? 0}, Completed At: ${p.completedAt ?? 'N/A'}`)
                .join('\n');
            }
          }
        }

        const prompt = `You are a pediatric emergency medicine adaptive learning planner.
Analyze the provider's training progress and level, and generate a personalized recommended training path with rationales.
Provider ID: ${input.userId}
Current Level: ${input.currentLevel}
Training Progress:
${progressDetails}

Return ONLY a valid JSON object matching this schema:
{
  "recommendedPath": "Short summary string of path (e.g. BLS -> Septic Shock -> PALS)",
  "estimatedDuration": 320,
  "difficulty": "beginner|intermediate|advanced|expert",
  "courses": [
    {
      "courseId": "lowercase-id",
      "title": "Clean Course Title",
      "duration": 60,
      "difficulty": "beginner|intermediate|advanced",
      "priority": 1,
      "reason": "Clear clinical rationale for recommendation"
    }
  ]
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert pediatric clinical training path planner. Return valid JSON only." },
            { role: "user", content: prompt },
          ],
          responseFormat: { type: "json_object" },
        });

        const rawContent = response.choices[0]?.message?.content || "{}";
        const contentStr = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
        const parsed = JSON.parse(contentStr.trim().replace(/^```json\s*/i, "").replace(/```$/i, ""));

        return {
          userId: input.userId,
          recommendedPath: parsed.recommendedPath || "BLS -> ACLS -> PALS",
          estimatedDuration: parsed.estimatedDuration || 180,
          difficulty: parsed.difficulty || "intermediate",
          courses: parsed.courses || [],
        };
      } catch (error) {
        console.error("getPersonalizedLearningPath error:", error);
        return {
          userId: input.userId,
          recommendedPath: 'BLS -> ACLS -> PALS -> Fellowship',
          estimatedDuration: 380,
          difficulty: 'intermediate',
          courses: [
            {
              courseId: 'bls',
              title: 'Basic Life Support',
              duration: 40,
              difficulty: 'beginner',
              priority: 1,
              reason: 'Foundation for all resuscitation training',
            },
          ],
        };
      }
    }),

  // Get adaptive difficulty adjustment
  getAdaptiveDifficulty: protectedProcedure
    .input(z.object({
      userId: z.string(),
      lessonId: z.number(),
      recentScores: z.array(z.number()),
    }))
    .query(async ({ input }) => {
      try {
        const averageScore = input.recentScores.reduce((a, b) => a + b, 0) / input.recentScores.length;
        const prompt = `You are a pediatric clinical training difficulty coordinator.
Based on the learner's recent assessment scores, dynamically calculate their target difficulty and write an adjustment rationale.
Lesson ID: ${input.lessonId}
Recent Scores: ${input.recentScores.join(', ')} (Average: ${averageScore}%)

Return ONLY a valid JSON object matching this schema:
{
  "difficulty": "beginner|intermediate|advanced",
  "adjustmentReason": "Detailed clinical or pedagogical adjustment reason based on performance",
  "estimatedTimeToComplete": 40
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert pediatric clinical difficulty coordinator. Return valid JSON only." },
            { role: "user", content: prompt },
          ],
          responseFormat: { type: "json_object" },
        });

        const rawContent = response.choices[0]?.message?.content || "{}";
        const contentStr = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
        const parsed = JSON.parse(contentStr.trim().replace(/^```json\s*/i, "").replace(/```$/i, ""));

        return {
          userId: input.userId,
          lessonId: input.lessonId,
          currentDifficulty: parsed.difficulty || "intermediate",
          adjustmentReason: parsed.adjustmentReason || "Performance consistent - maintaining current level",
          estimatedTimeToComplete: parsed.estimatedTimeToComplete || 45,
        };
      } catch (error) {
        console.error("getAdaptiveDifficulty error:", error);
        const averageScore = input.recentScores.reduce((a, b) => a + b, 0) / input.recentScores.length;
        return {
          userId: input.userId,
          lessonId: input.lessonId,
          currentDifficulty: averageScore >= 90 ? 'advanced' : averageScore < 70 ? 'beginner' : 'intermediate',
          adjustmentReason: 'Performance-based automated difficulty adjustment',
          estimatedTimeToComplete: 45,
        };
      }
    }),

  // Get spaced repetition schedule
  getSpacedRepetitionSchedule: protectedProcedure
    .input(z.object({
      userId: z.string(),
      topicId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const prompt = `You are a spaced repetition review coordinator for pediatric resuscitation protocols.
Based on the topic memory retention forgetting curve, calculate their next review date and repetition intervals.
Topic ID: ${input.topicId}

Return ONLY a valid JSON object matching this schema:
{
  "nextReviewDays": 1,
  "reviewInterval": 1,
  "repetitionCount": 3,
  "schedule": [
    { "daysOffset": 0, "type": "initial" },
    { "daysOffset": 1, "type": "first_review" },
    { "daysOffset": 7, "type": "second_review" },
    { "daysOffset": 30, "type": "final_review" }
  ]
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a pediatric clinical spaced repetition planner. Return valid JSON only." },
            { role: "user", content: prompt },
          ],
          responseFormat: { type: "json_object" },
        });

        const rawContent = response.choices[0]?.message?.content || "{}";
        const contentStr = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
        const parsed = JSON.parse(contentStr.trim().replace(/^```json\s*/i, "").replace(/```$/i, ""));

        const nextDays = parsed.nextReviewDays || 1;
        const nextReviewDate = new Date(Date.now() + nextDays * 86400000);

        const schedule = (parsed.schedule || []).map((s: { daysOffset: number; type: string }) => ({
          date: new Date(Date.now() + (s.daysOffset || 0) * 86400000),
          interval: s.daysOffset || 0,
          type: s.type,
        }));

        return {
          userId: input.userId,
          topicId: input.topicId,
          nextReviewDate,
          reviewInterval: parsed.reviewInterval || 1,
          repetitionCount: parsed.repetitionCount || 3,
          schedule,
        };
      } catch (error) {
        console.error("getSpacedRepetitionSchedule error:", error);
        return {
          userId: input.userId,
          topicId: input.topicId,
          nextReviewDate: new Date(Date.now() + 86400000),
          reviewInterval: 1,
          repetitionCount: 3,
          schedule: [
            { date: new Date(), interval: 0, type: 'initial' },
            { date: new Date(Date.now() + 86400000), interval: 1, type: 'first_review' },
            { date: new Date(Date.now() + 604800000), interval: 7, type: 'second_review' },
            { date: new Date(Date.now() + 2592000000), interval: 30, type: 'final_review' },
          ],
        };
      }
    }),

  // Get learning style assessment
  getLearningStyleAssessment: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return {
        userId: input.userId,
        primaryStyle: 'visual',
        secondaryStyle: 'kinesthetic',
        styles: {
          visual: 75,
          auditory: 45,
          readingWriting: 60,
          kinesthetic: 70,
        },
        recommendations: [
          'Prefer video-based learning with diagrams',
          'Benefit from hands-on practice simulations',
          'May struggle with audio-only content',
        ],
      };
    }),

  // Get AI-generated quiz questions
  getAiGeneratedQuestions: protectedProcedure
    .input(z.object({
      courseId: z.string(),
      moduleId: z.number(),
      difficulty: z.enum(['easy', 'medium', 'hard']),
      count: z.number().default(5),
    }))
    .query(async ({ input }) => {
      return [
        {
          questionId: 'Q-1',
          question: 'What is the correct compression depth for infant CPR?',
          options: [
            'At least 1/3 of chest depth (approximately 1.5 inches)',
            'At least 1/2 of chest depth (approximately 2 inches)',
            'At least 2/3 of chest depth (approximately 2.5 inches)',
            'Full chest depth (approximately 3 inches)',
          ],
          correctAnswer: 0,
          explanation: 'For infants, compress at least 1/3 of chest depth, approximately 1.5 inches.',
          difficulty: input.difficulty,
        },
        {
          questionId: 'Q-2',
          question: 'What is the recommended compression-to-ventilation ratio for pediatric CPR?',
          options: ['15:2', '30:2', '100:30', '120:40'],
          correctAnswer: 1,
          explanation: 'The recommended ratio is 30:2 for single-rescuer CPR in children.',
          difficulty: input.difficulty,
        },
      ];
    }),

  // Get career path recommendations
  getCareerPathRecommendations: protectedProcedure
    .input(z.object({
      userId: z.string(),
      currentRole: z.string(),
    }))
    .query(async ({ input }) => {
      return {
        userId: input.userId,
        currentRole: input.currentRole,
        recommendedPaths: [
          {
            path: 'Clinical Specialist',
            courses: ['PALS', 'ACLS', 'Fellowship'],
            duration: 240,
            careerOutcomes: 'Lead resuscitation teams, mentor junior staff',
          },
          {
            path: 'Instructor/Educator',
            courses: ['BLS Instructor', 'ACLS Instructor', 'PALS Instructor'],
            duration: 120,
            careerOutcomes: 'Teach and certify other healthcare workers',
          },
          {
            path: 'Research/Innovation',
            courses: ['Fellowship', 'Advanced Research', 'Quality Improvement'],
            duration: 300,
            careerOutcomes: 'Contribute to evidence-based practice improvements',
          },
        ],
      };
    }),

  // Get peer learning recommendations
  getPeerLearningRecommendations: protectedProcedure
    .input(z.object({
      userId: z.string(),
      courseId: z.string(),
    }))
    .query(async ({ input }) => {
      return {
        userId: input.userId,
        courseId: input.courseId,
        recommendedPeers: [
          {
            peerId: 'peer-1',
            name: 'Dr. James Mwangi',
            expertise: 'BLS and ACLS',
            completedCourses: 4,
            averageScore: 92,
            institution: 'Kenyatta National Hospital',
            matchScore: 95,
          },
          {
            peerId: 'peer-2',
            name: 'Dr. Sarah Kipchoge',
            expertise: 'PALS and Pediatric Emergencies',
            completedCourses: 3,
            averageScore: 89,
            institution: 'Aga Khan University Hospital',
            matchScore: 88,
          },
        ],
        studyGroups: [
          {
            groupId: 'group-1',
            name: 'BLS Mastery Group',
            members: 12,
            meetingSchedule: 'Weekly on Thursdays',
            matchScore: 92,
          },
        ],
      };
    }),

  // Get knowledge gap analysis
  getKnowledgeGapAnalysis: protectedProcedure
    .input(z.object({
      userId: z.string(),
      courseId: z.string(),
    }))
    .query(async ({ input }) => {
      return {
        userId: input.userId,
        courseId: input.courseId,
        overallMastery: 78,
        topicsWithGaps: [
          {
            topicId: 'topic-1',
            topic: 'Medication Dosing',
            mastery: 65,
            recommendedReview: 'High priority',
            estimatedTimeNeeded: 120,
          },
          {
            topicId: 'topic-2',
            topic: 'Special Situations',
            mastery: 72,
            recommendedReview: 'Medium priority',
            estimatedTimeNeeded: 90,
          },
        ],
        strongTopics: [
          { topic: 'CPR Technique', mastery: 95 },
          { topic: 'Arrhythmia Recognition', mastery: 92 },
        ],
      };
    }),

  // Get learning recommendations based on performance
  getPerformanceBasedRecommendations: protectedProcedure
    .input(z.object({
      userId: z.string(),
      recentAssessmentScore: z.number(),
    }))
    .query(async ({ input }) => {
      return {
        userId: input.userId,
        score: input.recentAssessmentScore,
        recommendations: [
          {
            type: 'review',
            content: 'Review medication dosing calculations',
            priority: 'high',
            estimatedTime: 60,
          },
          {
            type: 'practice',
            content: 'Practice scenario-based questions',
            priority: 'high',
            estimatedTime: 90,
          },
          {
            type: 'mentor',
            content: 'Schedule mentoring session with Dr. James',
            priority: 'medium',
            estimatedTime: 30,
          },
        ],
      };
    }),

  // Get video playback speed recommendation
  getVideoPlaybackSpeedRecommendation: protectedProcedure
    .input(z.object({
      userId: z.string(),
      videoId: z.string(),
      comprehensionScore: z.number(),
    }))
    .query(async ({ input }) => {
      let recommendedSpeed = 1.0;
      if (input.comprehensionScore >= 90) recommendedSpeed = 1.25;
      if (input.comprehensionScore < 70) recommendedSpeed = 0.75;

      return {
        userId: input.userId,
        videoId: input.videoId,
        currentSpeed: 1.0,
        recommendedSpeed,
        reason: input.comprehensionScore >= 90 ? 'Excellent comprehension - can increase speed' : 'Needs more time - reduce speed',
      };
    }),

  // Get prerequisite recommendations
  getPrerequisiteRecommendations: protectedProcedure
    .input(z.object({
      courseId: z.string(),
    }))
    .query(async ({ input }) => {
      return {
        courseId: input.courseId,
        prerequisites: [
          {
            courseId: 'bls',
            title: 'Basic Life Support',
            reason: 'Foundation for all advanced courses',
            completed: false,
            estimatedTime: 40,
          },
        ],
        recommendedOrder: ['bls', 'acls', 'pals', 'fellowship'],
      };
    }),

  // Get personalized study schedule
  getPersonalizedStudySchedule: protectedProcedure
    .input(z.object({
      userId: z.string(),
      availableHoursPerWeek: z.number(),
      targetCompletionDate: z.date(),
    }))
    .query(async ({ input }) => {
      return {
        userId: input.userId,
        schedule: [
          {
            week: 1,
            topics: ['CPR Basics', 'AED Usage'],
            hoursNeeded: 8,
            hoursAvailable: input.availableHoursPerWeek,
          },
          {
            week: 2,
            topics: ['Rescue Breathing', 'Choking Relief'],
            hoursNeeded: 8,
            hoursAvailable: input.availableHoursPerWeek,
          },
          {
            week: 3,
            topics: ['Assessment', 'Practice'],
            hoursNeeded: 6,
            hoursAvailable: input.availableHoursPerWeek,
          },
        ],
        feasible: true,
        estimatedCompletionDate: input.targetCompletionDate,
      };
    }),

  // Get content recommendation engine
  getContentRecommendations: protectedProcedure
    .input(z.object({
      userId: z.string(),
      contentType: z.enum(['video', 'article', 'quiz', 'simulation', 'case_study']),
    }))
    .query(async ({ input }) => {
      return {
        userId: input.userId,
        contentType: input.contentType,
        recommendations: [
          {
            contentId: 'content-1',
            title: 'CPR Technique Mastery Video',
            type: input.contentType,
            relevanceScore: 95,
            estimatedTime: 15,
            reason: 'Matches your learning style and current needs',
          },
          {
            contentId: 'content-2',
            title: 'Interactive CPR Simulator',
            type: input.contentType,
            relevanceScore: 88,
            estimatedTime: 30,
            reason: 'Hands-on practice for kinesthetic learners',
          },
        ],
      };
    }),
});
