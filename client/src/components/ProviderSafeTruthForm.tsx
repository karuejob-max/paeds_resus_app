import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ProviderSafeTruthForm() {
  const [step, setStep] = useState(1);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const submitMutation = trpc.safeTruthEvents.logEvent.useMutation();

  const handleSubmit = async () => {
    try {
      setError("");
      const submitData = {
        eventDate: formData.eventDate || new Date().toISOString(),
        childAge: parseInt(formData.patientAge) || 0,
        eventType: formData.algorithm || "unknown",
        presentation: JSON.stringify(formData),
        isAnonymous,
        chainOfSurvival: {
          recognition: !!formData.responsiveness,
          activation: !!formData.helpCalled,
          cpr: !!formData.cprPerformed,
          defibrillation: !!formData.defibUsed,
          advancedCare: !!formData.medicationsGiven,
          postResuscitation: !!formData.rosc,
        },
        systemGaps: formData.systemGaps || [],
        gapDetails: {},
        outcome: formData.outcome || "unknown",
        neurologicalStatus: formData.neuroStatus || "unknown",
      };

      await submitMutation.mutateAsync(submitData);
      setSuccess(true);
      setTimeout(() => {
        setStep(1);
        setFormData({});
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    }
  };

  // Step 1: Basic Info & Algorithm Selection
  if (step === 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Event Date & Time</Label>
            <input
              type="datetime-local"
              value={formData.eventDate || ""}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <Label>Patient Age (years)</Label>
            <input
              type="number"
              min="0"
              value={formData.patientAge || ""}
              onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <Label>Primary Algorithm</Label>
            <RadioGroup value={formData.algorithm || ""} onValueChange={(v) => setFormData({ ...formData, algorithm: v })}>
              {["Cardiac Arrest", "Tachyarrhythmia", "Bradycardia", "Respiratory Failure", "Shock", "Other"].map((algo) => (
                <div key={algo} className="flex items-center space-x-2">
                  <RadioGroupItem value={algo} id={algo} />
                  <Label htmlFor={algo}>{algo}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox checked={isAnonymous} onCheckedChange={(v) => setIsAnonymous(v as boolean)} id="anon" />
            <Label htmlFor="anon">Submit anonymously</Label>
          </div>

          <Button onClick={() => setStep(2)} className="w-full">Next</Button>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Initial Assessment
  if (step === 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Initial Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Responsiveness</Label>
            <RadioGroup value={formData.responsiveness || ""} onValueChange={(v) => setFormData({ ...formData, responsiveness: v })}>
              {["Responsive", "Unresponsive"].map((r) => (
                <div key={r} className="flex items-center space-x-2">
                  <RadioGroupItem value={r} id={r} />
                  <Label htmlFor={r}>{r}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label>Breathing</Label>
            <RadioGroup value={formData.breathing || ""} onValueChange={(v) => setFormData({ ...formData, breathing: v })}>
              {["Normal", "Gasping", "Absent"].map((b) => (
                <div key={b} className="flex items-center space-x-2">
                  <RadioGroupItem value={b} id={b} />
                  <Label htmlFor={b}>{b}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label>Pulse</Label>
            <RadioGroup value={formData.pulse || ""} onValueChange={(v) => setFormData({ ...formData, pulse: v })}>
              {["Present", "Absent"].map((p) => (
                <div key={p} className="flex items-center space-x-2">
                  <RadioGroupItem value={p} id={p} />
                  <Label htmlFor={p}>{p}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label>Initial Rhythm</Label>
            <RadioGroup value={formData.rhythm || ""} onValueChange={(v) => setFormData({ ...formData, rhythm: v })}>
              {["VF/pVT (Shockable)", "PEA", "Asystole", "Other"].map((r) => (
                <div key={r} className="flex items-center space-x-2">
                  <RadioGroupItem value={r} id={r} />
                  <Label htmlFor={r}>{r}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setStep(1)} variant="outline" className="flex-1">Back</Button>
            <Button onClick={() => setStep(3)} className="flex-1">Next</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 3: CPR Quality
  if (step === 3) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CPR Quality Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox checked={formData.cprPerformed} onCheckedChange={(v) => setFormData({ ...formData, cprPerformed: v })} id="cpr" />
              <Label htmlFor="cpr">CPR performed</Label>
            </div>

            {formData.cprPerformed && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={formData.feedbackDevice} onCheckedChange={(v) => setFormData({ ...formData, feedbackDevice: v })} id="fb" />
                  <Label htmlFor="fb">Feedback device used (metronome/accelerometer)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox checked={formData.depthAdequate} onCheckedChange={(v) => setFormData({ ...formData, depthAdequate: v })} id="depth" />
                  <Label htmlFor="depth">Compression depth adequate</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox checked={formData.recoilAllowed} onCheckedChange={(v) => setFormData({ ...formData, recoilAllowed: v })} id="recoil" />
                  <Label htmlFor="recoil">Complete recoil allowed</Label>
                </div>

                <div>
                  <Label>Interruptions</Label>
                  <RadioGroup value={formData.interruptions || ""} onValueChange={(v) => setFormData({ ...formData, interruptions: v })}>
                    {["< 10 sec", "10-20 sec", "> 20 sec"].map((i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <RadioGroupItem value={i} id={i} />
                        <Label htmlFor={i}>{i}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label>Chest Compression Fraction</Label>
                  <RadioGroup value={formData.ccf || ""} onValueChange={(v) => setFormData({ ...formData, ccf: v })}>
                    {["70-80%", "80-90%", "> 90%"].map((c) => (
                      <div key={c} className="flex items-center space-x-2">
                        <RadioGroupItem value={c} id={c} />
                        <Label htmlFor={c}>{c}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setStep(2)} variant="outline" className="flex-1">Back</Button>
            <Button onClick={() => setStep(4)} className="flex-1">Next</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 4: Interventions
  if (step === 4) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interventions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox checked={formData.defibUsed} onCheckedChange={(v) => setFormData({ ...formData, defibUsed: v })} id="defib" />
              <Label htmlFor="defib">Defibrillator used</Label>
            </div>

            {formData.defibUsed && (
              <div>
                <Label>Pad type</Label>
                <RadioGroup value={formData.padType || ""} onValueChange={(v) => setFormData({ ...formData, padType: v })}>
                  {["Adult", "Pediatric", "Switched"].map((p) => (
                    <div key={p} className="flex items-center space-x-2">
                      <RadioGroupItem value={p} id={p} />
                      <Label htmlFor={p}>{p}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox checked={formData.oxygenGiven} onCheckedChange={(v) => setFormData({ ...formData, oxygenGiven: v })} id="o2" />
              <Label htmlFor="o2">Oxygen administered</Label>
            </div>

            {formData.oxygenGiven && (
              <div>
                <Label>Method</Label>
                <RadioGroup value={formData.o2Method || ""} onValueChange={(v) => setFormData({ ...formData, o2Method: v })}>
                  {["Nasal Cannula", "Face Mask", "BVM", "Intubation"].map((m) => (
                    <div key={m} className="flex items-center space-x-2">
                      <RadioGroupItem value={m} id={m} />
                      <Label htmlFor={m}>{m}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox checked={formData.medicationsGiven} onCheckedChange={(v) => setFormData({ ...formData, medicationsGiven: v })} id="meds" />
              <Label htmlFor="meds">Medications given (Epinephrine/Amiodarone)</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setStep(3)} variant="outline" className="flex-1">Back</Button>
            <Button onClick={() => setStep(5)} className="flex-1">Next</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 5: Outcome & Gaps
  if (step === 5) {
    const gaps = ["Knowledge Gap", "Resources Gap", "Leadership Gap", "Communication Gap", "Protocol Gap", "Equipment Gap", "Training Gap", "Staffing Gap", "Infrastructure Gap"];

    return (
      <Card>
        <CardHeader>
          <CardTitle>Outcome & System Gaps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Outcome</Label>
            <RadioGroup value={formData.outcome || ""} onValueChange={(v) => setFormData({ ...formData, outcome: v })}>
              {["Discharged Intact", "Discharged with Deficit", "Transferred", "Died"].map((o) => (
                <div key={o} className="flex items-center space-x-2">
                  <RadioGroupItem value={o} id={o} />
                  <Label htmlFor={o}>{o}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label>Neurological Status</Label>
            <RadioGroup value={formData.neuroStatus || ""} onValueChange={(v) => setFormData({ ...formData, neuroStatus: v })}>
              {["Alert", "Responsive to Commands", "Responsive to Pain", "Unresponsive"].map((n) => (
                <div key={n} className="flex items-center space-x-2">
                  <RadioGroupItem value={n} id={n} />
                  <Label htmlFor={n}>{n}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label>System Gaps Identified</Label>
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

          <div className="flex gap-2">
            <Button onClick={() => setStep(4)} variant="outline" className="flex-1">Back</Button>
            <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="flex-1">
              {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit
            </Button>
          </div>

          {error && <Alert className="bg-red-50"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
          {success && <Alert className="bg-green-50"><CheckCircle2 className="h-4 w-4" /><AlertDescription>Submitted successfully!</AlertDescription></Alert>}
        </CardContent>
      </Card>
    );
  }

  return null;
}
