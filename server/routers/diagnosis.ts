import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import {
  medicalConditions,
  symptoms,
  conditionSymptomMapping,
  diagnosisHistory,
  differentialDiagnosisScores,
  diagnosisAccuracy,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const diagnosisRouter = router({
  /**
   * Get all medical conditions
   */
  getConditions: publicProcedure.query(async () => {
    const db = getDb() as any;
    const conditions = await db.select().from(medicalConditions);
    return conditions;
  }),

  /**
   * Get all symptoms
   */
  getSymptoms: publicProcedure.query(async () => {
    const db = getDb() as any;
    const allSymptoms = await db.select().from(symptoms);
    return allSymptoms;
  }),

  /**
   * Get differential diagnosis suggestions based on symptoms and vital signs
   */
  getDifferentialDiagnosis: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        symptomIds: z.array(z.number()),
        vitalSigns: z.object({
          heartRate: z.number().optional(),
          temperature: z.number().optional(),
          respiratoryRate: z.number().optional(),
          systolicBP: z.number().optional(),
          diastolicBP: z.number().optional(),
          oxygenSaturation: z.number().optional(),
        }),
        ageInMonths: z.number(),
        weightInKg: z.number(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const db = getDb() as any;

      // Get all conditions with their symptoms
      const allConditions = await db.select().from(medicalConditions);

      // Score each condition based on symptom match
      const scoredConditions = await Promise.all(
        allConditions.map(async (condition: any) => {
          // Get symptoms for this condition
          const mappings = await db
            .select()
            .from(conditionSymptomMapping)
            .where(eq(conditionSymptomMapping.conditionId, condition.id));

          // Calculate symptom match score
          const conditionSymptomIds = mappings.map((m: any) => m.symptomId);
          const matchedSymptoms = input.symptomIds.filter((s: number) =>
            conditionSymptomIds.includes(s)
          );
          const symptomScore =
            conditionSymptomIds.length > 0
              ? (matchedSymptoms.length / conditionSymptomIds.length) * 100
              : 0;

          // Calculate vital signs match score
          let vitalSignScore = 0;
          if (condition.criticalVitalSigns) {
            const criticalRanges = JSON.parse(condition.criticalVitalSigns);
            let matchCount = 0;
            let totalChecks = 0;

            if (criticalRanges.heartRate && input.vitalSigns.heartRate) {
              totalChecks++;
              if (
                input.vitalSigns.heartRate >= criticalRanges.heartRate.min &&
                input.vitalSigns.heartRate <= criticalRanges.heartRate.max
              ) {
                matchCount++;
              }
            }

            if (criticalRanges.temperature && input.vitalSigns.temperature) {
              totalChecks++;
              if (
                input.vitalSigns.temperature >= criticalRanges.temperature.min &&
                input.vitalSigns.temperature <= criticalRanges.temperature.max
              ) {
                matchCount++;
              }
            }

            if (totalChecks > 0) {
              vitalSignScore = (matchCount / totalChecks) * 100;
            }
          }

          // Combined score (60% symptoms, 40% vital signs)
          const combinedScore = symptomScore * 0.6 + vitalSignScore * 0.4;

          return {
            conditionId: condition.id,
            conditionName: condition.name,
            score: Math.round(combinedScore),
            matchedSymptoms: matchedSymptoms.length,
            totalSymptoms: conditionSymptomIds.length,
            vitalSignMatch: Math.round(vitalSignScore),
            category: condition.category,
            severity: condition.severity,
          };
        })
      );

      // Sort by score and get top 5
      const topConditions = scoredConditions
        .filter((c: any) => c.score > 0)
        .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
        .slice(0, 5);

      // Get AI explanation using LLM
      const symptomNames = await Promise.all(
        input.symptomIds.map(async (id: number) => {
          const sym = await db
            .select()
            .from(symptoms)
            .where(eq(symptoms.id, id))
            .limit(1);
          return sym[0]?.name || `Symptom ${id}`;
        })
      );

      const aiPrompt = `
You are a pediatric diagnosis assistant. Based on the following information, provide a brief differential diagnosis explanation:

Patient Age: ${input.ageInMonths} months
Weight: ${input.weightInKg} kg

Symptoms: ${symptomNames.join(", ")}

Vital Signs:
- Heart Rate: ${input.vitalSigns.heartRate || "Not recorded"} bpm
- Temperature: ${input.vitalSigns.temperature || "Not recorded"} °C
- Respiratory Rate: ${input.vitalSigns.respiratoryRate || "Not recorded"} breaths/min
- O2 Saturation: ${input.vitalSigns.oxygenSaturation || "Not recorded"}%

Top Differential Diagnoses:
${topConditions.map((c: any, i: number) => `${i + 1}. ${c.conditionName} (Confidence: ${c.score}%)`).join("\n")}

Provide a brief clinical reasoning for these diagnoses and any urgent actions needed.
`;

      let aiExplanation = "";
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are an expert pediatric clinician providing differential diagnosis support. Be concise and evidence-based.",
            },
            {
              role: "user",
              content: aiPrompt,
            },
          ],
        });
        const content = response.choices[0]?.message?.content;
        aiExplanation = typeof content === "string" ? content : "Unable to generate AI explanation.";
      } catch (error) {
        console.error("LLM error:", error);
        aiExplanation = "Unable to generate AI explanation at this time.";
      }

      // Save diagnosis history
      const diagnosisRecord = await db.insert(diagnosisHistory).values({
        patientId: input.patientId,
        providerId: ctx.user.id,
        symptoms: JSON.stringify(input.symptomIds),
        vitalSigns: JSON.stringify(input.vitalSigns),
        suggestedConditions: JSON.stringify(topConditions),
        confidence: topConditions[0]?.score || 0,
        aiExplanation,
      });

      // Save individual scores
      const diagnosisId = diagnosisRecord[0];
      await Promise.all(
        topConditions.map((c: any, index: number) =>
          db.insert(differentialDiagnosisScores).values({
            diagnosisHistoryId: diagnosisId,
            conditionId: c.conditionId,
            conditionName: c.conditionName,
            score: c.score,
            matchedSymptoms: c.matchedSymptoms,
            totalSymptoms: c.totalSymptoms,
            vitalSignMatch: c.vitalSignMatch,
            rank: index + 1,
          })
        )
      );

      return {
        diagnosisId,
        topConditions,
        aiExplanation,
      };
    }),

  /**
   * Confirm diagnosis outcome
   */
  confirmDiagnosis: protectedProcedure
    .input(
      z.object({
        diagnosisHistoryId: z.number(),
        selectedConditionId: z.number(),
        outcome: z.enum(["confirmed", "ruled_out", "pending", "unknown"]),
        actualConditionId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const db = getDb() as any;

      // Update diagnosis history
      await db
        .update(diagnosisHistory)
        .set({
          selectedCondition: input.selectedConditionId,
          outcome: input.outcome,
          outcomeCondition: input.actualConditionId,
          providerNotes: input.notes,
          updatedAt: new Date(),
        })
        .where(eq(diagnosisHistory.id, input.diagnosisHistoryId));

      // Update accuracy metrics
      if (input.outcome === "confirmed" && input.actualConditionId) {
        const existingAccuracy = await db
          .select()
          .from(diagnosisAccuracy)
          .where(
            and(
              eq(diagnosisAccuracy.providerId, ctx.user.id),
              eq(diagnosisAccuracy.conditionId, input.actualConditionId)
            )
          )
          .limit(1);

        if (existingAccuracy.length > 0) {
          const accuracy = existingAccuracy[0];
          const newTotal = accuracy.totalDiagnoses + 1;
          const newCorrect =
            accuracy.correctDiagnoses + (input.selectedConditionId === input.actualConditionId ? 1 : 0);
          const newAccuracy = (newCorrect / newTotal) * 100;

          await db
            .update(diagnosisAccuracy)
            .set({
              totalDiagnoses: newTotal,
              correctDiagnoses: newCorrect,
              accuracy: newAccuracy,
              updatedAt: new Date(),
            })
            .where(eq(diagnosisAccuracy.id, accuracy.id));
        } else {
          await db.insert(diagnosisAccuracy).values({
            providerId: ctx.user.id,
            conditionId: input.actualConditionId,
            totalDiagnoses: 1,
            correctDiagnoses: input.selectedConditionId === input.actualConditionId ? 1 : 0,
            accuracy: input.selectedConditionId === input.actualConditionId ? 100 : 0,
            averageConfidence: 0,
          });
        }
      }

      return { success: true };
    }),

  /**
   * Get diagnosis history for a patient
   */
  getDiagnosisHistory: protectedProcedure
    .input(z.object({ patientId: z.number(), limit: z.number().default(10) }))
    .query(async ({ ctx, input }: any) => {
      const db = getDb() as any;
      const history = await db
        .select()
        .from(diagnosisHistory)
        .where(eq(diagnosisHistory.patientId, input.patientId))
        .orderBy(desc(diagnosisHistory.createdAt))
        .limit(input.limit);

      return history;
    }),

  /**
   * Get provider diagnosis accuracy
   */
  getProviderAccuracy: protectedProcedure.query(async ({ ctx }: any) => {
    const db = getDb() as any;
    const accuracy = await db
      .select()
      .from(diagnosisAccuracy)
      .where(eq(diagnosisAccuracy.providerId, ctx.user.id));

    return accuracy;
  }),

  /**
   * Initialize medical conditions database with common pediatric conditions
   */
  initializeConditions: publicProcedure.mutation(async () => {
    const db = getDb() as any;

    // Check if conditions already exist
    const existing = await db.select().from(medicalConditions).limit(1);
    if (existing.length > 0) {
      return { message: "Conditions already initialized" };
    }

    // Add common pediatric conditions
    const conditions = [
      {
        name: "Acute Gastroenteritis",
        description: "Inflammation of stomach and intestines",
        icdCode: "A09",
        category: "infectious",
        severity: "moderate",
        prevalence: "common",
        ageGroupsAffected: JSON.stringify(["0-1", "1-3", "3-6", "6-12", "12-18"]),
        commonSymptoms: JSON.stringify([1, 2, 3]),
        criticalVitalSigns: JSON.stringify({
          heartRate: { min: 100, max: 160 },
          temperature: { min: 36.5, max: 39.5 },
        }),
        treatmentApproach: "Oral rehydration therapy, supportive care",
        emergencyActions: JSON.stringify(["IV rehydration if severe", "Monitor electrolytes"]),
      },
      {
        name: "Pneumonia",
        description: "Infection of lung tissue",
        icdCode: "J18",
        category: "respiratory",
        severity: "moderate",
        prevalence: "common",
        ageGroupsAffected: JSON.stringify(["0-1", "1-3", "3-6", "6-12", "12-18"]),
        commonSymptoms: JSON.stringify([2, 7]),
        criticalVitalSigns: JSON.stringify({
          respiratoryRate: { min: 40, max: 100 },
          oxygenSaturation: { min: 90, max: 100 },
          temperature: { min: 37, max: 40 },
        }),
        treatmentApproach: "Antibiotics, oxygen therapy if needed",
        emergencyActions: JSON.stringify(["Oxygen supplementation", "Chest X-ray", "Blood cultures"]),
      },
      {
        name: "Malaria",
        description: "Parasitic infection transmitted by mosquitoes",
        icdCode: "B54",
        category: "infectious",
        severity: "severe",
        prevalence: "common",
        ageGroupsAffected: JSON.stringify(["0-1", "1-3", "3-6", "6-12", "12-18"]),
        commonSymptoms: JSON.stringify([1, 6, 9]),
        criticalVitalSigns: JSON.stringify({
          temperature: { min: 38, max: 41 },
          heartRate: { min: 120, max: 180 },
        }),
        treatmentApproach: "Antimalarial drugs (artemisinin derivatives)",
        emergencyActions: JSON.stringify(["Blood smear/RDT", "Quinine for severe cases", "Monitor for complications"]),
      },
      {
        name: "Meningitis",
        description: "Inflammation of meninges",
        icdCode: "G03",
        category: "neurological",
        severity: "critical",
        prevalence: "rare",
        ageGroupsAffected: JSON.stringify(["0-1", "1-3", "3-6", "6-12", "12-18"]),
        commonSymptoms: JSON.stringify([1, 6, 8]),
        criticalVitalSigns: JSON.stringify({
          temperature: { min: 38, max: 41 },
          heartRate: { min: 140, max: 200 },
        }),
        treatmentApproach: "Antibiotics, supportive care, anticonvulsants",
        emergencyActions: JSON.stringify(["Lumbar puncture", "Blood cultures", "Antibiotics immediately", "ICU admission"]),
      },
      {
        name: "Septic Shock",
        description: "Life-threatening condition from infection",
        icdCode: "R65.21",
        category: "infectious",
        severity: "critical",
        prevalence: "rare",
        ageGroupsAffected: JSON.stringify(["0-1", "1-3", "3-6", "6-12", "12-18"]),
        commonSymptoms: JSON.stringify([1, 6, 5]),
        criticalVitalSigns: JSON.stringify({
          temperature: { min: 36, max: 41 },
          heartRate: { min: 150, max: 220 },
          systolicBP: { min: 50, max: 90 },
        }),
        treatmentApproach: "Aggressive fluid resuscitation, antibiotics, vasopressors",
        emergencyActions: JSON.stringify(["IV access", "Fluid bolus", "Antibiotics", "ICU/HDU admission", "Monitor lactate"]),
      },
    ];

    await Promise.all(
      conditions.map((c) =>
        db.insert(medicalConditions).values(c)
      )
    );

    // Add symptoms
    const syms = [
      { name: "Diarrhea", category: "diarrhea" },
      { name: "Cough", category: "cough" },
      { name: "Vomiting", category: "vomiting" },
      { name: "Abdominal Pain", category: "abdominal_pain" },
      { name: "Rash", category: "rash" },
      { name: "Lethargy", category: "lethargy" },
      { name: "Seizures", category: "seizure" },
      { name: "Difficulty Breathing", category: "difficulty_breathing" },
      { name: "Other", category: "other" },
    ];

    await Promise.all(
      syms.map((s) =>
        db.insert(symptoms).values(s)
      )
    );

    return { message: "Conditions initialized successfully" };
  }),
});
