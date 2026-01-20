/**
 * AI-Powered Content Generation & Localization Service
 * Generates and localizes educational content, course materials, and resources
 */

import { invokeLLM } from "./_core/llm";

export type ContentType = "course" | "quiz" | "article" | "video_script" | "lesson_plan" | "assessment";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type Language = "en" | "sw" | "fr" | "es" | "ar";

export interface GeneratedContent {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  language: Language;
  difficulty: Difficulty;
  estimatedReadTime: number;
  keywords: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalizedContent {
  originalId: string;
  language: Language;
  title: string;
  content: string;
  translator?: string;
  translatedAt: Date;
  qualityScore: number; // 0-100
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: ContentType;
  structure: string;
  placeholders: string[];
}

class AIContentService {
  private generatedContent: Map<string, GeneratedContent> = new Map();
  private localizedContent: Map<string, LocalizedContent[]> = new Map();
  private templates: Map<string, ContentTemplate> = new Map();
  private contentCache: Map<string, string> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize content templates
   */
  private initializeTemplates(): void {
    const templates: ContentTemplate[] = [
      {
        id: "course_outline",
        name: "Course Outline",
        description: "Standard course structure with modules and lessons",
        type: "course",
        structure: `
# {courseTitle}
## Overview
{courseDescription}

## Learning Objectives
{objectives}

## Course Modules
{modules}

## Assessment Methods
{assessments}

## Resources
{resources}
        `,
        placeholders: ["courseTitle", "courseDescription", "objectives", "modules", "assessments", "resources"],
      },
      {
        id: "quiz_template",
        name: "Quiz Template",
        description: "Multiple choice quiz with explanations",
        type: "quiz",
        structure: `
# {quizTitle}
## Instructions
{instructions}

## Questions
{questions}

## Answer Key
{answerKey}

## Feedback
{feedback}
        `,
        placeholders: ["quizTitle", "instructions", "questions", "answerKey", "feedback"],
      },
      {
        id: "lesson_plan",
        name: "Lesson Plan",
        description: "Detailed lesson plan with activities",
        type: "lesson_plan",
        structure: `
# {lessonTitle}
## Grade Level: {gradeLevel}
## Duration: {duration}

## Learning Objectives
{objectives}

## Materials Needed
{materials}

## Introduction
{introduction}

## Main Activities
{activities}

## Assessment
{assessment}

## Closure
{closure}

## Homework
{homework}
        `,
        placeholders: [
          "lessonTitle",
          "gradeLevel",
          "duration",
          "objectives",
          "materials",
          "introduction",
          "activities",
          "assessment",
          "closure",
          "homework",
        ],
      },
    ];

    templates.forEach((template) => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Generate content using AI
   */
  async generateContent(
    type: ContentType,
    title: string,
    description: string,
    difficulty: Difficulty = "intermediate",
    language: Language = "en"
  ): Promise<GeneratedContent | null> {
    try {
      const cacheKey = `${type}_${title}_${difficulty}_${language}`;
      const cached = this.contentCache.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const prompt = this.buildContentPrompt(type, title, description, difficulty, language);

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert educational content creator specializing in pediatric resuscitation training. Create high-quality, accurate, and engaging educational content. Always include practical examples and real-world applications.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const messageContent = response.choices[0]?.message?.content;
      const content = typeof messageContent === "string" ? messageContent : "";

      const generatedContent: GeneratedContent = {
        id: `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        title,
        content,
        language,
        difficulty,
        estimatedReadTime: Math.ceil(content.split(" ").length / 200),
        keywords: this.extractKeywords(content),
        metadata: {
          model: "gpt-4",
          generatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.generatedContent.set(generatedContent.id, generatedContent);
      this.contentCache.set(cacheKey, JSON.stringify(generatedContent));

      return generatedContent;
    } catch (error) {
      console.error("Error generating content:", error);
      return null;
    }
  }

  /**
   * Build content generation prompt
   */
  private buildContentPrompt(
    type: ContentType,
    title: string,
    description: string,
    difficulty: Difficulty,
    language: Language
  ): string {
    const languageMap: Record<Language, string> = {
      en: "English",
      sw: "Swahili",
      fr: "French",
      es: "Spanish",
      ar: "Arabic",
    };

    const difficultyMap: Record<Difficulty, string> = {
      beginner: "suitable for beginners with no prior knowledge",
      intermediate: "suitable for learners with basic knowledge",
      advanced: "suitable for advanced learners and professionals",
    };

    let prompt = `Create a high-quality ${type} about "${title}" in ${languageMap[language]}.

Description: ${description}

Difficulty Level: ${difficultyMap[difficulty]}

Requirements:
- Make it engaging and practical
- Include real-world examples
- Use clear, accessible language
- Focus on pediatric resuscitation best practices
- Include actionable takeaways`;

    if (type === "quiz") {
      prompt += `
- Create 5-10 multiple choice questions
- Include correct answers and explanations
- Vary difficulty levels`;
    } else if (type === "lesson_plan") {
      prompt += `
- Include learning objectives
- Provide detailed activities
- Include assessment methods
- Suggest resources`;
    } else if (type === "video_script") {
      prompt += `
- Format as a video script with timing
- Include visual descriptions
- Add speaker notes
- Keep it concise (5-10 minutes)`;
    }

    return prompt;
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - in production, use NLP library
    const words = content
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 5);

    const frequency: Record<string, number> = {};

    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Localize content to another language
   */
  async localizeContent(contentId: string, targetLanguage: Language): Promise<LocalizedContent | null> {
    try {
      const content = this.generatedContent.get(contentId);
      if (!content) return null;

      if (content.language === targetLanguage) {
        return {
          originalId: contentId,
          language: targetLanguage,
          title: content.title,
          content: content.content,
          translatedAt: new Date(),
          qualityScore: 100,
        };
      }

      const languageMap: Record<Language, string> = {
        en: "English",
        sw: "Swahili",
        fr: "French",
        es: "Spanish",
        ar: "Arabic",
      };

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert translator specializing in medical and educational content. Translate the following content accurately while maintaining technical precision and clarity. Preserve all formatting and structure.`,
          },
          {
            role: "user",
            content: `Translate the following ${content.type} from ${languageMap[content.language]} to ${languageMap[targetLanguage]}:

Title: ${content.title}

Content:
${content.content}`,
          },
        ],
      });

      const messageContent = response.choices[0]?.message?.content;
      const translatedContent = typeof messageContent === "string" ? messageContent : "";

      const localizedContent: LocalizedContent = {
        originalId: contentId,
        language: targetLanguage,
        title: content.title,
        content: translatedContent,
        translator: "AI",
        translatedAt: new Date(),
        qualityScore: 85,
      };

      const existing = this.localizedContent.get(contentId) || [];
      existing.push(localizedContent);
      this.localizedContent.set(contentId, existing);

      return localizedContent;
    } catch (error) {
      console.error("Error localizing content:", error);
      return null;
    }
  }

  /**
   * Get localized content
   */
  getLocalizedContent(contentId: string, language: Language): LocalizedContent | null {
    const localized = this.localizedContent.get(contentId) || [];
    return localized.find((lc) => lc.language === language) || null;
  }

  /**
   * Get content by ID
   */
  getContent(contentId: string): GeneratedContent | null {
    return this.generatedContent.get(contentId) || null;
  }

  /**
   * Get all generated content
   */
  getAllContent(type?: ContentType): GeneratedContent[] {
    const all = Array.from(this.generatedContent.values());
    return type ? all.filter((c) => c.type === type) : all;
  }

  /**
   * Get content statistics
   */
  getStatistics(): {
    totalContent: number;
    byType: Record<ContentType, number>;
    byLanguage: Record<Language, number>;
    avgReadTime: number;
  } {
    const all = Array.from(this.generatedContent.values());

    const byType: Record<ContentType, number> = {
      course: 0,
      quiz: 0,
      article: 0,
      video_script: 0,
      lesson_plan: 0,
      assessment: 0,
    };

    const byLanguage: Record<Language, number> = {
      en: 0,
      sw: 0,
      fr: 0,
      es: 0,
      ar: 0,
    };

    let totalReadTime = 0;

    all.forEach((content) => {
      byType[content.type]++;
      byLanguage[content.language]++;
      totalReadTime += content.estimatedReadTime;
    });

    return {
      totalContent: all.length,
      byType,
      byLanguage,
      avgReadTime: all.length > 0 ? Math.round(totalReadTime / all.length) : 0,
    };
  }
}

// Export singleton instance
export const aiContentService = new AIContentService();
