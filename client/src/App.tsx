import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
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
import SafeTruth from "./pages/SafeTruth";
import AccreditationDashboard from "./pages/AccreditationDashboard";
import { FacilityProfile } from "./pages/FacilityProfile";
import { FacilityDirectory } from "./pages/FacilityDirectory";
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
import Support from "./pages/Support";
import EnterpriseDashboard from "./pages/EnterpriseDashboard";
import APIMarketplace from "./pages/APIMarketplace";
import InstructorMarketplace from "./pages/InstructorMarketplace";
import WhiteLabelPlatform from "./pages/WhiteLabelPlatform";
import AnalyticsIntelligence from "./pages/AnalyticsIntelligence";
import LiveTraining from "./pages/LiveTraining";
import PartnerEcosystem from "./pages/PartnerEcosystem";
import MobileApp from "./pages/MobileApp";
import GlobalExpansion from "./pages/GlobalExpansion";
import SocialImpact from "./pages/SocialImpact";
import CertificationMarketplace from "./pages/CertificationMarketplace";
import Payment from "./pages/Payment";
import AdminPaymentDashboard from "./pages/AdminPaymentDashboard";
import MarketingCampaign from "./pages/MarketingCampaign";

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
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
          <Route path="/payment" component={Payment} />
          <Route path="/admin-payment-dashboard" component={AdminPaymentDashboard} />
          <Route path="/marketing-campaign" component={MarketingCampaign} />
          <Route path="/payments" component={PaymentHistory} />
          <Route path="/progress" component={LearnerProgress} />
          <Route path="/search" component={Search} />
          <Route path="/community" component={Community} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/stakeholder-home" component={StakeholderHome} />
        <Route path="/developer-portal" component={DeveloperPortal} />
        <Route path="/elite-fellowship" component={EliteFellowship} />
        <Route path="/safe-truth" component={SafeTruth} />
        <Route path="/safetruth-tool" component={SafeTruthTool} />
        <Route path="/accreditation" component={AccreditationDashboard} />
        <Route path="/facility/:id" component={FacilityProfile} />
        <Route path="/facilities" component={FacilityDirectory} />
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
        <Route path="/support" component={Support} />
        <Route path="/enterprise-dashboard" component={EnterpriseDashboard} />
        <Route path="/api-marketplace" component={APIMarketplace} />
        <Route path="/instructor-marketplace" component={InstructorMarketplace} />
        <Route path="/white-label" component={WhiteLabelPlatform} />
        <Route path="/analytics-intelligence" component={AnalyticsIntelligence} />
        <Route path="/live-training" component={LiveTraining} />
        <Route path="/partner-ecosystem" component={PartnerEcosystem} />
        <Route path="/mobile-app" component={MobileApp} />
        <Route path="/global-expansion" component={GlobalExpansion} />
        <Route path="/social-impact" component={SocialImpact} />
        <Route path="/certification-marketplace" component={CertificationMarketplace} />
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
