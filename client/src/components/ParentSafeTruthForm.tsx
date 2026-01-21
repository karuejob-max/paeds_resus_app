import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SubmissionConfirmationModal from "./SubmissionConfirmationModal";

export default function ParentSafeTruthForm() {
  const [step, setStep] = useState(1);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  
  const submitMutation = trpc.safeTruthEvents.logEvent.useMutation();

  const handleSubmit = async () => {
    try {
      setError("");
      const submitData = {
        eventDate: formData.eventDate || new Date().toISOString(),
        childAge: parseInt(formData.childAge) || 0,
        eventType: "parent-observation",
        presentation: JSON.stringify(formData),
        isAnonymous,
        chainOfSurvival: {
          recognition: !!formData.recognizedProblem,
          activation: !!formData.calledHelp,
          cpr: false,
          defibrillation: false,
          advancedCare: false,
          postResuscitation: !!formData.childAlive,
        },
        systemGaps: formData.systemGaps || [],
        gapDetails: {},
        outcome: formData.outcome || "unknown",
        neurologicalStatus: formData.childStatus || "unknown",
      };

      await submitMutation.mutateAsync(submitData);
      setSubmittedData(submitData);
      setShowConfirmation(true);
      setSuccess(true);
      setTimeout(() => {
        setStep(1);
        setFormData({});
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    }
  };

  const handleCloseModal = () => {
    setShowConfirmation(false);
  };

  // Step 1: Child & Event Info
  if (step === 1) {
    return (
      <>
        <SubmissionConfirmationModal
          isOpen={showConfirmation}
          isProvider={false}
          data={submittedData || { eventDate: new Date().toISOString(), childAge: 0, isAnonymous }}
          onClose={handleCloseModal}
        />
        <Card>
          <CardHeader>
            <CardTitle>Your Child's Healthcare Journey</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Event Date</Label>
              <input
                type="date"
                value={formData.eventDate || ""}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <Label>Child's Age at the time (years)</Label>
              <input
                type="number"
                min="0"
                max="18"
                value={formData.childAge || ""}
                onChange={(e) => setFormData({ ...formData, childAge: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <Label>Where did this happen?</Label>
              <RadioGroup value={formData.location || ""} onValueChange={(v) => setFormData({ ...formData, location: v })}>
                {["Home", "School", "Hospital", "Other"].map((loc) => (
                  <div key={loc} className="flex items-center space-x-2">
                    <RadioGroupItem value={loc} id={loc} />
                    <Label htmlFor={loc}>{loc}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox checked={isAnonymous} onCheckedChange={(v) => setIsAnonymous(v as boolean)} id="anon" />
              <Label htmlFor="anon">Share your story anonymously</Label>
            </div>

            <Button onClick={() => setStep(2)} className="w-full">Next</Button>
          </CardContent>
        </Card>
      </>
    );
  }

  // Step 2: Before the Event
  if (step === 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Before the Emergency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>When did you first notice something was wrong?</Label>
            <RadioGroup value={formData.noticeTime || ""} onValueChange={(v) => setFormData({ ...formData, noticeTime: v })}>
              {["Minutes before", "Hours before", "Days before", "Gradually over time"].map((t) => (
                <div key={t} className="flex items-center space-x-2">
                  <RadioGroupItem value={t} id={t} />
                  <Label htmlFor={t}>{t}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label>What did you notice? (Select all that apply)</Label>
            <div className="space-y-2">
              {["Difficulty breathing", "Unusual color (pale/blue)", "Fever", "Vomiting", "Difficulty feeding", "Unusual behavior", "Loss of consciousness", "Seizures", "Other"].map((symptom) => (
                <div key={symptom} className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.symptoms?.includes(symptom)}
                    onCheckedChange={(v) => {
                      const current = formData.symptoms || [];
                      setFormData({
                        ...formData,
                        symptoms: v ? [...current, symptom] : current.filter((s: string) => s !== symptom),
                      });
                    }}
                    id={symptom}
                  />
                  <Label htmlFor={symptom}>{symptom}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox checked={formData.recognizedProblem} onCheckedChange={(v) => setFormData({ ...formData, recognizedProblem: v })} id="recognized" />
            <Label htmlFor="recognized">You recognized this was a serious emergency</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setStep(1)} variant="outline" className="flex-1">Back</Button>
            <Button onClick={() => setStep(3)} className="flex-1">Next</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 3: Getting Help
  if (step === 3) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Getting Help</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox checked={formData.calledHelp} onCheckedChange={(v) => setFormData({ ...formData, calledHelp: v })} id="called" />
            <Label htmlFor="called">You called for emergency help (911/ambulance)</Label>
          </div>

          {formData.calledHelp && (
            <div>
              <Label>How quickly did help arrive?</Label>
              <RadioGroup value={formData.helpSpeed || ""} onValueChange={(v) => setFormData({ ...formData, helpSpeed: v })}>
                {["Less than 5 minutes", "5-10 minutes", "10-20 minutes", "More than 20 minutes"].map((speed) => (
                  <div key={speed} className="flex items-center space-x-2">
                    <RadioGroupItem value={speed} id={speed} />
                    <Label htmlFor={speed}>{speed}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div>
            <Label>Who responded to help your child? (Select all)</Label>
            <div className="space-y-2">
              {["Paramedics/EMTs", "Police", "Fire Department", "Community members", "Teachers/School staff", "Healthcare workers nearby"].map((responder) => (
                <div key={responder} className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.responders?.includes(responder)}
                    onCheckedChange={(v) => {
                      const current = formData.responders || [];
                      setFormData({
                        ...formData,
                        responders: v ? [...current, responder] : current.filter((r: string) => r !== responder),
                      });
                    }}
                    id={responder}
                  />
                  <Label htmlFor={responder}>{responder}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setStep(2)} variant="outline" className="flex-1">Back</Button>
            <Button onClick={() => setStep(4)} className="flex-1">Next</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 4: Hospital Experience
  if (step === 4) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hospital Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Where was your child treated?</Label>
            <input
              type="text"
              placeholder="Hospital/Clinic name"
              value={formData.hospital || ""}
              onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <Label>How would you rate communication from the medical team?</Label>
            <RadioGroup value={formData.communication || ""} onValueChange={(v) => setFormData({ ...formData, communication: v })}>
              {["Excellent", "Good", "Fair", "Poor", "Very Poor"].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <RadioGroupItem value={rating} id={rating} />
                  <Label htmlFor={rating}>{rating}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label>Were you kept informed about what was happening?</Label>
            <RadioGroup value={formData.informed || ""} onValueChange={(v) => setFormData({ ...formData, informed: v })}>
              {["Always", "Usually", "Sometimes", "Rarely", "Never"].map((freq) => (
                <div key={freq} className="flex items-center space-x-2">
                  <RadioGroupItem value={freq} id={freq} />
                  <Label htmlFor={freq}>{freq}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label>Did you feel your concerns were heard?</Label>
            <RadioGroup value={formData.heard || ""} onValueChange={(v) => setFormData({ ...formData, heard: v })}>
              {["Completely", "Mostly", "Somewhat", "Not really", "Not at all"].map((heard) => (
                <div key={heard} className="flex items-center space-x-2">
                  <RadioGroupItem value={heard} id={heard} />
                  <Label htmlFor={heard}>{heard}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setStep(3)} variant="outline" className="flex-1">Back</Button>
            <Button onClick={() => setStep(5)} className="flex-1">Next</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 5: Child's Outcome
  if (step === 5) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Child's Outcome</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox checked={formData.childAlive} onCheckedChange={(v) => setFormData({ ...formData, childAlive: v })} id="alive" />
            <Label htmlFor="alive">Your child survived</Label>
          </div>

          {formData.childAlive && (
            <>
              <div>
                <Label>How is your child now?</Label>
                <RadioGroup value={formData.childStatus || ""} onValueChange={(v) => setFormData({ ...formData, childStatus: v })}>
                  {["Fully recovered", "Mostly recovered", "Some ongoing challenges", "Significant disabilities", "Still hospitalized"].map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <RadioGroupItem value={status} id={status} />
                      <Label htmlFor={status}>{status}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>What challenges are you facing now? (Select all)</Label>
                <div className="space-y-2">
                  {["Physical therapy needs", "Cognitive/learning issues", "Behavioral changes", "Medical follow-ups", "Financial burden", "Emotional/psychological support needed", "School reintegration", "None"].map((challenge) => (
                    <div key={challenge} className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.challenges?.includes(challenge)}
                        onCheckedChange={(v) => {
                          const current = formData.challenges || [];
                          setFormData({
                            ...formData,
                            challenges: v ? [...current, challenge] : current.filter((c: string) => c !== challenge),
                          });
                        }}
                        id={challenge}
                      />
                      <Label htmlFor={challenge}>{challenge}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Have you received adequate follow-up support?</Label>
                <RadioGroup value={formData.followUp || ""} onValueChange={(v) => setFormData({ ...formData, followUp: v })}>
                  {["Yes, excellent", "Adequate", "Minimal", "None"].map((fu) => (
                    <div key={fu} className="flex items-center space-x-2">
                      <RadioGroupItem value={fu} id={fu} />
                      <Label htmlFor={fu}>{fu}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </>
          )}

          {!formData.childAlive && (
            <div>
              <Label>We are deeply sorry for your loss. What support do you need?</Label>
              <div className="space-y-2">
                {["Grief counseling", "Support group", "Financial assistance", "Information about what happened", "Advocacy for system improvement"].map((support) => (
                  <div key={support} className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.supportNeeds?.includes(support)}
                      onCheckedChange={(v) => {
                        const current = formData.supportNeeds || [];
                        setFormData({
                          ...formData,
                          supportNeeds: v ? [...current, support] : current.filter((s: string) => s !== support),
                        });
                      }}
                      id={support}
                    />
                    <Label htmlFor={support}>{support}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={() => setStep(4)} variant="outline" className="flex-1">Back</Button>
            <Button onClick={() => setStep(6)} className="flex-1">Next</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 6: System Gaps & Improvements
  if (step === 6) {
    const gaps = [
      "Response time was too slow",
      "Equipment not available",
      "Staff didn't know what to do",
      "Poor communication with family",
      "Lack of follow-up care",
      "Not enough trained staff",
      "Hospital policies prevented care",
      "Lack of coordination between teams",
      "No support for family",
      "Inadequate training for emergency response",
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle>System Gaps & Improvements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>What could have been done better? (Select all that apply)</Label>
            <div className="space-y-2">
              {gaps.map((gap) => (
                <div key={gap} className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.systemGaps?.includes(gap)}
                    onCheckedChange={(v) => {
                      const current = formData.systemGaps || [];
                      setFormData({
                        ...formData,
                        systemGaps: v ? [...current, gap] : current.filter((g: string) => g !== gap),
                      });
                    }}
                    id={gap}
                  />
                  <Label htmlFor={gap}>{gap}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>What would you recommend to prevent this from happening to other families?</Label>
            <textarea
              value={formData.recommendations || ""}
              onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
              placeholder="Your suggestions..."
              className="w-full px-3 py-2 border rounded-md h-24"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setStep(5)} variant="outline" className="flex-1">Back</Button>
            <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="flex-1">
              {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Your Story
            </Button>
          </div>

          {error && <Alert className="bg-red-50"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
          {success && <Alert className="bg-green-50"><CheckCircle2 className="h-4 w-4" /><AlertDescription>Thank you for sharing your story. It will help us improve care for other families.</AlertDescription></Alert>}
        </CardContent>
      </Card>
    );
  }

  return null;
}
