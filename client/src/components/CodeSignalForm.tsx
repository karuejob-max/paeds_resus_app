/**
 * Code Signal — adult/whole-hospital resuscitation incident & near-miss
 * reporting form. Sibling of CareSignalFormV3.tsx, deliberately smaller
 * (no chain-of-survival timeline, no temporal intervals, no Fellowship
 * token flow — Code Signal has no Fellowship pillar to accrue credit
 * against). See docs/NORTH_STAR_V2_3_ADDENDUM_WHOLE_HOSPITAL_READINESS.md.
 *
 * The success-track domain labels are neutral from day one here
 * (DOMAIN_LABELS, not a failure-flavoured label) — carrying over the fix
 * made to Care Signal's own success track in the same PR.
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2, HeartPulse } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { FacilityPicker, type FacilitySelection } from "@/components/FacilityPicker";
import { getTrpcErrorMessage } from "@/lib/trpc-errors";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  initialCodeSignalState,
  PATIENT_CATEGORY_LABELS,
  CONDITION_CATEGORY_LABELS,
  OUTCOME_CATEGORY_LABELS,
  ROLE_AT_EVENT_LABELS,
  DOMAIN_LABELS,
  FAILURE_MODES_BY_DOMAIN,
  SUCCESS_FACTORS,
  countryNameToIso2,
  type Domain,
  type FailureModeCode,
  type SuccessFactorCode,
  type PatientCategory,
} from "@/lib/code-signal";

export default function CodeSignalForm() {
  const [form, setForm] = useState(initialCodeSignalState());
  const [facility, setFacility] = useState<FacilitySelection | null>(null);
  const [submitted, setSubmitted] = useState<{ eventId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitEvent = trpc.codeSignalEvents.submitEvent.useMutation();

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleDomain = (track: "failureDomains" | "successDomains", domain: Domain) => {
    setForm((f) => {
      const current = f[track];
      const next = current.includes(domain) ? current.filter((d) => d !== domain) : [...current, domain];
      return { ...f, [track]: next };
    });
  };

  const toggleFailureMode = (code: FailureModeCode) => {
    setForm((f) => ({
      ...f,
      failureModeCodes: f.failureModeCodes.includes(code)
        ? f.failureModeCodes.filter((c) => c !== code)
        : [...f.failureModeCodes, code],
    }));
  };

  const toggleSuccessFactor = (code: SuccessFactorCode) => {
    setForm((f) => ({
      ...f,
      successFactorCodes: f.successFactorCodes.includes(code)
        ? f.successFactorCodes.filter((c) => c !== code)
        : [...f.successFactorCodes, code],
    }));
  };

  const narrative = form.reportTrack === "FAILURE" ? form.rawNarrative : form.successNarrative;
  const isValid =
    facility &&
    form.patientCategory &&
    form.conditionCategory &&
    form.outcomeCategory &&
    form.roleAtTimeOfEvent &&
    form.facilityConfirmed &&
    narrative.trim().length >= 20 &&
    (form.reportTrack === "FAILURE" ? form.failureDomains.length > 0 : form.successDomains.length > 0);

  const handleSubmit = async () => {
    setError(null);
    if (!isValid || !facility) return;
    try {
      const result = await submitEvent.mutateAsync({
        facilityId: facility.facilityId,
        eventDate: new Date(form.eventDate).toISOString(),
        patientCategory: form.patientCategory as PatientCategory,
        conditionCategory: form.conditionCategory,
        outcomeCategory: form.outcomeCategory,
        roleAtTimeOfEvent: form.roleAtTimeOfEvent,
        country: facility.country ? countryNameToIso2(facility.country) : undefined,
        admin_level_1: facility.county ?? undefined,
        admin_level_2: facility.adminLevel2 ?? undefined,
        facility_ownership: facility.facilityOwnership ?? undefined,
        submissionMode: form.submissionMode,
        reportTrack: form.reportTrack,
        failureDomains: form.reportTrack === "FAILURE" ? form.failureDomains : undefined,
        failureModeCodes: form.reportTrack === "FAILURE" ? form.failureModeCodes : undefined,
        successDomains: form.reportTrack === "SUCCESS" ? form.successDomains : undefined,
        successFactorCodes: form.reportTrack === "SUCCESS" ? form.successFactorCodes : undefined,
        rawNarrative: narrative,
      });
      setSubmitted({ eventId: result.eventId });
    } catch (e) {
      setError(getTrpcErrorMessage(e));
    }
  };

  if (submitted) {
    return (
      <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
        <CardContent className="pt-6 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <p className="font-semibold text-foreground">Report submitted confidentially.</p>
          <p className="text-sm text-muted-foreground">Thank you — this strengthens whole-hospital readiness for the next code.</p>
          <Button variant="outline" onClick={() => { setSubmitted(null); setForm(initialCodeSignalState()); setFacility(null); }}>
            Log another event
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-brand-teal" /> Code Signal — Log an event
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Deliberately unversioned inline notice — NOT the same infrastructure
            as Care Signal's consent gate (LEGAL_DOCUMENT_VERSIONS.careSignalNotice),
            since that copy promises Fellowship credit, which does not apply
            here. A dedicated "Code Signal Notice" document is flagged as a
            follow-up, not built in this pass. */}
        <Alert>
          <AlertDescription>
            Code Signal is for quality improvement, not a patient medical record. Do not include patient names,
            national IDs, or other identifiers in your narrative. Reports support facility-level learning and
            aggregated, anonymised reporting.
          </AlertDescription>
        </Alert>

        <div>
          <label className="text-sm font-medium mb-2 block">Facility</label>
          <FacilityPicker value={facility} onChange={setFacility} required />
        </div>

        <div className="flex items-start gap-2 rounded-md border p-3">
          <Checkbox
            id="code-signal-facility-confirm"
            checked={form.facilityConfirmed}
            onCheckedChange={(v) => update("facilityConfirmed", v === true)}
          />
          <label htmlFor="code-signal-facility-confirm" className="text-sm leading-snug cursor-pointer">
            I confirm this facility is correct for this event.
          </label>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Who was the patient?</label>
          <RadioGroup value={form.patientCategory} onValueChange={(v) => update("patientCategory", v as typeof form.patientCategory)}>
            {Object.entries(PATIENT_CATEGORY_LABELS).map(([value, label]) => (
              <div key={value} className="flex items-center gap-2 py-1">
                <RadioGroupItem value={value} id={`pc-${value}`} />
                <label htmlFor={`pc-${value}`} className="text-sm cursor-pointer">{label}</label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Presenting condition</label>
            <Select value={form.conditionCategory} onValueChange={(v) => update("conditionCategory", v as typeof form.conditionCategory)}>
              <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
              <SelectContent>
                {Object.entries(CONDITION_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Outcome</label>
            <Select value={form.outcomeCategory} onValueChange={(v) => update("outcomeCategory", v as typeof form.outcomeCategory)}>
              <SelectTrigger><SelectValue placeholder="Select outcome" /></SelectTrigger>
              <SelectContent>
                {Object.entries(OUTCOME_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Your role at the time</label>
          <Select value={form.roleAtTimeOfEvent} onValueChange={(v) => update("roleAtTimeOfEvent", v as typeof form.roleAtTimeOfEvent)}>
            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_AT_EVENT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="border-t pt-4">
          <label className="text-sm font-medium mb-2 block">What are you reporting?</label>
          <RadioGroup value={form.reportTrack} onValueChange={(v) => update("reportTrack", v as typeof form.reportTrack)} className="flex gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="FAILURE" id="track-failure" />
              <label htmlFor="track-failure" className="text-sm cursor-pointer">Something went wrong</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="SUCCESS" id="track-success" />
              <label htmlFor="track-success" className="text-sm cursor-pointer">What went right</label>
            </div>
          </RadioGroup>
        </div>

        {form.reportTrack === "FAILURE" ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Where did things go wrong? Select all that apply.</label>
              <div className="grid sm:grid-cols-2 gap-2">
                {(Object.keys(DOMAIN_LABELS) as Domain[]).map((domain) => (
                  <div key={domain} className="flex items-center gap-2">
                    <Checkbox
                      id={`fd-${domain}`}
                      checked={form.failureDomains.includes(domain)}
                      onCheckedChange={() => toggleDomain("failureDomains", domain)}
                    />
                    <label htmlFor={`fd-${domain}`} className="text-sm cursor-pointer">{DOMAIN_LABELS[domain]}</label>
                  </div>
                ))}
              </div>
            </div>
            {form.failureDomains.length > 0 && (
              <div className="space-y-3">
                {form.failureDomains.map((domain) => (
                  <div key={domain} className="pl-3 border-l-2 border-slate-200">
                    <p className="text-xs font-medium text-muted-foreground mb-1">{DOMAIN_LABELS[domain]} — specific failure mode(s)</p>
                    {FAILURE_MODES_BY_DOMAIN[domain].map((mode) => (
                      <div key={mode.code} className="flex items-center gap-2 py-0.5">
                        <Checkbox
                          id={`fm-${mode.code}`}
                          checked={form.failureModeCodes.includes(mode.code)}
                          onCheckedChange={() => toggleFailureMode(mode.code)}
                        />
                        <label htmlFor={`fm-${mode.code}`} className="text-sm cursor-pointer">{mode.label}</label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">What happened? (no patient identifiers)</label>
              <Textarea
                value={form.rawNarrative}
                onChange={(e) => update("rawNarrative", e.target.value)}
                rows={5}
                placeholder="Describe the sequence of events, delays, and system factors..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">What went right?</label>
              <p className="text-xs text-muted-foreground mb-2">Select the area where the success occurred.</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {(Object.keys(DOMAIN_LABELS) as Domain[]).map((domain) => (
                  <div key={domain} className="flex items-center gap-2">
                    <Checkbox
                      id={`sd-${domain}`}
                      checked={form.successDomains.includes(domain)}
                      onCheckedChange={() => toggleDomain("successDomains", domain)}
                    />
                    <label htmlFor={`sd-${domain}`} className="text-sm cursor-pointer">{DOMAIN_LABELS[domain]}</label>
                  </div>
                ))}
              </div>
            </div>
            {form.successDomains.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Specific success factor(s)</p>
                {SUCCESS_FACTORS.filter((f) => form.successDomains.includes(f.domain)).map((factor) => (
                  <div key={factor.code} className="flex items-center gap-2 py-0.5">
                    <Checkbox
                      id={`sf-${factor.code}`}
                      checked={form.successFactorCodes.includes(factor.code)}
                      onCheckedChange={() => toggleSuccessFactor(factor.code)}
                    />
                    <label htmlFor={`sf-${factor.code}`} className="text-sm cursor-pointer">{factor.label}</label>
                  </div>
                ))}
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">What happened? (no patient identifiers)</label>
              <Textarea
                value={form.successNarrative}
                onChange={(e) => update("successNarrative", e.target.value)}
                rows={5}
                placeholder="Describe what went right and why..."
              />
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-md border p-3">
          <Checkbox
            id="code-signal-anon"
            checked={form.submissionMode === "anonymous"}
            onCheckedChange={(v) => update("submissionMode", v === true ? "anonymous" : "named")}
          />
          <label htmlFor="code-signal-anon" className="text-sm leading-snug cursor-pointer">
            Submit anonymously (your account will not be linked to this report)
          </label>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button onClick={handleSubmit} disabled={!isValid || submitEvent.isPending} className="w-full">
          {submitEvent.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Submit report
        </Button>
      </CardContent>
    </Card>
  );
}
