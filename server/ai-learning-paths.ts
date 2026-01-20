import { invokeLLM } from "./_core/llm";

export interface LearnerProfile {
  userId: number;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  specialization: string;
  learningStyle: "visual" | "auditory" | "kinesthetic" | "reading";
  availableHours: number;
  goals: string[];
  completedModules: string[];
  quizScores: Record<string, number>;
}

export interface PersonalizedPath {
  pathId: string;
  title: string;
  description: string;
  modules: ModuleRecommendation[];
  estimatedDuration: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  successProbability: number;
  reasoning: string;
}

export interface ModuleRecommendation {
  moduleId: string;
  moduleName: string;
  reason: string;
  estimatedHours: number;
  priority: "high" | "medium" | "low";
  prerequisites: string[];
  relatedResources: string[];
}

/**
 * Generate AI-powered personalized learning paths based on learner profile
 */
export async function generatePersonalizedPath(
  profile: LearnerProfile
): Promise<PersonalizedPath> {
  const prompt = `
You are an expert educational advisor for pediatric resuscitation training. Based on the following learner profile, generate a personalized learning path.

LEARNER PROFILE:
- Experience Level: ${profile.experienceLevel}
- Specialization: ${profile.specialization}
- Learning Style: ${profile.learningStyle}
- Available Hours Per Week: ${profile.availableHours}
- Goals: ${profile.goals.join(", ")}
- Completed Modules: ${profile.completedModules.length > 0 ? profile.completedModules.join(", ") : "None"}
- Average Quiz Score: ${Object.values(profile.quizScores).length > 0 ? Math.round(Object.values(profile.quizScores).reduce((a, b) => a + b) / Object.values(profile.quizScores).length) : "N/A"}%

Generate a personalized learning path in JSON format with the following structure:
{
  "pathId": "unique-id",
  "title": "Path Title",
  "description": "Brief description",
  "modules": [
    {
      "moduleId": "module-id",
      "moduleName": "Module Name",
      "reason": "Why this module is recommended",
      "estimatedHours": 5,
      "priority": "high|medium|low",
      "prerequisites": ["module-id"],
      "relatedResources": ["resource-url"]
    }
  ],
  "estimatedDuration": 40,
  "difficulty": "beginner|intermediate|advanced",
  "successProbability": 0.85,
  "reasoning": "Detailed explanation of why this path is optimal"
}

Ensure the path is:
1. Achievable within the learner's available time
2. Aligned with their goals and specialization
3. Appropriate for their experience level
4. Optimized for their learning style
5. Builds on completed modules
`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are an expert educational advisor for pediatric resuscitation training. Generate personalized learning paths in valid JSON format.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "personalized_learning_path",
        strict: true,
        schema: {
          type: "object",
          properties: {
            pathId: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            modules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  moduleId: { type: "string" },
                  moduleName: { type: "string" },
                  reason: { type: "string" },
                  estimatedHours: { type: "number" },
                  priority: { type: "string", enum: ["high", "medium", "low"] },
                  prerequisites: { type: "array", items: { type: "string" } },
                  relatedResources: { type: "array", items: { type: "string" } },
                },
                required: [
                  "moduleId",
                  "moduleName",
                  "reason",
                  "estimatedHours",
                  "priority",
                ],
              },
            },
            estimatedDuration: { type: "number" },
            difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
            successProbability: { type: "number", minimum: 0, maximum: 1 },
            reasoning: { type: "string" },
          },
          required: [
            "pathId",
            "title",
            "description",
            "modules",
            "estimatedDuration",
            "difficulty",
            "successProbability",
            "reasoning",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (typeof content === "string") {
    return JSON.parse(content) as PersonalizedPath;
  }

  throw new Error("Failed to generate personalized learning path");
}

/**
 * Generate adaptive quiz recommendations based on performance
 */
export async function generateAdaptiveQuizzes(
  profile: LearnerProfile,
  recentScores: Record<string, number>
): Promise<{
  nextQuizzes: string[];
  focusAreas: string[];
  difficulty: "easy" | "medium" | "hard";
  reasoning: string;
}> {
  const averageScore =
    Object.values(recentScores).reduce((a, b) => a + b, 0) /
    Object.values(recentScores).length;

  const prompt = `
Based on the learner's recent quiz performance (average: ${Math.round(averageScore)}%), 
recommend the next quizzes and focus areas for improvement.

Recent Scores: ${JSON.stringify(recentScores)}
Experience Level: ${profile.experienceLevel}
Learning Style: ${profile.learningStyle}

Provide recommendations in JSON format with:
{
  "nextQuizzes": ["quiz-id"],
  "focusAreas": ["area"],
  "difficulty": "easy|medium|hard",
  "reasoning": "explanation"
}
`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are an adaptive learning system expert. Recommend quizzes based on learner performance.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0].message.content;
  if (typeof content === "string") {
    try {
      return JSON.parse(content);
    } catch {
      return {
        nextQuizzes: [],
        focusAreas: ["Review fundamentals"],
        difficulty: averageScore > 80 ? "hard" : averageScore > 60 ? "medium" : "easy",
        reasoning: "Adaptive recommendations based on performance",
      };
    }
  }

  throw new Error("Failed to generate adaptive quizzes");
}

/**
 * Generate personalized study schedule
 */
export async function generateStudySchedule(
  profile: LearnerProfile,
  pathModules: string[]
): Promise<{
  schedule: Array<{
    week: number;
    modules: string[];
    estimatedHours: number;
    milestones: string[];
  }>;
  tips: string[];
  estimatedCompletionDate: Date;
}> {
  const prompt = `
Create a personalized study schedule for a learner with the following profile:
- Available Hours Per Week: ${profile.availableHours}
- Learning Style: ${profile.learningStyle}
- Experience Level: ${profile.experienceLevel}
- Modules to Complete: ${pathModules.join(", ")}

Generate a realistic, achievable schedule that respects their availability and learning style.
Return as JSON with weeks, modules per week, estimated hours, and milestones.
`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an expert in creating personalized study schedules.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0].message.content;
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      return {
        schedule: parsed.schedule || [],
        tips: parsed.tips || [],
        estimatedCompletionDate: new Date(
          Date.now() + (parsed.schedule?.length || 4) * 7 * 24 * 60 * 60 * 1000
        ),
      };
    } catch {
      // Return default schedule
      const weeksNeeded = Math.ceil(pathModules.length / 2);
      return {
        schedule: Array.from({ length: weeksNeeded }, (_, i) => ({
          week: i + 1,
          modules: pathModules.slice(i * 2, (i + 1) * 2),
          estimatedHours: profile.availableHours,
          milestones: [`Complete week ${i + 1}`],
        })),
        tips: [
          "Study at consistent times each day",
          "Take breaks every 45 minutes",
          "Review previous modules before starting new ones",
        ],
        estimatedCompletionDate: new Date(
          Date.now() + weeksNeeded * 7 * 24 * 60 * 60 * 1000
        ),
      };
    }
  }

  throw new Error("Failed to generate study schedule");
}

/**
 * Analyze learner strengths and weaknesses
 */
export async function analyzeLearnerPerformance(
  profile: LearnerProfile
): Promise<{
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  nextSteps: string[];
}> {
  const prompt = `
Analyze the following learner's performance and provide insights:

Quiz Scores: ${JSON.stringify(profile.quizScores)}
Completed Modules: ${profile.completedModules.join(", ")}
Experience Level: ${profile.experienceLevel}
Learning Style: ${profile.learningStyle}

Provide analysis in JSON format with:
{
  "strengths": ["strength"],
  "weaknesses": ["weakness"],
  "recommendations": ["recommendation"],
  "nextSteps": ["action"]
}
`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an expert educational analyst for healthcare training.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0].message.content;
  if (typeof content === "string") {
    try {
      return JSON.parse(content);
    } catch {
      return {
        strengths: ["Consistent engagement"],
        weaknesses: ["Areas for improvement"],
        recommendations: ["Continue with current pace"],
        nextSteps: ["Complete next module"],
      };
    }
  }

  throw new Error("Failed to analyze learner performance");
}
