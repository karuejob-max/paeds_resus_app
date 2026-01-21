import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Heart, Activity, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function SafeTruthLogger() {
  const { user } = useAuth();
  const [step, setStep] = useState<"event" | "chain" | "gaps" | "review">("event");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Event details
  const [eventDate, setEventDate] = useState("");
  const [childAge, setChildAge] = useState("");
  const [eventType, setEventType] = useState("");
  const [presentation, setPresentation] = useState("");

  // Chain of Survival
  const [chainOfSurvival, setChainOfSurvival] = useState({
    recognition: false,
    recognitionNotes: "",
    activation: false,
    activationNotes: "",
    cpr: false,
    cprQuality: "",
    cprNotes: "",
    defibrillation: false,
    defibrillationNotes: "",
    advancedCare: false,
    advancedCareDetails: "",
    postResuscitation: false,
    postResuscitationNotes: "",
  });

  // System Gaps
  const [systemGaps, setSystemGaps] = useState<string[]>([]);
  const [gapDetails, setGapDetails] = useState<{ [key: string]: string }>({});

  // Outcome
  const [outcome, setOutcome] = useState("");
  const [neurologicalStatus, setNeurologicalStatus] = useState("");

  const gapCategories = [
    "Knowledge Gap",
    "Resources Gap",
    "Leadership Gap",
    "Communication Gap",
    "Protocol Gap",
    "Equipment Gap",
    "Training Gap",
    "Staffing Gap",
    "Infrastructure Gap",
  ];

  const eventTypes = [
    "Cardiac Arrest",
    "Respiratory Failure",
    "Severe Sepsis",
    "Trauma",
    "Drowning",
    "Choking",
    "Other",
  ];

  const handleGapToggle = (gap: string) => {
    setSystemGaps((prev) =>
      prev.includes(gap) ? prev.filter((g) => g !== gap) : [...prev, gap]
    );
  };

  const handleSubmit = async () => {
    try {
      console.log("Submitting Safe-Truth event with provider:", user?.id);
      // TODO: Wire up to actual tRPC endpoint
      alert("Event logged successfully! Your report has been submitted confidentially.");
      setStep("event");
    } catch (error) {
      alert("Failed to submit event. Please try again.");
    }
  };

  // Authentication check
  if (!user) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 rounded-lg">
        <Card className="border-l-4 border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Lock className="w-5 h-5" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Please log in to access Safe-Truth event logger.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Role check - Safe-Truth for users with providerType
  if (!user.providerType && user.role !== "admin") {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 rounded-lg">
        <Card className="border-l-4 border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="w-5 h-5" />
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Safe-Truth is for healthcare providers only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Safe-Truth Logger</h1>
          <p className="text-gray-600">
            Report pediatric emergency events in a safe, confidential space. Your insights help us improve care for all children.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-8">
          {["event", "chain", "gaps", "review"].map((s, idx) => (
            <div key={s} className="flex items-center">
              <button
                onClick={() => setStep(s as any)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  step === s
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {idx + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
              {idx < 3 && <div className="w-4 h-1 bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: Event Details */}
        {step === "event" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Event Details
              </CardTitle>
              <CardDescription>Tell us about the pediatric emergency event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Anonymous Option */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <label className="text-sm text-gray-700">
                  Report anonymously (your name won't be attached to this report)
                </label>
              </div>

              {/* Event Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  When did this event occur?
                </label>
                <input
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Child Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Child's age (in months)
                </label>
                <input
                  type="number"
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  placeholder="e.g., 24 for 2-year-old"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type of emergency
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select event type...</option>
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Initial Presentation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial presentation and context
                </label>
                <textarea
                  value={presentation}
                  onChange={(e) => setPresentation(e.target.value)}
                  placeholder="Describe what you observed when you first encountered this child..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button
                  onClick={() => setStep("chain")}
                  disabled={!eventDate || !childAge || !eventType}
                >
                  Next: Chain of Survival
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Chain of Survival */}
        {step === "chain" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Chain of Survival
              </CardTitle>
              <CardDescription>
                Check off each step of the chain of survival that was performed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recognition */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={chainOfSurvival.recognition}
                    onChange={(e) =>
                      setChainOfSurvival({ ...chainOfSurvival, recognition: e.target.checked })
                    }
                    className="w-5 h-5 mt-1 rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">1. Recognition</h3>
                    <p className="text-sm text-gray-600">
                      Was the emergency recognized and the child identified as needing help?
                    </p>
                  </div>
                </div>
                {chainOfSurvival.recognition && (
                  <textarea
                    value={chainOfSurvival.recognitionNotes}
                    onChange={(e) =>
                      setChainOfSurvival({ ...chainOfSurvival, recognitionNotes: e.target.value })
                    }
                    placeholder="Any notes about recognition..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* Activation */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={chainOfSurvival.activation}
                    onChange={(e) =>
                      setChainOfSurvival({ ...chainOfSurvival, activation: e.target.checked })
                    }
                    className="w-5 h-5 mt-1 rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">2. Activation</h3>
                    <p className="text-sm text-gray-600">
                      Was emergency response activated (called for help)?
                    </p>
                  </div>
                </div>
                {chainOfSurvival.activation && (
                  <textarea
                    value={chainOfSurvival.activationNotes}
                    onChange={(e) =>
                      setChainOfSurvival({ ...chainOfSurvival, activationNotes: e.target.value })
                    }
                    placeholder="Any notes about activation..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* CPR */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={chainOfSurvival.cpr}
                    onChange={(e) =>
                      setChainOfSurvival({ ...chainOfSurvival, cpr: e.target.checked })
                    }
                    className="w-5 h-5 mt-1 rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">3. CPR</h3>
                    <p className="text-sm text-gray-600">
                      Was high-quality CPR initiated?
                    </p>
                  </div>
                </div>
                {chainOfSurvival.cpr && (
                  <div className="space-y-3">
                    <select
                      value={chainOfSurvival.cprQuality}
                      onChange={(e) =>
                        setChainOfSurvival({ ...chainOfSurvival, cprQuality: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Rate CPR quality...</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="adequate">Adequate</option>
                      <option value="poor">Poor</option>
                      <option value="not_performed">Not Performed</option>
                    </select>
                    <textarea
                      value={chainOfSurvival.cprNotes}
                      onChange={(e) =>
                        setChainOfSurvival({ ...chainOfSurvival, cprNotes: e.target.value })
                      }
                      placeholder="Any notes about CPR..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Defibrillation */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={chainOfSurvival.defibrillation}
                    onChange={(e) =>
                      setChainOfSurvival({ ...chainOfSurvival, defibrillation: e.target.checked })
                    }
                    className="w-5 h-5 mt-1 rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">4. Defibrillation</h3>
                    <p className="text-sm text-gray-600">
                      Was defibrillation available and used if indicated?
                    </p>
                  </div>
                </div>
                {chainOfSurvival.defibrillation && (
                  <textarea
                    value={chainOfSurvival.defibrillationNotes}
                    onChange={(e) =>
                      setChainOfSurvival({ ...chainOfSurvival, defibrillationNotes: e.target.value })
                    }
                    placeholder="Any notes about defibrillation..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* Advanced Care */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={chainOfSurvival.advancedCare}
                    onChange={(e) =>
                      setChainOfSurvival({ ...chainOfSurvival, advancedCare: e.target.checked })
                    }
                    className="w-5 h-5 mt-1 rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">5. Advanced Care</h3>
                    <p className="text-sm text-gray-600">
                      Was advanced life support provided?
                    </p>
                  </div>
                </div>
                {chainOfSurvival.advancedCare && (
                  <textarea
                    value={chainOfSurvival.advancedCareDetails}
                    onChange={(e) =>
                      setChainOfSurvival({ ...chainOfSurvival, advancedCareDetails: e.target.value })
                    }
                    placeholder="Describe advanced care provided (medications, intubation, etc.)..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* Post-Resuscitation */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={chainOfSurvival.postResuscitation}
                    onChange={(e) =>
                      setChainOfSurvival({
                        ...chainOfSurvival,
                        postResuscitation: e.target.checked,
                      })
                    }
                    className="w-5 h-5 mt-1 rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">6. Post-Resuscitation Care</h3>
                    <p className="text-sm text-gray-600">
                      Was post-resuscitation care provided (cooling, optimization)?
                    </p>
                  </div>
                </div>
                {chainOfSurvival.postResuscitation && (
                  <textarea
                    value={chainOfSurvival.postResuscitationNotes}
                    onChange={(e) =>
                      setChainOfSurvival({
                        ...chainOfSurvival,
                        postResuscitationNotes: e.target.value,
                      })
                    }
                    placeholder="Any notes about post-resuscitation care..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* Outcome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What was the outcome?
                </label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select outcome...</option>
                  <option value="pCOSCA">pCOSCA (Neurologically intact survival)</option>
                  <option value="ROSC_with_disability">ROSC with disability</option>
                  <option value="ROSC_unknown">ROSC with unknown status</option>
                  <option value="mortality">Mortality</option>
                  <option value="ongoing">Ongoing resuscitation</option>
                </select>
              </div>

              {outcome && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Neurological status (if known)
                  </label>
                  <select
                    value={neurologicalStatus}
                    onChange={(e) => setNeurologicalStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select status...</option>
                    <option value="intact">Intact</option>
                    <option value="mild_impairment">Mild impairment</option>
                    <option value="moderate_impairment">Moderate impairment</option>
                    <option value="severe_impairment">Severe impairment</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              )}

              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={() => setStep("event")}>
                  Back
                </Button>
                <Button onClick={() => setStep("gaps")}>Next: System Gaps</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: System Gaps */}
        {step === "gaps" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                System Gaps Identified
              </CardTitle>
              <CardDescription>
                What system gaps or barriers did you identify during this event?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {gapCategories.map((gap) => (
                  <div
                    key={gap}
                    className={`p-4 border rounded-lg cursor-pointer transition ${
                      systemGaps.includes(gap)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() => handleGapToggle(gap)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={systemGaps.includes(gap)}
                        onChange={() => handleGapToggle(gap)}
                        className="w-5 h-5 rounded"
                      />
                      <label className="font-medium text-gray-900 cursor-pointer">
                        {gap}
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {systemGaps.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-gray-900">Describe each gap:</h3>
                  {systemGaps.map((gap) => (
                    <div key={gap}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {gap}
                      </label>
                      <textarea
                        value={gapDetails[gap] || ""}
                        onChange={(e) =>
                          setGapDetails({ ...gapDetails, [gap]: e.target.value })
                        }
                        placeholder={`Describe this ${gap.toLowerCase()}...`}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={() => setStep("chain")}>
                  Back
                </Button>
                <Button onClick={() => setStep("review")}>Review & Submit</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review */}
        {step === "review" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Review Your Report
              </CardTitle>
              <CardDescription>
                Please review your report before submitting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  ✓ Your report will be kept confidential and used to improve pediatric emergency care.
                  {isAnonymous && " Your identity will not be attached to this report."}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Event Summary</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <p><span className="font-medium">Date:</span> {eventDate}</p>
                    <p><span className="font-medium">Child Age:</span> {childAge} months</p>
                    <p><span className="font-medium">Event Type:</span> {eventType}</p>
                    <p><span className="font-medium">Outcome:</span> {outcome}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Chain of Survival Completed</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
                    {[
                      { key: "recognition", label: "Recognition" },
                      { key: "activation", label: "Activation" },
                      { key: "cpr", label: "CPR" },
                      { key: "defibrillation", label: "Defibrillation" },
                      { key: "advancedCare", label: "Advanced Care" },
                      { key: "postResuscitation", label: "Post-Resuscitation" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        {chainOfSurvival[key as keyof typeof chainOfSurvival] ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="w-4 h-4 border border-gray-300 rounded-full" />
                        )}
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {systemGaps.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">System Gaps Identified</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex flex-wrap gap-2">
                        {systemGaps.map((gap) => (
                          <Badge key={gap} variant="outline">
                            {gap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={() => setStep("gaps")}>
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Submit Report
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
