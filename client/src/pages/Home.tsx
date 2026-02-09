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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { usePatientDemographics } from "@/contexts/PatientDemographicsContext";
import { Activity, User, Weight } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { demographics, setDemographics } = usePatientDemographics();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [patientAge, setPatientAge] = useState<string>(demographics.age || "");
  const [patientWeight, setPatientWeight] = useState<string>(demographics.weight || "");

  const handleStartAssessment = () => {
    setIsLoading(true);
    // Save patient demographics to context for use across all protocols
    if (patientAge || patientWeight) {
      setDemographics({
        age: patientAge,
        weight: patientWeight
      });
    }
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

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          {/* Install App Banner */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-4 text-center">
            <Button
              onClick={deferredPrompt ? handleInstallClick : () => {
                alert('To install ResusGPS:\n\n' +
                  '📱 On iOS: Tap Share → Add to Home Screen\n' +
                  '🤖 On Android: Tap Menu (⋮) → Install App\n' +
                  '💻 On Desktop: Look for install icon in address bar');
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Install App for Offline Access
            </Button>
            <p className="mt-2 text-xs text-gray-400">Works offline • Faster • Home screen shortcut</p>
          </div>
          
          {/* Patient Demographics - Quick Input */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h2 className="text-white text-lg font-semibold mb-4 flex items-center justify-center gap-2">
              <User className="h-5 w-5" />
              Patient Info (Optional - for accurate dosing)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-left">
                <Label htmlFor="age" className="text-gray-300 mb-2 block">
                  Age
                </Label>
                <Input
                  id="age"
                  type="text"
                  placeholder="e.g., 5 years, 6 months, 2 days"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="text-left">
                <Label htmlFor="weight" className="text-gray-300 mb-2 block flex items-center gap-2">
                  <Weight className="h-4 w-4" />
                  Weight (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="e.g., 18"
                  value={patientWeight}
                  onChange={(e) => setPatientWeight(e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-3">
              Entering patient info enables age-appropriate protocols and weight-based drug dosing
            </p>
          </div>

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
