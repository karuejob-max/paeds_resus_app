import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface DisabilityAssessment {
  avpu: string | null;
  pupilSize: string | null;
  pupilReactivity: string | null;
  motorResponse: string | null;
  verbalResponse: string | null;
  gcsScore: number;
  seizureActivity: string | null;
  posturing: string | null;
  focusedNeuro: string | null;
}

export default function DisabilityAssessment() {
  const [step, setStep] = useState<"assessment" | "findings" | "recommendations" | "complete">("assessment");
  const [assessment, setAssessment] = useState<DisabilityAssessment>({
    avpu: null,
    pupilSize: null,
    pupilReactivity: null,
    motorResponse: null,
    verbalResponse: null,
    gcsScore: 15,
    seizureActivity: null,
    posturing: null,
    focusedNeuro: null,
  });

  const handleAVPUSelect = (value: string) => {
    setAssessment({ ...assessment, avpu: value });
  };

  const handlePupilSizeSelect = (value: string) => {
    setAssessment({ ...assessment, pupilSize: value });
  };

  const handlePupilReactivitySelect = (value: string) => {
    setAssessment({ ...assessment, pupilReactivity: value });
  };

  const handleMotorResponseSelect = (value: string) => {
    setAssessment({ ...assessment, motorResponse: value });
  };

  const handleVerbalResponseSelect = (value: string) => {
    setAssessment({ ...assessment, verbalResponse: value });
  };

  const handleSeizureActivitySelect = (value: string) => {
    setAssessment({ ...assessment, seizureActivity: value });
  };

  const handlePosturingSelect = (value: string) => {
    setAssessment({ ...assessment, posturing: value });
  };

  const calculateGCS = () => {
    let gcs = 3; // Minimum baseline

    // Eye Opening
    if (assessment.avpu === "alert") gcs += 4;
    else if (assessment.avpu === "verbal") gcs += 3;
    else if (assessment.avpu === "pain") gcs += 2;
    else gcs += 1;

    // Verbal Response
    if (assessment.verbalResponse === "oriented") gcs += 5;
    else if (assessment.verbalResponse === "confused") gcs += 4;
    else if (assessment.verbalResponse === "inappropriate") gcs += 3;
    else if (assessment.verbalResponse === "incomprehensible") gcs += 2;
    else gcs += 1;

    // Motor Response
    if (assessment.motorResponse === "obeys") gcs += 6;
    else if (assessment.motorResponse === "localizes") gcs += 5;
    else if (assessment.motorResponse === "withdraws") gcs += 4;
    else if (assessment.motorResponse === "abnormal_flexion") gcs += 3;
    else if (assessment.motorResponse === "abnormal_extension") gcs += 2;
    else gcs += 1;

    return Math.min(gcs, 15);
  };

  const handleProceedToFindings = () => {
    const gcs = calculateGCS();
    setAssessment((prev) => ({ ...prev, gcsScore: gcs }));
    setStep("findings");
  };

  const getRecommendations = () => {
    const recommendations: string[] = [];
    const gcs = assessment.gcsScore;

    // GCS-based recommendations
    if (gcs <= 8) {
      recommendations.push("🚨 SEVERE ALTERED MENTAL STATUS (GCS 8 or less)");
      recommendations.push("✓ Prepare for intubation - protect airway");
      recommendations.push("✓ Obtain head CT (if stable)");
      recommendations.push("✓ Check blood glucose immediately");
      recommendations.push("✓ Assess for signs of increased intracranial pressure");
      recommendations.push("✓ Consider osmotic therapy if cerebral edema");
    } else if (gcs <= 12) {
      recommendations.push("⚠️ MODERATE ALTERED MENTAL STATUS (GCS 9-12)");
      recommendations.push("✓ Monitor closely for deterioration");
      recommendations.push("✓ Prepare for possible intubation");
      recommendations.push("✓ Obtain head CT");
      recommendations.push("✓ Assess for reversible causes (hypoglycemia, poisoning)");
    } else if (gcs < 15) {
      recommendations.push("⚠️ MILD ALTERED MENTAL STATUS (GCS 13-14)");
      recommendations.push("✓ Continue monitoring");
      recommendations.push("✓ Investigate cause");
      recommendations.push("✓ Consider head CT if trauma or concerning findings");
    } else {
      recommendations.push("✓ Alert and oriented - GCS 15");
    }

    // Pupil assessment
    if (assessment.pupilSize === "dilated" && assessment.pupilReactivity === "fixed") {
      recommendations.push("🚨 FIXED DILATED PUPILS - Possible severe brain injury");
      recommendations.push("✓ Prepare for emergency neurosurgery consultation");
    } else if (assessment.pupilSize === "pinpoint" && assessment.pupilReactivity === "fixed") {
      recommendations.push("🚨 PINPOINT PUPILS - Possible pontine hemorrhage or opioid overdose");
      recommendations.push("✓ If opioid suspected: Consider naloxone (Narcan)");
    } else if (assessment.pupilReactivity === "sluggish") {
      recommendations.push("⚠️ Sluggish pupil reactivity - Monitor for deterioration");
    }

    // Seizure activity
    if (assessment.seizureActivity === "active") {
      recommendations.push("🚨 ACTIVE SEIZURE - TREAT IMMEDIATELY");
      recommendations.push("✓ Place in recovery position");
      recommendations.push("✓ Lorazepam 0.1 mg/kg IV (max 4 mg) or");
      recommendations.push("✓ Midazolam 0.2 mg/kg IM (max 10 mg)");
      recommendations.push("✓ Have airway equipment ready");
    } else if (assessment.seizureActivity === "post_ictal") {
      recommendations.push("✓ Post-ictal state - Monitor for repeat seizures");
      recommendations.push("✓ Start seizure prophylaxis if first seizure");
    }

    // Abnormal posturing
    if (assessment.posturing === "decerebrate") {
      recommendations.push("🚨 DECEREBRATE POSTURING - Severe brainstem injury");
      recommendations.push("✓ Urgent neurosurgery consultation");
      recommendations.push("✓ Prepare for ICU admission");
    } else if (assessment.posturing === "decorticate") {
      recommendations.push("🚨 DECORTICATE POSTURING - Severe cerebral injury");
      recommendations.push("✓ Neurosurgery consultation");
      recommendations.push("✓ ICU monitoring");
    }

    return recommendations;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Disability Assessment (D)</h1>
          <p className="text-gray-600">Pediatric Resuscitation - Neurological Evaluation</p>
        </div>

        {/* STEP 1: Assessment */}
        {step === "assessment" && (
          <div className="space-y-6">
            {/* AVPU */}
            <Card>
              <CardHeader>
                <CardTitle>Responsiveness (AVPU)</CardTitle>
                <CardDescription>Alert, Verbal, Pain, Unresponsive</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { value: "alert", label: "Alert - Spontaneously awake and aware" },
                    { value: "verbal", label: "Verbal - Responds to voice" },
                    { value: "pain", label: "Pain - Responds to pain stimulus" },
                    { value: "unresponsive", label: "Unresponsive - No response" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => handleAVPUSelect(option.value)}
                      variant={assessment.avpu === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.avpu === option.value && "✓ "}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Verbal Response */}
            <Card>
              <CardHeader>
                <CardTitle>Verbal Response</CardTitle>
                <CardDescription>Quality of speech and orientation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { value: "oriented", label: "Oriented - Knows person, place, time" },
                    { value: "confused", label: "Confused - Disoriented" },
                    { value: "inappropriate", label: "Inappropriate words" },
                    { value: "incomprehensible", label: "Incomprehensible sounds" },
                    { value: "none", label: "No verbal response" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => handleVerbalResponseSelect(option.value)}
                      variant={assessment.verbalResponse === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.verbalResponse === option.value && "✓ "}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Motor Response */}
            <Card>
              <CardHeader>
                <CardTitle>Motor Response</CardTitle>
                <CardDescription>Best motor response to stimulus</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { value: "obeys", label: "Obeys commands" },
                    { value: "localizes", label: "Localizes to pain" },
                    { value: "withdraws", label: "Withdraws from pain" },
                    { value: "abnormal_flexion", label: "Abnormal flexion (decorticate)" },
                    { value: "abnormal_extension", label: "Abnormal extension (decerebrate)" },
                    { value: "none", label: "No motor response" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => handleMotorResponseSelect(option.value)}
                      variant={assessment.motorResponse === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.motorResponse === option.value && "✓ "}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pupil Assessment */}
            <Card>
              <CardHeader>
                <CardTitle>Pupil Size</CardTitle>
                <CardDescription>Assess both pupils</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { value: "normal", label: "Normal (3-5mm, equal)" },
                    { value: "dilated", label: "Dilated (greater than 5mm)" },
                    { value: "pinpoint", label: "Pinpoint (less than 2mm)" },
                    { value: "unequal", label: "Unequal (anisocoria)" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => handlePupilSizeSelect(option.value)}
                      variant={assessment.pupilSize === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.pupilSize === option.value && "✓ "}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pupil Reactivity */}
            <Card>
              <CardHeader>
                <CardTitle>Pupil Reactivity</CardTitle>
                <CardDescription>Response to light</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { value: "reactive", label: "Reactive - Brisk response to light" },
                    { value: "sluggish", label: "Sluggish - Slow response" },
                    { value: "fixed", label: "Fixed - No response to light" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => handlePupilReactivitySelect(option.value)}
                      variant={assessment.pupilReactivity === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.pupilReactivity === option.value && "✓ "}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Seizure Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Seizure Activity</CardTitle>
                <CardDescription>Observe for seizures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { value: "none", label: "No seizure activity" },
                    { value: "active", label: "🚨 Active seizure" },
                    { value: "post_ictal", label: "Post-ictal (just finished)" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => handleSeizureActivitySelect(option.value)}
                      variant={assessment.seizureActivity === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.seizureActivity === option.value && "✓ "}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Abnormal Posturing */}
            <Card>
              <CardHeader>
                <CardTitle>Abnormal Posturing</CardTitle>
                <CardDescription>Spontaneous or with stimulation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { value: "none", label: "No abnormal posturing" },
                    { value: "decorticate", label: "Decorticate (flexion) - Arms flexed, legs extended" },
                    { value: "decerebrate", label: "Decerebrate (extension) - All limbs extended" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => handlePosturingSelect(option.value)}
                      variant={assessment.posturing === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {assessment.posturing === option.value && "✓ "}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleProceedToFindings} className="w-full bg-purple-600 hover:bg-purple-700">
              Calculate GCS & Analyze <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 2: Findings */}
        {step === "findings" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Glasgow Coma Scale (GCS)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <p className="text-center text-5xl font-bold text-purple-700">{assessment.gcsScore}/15</p>
                  <p className="text-center text-sm text-gray-600 mt-2">
                    {assessment.gcsScore <= 8 && "Severe - Requires intubation"}
                    {assessment.gcsScore > 8 && assessment.gcsScore <= 12 && "Moderate - High risk"}
                    {assessment.gcsScore > 12 && assessment.gcsScore < 15 && "Mild - Monitor closely"}
                    {assessment.gcsScore === 15 && "Normal"}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Responsiveness</p>
                    <p className="font-bold capitalize">{assessment.avpu}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Verbal</p>
                    <p className="font-bold capitalize">{assessment.verbalResponse}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Motor</p>
                    <p className="font-bold capitalize">{assessment.motorResponse?.replace(/_/g, " ")}</p>
                  </div>
                </div>

                {assessment.pupilReactivity === "fixed" && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-bold text-red-800">🚨 FIXED PUPILS - Severe neurological injury</p>
                  </div>
                )}

                {assessment.seizureActivity === "active" && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-bold text-red-800">🚨 ACTIVE SEIZURE - Treat immediately</p>
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
                <CardDescription>Based on neurological assessment</CardDescription>
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
                Proceed to E (Exposure) <ArrowRight className="w-4 h-4 ml-2" />
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
                Disability Assessment Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Disability assessment completed successfully. Proceed to Exposure (E) assessment when ready.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Continue to E (Exposure Assessment)
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
