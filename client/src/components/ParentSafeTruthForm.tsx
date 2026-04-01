import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SubmissionConfirmationModal from "./SubmissionConfirmationModal";

const NONE = "__none__";

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

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Tell us what happened</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Answer in your own language (English or Kiswahili is fine). Approximate numbers are okay. Tick only what
            feels right—you can leave anything blank.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="child-age">How old was your child? (years)</Label>
            <Input
              id="child-age"
              type="number"
              min={0}
              max={25}
              inputMode="numeric"
              value={formData.childAge}
              onChange={(e) => setFormData({ ...formData, childAge: e.target.value })}
              placeholder="e.g. 3 — a guess is fine"
            />
          </div>

          <div className="space-y-2">
            <Label id="event-type-label">What kind of emergency was it?</Label>
            <Select
              value={formData.eventType}
              onValueChange={(v) => setFormData({ ...formData, eventType: v })}
            >
              <SelectTrigger className="w-full" aria-labelledby="event-type-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cardiac-arrest">Breathing stopped or the heart stopped</SelectItem>
                <SelectItem value="respiratory-distress">Serious breathing difficulty</SelectItem>
                <SelectItem value="shock">Very weak, cold, or not responding properly</SelectItem>
                <SelectItem value="seizure">Convulsions (fits)</SelectItem>
                <SelectItem value="severe-illness">Became very sick very fast</SelectItem>
                <SelectItem value="injury">Accident or injury</SelectItem>
                <SelectItem value="other">Another emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="recognized"
              className="mt-0.5"
              checked={formData.recognizedProblem}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  recognizedProblem: checked as boolean,
                })
              }
            />
            <Label htmlFor="recognized" className="font-normal leading-relaxed cursor-pointer">
              I realised something was seriously wrong with my child
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="called-help"
              className="mt-0.5"
              checked={formData.calledHelp}
              onCheckedChange={(checked) => setFormData({ ...formData, calledHelp: checked as boolean })}
            />
            <Label htmlFor="called-help" className="font-normal leading-relaxed cursor-pointer">
              I called for emergency help (ambulance, nurse, or emergency number)
            </Label>
          </div>

          {formData.calledHelp && (
            <>
              <div className="space-y-2">
                <Label id="help-time-label">About how long until someone came to help?</Label>
                <Select
                  value={formData.helpResponseTime || NONE}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      helpResponseTime: v === NONE ? "" : v,
                    })
                  }
                >
                  <SelectTrigger className="w-full" aria-labelledby="help-time-label">
                    <SelectValue placeholder="Choose roughly how long" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Not sure / prefer not to say</SelectItem>
                    <SelectItem value="less-5">Under 5 minutes</SelectItem>
                    <SelectItem value="5-10">About 5 to 10 minutes</SelectItem>
                    <SelectItem value="10-20">About 10 to 20 minutes</SelectItem>
                    <SelectItem value="more-20">More than 20 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="num-responders">How many people came to help?</Label>
                <Input
                  id="num-responders"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={formData.numResponders}
                  onChange={(e) => setFormData({ ...formData, numResponders: e.target.value })}
                  placeholder="Rough number is fine"
                />
              </div>
            </>
          )}

          <div className="flex items-start gap-3">
            <Checkbox
              id="child-alive"
              className="mt-0.5"
              checked={formData.childAlive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, childAlive: checked as boolean })
              }
            />
            <Label htmlFor="child-alive" className="font-normal leading-relaxed cursor-pointer">
              My child is alive
            </Label>
          </div>

          {formData.childAlive && (
            <div className="space-y-2">
              <Label id="outcome-label">Where things stand now (best you know)</Label>
              <Select
                value={formData.outcome}
                onValueChange={(v) => setFormData({ ...formData, outcome: v })}
              >
                <SelectTrigger className="w-full" aria-labelledby="outcome-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Not sure / still figuring it out</SelectItem>
                  <SelectItem value="discharged">We went home from hospital</SelectItem>
                  <SelectItem value="referred">Sent to another hospital</SelectItem>
                  <SelectItem value="hospitalized">Still in hospital</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-base font-semibold mb-3 block">What could have been better? (tick any)</Label>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              This is not about blaming one person—it helps us see patterns.
            </p>
            <div className="space-y-3">
              {[
                { id: "communication", label: "I did not always understand what staff were doing or saying" },
                { id: "equipment", label: "Something we needed (equipment or supplies) seemed missing" },
                { id: "staff", label: "There were not enough people to help quickly" },
                { id: "training", label: "Staff seemed unsure what to do next" },
                { id: "protocols", label: "The next steps did not feel clear" },
                { id: "family-support", label: "I needed someone to sit with me, explain more, or let me rest" },
                { id: "follow-up", label: "Going home or follow-up plans were unclear" },
              ].map((gap) => (
                <div key={gap.id} className="flex items-start gap-3">
                  <Checkbox
                    id={gap.id}
                    className="mt-0.5"
                    checked={formData.systemGaps.includes(gap.id)}
                    onCheckedChange={() => toggleSystemGap(gap.id)}
                  />
                  <Label htmlFor={gap.id} className="font-normal leading-relaxed cursor-pointer">
                    {gap.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
            <Checkbox
              id="anonymous"
              className="mt-0.5"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
            />
            <Label htmlFor="anonymous" className="font-normal leading-relaxed cursor-pointer">
              Send this without my name on it
            </Label>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            variant="cta"
            className="w-full"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              "Send my story"
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
