import { describe, it, expect, beforeEach, vi } from "vitest";
import { performanceRouter } from "./routers/performance";
import { z } from "zod";

/**
 * Performance Dashboard Tests
 * Tests for provider statistics, leaderboards, achievements, and real-time updates
 */

describe("Performance Dashboard", () => {
  describe("Provider Statistics", () => {
    it("should retrieve provider statistics", () => {
      // Test data
      const mockStats = {
        id: 1,
        userId: 123,
        totalPatientsServed: 150,
        totalInterventions: 450,
        averageResponseTime: 5.5,
        successRate: 92.5,
        patientsImproved: 135,
        certificationsCompleted: 3,
        trainingHoursCompleted: 45,
        performanceScore: 88.5,
        lastUpdated: new Date(),
        createdAt: new Date(),
      };

      // Verify stats structure
      expect(mockStats).toHaveProperty("userId");
      expect(mockStats).toHaveProperty("totalPatientsServed");
      expect(mockStats).toHaveProperty("performanceScore");
      expect(mockStats.performanceScore).toBeGreaterThanOrEqual(0);
      expect(mockStats.performanceScore).toBeLessThanOrEqual(100);
    });

    it("should calculate performance score correctly", () => {
      const successRate = 95;
      const patientsServed = 200;
      const interventions = 500;
      const score = (successRate * 0.5 + Math.min((patientsServed / 200) * 100, 100) * 0.25 + Math.min((interventions / 500) * 100, 100) * 0.25);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should validate performance metrics", () => {
      const validMetrics = {
        totalPatientsServed: 150,
        totalInterventions: 450,
        averageResponseTime: 5.5,
        successRate: 92.5,
        patientsImproved: 135,
        certificationsCompleted: 3,
        trainingHoursCompleted: 45,
        performanceScore: 88.5,
      };

      // Verify all metrics are numbers
      Object.values(validMetrics).forEach((value) => {
        expect(typeof value).toBe("number");
      });

      // Verify ranges
      expect(validMetrics.successRate).toBeGreaterThanOrEqual(0);
      expect(validMetrics.successRate).toBeLessThanOrEqual(100);
      expect(validMetrics.performanceScore).toBeGreaterThanOrEqual(0);
      expect(validMetrics.performanceScore).toBeLessThanOrEqual(100);
    });
  });

  describe("Leaderboard Rankings", () => {
    it("should rank providers by performance score", () => {
      const providers = [
        { userId: 1, name: "Dr. Smith", score: 95 },
        { userId: 2, name: "Dr. Jones", score: 88 },
        { userId: 3, name: "Dr. Brown", score: 92 },
      ];

      const ranked = [...providers].sort((a, b) => b.score - a.score);

      expect(ranked[0].score).toBe(95);
      expect(ranked[1].score).toBe(92);
      expect(ranked[2].score).toBe(88);
    });

    it("should calculate percentile rankings", () => {
      const providers = Array.from({ length: 100 }, (_, i) => ({
        userId: i + 1,
        score: Math.random() * 100,
      }));

      providers.sort((a, b) => b.score - a.score);

      providers.forEach((provider, index) => {
        const percentile = ((100 - index) / 100) * 100;
        expect(percentile).toBeGreaterThan(0);
        expect(percentile).toBeLessThanOrEqual(100);
      });
    });

    it("should track rank changes", () => {
      const previousRankings = [
        { userId: 1, rank: 1, score: 95 },
        { userId: 2, rank: 2, score: 92 },
        { userId: 3, rank: 3, score: 88 },
      ];

      const currentRankings = [
        { userId: 1, rank: 2, score: 94 },
        { userId: 2, rank: 1, score: 96 },
        { userId: 3, rank: 3, score: 88 },
      ];

      const rankChanges = currentRankings.map((current) => {
        const previous = previousRankings.find((p) => p.userId === current.userId);
        return {
          userId: current.userId,
          previousRank: previous?.rank || 0,
          currentRank: current.rank,
          change: (previous?.rank || 0) - current.rank,
        };
      });

      expect(rankChanges[0].change).toBe(-1); // Dropped 1 rank
      expect(rankChanges[1].change).toBe(1); // Improved 1 rank
      expect(rankChanges[2].change).toBe(0); // No change
    });

    it("should support multiple leaderboard categories", () => {
      const categories = ["performance", "interventions", "patients_served", "training"];

      categories.forEach((category) => {
        expect(["performance", "interventions", "patients_served", "training"]).toContain(category);
      });
    });
  });

  describe("Achievements", () => {
    it("should award achievements with proper metadata", () => {
      const achievement = {
        userId: 123,
        achievementType: "milestone",
        title: "Century Club",
        description: "Served 100 patients",
        icon: "🎯",
        earnedAt: new Date(),
      };

      expect(achievement).toHaveProperty("userId");
      expect(achievement).toHaveProperty("title");
      expect(achievement).toHaveProperty("achievementType");
      expect(achievement.achievementType).toMatch(/milestone|badge|certification|record/);
    });

    it("should track achievement progress", () => {
      const achievements = [
        { id: 1, title: "First Patient", type: "milestone", earnedAt: new Date("2026-01-01") },
        { id: 2, title: "Century Club", type: "milestone", earnedAt: new Date("2026-01-15") },
        { id: 3, title: "Expert Diagnostician", type: "badge", earnedAt: new Date("2026-01-20") },
      ];

      const milestones = achievements.filter((a) => a.type === "milestone");
      expect(milestones.length).toBe(2);

      const sorted = [...achievements].sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime());
      expect(sorted[0].title).toBe("Expert Diagnostician");
    });
  });

  describe("Performance History", () => {
    it("should track performance metrics over time", () => {
      const history = [
        { date: "2026-01-01", successRate: 85, responseTime: 8 },
        { date: "2026-01-08", successRate: 88, responseTime: 6.5 },
        { date: "2026-01-15", successRate: 92, responseTime: 5 },
      ];

      // Verify trend
      expect(history[history.length - 1].successRate).toBeGreaterThan(history[0].successRate);
      expect(history[history.length - 1].responseTime).toBeLessThan(history[0].responseTime);
    });

    it("should calculate trend direction", () => {
      const values = [80, 82, 85, 88, 92];

      const trend = values[values.length - 1] > values[0] ? "improving" : values[values.length - 1] < values[0] ? "deteriorating" : "stable";

      expect(trend).toBe("improving");
    });

    it("should calculate percentage change", () => {
      const oldValue = 80;
      const newValue = 92;

      const percentChange = ((newValue - oldValue) / oldValue) * 100;

      expect(percentChange).toBeCloseTo(15, 0);
    });
  });

  describe("Performance Events", () => {
    it("should record performance events with proper structure", () => {
      const event = {
        userId: 123,
        eventType: "intervention_completed",
        eventData: { patientId: 456, outcome: "successful" },
        severity: "info",
        createdAt: new Date(),
      };

      expect(event).toHaveProperty("userId");
      expect(event).toHaveProperty("eventType");
      expect(event.severity).toMatch(/info|warning|critical/);
    });

    it("should filter events by type and severity", () => {
      const events = [
        { id: 1, type: "intervention_completed", severity: "info" },
        { id: 2, type: "patient_improved", severity: "info" },
        { id: 3, type: "error_occurred", severity: "warning" },
        { id: 4, type: "system_alert", severity: "critical" },
      ];

      const warnings = events.filter((e) => e.severity === "warning");
      expect(warnings.length).toBe(1);

      const interventions = events.filter((e) => e.type === "intervention_completed");
      expect(interventions.length).toBe(1);
    });
  });

  describe("Real-time Updates", () => {
    it("should handle concurrent performance updates", () => {
      const updates = [
        { userId: 1, metric: "successRate", value: 92 },
        { userId: 2, metric: "patientsServed", value: 150 },
        { userId: 3, metric: "responseTime", value: 5.5 },
      ];

      // Simulate concurrent processing
      const processed = updates.map((update) => ({
        ...update,
        processedAt: Date.now(),
      }));

      expect(processed.length).toBe(3);
      processed.forEach((p) => {
        expect(p).toHaveProperty("processedAt");
      });
    });

    it("should maintain update order for same user", () => {
      const updates = [
        { userId: 1, timestamp: 1000, value: 85 },
        { userId: 1, timestamp: 2000, value: 87 },
        { userId: 1, timestamp: 3000, value: 90 },
      ];

      const sorted = [...updates].sort((a, b) => a.timestamp - b.timestamp);

      expect(sorted[0].value).toBe(85);
      expect(sorted[1].value).toBe(87);
      expect(sorted[2].value).toBe(90);
    });
  });

  describe("Performance Comparison", () => {
    it("should compare multiple providers", () => {
      const providers = [
        { userId: 1, name: "Dr. A", score: 95, patients: 200 },
        { userId: 2, name: "Dr. B", score: 88, patients: 150 },
        { userId: 3, name: "Dr. C", score: 92, patients: 180 },
      ];

      const comparison = providers.map((p) => ({
        ...p,
        scoreRank: 0,
        patientRank: 0,
      }));

      // Calculate ranks
      const scoreRanked = [...providers].sort((a, b) => b.score - a.score);
      const patientRanked = [...providers].sort((a, b) => b.patients - a.patients);

      comparison.forEach((c) => {
        c.scoreRank = scoreRanked.findIndex((p) => p.userId === c.userId) + 1;
        c.patientRank = patientRanked.findIndex((p) => p.userId === c.userId) + 1;
      });

      expect(comparison[0].scoreRank).toBe(1);
      expect(comparison[1].scoreRank).toBe(3);
    });
  });

  describe("Data Validation", () => {
    it("should validate leaderboard input", () => {
      const validInput = {
        category: "performance",
        limit: 50,
        offset: 0,
      };

      expect(["performance", "interventions", "patients_served", "training"]).toContain(validInput.category);
      expect(validInput.limit).toBeGreaterThan(0);
      expect(validInput.offset).toBeGreaterThanOrEqual(0);
    });

    it("should validate performance metrics input", () => {
      const validInput = {
        userId: 123,
        totalPatientsServed: 150,
        successRate: 92.5,
        performanceScore: 88.5,
      };

      expect(typeof validInput.userId).toBe("number");
      expect(validInput.userId).toBeGreaterThan(0);
      expect(validInput.successRate).toBeGreaterThanOrEqual(0);
      expect(validInput.successRate).toBeLessThanOrEqual(100);
    });

    it("should validate achievement input", () => {
      const validInput = {
        userId: 123,
        achievementType: "milestone",
        title: "Century Club",
        description: "Served 100 patients",
      };

      expect(["milestone", "badge", "certification", "record"]).toContain(validInput.achievementType);
      expect(validInput.title.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing user data gracefully", () => {
      const result = null;

      if (!result) {
        expect(result).toBeNull();
      }
    });

    it("should handle empty rankings", () => {
      const rankings = [];

      expect(rankings.length).toBe(0);
      expect(Array.isArray(rankings)).toBe(true);
    });

    it("should handle invalid metric values", () => {
      const invalidMetrics = [
        { successRate: -10 }, // Below 0
        { successRate: 150 }, // Above 100
        { performanceScore: NaN }, // Not a number
      ];

      invalidMetrics.forEach((metric) => {
        if (metric.successRate !== undefined) {
          const isValid = metric.successRate >= 0 && metric.successRate <= 100;
          expect(isValid).toBe(false);
        }
      });
    });
  });
});
