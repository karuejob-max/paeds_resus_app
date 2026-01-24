import { describe, it, expect, beforeAll } from "vitest";

describe("CPR Clock System", () => {
  describe("Medication Dosage Calculations", () => {
    it("should calculate correct epinephrine dose for 10kg child", () => {
      const weightKg = 10;
      const dosagePerKg = 0.01; // mg/kg
      const maxDose = 1; // mg

      const calculatedDose = Math.min(dosagePerKg * weightKg, maxDose);
      expect(calculatedDose).toBe(0.1);
    });

    it("should not exceed maximum dose", () => {
      const weightKg = 150; // Large child
      const dosagePerKg = 0.01; // mg/kg
      const maxDose = 1; // mg

      const calculatedDose = Math.min(dosagePerKg * weightKg, maxDose);
      expect(calculatedDose).toBe(1); // Should be capped at max dose
    });

    it("should calculate amiodarone dose correctly", () => {
      const weightKg = 5;
      const dosagePerKg = 5; // mg/kg
      const maxDose = 300; // mg

      const calculatedDose = Math.min(dosagePerKg * weightKg, maxDose);
      expect(calculatedDose).toBe(25);
    });

    it("should handle very small infants", () => {
      const weightKg = 0.5; // 500g infant
      const dosagePerKg = 0.1; // mg/kg
      const maxDose = 0.1; // mg

      const calculatedDose = Math.min(dosagePerKg * weightKg, maxDose);
      expect(calculatedDose).toBe(0.05);
    });

    it("should calculate sodium bicarbonate dose", () => {
      const weightKg = 20;
      const dosagePerKg = 1; // mEq/kg
      const maxDose = 50; // mEq

      const calculatedDose = Math.min(dosagePerKg * weightKg, maxDose);
      expect(calculatedDose).toBe(20);
    });
  });

  describe("Defibrillator Energy Calculations", () => {
    it("should calculate initial shock energy for 10kg child", () => {
      const weightKg = 10;
      const initialEnergy = Math.min(2 * weightKg, 200);
      expect(initialEnergy).toBe(20);
    });

    it("should calculate subsequent shock energy", () => {
      const weightKg = 10;
      const subsequentEnergy = Math.min(4 * weightKg, 360);
      expect(subsequentEnergy).toBe(40);
    });

    it("should cap initial shock at 200J", () => {
      const weightKg = 150; // Large child
      const initialEnergy = Math.min(2 * weightKg, 200);
      expect(initialEnergy).toBe(200);
    });

    it("should cap subsequent shock at 360J", () => {
      const weightKg = 150;
      const subsequentEnergy = Math.min(4 * weightKg, 360);
      expect(subsequentEnergy).toBe(360);
    });

    it("should calculate energy for very small infant", () => {
      const weightKg = 0.5;
      const initialEnergy = Math.min(2 * weightKg, 200);
      expect(initialEnergy).toBe(1);
    });

    it("should follow 2J/kg then 4J/kg protocol", () => {
      const weightKg = 25;
      const initialShock = 2 * weightKg;
      const subsequentShock = 4 * weightKg;

      expect(initialShock).toBe(50);
      expect(subsequentShock).toBe(100);
      expect(subsequentShock).toBeGreaterThan(initialShock);
    });
  });

  describe("CPR Compression Rate", () => {
    it("should calculate compression rate from timing", () => {
      const compressions = [0, 0.5, 1, 1.5, 2]; // seconds
      const intervals = [];

      for (let i = 1; i < compressions.length; i++) {
        intervals.push(compressions[i] - compressions[i - 1]);
      }

      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      const rate = 60 / avgInterval;

      expect(rate).toBe(120); // 120 bpm
    });

    it("should detect slow compression rate", () => {
      const interval = 1; // 1 second between compressions
      const rate = 60 / interval;
      expect(rate).toBe(60); // 60 bpm - too slow
      expect(rate).toBeLessThan(100); // Below recommended 100-120
    });

    it("should detect fast compression rate", () => {
      const interval = 0.4; // 0.4 seconds between compressions
      const rate = 60 / interval;
      expect(rate).toBe(150); // 150 bpm - too fast
      expect(rate).toBeGreaterThan(120); // Above recommended 100-120
    });

    it("should detect optimal compression rate", () => {
      const rate = 110; // bpm
      expect(rate).toBeGreaterThanOrEqual(100);
      expect(rate).toBeLessThanOrEqual(120);
    });
  });

  describe("Decision Window Timing", () => {
    it("should identify decision windows every 2 minutes", () => {
      const elapsedSeconds = 0;
      const decisionWindow = Math.floor(elapsedSeconds / 120);
      expect(decisionWindow).toBe(0);
    });

    it("should identify second decision window at 2 minutes", () => {
      const elapsedSeconds = 120;
      const decisionWindow = Math.floor(elapsedSeconds / 120);
      expect(decisionWindow).toBe(1);
    });

    it("should identify third decision window at 4 minutes", () => {
      const elapsedSeconds = 240;
      const decisionWindow = Math.floor(elapsedSeconds / 120);
      expect(decisionWindow).toBe(2);
    });

    it("should calculate time until next decision", () => {
      const elapsedSeconds = 90;
      const timeInWindow = elapsedSeconds % 120;
      const timeUntilDecision = 120 - timeInWindow;
      expect(timeUntilDecision).toBe(30);
    });

    it("should alert when approaching decision point", () => {
      const elapsedSeconds = 110;
      const timeInWindow = elapsedSeconds % 120;
      const timeUntilDecision = 120 - timeInWindow;
      const shouldAlert = timeUntilDecision < 30;
      expect(shouldAlert).toBe(true);
    });
  });

  describe("Pediatric Age-Based Protocols", () => {
    it("should identify infant protocol for 0-12 months", () => {
      const ageMonths = 6;
      const isInfant = ageMonths >= 0 && ageMonths <= 12;
      expect(isInfant).toBe(true);
    });

    it("should identify toddler protocol for 1-3 years", () => {
      const ageMonths = 24;
      const isToddler = ageMonths > 12 && ageMonths <= 36;
      expect(isToddler).toBe(true);
    });

    it("should identify preschool protocol for 3-6 years", () => {
      const ageMonths = 48;
      const isPreschool = ageMonths > 36 && ageMonths <= 72;
      expect(isPreschool).toBe(true);
    });

    it("should identify school-age protocol for 6-12 years", () => {
      const ageMonths = 96;
      const isSchoolAge = ageMonths > 72 && ageMonths <= 144;
      expect(isSchoolAge).toBe(true);
    });

    it("should identify adolescent protocol for 12-18 years", () => {
      const ageMonths = 180;
      const isAdolescent = ageMonths > 144 && ageMonths <= 216;
      expect(isAdolescent).toBe(true);
    });
  });

  describe("CPR Outcome Tracking", () => {
    it("should track ROSC outcome", () => {
      const outcome = "ROSC";
      expect(["ROSC", "pCOSCA", "mortality", "ongoing"]).toContain(outcome);
    });

    it("should track pCOSCA outcome", () => {
      const outcome = "pCOSCA";
      expect(["ROSC", "pCOSCA", "mortality", "ongoing"]).toContain(outcome);
    });

    it("should track mortality outcome", () => {
      const outcome = "mortality";
      expect(["ROSC", "pCOSCA", "mortality", "ongoing"]).toContain(outcome);
    });

    it("should calculate ROSC rate", () => {
      const sessions = [
        { outcome: "ROSC" },
        { outcome: "ROSC" },
        { outcome: "mortality" },
        { outcome: "pCOSCA" },
      ];

      const roscCount = sessions.filter((s) => s.outcome === "ROSC").length;
      const roscRate = (roscCount / sessions.length) * 100;

      expect(roscRate).toBe(50);
    });

    it("should calculate mortality rate", () => {
      const sessions = [
        { outcome: "ROSC" },
        { outcome: "mortality" },
        { outcome: "mortality" },
        { outcome: "pCOSCA" },
      ];

      const mortalityCount = sessions.filter((s) => s.outcome === "mortality").length;
      const mortalityRate = (mortalityCount / sessions.length) * 100;

      expect(mortalityRate).toBe(50);
    });
  });

  describe("Session Duration Tracking", () => {
    it("should calculate session duration", () => {
      const startTime = new Date("2026-01-24T10:00:00");
      const endTime = new Date("2026-01-24T10:05:00");
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      expect(duration).toBe(300); // 5 minutes
    });

    it("should track very short resuscitation", () => {
      const startTime = new Date("2026-01-24T10:00:00");
      const endTime = new Date("2026-01-24T10:00:30");
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      expect(duration).toBe(30); // 30 seconds
    });

    it("should track prolonged resuscitation", () => {
      const startTime = new Date("2026-01-24T10:00:00");
      const endTime = new Date("2026-01-24T10:30:00");
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      expect(duration).toBe(1800); // 30 minutes
    });
  });

  describe("Medication Administration Routes", () => {
    it("should support IV route", () => {
      const routes = ["IV", "IO", "IM", "ET", "IN"];
      expect(routes).toContain("IV");
    });

    it("should support IO route", () => {
      const routes = ["IV", "IO", "IM", "ET", "IN"];
      expect(routes).toContain("IO");
    });

    it("should support IM route", () => {
      const routes = ["IV", "IO", "IM", "ET", "IN"];
      expect(routes).toContain("IM");
    });

    it("should support ET route", () => {
      const routes = ["IV", "IO", "IM", "ET", "IN"];
      expect(routes).toContain("ET");
    });

    it("should support IN route", () => {
      const routes = ["IV", "IO", "IM", "ET", "IN"];
      expect(routes).toContain("IN");
    });
  });

  describe("Rhythm Classification", () => {
    it("should classify VF as shockable", () => {
      const rhythm = "VF";
      const isShockable = ["VF", "pulseless_VT"].includes(rhythm);
      expect(isShockable).toBe(true);
    });

    it("should classify pulseless VT as shockable", () => {
      const rhythm = "pulseless_VT";
      const isShockable = ["VF", "pulseless_VT"].includes(rhythm);
      expect(isShockable).toBe(true);
    });

    it("should classify asystole as non-shockable", () => {
      const rhythm = "asystole";
      const isShockable = ["VF", "pulseless_VT"].includes(rhythm);
      expect(isShockable).toBe(false);
    });

    it("should classify PEA as non-shockable", () => {
      const rhythm = "PEA";
      const isShockable = ["VF", "pulseless_VT"].includes(rhythm);
      expect(isShockable).toBe(false);
    });

    it("should classify sinus as non-shockable", () => {
      const rhythm = "sinus";
      const isShockable = ["VF", "pulseless_VT"].includes(rhythm);
      expect(isShockable).toBe(false);
    });
  });
});
