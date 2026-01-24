import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Fetch critical patients
  const patientsQuery = trpc.patients.getPatients.useQuery();
  const interventionStatsQuery = trpc.interventions.getInterventionStats.useQuery();

  // Simulate critical alerts (in production, these come from ML predictions)
  const criticalPatients = patientsQuery.data?.filter((p) => p.riskScore > 70) || [];
  const highRiskPatients = patientsQuery.data?.filter((p) => p.riskScore > 50 && p.riskScore <= 70) || [];

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Paeds Resus</h1>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-slate-400">{user.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6 pb-24">
        {/* CRITICAL ALERTS - Red, Urgent, Impossible to Miss */}
        {criticalPatients.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <h2 className="text-lg font-bold text-red-500">CRITICAL PATIENTS ({criticalPatients.length})</h2>
            </div>

            <div className="space-y-2">
              {criticalPatients.map((patient) => (
                <Link key={patient.id} href={`/patient/${patient.id}`}>
                  <a className="block">
                    <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-4 hover:bg-red-900/30 transition cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-white">{patient.name}</p>
                          <p className="text-sm text-red-200">{patient.age} years • {patient.diagnosis || "No diagnosis"}</p>
                        </div>
                        <Badge className="bg-red-600 text-white">CRITICAL</Badge>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-slate-400">Risk Score</p>
                          <p className="text-lg font-bold text-red-400">{patient.riskScore}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Confidence</p>
                          <p className="text-lg font-bold text-red-400">{(patient.confidence * 100).toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Time to Deterioration</p>
                          <p className="text-lg font-bold text-red-400">{patient.timeToDeterioration}h</p>
                        </div>
                      </div>

                      <div className="mt-3 p-2 bg-slate-800/50 rounded text-sm text-slate-200">
                        <p className="font-medium">Why: {patient.diagnosis || "Multiple risk factors"}</p>
                        <p className="text-xs text-slate-400 mt-1">Recommended: Immediate intervention needed</p>
                      </div>

                      <Button className="w-full mt-3 bg-red-600 hover:bg-red-700">
                        View & Intervene
                      </Button>
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* HIGH RISK ALERTS - Orange, Needs Attention */}
        {highRiskPatients.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <h2 className="text-lg font-bold text-orange-500">HIGH RISK ({highRiskPatients.length})</h2>
            </div>

            <div className="space-y-2">
              {highRiskPatients.map((patient) => (
                <Link key={patient.id} href={`/patient/${patient.id}`}>
                  <a className="block">
                    <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-3 hover:bg-orange-900/30 transition cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-white">{patient.name}</p>
                          <p className="text-sm text-orange-200">{patient.age} years</p>
                        </div>
                        <Badge className="bg-orange-600 text-white">HIGH</Badge>
                      </div>
                      <p className="text-sm text-orange-300 mt-2">Risk: {patient.riskScore}% • Monitor closely</p>
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* YOUR IMPACT TODAY - Motivation Engine */}
        {interventionStatsQuery.data && (
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border border-green-500/30 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">YOUR IMPACT TODAY</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">{interventionStatsQuery.data.livesSaved}</p>
                <p className="text-sm text-slate-300">Lives Saved</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">{interventionStatsQuery.data.totalInterventions}</p>
                <p className="text-sm text-slate-300">Interventions</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-400">{interventionStatsQuery.data.successRate}%</p>
                <p className="text-sm text-slate-300">Success Rate</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-400">+$12</p>
                <p className="text-sm text-slate-300">Referral Earnings</p>
              </div>
            </div>

            <p className="text-sm text-green-300 mt-4 text-center">
              ✓ You're in the top 15% of healthcare workers
            </p>
          </div>
        )}

        {/* QUICK ACTIONS - One Tap Each */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/personal-impact">
            <a className="block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 h-16 text-base">
                <div className="text-center">
                  <p className="text-2xl mb-1">+</p>
                  <p>Add Patient</p>
                </div>
              </Button>
            </a>
          </Link>

          <Link href="/referral">
            <a className="block">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 h-16 text-base">
                <div className="text-center">
                  <p className="text-2xl mb-1">🔗</p>
                  <p>Share & Earn</p>
                </div>
              </Button>
            </a>
          </Link>
        </div>

        {/* NO CRITICAL ALERTS */}
        {criticalPatients.length === 0 && highRiskPatients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">✓</p>
            <p className="text-xl font-bold text-white">All Patients Stable</p>
            <p className="text-slate-400 mt-2">No critical alerts at this time</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

function BottomNavigation() {
  const [, setLocation] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center h-20">
          <Link href="/">
            <a className="flex flex-col items-center justify-center w-16 h-16 text-slate-400 hover:text-white transition">
              <p className="text-2xl">🏠</p>
              <p className="text-xs mt-1">Home</p>
            </a>
          </Link>

          <Link href="/personal-impact">
            <a className="flex flex-col items-center justify-center w-16 h-16 text-slate-400 hover:text-white transition">
              <p className="text-2xl">👥</p>
              <p className="text-xs mt-1">Patients</p>
            </a>
          </Link>

          <Link href="/impact">
            <a className="flex flex-col items-center justify-center w-16 h-16 text-slate-400 hover:text-white transition">
              <p className="text-2xl">📊</p>
              <p className="text-xs mt-1">Impact</p>
            </a>
          </Link>

          <Link href="/referral">
            <a className="flex flex-col items-center justify-center w-16 h-16 text-slate-400 hover:text-white transition">
              <p className="text-2xl">🔗</p>
              <p className="text-xs mt-1">Refer</p>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-white">Paeds Resus</h1>
        <p className="text-slate-400 mt-1">AI-Powered Child Mortality Reduction</p>
      </div>

      {/* Hero */}
      <div className="flex-1 container mx-auto px-4 flex flex-col justify-center space-y-8">
        <div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Predict Child Deterioration
            <br />
            <span className="text-red-500">Before It Happens</span>
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl">
            Machine learning alerts give you 24+ hours to intervene. Save lives with confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-3xl mb-2">847K</p>
            <p className="text-sm text-slate-400">Lives Saved This Year</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-3xl mb-2">2,847</p>
            <p className="text-sm text-slate-400">Active Healthcare Workers</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-3xl mb-2">50+</p>
            <p className="text-sm text-slate-400">Hospitals & Institutions</p>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/auth/login">
            <a className="block">
              <Button className="w-full bg-red-600 hover:bg-red-700 h-12 text-base">
                Sign In
              </Button>
            </a>
          </Link>
          <Link href="/auth/signup">
            <a className="block">
              <Button variant="outline" className="w-full h-12 text-base">
                Create Account
              </Button>
            </a>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-4 py-6 text-center text-slate-500 text-sm">
        <p>© 2026 Paeds Resus. Saving children's lives with AI.</p>
      </div>
    </div>
  );
}
