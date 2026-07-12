import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { getUserByEmail, createUserWithPassword, insertAdminAuditLog, updateUserContactInfo } from "./db";
import { normalizeEmailForAuth } from "@shared/normalize-email";
import { normalizeUserPhone } from "@shared/user-phone";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const authEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.string().email({ message: "Enter a valid email address" }));
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendEmail } from "./email-service";
import { trackEvent } from "./services/analytics.service";
import { enrollmentRouter } from "./routers/enrollment";
import { instructorRouter } from "./routers/instructor";
import { certificateRouter } from "./routers/certificates";
import { smsRouter } from "./routers/sms";
import { aiLearningRouter } from "./routers/ai-learning";
import { notificationsRouter } from "./routers/notifications";
import { securityRouter } from "./routers/security";
import { securityIntegrationRouter } from './routers/security-integration';
import { microCoursesRouter } from './routers/micro-courses'; // Legacy micro-courses router
import { googleWorkspaceRouter } from "./routers/google-workspace";
import { personalizationRouter } from "./routers/personalization";
import { paymentsRouter } from "./routers/payments";
import { collaborationRouter } from "./routers/collaboration";
import { gamificationRouter } from "./routers/gamification";
import { aiContentRouter } from "./routers/ai-content";
import { aiContentGeneration } from "./routers/ai-content-generation";
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
import { careSignalReviewRouter } from "./routers/care-signal-review";
import { sampleHistoryRouter } from "./routers/sample-history";
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
import { facilitiesRouter } from "./routers/facilities";
import { referralsRouter } from "./routers/referrals";
import { institutionRouter } from "./routers/institution";
import { cneRouter } from "./routers/cne";
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
import { cprOverrideRouter } from "./routers/cpr-override";
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
import { automatedGradingRouter } from "./routers/automated-grading";
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
import { coursesRouter } from "./routers/courses";
import { fellowshipRouter } from "./routers/fellowship";
import { kaizenMetricsRouter } from "./routers/kaizen-metrics";
import { legalRouter } from "./routers/legal";
import { contentSafetyRouter } from "./routers/content-safety";
import { adminFeedbackRouter } from "./routers/platform-feedback";
import { adminLearningRouter } from "./routers/admin-learning";
import { practiceLabRouter } from "./routers/practice-lab";
import { fpkbRouter } from "./routers/fpkb";

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
          timestamp: new Date(),
        }).catch(() => {});
      }
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    register: publicProcedure
      .input(z.object({
        email: authEmailSchema,
        password: z.string().min(8).refine(
          (p) => /[a-zA-Z]/.test(p) && /\d/.test(p),
          "Password must contain at least one letter and one number"
        ),
        name: z.string().min(1, "Enter your full name as it should appear on your certificate").max(200),
        userType: z.enum(["individual", "parent", "institutional"]),
        phoneMode: z.enum(["ke", "intl"]).optional(),
        phoneValue: z.string().max(64).optional(),
        acceptTerms: z.literal(true, { message: "You must accept the Terms of Use" }),
        acceptPrivacy: z.literal(true, { message: "You must accept the Privacy Policy" }),
        acceptResusGpsIntendedUse: z.literal(true, {
          message: "You must acknowledge ResusGPS intended use",
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        const email = normalizeEmailForAuth(input.email);
        const existing = await getUserByEmail(email);
        if (existing) throw new Error("Email already registered");
        let phone: string | null = null;
        if (input.phoneValue != null && String(input.phoneValue).trim() !== "") {
          const mode = input.phoneMode ?? "intl";
          const normalized = normalizeUserPhone({ mode, value: input.phoneValue });
          if (!normalized) {
            throw new Error(
              mode === "ke"
                ? "Enter a valid Kenya mobile number (9 digits after 0 or +254)."
                : "Enter a valid international number with country code (e.g. +447700900123)."
            );
          }
          phone = normalized;
        }
        const openId = `email:${email}`;
        const passwordHash = await bcrypt.hash(input.password, 10);
        const { id: userId } = await createUserWithPassword({
          openId,
          email,
          name: input.name.trim(),
          passwordHash,
          userType: input.userType,
          phone,
        });
        const { LEGAL_DOCUMENT_VERSIONS } = await import("@shared/legal-versions");
        const { recordRegistrationConsent, recordResusGpsAck } = await import("./lib/legal-consent");
        const ua = ctx.req.headers?.["user-agent"];
        const consentMeta = {
          ipAddress: ctx.req.ip,
          userAgent: typeof ua === "string" ? ua : undefined,
        };
        await recordRegistrationConsent(userId, {
          termsVersion: LEGAL_DOCUMENT_VERSIONS.termsOfUse,
          privacyVersion: LEGAL_DOCUMENT_VERSIONS.privacyPolicy,
          ...consentMeta,
        });
        if (input.acceptResusGpsIntendedUse) {
          await recordResusGpsAck(userId, LEGAL_DOCUMENT_VERSIONS.resusGpsDisclaimer, consentMeta);
        }
        return { success: true };
      }),
    loginWithPassword: publicProcedure
      .input(
        z.object({
          email: authEmailSchema,
          password: z.string().min(1, "Password is required"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const email = normalizeEmailForAuth(input.email);
        const user = await getUserByEmail(email);
        if (!user?.passwordHash) {
          if (user && user.loginMethod && user.loginMethod !== "email") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "This email is registered with a different sign-in method. Use the original provider sign-in, or reset your password to set one.",
            });
          }
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }
        const ok = await bcrypt.compare(input.password, user.passwordHash);
        if (!ok) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }
        const sessionMaxAgeMs = ENV.sessionMaxAgeMs;
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name ?? "",
          expiresInMs: sessionMaxAgeMs,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: sessionMaxAgeMs });
        await db.createAuditLog({
          userId: user.id,
          action: 'LOGIN_SUCCESS',
          details: { email, ip: ctx.req.ip },
          timestamp: new Date(),
        }).catch(() => {});
        return { success: true };
      }),
    updateUserType: protectedProcedure
      .input(z.object({ userType: z.enum(["individual", "parent", "institutional"]) }))
      .mutation(async ({ input, ctx }) => {
        await db.updateUserType(ctx.user.id, input.userType);
        if (input.userType === "individual") {
          await trackEvent({
            userId: ctx.user.id,
            eventType: "provider_conversion",
            eventName: "user_type_updated_to_provider",
            pageUrl: "/home",
            eventData: {
              selectedUserType: input.userType,
            },
            sessionId: `user_type_${ctx.user.id}`,
          });
        }
        return { success: true };
      }),
    requestPasswordReset: publicProcedure
      .input(z.object({ email: authEmailSchema }))
      .mutation(async ({ input }) => {
        const email = normalizeEmailForAuth(input.email);
        const user = await getUserByEmail(email);
        if (!user) return { success: true }; // Don't leak whether the address exists
        const deliverTo = (user.email?.trim() || email).toLowerCase();
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await db.createPasswordResetToken(user.id, token, expiresAt);
        const baseUrl = (ENV.appBaseUrl || "https://www.paedsresus.com").replace(/\/$/, "");
        const resetLink = `${baseUrl}/reset-password?token=${token}`;
        // Always prefer SES for auth mail (avoids SendGrid accepting mail that never arrives).
        const result = await sendEmail(
          deliverTo,
          "passwordReset",
          {
            userName: user.name || "User",
            resetLink,
          },
          "ses"
        );
        if (!result.success) {
          console.error(`[Auth] Failed to send password reset email to ${deliverTo}:`, result.error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "We could not send the reset email. Please try again shortly or contact support@paedsresus.com.",
          });
        }
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
        await db.createAuditLog({
          userId: row.userId,
          action: 'PASSWORD_RESET',
          details: { method: 'reset_token' },
          timestamp: new Date(),
        }).catch(() => {});
        return { success: true };
      }),
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8).refine(
          (p) => /[a-zA-Z]/.test(p) && /\d/.test(p),
          "Password must contain at least one letter and one number"
        ),
      }))
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
          timestamp: new Date(),
        }).catch(() => {});
        return { success: true };
      }),
    updateMyProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required").max(200),
          phoneMode: z.enum(["ke", "intl"]).optional(),
          phoneValue: z.string().max(64).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        let phone: string | null = ctx.user.phone ?? null;
        if (input.phoneValue !== undefined) {
          if (input.phoneValue == null || String(input.phoneValue).trim() === "") {
            phone = null;
          } else {
            const mode = input.phoneMode ?? "intl";
            const normalized = normalizeUserPhone({ mode, value: input.phoneValue });
            if (!normalized) {
              throw new Error(
                mode === "ke"
                  ? "Enter a valid Kenya mobile number (9 digits after 0 or +254)."
                  : "Enter a valid international number with country code (e.g. +447700900123)."
              );
            }
            phone = normalized;
          }
        }
        await updateUserContactInfo(ctx.user.id, {
          name: input.name.trim(),
          phone,
        });
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "PROFILE_UPDATED",
          details: { fields: ["name", "phone"] },
          timestamp: new Date(),
        }).catch(() => {});
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
  careSignalReview: careSignalReviewRouter,
  sampleHistory: sampleHistoryRouter,
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
  // Mock / planning routers: off in production unless ENABLE_ASPIRATIONAL_APIS=true (see server/_core/env.ts).
  ...(ENV.exposeAspirationalApis
    ? {
        predictions: predictionsRouter,
        predictiveAnalytics: predictiveAnalyticsRouter,
        realTimeAnalytics: realTimeAnalyticsRouter,
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
        automatedGrading: automatedGradingRouter,
      }
    : {}),
  email: emailRouter,
  parentSafeTruth: parentSafeTruthRouter,
  adminStats: adminStatsRouter,
  adminLearning: adminLearningRouter,
  facilities: facilitiesRouter,
  fpkb: fpkbRouter,
  referrals: referralsRouter,
  institution: institutionRouter,
  cne: cneRouter,
  institutionalNotifications: institutionalNotificationsRouter,
  productionSecurity: productionSecurityRouter,
  localization: localizationRouter,
  mobileSync: mobileSyncRouter,
  incidentAlerts: incidentAlertsRouter,
  emrIntegration: emrIntegrationRouter,
  telemedicine: telemedicineRouter,
  vitals: vitalsRouter,
  cprClock: cprClockRouter,
  cprSession: cprSessionRouter,
  cprOverride: cprOverrideRouter,
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
  smsWhatsapp: smsWhatsappRouter,
  aiAdaptiveLearning: aiAdaptiveLearningRouter,
  /** Operational KPI dashboard (/kaizen-dashboard); DB-backed metrics — not the aspirational Kaizen *continuous improvement* mock router. */
  kaizenMetrics: kaizenMetricsRouter,
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
  // kaizenAutomation: kaizenAutomationRouter,
  // kaizenIntegration: kaizenIntegrationRouter,
  // kaizenRealMetrics: kaizenRealMetricsRouter,
  // kaizenFeedbackLoop: kaizenFeedbackLoopRouter,
  // kaizenTOC: kaizenTOCRouter,
  // ml: mlRouter,
  // autonomousOrchestration: autonomousOrchestrationRouter,
  patients: patientRouter,
  interventions: interventionRouter,
  provider: providerRouter,
  resusAutoLaunch,
  adminNotifications,
  facilityBenchmarking,
  securityIntegration: securityIntegrationRouter,
  microCourses: microCoursesRouter,
  courses: coursesRouter,
  fellowship: fellowshipRouter,
  legal: legalRouter,
  contentSafety: contentSafetyRouter,
  adminFeedback: adminFeedbackRouter,
  practiceLab: practiceLabRouter,
});

export type AppRouter = typeof appRouter;
