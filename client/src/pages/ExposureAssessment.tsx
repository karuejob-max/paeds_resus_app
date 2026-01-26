import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface ExposureAssessment {
  temperature: number | null;
  skinFindings: string[];
  traumaFindings: string[];
  rashes: string | null;
  edema: string | null;
  dehydrationSigns: string | null;
  hygiene: string | null;
  signs_of_abuse: string | null;
}

export default function ExposureAssessment() {
  const [step, setStep] = useState<"assessment" | "findings" | "recommendations" | "complete">("assessment");
  const [assessment, setAssessment] = useState<ExposureAssessment>({
    temperature: null,
    skinFindings: [],
    traumaFindings: [],
    rashes: null,
    edema: null,
    dehydrationSigns: null,
    hygiene: null,
    signs_of_abuse: null,
  });

  const handleTemperatureInput = (value: number) => {
    setAssessment({ ...assessment, temperature: value });
  };

  const handleSkinFindingsToggle = (finding: string) => {
    setAssessment((prev) => ({
      ...prev,
      skinFindings: prev.skinFindings.includes(finding)
        ? prev.skinFindings.filter((f) => f !== finding)
        : [...prev.skinFindings, finding],
    }));
  };

  const handleTraumaFindingsToggle = (finding: string) => {
    setAssessment((prev) => ({
      ...prev,
      traumaFindings: prev.traumaFindings.includes(finding)
        ? prev.traumaFindings.filter((f) => f !== finding)
        : [...prev.traumaFindings, finding],
    }));
  };

  const handleRashesSelect = (value: string) => {
    setAssessment({ ...assessment, rashes: value });
  };

  const handleEdemaSelect = (value: string) => {
    setAssessment({ ...assessment, edema: value });
  };

  const handleDehydrationSelect = (value: string) => {
    setAssessment({ ...assessment, dehydrationSigns: value });
  };

  const handleHygieneSelect = (value: string) => {
    setAssessment({ ...assessment, hygiene: value });
  };

  const handleAbuseSignsSelect = (value: string) => {
    setAssessment({ ...assessment, signs_of_abuse: value });
  };

  const handleProceedToFindings = () => {
    setStep("findings");
  };

  const getRecommendations = () => {
    const recommendations: string[] = [];

    // Temperature assessment
    if (assessment.temperature !== null) {
      if (assessment.temperature < 36) {
        recommendations.push("🚨 HYPOTHERMIA - Active rewarming needed");
        recommendations.push("✓ Remove wet clothing");
        recommendations.push("✓ Passive external rewarming (blankets)");
        recommendations.push("✓ If core temp less than 30°C: Active core rewarming (ECMO if available)");
      } else if (assessment.temperature > 38.5) {
        recommendations.push("🚨 FEVER - Investigate source");
        recommendations.push("✓ Blood cultures if sepsis suspected");
        recommendations.push("✓ Broad-spectrum antibiotics if indicated");
        recommendations.push("✓ Cooling measures if temp greater than 39°C");
      }
    }

    // Trauma findings
    if (assessment.traumaFindings.length > 0) {
      recommendations.push("⚠️ TRAUMA IDENTIFIED:");
      assessment.traumaFindings.forEach((finding) => {
        recommendations.push(`✓ ${finding} - Assess for internal injuries`);
      });
      recommendations.push("✓ Consider imaging (X-ray, CT, ultrasound)");
      recommendations.push("✓ Trauma team notification");
    }

    // Rashes
    if (assessment.rashes === "petechial") {
      recommendations.push("🚨 PETECHIAL RASH - Possible meningococcemia");
      recommendations.push("✓ Blood cultures immediately");
      recommendations.push("✓ Empiric antibiotics (ceftriaxone 80 mg/kg/day)");
      recommendations.push("✓ Isolate patient");
      recommendations.push("✓ Notify infection control");
    } else if (assessment.rashes === "purpuric") {
      recommendations.push("🚨 PURPURIC RASH - Severe sepsis/meningococcemia");
      recommendations.push("✓ Aggressive fluid resuscitation");
      recommendations.push("✓ Vasopressor support likely needed");
      recommendations.push("✓ ICU admission");
    }

    // Dehydration
    if (assessment.dehydrationSigns === "moderate") {
      recommendations.push("⚠️ MODERATE DEHYDRATION");
      recommendations.push("✓ IV fluid bolus: 20 mL/kg over 15-20 minutes");
      recommendations.push("✓ Reassess after bolus");
    } else if (assessment.dehydrationSigns === "severe") {
      recommendations.push("🚨 SEVERE DEHYDRATION");
      recommendations.push("✓ IV fluid bolus: 20 mL/kg over 15-20 minutes");
      recommendations.push("✓ May need multiple boluses");
      recommendations.push("✓ Monitor for shock");
    }

    // Edema
    if (assessment.edema === "generalized") {
      recommendations.push("⚠️ GENERALIZED EDEMA - Assess for:");
      recommendations.push("✓ Malnutrition/protein deficiency");
      recommendations.push("✓ Liver disease (ascites)");
      recommendations.push("✓ Kidney disease (nephrotic syndrome)");
      recommendations.push("✓ Cardiac failure");
    }

    // Hygiene/neglect
    if (assessment.hygiene === "poor") {
      recommendations.push("⚠️ POOR HYGIENE - Possible neglect");
      recommendations.push("✓ Social work consultation");
      recommendations.push("✓ Document findings thoroughly");
      recommendations.push("✓ Follow mandatory reporting protocols");
    }

    // Abuse signs
    if (assessment.signs_of_abuse === "suspected") {
      recommendations.push("🚨 SIGNS OF ABUSE SUSPECTED");
      recommendations.push("✓ Document all findings with photos (if permitted)");
      recommendations.push("✓ Notify child protection team");
      recommendations.push("✓ Mandatory reporting to authorities");
      recommendations.push("✓ Ensure child safety before discharge");
      recommendations.push("✓ Provide resources for caregivers");
    }

    if (recommendations.length === 0) {
      recommendations.push("✓ Exposure assessment complete - No acute findings");
    }

    return recommendations;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Exposure Assessment (E)</h1>
          <p className="text-gray-600">Pediatric Resuscitation - Full Body Examination</p>
        </div>

        {/* STEP 1: Assessment */}
        {step === "assessment" && (
          <div className="space-y-6">
            {/* Temperature */}
            <Card>
              <CardHeader>
                <CardTitle>Temperature</CardTitle>
                <CardDescription>Core body temperature (°C)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="30"
                    max="42"
                    step="0.1"
                    value={assessment.temperature || ""}
                    onChange={(e) => handleTemperatureInput(parseFloat(e.target.value) || 0)}
                    placeholder="Enter temp"
                    className="flex-1 px-4 py-2 border rounded-lg"
                  />
                  <span className="text-sm text-gray-600">°C</span>
                </div>
                {assessment.temperature !== null && (
                  <div className="mt-3 text-sm">
                    {assessment.temperature < 36 ? (
                      <Badge variant="destructive">Hypothermia</Badge>
                    ) : assessment.temperature > 38.5 ? (
                      <Badge variant="destructive">Fever</Badge>
                    ) : (
                      <Badge variant="outline">Normal</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skin Findings */}
            <Card>
              <CardHeader>
                <CardTitle>Skin Findings</CardTitle>
                <CardDescription>Select all that apply</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {["Pallor", "Cyanosis", "Jaundice", "Flushed", "Clammy"].map((finding) => (
                    <Button
                      key={finding}
                      onClick={() => handleSkinFindingsToggle(finding)}
                      variant={assessment.skinFindings.includes(finding) ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.skinFindings.includes(finding) && "✓ "}
                      {finding}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rashes */}
            <Card>
              <CardHeader>
                <CardTitle>Rash Assessment</CardTitle>
                <CardDescription>Describe any rashes present</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { value: "none", label: "No rash" },
                    { value: "maculopapular", label: "Maculopapular rash" },
                    { value: "petechial", label: "🚨 Petechial rash (does not blanch)" },
                    { value: "purpuric", label: "🚨 Purpuric rash (large purple areas)" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => handleRashesSelect(option.value)}
                      variant={assessment.rashes === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.rashes === option.value && "✓ "}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trauma Findings */}
            <Card>
              <CardHeader>
                <CardTitle>Trauma Findings</CardTitle>
                <CardDescription>Signs of trauma or injury</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {["Bruising", "Lacerations", "Abrasions", "Swelling", "Deformity", "Burns"].map((finding) => (
                    <Button
                      key={finding}
                      onClick={() => handleTraumaFindingsToggle(finding)}
                      variant={assessment.traumaFindings.includes(finding) ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.traumaFindings.includes(finding) && "✓ "}
                      {finding}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Edema */}
            <Card>
              <CardHeader>
                <CardTitle>Edema Assessment</CardTitle>
                <CardDescription>Swelling present?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { value: "none", label: "No edema" },
                    { value: "localized", label: "Localized edema" },
                    { value: "generalized", label: "Generalized edema" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => handleEdemaSelect(option.value)}
                      variant={assessment.edema === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.edema === option.value && "✓ "}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dehydration Signs */}
            <Card>
              <CardHeader>
                <CardTitle>Dehydration Assessment</CardTitle>
                <CardDescription>Signs of fluid loss</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { value: "none", label: "No signs of dehydration" },
                    { value: "mild", label: "Mild (slightly dry mucous membranes)" },
                    { value: "moderate", label: "Moderate (dry mucous membranes, decreased skin turgor)" },
                    { value: "severe", label: "🚨 Severe (poor skin turgor, sunken eyes)" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => handleDehydrationSelect(option.value)}
                      variant={assessment.dehydrationSigns === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.dehydrationSigns === option.value && "✓ "}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hygiene */}
            <Card>
              <CardHeader>
                <CardTitle>General Hygiene</CardTitle>
                <CardDescription>Overall cleanliness and care</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { value: "good", label: "Good hygiene" },
                    { value: "fair", label: "Fair hygiene" },
                    { value: "poor", label: "⚠️ Poor hygiene (possible neglect)" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => handleHygieneSelect(option.value)}
                      variant={assessment.hygiene === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.hygiene === option.value && "✓ "}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Abuse Screening */}
            <Card>
              <CardHeader>
                <CardTitle>Abuse Screening</CardTitle>
                <CardDescription>Signs concerning for abuse or neglect</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { value: "none", label: "No concerning signs" },
                    { value: "possible", label: "⚠️ Possible signs (inconsistent history)" },
                    { value: "suspected", label: "🚨 Suspected abuse (injuries inconsistent with history)" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => handleAbuseSignsSelect(option.value)}
                      variant={assessment.signs_of_abuse === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.signs_of_abuse === option.value && "✓ "}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleProceedToFindings} className="w-full bg-orange-600 hover:bg-orange-700">
              Analyze Findings <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 2: Findings */}
        {step === "findings" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exposure Assessment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Temperature</p>
                    <p className="font-bold">{assessment.temperature}°C</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Dehydration</p>
                    <p className="font-bold capitalize">{assessment.dehydrationSigns}</p>
                  </div>
                </div>

                {assessment.skinFindings.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Skin Findings:</p>
                    <div className="flex flex-wrap gap-2">
                      {assessment.skinFindings.map((finding) => (
                        <Badge key={finding} variant="outline">
                          {finding}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {assessment.traumaFindings.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Trauma Findings:</p>
                    <div className="flex flex-wrap gap-2">
                      {assessment.traumaFindings.map((finding) => (
                        <Badge key={finding} variant="outline">
                          {finding}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {assessment.signs_of_abuse === "suspected" && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-bold text-red-800">🚨 ABUSE SUSPECTED - Mandatory reporting required</p>
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
                <CardDescription>Based on exposure findings</CardDescription>
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
                Complete ABCDE Assessment <ArrowRight className="w-4 h-4 ml-2" />
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
                ABCDE Assessment Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Complete ABCDE pediatric resuscitation assessment finished successfully. All findings documented and recommendations generated.
              </p>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-bold text-blue-900 mb-2">Next Steps:</p>
                <ul className="text-sm text-blue-900 space-y-1">
                  <li>✓ Implement all recommended interventions</li>
                  <li>✓ Reassess patient frequently</li>
                  <li>✓ Document all findings and actions</li>
                  <li>✓ Notify appropriate specialists as needed</li>
                </ul>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Return to Home
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
