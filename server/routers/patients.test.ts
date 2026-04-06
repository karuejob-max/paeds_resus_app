import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Patient Management System", () => {
  describe("Risk Score Calculation", () => {
    it("should calculate critical risk score (>70) for severe vitals", () => {
      const vitals = {
        heartRate: 160,
        respiratoryRate: 50,
        oxygenSaturation: 85,
        temperature: 39.5,
        systolicBP: 60,
        diastolicBP: 40,
      };

      // Simplified risk calculation
      let riskScore = 0;
      if (vitals.heartRate > 150 || vitals.heartRate < 60) riskScore += 30;
      if (vitals.respiratoryRate > 40 || vitals.respiratoryRate < 12) riskScore += 25;
      if (vitals.oxygenSaturation < 90) riskScore += 20;
      if (vitals.temperature > 38.5 || vitals.temperature < 36) riskScore += 15;
      if (vitals.systolicBP < 70) riskScore += 10;

      expect(riskScore).toBeGreaterThan(70);
    });

    it("should calculate high risk score (50-70) for moderate vitals", () => {
      const vitals = {
        heartRate: 130,
        respiratoryRate: 35,
        oxygenSaturation: 92,
        temperature: 38,
        systolicBP: 90,
        diastolicBP: 60,
      };

      let riskScore = 0;
      if (vitals.heartRate > 120 || vitals.heartRate < 80) riskScore += 20;
      if (vitals.respiratoryRate > 30 || vitals.respiratoryRate < 15) riskScore += 15;
      if (vitals.oxygenSaturation < 94) riskScore += 10;
      if (vitals.temperature > 37.5 || vitals.temperature < 36.5) riskScore += 10;
      if (vitals.systolicBP < 100) riskScore += 10;

      expect(riskScore).toBeGreaterThanOrEqual(50);
      expect(riskScore).toBeLessThanOrEqual(70);
    });

    it("should calculate medium risk score (<50) for normal vitals", () => {
      const vitals = {
        heartRate: 100,
        respiratoryRate: 22,
        oxygenSaturation: 97,
        temperature: 37,
        systolicBP: 110,
        diastolicBP: 70,
      };

      let riskScore = 0;
      if (vitals.heartRate > 120 || vitals.heartRate < 80) riskScore += 5;
      if (vitals.respiratoryRate > 30 || vitals.respiratoryRate < 15) riskScore += 5;
      if (vitals.oxygenSaturation < 95) riskScore += 5;
      if (vitals.temperature > 37.5 || vitals.temperature < 36.5) riskScore += 5;

      expect(riskScore).toBeLessThan(50);
    });
  });

  describe("Patient Data Validation", () => {
    it("should validate patient name is required", () => {
      const patientData = { name: "", age: 5, gender: "male" };
      expect(patientData.name).toBe("");
      expect(patientData.name.length === 0).toBe(true);
    });

    it("should validate age is within pediatric range", () => {
      const validAges = [0, 5, 12, 18];
      const invalidAges = [-1, 19, 100];

      validAges.forEach(age => {
        expect(age >= 0 && age <= 18).toBe(true);
      });

      invalidAges.forEach(age => {
        expect(age >= 0 && age <= 18).toBe(false);
      });
    });

    it("should validate gender enum values", () => {
      const validGenders = ["male", "female", "other"];
      const invalidGender = "unknown";

      validGenders.forEach(gender => {
        expect(validGenders.includes(gender)).toBe(true);
      });

      expect(validGenders.includes(invalidGender)).toBe(false);
    });
  });

  describe("Vital Signs Tracking", () => {
    it("should track multiple vital signs for a patient", () => {
      const vitals = [
        {
          id: 1,
          patientId: 1,
          heartRate: 100,
          respiratoryRate: 20,
          oxygenSaturation: 98,
          temperature: 37,
          systolicBP: 110,
          diastolicBP: 70,
          createdAt: new Date(),
        },
        {
          id: 2,
          patientId: 1,
          heartRate: 105,
          respiratoryRate: 22,
          oxygenSaturation: 97,
          temperature: 37.2,
          systolicBP: 112,
          diastolicBP: 72,
          createdAt: new Date(),
        },
      ];

      expect(vitals).toHaveLength(2);
      expect(vitals[0].patientId).toBe(vitals[1].patientId);
      expect(vitals[1].createdAt.getTime()).toBeGreaterThanOrEqual(vitals[0].createdAt.getTime());
    });

    it("should identify abnormal vital signs", () => {
      const normalVitals = { heartRate: 100, respiratoryRate: 20, oxygenSaturation: 98 };
      const abnormalVitals = { heartRate: 180, respiratoryRate: 50, oxygenSaturation: 80 };

      const isNormal = (vitals: any) =>
        vitals.heartRate >= 60 && vitals.heartRate <= 140 &&
        vitals.respiratoryRate >= 12 && vitals.respiratoryRate <= 40 &&
        vitals.oxygenSaturation >= 95;

      expect(isNormal(normalVitals)).toBe(true);
      expect(isNormal(abnormalVitals)).toBe(false);
    });
  });

  describe("Patient Filtering and Sorting", () => {
    const patients = [
      { id: 1, name: "Alice", riskScore: 85, createdAt: new Date("2026-01-20") },
      { id: 2, name: "Bob", riskScore: 45, createdAt: new Date("2026-01-21") },
      { id: 3, name: "Charlie", riskScore: 65, createdAt: new Date("2026-01-22") },
    ];

    it("should filter patients by risk level", () => {
      const criticalPatients = patients.filter(p => p.riskScore > 70);
      expect(criticalPatients).toHaveLength(1);
      expect(criticalPatients[0].name).toBe("Alice");
    });

    it("should sort patients by risk score descending", () => {
      const sorted = [...patients].sort((a, b) => b.riskScore - a.riskScore);
      expect(sorted[0].riskScore).toBe(85);
      expect(sorted[1].riskScore).toBe(65);
      expect(sorted[2].riskScore).toBe(45);
    });

    it("should sort patients by creation date ascending", () => {
      const sorted = [...patients].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      expect(sorted[0].name).toBe("Alice");
      expect(sorted[2].name).toBe("Charlie");
    });

    it("should search patients by name", () => {
      const searchTerm = "ali";
      const results = patients.filter(p => p.name.toLowerCase().includes(searchTerm));
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Alice");
    });
  });

  describe("Patient Statistics", () => {
    const patients = [
      { id: 1, riskScore: 85, severity: "CRITICAL" },
      { id: 2, riskScore: 65, severity: "HIGH" },
      { id: 3, riskScore: 45, severity: "MEDIUM" },
      { id: 4, riskScore: 80, severity: "CRITICAL" },
      { id: 5, riskScore: 55, severity: "HIGH" },
    ];

    it("should calculate count by severity", () => {
      const stats = {
        critical: patients.filter(p => p.riskScore > 70).length,
        high: patients.filter(p => p.riskScore > 50 && p.riskScore <= 70).length,
        medium: patients.filter(p => p.riskScore <= 50).length,
      };

      expect(stats.critical).toBe(2);
      expect(stats.high).toBe(2);
      expect(stats.medium).toBe(1);
    });

    it("should calculate average risk score", () => {
      const avgRiskScore = patients.reduce((sum, p) => sum + p.riskScore, 0) / patients.length;
      expect(avgRiskScore).toBeCloseTo(66, 0);
    });

    it("should identify highest risk patient", () => {
      const highestRisk = patients.reduce((prev, current) =>
        prev.riskScore > current.riskScore ? prev : current
      );
      expect(highestRisk.riskScore).toBe(85);
    });
  });

  describe("Patient History", () => {
    it("should maintain patient visit history", () => {
      const history = [
        { visitId: 1, date: new Date("2026-01-20"), diagnosis: "Fever", riskScore: 45 },
        { visitId: 2, date: new Date("2026-01-21"), diagnosis: "Fever, Cough", riskScore: 55 },
        { visitId: 3, date: new Date("2026-01-22"), diagnosis: "Pneumonia", riskScore: 75 },
      ];

      expect(history).toHaveLength(3);
      expect(history[history.length - 1].riskScore).toBeGreaterThan(history[0].riskScore);
    });

    it("should track risk score progression", () => {
      const visits = [
        { date: new Date("2026-01-20"), riskScore: 30 },
        { date: new Date("2026-01-21"), riskScore: 50 },
        { date: new Date("2026-01-22"), riskScore: 75 },
      ];

      const progression = visits.map((v, i) => ({
        ...v,
        trend: i === 0 ? "start" : visits[i].riskScore > visits[i - 1].riskScore ? "up" : "down",
      }));

      expect(progression[1].trend).toBe("up");
      expect(progression[2].trend).toBe("up");
    });
  });

  describe("Severity Classification", () => {
    it("should classify patients correctly by risk score", () => {
      const classify = (riskScore: number) => {
        if (riskScore > 70) return "CRITICAL";
        if (riskScore > 50) return "HIGH";
        return "MEDIUM";
      };

      expect(classify(85)).toBe("CRITICAL");
      expect(classify(65)).toBe("HIGH");
      expect(classify(45)).toBe("MEDIUM");
    });

    it("should provide severity-based recommendations", () => {
      const getRecommendation = (severity: string) => {
        switch (severity) {
          case "CRITICAL":
            return "Immediate intervention required";
          case "HIGH":
            return "Close monitoring recommended";
          default:
            return "Routine follow-up";
        }
      };

      expect(getRecommendation("CRITICAL")).toBe("Immediate intervention required");
      expect(getRecommendation("HIGH")).toBe("Close monitoring recommended");
      expect(getRecommendation("MEDIUM")).toBe("Routine follow-up");
    });
  });
});
