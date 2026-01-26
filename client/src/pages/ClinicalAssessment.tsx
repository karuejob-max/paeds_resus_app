import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

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

interface AirwayAssessment {
  responsiveness: "A" | "V" | "P" | "U" | null;
  airwayPatency: "patent" | "at_risk" | "obstructed" | null;
  secretions: string[];
  obstructionType: string | null;
  interventionsPerformed: string[];
  reassessmentResult: "patent" | "at_risk" | "obstructed" | null;
  blsAlsActivated: boolean;
}

export default function ClinicalAssessment() {
  const [step, setStep] = useState<"patient_data" | "airway_assessment" | "recommendations" | "complete">("patient_data");
  const [patientData, setPatientData] = useState<PatientData>({
    age: { years: 0, months: 0 },
    weight: 0,
    calculatedParameters: {
      minUrineOutput: 0,
      normalSystolicBP: 0,
      normalHeartRateMin: 0,
      normalHeartRateMax: 0,
      ettSize: 0,
      suctionCatheterSize: 0,
    },
  });

  const [airwayAssessment, setAirwayAssessment] = useState<AirwayAssessment>({
    responsiveness: null,
    airwayPatency: null,
    secretions: [],
    obstructionType: null,
    interventionsPerformed: [],
    reassessmentResult: null,
    blsAlsActivated: false,
  });

  // Calculate weight from age if not provided
  const calculateWeightFromAge = (years: number, months: number) => {
    const totalMonths = years * 12 + months;
    if (totalMonths < 12) return totalMonths / 2; // 0-1 year: rough estimate
    if (totalMonths < 60) return 2 + (totalMonths - 12) / 6; // 1-5 years
    return 20 + (totalMonths - 60) / 12; // >5 years
  };

  // Calculate all parameters based on weight
  const calculateParameters = (weight: number) => {
    const age = patientData.age.years + patientData.age.months / 12;
    return {
      minUrineOutput: weight * 1, // mL/hr
      normalSystolicBP: 90 + 2 * age,
      normalHeartRateMin: age < 1 ? 100 : age < 3 ? 95 : age < 6 ? 80 : 70,
      normalHeartRateMax: age < 1 ? 160 : age < 3 ? 150 : age < 6 ? 140 : 100,
      ettSize: Math.round((age / 4 + 4) * 10) / 10,
      suctionCatheterSize: Math.round((age / 4 + 4) * 2 * 10) / 10,
    };
  };

  const handlePatientDataSubmit = () => {
    let weight = patientData.weight;
    if (weight === 0) {
      weight = calculateWeightFromAge(patientData.age.years, patientData.age.months);
    }

    const params = calculateParameters(weight);
    setPatientData({
      ...patientData,
      weight,
      calculatedParameters: params,
    });

    setStep("airway_assessment");
  };

  const handleResponsivenessSelect = (value: "A" | "V" | "P" | "U") => {
    setAirwayAssessment({ ...airwayAssessment, responsiveness: value });

    if (value === "U") {
      // Unresponsive - activate BLS/ALS
      setAirwayAssessment((prev) => ({ ...prev, blsAlsActivated: true }));
      setStep("recommendations");
    }
  };

  const handleAirwayPatencySelect = (value: "patent" | "at_risk" | "obstructed") => {
    setAirwayAssessment({ ...airwayAssessment, airwayPatency: value });
  };

  const handleSecretionsToggle = (secretion: string) => {
    setAirwayAssessment((prev) => ({
      ...prev,
      secretions: prev.secretions.includes(secretion)
        ? prev.secretions.filter((s) => s !== secretion)
        : [...prev.secretions, secretion],
    }));
  };

  const handleObstructionTypeSelect = (type: string) => {
    setAirwayAssessment({ ...airwayAssessment, obstructionType: type });
  };

  const handleInterventionToggle = (intervention: string) => {
    setAirwayAssessment((prev) => ({
      ...prev,
      interventionsPerformed: prev.interventionsPerformed.includes(intervention)
        ? prev.interventionsPerformed.filter((i) => i !== intervention)
        : [...prev.interventionsPerformed, intervention],
    }));
  };

  const handleReassessmentSelect = (value: "patent" | "at_risk" | "obstructed") => {
    setAirwayAssessment({ ...airwayAssessment, reassessmentResult: value });

    if (value === "patent") {
      setStep("recommendations");
    }
  };

  const getRecommendations = () => {
    const recommendations: string[] = [];

    if (airwayAssessment.blsAlsActivated) {
      recommendations.push("🚨 BLS/ALS ACTIVATED - Start chest compressions 100-120/min");
      recommendations.push("Provide rescue breathing if trained");
      recommendations.push("Attach monitor/defibrillator");
      recommendations.push("Obtain IV access");
      recommendations.push("Continue A-E assessments during CPR");
      return recommendations;
    }

    if (airwayAssessment.airwayPatency === "at_risk" || airwayAssessment.airwayPatency === "obstructed") {
      if (airwayAssessment.obstructionType === "upper_airway") {
        recommendations.push("✓ Position child upright (sitting forward)");
        recommendations.push(`✓ Nebulize epinephrine 1:1000: 0.05 mL/kg = ${(patientData.weight * 0.05).toFixed(2)} mL`);
        recommendations.push(
          `✓ Give dexamethasone: 0.6 mg/kg = ${(patientData.weight * 0.6).toFixed(1)} mg OR hydrocortisone: 1-2 mg/kg = ${(patientData.weight * 1).toFixed(1)}-${(patientData.weight * 2).toFixed(1)} mg`
        );
        recommendations.push("✓ Keep child calm, avoid agitation");
        recommendations.push("✓ Reassess in 15 minutes");
      } else if (airwayAssessment.obstructionType === "lower_airway") {
        recommendations.push("✓ Provide oxygen 100% FiO2");
        recommendations.push(
          `✓ Nebulize salbutamol (if age >2 years): 0.15 mg/kg = ${(patientData.weight * 0.15).toFixed(2)} mg`
        );
        recommendations.push("✓ Consider ipratropium + oxygen");
        recommendations.push("✓ Reassess in 15 minutes");
      } else if (airwayAssessment.obstructionType === "foreign_body") {
        recommendations.push("⚠️ Do NOT attempt blind finger sweep");
        recommendations.push("✓ Position child upright");
        recommendations.push("✓ Prepare for bronchoscopy");
        recommendations.push("✓ Keep NPO");
        recommendations.push("✓ Notify ENT/anesthesia");
      } else if (airwayAssessment.obstructionType === "swelling") {
        recommendations.push("⚠️ Do NOT agitate child");
        recommendations.push("✓ Keep child upright");
        recommendations.push("✓ Prepare for intubation (consider difficult airway)");
        recommendations.push("✓ Notify anesthesia immediately");
        recommendations.push("✓ Have emergency tracheostomy kit available");
      }

      if (airwayAssessment.secretions.length > 0) {
        recommendations.push(`✓ Suction with catheter: ${patientData.calculatedParameters.suctionCatheterSize} Fr`);
      }
    }

    if (airwayAssessment.airwayPatency === "patent") {
      recommendations.push("✓ Airway patent and not at risk");
      recommendations.push("→ PROCEED TO B (BREATHING ASSESSMENT)");
    }

    return recommendations;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Clinical Assessment</h1>
          <p className="text-gray-600">Pediatric Resuscitation - Real-time Decision Support</p>
        </div>

        {/* STEP 1: Patient Data */}
        {step === "patient_data" && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Patient Data</CardTitle>
              <CardDescription>Enter patient age and weight (or let system calculate)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age-years">Age (Years)</Label>
                  <Input
                    id="age-years"
                    type="number"
                    min="0"
                    max="18"
                    value={patientData.age.years}
                    onChange={(e) => setPatientData({ ...patientData, age: { ...patientData.age, years: parseInt(e.target.value) || 0 } })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="age-months">Age (Months)</Label>
                  <Input
                    id="age-months"
                    type="number"
                    min="0"
                    max="11"
                    value={patientData.age.months}
                    onChange={(e) => setPatientData({ ...patientData, age: { ...patientData.age, months: parseInt(e.target.value) || 0 } })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="weight">Weight (kg) - Optional (system will calculate if blank)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  step="0.1"
                  value={patientData.weight || ""}
                  onChange={(e) => setPatientData({ ...patientData, weight: parseFloat(e.target.value) || 0 })}
                  placeholder="Leave blank to auto-calculate"
                  className="mt-2"
                />
              </div>

              <Button onClick={handlePatientDataSubmit} className="w-full bg-blue-600 hover:bg-blue-700">
                Continue to Airway Assessment <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Airway Assessment */}
        {step === "airway_assessment" && (
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
                    <p className="text-gray-600">ETT Size</p>
                    <p className="font-bold">{patientData.calculatedParameters.ettSize.toFixed(1)} mm</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Min Urine Output</p>
                    <p className="font-bold">{patientData.calculatedParameters.minUrineOutput.toFixed(0)} mL/hr</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Responsiveness Assessment */}
            <Card>
              <CardHeader>
                <CardTitle>Responsiveness (AVPU)</CardTitle>
                <CardDescription>Is the child responsive?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["A", "V", "P", "U"].map((level) => (
                    <Button
                      key={level}
                      onClick={() => handleResponsivenessSelect(level as "A" | "V" | "P" | "U")}
                      variant={airwayAssessment.responsiveness === level ? "default" : "outline"}
                      className={`h-24 flex flex-col items-center justify-center ${
                        level === "U" && airwayAssessment.responsiveness === "U" ? "bg-red-600 hover:bg-red-700" : ""
                      }`}
                    >
                      <span className="text-2xl font-bold">{level}</span>
                      <span className="text-xs mt-1">
                        {level === "A" && "Alert"}
                        {level === "V" && "Verbal"}
                        {level === "P" && "Pain"}
                        {level === "U" && "Unresponsive"}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* If not unresponsive, continue with airway patency */}
            {airwayAssessment.responsiveness !== "U" && airwayAssessment.responsiveness !== null && (
              <>
                {/* Airway Patency */}
                <Card>
                  <CardHeader>
                    <CardTitle>Airway Patency</CardTitle>
                    <CardDescription>Assess airway patency - Is the airway open?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {[
                        { value: "patent", label: "✓ Patent - Normal sounds, can speak/cry" },
                        { value: "at_risk", label: "⚠️ At Risk - Stridor, grunting, snoring" },
                        { value: "obstructed", label: "🚨 Obstructed - Silent, unable to vocalize" },
                      ].map((option) => (
                        <Button
                          key={option.value}
                          onClick={() => handleAirwayPatencySelect(option.value as "patent" | "at_risk" | "obstructed")}
                          variant={airwayAssessment.airwayPatency === option.value ? "default" : "outline"}
                          className="w-full justify-start h-auto py-3"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Secretions */}
                {airwayAssessment.airwayPatency && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Secretions</CardTitle>
                      <CardDescription>Are secretions present in the airway?</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {["No secretions", "Saliva only", "Clear secretions", "Blood-tinged", "Blood", "Vomitus"].map((secretion) => (
                          <Button
                            key={secretion}
                            onClick={() => handleSecretionsToggle(secretion)}
                            variant={airwayAssessment.secretions.includes(secretion) ? "default" : "outline"}
                            className="w-full justify-start"
                          >
                            {airwayAssessment.secretions.includes(secretion) && "✓ "}
                            {secretion}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Obstruction Type (if at risk or obstructed) */}
                {(airwayAssessment.airwayPatency === "at_risk" || airwayAssessment.airwayPatency === "obstructed") && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Obstruction Type</CardTitle>
                      <CardDescription>What type of obstruction is present?</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[
                          { value: "upper_airway", label: "Upper Airway (Stridor)" },
                          { value: "lower_airway", label: "Lower Airway (Wheeze)" },
                          { value: "foreign_body", label: "Foreign Body" },
                          { value: "swelling", label: "Swelling/Edema" },
                          { value: "secretions", label: "Secretions/Blood" },
                        ].map((option) => (
                          <Button
                            key={option.value}
                            onClick={() => handleObstructionTypeSelect(option.value)}
                            variant={airwayAssessment.obstructionType === option.value ? "default" : "outline"}
                            className="w-full justify-start"
                          >
                            {airwayAssessment.obstructionType === option.value && "✓ "}
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Interventions Performed */}
                {airwayAssessment.obstructionType && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Interventions Performed</CardTitle>
                      <CardDescription>What actions have been taken?</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[
                          "Head tilt-chin lift",
                          "Jaw thrust",
                          "Suction",
                          "OPA (Oral Pharyngeal Airway)",
                          "NPA (Nasopharyngeal Airway)",
                          "Oxygen 100%",
                          "Epinephrine nebulized",
                          "Steroid given",
                        ].map((intervention) => (
                          <Button
                            key={intervention}
                            onClick={() => handleInterventionToggle(intervention)}
                            variant={airwayAssessment.interventionsPerformed.includes(intervention) ? "default" : "outline"}
                            className="w-full justify-start"
                          >
                            {airwayAssessment.interventionsPerformed.includes(intervention) && "✓ "}
                            {intervention}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reassessment */}
                {airwayAssessment.interventionsPerformed.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Reassessment</CardTitle>
                      <CardDescription>After intervention, is the airway now patent?</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[
                          { value: "patent", label: "✓ Patent and not at risk" },
                          { value: "at_risk", label: "⚠️ Partially improved, still at risk" },
                          { value: "obstructed", label: "🚨 Still obstructed" },
                        ].map((option) => (
                          <Button
                            key={option.value}
                            onClick={() => handleReassessmentSelect(option.value as "patent" | "at_risk" | "obstructed")}
                            variant={airwayAssessment.reassessmentResult === option.value ? "default" : "outline"}
                            className="w-full justify-start"
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* STEP 3: Recommendations */}
        {step === "recommendations" && (
          <div className="space-y-6">
            {airwayAssessment.blsAlsActivated && (
              <Alert className="bg-red-50 border-red-300">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 font-bold">
                  🚨 BLS/ALS ACTIVATED - Child is unresponsive
                </AlertDescription>
              </Alert>
            )}

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
              <Button onClick={() => setStep("airway_assessment")} variant="outline" className="flex-1">
                Back to Assessment
              </Button>
              <Button onClick={() => setStep("complete")} className="flex-1 bg-green-600 hover:bg-green-700">
                Proceed to B (Breathing) <ArrowRight className="w-4 h-4 ml-2" />
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
                Airway Assessment Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Airway assessment completed successfully. Proceed to Breathing (B) assessment when ready.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Continue to B (Breathing Assessment)
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
