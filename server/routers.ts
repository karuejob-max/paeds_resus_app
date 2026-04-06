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
 // Legacy micro-courses router
//  // Replaced by institution router
// Remove this import - we'll use the new institution router instead
// Removed non-existent router imports to fix TypeScript errors
// These will be added back when the routers are implemented
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      if (ctx.user) {
        await db.createAuditLog({
          userId: ctx.user.id,
          action: 'LOGOUT',
          details: { ip: ctx.req.ip },
          timestamp: new Date()}).catch(() => {});
      }
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true} as const;
    }),
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8).refine(
          (p) => /[a-zA-Z]/.test(p) && /\d/.test(p),
          "Password must contain at least one letter and one number"
        ),
        name: z.string().optional(),
        userType: z.enum(["individual", "parent", "institutional"])}))
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
          userType: input.userType});
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
          expiresInMs: sessionMaxAgeMs});
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: sessionMaxAgeMs });
        await db.createAuditLog({
          userId: user.id,
          action: 'LOGIN_SUCCESS',
          details: { email: input.email, ip: ctx.req.ip },
          timestamp: new Date()}).catch(() => {});
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
          resetLink});
        return { success: true };
      }),
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string().min(1),
        newPassword: z.string().min(8).refine(
          (p) => /[a-zA-Z]/.test(p) && /\d/.test(p),
          "Password must contain at least one letter and one number"
        )}))
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
        await db.createAuditLog({
          userId: row.userId,
          action: 'PASSWORD_RESET',
          details: { method: 'reset_token' },
          timestamp: new Date()}).catch(() => {});
        return { success: true };
      }),
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8).refine(
          (p) => /[a-zA-Z]/.test(p) && /\d/.test(p),
          "Password must contain at least one letter and one number"
        )}))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user?.passwordHash) throw new Error("User not found");
        const ok = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!ok) throw new Error("Current password is incorrect");
        const passwordHash = await bcrypt.hash(input.newPassword, 10);
        await db.updateUserPasswordById(ctx.user.id, passwordHash);
        await db.createAuditLog({
          userId: ctx.user.id,
          action: 'PASSWORD_CHANGED',
          details: { method: 'user_initiated' },
          timestamp: new Date()}).catch(() => {});
        return { success: true };
      })}),
  enrollment: enrollmentRouter,
  instructor: instructorRouter,
  certificates: certificateRouter,
  aiLearning: aiLearningRouter,
  notifications: notificationsRouter,
  googleWorkspace: googleWorkspaceRouter,
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
  // TODO: Re-add these routers after implementation
  // aiContentGeneration,
  // globalInfrastructure,
  // predictiveIntervention,
  // exponentialScaling,
  // aiPersonalization,
  // globalCoordination,
  // autonomousGlobalOps,
  // directHospitalOnboarding,
  // healthcareWorkerCommunity,
  // directRevenue,
  // realTimeImpact,
  // peerAdoption,
  // healthcareWorkerDirect,
  // viralReferral,
  // coreExponential,
  // TODO: Re-add these routers after implementation
  // kaizenMetrics: kaizenMetricsRouter,
  // kaizenAutomation: kaizenAutomationRouter,
  // kaizenIntegration: kaizenIntegrationRouter,
  // kaizenRealMetrics: kaizenRealMetricsRouter,
  // kaizenFeedbackLoop: kaizenFeedbackLoopRouter,
  // kaizenTOC: kaizenTOCRouter,
  // ml: mlRouter,
  // autonomousOrchestration: autonomousOrchestrationRouter,
  // patients: patientRouter,
  // interventions: interventionRouter,
  // provider: providerRouter,
  // resusAutoLaunch,
  // adminNotifications,
  // facilityBenchmarking,
  securityIntegration: securityIntegrationRouter,
  microCourses: microCoursesRouter,
  courses: coursesRouter,
  fellowshipQualification: fellowshipQualificationRouter});
export type AppRouter = typeof appRouter;
