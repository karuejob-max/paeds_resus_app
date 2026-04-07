import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Header from "./components/Header";
import ResusGPS from "./pages/ResusGPS";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";
import ParentSafeTruth from "./pages/ParentSafeTruth";
import CareSignal from "./pages/CareSignal";
import Institutional from "./pages/Institutional";
import AdminHub from "./pages/AdminHub";
import AdminReports from "./pages/AdminReports";
import AdminMpesaReconciliation from "./pages/AdminMpesaReconciliation";
import Help from "./pages/Help";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import About from "./pages/About";
import Start from "./pages/Start";
import HospitalAdminDashboard from "./pages/HospitalAdminDashboard";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import Enroll from "./pages/Enroll";
import LearnerDashboard from "./pages/LearnerDashboard";
import PatientsList from "./pages/PatientsList";
import { EmergencyProtocols } from "./pages/EmergencyProtocols";
import { PerformanceDashboard } from "./pages/PerformanceDashboard";
import ProviderProfile from "./pages/ProviderProfile";
import CPRMonitoring from "./pages/CPRMonitoring";
import Payment from "./pages/Payment";
import VerifyCertificate from "./pages/VerifyCertificate";
import Referral from "./pages/Referral";
import { PersonalImpactDashboard } from "./pages/PersonalImpactDashboard";
import KaizenDashboard from "./pages/KaizenDashboard";
import PersonalizedLearningDashboard from "./pages/PersonalizedLearningDashboard";
import PredictiveInterventionDashboard from "./pages/PredictiveInterventionDashboard";
import TargetedSolutions from "./pages/TargetedSolutions";
import ProblemIdentification from "./pages/ProblemIdentification";
import Reassessment from "./pages/Reassessment";
import CirculationAssessment from "./pages/CirculationAssessment";
import CourseBLS from "./pages/CourseBLS";
import CourseSeriouslyIllChild from "./pages/CourseSeriouslyIllChild";
import CoursePaediatricSepticShock from "./pages/CoursePaediatricSepticShock";
import CourseInstructor from "./pages/CourseInstructor";
import InstructorPortal from "./pages/InstructorPortal";
import InstitutionalOnboarding from "./pages/InstitutionalOnboarding";
import CareSignalAnalytics from "./pages/CareSignalAnalytics";
import FacilityTrainingGaps from "./pages/FacilityTrainingGaps";
import CourseCatalog from "./pages/CourseCatalog";
import AdminCoursesPanel from "./pages/AdminCoursesPanel";
import FellowshipDashboard from "./pages/FellowshipDashboard";
import AHACourses from "./pages/AHACourses";
import { Toaster } from "@/components/ui/sonner";

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

/** Logged-in users go to Home hub; others see ResusGPS at /. */
function LandingOrHome() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (isAuthenticated) setLocation("/home");
  }, [isAuthenticated, setLocation]);
  if (isAuthenticated) return null;
  return <ResusGPS />;
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
      <main id="main-content" className="flex-1" role="main">
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/home" component={Home} />
          <Route path="/parent-safe-truth" component={ParentSafeTruth} />
          <Route path="/care-signal" component={CareSignal} />
          <Route path="/safe-truth">{() => <Redirect to="/care-signal" />}</Route>
          {/* Single institutional dashboard: hospital admin (portal URL redirects here) */}
          <Route path="/institutional-portal">{() => <Redirect to="/hospital-admin-dashboard" />}</Route>
          <Route path="/institutional" component={Institutional} />
          <Route path="/admin" component={AdminHub} />
          <Route path="/admin/reports" component={AdminReports} />
          <Route path="/admin/mpesa-reconciliation" component={AdminMpesaReconciliation} />
          <Route path="/admin/institutional-analytics" component={FacilityTrainingGaps} />
          <Route path="/help" component={Help} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/terms" component={TermsOfUse} />
          <Route path="/about" component={About} />
          <Route path="/start" component={Start} />
          <Route path="/hospital-admin-dashboard" component={HospitalAdminDashboard} />
          <Route path="/advanced-analytics" component={AdvancedAnalytics} />
          <Route path="/care-signal-analytics" component={CareSignalAnalytics} />
          <Route path="/safe-truth-analytics">{() => <Redirect to="/care-signal-analytics" />}</Route>
          <Route path="/enroll" component={Enroll} />
          <Route path="/learner-dashboard" component={LearnerDashboard} />
          <Route path="/patients" component={PatientsList} />
          <Route path="/protocols" component={EmergencyProtocols} />
          <Route path="/performance-dashboard" component={PerformanceDashboard} />
          <Route path="/provider-profile" component={ProviderProfile} />
          <Route path="/cpr-monitoring" component={CPRMonitoring} />
          <Route path="/payment" component={Payment} />
          <Route path="/verify" component={VerifyCertificate} />
          <Route path="/referral" component={Referral} />
          <Route path="/personal-impact" component={PersonalImpactDashboard} />
          <Route path="/kaizen-dashboard" component={KaizenDashboard} />
          <Route path="/personalized-learning" component={PersonalizedLearningDashboard} />
          <Route path="/predictive-intervention" component={PredictiveInterventionDashboard} />
          <Route path="/targeted-solutions" component={TargetedSolutions} />
          <Route path="/problem-identification" component={ProblemIdentification} />
          <Route path="/reassessment" component={Reassessment} />
          <Route path="/circulation-assessment" component={CirculationAssessment} />
          <Route path="/course/bls" component={CourseBLS} />
          <Route path="/course/seriously-ill-child" component={CourseSeriouslyIllChild} />
          <Route path="/course/paediatric-septic-shock" component={CoursePaediatricSepticShock} />
          <Route path="/course/instructor" component={CourseInstructor} />
          <Route path="/instructor-portal" component={InstructorPortal} />
          <Route path="/institutional-onboarding" component={InstitutionalOnboarding} />
          <Route path="/courses" component={CourseCatalog} />
          <Route path="/fellowship" component={FellowshipDashboard} />
          <Route path="/aha-courses" component={AHACourses} />
          <Route path="/admin/courses" component={AdminCoursesPanel} />
          {/* Common typo / old links — same page */}
          <Route path="/institution-onboarding">{() => <Redirect to="/institutional-onboarding" />}</Route>
          {/* case-analysis has no page; redirect to targeted-solutions */}
          <Route path="/case-analysis">{() => <Redirect to="/targeted-solutions" />}</Route>
          {/* dashboard → home (provider hub) */}
          <Route path="/dashboard">{() => <Redirect to="/home" />}</Route>
          {/* institutional-dashboard → hospital admin */}
          <Route path="/institutional-dashboard">{() => <Redirect to="/hospital-admin-dashboard" />}</Route>
          {/* pricing/roi calculators live on /institutional */}
          <Route path="/pricing-calculator">{() => <Redirect to="/institutional" />}</Route>
          <Route path="/roi-calculator">{() => <Redirect to="/institutional" />}</Route>
          {/* contact, resources, legal/support: point to existing pages */}
          <Route path="/contact" component={RedirectToInstitutionalQuote} />
          <Route path="/resources">{() => <Redirect to="/learner-dashboard" />}</Route>
          <Route path="/faq">{() => <Redirect to="/help" />}</Route>
          <Route path="/success-stories">{() => <Redirect to="/parent-safe-truth" />}</Route>
          <Route path="/elite-fellowship">{() => <Redirect to="/enroll" />}</Route>
          {/* / : logged-in → Home hub; anonymous → Home */}
          <Route path="/" component={Home} />
          <Route path="/resus" component={Home} />
          {/* Catch all → Home (temporarily disabled ResusGPS) */}
          <Route component={Home} />
        </Switch>
      </main>
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
