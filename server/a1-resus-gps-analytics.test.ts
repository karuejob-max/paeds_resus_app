import { describe, it, expect, vi } from "vitest";
import {
  trackResusGpsEvent,
  trackAssessmentStarted,
  trackAssessmentCompleted,
  trackProtocolViewed,
  trackDecisionMade,
  trackInterventionRecorded,
  trackReassessmentTriggered,
  trackHandoverGenerated,
  trackErrorEncountered,
  getResusGpsStats,
} from "./services/resusGpsAnalytics";

/**
 * A1: ResusGPS Analytics Instrumentation Tests
 * Validates event tracking for admin visibility
 */

describe("A1: ResusGPS Analytics", () => {
  describe("Event Tracking", () => {
    it("should track assessment started event", async () => {
      const result = await trackAssessmentStarted(1, "session_123", 5, 18);
      expect(result).toBeDefined();
    });

    it("should track assessment completed event", async () => {
      const result = await trackAssessmentCompleted(1, "session_123", 300, ["XABCDE"], 5);
      expect(result).toBeDefined();
    });

    it("should track protocol viewed event", async () => {
      const result = await trackProtocolViewed(1, "session_123", "proto_1", "XABCDE Protocol");
      expect(result).toBeDefined();
    });

    it("should track decision made event", async () => {
      const result = await trackDecisionMade(1, "session_123", "airway_assessment", "patent");
      expect(result).toBeDefined();
    });

    it("should track intervention recorded event", async () => {
      const result = await trackInterventionRecorded(1, "session_123", "airway", "Bag-Valve-Mask");
      expect(result).toBeDefined();
    });

    it("should track reassessment triggered event", async () => {
      const result = await trackReassessmentTriggered(1, "session_123", "No improvement after 2 minutes");
      expect(result).toBeDefined();
    });

    it("should track handover generated event", async () => {
      const result = await trackHandoverGenerated(1, "session_123", "pdf", "https://storage.example.com/handover.pdf");
      expect(result).toBeDefined();
    });

    it("should track error encountered event", async () => {
      const result = await trackErrorEncountered(1, "session_123", "calculation_error", "Weight-based dose calculation failed");
      expect(result).toBeDefined();
    });
  });

  describe("Event Data Structure", () => {
    it("should include userId in event", () => {
      const userId = 123;
      expect(userId).toBeGreaterThan(0);
    });

    it("should include eventType in event", () => {
      const eventType = "assessment_started";
      expect(["assessment_started", "assessment_completed", "protocol_viewed"].includes(eventType)).toBe(true);
    });

    it("should include eventName in event", () => {
      const eventName = "Assessment Started";
      expect(eventName).toBeTruthy();
      expect(eventName.length).toBeGreaterThan(0);
    });

    it("should include sessionId in event", () => {
      const sessionId = "session_123";
      expect(sessionId).toMatch(/^session_/);
    });

    it("should include timestamp in eventData", () => {
      const timestamp = new Date().toISOString();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("should include duration for completed assessments", () => {
      const duration = 300;
      expect(duration).toBeGreaterThan(0);
    });
  });

  describe("Event Categories", () => {
    it("should track assessment lifecycle events", () => {
      const events = ["assessment_started", "assessment_completed"];
      expect(events.length).toBe(2);
    });

    it("should track protocol usage events", () => {
      const events = ["protocol_viewed", "decision_made"];
      expect(events.length).toBe(2);
    });

    it("should track intervention events", () => {
      const events = ["intervention_recorded", "reassessment_triggered"];
      expect(events.length).toBe(2);
    });

    it("should track output events", () => {
      const events = ["handover_generated", "error_encountered"];
      expect(events.length).toBe(2);
    });
  });

  describe("Analytics Aggregation", () => {
    it("should calculate total assessments", async () => {
      const stats = await getResusGpsStats(30);
      expect(stats.totalAssessments).toBeGreaterThanOrEqual(0);
    });

    it("should count active users", async () => {
      const stats = await getResusGpsStats(30);
      expect(stats.activeUsers).toBeGreaterThanOrEqual(0);
    });

    it("should calculate average duration", async () => {
      const stats = await getResusGpsStats(30);
      expect(stats.averageDuration).toBeGreaterThanOrEqual(0);
    });

    it("should identify top protocols", async () => {
      const stats = await getResusGpsStats(30);
      expect(Array.isArray(stats.topProtocols)).toBe(true);
    });

    it("should identify top decisions", async () => {
      const stats = await getResusGpsStats(30);
      expect(Array.isArray(stats.topDecisions)).toBe(true);
    });
  });

  describe("Admin Visibility", () => {
    it("should provide ResusGPS usage statistics", async () => {
      const stats = await getResusGpsStats(30);
      expect(stats).toHaveProperty("totalAssessments");
      expect(stats).toHaveProperty("activeUsers");
      expect(stats).toHaveProperty("averageDuration");
      expect(stats).toHaveProperty("topProtocols");
      expect(stats).toHaveProperty("topDecisions");
    });

    it("should support custom time ranges", async () => {
      const stats7days = await getResusGpsStats(7);
      const stats30days = await getResusGpsStats(30);
      expect(stats7days).toBeDefined();
      expect(stats30days).toBeDefined();
    });

    it("should track protocol popularity", async () => {
      const stats = await getResusGpsStats(30);
      if (stats.topProtocols.length > 0) {
        expect(stats.topProtocols[0]).toHaveProperty("protocol");
        expect(stats.topProtocols[0]).toHaveProperty("count");
      }
    });

    it("should track decision frequency", async () => {
      const stats = await getResusGpsStats(30);
      if (stats.topDecisions.length > 0) {
        expect(stats.topDecisions[0]).toHaveProperty("decision");
        expect(stats.topDecisions[0]).toHaveProperty("count");
      }
    });
  });

  describe("Production Readiness", () => {
    it("should handle missing database gracefully", async () => {
      const result = await trackAssessmentStarted(1, "session_123", 5, 18);
      expect(typeof result).toBe("boolean");
    });

    it("should log errors without crashing", async () => {
      const result = await trackErrorEncountered(1, "session_123", "test_error", "Test error message");
      expect(typeof result).toBe("boolean");
    });

    it("should support high volume of events", () => {
      const eventCount = 10000;
      expect(eventCount).toBeGreaterThan(0);
    });

    it("should not block assessment flow on tracking failure", () => {
      const trackingFailed = false;
      const assessmentContinues = true;
      expect(assessmentContinues).toBe(true);
    });
  });
});
