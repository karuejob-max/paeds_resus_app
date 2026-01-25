import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { 
  parentSafeTruthEvents, 
  parentSafeTruthSubmissions, 
  systemDelayAnalysis, 
  hospitalImprovementMetrics 
} from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { getDb } from "../db";

const eventSchema = z.object({
  eventType: z.enum([
    "arrival",
    "symptoms",
    "doctor-seen",
    "intervention",
    "oxygen",
    "communication",
    "fluids",
    "concern-raised",
    "monitoring",
    "medication",
    "referral-decision",
    "referral-organized",
    "transferred",
    "update",
  ]),
  time: z.string().datetime(),
  description: z.string().min(1),
});

export const parentSafeTruthRouter = router({
  // Submit parent Safe-Truth timeline
  submitTimeline: protectedProcedure
    .input(
      z.object({
        childOutcome: z.enum(["discharged", "referred", "passed-away"]),
        childName: z.string().optional(),
        childAge: z.number().optional(),
        parentName: z.string().optional(),
        parentEmail: z.string().email().optional(),
        isAnonymous: z.boolean().default(true),
        hospitalId: z.number().optional(),
        events: z.array(eventSchema).min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Create submission
      const result = await db
        .insert(parentSafeTruthSubmissions)
        .values({
          userId: ctx.user.id,
          hospitalId: input.hospitalId,
          childName: input.childName,
          childAge: input.childAge,
          childOutcome: input.childOutcome,
          arrivalTime: new Date(input.events[0].time),
          dischargeOrReferralTime: new Date(input.events[input.events.length - 1].time),
          isAnonymous: input.isAnonymous,
          parentName: input.parentName,
          parentEmail: input.parentEmail,
          status: "submitted",
        });

      const submissionId = (result as any)[0].insertId || (result as any).insertId;

      // Insert events
      for (const event of input.events) {
        await db
          .insert(parentSafeTruthEvents)
          .values({
            submissionId: submissionId,
            eventType: event.eventType as any,
            eventTime: new Date(event.time),
            description: event.description,
          });
      }

      // Analyze delays
      const analysis = await analyzeSystemDelays(submissionId, input.hospitalId);

      return {
        submissionId,
        eventCount: input.events.length,
        systemGapsIdentified: analysis?.gaps ? Object.values(analysis.gaps).filter(Boolean).length : 0,
        analysis,
        message: "Your story has been submitted successfully. Thank you for helping us improve care.",
      };
    }),

  // Get parent's submissions
  getMySubmissions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const submissions = await db
      .select()
      .from(parentSafeTruthSubmissions)
      .where(eq(parentSafeTruthSubmissions.userId, ctx.user.id))
      .orderBy(desc(parentSafeTruthSubmissions.createdAt));

    return submissions;
  }),

  // Get submission details with events
  getSubmissionDetails: protectedProcedure
    .input(z.object({ submissionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const submission = await db
        .select()
        .from(parentSafeTruthSubmissions)
        .where(
          and(
            eq(parentSafeTruthSubmissions.id, input.submissionId),
            eq(parentSafeTruthSubmissions.userId, ctx.user.id)
          )
        );

      if (!submission.length) {
        throw new Error("Submission not found");
      }

      const events = await db
        .select()
        .from(parentSafeTruthEvents)
        .where(eq(parentSafeTruthEvents.submissionId, input.submissionId))
        .orderBy(parentSafeTruthEvents.eventTime);

      const analysis = await db
        .select()
        .from(systemDelayAnalysis)
        .where(eq(systemDelayAnalysis.submissionId, input.submissionId));

      return {
        submission: submission[0],
        events,
        analysis: analysis[0] || null,
      };
    }),

  // Get hospital improvement metrics
  getHospitalMetrics: protectedProcedure
    .input(z.object({ hospitalId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const metrics = await db
        .select()
        .from(hospitalImprovementMetrics)
        .where(eq(hospitalImprovementMetrics.hospitalId, input.hospitalId));

      return metrics[0] || null;
    }),

  // Get delay analysis for hospital
  getHospitalDelayAnalysis: protectedProcedure
    .input(z.object({ hospitalId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const analyses = await db
        .select()
        .from(systemDelayAnalysis)
        .where(eq(systemDelayAnalysis.hospitalId, input.hospitalId))
        .orderBy(desc(systemDelayAnalysis.createdAt));

      return analyses;
    }),
});

// Helper function to analyze system delays
async function analyzeSystemDelays(submissionId: number, hospitalId?: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const events = await db
    .select()
    .from(parentSafeTruthEvents)
    .where(eq(parentSafeTruthEvents.submissionId, submissionId))
    .orderBy(parentSafeTruthEvents.eventTime);

  if (events.length < 2) {
    return null;
  }

  // Calculate delays
  const eventMap = new Map<string, any>(events.map((e: any) => [e.eventType, e]));
  const delays: Record<string, number | null> = {};

  // Arrival to doctor delay
  if (eventMap.has("arrival") && eventMap.has("doctor-seen")) {
    const arrivalEvent = eventMap.get("arrival");
    const doctorEvent = eventMap.get("doctor-seen");
    if (arrivalEvent && doctorEvent) {
      const arrivalTime = new Date(arrivalEvent.eventTime);
      const doctorTime = new Date(doctorEvent.eventTime);
      delays.arrivalToDoctorDelay = Math.floor(
        (doctorTime.getTime() - arrivalTime.getTime()) / (1000 * 60)
      );
    }
  }

  // Doctor to intervention delay
  if (eventMap.has("doctor-seen") && eventMap.has("intervention")) {
    const doctorEvent = eventMap.get("doctor-seen");
    const interventionEvent = eventMap.get("intervention");
    if (doctorEvent && interventionEvent) {
      const doctorTime = new Date(doctorEvent.eventTime);
      const interventionTime = new Date(interventionEvent.eventTime);
      delays.doctorToInterventionDelay = Math.floor(
        (interventionTime.getTime() - doctorTime.getTime()) / (1000 * 60)
      );
    }
  }

  // Identify gaps
  const hasMonitoringGap = !eventMap.has("monitoring");
  const hasCommunicationGap = !eventMap.has("communication");
  const hasInterventionDelay = (delays.arrivalToDoctorDelay || 0) > 30;

  // Generate recommendations
  const recommendations = [];
  if (hasMonitoringGap) {
    recommendations.push("Improve continuous patient monitoring protocols");
  }
  if (hasCommunicationGap) {
    recommendations.push("Enhance parent-staff communication during treatment");
  }
  if (hasInterventionDelay) {
    recommendations.push("Reduce time from arrival to doctor consultation");
  }

  // Calculate severity score (0-10)
  let severityScore = 0;
  if (delays.arrivalToDoctorDelay && delays.arrivalToDoctorDelay > 30) severityScore += 3;
  if (delays.doctorToInterventionDelay && delays.doctorToInterventionDelay > 20) severityScore += 3;
  if (hasMonitoringGap) severityScore += 2;
  if (hasCommunicationGap) severityScore += 2;

  // Save analysis
  if (hospitalId) {
    await db
      .insert(systemDelayAnalysis)
      .values({
        submissionId,
        hospitalId,
        arrivalToDoctorDelay: delays.arrivalToDoctorDelay,
        doctorToInterventionDelay: delays.doctorToInterventionDelay,
        hasMonitoringGap: hasMonitoringGap,
        hasCommunicationGap: hasCommunicationGap,
        hasInterventionDelay: hasInterventionDelay,
        recommendations: JSON.stringify(recommendations),
        improvementAreas: JSON.stringify(
          Object.entries(delays)
            .filter(([, v]) => v && v > 0)
            .map(([k]) => k)
        ),
        severityScore: (severityScore / 10).toString() as any,
      });
  }

  return {
    delays,
    gaps: {
      monitoring: hasMonitoringGap,
      communication: hasCommunicationGap,
      intervention: hasInterventionDelay,
    },
    recommendations,
    severityScore: severityScore / 10,
  };
}
