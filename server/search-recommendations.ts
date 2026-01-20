/**
 * Advanced Search & Recommendation Engine
 * Full-text search, filtering, and personalized recommendations
 */

export interface SearchResult {
  id: string;
  type: "course" | "article" | "user" | "institution";
  title: string;
  description: string;
  relevanceScore: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface RecommendationResult {
  id: string;
  title: string;
  description: string;
  reason: string;
  score: number;
  type: "course" | "article" | "community";
}

export interface SearchFilters {
  type?: string[];
  difficulty?: string[];
  language?: string[];
  duration?: { min: number; max: number };
  tags?: string[];
  rating?: number;
  priceRange?: { min: number; max: number };
}

export interface UserPreferences {
  userId: number;
  favoriteCategories: string[];
  learningStyle: "visual" | "auditory" | "kinesthetic" | "reading";
  preferredLanguage: string;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  interests: string[];
}

class SearchRecommendationEngine {
  private searchIndex: Map<string, SearchResult[]> = new Map();
  private userPreferences: Map<number, UserPreferences> = new Map();
  private courseDatabase: Map<string, any> = new Map();
  private userInteractions: Map<number, string[]> = new Map();

  /**
   * Index content for search
   */
  indexContent(content: SearchResult): void {
    const keywords = this.extractKeywords(content.title + " " + content.description);

    keywords.forEach((keyword) => {
      const existing = this.searchIndex.get(keyword) || [];
      existing.push(content);
      this.searchIndex.set(keyword, existing);
    });
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3);

    // Remove duplicates
    return Array.from(new Set(words));
  }

  /**
   * Search courses and content
   */
  search(query: string, filters?: SearchFilters, limit: number = 20): SearchResult[] {
    const keywords = this.extractKeywords(query);
    const results: Map<string, SearchResult> = new Map();

    // Search by keywords
    keywords.forEach((keyword) => {
      const matches = this.searchIndex.get(keyword) || [];
      matches.forEach((result) => {
        const existing = results.get(result.id);
        if (existing) {
          existing.relevanceScore += 1;
        } else {
          results.set(result.id, { ...result, relevanceScore: 1 });
        }
      });
    });

    let resultArray = Array.from(results.values());

    // Apply filters
    if (filters) {
      if (filters.type && filters.type.length > 0) {
        resultArray = resultArray.filter((r) => filters.type?.includes(r.type));
      }

      if (filters.tags && filters.tags.length > 0) {
        resultArray = resultArray.filter((r) =>
          filters.tags?.some((tag) => r.tags.includes(tag))
        );
      }

      if (filters.difficulty && filters.difficulty.length > 0) {
        resultArray = resultArray.filter((r) =>
          filters.difficulty?.includes((r.metadata.difficulty as string) || "")
        );
      }

      if (filters.language && filters.language.length > 0) {
        resultArray = resultArray.filter((r) =>
          filters.language?.includes((r.metadata.language as string) || "")
        );
      }
    }

    // Sort by relevance
    resultArray.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return resultArray.slice(0, limit);
  }

  /**
   * Get personalized recommendations
   */
  getRecommendations(userId: number, limit: number = 10): RecommendationResult[] {
    const preferences = this.userPreferences.get(userId);
    const interactions = this.userInteractions.get(userId) || [];

    if (!preferences) {
      // Return popular courses if no preferences
      return this.getPopularCourses(limit);
    }

    const recommendations: RecommendationResult[] = [];

    // Recommend based on favorite categories
    preferences.favoriteCategories.forEach((category) => {
      const courses = this.searchIndex.get(category) || [];
      courses.forEach((course) => {
        if (!interactions.includes(course.id)) {
          recommendations.push({
            id: course.id,
            title: course.title,
            description: course.description,
            reason: `Based on your interest in ${category}`,
            score: this.calculateRecommendationScore(course, preferences),
            type: course.type as "course" | "article" | "community",
          });
        }
      });
    });

    // Recommend based on learning style
    const styleMatches = this.searchIndex.get(preferences.learningStyle) || [];
    styleMatches.forEach((course) => {
      if (!interactions.includes(course.id)) {
        recommendations.push({
          id: course.id,
          title: course.title,
          description: course.description,
          reason: `Matches your ${preferences.learningStyle} learning style`,
          score: this.calculateRecommendationScore(course, preferences),
          type: course.type as "course" | "article" | "community",
        });
      }
    });

    // Sort by score and return top results
    recommendations.sort((a, b) => b.score - a.score);
    return recommendations.slice(0, limit);
  }

  /**
   * Calculate recommendation score
   */
  private calculateRecommendationScore(course: SearchResult, preferences: UserPreferences): number {
    let score = 0;

    // Category match
    if (preferences.favoriteCategories.some((cat) => course.tags.includes(cat))) {
      score += 30;
    }

    // Difficulty match
    const courseDifficulty = (course.metadata.difficulty as string) || "intermediate";
    if (courseDifficulty === preferences.difficultyLevel) {
      score += 25;
    } else if (
      (preferences.difficultyLevel === "beginner" && courseDifficulty === "intermediate") ||
      (preferences.difficultyLevel === "intermediate" && courseDifficulty === "advanced")
    ) {
      score += 15; // Slight boost for next level
    }

    // Language match
    if ((course.metadata.language as string) === preferences.preferredLanguage) {
      score += 20;
    }

    // Interest match
    if (preferences.interests.some((interest) => course.tags.includes(interest))) {
      score += 25;
    }

    return score;
  }

  /**
   * Get popular courses
   */
  private getPopularCourses(limit: number): RecommendationResult[] {
    const courses = Array.from(this.courseDatabase.values());

    return courses
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit)
      .map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        reason: "Popular course",
        score: course.rating || 0,
        type: "course" as const,
      }));
  }

  /**
   * Set user preferences
   */
  setUserPreferences(userId: number, preferences: UserPreferences): void {
    this.userPreferences.set(userId, preferences);
  }

  /**
   * Get user preferences
   */
  getUserPreferences(userId: number): UserPreferences | null {
    return this.userPreferences.get(userId) || null;
  }

  /**
   * Track user interaction
   */
  trackInteraction(userId: number, contentId: string): void {
    const interactions = this.userInteractions.get(userId) || [];
    if (!interactions.includes(contentId)) {
      interactions.push(contentId);
      this.userInteractions.set(userId, interactions);
    }
  }

  /**
   * Get trending searches
   */
  getTrendingSearches(limit: number = 10): string[] {
    // In production, this would track actual search queries
    return [
      "BLS certification",
      "PALS training",
      "pediatric resuscitation",
      "CPR for parents",
      "emergency response",
      "healthcare training",
      "infant CPR",
      "advanced life support",
      "first aid certification",
      "resuscitation skills",
    ].slice(0, limit);
  }

  /**
   * Get search suggestions
   */
  getSearchSuggestions(query: string, limit: number = 5): string[] {
    const keywords = this.extractKeywords(query);
    const suggestions = new Set<string>();

    keywords.forEach((keyword) => {
      const matches = this.searchIndex.get(keyword) || [];
      matches.forEach((match) => {
        match.tags.forEach((tag) => {
          if (tag.includes(keyword)) {
            suggestions.add(tag);
          }
        });
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Get advanced search statistics
   */
  getSearchStatistics(): {
    totalIndexedContent: number;
    totalSearches: number;
    totalRecommendations: number;
    uniqueUsers: number;
  } {
    return {
      totalIndexedContent: this.searchIndex.size,
      totalSearches: 0, // Would be tracked in production
      totalRecommendations: 0, // Would be tracked in production
      uniqueUsers: this.userPreferences.size,
    };
  }
}

// Export singleton instance
export const searchRecommendationEngine = new SearchRecommendationEngine();
