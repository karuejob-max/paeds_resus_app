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
// import { institutionOnboardingRouter } from "./routers/institution-onboarding"; // Replaced by institution router
// Remove this import - we'll use the new institution router instead
import { chatSupportRouter } from "./routers/chat-support";
import { aiAssistantRouter } from "./routers/ai-assistant";
import { safeTruthEventsRouter } from "./routers/safetruth-events";
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
import { aiContentGeneration } from "./routers/ai-content-generation";
import { globalInfrastructure } from "./routers/global-infrastructure";
import { predictiveIntervention } from "./routers/predictive-intervention";
import { exponentialScaling } from "./routers/exponential-scaling";
import { aiPersonalization } from "./routers/ai-personalization";
import { globalCoordination } from "./routers/global-coordination";
import { autonomousGlobalOps } from "./routers/autonomous-global-ops";
import { directHospitalOnboarding } from "./routers/direct-hospital-onboarding";
import { healthcareWorkerCommunity } from "./routers/healthcare-worker-community";
import { directRevenue } from "./routers/direct-revenue";
import { realTimeImpact } from "./routers/real-time-impact";
import { peerAdoption } from "./routers/peer-adoption";
import { healthcareWorkerDirect } from "./routers/healthcare-worker-direct";
import { viralReferral } from "./routers/viral-referral";
import { coreExponential } from "./routers/core-exponential";
import { kaizenMetricsRouter } from "./routers/kaizen-metrics";
import { kaizenAutomationRouter } from "./routers/kaizen-automation";
import { kaizenIntegrationRouter } from "./routers/kaizen-integration";
import { kaizenRealMetricsRouter } from "./routers/kaizen-real-metrics";
import { kaizenFeedbackLoopRouter } from "./routers/kaizen-feedback-loop";
import { kaizenTOCRouter } from "./routers/kaizen-toc";
import { mlRouter } from "./routers/ml-orchestration";
import { autonomousOrchestrationRouter } from "./routers/autonomous-orchestration";
import { patientRouter } from "./routers/patients";
import { interventionRouter } from "./routers/interventions";
import { providerRouter } from "./routers/provider";

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
  // institutionOnboarding: institutionOnboardingRouter, // Replaced by institution router
  chatSupport: chatSupportRouter,
  aiAssistant: aiAssistantRouter,
  safeTruthEvents: safeTruthEventsRouter,
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
  emergencyProtocols: emergencyProtocolsRouter,
  alerts: alertsRouter,
  diagnosis: diagnosisRouter,
  learning: learningRouter,
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
});

export type AppRouter = typeof appRouter;
