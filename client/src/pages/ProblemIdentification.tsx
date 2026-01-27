import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useLocation } from "wouter";

interface ClinicalFinding {
  category: string;
  finding: string;
  severity: "critical" | "warning" | "info";
}

interface ClinicalProblem {
  id: string;
  problem: string;
  severity: "critical" | "warning" | "info";
  findings: string[];
  urgency: "immediate" | "urgent" | "soon";
  interventions: string[];
}

export default function ProblemIdentification() {
  const [, navigate] = useLocation();
  const [findings, setFindings] = useState<ClinicalFinding[]>([]);
  const [problems, setProblems] = useState<ClinicalProblem[]>([]);
  const [primaryProblem, setPrimaryProblem] = useState<ClinicalProblem | null>(null);

  // Simulated data from previous assessments
  // In real app, this would come from context/state management
  const mockFindings: ClinicalFinding[] = [
    { category: "Airway", finding: "Stridor present", severity: "critical" },
    { category: "Breathing", finding: "RR 45 (tachypnea)", severity: "warning" },
    { category: "Breathing", finding: "SpO2 88% on room air", severity: "critical" },
    { category: "Breathing", finding: "Bilateral wheeze", severity: "warning" },
    { category: "Circulation", finding: "HR 140 (tachycardia)", severity: "warning" },
    { category: "Circulation", finding: "Capillary refill 3 seconds", severity: "warning" },
    { category: "Disability", finding: "Alert and verbal", severity: "info" },
    { category: "Exposure", finding: "Temperature 38.5°C", severity: "info" },
  ];

  useEffect(() => {
    setFindings(mockFindings);
    generateProblems(mockFindings);
  }, []);

  const generateProblems = (allFindings: ClinicalFinding[]) => {
    const generatedProblems: ClinicalProblem[] = [];

    // Check for respiratory failure
    const respiratoryFindings = allFindings.filter(f => f.category === "Breathing");
    if (respiratoryFindings.some(f => f.finding.includes("SpO2 < 90"))) {
      generatedProblems.push({
        id: "respiratory-failure",
        problem: "Respiratory Failure - Hypoxemia",
        severity: "critical",
        findings: respiratoryFindings.map(f => f.finding),
        urgency: "immediate",
        interventions: [
          "Increase oxygen to target SpO2 > 94%",
          "Consider BVM if SpO2 not improving",
          "Prepare for intubation if worsening",
        ],
      });
    }

    // Check for upper airway obstruction
    const airwayFindings = allFindings.filter(f => f.category === "Airway");
    if (airwayFindings.some(f => f.finding.includes("Stridor"))) {
      generatedProblems.push({
        id: "upper-airway-obstruction",
        problem: "Upper Airway Obstruction (Croup/Epiglottitis)",
        severity: "critical",
        findings: airwayFindings.map(f => f.finding),
        urgency: "immediate",
        interventions: [
          "Dexamethasone 0.6 mg/kg IV/IM",
          "Nebulized epinephrine 1:1000 - 0.5 mL/kg (max 5 mL)",
          "Oxygen to maintain SpO2 > 94%",
          "Prepare for airway management if worsening",
        ],
      });
    }

    // Check for lower airway obstruction (asthma/bronchiolitis)
    if (respiratoryFindings.some(f => f.finding.includes("wheeze"))) {
      generatedProblems.push({
        id: "lower-airway-obstruction",
        problem: "Lower Airway Obstruction (Asthma/Bronchiolitis)",
        severity: "warning",
        findings: respiratoryFindings.map(f => f.finding),
        urgency: "urgent",
        interventions: [
          "Salbutamol nebulizer 0.15 mg/kg (max 5 mg)",
          "Dexamethasone 0.6 mg/kg or Prednisolone 1 mg/kg",
          "Oxygen to maintain SpO2 > 94%",
          "Reassess in 15 minutes",
        ],
      });
    }

    // Check for shock
    const circulationFindings = allFindings.filter(f => f.category === "Circulation");
    if (circulationFindings.some(f => f.finding.includes("Capillary refill 3"))) {
      generatedProblems.push({
        id: "shock",
        problem: "Shock (Likely Hypovolemic or Septic)",
        severity: "critical",
        findings: circulationFindings.map(f => f.finding),
        urgency: "immediate",
        interventions: [
          "Establish IV access (2 large bore cannulas)",
          "Fluid bolus: Normal saline 20 mL/kg over 15 minutes",
          "Reassess perfusion after fluid bolus",
          "If not improving: Consider second bolus or vasopressors",
        ],
      });
    }

    // Check for fever/infection
    const exposureFindings = allFindings.filter(f => f.category === "Exposure");
    if (exposureFindings.some(f => f.finding.includes("38.5°C"))) {
      generatedProblems.push({
        id: "fever-infection",
        problem: "Fever - Possible Infection/Sepsis",
        severity: "warning",
        findings: exposureFindings.map(f => f.finding),
        urgency: "urgent",
        interventions: [
          "Blood cultures if sepsis suspected",
          "Start antibiotics if signs of sepsis",
          "Ceftriaxone 80 mg/kg/day (max 2g) IV/IM",
          "Maintain adequate perfusion",
        ],
      });
    }

    setProblems(generatedProblems);

    // Set primary problem (most urgent)
    const criticalProblems = generatedProblems.filter(p => p.urgency === "immediate");
    if (criticalProblems.length > 0) {
      setPrimaryProblem(criticalProblems[0]);
    } else {
      setPrimaryProblem(generatedProblems[0] || null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    if (urgency === "immediate") return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (urgency === "urgent") return <Clock className="w-5 h-5 text-yellow-600" />;
    return <CheckCircle2 className="w-5 h-5 text-green-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Problem Identification</h1>
          <p className="text-slate-600">
            Based on your ABCDE assessment, here are the identified clinical problems
          </p>
        </div>

        {/* Clinical Findings Summary */}
        <Card className="mb-8 border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-lg">Clinical Findings Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {findings.map((finding, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${getSeverityColor(finding.severity)}`}>
                  <div className="font-semibold text-sm">{finding.category}</div>
                  <div className="text-sm mt-1">{finding.finding}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Primary Problem - Immediate Action */}
        {primaryProblem && (
          <Alert className="mb-8 border-l-4 border-l-red-500 bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="ml-2">
              <div className="font-bold text-red-900 mb-2">PRIMARY PROBLEM - IMMEDIATE ACTION REQUIRED</div>
              <div className="text-red-800 font-semibold mb-3">{primaryProblem.problem}</div>
              <div className="space-y-2">
                {primaryProblem.interventions.map((intervention, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="text-red-800 pt-0.5">{intervention}</div>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* All Identified Problems */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">All Identified Problems</h2>
          <div className="space-y-4">
            {problems.map((problem) => (
              <Card key={problem.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getUrgencyIcon(problem.urgency)}
                      <div>
                        <CardTitle className="text-lg">{problem.problem}</CardTitle>
                        <Badge className={`mt-2 ${getSeverityColor(problem.severity)}`}>
                          {problem.urgency.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Findings */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-slate-700 mb-2">Supporting Findings:</h4>
                    <div className="space-y-1">
                      {problem.findings.map((finding, idx) => (
                        <div key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-slate-400" />
                          {finding}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interventions */}
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-2">Targeted Interventions:</h4>
                    <div className="space-y-2">
                      {problem.interventions.map((intervention, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div className="text-slate-700 pt-0.5">{intervention}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate("/circulation-assessment")}
            className="px-6"
          >
            Back to Assessment
          </Button>
          <Button
            onClick={() => navigate("/targeted-solutions")}
            className="px-6 bg-red-600 hover:bg-red-700"
          >
            Proceed to Targeted Solutions →
          </Button>
        </div>
      </div>
    </div>
  );
}
