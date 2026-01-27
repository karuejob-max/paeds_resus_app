import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, AlertTriangle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useLocation } from "wouter";

interface ManagementStep {
  id: string;
  step: number;
  action: string;
  dosage?: string;
  timing?: string;
  completed: boolean;
}

interface ProblemSolution {
  id: string;
  problem: string;
  urgency: "immediate" | "urgent" | "soon";
  steps: ManagementStep[];
}

export default function TargetedSolutions() {
  const [, navigate] = useLocation();
  const [solutions, setSolutions] = useState<ProblemSolution[]>([
    {
      id: "respiratory-failure",
      problem: "Respiratory Failure - Hypoxemia",
      urgency: "immediate",
      steps: [
        {
          id: "s1-1",
          step: 1,
          action: "Increase oxygen flow to 100% (non-rebreather mask or BVM)",
          timing: "Immediately",
          completed: false,
        },
        {
          id: "s1-2",
          step: 2,
          action: "Recheck SpO2 after 2 minutes",
          timing: "2 minutes",
          completed: false,
        },
        {
          id: "s1-3",
          step: 3,
          action: "If SpO2 still < 90%: Prepare BVM with 100% oxygen",
          timing: "Immediately if needed",
          completed: false,
        },
        {
          id: "s1-4",
          step: 4,
          action: "If SpO2 still < 90% after BVM: Prepare for intubation",
          timing: "Immediately if needed",
          completed: false,
        },
        {
          id: "s1-5",
          step: 5,
          action: "Call for senior help/prepare for transfer",
          timing: "Now",
          completed: false,
        },
      ],
    },
    {
      id: "upper-airway-obstruction",
      problem: "Upper Airway Obstruction (Croup/Epiglottitis)",
      urgency: "immediate",
      steps: [
        {
          id: "s2-1",
          step: 1,
          action: "Give Dexamethasone",
          dosage: "0.6 mg/kg IV/IM (max 10 mg)",
          timing: "Immediately",
          completed: false,
        },
        {
          id: "s2-2",
          step: 2,
          action: "Prepare nebulized epinephrine",
          dosage: "1:1000 - 0.5 mL/kg (max 5 mL) in 3 mL normal saline",
          timing: "Immediately",
          completed: false,
        },
        {
          id: "s2-3",
          step: 3,
          action: "Administer nebulized epinephrine",
          timing: "Over 10-15 minutes",
          completed: false,
        },
        {
          id: "s2-4",
          step: 4,
          action: "Oxygen to maintain SpO2 > 94%",
          timing: "Continuously",
          completed: false,
        },
        {
          id: "s2-5",
          step: 5,
          action: "Reassess airway in 15 minutes",
          timing: "15 minutes",
          completed: false,
        },
        {
          id: "s2-6",
          step: 6,
          action: "If worsening: Prepare for airway management",
          timing: "Immediately if needed",
          completed: false,
        },
      ],
    },
    {
      id: "lower-airway-obstruction",
      problem: "Lower Airway Obstruction (Asthma/Bronchiolitis)",
      urgency: "urgent",
      steps: [
        {
          id: "s3-1",
          step: 1,
          action: "Administer Salbutamol nebulizer",
          dosage: "0.15 mg/kg (max 5 mg) in 3 mL normal saline",
          timing: "Over 10-15 minutes",
          completed: false,
        },
        {
          id: "s3-2",
          step: 2,
          action: "Give Corticosteroid",
          dosage: "Dexamethasone 0.6 mg/kg OR Prednisolone 1 mg/kg",
          timing: "Immediately",
          completed: false,
        },
        {
          id: "s3-3",
          step: 3,
          action: "Oxygen to maintain SpO2 > 94%",
          timing: "Continuously",
          completed: false,
        },
        {
          id: "s3-4",
          step: 4,
          action: "Reassess in 15 minutes",
          timing: "15 minutes",
          completed: false,
        },
        {
          id: "s3-5",
          step: 5,
          action: "If not improving: Give Ipratropium nebulizer",
          dosage: "0.25 mg in 3 mL normal saline with Salbutamol",
          timing: "15 minutes",
          completed: false,
        },
        {
          id: "s3-6",
          step: 6,
          action: "If still not improving: Consider IV Magnesium Sulfate",
          dosage: "25-50 mg/kg IV over 20 minutes",
          timing: "30 minutes",
          completed: false,
        },
      ],
    },
    {
      id: "shock",
      problem: "Shock (Likely Hypovolemic or Septic)",
      urgency: "immediate",
      steps: [
        {
          id: "s4-1",
          step: 1,
          action: "Establish IV access",
          dosage: "2 large bore cannulas (18G or 20G if possible)",
          timing: "Immediately",
          completed: false,
        },
        {
          id: "s4-2",
          step: 2,
          action: "Draw blood for tests",
          dosage: "Blood cultures, FBC, U&E, glucose, lactate",
          timing: "Immediately",
          completed: false,
        },
        {
          id: "s4-3",
          step: 3,
          action: "Administer fluid bolus",
          dosage: "Normal saline 20 mL/kg IV over 15 minutes",
          timing: "Over 15 minutes",
          completed: false,
        },
        {
          id: "s4-4",
          step: 4,
          action: "Reassess perfusion after fluid bolus",
          timing: "15 minutes",
          completed: false,
        },
        {
          id: "s4-5",
          step: 5,
          action: "If improving: Continue current management",
          timing: "Ongoing",
          completed: false,
        },
        {
          id: "s4-6",
          step: 6,
          action: "If not improving: Give second fluid bolus",
          dosage: "Normal saline 20 mL/kg IV over 15 minutes",
          timing: "15-30 minutes",
          completed: false,
        },
        {
          id: "s4-7",
          step: 7,
          action: "If still not improving: Prepare for transfer + consider vasopressors",
          timing: "30+ minutes",
          completed: false,
        },
      ],
    },
    {
      id: "fever-infection",
      problem: "Fever - Possible Infection/Sepsis",
      urgency: "urgent",
      steps: [
        {
          id: "s5-1",
          step: 1,
          action: "Take blood cultures",
          timing: "Immediately",
          completed: false,
        },
        {
          id: "s5-2",
          step: 2,
          action: "Start antibiotics immediately (if sepsis suspected)",
          dosage: "Ceftriaxone 80 mg/kg/day (max 2g) IV/IM",
          timing: "Immediately",
          completed: false,
        },
        {
          id: "s5-3",
          step: 3,
          action: "Establish IV access if not already done",
          timing: "Immediately",
          completed: false,
        },
        {
          id: "s5-4",
          step: 4,
          action: "Fluid resuscitation",
          dosage: "Normal saline 20 mL/kg IV bolus",
          timing: "Over 15 minutes",
          completed: false,
        },
        {
          id: "s5-5",
          step: 5,
          action: "Monitor for signs of septic shock",
          timing: "Continuously",
          completed: false,
        },
      ],
    },
  ]);

  const [expandedProblem, setExpandedProblem] = useState<string | null>(
    solutions[0]?.id || null
  );

  const toggleStep = (problemId: string, stepId: string) => {
    setSolutions(
      solutions.map((solution) => {
        if (solution.id === problemId) {
          return {
            ...solution,
            steps: solution.steps.map((step) =>
              step.id === stepId ? { ...step, completed: !step.completed } : step
            ),
          };
        }
        return solution;
      })
    );
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "immediate":
        return "border-l-4 border-l-red-500 bg-red-50";
      case "urgent":
        return "border-l-4 border-l-yellow-500 bg-yellow-50";
      default:
        return "border-l-4 border-l-blue-500 bg-blue-50";
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "immediate":
        return "bg-red-100 text-red-800";
      case "urgent":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const allStepsCompleted = solutions.every((solution) =>
    solution.steps.every((step) => step.completed)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Targeted Solutions</h1>
          <p className="text-slate-600">
            Follow these step-by-step interventions for each identified problem
          </p>
        </div>

        {/* Progress Alert */}
        <Alert className={`mb-8 ${allStepsCompleted ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}>
          <CheckCircle2 className={`h-5 w-5 ${allStepsCompleted ? "text-green-600" : "text-blue-600"}`} />
          <AlertDescription className="ml-2">
            {allStepsCompleted ? (
              <div className="text-green-800">
                <div className="font-bold">All interventions completed!</div>
                <div className="text-sm">Proceed to reassessment in 15 minutes.</div>
              </div>
            ) : (
              <div className="text-blue-800">
                <div className="font-bold">Follow interventions in order</div>
                <div className="text-sm">Check off each step as you complete it.</div>
              </div>
            )}
          </AlertDescription>
        </Alert>

        {/* Solutions */}
        <div className="space-y-4 mb-8">
          {solutions.map((solution) => (
            <Card key={solution.id} className={getUrgencyColor(solution.urgency)}>
              <CardHeader
                className="cursor-pointer hover:bg-slate-100/50 transition-colors"
                onClick={() =>
                  setExpandedProblem(
                    expandedProblem === solution.id ? null : solution.id
                  )
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {solution.urgency === "immediate" && (
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    )}
                    {solution.urgency === "urgent" && (
                      <Clock className="w-6 h-6 text-yellow-600" />
                    )}
                    {solution.urgency === "soon" && (
                      <CheckCircle2 className="w-6 h-6 text-blue-600" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{solution.problem}</CardTitle>
                      <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${getUrgencyBadge(solution.urgency)}`}>
                        {solution.urgency.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {expandedProblem === solution.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-600" />
                  )}
                </div>
              </CardHeader>

              {expandedProblem === solution.id && (
                <CardContent className="pt-0">
                  <div className="space-y-3 border-t pt-4">
                    {solution.steps.map((step) => (
                      <div
                        key={step.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-100/50 transition-colors"
                      >
                        <Checkbox
                          checked={step.completed}
                          onCheckedChange={() =>
                            toggleStep(solution.id, step.id)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className={`font-semibold ${step.completed ? "line-through text-slate-400" : "text-slate-900"}`}>
                                Step {step.step}: {step.action}
                              </div>
                              {step.dosage && (
                                <div className="text-sm text-slate-600 mt-1">
                                  <span className="font-semibold">Dosage:</span> {step.dosage}
                                </div>
                              )}
                              {step.timing && (
                                <div className="text-sm text-slate-600 mt-1">
                                  <span className="font-semibold">Timing:</span> {step.timing}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate("/problem-identification")}
            className="px-6"
          >
            Back to Problems
          </Button>
          <Button
            onClick={() => navigate("/reassessment")}
            disabled={!allStepsCompleted}
            className="px-6 bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            Proceed to Reassessment →
          </Button>
        </div>
      </div>
    </div>
  );
}
