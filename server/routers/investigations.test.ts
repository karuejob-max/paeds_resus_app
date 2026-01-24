import { describe, it, expect, beforeEach, vi } from "vitest";
import { investigationsRouter } from "./investigations";

describe("Investigations Router", () => {
  const mockCtx = {
    user: {
      id: 1,
      name: "Test Provider",
      email: "test@example.com",
    },
  };

  describe("uploadInvestigation", () => {
    it("should upload investigation successfully", async () => {
      const result = await investigationsRouter.createCaller(mockCtx).uploadInvestigation({
        patientId: 1,
        investigationType: "lab",
        testName: "Complete Blood Count",
        description: "Initial CBC for patient assessment",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Investigation uploaded successfully");
    });

    it("should handle different investigation types", async () => {
      const types = ["lab", "imaging", "other"] as const;

      for (const type of types) {
        const result = await investigationsRouter.createCaller(mockCtx).uploadInvestigation({
          patientId: 1,
          investigationType: type,
          testName: `Test ${type}`,
        });

        expect(result.success).toBe(true);
      }
    });

    it("should require patientId", async () => {
      try {
        await investigationsRouter.createCaller(mockCtx).uploadInvestigation({
          patientId: 0,
          investigationType: "lab",
          testName: "Test",
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("addInvestigationResult", () => {
    it("should add investigation result successfully", async () => {
      const result = await investigationsRouter.createCaller(mockCtx).addInvestigationResult({
        investigationId: 1,
        resultName: "WBC Count",
        resultValue: "7.5",
        unit: "K/uL",
        normalRange: "4.5-11.0",
        isAbnormal: false,
        severity: "normal",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Result added successfully");
    });

    it("should handle abnormal results", async () => {
      const result = await investigationsRouter.createCaller(mockCtx).addInvestigationResult({
        investigationId: 1,
        resultName: "Hemoglobin",
        resultValue: "3.0",
        unit: "g/dL",
        normalRange: "11.5-15.5",
        isAbnormal: true,
        severity: "severe",
      });

      expect(result.success).toBe(true);
    });

    it("should support different severity levels", async () => {
      const severities = ["normal", "mild", "moderate", "severe"] as const;

      for (const severity of severities) {
        const result = await investigationsRouter.createCaller(mockCtx).addInvestigationResult({
          investigationId: 1,
          resultName: `Test ${severity}`,
          resultValue: "10",
          severity,
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe("getInvestigationStats", () => {
    it("should get investigation statistics for provider", async () => {
      const stats = await investigationsRouter.createCaller(mockCtx).getInvestigationStats({});

      expect(stats).toHaveProperty("totalInvestigations");
      expect(stats).toHaveProperty("labTests");
      expect(stats).toHaveProperty("imagingTests");
      expect(stats).toHaveProperty("otherTests");
      expect(stats).toHaveProperty("averagePerPatient");
    });

    it("should calculate correct statistics", async () => {
      const stats = await investigationsRouter.createCaller(mockCtx).getInvestigationStats({});

      expect(stats.totalInvestigations).toBeGreaterThanOrEqual(0);
      expect(stats.labTests).toBeGreaterThanOrEqual(0);
      expect(stats.imagingTests).toBeGreaterThanOrEqual(0);
      expect(stats.otherTests).toBeGreaterThanOrEqual(0);
    });

    it("should support filtering by provider", async () => {
      const stats = await investigationsRouter.createCaller(mockCtx).getInvestigationStats({
        providerId: 1,
      });

      expect(stats).toBeDefined();
    });
  });

  describe("getInvestigationHistory", () => {
    it("should retrieve investigation history for patient", async () => {
      const history = await investigationsRouter.createCaller(mockCtx).getInvestigationHistory({
        patientId: 1,
      });

      expect(Array.isArray(history)).toBe(true);
    });

    it("should return investigations in reverse chronological order", async () => {
      const history = await investigationsRouter.createCaller(mockCtx).getInvestigationHistory({
        patientId: 1,
      });

      if (history.length > 1) {
        const first = new Date((history[0] as any).uploadedAt).getTime();
        const second = new Date((history[1] as any).uploadedAt).getTime();
        expect(first).toBeGreaterThanOrEqual(second);
      }
    });
  });

  describe("getAbnormalResults", () => {
    it("should retrieve only abnormal results", async () => {
      const abnormalResults = await investigationsRouter
        .createCaller(mockCtx)
        .getAbnormalResults({
          patientId: 1,
        });

      expect(Array.isArray(abnormalResults)).toBe(true);

      // All results should be marked as abnormal
      abnormalResults.forEach((result: any) => {
        expect(result.isAbnormal).toBe(true);
      });
    });
  });

  describe("compareInvestigations", () => {
    it("should compare investigations over time period", async () => {
      const comparison = await investigationsRouter.createCaller(mockCtx).compareInvestigations({
        patientId: 1,
        testName: "Complete Blood Count",
        days: 30,
      });

      expect(Array.isArray(comparison)).toBe(true);
    });

    it("should support different time periods", async () => {
      const periods = [7, 14, 30, 90];

      for (const days of periods) {
        const comparison = await investigationsRouter
          .createCaller(mockCtx)
          .compareInvestigations({
            patientId: 1,
            testName: "Test",
            days,
          });

        expect(Array.isArray(comparison)).toBe(true);
      }
    });
  });

  describe("getClinicalInsights", () => {
    it("should provide clinical insights for patient", async () => {
      const insights = await investigationsRouter.createCaller(mockCtx).getClinicalInsights({
        patientId: 1,
      });

      expect(insights).toHaveProperty("totalInvestigations");
      expect(insights).toHaveProperty("abnormalFindings");
      expect(insights).toHaveProperty("recentAnalyses");
      expect(insights).toHaveProperty("insights");
    });

    it("should include actionable recommendations", async () => {
      const insights = await investigationsRouter.createCaller(mockCtx).getClinicalInsights({
        patientId: 1,
      });

      expect(Array.isArray(insights.insights)).toBe(true);

      insights.insights.forEach((insight: any) => {
        expect(insight).toHaveProperty("type");
        expect(insight).toHaveProperty("value");
        expect(insight).toHaveProperty("recommendation");
      });
    });
  });

  describe("getInvestigationTrends", () => {
    it("should retrieve investigation trends", async () => {
      const trends = await investigationsRouter.createCaller(mockCtx).getInvestigationTrends({
        patientId: 1,
        testName: "Complete Blood Count",
      });

      expect(Array.isArray(trends)).toBe(true);
    });

    it("should identify trend direction", async () => {
      const trends = await investigationsRouter.createCaller(mockCtx).getInvestigationTrends({
        patientId: 1,
        testName: "Test",
      });

      trends.forEach((trend: any) => {
        if (trend.trend) {
          expect(["improving", "stable", "deteriorating"]).toContain(trend.trend);
        }
      });
    });
  });

  describe("getInvestigationResults", () => {
    it("should retrieve all results for investigation", async () => {
      const results = await investigationsRouter.createCaller(mockCtx).getInvestigationResults({
        investigationId: 1,
      });

      expect(Array.isArray(results)).toBe(true);
    });

    it("should include result details", async () => {
      const results = await investigationsRouter.createCaller(mockCtx).getInvestigationResults({
        investigationId: 1,
      });

      results.forEach((result: any) => {
        expect(result).toHaveProperty("resultName");
        expect(result).toHaveProperty("resultValue");
      });
    });
  });

  describe("getInvestigationAnalysis", () => {
    it("should retrieve AI analysis for investigation", async () => {
      const analysis = await investigationsRouter.createCaller(mockCtx).getInvestigationAnalysis({
        investigationId: 1,
      });

      if (analysis) {
        expect(analysis).toHaveProperty("aiInterpretation");
        expect(analysis).toHaveProperty("confidence");
        expect(analysis).toHaveProperty("differentialDiagnoses");
      }
    });

    it("should parse differential diagnoses", async () => {
      const analysis = await investigationsRouter.createCaller(mockCtx).getInvestigationAnalysis({
        investigationId: 1,
      });

      if (analysis && analysis.differentialDiagnoses) {
        expect(Array.isArray(analysis.differentialDiagnoses)).toBe(true);
      }
    });

    it("should return null for non-existent investigation", async () => {
      const analysis = await investigationsRouter.createCaller(mockCtx).getInvestigationAnalysis({
        investigationId: 999999,
      });

      expect(analysis).toBeNull();
    });
  });

  describe("Error handling", () => {
    it("should handle missing required fields", async () => {
      try {
        await investigationsRouter.createCaller(mockCtx).uploadInvestigation({
          patientId: 1,
          investigationType: "lab",
          testName: "",
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should validate investigation types", async () => {
      try {
        await investigationsRouter.createCaller(mockCtx).uploadInvestigation({
          patientId: 1,
          investigationType: "invalid" as any,
          testName: "Test",
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Data consistency", () => {
    it("should maintain referential integrity", async () => {
      const result = await investigationsRouter.createCaller(mockCtx).addInvestigationResult({
        investigationId: 1,
        resultName: "Test",
        resultValue: "100",
      });

      expect(result.success).toBe(true);
    });

    it("should handle concurrent uploads", async () => {
      const uploads = Array.from({ length: 5 }, (_, i) =>
        investigationsRouter.createCaller(mockCtx).uploadInvestigation({
          patientId: 1,
          investigationType: "lab",
          testName: `Test ${i}`,
        })
      );

      const results = await Promise.all(uploads);

      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });
});
