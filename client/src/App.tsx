import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Institutional from "./pages/Institutional";
import InstitutionalOnboarding from "./pages/InstitutionalOnboarding";
import InstitutionalPortal from "./pages/InstitutionalPortal";
import Enroll from "./pages/Enroll";
import LearnerDashboard from "./pages/LearnerDashboard";
import SafeTruth from "./pages/SafeTruth";
import ParentSafeTruth from "./pages/ParentSafeTruth";
import Payment from "./pages/Payment";
import HospitalAdminDashboard from "./pages/HospitalAdminDashboard";
import CourseBLS from "./pages/CourseBLS";
import SafeTruthAnalytics from "./pages/SafeTruthAnalytics";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import KaizenDashboard from "./pages/KaizenDashboard";
import PredictiveInterventionDashboard from "./pages/PredictiveInterventionDashboard";
import PersonalizedLearningDashboard from "./pages/PersonalizedLearningDashboard";
import { PersonalImpactDashboard } from "./pages/PersonalImpactDashboard";
import PatientDetail from "./pages/PatientDetail";
import PaedsAIAssistant from "@/components/PaedsAIAssistant";
import ChatWidget from "./components/ChatWidget";
import RoleSelectionPrompt from "./components/RoleSelectionPrompt";
import { useAuth } from "./_core/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

function Router() {
  const { user } = useAuth();
  const [showRolePrompt, setShowRolePrompt] = useState(false);

  // Show role selection prompt on first login if no role is set
  useEffect(() => {
    if (user && !localStorage.getItem("userRole")) {
      setShowRolePrompt(true);
    }
  }, [user]);

  const handleRoleSelected = (role: "parent" | "provider" | "institution") => {
    localStorage.setItem("userRole", role);
    setShowRolePrompt(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Switch>
          {/* Core MVP Routes */}
          <Route path="/" component={Home} />
          <Route path="/enroll" component={Enroll} />
          <Route path="/payment" component={Payment} />
          <Route path="/learner-dashboard" component={LearnerDashboard} />
          <Route path="/safe-truth" component={SafeTruth} />
          <Route path="/parent-safe-truth" component={ParentSafeTruth} />
          <Route path="/institutional" component={Institutional} />
          <Route path="/institutional-onboarding" component={InstitutionalOnboarding} />
          <Route path="/institutional-portal" component={InstitutionalPortal} />
          <Route path="/hospital-admin-dashboard" component={HospitalAdminDashboard} />
          <Route path="/course/bls" component={CourseBLS} />
          <Route path="/safe-truth-analytics" component={SafeTruthAnalytics} />
          <Route path="/advanced-analytics" component={AdvancedAnalytics} />
          <Route path="/kaizen-dashboard" component={KaizenDashboard} />
          <Route path="/predictive-intervention" component={PredictiveInterventionDashboard} />
          <Route path="/personalized-learning" component={PersonalizedLearningDashboard} />
          <Route path="/personal-impact" component={PersonalImpactDashboard} />
          <Route path="/patient/:id" component={PatientDetail} />
          <Route path="/not-found" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <PaedsAIAssistant />
      <ChatWidget />
      {showRolePrompt && (
        <RoleSelectionPrompt
          onRoleSelected={handleRoleSelected}
          onClose={() => setShowRolePrompt(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
