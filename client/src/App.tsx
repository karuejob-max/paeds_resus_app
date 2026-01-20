import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Providers from "./pages/Providers";
import Institutional from "./pages/Institutional";
import Parents from "./pages/Parents";
import Enroll from "./pages/Enroll";
import LearnerDashboard from "./pages/LearnerDashboard";
import CertificateVerification from "./pages/CertificateVerification";
import SMSManagement from "./pages/SMSManagement";
import AdminDashboard from "./pages/AdminDashboard";
import InstitutionalManagement from "./pages/InstitutionalManagement";
import FacilityLocator from "./pages/FacilityLocator";
import PaymentHistory from "./pages/PaymentHistory";
import LearnerProgress from "./pages/LearnerProgress";
import Search from "./pages/Search";
import Community from "./pages/Community";
import Analytics from "./pages/Analytics";
import StakeholderHome from "./pages/StakeholderHome";
import DeveloperPortal from "./pages/DeveloperPortal";
import EliteFellowship from "./pages/EliteFellowship";
import SafeTruthTool from "./pages/SafeTruthTool";
import PaymentInstructions from "./pages/PaymentInstructions";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import About from "./pages/About";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TrainingSchedules from "./pages/TrainingSchedules";
import Resources from "./pages/Resources";
import SuccessStories from "./pages/SuccessStories";
import InstitutionalDashboard from "./pages/InstitutionalDashboard";
import PricingCalculator from "./pages/PricingCalculator";
import ROICalculator from "./pages/ROICalculator";
import Achievements from "./pages/Achievements";
import Leaderboard from "./pages/Leaderboard";
import ReferralProgram from "./pages/ReferralProgram";
import AHAeLearning from "./pages/AHAeLearning";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/providers" component={Providers} />
          <Route path="/institutional" component={Institutional} />
          <Route path="/parents" component={Parents} />
          <Route path="/enroll" component={Enroll} />
          <Route path="/dashboard" component={LearnerDashboard} />
          <Route path="/verify-certificate" component={CertificateVerification} />
          <Route path="/sms-management" component={SMSManagement} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/institutional-management" component={InstitutionalManagement} />
          <Route path="/facilities" component={FacilityLocator} />
          <Route path="/payments" component={PaymentHistory} />
          <Route path="/progress" component={LearnerProgress} />
          <Route path="/search" component={Search} />
          <Route path="/community" component={Community} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/stakeholder-home" component={StakeholderHome} />
        <Route path="/developer-portal" component={DeveloperPortal} />
        <Route path="/elite-fellowship" component={EliteFellowship} />
        <Route path="/safe-truth" component={SafeTruthTool} />
        <Route path="/payment-instructions" component={PaymentInstructions} />
        <Route path="/faq" component={FAQ} />
        <Route path="/contact" component={Contact} />
        <Route path="/about" component={About} />
        <Route path="/terms" component={TermsOfService} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/training-schedules" component={TrainingSchedules} />
        <Route path="/resources" component={Resources} />
        <Route path="/success-stories" component={SuccessStories} />
        <Route path="/institutional-dashboard" component={InstitutionalDashboard} />
        <Route path="/pricing-calculator" component={PricingCalculator} />
        <Route path="/roi-calculator" component={ROICalculator} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/referral-program" component={ReferralProgram} />
        <Route path="/aha-elearning" component={AHAeLearning} />
          <Route path="/404" component={NotFound} />
          {/* Final fallback route */}
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

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
