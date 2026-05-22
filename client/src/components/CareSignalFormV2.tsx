/**
 * Care Signal v2 — QI reporting aligned to preventable paediatric mortality.
 * Replaces legacy CPR-checklist form for facility / county / national intelligence.
 */
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, ChevronLeft, ChevronRight, Heart, Loader2, Shield } from "lucide-react";
import { getAnalyticsSessionId } from "@/lib/analytics-session";
import { trpc } from "@/lib/trpc";
import { FacilityPicker, type FacilitySelection } from "@/components/FacilityPicker";
import SubmissionConfirmationModal, {
  type SubmissionData,
} from "@/components/SubmissionConfirmationModal";
import {
  initialCareSignalV2State,
  buildCareSignalV2SubmitPayload,
  validateCareSignalV2Step,
  REPORT_TYPE_OPTIONS,
  CARE_LOCATION_OPTIONS,
  EMERGENCY_TYPE_OPTIONS,
  DELAY_OPTIONS,
  EQUIPMENT_CHECKLIST,
  CONTRIBUTING_FACTORS,
  SYSTEM_GAP_CATEGORIES,
  PREVENTABLE_OPTIONS,
  OUTCOME_OPTIONS,
  NEURO_OPTIONS,
  type CareSignalV2FormState,
  CARE_SIGNAL_V2_STEP_GUIDE,
} from "@/lib/care-signal-v2";
import type { SafeTruthAgeBand } from "@/lib/safetruth-age";
import { cn } from "@/lib/utils";

const STEPS = CARE_SIGNAL_V2_STEP_GUIDE.map((step, id) => ({ id, title: step.title }));

/** Readable copy on Care Signal light teal / white surfaces (avoid washed-out muted-foreground). */
const CS_OPTION =
  "flex items-start space-x-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-teal-200/80 hover:bg-teal-50/60 transition-colors";
const CS_CHECK_GRID = "border border-slate-200 rounded-md bg-slate-50 p-3 dark:bg-slate-900/40";

export default function CareSignalFormV2() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CareSignalV2FormState>(initialCareSignalV2State);
  const [facility, setFacility] = useState<FacilitySelection | null>(null);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submittedData, setSubmittedData] = useState<SubmissionData | null>(null);
  const [prefillBanner, setPrefillBanner] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const submitMutation = trpc.careSignalEvents.logEvent.useMutation({
    onSuccess: () => {
      void utils.fellowship.getProgress.invalidate();
    },
  });
  const trackProductActivity = trpc.events.trackEvent.useMutation();

  const patch = (partial: Partial<CareSignalV2FormState>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const toggleArray = (key: "equipmentUnavailable" | "contributingFactors" | "systemGaps", item: string) => {
    setForm((prev) => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item],
      };
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefillEventType = params.get("prefill_eventType");
    const prefillOutcome = params.get("prefill_outcome");
    if (prefillEventType) {
      const typeMap: Record<string, string> = {
        cardiac_arrest: "cardiac_arrest",
        respiratory_failure: "respiratory_failure",
        septic_shock: "shock_sepsis",
        shock_other: "shock_sepsis",
        trauma: "severe_trauma",
      };
      patch({
        primaryEmergencyType: (typeMap[prefillEventType] ?? "metabolic_other") as CareSignalV2FormState["primaryEmergencyType"],
        reportType: "resuscitation_event",
      });
      if (prefillOutcome === "died") patch({ outcome: "died" });
      if (params.get("source") === "resusgps") {
        setPrefillBanner("Pre-filled from ResusGPS. Complete timeline, delays, and system actions for QI.");
      }
    }
  }, []);

  const progressPct = ((step + 1) / STEPS.length) * 100;
  const isSystemsOnly = form.reportType === "systems_concern";
  const skipPatientDetail = isSystemsOnly || form.reportType === "near_miss";

  const handleNext = () => {
    setError("");
    if (step === 0 && !facility?.facilityId) {
      setError("Select the facility where care was delivered.");
      return;
    }
    const msg = validateCareSignalV2Step(step, form);
    if (msg) {
      setError(msg);
      return;
    }
    if (step === 1 && isSystemsOnly) {
      setStep(6);
      return;
    }
    if (step === 2 && skipPatientDetail) {
      setStep(6);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError("");
    if (step === 6 && isSystemsOnly) {
      setStep(1);
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    setError("");
    if (!facility?.facilityId) {
      setError("Select a facility.");
      return;
    }
    const msg = validateCareSignalV2Step(6, form);
    if (msg) {
      setError(msg);
      return;
    }
    try {
      const payload = buildCareSignalV2SubmitPayload(form, facility);
      const result = await submitMutation.mutateAsync(payload);
      trackProductActivity.mutate({
        eventType: "care_signal",
        eventName: "Care Signal v2 submitted",
        pageUrl: "/care-signal",
        sessionId: getAnalyticsSessionId(),
        eventData: { eventId: result.eventId, formVersion: "v2" },
      });
      setSubmittedData({
        eventDate: payload.eventDate,
        childAge: payload.childAge,
        isAnonymous: payload.isAnonymous,
        eventType: payload.eventType,
        systemGaps: payload.systemGaps,
        recommendations: result.recommendations ?? [],
        eventId: result.eventId,
        timestamp: result.timestamp,
      });
      setShowConfirmation(true);
      setForm(initialCareSignalV2State());
      setStep(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    }
  };

  return (
    <>
      <SubmissionConfirmationModal
        isOpen={showConfirmation}
        isProvider={true}
        data={submittedData ?? { eventDate: new Date().toISOString(), childAge: 0, isAnonymous: false }}
        onClose={() => setShowConfirmation(false)}
      />

      <Card className="border-brand-teal/20 shadow-lg">
        <CardHeader className="border-b border-slate-200/80 bg-brand-surface dark:bg-card">
          <div className="flex items-start gap-3">
            <Heart className="h-8 w-8 text-brand-teal shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-semibold text-foreground">
                Report for every child who matters
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-slate-800 dark:text-slate-200 [&_strong]:text-foreground">
                Structured reporting so your facility, county, and national partners can act on{" "}
                <strong>preventable harm</strong> — not just checklists. Typical time: 8–12 minutes.
              </CardDescription>
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-800 dark:text-slate-200">
              <span>
                Step {step + 1} of {STEPS.length}: {STEPS[step]?.title}
              </span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6 text-slate-800">
          {prefillBanner ? (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">{prefillBanner}</AlertDescription>
            </Alert>
          ) : null}

          {step === 0 ? (
            <div className="space-y-4">
              <Alert className="border-teal-300 bg-teal-50 shadow-sm dark:border-teal-800 dark:bg-teal-950/60 [&_[data-slot=alert-description]]:text-slate-900 [&_[data-slot=alert-description]]:dark:text-slate-100">
                <Shield className="h-4 w-4 text-brand-teal shrink-0" aria-hidden />
                <AlertDescription className="text-sm text-slate-900 dark:text-slate-100 [&_strong]:font-semibold [&_strong]:text-foreground">
                  Reports aggregate by <strong>facility, county, and country</strong>. No patient names
                  or identifiers — focus on systems that failed or saved a life.
                </AlertDescription>
              </Alert>
              <FacilityPicker value={facility} onChange={setFacility} required />
              <div>
                <Label>Date & time of event (or systems concern)</Label>
                <Input
                  type="datetime-local"
                  value={form.eventDate}
                  onChange={(e) => patch({ eventDate: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="anon-v2"
                  checked={form.isAnonymous}
                  onCheckedChange={(v) => patch({ isAnonymous: Boolean(v) })}
                />
                <Label htmlFor="anon-v2" className="font-normal cursor-pointer">
                  Submit anonymously (your identity is not stored on this report)
                </Label>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <Label>What are you reporting?</Label>
              <RadioGroup
                value={form.reportType}
                onValueChange={(v) => patch({ reportType: v as CareSignalV2FormState["reportType"] })}
                className="space-y-3"
              >
                {REPORT_TYPE_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    className={cn(
                      CS_OPTION,
                      form.reportType === opt.value &&
                        "border-brand-teal/50 bg-teal-50 ring-1 ring-brand-teal/25",
                    )}
                  >
                    <RadioGroupItem value={opt.value} id={opt.value} className="mt-1" />
                    <Label htmlFor={opt.value} className="font-normal cursor-pointer flex-1">
                      <span className="font-medium block text-slate-900">{opt.label}</span>
                      <span className="text-xs text-slate-600 leading-snug">{opt.hint}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <div>
                <Label>Where did care take place?</Label>
                <Select
                  value={form.careLocation}
                  onValueChange={(v) =>
                    patch({ careLocation: v as CareSignalV2FormState["careLocation"] })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARE_LOCATION_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.careLocation === "other_hospital_area" ? (
                <Input
                  placeholder="Describe location"
                  value={form.careLocationOther}
                  onChange={(e) => patch({ careLocationOther: e.target.value })}
                />
              ) : null}
            </div>
          ) : null}

          {step === 2 && !isSystemsOnly ? (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Patient age group</Label>
                  <Select
                    value={form.ageBand}
                    onValueChange={(v) => patch({ ageBand: v as SafeTruthAgeBand })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neonate">Neonate (0–28 days)</SelectItem>
                      <SelectItem value="infant">Infant (1–12 months)</SelectItem>
                      <SelectItem value="child">Child (1 year+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Weight (kg, optional)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    placeholder="e.g. 12"
                    value={form.weightKg}
                    onChange={(e) => patch({ weightKg: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              {form.reportType !== "near_miss" ? (
                <>
                  <div>
                    <Label>Primary emergency type</Label>
                    <Select
                      value={form.primaryEmergencyType}
                      onValueChange={(v) =>
                        patch({
                          primaryEmergencyType: v as CareSignalV2FormState["primaryEmergencyType"],
                        })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMERGENCY_TYPE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : null}
              <div>
                <Label>
                  {isSystemsOnly
                    ? "Describe the systems concern"
                    : "What happened? (brief clinical summary)"}
                </Label>
                <Textarea
                  className="mt-1 min-h-[100px]"
                  placeholder="Example: 3-year-old with fever and lethargy; delayed fluids; arrested on ward..."
                  value={form.presentationSummary}
                  onChange={(e) => patch({ presentationSummary: e.target.value })}
                />
              </div>
            </div>
          ) : null}

          {step === 2 && isSystemsOnly ? (
            <div>
              <Label>Describe the systems concern affecting children&apos;s care</Label>
              <Textarea
                className="mt-1 min-h-[120px]"
                placeholder="Recurring gap, policy failure, equipment stock-out pattern..."
                value={form.presentationSummary}
                onChange={(e) => patch({ presentationSummary: e.target.value })}
              />
            </div>
          ) : null}

          {step === 3 && !skipPatientDetail ? (
            <div className="space-y-5">
              <p className="text-sm text-slate-600">
                Delays are the strongest signal for county and national QI — estimate honestly.
              </p>
              {(
                [
                  ["recognitionDelay", "Delay from child unwell → first staff recognised emergency"],
                  ["firstProviderAssessmentDelay", "Delay to first doctor/nurse assessment"],
                  ["codeTeamActivationDelay", "Delay to code team / resuscitation team activation"],
                  ["definitiveCareDelay", "Delay to definitive treatment (fluids, airway, etc.)"],
                ] as const
              ).map(([field, label]) => (
                <div key={field}>
                  <Label className="text-sm">{label}</Label>
                  <Select
                    value={form[field]}
                    onValueChange={(v) => patch({ [field]: v } as Partial<CareSignalV2FormState>)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DELAY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.transferRequired}
                  onCheckedChange={(v) => patch({ transferRequired: Boolean(v) })}
                  id="transfer"
                />
                <Label htmlFor="transfer">Transfer to another facility was required</Label>
              </div>
              {form.transferRequired ? (
                <div>
                  <Label>Transfer delay</Label>
                  <Select
                    value={form.transferDelay}
                    onValueChange={(v) =>
                      patch({ transferDelay: v as CareSignalV2FormState["recognitionDelay"] })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DELAY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 4 && !skipPatientDetail ? (
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">Chain of survival (check all that occurred)</Label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {(
                    [
                      ["recognition", "Early recognition"],
                      ["activation", "Help / code team activated"],
                      ["cpr", "CPR performed"],
                      ["defibrillation", "Defibrillation"],
                      ["postResuscitationCare", "Post-resuscitation care"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={key}
                        checked={form[key]}
                        onCheckedChange={(v) => patch({ [key]: Boolean(v) } as Partial<CareSignalV2FormState>)}
                      />
                      <Label htmlFor={key} className="font-normal text-sm">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              {form.cpr ? (
                <div>
                  <Label>Was CPR quality adequate?</Label>
                  <RadioGroup
                    value={
                      form.cprQualityAdequate === true
                        ? "yes"
                        : form.cprQualityAdequate === false
                          ? "no"
                          : ""
                    }
                    onValueChange={(v) =>
                      patch({ cprQualityAdequate: v === "yes" ? true : v === "no" ? false : null })
                    }
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="cpr-y" />
                      <Label htmlFor="cpr-y">Yes</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="cpr-n" />
                      <Label htmlFor="cpr-n">No</Label>
                    </div>
                  </RadioGroup>
                </div>
              ) : null}
              <div className="grid sm:grid-cols-2 gap-3">
                {(
                  [
                    ["advancedAirway", "Advanced airway"],
                    ["ivAccessEstablished", "IV / IO access"],
                    ["criticalMedsGiven", "Critical medications given"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      checked={form[key]}
                      onCheckedChange={(v) => patch({ [key]: Boolean(v) } as Partial<CareSignalV2FormState>)}
                    />
                    <Label className="font-normal text-sm">{label}</Label>
                  </div>
                ))}
              </div>
              <div>
                <Label className="mb-2 block">Equipment / resources NOT available when needed</Label>
                <div className={cn("grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto", CS_CHECK_GRID)}>
                  {EQUIPMENT_CHECKLIST.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <Checkbox
                        id={`eq-${item}`}
                        checked={form.equipmentUnavailable.includes(item)}
                        onCheckedChange={() => toggleArray("equipmentUnavailable", item)}
                      />
                      <Label htmlFor={`eq-${item}`} className="font-normal text-xs leading-tight text-slate-700">
                        {item}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Staffing adequate for acuity?</Label>
                  <Select
                    value={form.staffingAdequate}
                    onValueChange={(v) =>
                      patch({ staffingAdequate: v as CareSignalV2FormState["staffingAdequate"] })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Paediatric protocol followed?</Label>
                  <Select
                    value={form.protocolFollowed}
                    onValueChange={(v) =>
                      patch({ protocolFollowed: v as CareSignalV2FormState["protocolFollowed"] })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="partial">Partially</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : null}

          {step === 5 && !skipPatientDetail ? (
            <div className="space-y-4">
              <div>
                <Label>Outcome for the child</Label>
                <RadioGroup
                  value={form.outcome}
                  onValueChange={(v) => patch({ outcome: v })}
                  className="space-y-2 mt-2"
                >
                  {OUTCOME_OPTIONS.map((o) => (
                    <div key={o.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={o.value} id={`out-${o.value}`} />
                      <Label htmlFor={`out-${o.value}`} className="font-normal">
                        {o.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              {form.outcome && form.outcome !== "died" ? (
                <div>
                  <Label>Neurological status at last assessment</Label>
                  <Select
                    value={form.neurologicalStatus}
                    onValueChange={(v) => patch({ neurologicalStatus: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {NEURO_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {(form.outcome === "died" || form.reportType === "resuscitation_event") &&
              form.cpr ? (
                <div>
                  <Label>Return of spontaneous circulation (ROSC)?</Label>
                  <RadioGroup
                    value={
                      form.roscAchieved === true ? "yes" : form.roscAchieved === false ? "no" : ""
                    }
                    onValueChange={(v) =>
                      patch({ roscAchieved: v === "yes" ? true : v === "no" ? false : null })
                    }
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="rosc-y" />
                      <Label htmlFor="rosc-y">Yes</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="rosc-n" />
                      <Label htmlFor="rosc-n">No</Label>
                    </div>
                  </RadioGroup>
                </div>
              ) : null}
              <div>
                <Label>Was this death or serious harm potentially preventable?</Label>
                <RadioGroup
                  value={form.preventableAssessment}
                  onValueChange={(v) =>
                    patch({ preventableAssessment: v as CareSignalV2FormState["preventableAssessment"] })
                  }
                  className="space-y-2 mt-2"
                >
                  {PREVENTABLE_OPTIONS.map((o) => (
                    <div key={o.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={o.value} id={`prev-${o.value}`} />
                      <Label htmlFor={`prev-${o.value}`} className="font-normal text-sm">
                        {o.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label>Contributing factors (select all that apply)</Label>
                <div className={cn("grid sm:grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto", CS_CHECK_GRID)}>
                  {CONTRIBUTING_FACTORS.map((f) => (
                    <div key={f} className="flex items-start gap-2">
                      <Checkbox
                        checked={form.contributingFactors.includes(f)}
                        onCheckedChange={() => toggleArray("contributingFactors", f)}
                      />
                      <Label className="font-normal text-xs text-slate-700">{f}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 6 ? (
            <div className="space-y-5">
              <div>
                <Label>System gap categories (select all that apply)</Label>
                <div className="grid sm:grid-cols-2 gap-2 mt-2">
                  {SYSTEM_GAP_CATEGORIES.map((g) => (
                    <div key={g} className="flex items-center gap-2">
                      <Checkbox
                        checked={form.systemGaps.includes(g)}
                        onCheckedChange={() => toggleArray("systemGaps", g)}
                      />
                      <Label className="font-normal text-sm">{g}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>
                  One system change that could save the next child{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  className="mt-1 min-h-[90px]"
                  placeholder="Be specific: e.g. paediatric emergency trolley audit every Monday; mandatory rapid response activation criteria on wards..."
                  value={form.proposedSystemFix}
                  onChange={(e) => patch({ proposedSystemFix: e.target.value })}
                />
              </div>
              <div>
                <Label>Lessons learned (optional)</Label>
                <Textarea
                  className="mt-1"
                  placeholder="What will you or your team do differently?"
                  value={form.lessonsLearned}
                  onChange={(e) => patch({ lessonsLearned: e.target.value })}
                />
              </div>
              <div>
                <Label>Debrief / M&M review</Label>
                <Select
                  value={form.debriefConducted}
                  onValueChange={(v) =>
                    patch({ debriefConducted: v as CareSignalV2FormState["debriefConducted"] })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Debrief completed</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="no">Not yet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 0}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex-1 bg-brand-teal hover:bg-[#143333] text-white"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="flex-1 bg-brand-teal hover:bg-[#143333]"
              >
                {submitMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit Care Signal
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
