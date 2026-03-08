import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Header from "./components/Header";
import ResusGPS from "./pages/ResusGPS";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ParentSafeTruth from "./pages/ParentSafeTruth";
import SafeTruth from "./pages/SafeTruth";
import InstitutionalPortal from "./pages/InstitutionalPortal";
import Institutional from "./pages/Institutional";
import AdminHub from "./pages/AdminHub";
import AdminReports from "./pages/AdminReports";
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
import { Toaster } from "@/components/ui/sonner";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  return null;
}

function Router() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/home" component={Home} />
          <Route path="/parent-safe-truth" component={ParentSafeTruth} />
          <Route path="/safe-truth" component={SafeTruth} />
          <Route path="/institutional-portal" component={InstitutionalPortal} />
          <Route path="/institutional" component={Institutional} />
          <Route path="/admin" component={AdminHub} />
          <Route path="/admin/reports" component={AdminReports} />
          <Route path="/hospital-admin-dashboard" component={HospitalAdminDashboard} />
          <Route path="/advanced-analytics" component={AdvancedAnalytics} />
          <Route path="/enroll" component={Enroll} />
          <Route path="/learner-dashboard" component={LearnerDashboard} />
          <Route path="/patients" component={PatientsList} />
          <Route path="/protocols" component={EmergencyProtocols} />
          <Route path="/performance-dashboard" component={PerformanceDashboard} />
          <Route path="/provider-profile" component={ProviderProfile} />
          <Route path="/cpr-monitoring" component={CPRMonitoring} />
          <Route path="/payment" component={Payment} />
          {/* ONE entry point. ONE system. ABCDE Primary Survey. */}
          <Route path="/" component={ResusGPS} />
          <Route path="/resus" component={ResusGPS} />
          {/* Catch all → ResusGPS */}
          <Route component={ResusGPS} />
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
