import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ResusGPS from "./pages/ResusGPS";
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
      <main className="flex-1">
        <Switch>
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
