/**
 * ResusGPS Homepage - Pure Emergency Interface
 * 
 * Design Philosophy: This is life and death. Zero marketing, zero distractions.
 * Provider must reach clinical tools within 2 seconds, zero scrolling.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import {
  Activity,
  Heart,
  Zap,
  AlertTriangle,
  Baby,
  Shield,
} from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [loadingButton, setLoadingButton] = useState<string | null>(null);

  const handleNavigate = (path: string, buttonId: string) => {
    setLoadingButton(buttonId);
    // Small delay to show loading state
    setTimeout(() => {
      setLocation(path);
    }, 100);
  };

  // PWA Install Prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Offline Indicator + PWA Install */}
      <OfflineIndicator 
        showInstallButton={showInstallButton}
        onInstallClick={handleInstallClick}
      />
      {/* Header - Minimal */}
      <header className="p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Activity className="h-8 w-8 text-red-500" />
          <h1 className="text-2xl font-bold text-white">ResusGPS</h1>
        </div>
        <p className="text-sm text-gray-400 hidden sm:block">Pediatric Emergency GPS</p>
      </header>

      {/* Main Emergency Interface */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl space-y-6">
          
          {/* PRIMARY ACTION - Giant, Unmissable */}
          <Button
            onClick={() => handleNavigate("/clinical-assessment", "clinical-assessment")}
            disabled={loadingButton !== null}
            className="w-full h-32 md:h-40 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-2xl md:text-4xl font-bold shadow-2xl transform hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {loadingButton === "clinical-assessment" ? (
              <div className="animate-spin h-12 w-12 md:h-16 md:w-16 mr-4 border-4 border-white border-t-transparent rounded-full" />
            ) : (
              <Activity className="h-12 w-12 md:h-16 md:w-16 mr-4" />
            )}
            {loadingButton === "clinical-assessment" ? "LOADING..." : "START CLINICAL ASSESSMENT"}
          </Button>

          <p className="text-center text-gray-400 text-sm">
            Intelligent triage • Zero diagnostic burden • Immediate interventions
          </p>

          {/* SECONDARY ACTION - Expert Mode */}
          <Button
            onClick={() => handleNavigate("/clinical-assessment?mode=expert", "expert-mode")}
            disabled={loadingButton !== null}
            variant="outline"
            className="w-full h-16 border-2 border-gray-600 hover:border-gray-500 text-white text-lg font-semibold disabled:opacity-50"
          >
            {loadingButton === "expert-mode" ? (
              <div className="animate-spin h-6 w-6 mr-2 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Zap className="h-6 w-6 mr-2" />
            )}
            {loadingButton === "expert-mode" ? "Loading..." : "Expert Mode: Quick Launch Protocol"}
          </Button>

          {/* Quick Access Grid - 4 Critical Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-8">
            <Button
              onClick={() => handleNavigate("/clinical-assessment?emergency=cardiac_arrest", "cardiac-arrest")}
              disabled={loadingButton !== null}
              className="h-24 bg-red-600 hover:bg-red-700 flex flex-col items-center justify-center gap-2 text-lg font-bold disabled:opacity-50"
            >
              {loadingButton === "cardiac-arrest" ? (
                <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full" />
              ) : (
                <Heart className="h-8 w-8" />
              )}
              {loadingButton === "cardiac-arrest" ? "Loading..." : "CARDIAC ARREST"}
            </Button>

            <Button
              onClick={() => handleNavigate("/clinical-assessment?shout=true", "shout-help")}
              disabled={loadingButton !== null}
              className="h-24 bg-orange-600 hover:bg-orange-700 flex flex-col items-center justify-center gap-2 text-lg font-bold disabled:opacity-50"
            >
              {loadingButton === "shout-help" ? (
                <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full" />
              ) : (
                <AlertTriangle className="h-8 w-8" />
              )}
              {loadingButton === "shout-help" ? "Loading..." : "SHOUT FOR HELP"}
            </Button>

            <Button
              onClick={() => handleNavigate("/clinical-assessment?category=medical", "medical")}
              disabled={loadingButton !== null}
              className="h-24 bg-purple-600 hover:bg-purple-700 flex flex-col items-center justify-center gap-2 text-lg font-bold disabled:opacity-50"
            >
              {loadingButton === "medical" ? (
                <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full" />
              ) : (
                <Activity className="h-8 w-8" />
              )}
              {loadingButton === "medical" ? "Loading..." : "MEDICAL"}
            </Button>

            <Button
              onClick={() => handleNavigate("/clinical-assessment?category=neonatal", "neonatal")}
              disabled={loadingButton !== null}
              className="h-24 bg-pink-600 hover:bg-pink-700 flex flex-col items-center justify-center gap-2 text-lg font-bold disabled:opacity-50"
            >
              {loadingButton === "neonatal" ? (
                <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full" />
              ) : (
                <Baby className="h-8 w-8" />
              )}
              {loadingButton === "neonatal" ? "Loading..." : "NEONATAL"}
            </Button>

            <Button
              onClick={() => handleNavigate("/clinical-assessment?emergency=trauma", "trauma")}
              disabled={loadingButton !== null}
              className="h-24 bg-gray-600 hover:bg-gray-700 flex flex-col items-center justify-center gap-2 text-lg font-bold col-span-2 disabled:opacity-50"
            >
              {loadingButton === "trauma" ? (
                <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full" />
              ) : (
                <Shield className="h-8 w-8" />
              )}
              {loadingButton === "trauma" ? "Loading..." : "TRAUMA (All Ages)"}
            </Button>
          </div>

        </div>
      </main>

      {/* Footer - Minimal */}
      <footer className="p-4 text-center text-sm text-gray-500 border-t border-gray-800">
        <p>For emergencies only • Always call local emergency services first</p>
      </footer>
    </div>
  );
}
