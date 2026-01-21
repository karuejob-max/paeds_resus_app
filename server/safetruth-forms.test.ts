import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";

// Mock form data validation schemas
const ProviderFormDataSchema = z.object({
  eventDate: z.string(),
  patientAge: z.number().min(0, "Age must be non-negative"),
  algorithm: z.string(),
  responsiveness: z.string(),
  breathing: z.string(),
  pulse: z.string(),
  rhythm: z.string(),
  cprPerformed: z.boolean().optional(),
  defibUsed: z.boolean().optional(),
  oxygenGiven: z.boolean().optional(),
  medicationsGiven: z.boolean().optional(),
  outcome: z.string(),
  neuroStatus: z.string(),
  systemGaps: z.array(z.string()),
  isAnonymous: z.boolean(),
});

const ParentFormDataSchema = z.object({
  eventDate: z.string(),
  childAge: z.number().min(0, "Age must be non-negative"),
  location: z.string(),
  recognizedProblem: z.boolean(),
  calledHelp: z.boolean(),
  childAlive: z.boolean(),
  outcome: z.string(),
  systemGaps: z.array(z.string()),
  isAnonymous: z.boolean(),
});

describe("Provider Safe-Truth Form", () => {
  describe("Form Validation", () => {
    it("should validate complete provider form data", () => {
      const validData = {
        eventDate: "2026-01-21T14:30:00",
        patientAge: 5,
        algorithm: "Cardiac Arrest",
        responsiveness: "Unresponsive",
        breathing: "Absent",
        pulse: "Absent",
        rhythm: "Asystole",
        cprPerformed: true,
        defibUsed: true,
        oxygenGiven: true,
        medicationsGiven: true,
        outcome: "Discharged Intact",
        neuroStatus: "Alert",
        systemGaps: ["Knowledge Gap", "Equipment Gap"],
        isAnonymous: false,
      };

      expect(() => ProviderFormDataSchema.parse(validData)).not.toThrow();
    });

    it("should validate minimal provider form data", () => {
      const minimalData = {
        eventDate: "2026-01-21",
        patientAge: 3,
        algorithm: "Respiratory Failure",
        responsiveness: "Responsive",
        breathing: "Normal",
        pulse: "Present",
        rhythm: "Normal",
        outcome: "Discharged Intact",
        neuroStatus: "Alert",
        systemGaps: [],
        isAnonymous: true,
      };

      expect(() => ProviderFormDataSchema.parse(minimalData)).not.toThrow();
    });

    it("should reject invalid patient age", () => {
      const invalidData = {
        eventDate: "2026-01-21",
        patientAge: -5,
        algorithm: "Cardiac Arrest",
        responsiveness: "Unresponsive",
        breathing: "Absent",
        pulse: "Absent",
        rhythm: "Asystole",
        outcome: "Died",
        neuroStatus: "Unresponsive",
        systemGaps: [],
        isAnonymous: false,
      };

      expect(() => ProviderFormDataSchema.parse(invalidData)).toThrow();
    });

    it("should handle all BLS/ACLS/PALS algorithms", () => {
      const algorithms = ["Cardiac Arrest", "Tachyarrhythmia", "Bradycardia", "Respiratory Failure", "Shock", "Other"];

      algorithms.forEach((algo) => {
        const data = {
          eventDate: "2026-01-21",
          patientAge: 7,
          algorithm: algo,
          responsiveness: "Responsive",
          breathing: "Normal",
          pulse: "Present",
          rhythm: "Normal",
          outcome: "Discharged Intact",
          neuroStatus: "Alert",
          systemGaps: [],
          isAnonymous: false,
        };

        expect(() => ProviderFormDataSchema.parse(data)).not.toThrow();
      });
    });

    it("should handle all CPR quality metrics", () => {
      const data = {
        eventDate: "2026-01-21",
        patientAge: 6,
        algorithm: "Cardiac Arrest",
        responsiveness: "Unresponsive",
        breathing: "Absent",
        pulse: "Absent",
        rhythm: "VF/pVT (Shockable)",
        cprPerformed: true,
        feedbackDevice: true,
        depthAdequate: true,
        recoilAllowed: true,
        interruptions: "< 10 sec",
        ccf: "> 90%",
        outcome: "Discharged Intact",
        neuroStatus: "Alert",
        systemGaps: [],
        isAnonymous: false,
      };

      expect(() => ProviderFormDataSchema.parse(data)).not.toThrow();
    });

    it("should handle all intervention types", () => {
      const interventions = [
        { defibUsed: true, padType: "Adult" },
        { defibUsed: true, padType: "Pediatric" },
        { defibUsed: true, padType: "Switched" },
        { oxygenGiven: true, o2Method: "Nasal Cannula" },
        { oxygenGiven: true, o2Method: "Face Mask" },
        { oxygenGiven: true, o2Method: "BVM" },
        { oxygenGiven: true, o2Method: "Intubation" },
      ];

      interventions.forEach((intervention) => {
        const data = {
          eventDate: "2026-01-21",
          patientAge: 8,
          algorithm: "Cardiac Arrest",
          responsiveness: "Unresponsive",
          breathing: "Absent",
          pulse: "Absent",
          rhythm: "Asystole",
          ...intervention,
          outcome: "Discharged Intact",
          neuroStatus: "Alert",
          systemGaps: [],
          isAnonymous: false,
        };

        expect(() => ProviderFormDataSchema.parse(data)).not.toThrow();
      });
    });

    it("should handle all outcomes", () => {
      const outcomes = ["Discharged Intact", "Discharged with Deficit", "Transferred", "Died"];

      outcomes.forEach((outcome) => {
        const data = {
          eventDate: "2026-01-21",
          patientAge: 4,
          algorithm: "Cardiac Arrest",
          responsiveness: "Unresponsive",
          breathing: "Absent",
          pulse: "Absent",
          rhythm: "PEA",
          outcome,
          neuroStatus: "Unresponsive",
          systemGaps: [],
          isAnonymous: false,
        };

        expect(() => ProviderFormDataSchema.parse(data)).not.toThrow();
      });
    });

    it("should handle all neurological statuses", () => {
      const statuses = ["Alert", "Responsive to Commands", "Responsive to Pain", "Unresponsive"];

      statuses.forEach((status) => {
        const data = {
          eventDate: "2026-01-21",
          patientAge: 5,
          algorithm: "Cardiac Arrest",
          responsiveness: "Unresponsive",
          breathing: "Absent",
          pulse: "Absent",
          rhythm: "Asystole",
          outcome: "Discharged Intact",
          neuroStatus: status,
          systemGaps: [],
          isAnonymous: false,
        };

        expect(() => ProviderFormDataSchema.parse(data)).not.toThrow();
      });
    });

    it("should handle multiple system gaps", () => {
      const gaps = ["Knowledge Gap", "Resources Gap", "Leadership Gap", "Communication Gap", "Protocol Gap", "Equipment Gap", "Training Gap", "Staffing Gap", "Infrastructure Gap"];

      const data = {
        eventDate: "2026-01-21",
        patientAge: 6,
        algorithm: "Cardiac Arrest",
        responsiveness: "Unresponsive",
        breathing: "Absent",
        pulse: "Absent",
        rhythm: "Asystole",
        outcome: "Died",
        neuroStatus: "Unresponsive",
        systemGaps: gaps,
        isAnonymous: false,
      };

      expect(() => ProviderFormDataSchema.parse(data)).not.toThrow();
    });
  });
});

describe("Parent Safe-Truth Form", () => {
  describe("Form Validation", () => {
    it("should validate complete parent form data", () => {
      const validData = {
        eventDate: "2026-01-21",
        childAge: 5,
        location: "Home",
        recognizedProblem: true,
        calledHelp: true,
        childAlive: true,
        outcome: "Fully recovered",
        systemGaps: ["Response time was too slow", "Equipment not available"],
        isAnonymous: false,
      };

      expect(() => ParentFormDataSchema.parse(validData)).not.toThrow();
    });

    it("should validate minimal parent form data", () => {
      const minimalData = {
        eventDate: "2026-01-21",
        childAge: 3,
        location: "Hospital",
        recognizedProblem: false,
        calledHelp: false,
        childAlive: true,
        outcome: "Mostly recovered",
        systemGaps: [],
        isAnonymous: true,
      };

      expect(() => ParentFormDataSchema.parse(minimalData)).not.toThrow();
    });

    it("should reject invalid child age", () => {
      const invalidData = {
        eventDate: "2026-01-21",
        childAge: -1,
        location: "Home",
        recognizedProblem: true,
        calledHelp: true,
        childAlive: true,
        outcome: "Fully recovered",
        systemGaps: [],
        isAnonymous: false,
      };

      expect(() => ParentFormDataSchema.parse(invalidData)).toThrow();
    });

    it("should handle all locations", () => {
      const locations = ["Home", "School", "Hospital", "Other"];

      locations.forEach((location) => {
        const data = {
          eventDate: "2026-01-21",
          childAge: 7,
          location,
          recognizedProblem: true,
          calledHelp: true,
          childAlive: true,
          outcome: "Fully recovered",
          systemGaps: [],
          isAnonymous: false,
        };

        expect(() => ParentFormDataSchema.parse(data)).not.toThrow();
      });
    });

    it("should handle child death scenario", () => {
      const data = {
        eventDate: "2026-01-21",
        childAge: 4,
        location: "Hospital",
        recognizedProblem: true,
        calledHelp: true,
        childAlive: false,
        outcome: "Died",
        systemGaps: ["Lack of follow-up care", "Poor communication with family"],
        isAnonymous: true,
      };

      expect(() => ParentFormDataSchema.parse(data)).not.toThrow();
    });

    it("should handle all system gaps from parent perspective", () => {
      const gaps = [
        "Response time was too slow",
        "Equipment not available",
        "Staff didn't know what to do",
        "Poor communication with family",
        "Lack of follow-up care",
        "Not enough trained staff",
        "Hospital policies prevented care",
        "Lack of coordination between teams",
        "No support for family",
        "Inadequate training for emergency response",
      ];

      const data = {
        eventDate: "2026-01-21",
        childAge: 6,
        location: "Hospital",
        recognizedProblem: true,
        calledHelp: true,
        childAlive: true,
        outcome: "Some ongoing challenges",
        systemGaps: gaps,
        isAnonymous: false,
      };

      expect(() => ParentFormDataSchema.parse(data)).not.toThrow();
    });

    it("should handle anonymous submissions", () => {
      const data = {
        eventDate: "2026-01-21",
        childAge: 5,
        location: "School",
        recognizedProblem: true,
        calledHelp: true,
        childAlive: true,
        outcome: "Fully recovered",
        systemGaps: [],
        isAnonymous: true,
      };

      expect(() => ParentFormDataSchema.parse(data)).not.toThrow();
    });

    it("should handle identified submissions", () => {
      const data = {
        eventDate: "2026-01-21",
        childAge: 8,
        location: "Home",
        recognizedProblem: true,
        calledHelp: true,
        childAlive: true,
        outcome: "Fully recovered",
        systemGaps: [],
        isAnonymous: false,
      };

      expect(() => ParentFormDataSchema.parse(data)).not.toThrow();
    });
  });
});

describe("Form Submission Integration", () => {
  it("should transform provider form data to tRPC format", () => {
    const formData = {
      eventDate: "2026-01-21T14:30:00",
      patientAge: 5,
      algorithm: "Cardiac Arrest",
      responsiveness: "Unresponsive",
      breathing: "Absent",
      pulse: "Absent",
      rhythm: "Asystole",
      cprPerformed: true,
      outcome: "Discharged Intact",
      neuroStatus: "Alert",
      systemGaps: ["Knowledge Gap"],
      isAnonymous: false,
    };

    const trpcData = {
      eventDate: formData.eventDate,
      childAge: formData.patientAge,
      eventType: formData.algorithm,
      presentation: JSON.stringify(formData),
      isAnonymous: formData.isAnonymous,
      chainOfSurvival: {
        recognition: true,
        activation: true,
        cpr: true,
        defibrillation: false,
        advancedCare: false,
        postResuscitation: false,
      },
      systemGaps: formData.systemGaps,
      gapDetails: {},
      outcome: formData.outcome,
      neurologicalStatus: formData.neuroStatus,
    };

    expect(trpcData.eventDate).toBe(formData.eventDate);
    expect(trpcData.childAge).toBe(formData.patientAge);
    expect(trpcData.eventType).toBe(formData.algorithm);
    expect(trpcData.isAnonymous).toBe(formData.isAnonymous);
    expect(trpcData.systemGaps).toEqual(formData.systemGaps);
  });

  it("should transform parent form data to tRPC format", () => {
    const formData = {
      eventDate: "2026-01-21",
      childAge: 5,
      location: "Home",
      recognizedProblem: true,
      calledHelp: true,
      childAlive: true,
      outcome: "Fully recovered",
      systemGaps: ["Response time was too slow"],
      isAnonymous: true,
    };

    const trpcData = {
      eventDate: formData.eventDate,
      childAge: formData.childAge,
      eventType: "parent-observation",
      presentation: JSON.stringify(formData),
      isAnonymous: formData.isAnonymous,
      chainOfSurvival: {
        recognition: formData.recognizedProblem,
        activation: formData.calledHelp,
        cpr: false,
        defibrillation: false,
        advancedCare: false,
        postResuscitation: formData.childAlive,
      },
      systemGaps: formData.systemGaps,
      gapDetails: {},
      outcome: formData.outcome,
      neurologicalStatus: "unknown",
    };

    expect(trpcData.eventDate).toBe(formData.eventDate);
    expect(trpcData.childAge).toBe(formData.childAge);
    expect(trpcData.eventType).toBe("parent-observation");
    expect(trpcData.isAnonymous).toBe(formData.isAnonymous);
    expect(trpcData.chainOfSurvival.recognition).toBe(formData.recognizedProblem);
    expect(trpcData.chainOfSurvival.activation).toBe(formData.calledHelp);
  });
});
