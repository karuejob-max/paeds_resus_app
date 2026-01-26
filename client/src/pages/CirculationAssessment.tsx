import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface PatientData {
  age: { years: number; months: number };
  weight: number;
  calculatedParameters: {
    normalSystolicBP: number;
    normalHeartRateMin: number;
    normalHeartRateMax: number;
  };
}

interface CirculationAssessment {
  heartRate: number | null;
  systolicBP: number | null;
  diastolicBP: number | null;
  capillaryRefill: number | null;
  skinPerfusion: string | null;
  pulses: string | null;
  urinOutput: string | null;
  shockType: string | null;
  interventionsPerformed: string[];
}

export default function CirculationAssessment() {
  const [step, setStep] = useState<"assessment" | "findings" | "recommendations" | "complete">("assessment");
  const [patientData] = useState<PatientData>({
    age: { years: 2, months: 0 },
    weight: 12,
    calculatedParameters: {
      normalSystolicBP: 94,
      normalHeartRateMin: 95,
      normalHeartRateMax: 150,
    },
  });

  const [assessment, setAssessment] = useState<CirculationAssessment>({
    heartRate: null,
    systolicBP: null,
    diastolicBP: null,
    capillaryRefill: null,
    skinPerfusion: null,
    pulses: null,
    urinOutput: null,
    shockType: null,
    interventionsPerformed: [],
  });

  const handleHeartRateInput = (value: number) => {
    setAssessment({ ...assessment, heartRate: value });
  };

  const handleBPInput = (systolic: number, diastolic: number) => {
    setAssessment({ ...assessment, systolicBP: systolic, diastolicBP: diastolic });
  };

  const handleCapillaryRefillInput = (value: number) => {
    setAssessment({ ...assessment, capillaryRefill: value });
  };

  const handleSkinPerfusionSelect = (value: string) => {
    setAssessment({ ...assessment, skinPerfusion: value });
  };

  const handlePulsesSelect = (value: string) => {
    setAssessment({ ...assessment, pulses: value });
  };

  const handleUrineOutputSelect = (value: string) => {
    setAssessment({ ...assessment, urinOutput: value });
  };

  // Determine shock type
  const determineShockType = () => {
    let shock = null;

    // Hypovolemic shock
    if (assessment.heartRate && assessment.heartRate > patientData.calculatedParameters.normalHeartRateMax + 20) {
      if (assessment.capillaryRefill && assessment.capillaryRefill > 2) {
        shock = "hypovolemic";
      }
    }

    // Distributive shock (septic)
    if (assessment.skinPerfusion === "warm_flushed") {
      shock = "distributive";
    }

    // Cardiogenic shock
    if (assessment.pulses === "weak") {
      shock = "cardiogenic";
    }

    // Obstructive shock
    if (assessment.pulses === "absent_unilateral") {
      shock = "obstructive";
    }

    setAssessment((prev) => ({ ...prev, shockType: shock }));
  };

  const handleProceedToFindings = () => {
    determineShockType();
    setStep("findings");
  };

  const getRecommendations = () => {
    const recommendations: string[] = [];

    // No shock
    if (!assessment.shockType) {
      recommendations.push("✓ Circulation adequate - Continue monitoring");
      return recommendations;
    }

    // Hypovolemic Shock
    if (assessment.shockType === "hypovolemic") {
      recommendations.push("🚨 HYPOVOLEMIC SHOCK DETECTED");
      recommendations.push("✓ Establish IV access (2 large bore IVs if possible)");
      recommendations.push(`✓ Fluid bolus: 20 mL/kg normal saline = ${(patientData.weight * 20).toFixed(0)} mL`);
      recommendations.push("✓ Rapid infusion over 15-20 minutes");
      recommendations.push("✓ Reassess after bolus");
      recommendations.push("✓ If no improvement → Second bolus or consider vasopressors");
      recommendations.push("✓ Investigate source of bleeding/fluid loss");
    }

    // Distributive Shock (Septic)
    if (assessment.shockType === "distributive") {
      recommendations.push("🚨 DISTRIBUTIVE (SEPTIC) SHOCK SUSPECTED");
      recommendations.push("✓ Establish IV access");
      recommendations.push(`✓ Fluid bolus: 20 mL/kg normal saline = ${(patientData.weight * 20).toFixed(0)} mL`);
      recommendations.push("✓ Blood cultures before antibiotics");
      recommendations.push("✓ Broad-spectrum antibiotics (within 1 hour)");
      recommendations.push("✓ If hypotensive after fluids → Vasopressors (epinephrine)");
      recommendations.push("✓ Source control (identify and treat infection)");
    }

    // Cardiogenic Shock
    if (assessment.shockType === "cardiogenic") {
      recommendations.push("🚨 CARDIOGENIC SHOCK DETECTED");
      recommendations.push("✓ Establish IV access");
      recommendations.push("✓ Cautious fluid administration (may worsen pulmonary edema)");
      recommendations.push("✓ Inotropes (dobutamine or milrinone)");
      recommendations.push("✓ ECG and cardiac enzymes");
      recommendations.push("✓ Echocardiography");
      recommendations.push("✓ Notify cardiology");
    }

    // Obstructive Shock
    if (assessment.shockType === "obstructive") {
      recommendations.push("🚨 OBSTRUCTIVE SHOCK DETECTED");
      recommendations.push("✓ Establish IV access");
      recommendations.push("✓ Fluid bolus cautiously");
      recommendations.push("✓ Investigate cause: tension pneumothorax, pericardial tamponade, PE");
      recommendations.push("✓ If tension pneumothorax → Needle decompression");
      recommendations.push("✓ If tamponade → Pericardiocentesis");
      recommendations.push("✓ Notify surgery/ICU");
    }

    return recommendations;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Circulation Assessment (C)</h1>
          <p className="text-gray-600">Pediatric Resuscitation - Real-time Decision Support</p>
        </div>

        {/* STEP 1: Assessment */}
        {step === "assessment" && (
          <div className="space-y-6">
            {/* Patient Summary */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Age</p>
                    <p className="font-bold">{patientData.age.years}y {patientData.age.months}m</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Weight</p>
                    <p className="font-bold">{patientData.weight.toFixed(1)} kg</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Normal HR</p>
                    <p className="font-bold">{patientData.calculatedParameters.normalHeartRateMin}-{patientData.calculatedParameters.normalHeartRateMax}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Normal SBP</p>
                    <p className="font-bold">{patientData.calculatedParameters.normalSystolicBP} mmHg</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Cap Refill</p>
                    <p className="font-bold">Less than 2 sec</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Min Urine Output</p>
                    <p className="font-bold">{patientData.weight} mL/hr</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Heart Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Heart Rate</CardTitle>
                <CardDescription>Beats per minute (bpm)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={assessment.heartRate || ""}
                    onChange={(e) => handleHeartRateInput(parseInt(e.target.value) || 0)}
                    placeholder="Enter HR"
                    className="flex-1 px-4 py-2 border rounded-lg"
                  />
                  <span className="text-sm text-gray-600">bpm</span>
                </div>
                {assessment.heartRate !== null && (
                  <div className="mt-3 text-sm">
                    {assessment.heartRate < patientData.calculatedParameters.normalHeartRateMin - 20 ? (
                      <Badge variant="destructive">Bradycardia - Concerning</Badge>
                    ) : assessment.heartRate > patientData.calculatedParameters.normalHeartRateMax + 20 ? (
                      <Badge variant="destructive">Severe Tachycardia</Badge>
                    ) : assessment.heartRate > patientData.calculatedParameters.normalHeartRateMax ? (
                      <Badge variant="outline">Tachycardia</Badge>
                    ) : (
                      <Badge variant="outline">Normal</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Blood Pressure */}
            <Card>
              <CardHeader>
                <CardTitle>Blood Pressure</CardTitle>
                <CardDescription>Systolic / Diastolic (mmHg)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={assessment.systolicBP || ""}
                    onChange={(e) => handleBPInput(parseInt(e.target.value) || 0, assessment.diastolicBP || 0)}
                    placeholder="Systolic"
                    className="flex-1 px-4 py-2 border rounded-lg"
                  />
                  <span className="text-gray-400">/</span>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={assessment.diastolicBP || ""}
                    onChange={(e) => handleBPInput(assessment.systolicBP || 0, parseInt(e.target.value) || 0)}
                    placeholder="Diastolic"
                    className="flex-1 px-4 py-2 border rounded-lg"
                  />
                  <span className="text-sm text-gray-600">mmHg</span>
                </div>
                {assessment.systolicBP !== null && (
                  <div className="mt-3 text-sm">
                    {assessment.systolicBP < patientData.calculatedParameters.normalSystolicBP - 10 ? (
                      <Badge variant="destructive">Hypotension</Badge>
                    ) : assessment.systolicBP > patientData.calculatedParameters.normalSystolicBP + 20 ? (
                      <Badge variant="outline">Hypertension</Badge>
                    ) : (
                      <Badge variant="outline">Normal</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Capillary Refill */}
            <Card>
              <CardHeader>
                <CardTitle>Capillary Refill Time</CardTitle>
                <CardDescription>Press fingernail for 5 seconds, release and count refill time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={assessment.capillaryRefill || ""}
                    onChange={(e) => handleCapillaryRefillInput(parseFloat(e.target.value) || 0)}
                    placeholder="Enter time"
                    className="flex-1 px-4 py-2 border rounded-lg"
                  />
                  <span className="text-sm text-gray-600">seconds</span>
                </div>
                {assessment.capillaryRefill !== null && (
                  <div className="mt-3 text-sm">
                    {assessment.capillaryRefill > 2 ? (
                      <Badge variant="destructive">Delayed - Shock likely</Badge>
                    ) : (
                      <Badge variant="outline">Normal</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skin Perfusion */}
            <Card>
              <CardHeader>
                <CardTitle>Skin Perfusion</CardTitle>
                <CardDescription>Assess skin color and temperature</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { value: "pink_warm", label: "Pink, warm, dry" },
                    { value: "pale_cool", label: "Pale, cool, clammy" },
                    { value: "mottled", label: "Mottled" },
                    { value: "warm_flushed", label: "Warm, flushed (septic appearance)" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => handleSkinPerfusionSelect(option.value)}
                      variant={assessment.skinPerfusion === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.skinPerfusion === option.value && "✓ "}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pulses */}
            <Card>
              <CardHeader>
                <CardTitle>Pulses</CardTitle>
                <CardDescription>Assess central and peripheral pulses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { value: "strong_bilateral", label: "Strong, equal bilateral" },
                    { value: "weak", label: "Weak (all pulses)" },
                    { value: "absent", label: "Absent (no pulse)" },
                    { value: "absent_unilateral", label: "Absent unilateral (possible obstruction)" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => handlePulsesSelect(option.value)}
                      variant={assessment.pulses === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.pulses === option.value && "✓ "}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Urine Output */}
            <Card>
              <CardHeader>
                <CardTitle>Urine Output</CardTitle>
                <CardDescription>Assess urine output as marker of perfusion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { value: "adequate", label: `Adequate (${patientData.weight} mL/hr)` },
                    { value: "decreased", label: "Decreased (less than expected)" },
                    { value: "absent", label: "Absent" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => handleUrineOutputSelect(option.value)}
                      variant={assessment.urinOutput === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.urinOutput === option.value && "✓ "}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleProceedToFindings} className="w-full bg-blue-600 hover:bg-blue-700">
              Analyze Findings <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 2: Findings */}
        {step === "findings" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Findings Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">HR</p>
                    <p className="font-bold">{assessment.heartRate} bpm</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">BP</p>
                    <p className="font-bold">{assessment.systolicBP}/{assessment.diastolicBP} mmHg</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Cap Refill</p>
                    <p className="font-bold">{assessment.capillaryRefill} sec</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Perfusion</p>
                    <p className="font-bold capitalize">{assessment.skinPerfusion?.replace(/_/g, " ")}</p>
                  </div>
                </div>

                {assessment.shockType && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-bold text-red-800">
                      🚨 {assessment.shockType.toUpperCase()} SHOCK DETECTED
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={() => setStep("assessment")} variant="outline" className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep("recommendations")} className="flex-1 bg-green-600 hover:bg-green-700">
                View Recommendations <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Recommendations */}
        {step === "recommendations" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Clinical Recommendations
                </CardTitle>
                <CardDescription>Based on AHA ECC Guidelines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getRecommendations().map((rec, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-lg">{rec.substring(0, 1)}</span>
                      <span className="text-sm text-gray-700">{rec.substring(1)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={() => setStep("findings")} variant="outline" className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep("complete")} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Proceed to D (Disability) <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Complete */}
        {step === "complete" && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-6 h-6" />
                Circulation Assessment Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Circulation assessment completed successfully. Proceed to Disability (D) assessment when ready.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Continue to D (Disability Assessment)
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
