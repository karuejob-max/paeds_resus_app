/**
 * ParentSafeTruthForm — Full End-to-End Journey Wizard (8 steps)
 *
 * Step 0: Which facility?
 * Step 1: About the child & outcome
 * Step 2: Symptom onset & home decision (PRE-HOSPITAL)
 * Step 3: Getting to care — transport & ambulance (PRE-HOSPITAL)
 * Step 4: Prior facility stops — referral chain (PRE-HOSPITAL)
 * Step 5: Arrival at this facility — front-door journey
 * Step 6: Specific system gaps at this facility
 * Step 7: Your identity (anonymous or named)
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDebounce } from "@/hooks/useDebounce";

// ─── Types ────────────────────────────────────────────────────────────────────
type Outcome = "discharged" | "referred" | "passed-away";

type EventType =
  | "arrival"
  | "symptoms"
  | "doctor-seen"
  | "intervention"
  | "oxygen"
  | "communication"
  | "fluids"
  | "concern-raised"
  | "monitoring"
  | "medication"
  | "referral-decision"
  | "referral-organized"
  | "transferred"
  | "update";

interface TimelineEvent {
  eventType: EventType;
  time: string;
  description: string;
}

interface FacilityResult {
  id: number;
  name: string;
  badge: string;
  county: string;
}

interface PriorFacilityStop {
  name: string;
  type: string;         // "dispensary" | "health-centre" | "sub-county-hospital" | "county-hospital" | "private" | "other"
  reasonLeft: string;   // "no-equipment" | "no-specialist" | "no-blood" | "no-space" | "self-referred" | "advised-to-go" | "other"
  timeSpentBand: string; // "under-30m" | "30m-2h" | "2h-6h" | "over-6h"
}

interface FormState {
  // Step 0 — Facility
  facilityId: number | null;
  facilityName: string;
  facilityFreeText: string;
  facilityNotListed: boolean;

  // Step 1 — Child & Outcome
  childAge: string;
  childOutcome: Outcome | "";
  arrivalDate: string;
  arrivalTime: string;

  // Step 2 — Symptom onset & home decision
  symptomOnsetDate: string;
  decisionDelayBand: string;
  decisionDelayReasons: string[];

  // Step 3 — Transport
  transportMode: string;
  transportDurationBand: string;
  ambulanceCalled: boolean | null;
  ambulanceWaitBand: string;

  // Step 4 — Prior facility stops
  priorFacilityVisit: boolean | null;
  priorFacilityChain: PriorFacilityStop[];
  referralReason: string;

  // Step 5 — Front-door journey at this facility
  shift: "morning" | "afternoon" | "night" | "";
  registrationBeforeTriage: boolean | null;
  whereDelayHappened: string[];
  timeToBeSeenBand: string;
  timeToInterventionBand: string;

  // Step 6 — Specific gaps
  systemGaps: string[];
  equipmentMissing: string;
  staffingDetail: string;
  communicationDetail: string;
  otherDetail: string;

  // Step 7 — Identity
  isAnonymous: boolean;
  parentName: string;
  parentEmail: string;
}

const INITIAL_STATE: FormState = {
  facilityId: null,
  facilityName: "",
  facilityFreeText: "",
  facilityNotListed: false,
  childAge: "",
  childOutcome: "",
  arrivalDate: new Date().toISOString().split("T")[0],
  arrivalTime: "",
  symptomOnsetDate: "",
  decisionDelayBand: "",
  decisionDelayReasons: [],
  transportMode: "",
  transportDurationBand: "",
  ambulanceCalled: null,
  ambulanceWaitBand: "",
  priorFacilityVisit: null,
  priorFacilityChain: [],
  referralReason: "",
  shift: "",
  registrationBeforeTriage: null,
  whereDelayHappened: [],
  timeToBeSeenBand: "",
  timeToInterventionBand: "",
  systemGaps: [],
  equipmentMissing: "",
  staffingDetail: "",
  communicationDetail: "",
  otherDetail: "",
  isAnonymous: true,
  parentName: "",
  parentEmail: "",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function bandToMinutes(band: string): number {
  if (band === "under-5") return 3;
  if (band === "5-10") return 7;
  if (band === "10-20") return 15;
  if (band === "20-30") return 25;
  return 45;
}

function decisionBandToMinutes(band: string): number {
  if (band === "immediate") return 0;
  if (band === "under-1h") return 30;
  if (band === "1-6h") return 180;
  if (band === "6-24h") return 720;
  return 1440; // over-24h
}

function transportBandToMinutes(band: string): number {
  if (band === "under-15m") return 10;
  if (band === "15-30m") return 22;
  if (band === "30-60m") return 45;
  return 90; // over-1h
}

function buildEvents(form: FormState): TimelineEvent[] {
  const base =
    form.arrivalDate && form.arrivalTime
      ? `${form.arrivalDate}T${form.arrivalTime}:00.000Z`
      : new Date().toISOString();
  const arrivalMs = new Date(base).getTime();
  const events: TimelineEvent[] = [];

  // Pre-hospital: symptom onset
  if (form.symptomOnsetDate) {
    const onsetMs = new Date(`${form.symptomOnsetDate}T00:00:00.000Z`).getTime();
    events.push({
      eventType: "symptoms",
      time: new Date(onsetMs).toISOString(),
      description: `Symptoms first noticed. Decision to seek care delayed: ${form.decisionDelayBand || "unknown"}. Reasons: ${form.decisionDelayReasons.join(", ") || "none stated"}.`,
    });
  }

  // Pre-hospital: transport
  if (form.transportMode) {
    const transportOffset = decisionBandToMinutes(form.decisionDelayBand) * 60 * 1000;
    const onsetMs = form.symptomOnsetDate
      ? new Date(`${form.symptomOnsetDate}T00:00:00.000Z`).getTime()
      : arrivalMs - transportBandToMinutes(form.transportDurationBand) * 60 * 1000;
    events.push({
      eventType: "update",
      time: new Date(onsetMs + transportOffset).toISOString(),
      description: `Transport to facility: ${form.transportMode}. Duration: ${form.transportDurationBand || "unknown"}.${form.ambulanceCalled ? ` Ambulance called. Wait: ${form.ambulanceWaitBand || "unknown"}.` : ""}`,
    });
  }

  // Pre-hospital: prior facility stops
  if (form.priorFacilityVisit && form.priorFacilityChain.length > 0) {
    for (const stop of form.priorFacilityChain) {
      events.push({
        eventType: "referral-organized",
        time: new Date(arrivalMs - 60 * 60 * 1000).toISOString(), // approximate: 1h before arrival
        description: `Prior facility stop: ${stop.name || "unnamed"} (${stop.type}). Time spent: ${stop.timeSpentBand}. Left because: ${stop.reasonLeft}.`,
      });
    }
    if (form.referralReason) {
      events.push({
        eventType: "referral-decision",
        time: new Date(arrivalMs - 30 * 60 * 1000).toISOString(),
        description: `Referred/transferred to this facility. Reason: ${form.referralReason}.`,
      });
    }
  }

  // Hospital arrival
  events.push({
    eventType: "arrival",
    time: new Date(arrivalMs).toISOString(),
    description: `Child arrived at facility. Shift: ${form.shift || "unknown"}. Registration before triage: ${
      form.registrationBeforeTriage === true
        ? "Yes"
        : form.registrationBeforeTriage === false
        ? "No"
        : "Unknown"
    }.`,
  });

  if (form.whereDelayHappened.length) {
    events.push({
      eventType: "concern-raised",
      time: new Date(arrivalMs + 2 * 60 * 1000).toISOString(),
      description: `In-facility delay reported at: ${form.whereDelayHappened.join(", ")}.`,
    });
  }

  const seenOffset = bandToMinutes(form.timeToBeSeenBand) * 60 * 1000;
  events.push({
    eventType: "doctor-seen",
    time: new Date(arrivalMs + seenOffset).toISOString(),
    description: `Time to be seen by clinician: ${form.timeToBeSeenBand || "unknown"}.`,
  });

  const interventionOffset =
    seenOffset + bandToMinutes(form.timeToInterventionBand) * 60 * 1000;
  events.push({
    eventType: "intervention",
    time: new Date(arrivalMs + interventionOffset).toISOString(),
    description: `Time from clinician to intervention: ${form.timeToInterventionBand || "unknown"}.`,
  });

  if (form.systemGaps.includes("equipment") && form.equipmentMissing) {
    events.push({
      eventType: "update",
      time: new Date(arrivalMs + interventionOffset + 60 * 1000).toISOString(),
      description: `Equipment gap: ${form.equipmentMissing}.`,
    });
  }
  if (form.systemGaps.includes("communication") && form.communicationDetail) {
    events.push({
      eventType: "communication",
      time: new Date(arrivalMs + interventionOffset + 2 * 60 * 1000).toISOString(),
      description: `Communication gap: ${form.communicationDetail}.`,
    });
  }
  if (form.otherDetail) {
    events.push({
      eventType: "update",
      time: new Date(arrivalMs + interventionOffset + 3 * 60 * 1000).toISOString(),
      description: `Additional note: ${form.otherDetail}.`,
    });
  }

  return events;
}

function computePreHospitalDelay(form: FormState): number | null {
  if (!form.symptomOnsetDate || !form.arrivalDate) return null;
  const onset = new Date(`${form.symptomOnsetDate}T00:00:00.000Z`).getTime();
  const arrival = new Date(
    form.arrivalDate && form.arrivalTime
      ? `${form.arrivalDate}T${form.arrivalTime}:00.000Z`
      : `${form.arrivalDate}T12:00:00.000Z`
  ).getTime();
  const diff = Math.round((arrival - onset) / 60000);
  return diff > 0 ? diff : null;
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
const STEP_LABELS = [
  "Facility",
  "Child",
  "Symptoms",
  "Transport",
  "Prior Stops",
  "Arrival",
  "Gaps",
  "You",
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5 mb-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i < current
                ? "bg-primary"
                : i === current
                ? "bg-primary/60"
                : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-right">
        {STEP_LABELS[current]} &mdash; Step {current + 1} of {total}
      </p>
    </div>
  );
}

// ─── Toggle Chip ──────────────────────────────────────────────────────────────
function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
        selected
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background border-border text-foreground hover:border-primary/60"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Yes/No Toggle ────────────────────────────────────────────────────────────
function YesNo({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-3">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
            value === v
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border hover:border-primary/60"
          }`}
        >
          {v ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}

// ─── Prior Facility Stop Editor ───────────────────────────────────────────────
function PriorStopEditor({
  stops,
  onChange,
}: {
  stops: PriorFacilityStop[];
  onChange: (stops: PriorFacilityStop[]) => void;
}) {
  const addStop = () =>
    onChange([
      ...stops,
      { name: "", type: "", reasonLeft: "", timeSpentBand: "" },
    ]);
  const removeStop = (i: number) =>
    onChange(stops.filter((_, idx) => idx !== i));
  const updateStop = (i: number, key: keyof PriorFacilityStop, val: string) => {
    const updated = stops.map((s, idx) =>
      idx === i ? { ...s, [key]: val } : s
    );
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {stops.map((stop, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Stop {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeStop(i)}
              className="text-xs text-destructive hover:underline"
            >
              Remove
            </button>
          </div>
          <div>
            <Label className="text-xs">Facility name (optional)</Label>
            <Input
              value={stop.name}
              onChange={(e) => updateStop(i, "name", e.target.value)}
              placeholder="e.g. Kiambu Health Centre"
              className="mt-1 h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Type of facility</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {[
                ["dispensary", "Dispensary"],
                ["health-centre", "Health Centre"],
                ["sub-county-hospital", "Sub-County Hospital"],
                ["county-hospital", "County Hospital"],
                ["private", "Private Clinic/Hospital"],
                ["other", "Other"],
              ].map(([val, lbl]) => (
                <Chip
                  key={val}
                  label={lbl}
                  selected={stop.type === val}
                  onClick={() => updateStop(i, "type", val)}
                />
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Why did you leave / get referred?</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {[
                ["no-equipment", "No equipment"],
                ["no-specialist", "No specialist"],
                ["no-blood", "No blood"],
                ["no-space", "No beds/space"],
                ["self-referred", "We left on our own"],
                ["advised-to-go", "Told to go elsewhere"],
                ["other", "Other"],
              ].map(([val, lbl]) => (
                <Chip
                  key={val}
                  label={lbl}
                  selected={stop.reasonLeft === val}
                  onClick={() => updateStop(i, "reasonLeft", val)}
                />
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">How long were you there?</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {[
                ["under-30m", "Under 30 min"],
                ["30m-2h", "30 min – 2 hrs"],
                ["2h-6h", "2 – 6 hrs"],
                ["over-6h", "Over 6 hrs"],
              ].map(([val, lbl]) => (
                <Chip
                  key={val}
                  label={lbl}
                  selected={stop.timeSpentBand === val}
                  onClick={() => updateStop(i, "timeSpentBand", val)}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addStop}>
        + Add facility stop
      </Button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ParentSafeTruthForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [facilityQuery, setFacilityQuery] = useState("");
  const debouncedQuery = useDebounce(facilityQuery, 350);

  const TOTAL_STEPS = 8;

  const { data: facilityData } = trpc.parentSafeTruth.searchFacilities.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 }
  );

  const submitMutation = trpc.parentSafeTruth.submitTimeline.useMutation();

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const toggleArr = (key: "whereDelayHappened" | "systemGaps" | "decisionDelayReasons", val: string) =>
    setForm((prev) => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val],
      };
    });

  const canProceed = (): boolean => {
    if (step === 0) return !!(form.facilityId || form.facilityFreeText || form.facilityNotListed);
    if (step === 1) return form.childOutcome !== "" && form.arrivalDate !== "";
    if (step === 2) return form.symptomOnsetDate !== "" && form.decisionDelayBand !== "";
    if (step === 3) return form.transportMode !== "" && form.transportDurationBand !== "";
    if (step === 4) return form.priorFacilityVisit !== null;
    if (step === 5) return form.registrationBeforeTriage !== null;
    if (step === 6) return true;
    if (step === 7)
      return form.isAnonymous || (form.parentName.trim().length > 0);
    return false;
  };

  const handleSubmit = async () => {
    setError("");
    try {
      const events = buildEvents(form);
      const preHospitalDelayMinutes = computePreHospitalDelay(form);
      const result = await submitMutation.mutateAsync({
        childOutcome: form.childOutcome as Outcome,
        childAge: form.childAge ? parseInt(form.childAge, 10) : undefined,
        hospitalId: form.facilityId ?? undefined,
        isAnonymous: form.isAnonymous,
        parentName: form.isAnonymous ? undefined : form.parentName || undefined,
        parentEmail: form.isAnonymous ? undefined : form.parentEmail || undefined,
        events,
        // In-hospital gap data
        systemGaps: form.systemGaps,
        whereDelayHappened: form.whereDelayHappened,
        registrationBeforeTriage: form.registrationBeforeTriage ?? undefined,
        shift: form.shift || undefined,
        // Pre-hospital journey data
        symptomOnsetDate: form.symptomOnsetDate || undefined,
        decisionDelayBand: form.decisionDelayBand || undefined,
        decisionDelayReasons: form.decisionDelayReasons.length > 0 ? form.decisionDelayReasons : undefined,
        transportMode: form.transportMode || undefined,
        transportDurationBand: form.transportDurationBand || undefined,
        ambulanceCalled: form.ambulanceCalled ?? undefined,
        ambulanceWaitBand: form.ambulanceWaitBand || undefined,
        priorFacilityVisit: form.priorFacilityVisit ?? undefined,
        priorFacilityChain: form.priorFacilityChain.length > 0 ? JSON.stringify(form.priorFacilityChain) : undefined,
        referralReason: form.referralReason || undefined,
        preHospitalDelayMinutes: preHospitalDelayMinutes ?? undefined,
      });
      setSubmissionId(result.submissionId);
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
    }
  };

  // ── Submitted state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="text-4xl">🙏</div>
        <h3 className="text-lg font-semibold">Thank you for sharing your story.</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Your experience helps us identify where the system failed and push for
          real change — so the next child gets better care.
        </p>
        {submissionId && (
          <p className="text-xs text-muted-foreground">Reference: #{submissionId}</p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setForm(INITIAL_STATE);
            setStep(0);
            setSubmitted(false);
            setSubmissionId(null);
          }}
        >
          Submit another
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StepIndicator current={step} total={TOTAL_STEPS} />

      {/* ── STEP 0: Facility ───────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-base">Which hospital did your child go to?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Search by name. This links your story to the right facility so the
              right people can act on it.
            </p>
          </div>

          {!form.facilityNotListed && (
            <>
              <Input
                placeholder="Type hospital name…"
                value={facilityQuery}
                onChange={(e) => setFacilityQuery(e.target.value)}
              />
              {facilityData?.results && facilityData.results.length > 0 && !form.facilityId && (
                <div className="border rounded-lg divide-y overflow-hidden">
                  {facilityData.results.map((f: FacilityResult) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        set("facilityId", f.id);
                        set("facilityName", f.name);
                        setFacilityQuery(f.name);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center justify-between gap-2"
                    >
                      <span className="text-sm">{f.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {f.badge}{f.county ? ` · ${f.county}` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {form.facilityId && (
                <div className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                  <span className="text-sm flex-1">{form.facilityName}</span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      set("facilityId", null);
                      set("facilityName", "");
                      setFacilityQuery("");
                    }}
                  >
                    Change
                  </button>
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notListed"
              checked={form.facilityNotListed}
              onChange={(e) => {
                set("facilityNotListed", e.target.checked);
                if (e.target.checked) {
                  set("facilityId", null);
                  set("facilityName", "");
                  setFacilityQuery("");
                }
              }}
              className="rounded"
            />
            <Label htmlFor="notListed" className="text-sm cursor-pointer">
              My hospital is not listed
            </Label>
          </div>

          {form.facilityNotListed && (
            <div>
              <Label className="text-sm">Enter the hospital name</Label>
              <Input
                className="mt-1"
                placeholder="e.g. Nakuru Level 5 Hospital"
                value={form.facilityFreeText}
                onChange={(e) => set("facilityFreeText", e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {/* ── STEP 1: Child & Outcome ────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-base">About the child</h3>

          <div>
            <Label className="text-sm">Child's age (years, optional)</Label>
            <Input
              type="number"
              min={0}
              max={18}
              className="mt-1 w-28"
              value={form.childAge}
              onChange={(e) => set("childAge", e.target.value)}
              placeholder="e.g. 3"
            />
          </div>

          <div>
            <Label className="text-sm">What happened in the end?</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                ["discharged", "Child went home"],
                ["referred", "Referred to another hospital"],
                ["passed-away", "Child passed away"],
              ].map(([val, lbl]) => (
                <Chip
                  key={val}
                  label={lbl}
                  selected={form.childOutcome === val}
                  onClick={() => set("childOutcome", val as Outcome)}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm">Date you arrived at this hospital</Label>
            <Input
              type="date"
              className="mt-1 w-44"
              value={form.arrivalDate}
              onChange={(e) => set("arrivalDate", e.target.value)}
            />
          </div>

          <div>
            <Label className="text-sm">Approximate time of arrival (optional)</Label>
            <Input
              type="time"
              className="mt-1 w-36"
              value={form.arrivalTime}
              onChange={(e) => set("arrivalTime", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ── STEP 2: Symptom Onset & Home Decision ─────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-base">When did it start?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This helps us understand how long the child was unwell before
              reaching care — a critical part of the full picture.
            </p>
          </div>

          <div>
            <Label className="text-sm">When did you first notice your child was unwell?</Label>
            <Input
              type="date"
              className="mt-1 w-44"
              value={form.symptomOnsetDate}
              onChange={(e) => set("symptomOnsetDate", e.target.value)}
            />
          </div>

          <div>
            <Label className="text-sm">
              After noticing, how long before you decided to go to hospital?
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                ["immediate", "Immediately"],
                ["under-1h", "Within 1 hour"],
                ["1-6h", "1 – 6 hours"],
                ["6-24h", "6 – 24 hours"],
                ["over-24h", "More than 24 hours"],
              ].map(([val, lbl]) => (
                <Chip
                  key={val}
                  label={lbl}
                  selected={form.decisionDelayBand === val}
                  onClick={() => set("decisionDelayBand", val)}
                />
              ))}
            </div>
          </div>

          {form.decisionDelayBand && form.decisionDelayBand !== "immediate" && (
            <div>
              <Label className="text-sm">
                What made you wait? (select all that apply)
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  ["cost", "Worried about cost"],
                  ["distance", "Too far away"],
                  ["transport", "No transport available"],
                  ["unsure", "Wasn't sure it was serious"],
                  ["home-remedy", "Tried home treatment first"],
                  ["waited-to-worsen", "Waited to see if it got worse"],
                  ["night", "It was night-time"],
                  ["other", "Other reason"],
                ].map(([val, lbl]) => (
                  <Chip
                    key={val}
                    label={lbl}
                    selected={form.decisionDelayReasons.includes(val)}
                    onClick={() => toggleArr("decisionDelayReasons", val)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: Transport ─────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-base">Getting to the hospital</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Transport delays are one of the biggest killers. Your answer here
              helps map access gaps across regions.
            </p>
          </div>

          <div>
            <Label className="text-sm">How did you get to the hospital?</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                ["personal-vehicle", "Own car / family car"],
                ["matatu", "Matatu / public transport"],
                ["boda-boda", "Boda boda"],
                ["ambulance", "Ambulance"],
                ["walked", "Walked"],
                ["other", "Other"],
              ].map(([val, lbl]) => (
                <Chip
                  key={val}
                  label={lbl}
                  selected={form.transportMode === val}
                  onClick={() => set("transportMode", val)}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm">How long did the journey take?</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                ["under-15m", "Under 15 min"],
                ["15-30m", "15 – 30 min"],
                ["30-60m", "30 – 60 min"],
                ["over-1h", "Over 1 hour"],
              ].map(([val, lbl]) => (
                <Chip
                  key={val}
                  label={lbl}
                  selected={form.transportDurationBand === val}
                  onClick={() => set("transportDurationBand", val)}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm">Did you call an ambulance?</Label>
            <div className="mt-2">
              <YesNo
                value={form.ambulanceCalled}
                onChange={(v) => set("ambulanceCalled", v)}
              />
            </div>
          </div>

          {form.ambulanceCalled === true && (
            <div>
              <Label className="text-sm">How long did the ambulance take to arrive?</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  ["under-15m", "Under 15 min"],
                  ["15-30m", "15 – 30 min"],
                  ["30-60m", "30 – 60 min"],
                  ["over-1h", "Over 1 hour"],
                  ["never-came", "It never came"],
                ].map(([val, lbl]) => (
                  <Chip
                    key={val}
                    label={lbl}
                    selected={form.ambulanceWaitBand === val}
                    onClick={() => set("ambulanceWaitBand", val)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 4: Prior Facility Stops ──────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-base">Did you go anywhere else first?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Many children visit multiple facilities before reaching the right
              care. Each stop is a delay we need to understand.
            </p>
          </div>

          <div>
            <Label className="text-sm">
              Before this hospital, did you visit any other health facility?
            </Label>
            <div className="mt-2">
              <YesNo
                value={form.priorFacilityVisit}
                onChange={(v) => {
                  set("priorFacilityVisit", v);
                  if (!v) set("priorFacilityChain", []);
                }}
              />
            </div>
          </div>

          {form.priorFacilityVisit === true && (
            <>
              <PriorStopEditor
                stops={form.priorFacilityChain}
                onChange={(stops) => set("priorFacilityChain", stops)}
              />

              <div>
                <Label className="text-sm">
                  What was the main reason you ended up at this hospital?
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    ["no-equipment", "Previous facility had no equipment"],
                    ["no-specialist", "No specialist available"],
                    ["no-blood", "No blood available"],
                    ["no-space", "No beds / space"],
                    ["self-referred", "We decided to come here ourselves"],
                    ["advised-to-go", "We were told to come here"],
                    ["other", "Other"],
                  ].map(([val, lbl]) => (
                    <Chip
                      key={val}
                      label={lbl}
                      selected={form.referralReason === val}
                      onClick={() => set("referralReason", val)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── STEP 5: Front-Door Journey ────────────────────────────────────── */}
      {step === 5 && (
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-base">When you arrived at the hospital</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tell us what happened from the moment you walked through the door.
            </p>
          </div>

          <div>
            <Label className="text-sm">What time of day did you arrive?</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                ["morning", "Morning (6am – 2pm)"],
                ["afternoon", "Afternoon (2pm – 10pm)"],
                ["night", "Night (10pm – 6am)"],
              ].map(([val, lbl]) => (
                <Chip
                  key={val}
                  label={lbl}
                  selected={form.shift === val}
                  onClick={() => set("shift", val as FormState["shift"])}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm">
              Were you asked to register / pay before your child was assessed?
            </Label>
            <div className="mt-2">
              <YesNo
                value={form.registrationBeforeTriage}
                onChange={(v) => set("registrationBeforeTriage", v)}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm">
              Where did the biggest delay happen? (select all that apply)
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                ["gate", "At the gate / security"],
                ["registration-desk", "At the registration desk"],
                ["billing-cashier", "At billing / cashier"],
                ["waiting-room", "In the waiting room"],
                ["casualty-queue", "In the casualty queue"],
                ["ward-handover", "During ward handover"],
                ["no-delay", "No significant delay"],
              ].map(([val, lbl]) => (
                <Chip
                  key={val}
                  label={lbl}
                  selected={form.whereDelayHappened.includes(val)}
                  onClick={() => toggleArr("whereDelayHappened", val)}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm">
              How long before a doctor or nurse assessed your child?
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                ["under-5", "Under 5 min"],
                ["5-10", "5 – 10 min"],
                ["10-20", "10 – 20 min"],
                ["20-30", "20 – 30 min"],
                ["over-30", "Over 30 min"],
              ].map(([val, lbl]) => (
                <Chip
                  key={val}
                  label={lbl}
                  selected={form.timeToBeSeenBand === val}
                  onClick={() => set("timeToBeSeenBand", val)}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm">
              After being assessed, how long before treatment started?
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                ["under-5", "Under 5 min"],
                ["5-10", "5 – 10 min"],
                ["10-20", "10 – 20 min"],
                ["20-30", "20 – 30 min"],
                ["over-30", "Over 30 min"],
              ].map(([val, lbl]) => (
                <Chip
                  key={val}
                  label={lbl}
                  selected={form.timeToInterventionBand === val}
                  onClick={() => set("timeToInterventionBand", val)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 6: Specific Gaps ─────────────────────────────────────────── */}
      {step === 6 && (
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-base">What went wrong?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Select everything that felt like a gap or failure. You can skip
              this step if everything was fine.
            </p>
          </div>

          <div>
            <Label className="text-sm">System gaps (select all that apply)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                ["equipment", "Equipment was missing or broken"],
                ["medication", "Medication was unavailable"],
                ["staffing", "Not enough staff"],
                ["training", "Staff seemed unsure what to do"],
                ["communication", "Poor communication with us"],
                ["protocols", "Steps were not followed correctly"],
                ["billing", "Billing / payment caused a delay"],
                ["referral-delay", "Referral took too long to organise"],
                ["other", "Something else"],
              ].map(([val, lbl]) => (
                <Chip
                  key={val}
                  label={lbl}
                  selected={form.systemGaps.includes(val)}
                  onClick={() => toggleArr("systemGaps", val)}
                />
              ))}
            </div>
          </div>

          {form.systemGaps.includes("equipment") && (
            <div>
              <Label className="text-sm">What equipment was missing or broken?</Label>
              <Input
                className="mt-1"
                placeholder="e.g. oxygen, pulse oximeter, IV line…"
                value={form.equipmentMissing}
                onChange={(e) => set("equipmentMissing", e.target.value)}
              />
            </div>
          )}

          {form.systemGaps.includes("staffing") && (
            <div>
              <Label className="text-sm">Tell us more about the staffing issue</Label>
              <Textarea
                className="mt-1 text-sm"
                rows={2}
                placeholder="e.g. only one nurse on duty, no doctor available…"
                value={form.staffingDetail}
                onChange={(e) => set("staffingDetail", e.target.value)}
              />
            </div>
          )}

          {form.systemGaps.includes("communication") && (
            <div>
              <Label className="text-sm">What was the communication problem?</Label>
              <Textarea
                className="mt-1 text-sm"
                rows={2}
                placeholder="e.g. no one told us what was happening, conflicting information…"
                value={form.communicationDetail}
                onChange={(e) => set("communicationDetail", e.target.value)}
              />
            </div>
          )}

          <div>
            <Label className="text-sm">
              Anything else you want the hospital to know? (optional)
            </Label>
            <Textarea
              className="mt-1 text-sm"
              rows={3}
              placeholder="Your words matter. Write freely."
              value={form.otherDetail}
              onChange={(e) => set("otherDetail", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ── STEP 7: Identity ──────────────────────────────────────────────── */}
      {step === 7 && (
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-base">How would you like to submit?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You can submit completely anonymously. Your story is just as
              powerful either way.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              [true, "Submit anonymously", "Your name is never stored."],
              [false, "Include my name", "Allows us to follow up if needed."],
            ].map(([val, title, desc]) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => set("isAnonymous", val as boolean)}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  form.isAnonymous === val
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-medium">{title as string}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc as string}</p>
              </button>
            ))}
          </div>

          {!form.isAnonymous && (
            <div className="space-y-3">
              <div>
                <Label className="text-sm">Your name</Label>
                <Input
                  className="mt-1"
                  placeholder="Full name"
                  value={form.parentName}
                  onChange={(e) => set("parentName", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm">Email (optional)</Label>
                <Input
                  type="email"
                  className="mt-1"
                  placeholder="you@example.com"
                  value={form.parentEmail}
                  onChange={(e) => set("parentEmail", e.target.value)}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
      )}

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="flex-1"
        >
          Back
        </Button>

        {step < TOTAL_STEPS - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="flex-1"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || submitMutation.isPending}
            className="flex-1"
          >
            {submitMutation.isPending ? "Submitting…" : "Submit my story"}
          </Button>
        )}
      </div>
    </div>
  );
}
