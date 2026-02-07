/**
 * ResusGPS Homepage - Pure Emergency Interface
 * 
 * Design Philosophy: This is life and death. Zero redundancy, zero cognitive load.
 * ONE BUTTON. ONE ACTION. ONE SECOND.
 * 
 * All emergency protocols accessible inside ClinicalAssessmentGPS via EmergencyLauncher.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { Activity } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartAssessment = () => {
    setIsLoading(true);
    // Small delay to show loading state
    setTimeout(() => {
      setLocation("/clinical-assessment");
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

      {/* Single Action - Maximum Impact */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-8 text-center">
          
          {/* Giant Single Button */}
          <Button
            onClick={handleStartAssessment}
            disabled={isLoading}
            className="w-full h-48 md:h-64 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-3xl md:text-5xl font-bold shadow-2xl transform hover:scale-[1.02] transition-all disabled:opacity-50 rounded-2xl"
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin h-16 w-16 md:h-24 md:w-24 border-8 border-white border-t-transparent rounded-full" />
                <span className="text-xl md:text-2xl">LOADING...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Activity className="h-16 w-16 md:h-24 md:w-24" />
                <span>START CLINICAL ASSESSMENT</span>
              </div>
            )}
          </Button>

          {/* Tagline */}
          <div className="space-y-2">
            <p className="text-gray-300 text-lg md:text-xl font-medium">
              Intelligent triage • Zero diagnostic burden • Immediate interventions
            </p>
            <p className="text-gray-500 text-sm">
              All emergency protocols accessible inside
            </p>
          </div>

        </div>
      </main>

      {/* Footer - Minimal */}
      <footer className="p-4 text-center text-gray-600 text-xs border-t border-gray-800">
        <p>This is life and death. One button, one action, one second.</p>
      </footer>
    </div>
  );
}
