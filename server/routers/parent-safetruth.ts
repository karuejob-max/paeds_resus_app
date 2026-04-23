import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { 
  parentSafeTruthEvents, 
  parentSafeTruthSubmissions, 
  systemDelayAnalysis, 
  hospitalImprovementMetrics,
  institutionalAccounts,
  accreditedFacilities,
} from "../../drizzle/schema";
import { eq, desc, and, gte, lte, count, like, sql } from "drizzle-orm";
import { getDb } from "../db";
import { sendEmail } from "../email-service";
import { logStructured } from "../lib/structured-log";
import { trackEvent } from "../services/analytics.service";

/** EAT = UTC+3. "This month" = calendar month in EAT per platform. */
function startOfMonthEAT(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1, -3, 0, 0, 0));
}
function endOfMonthEAT(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0, 20, 59, 59, 999));
}

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
        // Structured gap data from the wizard form
        systemGaps: z.array(z.string()).optional(),
        whereDelayHappened: z.array(z.string()).optional(),
        registrationBeforeTriage: z.boolean().optional(),
        shift: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Build structured improvements array from all gap signals
      const allGaps: string[] = [
        ...(input.systemGaps ?? []),
        ...(input.whereDelayHappened ?? []),
        ...(input.registrationBeforeTriage ? ["registration-before-triage"] : []),
      ];
      const communicationGaps = allGaps.includes("communication") ? 1 : 0;
      const interventionDelays = [
        "billing-cashier", "registration-desk", "waiting-room", "casualty-queue",
        "ward-handover", "gate", "registration-before-triage",
      ].some((g) => allGaps.includes(g)) ? 1 : 0;
      const monitoringGaps = allGaps.includes("training") || allGaps.includes("protocols") ? 1 : 0;

      // Calculate total duration from events
      const firstEventTime = new Date(input.events[0].time).getTime();
      const lastEventTime = new Date(input.events[input.events.length - 1].time).getTime();
      const totalDurationMinutes = Math.round((lastEventTime - firstEventTime) / 60000);

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
          totalDurationMinutes: totalDurationMinutes > 0 ? totalDurationMinutes : null,
          communicationGaps,
          interventionDelays,
          monitoringGaps,
          improvements: allGaps.length > 0 ? JSON.stringify(allGaps) : null,
          isAnonymous: input.isAnonymous,
          parentName: input.parentName,
          parentEmail: input.parentEmail,
          status: "submitted",
        });

      const submissionId = (result as any)[0].insertId || (result as any).insertId;

      await trackEvent({
        userId: ctx.user.id,
        eventType: "safetruth_submission",
        eventName: "Safe-Truth timeline submitted",
        eventData: {
          submissionId,
          childOutcome: input.childOutcome,
          eventCount: input.events.length,
        },
        sessionId: `safetruth_submission_${submissionId}`,
      });

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

  // Stats for parent dashboard: submissions this month, last submission
  getSafeTruthStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        submissionsThisMonth: 0,
        lastSubmission: null,
        totalSubmissions: 0,
        reviewedSubmissionsCount: 0,
      };
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const periodStart = startOfMonthEAT(year, month);
    const periodEnd = endOfMonthEAT(year, month);

    const inMonth = await db
      .select({ id: parentSafeTruthSubmissions.id })
      .from(parentSafeTruthSubmissions)
      .where(
        and(
          eq(parentSafeTruthSubmissions.userId, ctx.user.id),
          gte(parentSafeTruthSubmissions.createdAt, periodStart),
          lte(parentSafeTruthSubmissions.createdAt, periodEnd)
        )
      );
    const last = await db
      .select({ createdAt: parentSafeTruthSubmissions.createdAt })
      .from(parentSafeTruthSubmissions)
      .where(eq(parentSafeTruthSubmissions.userId, ctx.user.id))
      .orderBy(desc(parentSafeTruthSubmissions.createdAt))
      .limit(1);

    const [totalRow] = await db
      .select({ total: count() })
      .from(parentSafeTruthSubmissions)
      .where(eq(parentSafeTruthSubmissions.userId, ctx.user.id));

    const [reviewedRow] = await db
      .select({ total: count() })
      .from(parentSafeTruthSubmissions)
      .where(
        and(eq(parentSafeTruthSubmissions.userId, ctx.user.id), eq(parentSafeTruthSubmissions.status, "reviewed"))
      );

    return {
      submissionsThisMonth: inMonth.length,
      lastSubmission: last[0]?.createdAt ?? null,
      totalSubmissions: Number(totalRow?.total ?? 0),
      reviewedSubmissionsCount: Number(reviewedRow?.total ?? 0),
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

  // Search facilities for parent facility picker
  searchFacilities: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { results: [] };
      const q = `%${input.query}%`;
      const institutions = await db
        .select({ id: institutionalAccounts.id, name: institutionalAccounts.companyName })
        .from(institutionalAccounts)
        .where(like(institutionalAccounts.companyName, q))
        .limit(8);
      const accredited = await db
        .select({ id: accreditedFacilities.id, name: accreditedFacilities.facilityName, county: accreditedFacilities.county })
        .from(accreditedFacilities)
        .where(like(accreditedFacilities.facilityName, q))
        .limit(8);
      const seen = new Set<string>();
      const results: Array<{ id: number; name: string; badge: string; county: string }> = [];
      for (const i of institutions) {
        if (!seen.has(i.name)) { seen.add(i.name); results.push({ id: i.id, name: i.name, badge: 'Registered', county: '' }); }
      }
      for (const a of accredited) {
        if (!seen.has(a.name)) { seen.add(a.name); results.push({ id: a.id, name: a.name, badge: 'Accredited', county: a.county || '' }); }
      }
      return { results };
    }),

  // Hospital Admin: get Safe-Truth summary for their facility
  getHospitalSafeTruthSummary: protectedProcedure
    .input(z.object({ hospitalId: z.number(), months: z.number().default(3) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { totalSubmissions: 0, outcomes: {}, topGaps: [], avgDelayMinutes: null, recentSubmissions: [] };
      const since = new Date(Date.now() - input.months * 30 * 86_400_000);
      const submissions = await db
        .select()
        .from(parentSafeTruthSubmissions)
        .where(and(
          eq(parentSafeTruthSubmissions.hospitalId, input.hospitalId),
          gte(parentSafeTruthSubmissions.createdAt, since)
        ))
        .orderBy(desc(parentSafeTruthSubmissions.createdAt))
        .limit(200);
      const outcomes: Record<string, number> = {};
      for (const s of submissions) {
        outcomes[s.childOutcome] = (outcomes[s.childOutcome] || 0) + 1;
      }
      const gapMap: Record<string, number> = {};
      for (const s of submissions) {
        try {
          const impr = s.improvements ? JSON.parse(s.improvements) : [];
          if (Array.isArray(impr)) {
            for (const g of impr) { gapMap[String(g)] = (gapMap[String(g)] || 0) + 1; }
          }
        } catch { /* skip */ }
      }
      const topGaps = Object.entries(gapMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([gap, count]) => ({ gap, count }));
      const withDuration = submissions.filter((s) => s.totalDurationMinutes != null);
      const avgDelayMinutes = withDuration.length
        ? Math.round(withDuration.reduce((sum, s) => sum + (s.totalDurationMinutes || 0), 0) / withDuration.length)
        : null;
      const recentSubmissions = submissions.slice(0, 10).map((s) => ({
        id: s.id,
        childOutcome: s.childOutcome,
        totalDurationMinutes: s.totalDurationMinutes,
        communicationGaps: s.communicationGaps,
        interventionDelays: s.interventionDelays,
        monitoringGaps: s.monitoringGaps,
        createdAt: s.createdAt,
      }));
      return { totalSubmissions: submissions.length, outcomes, topGaps, avgDelayMinutes, recentSubmissions };
    }),

  // Admin: mark submission as response ready and notify parent by email
  markResponseReady: adminProcedure
    .input(z.object({ submissionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db
        .select()
        .from(parentSafeTruthSubmissions)
        .where(eq(parentSafeTruthSubmissions.id, input.submissionId))
        .limit(1);

      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found" });
      const sub = rows[0];

      await db
        .update(parentSafeTruthSubmissions)
        .set({ status: "reviewed", updatedAt: new Date() })
        .where(eq(parentSafeTruthSubmissions.id, input.submissionId));

      let parentNotified = false;
      if (sub.parentEmail && !sub.isAnonymous) {
        const emailResult = await sendEmail(sub.parentEmail, "safetruthResponseReady", {
          parentName: sub.parentName || "Parent",
          dashboardLink: process.env.APP_BASE_URL
            ? `${process.env.APP_BASE_URL.replace(/\/$/, "")}/parent-safe-truth`
            : "https://app.paedsresus.com/parent-safe-truth",
        });
        parentNotified = Boolean(emailResult.success);
      }

      logStructured("safetruth_response_ready", {
        submissionId: input.submissionId,
        parentNotified,
      });

      return { success: true };
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
