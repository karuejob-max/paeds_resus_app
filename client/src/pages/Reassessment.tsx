import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useLocation } from "wouter";

interface ReassessmentParameter {
  id: string;
  parameter: string;
  baseline: string;
  current: string;
  trend: "improving" | "same" | "worsening" | null;
}

export default function Reassessment() {
  const [, navigate] = useLocation();
  const [timeElapsed, setTimeElapsed] = useState(15);
  const [parameters, setParameters] = useState<ReassessmentParameter[]>([
    {
      id: "hr",
      parameter: "Heart Rate",
      baseline: "140 bpm (tachycardia)",
      current: "",
      trend: null,
    },
    {
      id: "bp",
      parameter: "Blood Pressure",
      baseline: "Systolic 85 mmHg (low)",
      current: "",
      trend: null,
    },
    {
      id: "rr",
      parameter: "Respiratory Rate",
      baseline: "45 breaths/min (tachypnea)",
      current: "",
      trend: null,
    },
    {
      id: "spo2",
      parameter: "SpO2",
      baseline: "88% on room air",
      current: "",
      trend: null,
    },
    {
      id: "cap-refill",
      parameter: "Capillary Refill",
      baseline: "3 seconds",
      current: "",
      trend: null,
    },
    {
      id: "consciousness",
      parameter: "Level of Consciousness",
      baseline: "Alert and verbal",
      current: "",
      trend: null,
    },
    {
      id: "perfusion",
      parameter: "Skin Perfusion",
      baseline: "Pale, cool extremities",
      current: "",
      trend: null,
    },
  ]);

  const [overallTrend, setOverallTrend] = useState<"improving" | "same" | "worsening" | null>(null);
  const [escalationNeeded, setEscalationNeeded] = useState(false);
  const [nextSteps, setNextSteps] = useState<string[]>([]);

  useEffect(() => {
    // Timer simulation
    const timer = setInterval(() => {
      setTimeElapsed((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const updateTrend = (parameterId: string, trend: "improving" | "same" | "worsening") => {
    setParameters(
      parameters.map((param) =>
        param.id === parameterId ? { ...param, trend } : param
      )
    );
  };

  const handleOverallTrendChange = (trend: "improving" | "same" | "worsening") => {
    setOverallTrend(trend);
    generateNextSteps(trend);
  };

  const generateNextSteps = (trend: "improving" | "same" | "worsening") => {
    const steps: string[] = [];

    if (trend === "improving") {
      steps.push("Continue current management plan");
      steps.push("Repeat vital signs in 15 minutes");
      steps.push("Monitor for any deterioration");
      steps.push("Prepare for discharge planning if stable");
      setEscalationNeeded(false);
    } else if (trend === "same") {
      steps.push("Review current interventions");
      steps.push("Consider escalating therapy");
      steps.push("Add second medication/intervention if appropriate");
      steps.push("Prepare for transfer to higher level of care");
      setEscalationNeeded(true);
    } else if (trend === "worsening") {
      steps.push("EMERGENCY: Call for immediate backup");
      steps.push("Escalate all interventions");
      steps.push("Prepare for immediate transfer");
      steps.push("Consider advanced airway management");
      steps.push("Activate emergency protocols");
      setEscalationNeeded(true);
    }

    setNextSteps(steps);
  };

  const getTrendIcon = (trend: string | null) => {
    if (trend === "improving") return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (trend === "worsening") return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <Minus className="w-5 h-5 text-yellow-600" />;
  };

  const getTrendColor = (trend: string | null) => {
    if (trend === "improving") return "bg-green-50 border-green-200";
    if (trend === "worsening") return "bg-red-50 border-red-200";
    return "bg-yellow-50 border-yellow-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Reassessment (15 Minutes)</h1>
          <p className="text-slate-600">
            Evaluate child's response to interventions and determine next steps
          </p>
        </div>

        {/* Timer */}
        <Alert className="mb-8 bg-blue-50 border-blue-200">
          <Clock className="h-5 w-5 text-blue-600" />
          <AlertDescription className="ml-2">
            <div className="text-blue-800">
              <div className="font-bold">Time since interventions started: {timeElapsed} seconds</div>
              <div className="text-sm">Reassess vital signs and clinical status</div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Parameter Reassessment */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Vital Signs & Clinical Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {parameters.map((param) => (
                <div key={param.id} className="border-b pb-4 last:border-b-0">
                  <div className="mb-3">
                    <h3 className="font-semibold text-slate-900">{param.parameter}</h3>
                    <div className="text-sm text-slate-600 mt-1">
                      <span className="font-semibold">Baseline (15 min ago):</span> {param.baseline}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-slate-700">Current Status:</Label>
                    <RadioGroup value={param.trend || ""} onValueChange={(value) => updateTrend(param.id, value as any)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="improving" id={`${param.id}-improving`} />
                        <Label htmlFor={`${param.id}-improving`} className="flex items-center gap-2 cursor-pointer">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          Improving
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="same" id={`${param.id}-same`} />
                        <Label htmlFor={`${param.id}-same`} className="flex items-center gap-2 cursor-pointer">
                          <Minus className="w-4 h-4 text-yellow-600" />
                          Same
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="worsening" id={`${param.id}-worsening`} />
                        <Label htmlFor={`${param.id}-worsening`} className="flex items-center gap-2 cursor-pointer">
                          <TrendingDown className="w-4 h-4 text-red-600" />
                          Worsening
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Overall Trend */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Overall Clinical Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-slate-600">
                Based on your reassessment, is the child overall:
              </p>
              <RadioGroup value={overallTrend || ""} onValueChange={(value) => handleOverallTrendChange(value as any)}>
                <div className="space-y-3">
                  <div className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${overallTrend === "improving" ? "bg-green-50 border-green-500" : "bg-white border-slate-200"}`}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="improving" id="overall-improving" />
                      <Label htmlFor="overall-improving" className="flex items-center gap-2 cursor-pointer flex-1">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-semibold text-green-900">Improving</div>
                          <div className="text-sm text-green-700">Child is responding well to treatment</div>
                        </div>
                      </Label>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${overallTrend === "same" ? "bg-yellow-50 border-yellow-500" : "bg-white border-slate-200"}`}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="same" id="overall-same" />
                      <Label htmlFor="overall-same" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Minus className="w-5 h-5 text-yellow-600" />
                        <div>
                          <div className="font-semibold text-yellow-900">No Change</div>
                          <div className="text-sm text-yellow-700">Child's condition is stable but not improving</div>
                        </div>
                      </Label>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${overallTrend === "worsening" ? "bg-red-50 border-red-500" : "bg-white border-slate-200"}`}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="worsening" id="overall-worsening" />
                      <Label htmlFor="overall-worsening" className="flex items-center gap-2 cursor-pointer flex-1">
                        <TrendingDown className="w-5 h-5 text-red-600" />
                        <div>
                          <div className="font-semibold text-red-900">Worsening</div>
                          <div className="text-sm text-red-700">Child's condition is deteriorating</div>
                        </div>
                      </Label>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        {nextSteps.length > 0 && (
          <Alert className={`mb-8 ${escalationNeeded ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
            <CheckCircle2 className={`h-5 w-5 ${escalationNeeded ? "text-red-600" : "text-green-600"}`} />
            <AlertDescription className="ml-2">
              <div className={escalationNeeded ? "text-red-800" : "text-green-800"}>
                <div className="font-bold mb-2">
                  {escalationNeeded ? "⚠️ ESCALATION REQUIRED" : "✓ Continue Current Management"}
                </div>
                <div className="space-y-1">
                  {nextSteps.map((step, idx) => (
                    <div key={idx} className="text-sm flex items-start gap-2">
                      <div className="font-bold">{idx + 1}.</div>
                      <div>{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate("/targeted-solutions")}
            className="px-6"
          >
            Back to Solutions
          </Button>
          <Button
            onClick={() => navigate("/case-analysis")}
            disabled={!overallTrend}
            className="px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            Complete Case Analysis →
          </Button>
        </div>
      </div>
    </div>
  );
}

// Clock icon (not imported from lucide-react)
function Clock({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
