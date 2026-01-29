import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ClinicalAssessment from "./pages/ClinicalAssessment";
import { Toaster } from "@/components/ui/sonner";

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
          {/* Clinical Assessment - Main Route */}
          <Route path="/" component={ClinicalAssessment} />
          <Route path="/clinical-assessment" component={ClinicalAssessment} />
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
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
