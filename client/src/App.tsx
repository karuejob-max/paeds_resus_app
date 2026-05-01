import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { Suspense, lazy, useEffect, type ReactNode } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Header from "./components/Header";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole, type UserRole } from "@/hooks/useUserRole";
import { buildLoginUrl, getCurrentAppPath } from "@/lib/authRedirect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ParentSafeTruth = lazy(() => import("./pages/ParentSafeTruth"));
const CareSignal = lazy(() => import("./pages/CareSignal"));
const Institutional = lazy(() => import("./pages/Institutional"));
const AdminHub = lazy(() => import("./pages/AdminHub"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminMpesaReconciliation = lazy(() => import("./pages/AdminMpesaReconciliation"));
const Help = lazy(() => import("./pages/Help"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const About = lazy(() => import("./pages/About"));
const Start = lazy(() => import("./pages/Start"));
const HospitalAdminDashboard = lazy(() => import("./pages/HospitalAdminDashboard"));
const AdvancedAnalytics = lazy(() => import("./pages/AdvancedAnalytics"));
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
const CourseSeriouslyIllChild = lazy(() => import("./pages/CourseSeriouslyIllChild"));
const CoursePaediatricSepticShock = lazy(() => import("./pages/CoursePaediatricSepticShock"));
const CourseIntubationEssentials = lazy(() => import("./pages/CourseIntubationEssentials"));
const CourseInstructor = lazy(() => import("./pages/CourseInstructor"));
const InstructorPortal = lazy(() => import("./pages/InstructorPortal"));
const InstitutionalOnboarding = lazy(() => import("./pages/InstitutionalOnboarding"));
const CareSignalAnalytics = lazy(() => import("./pages/CareSignalAnalytics"));
const AdminCareSignalReview = lazy(() => import("./pages/AdminCareSignalReview"));
const NationalAggregateSignal = lazy(() => import("./pages/NationalAggregateSignal"));
const FacilityTrainingGaps = lazy(() => import("./pages/FacilityTrainingGaps"));
const FellowshipDashboard = lazy(() => import("./pages/FellowshipDashboard"));
const CourseGenericMicro = lazy(() => import('./pages/CourseGenericMicro'));
const MicroCoursesLanding = lazy(() => import('./pages/MicroCoursesLanding'));
const MicroCoursePlayer = lazy(() => import('./pages/MicroCoursePlayerDB'));
const CapstoneGradingPanel = lazy(() => import('./pages/CapstoneGradingPanel'));
const AHACourses = lazy(() => import("./pages/AHACourses"));
const AHABookSession = lazy(() => import("./pages/AHABookSession"));
const ResusGated = lazy(() => import("./pages/ResusGated"));
const Home = lazy(() => import("./pages/Home"));
const Payment = lazy(() => import("./pages/Payment"));

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
      <main id="main-content" className="flex-1" role="main">
        <Suspense
          fallback={
            <SuspenseRouteFallback />
          }
        >
          <Switch>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/home" component={Home} />
          <Route path="/parent-safe-truth" component={ParentSafeTruth} />
          <Route path="/care-signal">{() => (
            <RoleGate allowed={["provider"]}>
              <CareSignal />
            </RoleGate>
          )}</Route>
          <Route path="/safe-truth">{() => <Redirect to="/care-signal" />}</Route>
          {/* Single institutional dashboard: hospital admin (portal URL redirects here) */}
          <Route path="/institutional-portal">{() => (
            <RoleGate allowed={["institution"]}>
              <Redirect to="/hospital-admin-dashboard" />
            </RoleGate>
          )}</Route>
          <Route path="/institutional" component={Institutional} />
          <Route path="/admin">{() => (
            <AdminGate>
              <AdminHub />
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
          <Route path="/admin/national-signal">{() => (
            <AdminGate>
              <NationalAggregateSignal />
            </AdminGate>
          )}</Route>
          <Route path="/help" component={Help} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/terms" component={TermsOfUse} />
          <Route path="/about" component={About} />
          <Route path="/start" component={Start} />
          <Route path="/hospital-admin-dashboard">{() => (
            <RoleGate allowed={["institution"]}>
              <HospitalAdminDashboard />
            </RoleGate>
          )}</Route>
          <Route path="/advanced-analytics">{() => (
            <RoleGate allowed={["institution"]}>
              <AdvancedAnalytics />
            </RoleGate>
          )}</Route>
          <Route path="/care-signal-analytics">{() => (
            <RoleGate allowed={["provider"]}>
              <CareSignalAnalytics />
            </RoleGate>
          )}</Route>
          <Route path="/safe-truth-analytics">{() => <Redirect to="/care-signal-analytics" />}</Route>
          <Route path="/enroll">{() => (
            <RoleGate allowed={["provider"]}>
              <Enroll />
            </RoleGate>
          )}</Route>
          <Route path="/learner-dashboard">{() => <Redirect to="/home" />}</Route>
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
          <Route path="/verify" component={VerifyCertificate} />
          <Route path="/referral">{() => (
            <RoleGate allowed={["provider"]}>
              <Referral />
            </RoleGate>
          )}</Route>
          <Route path="/personal-impact">{() => (
            <RoleGate allowed={["provider", "parent"]}>
              <PersonalImpactDashboard />
            </RoleGate>
          )}</Route>
          <Route path="/kaizen-dashboard">{() => (
            <Redirect to="/home" />
          )}</Route>
          <Route path="/personalized-learning">{() => (
            <RoleGate allowed={["provider"]}>
              <PersonalizedLearningDashboard />
            </RoleGate>
          )}</Route>
          <Route path="/predictive-intervention">{() => (
            <RoleGate allowed={["provider"]}>
              <PredictiveInterventionDashboard />
            </RoleGate>
          )}</Route>
          <Route path="/targeted-solutions">{() => (
            <RoleGate allowed={["provider"]}>
              <TargetedSolutions />
            </RoleGate>
          )}</Route>
          <Route path="/problem-identification">{() => (
            <RoleGate allowed={["provider"]}>
              <ProblemIdentification />
            </RoleGate>
          )}</Route>
          <Route path="/reassessment">{() => (
            <RoleGate allowed={["provider"]}>
              <Reassessment />
            </RoleGate>
          )}</Route>
          <Route path="/circulation-assessment">{() => (
            <RoleGate allowed={["provider"]}>
              <CirculationAssessment />
            </RoleGate>
          )}</Route>
          <Route path="/course/bls">{() => (
            <RoleGate allowed={["provider"]}>
              <CourseBLS />
            </RoleGate>
          )}</Route>
          <Route path="/course/acls">{() => (
            <RoleGate allowed={["provider"]}>
              <CourseACLS />
            </RoleGate>
          )}</Route>
          <Route path="/course/seriously-ill-child">{() => (
            <RoleGate allowed={["provider"]}>
              <CourseSeriouslyIllChild />
            </RoleGate>
          )}</Route>
          <Route path="/course/paediatric-septic-shock">{() => (
            <RoleGate allowed={["provider"]}>
              <CoursePaediatricSepticShock />
            </RoleGate>
          )}</Route>
          <Route path="/course/intubation-essentials">{() => (
            <RoleGate allowed={["provider"]}>
              <CourseIntubationEssentials />
            </RoleGate>
          )}</Route>
          <Route path="/course/instructor">{() => (
            <RoleGate allowed={["provider"]}>
              <CourseInstructor />
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
          <Route path="/aha-courses">{() => (
            <RoleGate allowed={["provider"]}>
              <AHACourses />
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
          <Route path="/admin/capstone-grading">{() => (
            <AdminGate>
              <CapstoneGradingPanel />
            </AdminGate>
          )}</Route>
          <Route path="/admin/courses">{() => (
            <Redirect to="/admin" />
          )}</Route>
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
          <Route path="/resources">{() => <Redirect to="/help" />}</Route>
          <Route path="/faq">{() => <Redirect to="/help" />}</Route>
          <Route path="/success-stories">{() => <Redirect to="/parent-safe-truth" />}</Route>
          <Route path="/elite-fellowship">{() => <Redirect to="/fellowship" />}</Route>
          {/* / : route by auth state */}
          <Route path="/" component={RootEntry} />
          {/* Catch-all → role-aware root entry */}
            <Route component={RootEntry} />
          </Switch>
        </Suspense>
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

function mapUserTypeToRole(ut: string | null | undefined): UserRole {
  if (ut === "individual") return "provider";
  if (ut === "parent") return "parent";
  if (ut === "institutional") return "institution";
  return null;
}

function getRoleHomePath(role: UserRole): string {
  if (role === "parent") return "/parent-safe-truth";
  if (role === "institution") return "/hospital-admin-dashboard";
  return "/home";
}

function getRouteLoadingCopy(pathname: string) {
  if (pathname.startsWith("/resus")) {
    return {
      title: "Loading ResusGPS…",
      description: "Checking sign-in and preparing bedside guidance.",
    };
  }
  if (pathname.startsWith("/hospital-admin-dashboard") || pathname.startsWith("/institutional-portal")) {
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
  if (pathname.startsWith("/home")) {
    return {
      title: "Loading provider home…",
      description: "Checking your account and the best next step.",
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
  const { user, isAuthenticated, loading } = useAuth();
  const { role } = useUserRole();
  const effectiveRole = role ?? mapUserTypeToRole(user?.userType);
  const [location, setLocation] = useLocation();
  const loadingCopy = getRouteLoadingCopy(location);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      setLocation(buildLoginUrl(getCurrentAppPath()));
      return;
    }
    if (effectiveRole && !allowed.includes(effectiveRole)) {
      setLocation(getRoleHomePath(effectiveRole));
    }
  }, [allowed, effectiveRole, isAuthenticated, loading, setLocation]);

  if (loading) {
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
            <CardTitle>Access restricted for this role</CardTitle>
          </CardHeader>
          <CardContent>
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
  return <>{children}</>;
}

function RootEntry() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const roleForHome = mapUserTypeToRole(user?.userType);

  useEffect(() => {
    if (loading) return;
    const dest = isAuthenticated ? getRoleHomePath(roleForHome) : "/start";
    if (dest === "/home") void import("./pages/Home");
    else if (dest === "/parent-safe-truth") void import("./pages/ParentSafeTruth");
    else if (dest === "/hospital-admin-dashboard") void import("./pages/HospitalAdminDashboard");
    setLocation(dest);
  }, [isAuthenticated, loading, roleForHome, setLocation]);

  if (!loading) return null;

  return (
    <RouteLoadingState
      title="Opening Paeds Resus…"
      description="Routing you to the right workspace."
    />
  );
}
