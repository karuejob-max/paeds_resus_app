/**
 * Care Signal v3 — Adaptive Learning System provider observation form.
 * Spec: docs/EVENT_MODELS_V1.md §1
 *
 * Key changes from v2:
 *   - Report track selector (FAILURE default / SUCCESS for positive deviance)
 *   - Failure mode secondary picker within each domain
 *   - Temporal interval fields (expandable, non-blocking)
 *   - Role at time of event (distinct from profile cadre)
 *   - Explicit facility confirmation (never inferred)
 *   - Live post-submission feedback: streak + gap analysis + recommendations
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Heart,
  Loader2,
  Shield,
  TrendingUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { FacilityPicker, type FacilitySelection } from "@/components/FacilityPicker";
import { cn } from "@/lib/utils";
import { getTrpcErrorMessage } from "@/lib/trpc-errors";
import {
  initialCareSignalV3State,
  validateCareSignalV3,
  buildCareSignalV3SubmitPayload,
  FAILURE_MODES_BY_DOMAIN,
  SUCCESS_FACTORS,
  CONDITION_CATEGORY_LABELS,
  CHILD_AGE_BAND_LABELS,
  OUTCOME_CATEGORY_LABELS,
  FAILURE_DOMAIN_LABELS,
  ROLE_AT_EVENT_LABELS,
  HOURS_SINCE_EVENT_LABELS,
  type FailureDomain,
  type FailureModeCode,
  type SuccessFactorCode,
  type ConditionCategory,
  type ChildAgeBand,
  type OutcomeCategory,
  type RoleAtTimeOfEvent,
  type HoursSinceEvent,
} from "@/lib/care-signal-v3";

const OPT = "flex items-start space-x-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-teal-200/80 hover:bg-teal-50/60 transition-colors cursor-pointer";
const OPT_SEL = "flex items-start space-x-3 rounded-lg border border-teal-400 bg-teal-50 p-3 shadow-sm";
const OPT_SUC = "flex items-start space-x-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-green-200/80 hover:bg-green-50/60 transition-colors cursor-pointer";
const OPT_SUC_SEL = "flex items-start space-x-3 rounded-lg border border-green-400 bg-green-50 p-3 shadow-sm";
const SLABEL = "text-sm font-semibold text-slate-700 mb-2 block";
const HINT = "text-xs text-slate-500 mt-1";

// ── Post-submission feedback ──────────────────────────────────────────────────
function PostSubmissionFeedback({
  submissionId,
  reportTrack,
  failureDomains,
  recommendations,
  onClose,
}: {
  submissionId: string;
  reportTrack: "FAILURE" | "SUCCESS";
  failureDomains: FailureDomain[];
  recommendations: Array<{ gap: string; recommendation: string; priority: "high" | "medium" | "low"; action: string }>;
  onClose: () => void;
}) {
  const { data: fp } = trpc.fellowship.getMyFellowshipProgress.useQuery(undefined, { retry: false });
  const streak = fp?.careSignalPillar?.streak ?? null;

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-start gap-3 rounded-lg bg-teal-50 border border-teal-200 p-4">
        <CheckCircle2 className="h-5 w-5 text-teal-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-teal-900 text-sm">
            {reportTrack === "SUCCESS" ? "Success pattern submitted — thank you for sharing what worked." : "Report submitted confidentially."}
          </p>
          <p className="text-xs text-teal-700 mt-0.5">Reference: CS-{submissionId.slice(-6).toUpperCase()}</p>
        </div>
      </div>

      {streak !== null && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-violet-600" />
            <span className="text-xs font-semibold text-violet-800">Fellowship — Pillar C</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-violet-900">{streak}</span>
            <span className="text-sm text-violet-700 mb-1">
              / 24 months {streak >= 24 ? "— complete!" : `— ${24 - streak} month${24 - streak === 1 ? "" : "s"} remaining`}
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-violet-200">
            <div className="h-2 rounded-full bg-violet-600 transition-all" style={{ width: `${Math.min(100, Math.round((streak / 24) * 100))}%` }} />
          </div>
        </div>
      )}

      {failureDomains.length > 0 && reportTrack === "FAILURE" && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-slate-600" />
            <span className="text-xs font-semibold text-slate-700">Gaps you reported</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {failureDomains.map((d) => (
              <Badge key={d} variant="secondary" className="text-xs">{FAILURE_DOMAIN_LABELS[d]}</Badge>
            ))}
          </div>
        </div>
      )}

      {recommendations.slice(0, 3).map((rec, i) => (
        <div key={i} className={cn("rounded-lg border p-3 text-sm",
          rec.priority === "high" ? "border-red-200 bg-red-50 text-red-900"
          : rec.priority === "medium" ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-blue-200 bg-blue-50 text-blue-900")}>
          <p className="font-medium text-xs mb-1">{rec.gap}</p>
          <p className="text-xs leading-relaxed">{rec.recommendation}</p>
        </div>
      ))}

      <Button onClick={onClose} className="w-full bg-brand-teal text-white hover:bg-brand-teal/90">Done</Button>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────
interface Props {
  onSuccess?: () => void;
  resusSessionId?: string;
}

export default function CareSignalFormV3({ onSuccess, resusSessionId }: Props) {
  const [form, setForm] = useState(initialCareSignalV3State());
  const [facility, setFacility] = useState<FacilitySelection | null>(null);
  const [showTemporal, setShowTemporal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const { data: me } = trpc.auth.me.useQuery(undefined, { retry: false });
  const providerCadre = (me as any)?.cadre;

  const submitMutation = trpc.careSignalEvents.logEvent.useMutation({
    onSuccess: (data) => { setSubmissionId(data.eventId ?? ""); setRecommendations(data.recommendations ?? []); setSubmitted(true); },
    onError: (err) => setSubmitError(getTrpcErrorMessage(err)),
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm(p => ({ ...p, [k]: v })); }

  function toggleDomain(d: FailureDomain) {
    const next = form.failureDomains.includes(d) ? form.failureDomains.filter(x => x !== d) : [...form.failureDomains, d];
    set("failureDomains", next);
    if (form.failureDomains.includes(d)) {
      const remove = FAILURE_MODES_BY_DOMAIN[d].map(m => m.code);
      set("failureModeCodes", form.failureModeCodes.filter(c => !remove.includes(c as FailureModeCode)));
    }
  }

  function toggleMode(c: FailureModeCode) { set("failureModeCodes", form.failureModeCodes.includes(c) ? form.failureModeCodes.filter(x => x !== c) : [...form.failureModeCodes, c]); }
  function toggleSuccDomain(d: FailureDomain) { set("successDomains", form.successDomains.includes(d) ? form.successDomains.filter(x => x !== d) : [...form.successDomains, d]); }
  function toggleSuccFactor(c: SuccessFactorCode) { set("successFactorCodes", form.successFactorCodes.includes(c) ? form.successFactorCodes.filter(x => x !== c) : [...form.successFactorCodes, c]); }

  function handleFacility(sel: FacilitySelection | null) {
    setFacility(sel);
    set("facilityConfirmed", !!sel);
    if (sel) { set("country", sel.country ?? "KE"); set("admin_level_1", sel.county ?? ""); }
  }

  async function handleSubmit() {
    setSubmitError(null);
    const err = validateCareSignalV3(form);
    if (err) { setSubmitError(err); return; }
    if (!facility) { setSubmitError("Please select the facility where this event occurred."); return; }
    submitMutation.mutate(buildCareSignalV3SubmitPayload(form, facility, providerCadre));
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader><CardTitle className="text-base text-brand-teal">Care Signal submitted</CardTitle></CardHeader>
        <CardContent>
          <PostSubmissionFeedback
            submissionId={submissionId}
            reportTrack={form.reportTrack}
            failureDomains={form.failureDomains}
            recommendations={recommendations}
            onClose={() => { setForm(initialCareSignalV3State()); setFacility(null); setSubmitted(false); onSuccess?.(); }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-brand-orange" />
          <CardTitle className="text-base text-brand-teal">Care Signal</CardTitle>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Report a clinical event confidentially. Under 5 minutes.
          {resusSessionId && <span className="ml-1 text-teal-600 font-medium">Pre-populated from ResusGPS session.</span>}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Track */}
        <div>
          <label className={SLABEL}>What are you reporting?</label>
          <div className="grid grid-cols-2 gap-2">
            {(["FAILURE", "SUCCESS"] as const).map(track => (
              <button key={track} type="button" onClick={() => set("reportTrack", track)}
                className={cn("rounded-lg border p-3 text-sm font-medium transition-colors text-left",
                  form.reportTrack === track
                    ? track === "FAILURE" ? "border-red-400 bg-red-50 text-red-900" : "border-green-400 bg-green-50 text-green-900"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}>
                {track === "FAILURE" ? "🔴 Something went wrong" : "🟢 Something went right"}
                <p className="text-xs font-normal mt-0.5 opacity-70">{track === "FAILURE" ? "Failure, near-miss, or gap" : "Practice worth spreading"}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Facility */}
        <div>
          <label className={SLABEL}>Facility where this event occurred <span className="text-red-500">*</span></label>
          <FacilityPicker value={facility} onChange={handleFacility} required showProfileHint />
          <p className={HINT}>On locum? Select where you were working, not your home facility.</p>
        </div>

        {/* Role */}
        <div>
          <label className={SLABEL}>Your role during this event <span className="text-red-500">*</span></label>
          <Select value={form.roleAtTimeOfEvent} onValueChange={v => set("roleAtTimeOfEvent", v as RoleAtTimeOfEvent)}>
            <SelectTrigger><SelectValue placeholder="Select your role…" /></SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_AT_EVENT_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className={HINT}>Your role in this specific event, not your usual job title.</p>
        </div>

        {/* Classifiers */}
        <div className="grid grid-cols-1 gap-4">
          {([
            ["conditionCategory", "Primary condition", CONDITION_CATEGORY_LABELS, "Select condition category…"],
            ["childAgeBand", "Child's age", CHILD_AGE_BAND_LABELS, "Select age band…"],
            ["outcomeCategory", "Outcome", OUTCOME_CATEGORY_LABELS, "Select outcome…"],
          ] as const).map(([field, label, opts, placeholder]) => (
            <div key={field}>
              <label className={SLABEL}>{label} <span className="text-red-500">*</span></label>
              <Select value={form[field]} onValueChange={v => set(field, v as any)}>
                <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
                <SelectContent>{Object.entries(opts).map(([v, l]) => <SelectItem key={v} value={v}>{l as string}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ))}
          <div>
            <label className={SLABEL}>When did this event occur?</label>
            <Input type="datetime-local" value={form.eventDate} onChange={e => set("eventDate", e.target.value)} />
          </div>
        </div>

        {/* Failure track */}
        {form.reportTrack === "FAILURE" && (<>
          <div>
            <label className={SLABEL}>Where did things go wrong? <span className="text-red-500">*</span></label>
            <p className={HINT + " mb-2"}>Select all that apply.</p>
            <div className="space-y-2">
              {(Object.keys(FAILURE_DOMAIN_LABELS) as FailureDomain[]).map(domain => {
                const sel = form.failureDomains.includes(domain);
                return (
                  <div key={domain} className="space-y-1">
                    <button type="button" onClick={() => toggleDomain(domain)} className={cn("w-full text-left", sel ? OPT_SEL : OPT)}>
                      <Checkbox checked={sel} className="mt-0.5 shrink-0 pointer-events-none" />
                      <span className="text-sm font-medium">{FAILURE_DOMAIN_LABELS[domain]}</span>
                    </button>
                    {sel && FAILURE_MODES_BY_DOMAIN[domain].length > 0 && (
                      <div className="ml-6 space-y-1 pb-1">
                        <p className="text-xs text-slate-500">Can you be more specific? (optional)</p>
                        {FAILURE_MODES_BY_DOMAIN[domain].map(mode => {
                          const msel = form.failureModeCodes.includes(mode.code);
                          return (
                            <button key={mode.code} type="button" onClick={() => toggleMode(mode.code)}
                              className={cn("w-full text-left flex items-start gap-2 rounded border px-3 py-2 text-xs transition-colors",
                                msel ? "border-teal-300 bg-teal-50 text-teal-900" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>
                              <Checkbox checked={msel} className="mt-0.5 shrink-0 pointer-events-none" />
                              {mode.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <label className={SLABEL}>What happened? <span className="text-red-500">*</span></label>
            <Textarea value={form.rawNarrative} onChange={e => set("rawNarrative", e.target.value)}
              placeholder="Describe the clinical situation in your own words. Do not include patient names, MRN numbers, or other identifying information."
              rows={4} className="text-sm" />
            <p className={HINT}>{form.rawNarrative.trim().length} / 20 characters minimum.</p>
          </div>
        </>)}

        {/* Success track */}
        {form.reportTrack === "SUCCESS" && (<>
          <div>
            <label className={SLABEL}>What went right? <span className="text-red-500">*</span></label>
            <p className={HINT + " mb-2"}>Select the area where the success occurred.</p>
            <div className="space-y-2">
              {(Object.keys(FAILURE_DOMAIN_LABELS) as FailureDomain[]).map(domain => {
                const sel = form.successDomains.includes(domain);
                const factors = SUCCESS_FACTORS.filter(f => f.domain === domain);
                return (
                  <div key={domain} className="space-y-1">
                    <button type="button" onClick={() => toggleSuccDomain(domain)} className={cn("w-full text-left", sel ? OPT_SUC_SEL : OPT_SUC)}>
                      <Checkbox checked={sel} className="mt-0.5 shrink-0 pointer-events-none" />
                      <span className="text-sm font-medium">{FAILURE_DOMAIN_LABELS[domain]}</span>
                    </button>
                    {sel && factors.length > 0 && (
                      <div className="ml-6 space-y-1 pb-1">
                        <p className="text-xs text-slate-500">Does this match any known practice? (optional)</p>
                        {factors.map(f => {
                          const fsel = form.successFactorCodes.includes(f.code);
                          return (
                            <button key={f.code} type="button" onClick={() => toggleSuccFactor(f.code)}
                              className={cn("w-full text-left flex items-start gap-2 rounded border px-3 py-2 text-xs transition-colors",
                                fsel ? "border-green-300 bg-green-50 text-green-900" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>
                              <Checkbox checked={fsel} className="mt-0.5 shrink-0 pointer-events-none" />
                              {f.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <label className={SLABEL}>Describe what went well <span className="text-red-500">*</span></label>
            <Textarea value={form.successNarrative} onChange={e => set("successNarrative", e.target.value)}
              placeholder="What action or decision made a positive difference? Do not include patient names or identifiers."
              rows={4} className="text-sm" />
            <p className={HINT}>{form.successNarrative.trim().length} / 20 characters minimum.</p>
          </div>
        </>)}

        {/* Temporal intervals */}
        <div>
          <button type="button" onClick={() => setShowTemporal(p => !p)}
            className="flex items-center gap-2 text-xs font-medium text-teal-700 hover:text-teal-900 transition-colors">
            <Clock className="h-3.5 w-3.5" />
            {showTemporal ? <>Hide timing details <ChevronUp className="h-3.5 w-3.5" /></> : <>Add timing details (optional) <ChevronDown className="h-3.5 w-3.5" /></>}
          </button>
          {showTemporal && (
            <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Approximate times only — used for aggregate pattern analysis, never as precise clinical records.</p>
              {([
                ["timeToRecognitionMins", "How long before the emergency was recognised? (minutes)"],
                ["timeToFirstInterventionMins", "How long after recognition was the first treatment given? (minutes)"],
                ["timeToVascularAccessMins", "How long did it take to establish IV or IO access? (minutes)"],
                ["timeToEscalationMins", "How long before a senior was called or escalation activated? (minutes)"],
              ] as const).map(([field, label]) => (
                <div key={field}>
                  <label className="text-xs font-medium text-slate-600 block mb-1">{label}</label>
                  <Input type="number" min={0} value={form[field]} onChange={e => set(field, e.target.value)} placeholder="e.g. 30" className="text-sm" />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">When did this event happen?</label>
                <Select value={form.hoursSinceEvent} onValueChange={v => set("hoursSinceEvent", v as HoursSinceEvent)}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="How long ago?" /></SelectTrigger>
                  <SelectContent>{Object.entries(HOURS_SINCE_EVENT_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Anonymity + event link */}
        <div className="space-y-3">
          <div className={OPT}>
            <Checkbox id="anon" checked={form.isAnonymous} onCheckedChange={c => set("isAnonymous", !!c)} className="mt-0.5" />
            <Label htmlFor="anon" className="text-sm font-normal cursor-pointer">
              Submit anonymously
              <p className="text-xs text-slate-500 mt-0.5 font-normal">Anonymous submissions contribute to learning but do not count toward Fellowship Pillar C.</p>
            </Label>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Event code (optional — for team-linked reports)</label>
            <Input value={form.eventId} onChange={e => set("eventId", e.target.value)}
              placeholder="Paste code from team lead's report to link your observation" className="text-sm" maxLength={36} />
            <p className={HINT}>Leave blank if you are the only one reporting this event.</p>
          </div>
        </div>

        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{submitError}</AlertDescription>
          </Alert>
        )}

        <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="w-full bg-brand-teal text-white hover:bg-brand-teal/90">
          {submitMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</> : "Submit Care Signal"}
        </Button>
        <p className="text-xs text-center text-slate-400">
          Submitted confidentially. {form.isAnonymous ? "No identity stored." : "Linked to your Fellowship record."}
        </p>
      </CardContent>
    </Card>
  );
}
