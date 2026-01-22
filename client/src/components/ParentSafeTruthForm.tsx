import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SubmissionConfirmationModal from "./SubmissionConfirmationModal";

export default function ParentSafeTruthForm() {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [formData, setFormData] = useState({
    childAge: "",
    eventType: "cardiac-arrest",
    recognizedProblem: false,
    calledHelp: false,
    helpResponseTime: "",
    numResponders: "",
    childAlive: false,
    outcome: "unknown",
    systemGaps: [] as string[],
  });
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  const submitMutation = trpc.safeTruthEvents.logEvent.useMutation();

  const handleSubmit = async () => {
    try {
      setError("");
      const submitData = {
        eventDate: new Date().toISOString(),
        childAge: parseInt(formData.childAge) || 0,
        eventType: "parent-observation",
        presentation: JSON.stringify(formData),
        isAnonymous,
        chainOfSurvival: {
          recognition: formData.recognizedProblem,
          activation: formData.calledHelp,
          cpr: false,
          defibrillation: false,
          advancedCare: false,
          postResuscitation: formData.childAlive,
        },
        systemGaps: formData.systemGaps,
        gapDetails: {},
        outcome: formData.outcome,
        neurologicalStatus: formData.childAlive ? "intact" : "unknown",
      };

      await submitMutation.mutateAsync(submitData);
      setSubmittedData(submitData);
      setShowConfirmation(true);
      setFormData({
        childAge: "",
        eventType: "cardiac-arrest",
        recognizedProblem: false,
        calledHelp: false,
        helpResponseTime: "",
        numResponders: "",
        childAlive: false,
        outcome: "unknown",
        systemGaps: [],
      });
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please try again.");
    }
  };

  const toggleSystemGap = (gap: string) => {
    setFormData((prev) => ({
      ...prev,
      systemGaps: prev.systemGaps.includes(gap)
        ? prev.systemGaps.filter((g) => g !== gap)
        : [...prev.systemGaps, gap],
    }));
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Child's Health Journey</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Child Age */}
          <div>
            <Label>Child's Age</Label>
            <input
              type="number"
              value={formData.childAge}
              onChange={(e) =>
                setFormData({ ...formData, childAge: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Age in years"
            />
          </div>

          {/* Event Type */}
          <div>
            <Label>What happened?</Label>
            <select
              value={formData.eventType}
              onChange={(e) =>
                setFormData({ ...formData, eventType: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="cardiac-arrest">Cardiac Arrest</option>
              <option value="respiratory-distress">Respiratory Distress</option>
              <option value="shock">Shock</option>
              <option value="seizure">Seizure</option>
              <option value="severe-illness">Severe Illness</option>
              <option value="injury">Injury</option>
              <option value="other">Other Emergency</option>
            </select>
          </div>

          {/* Recognition */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="recognized"
              checked={formData.recognizedProblem}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  recognizedProblem: checked as boolean,
                })
              }
            />
            <Label htmlFor="recognized" className="font-normal">
              I recognized something was seriously wrong
            </Label>
          </div>

          {/* Called Help */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="called-help"
              checked={formData.calledHelp}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, calledHelp: checked as boolean })
              }
            />
            <Label htmlFor="called-help" className="font-normal">
              I called for emergency help
            </Label>
          </div>

          {formData.calledHelp && (
            <>
              <div>
                <Label>How quickly did help arrive?</Label>
                <select
                  value={formData.helpResponseTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      helpResponseTime: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select response time</option>
                  <option value="less-5">Less than 5 minutes</option>
                  <option value="5-10">5-10 minutes</option>
                  <option value="10-20">10-20 minutes</option>
                  <option value="more-20">More than 20 minutes</option>
                </select>
              </div>

              <div>
                <Label>How many people responded?</Label>
                <input
                  type="number"
                  value={formData.numResponders}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numResponders: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Number of responders"
                />
              </div>
            </>
          )}

          {/* Outcome */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="child-alive"
              checked={formData.childAlive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, childAlive: checked as boolean })
              }
            />
            <Label htmlFor="child-alive" className="font-normal">
              My child survived
            </Label>
          </div>

          {formData.childAlive && (
            <div>
              <Label>Child's current status</Label>
              <select
                value={formData.outcome}
                onChange={(e) =>
                  setFormData({ ...formData, outcome: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="unknown">Unknown</option>
                <option value="discharged">Discharged home</option>
                <option value="referred">Referred to another facility</option>
                <option value="hospitalized">Still hospitalized</option>
              </select>
            </div>
          )}

          {/* System Gaps */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              What could have been better?
            </Label>
            <div className="space-y-3">
              {[
                { id: "communication", label: "Communication with medical team" },
                { id: "equipment", label: "Equipment availability" },
                { id: "staff", label: "Staff availability" },
                { id: "training", label: "Staff training" },
                { id: "protocols", label: "Clear protocols/procedures" },
                { id: "family-support", label: "Family support and information" },
                { id: "follow-up", label: "Follow-up care" },
              ].map((gap) => (
                <div key={gap.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={gap.id}
                    checked={formData.systemGaps.includes(gap.id)}
                    onCheckedChange={() => toggleSystemGap(gap.id)}
                  />
                  <Label htmlFor={gap.id} className="font-normal">
                    {gap.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Anonymous */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) =>
                setIsAnonymous(checked as boolean)
              }
            />
            <Label htmlFor="anonymous" className="font-normal">
              Submit anonymously
            </Label>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="w-full"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Your Story"
            )}
          </Button>
        </CardContent>
      </Card>

      {showConfirmation && submittedData && (
        <SubmissionConfirmationModal
          isOpen={showConfirmation}
          isProvider={false}
          data={submittedData}
          onClose={() => setShowConfirmation(false)}
        />
      )}
    </div>
  );
}
