/**
 * Advanced Stakeholder Personalization Engine
 * Customizes experience for healthcare providers, institutions, parents, and learners
 */

export type StakeholderType = "healthcare_provider" | "institution" | "parent" | "learner" | "admin";

export interface StakeholderProfile {
  userId: number;
  stakeholderType: StakeholderType;
  preferences: {
    language: string;
    timezone: string;
    emailFrequency: "daily" | "weekly" | "monthly" | "never";
    notificationChannels: ("email" | "sms" | "push")[];
    darkMode: boolean;
    contentLevel: "beginner" | "intermediate" | "advanced";
  };
  interests: string[];
  learningGoals: string[];
  specializations: string[];
  experience: {
    yearsInField: number;
    certifications: string[];
    trainingCompleted: string[];
  };
  metadata: Record<string, unknown>;
}

export interface PersonalizationRecommendation {
  type: "course" | "resource" | "event" | "community" | "mentor";
  title: string;
  description: string;
  relevanceScore: number; // 0-100
  reason: string;
  actionUrl: string;
}

export interface DashboardWidget {
  id: string;
  type: "progress" | "upcoming" | "recommendations" | "achievements" | "community" | "resources";
  title: string;
  content: unknown;
  position: number;
  isVisible: boolean;
}

class PersonalizationEngine {
  private profiles: Map<number, StakeholderProfile> = new Map();
  private recommendations: Map<number, PersonalizationRecommendation[]> = new Map();
  private dashboards: Map<number, DashboardWidget[]> = new Map();

  /**
   * Create or update stakeholder profile
   */
  upsertProfile(userId: number, profile: StakeholderProfile): StakeholderProfile {
    this.profiles.set(userId, profile);
    this.generateRecommendations(userId);
    this.generateDashboard(userId);
    return profile;
  }

  /**
   * Get stakeholder profile
   */
  getProfile(userId: number): StakeholderProfile | null {
    return this.profiles.get(userId) || null;
  }

  /**
   * Update preferences
   */
  updatePreferences(userId: number, preferences: Partial<StakeholderProfile["preferences"]>): boolean {
    const profile = this.profiles.get(userId);
    if (!profile) return false;

    profile.preferences = { ...profile.preferences, ...preferences };
    this.profiles.set(userId, profile);
    return true;
  }

  /**
   * Add interest
   */
  addInterest(userId: number, interest: string): boolean {
    const profile = this.profiles.get(userId);
    if (!profile) return false;

    if (!profile.interests.includes(interest)) {
      profile.interests.push(interest);
      this.profiles.set(userId, profile);
      this.generateRecommendations(userId);
    }

    return true;
  }

  /**
   * Remove interest
   */
  removeInterest(userId: number, interest: string): boolean {
    const profile = this.profiles.get(userId);
    if (!profile) return false;

    profile.interests = profile.interests.filter((i) => i !== interest);
    this.profiles.set(userId, profile);
    this.generateRecommendations(userId);

    return true;
  }

  /**
   * Add learning goal
   */
  addLearningGoal(userId: number, goal: string): boolean {
    const profile = this.profiles.get(userId);
    if (!profile) return false;

    if (!profile.learningGoals.includes(goal)) {
      profile.learningGoals.push(goal);
      this.profiles.set(userId, profile);
      this.generateRecommendations(userId);
    }

    return true;
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(userId: number): void {
    const profile = this.profiles.get(userId);
    if (!profile) return;

    const recommendations: PersonalizationRecommendation[] = [];

    // Healthcare Provider Recommendations
    if (profile.stakeholderType === "healthcare_provider") {
      if (profile.interests.includes("ACLS")) {
        recommendations.push({
          type: "course",
          title: "Advanced Cardiac Life Support (ACLS) Certification",
          description: "Master advanced cardiac resuscitation techniques",
          relevanceScore: 95,
          reason: "Based on your interest in ACLS",
          actionUrl: "/courses/acls",
        });
      }

      if (profile.experience.yearsInField < 5) {
        recommendations.push({
          type: "resource",
          title: "Pediatric Resuscitation Fundamentals",
          description: "Essential guide for new healthcare providers",
          relevanceScore: 90,
          reason: "Recommended for providers with less than 5 years experience",
          actionUrl: "/resources/fundamentals",
        });
      }

      recommendations.push({
        type: "community",
        title: "Healthcare Providers Network",
        description: "Connect with peers and share best practices",
        relevanceScore: 80,
        reason: "Join your professional community",
        actionUrl: "/community/providers",
      });
    }

    // Institution Recommendations
    if (profile.stakeholderType === "institution") {
      recommendations.push({
        type: "event",
        title: "Institutional Training Program Setup",
        description: "Learn how to establish a comprehensive training program",
        relevanceScore: 95,
        reason: "Perfect for institutional administrators",
        actionUrl: "/events/institutional-setup",
      });

      recommendations.push({
        type: "resource",
        title: "Bulk Training Discount Program",
        description: "Save up to 40% on training for your staff",
        relevanceScore: 85,
        reason: "Cost-effective training for your institution",
        actionUrl: "/pricing/institutional",
      });
    }

    // Parent Recommendations
    if (profile.stakeholderType === "parent") {
      recommendations.push({
        type: "course",
        title: "First Aid for Parents",
        description: "Essential life-saving skills for parents and caregivers",
        relevanceScore: 95,
        reason: "Protect your children with essential first aid knowledge",
        actionUrl: "/courses/first-aid-parents",
      });

      recommendations.push({
        type: "resource",
        title: "Child Safety Guide",
        description: "Comprehensive guide to keeping children safe",
        relevanceScore: 90,
        reason: "Recommended for all parents",
        actionUrl: "/resources/child-safety",
      });

      recommendations.push({
        type: "community",
        title: "Parents Support Group",
        description: "Connect with other parents and share experiences",
        relevanceScore: 75,
        reason: "Join a supportive community of parents",
        actionUrl: "/community/parents",
      });
    }

    // Learner Recommendations
    if (profile.stakeholderType === "learner") {
      if (profile.preferences.contentLevel === "beginner") {
        recommendations.push({
          type: "course",
          title: "BLS Fundamentals",
          description: "Start your resuscitation journey",
          relevanceScore: 95,
          reason: "Perfect starting point for beginners",
          actionUrl: "/courses/bls-fundamentals",
        });
      } else if (profile.preferences.contentLevel === "intermediate") {
        recommendations.push({
          type: "course",
          title: "PALS - Pediatric Advanced Life Support",
          description: "Advance your pediatric resuscitation skills",
          relevanceScore: 95,
          reason: "Next step after BLS",
          actionUrl: "/courses/pals",
        });
      }

      recommendations.push({
        type: "mentor",
        title: "Find a Mentor",
        description: "Get personalized guidance from experienced professionals",
        relevanceScore: 85,
        reason: "Accelerate your learning with mentorship",
        actionUrl: "/mentorship",
      });
    }

    // Sort by relevance score
    recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

    this.recommendations.set(userId, recommendations.slice(0, 10));
  }

  /**
   * Get personalized recommendations
   */
  getRecommendations(userId: number, limit: number = 5): PersonalizationRecommendation[] {
    const recommendations = this.recommendations.get(userId) || [];
    return recommendations.slice(0, limit);
  }

  /**
   * Generate personalized dashboard
   */
  private generateDashboard(userId: number): void {
    const profile = this.profiles.get(userId);
    if (!profile) return;

    const widgets: DashboardWidget[] = [];

    // Common widgets for all stakeholders
    widgets.push({
      id: "progress",
      type: "progress",
      title: "Your Progress",
      content: {
        completedCourses: 3,
        inProgressCourses: 2,
        totalProgress: 45,
      },
      position: 1,
      isVisible: true,
    });

    widgets.push({
      id: "upcoming",
      type: "upcoming",
      title: "Upcoming Events",
      content: {
        events: [
          { title: "PALS Training", date: "2026-02-15", location: "Nairobi" },
          { title: "Webinar: New Protocols", date: "2026-02-20", time: "14:00" },
        ],
      },
      position: 2,
      isVisible: true,
    });

    widgets.push({
      id: "recommendations",
      type: "recommendations",
      title: "Recommended for You",
      content: {
        recommendations: this.getRecommendations(userId, 3),
      },
      position: 3,
      isVisible: true,
    });

    widgets.push({
      id: "achievements",
      type: "achievements",
      title: "Your Achievements",
      content: {
        badges: ["First Course", "100% Attendance", "Top Performer"],
        certificates: profile.experience.certifications,
      },
      position: 4,
      isVisible: true,
    });

    // Stakeholder-specific widgets
    if (profile.stakeholderType === "healthcare_provider") {
      widgets.push({
        id: "community",
        type: "community",
        title: "Provider Network",
        content: {
          peers: 234,
          discussions: 12,
          newPosts: 3,
        },
        position: 5,
        isVisible: true,
      });
    }

    if (profile.stakeholderType === "institution") {
      widgets.push({
        id: "resources",
        type: "resources",
        title: "Institutional Resources",
        content: {
          trainingMaterials: 45,
          certificates: 156,
          staffMembers: 23,
        },
        position: 5,
        isVisible: true,
      });
    }

    if (profile.stakeholderType === "learner") {
      widgets.push({
        id: "mentor",
        type: "community",
        title: "Your Mentor",
        content: {
          mentorName: "Dr. Jane Smith",
          nextSession: "2026-02-10",
          messagesUnread: 2,
        },
        position: 5,
        isVisible: true,
      });
    }

    this.dashboards.set(userId, widgets);
  }

  /**
   * Get personalized dashboard
   */
  getDashboard(userId: number): DashboardWidget[] {
    return this.dashboards.get(userId) || [];
  }

  /**
   * Update dashboard widget visibility
   */
  updateWidgetVisibility(userId: number, widgetId: string, isVisible: boolean): boolean {
    const widgets = this.dashboards.get(userId);
    if (!widgets) return false;

    const widget = widgets.find((w) => w.id === widgetId);
    if (widget) {
      widget.isVisible = isVisible;
      this.dashboards.set(userId, widgets);
      return true;
    }

    return false;
  }

  /**
   * Reorder dashboard widgets
   */
  reorderWidgets(userId: number, widgetIds: string[]): boolean {
    const widgets = this.dashboards.get(userId);
    if (!widgets) return false;

    const newWidgets: DashboardWidget[] = [];

    for (let i = 0; i < widgetIds.length; i++) {
      const widget = widgets.find((w) => w.id === widgetIds[i]);
      if (widget) {
        widget.position = i + 1;
        newWidgets.push(widget);
      }
    }

    if (newWidgets.length === widgetIds.length) {
      this.dashboards.set(userId, newWidgets);
      return true;
    }

    return false;
  }

  /**
   * Get personalization summary
   */
  getPersonalizationSummary(userId: number): {
    profile: StakeholderProfile | null;
    recommendations: PersonalizationRecommendation[];
    dashboardWidgets: number;
  } {
    return {
      profile: this.getProfile(userId),
      recommendations: this.getRecommendations(userId),
      dashboardWidgets: this.dashboards.get(userId)?.length || 0,
    };
  }
}

// Export singleton instance
export const personalizationEngine = new PersonalizationEngine();
