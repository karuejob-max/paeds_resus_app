import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { enrollmentRouter } from "./routers/enrollment";
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
import { institutionOnboardingRouter } from "./routers/institution-onboarding";
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
  }),
  enrollment: enrollmentRouter,
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
  institutionOnboarding: institutionOnboardingRouter,
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
});

export type AppRouter = typeof appRouter;
