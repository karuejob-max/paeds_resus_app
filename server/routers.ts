import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendEmail } from "./email-service";
import { enrollmentRouter } from "./routers/enrollment";
import { instructorRouter } from "./routers/instructor";
import { certificateRouter } from "./routers/certificates";
import { smsRouter } from "./routers/sms";
import { aiLearningRouter } from "./routers/ai-learning";
import { notificationsRouter } from "./routers/notifications";
import { securityRouter } from "./routers/security";
import { googleWorkspaceRouter } from "./routers/google-workspace";
import { personalizationRouter } from "./routers/personalization";
import { paymentsRouter } from "./routers/payments";
import { collaborationRouter } from "./routers/collaboration";
import { gamificationRouter } from "./routers/gamification";
import { aiContentRouter } from "./routers/ai-content";
import { analyticsRouter } from "./routers/analytics";
import { searchRecommendationsRouter } from "./routers/search-recommendations";
import { liveTrainingRouter } from "./routers/live-training";
import { cmsRouter } from "./routers/cms";
import { emailAutomationRouter } from "./routers/email-automation";
import { emailCampaignsRouter } from "./routers/email-campaigns";
// import { institutionOnboardingRouter } from "./routers/institution-onboarding"; // Replaced by institution router
// Remove this import - we'll use the new institution router instead
import { chatSupportRouter } from "./routers/chat-support";
import { aiAssistantRouter } from "./routers/ai-assistant";
import { careSignalEventsRouter } from "./routers/care-signal-events";
import { reportingRouter } from "./routers/reporting";
import { mobileRouter } from "./routers/mobile-features";
import { enterpriseRouter } from "./routers/enterprise";
import { advancedAnalyticsRouter } from "./routers/advanced-analytics";
import { marketplaceRouter } from "./routers/marketplace";
import { mpesaRouter } from "./routers/mpesa";
import { feedbackRouter } from "./routers/feedback";
import { eventsRouter } from "./routers/events";
import { performanceRouter } from "./routers/performance";
import { supportRouter } from "./routers/support";
import { dashboardsRouter } from "./routers/dashboards";
import { predictionsRouter } from "./routers/predictions";
import { emailRouter } from "./routers/email";
import { parentSafeTruthRouter } from "./routers/parent-safetruth";
import { adminStatsRouter } from "./routers/admin-stats";
import { referralsRouter } from "./routers/referrals";
import { institutionRouter } from "./routers/institution";
import { institutionalNotificationsRouter } from "./routers/institutional-notifications";
import { productionSecurityRouter } from "./routers/production-security";
import { predictiveAnalyticsRouter } from "./routers/predictive-analytics";
import { localizationRouter } from "./routers/localization";
import { mobileSyncRouter } from "./routers/mobile-sync";
import { incidentAlertsRouter } from "./routers/incident-alerts";
import { emrIntegrationRouter } from "./routers/emr-integration";
import { telemedicineRouter } from "./routers/telemedicine";
import { vitalsRouter } from "./routers/vitals";
import { cprClockRouter } from "./routers/cprClock";
import { emergencyProtocolsRouter } from "./routers/emergencyProtocols";
import { alertsRouter } from "./routers/alerts";
import { diagnosisRouter } from "./routers/diagnosis";
import { learningRouter } from "./routers/learning";
import { outcomesRouter } from "./routers/outcomes";
import { investigationsRouter } from "./routers/investigations";
import { curriculumRouter } from "./routers/curriculum";
import { videoGenerationRouter } from "./routers/video-generation";
import { liveInstructorRouter } from "./routers/live-instructor";
import { hospitalLeaderboardsRouter } from "./routers/hospital-leaderboards";
import { realTimeAnalyticsRouter } from "./routers/real-time-analytics";
import { smsWhatsappRouter } from "./routers/sms-whatsapp";
import { aiAdaptiveLearningRouter } from "./routers/ai-adaptive-learning";
import { automatedGradingRouter } from "./routers/automated-grading";
import { autonomousOperationsRouter } from "./routers/autonomous-operations";
import { executionTrackingRouter } from "./routers/execution-tracking";
import { revenueGenerationRouter } from "./routers/revenue-generation";
import { kaizenContinuousImprovementRouter } from "./routers/kaizen-continuous-improvement";
import { alutaContinuaRouter } from "./routers/aluta-continua";
import { regionalHubsRouter } from "./routers/regional-hubs";
import { complianceAutomationRouter } from "./routers/compliance-automation";
import { clinicalDecisionSupportRouter } from "./routers/clinical-decision-support";
import { patientMonitoringRouter } from "./routers/patient-monitoring";
import { researchSynthesisRouter } from "./routers/research-synthesis";
import { capacityBuildingRouter } from "./routers/capacity-building";
import { qualityImprovementRouter } from "./routers/quality-improvement";
import { continentalScalingRouter } from "./routers/continental-scaling";
// Removed non-existent router imports to fix TypeScript errors
// These will be added back when the routers are implemented
import { patientRouter } from "./routers/patients";
import { interventionRouter } from "./routers/interventions";
import { providerRouter } from "./routers/provider";
import { cprSessionRouter } from "./routers/cpr-session";
import { guidelinesRouter } from "./routers/guidelines";
import { fellowshipPathwaysRouter } from "./routers/fellowship-pathways";
import { recommendationEngineRouter } from "./routers/recommendation-engine";
import { streakTrackingRouter } from "./routers/streak-tracking";
import { resusAutoLaunch } from "./routers/resus-auto-launch";
import { adminNotifications } from "./routers/admin-notifications";
import { facilityBenchmarking } from "./routers/facility-benchmarking";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8).refine(
          (p) => /[a-zA-Z]/.test(p) && /\d/.test(p),
          "Password must contain at least one letter and one number"
        ),
        name: z.string().optional(),
        userType: z.enum(["individual", "parent", "institutional"]),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.getUserByEmail(input.email);
        if (existing) throw new Error("Email already registered");
        const openId = `email:${input.email}`;
        const passwordHash = await bcrypt.hash(input.password, 10);
        await db.createUserWithPassword({
          openId,
          email: input.email,
          name: input.name ?? null,
          passwordHash,
          userType: input.userType,
        });
        return { success: true };
      }),
    loginWithPassword: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user?.passwordHash) throw new Error("Invalid email or password");
        const ok = await bcrypt.compare(input.password, user.passwordHash);
        if (!ok) throw new Error("Invalid email or password");
        const sessionMaxAgeMs = ENV.sessionMaxAgeMs;
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name ?? "",
          expiresInMs: sessionMaxAgeMs,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: sessionMaxAgeMs });
        return { success: true };
      }),
    updateUserType: protectedProcedure
      .input(z.object({ userType: z.enum(["individual", "parent", "institutional"]) }))
      .mutation(async ({ input, ctx }) => {
        await db.updateUserType(ctx.user.id, input.userType);
        return { success: true };
      }),
    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user?.passwordHash) return { success: true }; // Don't leak existence
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await db.createPasswordResetToken(user.id, token, expiresAt);
        const baseUrl = ENV.appBaseUrl || "http://localhost:5173";
        const resetLink = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${token}`;
        await sendEmail(input.email, "passwordReset", {
          userName: user.name || "User",
          resetLink,
        });
        return { success: true };
      }),
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string().min(1),
        newPassword: z.string().min(8).refine(
          (p) => /[a-zA-Z]/.test(p) && /\d/.test(p),
          "Password must contain at least one letter and one number"
        ),
      }))
      .mutation(async ({ input }) => {
        const row = await db.getPasswordResetTokenByToken(input.token);
        if (!row) throw new Error("Invalid or expired reset link");
        if (new Date() > row.expiresAt) {
          await db.deletePasswordResetToken(input.token);
          throw new Error("Reset link has expired. Please request a new one.");
        }
        const passwordHash = await bcrypt.hash(input.newPassword, 10);
        await db.updateUserPasswordById(row.userId, passwordHash);
        await db.deletePasswordResetToken(input.token);
        return { success: true };
      }),
  }),
  enrollment: enrollmentRouter,
  instructor: instructorRouter,
  certificates: certificateRouter,
  sms: smsRouter,
  aiLearning: aiLearningRouter,
  notifications: notificationsRouter,
  security: securityRouter,
  googleWorkspace: googleWorkspaceRouter,
  personalization: personalizationRouter,
  payments: paymentsRouter,
  collaboration: collaborationRouter,
  gamification: gamificationRouter,
  aiContent: aiContentRouter,
  analytics: analyticsRouter,
  searchRecommendations: searchRecommendationsRouter,
  liveTraining: liveTrainingRouter,
  cms: cmsRouter,
  emailAutomation: emailAutomationRouter,
  emailCampaigns: emailCampaignsRouter,
  // institutionOnboarding: institutionOnboardingRouter, // Replaced by institution router
  chatSupport: chatSupportRouter,
  aiAssistant: aiAssistantRouter,
  careSignalEvents: careSignalEventsRouter,
  reporting: reportingRouter,
  mobile: mobileRouter,
  enterprise: enterpriseRouter,
  advancedAnalytics: advancedAnalyticsRouter,
  mpesa: mpesaRouter,
  marketplace: marketplaceRouter,
  feedback: feedbackRouter,
  events: eventsRouter,
  performance: performanceRouter,
  support: supportRouter,
  dashboards: dashboardsRouter,
  predictions: predictionsRouter,
  email:  emailRouter,
  parentSafeTruth: parentSafeTruthRouter,
  adminStats: adminStatsRouter,
  referrals: referralsRouter,
  institution: institutionRouter,
  institutionalNotifications: institutionalNotificationsRouter,
  productionSecurity: productionSecurityRouter,
  predictiveAnalytics: predictiveAnalyticsRouter,
  localization: localizationRouter,
  mobileSync: mobileSyncRouter,
  incidentAlerts: incidentAlertsRouter,
  emrIntegration: emrIntegrationRouter,
  telemedicine: telemedicineRouter,
  vitals: vitalsRouter,
  cprClock: cprClockRouter,
  cprSession: cprSessionRouter,
  guidelines: guidelinesRouter,
  fellowshipPathways: fellowshipPathwaysRouter,
  recommendationEngine: recommendationEngineRouter,
  streakTracking: streakTrackingRouter,
  emergencyProtocols: emergencyProtocolsRouter,
  alerts: alertsRouter,
  diagnosis: diagnosisRouter,
  learning: learningRouter,
  outcomes: outcomesRouter,
  investigations: investigationsRouter,
  curriculum: curriculumRouter,
  videoGeneration: videoGenerationRouter,
  liveInstructor: liveInstructorRouter,
  hospitalLeaderboards: hospitalLeaderboardsRouter,
  realTimeAnalytics: realTimeAnalyticsRouter,
  smsWhatsapp: smsWhatsappRouter,
  aiAdaptiveLearning: aiAdaptiveLearningRouter,
  automatedGrading: automatedGradingRouter,
  autonomousOperations: autonomousOperationsRouter,
  executionTracking: executionTrackingRouter,
  revenueGeneration: revenueGenerationRouter,
  kaizen: kaizenContinuousImprovementRouter,
  alutaContinua: alutaContinuaRouter,
  regionalHubs: regionalHubsRouter,
  complianceAutomation: complianceAutomationRouter,
  clinicalDecisionSupport: clinicalDecisionSupportRouter,
  patientMonitoring: patientMonitoringRouter,
  researchSynthesis: researchSynthesisRouter,
  capacityBuilding: capacityBuildingRouter,
  qualityImprovement: qualityImprovementRouter,
  continentalScaling: continentalScalingRouter,
  aiContentGeneration,
  globalInfrastructure,
  predictiveIntervention,
  exponentialScaling,
  aiPersonalization,
  globalCoordination,
  autonomousGlobalOps,
  directHospitalOnboarding,
  healthcareWorkerCommunity,
  directRevenue,
  realTimeImpact,
  peerAdoption,
  healthcareWorkerDirect,
  viralReferral,
  coreExponential,
  kaizenMetrics: kaizenMetricsRouter,
  kaizenAutomation: kaizenAutomationRouter,
  kaizenIntegration: kaizenIntegrationRouter,
  kaizenRealMetrics: kaizenRealMetricsRouter,
  kaizenFeedbackLoop: kaizenFeedbackLoopRouter,
  kaizenTOC: kaizenTOCRouter,
  ml: mlRouter,
  autonomousOrchestration: autonomousOrchestrationRouter,
  patients: patientRouter,
  interventions: interventionRouter,
  provider: providerRouter,
  resusAutoLaunch,
  adminNotifications,
  facilityBenchmarking,
});

export type AppRouter = typeof appRouter;
