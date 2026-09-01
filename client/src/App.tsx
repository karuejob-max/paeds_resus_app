import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { Suspense, lazy, useEffect, type ReactNode } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { TrainingSimulationGate } from "./components/TrainingSimulationGate";
import { AspirationalSurfaceGate } from "./components/AspirationalSurfaceGate";
import { ThemeProvider } from "./contexts/ThemeContext";
import Header from "./components/Header";
import { PendingAdminInviteBanner } from "./components/PendingAdminInviteBanner";
import ProviderActivationAlert from "./components/ProviderActivationAlert";
import PlatformOfflineStatus from "./components/PlatformOfflineStatus";
import PaedsAIAssistant from "./components/PaedsAIAssistant";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole, type UserRole } from "@/hooks/useUserRole";
import { useWorkspaceAccess } from "@/hooks/useWorkspaceAccess";
import { buildLoginUrl, getCurrentAppPath } from "@/lib/authRedirect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { LegalReconsentGate } from "@/components/LegalReconsentGate";
import { trpc } from "@/lib/trpc";
import { AHA_HUB_STALE_MS } from "@/const/aha-hub-query";
import AdminShell from "./components/AdminShell";
import NotFound from "./pages/NotFound";

const Login = lazy(() => import("./pages/Login"));
const CpdRegister = lazy(() => import("./pages/CpdRegister"));
const MyCpdCertificates = lazy(() => import("./pages/MyCpdCertificates"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const NotificationPreferences = lazy(() => import("./pages/NotificationPreferences"));
const WorkplacesAndAccess = lazy(() => import("./pages/WorkplacesAndAccess"));
const SafeTruthV1 = lazy(() => import("./pages/SafeTruthV1"));
const CareSignal = lazy(() => import("./pages/CareSignal"));
const CodeSignal = lazy(() => import("./pages/CodeSignal"));
const Institutional = lazy(() => import("./pages/Institutional"));
const AdminHub = lazy(() => import("./pages/AdminHub"));
const AdminAccessGrants = lazy(() => import("./pages/AdminAccessGrants"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminMpesaReconciliation = lazy(() => import("./pages/AdminMpesaReconciliation"));
const AdminOps = lazy(() => import("./pages/AdminOps"));
const AdminMpesaWebhooks = lazy(() => import("./pages/AdminMpesaWebhooks"));
const AdminFacilityCareSignal = lazy(() => import("./pages/AdminFacilityCareSignal"));
const AdminFeedback = lazy(() => import("./pages/AdminFeedback"));
const AdminCoursesPanel = lazy(() => import("./pages/AdminCoursesPanel"));
const AdminCpdAnalytics = lazy(() => import("./pages/AdminCpdAnalytics"));
const FeedbackPage = lazy(() => import("./pages/FeedbackPage"));
const Help = lazy(() => import("./pages/Help"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const CookieNotice = lazy(() => import("./pages/legal/CookieNotice"));
const Subprocessors = lazy(() => import("./pages/legal/Subprocessors"));
const DataRequest = lazy(() => import("./pages/legal/DataRequest"));
const CareSignalAppeal = lazy(() => import("./pages/legal/CareSignalAppeal"));
const CareSignalNotice = lazy(() => import("./pages/legal/CareSignalNotice"));
const CodeSignalNotice = lazy(() => import("./pages/legal/CodeSignalNotice"));
const ClinicalIntendedUse = lazy(() => import("./pages/legal/ClinicalIntendedUse"));
const About = lazy(() => import("./pages/About"));
const PublicHome = lazy(() => import("./pages/PublicHome"));
const TrainingHub = lazy(() => import("./pages/TrainingHub"));
const TrainingCourseLanding = lazy(() => import("./pages/TrainingCourseLanding"));
const IerpLanding = lazy(() => import("./pages/IerpLanding"));
const IerpEnrollment = lazy(() => import("./pages/IerpEnrollment"));
const IerpCampaignDashboard = lazy(() => import("./pages/IerpCampaignDashboard"));
const ForProviders = lazy(() => import("./pages/ForProviders"));
const ForInstitutions = lazy(() => import("./pages/ForInstitutions"));
const ForParents = lazy(() => import("./pages/ForParents"));
const AHACoursesPublic = lazy(() => import("./pages/AHACoursesPublic"));
const InstitutionWorkspace = lazy(() => import("./pages/InstitutionWorkspace"));
const Enroll = lazy(() => import("./pages/Enroll"));
const LearnerDashboard = lazy(() => import("./pages/LearnerDashboard"));
const PatientsList = lazy(() => import("./pages/PatientsList"));
const EmergencyProtocols = lazy(() =>
  import("./pages/EmergencyProtocols").then((m) => ({ default: m.EmergencyProtocols }))
);
const PerformanceDashboard = lazy(() =>
  import("./pages/PerformanceDashboard").then((m) => ({ default: m.PerformanceDashboard }))
);
const ProviderProfile = lazy(() => import("./pages/ProviderProfile"));
const ProviderToday = lazy(() => import("./pages/ProviderToday"));
const ProviderMyShift = lazy(() => import("./pages/ProviderMyShift"));
const ProviderLearn = lazy(() => import("./pages/ProviderLearn"));
const LearningGuide = lazy(() => import("./pages/LearningGuide"));
const ProviderRecords = lazy(() => import("./pages/ProviderRecords"));
const ProviderActivationQrScanner = lazy(() => import("./pages/ProviderActivationQrScanner"));
const ProviderIersStaffing = lazy(() => import("./pages/ProviderIersStaffing"));
const IersOrientationPublic = lazy(() => import("./pages/IersOrientationPublic"));
const CPRMonitoring = lazy(() => import("./pages/CPRMonitoring"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const Referral = lazy(() => import("./pages/Referral"));
const PersonalImpactDashboard = lazy(() =>
  import("./pages/PersonalImpactDashboard").then((m) => ({ default: m.PersonalImpactDashboard }))
);
const PersonalizedLearningDashboard = lazy(() => import("./pages/PersonalizedLearningDashboard"));
const PredictiveInterventionDashboard = lazy(() => import("./pages/PredictiveInterventionDashboard"));
const TargetedSolutions = lazy(() => import("./pages/TargetedSolutions"));
const ProblemIdentification = lazy(() => import("./pages/ProblemIdentification"));
const Reassessment = lazy(() => import("./pages/Reassessment"));
const CirculationAssessment = lazy(() => import("./pages/CirculationAssessment"));
const CourseBLS = lazy(() => import("./pages/CourseBLS"));
const CourseACLS = lazy(() => import("./pages/CourseACLS"));
const CoursePaediatricSepticShock = lazy(() => import("./pages/CoursePaediatricSepticShock"));
const CourseIntubationEssentials = lazy(() => import("./pages/CourseIntubationEssentials"));
const InstructorPortal = lazy(() => import("./pages/InstructorPortal"));
const InstitutionalOnboarding = lazy(() => import("./pages/InstitutionalOnboarding"));
const InstitutionalLifeSupport = lazy(() => import("./pages/InstitutionalLifeSupport"));
const InstitutionalRecovery = lazy(() => import("./pages/InstitutionalRecovery"));
const AdminInstitutionalRecovery = lazy(() => import("./pages/AdminInstitutionalRecovery"));
const CareSignalAnalytics = lazy(() => import("./pages/CareSignalAnalytics"));
const FailurePatternAtlas = lazy(() => import("./pages/FailurePatternAtlas"));
const KnowledgeStewardship = lazy(() => import("./pages/KnowledgeStewardship"));
const AdminCareSignalReview = lazy(() => import("./pages/AdminCareSignalReview"));
const AdminCodeSignalReview = lazy(() => import("./pages/AdminCodeSignalReview"));
const NationalAggregateSignal = lazy(() => import("./pages/NationalAggregateSignal"));
const FacilityTrainingGaps = lazy(() => import("./pages/FacilityTrainingGaps"));
const FellowshipDashboard = lazy(() => import("./pages/FellowshipDashboard"));
const FellowshipAbout = lazy(() => import("./pages/FellowshipAbout"));
const ExamPolicy = lazy(() => import("./pages/ExamPolicy"));
const FellowshipWhy = lazy(() => import("./pages/FellowshipWhy"));
const FellowshipProgress = lazy(() => import("./pages/FellowshipProgress"));
const CourseGenericMicro = lazy(() => import('./pages/CourseGenericMicro'));
const MicroCoursesLanding = lazy(() => import('./pages/MicroCoursesLanding'));
const MicroCoursePlayer = lazy(() => import('./pages/MicroCoursePlayerDB'));
const CapstoneGradingPanel = lazy(() => import('./pages/CapstoneGradingPanel'));
const AHABookSession = lazy(() => import("./pages/AHABookSession"));
const AHAPracticeLab = lazy(() => import("./pages/AHAPracticeLab"));
const KaizenDashboard = lazy(() => import("./pages/KaizenDashboard"));
const ResusGated = lazy(() => import("./pages/ResusGated"));
const JoinSession = lazy(() => import("./pages/JoinSession"));
const Home = lazy(() => import("./pages/Home"));
const Payment = lazy(() => import("./pages/Payment"));
const NerpOfferPage = lazy(() => import("./pages/NerpOfferPage"));
const NerpPathwayEntry = lazy(() => import("./pages/NerpPathwayEntry"));
const NerpCheckout = lazy(() => import("./pages/NerpCheckout"));
const AdminNerpVerification = lazy(() => import("./pages/AdminNerpVerification"));
const AdminAhaProofReview = lazy(() => import("./pages/AdminAhaProofReview"));
const AdminNerpCampaign = lazy(() => import("./pages/AdminNerpCampaign"));
const AdminPromotionalMessaging = lazy(() => import("./pages/AdminPromotionalMessaging"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const AHACourses = lazy(() => import("./pages/AHACourses"));

/** Redirects to target path (for routes that have no dedicated page). */
function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  return null;
}

/** Full navigation so URL hash is preserved (wouter setLocation may drop hash). */
function RedirectToInstitutionalQuote() {
  useEffect(() => {
    window.location.replace(`${window.location.origin}/institutional#quote`);
  }, []);
  return (
    <div className="p-8 text-center text-muted-foreground text-sm">
      Redirecting to institutional quote…
    </div>
  );
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    const id = window.location.hash?.replace(/^#/, "").trim();
    if (id) {
      const run = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      requestAnimationFrame(() => requestAnimationFrame(run));
      return;
    }
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function Router() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <ScrollToTop />
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to main content
      </a>
      <Header />
      <PlatformOfflineStatus />
      <PendingAdminInviteBanner />
      <ProviderActivationAlert />
      <main id="main-content" className="flex-1" role="main">
        <LegalReconsentGate>
        <Suspense
          fallback={
            <SuspenseRouteFallback />
          }
        >
          <Switch>
          <Route path="/login" component={Login} />
          <Route path="/cpd/register/:institutionId" component={CpdRegister} />
          <Route path="/cne/register/:institutionId">{({ institutionId }) => <Redirect to={`/cpd/register/${institutionId}`} />}</Route>
          <Route path="/register" component={Register} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/account" component={AccountSettings} />
          <Route path="/account/notifications" component={NotificationPreferences} />
          <Route path="/workplaces">{() => (
            <RoleGate allowed={["provider"]}>
              <WorkplacesAndAccess />
            </RoleGate>
          )}</Route>
          <Route path="/feedback" component={FeedbackPage} />
          <Route path="/my-cpd-certificates" component={MyCpdCertificates} />
          <Route path="/my-cne-certificates">{() => <Redirect to="/my-cpd-certificates" />}</Route>
          <Route path="/home" component={Home} />
          <Route path="/my-shift">{() => (
            <RoleGate allowed={["provider"]}>
              <ProviderMyShift />
            </RoleGate>
          )}</Route>
          <Route path="/learn">{() => (
            <RoleGate allowed={["provider"]}>
              <ProviderLearn />
            </RoleGate>
          )}</Route>
          <Route path="/learning/guide">{() => (
            <RoleGate allowed={["provider", "institution"]}>
              <LearningGuide />
            </RoleGate>
          )}</Route>
          <Route path="/records">{() => (
            <RoleGate allowed={["provider"]}>
              <ProviderRecords />
            </RoleGate>
          )}</Route>
          <Route path="/activation-scan">{() => (
            <RoleGate allowed={["provider"]}>
              <ProviderActivationQrScanner />
            </RoleGate>
          )}</Route>
          <Route path="/iers/orientation" component={IersOrientationPublic} />
          <Route path="/iers/staffing">{() => (
            <RoleGate allowed={["provider"]}>
              <ProviderIersStaffing />
            </RoleGate>
          )}</Route>
          {/* 2026-07-19 (account-types PR1): the OLD authenticated Safe-Truth
              flow is retired along with the parent userType — nobody can log
              in as a parent anymore, so this route now redirects into the
              unauthenticated /safe-truth flow. parentSafeTruthSubmissions
              (the underlying table/history) is untouched — only this UI
              entry point changes. */}
          <Route path="/parent-safe-truth">{() => <Redirect to="/safe-truth" />}</Route>
          <Route path="/safe-truth" component={SafeTruthV1} />
          <Route path="/care-signal">{() => (
            <RoleGate allowed={["provider"]}>
              <CareSignal />
            </RoleGate>
          )}</Route>
          {/* Code Signal — adult/whole-hospital counterpart to Care Signal.
              2026-08-06 CEO decision, see docs/NORTH_STAR_V2_3_ADDENDUM_WHOLE_HOSPITAL_READINESS.md. */}
          <Route path="/code-signal">{() => (
            <RoleGate allowed={["provider"]}>
              <CodeSignal />
            </RoleGate>
          )}</Route>
          {/* Institutional Workspace: IERS, CPD Portal, shared Administration, and Connected Services. */}
          <Route path="/institutional-portal">{() => (
            <RoleGate allowed={["institution"]}>
              <Redirect to="/institution" />
            </RoleGate>
          )}</Route>
          <Route path="/institution">{() => (
            <RoleGate allowed={["institution"]}>
              <InstitutionWorkspace />
            </RoleGate>
          )}</Route>
          {/* Product deep links resolve into the canonical workspace and preserve the selected lane. */}
          <Route path="/institution/iers">{() => <RoleGate allowed={["institution"]}><Redirect to="/institution?section=iers&iersTab=command" /></RoleGate>}</Route>
          <Route path="/institution/iers/evidence">{() => <RoleGate allowed={["institution"]}><Redirect to="/institution?section=iers&iersTab=evidence" /></RoleGate>}</Route>
          <Route path="/institution/iers/drills">{() => <RoleGate allowed={["institution"]}><Redirect to="/institution?section=iers&iersTab=drills" /></RoleGate>}</Route>
          <Route path="/institution/iers/competency">{() => <RoleGate allowed={["institution"]}><Redirect to="/institution?section=iers&iersTab=competency" /></RoleGate>}</Route>
          <Route path="/institution/iers/workforce">{() => <RoleGate allowed={["institution"]}><Redirect to="/institution?section=iers&iersTab=workforce" /></RoleGate>}</Route>
          <Route path="/institution/iers/plan">{() => <RoleGate allowed={["institution"]}><Redirect to="/institution?section=iers&iersTab=plan" /></RoleGate>}</Route>
          <Route path="/institution/iers/report">{() => <RoleGate allowed={["institution"]}><Redirect to="/institution?section=iers&iersTab=report" /></RoleGate>}</Route>
          <Route path="/institution/cpd">{() => <RoleGate allowed={["institution"]}><Redirect to="/institution?section=cpd_portal" /></RoleGate>}</Route>
          <Route path="/institution/cpd-portal">{() => <RoleGate allowed={["institution"]}><Redirect to="/institution?section=cpd_portal" /></RoleGate>}</Route>
          <Route path="/institution/administration">{() => <RoleGate allowed={["institution"]}><Redirect to="/institution?section=administration" /></RoleGate>}</Route>
          <Route path="/institution/connected-services">{() => <RoleGate allowed={["institution"]}><Redirect to="/institution?section=connected" /></RoleGate>}</Route>
          <Route path="/institutional" component={Institutional} />
          <Route path="/admin">{() => (
            <AdminGate>
              <AdminHub />
            </AdminGate>
          )}</Route>
          <Route path="/admin/access-grants">{() => (
            <AdminGate>
              <AdminAccessGrants />
            </AdminGate>
          )}</Route>
          <Route path="/admin/reports">{() => (
            <AdminGate>
              <AdminReports />
            </AdminGate>
          )}</Route>
          <Route path="/admin/mpesa-reconciliation">{() => (
            <AdminGate>
              <AdminMpesaReconciliation />
            </AdminGate>
          )}</Route>
          <Route path="/admin/ops">{() => (
            <AdminGate>
              <AdminOps />
            </AdminGate>
          )}</Route>
          <Route path="/admin/feedback">{() => (
            <AdminGate>
              <AdminFeedback />
            </AdminGate>
          )}</Route>
          <Route path="/admin/mpesa-webhooks">{() => (
            <AdminGate>
              <AdminMpesaWebhooks />
            </AdminGate>
          )}</Route>
          <Route path="/admin/facility-care-signal">{() => (
            <AdminGate>
              <AdminFacilityCareSignal />
            </AdminGate>
          )}</Route>
          <Route path="/admin/institutional-analytics">{() => (
            <AdminGate>
              <FacilityTrainingGaps />
            </AdminGate>
          )}</Route>
          <Route path="/admin/care-signal-review">{() => (
            <AdminGate>
              <AdminCareSignalReview />
            </AdminGate>
          )}</Route>
          <Route path="/admin/code-signal-review">{() => (
            <AdminGate>
              <AdminCodeSignalReview />
            </AdminGate>
          )}</Route>
          <Route path="/admin/national-signal">{() => (
            <AdminGate>
              <NationalAggregateSignal />
            </AdminGate>
          )}</Route>
          <Route path="/admin/knowledge-stewardship">{() => (
            <AdminGate>
              <KnowledgeStewardship />
            </AdminGate>
          )}</Route>
          <Route path="/admin/cpd-analytics">{() => (
            <AdminGate>
              <AdminCpdAnalytics />
            </AdminGate>
          )}</Route>
          <Route path="/admin/nerp-verification">{() => (
            <AdminGate>
              <AdminNerpVerification />
            </AdminGate>
          )}</Route>
          <Route path="/admin/aha-proof-review">{() => (
            <AdminGate>
              <AdminAhaProofReview />
            </AdminGate>
          )}</Route>
          <Route path="/admin/nerp-campaign">{() => (
            <AdminGate>
              <AdminNerpCampaign />
            </AdminGate>
          )}</Route>
          <Route path="/admin/ierp-campaigns">{() => (
            <AdminGate>
              <IerpCampaignDashboard />
            </AdminGate>
          )}</Route>
          <Route path="/admin/promotional-messaging">{() => (
            <AdminGate>
              <AdminPromotionalMessaging />
            </AdminGate>
          )}</Route>
          <Route path="/help" component={Help} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/terms" component={TermsOfUse} />
          <Route path="/legal/cookies" component={CookieNotice} />
          <Route path="/legal/care-signal" component={CareSignalNotice} />
          <Route path="/legal/code-signal" component={CodeSignalNotice} />
          <Route path="/legal/clinical-use" component={ClinicalIntendedUse} />
          <Route path="/legal/subprocessors" component={Subprocessors} />
          <Route path="/legal/data-request" component={DataRequest} />
          <Route path="/care-signal/appeal" component={CareSignalAppeal} />
          <Route path="/about" component={About} />
          <Route path="/start">{() => <Redirect to="/" />}</Route>
          <Route path="/training/pals">{() => <TrainingCourseLanding slug="pals" />}</Route>
          <Route path="/training/acls">{() => <TrainingCourseLanding slug="acls" />}</Route>
          <Route path="/training/bls">{() => <TrainingCourseLanding slug="bls" />}</Route>
          <Route path="/training/nrp">{() => <TrainingCourseLanding slug="nrp" />}</Route>
          <Route path="/training/institutional-life-support">{() => (
            <RoleGate allowed={["provider", "institution"]}>
              <InstitutionalLifeSupport />
            </RoleGate>
          )}</Route>
          <Route path="/training/paeds-resus-competency">{() => (
            <RoleGate allowed={["provider", "institution"]}>
              <InstitutionalLifeSupport />
            </RoleGate>
          )}</Route>
          <Route path="/training" component={TrainingHub} />
          <Route path="/programs/nerp-acls" component={NerpOfferPage} />
          <Route path="/programs/nerp-acls/start" component={NerpPathwayEntry} />
          <Route path="/programs/nerp-acls/enroll">{() => (
            <RoleGate allowed={["provider"]}>
              <NerpCheckout />
            </RoleGate>
          )}</Route>
          <Route path="/programs/ierp" component={IerpLanding} />
          <Route path="/programs/ierp/enroll" component={IerpEnrollment} />
          <Route path="/for-providers" component={ForProviders} />
          <Route path="/for-institutions" component={ForInstitutions} />
          <Route path="/for-parents" component={ForParents} />
          <Route path="/hospital-admin-dashboard">{() => <RoleGate allowed={["institution"]}><Redirect to="/institution" /></RoleGate>}</Route>
          {/* Legacy tab deep links now land in the canonical product workspace. */}
          <Route path="/hospital-admin-dashboard/training">{() => <RoleGate allowed={["institution"]}><Redirect to="/institution?section=learning&learningTab=competency" /></RoleGate>}</Route>
          <Route path="/hospital-admin-dashboard/action-log">{() => <RoleGate allowed={["institution"]}><Redirect to="/institution?section=iers&iersTab=evidence" /></RoleGate>}</Route>
          <Route path="/hospital-admin-dashboard/safe-truth">{() => <RoleGate allowed={["institution"]}><Redirect to="/institution?section=connected" /></RoleGate>}</Route>
          <Route path="/hospital-admin-dashboard/reports">{() => <RoleGate allowed={["institution"]}><Redirect to="/institution?section=iers&iersTab=report" /></RoleGate>}</Route>
          <Route path="/institutional-portal/training">{() => <RoleGate allowed={["institution"]}><Redirect to="/institution?section=learning&learningTab=competency" /></RoleGate>}</Route>
          <Route path="/institutional-portal/action-log">{() => <RoleGate allowed={["institution"]}><Redirect to="/institution?section=iers&iersTab=evidence" /></RoleGate>}</Route>
          <Route path="/institutional-portal/reports">{() => <RoleGate allowed={["institution"]}><Redirect to="/institution?section=iers&iersTab=report" /></RoleGate>}</Route>
          <Route path="/care-signal-analytics">{() => (
            <RoleGate allowed={["provider"]}>
              <CareSignalAnalytics />
            </RoleGate>
          )}</Route>
          <Route path="/safe-truth-analytics">{() => <Redirect to="/care-signal-analytics" />}</Route>
          <Route path="/failure-pattern-atlas">{() => (
            <RoleGate allowed={["provider", "institution"]}>
              <FailurePatternAtlas />
            </RoleGate>
          )}</Route>
          <Route path="/enroll">{() => (
            <RoleGate allowed={["provider"]}>
              <Enroll />
            </RoleGate>
          )}</Route>
          <Route path="/learner-dashboard">{() => (
            <RoleGate allowed={["provider"]}>
              <LearnerDashboard />
            </RoleGate>
          )}</Route>
          <Route path="/patients">{() => (
            <RoleGate allowed={["provider"]}>
              <PatientsList />
            </RoleGate>
          )}</Route>
          <Route path="/protocols">{() => (
            <RoleGate allowed={["provider"]}>
              <EmergencyProtocols />
            </RoleGate>
          )}</Route>
          <Route path="/performance-dashboard">{() => (
            <RoleGate allowed={["provider"]}>
              <PerformanceDashboard />
            </RoleGate>
          )}</Route>
          <Route path="/provider-profile">{() => (
            <RoleGate allowed={["provider"]}>
              <ProviderProfile />
            </RoleGate>
          )}</Route>
          <Route path="/cpr-monitoring">{() => (
            <RoleGate allowed={["provider"]}>
              <CPRMonitoring />
            </RoleGate>
          )}</Route>
          <Route path="/payment">{() => (
            <RoleGate allowed={["provider"]}>
              <Payment />
            </RoleGate>
          )}</Route>
          <Route path="/payment/success">{() => (
            <RoleGate allowed={["provider"]}>
              <PaymentSuccess />
            </RoleGate>
          )}</Route>
          <Route path="/verify" component={VerifyCertificate} />
          <Route path="/referral">{() => (
            <RoleGate allowed={["provider"]}>
              <Referral />
            </RoleGate>
          )}</Route>
          <Route path="/personal-impact">{() => (
            <RoleGate allowed={["provider"]}>
              <PersonalImpactDashboard />
            </RoleGate>
          )}</Route>
          <Route path="/kaizen-dashboard">{() => (
            <AdminGate>
              <KaizenDashboard />
            </AdminGate>
          )}</Route>
          <Route path="/personalized-learning">{() => (
            <RoleGate allowed={["provider"]}>
              <AspirationalSurfaceGate title="Personalized learning (simulated)">
                <PersonalizedLearningDashboard />
              </AspirationalSurfaceGate>
            </RoleGate>
          )}</Route>
          <Route path="/predictive-intervention">{() => (
            <RoleGate allowed={["provider"]}>
              <AspirationalSurfaceGate title="Predictive intervention (simulated)">
                <PredictiveInterventionDashboard />
              </AspirationalSurfaceGate>
            </RoleGate>
          )}</Route>
          <Route path="/targeted-solutions">{() => (
            <RoleGate allowed={["provider"]}>
              <TrainingSimulationGate title="Targeted solutions (training demo)">
                <TargetedSolutions />
              </TrainingSimulationGate>
            </RoleGate>
          )}</Route>
          {/* Training-only ABCDE demo — not clinical decision support (see CLINICAL_SAFETY_REGISTER PROBLEM-ID). */}
          <Route path="/problem-identification">{() => (
            <RoleGate allowed={["provider"]}>
              <TrainingSimulationGate title="Problem identification demo">
                <ProblemIdentification />
              </TrainingSimulationGate>
            </RoleGate>
          )}</Route>
          <Route path="/reassessment">{() => (
            <RoleGate allowed={["provider"]}>
              <TrainingSimulationGate title="Reassessment (training demo)">
                <Reassessment />
              </TrainingSimulationGate>
            </RoleGate>
          )}</Route>
          <Route path="/circulation-assessment">{() => (
            <RoleGate allowed={["provider"]}>
              <TrainingSimulationGate title="Circulation assessment (training demo)">
                <CirculationAssessment />
              </TrainingSimulationGate>
            </RoleGate>
          )}</Route>
          {/* AHA courses — all routed through the unified DB-backed player */}
          <Route path="/course/bls">{() => (
            <RoleGate allowed={["provider"]}>
              <ErrorBoundary><MicroCoursePlayer /></ErrorBoundary>
            </RoleGate>
          )}</Route>
          <Route path="/course/acls">{() => (
            <RoleGate allowed={["provider"]}>
              <ErrorBoundary><MicroCoursePlayer /></ErrorBoundary>
            </RoleGate>
          )}</Route>
          <Route path="/course/pals">{() => (
            <RoleGate allowed={["provider"]}>
              <ErrorBoundary><MicroCoursePlayer /></ErrorBoundary>
            </RoleGate>
          )}</Route>
          <Route path="/course/heartsaver">{() => (
            <RoleGate allowed={["provider"]}>
              <ErrorBoundary><MicroCoursePlayer /></ErrorBoundary>
            </RoleGate>
          )}</Route>
          <Route path="/course/nrp">{() => (
            <RoleGate allowed={["provider"]}>
              <ErrorBoundary><MicroCoursePlayer /></ErrorBoundary>
            </RoleGate>
          )}</Route>
          <Route path="/course/seriously-ill-child">{() => (
            <Redirect to="/micro-course/seriously-ill-child-i" />
          )}</Route>
          <Route path="/course/paediatric-septic-shock">{() => (
            <RoleGate allowed={["provider"]}>
              <ErrorBoundary><MicroCoursePlayer /></ErrorBoundary>
            </RoleGate>
          )}</Route>
          <Route path="/course/intubation-essentials">{() => (
            <RoleGate allowed={["provider"]}>
              <ErrorBoundary><MicroCoursePlayer /></ErrorBoundary>
            </RoleGate>
          )}</Route>
          <Route path="/course/instructor">{() => (
            <RoleGate allowed={["provider"]}>
              <ErrorBoundary><MicroCoursePlayer /></ErrorBoundary>
            </RoleGate>
          )}</Route>
          <Route path="/instructor-portal">{() => (
            <RoleGate allowed={["provider"]}>
              <InstructorPortal />
            </RoleGate>
          )}</Route>
          <Route path="/institutional-onboarding">{() => (
            <RoleGate allowed={["institution"]}>
              <InstitutionalOnboarding />
            </RoleGate>
          )}</Route>
          {/* Public — no login required, since the scenario is "nobody at this institution can log in" (North Star §6.1). */}
          <Route path="/institutional-recovery" component={InstitutionalRecovery} />
          <Route path="/admin-institutional-recovery">{() => (
            <AdminGate>
              <AdminInstitutionalRecovery />
            </AdminGate>
          )}</Route>
          <Route path="/courses">{() => <Redirect to="/fellowship" />}</Route>
             <Route path="/micro-courses">{() => (
            <ErrorBoundary>
              <MicroCoursesLanding />
            </ErrorBoundary>
          )}</Route>
          <Route path="/micro-course/:courseId">{() => (
            <ErrorBoundary>
              <MicroCoursePlayer />
            </ErrorBoundary>
          )}</Route>
          <Route path="/learning/exam-policy">{() => (
            <ErrorBoundary>
              <ExamPolicy />
            </ErrorBoundary>
          )}</Route>
          <Route path="/courses/how-it-works">{() => <Redirect to="/learning/exam-policy" />}</Route>
          <Route path="/fellowship/about">{() => (
            <RoleGate allowed={["provider"]}>
              <FellowshipAbout />
            </RoleGate>
          )}</Route>
          <Route path="/fellowship/why">{() => (
            <RoleGate allowed={["provider"]}>
              <FellowshipWhy />
            </RoleGate>
          )}</Route>
          <Route path="/fellowship/progress">{() => (
            <RoleGate allowed={["provider"]}>
              <FellowshipProgress />
            </RoleGate>
          )}</Route>
          <Route path="/fellowship">{() => (
            <RoleGate allowed={["provider"]}>
              <FellowshipDashboard />
            </RoleGate>
          )}</Route>
          <Route path="/course/:courseId">{() => (
            <RoleGate allowed={["provider"]}>
              <CourseGenericMicro />
            </RoleGate>
          )}</Route>
          <Route path="/aha-courses" component={AHACoursesRoute} />
          <Route path="/aha-courses/practice">{() => (
            <RoleGate allowed={["provider"]}>
              <AHAPracticeLab />
            </RoleGate>
          )}</Route>
          <Route path="/aha-book-session">{() => (
            <RoleGate allowed={["provider"]}>
              <AHABookSession />
            </RoleGate>
          )}</Route>
          <Route path="/resus">{() => (
            <RoleGate allowed={["provider"]}>
              <ResusGated />
            </RoleGate>
          )}</Route>
          <Route path="/join-cpr/:code" component={JoinSession} />
          <Route path="/admin/capstone-grading">{() => (
            <AdminGate>
              <CapstoneGradingPanel />
            </AdminGate>
          )}</Route>
          <Route path="/admin/courses">{() => (
            <AdminGate>
              <AdminCoursesPanel />
            </AdminGate>
          )}</Route>
          {/* Common typo / old links — same page */}
          <Route path="/institution-onboarding">{() => <Redirect to="/institutional-onboarding" />}</Route>
          {/* case-analysis has no page; redirect to targeted-solutions */}
          <Route path="/case-analysis">{() => <Redirect to="/targeted-solutions" />}</Route>
          {/* /certificates → focused detailed certificate list; /records is the broader provider summary */}
          <Route path="/certificates">{() => (
            <RoleGate allowed={["provider"]}>
              <ProviderRecords focusCertificates={true} />
            </RoleGate>
          )}</Route>
          {/* dashboard → home (provider hub) */}
          <Route path="/dashboard">{() => <Redirect to="/home" />}</Route>
          {/* institutional-dashboard → hospital admin */}
          <Route path="/institutional-dashboard">{() => <Redirect to="/institution" />}</Route>
          {/* pricing/roi calculators live on /institutional */}
          <Route path="/pricing-calculator">{() => <Redirect to="/institutional" />}</Route>
          <Route path="/roi-calculator">{() => <Redirect to="/institutional" />}</Route>
          {/* contact, resources, legal/support: point to existing pages */}
          <Route path="/contact" component={RedirectToInstitutionalQuote} />
          <Route path="/resources">{() => <Redirect to="/help" />}</Route>
          <Route path="/faq">{() => <Redirect to="/help" />}</Route>
          <Route path="/success-stories">{() => <Redirect to="/safe-truth" />}</Route>
          <Route path="/elite-fellowship">{() => <Redirect to="/fellowship" />}</Route>
          {/* / : public compound for anonymous; role home for authenticated */}
          <Route path="/" component={HomeEntry} />
          {/* Catch-all: show a clear 404 instead of silently rendering the homepage. */}
          <Route component={NotFound} />
          </Switch>
        </Suspense>
        </LegalReconsentGate>
      </main>
      <PaedsAIAssistant />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

function mapUserTypeToRole(ut: string | null | undefined): UserRole {
  if (ut === "individual") return "provider";
  if (ut === "institutional") return "institution";
  return null;
}

function getRoleHomePath(role: UserRole): string {
  if (role === "institution") return "/institution";
  return "/home";
}

function getRouteLoadingCopy(pathname: string) {
  if (pathname.startsWith("/resus")) {
    return {
      title: "Loading ResusGPS…",
      description: "Checking sign-in and preparing bedside guidance.",
    };
  }
  if (pathname.startsWith("/hospital-admin-dashboard") || pathname.startsWith("/institutional-portal") || pathname.startsWith("/institution")) {
    return {
      title: "Loading institutional dashboard…",
      description: "Checking your access and preparing your facility workspace.",
    };
  }
  if (pathname.startsWith("/instructor-portal")) {
    return {
      title: "Loading instructor portal…",
      description: "Checking your instructor access and assignments.",
    };
  }
  if (pathname.startsWith("/fellowship")) {
    return {
      title: "Loading fellowship…",
      description: "Preparing your learning pathway and course access.",
    };
  }
  if (pathname.startsWith("/learning/guide")) {
    return {
      title: "Loading Learning guide…",
      description: "Preparing the current individual and institutional learning paths.",
    };
  }
  if (pathname.startsWith("/iers/staffing")) {
    return {
      title: "Loading IERS staffing…",
      description: "Checking your accepted ERCo appointment and department staffing access.",
    };
  }
  if (pathname.startsWith("/home")) {
    return {
      title: "Loading provider home…",
      description: "Checking your account and the best next step.",
    };
  }
  if (pathname.startsWith("/workplaces")) {
    return {
      title: "Loading Workplaces & access…",
      description: "Checking your institution relationships and access state.",
    };
  }
  if (pathname.startsWith("/account")) {
    return {
      title: "Loading Account & security…",
      description: "Preparing your account identity, preferences, and privacy controls.",
    };
  }

  return {
    title: "Loading page…",
    description: "Preparing the next part of the platform.",
  };
}

function RouteLoadingState({ title, description }: { title: string; description: string }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="h-20 rounded-lg bg-muted animate-pulse" />
        </CardContent>
      </Card>
    </div>
  );
}

function SuspenseRouteFallback() {
  const [location] = useLocation();
  const loadingCopy = getRouteLoadingCopy(location);
  return <RouteLoadingState title={loadingCopy.title} description={loadingCopy.description} />;
}

function RoleGate({ allowed, children }: { allowed: UserRole[]; children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const { effectiveWorkspace, hasInstitutionAccess, isInstitutionAccessKnown } = useWorkspaceAccess();
  const [location, setLocation] = useLocation();
  const loadingCopy = getRouteLoadingCopy(location);
  const routeRequestsInstitution =
    location.startsWith("/institution") || location.startsWith("/hospital-admin-dashboard");
  const effectiveRole: UserRole =
    routeRequestsInstitution && hasInstitutionAccess ? "institution" : effectiveWorkspace;
  const institutionAccessPending =
    isAuthenticated && allowed.includes("institution") && !isInstitutionAccessKnown;

  useEffect(() => {
    if (loading || institutionAccessPending) return;
    if (!isAuthenticated) {
      setLocation(buildLoginUrl(getCurrentAppPath()));
      return;
    }
    if (effectiveRole && !allowed.includes(effectiveRole)) {
      setLocation(getRoleHomePath(effectiveRole));
    }
  }, [allowed, effectiveRole, institutionAccessPending, isAuthenticated, loading, setLocation]);

  if (loading || institutionAccessPending) {
    return <RouteLoadingState title={loadingCopy.title} description={loadingCopy.description} />;
  }
  if (!isAuthenticated) {
    return (
      <RouteLoadingState
        title="Redirecting to sign in…"
        description="We need to sign you in before opening this workspace."
      />
    );
  }
  if (!effectiveRole || !allowed.includes(effectiveRole)) {
    const fallback = getRoleHomePath(effectiveRole);
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Access restricted for this workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Your workspace selection is not itself a permission. This route is available only when the server confirms the required account or institution access.
            </p>
            <Button onClick={() => setLocation(fallback)}>Go to your dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return <>{children}</>;
}

function AdminGate({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const defaultRole = mapUserTypeToRole(user?.userType);
  const loadingCopy = getRouteLoadingCopy(location);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      setLocation(buildLoginUrl(getCurrentAppPath()));
      return;
    }
    if (user?.role !== "admin") {
      setLocation(getRoleHomePath(defaultRole));
    }
  }, [defaultRole, isAuthenticated, loading, setLocation, user?.role]);

  if (loading) {
    return <RouteLoadingState title={loadingCopy.title} description={loadingCopy.description} />;
  }
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <RouteLoadingState
        title="Checking admin access…"
        description="Redirecting if this page is not available for your account."
      />
    );
  }
  return <AdminShell>{children}</AdminShell>;
}

function HomeEntry() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const roleForHome = mapUserTypeToRole(user?.userType);

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    const dest = getRoleHomePath(roleForHome);
    if (dest === "/home") void import("./pages/Home");
    else if (dest === "/safe-truth") void import("./pages/SafeTruthV1");
    else if (dest === "/institution") void import("./pages/InstitutionWorkspace");
    setLocation(dest);
  }, [isAuthenticated, loading, roleForHome, setLocation]);

  if (loading) {
    return (
      <RouteLoadingState
        title="Opening Paeds Resus…"
        description="Routing you to the right workspace."
      />
    );
  }

  if (isAuthenticated) return null;

  return (
    <Suspense fallback={<SuspenseRouteFallback />}>
      <PublicHome />
    </Suspense>
  );
}

function FallbackEntry() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const roleForHome = mapUserTypeToRole(user?.userType);

  useEffect(() => {
    if (loading) return;
    setLocation(isAuthenticated ? getRoleHomePath(roleForHome) : "/");
  }, [isAuthenticated, loading, roleForHome, setLocation]);

  if (loading) {
    return (
      <RouteLoadingState
        title="Opening Paeds Resus…"
        description="Routing you to the right workspace."
      />
    );
  }

  return null;
}

/** Public marketing at /aha-courses; authenticated provider hub when signed in. */
function AHACoursesRoute() {
  const { user, isAuthenticated, loading } = useAuth();
  const { role } = useUserRole();
  const effectiveRole = role ?? mapUserTypeToRole(user?.userType);
  const utils = trpc.useUtils();

  useEffect(() => {
    if (loading || !isAuthenticated || effectiveRole !== "provider") return;
    void utils.courses.getAhaHubDashboard.prefetch(undefined, { staleTime: AHA_HUB_STALE_MS });
  }, [loading, isAuthenticated, effectiveRole, utils]);

  if (loading) {
    return (
      <RouteLoadingState
        title="Loading AHA courses…"
        description="Preparing certification information."
      />
    );
  }

  if (!isAuthenticated || effectiveRole !== "provider") {
    return <AHACoursesPublic />;
  }

  return (
    <RoleGate allowed={["provider"]}>
      <AHACourses />
    </RoleGate>
  );
}
