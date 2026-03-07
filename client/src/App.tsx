import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
import PlatformActivation from "./pages/PlatformActivation";
import ResusGPS from "./pages/ResusGPS";
import SafeTruth from "./pages/SafeTruth";
import ParentSafeTruth from "./pages/ParentSafeTruth";
import Institutional from "./pages/Institutional";
import InstitutionalOnboarding from "./pages/InstitutionalOnboarding";
import InstitutionalPortal from "./pages/InstitutionalPortal";
import CourseBLS from "./pages/CourseBLS";
import Enroll from "./pages/Enroll";
import Payment from "./pages/Payment";
import LearnerDashboard from "./pages/LearnerDashboard";
import HospitalAdminDashboard from "./pages/HospitalAdminDashboard";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import KaizenDashboard from "./pages/KaizenDashboard";
import PredictiveInterventionDashboard from "./pages/PredictiveInterventionDashboard";
import PersonalizedLearningDashboard from "./pages/PersonalizedLearningDashboard";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function Router() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <ScrollToTop />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={PlatformActivation} />
          <Route path="/activation" component={PlatformActivation} />
          <Route path="/resus" component={ResusGPS} />
          <Route path="/safe-truth" component={SafeTruth} />
          <Route path="/parent-safe-truth" component={ParentSafeTruth} />
          <Route path="/institutional" component={Institutional} />
          <Route
            path="/institutional-onboarding"
            component={InstitutionalOnboarding}
          />
          <Route path="/institutional-portal" component={InstitutionalPortal} />
          <Route path="/course/bls" component={CourseBLS} />
          <Route path="/enroll" component={Enroll} />
          <Route path="/payment" component={Payment} />
          <Route path="/learner-dashboard" component={LearnerDashboard} />
          <Route
            path="/hospital-admin-dashboard"
            component={HospitalAdminDashboard}
          />
          <Route path="/advanced-analytics" component={AdvancedAnalytics} />
          <Route path="/kaizen-dashboard" component={KaizenDashboard} />
          <Route
            path="/predictive-intervention"
            component={PredictiveInterventionDashboard}
          />
          <Route
            path="/personalized-learning"
            component={PersonalizedLearningDashboard}
          />
          <Route path="/home" component={Home} />
          <Route path="/auth" component={Auth} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
