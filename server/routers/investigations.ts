import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { eq, desc } from "drizzle-orm";
import {
  investigations,
  investigationResults,
  investigationAnalysis,
  investigationHistory,
  investigationTrends,
  patients,
} from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";

export const investigationsRouter = router({
  // Upload investigation
  uploadInvestigation: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        investigationType: z.enum(["lab", "imaging", "other"]),
        testName: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Create investigation record
      const result = await (db as any)
        .insert(investigations)
        .values({
          patientId: input.patientId,
          providerId: ctx.user.id,
          investigationType: input.investigationType,
          testName: input.testName,
          description: input.description,
          uploadedAt: new Date(),
          createdAt: new Date(),
        });

      return {
        success: true,
        investigationId: (result as any)[0],
        message: "Investigation uploaded successfully",
      };
    }),

  // Add investigation result
  addInvestigationResult: protectedProcedure
    .input(
      z.object({
        investigationId: z.number(),
        resultName: z.string(),
        resultValue: z.string(),
        unit: z.string().optional(),
        normalRange: z.string().optional(),
        isAbnormal: z.boolean().optional(),
        severity: z.enum(["normal", "mild", "moderate", "severe"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      await (db as any)
        .insert(investigationResults)
        .values({
          investigationId: input.investigationId,
          resultType: "numeric",
          resultName: input.resultName,
          resultValue: input.resultValue,
          unit: input.unit,
          normalRange: input.normalRange,
          isAbnormal: input.isAbnormal || false,
          severity: input.severity || "normal",
          createdAt: new Date(),
        });

      return { success: true, message: "Result added successfully" };
    }),

  // Get AI interpretation
  getAIInterpretation: protectedProcedure
    .input(z.object({ investigationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();

      // Get investigation and results
      const investigation = await (db as any)
        .select()
        .from(investigations)
        .where(eq(investigations.id, input.investigationId))
        .limit(1);

      if (!investigation.length) {
        throw new Error("Investigation not found");
      }

      const results = await (db as any)
        .select()
        .from(investigationResults)
        .where(eq(investigationResults.investigationId, input.investigationId));

      // Prepare data for LLM
      const resultsText = (results as any[])
        .map(
          (r) =>
            `${r.resultName}: ${r.resultValue} ${r.unit || ""} (Normal: ${r.normalRange || "N/A"})`
        )
        .join("\n");

      // Call LLM for interpretation
      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are an expert pediatric pathologist. Analyze the following investigation results and provide clinical interpretation, differential diagnoses, and recommendations.",
          },
          {
            role: "user",
            content: `Test: ${(investigation[0] as any).testName}\n\nResults:\n${resultsText}\n\nProvide:\n1. Clinical interpretation\n2. Top 3 differential diagnoses with confidence scores\n3. Clinical significance\n4. Follow-up recommendations`,
          },
        ],
      });

      const interpretation = (llmResponse.choices[0].message.content as string) || "";

      // Parse differential diagnoses from LLM response
      const differentialDiagnoses = extractDiagnoses(interpretation);

      // Save analysis
      await (db as any)
        .insert(investigationAnalysis)
        .values({
          investigationId: input.investigationId,
          aiInterpretation: interpretation,
          confidence: 85, // Default confidence
          differentialDiagnoses: JSON.stringify(differentialDiagnoses),
          recommendations: extractRecommendations(interpretation),
          clinicalSignificance: extractClinicalSignificance(interpretation),
          followUpSuggestions: extractFollowUp(interpretation),
          analyzedAt: new Date(),
          createdAt: new Date(),
        });

      return {
        interpretation,
        differentialDiagnoses,
        recommendations: extractRecommendations(interpretation),
      };
    }),

  // Get investigation results
  getInvestigationResults: protectedProcedure
    .input(z.object({ investigationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();

      return await (db as any)
        .select()
        .from(investigationResults)
        .where(eq(investigationResults.investigationId, input.investigationId));
    }),

  // Get investigation history
  getInvestigationHistory: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();

      return await (db as any)
        .select()
        .from(investigations)
        .where(eq(investigations.patientId, input.patientId))
        .orderBy(desc(investigations.uploadedAt));
    }),

  // Get investigation analysis
  getInvestigationAnalysis: protectedProcedure
    .input(z.object({ investigationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();

      const analysis = await (db as any)
        .select()
        .from(investigationAnalysis)
        .where(eq(investigationAnalysis.investigationId, input.investigationId))
        .limit(1);

      if (!analysis.length) {
        return null;
      }

      return {
        ...analysis[0],
        differentialDiagnoses: JSON.parse((analysis[0] as any).differentialDiagnoses || "[]"),
      };
    }),

  // Get investigation trends
  getInvestigationTrends: protectedProcedure
    .input(z.object({ patientId: z.number(), testName: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();

      return await (db as any)
        .select()
        .from(investigationTrends)
        .where(
          eq(investigationTrends.patientId, input.patientId) &&
            eq(investigationTrends.testName, input.testName)
        )
        .orderBy(desc(investigationTrends.createdAt));
    }),

  // Compare investigations
  compareInvestigations: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        testName: z.string(),
        days: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      // Get recent investigations
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const recentInvestigations = await (db as any)
        .select()
        .from(investigations)
        .where(eq(investigations.patientId, input.patientId));

      // Group by test type and calculate trends
      const trends: Record<string, any> = {};

      (recentInvestigations as any[]).forEach((inv) => {
        if (!trends[inv.testName]) {
          trends[inv.testName] = {
            testName: inv.testName,
            count: 0,
            dates: [],
          };
        }
        trends[inv.testName].count++;
        trends[inv.testName].dates.push(inv.uploadedAt);
      });

      return Object.values(trends);
    }),

  // Get abnormal results
  getAbnormalResults: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();

      // Get all investigations for patient
      const patientInvestigations = await (db as any)
        .select()
        .from(investigations)
        .where(eq(investigations.patientId, input.patientId));

      const abnormalResults: any[] = [];

      for (const inv of patientInvestigations as any[]) {
        const results = await (db as any)
          .select()
          .from(investigationResults)
          .where(
            eq(investigationResults.investigationId, inv.id) &&
              eq(investigationResults.isAbnormal, true)
          );

        abnormalResults.push(...results);
      }

      return abnormalResults;
    }),

  // Get investigation statistics
  getInvestigationStats: protectedProcedure
    .input(z.object({ providerId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      const providerId = input.providerId || ctx.user.id;

      // Get all investigations for provider
      const allInvestigations = await (db as any)
        .select()
        .from(investigations)
        .where(eq(investigations.providerId, providerId));

      // Calculate statistics
      const labTests = (allInvestigations as any[]).filter(
        (i) => i.investigationType === "lab"
      ).length;
      const imagingTests = (allInvestigations as any[]).filter(
        (i) => i.investigationType === "imaging"
      ).length;

      return {
        totalInvestigations: allInvestigations.length,
        labTests,
        imagingTests,
        otherTests: allInvestigations.length - labTests - imagingTests,
        averagePerPatient:
          allInvestigations.length > 0
            ? (allInvestigations.length / new Set((allInvestigations as any[]).map((i) => i.patientId)).size).toFixed(2)
            : 0,
      };
    }),

  // Get clinical insights from investigations
  getClinicalInsights: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();

      // Get all investigations and results
      const investigations_ = await (db as any)
        .select()
        .from(investigations)
        .where(eq(investigations.patientId, input.patientId));

      const abnormalResults = await (db as any)
        .select()
        .from(investigationResults)
        .where(eq(investigationResults.isAbnormal, true));

      // Get analysis
      const analyses = await (db as any)
        .select()
        .from(investigationAnalysis)
        .orderBy(desc(investigationAnalysis.createdAt));

      return {
        totalInvestigations: investigations_.length,
        abnormalFindings: abnormalResults.length,
        recentAnalyses: (analyses as any[]).slice(0, 5),
        insights: [
          {
            type: "abnormal_trend",
            value: abnormalResults.length,
            recommendation: "Monitor abnormal findings closely",
          },
          {
            type: "investigation_frequency",
            value: investigations_.length,
            recommendation: "Consider consolidating investigations",
          },
        ],
      };
    }),
});

// Helper functions
function extractDiagnoses(text: string): any[] {
  // Parse LLM response to extract diagnoses
  const diagnoses = [];
  const lines = text.split("\n");

  for (const line of lines) {
    if (line.includes("diagnosis") || line.includes("Diagnosis")) {
      diagnoses.push({
        name: line.replace(/.*diagnosis[:\s]*/i, "").trim(),
        confidence: 75,
      });
    }
  }

  return diagnoses;
}

function extractRecommendations(text: string): string {
  const lines = text.split("\n");
  const recommendations = lines.filter(
    (l) =>
      l.includes("recommend") ||
      l.includes("suggest") ||
      l.includes("follow-up") ||
      l.includes("monitor")
  );
  return recommendations.join("\n");
}

function extractClinicalSignificance(text: string): string {
  const lines = text.split("\n");
  const significance = lines.find(
    (l) =>
      l.includes("significant") ||
      l.includes("clinical") ||
      l.includes("important") ||
      l.includes("critical")
  );
  return significance || "Clinical significance to be determined";
}

function extractFollowUp(text: string): string {
  const lines = text.split("\n");
  const followUp = lines.find(
    (l) =>
      l.includes("follow-up") ||
      l.includes("follow up") ||
      l.includes("repeat") ||
      l.includes("recheck")
  );
  return followUp || "Follow-up as clinically indicated";
}
