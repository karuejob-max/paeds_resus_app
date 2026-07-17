/**
 * Safe-Truth v1 — the caregiver-facing form.
 * Spec: docs/EVENT_MODELS_V1.md §2 (gap-analysis queue item #11, Phase B).
 *
 * No account, ever (§2.2) — every request this page makes goes through
 * `trpc.safeTruthV1`, which is entirely `publicProcedure` (see
 * server/routers/safe-truth-v1.ts). The device-local disclaimer
 * acknowledgment mirrors gap-analysis #10's token-storage approach — no
 * server-side identity, ever.
 *
 * Visual tone is deliberately distinct from Care Signal (§2.1: "warmer,
 * less clinical") — see the safetruth-* color tokens in index.css. This is
 * a form for a parent describing what happened to their child, not a
 * provider filing an incident report; the design leans on warmth,
 * generous spacing, and plain language rather than clinical density.
 *
 * SCOPE NOTE: facility_name_raw is plain free text here. §2.3 mentions
 * "autocomplete suggestions from the facility reference table" as a nice
 * -to-have; that would need its own public facility-search endpoint and
 * is deferred, not silently dropped — flagged in WORK_STATUS.md.
 */
import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Heart, Phone } from "lucide-react";
import {
  SAFE_TRUTH_COUNTRIES,
  FACILITY_LEVEL_OPTIONS,
  CHILD_AGE_BAND_OPTIONS,
  CONDITION_CATEGORY_OPTIONS,
  OUTCOME_CATEGORY_OPTIONS,
  SYMPTOM_ONSET_OPTIONS,
  DANGER_SIGN_OPTIONS,
  ADVICE_RECEIVED_OPTIONS,
  TRANSPORT_USED_OPTIONS,
  TRAVEL_TIME_OPTIONS,
  FACILITIES_VISITED_COUNT_OPTIONS,
  WAS_SEEN_PROMPTLY_OPTIONS,
  INFORMATION_RECEIVED_OPTIONS,
  FAMILY_INVOLVEMENT_OPTIONS,
  OVERALL_EXPERIENCE_RATING_OPTIONS,
  type SafeTruthFacilityVisitInput,
} from "@shared/safe-truth-v1";
import {
  getOrCreateDeviceSessionId,
  hasAcknowledgedDisclaimer,
  markDisclaimerAcknowledged,
} from "@/lib/safe-truth-disclaimer-storage";

type Step =
  | "disclaimer"
  | "narrative"
  | "basics"
  | "before"
  | "journey"
  | "visits"
  | "after"
  | "success";

const STEP_ORDER: Step[] = ["narrative", "basics", "before", "journey", "visits", "after"];

function emptyVisit(): SafeTruthFacilityVisitInput {
  return {
    visitFacilityNameRaw: "",
    visitFacilityIsFinal: false,
    wasSeenPromptly: WAS_SEEN_PROMPTLY_OPTIONS[0],
    turnedAwayReason: undefined,
    informationReceived: undefined,
    familyInvolvement: undefined,
    visitExperienceRaw: undefined,
    dangerSignAdviceAtDischarge: undefined,
  };
}

function initialFormState() {
  return {
    rawNarrative: "",
    country: "Kenya" as string,
    adminLevel1: "",
    adminLevel2: "",
    facilityNameRaw: "",
    facilityLevel: undefined as string | undefined,
    childAgeBand: undefined as string | undefined,
    conditionCategory: undefined as string | undefined,
    outcomeCategory: undefined as string | undefined,
    eventCodeEntered: "",
    symptomOnsetDaysAgo: undefined as string | undefined,
    firstSymptomNoticed: "",
    dangerSignsPresent: [] as string[],
    adviceReceivedBeforeFacility: [] as string[],
    adviceContentRaw: "",
    reassuredDespiteDanger: undefined as boolean | undefined,
    decisionToSeekCareTrigger: "",
    transportUsed: [] as string[],
    transportDelayOccurred: undefined as boolean | undefined,
    transportDelayReason: "",
    travelTimeToFirstFacility: undefined as string | undefined,
    costBarrierOccurred: undefined as boolean | undefined,
    costBarrierDetails: "",
    facilitiesVisitedCount: undefined as string | undefined,
    facilityVisits: [] as SafeTruthFacilityVisitInput[],
    followUpInstructionsReceived: undefined as boolean | undefined,
    ableToFollowInstructions: undefined as boolean | undefined,
    unableToFollowReason: "",
    overallExperienceRating: undefined as string | undefined,
    whatCouldHaveBeenBetter: "",
    website: "", // honeypot — a real caregiver never sees this field
  };
}

const CARD = "max-w-xl mx-auto bg-white/70 rounded-2xl shadow-sm border border-safetruth-amber/15 p-6 sm:p-8";
const HEADING = "text-2xl sm:text-3xl font-semibold text-safetruth-ink leading-snug";
const SUBTEXT = "text-safetruth-ink/70 text-[15px] leading-relaxed mt-2";
const LABEL = "text-sm font-medium text-safetruth-ink/90 block mb-2";
const OPTION_ROW = "flex items-start gap-3 rounded-xl border border-safetruth-ink/10 bg-white/60 px-4 py-3 cursor-pointer hover:bg-white transition-colors";

export default function SafeTruthV1() {
  const [step, setStep] = useState<Step>(hasAcknowledgedDisclaimer() ? "narrative" : "disclaimer");
  const [form, setForm] = useState(initialFormState());
  const [draftVisit, setDraftVisit] = useState<SafeTruthFacilityVisitInput>(emptyVisit());
  const [error, setError] = useState<string | null>(null);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  const deviceSessionId = useMemo(() => getOrCreateDeviceSessionId(), []);
  const ackDisclaimer = trpc.safeTruthV1.acknowledgeDisclaimer.useMutation();
  const geoLabels = trpc.safeTruthV1.getGeoLabels.useQuery({ country: form.country });
  const submit = trpc.safeTruthV1.submit.useMutation({
    onSuccess: (data) => {
      setSubmittedCode(data.submissionUuid.slice(0, 8).toUpperCase());
      setStep("success");
    },
    onError: (e) => setError(e.message || "Something went wrong. Please try again."),
  });

  function set<K extends keyof ReturnType<typeof initialFormState>>(
    key: K,
    value: ReturnType<typeof initialFormState>[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleInArray(key: "dangerSignsPresent" | "adviceReceivedBeforeFacility" | "transportUsed", value: string) {
    setForm((f) => {
      const arr = f[key];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...f, [key]: next };
    });
  }

  function currentIndex() {
    return STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]);
  }

  function goNext() {
    setError(null);
    const idx = currentIndex();
    if (idx === -1 || idx === STEP_ORDER.length - 1) return;
    setStep(STEP_ORDER[idx + 1]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setError(null);
    const idx = currentIndex();
    if (idx <= 0) return;
    setStep(STEP_ORDER[idx - 1]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addVisit() {
    if (!draftVisit.visitFacilityNameRaw.trim()) {
      setError("Please enter the facility name before adding it.");
      return;
    }
    setForm((f) => ({ ...f, facilityVisits: [...f.facilityVisits, draftVisit] }));
    setDraftVisit(emptyVisit());
    setError(null);
  }

  function removeVisit(idx: number) {
    setForm((f) => ({ ...f, facilityVisits: f.facilityVisits.filter((_, i) => i !== idx) }));
  }

  function validateBasics(): string | null {
    if (!form.adminLevel1.trim()) return `Please tell us the ${geoLabels.data?.adminLevel1Label.toLowerCase() ?? "county/area"}.`;
    if (!form.facilityNameRaw.trim()) return "Please tell us the name of the facility.";
    if (!form.childAgeBand) return "Please select your child's age.";
    if (!form.conditionCategory) return "Please select what kind of problem this was.";
    if (!form.outcomeCategory) return "Please select what happened in the end.";
    return null;
  }

  function validateBefore(): string | null {
    if (!form.symptomOnsetDaysAgo) return "Please tell us when the symptoms started.";
    if (form.adviceReceivedBeforeFacility.length === 0) return "Please select at least one option, even if it's \"I did not speak to anyone.\"";
    return null;
  }

  function validateJourney(): string | null {
    if (form.transportUsed.length === 0) return "Please select how you travelled.";
    if (form.transportDelayOccurred === undefined) return "Please let us know if there was any delay in transport.";
    if (!form.travelTimeToFirstFacility) return "Please select roughly how long the journey took.";
    if (form.costBarrierOccurred === undefined) return "Please let us know if cost was a barrier.";
    if (!form.facilitiesVisitedCount) return "Please select how many places you went to.";
    return null;
  }

  function handleNextFromStep(currentStep: Step) {
    let err: string | null = null;
    if (currentStep === "narrative" && form.rawNarrative.trim().length < 20) {
      err = "Please share a little more detail — at least a few sentences helps us understand what happened.";
    } else if (currentStep === "basics") {
      err = validateBasics();
    } else if (currentStep === "before") {
      err = validateBefore();
    } else if (currentStep === "journey") {
      err = validateJourney();
    }
    if (err) {
      setError(err);
      return;
    }
    goNext();
  }

  function handleFinalSubmit() {
    setError(null);
    submit.mutate({
      country: form.country,
      adminLevel1: form.adminLevel1,
      adminLevel2: form.adminLevel2 || undefined,
      facilityNameRaw: form.facilityNameRaw,
      facilityLevel: form.facilityLevel as never,
      childAgeBand: form.childAgeBand as never,
      conditionCategory: form.conditionCategory as never,
      outcomeCategory: form.outcomeCategory as never,
      eventCodeEntered: form.eventCodeEntered || undefined,
      symptomOnsetDaysAgo: form.symptomOnsetDaysAgo as never,
      firstSymptomNoticed: form.firstSymptomNoticed || undefined,
      dangerSignsPresent: form.dangerSignsPresent as never,
      adviceReceivedBeforeFacility: form.adviceReceivedBeforeFacility as never,
      adviceContentRaw: form.adviceContentRaw || undefined,
      reassuredDespiteDanger: form.reassuredDespiteDanger,
      decisionToSeekCareTrigger: form.decisionToSeekCareTrigger || undefined,
      transportUsed: form.transportUsed as never,
      transportDelayOccurred: Boolean(form.transportDelayOccurred),
      transportDelayReason: form.transportDelayReason || undefined,
      travelTimeToFirstFacility: form.travelTimeToFirstFacility as never,
      costBarrierOccurred: Boolean(form.costBarrierOccurred),
      costBarrierDetails: form.costBarrierDetails || undefined,
      facilitiesVisitedCount: form.facilitiesVisitedCount as never,
      facilityVisits: form.facilityVisits,
      followUpInstructionsReceived: form.followUpInstructionsReceived,
      ableToFollowInstructions: form.ableToFollowInstructions,
      unableToFollowReason: form.unableToFollowReason || undefined,
      overallExperienceRating: form.overallExperienceRating as never,
      whatCouldHaveBeenBetter: form.whatCouldHaveBeenBetter || undefined,
      rawNarrative: form.rawNarrative,
      website: form.website,
    });
  }

  useEffect(() => {
    // Reset admin_level_1 when the country changes, since options depend on it.
    set("adminLevel1", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.country]);

  if (step === "disclaimer") {
    return (
      <div className="min-h-screen bg-safetruth-cream flex items-center justify-center px-4 py-10">
        <div className={CARD}>
          <div className="flex items-center gap-2 text-safetruth-sage mb-4">
            <Heart className="h-5 w-5" />
            <span className="text-sm font-medium">Parent Safe-Truth</span>
          </div>
          <h1 className={HEADING}>Before we begin</h1>
          <p className={SUBTEXT}>
            This space is for sharing what happened when you sought care for your child — in your own words,
            with no account or sign-in needed. What you share here is not seen by any hospital.
          </p>
          <div className="mt-6 rounded-xl bg-safetruth-rose/10 border border-safetruth-rose/30 p-4 flex gap-3">
            <Phone className="h-5 w-5 text-safetruth-rose shrink-0 mt-0.5" />
            <p className="text-sm text-safetruth-ink/90 leading-relaxed">
              <strong>If your child needs urgent care right now, please call your local emergency number or go
              to the nearest hospital first.</strong> This form is for sharing your story afterwards — it is not
              monitored in real time and cannot send help.
            </p>
          </div>
          <p className="text-xs text-safetruth-ink/60 mt-4">
            I understand this is not for emergencies, and I would like to continue.
          </p>
          <Button
            className="w-full mt-3 bg-safetruth-amber hover:bg-safetruth-amber-hover text-white rounded-xl h-12 text-base"
            onClick={() => {
              markDisclaimerAcknowledged();
              ackDisclaimer.mutate({ deviceSessionId });
              setStep("narrative");
            }}
          >
            I understand — continue
          </Button>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-safetruth-cream flex items-center justify-center px-4 py-10">
        <div className={CARD + " text-center"}>
          <div className="mx-auto h-14 w-14 rounded-full bg-safetruth-sage/15 flex items-center justify-center mb-4">
            <Heart className="h-7 w-7 text-safetruth-sage" />
          </div>
          <h1 className={HEADING}>Thank you for sharing this</h1>
          <p className={SUBTEXT}>
            Your story has been recorded anonymously and will help improve care for other children.
          </p>
          {submittedCode && (
            <p className="text-xs text-safetruth-ink/50 mt-6">
              Reference code (for your own records, not required): <span className="font-mono">{submittedCode}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  const stepIdx = currentIndex();

  return (
    <div className="min-h-screen bg-safetruth-cream px-4 py-10">
      {/* Honeypot — invisible to real users, deliberately unlabeled */}
      <input
        type="text"
        value={form.website}
        onChange={(e) => set("website", e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />

      <div className="max-w-xl mx-auto mb-6 flex justify-center gap-1.5">
        {STEP_ORDER.map((s, i) => (
          <span
            key={s}
            className={`h-1.5 rounded-full transition-all ${i <= stepIdx ? "bg-safetruth-amber w-6" : "bg-safetruth-ink/15 w-3"}`}
          />
        ))}
      </div>

      <div className={CARD}>
        {step === "narrative" && (
          <>
            <h1 className={HEADING}>Tell us what happened</h1>
            <p className={SUBTEXT}>
              In your own words, please tell us what happened to your child, from when you first noticed
              something was wrong. There is no right way to write this.
            </p>
            <Textarea
              value={form.rawNarrative}
              onChange={(e) => set("rawNarrative", e.target.value)}
              placeholder="Start wherever feels right..."
              className="mt-5 min-h-[220px] text-base rounded-xl border-safetruth-ink/15 bg-white/80"
              maxLength={8000}
            />
            <p className="text-xs text-safetruth-ink/50 mt-2">
              Please avoid including your child's name or other identifying details.
            </p>
          </>
        )}

        {step === "basics" && (
          <>
            <h1 className={HEADING}>A few basic details</h1>
            <p className={SUBTEXT}>This helps us understand where and to whom this happened.</p>
            <div className="mt-6 space-y-5">
              <div>
                <label className={LABEL}>Country</label>
                <select
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  className="w-full rounded-xl border border-safetruth-ink/15 bg-white/80 h-11 px-3 text-sm"
                >
                  {SAFE_TRUTH_COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>{geoLabels.data?.adminLevel1Label ?? "County / area"}</label>
                {geoLabels.data?.adminLevel1Options ? (
                  <select
                    value={form.adminLevel1}
                    onChange={(e) => set("adminLevel1", e.target.value)}
                    className="w-full rounded-xl border border-safetruth-ink/15 bg-white/80 h-11 px-3 text-sm"
                  >
                    <option value="">Select one</option>
                    {geoLabels.data.adminLevel1Options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <Input value={form.adminLevel1} onChange={(e) => set("adminLevel1", e.target.value)} className="rounded-xl bg-white/80" />
                )}
              </div>
              <div>
                <label className={LABEL}>{geoLabels.data?.adminLevel2Label ?? "Locality / area"} (optional)</label>
                <Input value={form.adminLevel2} onChange={(e) => set("adminLevel2", e.target.value)} className="rounded-xl bg-white/80" />
              </div>
              <div>
                <label className={LABEL}>What is the facility called?</label>
                <Input
                  value={form.facilityNameRaw}
                  onChange={(e) => set("facilityNameRaw", e.target.value)}
                  placeholder="Type the name you know it by"
                  className="rounded-xl bg-white/80"
                />
              </div>
              <div>
                <label className={LABEL}>What kind of facility was it? (optional)</label>
                <select
                  value={form.facilityLevel ?? ""}
                  onChange={(e) => set("facilityLevel", e.target.value || undefined)}
                  className="w-full rounded-xl border border-safetruth-ink/15 bg-white/80 h-11 px-3 text-sm"
                >
                  <option value="">Not sure / prefer not to say</option>
                  {FACILITY_LEVEL_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Your child's age</label>
                <RadioGroup value={form.childAgeBand ?? ""} onValueChange={(v) => set("childAgeBand", v)} className="space-y-2">
                  {CHILD_AGE_BAND_OPTIONS.map((o) => (
                    <label key={o} className={OPTION_ROW}>
                      <RadioGroupItem value={o} className="mt-0.5" />
                      <span className="text-sm">{o}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <label className={LABEL}>What kind of problem was this?</label>
                <RadioGroup value={form.conditionCategory ?? ""} onValueChange={(v) => set("conditionCategory", v)} className="space-y-2">
                  {CONDITION_CATEGORY_OPTIONS.map((o) => (
                    <label key={o} className={OPTION_ROW}>
                      <RadioGroupItem value={o} className="mt-0.5" />
                      <span className="text-sm">{o}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <label className={LABEL}>What happened in the end?</label>
                <RadioGroup value={form.outcomeCategory ?? ""} onValueChange={(v) => set("outcomeCategory", v)} className="space-y-2">
                  {OUTCOME_CATEGORY_OPTIONS.map((o) => (
                    <label key={o} className={OPTION_ROW}>
                      <RadioGroupItem value={o} className="mt-0.5" />
                      <span className="text-sm">{o}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <label className={LABEL}>Do you have a code from a healthcare worker's report of this same event? (optional)</label>
                <Input
                  value={form.eventCodeEntered}
                  onChange={(e) => set("eventCodeEntered", e.target.value)}
                  placeholder="Leave blank if you don't have one"
                  className="rounded-xl bg-white/80"
                />
              </div>
            </div>
          </>
        )}

        {step === "before" && (
          <>
            <h1 className={HEADING}>Before you sought care</h1>
            <p className={SUBTEXT}>A few questions about the time before you got to a facility.</p>
            <div className="mt-6 space-y-5">
              <div>
                <label className={LABEL}>When did the symptoms start?</label>
                <RadioGroup value={form.symptomOnsetDaysAgo ?? ""} onValueChange={(v) => set("symptomOnsetDaysAgo", v)} className="space-y-2">
                  {SYMPTOM_ONSET_OPTIONS.map((o) => (
                    <label key={o} className={OPTION_ROW}>
                      <RadioGroupItem value={o} className="mt-0.5" />
                      <span className="text-sm">{o}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <label className={LABEL}>What was the first thing you noticed? (optional)</label>
                <Textarea value={form.firstSymptomNoticed} onChange={(e) => set("firstSymptomNoticed", e.target.value)} className="rounded-xl bg-white/80" />
              </div>
              <div>
                <label className={LABEL}>Did you notice any of these? (select all that apply, optional)</label>
                <div className="space-y-2">
                  {DANGER_SIGN_OPTIONS.map((o) => (
                    <label key={o} className={OPTION_ROW}>
                      <Checkbox checked={form.dangerSignsPresent.includes(o)} onCheckedChange={() => toggleInArray("dangerSignsPresent", o)} className="mt-0.5" />
                      <span className="text-sm">{o}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={LABEL}>Did you speak to anyone before going to a facility?</label>
                <div className="space-y-2">
                  {ADVICE_RECEIVED_OPTIONS.map((o) => (
                    <label key={o} className={OPTION_ROW}>
                      <Checkbox checked={form.adviceReceivedBeforeFacility.includes(o)} onCheckedChange={() => toggleInArray("adviceReceivedBeforeFacility", o)} className="mt-0.5" />
                      <span className="text-sm">{o}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={LABEL}>What did they tell you? (optional)</label>
                <Textarea value={form.adviceContentRaw} onChange={(e) => set("adviceContentRaw", e.target.value)} className="rounded-xl bg-white/80" />
              </div>
              <div>
                <label className={LABEL}>Were you reassured, even though something felt wrong? (optional)</label>
                <RadioGroup
                  value={form.reassuredDespiteDanger === undefined ? "" : String(form.reassuredDespiteDanger)}
                  onValueChange={(v) => set("reassuredDespiteDanger", v === "true")}
                  className="flex gap-3"
                >
                  <label className={OPTION_ROW}><RadioGroupItem value="true" /><span className="text-sm">Yes</span></label>
                  <label className={OPTION_ROW}><RadioGroupItem value="false" /><span className="text-sm">No</span></label>
                </RadioGroup>
              </div>
              <div>
                <label className={LABEL}>What made you decide it was time to seek care? (optional)</label>
                <Textarea value={form.decisionToSeekCareTrigger} onChange={(e) => set("decisionToSeekCareTrigger", e.target.value)} className="rounded-xl bg-white/80" />
              </div>
            </div>
          </>
        )}

        {step === "journey" && (
          <>
            <h1 className={HEADING}>Getting to care</h1>
            <p className={SUBTEXT}>How you and your child travelled to get help.</p>
            <div className="mt-6 space-y-5">
              <div>
                <label className={LABEL}>How did you travel? (select all that apply)</label>
                <div className="space-y-2">
                  {TRANSPORT_USED_OPTIONS.map((o) => (
                    <label key={o} className={OPTION_ROW}>
                      <Checkbox checked={form.transportUsed.includes(o)} onCheckedChange={() => toggleInArray("transportUsed", o)} className="mt-0.5" />
                      <span className="text-sm">{o}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={LABEL}>Was there any delay in getting transport?</label>
                <RadioGroup
                  value={form.transportDelayOccurred === undefined ? "" : String(form.transportDelayOccurred)}
                  onValueChange={(v) => set("transportDelayOccurred", v === "true")}
                  className="flex gap-3"
                >
                  <label className={OPTION_ROW}><RadioGroupItem value="true" /><span className="text-sm">Yes</span></label>
                  <label className={OPTION_ROW}><RadioGroupItem value="false" /><span className="text-sm">No</span></label>
                </RadioGroup>
              </div>
              {form.transportDelayOccurred && (
                <div>
                  <label className={LABEL}>What caused the delay? (optional)</label>
                  <Textarea value={form.transportDelayReason} onChange={(e) => set("transportDelayReason", e.target.value)} className="rounded-xl bg-white/80" />
                </div>
              )}
              <div>
                <label className={LABEL}>How long did it take to reach the first facility?</label>
                <RadioGroup value={form.travelTimeToFirstFacility ?? ""} onValueChange={(v) => set("travelTimeToFirstFacility", v)} className="space-y-2">
                  {TRAVEL_TIME_OPTIONS.map((o) => (
                    <label key={o} className={OPTION_ROW}>
                      <RadioGroupItem value={o} className="mt-0.5" />
                      <span className="text-sm">{o}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <label className={LABEL}>Was cost a barrier at any point?</label>
                <RadioGroup
                  value={form.costBarrierOccurred === undefined ? "" : String(form.costBarrierOccurred)}
                  onValueChange={(v) => set("costBarrierOccurred", v === "true")}
                  className="flex gap-3"
                >
                  <label className={OPTION_ROW}><RadioGroupItem value="true" /><span className="text-sm">Yes</span></label>
                  <label className={OPTION_ROW}><RadioGroupItem value="false" /><span className="text-sm">No</span></label>
                </RadioGroup>
              </div>
              {form.costBarrierOccurred && (
                <div>
                  <label className={LABEL}>Please describe (optional)</label>
                  <Textarea value={form.costBarrierDetails} onChange={(e) => set("costBarrierDetails", e.target.value)} className="rounded-xl bg-white/80" />
                </div>
              )}
              <div>
                <label className={LABEL}>How many places did you go to in total?</label>
                <RadioGroup value={form.facilitiesVisitedCount ?? ""} onValueChange={(v) => set("facilitiesVisitedCount", v)} className="space-y-2">
                  {FACILITIES_VISITED_COUNT_OPTIONS.map((o) => (
                    <label key={o} className={OPTION_ROW}>
                      <RadioGroupItem value={o} className="mt-0.5" />
                      <span className="text-sm">{o}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </>
        )}

        {step === "visits" && (
          <>
            <h1 className={HEADING}>Each place you visited</h1>
            <p className={SUBTEXT}>
              If you'd like, tell us about each facility separately. This step is optional — you can skip it and
              move on.
            </p>
            <div className="mt-6 space-y-3">
              {form.facilityVisits.map((v, i) => (
                <div key={i} className="rounded-xl border border-safetruth-ink/15 bg-white/70 p-3 flex justify-between items-center">
                  <span className="text-sm">{i + 1}. {v.visitFacilityNameRaw}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeVisit(i)}>Remove</Button>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-dashed border-safetruth-amber/40 p-4 space-y-4">
              <div>
                <label className={LABEL}>Facility name</label>
                <Input
                  value={draftVisit.visitFacilityNameRaw}
                  onChange={(e) => setDraftVisit((d) => ({ ...d, visitFacilityNameRaw: e.target.value }))}
                  className="rounded-xl bg-white/80"
                />
              </div>
              <div>
                <label className={LABEL}>Were you seen promptly?</label>
                <RadioGroup
                  value={draftVisit.wasSeenPromptly}
                  onValueChange={(v) => setDraftVisit((d) => ({ ...d, wasSeenPromptly: v as typeof d.wasSeenPromptly }))}
                  className="space-y-2"
                >
                  {WAS_SEEN_PROMPTLY_OPTIONS.map((o) => (
                    <label key={o} className={OPTION_ROW}>
                      <RadioGroupItem value={o} className="mt-0.5" />
                      <span className="text-sm">{o}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
              {draftVisit.wasSeenPromptly === "We were turned away" && (
                <div>
                  <label className={LABEL}>What reason were you given? (optional)</label>
                  <Textarea
                    value={draftVisit.turnedAwayReason ?? ""}
                    onChange={(e) => setDraftVisit((d) => ({ ...d, turnedAwayReason: e.target.value }))}
                    className="rounded-xl bg-white/80"
                  />
                </div>
              )}
              <div>
                <label className={LABEL}>How much were you told about what was wrong? (optional)</label>
                <select
                  value={draftVisit.informationReceived ?? ""}
                  onChange={(e) => setDraftVisit((d) => ({ ...d, informationReceived: (e.target.value || undefined) as typeof d.informationReceived }))}
                  className="w-full rounded-xl border border-safetruth-ink/15 bg-white/80 h-11 px-3 text-sm"
                >
                  <option value="">Prefer not to say</option>
                  {INFORMATION_RECEIVED_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Were you kept involved in decisions? (optional)</label>
                <select
                  value={draftVisit.familyInvolvement ?? ""}
                  onChange={(e) => setDraftVisit((d) => ({ ...d, familyInvolvement: (e.target.value || undefined) as typeof d.familyInvolvement }))}
                  className="w-full rounded-xl border border-safetruth-ink/15 bg-white/80 h-11 px-3 text-sm"
                >
                  <option value="">Prefer not to say</option>
                  {FAMILY_INVOLVEMENT_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Anything else about this visit? (optional)</label>
                <Textarea
                  value={draftVisit.visitExperienceRaw ?? ""}
                  onChange={(e) => setDraftVisit((d) => ({ ...d, visitExperienceRaw: e.target.value }))}
                  className="rounded-xl bg-white/80"
                />
              </div>
              <Button variant="outline" className="w-full rounded-xl" onClick={addVisit}>
                Add this facility visit
              </Button>
            </div>
          </>
        )}

        {step === "after" && (
          <>
            <h1 className={HEADING}>After the care</h1>
            <p className={SUBTEXT}>A few last questions, then you're done.</p>
            <div className="mt-6 space-y-5">
              <div>
                <label className={LABEL}>Did you receive instructions for what to do afterwards? (optional)</label>
                <RadioGroup
                  value={form.followUpInstructionsReceived === undefined ? "" : String(form.followUpInstructionsReceived)}
                  onValueChange={(v) => set("followUpInstructionsReceived", v === "true")}
                  className="flex gap-3"
                >
                  <label className={OPTION_ROW}><RadioGroupItem value="true" /><span className="text-sm">Yes</span></label>
                  <label className={OPTION_ROW}><RadioGroupItem value="false" /><span className="text-sm">No</span></label>
                </RadioGroup>
              </div>
              <div>
                <label className={LABEL}>Were you able to follow them? (optional)</label>
                <RadioGroup
                  value={form.ableToFollowInstructions === undefined ? "" : String(form.ableToFollowInstructions)}
                  onValueChange={(v) => set("ableToFollowInstructions", v === "true")}
                  className="flex gap-3"
                >
                  <label className={OPTION_ROW}><RadioGroupItem value="true" /><span className="text-sm">Yes</span></label>
                  <label className={OPTION_ROW}><RadioGroupItem value="false" /><span className="text-sm">No</span></label>
                </RadioGroup>
              </div>
              {form.ableToFollowInstructions === false && (
                <div>
                  <label className={LABEL}>What made that difficult? (optional)</label>
                  <Textarea value={form.unableToFollowReason} onChange={(e) => set("unableToFollowReason", e.target.value)} className="rounded-xl bg-white/80" />
                </div>
              )}
              <div>
                <label className={LABEL}>Overall, how was the care? (optional)</label>
                <RadioGroup value={form.overallExperienceRating ?? ""} onValueChange={(v) => set("overallExperienceRating", v)} className="space-y-2">
                  {OVERALL_EXPERIENCE_RATING_OPTIONS.map((o) => (
                    <label key={o} className={OPTION_ROW}>
                      <RadioGroupItem value={o} className="mt-0.5" />
                      <span className="text-sm">{o}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <label className={LABEL}>What could have been better? (optional)</label>
                <Textarea value={form.whatCouldHaveBeenBetter} onChange={(e) => set("whatCouldHaveBeenBetter", e.target.value)} className="rounded-xl bg-white/80" />
              </div>
            </div>
          </>
        )}

        {error && <p className="text-sm text-safetruth-rose mt-4">{error}</p>}

        <div className="flex gap-3 mt-8">
          {stepIdx > 0 && (
            <Button variant="ghost" className="rounded-xl" onClick={goBack} disabled={submit.isPending}>
              Back
            </Button>
          )}
          {step !== "after" ? (
            <Button
              className="flex-1 bg-safetruth-amber hover:bg-safetruth-amber-hover text-white rounded-xl h-12"
              onClick={() => handleNextFromStep(step)}
            >
              Continue
            </Button>
          ) : (
            <Button
              className="flex-1 bg-safetruth-amber hover:bg-safetruth-amber-hover text-white rounded-xl h-12"
              onClick={handleFinalSubmit}
              disabled={submit.isPending}
            >
              {submit.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</> : "Share my story"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
