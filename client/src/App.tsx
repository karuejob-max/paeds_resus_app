import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import ClinicalAssessment from "./pages/ClinicalAssessment";
import ClinicalAssessmentGPS from "./pages/ClinicalAssessmentGPS";
import NRPAssessment from "./pages/NRPAssessment";
import TraumaAssessment from "./pages/TraumaAssessment";
import { Toaster } from "@/components/ui/sonner";

// Lazy load heavier components
const ProcedureVideoLibrary = lazy(() => import("./components/ProcedureVideoLibrary"));
const CaseSimulation = lazy(() => import("./components/CaseSimulation"));
const ProviderTrainingMode = lazy(() => import("./components/ProviderTrainingMode"));
const ArrhythmiaRecognition = lazy(() => import("./components/ArrhythmiaRecognition"));

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

// Loading fallback for lazy components
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

// Wrapper for procedure library page
function ProceduresPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <div className="min-h-screen">
        <ProcedureVideoLibrary />
      </div>
    </Suspense>
  );
}

// Wrapper for simulation page
function SimulationsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <div className="min-h-screen">
        <CaseSimulation />
      </div>
    </Suspense>
  );
}

// Wrapper for training page
function TrainingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <div className="min-h-screen">
        <ProviderTrainingMode />
      </div>
    </Suspense>
  );
}

// Wrapper for ECG/Arrhythmia page
function ArrhythmiaPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <div className="min-h-screen">
        <ArrhythmiaRecognition patientWeight={20} patientAge={5} />
      </div>
    </Suspense>
  );
}

function Router() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <ScrollToTop />
      <main className="flex-1">
        <Switch>
          {/* Clinical Assessment - GPS Mode (New) */}
          <Route path="/" component={ClinicalAssessmentGPS} />
          <Route path="/gps" component={ClinicalAssessmentGPS} />
          <Route path="/clinical-assessment" component={ClinicalAssessmentGPS} />
          {/* Legacy Clinical Assessment */}
          <Route path="/legacy" component={ClinicalAssessment} />
          {/* Neonatal Resuscitation Program */}
          <Route path="/nrp" component={NRPAssessment} />
          <Route path="/neonatal" component={NRPAssessment} />
          {/* Pediatric Trauma Assessment */}
          <Route path="/trauma" component={TraumaAssessment} />
          {/* Procedure Video Library */}
          <Route path="/procedures" component={ProceduresPage} />
          {/* Case Simulation Mode */}
          <Route path="/simulations" component={SimulationsPage} />
          <Route path="/practice" component={SimulationsPage} />
          {/* Provider Training Mode */}
          <Route path="/training" component={TrainingPage} />
          <Route path="/learn" component={TrainingPage} />
          {/* ECG/Arrhythmia Recognition */}
          <Route path="/ecg" component={ArrhythmiaPage} />
          <Route path="/arrhythmia" component={ArrhythmiaPage} />
          {/* Catch all - redirect to clinical assessment */}
          <Route component={ClinicalAssessment} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
