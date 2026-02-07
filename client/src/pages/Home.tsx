/**
 * ResusGPS Homepage - Pure Emergency Interface
 * 
 * Design Philosophy: This is life and death. Zero marketing, zero distractions.
 * Provider must reach clinical tools within 2 seconds, zero scrolling.
 */

import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
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
            onClick={() => setLocation("/clinical-assessment")}
            className="w-full h-32 md:h-40 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-2xl md:text-4xl font-bold shadow-2xl transform hover:scale-[1.02] transition-all"
          >
            <Activity className="h-12 w-12 md:h-16 md:w-16 mr-4" />
            START CLINICAL ASSESSMENT
          </Button>

          <p className="text-center text-gray-400 text-sm">
            Intelligent triage • Zero diagnostic burden • Immediate interventions
          </p>

          {/* SECONDARY ACTION - Expert Mode */}
          <Button
            onClick={() => setLocation("/clinical-assessment?mode=expert")}
            variant="outline"
            className="w-full h-16 border-2 border-gray-600 hover:border-gray-500 text-white text-lg font-semibold"
          >
            <Zap className="h-6 w-6 mr-2" />
            Expert Mode: Quick Launch Protocol
          </Button>

          {/* Quick Access Grid - 4 Critical Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-8">
            <Button
              onClick={() => setLocation("/clinical-assessment?emergency=cardiac_arrest")}
              className="h-24 bg-red-600 hover:bg-red-700 flex flex-col items-center justify-center gap-2 text-lg font-bold"
            >
              <Heart className="h-8 w-8" />
              CARDIAC ARREST
            </Button>

            <Button
              onClick={() => {
                // Trigger shout for help - will be handled by clinical assessment
                setLocation("/clinical-assessment?shout=true");
              }}
              className="h-24 bg-orange-600 hover:bg-orange-700 flex flex-col items-center justify-center gap-2 text-lg font-bold"
            >
              <AlertTriangle className="h-8 w-8" />
              SHOUT FOR HELP
            </Button>

            <Button
              onClick={() => setLocation("/clinical-assessment?category=medical")}
              className="h-24 bg-purple-600 hover:bg-purple-700 flex flex-col items-center justify-center gap-2 text-lg font-bold"
            >
              <Activity className="h-8 w-8" />
              MEDICAL
            </Button>

            <Button
              onClick={() => setLocation("/clinical-assessment?category=neonatal")}
              className="h-24 bg-pink-600 hover:bg-pink-700 flex flex-col items-center justify-center gap-2 text-lg font-bold"
            >
              <Baby className="h-8 w-8" />
              NEONATAL
            </Button>

            <Button
              onClick={() => setLocation("/clinical-assessment?emergency=trauma")}
              className="h-24 bg-gray-600 hover:bg-gray-700 flex flex-col items-center justify-center gap-2 text-lg font-bold col-span-2"
            >
              <Shield className="h-8 w-8" />
              TRAUMA (All Ages)
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
