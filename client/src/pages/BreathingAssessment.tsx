import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

interface PatientData {
  age: { years: number; months: number };
  weight: number;
  calculatedParameters: {
    minUrineOutput: number;
    normalSystolicBP: number;
    normalHeartRateMin: number;
    normalHeartRateMax: number;
    ettSize: number;
    suctionCatheterSize: number;
  };
}

interface BreathingAssessment {
  respiratoryRate: number | null;
  spo2: number | null;
  breathingPattern: string | null;
  abnormalSounds: string[];
  workOfBreathing: string | null;
  chestMovement: string | null;
  differentials: string[];
  interventionsPerformed: string[];
  reassessmentResult: string | null;
}

export default function BreathingAssessment() {
  const [step, setStep] = useState<"assessment" | "findings" | "recommendations" | "complete">("assessment");
  const [patientData] = useState<PatientData>({
    age: { years: 2, months: 0 },
    weight: 12,
    calculatedParameters: {
      minUrineOutput: 12,
      normalSystolicBP: 94,
      normalHeartRateMin: 95,
      normalHeartRateMax: 150,
      ettSize: 4.5,
      suctionCatheterSize: 9,
    },
  });

  const [assessment, setAssessment] = useState<BreathingAssessment>({
    respiratoryRate: null,
    spo2: null,
    breathingPattern: null,
    abnormalSounds: [],
    workOfBreathing: null,
    chestMovement: null,
    differentials: [],
    interventionsPerformed: [],
    reassessmentResult: null,
  });

  const handleRRInput = (value: number) => {
    setAssessment({ ...assessment, respiratoryRate: value });
  };

  const handleSpO2Input = (value: number) => {
    setAssessment({ ...assessment, spo2: value });
  };

  const handleBreathingPatternSelect = (pattern: string) => {
    setAssessment({ ...assessment, breathingPattern: pattern });
  };

  const handleAbnormalSoundsToggle = (sound: string) => {
    setAssessment((prev) => ({
      ...prev,
      abnormalSounds: prev.abnormalSounds.includes(sound)
        ? prev.abnormalSounds.filter((s) => s !== sound)
        : [...prev.abnormalSounds, sound],
    }));
  };

  const handleWorkOfBreathingSelect = (wob: string) => {
    setAssessment({ ...assessment, workOfBreathing: wob });
  };

  const handleChestMovementSelect = (movement: string) => {
    setAssessment({ ...assessment, chestMovement: movement });
  };

  // Determine differentials based on findings
  const determineDifferentials = () => {
    const diffs: string[] = [];

    if (assessment.abnormalSounds.includes("wheeze")) {
      diffs.push("Asthma/Reactive airway disease");
      diffs.push("Bronchiolitis (if <2 years)");
      diffs.push("Foreign body aspiration");
    }

    if (assessment.abnormalSounds.includes("crackles")) {
      diffs.push("Pneumonia");
      diffs.push("Pulmonary edema");
      diffs.push("Bronchiolitis");
    }

    if (assessment.abnormalSounds.includes("stridor")) {
      diffs.push("Croup");
      diffs.push("Epiglottitis");
      diffs.push("Foreign body");
    }

    if (assessment.spo2 !== null && assessment.spo2 < 90) {
      diffs.push("Severe hypoxemia - consider respiratory failure");
    }

    if (assessment.respiratoryRate !== null) {
      const normalMin = patientData.calculatedParameters.normalHeartRateMin;
      const normalMax = patientData.calculatedParameters.normalHeartRateMax;
      if (assessment.respiratoryRate > normalMax + 10) {
        diffs.push("Tachypnea - assess for distress");
      }
      if (assessment.respiratoryRate < normalMin - 10) {
        diffs.push("Bradypnea - concerning sign, may indicate fatigue");
      }
    }

    if (assessment.workOfBreathing === "severe") {
      diffs.push("Respiratory distress - consider respiratory failure");
    }

    setAssessment((prev) => ({ ...prev, differentials: Array.from(new Set(diffs)) }));
  };

  const handleProceedToFindings = () => {
    determineDifferentials();
    setStep("findings");
  };

  const getRecommendations = () => {
    const recommendations: string[] = [];

    // Hypoxemia
    if (assessment.spo2 !== null && assessment.spo2 < 94) {
      recommendations.push(`🚨 SpO2 ${assessment.spo2}% - PROVIDE OXYGEN`);
      if (assessment.spo2 < 90) {
        recommendations.push("🚨 SEVERE HYPOXEMIA - Consider respiratory failure, prepare for intubation");
      }
    }

    // Tachypnea
    if (assessment.respiratoryRate !== null && assessment.respiratoryRate > 50) {
      recommendations.push("⚠️ Severe tachypnea - Assess for respiratory distress");
    }

    // Severe work of breathing
    if (assessment.workOfBreathing === "severe") {
      recommendations.push("🚨 SEVERE WORK OF BREATHING - Respiratory failure likely");
      recommendations.push("✓ Prepare for BVM ventilation at 100% FiO2");
      recommendations.push("✓ Prepare for intubation");
      recommendations.push("✓ Notify anesthesia");
    }

    // Asthma/wheeze
    if (assessment.abnormalSounds.includes("wheeze")) {
      recommendations.push("✓ Provide oxygen 100% FiO2");
      if (patientData.age.years >= 2) {
        recommendations.push(`✓ Nebulize salbutamol: ${(patientData.weight * 0.15).toFixed(2)} mg`);
      }
      recommendations.push("✓ Consider IV MgSO4 if severe");
    }

    // Pneumonia/crackles
    if (assessment.abnormalSounds.includes("crackles")) {
      recommendations.push("✓ Provide oxygen to maintain SpO2 94%+");
      recommendations.push("✓ Consider antibiotics (if bacterial pneumonia suspected)");
      recommendations.push("✓ Assess for signs of sepsis");
    }

    // Croup/stridor
    if (assessment.abnormalSounds.includes("stridor")) {
      recommendations.push("✓ Provide oxygen");
      recommendations.push(`✓ Nebulize epinephrine: ${(patientData.weight * 0.05).toFixed(2)} mL`);
      recommendations.push(`✓ Give dexamethasone: ${(patientData.weight * 0.6).toFixed(1)} mg`);
    }

    return recommendations;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Breathing Assessment (B)</h1>
          <p className="text-gray-600">Pediatric Resuscitation - Real-time Decision Support</p>
        </div>

        {/* STEP 1: Assessment */}
        {step === "assessment" && (
          <div className="space-y-6">
            {/* Patient Summary */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Age</p>
                    <p className="font-bold">{patientData.age.years}y {patientData.age.months}m</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Weight</p>
                    <p className="font-bold">{patientData.weight.toFixed(1)} kg</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Normal RR</p>
                    <p className="font-bold">20-40 breaths/min</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Target SpO2</p>
                    <p className="font-bold">94%+</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Respiratory Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Respiratory Rate</CardTitle>
                <CardDescription>Count breaths per minute (RR)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={assessment.respiratoryRate || ""}
                    onChange={(e) => handleRRInput(parseInt(e.target.value) || 0)}
                    placeholder="Enter RR"
                    className="flex-1 px-4 py-2 border rounded-lg"
                  />
                  <span className="text-sm text-gray-600">breaths/min</span>
                </div>
                {assessment.respiratoryRate !== null && (
                  <div className="mt-3 text-sm">
                    {assessment.respiratoryRate < 20 ? (
                      <Badge variant="destructive">Bradypnea - Concerning</Badge>
                    ) : assessment.respiratoryRate > 50 ? (
                      <Badge variant="destructive">Severe Tachypnea</Badge>
                    ) : assessment.respiratoryRate > 40 ? (
                      <Badge variant="outline">Tachypnea</Badge>
                    ) : (
                      <Badge variant="outline">Normal</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SpO2 */}
            <Card>
              <CardHeader>
                <CardTitle>Oxygen Saturation (SpO2)</CardTitle>
                <CardDescription>Pulse oximetry reading</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={assessment.spo2 || ""}
                    onChange={(e) => handleSpO2Input(parseInt(e.target.value) || 0)}
                    placeholder="Enter SpO2"
                    className="flex-1 px-4 py-2 border rounded-lg"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
                {assessment.spo2 !== null && (
                  <div className="mt-3 text-sm">
                    {assessment.spo2 < 90 ? (
                      <Badge variant="destructive">🚨 Severe Hypoxemia</Badge>
                    ) : assessment.spo2 < 94 ? (
                      <Badge variant="outline">⚠️ Hypoxemia</Badge>
                    ) : (
                      <Badge variant="outline">✓ Acceptable</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Breathing Pattern */}
            <Card>
              <CardHeader>
                <CardTitle>Breathing Pattern</CardTitle>
                <CardDescription>Describe the pattern of breathing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { value: "normal", label: "Regular and normal depth" },
                    { value: "shallow", label: "Shallow breathing" },
                    { value: "deep", label: "Deep breathing" },
                    { value: "irregular", label: "Irregular (Cheyne-Stokes, Biots)" },
                    { value: "gasping", label: "Gasping (agonal)" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => handleBreathingPatternSelect(option.value)}
                      variant={assessment.breathingPattern === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.breathingPattern === option.value && "✓ "}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Abnormal Sounds */}
            <Card>
              <CardHeader>
                <CardTitle>Abnormal Sounds (Auscultation)</CardTitle>
                <CardDescription>What do you hear with stethoscope?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {["Wheeze", "Crackles", "Stridor", "Grunting", "Decreased air entry", "Silent chest"].map((sound) => (
                    <Button
                      key={sound}
                      onClick={() => handleAbnormalSoundsToggle(sound)}
                      variant={assessment.abnormalSounds.includes(sound) ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.abnormalSounds.includes(sound) && "✓ "}
                      {sound}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Work of Breathing */}
            <Card>
              <CardHeader>
                <CardTitle>Work of Breathing</CardTitle>
                <CardDescription>Assess effort required to breathe</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { value: "normal", label: "Normal - No retractions or nasal flaring" },
                    { value: "mild", label: "Mild - Minimal retractions" },
                    { value: "moderate", label: "Moderate - Visible retractions, nasal flaring" },
                    { value: "severe", label: "🚨 Severe - Marked retractions, accessory muscles" },
                  ].map((option: any) => (
                    <Button
                      key={option.value}
                      onClick={() => handleWorkOfBreathingSelect(option.value)}
                      variant={assessment.workOfBreathing === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.workOfBreathing === option.value && "✓ "}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chest Movement */}
            <Card>
              <CardHeader>
                <CardTitle>Chest Movement</CardTitle>
                <CardDescription>Observe chest wall movement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { value: "equal", label: "Equal bilateral movement" },
                    { value: "unequal", label: "Unequal movement (possible pneumothorax)" },
                    { value: "minimal", label: "Minimal movement (possible tension pneumothorax)" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => handleChestMovementSelect(option.value)}
                      variant={assessment.chestMovement === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.chestMovement === option.value && "✓ "}
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

        {/* STEP 2: Findings & Differentials */}
        {step === "findings" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Findings Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">RR</p>
                    <p className="font-bold">{assessment.respiratoryRate} breaths/min</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">SpO2</p>
                    <p className="font-bold">{assessment.spo2}%</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Pattern</p>
                    <p className="font-bold capitalize">{assessment.breathingPattern}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Work of Breathing</p>
                    <p className="font-bold capitalize">{assessment.workOfBreathing}</p>
                  </div>
                </div>

                {assessment.abnormalSounds.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Abnormal Sounds:</p>
                    <div className="flex flex-wrap gap-2">
                      {assessment.abnormalSounds.map((sound) => (
                        <Badge key={sound} variant="outline">
                          {sound}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {assessment.differentials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Possible Differentials</CardTitle>
                  <CardDescription>Based on clinical findings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {assessment.differentials.map((diff, idx) => (
                      <div key={idx} className="flex gap-2 p-2 bg-yellow-50 rounded">
                        <span>•</span>
                        <span className="text-sm">{diff}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                Proceed to C (Circulation) <ArrowRight className="w-4 h-4 ml-2" />
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
                Breathing Assessment Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Breathing assessment completed successfully. Proceed to Circulation (C) assessment when ready.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Continue to C (Circulation Assessment)
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
