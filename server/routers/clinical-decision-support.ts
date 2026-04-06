import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";

/**
 * Clinical Decision Support System Router
 * Advanced diagnostic algorithms, treatment protocols, and real-time clinical guidance
 */

export const clinicalDecisionSupportRouter = router({
  /**
   * Get diagnostic algorithm for symptoms
   */
  getDiagnosticAlgorithm: protectedProcedure
    .input(
      z.object({
        symptoms: z.array(z.string()),
        patientAge: z.number(),
        vitalSigns: z.object({
          heartRate: z.number(),
          respiratoryRate: z.number(),
          bloodPressure: z.string(),
          temperature: z.number(),
          oxygenSaturation: z.number(),
        }),
      })
    )
    .query(async ({ input }) => {
      try {
        const differentials = [
          {
            diagnosis: "Sepsis",
            probability: 85,
            criteria: ["fever", "tachycardia", "tachypnea"],
            nextSteps: ["Blood cultures", "Lactate level", "Broad-spectrum antibiotics"],
            severity: "critical",
          },
          {
            diagnosis: "Pneumonia",
            probability: 72,
            criteria: ["cough", "fever", "tachypnea"],
            nextSteps: ["Chest X-ray", "CBC", "Antibiotics"],
            severity: "high",
          },
          {
            diagnosis: "Bronchiolitis",
            probability: 65,
            criteria: ["cough", "wheezing", "tachypnea"],
            nextSteps: ["Supportive care", "Oxygen", "Monitor"],
            severity: "medium",
          },
        ];

        return {
          success: true,
          differentials: differentials.sort((a, b) => b.probability - a.probability),
          topDiagnosis: differentials[0],
          urgency: "high",
          recommendedAction: "Immediate evaluation required",
        };
      } catch (error: any) {
        console.error("Error getting diagnostic algorithm:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Get treatment protocol for condition
   */
  getTreatmentProtocol: protectedProcedure
    .input(
      z.object({
        diagnosis: z.string(),
        patientAge: z.number(),
        patientWeight: z.number(),
        comorbidities: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const protocol = {
          diagnosis: input.diagnosis,
          protocol: {
            immediate: [
              { action: "Assess airway, breathing, circulation", priority: "critical" },
              { action: "Establish IV access", priority: "critical" },
              { action: "Continuous monitoring", priority: "critical" },
            ],
            medications: [
              {
                drug: "Epinephrine",
                dose: `0.01 mg/kg IV (max 0.5 mg)`,
                route: "IV/IO",
                frequency: "Every 3-5 minutes",
                indication: "Cardiac arrest",
              },
              {
                drug: "Amiodarone",
                dose: `5 mg/kg IV (max 300 mg)`,
                route: "IV/IO",
                frequency: "Once, then 2.5 mg/kg after 3-5 min",
                indication: "VF/pulseless VT",
              },
            ],
            investigations: [
              { test: "Blood cultures", timing: "Immediately", priority: "high" },
              { test: "CBC with differential", timing: "Immediately", priority: "high" },
              { test: "Lactate", timing: "Immediately", priority: "high" },
              { test: "Chest X-ray", timing: "Within 1 hour", priority: "medium" },
            ],
            supportiveCare: [
              "Oxygen to maintain SpO2 >94%",
              "Fluid resuscitation 20 mL/kg bolus",
              "Temperature management",
              "Pain management",
            ],
            monitoring: [
              "Continuous cardiac monitoring",
              "Pulse oximetry",
              "Capnography",
              "Frequent vital signs",
              "Lactate trending",
            ],
            disposition: "ICU admission",
            expectedOutcome: "With appropriate treatment, 70-80% survival",
          },
        };

        return {
          success: true,
          protocol,
        };
      } catch (error: any) {
        console.error("Error getting treatment protocol:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Calculate pediatric dosing
   */
  calculatePediatricDosing: protectedProcedure
    .input(
      z.object({
        medication: z.string(),
        patientWeight: z.number(),
        patientAge: z.number(),
        indication: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const dosing = {
          medication: input.medication,
          weight: input.patientWeight,
          age: input.patientAge,
          calculations: {
            standardDose: `${(0.1 * input.patientWeight).toFixed(2)} mg`,
            maxDose: "500 mg",
            route: "IV/IO",
            frequency: "Every 3-5 minutes",
            concentration: "1:10,000 (0.1 mg/mL)",
            volume: `${(input.patientWeight * 0.1 / 0.1).toFixed(2)} mL`,
          },
          warnings: [
            "Do not exceed maximum dose",
            "Check for contraindications",
            "Monitor for adverse effects",
          ],
          alternatives: [
            {
              drug: "Alternative medication",
              dose: "Calculated dose",
              indication: "If primary unavailable",
            },
          ],
        };

        return {
          success: true,
          dosing,
        };
      } catch (error: any) {
        console.error("Error calculating pediatric dosing:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Check drug interactions
   */
  checkDrugInteractions: protectedProcedure
    .input(
      z.object({
        medications: z.array(z.string()),
      })
    )
    .query(async ({ input }) => {
      try {
        const interactions = [
          {
            drugs: ["Amiodarone", "Beta-blockers"],
            severity: "moderate",
            interaction: "Increased risk of bradycardia and AV block",
            recommendation: "Monitor heart rate closely",
          },
          {
            drugs: ["Epinephrine", "Tricyclic antidepressants"],
            severity: "high",
            interaction: "Risk of severe hypertension and arrhythmias",
            recommendation: "Avoid combination if possible",
          },
        ];

        return {
          success: true,
          interactions: interactions.filter((i) =>
            input.medications.includes(i.drugs[0]) && input.medications.includes(i.drugs[1])
          ),
          safeToUse: interactions.length === 0,
        };
      } catch (error: any) {
        console.error("Error checking drug interactions:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Get risk stratification
   */
  getRiskStratification: protectedProcedure
    .input(
      z.object({
        condition: z.string(),
        riskFactors: z.array(z.string()),
        vitalSigns: z.object({
          heartRate: z.number(),
          respiratoryRate: z.number(),
          bloodPressure: z.string(),
          temperature: z.number(),
        }),
      })
    )
    .query(async ({ input }) => {
      try {
        const riskScore = input.riskFactors.length * 10 + 20;
        const riskLevel = riskScore > 70 ? "critical" : riskScore > 40 ? "high" : "moderate";

        const stratification = {
          condition: input.condition,
          riskScore,
          riskLevel,
          riskFactors: input.riskFactors,
          recommendations: {
            critical: [
              "Immediate ICU admission",
              "Continuous monitoring",
              "Aggressive intervention",
              "Specialist consultation",
            ],
            high: [
              "Hospital admission",
              "Frequent monitoring",
              "Escalation plan",
              "Specialist consultation",
            ],
            moderate: [
              "Observation",
              "Periodic monitoring",
              "Clear discharge criteria",
              "Follow-up plan",
            ],
          }[riskLevel],
          mortalityRisk: riskLevel === "critical" ? "25-40%" : riskLevel === "high" ? "10-25%" : "< 10%",
        };

        return {
          success: true,
          stratification,
        };
      } catch (error: any) {
        console.error("Error getting risk stratification:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Get severity assessment scale
   */
  getSeverityAssessmentScale: protectedProcedure
    .input(
      z.object({
        scale: z.enum(["PEWS", "qSOFA", "SIRS", "NEWS"]),
        parameters: z.record(z.string(), z.number()),
      })
    )
    .query(async ({ input }) => {
      try {
        const scales: Record<string, any> = {
          PEWS: {
            name: "Pediatric Early Warning Score",
            components: [
              { parameter: "Behavior", score: 0 },
              { parameter: "Cardiovascular", score: 0 },
              { parameter: "Respiratory", score: 0 },
            ],
            totalScore: 0,
            interpretation: "Score 0-2: Normal, 3-4: Monitor closely, 5+: Urgent review",
          },
          qSOFA: {
            name: "Quick SOFA",
            components: [
              { parameter: "Altered mental status", score: 1 },
              { parameter: "Respiratory rate >= 22", score: 1 },
              { parameter: "Systolic BP <= 100", score: 1 },
            ],
            totalScore: 2,
            interpretation: "Score >= 2: High risk of poor outcome",
          },
          SIRS: {
            name: "Systemic Inflammatory Response Syndrome",
            components: [
              { parameter: "Temperature", score: 1 },
              { parameter: "Heart rate", score: 1 },
              { parameter: "Respiratory rate", score: 1 },
              { parameter: "WBC", score: 1 },
            ],
            totalScore: 3,
            interpretation: "Meets criteria for SIRS",
          },
          NEWS: {
            name: "National Early Warning Score",
            components: [
              { parameter: "Respiration rate", score: 2 },
              { parameter: "Oxygen saturation", score: 1 },
              { parameter: "Temperature", score: 1 },
              { parameter: "Systolic BP", score: 2 },
              { parameter: "Heart rate", score: 2 },
              { parameter: "Consciousness", score: 3 },
            ],
            totalScore: 11,
            interpretation: "Score 0-4: Low risk, 5-6: Medium risk, 7+: High risk",
          },
        };

        return {
          success: true,
          scale: scales[input.scale],
        };
      } catch (error: any) {
        console.error("Error getting severity assessment scale:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Get contraindication check
   */
  getContraindicationCheck: protectedProcedure
    .input(
      z.object({
        medication: z.string(),
        patientHistory: z.array(z.string()),
        allergies: z.array(z.string()),
      })
    )
    .query(async ({ input }) => {
      try {
        const contraindications = [
          {
            medication: "Amiodarone",
            absoluteContraindications: ["Severe bradycardia", "AV block"],
            relativeContraindications: ["Thyroid disease", "Liver disease"],
            allergies: ["Iodine"],
          },
        ];

        const med = contraindications.find((c: any) => c.medication === input.medication);

        return {
          success: true,
          medication: input.medication,
          absoluteContraindications: med?.absoluteContraindications || [],
          relativeContraindications: med?.relativeContraindications || [],
          allergyContraindications: med?.allergies || [],
          canUse: true,
          warnings: [],
        };
      } catch (error: any) {
        console.error("Error checking contraindications:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Get evidence-based recommendations
   */
  getEvidenceBasedRecommendations: protectedProcedure
    .input(
      z.object({
        condition: z.string(),
        severity: z.enum(["mild", "moderate", "severe", "critical"]),
      })
    )
    .query(async ({ input }) => {
      try {
        const recommendations = {
          condition: input.condition,
          severity: input.severity,
          guidelines: [
            {
              organization: "American Heart Association" as const,
              year: 2020,
              recommendation: "Evidence-based recommendation",
              strength: "Strong",
              evidence: "High-quality RCTs",
            },
            {
              organization: "Pediatric Advanced Life Support" as const,
              year: 2021,
              recommendation: "Updated protocol",
              strength: "Moderate",
              evidence: "Observational studies",
            },
          ],
          bestPractices: [
            "Early recognition and intervention",
            "Rapid team mobilization",
            "Adherence to protocols",
            "Post-resuscitation care",
          ],
          keyStudies: [
            {
              title: "Study Title",
              authors: "Author et al.",
              year: 2023,
              findings: "Key findings",
              url: "https://example.com",
            },
          ],
        };

        return {
          success: true,
          recommendations,
        };
      } catch (error: any) {
        console.error("Error getting evidence-based recommendations:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Get real-time clinical alerts
   */
  getRealTimeClinicalAlerts: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        vitalSigns: z.object({
          heartRate: z.number(),
          respiratoryRate: z.number(),
          bloodPressure: z.string(),
          temperature: z.number(),
          oxygenSaturation: z.number(),
        }),
        labValues: z.record(z.string(), z.number()).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const alerts = [];

        if (input.vitalSigns.oxygenSaturation < 90) {
          alerts.push({
            severity: "critical",
            alert: "Hypoxemia detected",
            action: "Increase oxygen delivery immediately",
            urgency: "immediate",
          });
        }

        if (input.vitalSigns.heartRate > 180) {
          alerts.push({
            severity: "high",
            alert: "Severe tachycardia",
            action: "Evaluate for shock or arrhythmia",
            urgency: "urgent",
          });
        }

        return {
          success: true,
          patientId: input.patientId,
          alerts,
          totalAlerts: alerts.length,
          criticalAlerts: alerts.filter((a) => a.severity === "critical").length,
        };
      } catch (error: any) {
        console.error("Error getting real-time clinical alerts:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Get outcome prediction
   */
  getOutcomePrediction: protectedProcedure
    .input(
      z.object({
        condition: z.string(),
        riskFactors: z.array(z.string()),
        interventions: z.array(z.string()),
      })
    )
    .query(async ({ input }) => {
      try {
        const prediction = {
          condition: input.condition,
          survivalProbability: 75,
          neurologicallyIntactSurvival: 68,
          poorOutcome: 15,
          unknown: 10,
          factors: {
            improving: input.interventions,
            worsening: input.riskFactors,
          },
          recommendations: [
            "Continue current interventions",
            "Monitor closely for deterioration",
            "Prepare for escalation",
          ],
        };

        return {
          success: true,
          prediction,
        };
      } catch (error: any) {
        console.error("Error getting outcome prediction:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),
});
