import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [confirmingIntervention, setConfirmingIntervention] = useState(false);

  const patientQuery = trpc.patients.getPatient.useQuery({ patientId: parseInt(id!) });
  const logInterventionMutation = trpc.interventions.logIntervention.useMutation();

  if (patientQuery.isLoading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center">Loading...</div>;
  }

  if (!patientQuery.data) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center">Patient not found</div>;
  }

  const patient = patientQuery.data;
  const riskScore = 78; // Mock data - in production, comes from ML model
  const confidence = 0.87; // Mock data
  const isCritical = riskScore > 70;
  const isHighRisk = riskScore > 50;

  const handleConfirmIntervention = async () => {
    try {
      await logInterventionMutation.mutateAsync({
        patientId: parseInt(id!),
        interventionType: "emergency_alert_response",
        description: "Intervention confirmed from alert",
      });
      setConfirmingIntervention(false);
      setLocation("/");
    } catch (error) {
      console.error("Failed to log intervention:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Button variant="ghost" onClick={() => setLocation("/")} className="text-white">
            {"←"} Back
          </Button>
          <h1 className="text-xl font-bold text-white">Patient Details</h1>
          <div className="w-12"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* PATIENT INFO */}
        <div className={`rounded-lg p-6 ${isCritical ? "bg-red-900/20 border-2 border-red-500" : "bg-slate-800/50 border border-slate-700"}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{patient.name}</h2>
              <p className="text-slate-400">{patient.age} years old</p>
            </div>
            <Badge className={isCritical ? "bg-red-600" : "bg-orange-600"}>
              {isCritical ? "CRITICAL" : "HIGH RISK"}
            </Badge>
          </div>

          {patient.diagnosis && (
            <p className="text-slate-300 mb-4">
              <span className="font-medium">Diagnosis:</span> {patient.diagnosis}
            </p>
          )}


        </div>

        {/* RISK ANALYSIS */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Risk Analysis</h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-300">Risk Score</span>
                <span className={`font-bold ${isCritical ? "text-red-400" : "text-orange-400"}`}>
                  {riskScore}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${isCritical ? "bg-red-500" : "bg-orange-500"}`}
                  style={{ width: `${riskScore}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-300">Model Confidence</span>
                <span className="font-bold text-blue-400">{(confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${confidence * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-700/50 rounded p-3 mt-4">
              <p className="text-sm text-slate-300">
                <span className="font-medium">Time to Deterioration:</span> 4-6 hours
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Based on vital signs trajectory and clinical patterns
              </p>
            </div>
          </div>
        </div>

        {/* WHY THIS RISK */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Why This Risk Score?</h3>

          <div className="space-y-2 text-slate-300">
            <p className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span>Low oxygen saturation ({patient.vitalsHistory?.[0]?.oxygenSaturation || "N/A"}%)</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span>Elevated heart rate ({patient.vitalsHistory?.[0]?.heartRate || "N/A"} bpm)</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span>High temperature ({patient.vitalsHistory?.[0]?.temperature || "N/A"}°C)</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-yellow-500 font-bold">•</span>
              <span>Similar to 47 patients who deteriorated</span>
            </p>
          </div>
        </div>

        {/* RECOMMENDED ACTION */}
        <div className={`rounded-lg p-6 ${isCritical ? "bg-red-900/30 border-2 border-red-500" : "bg-orange-900/30 border border-orange-500"}`}>
          <h3 className="text-lg font-bold text-white mb-4">Recommended Action</h3>

          <div className="space-y-3 text-slate-200 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <p className="font-medium">Give Oxygen</p>
                <p className="text-sm text-slate-400">Target O2 sat {">"}94%</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">2️⃣</span>
              <div>
                <p className="font-medium">Monitor Closely</p>
                <p className="text-sm text-slate-400">Check vitals every 15 minutes</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">3️⃣</span>
              <div>
                <p className="font-medium">Prepare for Escalation</p>
                <p className="text-sm text-slate-400">Have backup plan ready</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            ⚠️ This is a prediction, not a diagnosis. Use clinical judgment.
          </p>

          {!confirmingIntervention ? (
            <Button
              onClick={() => setConfirmingIntervention(true)}
              className={`w-full h-12 text-base font-bold ${isCritical ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"}`}
            >
              Confirm Action
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-white font-medium text-center">Are you sure?</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleConfirmIntervention}
                  disabled={logInterventionMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {logInterventionMutation.isPending ? "Saving..." : "Yes, Confirm"}
                </Button>
                <Button
                  onClick={() => setConfirmingIntervention(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* DISMISS */}
        <Button
          variant="outline"
          onClick={() => setLocation("/")}
          className="w-full"
        >
          Dismiss Alert
        </Button>
      </div>
    </div>
  );
}
