/**
 * ParentSafeTruthForm — Multi-step wizard
 *
 * Roadmap Phase 1 + 2 + 3 implementation:
 *   - Routes to parentSafeTruth.submitTimeline (correct router, correct DB tables)
 *   - Enforces facility selection (links submission to a hospital)
 *   - Captures front-door journey data (registration vs triage order)
 *   - Captures shift / location / specific equipment gaps
 *   - Builds a structured timeline of events for delay analysis
 */
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Search,
  MapPin,
  Clock,
  MessageSquare,
  Stethoscope,
  Building2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useDebounce } from "@/hooks/useDebounce";

// ─── Types ───────────────────────────────────────────────────────────────────

type Outcome = "discharged" | "referred" | "passed-away";

interface FacilityResult {
  id: number;
  name: string;
  badge: string;
  county: string;
}

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

interface FormState {
  facilityId: number | null;
  facilityName: string;
  facilityFreeText: string;
  facilityNotListed: boolean;
  childAge: string;
  childOutcome: Outcome | "";
  arrivalDate: string;
  arrivalTime: string;
  shift: "morning" | "afternoon" | "night" | "";
  registrationBeforeTriage: boolean | null;
  whereDelayHappened: string[];
  timeToBeSeenBand: string;
  timeToInterventionBand: string;
  systemGaps: string[];
  equipmentMissing: string;
  staffingDetail: string;
  communicationDetail: string;
  otherDetail: string;
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

function buildEvents(form: FormState): TimelineEvent[] {
  const base =
    form.arrivalDate && form.arrivalTime
      ? `${form.arrivalDate}T${form.arrivalTime}:00.000Z`
      : new Date().toISOString();
  const arrivalMs = new Date(base).getTime();
  const events: TimelineEvent[] = [];

  events.push({
    eventType: "arrival",
    time: new Date(arrivalMs).toISOString(),
    description: `Child arrived. Shift: ${form.shift || "unknown"}. Registration before triage: ${
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
      description: `Delay reported at: ${form.whereDelayHappened.join(", ")}.`,
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
      description: `Equipment gap reported: ${form.equipmentMissing}.`,
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

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
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
      <span className="text-xs text-muted-foreground whitespace-nowrap ml-1">
        {current + 1} / {total}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ParentSafeTruthForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [facilityQuery, setFacilityQuery] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<number | null>(null);

  const debouncedQuery = useDebounce(facilityQuery, 300);

  const { data: facilityResults, isFetching: searchingFacilities } =
    trpc.parentSafeTruth.searchFacilities.useQuery(
      { query: debouncedQuery },
      { enabled: debouncedQuery.length >= 2 && !form.facilityNotListed }
    );

  const submitMutation = trpc.parentSafeTruth.submitTimeline.useMutation();

  const update = useCallback(
    (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch })),
    []
  );

  const toggleArr = (key: keyof FormState, value: string) => {
    const arr = form[key] as string[];
    update({
      [key]: arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value],
    } as any);
  };

  const TOTAL_STEPS = 5;

  const canAdvance = (): boolean => {
    if (step === 0)
      return (
        form.facilityId !== null ||
        (form.facilityNotListed && form.facilityFreeText.length > 0)
      );
    if (step === 1) return form.childOutcome !== "" && form.arrivalDate !== "";
    if (step === 2) return form.registrationBeforeTriage !== null;
    if (step === 3) return true;
    if (step === 4)
      return (
        form.isAnonymous || (form.parentName !== "" && form.parentEmail !== "")
      );
    return true;
  };

  const handleSubmit = async () => {
    setError("");
    try {
      const events = buildEvents(form);
      const result = await submitMutation.mutateAsync({
        childOutcome: form.childOutcome as Outcome,
        childAge: form.childAge ? parseInt(form.childAge, 10) : undefined,
        hospitalId: form.facilityId ?? undefined,
        isAnonymous: form.isAnonymous,
        parentName: form.isAnonymous ? undefined : form.parentName || undefined,
        parentEmail: form.isAnonymous ? undefined : form.parentEmail || undefined,
        events,
        // Structured gap data for QI aggregation
        systemGaps: form.systemGaps,
        whereDelayHappened: form.whereDelayHappened,
        registrationBeforeTriage: form.registrationBeforeTriage ?? undefined,
        shift: form.shift || undefined,
      });
      setSubmissionId(result.submissionId);
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
    }
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
          <h3 className="text-xl font-semibold text-green-900">
            Thank you for sharing your story
          </h3>
          <p className="text-green-800 text-sm leading-relaxed max-w-md mx-auto">
            Your experience has been recorded and linked to{" "}
            <strong>
              {form.facilityNotListed ? form.facilityFreeText : form.facilityName}
            </strong>
            . The patterns you described help us identify where the system needs
            to change — not just for your child, but for every child who comes
            after.
          </p>
          {submissionId && (
            <p className="text-xs text-green-700">Reference: ST-{submissionId}</p>
          )}
          <Button
            variant="outline"
            className="border-green-400 text-green-800"
            onClick={() => {
              setSubmitted(false);
              setForm(INITIAL_STATE);
              setStep(0);
            }}
          >
            Submit another story
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <StepIndicator current={step} total={TOTAL_STEPS} />

      {/* ── STEP 0: Facility ─────────────────────────────────────────────── */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">
                Which hospital or clinic was this?
              </CardTitle>
            </div>
            <CardDescription>
              Linking your story to a specific facility is what allows
              administrators to see patterns and fix them. Your identity remains
              protected.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!form.facilityNotListed && (
              <div className="space-y-2">
                <Label htmlFor="facility-search">Search by facility name</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="facility-search"
                    className="pl-9"
                    placeholder="e.g. Kenyatta National Hospital"
                    value={facilityQuery}
                    onChange={(e) => {
                      setFacilityQuery(e.target.value);
                      update({ facilityId: null, facilityName: "" });
                    }}
                  />
                  {searchingFacilities && (
                    <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {facilityResults?.results &&
                  facilityResults.results.length > 0 &&
                  !form.facilityId && (
                    <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                      {facilityResults.results.map((f: FacilityResult) => (
                        <button
                          key={`${f.badge}-${f.id}`}
                          className="w-full text-left px-4 py-2.5 hover:bg-muted/60 flex items-center justify-between text-sm"
                          onClick={() => {
                            update({ facilityId: f.id, facilityName: f.name });
                            setFacilityQuery(f.name);
                          }}
                        >
                          <span>
                            {f.name}
                            {f.county ? ` — ${f.county}` : ""}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {f.badge}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                {form.facilityId && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-800 text-sm">
                      Selected: <strong>{form.facilityName}</strong>
                    </AlertDescription>
                  </Alert>
                )}
                {debouncedQuery.length >= 2 &&
                  !searchingFacilities &&
                  facilityResults?.results?.length === 0 &&
                  !form.facilityId && (
                    <p className="text-sm text-muted-foreground">
                      No registered facilities found. Tick below to type the
                      name manually.
                    </p>
                  )}
              </div>
            )}

            <div className="flex items-start gap-3 pt-1">
              <Checkbox
                id="not-listed"
                checked={form.facilityNotListed}
                onCheckedChange={(v) =>
                  update({
                    facilityNotListed: v as boolean,
                    facilityId: null,
                    facilityName: "",
                  })
                }
              />
              <Label
                htmlFor="not-listed"
                className="font-normal leading-relaxed cursor-pointer text-sm"
              >
                The facility is not listed — I will type the name
              </Label>
            </div>

            {form.facilityNotListed && (
              <div className="space-y-2">
                <Label htmlFor="facility-free">Facility name</Label>
                <Input
                  id="facility-free"
                  placeholder="Type the full name of the hospital or clinic"
                  value={form.facilityFreeText}
                  onChange={(e) => update({ facilityFreeText: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  We will use this to add the facility to our registry so future
                  stories can be linked automatically.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── STEP 1: Child & Outcome ───────────────────────────────────────── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">
                About your child and what happened
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="child-age">Child's age (years)</Label>
              <Input
                id="child-age"
                type="number"
                min={0}
                max={18}
                placeholder="e.g. 3"
                value={form.childAge}
                onChange={(e) => update({ childAge: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>What was the outcome?</Label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: "discharged", label: "My child went home" },
                  {
                    value: "referred",
                    label: "My child was transferred to another facility",
                  },
                  { value: "passed-away", label: "My child passed away" },
                ].map((o) => (
                  <button
                    key={o.value}
                    onClick={() => update({ childOutcome: o.value as Outcome })}
                    className={`text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                      form.childOutcome === o.value
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="arrival-date">Date of visit</Label>
                <Input
                  id="arrival-date"
                  type="date"
                  value={form.arrivalDate}
                  onChange={(e) => update({ arrivalDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrival-time">Approximate time of arrival</Label>
                <Input
                  id="arrival-time"
                  type="time"
                  value={form.arrivalTime}
                  onChange={(e) => update({ arrivalTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Which shift was it?</Label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: "morning", label: "Morning (6am–2pm)" },
                  { value: "afternoon", label: "Afternoon (2pm–10pm)" },
                  { value: "night", label: "Night (10pm–6am)" },
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => update({ shift: s.value as any })}
                    className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                      form.shift === s.value
                        ? "border-primary bg-primary/10 font-medium"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── STEP 2: Front-Door Journey ────────────────────────────────────── */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">
                What happened when you first arrived?
              </CardTitle>
            </div>
            <CardDescription>
              This is the most important part. Many children deteriorate in
              waiting rooms because the system is not designed to spot
              emergencies at the front door.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Were you asked to register or pay{" "}
                <em>before</em> a nurse or doctor checked your child?
              </Label>
              <div className="flex flex-col sm:flex-row gap-3">
                {[
                  {
                    value: true,
                    label: "Yes — registration or payment came first",
                  },
                  {
                    value: false,
                    label: "No — a nurse checked my child first",
                  },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() =>
                      update({ registrationBeforeTriage: opt.value })
                    }
                    className={`flex-1 px-4 py-3 rounded-lg border text-sm transition-all text-left ${
                      form.registrationBeforeTriage === opt.value
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-semibold">
                Where did the delay happen? (tick all that apply)
              </Label>
              {[
                { id: "gate", label: "At the gate or security checkpoint" },
                {
                  id: "registration-desk",
                  label: "At the registration or admissions desk",
                },
                {
                  id: "billing-cashier",
                  label: "At the billing or cashier desk",
                },
                { id: "waiting-room", label: "In the general waiting room" },
                {
                  id: "casualty-queue",
                  label: "In the casualty / emergency queue",
                },
                {
                  id: "ward-handover",
                  label: "During a ward handover or shift change",
                },
                {
                  id: "lab-imaging",
                  label: "Waiting for lab results or imaging",
                },
              ].map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <Checkbox
                    id={item.id}
                    checked={form.whereDelayHappened.includes(item.id)}
                    onCheckedChange={() =>
                      toggleArr("whereDelayHappened", item.id)
                    }
                  />
                  <Label
                    htmlFor={item.id}
                    className="font-normal leading-relaxed cursor-pointer text-sm"
                  >
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>How long before a clinician saw your child?</Label>
                <Select
                  value={form.timeToBeSeenBand}
                  onValueChange={(v) => update({ timeToBeSeenBand: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-5">Under 5 minutes</SelectItem>
                    <SelectItem value="5-10">5–10 minutes</SelectItem>
                    <SelectItem value="10-20">10–20 minutes</SelectItem>
                    <SelectItem value="20-30">20–30 minutes</SelectItem>
                    <SelectItem value="over-30">More than 30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Once seen, how long before treatment started?</Label>
                <Select
                  value={form.timeToInterventionBand}
                  onValueChange={(v) => update({ timeToInterventionBand: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-5">Under 5 minutes</SelectItem>
                    <SelectItem value="5-10">5–10 minutes</SelectItem>
                    <SelectItem value="10-20">10–20 minutes</SelectItem>
                    <SelectItem value="20-30">20–30 minutes</SelectItem>
                    <SelectItem value="over-30">More than 30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── STEP 3: Specific Gaps ─────────────────────────────────────────── */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">
                What could have been better?
              </CardTitle>
            </div>
            <CardDescription>
              Tick anything that applies. If you can, add a brief detail — it
              turns a pattern into a fixable problem.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              {
                id: "communication",
                label: "I was not told what was happening or what came next",
                detailKey: "communicationDetail" as keyof FormState,
                detailPlaceholder:
                  "e.g. No one explained the diagnosis, or staff spoke only to each other",
              },
              {
                id: "equipment",
                label: "Something needed was missing or unavailable",
                detailKey: "equipmentMissing" as keyof FormState,
                detailPlaceholder:
                  "e.g. No oxygen, no IV line, no specific drug name",
              },
              {
                id: "staffing",
                label: "There were not enough staff, or they were hard to find",
                detailKey: "staffingDetail" as keyof FormState,
                detailPlaceholder:
                  "e.g. One nurse for the whole ward, doctor took 40 minutes to arrive",
              },
            ].map((gap) => (
              <div key={gap.id} className="space-y-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={gap.id}
                    checked={form.systemGaps.includes(gap.id)}
                    onCheckedChange={() => toggleArr("systemGaps", gap.id)}
                  />
                  <Label
                    htmlFor={gap.id}
                    className="font-normal leading-relaxed cursor-pointer text-sm"
                  >
                    {gap.label}
                  </Label>
                </div>
                {form.systemGaps.includes(gap.id) && (
                  <Textarea
                    className="ml-7 text-sm"
                    rows={2}
                    placeholder={gap.detailPlaceholder}
                    value={form[gap.detailKey] as string}
                    onChange={(e) =>
                      update({ [gap.detailKey]: e.target.value } as any)
                    }
                  />
                )}
              </div>
            ))}

            {[
              {
                id: "training",
                label: "Staff seemed unsure what to do or how to use equipment",
              },
              {
                id: "protocols",
                label: "The steps taken did not feel organised or clear",
              },
              {
                id: "family-support",
                label: "I needed someone to explain things to me or sit with me",
              },
              {
                id: "follow-up",
                label: "Going home or follow-up plans were unclear",
              },
            ].map((gap) => (
              <div key={gap.id} className="flex items-start gap-3">
                <Checkbox
                  id={gap.id}
                  checked={form.systemGaps.includes(gap.id)}
                  onCheckedChange={() => toggleArr("systemGaps", gap.id)}
                />
                <Label
                  htmlFor={gap.id}
                  className="font-normal leading-relaxed cursor-pointer text-sm"
                >
                  {gap.label}
                </Label>
              </div>
            ))}

            <div className="space-y-2 pt-2">
              <Label htmlFor="other-detail">
                Anything else you want us to know
              </Label>
              <Textarea
                id="other-detail"
                rows={3}
                placeholder="Any other detail that might help us understand what happened"
                value={form.otherDetail}
                onChange={(e) => update({ otherDetail: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── STEP 4: Identity ──────────────────────────────────────────────── */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">
                How would you like to send this?
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
              <Checkbox
                id="anonymous"
                checked={form.isAnonymous}
                onCheckedChange={(v) => update({ isAnonymous: v as boolean })}
              />
              <Label
                htmlFor="anonymous"
                className="font-normal leading-relaxed cursor-pointer text-sm"
              >
                Send this without my name or contact — I want to stay anonymous
              </Label>
            </div>

            {!form.isAnonymous && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="parent-name">Your name (optional)</Label>
                  <Input
                    id="parent-name"
                    placeholder="Your name"
                    value={form.parentName}
                    onChange={(e) => update({ parentName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent-email">
                    Email address (so we can notify you when reviewed)
                  </Label>
                  <Input
                    id="parent-email"
                    type="email"
                    placeholder="your@email.com"
                    value={form.parentEmail}
                    onChange={(e) => update({ parentEmail: e.target.value })}
                  />
                </div>
              </div>
            )}

            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-sm">
                Your story will be shared only in aggregated, anonymized form
                with the hospital and with Paeds Resus researchers. No
                individual story is ever made public.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>

        {step < TOTAL_STEPS - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
            className="gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending || !canAdvance()}
            variant="cta"
            className="gap-2"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Send my story"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
